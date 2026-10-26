import React from 'react';
import { NdviAnalysisResponse } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Globe, TrendingUp, TrendingDown, Layers, Calendar } from 'lucide-react';

interface MetricsGridProps {
  data: NdviAnalysisResponse;
}

export function MetricsGrid({ data }: MetricsGridProps) {
  // Find latest valid year
  const validYears = data.years.filter((y) => y.avgNdvi !== null);
  const latestYearData = validYears.length > 0 ? validYears[validYears.length - 1] : null;
  const firstYearData = validYears.length > 0 ? validYears[0] : null;

  let trendPercent: number | null = null;
  if (firstYearData?.avgNdvi && latestYearData?.avgNdvi && firstYearData.avgNdvi > 0) {
    trendPercent = Number(
      (((latestYearData.avgNdvi - firstYearData.avgNdvi) / firstYearData.avgNdvi) * 100).toFixed(1)
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Administrative Territory */}
      <div className="glass-panel rounded-2xl p-5 space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-mono uppercase tracking-wider">Territory</span>
          <Globe className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-display text-white tracking-tight truncate">
            {data.area}
          </h3>
          <p className="text-xs text-zinc-400 truncate">
            {data.state ? `${data.state}, ` : ''}{data.country}
          </p>
        </div>
        <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-white/5 flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-eco-neon shrink-0" />
          <span className="truncate">
            {data.metadata?.analysisScope === 'CITY_BUFFER_10KM'
              ? '10 km Radial Buffer'
              : data.metadata?.boundarySource
              ? data.metadata.boundarySource.replace('FAO/GAUL/', 'GAUL ')
              : 'Administrative Boundary'}
          </span>
        </div>
      </div>

      {/* 2. Boundary Area Size */}
      <div className="glass-panel rounded-2xl p-5 space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-mono uppercase tracking-wider">Area Extent</span>
          <Layers className="w-4 h-4 text-eco-neon" />
        </div>
        <div>
          <div className="text-2xl font-bold font-display text-white tracking-tight">
            {data.areaKm2 ? data.areaKm2.toLocaleString() : 'N/A'}
            <span className="text-xs text-eco-neon font-mono font-normal ml-1">km²</span>
          </div>
          <p className="text-xs text-zinc-400">Total administrative surface</p>
        </div>
        <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-white/5">
          Sentinel-2 10m grid masked
        </div>
      </div>

      {/* 3. Latest Year Average NDVI */}
      <div className="glass-panel rounded-2xl p-5 space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-mono uppercase tracking-wider">
            Latest NDVI ({latestYearData?.year || '2025'})
          </span>
          <Calendar className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-eco-neon tracking-tight">
            {latestYearData?.avgNdvi !== null && latestYearData?.avgNdvi !== undefined
              ? latestYearData.avgNdvi.toFixed(4)
              : 'N/A'}
          </div>
          <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
            <span>Range:</span>
            <span className="font-mono text-zinc-300">
              [{latestYearData?.minNdvi?.toFixed(2) ?? '-'} to {latestYearData?.maxNdvi?.toFixed(2) ?? '-'}]
            </span>
          </div>
        </div>
        <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-white/5">
          Copernicus Harmonized Median
        </div>
      </div>

      {/* 4. Current Status & 5-Year Trend */}
      <div className="glass-panel rounded-2xl p-5 space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-mono uppercase tracking-wider">Vegetation Health</span>
          {trendPercent !== null && trendPercent >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div className="pt-1">
          <StatusBadge status={latestYearData?.vegetationStatus ?? 'Unknown'} size="lg" />
          <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
            <span>5-Yr Trend:</span>
            {trendPercent !== null ? (
              <span
                className={`font-semibold ${
                  trendPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trendPercent > 0 ? `+${trendPercent}%` : `${trendPercent}%`}
              </span>
            ) : (
              <span className="text-zinc-500">N/A</span>
            )}
          </div>
        </div>
        <div className="pt-2 text-[11px] font-mono text-zinc-500 border-t border-white/5">
          Normalized scale [-1.0, +1.0]
        </div>
      </div>
    </div>
  );
}
