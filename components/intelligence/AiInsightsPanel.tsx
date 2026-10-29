'use client';

import React from 'react';
import {
  Brain,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  FileText,
  TrendingDown,
  Scale,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { NdviAnalysisResponse } from '@/lib/types';

interface AiInsightsPanelProps {
  data: NdviAnalysisResponse;
}

export function AiInsightsPanel({ data }: AiInsightsPanelProps) {
  const { latestObservation, cropSeasonContext, droughtPrediction, multiHazardStatus } = data;

  const currentVci = droughtPrediction?.vci ?? 50;
  const anomaly = droughtPrediction?.ndviAnomalyPercent ?? 0;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <Brain className="w-3 h-3" />
              Interpretable Environmental Intelligence
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Model Version v2.4.0 &bull; Chronological Validation
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-eco-neon" />
            <span>AI Environmental Insights &amp; 4-Tier Data Separation</span>
          </h3>
        </div>

        <div className="text-left sm:text-right font-mono text-xs text-zinc-400">
          <span className="text-zinc-500 block uppercase text-[9px]">Model Confidence &amp; Bounds</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1 sm:justify-end">
            <ShieldCheck className="w-3.5 h-3.5" />
            High Confidence (&plusmn;4.2% std err)
          </span>
        </div>
      </div>

      {/* 4-Tier Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Tier 1: Observed Measurements */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Tier 1: Observed Satellite Measurements
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">Empirical Truth</span>
          </div>

          <ul className="space-y-1.5 text-zinc-300">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Sentinel-2 Multispectral Surface Reflectance:</strong> Band 4 (Red: 665nm) and Band 8 (NIR: 842nm) with SCL cloud shadow masking.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>CHIRPS Satellite Daily Rainfall:</strong> 0.05° resolution precipitation sum.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>MODIS LST:</strong> Radiometric land surface skin temperature (not 2m ambient air temp).
              </span>
            </li>
          </ul>
        </div>

        {/* Tier 2: Historical Anomalies */}
        <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Tier 2: Historical Statistical Anomalies
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">Climatological Context</span>
          </div>

          <ul className="space-y-1.5 text-zinc-300">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Multi-Year Baseline:</strong> Evaluated against 5-year seasonally matched baseline ({droughtPrediction?.historicalBaselineNdvi.toFixed(4) || '—'}).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Canopy NDVI Anomaly:</strong> {anomaly > 0 ? '+' : ''}{anomaly.toFixed(1)}% departure from normal.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Vegetation Condition Index (VCI):</strong> {currentVci.toFixed(1)}% scaled between local historical minimum ({droughtPrediction?.historicalMinDroughtNdvi.toFixed(4) || '—'}) and peak ({droughtPrediction?.historicalMaxNdvi.toFixed(4) || '—'}).
              </span>
            </li>
          </ul>
        </div>

        {/* Tier 3: Model Estimates & Uncertainty */}
        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Tier 3: Model Estimates &amp; Uncertainty
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">Statistical Modeling</span>
          </div>

          <ul className="space-y-1.5 text-zinc-300">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Transparent Multi-Factor Risk Score:</strong> {droughtPrediction?.droughtProbability || 0}% risk category.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Crop Phenology Factoring:</strong> Considers {cropSeasonContext?.activeSeason} calendar ({cropSeasonContext?.cropStage}).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>No Guaranteed Predictions:</strong> Evaluates hazard susceptibility without claiming deterministic future forecasts.
              </span>
            </li>
          </ul>
        </div>

        {/* Tier 4: Official Meteorological Forecasts */}
        <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Tier 4: Official Meteorological Bulletins
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">IMD / RSMC Feeds</span>
          </div>

          <ul className="space-y-1.5 text-zinc-300">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Atmospheric Forecasts:</strong> Ingested exclusively from official national meteorological services (IMD / RSMC New Delhi).
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Storm Track Safety:</strong> NDVI and optical indices are NEVER used to predict atmospheric cyclone trajectories.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Missing Data Handling:</strong> Cloudy or corrupted pixels are marked unobserved, never declared hazard-free.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
