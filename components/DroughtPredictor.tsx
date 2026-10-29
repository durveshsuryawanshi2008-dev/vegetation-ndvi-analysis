'use client';

import React from 'react';
import {
  AlertTriangle,
  Droplets,
  CloudRain,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Info,
  Sprout,
  ThermometerSun,
  Waves,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { DroughtPrediction, DroughtSeverity } from '@/lib/types';

interface DroughtPredictorProps {
  droughtPrediction?: DroughtPrediction;
  areaName: string;
  country?: string;
  state?: string;
}

export function DroughtPredictor({
  droughtPrediction,
  areaName,
  country,
  state,
}: DroughtPredictorProps) {
  if (!droughtPrediction) {
    return null;
  }

  const {
    vci,
    droughtSeverity,
    droughtProbability,
    ndviAnomalyPercent,
    historicalBaselineNdvi,
    historicalMinDroughtNdvi,
    historicalMaxNdvi,
    currentNdvi,
    rainfallStressIndex,
    predictionSummary,
    agriculturalAdvisories,
    historicalComparison,
  } = droughtPrediction;

  // Determine theme colors based on severity
  const getSeverityTheme = (severity: DroughtSeverity) => {
    switch (severity) {
      case 'Extreme Drought':
        return {
          bannerBg: 'bg-rose-950/40 border-rose-500/50 text-rose-300',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gaugeColor: '#f43f5e',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
          icon: ShieldAlert,
          title: 'CRITICAL EARLY WARNING: EXTREME DROUGHT CONDITIONS DETECTED',
        };
      case 'Severe Drought':
        return {
          bannerBg: 'bg-red-950/40 border-red-500/50 text-red-300',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
          gaugeColor: '#ef4444',
          glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]',
          icon: AlertTriangle,
          title: 'HIGH ALERT: SEVERE VEGETATION & RAINFALL DROUGHT',
        };
      case 'Moderate Drought':
        return {
          bannerBg: 'bg-amber-950/40 border-amber-500/50 text-amber-300',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gaugeColor: '#f59e0b',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
          icon: AlertTriangle,
          title: 'ADVISORY ALERT: MODERATE DROUGHT & CANOPY STRESS',
        };
      case 'Mild Stress':
        return {
          bannerBg: 'bg-yellow-950/30 border-yellow-500/40 text-yellow-300',
          badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          gaugeColor: '#eab308',
          glow: 'shadow-[0_0_20px_rgba(234,179,8,0.1)]',
          icon: ThermometerSun,
          title: 'MONITORING NOTICE: MILD RAINFALL DEFICIT / MOISTURE STRESS',
        };
      case 'Optimal Moisture':
        return {
          bannerBg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          gaugeColor: '#10b981',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          icon: ShieldCheck,
          title: 'OPTIMAL VEGETATION HEALTH: ABUNDANT CANOPY MOISTURE',
        };
      case 'Normal Moisture':
      default:
        return {
          bannerBg: 'bg-teal-950/30 border-teal-500/30 text-teal-300',
          badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          gaugeColor: '#14b8a6',
          glow: 'shadow-[0_0_20px_rgba(20,184,166,0.1)]',
          icon: ShieldCheck,
          title: 'STABLE CANOPY: NORMAL VEGETATION & RAINFALL STATUS',
        };
    }
  };

  const theme = getSeverityTheme(droughtSeverity);
  const StatusIcon = theme.icon;

  // Clamped VCI for visual progress (0-100%)
  const clampedVci = Math.max(0, Math.min(100, vci));

  return (
    <div className={`glass-panel rounded-2xl p-6 border ${theme.bannerBg} ${theme.glow} space-y-6 transition-all duration-300`}>
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Live Earth Engine Telemetry
            </span>
            <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${theme.badgeBg}`}>
              {droughtSeverity}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <StatusIcon className="w-6 h-6 shrink-0" style={{ color: theme.gaugeColor }} />
            <span>{theme.title}</span>
          </h3>

          <p className="text-xs text-zinc-300 font-mono">
            Early warning remote-sensing model for <span className="text-white font-semibold">{areaName}</span>
            {state ? `, ${state}` : ''} {country ? `(${country})` : ''} based on Sentinel-2 multi-temporal spectral reflectance.
          </p>
        </div>

        {/* Drought Probability Gauge Card */}
        <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-3.5 px-4 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Drought Probability</span>
            <span className="text-2xl font-black text-white">{droughtProbability}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${theme.gaugeColor}25`, color: theme.gaugeColor, border: `1px solid ${theme.gaugeColor}60` }}>
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Scientific Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* Metric 1: VCI */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            Vegetation Condition Index
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: theme.gaugeColor }}>
              {vci.toFixed(1)}%
            </span>
            <span className="text-[11px] text-zinc-500">/ 100%</span>
          </div>
          <span className="text-[10px] text-zinc-400 block">
            {vci < 25 ? 'Critical canopy desiccation' : vci < 40 ? 'Moderate canopy stress' : 'Healthy canopy vigor'}
          </span>
        </div>

        {/* Metric 2: Anomaly % */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            {ndviAnomalyPercent < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Canopy NDVI Anomaly
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                ndviAnomalyPercent < -10
                  ? 'text-rose-400'
                  : ndviAnomalyPercent < 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {ndviAnomalyPercent > 0 ? '+' : ''}
              {ndviAnomalyPercent.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 block">
            vs 5-year multi-year baseline ({historicalBaselineNdvi.toFixed(4)})
          </span>
        </div>

        {/* Metric 3: Current vs Worst Drought Floor */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Worst Drought Floor ({historicalComparison.worstDroughtYear})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">
              {historicalComparison.differenceFromWorst > 0 ? '+' : ''}
              {historicalComparison.differenceFromWorst.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 block">
            {historicalComparison.isApproachingWorst ? (
              <span className="text-rose-400 font-semibold">⚠️ Breaching historical floor</span>
            ) : (
              <span>Above record drought low ({historicalComparison.worstDroughtNdvi.toFixed(4)})</span>
            )}
          </span>
        </div>

        {/* Metric 4: Rainfall & Soil Moisture Stress */}
        <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            Rainfall Stress Index
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg sm:text-xl font-bold ${
                rainfallStressIndex === 'Critical Deficit'
                  ? 'text-rose-400'
                  : rainfallStressIndex === 'Moderate Deficit'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {rainfallStressIndex}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 block">
            Precipitation &amp; evapotranspiration deficit
          </span>
        </div>
      </div>

      {/* 3. Scientific VCI Gauge Scale */}
      <div className="space-y-2 rounded-xl bg-black/30 border border-white/10 p-4 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-eco-neon" />
            Operational Vegetation Condition Index (VCI) Gauge:
          </span>
          <span className="text-xs font-bold" style={{ color: theme.gaugeColor }}>
            Current Value: {vci.toFixed(2)}%
          </span>
        </div>

        {/* Gradient Progress Bar */}
        <div className="relative w-full h-4 rounded-full bg-zinc-800/80 overflow-hidden border border-white/10">
          <div
            className="absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out rounded-full"
            style={{
              width: `${clampedVci}%`,
              background: `linear-gradient(90deg, #f43f5e 0%, #ef4444 20%, #f59e0b 40%, #eab308 60%, #10b981 85%, #a3e635 100%)`,
            }}
          />
          {/* Needle / Marker */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] z-10 -ml-0.5"
            style={{ left: `${clampedVci}%` }}
          />
        </div>

        {/* Scale Threshold Legends */}
        <div className="grid grid-cols-5 text-[10px] text-zinc-400 pt-1 text-center">
          <div className="text-rose-400 text-left">
            <span>&lt;15%</span>
            <span className="block text-[9px] text-zinc-500">Extreme</span>
          </div>
          <div className="text-red-400">
            <span>15-25%</span>
            <span className="block text-[9px] text-zinc-500">Severe</span>
          </div>
          <div className="text-amber-400">
            <span>25-40%</span>
            <span className="block text-[9px] text-zinc-500">Moderate</span>
          </div>
          <div className="text-yellow-400">
            <span>40-55%</span>
            <span className="block text-[9px] text-zinc-500">Mild Stress</span>
          </div>
          <div className="text-emerald-400 text-right">
            <span>&gt;55%</span>
            <span className="block text-[9px] text-zinc-500">Normal / Optimal</span>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-zinc-400 border-t border-white/5 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>
            Standard formulation: <code className="text-zinc-300 font-mono text-[10px]">VCI = ((NDVI_curr - NDVI_min) / (NDVI_max - NDVI_min)) × 100</code>.
            Evaluated against local historical bounds (Min: {historicalMinDroughtNdvi.toFixed(4)}, Max: {historicalMaxNdvi.toFixed(4)}).
          </span>
        </div>
      </div>

      {/* 4. Plain-English Scientific Analysis Summary */}
      <div className="rounded-xl bg-black/40 border border-white/10 p-4 space-y-2">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <CloudRain className="w-4 h-4 text-eco-neon" />
          Predictive Drought Assessment &amp; Regional Context
        </h4>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {predictionSummary}
        </p>
      </div>

      {/* 5. Actionable Agricultural & Water Contingency Advisories */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-emerald-400" />
          Actionable Agricultural &amp; Irrigation Contingency Advisories
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {agriculturalAdvisories.map((advisory, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] border border-white/10 p-3 text-xs text-zinc-300 hover:bg-white/[0.05] transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{advisory}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
