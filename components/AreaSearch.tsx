'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  Search,
  Loader2,
  Sparkles,
  MapPin,
  Satellite,
} from 'lucide-react';

interface LocationSuggestion {
  name: string;
  district: string;
  state: string;
  country: string;
  displayName: string;
  latitude?: number;
  longitude?: number;
  osmType?: string;
  osmId?: number | null;
}

interface AreaSearchProps {
  onSearch: (location: LocationSuggestion) => void;
  isLoading: boolean;
  initialArea?: string;
  errorMessage?: string | null;
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

    if (!query) {
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

        const data = await response.json();

        setSuggestions(data);
        setShowSuggestions(data.length > 0);
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

    /*
     * If the user selected a city from autocomplete, use the complete
     * city/district/state object.
     */
    if (selectedLocation) {
      setShowSuggestions(false);
      onSearch(selectedLocation);
      return;
    }

    /*
     * If the user manually typed an area, preserve the existing
     * district-based analysis behaviour.
     */
    const manualLocation: LocationSuggestion = {
      name: areaInput.trim(),
      district: areaInput.trim(),
      state: '',
      country: '',
      displayName: areaInput.trim(),
    };

    setShowSuggestions(false);
    onSearch(manualLocation);
  };

  const handleInputChange = (value: string) => {
    setAreaInput(value);

    /*
     * Once the user edits the input after selecting a suggestion,
     * the previous selection is no longer considered valid.
     */
    setSelectedLocation(null);
    setShowSuggestions(true);
  };

  const handleSuggestion = (suggestion: LocationSuggestion) => {
    setAreaInput(suggestion.name);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleQuickSearch = (item: {
    name: string;
    district: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
  }) => {
    const quickLocation: LocationSuggestion = {
      name: item.name,
      district: item.district,
      state: item.state,
      country: item.country,
      latitude: item.lat,
      longitude: item.lon,
      displayName: `${item.name}, ${item.country}`,
    };

    setAreaInput(item.name);
    setSelectedLocation(quickLocation);
    setShowSuggestions(false);
    onSearch(quickLocation);
  };

  const quickAreas = [
    { name: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lon: 73.8567 },
    { name: 'Bengaluru', district: 'Bangalore Urban', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946 },
    { name: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', district: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
    { name: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lon: 75.7873 },
    { name: 'Tokyo', district: 'Tokyo', state: 'Tookyoo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', district: 'Paris', state: 'Ile-de-France', country: 'France', lat: 48.8566, lon: 2.3522 },
    { name: 'New York', district: 'New York', state: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div ref={searchRef} className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center rounded-2xl glass-panel-glow p-2 transition-all focus-within:border-eco-neon/50">
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
              placeholder="Search any city worldwide..."
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
                  <span className="hidden sm:inline">
                    Processing GEE...
                  </span>
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

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
            <div className="px-4 py-2 border-b border-white/5 text-[10px] font-mono text-zinc-500">
              GLOBAL LOCATIONS
            </div>

            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.name}-${suggestion.state}-${index}`}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-eco-neon/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-xl bg-eco-900/50 border border-eco-700/40 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-eco-neon" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {suggestion.name}
                  </p>

                  <p className="text-xs text-zinc-500 truncate">
                    {[suggestion.district, suggestion.state, suggestion.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-mono">
          <span className="text-zinc-500">
            Selected:
          </span>

          <span className="text-eco-neon font-semibold">
            {selectedLocation.name}
          </span>

          <span className="text-zinc-600">
            →
          </span>

          <span className="text-zinc-400">
            Analysis boundary: {selectedLocation.district}
            {selectedLocation.state
              ? `, ${selectedLocation.state}`
              : ''}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
        <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-eco-neon" />
          QUICK SEARCH:
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

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-rose-300 text-sm flex items-start gap-3 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />

          <div className="space-y-1">
            <p className="font-medium">{errorMessage}</p>

            <p className="text-xs text-rose-400/80 font-mono">
              Search results use global location search. Analysis depends on
              finding a matching administrative boundary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
