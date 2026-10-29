'use client';

import React, { useState, useEffect } from 'react';

import { AreaSearch } from '@/components/AreaSearch';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ConfigAlert } from '@/components/ConfigAlert';
import { CityRankings } from '@/components/CityRankings';
import { NdviAnalysisResponse, LocationSuggestion } from '@/lib/types';

import {
  Satellite,
  ShieldCheck,
  Database,
  Layers,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Activity,
} from 'lucide-react';

const QUICK_SELECTION_REGIONS: LocationSuggestion[] = [
  {
    name: 'Ahilyanagar',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Ahilyanagar (Ahmednagar), Maharashtra, India',
    latitude: 19.0946,
    longitude: 74.7384,
    source: 'geonames',
  },
  {
    name: 'Solapur',
    district: 'Solapur',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Solapur, Maharashtra, India',
    latitude: 17.6805,
    longitude: 75.9064,
    source: 'geonames',
  },
  {
    name: 'Latur',
    district: 'Latur',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Latur, Maharashtra, India',
    latitude: 18.4088,
    longitude: 76.5604,
    source: 'geonames',
  },
  {
    name: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Pune, Maharashtra, India',
    latitude: 18.5204,
    longitude: 73.8567,
    source: 'geonames',
  },
  {
    name: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Nashik, Maharashtra, India',
    latitude: 19.9975,
    longitude: 73.7898,
    source: 'geonames',
  },
  {
    name: 'Beed',
    district: 'Bid',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Beed, Maharashtra, India',
    latitude: 18.9902,
    longitude: 75.7607,
    source: 'geonames',
  },
  {
    name: 'Chhatrapati Sambhajinagar',
    district: 'Aurangabad',
    state: 'Maharashtra',
    country: 'India',
    countryCode: 'IN',
    displayName: 'Chhatrapati Sambhajinagar (Aurangabad), Maharashtra',
    latitude: 19.8762,
    longitude: 75.3433,
    source: 'geonames',
  },
];

export default function HomePage() {
  const [activeLocation, setActiveLocation] =
    useState<LocationSuggestion | null>(null);

  const [analysisData, setAnalysisData] =
    useState<NdviAnalysisResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [healthStatus, setHealthStatus] =
    useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch(() => {});
    // NOTE: Auto-start on Pune has been removed as requested.
    // The user can choose any district or use the search bar.
  }, []);

  const runAnalysis = async (location: LocationSuggestion) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveLocation(location);

    try {
      const response = await fetch('/api/ndvi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: location.name,
          geonameId: location.geonameId,
          district: location.district,
          state: location.state,
          country: location.country,
          countryCode: location.countryCode,
          forceLive: true, // Always pull fresh real-world data from Google Earth Engine
          coordinates:
            typeof location.latitude === 'number' &&
            typeof location.longitude === 'number'
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                }
              : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Analysis request failed with status ${response.status}`
        );
      }

      setAnalysisData(result);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Failed to complete live vegetation analysis from Earth Engine.'
      );

      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* ── Hero Title Section ────────────────────────────────────────── */}
      <section className="text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-eco-900/60 border border-eco-700/60 text-eco-neon text-xs font-mono shadow-[0_0_15px_rgba(198,241,53,0.15)]">
          <Satellite className="w-3.5 h-3.5 animate-pulse" />
          <span>
            LIVE GOOGLE EARTH ENGINE OBSERVATORY &bull; SENTINEL-2 &bull; CHIRPS PRECIPITATION
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Live Vegetation Health &amp; Drought <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-neon via-emerald-400 to-teal-400">
            Early Warning Intelligence
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Real-time satellite Earth Engine analytics calculating weekly, monthly, and multi-year NDVI trajectories.
          Predicts drought events by comparing the latest index directly against last month's baseline.
        </p>

        {healthStatus &&
          !healthStatus.earthEngine?.configured && (
            <div className="pt-2 text-left">
              <ConfigAlert />
            </div>
          )}
      </section>

      {/* ── Search Bar Section ────────────────────────────────────────── */}
      <section className="w-full space-y-4">
        <AreaSearch
          onSearch={runAnalysis}
          isLoading={isLoading}
          initialArea={activeLocation?.name || ''}
          errorMessage={errorMessage}
        />

        {/* Quick Selection Location Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-mono uppercase text-zinc-500 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-eco-neon" />
            Quick Select District:
          </span>
          {QUICK_SELECTION_REGIONS.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => runAnalysis(loc)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeLocation?.name === loc.name
                  ? 'bg-eco-neon text-black font-bold border-eco-neon shadow-[0_0_15px_rgba(198,241,53,0.3)]'
                  : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              <span>{loc.name}</span>
              {loc.name === 'Ahilyanagar' && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  Drought Focus
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Analysis / Result Display ────────────────────────────── */}
      <section className="w-full pt-4">
        {isLoading ? (
          <LoadingSkeleton
            areaName={activeLocation?.name || 'Selected Region'}
          />
        ) : analysisData ? (
          <AnalysisDashboard
            data={analysisData}
            onRefresh={() => activeLocation && runAnalysis(activeLocation)}
            isRefreshing={isLoading}
          />
        ) : (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 border-dashed border-white/15">
            <div className="w-16 h-16 rounded-2xl bg-eco-900/50 border border-eco-700/50 flex items-center justify-center mx-auto text-eco-neon shadow-[0_0_25px_rgba(198,241,53,0.2)]">
              <Layers className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-xl text-white">
                Select a District to Launch Live Satellite Analysis
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Click any of the quick-select districts above (such as <strong className="text-white">Ahilyanagar</strong>, <strong className="text-white">Solapur</strong>, or <strong className="text-white">Latur</strong>) or type any location into the search bar.
                Data is computed live from Copernicus Sentinel-2 multispectral surface reflectance on Google Earth Engine.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-eco-neon">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Earth Engine Pipeline
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Monthly &amp; Weekly Indices
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <TrendingDown className="w-3.5 h-3.5" />
                MoM Drought Predictor
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Global City Vegetation Health Leaderboard & Benchmarks */}
      <section className="w-full pt-10 border-t border-white/10">
        <CityRankings
          onSelectCity={runAnalysis}
          currentCityName={activeLocation?.name}
        />
      </section>
    </div>
  );
}
