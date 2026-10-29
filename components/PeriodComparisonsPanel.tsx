'use client';

import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  SlidersHorizontal,
} from 'lucide-react';
import { PeriodComparisonItem, CropSeasonContext } from '@/lib/types';

interface PeriodComparisonsPanelProps {
  comparisons?: PeriodComparisonItem[];
  cropSeasonContext?: CropSeasonContext;
  areaName: string;
}

export function PeriodComparisonsPanel({
  comparisons = [],
  cropSeasonContext,
  areaName,
}: PeriodComparisonsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [customA, setCustomA] = useState<number>(0.46);
  const [customB, setCustomB] = useState<number>(0.38);

  const customAbsDiff = Number((customB - customA).toFixed(4));
  const customPctDiff = customA > 0 ? Number(((customAbsDiff / customA) * 100).toFixed(1)) : 0;

  if (comparisons.length === 0) {
    return null;
  }

  const filteredComparisons =
    activeTab === 'all'
      ? comparisons
      : comparisons.filter((c) => c.periodType === activeTab);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Comparative Climatology Engine
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Phenology &amp; Quality Factored
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-eco-neon" />
            <span>Multi-Horizon Period Comparisons &bull; {areaName}</span>
          </h3>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'all'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            All Horizons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('this_month_vs_last_month')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'this_month_vs_last_month'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Month vs. Month
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('same_season_prior_years')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'same_season_prior_years'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            5-Yr Baseline Anomaly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeTab === 'custom'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Custom A vs B
          </button>
        </div>
      </div>

      {/* Phenology Notice Banner */}
      {cropSeasonContext?.phenologyAlert && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300 uppercase text-[10px] block">
              Crop Calendar Context ({cropSeasonContext.activeSeason} &bull; {cropSeasonContext.cropStage})
            </span>
            <p className="leading-relaxed text-zinc-300 font-sans text-xs">
              {cropSeasonContext.phenologyAlert}
            </p>
          </div>
        </div>
      )}

      {/* Custom Period Simulator Tab */}
      {activeTab === 'custom' ? (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4 font-mono">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-eco-neon" />
            <span>Interactive Custom Period A vs. Period B Analyzer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 block">Period A Benchmark NDVI: {customA.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.01"
                value={customA}
                onChange={(e) => setCustomA(parseFloat(e.target.value))}
                className="w-full accent-eco-neon"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 block">Period B Target NDVI: {customB.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.01"
                value={customB}
                onChange={(e) => setCustomB(parseFloat(e.target.value))}
                className="w-full accent-eco-neon"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-500 uppercase text-[10px] block">Calculated Difference</span>
              <span className={`text-xl font-bold ${customPctDiff < -6 ? 'text-rose-400' : customPctDiff > 6 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {customPctDiff > 0 ? '+' : ''}{customPctDiff}% ({customAbsDiff > 0 ? '+' : ''}{customAbsDiff})
              </span>
            </div>
            <p className="text-zinc-300 font-sans text-xs max-w-md">
              {customPctDiff < -12
                ? 'Severe vegetative decline. In rainfed zones, this magnitude indicates significant moisture stress, drought, or complete crop clearance.'
                : customPctDiff > 10
                ? 'Vigorous biomass expansion indicating rapid chlorophyll accumulation and favorable soil water reserves.'
                : 'Canopy variance remains within expected seasonal climatological bounds.'}
            </p>
          </div>
        </div>
      ) : (
        /* Regular Comparison Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono">
          {filteredComparisons.map((c, idx) => {
            const isNegative = c.percentChange !== null && c.percentChange < -5;
            const isPositive = c.percentChange !== null && c.percentChange > 5;

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-eco-neon" />
                    {c.title}
                  </span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded ${
                      isNegative
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isPositive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {c.percentChange !== null ? `${c.percentChange > 0 ? '+' : ''}${c.percentChange}%` : '—'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-zinc-500 block uppercase">{c.periodB.label}</span>
                    <span className="text-sm font-bold text-zinc-300">
                      {c.periodB.value !== null ? c.periodB.value.toFixed(4) : '—'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-zinc-500 block uppercase">{c.periodA.label}</span>
                    <span className="text-sm font-bold text-white">
                      {c.periodA.value !== null ? c.periodA.value.toFixed(4) : '—'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-zinc-400 leading-relaxed">
                  {c.explanation}
                </p>

                {c.seasonalityFactored && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-eco-neon/80">
                    <CheckCircle2 className="w-3 h-3 text-eco-neon" />
                    <span>Seasonally matched baseline applied</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
