'use client';

import React, { useState, useRef } from 'react';
import { X, Plus, Film, Image as ImageIcon, Upload, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { WatchStatus } from '@/types/watchlist';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; status: WatchStatus; episode: string; coverUrl?: string | null }) => Promise<void>;
}

export default function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<WatchStatus>('Watchlist');
  const [episodeType, setEpisodeType] = useState<'none' | 'movie' | 'series'>('none');
  const [customEp, setCustomEp] = useState('1');

  // Image Upload / URL states
  const [coverUrl, setCoverUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle file selection from local device (Phone gallery / PC files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengupload gambar');
      }

      setCoverUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setError(`Upload foto gagal: ${err.message}. Kamu juga bisa paste link gambar langsung.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setCoverUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tontonan tidak boleh kosong');
      return;
    }

    if (isUploading) {
      setError('Sedang mengunggah gambar, mohon tunggu sebentar...');
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
        coverUrl: coverUrl.trim() || null,
      });
      // Reset
      setTitle('');
      setStatus('Watchlist');
      setEpisodeType('none');
      setCustomEp('1');
      setCoverUrl('');
      setImagePreview(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan tontonan ke Notion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111726] border border-slate-700/80 shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tambah Tontonan Baru</h2>
              <p className="text-xs text-slate-400">Tersimpan otomatis ke database Notion</p>
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
          {/* Judul */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Judul Film / Anime / Series <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Jujutsu Kaisen, Suzume, dll..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500"
            />
          </div>

          {/* Upload Poster Gambar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Poster / Cover Gambar (Opsional)
              </label>
              <div className="flex text-[11px] gap-2 text-slate-400">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`hover:text-white ${uploadMode === 'file' ? 'text-blue-400 font-semibold' : ''}`}
                >
                  Upload File
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`hover:text-white ${uploadMode === 'url' ? 'text-blue-400 font-semibold' : ''}`}
                >
                  Link URL
                </button>
              </div>
            </div>

            {/* Preview Box */}
            {(imagePreview || coverUrl) ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center group">
                <img
                  src={imagePreview || coverUrl}
                  alt="Poster Preview"
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-xs text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span>Mengunggah poster...</span>
                  </div>
                )}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Hapus gambar"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : uploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 px-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500/80 bg-slate-900/50 hover:bg-slate-900/80 transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
                >
                  <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-medium text-slate-300 block">Pilih foto dari Galeri HP / Komputer</span>
                    <span className="text-[10px] text-slate-500">Mendukung JPG, PNG, WEBP</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://images.../poster.jpg"
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Status */}
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

          {/* Episode */}
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

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan ke Notion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
