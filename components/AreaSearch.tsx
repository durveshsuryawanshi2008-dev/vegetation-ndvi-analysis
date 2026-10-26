'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Loader2,
  Sparkles,
  MapPin,
  Satellite,
  Globe2,
  ArrowRight,
} from 'lucide-react';
import { LocationSuggestion } from '@/lib/types';

interface AreaSearchProps {
  onSearch: (location: LocationSuggestion) => void;
  isLoading: boolean;
  initialArea?: string;
  errorMessage?: string | null;
}

function getCleanRegion(state?: string, country?: string): string {
  // Strip numeric codes like "16", "17", "11", "02" and single-character codes
  const trimmed = (state || '').trim();
  const cleanState =
    trimmed && !/^\d+$/.test(trimmed) && trimmed.length > 1 ? trimmed : '';
  const parts = [cleanState, country].filter(Boolean);
  return parts.join(', ');
}

export function AreaSearch({
  onSearch,
  isLoading,
  initialArea = '',
  errorMessage,
}: AreaSearchProps) {
  const [areaInput, setAreaInput] = useState(initialArea);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAreaInput(initialArea);
  }, [initialArea]);

  useEffect(() => {
    const query = areaInput.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingLocations(true);

        const response = await fetch(
          `/api/locations?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error('Location search failed');
        }

        const data: LocationSuggestion[] = await response.json();

        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchingLocations(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [areaInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!areaInput.trim()) return;

    if (selectedLocation) {
      setShowSuggestions(false);
      onSearch(selectedLocation);
      return;
    }

    // If user hit Enter with suggestions open, pick the first one
    if (suggestions.length > 0) {
      const top = suggestions[0];
      setSelectedLocation(top);
      setShowSuggestions(false);
      onSearch(top);
      return;
    }

    const manualLocation: LocationSuggestion = {
      name: areaInput.trim(),
      district: areaInput.trim(),
      state: '',
      country: '',
      latitude: 0,
      longitude: 0,
      displayName: areaInput.trim(),
      source: 'local',
    };

    setShowSuggestions(false);
    onSearch(manualLocation);
  };

  const handleInputChange = (value: string) => {
    setAreaInput(value);
    setSelectedLocation(null);
  };

  const handleSuggestion = (suggestion: LocationSuggestion) => {
    setAreaInput(suggestion.name);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleQuickSearch = (item: {
    geonameId?: number;
    name: string;
    district: string;
    state: string;
    country: string;
    countryCode?: string;
    lat: number;
    lon: number;
    population?: number;
  }) => {
    const quickLocation: LocationSuggestion = {
      geonameId: item.geonameId,
      name: item.name,
      district: item.district,
      state: item.state,
      country: item.country,
      countryCode: item.countryCode,
      latitude: item.lat,
      longitude: item.lon,
      population: item.population,
      displayName: `${item.name}, ${item.country}`,
      source: 'geonames',
    };

    setAreaInput(item.name);
    setSelectedLocation(quickLocation);
    setShowSuggestions(false);
    onSearch(quickLocation);
  };

  const quickAreas = [
    { geonameId: 1259229, name: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', countryCode: 'IN', lat: 18.5204, lon: 73.8567 },
    { geonameId: 1277333, name: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', country: 'India', countryCode: 'IN', lat: 12.9716, lon: 77.5946 },
    { geonameId: 1275339, name: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', country: 'India', countryCode: 'IN', lat: 19.0760, lon: 72.8777 },
    { geonameId: 1273294, name: 'Delhi', district: 'Delhi', state: 'Delhi', country: 'India', countryCode: 'IN', lat: 28.6139, lon: 77.2090 },
    { geonameId: 2643743, name: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lon: -0.1278 },
    { geonameId: 2988507, name: 'Paris', district: 'Paris', state: 'Ile-de-France', country: 'France', countryCode: 'FR', lat: 48.8566, lon: 2.3522 },
    { geonameId: 1850147, name: 'Tokyo', district: 'Tokyo', state: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503 },
    { geonameId: 5128581, name: 'New York', district: 'New York', state: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060 },
    { geonameId: 3448439, name: 'São Paulo', district: 'São Paulo', state: 'Sao Paulo', country: 'Brazil', countryCode: 'BR', lat: -23.5475, lon: -46.6361 },
    { geonameId: 2147714, name: 'Sydney', district: 'Sydney', state: 'New South Wales', country: 'Australia', countryCode: 'AU', lat: -33.8688, lon: 151.2093 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div ref={searchRef} className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center rounded-2xl glass-panel-glow p-2 transition-all focus-within:border-eco-neon/60 focus-within:shadow-[0_0_25px_rgba(198,241,53,0.15)]">
            <div className="pl-3 pr-2 text-zinc-400">
              <MapPin className="w-5 h-5 text-eco-neon" />
            </div>

            <input
              type="text"
              value={areaInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={isLoading}
              placeholder="Search any city worldwide (e.g. Pune, London, Paris, Tokyo, São Paulo)..."
              autoComplete="off"
              className="w-full bg-transparent py-3 px-2 text-white placeholder-zinc-500 text-sm sm:text-base focus:outline-none disabled:opacity-50"
            />

            {searchingLocations && (
              <Loader2 className="w-4 h-4 mr-3 text-eco-neon animate-spin shrink-0" />
            )}

            <button
              type="submit"
              disabled={isLoading || !areaInput.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eco-neon text-black font-semibold text-sm hover:bg-[#b5e02e] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(198,241,53,0.3)] shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span className="hidden sm:inline">Processing GEE...</span>
                </>
              ) : (
                <>
                  <Satellite className="w-4 h-4 text-black" />
                  <span>Analyze NDVI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {showSuggestions && (
          <div className="absolute z-50 left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
            <div className="px-4 py-2.5 border-b border-white/5 text-[10px] font-mono text-zinc-400 flex items-center justify-between bg-white/[0.02]">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Globe2 className="w-3.5 h-3.5 text-eco-neon" />
                GLOBAL CITIES &amp; TOWNS
              </span>
              <span>{suggestions.length} MATCHES</span>
            </div>

            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => {
                const cleanRegion = getCleanRegion(suggestion.state, suggestion.country);
                return (
                  <button
                    key={`${suggestion.geonameId || suggestion.name}-${suggestion.countryCode || ''}-${index}`}
                    type="button"
                    onClick={() => handleSuggestion(suggestion)}
                    className="group w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-eco-neon/10 transition-colors border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-eco-900/40 border border-eco-700/40 flex items-center justify-center shrink-0 group-hover:border-eco-neon/60 transition-colors">
                        <MapPin className="w-4 h-4 text-eco-neon" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                          <span>{suggestion.name}</span>
                          {suggestion.countryCode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 border border-white/10">
                              {suggestion.countryCode}
                            </span>
                          )}
                        </p>

                        {cleanRegion && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            {cleanRegion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-mono text-eco-neon flex items-center gap-1">
                        Select <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })
            ) : !searchingLocations && areaInput.trim().length >= 2 ? (
              <div className="p-4 text-center text-xs font-mono text-zinc-500">
                No cities found matching &quot;{areaInput.trim()}&quot;. Check spelling or try a nearby city.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-mono">
          <span className="text-zinc-500">Selected:</span>
          <span className="text-eco-neon font-semibold">{selectedLocation.name}</span>
          {getCleanRegion(selectedLocation.state, selectedLocation.country) && (
            <>
              <span className="text-zinc-600">&bull;</span>
              <span className="text-zinc-400">
                {getCleanRegion(selectedLocation.state, selectedLocation.country)}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
        <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-eco-neon" />
          POPULAR CITIES:
        </span>

        {quickAreas.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => handleQuickSearch(item)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-eco-neon hover:border-eco-neon/40 hover:bg-eco-neon/10 transition-all font-mono text-xs disabled:opacity-50"
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="text-center pt-0.5">
        <span className="text-[10px] font-mono text-zinc-600 flex items-center justify-center gap-1">
          <Globe2 className="w-3 h-3" />
          Populated places index powered by GeoNames.org (Creative Commons Attribution 4.0)
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-rose-300 text-sm flex items-start gap-3 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>
            <p className="text-xs text-rose-400/80 font-mono">
              The analysis boundary or satellite data could not be retrieved. Please verify the city or try a nearby region.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
