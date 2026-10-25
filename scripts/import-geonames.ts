import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import readline from 'readline';
import { getDbPool, initializeDatabaseSchema } from '../lib/database';
import { normalizeSearchText } from '../lib/countries';

const ZIP_PATH = path.resolve(process.cwd(), 'data/geonames-cities500.zip');
const BATCH_SIZE = 1000;

/**
 * Validates zip archive integrity using unzip -t
 */
async function validateArchive(filePath: string): Promise<boolean> {
  if (!fs.existsSync(filePath)) {
    console.error(`Archive file does not exist: ${filePath}`);
    return false;
  }

  return new Promise((resolve) => {
    const proc = spawn('unzip', ['-t', filePath]);
    proc.on('close', (code) => {
      resolve(code === 0);
    });
    proc.on('error', () => resolve(false));
  });
}

/**
 * Ensures geonames_cities table exists with appropriate indexes
 */
async function ensureGeonamesTable(db: any) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS geonames_cities (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await db.query(ddl);
}

/**
 * Inserts a batch of parsed GeoNames records
 */
async function insertBatch(db: any, rows: any[]): Promise<number> {
  if (rows.length === 0) return 0;

  const placeholders = rows
    .map(
      () =>
        '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .join(', ');

  const values: any[] = [];
  for (const r of rows) {
    values.push(
      r.geonameId,
      r.name,
      r.asciiName,
      r.alternateNames,
      r.latitude,
      r.longitude,
      r.featureClass,
      r.featureCode,
      r.countryCode,
      r.admin1Code,
      r.admin2Code,
      r.population,
      r.elevation,
      r.timezone,
      r.modificationDate,
      r.normalizedName
    );
  }

  const sql = `
    INSERT INTO geonames_cities 
      (geoname_id, name, ascii_name, alternate_names, latitude, longitude, 
       feature_class, feature_code, country_code, admin1_code, admin2_code, 
       population, elevation, timezone, modification_date, normalized_name)
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      ascii_name = VALUES(ascii_name),
      alternate_names = VALUES(alternate_names),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      population = VALUES(population),
      timezone = VALUES(timezone),
      normalized_name = VALUES(normalized_name);
  `;

  await db.query(sql, values);
  return rows.length;
}

export async function importGeoNames(force = false) {
  console.log('=== GeoNames Worldwide City Importer ===');
  console.log(`Source archive: ${ZIP_PATH}`);

  // 1. Validate Archive
  console.log('Validating ZIP archive integrity...');
  const isValid = await validateArchive(ZIP_PATH);
  if (!isValid) {
    throw new Error(`ZIP archive validation failed for ${ZIP_PATH}`);
  }
  console.log('Archive integrity verified: valid ZIP format.');

  // 2. Database connection & schema
  const db = getDbPool();
  if (!db) {
    throw new Error('Database connection failed. Check DATABASE_URL in .env.local');
  }

  await initializeDatabaseSchema();
  await ensureGeonamesTable(db);

  // Check if already populated
  const [[existingCount]]: any = await db.query(
    'SELECT COUNT(*) as cnt FROM geonames_cities'
  );
  console.log(`Current records in geonames_cities: ${existingCount.cnt}`);

  if (existingCount.cnt > 100000 && !force) {
    console.log(
      'geonames_cities table is already populated with >100,000 cities. Use --force to re-import.'
    );
    return {
      totalRead: 0,
      imported: 0,
      skipped: existingCount.cnt,
      failed: 0,
    };
  }

  // 3. Stream from ZIP
  console.log('Starting streaming extraction of cities500.txt...');
  const startTime = Date.now();

  const unzipProc = spawn('unzip', ['-p', ZIP_PATH, 'cities500.txt']);
  const rl = readline.createInterface({
    input: unzipProc.stdout as unknown as NodeJS.ReadableStream,
    crlfDelay: Infinity,
  });

  let totalRead = 0;
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let batch: any[] = [];

  for await (const line of (rl as unknown as AsyncIterable<string>)) {
    if (!line.trim()) continue;
    totalRead++;

    try {
      const parts = line.split('\t');
      if (parts.length < 15) {
        skipped++;
        continue;
      }

      const geonameId = parseInt(parts[0], 10);
      const name = parts[1].trim().slice(0, 200);
      const asciiName = parts[2].trim().slice(0, 200);
      const altNames = parts[3] ? parts[3].trim().slice(0, 2000) : null;
      const latitude = parseFloat(parts[4]);
      const longitude = parseFloat(parts[5]);
      const featureClass = parts[6]?.trim() || null;
      const featureCode = parts[7]?.trim() || null;
      const countryCode = parts[8]?.trim().toUpperCase().slice(0, 2) || '';
      const admin1Code = parts[10]?.trim().slice(0, 20) || null;
      const admin2Code = parts[11]?.trim().slice(0, 80) || null;
      const population = parts[14] ? parseInt(parts[14], 10) : 0;
      const elevation = parts[15] && parts[15].trim() ? parseInt(parts[15], 10) : null;
      const timezone = parts[17]?.trim().slice(0, 40) || null;
      const modificationDate = parts[18]?.trim() || null;

      if (!geonameId || Number.isNaN(latitude) || Number.isNaN(longitude) || !countryCode) {
        skipped++;
        continue;
      }

      const normalizedName = normalizeSearchText(asciiName || name);

      batch.push({
        geonameId,
        name,
        asciiName,
        alternateNames: altNames,
        latitude,
        longitude,
        featureClass,
        featureCode,
        countryCode,
        admin1Code,
        admin2Code,
        population: Number.isNaN(population) ? 0 : population,
        elevation: Number.isNaN(elevation) ? null : elevation,
        timezone,
        modificationDate,
        normalizedName,
      });

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(db, batch);
        imported += batch.length;
        batch = [];

        if (imported % 25000 === 0 || imported === BATCH_SIZE) {
          const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(
            `Progress: ${imported.toLocaleString()} cities imported (${elapsedSec}s elapsed)...`
          );
        }
      }
    } catch (rowErr) {
      failed++;
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    await insertBatch(db, batch);
    imported += batch.length;
    batch = [];
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n=== Import Complete ===');
  console.log(`Total records read: ${totalRead.toLocaleString()}`);
  console.log(`Successfully imported/updated: ${imported.toLocaleString()}`);
  console.log(`Skipped invalid records: ${skipped.toLocaleString()}`);
  console.log(`Failed batches/records: ${failed.toLocaleString()}`);
  console.log(`Elapsed time: ${durationSec} seconds`);

  return { totalRead, imported, skipped, failed };
}

// Allow CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const forceFlag = process.argv.includes('--force');
  importGeoNames(forceFlag)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}
