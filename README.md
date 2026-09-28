# VEGETATION ANALYSIS & NDVI USING GOOGLE EARTH ENGINE
### College DBMS Capstone Project & Multispectral Geospatial Platform

An academic full-stack web application integrating **Google Earth Engine (GEE)** with **Copernicus Sentinel-2 Level-2A (Harmonized)** satellite imagery and a distributed **TiDB Cloud / MySQL** relational database to analyze 5-year multi-temporal vegetation trajectories across administrative districts.

---

## 🛰️ System Architecture & Workflow

```
[ User Enters District (e.g. Pune) ]
                │
                ▼
[ Next.js API Route: POST /api/ndvi ]
                │
                ├── 1. Google Earth Engine Authentication (Service Account JWT)
                ├── 2. Administrative Boundary Query (FAO/GAUL/2025/level2 via GAUL2_NAME)
                ├── 3. Extract Vector Boundary Geometry & Area (km²)
                ├── 4. Loop Last 5 Complete Calendar Years (2021, 2022, 2023, 2024, 2025)
                │      ├── Query COPERNICUS/S2_SR_HARMONIZED (< 30% cloudiness)
                │      ├── Cloud & Shadow Masking (SCL & QA60 bands)
                │      ├── Calculate NDVI: (B8 - B4) / (B8 + B4)
                │      └── Spatial Reducers: mean, min, max
                ├── 5. Determine Vegetation Status (<0.2, 0.2-0.5, 0.5-0.8, >0.8)
                └── 6. Relational DBMS Persistence (TiDB Cloud Starter / MySQL)
                       ├── Insert / Update `areas`
                       ├── Insert `analysis_requests`
                       ├── Insert 5 records into `ndvi_results`
                       └── Insert synthesized record into `reports`
                │
                ▼
[ Next.js Environmental UI Dashboard ]
  - Territory & Area Extent Cards
  - 5-Year Multi-Temporal Line Graph (Recharts)
  - Annual Breakdown Table
  - Biophysical Index Interpretation
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend**: Next.js Server-Side API Routes (`app/api/ndvi/route.ts`, `app/api/reports/route.ts`, `app/api/health/route.ts`)
- **Earth Engine Integration**: `@google/earthengine` JavaScript API via Google Cloud Service Account Private Key
- **Database**: TiDB Cloud Starter / MySQL-compatible SQL via `mysql2` connection pool
- **Satellite Data Source**: `COPERNICUS/S2_SR_HARMONIZED` (10m spatial resolution)
- **Administrative Boundaries**: `FAO/GAUL/2025/level2` (District-level boundaries)

---

## 🗄️ Relational Database Schema (TiDB Cloud / MySQL)

The system automatically initializes 5 relational tables on first connection:

1. **`users`**: Application researchers and students with audit timestamps.
2. **`areas`**: Normalized district registries with boundary area extent in square kilometers (`area_km2`).
3. **`analysis_requests`**: Audit log of each query with boundary source, satellite source, status, and IP address.
4. **`ndvi_results`**: 5-year time-series records holding `avg_ndvi`, `min_ndvi`, `max_ndvi`, and `vegetation_status`.
5. **`reports`**: Synthesized analytical reports containing overall health, 5-year trajectory change rate %, and JSON metadata.

Full SQL schema definition is located at [`scripts/schema.sql`](file:///Users/admin/Downloads/ndvi-analyzer/scripts/schema.sql).

---

## 🌿 Vegetation Index & Classification Standards

- **Formula**: `NDVI = (B8 - B4) / (B8 + B4)`
  - **Band 8 (NIR, 842 nm)**: High reflectance by plant cell spongy mesophyll.
  - **Band 4 (Red, 665 nm)**: High absorption by photosynthetic chlorophyll.
- **Classification Thresholds**:
  - `NDVI < 0.2`: **Very Low** (Water, bare soil, rock, urban concrete)
  - `0.2 - 0.5`: **Low/Moderate** (Sparse shrubland, dryland crops, transition zones)
  - `0.5 - 0.8`: **Healthy** (Dense crops, temperate forests, green canopies)
  - `> 0.8`: **Very Healthy** (Rainforests, dense biomass at peak vegetative vigor)

---

## 🔐 Credentials Setup Guide

> **Important Security**: Never commit credentials to version control. All private keys and connection strings reside strictly on the server in `.env.local` and are ignored in `.gitignore`.

### 1. Create `.env.local`
Copy the template:
```bash
cp .env.local.example .env.local
```

### 2. Required Variables:
```env
# Google Earth Engine Service Account
EARTH_ENGINE_PROJECT_ID=your-gcp-project-id
EARTH_ENGINE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
EARTH_ENGINE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# TiDB Cloud Starter / MySQL Database
DATABASE_URL="mysql://user:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/ndvi?ssl={"rejectUnauthorized":true}"
```

### 3. Google Earth Engine Step-by-Step:
1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable the **Earth Engine API** for your project.
3. Register your project for Earth Engine access at [code.earthengine.google.com](https://code.earthengine.google.com/).
4. Navigate to **IAM & Admin > Service Accounts** and click **Create Service Account**.
5. Grant the role **Earth Engine Resource Viewer** (or **Earth Engine Admin**).
6. Under the Service Account **Keys** tab, click **Add Key > Create New Key > JSON**.
7. From the downloaded JSON file:
   - Copy `project_id` into `EARTH_ENGINE_PROJECT_ID`.
   - Copy `client_email` into `EARTH_ENGINE_CLIENT_EMAIL`.
   - Copy `private_key` into `EARTH_ENGINE_PRIVATE_KEY` (ensure wrapping quotes if it has newlines).

### 4. TiDB Cloud Starter Step-by-Step:
1. Register for a free Serverless cluster at [tidbcloud.com](https://tidbcloud.com/).
2. Click **Connect** and select **Node.js** or **General MySQL**.
3. Generate your password and copy the connection string.
4. Paste it into `DATABASE_URL` in `.env.local`.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Start production server
npm run start

# Or run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
