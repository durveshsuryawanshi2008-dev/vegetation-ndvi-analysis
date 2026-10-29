'use client';

import React, { useState, useRef } from 'react';
import { NdviAnalysisResponse } from '@/lib/types';
import { MetricsGrid } from './MetricsGrid';
import { DroughtPredictor } from './DroughtPredictor';
import { DroughtDropAlert } from './DroughtDropAlert';
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
  const [chartGranularity, setChartGranularity] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  const chartSectionRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDrilldown = (target: 'monthly' | 'weekly' = 'monthly') => {
    setChartGranularity(target);
    if (chartSectionRef.current) {
      chartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Clean state name if it contains numeric codes or is empty
  const rawState = (data.state || '').trim();
  const cleanState =
    rawState && !/^\d+$/.test(rawState) && rawState.toLowerCase() !== data.area.toLowerCase()
      ? rawState
      : '';

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-eco-neon/20 shadow-[0_0_30px_rgba(198,241,53,0.05)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-900 border border-eco-neon/40 text-eco-neon">
              Analysis Results
            </span>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                data.metadata?.analysisScope === 'CITY_BUFFER_10KM'
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/[0.04] border-white/10 text-zinc-400'
              }`}
            >
              {data.metadata?.analysisScope === 'CITY_BUFFER_10KM'
                ? 'Radial Buffer Fallback (10 km)'
                : 'Authoritative Administrative Boundary'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <span>{data.area}</span>
            <span className="text-zinc-500 font-normal text-lg sm:text-xl">
              &bull; {cleanState ? `${cleanState}, ` : ''}{data.country}
            </span>
          </h2>

          <p className="text-xs text-zinc-400 font-mono">
            {data.metadata?.scopeDescription ||
              `Analyzed across ${data.areaKm2.toLocaleString()} km² using Sentinel-2 L2A surface reflectance composites (2021–2025)`}
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
            Analysis verified and persisted in cloud database cache.
          </span>
        </div>
      ) : data.metadata?.dbMessage ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
          <Database className="w-4 h-4 shrink-0 text-zinc-500" />
          <span>
            Database notice: {data.metadata.dbMessage}.
          </span>
        </div>
      ) : null}

      {/* ── CRITICAL NOTIFICATION: Vegetation Drop Alert with Historical Precedent ── */}
      <DroughtDropAlert
        data={data}
        onDrilldownToMonths={() => handleDrilldown('monthly')}
      />

      {/* 1. Metrics Grid (Territory, Area Extent, Latest NDVI, Status) */}
      <MetricsGrid data={data} />

      {/* 2. Live Drought Early Warning & Prediction System */}
      {data.droughtPrediction && (
        <DroughtPredictor
          droughtPrediction={data.droughtPrediction}
          areaName={data.area}
          state={cleanState}
          country={data.country}
        />
      )}

      {/* 3. Multi-Temporal Line & Bar Graph (Touch to Drilldown Year -> Month -> Week) */}
      <div ref={chartSectionRef} className="scroll-mt-6">
        <NdviChart
          years={data.years}
          monthlyData={data.monthlyData}
          weeklyData={data.weeklyData}
          areaName={data.area}
          externalGranularity={chartGranularity}
          onGranularityChange={setChartGranularity}
        />
      </div>

      {/* 4. Year-Wise Data Table with Touch Drilldown to Months */}
      <YearlyTable
        years={data.years}
        onSelectYear={(year) => handleDrilldown('monthly')}
      />

      {/* 5. Scientific Interpretation and Ecological Threshold Guide */}
      <VegetationInterpretation />
    </div>
  );
}
