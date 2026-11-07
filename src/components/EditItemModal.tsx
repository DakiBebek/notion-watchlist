'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit2, Image as ImageIcon, Upload, Trash2, Link as LinkIcon, Loader2, Key, Info } from 'lucide-react';
import { WatchItem, WatchStatus } from '@/types/watchlist';

interface EditItemModalProps {
  item: WatchItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { title: string; status: WatchStatus; episode: string; coverUrl?: string | null }) => Promise<void>;
}

export default function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<WatchStatus>('Watchlist');
  const [episode, setEpisode] = useState('None');

  // Cover states
  const [coverUrl, setCoverUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [imgbbKey, setImgbbKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('imgbb_api_key') || '';
      setImgbbKey(savedKey);
    }
  }, []);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setStatus(item.status);
      setEpisode(item.episode);
      const existingImg = (item.icon && item.icon.startsWith('http')) ? item.icon : (item.cover || '');
      setCoverUrl(existingImg);
      setImagePreview(existingImg || null);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const activeKey = imgbbKey.trim() || (typeof window !== 'undefined' ? localStorage.getItem('imgbb_api_key') || '' : '');

    if (!activeKey) {
      setShowKeyInput(true);
      setError('Untuk upload file dari HP/laptop, masukkan ImgBB API Key gratis di bawah atau gunakan tab "Link URL" untuk tempel link gambar.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${activeKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Gagal mengupload gambar ke ImgBB');
      }

      const uploadedUrl = data.data.display_url || data.data.url;
      setCoverUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
    } catch (err: any) {
      console.error(err);
      setError(`Upload foto gagal: ${err.message}. Coba gunakan opsi "Link URL".`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveKey = (val: string) => {
    setImgbbKey(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('imgbb_api_key', val.trim());
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
      setError('Sedang mengunggah gambar, mohon tunggu...');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(item.id, {
        title: title.trim(),
        status,
        episode: episode.trim() || 'None',
        coverUrl: coverUrl.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui tontonan di Notion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111726] border border-slate-700/80 shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Tontonan</h2>
              <p className="text-xs text-slate-400">Perubahan langsung tersimpan ke Notion</p>
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
              Judul
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white"
            />
          </div>

          {/* Poster / Cover Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                Poster / Cover Gambar
              </label>
              <div className="flex text-[11px] gap-2 text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`hover:text-white transition ${uploadMode === 'url' ? 'text-blue-400 font-bold' : ''}`}
                >
                  🔗 Link URL
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`hover:text-white transition ${uploadMode === 'file' ? 'text-blue-400 font-bold' : ''}`}
                >
                  📁 Upload File
                </button>
              </div>
            </div>

            {(imagePreview || coverUrl) ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center group mb-2">
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
            ) : null}

            {uploadMode === 'url' ? (
              <div>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    placeholder="Tempel link gambar (contoh: https://images.../poster.jpg)"
                    value={coverUrl}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setCoverUrl(val);
                      setImagePreview(val || null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Tips: Klik kanan gambar di Google / MAL &rarr; <b>Salin alamat gambar</b> &rarr; tempel di sini.</span>
                </p>
              </div>
            ) : (
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
                  className="w-full py-5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500/80 bg-slate-900/50 hover:bg-slate-900/80 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                >
                  <div className="p-2 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Pilih foto dari Galeri HP / Laptop</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WEBP</span>
                </button>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="hover:text-blue-400 flex items-center gap-1 text-slate-400 underline"
                  >
                    <Key className="w-3 h-3" />
                    {imgbbKey ? 'Ganti ImgBB API Key' : 'Atur ImgBB API Key (Gratis)'}
                  </button>
                  {imgbbKey && <span className="text-emerald-400 text-[10px]">✓ Key Aktif</span>}
                </div>

                {showKeyInput && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">ImgBB API Key:</span>
                      <a
                        href="https://api.imgbb.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline text-[10px]"
                      >
                        Dapatkan Key Gratis &rarr;
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste 32-character key di sini..."
                      value={imgbbKey}
                      onChange={(e) => handleSaveKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status
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
              Episode / Format
            </label>
            <div className="flex gap-2">
              <select
                value={['None', 'Movie'].includes(episode) ? episode : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') setEpisode('1');
                  else setEpisode(e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="None">None</option>
                <option value="Movie">Movie</option>
                <option value="custom">Nomor Episode</option>
              </select>

              {!['None', 'Movie'].includes(episode) && (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Ep:</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isSubmitting ? 'Menyimpan...' : 'Perbarui'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
