'use client';

import React, { useState } from 'react';
import {
  History,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  Flame,
  CloudRain,
  Waves,
  Wind,
  FileCheck,
} from 'lucide-react';
import { VERIFIED_HISTORICAL_DISASTERS } from '@/lib/historical-disasters';
import { SourcedDisasterEvent } from '@/lib/types';

export function HistoricalEventExplorer() {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = VERIFIED_HISTORICAL_DISASTERS.filter((event) => {
    const matchesFilter = filterType === 'all' || event.hazardType.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <History className="w-3 h-3" />
              Verified Disaster Registry
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Government Gazettes &bull; IMD &bull; NASA Citations
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-eco-neon" />
            <span>Historical Disaster &amp; Climatological Benchmark Explorer</span>
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              filterType === 'all'
                ? 'bg-eco-neon text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            All Disasters ({VERIFIED_HISTORICAL_DISASTERS.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('drought')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              filterType === 'drought'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Droughts
          </button>
          <button
            type="button"
            onClick={() => setFilterType('flood')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              filterType === 'flood'
                ? 'bg-cyan-500 text-black font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Wet Inundation
          </button>
          <button
            type="button"
            onClick={() => setFilterType('cyclone')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              filterType === 'cyclone'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            Cyclones
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter verified disaster records by district, event name, or impact keyword (e.g. Ahilyanagar, 2018, Nisarga)..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-eco-neon/60 transition-all"
        />
      </div>

      {/* Sourced Records Grid */}
      <div className="grid grid-cols-1 gap-4 font-mono">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 hover:border-white/20 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <span className="text-xs uppercase px-2 py-0.5 rounded font-bold bg-white/[0.04] text-eco-neon border border-eco-500/30 inline-block mb-1">
                  {event.hazardType}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white font-display">
                  {event.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {event.location}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-eco-neon" />
                    {event.dateRange}
                  </span>
                </div>
              </div>

              {/* Official Gazette Reference Link */}
              <a
                href={event.officialReferenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs border border-white/10 transition-all shadow-sm"
              >
                <span>Government Gazette / Citation</span>
                <ExternalLink className="w-3.5 h-3.5 text-eco-neon" />
              </a>
            </div>

            {/* Impact Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Acreage &amp; Agrarian Impact</span>
                <span className="text-xs font-semibold text-white block leading-snug">
                  {event.impactMetrics.affectedAcreageOrPeople}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Satellite NDVI Anomaly</span>
                <span className="text-xs font-bold text-rose-400 block leading-snug">
                  {event.impactMetrics.satelliteNdviAnomaly}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Rainfall / Climatological Departure</span>
                <span className="text-xs font-semibold text-cyan-300 block leading-snug">
                  {event.impactMetrics.rainfallDepartureOrWindSpeed}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
              {event.evidenceSummary}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500 border-t border-white/5">
              <span>Source Authority: <strong className="text-zinc-400">{event.sourceAttribution}</strong></span>
              <span>Satellite Telemetry: <strong className="text-zinc-400">{event.satelliteSensor}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
