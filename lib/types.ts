/**
 * TypeScript Definitions for Vegetation Analysis & NDVI application
 */

import {
  DroughtClass,
  ConfidenceLevel,
  DroughtPredictionResult,
  DroughtMLModelPrediction,
  DroughtPredictionInput,
} from './drought-prediction-types';

export * from './drought-prediction-types';

export type VegetationStatus = 'Very Low' | 'Low/Moderate' | 'Healthy' | 'Very Healthy' | 'Unknown';

export interface YearlyNdviResult {
  year: number;
  avgNdvi: number | null;
  minNdvi: number | null;
  maxNdvi: number | null;
  vegetationStatus: VegetationStatus;
  imageCount?: number;
}

export interface MonthlyNdviResult {
  month: string; // e.g. "2024-11"
  label: string; // e.g. "Nov 2024"
  avgNdvi: number | null;
  minNdvi: number | null;
  maxNdvi: number | null;
  vegetationStatus: VegetationStatus;
}

export type VciClassification =
  | 'Good / Wet'
  | 'Normal'
  | 'Mild drought stress'
  | 'Moderate drought'
  | 'Severe drought'
  | 'Extreme drought';

export type DroughtRiskCategory =
  | 'No drought'
  | 'Mild drought risk'
  | 'Moderate drought risk'
  | 'High drought risk'
  | 'Severe drought risk';

export interface WeeklyNdviSeries {
  weekIndex: number;
  label: string; // e.g. "Week 1 (Oct 1 - 7)"
  startDate: string;
  endDate: string;
  currentNdvi: number | null;
  historicalAvgNdvi: number | null;
  ndviMin: number | null;
  ndviMax: number | null;
  vci: number | null;
  anomaly: number | null; // current - historical avg
  anomalyPercent: number | null; // (current - avg) / avg * 100
  vegetationStatus: VegetationStatus;
  changeFromPrevWeek?: number | null;
  changeFromPrevWeekPercent?: number | null;
}

export interface MonthlyNdviSeries {
  month: string; // e.g. "2024-10"
  label: string; // e.g. "Oct 2024"
  currentNdvi: number | null;
  previousMonthNdvi: number | null;
  sameMonthLastYearNdvi: number | null;
  fiveYearAvgNdvi: number | null;
  ndviMin: number | null;
  ndviMax: number | null;
  vci: number | null;
  anomaly: number | null;
  anomalyPercent: number | null;
  rainfallMm: number | null;
  historicalAvgRainfallMm: number | null;
  rainfallDeficitPercent: number | null;
  vegetationStatus: VegetationStatus;
  changeFromPrevMonthPercent?: number | null;
  changeFromLastYearPercent?: number | null;
}

export interface SeasonalNdviSeries {
  season: string; // e.g. "Kharif 2024", "Rabi 2024-25", "Summer 2024"
  label: string;
  avgNdvi: number | null;
  rainfallMm: number | null;
  rainfallDeficitPercent: number | null;
  vegetationStatus: VegetationStatus;
}

export interface DroughtPredictionEngineResult {
  riskScore: number; // 0 - 100
  riskCategory: DroughtRiskCategory;
  scoreBreakdown: {
    vciScore: number; // 40% weight
    ndviDeclineScore: number; // 25% weight
    rainfallDeficitScore: number; // 25% weight
    temperatureStressScore: number; // 10% weight
  };
  currentVci: number;
  vciClassification: VciClassification;
  consecutiveDeclineWeeks: number;
  recentNdviChangeRate: number; // % change over recent 4-8 weeks
  rainfallDeficit3Month: number; // % deficit over last 1-3 months
  landSurfaceTempC: number;
  temperatureAnomalyC: number;
  explainableSummary: string;
  vegetationStressWarning: string | null;
  agriculturalAdvisories: string[];
}

export interface MultiYearMonthRecord {
  monthNum: number;
  label: string;
  valuesByYear: Record<number, number | null>;
  fiveYearAvg: number | null;
  currentYearValue: number | null;
  yoyChangePercent: number | null;
}

export interface MultiYearComparison {
  years: number[];
  months: MultiYearMonthRecord[];
}

export interface DroughtMonitorResponse {
  area: string;
  state: string;
  country: string;
  areaKm2: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  currentNdvi: number | null;
  currentVci: number | null;
  currentAnomaly: number | null;
  currentAnomalyPercent: number | null;
  currentRainfallDeficit: number | null;
  prediction: DroughtPredictionEngineResult;
  forecast?: DroughtPredictionResult;
  mlForecast?: DroughtMLModelPrediction | null;
  slopes?: {
    slope4Weeks: number;
    slope8Weeks: number;
    slope12Weeks: number;
  };
  multiYearComparison?: MultiYearComparison;
  weeklySeries: WeeklyNdviSeries[];
  monthlySeries: MonthlyNdviSeries[];
  seasonalSeries: SeasonalNdviSeries[];
  yearlySeries: YearlyNdviResult[];
  metadata?: {
    satelliteSource: string;
    precipitationSource: string;
    temperatureSource: string;
    boundarySource: string;
    analysisScope?: string;
    calculatedAt: string;
    persistedToDb?: boolean;
    cached?: boolean;
  };
}

export type DroughtSeverity =
  | 'Extreme Drought'
  | 'Severe Drought'
  | 'Moderate Drought'
  | 'Mild Stress'
  | 'Normal Moisture'
  | 'Optimal Moisture';

export interface DroughtPrediction {
  vci: number; // Vegetation Condition Index (0 - 100%)
  droughtSeverity: DroughtSeverity;
  droughtProbability: number; // 0 - 100%
  ndviAnomalyPercent: number; // Deviation from 5-year mean (+/- %)
  historicalBaselineNdvi: number; // Multi-year average
  historicalMinDroughtNdvi: number; // Historical minimum floor
  historicalMaxNdvi: number;
  currentNdvi: number;
  rainfallStressIndex: 'Critical Deficit' | 'Moderate Deficit' | 'Normal Moisture' | 'Surplus';
  predictionSummary: string; // Plain-English scientific explanation
  agriculturalAdvisories: string[]; // Actionable recommendations
  historicalComparison: {
    worstDroughtYear: number;
    worstDroughtNdvi: number;
    differenceFromWorst: number; // % above/below worst drought
    isApproachingWorst: boolean;
  };
}

export interface WeeklyNdviResult {
  period: string;
  label: string;
  startDate: string;
  endDate: string;
  avgNdvi: number | null;
  vegetationStatus: VegetationStatus;
}

export interface NdviAnalysisResponse {
  area: string;
  country: string;
  state: string;
  areaKm2: number;
  years: YearlyNdviResult[];
  monthlyData?: MonthlyNdviResult[];
  weeklyData?: WeeklyNdviResult[];
  droughtPrediction?: DroughtPrediction;
  metadata?: {
    satelliteSource: string;
    boundarySource: string;
    analysisScope?: 'ADMINISTRATIVE_DISTRICT' | 'CITY_BUFFER_10KM' | 'CUSTOM' | string;
    scopeDescription?: string;
    geonameId?: number | null;
    calculatedAt: string;
    requestId?: string;
    persistedToDb?: boolean;
    dbMessage?: string;
  };
}

export interface LocationSuggestion {
  geonameId?: number | null;
  name: string;
  asciiName?: string;
  district?: string;
  state?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  population?: number | null;
  timezone?: string | null;
  displayName: string;
  source?: 'geonames' | 'local' | 'osm';
}

export interface CityRankingItem {
  id?: number;
  rank: number;
  name: string;
  state?: string;
  country: string;
  countryCode?: string;
  geonameId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  fiveYearAvgNdvi: number;
  minNdvi: number;
  maxNdvi: number;
  variance: number; // max - min
  stabilityScore: 'Ultra Stable' | 'High Stability' | 'Moderate' | 'Seasonal Shift';
  trend5Yr: number; // percentage change
  vegetationStatus: VegetationStatus;
  category: 'greenest' | 'stable' | 'vulnerable' | 'balanced';
  highlightBadge?: string;
  description?: string;
}

export interface RankingsResponse {
  summary: {
    totalCities: number;
    highestNdviCity: CityRankingItem;
    mostStableCity: CityRankingItem;
    lowestNdviCity: CityRankingItem;
    mostImprovedCity?: CityRankingItem;
  };
  rankings: CityRankingItem[];
}

export interface NdviApiRequest {
  area: string;
  geonameId?: number;
  district?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  analysisScope?: 'ADMINISTRATIVE_DISTRICT' | 'CITY_BUFFER_10KM' | 'CUSTOM';
  years?: number[];
  cloudThreshold?: number;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
  suggestion?: string;
}

// Database Entities
export interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbArea {
  id: number;
  name: string;
  normalized_name: string;
  state: string;
  country: string;
  area_km2: number;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbAnalysisRequest {
  id: string;
  user_id?: string | null;
  area_id?: number | null;
  requested_area_name: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  satellite_source: string;
  boundary_source: string;
  error_message?: string | null;
  ip_address?: string | null;
  created_at: Date;
  completed_at?: Date | null;
}

export interface DbNdviResult {
  id: number;
  analysis_request_id: string;
  area_id: number;
  year: number;
  avg_ndvi: number | null;
  min_ndvi: number | null;
  max_ndvi: number | null;
  vegetation_status: string | null;
  cloud_coverage_threshold: number;
  created_at: Date;
}

export interface DbReport {
  id: string;
  analysis_request_id: string;
  area_id: number;
  title: string;
  summary: string;
  overall_status: string;
  change_rate_5yr?: number | null;
  metadata_json?: Record<string, unknown>;
  created_at: Date;
  area_name?: string;
  state?: string;
  country?: string;
  area_km2?: number;
}

export interface SystemHealthStatus {
  earthEngine: {
    configured: boolean;
    authenticated: boolean;
    projectId?: string;
    clientEmail?: string;
    error?: string;
  };
  database: {
    configured: boolean;
    connected: boolean;
    tablesReady: boolean;
    error?: string;
  };
  environment: {
    nodeVersion: string;
    calendarYears: number[];
  };
}
