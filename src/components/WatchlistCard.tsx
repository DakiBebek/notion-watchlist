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
  const canIncrementEpisode = isNumericEpisode && item.status !== 'Finish';

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
        <div className="relative mb-3 w-full aspect-[2/3] max-h-80 sm:max-h-96 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-850 flex items-center justify-center">
          {cardImage ? (
            <div
              onClick={() => onImageClick?.(cardImage, item.title)}
              className="relative w-full h-full cursor-zoom-in group/img flex items-center justify-center overflow-hidden bg-zinc-950"
              title="Klik untuk melihat ukuran penuh"
            >
              {/* Blurred ambient background */}
              <img
                src={cardImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125 pointer-events-none"
              />
              {/* Uncropped full image */}
              <img
                src={cardImage}
                alt={item.title}
                onError={() => setImageError(true)}
                className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              />
              <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="p-1.5 px-3 rounded-lg bg-black/85 backdrop-blur-md text-white border border-white/20 shadow-lg transform scale-95 group-hover/img:scale-100 transition-transform flex items-center gap-1.5 text-xs font-medium">
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
        </div>

        {/* Title & Action Menu */}
        <div className="flex items-start justify-between gap-1.5 mt-2.5">
          <h3 className="font-medium text-xs sm:text-sm text-white tracking-tight line-clamp-2 leading-snug flex-1" title={item.title}>
            {item.title}
          </h3>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 -mr-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
              title="Menu Opsi"
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
                    Hapus / Arsip
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Episode Progress & Status */}
      <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-2">
        {/* Episode Row (Above Status Selector) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Eps</span>
            <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-md bg-zinc-900 text-zinc-200 border border-zinc-800">
              {item.episode === 'None' ? 'Belum Mulai' : item.episode === 'Movie' ? 'Movie' : `Ep. ${item.episode}`}
            </span>
          </div>
          {canIncrementEpisode ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextEpisode();
              }}
              title="Tonton episode selanjutnya (+1)"
              className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-white hover:bg-zinc-200 text-black shadow-sm transition active:scale-90"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>1</span>
            </button>
          ) : item.status === 'Finish' ? (
            <span className="text-[10px] font-mono font-medium text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              ✓ Tamat
            </span>
          ) : null}
        </div>

        {/* Status Selector Row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="relative flex-1">
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value as WatchStatus)}
              disabled={isUpdating}
              className={`w-full text-xs font-mono font-medium py-1.5 px-2 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:border-zinc-500 transition ${getStatusStyle(item.status)}`}
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
            className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
