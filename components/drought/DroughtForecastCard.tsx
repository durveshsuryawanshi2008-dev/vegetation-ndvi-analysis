'use client';

import React, { useState } from 'react';
import {
  DroughtPredictionResult,
  DroughtMLModelPrediction,
  DroughtClass,
} from '@/lib/drought-prediction-types';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Info,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Layers,
  ThermometerSun,
  Droplets,
  Sprout,
  Shield,
  Brain,
  HelpCircle,
} from 'lucide-react';

interface Props {
  forecast: DroughtPredictionResult;
  mlForecast?: DroughtMLModelPrediction | null;
  slopes?: {
    slope4Weeks: number;
    slope8Weeks: number;
    slope12Weeks: number;
  };
  areaName: string;
}

const CLASS_CONFIG: Record<
  DroughtClass,
  {
    bg: string;
    border: string;
    badge: string;
    text: string;
    glow: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  Extreme: {
    bg: 'bg-rose-950/30 border-rose-500/40',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500 text-white font-bold',
    text: 'text-rose-400',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
    icon: Flame,
    label: 'EXTREME DROUGHT RISK',
  },
  Severe: {
    bg: 'bg-red-950/30 border-red-500/40',
    border: 'border-red-500/40',
    badge: 'bg-red-500 text-white font-bold',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    icon: ShieldAlert,
    label: 'SEVERE DROUGHT RISK',
  },
  Moderate: {
    bg: 'bg-amber-950/30 border-amber-500/40',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500 text-black font-bold',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    icon: AlertTriangle,
    label: 'MODERATE DROUGHT RISK',
  },
  Mild: {
    bg: 'bg-yellow-950/30 border-yellow-500/40',
    border: 'border-yellow-500/40',
    badge: 'bg-yellow-400 text-black font-bold',
    text: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(250,204,21,0.15)]',
    icon: Info,
    label: 'MILD DROUGHT RISK',
  },
  'No drought': {
    bg: 'bg-emerald-950/30 border-emerald-500/40',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-400 text-black font-bold',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]',
    icon: CheckCircle2,
    label: 'NO DROUGHT RISK',
  },
};

function SlopeIndicator({ label, value }: { label: string; value: number }) {
  const isDeclining = value < -0.3;
  const isGrowing = value > 0.3;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div className="flex items-center gap-2">
        {isDeclining ? (
          <TrendingDown className="w-4 h-4 text-red-400" />
        ) : isGrowing ? (
          <TrendingUp className="w-4 h-4 text-emerald-400" />
        ) : (
          <Minus className="w-4 h-4 text-zinc-400" />
        )}
        <span className="text-xs text-zinc-300 font-mono">{label}</span>
      </div>
      <span
        className={`text-xs font-mono font-bold ${
          isDeclining
            ? 'text-red-400'
            : isGrowing
            ? 'text-emerald-400'
            : 'text-zinc-400'
        }`}
      >
        {value > 0 ? '+' : ''}
        {value.toFixed(2)}%/wk
      </span>
    </div>
  );
}

export function DroughtForecastCard({ forecast, mlForecast, slopes, areaName }: Props) {
  const [showMlDetails, setShowMlDetails] = useState(false);
  const cfg = CLASS_CONFIG[forecast.droughtClass] || CLASS_CONFIG['No drought'];
  const IconComponent = cfg.icon;

  return (
    <div
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} ${cfg.glow} p-6 backdrop-blur-xl relative overflow-hidden transition-all`}
    >
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-eco-neon/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <IconComponent className={`w-6 h-6 ${cfg.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase font-mono ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono text-zinc-300">
                Confidence: <strong className="text-white">{forecast.confidence}</strong> ({forecast.confidencePercent}%)
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Drought Risk Forecast — <span className="text-eco-neon">{areaName}</span>
            </h2>
          </div>
        </div>

        {/* Risk Score Circle */}
        <div className="flex items-center gap-3 sm:self-center">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-zinc-400">Composite Risk Score</p>
            <p className={`text-3xl font-extrabold font-mono ${cfg.text}`}>
              {forecast.riskScore}<span className="text-xs text-zinc-500 font-normal">/100</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-white/10 flex items-center justify-center relative">
            <div
              className={`w-full h-full rounded-full border-4 ${cfg.border} border-t-transparent animate-spin`}
              style={{ animationDuration: '8s' }}
            />
            <span className={`absolute text-xs font-mono font-bold ${cfg.text}`}>
              {forecast.riskScore}
            </span>
          </div>
        </div>
      </div>

      {/* Main Reason & Recommended Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        {/* Main Reason */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 text-zinc-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-eco-neon" />
            <span>PRIMARY RISK DRIVER</span>
          </div>
          <p className="text-sm text-zinc-200 font-medium leading-relaxed">
            {forecast.mainReason}
          </p>
        </div>

        {/* Recommended Action */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1.5 text-zinc-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>RECOMMENDED ACTION</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {forecast.recommendedAction}
          </p>
        </div>
      </div>

      {/* Hard Rule Overrides Alert (if any applied) */}
      {forecast.appliedOverrides && forecast.appliedOverrides.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase font-mono tracking-wider text-[10px]">Deterministic Safety Override Triggered</span>
            {forecast.appliedOverrides.map((override, i) => (
              <p key={i} className="text-amber-200/90 text-xs leading-relaxed">{override}</p>
            ))}
          </div>
        </div>
      )}

      {/* Non-Rainfall Cause Advisory (if triggered) */}
      {forecast.nonRainfallCauseAdvisory && (
        <div className="mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase font-mono tracking-wider text-[10px] text-blue-300">Non-Rainfall Factor Detected</span>
            <p className="text-zinc-300 leading-relaxed">{forecast.nonRainfallCauseAdvisory}</p>
          </div>
        </div>
      )}

      {/* Slopes & Component Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        {/* Slopes Section */}
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-eco-neon" />
            <span>NDVI Trend Slopes (Weekly Trajectory)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SlopeIndicator
              label="4-Week Slope"
              value={slopes?.slope4Weeks ?? 0}
            />
            <SlopeIndicator
              label="8-Week Slope"
              value={slopes?.slope8Weeks ?? 0}
            />
            <SlopeIndicator
              label="12-Week Slope"
              value={slopes?.slope12Weeks ?? 0}
            />
          </div>
        </div>

        {/* 5-Factor Score Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-eco-neon" />
            <span>5-Factor Stress Contribution</span>
          </p>
          <div className="space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/[0.04] text-xs font-mono">
            {[
              { label: 'VCI Stress', weight: '30%', score: forecast.scoreBreakdown.vciStressScore, color: 'bg-emerald-400' },
              { label: 'Rainfall Deficit', weight: '25%', score: forecast.scoreBreakdown.rainfallDeficitScore, color: 'bg-blue-400' },
              { label: 'NDVI Decline Trend', weight: '20%', score: forecast.scoreBreakdown.ndviDeclineTrendScore, color: 'bg-amber-400' },
              { label: 'NDVI Health Anomaly', weight: '15%', score: forecast.scoreBreakdown.ndviHealthScore, color: 'bg-purple-400' },
              { label: 'Temperature Stress', weight: '10%', score: forecast.scoreBreakdown.temperatureAnomalyScore, color: 'bg-rose-400' },
            ].map(({ label, weight, score, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-32 text-zinc-400 text-[11px] truncate">{label} ({weight})</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-white text-[11px] font-bold">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Model Toggle Section */}
      {mlForecast && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setShowMlDetails((p) => !p)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-all"
          >
            <Brain className="w-3.5 h-3.5 text-eco-neon" />
            <span>
              {showMlDetails ? 'Hide' : 'View'} ML Ensemble Agreement ({mlForecast.predictedClass} — {mlForecast.modelName})
            </span>
          </button>

          {showMlDetails && (
            <div className="mt-3 p-4 rounded-xl bg-black/30 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">ML Predicted Class:</span>
                <span className="font-bold text-eco-neon font-mono">{mlForecast.predictedClass}</span>
              </div>

              {/* Class probabilities */}
              <div>
                <p className="text-[11px] text-zinc-500 font-mono mb-1.5">Class Probability Distribution:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(mlForecast.classProbabilities).map(([cName, prob]) => (
                    <div
                      key={cName}
                      className={`p-2 rounded-lg border text-center ${
                        cName === mlForecast.predictedClass
                          ? 'bg-eco-neon/15 border-eco-neon/40 text-eco-neon'
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-400'
                      }`}
                    >
                      <p className="text-[10px] font-mono truncate">{cName}</p>
                      <p className="text-xs font-bold font-mono mt-0.5">{(prob * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature importance */}
              <div>
                <p className="text-[11px] text-zinc-500 font-mono mb-1.5">Feature Importance Weights (SHAP):</p>
                <div className="space-y-1 text-[11px] font-mono">
                  {mlForecast.featureImportance.map((f) => (
                    <div key={f.feature} className="flex items-center justify-between text-zinc-400">
                      <span>{f.feature}</span>
                      <span className="text-white font-bold">{(f.importance * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Forecast Disclaimer */}
      <p className="mt-4 text-[10px] font-mono text-zinc-500 leading-relaxed border-t border-white/[0.04] pt-3">
        ℹ️ <strong>Drought Risk Forecast:</strong> Derived from satellite observations (Sentinel-2, CHIRPS, MODIS).
        This model produces probabilistic risk forecasts rather than deterministic predictions. Field ground-truthing is advised.
      </p>
    </div>
  );
}
