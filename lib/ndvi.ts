import { ee, initializeEarthEngine, evaluateEE } from './earthengine';
import { saveAnalysisToDatabase, getCachedAnalysis } from './database';
import indianCities from './data/indian-cities.json';
import {
  NdviAnalysisResponse,
  YearlyNdviResult,
  VegetationStatus,
} from './types';

/**
 * Returns vegetation status according to project requirements:
 * NDVI < 0.2 = Very Low
 * 0.2 - 0.5 = Low/Moderate
 * 0.5 - 0.8 = Healthy
 * > 0.8 = Very Healthy
 */
export function determineVegetationStatus(ndvi: number | null): VegetationStatus {
  if (ndvi === null || Number.isNaN(ndvi)) {
    return 'Unknown';
  }
  if (ndvi < 0.2) {
    return 'Very Low';
  } else if (ndvi <= 0.5) {
    return 'Low/Moderate';
  } else if (ndvi <= 0.8) {
    return 'Healthy';
  } else {
    return 'Very Healthy';
  }
}

/**
 * Cloud, shadow, and invalid pixel masking for Sentinel-2 Surface Reflectance (Harmonized).
 * Applied per-image on selected bands to minimize memory footprint.
 */
function maskAndComputeNdvi(image: any) {
  // SCL Band classes to exclude:
  // 3 = Cloud shadows, 8 = Cloud medium probability, 9 = Cloud high probability, 10 = Thin cirrus, 11 = Snow
  const scl = image.select('SCL');
  const mask = scl
    .neq(3)
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  const ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi');
  return ndvi.updateMask(mask);
}

export interface BoundaryResult {
  feature?: any;
  geometry: any;
  areaName: string;
  state: string;
  country: string;
  areaKm2: number;
  datasetUsed: string;
}

export interface AreaAnalysisOptions {
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  district?: string;
  state?: string;
  country?: string;
}

/**
 * Resolves administrative boundary or geometry for any city or district in India and worldwide.
 * Supports:
 * 1. Geographic point intersection (filterBounds) across FAO GAUL datasets.
 * 2. Mapped Indian city dictionary lookup.
 * 3. Exact and prefix text matching on FAO GAUL Level 2 and Level 1.
 * 4. Nominatim server-side geocoding fallback for unlisted global cities.
 * 5. Radial buffer geometry fallback for coastal or unlisted geographic points.
 */
export async function resolveAdministrativeBoundary(
  targetArea: string,
  options?: AreaAnalysisOptions
): Promise<BoundaryResult | null> {
  const trimmed = targetArea.trim();
  const titleCase =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

  // 1. PATH A: Coordinates provided via autocomplete or client request
  if (
    options?.coordinates &&
    typeof options.coordinates.latitude === 'number' &&
    typeof options.coordinates.longitude === 'number' &&
    !Number.isNaN(options.coordinates.latitude) &&
    !Number.isNaN(options.coordinates.longitude)
  ) {
    const lat = options.coordinates.latitude;
    const lon = options.coordinates.longitude;
    const point = ee.Geometry.Point([lon, lat]);

    // Check FAO/GAUL/2015/level2 first, then level1
    const candidateDatasets = [
      { id: 'FAO/GAUL/2015/level2', nameField: 'ADM2_NAME' },
      { id: 'FAO/GAUL/2015/level1', nameField: 'ADM1_NAME' },
    ];

    for (const ds of candidateDatasets) {
      try {
        const matches = ee.FeatureCollection(ds.id).filterBounds(point);
        const count = await evaluateEE<number>(matches.size());

        if (count > 0) {
          const feature = matches.first();
          const geometry = feature.geometry();

          const [props, calculatedKm2] = await Promise.all([
            evaluateEE<Record<string, any>>(feature.toDictionary()),
            evaluateEE<number>(geometry.area().divide(1e6)),
          ]);

          const officialName = props[ds.nameField] || trimmed;
          const state =
            props.ADM1_NAME ||
            props.GAUL1_NAME ||
            options.state ||
            'Administrative Region';
          const country =
            props.ADM0_NAME ||
            props.GAUL0_NAME ||
            options.country ||
            'Global';
          const areaKm2 =
            Math.round(
              (calculatedKm2 || props.Shape_Area || 100) * 100
            ) / 100;

          return {
            feature,
            geometry,
            areaName: trimmed || officialName,
            state,
            country,
            areaKm2,
            datasetUsed: ds.id,
          };
        }
      } catch (err) {
        console.warn(`Error resolving boundary by point for ${ds.id}:`, err);
      }
    }

    // Circular buffer fallback (10km radius ~314 km²) around city coordinates
    try {
      const bufferGeom = point.buffer(10000);
      return {
        geometry: bufferGeom,
        areaName: trimmed,
        state: options.state || 'Local Area',
        country: options.country || 'Global',
        areaKm2: 314.16,
        datasetUsed: 'Point Buffer (10km Radius)',
      };
    } catch {
      // Continue to text search if buffer fails
    }
  }

  // 2. PATH B: Local Indian Cities dictionary mapping
  const localMatch = (indianCities as any[]).find(
    (c) =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.district.toLowerCase() === trimmed.toLowerCase()
  );

  if (localMatch && localMatch.latitude && localMatch.longitude) {
    // Recursively resolve using exact coordinates
    return resolveAdministrativeBoundary(trimmed, {
      ...options,
      coordinates: {
        latitude: localMatch.latitude,
        longitude: localMatch.longitude,
      },
      district: localMatch.district,
      state: localMatch.state,
      country: 'India',
    });
  }

  // 3. PATH C: Direct text search in FAO GAUL datasets
  const candidateDatasets = [
    { id: 'FAO/GAUL/2015/level2', primaryField: 'ADM2_NAME' },
    { id: 'FAO/GAUL/2015/level1', primaryField: 'ADM1_NAME' },
    { id: 'FAO/GAUL/2025/level2', primaryField: 'GAUL2_NAME' },
  ];

  const searchNames = [trimmed, titleCase];
  if (localMatch && localMatch.district && !searchNames.includes(localMatch.district)) {
    searchNames.push(localMatch.district);
  }
  if (options?.district && !searchNames.includes(options.district)) {
    searchNames.push(options.district);
  }

  for (const ds of candidateDatasets) {
    try {
      const collection = ee.FeatureCollection(ds.id);

      const filterConditions = searchNames.flatMap((name) => [
        ee.Filter.eq(ds.primaryField, name),
        ee.Filter.stringStartsWith(ds.primaryField, name),
      ]);

      const filter = ee.Filter.or(...filterConditions);
      const matches = collection.filter(filter);
      const count = await evaluateEE<number>(matches.size());

      if (count > 0) {
        const feature = matches.first();
        const geometry = feature.geometry();

        const [props, calculatedKm2] = await Promise.all([
          evaluateEE<Record<string, any>>(feature.toDictionary()),
          evaluateEE<number>(geometry.area().divide(1e6)),
        ]);

        const areaName = trimmed || props[ds.primaryField] || titleCase;
        const state =
          props.ADM1_NAME ||
          props.GAUL1_NAME ||
          options?.state ||
          'Administrative Level';
        const country =
          props.ADM0_NAME ||
          props.GAUL0_NAME ||
          options?.country ||
          'Unknown Country';
        const areaKm2 =
          Math.round((calculatedKm2 || props.Shape_Area || 0) * 100) / 100;

        return {
          feature,
          geometry,
          areaName,
          state,
          country,
          areaKm2,
          datasetUsed: ds.id,
        };
      }
    } catch {
      continue;
    }
  }

  // 4. PATH D: Server-side Geocoding fallback via Nominatim
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=jsonv2&limit=1`;

    const geoRes = await fetch(geoUrl, {
      headers: {
        'User-Agent': 'VegetationNDVIAnalyzer/2.0 (student capstone project)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0 && geoData[0].lat && geoData[0].lon) {
        const lat = Number(geoData[0].lat);
        const lon = Number(geoData[0].lon);

        return resolveAdministrativeBoundary(trimmed, {
          ...options,
          coordinates: { latitude: lat, longitude: lon },
          state: geoData[0].address?.state || options?.state,
          country: geoData[0].address?.country || options?.country,
        });
      }
    }
  } catch (geoErr) {
    console.warn('Geocoding fallback warning:', geoErr);
  }

  return null;
}

/**
 * Builds Earth Engine computation graph for a specific year's NDVI statistics.
 * Uses optimized band pre-selection and per-image masking to prevent memory limits.
 */
function buildYearComputation(
  geometry: any,
  year: number,
  scale: number,
  cloudThreshold = 50
) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Select only B8 (NIR), B4 (Red), and SCL (Scene Classification) to drastically reduce memory usage
  const s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(geometry)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudThreshold))
    .select(['B8', 'B4', 'SCL'])
    .map(maskAndComputeNdvi);

  const medianComposite = s2Collection.median();

  const combinedReducer = ee.Reducer.mean()
    .combine({
      reducer2: ee.Reducer.min(),
      sharedInputs: true,
    })
    .combine({
      reducer2: ee.Reducer.max(),
      sharedInputs: true,
    });

  return medianComposite.reduceRegion({
    reducer: combinedReducer,
    geometry: geometry,
    scale: scale,
    maxPixels: 1e9,
    bestEffort: true,
  });
}

/**
 * Computes 5 complete calendar years (2021-2025) of Sentinel-2 NDVI.
 * Evaluates all years in a unified Earth Engine dictionary request to eliminate latency and avoid memory limits.
 */
async function compute5YearNdvi(
  geometry: any,
  areaKm2: number
): Promise<YearlyNdviResult[]> {
  const calendarYears = [2021, 2022, 2023, 2024, 2025];

  // Adaptive scale ensures rapid server-side processing while preserving multispectral accuracy:
  // Large districts (> 6000 km²): 500m scale (~30k-60k sample pixels)
  // Medium districts (2000 - 6000 km²): 300m scale (~20k-40k sample pixels)
  // Cities & towns (< 2000 km²): 150m scale (~10k-30k sample pixels)
  const scale = areaKm2 > 6000 ? 500 : areaKm2 > 2000 ? 300 : 150;

  try {
    // Construct unified dictionary so Earth Engine computes all 5 years in a single distributed graph
    const dictionaryEntries: Record<string, any> = {};
    for (const year of calendarYears) {
      dictionaryEntries[year.toString()] = buildYearComputation(geometry, year, scale);
    }

    const combinedDict = ee.Dictionary(dictionaryEntries);
    const results = await evaluateEE<Record<string, Record<string, number | null>>>(combinedDict);

    return calendarYears.map((year) => {
      const stats = results?.[year.toString()] || {};
      const rawAvg = stats?.ndvi_mean ?? stats?.ndvi ?? null;
      const rawMin = stats?.ndvi_min ?? null;
      const rawMax = stats?.ndvi_max ?? null;

      const avgNdvi =
        typeof rawAvg === 'number' && !Number.isNaN(rawAvg)
          ? Math.max(-1, Math.min(1, Math.round(rawAvg * 10000) / 10000))
          : null;

      const minNdvi =
        typeof rawMin === 'number' && !Number.isNaN(rawMin)
          ? Math.max(-1, Math.min(1, Math.round(rawMin * 10000) / 10000))
          : null;

      const maxNdvi =
        typeof rawMax === 'number' && !Number.isNaN(rawMax)
          ? Math.max(-1, Math.min(1, Math.round(rawMax * 10000) / 10000))
          : null;

      return {
        year,
        avgNdvi,
        minNdvi,
        maxNdvi,
        vegetationStatus: determineVegetationStatus(avgNdvi),
      };
    });
  } catch (batchError) {
    console.warn('Batch 5-year evaluation warning, attempting resilient sequential evaluation:', batchError);

    // Fallback: evaluate year by year if batch encounters any edge-case issue
    const yearlyResults: YearlyNdviResult[] = [];
    for (const year of calendarYears) {
      try {
        const computation = buildYearComputation(geometry, year, scale);
        const stats = await evaluateEE<Record<string, number | null>>(computation);

        const rawAvg = stats?.ndvi_mean ?? stats?.ndvi ?? null;
        const rawMin = stats?.ndvi_min ?? null;
        const rawMax = stats?.ndvi_max ?? null;

        const avgNdvi =
          typeof rawAvg === 'number' && !Number.isNaN(rawAvg)
            ? Math.max(-1, Math.min(1, Math.round(rawAvg * 10000) / 10000))
            : null;

        const minNdvi =
          typeof rawMin === 'number' && !Number.isNaN(rawMin)
            ? Math.max(-1, Math.min(1, Math.round(rawMin * 10000) / 10000))
            : null;

        const maxNdvi =
          typeof rawMax === 'number' && !Number.isNaN(rawMax)
            ? Math.max(-1, Math.min(1, Math.round(rawMax * 10000) / 10000))
            : null;

        yearlyResults.push({
          year,
          avgNdvi,
          minNdvi,
          maxNdvi,
          vegetationStatus: determineVegetationStatus(avgNdvi),
        });
      } catch (singleErr) {
        console.warn(`Year ${year} evaluation error:`, singleErr);
        yearlyResults.push({
          year,
          avgNdvi: null,
          minNdvi: null,
          maxNdvi: null,
          vegetationStatus: 'Unknown',
        });
      }
    }

    return yearlyResults;
  }
}

/**
 * Main analysis pipeline for requested area.
 * Executes:
 * 1. Checks relational SQL cache (TiDB / MySQL) for instant return
 * 2. Authenticates with Google Earth Engine
 * 3. Resolves vector boundary geometry (FAO GAUL Level 2 / Level 1 / Point buffer)
 * 4. Computes 5-year multi-temporal Sentinel-2 NDVI trajectory (2021-2025)
 * 5. Persists result into database tables: areas, analysis_requests, ndvi_results, reports
 */
export async function analyzeAreaNdvi(
  targetArea: string,
  options?: AreaAnalysisOptions
): Promise<NdviAnalysisResponse> {
  if (!targetArea || typeof targetArea !== 'string' || targetArea.trim().length === 0) {
    throw new Error('Please enter a valid district or city name.');
  }

  const requestedArea = targetArea.trim();
  const satelliteSource = 'COPERNICUS/S2_SR_HARMONIZED';
  const boundarySource = 'FAO/GAUL/2025/level2';

  // 1. Check TiDB cache BEFORE calling Google Earth Engine.
  try {
    const cached = await getCachedAnalysis(
      requestedArea,
      satelliteSource,
      boundarySource
    );

    if (cached) {
      console.log(`[NDVI] Cache hit for "${requestedArea}"`);

      return {
        area: cached.request.area_name || requestedArea,
        country: cached.request.country || options?.country || 'India',
        state: cached.request.state || options?.state || '',
        areaKm2: Number(cached.request.area_km2) || 0,
        years: cached.years,
        metadata: {
          satelliteSource,
          boundarySource,
          calculatedAt: cached.request.completed_at
            ? new Date(cached.request.completed_at).toISOString()
            : new Date().toISOString(),
          persistedToDb: true,
          requestId: cached.request.id,
          dbMessage: 'Returned from TiDB cache; Earth Engine calculation was skipped.',
        },
      };
    }

    console.log(`[NDVI] Cache miss for "${requestedArea}"`);
  } catch (cacheError) {
    console.warn('[NDVI] Cache lookup warning; continuing with Earth Engine:', cacheError);
  }

  // 2. Authenticate with Google Earth Engine
  await initializeEarthEngine();

  // 3. Find matching administrative boundary and geometry
  const boundary = await resolveAdministrativeBoundary(requestedArea, options);

  if (!boundary) {
    throw new Error('Area not found. Try a district name such as Pune.');
  }

  // 4. Calculate all 5 complete calendar years using optimized unified evaluation
  const yearlyResults = await compute5YearNdvi(
    boundary.geometry,
    boundary.areaKm2
  );

  // 5. Build response object
  const responseData: NdviAnalysisResponse = {
    area: boundary.areaName || requestedArea,
    country: boundary.country || options?.country || 'India',
    state: boundary.state || options?.state || '',
    areaKm2: boundary.areaKm2,
    years: yearlyResults,
    metadata: {
      satelliteSource,
      boundarySource: boundary.datasetUsed,
      calculatedAt: new Date().toISOString(),
    },
  };

  // 6. Save newly calculated result to TiDB
  try {
    const dbResult = await saveAnalysisToDatabase({
      areaName: boundary.areaName || requestedArea,
      state: boundary.state || options?.state || '',
      country: boundary.country || options?.country || 'India',
      areaKm2: boundary.areaKm2,
      years: yearlyResults,
      boundarySource: boundary.datasetUsed,
      satelliteSource,
    });

    if (responseData.metadata) {
      responseData.metadata.persistedToDb = dbResult.success;
      responseData.metadata.requestId = dbResult.requestId;

      if (!dbResult.success) {
        responseData.metadata.dbMessage = dbResult.error;
      }
    }
  } catch (dbErr) {
    console.warn('Database save warning (analysis still returned to user):', dbErr);
    if (responseData.metadata) {
      responseData.metadata.persistedToDb = false;
      responseData.metadata.dbMessage = (dbErr as Error).message;
    }
  }

  return responseData;
}
