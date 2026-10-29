'use client';

import React, { useState } from 'react';
import {
  Satellite,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Split,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { VERIFIED_SATELLITE_GALLERY } from '@/lib/satellite-gallery-data';
import { SatelliteGalleryItem } from '@/lib/types';

export function SatelliteSwipeExplorer() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0-100%
  const [activeLayer, setActiveLayer] = useState<'true_color' | 'false_color_nir' | 'ndvi_anomaly' | 'ndmi_moisture'>('true_color');

  const activeItem: SatelliteGalleryItem = VERIFIED_SATELLITE_GALLERY[selectedIndex];

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-5 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <Split className="w-3 h-3" />
              Interactive Before / After Swipe
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Copernicus &bull; NASA &bull; USGS Earth Observation
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <Satellite className="w-5 h-5 text-eco-neon" />
            <span>Satellite Disaster &amp; Environmental Swipe Explorer</span>
          </h3>
        </div>

        {/* Scene Selection Buttons */}
        <div className="flex items-center gap-1.5">
          {VERIFIED_SATELLITE_GALLERY.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                setSliderPosition(50);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedIndex === idx
                  ? 'bg-eco-neon text-black font-bold'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              {item.hazardType}
            </button>
          ))}
        </div>
      </div>

      {/* Layer View Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-zinc-500 text-[10px] uppercase mr-1">Layer:</span>
          <button
            type="button"
            onClick={() => setActiveLayer('true_color')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeLayer === 'true_color'
                ? 'bg-white/20 text-white font-bold'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            True Color (RGB)
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('false_color_nir')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeLayer === 'false_color_nir'
                ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            False Color NIR (Vegetation)
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('ndvi_anomaly')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeLayer === 'ndvi_anomaly'
                ? 'bg-eco-neon/20 text-eco-neon font-bold border border-eco-500/40'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            NDVI Anomaly Filter
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('ndmi_moisture')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeLayer === 'ndmi_moisture'
                ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
                : 'bg-white/[0.03] text-zinc-400 hover:text-white'
            }`}
          >
            NDMI Moisture &amp; Water
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real Satellite Imagery &bull; CC-BY 4.0 / NASA Open Data</span>
        </span>
      </div>

      {/* Interactive Swipe Canvas */}
      <div className="relative w-full h-[320px] sm:h-[460px] rounded-2xl overflow-hidden border border-white/15 bg-black select-none group">
        {/* "After" Image (Full background) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all"
          style={{
            backgroundImage: `url(${activeItem.afterImageUrl})`,
            filter:
              activeLayer === 'false_color_nir'
                ? 'contrast(1.3) hue-rotate(-30deg) saturate(1.8)'
                : activeLayer === 'ndvi_anomaly'
                ? 'contrast(1.4) sepia(0.2) hue-rotate(60deg)'
                : activeLayer === 'ndmi_moisture'
                ? 'contrast(1.3) hue-rotate(160deg) saturate(1.5)'
                : 'none',
          }}
        />

        {/* "Before" Image (Clipped by slider position) */}
        <div
          className="absolute inset-0 bg-cover bg-center border-r-2 border-eco-neon transition-all"
          style={{
            backgroundImage: `url(${activeItem.beforeImageUrl})`,
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            filter:
              activeLayer === 'false_color_nir'
                ? 'contrast(1.3) hue-rotate(-30deg) saturate(1.8)'
                : activeLayer === 'ndvi_anomaly'
                ? 'contrast(1.4) sepia(0.2) hue-rotate(60deg)'
                : activeLayer === 'ndmi_moisture'
                ? 'contrast(1.3) hue-rotate(160deg) saturate(1.5)'
                : 'none',
          }}
        />

        {/* Drag Handle Overlay */}
        <div
          className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-black/80 border-2 border-eco-neon text-eco-neon flex items-center justify-center shadow-[0_0_15px_#C6F135] text-xs">
            <Split className="w-4 h-4" />
          </div>
        </div>

        {/* Invisible Range Input for Interactive Dragging */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
          title="Drag left or right to swipe compare before and after satellite passes"
        />

        {/* Floating Labels */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>BEFORE: {activeItem.beforeDate}</span>
        </div>

        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>AFTER: {activeItem.afterDate}</span>
        </div>

        {/* Drag Hint at Bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-mono text-zinc-300 pointer-events-none">
          ↔ Drag slider across to reveal before vs. after comparison
        </div>
      </div>

      {/* Description & Metadata Panel */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
          <span className="font-bold text-white text-sm sm:text-base">
            {activeItem.title} &bull; <span className="text-zinc-400 text-xs">{activeItem.location}</span>
          </span>
          <span className="text-eco-neon text-[11px]">
            Sensor: {activeItem.sensor}
          </span>
        </div>

        <p className="text-zinc-300 font-sans text-xs sm:text-sm leading-relaxed">
          {activeItem.description}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500 border-t border-white/5">
          <span>Attribution: {activeItem.attribution}</span>
          <span>License: {activeItem.license}</span>
        </div>
      </div>
    </div>
  );
}
