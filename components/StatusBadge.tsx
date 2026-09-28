import React from 'react';
import { VegetationStatus } from '@/lib/types';
import { ShieldCheck, AlertTriangle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: VegetationStatus | string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const normStatus = status || 'Unknown';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-medium',
  };

  const getStyle = () => {
    switch (normStatus) {
      case 'Very Healthy':
        return {
          bg: 'bg-[#1C3A15] border-eco-neon/60 text-eco-neon shadow-[0_0_12px_rgba(198,241,53,0.2)]',
          dot: 'bg-eco-neon',
          icon: Sparkles,
        };
      case 'Healthy':
        return {
          bg: 'bg-[#0E2F1C] border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          dot: 'bg-emerald-400',
          icon: ShieldCheck,
        };
      case 'Low/Moderate':
        return {
          bg: 'bg-[#2E240B] border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-400',
          icon: AlertTriangle,
        };
      case 'Very Low':
        return {
          bg: 'bg-[#2E1212] border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
          dot: 'bg-rose-400',
          icon: AlertCircle,
        };
      default:
        return {
          bg: 'bg-zinc-800/80 border-zinc-700 text-zinc-400',
          dot: 'bg-zinc-500',
          icon: HelpCircle,
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono border tracking-wide transition-all ${sizeClasses[size]} ${style.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{normStatus}</span>
    </span>
  );
}
