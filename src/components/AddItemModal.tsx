'use client';

import React, { useState } from 'react';
import { X, Plus, Film } from 'lucide-react';
import { WatchStatus } from '@/types/watchlist';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; status: WatchStatus; episode: string }) => Promise<void>;
}

export default function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<WatchStatus>('Watchlist');
  const [episodeType, setEpisodeType] = useState<'none' | 'movie' | 'series'>('none');
  const [customEp, setCustomEp] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tontonan tidak boleh kosong');
      return;
    }

    let finalEpisode = 'None';
    if (episodeType === 'movie') finalEpisode = 'Movie';
    else if (episodeType === 'series') finalEpisode = customEp.trim() || '1';

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(),
        status,
        episode: finalEpisode,
      });
      setTitle('');
      setStatus('Watchlist');
      setEpisodeType('none');
      setCustomEp('1');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan tontonan ke Notion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111726] border border-slate-700/80 shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tambah Tontonan Baru</h2>
              <p className="text-xs text-slate-400">Langsung tersimpan ke database Notion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Judul Film / Anime / Series <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Jujutsu Kaisen S3..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status Tontonan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Watchlist', 'On Going', 'Finish'] as WatchStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    status === st
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Format / Progress Episode
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setEpisodeType('none')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                  episodeType === 'none'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setEpisodeType('movie')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                  episodeType === 'movie'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Movie
              </button>
              <button
                type="button"
                onClick={() => setEpisodeType('series')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                  episodeType === 'series'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Episode #
              </button>
            </div>

            {episodeType === 'series' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">Episode saat ini:</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customEp}
                  onChange={(e) => setCustomEp(e.target.value)}
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Notion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
