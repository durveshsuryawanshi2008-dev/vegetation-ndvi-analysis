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

export interface NdviAnalysisResponse {
  area: string;
  country: string;
  state: string;
  areaKm2: number;
  years: YearlyNdviResult[];
  metadata?: {
    satelliteSource: string;
    boundarySource: string;
    calculatedAt: string;
    requestId?: string;
    persistedToDb?: boolean;
    dbMessage?: string;
  };
}

export interface NdviApiRequest {
  area: string;
  district?: string;
  state?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
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
