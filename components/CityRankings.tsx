'use client';

import React, { useState, useEffect } from 'react';
import {
  CityRankingItem,
  RankingsResponse,
  LocationSuggestion,
} from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import {
  Trophy,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Search,
  ArrowUpRight,
  Sparkles,
  Layers,
  Globe2,
  CheckCircle2,
  Activity,
  Filter,
} from 'lucide-react';

interface CityRankingsProps {
  onSelectCity: (location: LocationSuggestion) => void;
  currentCityName?: string;
}

export function CityRankings({ onSelectCity, currentCityName }: CityRankingsProps) {
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<
    'all' | 'top5' | 'stable' | 'vulnerable' | 'global' | 'india'
  >('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    fetch('/api/rankings')
      .then((res) => res.json())
      .then((json) => {
        if (json.rankings) {
          setData(json);
        }
      })
      .catch((err) => console.error('Failed to load city rankings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCityClick = (city: CityRankingItem) => {
    const loc: LocationSuggestion = {
      geonameId: city.geonameId || undefined,
      name: city.name,
      district: city.name,
      state: city.state || '',
      country: city.country,
      countryCode: city.countryCode,
      latitude: city.latitude || 0,
      longitude: city.longitude || 0,
      displayName: `${city.name}, ${city.state ? `${city.state}, ` : ''}${city.country}`,
      source: 'geonames',
    };
    onSelectCity(loc);

    // Smooth scroll to top search section
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="w-full glass-panel rounded-2xl p-8 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-eco-neon border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-400">Loading global city rankings &amp; benchmarks...</p>
      </div>
    );
  }

  if (!data || !data.rankings || data.rankings.length === 0) {
    return null;
  }

  const { summary, rankings } = data;

  // Filter logic
  let filtered = rankings;

  if (filterMode === 'top5') {
    filtered = rankings.slice(0, 5);
  } else if (filterMode === 'stable') {
    filtered = [...rankings].sort((a, b) => a.variance - b.variance).slice(0, 7);
  } else if (filterMode === 'vulnerable') {
    filtered = rankings.filter((c) => c.fiveYearAvgNdvi < 0.28 || c.category === 'vulnerable');
  } else if (filterMode === 'global') {
    filtered = rankings.filter((c) => c.country.toLowerCase() !== 'india');
  } else if (filterMode === 'india') {
    filtered = rankings.filter((c) => c.country.toLowerCase() === 'india');
  }

  if (searchFilter.trim()) {
    const q = searchFilter.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.state && c.state.toLowerCase().includes(q))
    );
  }

  return (
    <div className="w-full space-y-8 pt-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eco-900/50 border border-eco-700/50 text-eco-neon text-xs font-mono">
            <Trophy className="w-3.5 h-3.5" />
            <span>GLOBAL CITY BENCHMARKS &bull; 5-YEAR MULTI-TEMPORAL INDEX</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
            Vegetation Health Leaderboard &amp; Insights
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-2xl">
            Comparative analysis of green canopy density, temporal stability, and environmental vulnerability across world cities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/5 shrink-0">
          <Globe2 className="w-4 h-4 text-eco-neon" />
          <span>{rankings.length} Cities Evaluated (2021&ndash;2025)</span>
        </div>
      </div>

      {/* 4 Spotlight Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Greenest City */}
        <div
          onClick={() => summary.highestNdviCity && handleCityClick(summary.highestNdviCity)}
          className="group cursor-pointer glass-panel-glow rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Trophy className="w-3.5 h-3.5 text-eco-neon" />
              Peak Greenery (#1)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              Highest NDVI
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-white group-hover:text-eco-neon transition-colors">
                {summary.highestNdviCity.name}
              </h3>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-eco-neon transition-colors" />
            </div>
            <p className="text-xs text-zinc-400">
              {summary.highestNdviCity.state ? `${summary.highestNdviCity.state}, ` : ''}
              {summary.highestNdviCity.country}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
            <div>
              <span className="text-2xl font-bold text-eco-neon">
                {summary.highestNdviCity.fiveYearAvgNdvi.toFixed(4)}
              </span>
              <span className="text-[10px] text-zinc-500 ml-1">5-Yr Avg</span>
            </div>
            <StatusBadge status={summary.highestNdviCity.vegetationStatus} size="sm" />
          </div>

          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {summary.highestNdviCity.description || 'Highest recorded mean vegetation index with extensive year-round canopy coverage.'}
          </p>
        </div>

        {/* Card 2: Most Consistent Canopy */}
        <div
          onClick={() => summary.mostStableCity && handleCityClick(summary.mostStableCity)}
          className="group cursor-pointer glass-panel-glow rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-cyan-400 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Most Constant Avg
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              Lowest Fluctuation
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-white group-hover:text-cyan-400 transition-colors">
                {summary.mostStableCity.name}
              </h3>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400">
              {summary.mostStableCity.state ? `${summary.mostStableCity.state}, ` : ''}
              {summary.mostStableCity.country}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
            <div>
              <span className="text-2xl font-bold text-cyan-400">
                &plusmn;{(summary.mostStableCity.variance / 2).toFixed(4)}
              </span>
              <span className="text-[10px] text-zinc-500 ml-1">Variance</span>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
              Ultra Stable
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {summary.mostStableCity.description || 'Remarkably consistent vegetation density across all 5 calendar years with minimal climate variation.'}
          </p>
        </div>

        {/* Card 3: Vulnerable / Dense Urban Core */}
        <div
          onClick={() => summary.lowestNdviCity && handleCityClick(summary.lowestNdviCity)}
          className="group cursor-pointer glass-panel-glow rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-amber-400 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Dense Urban Core
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
              Low NDVI Zone
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-white group-hover:text-amber-400 transition-colors">
                {summary.lowestNdviCity.name}
              </h3>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400">
              {summary.lowestNdviCity.state ? `${summary.lowestNdviCity.state}, ` : ''}
              {summary.lowestNdviCity.country}
            </p>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
            <div>
              <span className="text-2xl font-bold text-amber-400">
                {summary.lowestNdviCity.fiveYearAvgNdvi.toFixed(4)}
              </span>
              <span className="text-[10px] text-zinc-500 ml-1">5-Yr Avg</span>
            </div>
            <StatusBadge status={summary.lowestNdviCity.vegetationStatus} size="sm" />
          </div>

          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            High impervious surface fraction and concrete coverage with reduced urban tree canopy.
          </p>
        </div>

        {/* Card 4: Most Improved / Dynamic Momentum */}
        {summary.mostImprovedCity && (
          <div
            onClick={() => handleCityClick(summary.mostImprovedCity!)}
            className="group cursor-pointer glass-panel-glow rounded-2xl p-5 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-eco-neon flex items-center gap-1.5 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-eco-neon" />
                Greening Momentum
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-eco-950/60 text-eco-neon border border-eco-neon/30">
                Dynamic Shift
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-display text-white group-hover:text-eco-neon transition-colors">
                  {summary.mostImprovedCity.name}
                </h3>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-eco-neon transition-colors" />
              </div>
              <p className="text-xs text-zinc-400">
                {summary.mostImprovedCity.state ? `${summary.mostImprovedCity.state}, ` : ''}
                {summary.mostImprovedCity.country}
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
              <div>
                <span className="text-2xl font-bold text-eco-neon">
                  +{summary.mostImprovedCity.trend5Yr.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-500 ml-1">Range Shift</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                Expanding
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
              {summary.mostImprovedCity.description || 'Demonstrating significant seasonal vegetative growth and canopy expansion.'}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Filter Bar & Leaderboard Table */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: 'all', label: 'All Ranked Cities' },
              { id: 'top5', label: '🌿 Top 5 Greenest' },
              { id: 'stable', label: '🛡️ Most Constant Average' },
              { id: 'vulnerable', label: '⚠️ Urban / Low Canopy' },
              { id: 'global', label: 'Global Metros' },
              { id: 'india', label: 'Indian Cities' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all ${
                  filterMode === tab.id
                    ? 'bg-eco-neon text-black font-semibold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search in Leaderboard */}
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search table..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-eco-neon/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 w-16">Rank</th>
                <th className="py-3 px-3">City &amp; Region</th>
                <th className="py-3 px-3 text-right">5-Yr Avg NDVI</th>
                <th className="py-3 px-3">Canopy Density</th>
                <th className="py-3 px-3 text-center">Stability Rating</th>
                <th className="py-3 px-3 text-center">Vegetation Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {filtered.map((city) => {
                const isCurrent =
                  currentCityName &&
                  city.name.toLowerCase() === currentCityName.toLowerCase();
                const densityBar = Math.max(0, Math.min(100, Math.round(city.fiveYearAvgNdvi * 100)));

                return (
                  <tr
                    key={`${city.name}-${city.country}-${city.rank}`}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isCurrent ? 'bg-eco-neon/10 border-l-2 border-eco-neon' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-bold">
                      {city.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs">
                          1
                        </span>
                      ) : city.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300/20 text-zinc-200 border border-zinc-300/40 text-xs">
                          2
                        </span>
                      ) : city.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/40 text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-xs pl-2">#{city.rank}</span>
                      )}
                    </td>

                    {/* City & Country */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span>{city.name}</span>
                            {city.countryCode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400 border border-white/5">
                                {city.countryCode}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {[city.state, city.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 5-Year Avg NDVI */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-eco-neon text-sm sm:text-base">
                        {city.fiveYearAvgNdvi.toFixed(4)}
                      </span>
                    </td>

                    {/* Density Meter */}
                    <td className="py-3.5 px-3 w-36">
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-eco-neon h-full rounded-full transition-all duration-500"
                          style={{ width: `${densityBar}%` }}
                        />
                      </div>
                    </td>

                    {/* Stability Rating */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[11px] px-2.5 py-1 rounded-full border ${
                          city.stabilityScore === 'Ultra Stable'
                            ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            : city.stabilityScore === 'High Stability'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : city.stabilityScore === 'Moderate'
                            ? 'bg-white/[0.04] border-white/10 text-zinc-400'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {city.stabilityScore} (&plusmn;{(city.variance / 2).toFixed(3)})
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <StatusBadge status={city.vegetationStatus} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleCityClick(city)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-eco-neon hover:text-black border border-white/10 text-white font-mono text-xs transition-all shadow-sm"
                      >
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-3 text-[11px] font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5">
          <span>Ranking methodology: 5-year median composites from Copernicus Sentinel-2 L2A (2021&ndash;2025)</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Click any city to load its real-time satellite telemetry
          </span>
        </div>
      </div>
    </div>
  );
}
