'use client';

import React, { useState } from 'react';
import {
  Waves,
  CloudRain,
  Wind,
  Flame,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  ExternalLink,
  Droplets,
  ThermometerSun,
  MapPin,
  Bug,
  Eye,
} from 'lucide-react';
import { MultiHazardStatus } from '@/lib/types';

interface MultiHazardMonitorProps {
  multiHazardStatus?: MultiHazardStatus;
  areaName: string;
}

export function MultiHazardMonitor({
  multiHazardStatus,
  areaName,
}: MultiHazardMonitorProps) {
  const [activeHazardTab, setActiveHazardTab] = useState<'all' | 'drought' | 'flood' | 'cyclone' | 'rapid_loss'>('all');

  if (!multiHazardStatus) {
    return null;
  }

  const { drought, flood, cyclone, rapidVegetationLoss } = multiHazardStatus;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3" />
              Integrated Environmental Security
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Observations &bull; Estimates &bull; Official Forecasts Separated
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-eco-neon" />
            <span>Multi-Hazard Early-Warning Matrix &bull; {areaName}</span>
          </h3>
        </div>

        {/* Hazard Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveHazardTab('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeHazardTab === 'all'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            All Hazards
          </button>
          <button
            type="button"
            onClick={() => setActiveHazardTab('drought')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeHazardTab === 'drought'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Drought
          </button>
          <button
            type="button"
            onClick={() => setActiveHazardTab('flood')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeHazardTab === 'flood'
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Flood (SAR)
          </button>
          <button
            type="button"
            onClick={() => setActiveHazardTab('cyclone')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeHazardTab === 'cyclone'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Cyclone (IMD)
          </button>
          <button
            type="button"
            onClick={() => setActiveHazardTab('rapid_loss')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              activeHazardTab === 'rapid_loss'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Vegetation Damage
          </button>
        </div>
      </div>

      {/* Strict Scientific Disclaimers Notice */}
      <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5 text-xs font-mono text-zinc-400">
        <Info className="w-4 h-4 text-eco-neon shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-white uppercase text-[10px]">Data Integrity &amp; Separation Protocol</span>
          <p className="leading-relaxed text-zinc-400 font-sans text-xs">
            Measurements are divided into <strong>Observed Satellite Signals</strong>, <strong>Model Estimates</strong>, and <strong>Official Meteorological Forecasts</strong>.
            NDVI is never used to forecast atmospheric storm tracks. Areas with cloud gaps are transparently marked as unobserved, never as safe.
          </p>
        </div>
      </div>

      {/* Hazard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        {/* Card 1: Agricultural Drought Hazard */}
        {(activeHazardTab === 'all' || activeHazardTab === 'drought') && (
          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ThermometerSun className="w-4 h-4 text-amber-400" />
                Agricultural Drought Intelligence
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Observed: {drought.observedStressLevel} Stress
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">Estimated Risk Score</span>
                <span className="text-lg font-bold text-white">{drought.estimatedRiskScore}%</span>
                <span className="text-[9px] text-zinc-500 block">Model calibrated (0–100%)</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">Canopy NDMI Moisture</span>
                <span className="text-xs font-bold text-cyan-300">{drought.ndmiMoistureStatus}</span>
                <span className="text-[9px] text-zinc-500 block">Sentinel-2 (B8–B11)</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Soil Capillary Condition</span>
              <p className="text-zinc-300 font-sans text-xs">{drought.soilCapillaryStatus}</p>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans pt-1 border-t border-white/5">
              {drought.forecastAssessment}
            </p>
          </div>
        )}

        {/* Card 2: Flood & Waterlogging Inundation Hazard */}
        {(activeHazardTab === 'all' || activeHazardTab === 'flood') && (
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                Flood &amp; Waterlogging Hazard
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                flood.observedInundationDetected
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {flood.observedInundationDetected ? '⚠️ Surface Inundation Detected' : 'No Open Flood Water'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">Topographic Susceptibility</span>
                <span className="text-xs font-bold text-white">{flood.topographicSusceptibility}</span>
                <span className="text-[9px] text-zinc-500 block">Terrain slope &amp; drainage</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">3-Day Cumulative Rain</span>
                <span className="text-lg font-bold text-cyan-300">{flood.cumulativeRainfall3DayMm} mm</span>
                <span className="text-[9px] text-zinc-500 block">CHIRPS daily precipitation</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Sentinel-1 Radar SAR Signal</span>
              <p className="text-zinc-300 font-sans text-xs">{flood.radarSarSignal}</p>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans pt-1 border-t border-white/5">
              {flood.disclaimer}
            </p>
          </div>
        )}

        {/* Card 3: Official Cyclone & Storm Advisories */}
        {(activeHazardTab === 'all' || activeHazardTab === 'cyclone') && (
          <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-blue-400" />
                Official Tropical Cyclone Monitoring
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                IMD / RSMC Official Feed
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Storm Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No Active Storm Warnings for Region
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Atmospheric tropical cyclone forecasts are ingested from RSMC New Delhi and the India Meteorological Department (IMD).
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[11px] font-sans text-blue-200">
              <strong>Safety Mandate:</strong> {cyclone.disclaimer}
            </div>
          </div>
        )}

        {/* Card 4: Rapid Vegetation Loss & Unexplained Damage */}
        {(activeHazardTab === 'all' || activeHazardTab === 'rapid_loss') && (
          <div className="p-4 rounded-xl bg-black/40 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-rose-400" />
                Rapid Vegetation Loss Detection
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                rapidVegetationLoss.unexplainedCanopyLossDetected
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {rapidVegetationLoss.unexplainedCanopyLossDetected
                  ? '⚠️ Rapid Canopy Loss Detected'
                  : 'Canopy Progression Normal'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">Recent 2-Week Drop</span>
                <span className="text-lg font-bold text-white">{rapidVegetationLoss.recentDropPercent}%</span>
                <span className="text-[9px] text-zinc-500 block">Sentinel-2 multi-pass diff</span>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-zinc-500 block uppercase">Data Quality Completeness</span>
                <span className="text-xs font-bold text-emerald-400">
                  {rapidVegetationLoss.qualityFlags.dataCompleteness}
                </span>
                <span className="text-[9px] text-zinc-500 block">
                  Cloud Cover: {rapidVegetationLoss.qualityFlags.cloudCoverPercent}%
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase block">Potential Non-Weather Causes</span>
              <ul className="text-zinc-300 font-sans text-xs list-disc list-inside space-y-0.5">
                {rapidVegetationLoss.possibleCauses.map((cause, i) => (
                  <li key={i}>{cause}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
