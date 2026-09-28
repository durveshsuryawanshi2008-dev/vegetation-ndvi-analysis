import React from 'react';
import {
  Satellite,
  Database,
  Layers,
  Code,
  Key,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BookOpen,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const dbTables = [
    {
      name: 'users',
      purpose: 'Stores application researchers, analysts, and student accounts with timestamp audits.',
      columns: ['id (UUID PK)', 'email (UNIQUE)', 'name', 'role', 'created_at', 'updated_at'],
    },
    {
      name: 'areas',
      purpose: 'Geographic entity registry for administrative districts (e.g., Pune, Nashik) with boundary area size in km².',
      columns: ['id (INT PK)', 'name', 'normalized_name (UNIQUE)', 'state', 'country', 'area_km2', 'created_at'],
    },
    {
      name: 'analysis_requests',
      purpose: 'Audit log tracking every user query, execution status (PENDING, COMPLETED, FAILED), and boundary/satellite source.',
      columns: ['id (UUID PK)', 'user_id (FK)', 'area_id (FK)', 'requested_area_name', 'status', 'completed_at'],
    },
    {
      name: 'ndvi_results',
      purpose: '5-year time series records storing average, minimum, maximum NDVI, cloud threshold, and vegetation status.',
      columns: ['id (INT PK)', 'analysis_request_id (FK)', 'area_id (FK)', 'year', 'avg_ndvi', 'min_ndvi', 'max_ndvi', 'vegetation_status'],
    },
    {
      name: 'reports',
      purpose: 'Synthesized intelligence reports summarizing 5-year vegetative trajectory, overall health status, and percentage trends.',
      columns: ['id (UUID PK)', 'analysis_request_id (FK)', 'area_id (FK)', 'title', 'summary', 'overall_status', 'change_rate_5yr', 'metadata_json'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Title */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-900 border border-eco-700 text-eco-neon text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>COLLEGE DBMS CAPSTONE PROJECT DOCUMENTATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
          Vegetation Analysis &amp; NDVI Using Google Earth Engine
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
          An end-to-end full-stack geospatial architecture combining Google Earth Engine server-side
          remote sensing pipelines with a distributed TiDB Cloud / MySQL relational database.
        </p>
      </div>

      {/* Earth Engine Pipeline Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 rounded-xl bg-eco-900 border border-eco-700 text-eco-neon">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">
              Earth Engine Remote Sensing Pipeline
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Server-side computation with Copernicus Sentinel-2 Level-2A &amp; FAO GAUL
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-eco-neon uppercase font-semibold">1. Administrative Boundaries</div>
            <h4 className="font-bold text-white text-base">FAO/GAUL/2025/level2</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Boundaries are queried via administrative district attributes (<code className="text-eco-neon font-mono">GAUL2_NAME</code> / <code className="text-eco-neon font-mono">ADM2_NAME</code>). The exact vector geometry is resolved server-side, and total surface area is computed in square kilometers.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-eco-neon uppercase font-semibold">2. Satellite Image Collection</div>
            <h4 className="font-bold text-white text-base">COPERNICUS/S2_SR_HARMONIZED</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Filters Copernicus Sentinel-2 Bottom-Of-Atmosphere (BOA) Surface Reflectance imagery for each calendar year (2021&ndash;2025), bounded by the district geometry with &lt; 30% cloudiness.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-eco-neon uppercase font-semibold">3. Cloud Masking &amp; Reducer</div>
            <h4 className="font-bold text-white text-base">SCL &amp; QA60 Scene Mask</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Excludes cloud shadows (SCL 3), medium/high probability clouds (SCL 8, 9), cirrus (SCL 10), and snow. Generates annual median cloud-free composites and reduces spatial metrics: mean, min, max.
            </p>
          </div>
        </div>

        {/* NDVI Mathematical Formula Box */}
        <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
            <span>NDVI Mathematical Formulation &amp; Thresholds</span>
          </h3>
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-eco-neon text-center text-lg sm:text-xl font-bold tracking-wider">
            NDVI = (Band 8 [NIR] - Band 4 [Red]) / (Band 8 [NIR] + Band 4 [Red])
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300">
              <strong className="block text-white">&lt; 0.2: Very Low</strong>
              Water, concrete, barren soil, rock.
            </div>
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
              <strong className="block text-white">0.2 &ndash; 0.5: Low/Moderate</strong>
              Shrubs, sparse vegetation, transition crops.
            </div>
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
              <strong className="block text-white">0.5 &ndash; 0.8: Healthy</strong>
              Dense agricultural crops, temperate foliage.
            </div>
            <div className="p-3 rounded-lg bg-eco-900/40 border border-eco-neon/40 text-eco-neon">
              <strong className="block text-white">&gt; 0.8: Very Healthy</strong>
              Tropical rainforests, peak canopy biomass.
            </div>
          </div>
        </div>
      </section>

      {/* Relational Database DBMS Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 rounded-xl bg-eco-900 border border-cyan-500/50 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">
              Relational Database Architecture (TiDB Cloud / MySQL)
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Normalized relational schema with referential integrity and audit trails
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbTables.map((tbl) => (
            <div key={tbl.name} className="glass-panel rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>{tbl.name}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                  InnoDB
                </span>
              </div>
              <p className="text-xs text-zinc-300">{tbl.purpose}</p>
              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Columns</span>
                <ul className="text-[11px] font-mono text-zinc-400 space-y-0.5">
                  {tbl.columns.map((col) => (
                    <li key={col} className="truncate">&bull; {col}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Credentials Configuration Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 rounded-xl bg-eco-900 border border-amber-500/50 text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-white">
              Security &amp; Environment Setup Guide
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Strict security isolation: credentials remain exclusively on the server
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>How to Configure Real Credentials in .env.local</span>
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Create a file named <code className="text-eco-neon font-mono">.env.local</code> in the root directory (based on <code className="text-zinc-300 font-mono">.env.local.example</code>). It will never be committed to git.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-zinc-300 space-y-1">
              <div className="text-zinc-500"># Google Earth Engine Service Account</div>
              <div className="text-eco-neon">EARTH_ENGINE_PROJECT_ID=&lt;your-gcp-project-id&gt;</div>
              <div className="text-eco-neon">EARTH_ENGINE_CLIENT_EMAIL=&lt;service-account@project.iam.gserviceaccount.com&gt;</div>
              <div className="text-eco-neon">EARTH_ENGINE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n&quot;</div>
              <div className="pt-2 text-zinc-500"># TiDB Cloud Starter / MySQL Database</div>
              <div className="text-cyan-400">DATABASE_URL=&quot;mysql://user:pass@host:4000/dbname?ssl={JSON.stringify({ rejectUnauthorized: true })}&quot;</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <strong className="text-white font-mono block">Google Earth Engine Steps:</strong>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Go to Google Cloud Console and select/create a project.</li>
                  <li>Enable Earth Engine API and register the project at <a href="https://code.earthengine.google.com/" target="_blank" rel="noreferrer" className="text-eco-neon underline">code.earthengine.google.com</a>.</li>
                  <li>Create a Service Account and grant <code className="text-zinc-200">Earth Engine Resource Viewer</code> or Admin.</li>
                  <li>Generate a JSON private key and paste the details into <code className="text-zinc-200">.env.local</code>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <strong className="text-white font-mono block">TiDB Cloud Starter Steps:</strong>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Create a free TiDB Cloud Serverless / Starter cluster at <a href="https://tidbcloud.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline">tidbcloud.com</a>.</li>
                  <li>Click <strong>Connect</strong> and choose Node.js / MySQL.</li>
                  <li>Copy the connection string and paste into <code className="text-zinc-200">DATABASE_URL</code>.</li>
                  <li>The app automatically creates tables (<code className="text-zinc-200">users</code>, <code className="text-zinc-200">areas</code>, etc.) on first run!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
