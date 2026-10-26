import React from 'react';
import { BookOpen, Layers, CheckCircle2, Info, Compass } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function VegetationInterpretation() {
  const categories = [
    {
      range: '< 0.2',
      status: 'Very Low',
      description:
        'Barren rock, sand, concrete, dense urban settlements, inland water bodies, or severely degraded terrain with negligible photosynthetic chlorophyll activity.',
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
    },
    {
      range: '0.2 – 0.5',
      status: 'Low/Moderate',
      description:
        'Sparse grasslands, shrublands, dryland crops, transition zones, or early-stage / stressed seasonal vegetation with modest canopy density.',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    },
    {
      range: '0.5 – 0.8',
      status: 'Healthy',
      description:
        'Vigorous agricultural crops at peak vegetative stages, temperate mixed forests, urban parklands, and dense healthy vegetative covers.',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
    },
    {
      range: '> 0.8',
      status: 'Very Healthy',
      description:
        'Tropical rainforests, undisturbed dense protected forests, or irrigated intensive agricultural canopies with maximum chlorophyll density and near-infrared reflectance.',
      color: 'border-eco-neon/40 bg-eco-900/40 text-eco-neon',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-eco-neon" />
            <span>Vegetation Index Interpretation &amp; Classification Standards</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Scientific remote sensing scale used to assess photosynthetic vigor and canopy biomass
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.status}
            className={`rounded-xl border p-4 backdrop-blur-sm space-y-2 ${cat.color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={cat.status} size="sm" />
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-white">
                  NDVI {cat.range}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300 font-sans">{cat.description}</p>
          </div>
        ))}
      </div>

      {/* Physics / Remote Sensing Details */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Multispectral Biophysical Formula:</span>
        </div>
        <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-eco-neon text-sm sm:text-base text-center font-bold tracking-wider">
          NDVI = (Band 8 [NIR] - Band 4 [Red]) / (Band 8 [NIR] + Band 4 [Red])
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400 text-[11px] pt-1">
          <div>
            <strong className="text-zinc-200">Red Band (665 nm):</strong> Strongly absorbed by active leaf chlorophyll pigments for photosynthesis.
          </div>
          <div>
            <strong className="text-zinc-200">Near-Infrared (842 nm):</strong> Strongly scattered and reflected by internal spongy mesophyll leaf cell structures.
          </div>
        </div>
      </div>
    </div>
  );
}
