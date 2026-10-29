// =============================================================================
// DROUGHT MONITORING SYSTEM — Google Earth Engine JavaScript
// Datasets: Sentinel-2 SR | MODIS MOD13Q1 | CHIRPS | MODIS MOD11A2 LST
// Author: Agricultural Drought Monitor
// =============================================================================

// ─── USER CONFIGURATION ──────────────────────────────────────────────────────

// Replace with your study polygon. Example: Ahilyanagar district, Maharashtra
var AOI = ee.Geometry.Polygon([[
  [73.9, 19.5], [75.2, 19.5],
  [75.2, 18.4], [73.9, 18.4],
  [73.9, 19.5]
]]);
var AOI_NAME = 'Ahilyanagar';

// Analysis window
var CURRENT_DATE    = ee.Date('2025-01-26');
var HISTORY_START   = '2001-01-01';   // MODIS historical baseline start
var HISTORY_END     = '2020-12-31';   // historical baseline end (exclusive of recent 5 yrs)
var RECENT_MONTHS   = 9;              // how many recent months to analyse
var RECENT_WEEKS    = 8;              // how many recent weeks to analyse

// Scale for spatial reduction (metres). Auto-set by areaKm² in production.
var SCALE_M = 300;

// =============================================================================
// MODULE 1 — SENTINEL-2 SURFACE REFLECTANCE (Cloud-masked NDVI)
// Collection : COPERNICUS/S2_SR_HARMONIZED
// Bands used : B8 (NIR 842nm), B4 (Red 665nm), SCL (Scene Classification)
// Scale factor: none required — bands already in surface reflectance DN 0-10000
// Cloud mask  : SCL classes excluded → 3=cloud shadow, 8/9=cloud med/high,
//               10=thin cirrus, 11=snow/ice
// =============================================================================

/**
 * Masks clouds/shadows/cirrus in a Sentinel-2 SR image using the SCL band.
 * Returns image with NDVI band added and cloud pixels set to nodata.
 */
function maskS2AndComputeNdvi(image) {
  var scl = image.select('SCL');

  // Build a binary valid-pixel mask (1 = valid, 0 = remove)
  var validMask = scl.neq(3)   // cloud shadow
    .and(scl.neq(8))           // cloud medium probability
    .and(scl.neq(9))           // cloud high probability
    .and(scl.neq(10))          // thin cirrus
    .and(scl.neq(11));         // snow / ice

  // NDVI = (NIR - Red) / (NIR + Red)
  var ndvi = image
    .normalizedDifference(['B8', 'B4'])
    .rename('ndvi')
    .updateMask(validMask);

  return ndvi.copyProperties(image, ['system:time_start']);
}

/**
 * Returns a Sentinel-2 median composite NDVI image for a date range.
 * Pre-filter removes scenes with CLOUDY_PIXEL_PERCENTAGE >= threshold.
 */
function getS2NdviComposite(aoi, startDate, endDate, cloudThreshold) {
  cloudThreshold = cloudThreshold || 60;
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudThreshold))
    .select(['B8', 'B4', 'SCL'])
    .map(maskS2AndComputeNdvi)
    .median();  // median composite reduces residual cloud artefacts
}

/**
 * Reduces a single-band image over an AOI and returns mean NDVI as a number.
 */
function reduceNdviOverAoi(ndviImage, aoi, scale) {
  return ndviImage
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi,
      scale: scale,
      maxPixels: 1e9,
      bestEffort: true   // auto-adjusts scale if polygon too small
    })
    .get('ndvi');
}

// =============================================================================
// MODULE 2 — MODIS MOD13Q1 NDVI (Long-term Historical Baseline)
// Collection : MODIS/061/MOD13Q1
// Bands used : NDVI (int16), SummaryQA (uint8)
// Scale factor: NDVI raw integer ÷ 10000 → float [-1, 1]
// Quality filter: SummaryQA ≤ 1  (0=good, 1=marginal; reject 2=snow, 3=cloud)
// Temporal    : 16-day composites since 2000-02-18
// =============================================================================

/**
 * Applies the MODIS MOD13Q1 quality filter and NDVI scale factor.
 * Returns image with float 'ndvi' band, masked where QA > 1.
 */
function maskAndScaleModis(image) {
  var qa = image.select('SummaryQA');
  var goodQa = qa.lte(1);  // keep good (0) and marginal (1) pixels only

  var ndvi = image
    .select('NDVI')
    .multiply(0.0001)      // apply scale factor: raw ÷ 10000
    .rename('ndvi')
    .updateMask(goodQa);

  return ndvi.copyProperties(image, ['system:time_start']);
}

/**
 * Builds the full MODIS NDVI collection (quality-filtered, scaled).
 */
function getModisNdviCollection(aoi) {
  return ee.ImageCollection('MODIS/061/MOD13Q1')
    .filterBounds(aoi)
    .filterDate(HISTORY_START, HISTORY_END)
    .select(['NDVI', 'SummaryQA'])
    .map(maskAndScaleModis);
}

/**
 * Computes historical (long-term) NDVI statistics for a specific calendar month.
 * Uses server-side calendarRange filter — NO JavaScript loop over years.
 * Returns: {histMean, histMin, histMax} as ee.Number objects.
 */
function getModisHistoricalMonthStats(modisCollection, monthNum) {
  var monthCol = modisCollection
    .filter(ee.Filter.calendarRange(monthNum, monthNum, 'month'));

  // Server-side temporal reduction over all available years for this month
  var histMean = monthCol.mean().select('ndvi');
  var histMin  = monthCol.min().select('ndvi');
  var histMax  = monthCol.max().select('ndvi');

  return { histMean: histMean, histMin: histMin, histMax: histMax };
}

// =============================================================================
// MODULE 3 — CHIRPS DAILY PRECIPITATION
// Collection : UCSB-CHG/CHIRPS/DAILY
// Band       : precipitation (mm/day, already scaled)
// No masking required; sum over period gives monthly/seasonal total.
// =============================================================================

/**
 * Returns total precipitation (mm) for a date range, summed pixel-wise.
 */
function getChirpsSum(aoi, startDate, endDate) {
  return ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .select('precipitation')
    .sum();   // pixel-wise daily sum → total mm for period
}

/**
 * Computes long-term mean monthly rainfall over the HISTORY window.
 * Returns a single-band image: mean precipitation per calendar month.
 */
function getChirpsHistoricalMonthMean(aoi, monthNum) {
  return ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterBounds(aoi)
    .filterDate(HISTORY_START, HISTORY_END)
    .filter(ee.Filter.calendarRange(monthNum, monthNum, 'month'))
    .sum()
    // Divide by number of years in baseline to get typical monthly total
    .divide(
      ee.Number(ee.Date(HISTORY_END).difference(ee.Date(HISTORY_START), 'year'))
    )
    .select(['precipitation']);
}

// =============================================================================
// MODULE 4 — MODIS MOD11A2 Land Surface Temperature
// Collection : MODIS/061/MOD11A2
// Band       : LST_Day_1km (uint16), QC_Day (uint8)
// Scale factor: raw × 0.02 − 273.15  → degrees Celsius
// Quality mask: QC_Day bits 0-1 must be 00 (good LST & emissivity quality)
// =============================================================================

/**
 * Applies scale factor and quality mask to MODIS LST image.
 * Returns float 'lst_c' band in degrees Celsius.
 */
function maskAndScaleLst(image) {
  var qc = image.select('QC_Day');

  // Bits 0-1 of QC_Day: 00 = good quality
  var goodQc = qc.bitwiseAnd(3).eq(0);  // mask bits 0-1 == 0b00

  var lstC = image
    .select('LST_Day_1km')
    .multiply(0.02)
    .subtract(273.15)
    .rename('lst_c')
    .updateMask(goodQc);

  return lstC.copyProperties(image, ['system:time_start']);
}

/**
 * Returns mean LST in Celsius over a period (8-day composite input).
 */
function getModisLstMean(aoi, startDate, endDate) {
  return ee.ImageCollection('MODIS/061/MOD11A2')
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .select(['LST_Day_1km', 'QC_Day'])
    .map(maskAndScaleLst)
    .mean()
    .select('lst_c');
}

/**
 * Historical mean LST for a calendar month across baseline years.
 */
function getLstHistoricalMonthMean(aoi, monthNum) {
  return ee.ImageCollection('MODIS/061/MOD11A2')
    .filterBounds(aoi)
    .filterDate(HISTORY_START, HISTORY_END)
    .filter(ee.Filter.calendarRange(monthNum, monthNum, 'month'))
    .select(['LST_Day_1km', 'QC_Day'])
    .map(maskAndScaleLst)
    .mean()
    .select('lst_c');
}

// =============================================================================
// MODULE 5 — VCI & ANOMALY CALCULATORS (server-side image arithmetic)
// VCI = 100 × (NDVI_current − NDVI_min) / (NDVI_max − NDVI_min)
// NDVI Anomaly (absolute) = NDVI_current − NDVI_hist_mean
// NDVI Anomaly (percent)  = (NDVI_current − hist_mean) / hist_mean × 100
// Rainfall Anomaly (%)    = (rain_current − rain_hist) / rain_hist × 100
// =============================================================================

/**
 * Computes VCI from current NDVI and historical min/max images.
 * Clamps result to [0, 100].
 */
function computeVci(ndviCurrent, histMin, histMax) {
  var range = histMax.subtract(histMin);
  // Guard against division by zero where range is flat
  var safeMask = range.abs().gt(0.001);

  return ndviCurrent
    .subtract(histMin)
    .divide(range)
    .multiply(100)
    .clamp(0, 100)
    .updateMask(safeMask)
    .rename('vci');
}

/**
 * Reduces a spatial image to a single scalar (mean over AOI).
 * Returns an ee.Number. Handles nodata by returning null safely on client side.
 */
function reduceMean(image, band, aoi, scale) {
  return image
    .select(band)
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi,
      scale: scale,
      maxPixels: 1e9,
      bestEffort: true
    })
    .get(band);
}

// =============================================================================
// MODULE 6 — TEMPORAL WINDOW GENERATORS
// =============================================================================

/**
 * Generates a list of recent monthly date windows.
 * Returns an array of {monthNum, label, start, end} objects.
 */
function getRecentMonthWindows(currentDate, numMonths) {
  var windows = [];
  for (var i = numMonths - 1; i >= 0; i--) {
    var monthStart = currentDate.advance(-i, 'month').update(null, null, 1);
    var monthEnd   = monthStart.advance(1, 'month');
    var mNum = monthStart.get('month');
    var yr   = monthStart.get('year');
    windows.push({
      key: ee.String('m_').cat(yr.format()).cat('_').cat(mNum.format()),
      label: ee.String(monthStart.format('MMM yyyy')),
      monthNum: mNum,
      year: yr,
      start: monthStart,
      end: monthEnd
    });
  }
  return windows;
}

/**
 * Generates recent weekly date windows (7-day periods).
 */
function getRecentWeekWindows(currentDate, numWeeks) {
  var windows = [];
  for (var i = numWeeks - 1; i >= 0; i--) {
    var weekEnd   = currentDate.advance(-i * 7, 'day');
    var weekStart = weekEnd.advance(-7, 'day');
    windows.push({
      key: ee.String('w_').cat(ee.Number(numWeeks - i).format()),
      label: ee.String(weekStart.format('MMM d')).cat(' – ').cat(weekEnd.format('MMM d')),
      index: numWeeks - i,
      start: weekStart,
      end: weekEnd
    });
  }
  return windows;
}

// =============================================================================
// MODULE 7 — MAIN COMPUTATION ENGINE
// Builds a unified ee.Dictionary with ALL computations, evaluates in one call.
// =============================================================================

/**
 * Main drought computation. Builds one ee.Dictionary of all GEE reductions
 * and evaluates it in a single server round-trip.
 */
function computeDroughtMetrics(aoi, areaName, currentDate, numMonths, numWeeks, scale) {

  var monthWindows = getRecentMonthWindows(currentDate, numMonths);
  var weekWindows  = getRecentWeekWindows(currentDate, numWeeks);

  // Pre-build MODIS NDVI collection (filtered once, reused for every month)
  var modisCollection = getModisNdviCollection(aoi);

  // ── Build the unified dictionary of all EE computations ───────────────────
  var entries = {};

  // ── (A) WEEKLY S2 NDVI ────────────────────────────────────────────────────
  weekWindows.forEach(function(w) {
    var s2 = getS2NdviComposite(aoi, w.start, w.end, 60);
    entries[w.key.getInfo()] = s2.reduceRegion({
      reducer: ee.Reducer.mean()
        .combine({ reducer2: ee.Reducer.min(), sharedInputs: true })
        .combine({ reducer2: ee.Reducer.max(), sharedInputs: true })
        .combine({ reducer2: ee.Reducer.count(), sharedInputs: true }),
      geometry: aoi,
      scale: scale,
      maxPixels: 1e9,
      bestEffort: true
    });
  });

  // ── (B) MONTHLY S2 NDVI + CHIRPS + LST + MODIS HISTORICAL ────────────────
  monthWindows.forEach(function(w) {
    var mNum = w.monthNum;
    var mKey = w.key.getInfo();

    // Current S2 NDVI composite
    var s2Ndvi = getS2NdviComposite(aoi, w.start, w.end, 60);

    // Current CHIRPS rainfall total
    var chirpsCurrent = getChirpsSum(aoi, w.start, w.end);

    // Current MODIS LST
    var lstCurrent = getModisLstMean(aoi, w.start, w.end);

    // MODIS historical statistics for this calendar month (server-side)
    var modisHist = getModisHistoricalMonthStats(modisCollection, mNum);

    // VCI using MODIS historical min/max (scientifically correct approach)
    var vciImage = computeVci(s2Ndvi, modisHist.histMin, modisHist.histMax);

    // NDVI anomaly (current S2 minus MODIS historical mean)
    var ndviAnomalyImage = s2Ndvi.subtract(modisHist.histMean.select('ndvi')).rename('ndvi_anomaly');

    // CHIRPS historical baseline
    var chirpsHist = getChirpsHistoricalMonthMean(aoi, mNum);
    // Rainfall anomaly
    var rainAnomalyImage = chirpsCurrent.subtract(chirpsHist)
      .divide(chirpsHist.add(0.001))  // add epsilon to prevent /0
      .multiply(100)
      .rename('rain_anomaly_pct');

    // Historical LST for this month
    var lstHist = getLstHistoricalMonthMean(aoi, mNum);

    // Pack all reductions for this month
    var combinedReducer = ee.Reducer.mean();

    entries[mKey + '_s2_ndvi'] = s2Ndvi.reduceRegion({
      reducer: combinedReducer
        .combine({ reducer2: ee.Reducer.min(), sharedInputs: true })
        .combine({ reducer2: ee.Reducer.max(), sharedInputs: true }),
      geometry: aoi, scale: scale, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_rain_mm'] = chirpsCurrent.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 5000, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_rain_hist_mm'] = chirpsHist.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 5000, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_rain_anomaly_pct'] = rainAnomalyImage.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 5000, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_modis_hist_ndvi'] = modisHist.histMean.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 250, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_modis_min_ndvi'] = modisHist.histMin.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 250, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_modis_max_ndvi'] = modisHist.histMax.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 250, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_vci'] = vciImage.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: scale, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_ndvi_anomaly'] = ndviAnomalyImage.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: scale, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_lst_c'] = lstCurrent.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 1000, maxPixels: 1e9, bestEffort: true
    });

    entries[mKey + '_lst_hist_c'] = lstHist.reduceRegion({
      reducer: combinedReducer, geometry: aoi, scale: 1000, maxPixels: 1e9, bestEffort: true
    });
  });

  return ee.Dictionary(entries);
}

// =============================================================================
// MODULE 8 — DROUGHT RISK SCORING
// Weighted model:
//   40% VCI score
//   25% NDVI decline score
//   25% Rainfall deficit score
//   10% Temperature stress score
// =============================================================================

/**
 * Classifies VCI into drought severity categories.
 */
function classifyVci(vci) {
  if (vci === null || vci === undefined) return 'Unknown';
  if (vci >= 60) return 'Good / Wet';
  if (vci >= 40) return 'Normal';
  if (vci >= 35) return 'Mild drought stress';
  if (vci >= 25) return 'Moderate drought';
  if (vci >= 15) return 'Severe drought';
  return 'Extreme drought';
}

/**
 * Converts rainfall deficit % to a 0-100 score.
 */
function rainfallDeficitScore(deficitPct) {
  if (!deficitPct || deficitPct >= 0) return 0;
  return Math.min(100, Math.round((Math.abs(deficitPct) / 50) * 100));
}

/**
 * Converts temperature anomaly (°C above normal) to 0-100 score.
 */
function temperatureStressScore(lstC, histLstC) {
  if (!lstC || !histLstC) return 0;
  var anomaly = lstC - histLstC;
  return Math.min(100, Math.max(0, Math.round(anomaly * 12 + Math.max(0, lstC - 33) * 8)));
}

/**
 * Client-side: takes the evaluated results dictionary and builds structured output.
 */
function buildDroughtReport(results, monthWindows, weekWindows) {

  var report = {
    generatedAt: new Date().toISOString(),
    weeklyNdvi: [],
    monthlySeries: [],
    drought: {}
  };

  // ── Weekly NDVI ───────────────────────────────────────────────────────────
  weekWindows.forEach(function(w) {
    var key   = w.key.getInfo();
    var stats = results[key] || {};
    report.weeklyNdvi.push({
      weekIndex: w.index,
      label: w.label.getInfo ? w.label.getInfo() : w.label,
      startDate: w.start.format('YYYY-MM-dd').getInfo(),
      endDate:   w.end.format('YYYY-MM-dd').getInfo(),
      currentNdvi: stats['ndvi'] != null ? +stats['ndvi'].toFixed(4) : null,
      ndviMin:     stats['ndvi_min'] != null ? +stats['ndvi_min'].toFixed(4) : null,
      ndviMax:     stats['ndvi_max'] != null ? +stats['ndvi_max'].toFixed(4) : null,
      pixelCount:  stats['ndvi_count'] || null,
    });
  });

  // ── Monthly series ────────────────────────────────────────────────────────
  var ndviValues = [];   // track for consecutive decline
  monthWindows.forEach(function(w) {
    var mKey = w.key.getInfo();

    var s2Raw      = results[mKey + '_s2_ndvi'] || {};
    var rainRaw    = results[mKey + '_rain_mm'] || {};
    var rainHist   = results[mKey + '_rain_hist_mm'] || {};
    var rainAnomRaw= results[mKey + '_rain_anomaly_pct'] || {};
    var modisHist  = results[mKey + '_modis_hist_ndvi'] || {};
    var modisMin   = results[mKey + '_modis_min_ndvi'] || {};
    var modisMax   = results[mKey + '_modis_max_ndvi'] || {};
    var vciRaw     = results[mKey + '_vci'] || {};
    var anomRaw    = results[mKey + '_ndvi_anomaly'] || {};
    var lstRaw     = results[mKey + '_lst_c'] || {};
    var lstHistRaw = results[mKey + '_lst_hist_c'] || {};

    var currentNdvi   = s2Raw['ndvi'] != null ? +s2Raw['ndvi'].toFixed(4) : null;
    var histNdvi      = modisHist['ndvi'] != null ? +modisHist['ndvi'].toFixed(4) : null;
    var ndviMin       = modisMin['ndvi'] != null ? +modisMin['ndvi'].toFixed(4) : null;
    var ndviMax       = modisMax['ndvi'] != null ? +modisMax['ndvi'].toFixed(4) : null;
    var vci           = vciRaw['vci'] != null ? +vciRaw['vci'].toFixed(2) : null;
    var ndviAnomAbs   = anomRaw['ndvi_anomaly'] != null ? +anomRaw['ndvi_anomaly'].toFixed(4) : null;
    var ndviAnomPct   = (ndviAnomAbs !== null && histNdvi && histNdvi > 0)
                          ? +((ndviAnomAbs / histNdvi) * 100).toFixed(2) : null;
    var rainMm        = rainRaw['precipitation'] != null ? +rainRaw['precipitation'].toFixed(1) : null;
    var rainHistMm    = rainHist['precipitation'] != null ? +rainHist['precipitation'].toFixed(1) : null;
    var rainAnomPct   = rainAnomRaw['rain_anomaly_pct'] != null ? +rainAnomRaw['rain_anomaly_pct'].toFixed(2) : null;
    var lstC          = lstRaw['lst_c'] != null ? +lstRaw['lst_c'].toFixed(2) : null;
    var lstHistC      = lstHistRaw['lst_c'] != null ? +lstHistRaw['lst_c'].toFixed(2) : null;

    if (currentNdvi !== null) ndviValues.push(currentNdvi);

    report.monthlySeries.push({
      month: w.year.getInfo() + '-' + String(w.monthNum.getInfo()).padStart(2, '0'),
      label: w.label.getInfo ? w.label.getInfo() : w.label,
      // Sentinel-2 current
      currentNdvi:         currentNdvi,
      ndviS2Min:           s2Raw['ndvi_min'] != null ? +s2Raw['ndvi_min'].toFixed(4) : null,
      ndviS2Max:           s2Raw['ndvi_max'] != null ? +s2Raw['ndvi_max'].toFixed(4) : null,
      // MODIS historical baseline
      historicalNdvi:      histNdvi,
      historicalNdviMin:   ndviMin,    // MODIS long-term min (for VCI denominator)
      historicalNdviMax:   ndviMax,    // MODIS long-term max (for VCI denominator)
      // Vegetation Condition Index
      vci:                 vci,
      vciClassification:   classifyVci(vci),
      // NDVI anomaly
      ndviAnomalyAbs:      ndviAnomAbs,
      ndviAnomalyPct:      ndviAnomPct,
      // CHIRPS
      rainfallMm:          rainMm,
      rainfallHistMm:      rainHistMm,
      rainfallAnomalyPct:  rainAnomPct,
      // MODIS LST
      landSurfaceTempC:    lstC,
      lstHistoricalMeanC:  lstHistC,
      lstAnomalyC:         (lstC !== null && lstHistC !== null) ? +(lstC - lstHistC).toFixed(2) : null,
    });
  });

  // ── Drought risk score (latest month) ────────────────────────────────────
  var latestMonth  = report.monthlySeries[report.monthlySeries.length - 1] || {};
  var latestVci    = latestMonth.vci != null ? latestMonth.vci : 50;
  var latestRainD  = latestMonth.rainfallAnomalyPct || 0;
  var latestLst    = latestMonth.landSurfaceTempC;
  var latestLstH   = latestMonth.lstHistoricalMeanC;

  // Consecutive NDVI decline count
  var declineCount = 0;
  for (var i = ndviValues.length - 1; i > 0; i--) {
    if (ndviValues[i] < ndviValues[i - 1]) declineCount++;
    else break;
  }

  var vciScore      = Math.max(0, Math.min(100, Math.round(100 - latestVci)));
  var declineScore  = Math.min(100, declineCount * 18);
  var rainScore     = rainfallDeficitScore(latestRainD);
  var tempScore     = temperatureStressScore(latestLst, latestLstH);

  var riskScore = Math.round(
    0.40 * vciScore + 0.25 * declineScore + 0.25 * rainScore + 0.10 * tempScore
  );

  var riskCategory = 'No drought';
  if (riskScore >= 80) riskCategory = 'Severe drought risk';
  else if (riskScore >= 65) riskCategory = 'High drought risk';
  else if (riskScore >= 45) riskCategory = 'Moderate drought risk';
  else if (riskScore >= 25) riskCategory = 'Mild drought risk';

  report.drought = {
    riskScore:              riskScore,
    riskCategory:           riskCategory,
    currentVci:             latestVci,
    vciClassification:      classifyVci(latestVci),
    consecutiveDeclineMonths: declineCount,
    scoreBreakdown: {
      vci:         { weight: '40%', score: vciScore },
      ndviDecline: { weight: '25%', score: declineScore },
      rainfall:    { weight: '25%', score: rainScore },
      temperature: { weight: '10%', score: tempScore }
    },
    explainableSummary: 'VCI is ' + latestVci.toFixed(1) + '% (' +
      classifyVci(latestVci) + '). NDVI declined for ' + declineCount +
      ' consecutive months. Rainfall is ' +
      (latestRainD < 0 ? Math.abs(latestRainD).toFixed(1) + '% below' : latestRainD.toFixed(1) + '% above') +
      ' the long-term average. Combined drought risk: ' + riskCategory.toUpperCase() + '.'
  };

  return report;
}

// =============================================================================
// MODULE 9 — VISUALIZATION (optional: add layers to GEE Map)
// =============================================================================

/**
 * Adds NDVI visualization layer to the GEE map.
 */
function addNdviLayer(ndviImage, label) {
  Map.addLayer(ndviImage, {
    min: 0, max: 0.8,
    palette: ['#d73027', '#fc8d59', '#fee08b', '#ffffbf', '#d9ef8b', '#91cf60', '#1a9850']
  }, label);
}

/**
 * Adds VCI visualization layer to the GEE map.
 */
function addVciLayer(vciImage, label) {
  Map.addLayer(vciImage, {
    min: 0, max: 100,
    palette: ['#8B0000', '#FF4500', '#FF8C00', '#FFD700', '#ADFF2F', '#32CD32', '#006400']
  }, label);
}

/**
 * Adds CHIRPS rainfall layer for a period.
 */
function addRainfallLayer(chirpsSum, label) {
  Map.addLayer(chirpsSum, {
    min: 0, max: 300,
    palette: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84']
  }, label);
}

// =============================================================================
// MODULE 10 — EXPORT TO DRIVE / CSV / FRONTEND
// =============================================================================

/**
 * Exports the monthly stats table as a CSV to Google Drive.
 * Use this to feed data to the frontend.
 */
function exportResultsToDrive(report, areaName) {
  // Convert monthly series to a Feature Collection for export
  var features = report.monthlySeries.map(function(m) {
    return ee.Feature(null, m);
  });
  var fc = ee.FeatureCollection(features);

  Export.table.toDrive({
    collection: fc,
    description: 'drought_monthly_' + areaName.replace(/\s+/g, '_'),
    fileFormat: 'CSV',
    folder: 'GEE_Drought_Monitor'
  });
}

// =============================================================================
// MAIN — Wire everything together
// =============================================================================

Map.centerObject(AOI, 8);
Map.addLayer(AOI, { color: 'ffffff', fillColor: '00000000' }, 'Study Area');

print('⏳ Running drought computation for: ' + AOI_NAME);
print('   Historical NDVI baseline: ' + HISTORY_START + ' → ' + HISTORY_END);
print('   Recent analysis: last ' + RECENT_MONTHS + ' months, ' + RECENT_WEEKS + ' weeks');

var monthWindows = getRecentMonthWindows(CURRENT_DATE, RECENT_MONTHS);
var weekWindows  = getRecentWeekWindows(CURRENT_DATE, RECENT_WEEKS);

// Build and evaluate the unified dictionary
var droughtDict = computeDroughtMetrics(
  AOI, AOI_NAME, CURRENT_DATE, RECENT_MONTHS, RECENT_WEEKS, SCALE_M
);

// Single evaluate() call for the entire computation graph
droughtDict.evaluate(function(results, error) {
  if (error) {
    print('❌ GEE evaluation error:', error);
    return;
  }

  // Build structured report client-side
  var report = buildDroughtReport(results, monthWindows, weekWindows);

  // Print full report to console
  print('✅ Drought Report — ' + AOI_NAME);
  print('RISK:', report.drought.riskCategory, '(score:', report.drought.riskScore + '/100)');
  print('EXPLANATION:', report.drought.explainableSummary);
  print('');
  print('SCORE BREAKDOWN:', report.drought.scoreBreakdown);
  print('');
  print('MONTHLY SERIES:', report.monthlySeries);
  print('');
  print('WEEKLY NDVI:', report.weeklyNdvi);
  print('');
  print('FULL JSON (copy for frontend):', JSON.stringify(report, null, 2));

  // ── Add visualisation layers for most recent month ──────────────────────
  var lastM = monthWindows[monthWindows.length - 1];
  var lastS2 = getS2NdviComposite(AOI, lastM.start, lastM.end, 60);
  addNdviLayer(lastS2, 'Current NDVI (S2) — ' + lastM.label.getInfo());

  var modisCol = getModisNdviCollection(AOI);
  var histStats = getModisHistoricalMonthStats(modisCol, lastM.monthNum);
  var vciMap = computeVci(lastS2, histStats.histMin, histStats.histMax);
  addVciLayer(vciMap, 'VCI — ' + lastM.label.getInfo());

  var rain = getChirpsSum(AOI, lastM.start, lastM.end);
  addRainfallLayer(rain, 'CHIRPS Rainfall — ' + lastM.label.getInfo());

  // ── Export ────────────────────────────────────────────────────────────────
  // Uncomment to export CSV to Google Drive:
  // exportResultsToDrive(report, AOI_NAME);
});

// =============================================================================
// BONUS: TIME SERIES CHART in GEE Console
// Plots MODIS NDVI time series over AOI (great for trend inspection)
// =============================================================================

var modisForChart = ee.ImageCollection('MODIS/061/MOD13Q1')
  .filterBounds(AOI)
  .filterDate('2010-01-01', CURRENT_DATE.format('YYYY-MM-dd').getInfo())
  .select(['NDVI', 'SummaryQA'])
  .map(maskAndScaleModis);

var ndviChart = ui.Chart.image.series({
  imageCollection: modisForChart,
  region: AOI,
  reducer: ee.Reducer.mean(),
  scale: 500,
  xProperty: 'system:time_start'
})
.setChartType('LineChart')
.setOptions({
  title: 'MODIS MOD13Q1 NDVI Time Series — ' + AOI_NAME,
  vAxis: { title: 'NDVI', viewWindow: { min: -0.1, max: 0.9 } },
  hAxis: { title: 'Date', format: 'MMM yyyy' },
  lineWidth: 1.5,
  colors: ['#4CAF50'],
  series: { 0: { labelInLegend: 'MODIS NDVI (QA-filtered, scaled)' } }
});
print(ndviChart);

var chirpsChart = ui.Chart.image.series({
  imageCollection: ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .filterBounds(AOI)
    .filterDate('2015-01-01', CURRENT_DATE.format('YYYY-MM-dd').getInfo())
    .select('precipitation')
    .map(function(img) {
      return img.set('system:time_start', img.get('system:time_start'));
    }),
  region: AOI,
  reducer: ee.Reducer.mean(),
  scale: 5000,
  xProperty: 'system:time_start'
})
.setChartType('ColumnChart')
.setOptions({
  title: 'CHIRPS Daily Rainfall — ' + AOI_NAME,
  vAxis: { title: 'Precipitation (mm/day)' },
  hAxis: { title: 'Date' },
  colors: ['#2196F3']
});
print(chirpsChart);
