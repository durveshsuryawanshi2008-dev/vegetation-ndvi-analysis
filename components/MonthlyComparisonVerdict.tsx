'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Droplets,
  Activity,
  Sparkles,
} from 'lucide-react';
import { MonthlyNdviResult, WeeklyNdviResult } from '@/lib/types';

interface MonthlyComparisonVerdictProps {
  monthlyData?: MonthlyNdviResult[];
  weeklyData?: WeeklyNdviResult[];
  areaName: string;
  onViewMonthlyChart?: () => void;
  onViewWeeklyChart?: () => void;
}

export function MonthlyComparisonVerdict({
  monthlyData = [],
  weeklyData = [],
  areaName,
  onViewMonthlyChart,
  onViewWeeklyChart,
}: MonthlyComparisonVerdictProps) {
  const validMonths = monthlyData.filter((m) => m.avgNdvi !== null && !Number.isNaN(m.avgNdvi));

  if (validMonths.length < 2) {
    return null;
  }

  const currentMonth = validMonths[validMonths.length - 1];
  const previousMonth = validMonths[validMonths.length - 2];

  const currentVal = currentMonth.avgNdvi!;
  const prevVal = previousMonth.avgNdvi!;
  const deltaVal = currentVal - prevVal;
  const deltaPercent = prevVal > 0 ? Number(((deltaVal / prevVal) * 100).toFixed(1)) : 0;

  // Determine Drought Verdict solely by comparing last month's index
  const isSevereDrought = deltaPercent <= -12;
  const isModerateDrought = deltaPercent > -12 && deltaPercent <= -5;
  const isStable = deltaPercent > -5 && deltaPercent <= 5;
  const isGrowth = deltaPercent > 5;

  let verdictTitle = '';
  let verdictStatus = '';
  let verdictBadgeBg = '';
  let verdictBorderColor = '';
  let verdictGlow = '';
  let verdictIcon = CheckCircle2;
  let verdictExplanation = '';

  if (isSevereDrought) {
    verdictTitle = 'DROUGHT STRESS EVENT DETECTED';
    verdictStatus = 'CRITICAL DECLINE VS. LAST MONTH';
    verdictBadgeBg = 'bg-rose-500 text-black border-rose-400';
    verdictBorderColor = 'border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-red-950/40 to-black/80';
    verdictGlow = 'shadow-[0_0_35px_rgba(244,63,94,0.2)]';
    verdictIcon = ShieldAlert;
    verdictExplanation = `Drought conditions have occurred in ${areaName}. By comparing only the last month's indices, NDVI contracted sharply by ${Math.abs(deltaPercent)}% from ${previousMonth.label} (${prevVal.toFixed(4)}) to ${currentMonth.label} (${currentVal.toFixed(4)}). Standing vegetation has entered acute moisture deficit, with severe risk of crop wilting and biomass loss.`;
  } else if (isModerateDrought) {
    verdictTitle = 'MODERATE DROUGHT STRESS WARNING';
    verdictStatus = 'CANOPY MOISTURE RECEDING';
    verdictBadgeBg = 'bg-amber-500 text-black border-amber-400';
    verdictBorderColor = 'border-amber-500/50 bg-gradient-to-r from-amber-950/50 via-yellow-950/30 to-black/80';
    verdictGlow = 'shadow-[0_0_25px_rgba(245,158,11,0.15)]';
    verdictIcon = AlertTriangle;
    verdictExplanation = `Noticeable vegetation stress detected in ${areaName}. NDVI declined by ${Math.abs(deltaPercent)}% compared to last month (${previousMonth.label}: ${prevVal.toFixed(4)} → ${currentMonth.label}: ${currentVal.toFixed(4)}). Soil capillary water is diminishing, and crops require proactive moisture conservation.`;
  } else if (isGrowth) {
    verdictTitle = 'OPTIMAL VEGETATION EXPANSION';
    verdictStatus = 'HEALTHY GROWTH VS. LAST MONTH';
    verdictBadgeBg = 'bg-eco-neon text-black border-eco-400';
    verdictBorderColor = 'border-eco-500/40 bg-gradient-to-r from-eco-950/50 via-emerald-950/30 to-black/80';
    verdictGlow = 'shadow-[0_0_25px_rgba(198,241,53,0.15)]';
    verdictIcon = Sparkles;
    verdictExplanation = `Vegetation is flourishing across ${areaName}. Compared to last month, NDVI increased by +${deltaPercent}% (${previousMonth.label}: ${prevVal.toFixed(4)} → ${currentMonth.label}: ${currentVal.toFixed(4)}). Active photosynthesis and abundant surface moisture are promoting rapid canopy biomass development.`;
  } else {
    verdictTitle = 'EVERYTHING IS OK: STABLE CONDITIONS';
    verdictStatus = 'NO DROUGHT EVENT DETECTED';
    verdictBadgeBg = 'bg-emerald-500 text-black border-emerald-400';
    verdictBorderColor = 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-black/80';
    verdictGlow = 'shadow-[0_0_25px_rgba(16,185,129,0.15)]';
    verdictIcon = ShieldCheck;
    verdictExplanation = `Everything is OK in ${areaName}. Comparing only the last month's indices shows stable conditions with a minimal shift of ${deltaPercent > 0 ? '+' : ''}${deltaPercent}% (${previousMonth.label}: ${prevVal.toFixed(4)} → ${currentMonth.label}: ${currentVal.toFixed(4)}). No drought or significant vegetative stress is present.`;
  }

  const VerdictIconComponent = verdictIcon;

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 relative overflow-hidden space-y-5 ${verdictBorderColor} ${verdictGlow}`}>
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isSevereDrought
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : isModerateDrought
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <VerdictIconComponent className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${verdictBadgeBg}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                {verdictStatus}
              </span>
              <span className="text-xs font-mono text-zinc-300">
                Month-over-Month Comparison Engine
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
              {verdictTitle}
            </h3>
          </div>
        </div>

        {/* Quick Granularity Switchers */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {onViewMonthlyChart && (
            <button
              type="button"
              onClick={onViewMonthlyChart}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-xs border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span>View Monthly Graph</span>
              <ArrowRight className="w-3.5 h-3.5 text-eco-neon" />
            </button>
          )}
          {onViewWeeklyChart && (
            <button
              type="button"
              onClick={onViewWeeklyChart}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-xs border border-white/10 transition-all flex items-center gap-1.5"
            >
              <span>View Weekly Graph</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Side-by-Side Month-over-Month Metrics Comparison ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono">
        {/* Previous Month Card */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            Previous Month ({previousMonth.label})
          </span>
          <div className="text-2xl font-bold text-zinc-200">
            {prevVal.toFixed(4)}
          </div>
          <span className="text-[11px] text-zinc-400 block">
            Status: <strong className="text-white">{previousMonth.vegetationStatus}</strong>
          </span>
        </div>

        {/* Delta Card */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/15 space-y-1 flex flex-col justify-center">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            {deltaPercent > 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : deltaPercent < 0 ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-zinc-400" />
            )}
            Month-over-Month Delta
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                isSevereDrought
                  ? 'text-rose-400'
                  : isModerateDrought
                  ? 'text-amber-400'
                  : isGrowth
                  ? 'text-eco-neon'
                  : 'text-emerald-400'
              }`}
            >
              {deltaPercent > 0 ? '+' : ''}{deltaPercent}%
            </span>
            <span className="text-xs text-zinc-400">
              ({deltaVal > 0 ? '+' : ''}{deltaVal.toFixed(4)})
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 block">
            {isSevereDrought
              ? 'Severe drop in index'
              : isModerateDrought
              ? 'Moderate drop in index'
              : isGrowth
              ? 'Noticeable expansion'
              : 'Negligible variance'}
          </span>
        </div>

        {/* Current Month Card */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-eco-neon" />
            Latest Month ({currentMonth.label})
          </span>
          <div className="text-2xl font-bold text-white">
            {currentVal.toFixed(4)}
          </div>
          <span className="text-[11px] text-zinc-400 block">
            Status: <strong className="text-white">{currentMonth.vegetationStatus}</strong>
          </span>
        </div>
      </div>

      {/* ── Plain-English Clear Statement ────────────────────────────── */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-1.5">
        <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-eco-neon" />
          <span>Clear Prediction Statement</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
          {verdictExplanation}
        </p>
      </div>

      {/* ── All Recent Months Ribbon ─────────────────────────────────── */}
      <div className="pt-1 border-t border-white/5 space-y-2">
        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
          All Available Monthly Indices ({validMonths.length} Months Recorded):
        </span>
        <div className="flex flex-wrap gap-2">
          {validMonths.map((m, idx) => (
            <div
              key={m.month || idx}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                idx === validMonths.length - 1
                  ? 'bg-eco-neon/10 border-eco-500/50 text-white font-bold'
                  : 'bg-white/[0.03] border-white/10 text-zinc-300'
              }`}
            >
              <span className="text-zinc-400">{m.label}:</span>
              <span className={idx === validMonths.length - 1 ? 'text-eco-neon' : 'text-zinc-200'}>
                {m.avgNdvi !== null ? m.avgNdvi.toFixed(3) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
