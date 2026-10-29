/**
 * Client-safe VCI and drought classification utilities.
 * No Node.js or server-only imports — safe to use in 'use client' components.
 */

import { VciClassification, DroughtRiskCategory } from './types';

/**
 * Classifies Vegetation Condition Index (VCI) according to remote-sensing standards.
 * VCI = 100 * (Current NDVI - NDVI_min) / (NDVI_max - NDVI_min)
 */
export function classifyVci(vci: number | null): VciClassification {
  if (vci === null || Number.isNaN(vci)) return 'Normal';
  if (vci >= 60) return 'Good / Wet';
  if (vci >= 40) return 'Normal';
  if (vci >= 35) return 'Mild drought stress';
  if (vci >= 25) return 'Moderate drought';
  if (vci >= 15) return 'Severe drought';
  return 'Extreme drought';
}

/**
 * Returns a Tailwind color class for the given drought risk category.
 */
export function getRiskColor(category: DroughtRiskCategory): string {
  switch (category) {
    case 'No drought':
      return 'text-emerald-400';
    case 'Mild drought risk':
      return 'text-yellow-400';
    case 'Moderate drought risk':
      return 'text-orange-400';
    case 'High drought risk':
      return 'text-red-400';
    case 'Severe drought risk':
      return 'text-rose-400';
    default:
      return 'text-zinc-400';
  }
}

/**
 * Returns a Tailwind border/bg class pair for the given VCI classification.
 */
export function getVciClasses(vci: VciClassification): string {
  switch (vci) {
    case 'Good / Wet':
      return 'text-emerald-400 bg-emerald-950/50 border-emerald-700/40';
    case 'Normal':
      return 'text-lime-400 bg-lime-950/50 border-lime-700/40';
    case 'Mild drought stress':
      return 'text-yellow-400 bg-yellow-950/50 border-yellow-700/40';
    case 'Moderate drought':
      return 'text-orange-400 bg-orange-950/50 border-orange-700/40';
    case 'Severe drought':
      return 'text-red-400 bg-red-950/50 border-red-700/40';
    case 'Extreme drought':
      return 'text-rose-400 bg-rose-950/50 border-rose-700/40';
    default:
      return 'text-zinc-400 bg-zinc-900 border-zinc-700';
  }
}
