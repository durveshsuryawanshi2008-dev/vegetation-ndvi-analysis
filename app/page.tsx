'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  RotateCw,
  Radio,
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

const LOCAL_STORAGE_LOCATION_KEY = 'ndvi_analyzer_active_location';
const DEFAULT_BACKGROUND_POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function HomePage() {
  const [activeLocation, setActiveLocation] = useState<LocationSuggestion | null>(null);
  const [analysisData, setAnalysisData] = useState<NdviAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true for auto-fetch on open
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Background auto-refresh state
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);
  const [isPollingPaused, setIsPollingPaused] = useState<boolean>(false);

  // Refs for request cancellation and preventing duplicate calls in React StrictMode
  const initialLoadTriggeredRef = useRef<boolean>(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const activeLocationRef = useRef<LocationSuggestion | null>(null);
  const analysisDataRef = useRef<NdviAnalysisResponse | null>(null);
  const lastCheckTimestampRef = useRef<number>(Date.now());

  // Keep refs synchronized with state
  activeLocationRef.current = activeLocation;
  analysisDataRef.current = analysisData;

  /**
   * Updates browser URL and localStorage to preserve selected location across reloads
   */
  const persistLocation = (loc: LocationSuggestion) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOCATION_KEY, JSON.stringify(loc));
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('area', loc.name);
        if (loc.district) url.searchParams.set('district', loc.district);
        if (loc.state) url.searchParams.set('state', loc.state);
        if (loc.country) url.searchParams.set('country', loc.country);
        if (loc.latitude) url.searchParams.set('lat', String(loc.latitude));
        if (loc.longitude) url.searchParams.set('lon', String(loc.longitude));
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  /**
   * Resolves the initial location to query upon app open / reload.
   * Priority:
   * 1. URL Query Parameters (?area=...)
   * 2. LocalStorage (last selected location)
   * 3. Existing primary quick-select region (Ahilyanagar - Drought Focus)
   */
  const resolveInitialLocation = (): LocationSuggestion => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const areaParam = params.get('area') || params.get('district');
        if (areaParam) {
          const match = QUICK_SELECTION_REGIONS.find(
            (r) => r.name.toLowerCase() === areaParam.toLowerCase() || r.district?.toLowerCase() === areaParam.toLowerCase()
          );
          if (match) return match;

          const lat = params.get('lat') ? parseFloat(params.get('lat')!) : 19.0946;
          const lon = params.get('lon') ? parseFloat(params.get('lon')!) : 74.7384;
          return {
            name: areaParam,
            district: params.get('district') || undefined,
            state: params.get('state') || undefined,
            country: params.get('country') || 'India',
            displayName: `${areaParam}, ${params.get('state') || ''}`,
            latitude: Number.isNaN(lat) ? 19.0946 : lat,
            longitude: Number.isNaN(lon) ? 74.7384 : lon,
            source: 'local',
          };
        }

        const stored = localStorage.getItem(LOCAL_STORAGE_LOCATION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.name) return parsed;
        }
      } catch {
        // Fallback to default quick select
      }
    }
    return QUICK_SELECTION_REGIONS[0];
  };

  /**
   * Executes the full live satellite NDVI analysis via POST /api/ndvi.
   * Supports bounded exponential backoff for transient network issues.
   */
  const runAnalysis = useCallback(
    async (location: LocationSuggestion, options: { forceLive?: boolean; retryCount?: number } = {}) => {
      // Abort any prior in-flight request
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }

      const controller = new AbortController();
      activeControllerRef.current = controller;
      isFetchingRef.current = true;

      setIsLoading(true);
      setErrorMessage(null);
      setActiveLocation(location);
      persistLocation(location);

      const forceLive = options.forceLive !== undefined ? options.forceLive : true;
      const retryCount = options.retryCount || 0;

      try {
        const response = await fetch('/api/ndvi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
          cache: 'no-store',
          signal: controller.signal,
          body: JSON.stringify({
            area: location.name,
            geonameId: location.geonameId,
            district: location.district,
            state: location.state,
            country: location.country,
            countryCode: location.countryCode,
            forceLive, // Ensures request reaches Earth Engine directly
            coordinates:
              typeof location.latitude === 'number' && typeof location.longitude === 'number'
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }
                : undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // If transient error (503/504) and haven't retried yet, retry once with exponential backoff
          if ((response.status === 503 || response.status === 504) && retryCount < 1 && !controller.signal.aborted) {
            console.warn(`[Auto-Fetch] Transient ${response.status} from satellite API, retrying in 1.5s...`);
            await new Promise((r) => setTimeout(r, 1500));
            if (!controller.signal.aborted) {
              return runAnalysis(location, { forceLive, retryCount: retryCount + 1 });
            }
          }

          throw new Error(result.error || `Analysis request failed with status ${response.status}`);
        }

        setAnalysisData(result);
        setLastCheckedAt(new Date().toISOString());
        lastCheckTimestampRef.current = Date.now();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Clean abort; another request superseded this one
          return;
        }

        console.error('[Auto-Fetch] Error fetching live satellite telemetry:', err);
        setErrorMessage(
          err.message || 'Failed to complete live vegetation analysis from Earth Engine. Please try again.'
        );
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Lightweight probe: checks whether newer Copernicus Sentinel-2 imagery exists
   * without rerunning expensive 5-year raster reductions if imagery is unchanged.
   */
  const checkForNewerSatelliteData = useCallback(async () => {
    const loc = activeLocationRef.current;
    const currentData = analysisDataRef.current;

    if (!loc || isFetchingRef.current || isCheckingUpdates) {
      return;
    }

    setIsCheckingUpdates(true);
    try {
      const currentAcqDate = currentData?.latestObservation?.acquisitionDate;
      const currentTimestamp = currentData?.latestObservation?.acquisitionTimestamp;

      const res = await fetch('/api/ndvi/check-latest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
        cache: 'no-store',
        body: JSON.stringify({
          area: loc.name,
          district: loc.district,
          state: loc.state,
          country: loc.country,
          currentAcquisitionDate: currentAcqDate,
          currentTimestamp: currentTimestamp,
          coordinates:
            typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
              ? { latitude: loc.latitude, longitude: loc.longitude }
              : undefined,
        }),
      });

      const checkResult = await res.json();
      setLastCheckedAt(new Date().toISOString());
      lastCheckTimestampRef.current = Date.now();

      if (checkResult.hasNewer) {
        console.log(
          `[Background Poller] Newer satellite observation detected (${checkResult.latestAcquisitionDate}). Recalculating full NDVI...`
        );
        runAnalysis(loc, { forceLive: true });
      } else {
        console.log('[Background Poller] Satellite observation verified. Up-to-date.');
      }
    } catch (pollErr) {
      console.warn('[Background Poller] Lightweight check skipped:', pollErr);
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [isCheckingUpdates, runAnalysis]);

  /**
   * 1. Initial Auto-Fetch on Page Open and Refresh:
   * Resolves the selected location and immediately initiates the live Earth Engine request.
   */
  useEffect(() => {
    // Check API health status in background
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch(() => {});

    if (initialLoadTriggeredRef.current) {
      return;
    }
    initialLoadTriggeredRef.current = true;

    const initialLoc = resolveInitialLocation();
    runAnalysis(initialLoc, { forceLive: true });

    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [runAnalysis]);

  /**
   * 2. Background Polling & Tab Visibility Listener:
   * Periodically checks for new satellite data every 15 minutes.
   * Pauses when the browser tab is hidden and resumes when visible.
   */
  useEffect(() => {
    const intervalTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForNewerSatelliteData();
      }
    }, DEFAULT_BACKGROUND_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPollingPaused(true);
      } else {
        setIsPollingPaused(false);
        // If more than 15 minutes elapsed since last check, trigger an immediate verification
        if (Date.now() - lastCheckTimestampRef.current > DEFAULT_BACKGROUND_POLL_INTERVAL_MS) {
          checkForNewerSatelliteData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForNewerSatelliteData]);

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
          Live server-side data fetched automatically on site open and page reload.
        </p>

        {healthStatus && !healthStatus.earthEngine?.configured && (
          <div className="pt-2 text-left">
            <ConfigAlert />
          </div>
        )}
      </section>

      {/* ── Search Bar Section ────────────────────────────────────────── */}
      <section className="w-full space-y-4">
        <AreaSearch
          onSearch={(loc) => runAnalysis(loc, { forceLive: true })}
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
              onClick={() => runAnalysis(loc, { forceLive: true })}
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
        {isLoading && !analysisData ? (
          <LoadingSkeleton areaName={activeLocation?.name || 'Selected Region'} />
        ) : analysisData ? (
          <AnalysisDashboard
            data={analysisData}
            onRefresh={() => activeLocation && runAnalysis(activeLocation, { forceLive: true })}
            isRefreshing={isLoading}
            lastCheckedAt={lastCheckedAt}
            isCheckingUpdates={isCheckingUpdates}
            isPollingPaused={isPollingPaused}
          />
        ) : (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 border-dashed border-white/15">
            <div className="w-16 h-16 rounded-2xl bg-eco-900/50 border border-eco-700/50 flex items-center justify-center mx-auto text-eco-neon shadow-[0_0_25px_rgba(198,241,53,0.2)]">
              <Layers className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-xl text-white">
                Loading Live Satellite Observation
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Connecting to Google Earth Engine and querying Copernicus Sentinel-2 multispectral surface reflectance...
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Global City Vegetation Health Leaderboard & Benchmarks */}
      <section className="w-full pt-10 border-t border-white/10">
        <CityRankings
          onSelectCity={(cityLoc) => runAnalysis(cityLoc, { forceLive: true })}
          currentCityName={activeLocation?.name}
        />
      </section>
    </div>
  );
}
