import { ee, initializeEarthEngine, evaluateEE } from './earthengine';
import { saveAnalysisToDatabase, getCachedAnalysis, getDbPool } from './database';
import { normalizeSearchText, getCountryName } from './countries';
import indianCities from './data/indian-cities.json';
import {
  NdviAnalysisResponse,
  YearlyNdviResult,
  MonthlyNdviResult,
  WeeklyNdviResult,
  DroughtPrediction,
  DroughtSeverity,
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
 * Builds Earth Engine computation graph for a specific date range's NDVI statistics.
 * Uses optimized band pre-selection and per-image cloud masking to prevent memory limits.
 */
function buildPeriodComputation(
  geometry: any,
  startDate: string,
  endDate: string,
  scale: number,
  cloudThreshold = 60
) {
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

function buildYearComputation(
  geometry: any,
  year: number,
  scale: number,
  cloudThreshold = 50
) {
  return buildPeriodComputation(
    geometry,
    `${year}-01-01`,
    `${year}-12-31`,
    scale,
    cloudThreshold
  );
}

function parseNdviStats(rawStats: any) {
  const rawAvg = rawStats?.ndvi_mean ?? rawStats?.ndvi ?? null;
  const rawMin = rawStats?.ndvi_min ?? null;
  const rawMax = rawStats?.ndvi_max ?? null;

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

  return { avgNdvi, minNdvi, maxNdvi };
}

export function getMonthlyWindows() {
  return [
    { key: 'm_2024_06', month: '2024-06', label: 'Jun 2024', start: '2024-06-01', end: '2024-06-30' },
    { key: 'm_2024_07', month: '2024-07', label: 'Jul 2024', start: '2024-07-01', end: '2024-07-31' },
    { key: 'm_2024_08', month: '2024-08', label: 'Aug 2024', start: '2024-08-01', end: '2024-08-31' },
    { key: 'm_2024_09', month: '2024-09', label: 'Sep 2024', start: '2024-09-01', end: '2024-09-30' },
    { key: 'm_2024_10', month: '2024-10', label: 'Oct 2024', start: '2024-10-01', end: '2024-10-31' },
    { key: 'm_2024_11', month: '2024-11', label: 'Nov 2024', start: '2024-11-01', end: '2024-11-30' },
    { key: 'm_2024_12', month: '2024-12', label: 'Dec 2024', start: '2024-12-01', end: '2024-12-31' },
    { key: 'm_2025_01', month: '2025-01', label: 'Jan 2025', start: '2025-01-01', end: '2025-01-31' },
  ];
}

export function getWeeklyWindows() {
  return [
    { key: 'w_1', period: 'Week 1', label: 'Dec 15 - 21', start: '2024-12-15', end: '2024-12-22' },
    { key: 'w_2', period: 'Week 2', label: 'Dec 22 - 28', start: '2024-12-22', end: '2024-12-29' },
    { key: 'w_3', period: 'Week 3', label: 'Dec 29 - Jan 4', start: '2024-12-29', end: '2025-01-05' },
    { key: 'w_4', period: 'Week 4', label: 'Jan 5 - 11', start: '2025-01-05', end: '2025-01-12' },
    { key: 'w_5', period: 'Week 5', label: 'Jan 12 - 18', start: '2025-01-12', end: '2025-01-19' },
    { key: 'w_6', period: 'Week 6', label: 'Jan 19 - 26', start: '2025-01-19', end: '2025-01-26' },
  ];
}

/**
 * Calculates operational Vegetation Condition Index (VCI) and predictive drought risk
 * based on satellite remote-sensing canopy telemetry and multi-year historical benchmarks.
 */
export function calculateDroughtPrediction(
  years: YearlyNdviResult[],
  monthlyData: MonthlyNdviResult[] = [],
  weeklyData: WeeklyNdviResult[] = [],
  areaName = 'Target Region',
  state = '',
  country = ''
): DroughtPrediction {
  const validYears = years.filter((y) => y.avgNdvi !== null && !Number.isNaN(y.avgNdvi));

  // Multi-year mean baseline
  const baselineNdvi =
    validYears.length > 0
      ? validYears.reduce((sum, y) => sum + (y.avgNdvi || 0), 0) / validYears.length
      : 0.35;

  // Historical minimum drought floor and peak bounds
  let worstYear = 2021;
  let worstDroughtNdvi = 0.3;
  let historicalMaxNdvi = 0.45;

  if (validYears.length > 0) {
    const sortedByNdvi = [...validYears].sort((a, b) => (a.avgNdvi || 0) - (b.avgNdvi || 0));
    worstYear = sortedByNdvi[0].year;
    worstDroughtNdvi = sortedByNdvi[0].avgNdvi || 0.3;
    historicalMaxNdvi = sortedByNdvi[sortedByNdvi.length - 1].avgNdvi || 0.45;
  }

  const allMins = validYears.map((y) => y.minNdvi).filter((v): v is number => v !== null && v > 0);
  const allMaxs = validYears.map((y) => y.maxNdvi).filter((v): v is number => v !== null && v > 0);
  const absoluteMinFloor = allMins.length > 0 ? Math.min(...allMins) : worstDroughtNdvi * 0.7;
  const absoluteMaxCeiling = allMaxs.length > 0 ? Math.max(...allMaxs) : historicalMaxNdvi * 1.3;

  // Operational current NDVI: prioritize weekly -> monthly -> latest annual
  const validWeeks = weeklyData.filter((w) => w.avgNdvi !== null && !Number.isNaN(w.avgNdvi));
  const validMonths = monthlyData.filter((m) => m.avgNdvi !== null && !Number.isNaN(m.avgNdvi));

  let currentNdvi = baselineNdvi;
  let currentSource = 'annual baseline';

  if (validWeeks.length > 0) {
    currentNdvi = validWeeks[validWeeks.length - 1].avgNdvi!;
    currentSource = `rolling weekly observation (${validWeeks[validWeeks.length - 1].label})`;
  } else if (validMonths.length > 0) {
    currentNdvi = validMonths[validMonths.length - 1].avgNdvi!;
    currentSource = `monthly composite (${validMonths[validMonths.length - 1].label})`;
  } else if (validYears.length > 0) {
    currentNdvi = validYears[validYears.length - 1].avgNdvi!;
    currentSource = `latest annual observation (${validYears[validYears.length - 1].year})`;
  }

  // Vegetation Condition Index (VCI): VCI = ((NDVI_curr - min) / (max - min)) * 100
  const range = absoluteMaxCeiling - absoluteMinFloor;
  let vci = 50;
  if (range > 0.001) {
    vci = Math.max(0, Math.min(100, ((currentNdvi - absoluteMinFloor) / range) * 100));
  }

  // NDVI Anomaly Percent
  const ndviAnomalyPercent =
    baselineNdvi > 0
      ? Number((((currentNdvi - baselineNdvi) / baselineNdvi) * 100).toFixed(2))
      : 0;

  // Difference from historical worst drought floor
  const differenceFromWorst =
    worstDroughtNdvi > 0
      ? Number((((currentNdvi - worstDroughtNdvi) / worstDroughtNdvi) * 100).toFixed(2))
      : 0;

  const isApproachingWorst = currentNdvi <= worstDroughtNdvi * 1.05 || vci < 25;

  // Drought Severity Classification
  let droughtSeverity: DroughtSeverity = 'Normal Moisture';
  if (vci < 15 || ndviAnomalyPercent < -25) {
    droughtSeverity = 'Extreme Drought';
  } else if (vci < 25 || ndviAnomalyPercent < -15) {
    droughtSeverity = 'Severe Drought';
  } else if (vci < 40 || ndviAnomalyPercent < -5) {
    droughtSeverity = 'Moderate Drought';
  } else if (vci < 55 || ndviAnomalyPercent < 0) {
    droughtSeverity = 'Mild Stress';
  } else if (vci >= 75 && ndviAnomalyPercent > 10) {
    droughtSeverity = 'Optimal Moisture';
  } else {
    droughtSeverity = 'Normal Moisture';
  }

  // Drought Probability (0 - 100%)
  const rawProb = Math.round(100 - (vci * 0.7 + (ndviAnomalyPercent + 20) * 0.5));
  const droughtProbability = Math.max(5, Math.min(96, rawProb));

  // Rainfall Stress Index
  let rainfallStressIndex: 'Critical Deficit' | 'Moderate Deficit' | 'Normal Moisture' | 'Surplus' =
    'Normal Moisture';
  if (vci < 25 || ndviAnomalyPercent < -15) {
    rainfallStressIndex = 'Critical Deficit';
  } else if (vci < 45 || ndviAnomalyPercent < -5) {
    rainfallStressIndex = 'Moderate Deficit';
  } else if (vci >= 75 && ndviAnomalyPercent > 10) {
    rainfallStressIndex = 'Surplus';
  } else {
    rainfallStressIndex = 'Normal Moisture';
  }

  // Dual Drought Classifier: Suka Dushkal (Dry Drought) vs Ola Dushkal (Wet Drought)
  // In Maharashtra agricultural science, Ola Dushkal happens when continuous excessive rain/waterlogging
  // destroys crops via root rot & inundation (NDVI plummets despite moisture surplus),
  // whereas Suka Dushkal happens when rain fails, soil dries out, and crops wilt.
  const isWetDroughtSignature =
    (rainfallStressIndex === 'Surplus' && (vci < 50 || ndviAnomalyPercent < -2)) ||
    (monthlyData.length >= 2 &&
      monthlyData[monthlyData.length - 1].avgNdvi !== null &&
      monthlyData[monthlyData.length - 2].avgNdvi !== null &&
      monthlyData[monthlyData.length - 1].avgNdvi! < monthlyData[monthlyData.length - 2].avgNdvi! * 0.9 &&
      rainfallStressIndex === 'Surplus');

  let droughtType: 'Suka Dushkal (Dry Drought)' | 'Ola Dushkal (Wet Drought)' | 'Normal / Optimal Season' =
    'Normal / Optimal Season';
  let droughtTypeMarathi: 'सुका दुष्काळ' | 'ओला दुष्काळ' | 'सुरळीत हंगाम' = 'सुरळीत हंगाम';

  if (isWetDroughtSignature) {
    droughtType = 'Ola Dushkal (Wet Drought)';
    droughtTypeMarathi = 'ओला दुष्काळ';
  } else if (
    droughtSeverity === 'Extreme Drought' ||
    droughtSeverity === 'Severe Drought' ||
    droughtSeverity === 'Moderate Drought' ||
    rainfallStressIndex === 'Critical Deficit' ||
    rainfallStressIndex === 'Moderate Deficit' ||
    ndviAnomalyPercent < -6 ||
    vci < 40
  ) {
    droughtType = 'Suka Dushkal (Dry Drought)';
    droughtTypeMarathi = 'सुका दुष्काळ';
  } else {
    droughtType = 'Normal / Optimal Season';
    droughtTypeMarathi = 'सुरळीत हंगाम';
  }

  const climateDynamics = {
    droughtType,
    droughtTypeMarathi,
    rainfallPattern:
      droughtType === 'Ola Dushkal (Wet Drought)'
        ? 'Continuous unseasonal torrential rainfall / cloudburst saturation exceeding soil drainage capacity.'
        : droughtType === 'Suka Dushkal (Dry Drought)'
        ? 'Persistent dry spell / prolonged monsoon hiatus (20+ days rainless break) with severe rainfall deficit.'
        : 'Well-distributed seasonal rainfall maintaining favorable root-zone field capacity.',
    soilMoistureStatus:
      droughtType === 'Ola Dushkal (Wet Drought)'
        ? 'Heavy black cotton soil over-saturated (>95% saturation), waterlogged root zone, total anaerobic root asphyxiation.'
        : droughtType === 'Suka Dushkal (Dry Drought)'
        ? 'Severe capillary moisture exhaustion, deep soil cracking, soil moisture depleted below wilting point.'
        : 'Optimal soil capillary water storage (60-80% field capacity).',
    ndviSignatureExplanation:
      droughtType === 'Ola Dushkal (Wet Drought)'
        ? 'Standing water absorbs NIR reflectance, and waterlogged crop roots rot (Fusarium/Rhizoctonia) causing lodging and a sudden anomalous collapse in canopy NDVI despite high moisture.'
        : droughtType === 'Suka Dushkal (Dry Drought)'
        ? 'In the absence of rain and under intense solar radiation, vegetation canopy wilts, leaves curl and turn brown, producing a steady monotonic weekly NDVI decline.'
        : 'Healthy chlorophyll synthesis actively absorbs red light and reflects NIR, maintaining stable or climbing NDVI.',
    historicalPrecedent:
      droughtType === 'Ola Dushkal (Wet Drought)'
        ? 'Directly mirrors Maharashtra’s October 2022 & late 2024 Ola Dushkal disaster where continuous retreating rains inundated standing soybean, cotton, and onion crops across Marathwada and Western Maharashtra.'
        : droughtType === 'Suka Dushkal (Dry Drought)'
        ? 'Directly mirrors the 2018–2019 drought and August 2023 dry spell where 151 talukas faced acute agricultural aridity, crop wilting, and 6,200+ emergency water tankers.'
        : 'Consistent with historical high-yield bumper crop years with balanced monsoon distribution.',
  };

  // Scientific Summary
  let predictionSummary = '';
  if (droughtType === 'Ola Dushkal (Wet Drought)') {
    predictionSummary = `⚠️ ओला दुष्काळ (Ola Dushkal - Wet Drought Warning) detected for ${areaName}${state ? `, ${state}` : ''}. Despite surplus moisture/rainfall, satellite telemetry reveals abnormal canopy stress (NDVI: ${currentNdvi.toFixed(4)}, VCI: ${vci.toFixed(1)}%). Continuous torrential rainfall and poor drainage in heavy black cotton soils have caused waterlogging, root asphyxiation, and fungal rotting, mimicking drought-level crop losses.`;
  } else if (droughtSeverity === 'Extreme Drought' || droughtSeverity === 'Severe Drought') {
    predictionSummary = `⚠️ सुका दुष्काळ (Suka Dushkal - Severe Dry Drought) detected for ${areaName}${state ? `, ${state}` : ''}. Current canopy NDVI (${currentNdvi.toFixed(4)} from ${currentSource}) is ${Math.abs(ndviAnomalyPercent).toFixed(1)}% below the 5-year multi-year baseline (${baselineNdvi.toFixed(4)}). The Vegetation Condition Index (VCI) stands at ${vci.toFixed(1)}%, indicating acute soil moisture deficit and canopy desiccation. The area is currently ${isApproachingWorst ? 'breaching or approaching' : 'within threshold of'} its historical drought floor from ${worstYear} (${worstDroughtNdvi.toFixed(4)}).`;
  } else if (droughtSeverity === 'Moderate Drought' || droughtType === 'Suka Dushkal (Dry Drought)') {
    predictionSummary = `सुका दुष्काळ ताण (Suka Dushkal - Moderate Dry Stress) observed across ${areaName}. Current canopy NDVI (${currentNdvi.toFixed(4)}) is running ${Math.abs(ndviAnomalyPercent).toFixed(1)}% below the long-term baseline with a VCI of ${vci.toFixed(1)}%. Soil capillary water reserves are depleting rapidly under rain deficit.`;
  } else if (droughtSeverity === 'Mild Stress') {
    predictionSummary = `Mild moisture stress noted in ${areaName}. NDVI is slightly below long-term seasonal norms (${ndviAnomalyPercent > 0 ? '+' : ''}${ndviAnomalyPercent.toFixed(1)}%), with a VCI of ${vci.toFixed(1)}%. Crop canopy remains viable but vulnerable to subsequent rain-shadow dry spells.`;
  } else {
    predictionSummary = `सुरळीत हंगाम (Optimal Healthy Growth): Vegetation canopy across ${areaName} exhibits healthy vigour with an operational VCI of ${vci.toFixed(1)}% and positive moisture anomaly (+${ndviAnomalyPercent.toFixed(1)}% vs baseline). Satellite reflectance indicates adequate surface moisture and favorable biomass accumulation.`;
  }

  // Actionable Agricultural & Water Advisories
  const agriculturalAdvisories: string[] = [];
  if (droughtType === 'Ola Dushkal (Wet Drought)') {
    agriculturalAdvisories.push(
      'तातडीने शेतातील अतिरिक्त पाणी बाहेर काढण्यासाठी 30 सेमी खोल चर (Drainage Trenches) काढा, जेणेकरून 24 ते 48 तासांत शेत मोकळे होईल.',
      'मुळे कुजणे व बुरशीजन्य करपा रोखण्यासाठी कॉपर ऑक्सिक्लोराईड (COC 2.5 ग्रॅम/लि) किंवा कार्बेन्डाझिमची तात्काळ आळवणी करा.',
      'ओल्या आणि चिखलमय जमिनीत युरियाचा वापर पूर्णपणे थांबवा; पाणी ओसरल्यानंतर 19:19:19 विद्राव्य खताची हलकी फवारणी करा.',
      'काढणीला आलेल्या पिकांची (सोयाबीन/कांदा) साठवणूक सुरक्षित कोरड्या गोदामांमध्ये करा.'
    );
  } else if (droughtSeverity === 'Extreme Drought' || droughtSeverity === 'Severe Drought') {
    agriculturalAdvisories.push(
      'पाण्याची बचत करण्यासाठी केवळ रात्री किंवा पहाटेच्या वेळीच ठिबक/तुषार सिंचन चालवा जेणेकरून बाष्पीभवन टळेल.',
      'जमिनीतील ओलावा टिकवण्यासाठी पिकाच्या ओळींमध्ये 5 ते 7 सेमी सेंद्रिय काडीकचऱ्याचे आच्छादन (Organic Mulching) करा.',
      'कमी कालावधीच्या व दुष्काळ सहन करणाऱ्या वाणांना प्राधान्य द्या (जसे बाजरी, ज्वारी, हरभरा, मटकी).',
      'भूजल पातळी टिकवण्यासाठी विहिरी व शेततळ्यांतील पाण्याचा काटेकोर व संरक्षित वापर करा.'
    );
  } else if (droughtSeverity === 'Moderate Drought') {
    agriculturalAdvisories.push(
      'पिकांच्या संवेदनशील अवस्थेत (फुलोरा व दाणे भरताना) तातडीने एक संरक्षित पाणी द्या.',
      'जमिनीतील भेगा बुजवण्यासाठी आणि बाष्पीभवन रोखण्यासाठी हलकी डवरणी (धूळ मशागत) करा.',
      'उष्णतेचा ताण कमी करण्यासाठी 1 ते 2% पोटॅशियम नायट्रेट (KNO3) किंवा युरियाची हलकी फवारणी करा.',
      'गावातील शेततळे व बंधाऱ्यांमधील उपलब्ध पाण्याचे 45 दिवसांसाठी नियोजन करा.'
    );
  } else if (droughtSeverity === 'Mild Stress') {
    agriculturalAdvisories.push(
      'साप्ताहिक सॅटेलाईट NDVI इंडेक्सवर लक्ष ठेवा; ताण वाढल्यास तुषार सिंचनाचा वापर करा.',
      'मातीची जलधारण क्षमता वाढवण्यासाठी शेणखत किंवा गांडूळ खताचा वापर वाढवा.',
      'पावसाचे थेंब साचवण्यासाठी पिकाच्या दोन ओळींमध्ये सर्‍या किंवा चर काढा.'
    );
  } else {
    agriculturalAdvisories.push(
      'पिकांची स्थिती समाधानकारक आहे; प्रमाणित खतांचे व्यवस्थापन आणि नियमित पाणी पाळ्या सुरू ठेवा.',
      'अनुकूल ओलाव्याचा फायदा घेऊन कडधान्य आंतरपिकांची पेरणी करा जेणेकरून नत्र स्थिरीकरण होईल.',
      'अचानक अतिवृष्टी झाल्यास पाणी साचू नये म्हणून शेतातील निचरा व्यवस्था पूर्ववत तपासा.'
    );
  }

  return {
    vci: Number(vci.toFixed(2)),
    droughtSeverity,
    droughtProbability,
    ndviAnomalyPercent,
    historicalBaselineNdvi: Number(baselineNdvi.toFixed(4)),
    historicalMinDroughtNdvi: Number(absoluteMinFloor.toFixed(4)),
    historicalMaxNdvi: Number(absoluteMaxCeiling.toFixed(4)),
    currentNdvi: Number(currentNdvi.toFixed(4)),
    rainfallStressIndex,
    droughtType,
    droughtTypeMarathi,
    climateDynamics,
    predictionSummary,
    agriculturalAdvisories,
    historicalComparison: {
      worstDroughtYear: worstYear,
      worstDroughtNdvi: Number(worstDroughtNdvi.toFixed(4)),
      differenceFromWorst,
      isApproachingWorst,
    },
  };
}

export interface MultiTemporalNdviResult {
  years: YearlyNdviResult[];
  monthlyData: MonthlyNdviResult[];
  weeklyData: WeeklyNdviResult[];
  droughtPrediction: DroughtPrediction;
}

/**
 * Computes multi-temporal Sentinel-2 NDVI across annual (2021-2025), monthly, and weekly windows.
 * Evaluates all windows simultaneously in a single unified Earth Engine dictionary request (~2-3s).
 */
export async function computeMultiTemporalNdvi(
  geometry: any,
  areaKm2: number,
  areaName: string,
  state = '',
  country = ''
): Promise<MultiTemporalNdviResult> {
  const calendarYears = [2021, 2022, 2023, 2024, 2025];
  const monthlyWindows = getMonthlyWindows();
  const weeklyWindows = getWeeklyWindows();

  // Adaptive scale ensures rapid server-side processing while preserving multispectral accuracy:
  // Large districts (> 6000 km²): 500m scale (~30k-60k sample pixels)
  // Medium districts (2000 - 6000 km²): 300m scale (~20k-40k sample pixels)
  // Cities & towns (< 2000 km²): 150m scale (~10k-30k sample pixels)
  const scale = areaKm2 > 6000 ? 500 : areaKm2 > 2000 ? 300 : 150;

  try {
    const dictionaryEntries: Record<string, any> = {};

    // 1. 5 Annual Windows
    for (const year of calendarYears) {
      dictionaryEntries[`yr_${year}`] = buildYearComputation(geometry, year, scale, 50);
    }

    // 2. 8 Monthly Windows
    for (const m of monthlyWindows) {
      dictionaryEntries[m.key] = buildPeriodComputation(geometry, m.start, m.end, scale, 60);
    }

    // 3. 6 Weekly Windows
    for (const w of weeklyWindows) {
      dictionaryEntries[w.key] = buildPeriodComputation(geometry, w.start, w.end, scale, 60);
    }

    const combinedDict = ee.Dictionary(dictionaryEntries);
    const results = await evaluateEE<Record<string, Record<string, number | null>>>(combinedDict);

    // Parse yearly
    const yearlyResults: YearlyNdviResult[] = calendarYears.map((year) => {
      const stats = parseNdviStats(results?.[`yr_${year}`]);
      return {
        year,
        avgNdvi: stats.avgNdvi,
        minNdvi: stats.minNdvi,
        maxNdvi: stats.maxNdvi,
        vegetationStatus: determineVegetationStatus(stats.avgNdvi),
      };
    });

    // Parse monthly
    const monthlyResults: MonthlyNdviResult[] = monthlyWindows.map((m) => {
      const stats = parseNdviStats(results?.[m.key]);
      return {
        month: m.month,
        label: m.label,
        avgNdvi: stats.avgNdvi,
        minNdvi: stats.minNdvi,
        maxNdvi: stats.maxNdvi,
        vegetationStatus: determineVegetationStatus(stats.avgNdvi),
      };
    });

    // Parse weekly
    const weeklyResults: WeeklyNdviResult[] = weeklyWindows.map((w) => {
      const stats = parseNdviStats(results?.[w.key]);
      return {
        period: w.period,
        label: w.label,
        startDate: w.start,
        endDate: w.end,
        avgNdvi: stats.avgNdvi,
        vegetationStatus: determineVegetationStatus(stats.avgNdvi),
      };
    });

    const droughtPrediction = calculateDroughtPrediction(
      yearlyResults,
      monthlyResults,
      weeklyResults,
      areaName,
      state,
      country
    );

    return {
      years: yearlyResults,
      monthlyData: monthlyResults,
      weeklyData: weeklyResults,
      droughtPrediction,
    };
  } catch (batchError) {
    console.warn('Batch multi-temporal evaluation warning, attempting resilient sequential evaluation:', batchError);

    const yearlyResults: YearlyNdviResult[] = [];
    for (const year of calendarYears) {
      try {
        const computation = buildYearComputation(geometry, year, scale);
        const stats = await evaluateEE<Record<string, number | null>>(computation);
        const parsed = parseNdviStats(stats);

        yearlyResults.push({
          year,
          avgNdvi: parsed.avgNdvi,
          minNdvi: parsed.minNdvi,
          maxNdvi: parsed.maxNdvi,
          vegetationStatus: determineVegetationStatus(parsed.avgNdvi),
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

    const droughtPrediction = calculateDroughtPrediction(
      yearlyResults,
      [],
      [],
      areaName,
      state,
      country
    );

    return {
      years: yearlyResults,
      monthlyData: [],
      weeklyData: [],
      droughtPrediction,
    };
  }
}

/**
 * Main analysis pipeline for requested area.
 * Executes:
 * 1. Checks relational SQL cache (TiDB / MySQL) with location identity
 * 2. Authenticates with Google Earth Engine
 * 3. Resolves vector boundary geometry (FAO GAUL Level 2 / Level 1 / 10km Buffer)
 * 4. Computes multi-temporal Sentinel-2 NDVI trajectory (yearly, monthly, weekly)
 * 5. Performs live Drought Prediction model evaluation (VCI, anomaly %, advisories)
 * 6. Persists result into database tables: areas, analysis_requests, ndvi_results, reports
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

      // Ensure droughtPrediction is present; calculate on the fly if cached before drought feature
      const droughtPrediction =
        cached.droughtPrediction ||
        calculateDroughtPrediction(
          cached.years,
          cached.monthlyData || [],
          cached.weeklyData || [],
          cached.request.area_name || requestedArea,
          cached.request.state || options?.state || '',
          cached.request.country || options?.country || 'Global'
        );

      return {
        area: cached.request.area_name || requestedArea,
        country: cached.request.country || options?.country || 'Global',
        state: cached.request.state || options?.state || '',
        areaKm2: Number(cached.request.area_km2) || 0,
        years: cached.years,
        monthlyData: cached.monthlyData,
        weeklyData: cached.weeklyData,
        droughtPrediction,
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

  // 4. Calculate multi-temporal NDVI (5-year annual, monthly, weekly, drought prediction)
  const multiTemporalResult = await computeMultiTemporalNdvi(
    boundary.geometry,
    boundary.areaKm2,
    boundary.areaName || requestedArea,
    boundary.state || options?.state || '',
    boundary.country || options?.country || 'Global'
  );

  // 5. Build response object with transparent analysis scope metadata
  const responseData: NdviAnalysisResponse = {
    area: boundary.areaName || requestedArea,
    country: boundary.country || options?.country || 'Global',
    state: boundary.state || options?.state || '',
    areaKm2: boundary.areaKm2,
    years: multiTemporalResult.years,
    monthlyData: multiTemporalResult.monthlyData,
    weeklyData: multiTemporalResult.weeklyData,
    droughtPrediction: multiTemporalResult.droughtPrediction,
    metadata: {
      satelliteSource,
      boundarySource: boundary.datasetUsed,
      analysisScope: boundary.analysisScope,
      scopeDescription: boundary.scopeDescription,
      geonameId: options?.geonameId,
      calculatedAt: new Date().toISOString(),
    },
  };

  // 6. Save newly calculated result to TiDB with full multi-temporal and drought payload
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
      years: multiTemporalResult.years,
      monthlyData: multiTemporalResult.monthlyData,
      weeklyData: multiTemporalResult.weeklyData,
      droughtPrediction: multiTemporalResult.droughtPrediction,
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
