-- ====================================================================
-- College DBMS Project: VEGETATION ANALYSIS & NDVI USING GOOGLE EARTH ENGINE
-- Database Schema for TiDB Cloud / MySQL-Compatible SQL
-- ====================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'researcher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Areas Table (Geographic Administrative Boundaries)
CREATE TABLE IF NOT EXISTS areas (
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
    INDEX idx_areas_name (name),
    INDEX idx_areas_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Analysis Requests Table (Audit log of each user query)
CREATE TABLE IF NOT EXISTS analysis_requests (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    INDEX idx_req_status (status),
    INDEX idx_req_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. NDVI Results Table (5-year time series per analysis request)
CREATE TABLE IF NOT EXISTS ndvi_results (
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
    FOREIGN KEY (analysis_request_id) REFERENCES analysis_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_ndvi_year (year),
    INDEX idx_ndvi_req_year (analysis_request_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reports Table (Synthesized vegetation intelligence reports)
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    analysis_request_id VARCHAR(36) NOT NULL,
    area_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    overall_status VARCHAR(50) NOT NULL,
    change_rate_5yr DECIMAL(6, 2) NULL,
    metadata_json JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_request_id) REFERENCES analysis_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    INDEX idx_reports_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Guest User for anonymous analyses
INSERT IGNORE INTO users (id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'guest@ndvi-analyzer.edu', 'DBMS Researcher', 'student');
