'use client';

import React, { useState, useCallback } from 'react';
import {
  DroughtPredictionInput,
  DroughtPredictionApiResponse,
  DroughtClass,
  ConfidenceLevel,
} from '@/lib/drought-prediction-types';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Droplets,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Waves,
  Info,
  CloudRain,
  Sprout,
  Activity,
  BarChart3,
  Loader2,
  Send,
  RotateCcw,
  Zap,
  Shield,
  Eye,
  Cpu,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DEMO SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════
const DEMO_SCENARIOS: {
  name: string;
  description: string;
  color: string;
  input: DroughtPredictionInput;
}[] = [
  {
    name: 'Extreme Drought',
    description: 'Severe VCI collapse with critical rainfall deficit',
    color: 'rose',
    input: {
      areaName: 'Osmanabad',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.15,
      previousMonthNdvi: 0.22,
      sameMonthLastYearNdvi: 0.38,
      fiveYearAvgNdvi: 0.36,
      ndviSlope4Weeks: -3.5,
      ndviSlope8Weeks: -2.8,
      ndviSlope12Weeks: -1.9,
      currentVci: 12.0,
      previousMonthVci: 28.0,
      currentRainfallMm: 8.0,
      longTermAvgRainfallMm: 95.0,
      rainfallDeficitPercent: -91.6,
      temperatureAnomalyC: 4.5,
      consecutiveDeclineWeeks: 7,
    },
  },
  {
    name: 'Severe Drought',
    description: '4+ weeks NDVI decline with VCI below 25',
    color: 'red',
    input: {
      areaName: 'Latur',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.22,
      previousMonthNdvi: 0.30,
      sameMonthLastYearNdvi: 0.36,
      fiveYearAvgNdvi: 0.34,
      ndviSlope4Weeks: -2.5,
      ndviSlope8Weeks: -1.8,
      ndviSlope12Weeks: -1.0,
      currentVci: 22.0,
      previousMonthVci: 35.0,
      currentRainfallMm: 20.0,
      longTermAvgRainfallMm: 85.0,
      rainfallDeficitPercent: -76.5,
      temperatureAnomalyC: 3.0,
      consecutiveDeclineWeeks: 5,
    },
  },
  {
    name: 'Moderate Drought',
    description: 'VCI below 35 with significant rainfall deficit',
    color: 'amber',
    input: {
      areaName: 'Ahilyanagar',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.28,
      previousMonthNdvi: 0.34,
      sameMonthLastYearNdvi: 0.38,
      fiveYearAvgNdvi: 0.36,
      ndviSlope4Weeks: -1.8,
      ndviSlope8Weeks: -1.2,
      ndviSlope12Weeks: -0.6,
      currentVci: 30.5,
      previousMonthVci: 42.0,
      currentRainfallMm: 35.0,
      longTermAvgRainfallMm: 82.0,
      rainfallDeficitPercent: -57.3,
      temperatureAnomalyC: 2.1,
      consecutiveDeclineWeeks: 3,
    },
  },
  {
    name: 'Mild Stress',
    description: 'Slight NDVI dip with minor rainfall shortfall',
    color: 'yellow',
    input: {
      areaName: 'Nashik',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.33,
      previousMonthNdvi: 0.36,
      sameMonthLastYearNdvi: 0.38,
      fiveYearAvgNdvi: 0.37,
      ndviSlope4Weeks: -0.8,
      ndviSlope8Weeks: -0.3,
      ndviSlope12Weeks: 0.2,
      currentVci: 45.0,
      previousMonthVci: 52.0,
      currentRainfallMm: 55.0,
      longTermAvgRainfallMm: 75.0,
      rainfallDeficitPercent: -26.7,
      temperatureAnomalyC: 1.0,
      consecutiveDeclineWeeks: 1,
    },
  },
  {
    name: 'No Drought',
    description: 'Healthy vegetation with surplus rainfall',
    color: 'emerald',
    input: {
      areaName: 'Pune',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.42,
      previousMonthNdvi: 0.40,
      sameMonthLastYearNdvi: 0.39,
      fiveYearAvgNdvi: 0.38,
      ndviSlope4Weeks: 0.5,
      ndviSlope8Weeks: 0.3,
      ndviSlope12Weeks: 0.8,
      currentVci: 72.0,
      previousMonthVci: 68.0,
      currentRainfallMm: 110.0,
      longTermAvgRainfallMm: 90.0,
      rainfallDeficitPercent: 22.2,
      temperatureAnomalyC: -0.5,
      consecutiveDeclineWeeks: 0,
    },
  },
  {
    name: 'Non-Rainfall Anomaly',
    description: 'Normal rain but low NDVI — heat/pest/harvest',
    color: 'purple',
    input: {
      areaName: 'Solapur',
      monthLabel: 'Oct 2026',
      currentNdvi: 0.22,
      previousMonthNdvi: 0.42,
      sameMonthLastYearNdvi: 0.38,
      fiveYearAvgNdvi: 0.36,
      ndviSlope4Weeks: -4.0,
      ndviSlope8Weeks: -2.0,
      ndviSlope12Weeks: -0.5,
      currentVci: 32.0,
      previousMonthVci: 58.0,
      currentRainfallMm: 78.0,
      longTermAvgRainfallMm: 82.0,
      rainfallDeficitPercent: -4.9,
      temperatureAnomalyC: 3.5,
      consecutiveDeclineWeeks: 2,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// THEME HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function getDroughtClassTheme(droughtClass: DroughtClass) {
  switch (droughtClass) {
    case 'Extreme':
      return {
        bg: 'bg-rose-950/40 border-rose-500/50',
        badge: 'bg-rose-600 text-white',
        text: 'text-rose-400',
        glow: 'shadow-[0_0_30px_rgba(244,63,94,0.25)]',
        gaugeColor: '#f43f5e',
        icon: ShieldAlert,
        label: 'CRITICAL: EXTREME DROUGHT RISK FORECAST',
      };
    case 'Severe':
      return {
        bg: 'bg-red-950/40 border-red-500/50',
        badge: 'bg-red-500 text-white',
        text: 'text-red-400',
        glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]',
        gaugeColor: '#ef4444',
        icon: AlertTriangle,
        label: 'HIGH ALERT: SEVERE DROUGHT RISK FORECAST',
      };
    case 'Moderate':
      return {
        bg: 'bg-amber-950/40 border-amber-500/50',
        badge: 'bg-amber-500 text-black font-bold',
        text: 'text-amber-400',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        gaugeColor: '#f59e0b',
        icon: AlertTriangle,
        label: 'WARNING: MODERATE DROUGHT RISK FORECAST',
      };
    case 'Mild':
      return {
        bg: 'bg-yellow-950/30 border-yellow-500/40',
        badge: 'bg-yellow-500 text-black font-bold',
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.1)]',
        gaugeColor: '#eab308',
        icon: Info,
        label: 'ADVISORY: MILD DROUGHT RISK FORECAST',
      };
    case 'No drought':
    default:
      return {
        bg: 'bg-emerald-950/30 border-emerald-500/40',
        badge: 'bg-emerald-500 text-black font-bold',
        text: 'text-emerald-400',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        gaugeColor: '#10b981',
        icon: CheckCircle2,
        label: 'FAVORABLE: NO DROUGHT RISK DETECTED',
      };
  }
}

function getConfidenceBadge(level: ConfidenceLevel) {
  switch (level) {
    case 'Very High':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'High':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    case 'Medium':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Low':
      return 'bg-red-500/20 text-red-300 border-red-500/40';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export function DroughtPredictionDashboard() {
  const [result, setResult] = useState<DroughtPredictionApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showInputEditor, setShowInputEditor] = useState(false);
  const [customInput, setCustomInput] = useState<DroughtPredictionInput>(DEMO_SCENARIOS[2].input);

  const runPrediction = useCallback(async (input: DroughtPredictionInput, scenarioName?: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveScenario(scenarioName || 'Custom');

    try {
      const res = await fetch('/api/drought-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }

      const data: DroughtPredictionApiResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to run drought prediction');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleScenarioClick = (scenario: typeof DEMO_SCENARIOS[0]) => {
    setCustomInput(scenario.input);
    runPrediction(scenario.input, scenario.name);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runPrediction(customInput);
  };

  const updateField = (field: keyof DroughtPredictionInput, value: string) => {
    setCustomInput((prev) => ({
      ...prev,
      [field]: field === 'areaName' || field === 'monthLabel' ? value : parseFloat(value) || 0,
    }));
  };

  return (
    <div className="space-y-6">
      {/* ── Scenario Selector ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-eco-neon" />
            Test Scenarios — Select a Drought Profile
          </h3>
          <button
            onClick={() => setShowInputEditor(!showInputEditor)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all bg-white/[0.02]"
          >
            <Cpu className="w-3.5 h-3.5" />
            {showInputEditor ? 'Hide' : 'Show'} Input Editor
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {DEMO_SCENARIOS.map((scenario) => {
            const isActive = activeScenario === scenario.name;
            const colorMap: Record<string, string> = {
              rose: isActive ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'border-rose-500/20 text-rose-400/70 hover:border-rose-500/40',
              red: isActive ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'border-red-500/20 text-red-400/70 hover:border-red-500/40',
              amber: isActive ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'border-amber-500/20 text-amber-400/70 hover:border-amber-500/40',
              yellow: isActive ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'border-yellow-500/20 text-yellow-400/70 hover:border-yellow-500/40',
              emerald: isActive ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'border-emerald-500/20 text-emerald-400/70 hover:border-emerald-500/40',
              purple: isActive ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'border-purple-500/20 text-purple-400/70 hover:border-purple-500/40',
            };

            return (
              <button
                key={scenario.name}
                onClick={() => handleScenarioClick(scenario)}
                disabled={isLoading}
                className={`p-3 rounded-xl border text-left transition-all disabled:opacity-40 ${colorMap[scenario.color] || ''}`}
              >
                <p className="text-xs font-semibold">{scenario.name}</p>
                <p className="text-[10px] opacity-60 mt-0.5 line-clamp-2">{scenario.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Custom Input Editor ──────────────────────────────────────── */}
      {showInputEditor && (
        <form onSubmit={handleCustomSubmit} className="glass-panel rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-mono font-bold text-eco-neon uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Custom Input Features
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Text fields */}
            {(['areaName', 'monthLabel'] as const).map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">{field}</label>
                <input
                  type="text"
                  value={customInput[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white text-xs font-mono focus:outline-none focus:border-eco-neon/40 transition-all"
                />
              </div>
            ))}

            {/* Numeric fields */}
            {([
              { key: 'currentNdvi', label: 'Current NDVI' },
              { key: 'previousMonthNdvi', label: 'Prev Month NDVI' },
              { key: 'sameMonthLastYearNdvi', label: 'Same Month Last Yr' },
              { key: 'fiveYearAvgNdvi', label: '5-Year Avg NDVI' },
              { key: 'ndviSlope4Weeks', label: 'NDVI Slope 4w' },
              { key: 'ndviSlope8Weeks', label: 'NDVI Slope 8w' },
              { key: 'ndviSlope12Weeks', label: 'NDVI Slope 12w' },
              { key: 'currentVci', label: 'Current VCI (%)' },
              { key: 'previousMonthVci', label: 'Prev Month VCI (%)' },
              { key: 'currentRainfallMm', label: 'Rainfall (mm)' },
              { key: 'longTermAvgRainfallMm', label: 'LT Avg Rain (mm)' },
              { key: 'rainfallDeficitPercent', label: 'Rain Deficit (%)' },
              { key: 'temperatureAnomalyC', label: 'Temp Anomaly (°C)' },
              { key: 'consecutiveDeclineWeeks', label: 'Consec Decline Wks' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">{label}</label>
                <input
                  type="number"
                  step="any"
                  value={customInput[key as keyof DroughtPredictionInput] as number}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white text-xs font-mono focus:outline-none focus:border-eco-neon/40 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-eco-neon text-[#070C08] font-bold text-sm hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Run Prediction
            </button>
            <button
              type="button"
              onClick={() => setCustomInput(DEMO_SCENARIOS[2].input)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs hover:text-white hover:border-white/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </form>
      )}

      {/* ── Loading State ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-eco-neon/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-eco-neon animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-eco-neon/40 border-t-eco-neon animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Computing Drought Risk Forecast</p>
            <p className="text-zinc-500 text-xs mt-1 font-mono">Running rule-based scoring engine…</p>
          </div>
        </div>
      )}

      {/* ── Error State ───────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">Prediction Error</p>
            <p className="text-red-400/70 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results Dashboard ─────────────────────────────────────────── */}
      {!isLoading && !error && result && (
        <PredictionResultsPanel result={result} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS PANEL
// ═══════════════════════════════════════════════════════════════════════════
function PredictionResultsPanel({ result }: { result: DroughtPredictionApiResponse }) {
  const { prediction, input, metadata } = result;
  const theme = getDroughtClassTheme(prediction.droughtClass);
  const StatusIcon = theme.icon;

  return (
    <div className="space-y-5">
      {/* ── Risk Banner ─────────────────────────────────────────────── */}
      <div className={`glass-panel rounded-2xl p-6 border ${theme.bg} ${theme.glow} space-y-5 transition-all duration-300`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-eco-neon animate-pulse" />
                Rule-Based Scoring Engine v1.0
              </span>
              <span className={`text-xs font-mono uppercase px-3 py-0.5 rounded-full ${theme.badge}`}>
                {prediction.droughtClass}
              </span>
              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${getConfidenceBadge(prediction.confidence)}`}>
                {prediction.confidence} Confidence ({prediction.confidencePercent}%)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
              <StatusIcon className={`w-6 h-6 shrink-0 ${theme.text}`} />
              <span>{theme.label}</span>
            </h2>

            <p className="text-xs text-zinc-400 font-mono">
              Drought risk forecast for <span className="text-white font-semibold">{result.areaName}</span> — {result.monthLabel}
            </p>
          </div>

          {/* Risk Score Card */}
          <div className="shrink-0 flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-4 font-mono">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block uppercase">Risk Score</span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-3xl font-black text-white">{prediction.riskScore}</span>
                <span className="text-xs text-zinc-500">/ 100</span>
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `${theme.gaugeColor}25`,
                border: `1px solid ${theme.gaugeColor}60`,
              }}
            >
              <Flame className={`w-6 h-6 ${theme.text}`} />
            </div>
          </div>
        </div>

        {/* Explainable Summary */}
        <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-eco-neon uppercase tracking-wider">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Explainable Drought Risk Assessment</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed font-sans">
            {prediction.summary}
          </p>
        </div>

        {/* Main Reason */}
        <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
            <BarChart3 className="w-4 h-4 text-eco-neon shrink-0" />
            <span>Primary Driver</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {prediction.mainReason}
          </p>
        </div>

        {/* Non-Rainfall Cause Advisory */}
        {prediction.nonRainfallCauseAdvisory && (
          <div className="rounded-xl bg-purple-950/40 border border-purple-500/40 p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider block">
                ⚠️ Non-Rainfall Cause Advisory
              </span>
              <p className="text-xs text-purple-200/90 leading-relaxed font-sans">
                {prediction.nonRainfallCauseAdvisory}
              </p>
            </div>
          </div>
        )}

        {/* Applied Hard-Rule Overrides */}
        {prediction.appliedOverrides.length > 0 && (
          <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Hard-Rule Overrides Applied</span>
            </div>
            {prediction.appliedOverrides.map((override, i) => (
              <p key={i} className="text-xs text-rose-200/80 leading-relaxed pl-6">
                • {override}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Score Breakdown Grid ───────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-eco-neon" />
          Component Score Breakdown (5-Factor Weighted Model)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
          {[
            {
              label: 'VCI Stress',
              weight: '30%',
              score: prediction.scoreBreakdown.vciStressScore,
              icon: Waves,
              iconColor: 'text-cyan-400',
              barColor: 'bg-cyan-400',
              detail: `VCI: ${input.currentVci.toFixed(1)}%`,
            },
            {
              label: 'Rainfall Deficit',
              weight: '25%',
              score: prediction.scoreBreakdown.rainfallDeficitScore,
              icon: CloudRain,
              iconColor: 'text-sky-400',
              barColor: 'bg-sky-400',
              detail: `Deficit: ${input.rainfallDeficitPercent.toFixed(1)}%`,
            },
            {
              label: 'NDVI Decline',
              weight: '20%',
              score: prediction.scoreBreakdown.ndviDeclineTrendScore,
              icon: TrendingDown,
              iconColor: 'text-amber-400',
              barColor: 'bg-amber-400',
              detail: `Slope 4w: ${input.ndviSlope4Weeks.toFixed(1)}%`,
            },
            {
              label: 'NDVI Health',
              weight: '15%',
              score: prediction.scoreBreakdown.ndviHealthScore,
              icon: Sprout,
              iconColor: 'text-lime-400',
              barColor: 'bg-lime-400',
              detail: `NDVI: ${input.currentNdvi.toFixed(4)}`,
            },
            {
              label: 'Temp Anomaly',
              weight: '10%',
              score: prediction.scoreBreakdown.temperatureAnomalyScore,
              icon: ThermometerSun,
              iconColor: 'text-rose-400',
              barColor: 'bg-rose-400',
              detail: `+${input.temperatureAnomalyC.toFixed(1)}°C`,
            },
          ].map((factor) => {
            const FactorIcon = factor.icon;
            return (
              <div key={factor.label} className="rounded-xl bg-black/30 border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <FactorIcon className={`w-3.5 h-3.5 ${factor.iconColor}`} />
                    {factor.label} ({factor.weight})
                  </span>
                  <span className="text-white font-bold">{factor.score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${factor.barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block">{factor.detail}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Risk Score Gauge ───────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-eco-neon" />
            Composite Drought Risk Gauge
          </span>
          <span className="font-bold" style={{ color: theme.gaugeColor }}>
            Score: {prediction.riskScore}/100 — {prediction.droughtClass}
          </span>
        </div>

        {/* Gradient Progress Bar */}
        <div className="relative w-full h-5 rounded-full bg-zinc-800/80 overflow-hidden border border-white/10">
          <div
            className="absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out rounded-full"
            style={{
              width: `${prediction.riskScore}%`,
              background: `linear-gradient(90deg, #10b981 0%, #eab308 30%, #f59e0b 50%, #ef4444 75%, #f43f5e 100%)`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff] z-10 -ml-0.5"
            style={{ left: `${prediction.riskScore}%` }}
          />
        </div>

        {/* Scale Labels */}
        <div className="grid grid-cols-5 text-[10px] text-zinc-400 pt-0.5 text-center font-mono">
          <div className="text-emerald-400 text-left">
            <span>0–20</span>
            <span className="block text-[9px] text-zinc-500">No Drought</span>
          </div>
          <div className="text-yellow-400">
            <span>20–40</span>
            <span className="block text-[9px] text-zinc-500">Mild</span>
          </div>
          <div className="text-amber-400">
            <span>40–60</span>
            <span className="block text-[9px] text-zinc-500">Moderate</span>
          </div>
          <div className="text-red-400">
            <span>60–80</span>
            <span className="block text-[9px] text-zinc-500">Severe</span>
          </div>
          <div className="text-rose-400 text-right">
            <span>80–100</span>
            <span className="block text-[9px] text-zinc-500">Extreme</span>
          </div>
        </div>
      </div>

      {/* ── Recommended Action ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sprout className="w-4 h-4 text-emerald-400" />
          Recommended Action
        </h3>
        <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-4">
          <CheckCircle2 className="w-5 h-5 text-eco-neon shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-200 leading-relaxed">
            {prediction.recommendedAction}
          </p>
        </div>
      </div>

      {/* ── Input Features Summary Table ───────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-eco-neon" />
          Input Features Used
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-zinc-500 border-b border-white/[0.06]">
                <th className="text-left py-2 px-3 font-medium">Feature</th>
                <th className="text-right py-2 px-3 font-medium">Value</th>
                <th className="text-left py-2 px-3 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Current NDVI', value: input.currentNdvi.toFixed(4), cat: 'Vegetation' },
                { feature: 'Previous Month NDVI', value: input.previousMonthNdvi.toFixed(4), cat: 'Vegetation' },
                { feature: 'Same Month Last Year NDVI', value: input.sameMonthLastYearNdvi.toFixed(4), cat: 'Vegetation' },
                { feature: '5-Year Average NDVI', value: input.fiveYearAvgNdvi.toFixed(4), cat: 'Vegetation' },
                { feature: 'NDVI Slope (4 weeks)', value: `${input.ndviSlope4Weeks.toFixed(2)}%/wk`, cat: 'Trend' },
                { feature: 'NDVI Slope (8 weeks)', value: `${input.ndviSlope8Weeks.toFixed(2)}%/wk`, cat: 'Trend' },
                { feature: 'NDVI Slope (12 weeks)', value: `${input.ndviSlope12Weeks.toFixed(2)}%/wk`, cat: 'Trend' },
                { feature: 'Current VCI', value: `${input.currentVci.toFixed(1)}%`, cat: 'Condition' },
                { feature: 'Previous Month VCI', value: `${input.previousMonthVci.toFixed(1)}%`, cat: 'Condition' },
                { feature: 'Current Rainfall', value: `${input.currentRainfallMm.toFixed(1)} mm`, cat: 'Rainfall' },
                { feature: 'Long-Term Avg Rainfall', value: `${input.longTermAvgRainfallMm.toFixed(1)} mm`, cat: 'Rainfall' },
                { feature: 'Rainfall Deficit', value: `${input.rainfallDeficitPercent.toFixed(1)}%`, cat: 'Rainfall' },
                { feature: 'Temperature Anomaly', value: `${input.temperatureAnomalyC >= 0 ? '+' : ''}${input.temperatureAnomalyC.toFixed(1)}°C`, cat: 'Temperature' },
                { feature: 'Consecutive Decline Weeks', value: `${input.consecutiveDeclineWeeks ?? 0}`, cat: 'Trend' },
              ].map((row) => (
                <tr key={row.feature} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-zinc-300">{row.feature}</td>
                  <td className="py-2 px-3 text-right text-white font-semibold">{row.value}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                      {row.cat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Metadata Footer ───────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Model', val: metadata.modelVersion },
            { label: 'Type', val: prediction.modelType },
            { label: 'Computed', val: new Date(metadata.computedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
          ].map(({ label, val }) => (
            <span key={label} className="text-[10px] font-mono text-zinc-600 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              {label}: {val}
            </span>
          ))}
        </div>
        <p className="text-[10px] font-mono text-zinc-600 italic leading-relaxed">
          {metadata.disclaimer}
        </p>
      </div>
    </div>
  );
}
