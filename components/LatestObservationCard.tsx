'use client';

import React from 'react';
import {
  Satellite,
  Calendar,
  Cloud,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  Clock,
  Layers,
  ShieldCheck,
  Database,
  Radio,
  Eye,
  Sparkles,
} from 'lucide-react';
import { LatestObservationMetadata, CropSeasonContext } from '@/lib/types';

interface LatestObservationCardProps {
  latestObservation?: LatestObservationMetadata;
  cropSeasonContext?: CropSeasonContext;
  areaName: string;
}

export function LatestObservationCard({
  latestObservation,
  cropSeasonContext,
  areaName,
}: LatestObservationCardProps) {
  if (!latestObservation || latestObservation.latestNdvi === null) {
    return null;
  }

  const {
    latestNdvi,
    acquisitionDate,
    satelliteSource,
    cloudCoveragePercent,
    validPixelCoveragePercent,
    previousObservationValue,
    previousObservationDate,
    absoluteChange,
    percentChange,
    dataFreshness,
    freshnessTimestamp,
    isCached,
    resolutionMeters,
  } = latestObservation;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.3)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-eco-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border ${
                !isCached
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              {!isCached ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <Radio className="w-3 h-3 text-emerald-400" />
                  Live Earth Engine Stream
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-zinc-400" />
                  Database Cached Record
                </>
              )}
            </span>

            <span className="text-[11px] font-mono text-zinc-400">
              10-Meter Multi-Spectral Resolution
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Satellite className="w-5 h-5 text-eco-neon" />
            <span>Latest Valid Satellite Observation &bull; {areaName}</span>
          </h3>
        </div>

        {/* Data Freshness Timestamp */}
        <div className="text-left sm:text-right font-mono text-[11px] text-zinc-400">
          <span className="text-zinc-500 block uppercase text-[9px]">Verified Acquisition Pass</span>
          <span className="text-white font-semibold flex items-center gap-1 sm:justify-end">
            <Calendar className="w-3 h-3 text-eco-neon" />
            {acquisitionDate}
          </span>
        </div>
      </div>

      {/* Primary 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
        {/* Metric 1: Current NDVI Value */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-eco-neon" />
            Latest Valid NDVI
          </span>
          <div className="text-2xl sm:text-3xl font-black text-eco-neon">
            {latestNdvi.toFixed(4)}
          </div>
          <span className="text-[10px] text-zinc-400 block">
            {latestNdvi >= 0.5 ? 'Healthy vegetative canopy' : latestNdvi >= 0.2 ? 'Moderate canopy vigor' : 'Sparse / desiccated cover'}
          </span>
        </div>

        {/* Metric 2: Observation Change */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            {percentChange !== null && percentChange > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : percentChange !== null && percentChange < 0 ? (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            ) : (
              <Minus className="w-3 h-3 text-zinc-400" />
            )}
            Prior Pass Drift
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {percentChange !== null ? (
              <span className={percentChange < -5 ? 'text-rose-400' : percentChange > 5 ? 'text-emerald-400' : 'text-zinc-200'}>
                {percentChange > 0 ? '+' : ''}{percentChange}%
              </span>
            ) : (
              '—'
            )}
          </div>
          <span className="text-[10px] text-zinc-400 block">
            vs. {previousObservationDate || 'prior period'} ({previousObservationValue !== null ? previousObservationValue.toFixed(3) : '—'})
          </span>
        </div>

        {/* Metric 3: Cloud & Shadow Screening */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Cloud className="w-3 h-3 text-cyan-400" />
            Cloud Cover Fraction
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {cloudCoveragePercent}%
          </div>
          <span className="text-[10px] text-zinc-400 block">
            SCL medium/high probability mask applied
          </span>
        </div>

        {/* Metric 4: Valid Pixel Coverage */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Valid-Pixel Fraction
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {validPixelCoveragePercent}%
          </div>
          <span className="text-[10px] text-zinc-400 block">
            Clean ground reflectance resolution
          </span>
        </div>
      </div>

      {/* Phenology & Truth Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Source:</span>
          <span className="text-zinc-300 font-semibold">{satelliteSource}</span>
          <span>&bull;</span>
          <span className="text-zinc-500">Processed:</span>
          <span>{new Date(freshnessTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {cropSeasonContext && (
          <div className="text-eco-neon flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Season: {cropSeasonContext.activeSeason} ({cropSeasonContext.cropStage})</span>
          </div>
        )}
      </div>
    </div>
  );
}
