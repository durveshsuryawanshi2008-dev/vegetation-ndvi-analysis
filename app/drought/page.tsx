'use client';

import React, { useState, useCallback } from 'react';
import { DroughtMonitorResponse } from '@/lib/types';
import { DroughtRiskBanner } from '@/components/drought/DroughtRiskBanner';
import { DroughtKPIs } from '@/components/drought/DroughtKPIs';
import { DroughtTimeSeriesChart } from '@/components/drought/DroughtTimeSeriesChart';
import { RainfallNdviDualAxisChart } from '@/components/drought/RainfallNdviDualAxisChart';
import { DroughtHistoricalTable } from '@/components/drought/DroughtHistoricalTable';
import { DroughtAdvisoryPanel } from '@/components/drought/DroughtAdvisoryPanel';
import { DroughtForecastCard } from '@/components/drought/DroughtForecastCard';
import { MultiYearNdviMatrix } from '@/components/drought/MultiYearNdviMatrix';
import { WeeklyChangeTable } from '@/components/drought/WeeklyChangeTable';
import { Loader2, AlertCircle, MapPin, Satellite, Droplets, ThermometerSun, RefreshCw, Layers, Calendar, Activity, Sparkles, Brain } from 'lucide-react';

// Popular Maharashtra districts for quick access
const QUICK_DISTRICTS = [
  { name: 'Ahilyanagar', lat: 19.0946, lon: 74.7384 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433 },
  { name: 'Solapur', lat: 17.6805, lon: 75.9064 },
  { name: 'Latur', lat: 18.4088, lon: 76.5604 },
  { name: 'Osmanabad', lat: 18.1861, lon: 76.0378 },
  { name: 'Jalgaon', lat: 21.0077, lon: 75.5626 },
];

interface SearchState {
  area: string;
  lat?: number;
  lon?: number;
}

function LoadingOverlay({ area }: { area: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-eco-neon/20 flex items-center justify-center">
          <Satellite className="w-7 h-7 text-eco-neon animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-eco-neon/40 border-t-eco-neon animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg">Analyzing Drought Indicators</p>
        <p className="text-zinc-400 text-sm mt-1">Processing satellite data for <span className="text-eco-neon">{area}</span></p>
        <p className="text-zinc-600 text-xs mt-3 font-mono">
          S2 NDVI · CHIRPS Rainfall · MODIS LST · Historical Baseline
        </p>
      </div>
      <div className="flex gap-3">
        {['NDVI Calc', 'CHIRPS Rain', 'VCI Engine', 'Risk Score'].map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-full bg-eco-900/40 border border-eco-700/30 text-eco-neon"
            style={{ animationDelay: `${i * 300}ms` }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onSelectDistrict }: { onSelectDistrict: (d: typeof QUICK_DISTRICTS[0]) => void }) {
  return (
    <div className="space-y-8">
      {/* Hero text */}
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-eco-900/50 border border-eco-700/40 flex items-center justify-center mb-5">
          <Droplets className="w-10 h-10 text-eco-neon" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Agricultural Drought Monitor</h2>
        <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed text-sm">
          Live satellite-based drought intelligence for Maharashtra districts.
          Combines Sentinel-2 NDVI, CHIRPS rainfall, and MODIS Land Surface Temperature
          into a weighted drought risk prediction system.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Satellite className="w-5 h-5" />, label: 'Sentinel-2 NDVI', sub: 'Cloud-masked SR imagery' },
          { icon: <Droplets className="w-5 h-5" />, label: 'CHIRPS Rainfall', sub: 'Monthly & 3-month deficit' },
          { icon: <ThermometerSun className="w-5 h-5" />, label: 'MODIS LST', sub: 'Canopy thermal stress' },
          { icon: <AlertCircle className="w-5 h-5" />, label: 'VCI Engine', sub: 'Weighted risk scoring' },
        ].map((f) => (
          <div key={f.label} className="p-4 rounded-xl border border-white/[0.06] bg-[#0D1B0F]/60 text-center">
            <span className="text-eco-neon">{f.icon}</span>
            <p className="text-white text-xs font-semibold mt-2">{f.label}</p>
            <p className="text-zinc-500 text-[11px] mt-1">{f.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick district chips */}
      <div>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide mb-3">Quick Start — Maharashtra Districts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_DISTRICTS.map((d) => (
            <button
              key={d.name}
              onClick={() => onSelectDistrict(d)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 text-xs hover:border-eco-neon/40 hover:text-eco-neon hover:bg-eco-900/20 transition-all font-mono"
            >
              <MapPin className="w-3 h-3" />
              {d.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DroughtMonitorPage() {
  const [search, setSearch] = useState<SearchState | null>(null);
  const [data, setData] = useState<DroughtMonitorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'forecast' | 'multiyear' | 'weekly' | 'charts' | 'table'>('all');

  const fetchDroughtData = useCallback(async (area: string, lat?: number, lon?: number) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setSearch({ area, lat, lon });

    try {
      const res = await fetch('/api/drought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area,
          coordinates: lat && lon ? { latitude: lat, longitude: lon } : undefined,
          state: 'Maharashtra',
          country: 'India',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }

      const json: DroughtMonitorResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch drought data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;
    fetchDroughtData(val);
  };

  const handleQuickDistrict = (d: typeof QUICK_DISTRICTS[0]) => {
    setInputValue(d.name);
    fetchDroughtData(d.name, d.lat, d.lon);
  };

  const handleRefresh = () => {
    if (search) fetchDroughtData(search.area, search.lat, search.lon);
  };

  return (
    <main className="min-h-screen bg-[#070C08]">
      {/* Page header */}
      <div className="border-b border-white/[0.06] bg-[#0D1B0F]/80 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search form */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 min-w-[200px]">
              <div className="relative flex-1 max-w-md">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search district (e.g. Pune, Nashik, Latur)…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-eco-neon/40 focus:bg-eco-900/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 rounded-xl bg-eco-neon text-[#070C08] font-bold text-sm hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Analyze
              </button>
            </form>

            {/* Quick chips */}
            <div className="hidden md:flex items-center gap-1.5">
              {QUICK_DISTRICTS.slice(0, 5).map((d) => (
                <button
                  key={d.name}
                  onClick={() => handleQuickDistrict(d)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    search?.area === d.name
                      ? 'bg-eco-neon/15 border-eco-neon/40 text-eco-neon'
                      : 'border-white/08 text-zinc-500 hover:text-white hover:border-white/20 bg-transparent'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            {data && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh analysis"
                className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Loading */}
        {isLoading && search && <LoadingOverlay area={search.area} />}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold text-sm">Analysis Failed</p>
              <p className="text-red-400/70 text-sm mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-xs text-red-300 underline underline-offset-2 hover:text-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !data && (
          <EmptyState onSelectDistrict={handleQuickDistrict} />
        )}

        {/* Results */}
        {!isLoading && !error && data && (
          <div className="space-y-6">
            {/* Area header */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-eco-neon" />
                <h1 className="text-xl font-bold text-white">{data.area}</h1>
                {data.state && (
                  <span className="text-sm text-zinc-400">{data.state}, {data.country}</span>
                )}
              </div>
              {data.areaKm2 && (
                <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  ~{Math.round(data.areaKm2).toLocaleString()} km²
                </span>
              )}
              <span className="text-xs font-mono text-zinc-600 ml-auto">
                Updated {data.metadata?.calculatedAt ? new Date(data.metadata.calculatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'just now'}
              </span>
            </div>

            {/* View Filter Navigation Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.06] pt-1">
              {[
                { id: 'all', label: 'All Indicators', icon: Sparkles },
                { id: 'forecast', label: 'Drought Risk Forecast', icon: Brain },
                { id: 'multiyear', label: 'Multi-Year Matrix', icon: Layers },
                { id: 'weekly', label: 'Weekly Changes', icon: Activity },
                { id: 'charts', label: 'Time Series & Rainfall', icon: Droplets },
                { id: 'table', label: 'Monthly Table & Advisories', icon: Calendar },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                    activeSection === id
                      ? 'bg-eco-neon text-[#070C08] font-bold shadow-[0_0_15px_rgba(198,241,53,0.25)]'
                      : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Section 1: Forecast & Risk Card */}
            {(activeSection === 'all' || activeSection === 'forecast') && (
              <>
                {data.forecast ? (
                  <DroughtForecastCard
                    forecast={data.forecast}
                    mlForecast={data.mlForecast}
                    slopes={data.slopes}
                    areaName={data.area}
                  />
                ) : (
                  <DroughtRiskBanner
                    prediction={data.prediction}
                    areaName={data.area}
                    state={data.state}
                    country={data.country}
                  />
                )}

                {/* KPIs */}
                {(() => {
                  const latestMonth = data.monthlySeries?.[data.monthlySeries.length - 1];
                  return (
                    <DroughtKPIs
                      currentNdvi={data.currentNdvi}
                      currentVci={data.currentVci}
                      vciClassification={data.prediction.vciClassification}
                      currentAnomaly={data.currentAnomaly}
                      currentAnomalyPercent={data.currentAnomalyPercent}
                      rainfallMm={latestMonth?.rainfallMm ?? null}
                      historicalAvgRainfallMm={latestMonth?.historicalAvgRainfallMm ?? null}
                      rainfallDeficitPercent={data.currentRainfallDeficit}
                    />
                  );
                })()}
              </>
            )}

            {/* Section 2: Multi-Year NDVI Comparison Matrix */}
            {(activeSection === 'all' || activeSection === 'multiyear') && data.multiYearComparison && (
              <MultiYearNdviMatrix
                comparison={data.multiYearComparison}
                areaName={data.area}
              />
            )}

            {/* Section 3: Weekly Changes & Slopes Table */}
            {(activeSection === 'all' || activeSection === 'weekly') && (
              <WeeklyChangeTable
                weeklySeries={data.weeklySeries}
                areaName={data.area}
              />
            )}

            {/* Section 4: Time series + dual-axis charts side by side */}
            {(activeSection === 'all' || activeSection === 'charts') && (
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
            )}

            {/* Section 5: Monthly Historical table & Advisories */}
            {(activeSection === 'all' || activeSection === 'table') && (
              <div className="space-y-6">
                <DroughtHistoricalTable monthlySeries={data.monthlySeries} />

                <DroughtAdvisoryPanel
                  riskCategory={data.prediction.riskCategory}
                  advisories={data.prediction.agriculturalAdvisories}
                  area={data.area}
                />
              </div>
            )}

            {/* Metadata footer */}
            {data.metadata && (
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: 'NDVI', val: data.metadata?.satelliteSource },
                { label: 'Precip', val: data.metadata?.precipitationSource },
                { label: 'LST', val: data.metadata?.temperatureSource },
                { label: 'Boundary', val: data.metadata?.boundarySource },
              ].filter(({ val }) => val).map(({ label, val }) => (
                <span key={label} className="text-[10px] font-mono text-zinc-600 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  {label}: {val}
                </span>
              ))}
            </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
