'use client';

import React, { useState, useEffect } from 'react';

import { AreaSearch } from '@/components/AreaSearch';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ConfigAlert } from '@/components/ConfigAlert';
import { NdviAnalysisResponse } from '@/lib/types';

import {
  Satellite,
  ShieldCheck,
  Database,
  Layers,
} from 'lucide-react';

interface SelectedLocation {
  name: string;
  district: string;
  state: string;
  country: string;
  displayName: string;
}

export default function HomePage() {
  const [activeLocation, setActiveLocation] =
    useState<SelectedLocation>({
      name: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      displayName: 'Pune, Maharashtra, India',
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

  const runAnalysis = async (location: SelectedLocation) => {
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
          area: location.district,
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-900/60 border border-eco-700/60 text-eco-neon text-xs font-mono">
          <Satellite className="w-3.5 h-3.5" />
          <span>
            REAL-TIME EARTH OBSERVATION &bull; SENTINEL-2 HARMONIZED
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Vegetation Health &amp; NDVI <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-eco-neon via-emerald-400 to-teal-400">
            Multi-Temporal Intelligence
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          College DBMS platform computing multi-year Normalized Difference Vegetation Index (NDVI)
          directly from Google Earth Engine. Query administrative districts across 5 complete calendar years
          (2021 &ndash; 2025) backed by a relational TiDB Cloud SQL database.
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
                Ready to Analyze Administrative Boundaries
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Search for an Indian city, select it from the suggestions,
                and the corresponding administrative district will be analyzed
                using the server-side Earth Engine pipeline.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No Fake / Hardcoded Data
              </span>

              <span>&bull;</span>

              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Relational SQL Logging
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
