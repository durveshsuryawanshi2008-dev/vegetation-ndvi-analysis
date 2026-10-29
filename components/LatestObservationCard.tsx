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
  Radio,
  Database,
  Sparkles,
  Eye,
  AlertTriangle,
  RotateCw,
  Layers,
} from 'lucide-react';
import { LatestObservationMetadata, CropSeasonContext } from '@/lib/types';

interface LatestObservationCardProps {
  latestObservation?: LatestObservationMetadata;
  cropSeasonContext?: CropSeasonContext;
  areaName: string;
  lastCheckedAt?: string | null;
  isCheckingUpdates?: boolean;
  isPollingPaused?: boolean;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
}

export function LatestObservationCard({
  latestObservation,
  cropSeasonContext,
  areaName,
  lastCheckedAt,
  isCheckingUpdates,
  isPollingPaused,
  onManualRefresh,
  isRefreshing,
}: LatestObservationCardProps) {
  if (!latestObservation || latestObservation.latestNdvi === null) {
    return null;
  }

  const {
    latestNdvi,
    acquisitionDate,
    acquisitionTimestamp,
    satelliteSource,
    cloudCoveragePercent,
    validPixelCoveragePercent,
    previousObservationValue,
    previousObservationDate,
    percentChange,
    dataFreshness,
    freshnessTimestamp,
    lastFetchedAt,
    isCached,
    isStale,
    staleReason,
    satelliteSceneId,
  } = latestObservation;

  const isLive = dataFreshness === 'LIVE-FETCHED' || dataFreshness === 'Live Earth Engine Stream';
  const isStaleData = isStale || dataFreshness === 'STALE';

  // Calculate days since satellite acquisition
  const daysOld = Math.floor(
    (Date.now() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.3)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-eco-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Honest Data Freshness Badge */}
            <span
              className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border ${
                isStaleData
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                  : isLive
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}
            >
              {isStaleData ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  STALE DATA (DATABASE FALLBACK)
                </>
              ) : isLive ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <Radio className="w-3 h-3 text-emerald-400" />
                  LIVE-FETCHED FROM EARTH ENGINE
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-zinc-400" />
                  DATABASE CACHED RECORD
                </>
              )}
            </span>

            <span className="text-[11px] font-mono text-zinc-400">
              10-Meter Multispectral Surface Reflectance
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Satellite className="w-5 h-5 text-eco-neon" />
            <span>Latest Valid Satellite Observation &bull; {areaName}</span>
          </h3>
        </div>

        {/* Acquisition & Fetch Timestamps */}
        <div className="flex flex-col sm:items-end font-mono text-[11px] text-zinc-400 gap-0.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-eco-neon" />
            <span className="text-zinc-500">Acquisition:</span>
            <span className="text-white font-semibold">{acquisitionDate}</span>
            {acquisitionTimestamp && (
              <span className="text-zinc-500 text-[10px]">
                ({new Date(acquisitionTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Fetched: {new Date(lastFetchedAt || freshnessTimestamp).toLocaleTimeString()}</span>
            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                disabled={isRefreshing}
                className="ml-1 text-eco-neon hover:underline inline-flex items-center gap-0.5"
                title="Force refresh live satellite data"
              >
                <RotateCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Live Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Stale Data Warning Banner if live fetch failed */}
      {isStaleData && staleReason && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">
              NOTICE: DISPLAYING PREVIOUSLY CACHED OBSERVATION
            </span>
            <span className="text-zinc-300">{staleReason}</span>
          </div>
        </div>
      )}

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

      {/* Natural satellite revisit interval notice if acquisition date is older than 5 days */}
      {daysOld > 5 && (
        <div className="text-[11px] font-mono text-zinc-400 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Observation from {acquisitionDate} ({daysOld} days ago). Sentinel-2 has a 5-day constellation revisit frequency; this is the newest cloud-screened pass available over this geographic boundary.
          </span>
        </div>
      )}

      {/* Phenology & Background Polling Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 text-[11px] font-mono text-zinc-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500">Source:</span>
          <span className="text-zinc-300 font-semibold">{satelliteSource}</span>
          {satelliteSceneId && (
            <>
              <span>&bull;</span>
              <span className="text-zinc-500">Scene:</span>
              <span className="text-zinc-400 max-w-[150px] truncate">{satelliteSceneId}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Background Refresh Status */}
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPollingPaused
                  ? 'bg-zinc-600'
                  : isCheckingUpdates
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {isPollingPaused
                ? 'Auto-sync paused (tab inactive)'
                : isCheckingUpdates
                ? 'Checking satellite feed...'
                : lastCheckedAt
                ? `Satellite verified: ${new Date(lastCheckedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Auto-sync active (15m)'}
            </span>
          </div>

          {cropSeasonContext && (
            <div className="text-eco-neon flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{cropSeasonContext.activeSeason} ({cropSeasonContext.cropStage})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
