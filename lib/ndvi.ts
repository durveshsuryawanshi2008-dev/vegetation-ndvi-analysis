import { ee, initializeEarthEngine, evaluateEE } from './earthengine';
import { saveAnalysisToDatabase, getCachedAnalysis } from './database';
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
 * Cloud and cirrus masking for Sentinel-2 Surface Reflectance (Harmonized)
 * Utilizes SCL (Scene Classification Layer) and QA60 bitmask.
 */
function applyCloudAndShadowMask(image: any) {
  // SCL Band classes to exclude:
  // 3 = Cloud shadows, 8 = Cloud medium probability, 9 = Cloud high probability, 10 = Thin cirrus, 11 = Snow
  const scl = image.select('SCL');
  const sclMask = scl.neq(3)
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  // QA60 bitmask backup
  const qa = image.select('QA60');
  const cloudBitMask = 1 << 10;
  const cirrusBitMask = 1 << 11;
  const qaMask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  const totalMask = sclMask.and(qaMask);
  return image.updateMask(totalMask);
}

interface BoundaryResult {
  feature: any;
  geometry: any;
  areaName: string;
  state: string;
  country: string;
  areaKm2: number;
  datasetUsed: string;
}

/**
 * Finds the administrative boundary from FAO GAUL datasets.
 * Prioritizes FAO/GAUL/2025/level2 with GAUL2_NAME as requested,
 * with resilient fallbacks to ADM2_NAME and FAO/GAUL/2015/level2.
 */
async function resolveAdministrativeBoundary(targetArea: string): Promise<BoundaryResult | null> {
  const trimmed = targetArea.trim();
  const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

  // Primary dataset requested: FAO/GAUL/2025/level2
  // Secondary standard fallback: FAO/GAUL/2015/level2
  const candidateDatasets = [
    { id: 'FAO/GAUL/2025/level2', primaryField: 'GAUL2_NAME', altField: 'ADM2_NAME' },
    { id: 'FAO/GAUL/2015/level2', primaryField: 'ADM2_NAME', altField: 'GAUL2_NAME' },
    { id: 'FAO/GAUL/2015/level1', primaryField: 'ADM1_NAME', altField: 'GAUL1_NAME' },
  ];

  for (const ds of candidateDatasets) {
    try {
      const collection = ee.FeatureCollection(ds.id);

      // Search using exact match, title case, or case-insensitive startsWith
      const filter = ee.Filter.or(
        ee.Filter.eq(ds.primaryField, trimmed),
        ee.Filter.eq(ds.primaryField, titleCase),
        ee.Filter.eq(ds.altField, trimmed),
        ee.Filter.eq(ds.altField, titleCase),
        ee.Filter.stringStartsWith(ds.primaryField, titleCase)
      );

      const matches = collection.filter(filter);
      const count = await evaluateEE<number>(matches.size());

      if (count > 0) {
        const feature = matches.first();
        const geometry = feature.geometry();

        // Extract metadata & area
        const [props, calculatedKm2] = await Promise.all([
          evaluateEE<Record<string, any>>(feature.toDictionary()),
          evaluateEE<number>(geometry.area().divide(1e6)),
        ]);

        const areaName = props[ds.primaryField] || props[ds.altField] || trimmed;
        const state = props.ADM1_NAME || props.GAUL1_NAME || props.ADM1_CODE || 'District Level';
        const country = props.ADM0_NAME || props.GAUL0_NAME || 'Unknown Country';
        const areaKm2 = Math.round((calculatedKm2 || props.Shape_Area || 0) * 100) / 100;

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
      // If dataset asset doesn't exist on GEE, continue to next candidate
      continue;
    }
  }

  return null;
}

/**
 * Calculates Sentinel-2 NDVI metrics for a specific year and area geometry.
 * Returns null if no satellite images are available or if cloud-free coverage is insufficient.
 */
async function computeYearlyNdvi(
  geometry: any,
  year: number,
  cloudThreshold = 30
): Promise<YearlyNdviResult> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  try {
    // 5. Load COPERNICUS/S2_SR_HARMONIZED
    // 6. Filter by area geometry, year, cloud percentage
    const s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(geometry)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudThreshold));

    const imageCount = await evaluateEE<number>(s2Collection.size());

    // If no satellite images available for the year, return null instead of crashing
    if (imageCount === 0) {
      return {
        year,
        avgNdvi: null,
        minNdvi: null,
        maxNdvi: null,
        vegetationStatus: 'Unknown',
        imageCount: 0,
      };
    }

    // 7. Apply cloud masking
    const maskedCollection = s2Collection.map(applyCloudAndShadowMask);

    // 8. Calculate NDVI: normalizedDifference(['B8','B4'])
    // We compute the median composite over the year for cloud-free stability
    const medianComposite = maskedCollection.median();
    const ndviImage = medianComposite.normalizedDifference(['B8', 'B4']).rename('ndvi');

    // 9. Calculate: average NDVI, minimum NDVI, maximum NDVI
    const combinedReducer = ee.Reducer.mean()
      .combine({
        reducer2: ee.Reducer.min(),
        sharedInputs: true,
      })
      .combine({
        reducer2: ee.Reducer.max(),
        sharedInputs: true,
      });

    // Reduce over boundary geometry
    // Scale 150m-200m ensures fast server-side aggregation for districts while preserving Sentinel-2 accuracy
    const statsDict = ndviImage.reduceRegion({
      reducer: combinedReducer,
      geometry: geometry,
      scale: 150,
      maxPixels: 1e9,
      bestEffort: true,
    });

    const stats = await evaluateEE<Record<string, number | null>>(statsDict);

    const rawAvg = stats?.ndvi_mean ?? stats?.ndvi ?? null;
    const rawMin = stats?.ndvi_min ?? null;
    const rawMax = stats?.ndvi_max ?? null;

    // Validate and round values
    const avgNdvi = typeof rawAvg === 'number' && !Number.isNaN(rawAvg) 
      ? Math.max(-1, Math.min(1, Math.round(rawAvg * 10000) / 10000))
      : null;

    const minNdvi = typeof rawMin === 'number' && !Number.isNaN(rawMin)
      ? Math.max(-1, Math.min(1, Math.round(rawMin * 10000) / 10000))
      : null;

    const maxNdvi = typeof rawMax === 'number' && !Number.isNaN(rawMax)
      ? Math.max(-1, Math.min(1, Math.round(rawMax * 10000) / 10000))
      : null;

    // 10. Determine vegetation status
    const vegetationStatus = determineVegetationStatus(avgNdvi);

    return {
      year,
      avgNdvi,
      minNdvi,
      maxNdvi,
      vegetationStatus,
      imageCount,
    };
  } catch (error) {
    console.warn(`Error computing NDVI for year ${year}:`, error);
    return {
      year,
      avgNdvi: null,
      minNdvi: null,
      maxNdvi: null,
      vegetationStatus: 'Unknown',
      imageCount: 0,
    };
  }
}

/**
 * Main analysis pipeline for requested area.
 * Executes:
 * 1. Secure Earth Engine authentication
 * 2. Administrative boundary lookup in FAO/GAUL/2025/level2
 * 3. Geometry extraction
 * 4. 5-year NDVI evaluation (2021-2025)
 * 5. SQL database persistence into users, areas, analysis_requests, ndvi_results, reports
 */
export async function analyzeAreaNdvi(targetArea: string): Promise<NdviAnalysisResponse> {
  if (!targetArea || typeof targetArea !== 'string' || targetArea.trim().length === 0) {
    throw new Error('Please enter a valid district or area name.');
  }

  const requestedArea = targetArea.trim();

  const satelliteSource = 'COPERNICUS/S2_SR_HARMONIZED';
  const boundarySource = 'FAO/GAUL/2025/level2';
  const calendarYears = [2021, 2022, 2023, 2024, 2025];

  // 1. Check TiDB cache BEFORE starting Google Earth Engine.
  // Repeated requests for the same district can therefore return immediately.
  try {
    const cached = await getCachedAnalysis(
      requestedArea,
      satelliteSource,
      boundarySource
    );

    if (cached) {
      console.log(`[NDVI] Cache hit for "${requestedArea}"`);

      return {
        area: cached.request.area_name,
        country: cached.request.country,
        state: cached.request.state,
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
    // Cache failure must never prevent a real Earth Engine analysis.
    console.warn('[NDVI] Cache lookup failed; continuing with Earth Engine:', cacheError);
  }

  // 2. Authenticate with Google Earth Engine only when cache misses.
  await initializeEarthEngine();

  // 3. Find matching administrative boundary and geometry.
  const boundary = await resolveAdministrativeBoundary(requestedArea);

  if (!boundary) {
    throw new Error('Area not found. Try a district name such as Pune.');
  }

  // 4. Calculate all five complete calendar years concurrently.
  const yearlyResults = await Promise.all(
    calendarYears.map((year) => computeYearlyNdvi(boundary.geometry, year))
  );

  // 5. Build response.
  const responseData: NdviAnalysisResponse = {
    area: boundary.areaName,
    country: boundary.country,
    state: boundary.state,
    areaKm2: boundary.areaKm2,
    years: yearlyResults,
    metadata: {
      satelliteSource,
      boundarySource: boundary.datasetUsed,
      calculatedAt: new Date().toISOString(),
    },
  };

  // 6. Save the newly calculated result to TiDB.
  try {
    const dbResult = await saveAnalysisToDatabase({
      areaName: boundary.areaName,
      state: boundary.state,
      country: boundary.country,
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
    console.warn(
      'Database save warning (analysis still returned to user):',
      dbErr
    );

    if (responseData.metadata) {
      responseData.metadata.persistedToDb = false;
      responseData.metadata.dbMessage = (dbErr as Error).message;
    }
  }

  return responseData;
}
