'use client';

import React, { useState } from 'react';
import { Plus, ExternalLink, MoreVertical, Edit2, Trash2, Maximize2 } from 'lucide-react';
import { WatchItem, WatchStatus } from '@/types/watchlist';

interface WatchlistCardProps {
  item: WatchItem;
  onUpdateStatus: (id: string, newStatus: WatchStatus) => Promise<void>;
  onIncrementEpisode: (id: string, currentEp: string) => Promise<void>;
  onEdit: (item: WatchItem) => void;
  onDelete: (id: string) => Promise<void>;
  onImageClick?: (url: string, title: string) => void;
}

export default function WatchlistCard({
  item,
  onUpdateStatus,
  onIncrementEpisode,
  onEdit,
  onDelete,
  onImageClick,
}: WatchlistCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardImage = (!imageError && ((item.icon && item.icon.startsWith('http')) ? item.icon : item.cover)) || null;

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

  // Minimalist monochrome status styling
  const getStatusStyle = (status: WatchStatus) => {
    switch (status) {
      case 'On Going':
        return 'border-zinc-700 text-white bg-zinc-900';
      case 'Finish':
        return 'border-zinc-800 text-zinc-400 bg-zinc-950/60';
      case 'Watchlist':
      default:
        return 'border-zinc-800 text-zinc-300 bg-zinc-900/60';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 p-3.5 transition-all duration-200 flex flex-col justify-between minimal-card ${
        isUpdating ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div>
        {/* Cover / Header Poster */}
        <div className="relative mb-3 h-40 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/70 flex items-center justify-center">
          {cardImage ? (
            <div
              onClick={() => onImageClick?.(cardImage, item.title)}
              className="relative w-full h-full cursor-zoom-in group/img"
              title="Klik untuk melihat ukuran penuh"
            >
              <img
                src={cardImage}
                alt={item.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="p-1.5 px-3 rounded-lg bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-lg transform scale-95 group-hover/img:scale-100 transition-transform flex items-center gap-1.5 text-xs font-medium">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Lihat Full</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 flex flex-col items-center justify-center p-4 text-center">
              {item.icon ? (
                <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl shadow-inner mb-2 overflow-hidden">
                  {item.icon.startsWith('http') ? (
                    <img src={item.icon} alt="icon" className="w-full h-full object-cover" />
                  ) : (
                    item.icon
                  )}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-xs font-mono font-bold text-zinc-300 mb-2">
                  {item.title.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[90%]">
                {item.title}
              </span>
            </div>
          )}

          {/* Episode Badge Floating on Card */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-lg bg-black/85 backdrop-blur-md text-zinc-200 border border-white/10 shadow-sm">
              {item.episode === 'None' ? 'Belum Mulai' : item.episode === 'Movie' ? 'Movie' : `Ep. ${item.episode}`}
            </span>
            {isNumericEpisode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextEpisode();
                }}
                title="Tonton episode selanjutnya (+1)"
                className="p-1 rounded-md bg-white hover:bg-zinc-200 text-black shadow transition active:scale-90 font-bold"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Action Menu (Top Right) */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-zinc-300 hover:text-white backdrop-blur-md border border-white/10 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl py-1 z-20 text-xs text-zinc-300">
                  <a
                    href={item.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-900 hover:text-white transition"
                    onClick={() => setShowMenu(false)}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    Buka di Notion
                  </a>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-900 hover:text-white text-left transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    Edit Tontonan
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm(`Hapus "${item.title}" dari Notion?`)) {
                        onDelete(item.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus / Arsipkan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-sm sm:text-base text-white tracking-tight line-clamp-2 leading-snug" title={item.title}>
          {item.title}
        </h3>
      </div>

      {/* Footer / Status Switcher */}
      <div className="mt-3 pt-3 border-t border-zinc-800/70 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <select
            value={item.status}
            onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
            disabled={isUpdating}
            className={`w-full text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:border-zinc-500 transition ${getStatusStyle(item.status)}`}
          >
            <option value="On Going" className="bg-zinc-950 text-white">▶ On Going</option>
            <option value="Watchlist" className="bg-zinc-950 text-zinc-300">⏱ Watchlist</option>
            <option value="Finish" className="bg-zinc-950 text-zinc-400">✓ Finish</option>
          </select>
        </div>

        <a
          href={item.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Buka di Notion"
          className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
