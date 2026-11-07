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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 text-zinc-100 animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center">
              <Edit2 className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Edit Tontonan</h2>
              <p className="text-[11px] font-mono text-zinc-500">Notion Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Judul
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-white focus:outline-none text-sm text-white transition"
            />
          </div>

          {/* Poster Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                Poster / Icon Gambar
              </label>
              <div className="flex text-[11px] gap-2 text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`hover:text-white transition ${uploadMode === 'url' ? 'text-white font-semibold' : 'text-zinc-500'}`}
                >
                  Link URL
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`hover:text-white transition ${uploadMode === 'file' ? 'text-white font-semibold' : 'text-zinc-500'}`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {(imagePreview || coverUrl) ? (
              <div className="relative h-40 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center group mb-2">
                <img
                  src={imagePreview || coverUrl}
                  alt="Poster Preview"
                  className="w-full h-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-xs text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span className="font-mono text-xs">Mengunggah...</span>
                  </div>
                )}
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Hapus gambar"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-zinc-800 text-white transition border border-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : null}

            {uploadMode === 'url' ? (
              <div>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="url"
                    placeholder="Tempel URL gambar (https://...)"
                    value={coverUrl}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setCoverUrl(val);
                      setImagePreview(val || null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Di Google / Pinterest, klik kanan poster &rarr; Salin alamat gambar &rarr; tempel.</span>
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
                  className="w-full py-5 px-4 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                >
                  <div className="p-2 rounded-xl bg-zinc-850 group-hover:bg-zinc-800 text-zinc-300 transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-zinc-300">Pilih dari Galeri HP / Laptop</span>
                  <span className="text-[10px] text-zinc-500 font-mono">JPG, PNG, WEBP</span>
                </button>

                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="hover:text-white flex items-center gap-1 text-zinc-400 underline"
                  >
                    <Key className="w-3 h-3" />
                    {imgbbKey ? 'Ganti ImgBB API Key' : 'Atur ImgBB API Key (Gratis)'}
                  </button>
                  {imgbbKey && <span className="text-emerald-400 text-[10px]">✓ Key Aktif</span>}
                </div>

                {showKeyInput && (
                  <div className="mt-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-300">ImgBB API Key:</span>
                      <a
                        href="https://api.imgbb.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-white underline text-[10px]"
                      >
                        Dapatkan Key &rarr;
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="Paste key di sini..."
                      value={imgbbKey}
                      onChange={(e) => handleSaveKey(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Watchlist', 'On Going', 'Finish'] as WatchStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                    status === st
                      ? 'bg-white text-black font-semibold shadow-sm border-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Episode / Format
            </label>
            <div className="flex gap-2">
              <select
                value={['None', 'Movie'].includes(episode) ? episode : 'custom'}
                onChange={(e) => {
                  if (e.target.value === 'custom') setEpisode('1');
                  else setEpisode(e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="None">None</option>
                <option value="Movie">Movie</option>
                <option value="custom">Nomor Episode</option>
              </select>

              {!['None', 'Movie'].includes(episode) && (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Ep:</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
              <span>{isSubmitting ? 'Menyimpan...' : 'Perbarui'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
