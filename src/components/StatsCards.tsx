'use client';

import React from 'react';
import { WatchlistStats, WatchStatus } from '@/types/watchlist';

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
      indicator: '●',
    },
    {
      id: 'On Going' as const,
      label: 'Sedang Ditonton',
      count: stats.onGoing,
      indicator: '▶',
    },
    {
      id: 'Watchlist' as const,
      label: 'Rencana Nonton',
      count: stats.watchlist,
      indicator: '⏱',
    },
    {
      id: 'Finish' as const,
      label: 'Telah Selesai',
      count: stats.finish,
      indicator: '✓',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
      {cards.map((c) => {
        const isActive = activeFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(c.id)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-zinc-900 border-white text-white shadow-md ring-1 ring-white/20'
                : 'bg-zinc-950/60 hover:bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase tracking-wider ${isActive ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}`}>
                {c.label}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{c.indicator}</span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
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
