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
} from 'lucide-react';

export default function HomePage() {
  const [activeLocation, setActiveLocation] =
    useState<LocationSuggestion>({
      geonameId: 1259229,
      name: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      countryCode: 'IN',
      displayName: 'Pune, Maharashtra, India',
      latitude: 18.5204,
      longitude: 73.8567,
      source: 'geonames',
    });

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
          'Failed to complete vegetation analysis.'
      );

      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <section className="text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-eco-900/60 border border-eco-700/60 text-eco-neon text-xs font-mono shadow-[0_0_15px_rgba(198,241,53,0.15)]">
          <Satellite className="w-3.5 h-3.5" />
          <span>
            GLOBAL EARTH OBSERVATION &bull; SENTINEL-2 SURFACE REFLECTANCE
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Vegetation Health &amp; NDVI <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-neon via-emerald-400 to-teal-400">
            Multi-Temporal Intelligence
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          High-resolution satellite analytics calculating 5-year multi-temporal vegetation health (2021 &ndash; 2025)
          for cities worldwide. Powered by Google Earth Engine, Copernicus Sentinel-2 multispectral imagery, and high-speed database caching.
        </p>

        {healthStatus &&
          !healthStatus.earthEngine?.configured && (
            <div className="pt-2 text-left">
              <ConfigAlert />
            </div>
          )}
      </section>

      <section className="w-full">
        <AreaSearch
          onSearch={runAnalysis}
          isLoading={isLoading}
          initialArea={activeLocation.name}
          errorMessage={errorMessage}
        />
      </section>

      <section className="w-full pt-4">
        {isLoading ? (
          <LoadingSkeleton
            areaName={activeLocation.name}
          />
        ) : analysisData ? (
          <AnalysisDashboard
            data={analysisData}
            onRefresh={() => runAnalysis(activeLocation)}
            isRefreshing={isLoading}
          />
        ) : (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-eco-900/50 border border-eco-700/50 flex items-center justify-center mx-auto text-eco-neon">
              <Layers className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">
                Ready to Analyze Worldwide Vegetation Health
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Search any city or municipality worldwide to compute real-time
                5-year NDVI trajectories using server-side Earth Engine satellite telemetry.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Real Satellite Telemetry
              </span>

              <span>&bull;</span>

              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Persistent Historical Cache
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
