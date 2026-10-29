'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DroughtMonitorResponse } from '@/lib/types';
import { DroughtForecastCard } from '@/components/drought/DroughtForecastCard';
import { DroughtKPIs } from '@/components/drought/DroughtKPIs';
import { DroughtTimeSeriesChart } from '@/components/drought/DroughtTimeSeriesChart';
import { RainfallNdviDualAxisChart } from '@/components/drought/RainfallNdviDualAxisChart';
import { MultiYearNdviMatrix } from '@/components/drought/MultiYearNdviMatrix';
import { WeeklyChangeTable } from '@/components/drought/WeeklyChangeTable';
import { DroughtHistoricalTable } from '@/components/drought/DroughtHistoricalTable';
import { DroughtAdvisoryPanel } from '@/components/drought/DroughtAdvisoryPanel';
import {
  Satellite,
  Search,
  MapPin,
  RefreshCw,
  Loader2,
  AlertCircle,
  Brain,
  Layers,
  Activity,
  Calendar,
  Droplets,
  ThermometerSun,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Maharashtra districts for 1-click quick access
const QUICK_DISTRICTS = [
  { name: 'Ahilyanagar', lat: 19.0946, lon: 74.7384, tag: 'Drought-Prone Focus' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, tag: 'Western Ghats / Semi-Arid' },
  { name: 'Solapur', lat: 17.6805, lon: 75.9064, tag: 'Rain Shadow Zone' },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898, tag: 'Horticulture Belt' },
  { name: 'Latur', lat: 18.4088, lon: 76.5604, tag: 'Marathwada Dry Belt' },
  { name: 'Osmanabad', lat: 18.1861, lon: 76.0378, tag: 'Severe Deficit Belt' },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433, tag: 'Central Marathwada' },
  { name: 'Jalgaon', lat: 21.0077, lon: 75.5626, tag: 'Khandesh Belt' },
];

export default function AllInOneHomePage() {
  const [selectedArea, setSelectedArea] = useState<string>('Ahilyanagar');
  const [inputValue, setInputValue] = useState<string>('Ahilyanagar');
  const [data, setData] = useState<DroughtMonitorResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'forecast' | 'multiyear' | 'weekly' | 'charts' | 'table'>('all');

  // Fetch telemetry for a selected area
  const fetchAreaTelemetry = useCallback(async (areaName: string, lat?: number, lon?: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedArea(areaName);

    try {
      const response = await fetch('/api/drought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: areaName,
          state: 'Maharashtra',
          country: 'India',
          coordinates: lat && lon ? { latitude: lat, longitude: lon } : undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || `Server responded with status ${response.status}`);
      }

      setData(json);
    } catch (err: any) {
      console.error('Telemetry fetch error:', err);
      setErrorMessage(err.message || 'Failed to fetch satellite telemetry.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: fetch Ahilyanagar automatically
  useEffect(() => {
    fetchAreaTelemetry('Ahilyanagar', 19.0946, 74.7384);
  }, [fetchAreaTelemetry]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      fetchAreaTelemetry(inputValue.trim());
    }
  };

  const handleDistrictChip = (d: typeof QUICK_DISTRICTS[0]) => {
    setInputValue(d.name);
    fetchAreaTelemetry(d.name, d.lat, d.lon);
  };

  return (
    <div className="min-h-screen bg-[#070C08] text-white">
      {/* ── Top Hero & Banner ────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-[#0D1B0F] via-[#09120A] to-[#070C08] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-900/60 border border-eco-neon/30 text-eco-neon text-xs font-mono shadow-[0_0_15px_rgba(198,241,53,0.15)]">
                <Satellite className="w-3.5 h-3.5" />
                <span>LOCAL HOST ALL-IN-ONE &bull; SENTINEL-2 &bull; MODIS &bull; CHIRPS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
                NDVI Multi-Temporal &amp; <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-neon via-emerald-400 to-teal-400">
                  Agricultural Drought Predictor
                </span>
              </h1>
              <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
                Comprehensive all-in-one system computing <strong>5-year annual, monthly, and weekly NDVI indices</strong>,
                historical vegetation condition index (VCI), rainfall anomalies, and explainable drought risk forecasts.
              </p>
            </div>

            {/* Quick Methodology Toggle */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <button
                type="button"
                onClick={() => setShowMethodology((p) => !p)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-eco-neon transition-all"
              >
                <Brain className="w-4 h-4" />
                <span>How Drought Is Predicted via NDVI</span>
                {showMethodology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[11px] font-mono text-zinc-500">
                Running locally on http://localhost:3000
              </span>
            </div>
          </div>

          {/* Expandable Methodology Explanation Box */}
          {showMethodology && (
            <div className="p-6 rounded-2xl bg-black/40 border border-eco-neon/20 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-eco-neon text-xs font-mono font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Scientific Methodology: How We Predict Drought by NDVI</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <span className="text-eco-neon font-mono font-bold">1. Vegetation Condition Index (VCI)</span>
                  <p className="leading-relaxed text-zinc-400">
                    VCI normalizes current NDVI against the long-term historical minimum and maximum NDVI for the <strong>same calendar month</strong>:
                  </p>
                  <code className="block bg-black/50 p-2 rounded text-[11px] text-eco-neon font-mono">
                    VCI = 100 × (NDVI - Min) / (Max - Min)
                  </code>
                  <p className="text-[11px] text-zinc-500">VCI &lt; 35 indicates drought stress; &lt; 20 indicates severe collapse.</p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <span className="text-blue-400 font-mono font-bold">2. NDVI Anomaly &amp; Trend Slopes</span>
                  <p className="leading-relaxed text-zinc-400">
                    Calculates departure from the 5-year climatological baseline, plus <strong>4-week, 8-week, and 12-week linear regression slopes</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Consecutive weeks of negative slope signal progressive canopy desiccation and moisture depletion.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <span className="text-amber-400 font-mono font-bold">3. Multi-Factor Scoring &amp; Overrides</span>
                  <p className="leading-relaxed text-zinc-400">
                    Weighted synthesis: 30% VCI + 25% CHIRPS Rainfall Deficit + 20% Multi-Week Slope + 15% 5-Yr Anomaly + 10% LST Temperature.
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Deterministic safety overrides immediately elevate to Severe if 4+ weeks of decline coincide with VCI &lt; 25.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Search & Quick Chips Bar ───────────────────────────────── */}
          <div className="space-y-3 pt-2">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter district or city (e.g. Ahilyanagar, Pune, Solapur, Latur)…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-eco-neon/50 focus:bg-eco-900/20 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-eco-neon text-[#070C08] font-bold text-sm hover:bg-lime-300 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Analyze Area</span>
              </button>
            </form>

            {/* Quick District Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Quick Districts:</span>
              {QUICK_DISTRICTS.map((d) => (
                <button
                  key={d.name}
                  onClick={() => handleDistrictChip(d)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                    selectedArea.toLowerCase() === d.name.toLowerCase()
                      ? 'bg-eco-neon/20 border-eco-neon text-eco-neon font-bold shadow-[0_0_10px_rgba(198,241,53,0.15)]'
                      : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                  title={d.tag}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{d.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Body ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-2 border-eco-neon/20 flex items-center justify-center">
                <Satellite className="w-8 h-8 text-eco-neon animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-eco-neon border-t-transparent animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Extracting Multi-Temporal Satellite Telemetry</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Processing Sentinel-2 SR, MODIS 10-Yr Baseline, and CHIRPS for <span className="text-eco-neon font-semibold">{selectedArea}</span>
              </p>
              <div className="flex items-center justify-center gap-3 mt-4 text-[11px] font-mono text-zinc-500">
                <span>[1] Sentinel-2 Cloud Masking</span>
                <span>&bull;</span>
                <span>[2] MODIS VCI Reduction</span>
                <span>&bull;</span>
                <span>[3] CHIRPS Deficit</span>
                <span>&bull;</span>
                <span>[4] Drought Predictor Engine</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-bold text-base text-red-300">Analysis Request Failed</h4>
              <p className="text-sm text-red-300/80 leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => fetchAreaTelemetry(selectedArea)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-900 border border-red-700 text-xs font-mono text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Analysis Dashboard */}
        {!isLoading && !errorMessage && data && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-eco-neon" />
                <h2 className="text-2xl font-bold font-display text-white">{data.area}</h2>
                <span className="text-sm text-zinc-400 font-mono">
                  ({data.state ? `${data.state}, ` : ''}{data.country})
                </span>
                {data.areaKm2 && (
                  <span className="text-xs font-mono text-zinc-500 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                    ~{Math.round(data.areaKm2).toLocaleString()} km²
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchAreaTelemetry(data.area)}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-all self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate Telemetry</span>
              </button>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.06]">
              {[
                { id: 'all', label: 'All-In-One Unified View', icon: Sparkles },
                { id: 'forecast', label: 'Drought Predictor by NDVI', icon: Brain },
                { id: 'multiyear', label: '5-Year All-Year NDVI Matrix', icon: Layers },
                { id: 'weekly', label: 'Weekly NDVI & Changes', icon: Activity },
                { id: 'charts', label: 'Time Series & Rainfall Charts', icon: Droplets },
                { id: 'table', label: 'Historical Table & Advisory', icon: Calendar },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'bg-eco-neon text-[#070C08] font-bold shadow-[0_0_15px_rgba(198,241,53,0.25)]'
                      : 'bg-white/[0.02] text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* ── SECTION 1: DROUGHT PREDICTOR BY NDVI ─────────────────────── */}
            {(activeTab === 'all' || activeTab === 'forecast') && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-eco-neon" />
                    <h3 className="text-lg font-bold text-white">Drought Predictor Engine (NDVI-Based)</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    Rule-Based &bull; ML-Calibrated &bull; Explainable
                  </span>
                </div>

                {data.forecast && (
                  <DroughtForecastCard
                    forecast={data.forecast}
                    mlForecast={data.mlForecast}
                    slopes={data.slopes}
                    areaName={data.area}
                  />
                )}

                {/* Key KPIs Grid */}
                {(() => {
                  const latestMonth = data.monthlySeries?.[data.monthlySeries.length - 1];
                  return (
                    <DroughtKPIs
                      currentNdvi={data.currentNdvi}
                      currentVci={data.currentVci}
                      vciClassification={data.prediction?.vciClassification || 'Normal'}
                      currentAnomaly={data.currentAnomaly}
                      currentAnomalyPercent={data.currentAnomalyPercent}
                      rainfallMm={latestMonth?.rainfallMm ?? null}
                      historicalAvgRainfallMm={latestMonth?.historicalAvgRainfallMm ?? null}
                      rainfallDeficitPercent={data.currentRainfallDeficit}
                    />
                  );
                })()}
              </section>
            )}

            {/* ── SECTION 2: 5-YEAR ALL-YEAR NDVI MATRIX ───────────────────── */}
            {(activeTab === 'all' || activeTab === 'multiyear') && data.multiYearComparison && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-eco-neon" />
                    <h3 className="text-lg font-bold text-white">
                      Last 5 Years &amp; Monthly NDVI Comparison Matrix
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    2020 &bull; 2021 &bull; 2022 &bull; 2023 &bull; 2024 &bull; 2025
                  </span>
                </div>

                <MultiYearNdviMatrix
                  comparison={data.multiYearComparison}
                  areaName={data.area}
                />
              </section>
            )}

            {/* ── SECTION 3: WEEKLY NDVI CHANGE TRACKER ───────────────────── */}
            {(activeTab === 'all' || activeTab === 'weekly') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-eco-neon" />
                    <h3 className="text-lg font-bold text-white">
                      Weekly NDVI Index &amp; Week-over-Week Change Velocity
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    12-Week Sentinel-2 SR Rolling Analysis
                  </span>
                </div>

                <WeeklyChangeTable
                  weeklySeries={data.weeklySeries}
                  areaName={data.area}
                />
              </section>
            )}

            {/* ── SECTION 4: TIME SERIES CHARTS & DUAL-AXIS RAINFALL ───────── */}
            {(activeTab === 'all' || activeTab === 'charts') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">
                      Time Series Trajectory &amp; Rainfall Correlation
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    5-Yr Annual &bull; Monthly &bull; Weekly &bull; CHIRPS Dual-Axis
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <DroughtTimeSeriesChart
                    weeklySeries={data.weeklySeries}
                    monthlySeries={data.monthlySeries}
                    seasonalSeries={data.seasonalSeries}
                    yearlySeries={data.yearlySeries}
                    areaName={data.area}
                  />
                  <RainfallNdviDualAxisChart monthlySeries={data.monthlySeries} />
                </div>
              </section>
            )}

            {/* ── SECTION 5: MONTHLY HISTORICAL TABLE & ADVISORIES ────────── */}
            {(activeTab === 'all' || activeTab === 'table') && (
              <section className="space-y-6">
                <DroughtHistoricalTable monthlySeries={data.monthlySeries} />

                <DroughtAdvisoryPanel
                  riskCategory={data.prediction?.riskCategory || 'No drought'}
                  advisories={data.prediction?.agriculturalAdvisories || []}
                  area={data.area}
                />
              </section>
            )}

            {/* Metadata Footer */}
            {data.metadata && (
              <div className="border-t border-white/[0.06] pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                <div className="flex flex-wrap gap-2">
                  <span>NDVI: {data.metadata.satelliteSource}</span>
                  <span>&bull;</span>
                  <span>Precipitation: {data.metadata.precipitationSource}</span>
                  <span>&bull;</span>
                  <span>LST: {data.metadata.temperatureSource}</span>
                </div>
                <span>Calculated at: {new Date(data.metadata.calculatedAt).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
