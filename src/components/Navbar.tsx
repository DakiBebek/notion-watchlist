'use client';

import React from 'react';
import { Film, Plus, RefreshCw, ExternalLink, Lock } from 'lucide-react';

interface NavbarProps {
  onAddClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLock?: () => void;
}

export default function Navbar({ onAddClick, onRefresh, isRefreshing, onLock }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#09090b]/80 border-b border-zinc-850 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
            <Film className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base sm:text-lg text-white tracking-tight">Watchlist</h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Notion Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono hidden sm:block">Film & Series Tracker</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onLock && (
            <button
              onClick={onLock}
              title="Kunci Layar (Keluar)"
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition active:scale-95"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sinkronisasi dari Notion"
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          </button>

          <a
            href="https://notion.so"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition"
          >
            Notion
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl transition shadow-sm transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah</span>
          </button>
        </div>
      </div>
    </header>
  );
}
