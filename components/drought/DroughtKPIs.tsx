'use client';

import React from 'react';
import {
  Activity,
  Waves,
  TrendingDown,
  TrendingUp,
  CloudRain,
  Sprout,
  Droplet,
} from 'lucide-react';
import { VciClassification } from '@/lib/types';

interface DroughtKPIsProps {
  currentNdvi: number | null;
  currentVci: number | null;
  vciClassification: VciClassification;
  currentAnomaly: number | null;
  currentAnomalyPercent: number | null;
  rainfallMm: number | null;
  historicalAvgRainfallMm: number | null;
  rainfallDeficitPercent: number | null;
}

export function DroughtKPIs({
  currentNdvi,
  currentVci,
  vciClassification,
  currentAnomaly,
  currentAnomalyPercent,
  rainfallMm,
  historicalAvgRainfallMm,
  rainfallDeficitPercent,
}: DroughtKPIsProps) {
  const getVciColor = (val: number | null) => {
    if (val === null) return '#71717a';
    if (val >= 60) return '#10b981'; // Good/Wet
    if (val >= 40) return '#a3e635'; // Normal
    if (val >= 35) return '#f59e0b'; // Mild stress
    if (val >= 25) return '#f97316'; // Moderate
    if (val >= 15) return '#ef4444'; // Severe
    return '#991b1b'; // Extreme
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      {/* 1. Current NDVI */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-2 border-white/10 hover:border-eco-neon/30 transition-all">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-eco-neon" />
            Current NDVI
          </span>
          <span className="text-[10px] text-zinc-500">Sentinel-2</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white">
            {currentNdvi !== null ? currentNdvi.toFixed(4) : 'N/A'}
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
          <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {currentNdvi !== null && currentNdvi > 0.5
              ? 'Dense Vegetative Canopy'
              : currentNdvi !== null && currentNdvi >= 0.2
              ? 'Moderate Canopy Density'
              : 'Lean / Sparse Canopy'}
          </span>
        </div>
      </div>

      {/* 2. Vegetation Condition Index (VCI) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-2 border-white/10 hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            VCI Index
          </span>
          <span className="text-[10px] text-zinc-500">0 - 100%</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl sm:text-3xl font-black"
            style={{ color: getVciColor(currentVci) }}
          >
            {currentVci !== null ? `${currentVci.toFixed(1)}%` : 'N/A'}
          </span>
        </div>

        <div className="text-[11px] flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: getVciColor(currentVci) }}
          />
          <span className="font-semibold text-zinc-300 truncate">
            {vciClassification}
          </span>
        </div>
      </div>

      {/* 3. NDVI Anomaly vs Baseline */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-2 border-white/10 hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            {currentAnomalyPercent !== null && currentAnomalyPercent < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            )}
            NDVI Anomaly
          </span>
          <span className="text-[10px] text-zinc-500">vs 5-Yr Baseline</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-black ${
              currentAnomalyPercent !== null && currentAnomalyPercent < -10
                ? 'text-rose-400'
                : currentAnomalyPercent !== null && currentAnomalyPercent < 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {currentAnomalyPercent !== null
              ? `${currentAnomalyPercent > 0 ? '+' : ''}${currentAnomalyPercent.toFixed(1)}%`
              : 'N/A'}
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 truncate">
          <span>
            {currentAnomaly !== null ? `${currentAnomaly > 0 ? '+' : ''}${currentAnomaly.toFixed(4)}` : '0.00'}{' '}
            absolute diff
          </span>
        </div>
      </div>

      {/* 4. Rainfall Deficit % */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-2 border-white/10 hover:border-sky-500/30 transition-all">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            Rainfall Deficit
          </span>
          <span className="text-[10px] text-zinc-500">CHIRPS mm</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-black ${
              rainfallDeficitPercent !== null && rainfallDeficitPercent < -25
                ? 'text-rose-400'
                : rainfallDeficitPercent !== null && rainfallDeficitPercent < 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {rainfallDeficitPercent !== null
              ? `${rainfallDeficitPercent > 0 ? '+' : ''}${rainfallDeficitPercent.toFixed(1)}%`
              : 'N/A'}
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
          <Droplet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            {rainfallMm !== null ? `${rainfallMm} mm` : '0 mm'} (Norm:{' '}
            {historicalAvgRainfallMm !== null ? `${historicalAvgRainfallMm} mm` : 'N/A'})
          </span>
        </div>
      </div>
    </div>
  );
}
