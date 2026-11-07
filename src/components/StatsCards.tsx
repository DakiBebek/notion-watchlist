'use client';

import React from 'react';
import { Film, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';
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
      icon: Film,
      color: 'blue',
      activeRing: 'ring-blue-500/50 border-blue-500/40 bg-blue-950/20',
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      id: 'On Going' as const,
      label: 'Sedang Ditonton',
      count: stats.onGoing,
      icon: PlayCircle,
      color: 'sky',
      activeRing: 'ring-sky-500/50 border-sky-500/40 bg-sky-950/20',
      iconBg: 'bg-sky-500/10 text-sky-400',
    },
    {
      id: 'Watchlist' as const,
      label: 'Rencana Nonton',
      count: stats.watchlist,
      icon: Clock,
      color: 'amber',
      activeRing: 'ring-amber-500/50 border-amber-500/40 bg-amber-950/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
    {
      id: 'Finish' as const,
      label: 'Telah Selesai',
      count: stats.finish,
      icon: CheckCircle2,
      color: 'emerald',
      activeRing: 'ring-emerald-500/50 border-emerald-500/40 bg-emerald-950/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectFilter(c.id)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isActive
                ? `${c.activeRing} ring-2 shadow-lg`
                : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{c.label}</span>
              <div className={`p-2 rounded-xl ${c.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white">{c.count}</span>
              <span className="text-xs text-slate-500">judul</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
