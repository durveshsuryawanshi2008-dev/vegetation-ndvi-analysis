/**
 * Drought Prediction Module — Type Definitions
 *
 * Defines all input features, output results, drought classifications,
 * and interfaces for the rule-based scoring system and optional ML model.
 */

// ---------------------------------------------------------------------------
// Drought Classification Enum
// ---------------------------------------------------------------------------
export type DroughtClass =
  | 'No drought'
  | 'Mild'
  | 'Moderate'
  | 'Severe'
  | 'Extreme';

// ---------------------------------------------------------------------------
// Confidence Level
// ---------------------------------------------------------------------------
export type ConfidenceLevel = 'Low' | 'Medium' | 'High' | 'Very High';

// ---------------------------------------------------------------------------
// Input Features (per area + month)
// ---------------------------------------------------------------------------
export interface DroughtPredictionInput {
  /** Area / region identifier */
  areaName: string;
  /** Analysis month label, e.g. "Oct 2024" */
  monthLabel: string;

  // ── NDVI Features ──────────────────────────────────────────────────────
  /** Current month's mean NDVI */
  currentNdvi: number;
  /** Previous month's mean NDVI */
  previousMonthNdvi: number;
  /** Same calendar month from the prior year */
  sameMonthLastYearNdvi: number;
  /** 5-year climatological average NDVI for the same calendar month */
  fiveYearAvgNdvi: number;

  // ── NDVI Slope Features ────────────────────────────────────────────────
  /** Linear NDVI slope over the last 4 weeks (%/week) */
  ndviSlope4Weeks: number;
  /** Linear NDVI slope over the last 8 weeks (%/week) */
  ndviSlope8Weeks: number;
  /** Linear NDVI slope over the last 12 weeks (%/week) */
  ndviSlope12Weeks: number;

  // ── VCI Features ───────────────────────────────────────────────────────
  /** Current month Vegetation Condition Index (0–100) */
  currentVci: number;
  /** Previous month VCI */
  previousMonthVci: number;

  // ── Rainfall Features ──────────────────────────────────────────────────
  /** Current month total rainfall (mm) */
  currentRainfallMm: number;
  /** Long-term average rainfall for the same calendar month (mm) */
  longTermAvgRainfallMm: number;
  /** Rainfall deficit percentage: ((current - avg) / avg) * 100 */
  rainfallDeficitPercent: number;

  // ── Temperature / LST Feature ──────────────────────────────────────────
  /** Temperature or LST anomaly (°C above/below normal) */
  temperatureAnomalyC: number;

  // ── Optional Context ───────────────────────────────────────────────────
  /** Number of consecutive weeks NDVI has declined */
  consecutiveDeclineWeeks?: number;
}

// ---------------------------------------------------------------------------
// Component Score Breakdown (transparent, explainable)
// ---------------------------------------------------------------------------
export interface DroughtScoreBreakdown {
  /** VCI-based stress score (0–100), weight ≈ 30% */
  vciStressScore: number;
  /** NDVI decline trend score (0–100), weight ≈ 20% */
  ndviDeclineTrendScore: number;
  /** Rainfall deficit score (0–100), weight ≈ 25% */
  rainfallDeficitScore: number;
  /** Temperature anomaly score (0–100), weight ≈ 10% */
  temperatureAnomalyScore: number;
  /** NDVI absolute health score (0–100), weight ≈ 15% */
  ndviHealthScore: number;
}

// ---------------------------------------------------------------------------
// Output Result
// ---------------------------------------------------------------------------
export interface DroughtPredictionResult {
  /** Drought risk score 0–100 */
  riskScore: number;
  /** Classified drought severity */
  droughtClass: DroughtClass;
  /** Confidence in this prediction */
  confidence: ConfidenceLevel;
  /** Numeric confidence percentage (0–100) */
  confidencePercent: number;
  /** Primary driver / main reason for the prediction */
  mainReason: string;
  /** Recommended action for stakeholders */
  recommendedAction: string;
  /** Transparent breakdown of individual component scores */
  scoreBreakdown: DroughtScoreBreakdown;
  /** Explainable natural-language summary (drought risk *forecast*) */
  summary: string;
  /** Non-rainfall cause advisory (populated when rainfall is normal but NDVI is low) */
  nonRainfallCauseAdvisory: string | null;
  /** Hard-rule overrides that were applied */
  appliedOverrides: string[];
  /** Model type that produced this result */
  modelType: 'rule-based' | 'ml-ensemble';
}

// ---------------------------------------------------------------------------
// ML Model Interface (optional future extension)
// ---------------------------------------------------------------------------
export interface DroughtMLModelPrediction {
  /** Model name / version */
  modelName: string;
  /** Predicted drought class */
  predictedClass: DroughtClass;
  /** Class probabilities */
  classProbabilities: Record<DroughtClass, number>;
  /** Feature importance ranking */
  featureImportance: { feature: string; importance: number }[];
}

// ---------------------------------------------------------------------------
// Full Prediction API Response
// ---------------------------------------------------------------------------
export interface DroughtPredictionApiResponse {
  areaName: string;
  monthLabel: string;
  input: DroughtPredictionInput;
  prediction: DroughtPredictionResult;
  mlPrediction?: DroughtMLModelPrediction;
  metadata: {
    modelVersion: string;
    computedAt: string;
    disclaimer: string;
  };
}
