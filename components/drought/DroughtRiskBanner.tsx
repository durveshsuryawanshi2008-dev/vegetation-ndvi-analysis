'use client';

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Info,
  Thermometer,
  CloudRain,
  TrendingDown,
  Waves,
} from 'lucide-react';
import { DroughtPredictionEngineResult, DroughtRiskCategory } from '@/lib/types';

interface DroughtRiskBannerProps {
  prediction: DroughtPredictionEngineResult;
  areaName: string;
  state?: string;
  country?: string;
}

export function DroughtRiskBanner({
  prediction,
  areaName,
  state,
  country,
}: DroughtRiskBannerProps) {
  const {
    riskScore,
    riskCategory,
    scoreBreakdown,
    currentVci,
    vciClassification,
    consecutiveDeclineWeeks,
    recentNdviChangeRate,
    rainfallDeficit3Month,
    landSurfaceTempC,
    explainableSummary,
    vegetationStressWarning,
  } = prediction;

  // Determine styling based on Risk Category
  const getCategoryTheme = (category: DroughtRiskCategory) => {
    switch (category) {
      case 'Severe drought risk':
        return {
          bannerBg: 'bg-rose-950/40 border-rose-500/50',
          badgeBg: 'bg-rose-600 text-white',
          textColor: 'text-rose-400',
          glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
          icon: ShieldAlert,
          label: 'CRITICAL ALERT: SEVERE AGRICULTURAL DROUGHT RISK',
        };
      case 'High drought risk':
        return {
          bannerBg: 'bg-red-950/40 border-red-500/50',
          badgeBg: 'bg-red-500 text-white',
          textColor: 'text-red-400',
          glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]',
          icon: AlertTriangle,
          label: 'HIGH ALERT: ELEVATED AGRICULTURAL DROUGHT RISK',
        };
      case 'Moderate drought risk':
        return {
          bannerBg: 'bg-amber-950/40 border-amber-500/50',
          badgeBg: 'bg-amber-500 text-black font-bold',
          textColor: 'text-amber-400',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
          icon: AlertTriangle,
          label: 'WARNING: MODERATE DROUGHT & CANOPY STRESS',
        };
      case 'Mild drought risk':
        return {
          bannerBg: 'bg-yellow-950/30 border-yellow-500/40',
          badgeBg: 'bg-yellow-500 text-black font-bold',
          textColor: 'text-yellow-400',
          glow: 'shadow-[0_0_15px_rgba(234,179,8,0.1)]',
          icon: Info,
          label: 'ADVISORY: MILD MOISTURE DEFICIT / DRY SPELL',
        };
      case 'No drought':
      default:
        return {
          bannerBg: 'bg-emerald-950/30 border-emerald-500/40',
          badgeBg: 'bg-emerald-500 text-black font-bold',
          textColor: 'text-emerald-400',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
          icon: CheckCircle2,
          label: 'FAVORABLE STATUS: NO DROUGHT DETECTED',
        };
    }
  };

  const theme = getCategoryTheme(riskCategory);
  const StatusIcon = theme.icon;

  return (
    <div className={`glass-panel rounded-2xl p-6 border ${theme.bannerBg} ${theme.glow} space-y-6 transition-all duration-300`}>
      {/* 1. Header & Risk Score Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Live Earth Engine Multi-Spectral Engine
            </span>
            <span className={`text-xs font-mono uppercase px-3 py-0.5 rounded-full ${theme.badgeBg}`}>
              {riskCategory}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <StatusIcon className={`w-6 h-6 shrink-0 ${theme.textColor}`} />
            <span>{theme.label}</span>
          </h2>

          <p className="text-xs text-zinc-400 font-mono">
            Agricultural Early Warning for <span className="text-white font-semibold">{areaName}</span>
            {state ? `, ${state}` : ''} {country ? `(${country})` : ''} integrating Sentinel-2 NDVI, CHIRPS precipitation, and MODIS LST.
          </p>
        </div>

        {/* Weighted Drought Score Card */}
        <div className="shrink-0 flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Drought Risk Score</span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-3xl font-black text-white">{riskScore}</span>
              <span className="text-xs text-zinc-500">/ 100</span>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: riskScore >= 65 ? 'rgba(239, 68, 68, 0.2)' : riskScore >= 45 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: `1px solid ${riskScore >= 65 ? '#ef4444' : riskScore >= 45 ? '#f59e0b' : '#10b981'}`,
            }}
          >
            <Flame className={`w-6 h-6 ${theme.textColor}`} />
          </div>
        </div>
      </div>

      {/* 2. Explainable Prediction Summary Callout Box */}
      <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-eco-neon uppercase tracking-wider">
          <Info className="w-4 h-4 shrink-0" />
          <span>Explainable Diagnostic Assessment:</span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed font-sans">
          {explainableSummary}
        </p>
      </div>

      {/* 3. Persistent Vegetation Stress Alert (if triggered) */}
      {vegetationStressWarning && (
        <div className="rounded-xl bg-rose-950/60 border border-rose-500/50 p-4 flex items-start gap-3 text-rose-200 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider text-rose-300 block">
              ⚠️ Warning: Persistent Canopy Decline Detected
            </span>
            <p className="text-rose-200/90 leading-relaxed font-sans text-xs">
              {vegetationStressWarning}
            </p>
          </div>
        </div>
      )}

      {/* 4. Weighted Scoring Breakdown Grid */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Weighted Component Breakdown (4-Factor Model):</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {/* Factor 1: VCI Stress (40%) */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                VCI Stress (40%)
              </span>
              <span className="text-white font-bold">{scoreBreakdown.vciScore}/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${scoreBreakdown.vciScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              VCI: {currentVci.toFixed(1)}% ({vciClassification})
            </span>
          </div>

          {/* Factor 2: NDVI Decline (25%) */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                NDVI Decline (25%)
              </span>
              <span className="text-white font-bold">{scoreBreakdown.ndviDeclineScore}/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${scoreBreakdown.ndviDeclineScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              {consecutiveDeclineWeeks} wks decline ({recentNdviChangeRate}%)
            </span>
          </div>

          {/* Factor 3: Rainfall Deficit (25%) */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                Rainfall Deficit (25%)
              </span>
              <span className="text-white font-bold">{scoreBreakdown.rainfallDeficitScore}/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full"
                style={{ width: `${scoreBreakdown.rainfallDeficitScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              3-Mo Deficit: {rainfallDeficit3Month > 0 ? '+' : ''}{rainfallDeficit3Month}%
            </span>
          </div>

          {/* Factor 4: Temperature Stress (10%) */}
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Temp Stress (10%)
              </span>
              <span className="text-white font-bold">{scoreBreakdown.temperatureStressScore}/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full"
                style={{ width: `${scoreBreakdown.temperatureStressScore}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 block truncate">
              MODIS LST: {landSurfaceTempC}°C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
