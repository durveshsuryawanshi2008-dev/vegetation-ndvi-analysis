import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import crypto from 'crypto';
import { YearlyNdviResult, DbReport } from './types';

let pool: Pool | null = null;
let tablesInitialized = false;

/**
 * Returns a configured MySQL/TiDB connection pool.
 */
export function getDbPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return null;
  }

  if (pool) {
    return pool;
  }

  try {
    // Parse URL and configure options
    const url = new URL(databaseUrl.replace(/^mysql:\/\//, 'http://')); // parse helper
    const isTidb = databaseUrl.includes('tidbcloud.com') || databaseUrl.includes('tidb');

    const poolConfig: PoolOptions = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      // TiDB Cloud requires TLS/SSL
      ssl: isTidb || databaseUrl.includes('ssl=') ? { rejectUnauthorized: true } : undefined,
    };

    pool = mysql.createPool(poolConfig);
    return pool;
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    return null;
  }
}

/**
 * Automatically creates required tables in TiDB/MySQL if they do not already exist.
 */
export async function initializeDatabaseSchema(): Promise<boolean> {
  const db = getDbPool();
  if (!db) {
    return false;
  }

  if (tablesInitialized) {
    return true;
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'researcher',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      normalized_name VARCHAR(255) NOT NULL UNIQUE,
      state VARCHAR(255) NULL,
      country VARCHAR(255) NULL,
      area_km2 DECIMAL(12, 2) NULL,
      latitude DECIMAL(10, 6) NULL,
      longitude DECIMAL(10, 6) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_areas_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS analysis_requests (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      area_id INT NULL,
      requested_area_name VARCHAR(255) NOT NULL,
      status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
      satellite_source VARCHAR(100) DEFAULT 'COPERNICUS/S2_SR_HARMONIZED',
      boundary_source VARCHAR(100) DEFAULT 'FAO/GAUL/2025/level2',
      error_message TEXT NULL,
      ip_address VARCHAR(45) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      INDEX idx_req_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS ndvi_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      analysis_request_id VARCHAR(36) NOT NULL,
      area_id INT NOT NULL,
      year INT NOT NULL,
      avg_ndvi DECIMAL(6, 4) NULL,
      min_ndvi DECIMAL(6, 4) NULL,
      max_ndvi DECIMAL(6, 4) NULL,
      vegetation_status VARCHAR(50) NULL,
      cloud_coverage_threshold DECIMAL(5, 2) DEFAULT 30.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ndvi_req_year (analysis_request_id, year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY,
      analysis_request_id VARCHAR(36) NOT NULL,
      area_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      summary TEXT NULL,
      overall_status VARCHAR(50) NOT NULL,
      change_rate_5yr DECIMAL(6, 2) NULL,
      metadata_json JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reports_created (created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `INSERT IGNORE INTO users (id, email, name, role)
     VALUES ('00000000-0000-0000-0000-000000000001', 'guest@ndvi-analyzer.edu', 'DBMS Researcher', 'student');`,
  ];

  try {
    for (const sql of queries) {
      await db.execute(sql);
    }
    tablesInitialized = true;
    return true;
  } catch (error) {
    console.error('Database schema initialization error:', error);
    return false;
  }
}

export interface SaveAnalysisParams {
  areaName: string;
  state: string;
  country: string;
  areaKm2: number;
  years: YearlyNdviResult[];
  boundarySource?: string;
  satelliteSource?: string;
}

/**
 * Saves a completed NDVI analysis run to the relational database tables:
 * areas, analysis_requests, ndvi_results, and reports.
 */
export async function saveAnalysisToDatabase(params: SaveAnalysisParams): Promise<{
  success: boolean;
  requestId?: string;
  reportId?: string;
  error?: string;
}> {
  const db = getDbPool();
  if (!db) {
    return { success: false, error: 'Database not configured (DATABASE_URL missing)' };
  }

  try {
    await initializeDatabaseSchema();

    const normalizedName = params.areaName.trim().toLowerCase();
    const requestId = crypto.randomUUID();
    const reportId = crypto.randomUUID();

    // 1. Insert or update Area
    await db.execute(
      `INSERT INTO areas (name, normalized_name, state, country, area_km2, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE 
         state = VALUES(state),
         country = VALUES(country),
         area_km2 = VALUES(area_km2),
         updated_at = CURRENT_TIMESTAMP`,
      [params.areaName, normalizedName, params.state, params.country, params.areaKm2]
    );

    // Retrieve Area ID
    const [areaRows]: any = await db.execute(
      'SELECT id FROM areas WHERE normalized_name = ? LIMIT 1',
      [normalizedName]
    );

    if (!areaRows || areaRows.length === 0) {
      throw new Error('Failed to retrieve area record after insert');
    }
    const areaId = areaRows[0].id;

    // 2. Insert into analysis_requests
    await db.execute(
      `INSERT INTO analysis_requests 
        (id, user_id, area_id, requested_area_name, status, satellite_source, boundary_source, completed_at)
       VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, CURRENT_TIMESTAMP)`,
      [
        requestId,
        '00000000-0000-0000-0000-000000000001', // default guest user
        areaId,
        params.areaName,
        params.satelliteSource || 'COPERNICUS/S2_SR_HARMONIZED',
        params.boundarySource || 'FAO/GAUL/2025/level2',
      ]
    );

    // 3. Insert each year into ndvi_results
    for (const yr of params.years) {
      await db.execute(
        `INSERT INTO ndvi_results 
          (analysis_request_id, area_id, year, avg_ndvi, min_ndvi, max_ndvi, vegetation_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          requestId,
          areaId,
          yr.year,
          yr.avgNdvi,
          yr.minNdvi,
          yr.maxNdvi,
          yr.vegetationStatus,
        ]
      );
    }

    // 4. Calculate overall status & 5-year trend
    const validYears = params.years.filter((y) => y.avgNdvi !== null);
    let overallStatus = 'Unknown';
    let changeRate: number | null = null;

    if (validYears.length > 0) {
      const latest = validYears[validYears.length - 1];
      overallStatus = latest.vegetationStatus;

      if (validYears.length >= 2) {
        const first = validYears[0];
        if (first.avgNdvi && latest.avgNdvi && first.avgNdvi > 0) {
          changeRate = Number((((latest.avgNdvi - first.avgNdvi) / first.avgNdvi) * 100).toFixed(2));
        }
      }
    }

    const title = `NDVI Analysis: ${params.areaName} (${params.country})`;
    const summary = `Multi-temporal vegetation evaluation across ${params.years.length} complete years (2021-2025). Latest observed vegetation health is "${overallStatus}" with an area of ${params.areaKm2.toLocaleString()} km².`;

    // 5. Insert synthesized report
    await db.execute(
      `INSERT INTO reports 
        (id, analysis_request_id, area_id, title, summary, overall_status, change_rate_5yr, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        requestId,
        areaId,
        title,
        summary,
        overallStatus,
        changeRate,
        JSON.stringify({
          area: params.areaName,
          state: params.state,
          country: params.country,
          areaKm2: params.areaKm2,
          analyzedYears: params.years.map((y) => y.year),
        }),
      ]
    );

    return {
      success: true,
      requestId,
      reportId,
    };
  } catch (error) {
    console.error('Error saving NDVI analysis to database:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}


/**
 * Retrieves a previously completed 2021-2025 NDVI analysis from TiDB.
 *
 * This is used as a cache so repeated analyses of the same district
 * do not unnecessarily call Google Earth Engine again.
 */
export async function getCachedAnalysis(
  areaName: string,
  satelliteSource = 'COPERNICUS/S2_SR_HARMONIZED',
  boundarySource = 'FAO/GAUL/2025/level2'
): Promise<{
  request: any;
  years: YearlyNdviResult[];
} | null> {
  const db = getDbPool();

  if (!db) {
    return null;
  }

  try {
    await initializeDatabaseSchema();

    const normalizedName = areaName.trim().toLowerCase();

    const [requestRows]: any = await db.execute(
      `SELECT
         ar.id,
         ar.requested_area_name,
         ar.satellite_source,
         ar.boundary_source,
         ar.status,
         ar.completed_at,
         a.name AS area_name,
         a.state,
         a.country,
         a.area_km2
       FROM analysis_requests ar
       INNER JOIN areas a ON ar.area_id = a.id
       WHERE LOWER(a.name) = ?
         AND ar.status = 'COMPLETED'
         AND ar.satellite_source = ?
         AND ar.boundary_source = ?
       ORDER BY ar.completed_at DESC
       LIMIT 1`,
      [normalizedName, satelliteSource, boundarySource]
    );

    if (!requestRows || requestRows.length === 0) {
      return null;
    }

    const request = requestRows[0];

    const [ndviRows]: any = await db.execute(
      `SELECT
         year,
         avg_ndvi AS avgNdvi,
         min_ndvi AS minNdvi,
         max_ndvi AS maxNdvi,
         vegetation_status AS vegetationStatus
       FROM ndvi_results
       WHERE analysis_request_id = ?
         AND year IN (2021, 2022, 2023, 2024, 2025)
       ORDER BY year ASC`,
      [request.id]
    );

    if (!ndviRows || ndviRows.length !== 5) {
      return null;
    }

    const years: YearlyNdviResult[] = ndviRows.map((row: any) => ({
      year: Number(row.year),
      avgNdvi:
        row.avgNdvi === null || row.avgNdvi === undefined
          ? null
          : Number(row.avgNdvi),
      minNdvi:
        row.minNdvi === null || row.minNdvi === undefined
          ? null
          : Number(row.minNdvi),
      maxNdvi:
        row.maxNdvi === null || row.maxNdvi === undefined
          ? null
          : Number(row.maxNdvi),
      vegetationStatus: row.vegetationStatus || 'Unknown',
      imageCount: 0,
    }));

    return {
      request,
      years,
    };
  } catch (error) {
    console.warn('NDVI cache lookup warning:', error);
    return null;
  }
}

/**
 * Fetches historical reports with area details from the database.
 */
export async function getReports(limit = 25): Promise<DbReport[]> {
  const db = getDbPool();
  if (!db) {
    return [];
  }

  try {
    await initializeDatabaseSchema();

    const [rows]: any = await db.execute(
      `SELECT 
        r.id,
        r.analysis_request_id,
        r.area_id,
        r.title,
        r.summary,
        r.overall_status,
        r.change_rate_5yr,
        r.metadata_json,
        r.created_at,
        a.name AS area_name,
        a.state,
        a.country,
        a.area_km2
       FROM reports r
       INNER JOIN areas a ON r.area_id = a.id
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return rows as DbReport[];
  } catch (error) {
    console.error('Error fetching reports from database:', error);
    return [];
  }
}

/**
 * Retrieves detailed multi-year NDVI results for a specific request ID.
 */
export async function getRequestResults(requestId: string): Promise<any> {
  const db = getDbPool();
  if (!db) return null;

  try {
    const [reqRows]: any = await db.execute(
      `SELECT ar.*, a.name AS area_name, a.state, a.country, a.area_km2
       FROM analysis_requests ar
       LEFT JOIN areas a ON ar.area_id = a.id
       WHERE ar.id = ? LIMIT 1`,
      [requestId]
    );

    if (!reqRows || reqRows.length === 0) return null;

    const [ndviRows]: any = await db.execute(
      `SELECT year, avg_ndvi as avgNdvi, min_ndvi as minNdvi, max_ndvi as maxNdvi, vegetation_status as vegetationStatus
       FROM ndvi_results
       WHERE analysis_request_id = ?
       ORDER BY year ASC`,
      [requestId]
    );

    return {
      request: reqRows[0],
      years: ndviRows,
    };
  } catch (error) {
    console.error('Error fetching request results:', error);
    return null;
  }
}

/**
 * Diagnostic check for TiDB / MySQL database connection
 */
export async function getDatabaseStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  tablesReady: boolean;
  error?: string;
}> {
  const db = getDbPool();
  if (!db) {
    return {
      configured: false,
      connected: false,
      tablesReady: false,
      error: 'DATABASE_URL environment variable is not set.',
    };
  }

  try {
    const [rows]: any = await db.query('SELECT 1 as ping');
    if (!rows || rows.length === 0) {
      throw new Error('Database ping query returned no results');
    }

    const ready = await initializeDatabaseSchema();

    return {
      configured: true,
      connected: true,
      tablesReady: ready,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      tablesReady: false,
      error: (err as Error).message,
    };
  }
}
