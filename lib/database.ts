import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import crypto from 'crypto';
import dns from 'node:dns';
import { YearlyNdviResult, DbReport } from './types';

// Force Node.js DNS to prefer IPv4 first. Prevents 'getaddrinfo ENOTFOUND' on macOS/mobile hotspot dual-stack networks.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignored in runtimes without setDefaultResultOrder
}

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
    const url = new URL(databaseUrl.replace(/^mysql:\/\//, 'http://'));
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
 * Automatically creates required tables in TiDB/MySQL and runs non-destructive migrations.
 */
export async function initializeDatabaseSchema(): Promise<boolean> {
  const db = getDbPool();
  if (!db) {
    return false;
  }

  if (tablesInitialized) {
    return true;
  }

  const baseQueries = [
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
      normalized_name VARCHAR(255) NOT NULL,
      state VARCHAR(255) NULL,
      country VARCHAR(255) NULL,
      area_km2 DECIMAL(12, 2) NULL,
      latitude DECIMAL(10, 6) NULL,
      longitude DECIMAL(10, 6) NULL,
      geoname_id INT NULL,
      country_code VARCHAR(10) NULL,
      admin1_code VARCHAR(50) NULL,
      analysis_scope VARCHAR(50) DEFAULT 'ADMINISTRATIVE_DISTRICT',
      boundary_source VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_areas_name (name),
      INDEX idx_areas_norm (normalized_name),
      INDEX idx_areas_geoname (geoname_id)
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

    `CREATE TABLE IF NOT EXISTS geonames_cities (
      geoname_id INT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      ascii_name VARCHAR(200) NOT NULL,
      alternate_names VARCHAR(2000) NULL,
      latitude DECIMAL(10, 7) NOT NULL,
      longitude DECIMAL(10, 7) NOT NULL,
      feature_class CHAR(1) NULL,
      feature_code VARCHAR(10) NULL,
      country_code VARCHAR(2) NOT NULL,
      admin1_code VARCHAR(20) NULL,
      admin2_code VARCHAR(80) NULL,
      population BIGINT NULL,
      elevation INT NULL,
      timezone VARCHAR(40) NULL,
      modification_date DATE NULL,
      normalized_name VARCHAR(200) NOT NULL,
      INDEX idx_geo_norm (normalized_name(50)),
      INDEX idx_geo_ascii (ascii_name(50)),
      INDEX idx_geo_country_pop (country_code, population DESC),
      INDEX idx_geo_pop (population DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    `INSERT IGNORE INTO users (id, email, name, role)
     VALUES ('00000000-0000-0000-0000-000000000001', 'guest@ndvi-analyzer.edu', 'DBMS Researcher', 'student');`,
  ];

  try {
    for (const sql of baseQueries) {
      await db.execute(sql);
    }

    // Non-destructive column migrations on areas
    await runNonDestructiveMigrations(db);

    tablesInitialized = true;
    return true;
  } catch (error) {
    console.error('Database schema initialization error:', error);
    return false;
  }
}

/**
 * Non-destructive schema migration:
 * 1. Safely adds geoname_id, country_code, analysis_scope, boundary_source to areas table.
 * 2. Safely removes rigid single-column normalized_name UNIQUE index to allow cities with duplicate names.
 * 3. Adds indexes for fast lookup without affecting existing IDs or foreign key relationships.
 */
async function runNonDestructiveMigrations(db: Pool) {
  try {
    const [cols]: any = await db.query('DESCRIBE areas');
    const colNames = new Set(cols.map((c: any) => c.Field));

    if (!colNames.has('geoname_id')) {
      await db.query('ALTER TABLE areas ADD COLUMN geoname_id INT NULL AFTER longitude');
    }
    if (!colNames.has('country_code')) {
      await db.query('ALTER TABLE areas ADD COLUMN country_code VARCHAR(10) NULL AFTER geoname_id');
    }
    if (!colNames.has('admin1_code')) {
      await db.query('ALTER TABLE areas ADD COLUMN admin1_code VARCHAR(50) NULL AFTER country_code');
    }
    if (!colNames.has('analysis_scope')) {
      await db.query("ALTER TABLE areas ADD COLUMN analysis_scope VARCHAR(50) DEFAULT 'ADMINISTRATIVE_DISTRICT' AFTER admin1_code");
    }
    if (!colNames.has('boundary_source')) {
      await db.query('ALTER TABLE areas ADD COLUMN boundary_source VARCHAR(100) NULL AFTER analysis_scope');
    }

    // Check indexes on areas
    const [indexes]: any = await db.query('SHOW INDEX FROM areas');
    const indexNames = new Set(indexes.map((i: any) => i.Key_name));

    // If normalized_name unique index exists, drop it and replace with non-unique index
    const normIndex = indexes.find((i: any) => i.Key_name === 'normalized_name');
    if (normIndex && normIndex.Non_unique === 0) {
      await db.query('ALTER TABLE areas DROP INDEX normalized_name, ADD INDEX idx_areas_normalized (normalized_name)');
    }

    if (!indexNames.has('idx_areas_geoname')) {
      await db.query('ALTER TABLE areas ADD INDEX idx_areas_geoname (geoname_id)');
    }
    if (!indexNames.has('idx_areas_country')) {
      await db.query('ALTER TABLE areas ADD INDEX idx_areas_country (country)');
    }
  } catch (migrationErr) {
    console.warn('Non-destructive migration warning (continuing safely):', migrationErr);
  }
}

export interface SaveAnalysisParams {
  areaName: string;
  geonameId?: number | null;
  state: string;
  country: string;
  countryCode?: string;
  areaKm2: number;
  latitude?: number | null;
  longitude?: number | null;
  analysisScope?: string;
  boundarySource?: string;
  satelliteSource?: string;
  years: YearlyNdviResult[];
}

/**
 * Saves a completed NDVI analysis run to relational database tables:
 * areas, analysis_requests, ndvi_results, and reports.
 * Uses geoname_id and composite place identity to safely prevent cross-city collisions.
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

    let areaId: number | null = null;

    // 1. Identify existing area record safely
    if (params.geonameId) {
      const [geoRows]: any = await db.execute(
        'SELECT id FROM areas WHERE geoname_id = ? LIMIT 1',
        [params.geonameId]
      );
      if (geoRows && geoRows.length > 0) {
        areaId = geoRows[0].id;
      }
    }

    if (!areaId) {
      const [nameRows]: any = await db.execute(
        `SELECT id FROM areas 
         WHERE (normalized_name = ? OR LOWER(name) = ?)
           AND (LOWER(country) = ? OR ? IS NULL)
           AND (state IS NULL OR LOWER(state) = ? OR ? IS NULL)
         LIMIT 1`,
        [
          normalizedName,
          normalizedName,
          params.country.toLowerCase(),
          params.country.toLowerCase(),
          params.state ? params.state.toLowerCase() : null,
          params.state ? params.state.toLowerCase() : null,
        ]
      );
      if (nameRows && nameRows.length > 0) {
        areaId = nameRows[0].id;
      }
    }

    // 2. Insert or update area record
    if (areaId) {
      await db.execute(
        `UPDATE areas SET 
           name = ?, state = ?, country = ?, area_km2 = ?, 
           latitude = ?, longitude = ?, geoname_id = COALESCE(?, geoname_id),
           country_code = COALESCE(?, country_code),
           analysis_scope = COALESCE(?, analysis_scope),
           boundary_source = COALESCE(?, boundary_source),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          params.areaName,
          params.state,
          params.country,
          params.areaKm2,
          params.latitude ?? null,
          params.longitude ?? null,
          params.geonameId ?? null,
          params.countryCode ?? null,
          params.analysisScope ?? 'ADMINISTRATIVE_DISTRICT',
          params.boundarySource ?? null,
          areaId,
        ]
      );
    } else {
      const [insertResult]: any = await db.execute(
        `INSERT INTO areas 
           (name, normalized_name, state, country, area_km2, latitude, longitude, 
            geoname_id, country_code, analysis_scope, boundary_source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          params.areaName,
          normalizedName,
          params.state,
          params.country,
          params.areaKm2,
          params.latitude ?? null,
          params.longitude ?? null,
          params.geonameId ?? null,
          params.countryCode ?? null,
          params.analysisScope ?? 'ADMINISTRATIVE_DISTRICT',
          params.boundarySource ?? null,
        ]
      );
      areaId = insertResult.insertId;
    }

    if (!areaId) {
      throw new Error('Failed to resolve or create area record');
    }

    // 3. Insert into analysis_requests
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

    // 4. Insert each year into ndvi_results
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

    // 5. Calculate overall status & 5-year trend
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

    // 6. Insert synthesized report
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
          geonameId: params.geonameId,
          state: params.state,
          country: params.country,
          countryCode: params.countryCode,
          areaKm2: params.areaKm2,
          analysisScope: params.analysisScope,
          boundarySource: params.boundarySource,
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
 * Retrieves a previously completed 2021-2025 NDVI analysis from database cache.
 * Matches on geoname_id, coordinates, or verified country/state identity to prevent cross-city collisions.
 */
export async function getCachedAnalysis(
  areaName: string,
  options?: {
    geonameId?: number | null;
    country?: string;
    state?: string;
    coordinates?: { latitude: number; longitude: number };
    analysisScope?: string;
  },
  satelliteSource = 'COPERNICUS/S2_SR_HARMONIZED'
): Promise<{
  request: any;
  years: YearlyNdviResult[];
} | null> {
  const db = getDbPool();
  if (!db) return null;

  try {
    await initializeDatabaseSchema();

    const normalizedName = areaName.trim().toLowerCase();
    let querySql = `
      SELECT
        ar.id,
        ar.requested_area_name,
        ar.satellite_source,
        ar.boundary_source,
        ar.status,
        ar.completed_at,
        a.id AS area_id,
        a.name AS area_name,
        a.state,
        a.country,
        a.country_code,
        a.area_km2,
        a.latitude,
        a.longitude,
        a.geoname_id,
        a.analysis_scope
      FROM analysis_requests ar
      INNER JOIN areas a ON ar.area_id = a.id
      WHERE ar.status = 'COMPLETED'
        AND ar.satellite_source = ?
    `;

    const queryParams: any[] = [satelliteSource];

    // Priority 1: Match by stable geoname_id
    if (options?.geonameId) {
      querySql += ' AND a.geoname_id = ?';
      queryParams.push(options.geonameId);
    }
    // Priority 2: Match by coordinates (within ~5 km bounding tolerance)
    else if (options?.coordinates?.latitude && options?.coordinates?.longitude) {
      querySql += ' AND ABS(a.latitude - ?) < 0.05 AND ABS(a.longitude - ?) < 0.05';
      queryParams.push(options.coordinates.latitude, options.coordinates.longitude);
    }
    // Priority 3: Match by normalized name and country
    else {
      querySql += `
        AND (LOWER(a.name) = ? OR LOWER(ar.requested_area_name) = ? OR LOWER(a.normalized_name) = ?)
        ${options?.country ? 'AND LOWER(a.country) = ?' : ''}
      `;
      queryParams.push(normalizedName, normalizedName, normalizedName);
      if (options?.country) {
        queryParams.push(options.country.trim().toLowerCase());
      }
    }

    querySql += ' ORDER BY ar.completed_at DESC LIMIT 1';

    const [requestRows]: any = await db.execute(querySql, queryParams);

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
 * Fetches historical reports with area details from database.
 */
export async function getReports(limit = 25): Promise<DbReport[]> {
  const db = getDbPool();
  if (!db) return [];

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
