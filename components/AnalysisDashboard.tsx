'use client';

import React from 'react';
import { NdviAnalysisResponse } from '@/lib/types';
import { MetricsGrid } from './MetricsGrid';
import { NdviChart } from './NdviChart';
import { YearlyTable } from './YearlyTable';
import { VegetationInterpretation } from './VegetationInterpretation';
import { RotateCw, Database, CheckCircle2, AlertCircle, Share2, Printer, MapPin } from 'lucide-react';

interface AnalysisDashboardProps {
  data: NdviAnalysisResponse;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AnalysisDashboard({ data, onRefresh, isRefreshing }: AnalysisDashboardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-eco-neon/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-900 border border-eco-neon/40 text-eco-neon">
              Analysis Results
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              FAO Boundary: {data.metadata?.boundarySource || 'FAO/GAUL/2025/level2'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <span>{data.area}</span>
            <span className="text-zinc-500 font-normal text-lg sm:text-xl">
              &bull; {data.state ? `${data.state}, ` : ''}{data.country}
            </span>
          </h2>

          <p className="text-xs text-zinc-400 font-mono">
            Analyzed using Copernicus Sentinel-2 Level-2A surface reflectance composites across 5 complete calendar years
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-mono text-xs transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-eco-neon' : ''}`} />
            <span>{isRefreshing ? 'Recalculating...' : 'Refresh Analysis'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white font-mono text-xs transition-all"
            title="Print or save as PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Database Persistence Status Badge */}
      {data.metadata?.persistedToDb ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Successfully recorded in SQL database tables: <code>areas</code>, <code>analysis_requests</code>, <code>ndvi_results</code>, and <code>reports</code>.
          </span>
        </div>
      ) : data.metadata?.dbMessage ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
          <Database className="w-4 h-4 shrink-0 text-zinc-500" />
          <span>
            Database notice: {data.metadata.dbMessage}. (Configure <code>DATABASE_URL</code> in <code>.env.local</code> to auto-save to TiDB Cloud).
          </span>
        </div>
      ) : null}

      {/* 1. Metrics Grid (Territory, Area Extent, Latest NDVI, Status) */}
      <MetricsGrid data={data} />

      {/* 2. Five-Year Multi-Temporal Line Graph */}
      <NdviChart years={data.years} areaName={data.area} />

      {/* 3. Year-Wise Data Table */}
      <YearlyTable years={data.years} />

      {/* 4. Scientific Interpretation and Ecological Threshold Guide */}
      <VegetationInterpretation />
    </div>
  );
}
