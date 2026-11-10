'use client';

import React from 'react';
import { WatchlistStats, WatchStatus } from '@/types/watchlist';
import { Layers, Play, Clock, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  stats: WatchlistStats;
  activeFilter: WatchStatus | 'All';
  onSelectFilter: (filter: WatchStatus | 'All') => void;
}

export default function StatsCards({ stats, activeFilter, onSelectFilter }: StatsCardsProps) {
  const cards = [
    {
      id: 'All' as const,
      label: 'Semua Tontonan',
      count: stats.total,
      icon: Layers,
    },
    {
      id: 'On Going' as const,
      label: 'Sedang Ditonton',
      count: stats.onGoing,
      icon: Play,
    },
    {
      id: 'Watchlist' as const,
      label: 'Rencana Nonton',
      count: stats.watchlist,
      icon: Clock,
    },
    {
      id: 'Finish' as const,
      label: 'Telah Selesai',
      count: stats.finish,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
      {cards.map((c) => {
        const isActive = activeFilter === c.id;
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(c.id)}
            className={`group relative text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
              isActive
                ? 'bg-zinc-900/90 border-white text-white shadow-xl ring-1 ring-white/10'
                : 'bg-zinc-950/60 hover:bg-zinc-900/40 border-zinc-850 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            {/* Active Top Bar Indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-white" />
            )}

            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-zinc-400 group-hover:text-zinc-300'
                }`}
              >
                {c.label}
              </span>
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
                {c.count}
              </span>
              <span className="text-xs text-zinc-500 font-medium">judul</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
