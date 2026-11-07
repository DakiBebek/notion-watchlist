'use client';

import React, { useState } from 'react';
import { Play, Check, Clock, Plus, ExternalLink, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { WatchItem, WatchStatus } from '@/types/watchlist';

interface WatchlistCardProps {
  item: WatchItem;
  onUpdateStatus: (id: string, newStatus: WatchStatus) => Promise<void>;
  onIncrementEpisode: (id: string, currentEp: string) => Promise<void>;
  onEdit: (item: WatchItem) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function WatchlistCard({
  item,
  onUpdateStatus,
  onIncrementEpisode,
  onEdit,
  onDelete,
}: WatchlistCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: WatchStatus) => {
    switch (status) {
      case 'On Going':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          dot: 'bg-blue-400',
          label: 'On Going',
          icon: Play,
        };
      case 'Finish':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          label: 'Finish',
          icon: Check,
        };
      case 'Watchlist':
      default:
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          label: 'Watchlist',
          icon: Clock,
        };
    }
  };

  const statusConfig = getStatusBadge(item.status);
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = async (newStatus: WatchStatus) => {
    if (newStatus === item.status || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(item.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNextEpisode = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onIncrementEpisode(item.id, item.episode);
    } finally {
      setIsUpdating(false);
    }
  };

  const isNumericEpisode = !isNaN(parseInt(item.episode, 10));

  // Visual Gradient based on title string hash
  const getGradient = (str: string) => {
    const gradients = [
      'from-blue-600/30 via-indigo-600/20 to-purple-600/30',
      'from-emerald-600/30 via-teal-600/20 to-cyan-600/30',
      'from-rose-600/30 via-pink-600/20 to-purple-600/30',
      'from-amber-600/30 via-orange-600/20 to-red-600/30',
      'from-violet-600/30 via-purple-600/20 to-indigo-600/30',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div
      className={`group relative rounded-2xl bg-[#111726]/80 backdrop-blur-sm border border-slate-800/80 hover:border-slate-700 p-4 transition-all duration-200 flex flex-col justify-between glow-on-hover ${
        isUpdating ? 'opacity-70 pointer-events-none' : ''
      }`}
    >
      <div>
        {/* Cover / Header Poster */}
        <div className="relative mb-3.5 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/60 flex items-center justify-center">
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getGradient(item.title)} flex flex-col items-center justify-center p-4 text-center`}>
              {item.icon ? (
                <div className="w-12 h-12 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner mb-2 overflow-hidden">
                  {item.icon.startsWith('http') ? (
                    <img src={item.icon} alt="icon" className="w-full h-full object-cover" />
                  ) : (
                    item.icon
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/60 flex items-center justify-center text-lg font-bold text-slate-300 mb-2">
                  {item.title.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-300/80 line-clamp-1">
                {item.title}
              </span>
            </div>
          )}

          {/* Episode Badge Floating on Card */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/75 backdrop-blur-md text-slate-200 border border-white/10 shadow-sm">
              {item.episode === 'None' ? 'Belum Mulai' : item.episode === 'Movie' ? 'Movie' : `Ep. ${item.episode}`}
            </span>
            {isNumericEpisode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextEpisode();
                }}
                title="Tonton episode selanjutnya (+1)"
                className="p-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white backdrop-blur-md shadow-md transition transform active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Menu (Top Right) */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl py-1 z-20 text-xs">
                  <a
                    href={item.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800"
                    onClick={() => setShowMenu(false)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka di Notion
                  </a>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-800 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Tontonan
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm(`Hapus "${item.title}" dari Notion?`)) {
                        onDelete(item.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Arsipkan / Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base text-white tracking-tight line-clamp-2 mb-2 leading-snug" title={item.title}>
          {item.title}
        </h3>
      </div>

      {/* Footer / Status Switcher */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <select
            value={item.status}
            onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
            disabled={isUpdating}
            className={`w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${statusConfig.bg}`}
          >
            <option value="On Going" className="bg-slate-900 text-slate-200">▶ On Going</option>
            <option value="Watchlist" className="bg-slate-900 text-slate-200">⏱ Watchlist</option>
            <option value="Finish" className="bg-slate-900 text-slate-200">✓ Finish</option>
          </select>
        </div>

        <a
          href={item.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka di Notion"
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
