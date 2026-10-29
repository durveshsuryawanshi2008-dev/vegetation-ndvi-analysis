/**
 * TypeScript Definitions for Vegetation Analysis & NDVI application
 */

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

export interface WeeklyNdviResult {
  period: string; // e.g. "Week 1", "Week 2"
  label: string; // e.g. "Oct 1 - 7"
  startDate: string;
  endDate: string;
  avgNdvi: number | null;
  vegetationStatus: VegetationStatus;
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
