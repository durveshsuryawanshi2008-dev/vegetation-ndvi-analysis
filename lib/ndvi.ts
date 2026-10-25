import { ee, initializeEarthEngine, evaluateEE } from './earthengine';
import { saveAnalysisToDatabase, getCachedAnalysis, getDbPool } from './database';
import { normalizeSearchText, getCountryName } from './countries';
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
 * Applied per-image on selected bands (B8, B4, SCL) to minimize memory footprint.
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

export type AnalysisScopeType = 'ADMINISTRATIVE_DISTRICT' | 'CITY_BUFFER_10KM' | 'CUSTOM';

export interface BoundaryResult {
  feature?: any;
  geometry: any;
  areaName: string;
  state: string;
  country: string;
  countryCode?: string;
  areaKm2: number;
  datasetUsed: string;
  analysisScope: AnalysisScopeType;
  scopeDescription: string;
}

export interface AreaAnalysisOptions {
  geonameId?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  district?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  analysisScope?: AnalysisScopeType;
}

/**
 * Resolves geographic analysis area for any city or place worldwide.
 * Multi-tier resolution strategy:
 * 1. Coordinates point-in-polygon on authoritative FAO GAUL Level 2 boundaries.
 * 2. Coordinates point-in-polygon on FAO GAUL Level 1 regional boundaries.
 * 3. Local GeoNames database lookup for unsupplied coordinates.
 * 4. Documented 10km radial buffer fallback for islands, coasts, or unindexed boundaries.
 * 5. Transparent analysis scope labeling (never mislabels a district as the entire city).
 */
export async function resolveAdministrativeBoundary(
  targetArea: string,
  options?: AreaAnalysisOptions
): Promise<BoundaryResult | null> {
  await initializeEarthEngine();
  const trimmed = targetArea.trim();
  let resolvedLat = options?.coordinates?.latitude;
  let resolvedLon = options?.coordinates?.longitude;
  let country = options?.country || '';
  let countryCode = options?.countryCode || '';
  let state = options?.state || '';
  let geonameId = options?.geonameId;

  // 1. If coordinates are missing, resolve them from the local GeoNames database
  if (
    typeof resolvedLat !== 'number' ||
    typeof resolvedLon !== 'number' ||
    Number.isNaN(resolvedLat) ||
    Number.isNaN(resolvedLon)
  ) {
    try {
      const db = getDbPool();
      if (db) {
        if (geonameId) {
          const [geoRows]: any = await db.query(
            'SELECT latitude, longitude, country_code, admin1_code FROM geonames_cities WHERE geoname_id = ? LIMIT 1',
            [geonameId]
          );
          if (geoRows && geoRows.length > 0) {
            resolvedLat = Number(geoRows[0].latitude);
            resolvedLon = Number(geoRows[0].longitude);
            countryCode = countryCode || geoRows[0].country_code;
            country = country || getCountryName(countryCode);
            state = state || geoRows[0].admin1_code;
          }
        }

        if (typeof resolvedLat !== 'number') {
          const normQuery = normalizeSearchText(trimmed);
          const [nameRows]: any = await db.query(
            `SELECT geoname_id, latitude, longitude, country_code, admin1_code 
             FROM geonames_cities 
             WHERE normalized_name = ? OR ascii_name = ?
             ORDER BY population DESC LIMIT 1`,
            [normQuery, normQuery]
          );
          if (nameRows && nameRows.length > 0) {
            resolvedLat = Number(nameRows[0].latitude);
            resolvedLon = Number(nameRows[0].longitude);
            geonameId = geonameId || Number(nameRows[0].geoname_id);
            countryCode = countryCode || nameRows[0].country_code;
            country = country || getCountryName(countryCode);
            state = state || nameRows[0].admin1_code;
          }
        }
      }
    } catch (lookupErr) {
      console.warn('GeoNames lookup warning:', lookupErr);
    }
  }

  // Fallback to local Indian Cities dictionary if still missing coordinates
  if (typeof resolvedLat !== 'number' || typeof resolvedLon !== 'number') {
    const localMatch = (indianCities as any[]).find(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() ||
        c.district.toLowerCase() === trimmed.toLowerCase()
    );
    if (localMatch && localMatch.latitude && localMatch.longitude) {
      resolvedLat = Number(localMatch.latitude);
      resolvedLon = Number(localMatch.longitude);
      country = 'India';
      countryCode = 'IN';
      state = state || localMatch.state;
    }
  }

  // 2. Perform Point-In-Polygon Boundary Resolution using verified coordinates
  if (
    typeof resolvedLat === 'number' &&
    typeof resolvedLon === 'number' &&
    !Number.isNaN(resolvedLat) &&
    !Number.isNaN(resolvedLon)
  ) {
    const point = ee.Geometry.Point([resolvedLon, resolvedLat]);

    // If explicit buffer scope was requested, construct 10km buffer directly
    if (options?.analysisScope === 'CITY_BUFFER_10KM') {
      const bufferGeom = point.buffer(10000);
      return {
        geometry: bufferGeom,
        areaName: trimmed,
        state: state || 'Local Region',
        country: country || 'Global',
        countryCode,
        areaKm2: 314.16,
        datasetUsed: 'Point-Coordinates 10km Radial Buffer',
        analysisScope: 'CITY_BUFFER_10KM',
        scopeDescription: `10 km radius circle (314.16 km²) centered at coordinates (${resolvedLat.toFixed(4)}°, ${resolvedLon.toFixed(4)}°)`,
      };
    }

    // Candidate datasets for authoritative administrative units
    const candidateDatasets = [
      { id: 'FAO/GAUL/2015/level2', nameField: 'ADM2_NAME', scope: 'ADMINISTRATIVE_DISTRICT' as AnalysisScopeType },
      { id: 'FAO/GAUL/2015/level1', nameField: 'ADM1_NAME', scope: 'ADMINISTRATIVE_DISTRICT' as AnalysisScopeType },
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

          const officialDistrict = props[ds.nameField] || trimmed;
          const resolvedState =
            props.ADM1_NAME ||
            props.GAUL1_NAME ||
            state ||
            'Administrative Region';
          const resolvedCountry =
            props.ADM0_NAME ||
            props.GAUL0_NAME ||
            country ||
            'Global';
          const areaKm2 =
            Math.round(
              (calculatedKm2 || props.Shape_Area || 100) * 100
            ) / 100;

          // Validate geometry has positive non-zero area
          if (areaKm2 > 0) {
            return {
              feature,
              geometry,
              areaName: trimmed || officialDistrict,
              state: resolvedState,
              country: resolvedCountry,
              countryCode,
              areaKm2,
              datasetUsed: ds.id,
              analysisScope: 'ADMINISTRATIVE_DISTRICT',
              scopeDescription: `Authoritative administrative district (${officialDistrict}) containing ${trimmed} from ${ds.id}`,
            };
          }
        }
      } catch (err) {
        console.warn(`Error resolving boundary by point for ${ds.id}:`, err);
      }
    }

    // 3. Documented Radial Buffer Fallback (10 km radius ~ 314.16 km²)
    // Applied when city has no matching administrative boundary polygon (e.g. island, coast)
    try {
      const bufferGeom = point.buffer(10000);
      return {
        geometry: bufferGeom,
        areaName: trimmed,
        state: state || 'Local Region',
        country: country || 'Global',
        countryCode,
        areaKm2: 314.16,
        datasetUsed: 'Point-Coordinates 10km Radial Buffer',
        analysisScope: 'CITY_BUFFER_10KM',
        scopeDescription: `10 km radius circle (314.16 km²) centered at city coordinates (${resolvedLat.toFixed(4)}°, ${resolvedLon.toFixed(4)}°)`,
      };
    } catch (bufferErr) {
      console.warn('Radial buffer creation error:', bufferErr);
    }
  }

  // 4. Name-based Text Search fallback on FAO GAUL
  const candidateDatasets = [
    { id: 'FAO/GAUL/2015/level2', primaryField: 'ADM2_NAME' },
    { id: 'FAO/GAUL/2015/level1', primaryField: 'ADM1_NAME' },
    { id: 'FAO/GAUL/2025/level2', primaryField: 'GAUL2_NAME' },
  ];

  const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  for (const ds of candidateDatasets) {
    try {
      const collection = ee.FeatureCollection(ds.id);
      const filter = ee.Filter.or(
        ee.Filter.eq(ds.primaryField, trimmed),
        ee.Filter.eq(ds.primaryField, titleCase),
        ee.Filter.stringStartsWith(ds.primaryField, titleCase)
      );

      const matches = collection.filter(filter);
      const count = await evaluateEE<number>(matches.size());

      if (count > 0) {
        const feature = matches.first();
        const geometry = feature.geometry();

        const [props, calculatedKm2] = await Promise.all([
          evaluateEE<Record<string, any>>(feature.toDictionary()),
          evaluateEE<number>(geometry.area().divide(1e6)),
        ]);

        const areaName = trimmed || props[ds.primaryField];
        const resolvedState = props.ADM1_NAME || state || 'District Level';
        const resolvedCountry = props.ADM0_NAME || country || 'Global';
        const areaKm2 = Math.round((calculatedKm2 || 0) * 100) / 100;

        if (areaKm2 > 0) {
          return {
            feature,
            geometry,
            areaName,
            state: resolvedState,
            country: resolvedCountry,
            countryCode,
            areaKm2,
            datasetUsed: ds.id,
            analysisScope: 'ADMINISTRATIVE_DISTRICT',
            scopeDescription: `Text-matched administrative boundary (${props[ds.primaryField]}) from ${ds.id}`,
          };
        }
      }
    } catch {
      continue;
    }
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
 * 1. Checks relational SQL cache (TiDB / MySQL) with location identity
 * 2. Authenticates with Google Earth Engine
 * 3. Resolves vector boundary geometry (FAO GAUL Level 2 / Level 1 / 10km Buffer)
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

  // 1. Check TiDB cache BEFORE calling Google Earth Engine
  try {
    const cached = await getCachedAnalysis(
      requestedArea,
      {
        geonameId: options?.geonameId,
        country: options?.country,
        state: options?.state,
        coordinates: options?.coordinates,
        analysisScope: options?.analysisScope,
      },
      satelliteSource
    );

    if (cached) {
      console.log(`[NDVI] Cache hit for "${requestedArea}"`);

      return {
        area: cached.request.area_name || requestedArea,
        country: cached.request.country || options?.country || 'Global',
        state: cached.request.state || options?.state || '',
        areaKm2: Number(cached.request.area_km2) || 0,
        years: cached.years,
        metadata: {
          satelliteSource,
          boundarySource: cached.request.boundary_source || 'FAO/GAUL/2025/level2',
          analysisScope: cached.request.analysis_scope || 'ADMINISTRATIVE_DISTRICT',
          scopeDescription: `Loaded from cache for ${cached.request.area_name} (${cached.request.country})`,
          calculatedAt: cached.request.completed_at
            ? new Date(cached.request.completed_at).toISOString()
            : new Date().toISOString(),
          persistedToDb: true,
          requestId: cached.request.id,
          dbMessage: 'Returned from database cache; satellite recalculation was skipped.',
        },
      };
    }

    console.log(`[NDVI] Cache miss for "${requestedArea}"`);
  } catch (cacheError) {
    console.warn('[NDVI] Cache lookup warning; continuing with Earth Engine:', cacheError);
  }

  // 2. Authenticate with Google Earth Engine
  await initializeEarthEngine();

  // 3. Find matching boundary or geometry
  const boundary = await resolveAdministrativeBoundary(requestedArea, options);

  if (!boundary) {
    throw new Error('Area not found. Try a district or city name such as Pune, London, or Tokyo.');
  }

  // 4. Calculate all 5 complete calendar years using optimized unified evaluation
  const yearlyResults = await compute5YearNdvi(
    boundary.geometry,
    boundary.areaKm2
  );

  // 5. Build response object with transparent analysis scope metadata
  const responseData: NdviAnalysisResponse = {
    area: boundary.areaName || requestedArea,
    country: boundary.country || options?.country || 'Global',
    state: boundary.state || options?.state || '',
    areaKm2: boundary.areaKm2,
    years: yearlyResults,
    metadata: {
      satelliteSource,
      boundarySource: boundary.datasetUsed,
      analysisScope: boundary.analysisScope,
      scopeDescription: boundary.scopeDescription,
      geonameId: options?.geonameId,
      calculatedAt: new Date().toISOString(),
    },
  };

  // 6. Save newly calculated result to TiDB with full location identity
  try {
    const dbResult = await saveAnalysisToDatabase({
      areaName: boundary.areaName || requestedArea,
      geonameId: options?.geonameId,
      state: boundary.state || options?.state || '',
      country: boundary.country || options?.country || 'Global',
      countryCode: boundary.countryCode || options?.countryCode,
      areaKm2: boundary.areaKm2,
      latitude: options?.coordinates?.latitude,
      longitude: options?.coordinates?.longitude,
      analysisScope: boundary.analysisScope,
      boundarySource: boundary.datasetUsed,
      satelliteSource,
      years: yearlyResults,
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
