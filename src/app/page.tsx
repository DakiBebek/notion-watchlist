'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import StatsCards from '@/components/StatsCards';
import WatchlistCard from '@/components/WatchlistCard';
import AddItemModal from '@/components/AddItemModal';
import EditItemModal from '@/components/EditItemModal';
import ImageLightbox from '@/components/ImageLightbox';
import { WatchItem, WatchStatus, WatchlistStats } from '@/types/watchlist';
import { Search, SlidersHorizontal, Film, AlertCircle, RefreshCw, ArrowUpDown } from 'lucide-react';

export default function HomePage() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters, Search & Sorting
  const [activeFilter, setActiveFilter] = useState<WatchStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [sortBy, setSortBy] = useState<'updatedDesc' | 'updatedAsc' | 'titleAsc' | 'titleDesc' | 'episodeDesc' | 'episodeAsc'>('updatedDesc');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Fetch watchlist from Next.js API
  const fetchWatchlist = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/watchlist');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengambil data dari Notion');
      }
      setItems(json.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat watchlist');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Compute stats
  const stats: WatchlistStats = useMemo(() => {
    return {
      total: items.length,
      onGoing: items.filter((i) => i.status === 'On Going').length,
      watchlist: items.filter((i) => i.status === 'Watchlist').length,
      finish: items.filter((i) => i.status === 'Finish').length,
    };
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    const list = items.filter((item) => {
      // Status filter
      if (activeFilter !== 'All' && item.status !== activeFilter) {
        return false;
      }

      // Format filter
      if (formatFilter === 'movie' && item.episode !== 'Movie') {
        return false;
      }
      if (formatFilter === 'series' && (item.episode === 'Movie' || item.episode === 'None')) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query);
      }

      return true;
    });

    // Sorting conditions
    return list.sort((a, b) => {
      if (sortBy === 'updatedDesc') {
        return new Date(b.lastEditedTime).getTime() - new Date(a.lastEditedTime).getTime();
      }
      if (sortBy === 'updatedAsc') {
        return new Date(a.lastEditedTime).getTime() - new Date(b.lastEditedTime).getTime();
      }
      if (sortBy === 'titleAsc') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'titleDesc') {
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'episodeDesc') {
        const numA = parseInt(a.episode, 10) || 0;
        const numB = parseInt(b.episode, 10) || 0;
        return numB - numA;
      }
      if (sortBy === 'episodeAsc') {
        const numA = parseInt(a.episode, 10) || 0;
        const numB = parseInt(b.episode, 10) || 0;
        return numA - numB;
      }
      return 0;
    });
  }, [items, activeFilter, formatFilter, searchQuery, sortBy]);

  // Update Status Handler (Optimistic)
  const handleUpdateStatus = async (id: string, newStatus: WatchStatus) => {
    // Optimistic UI
    const prevItems = [...items];
    setItems((curr) =>
      curr.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
    );

    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal update status');
      }
    } catch (err: any) {
      alert(`Gagal sinkron status ke Notion: ${err.message}`);
      setItems(prevItems); // Rollback
    }
  };

  // Increment Episode Handler (Optimistic)
  const handleIncrementEpisode = async (id: string, currentEp: string) => {
    const epNum = parseInt(currentEp, 10);
    const nextEp = isNaN(epNum) ? '1' : String(epNum + 1);

    const prevItems = [...items];
    setItems((curr) =>
      curr.map((it) => (it.id === id ? { ...it, episode: nextEp } : it))
    );

    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episode: nextEp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal update episode');
      }
    } catch (err: any) {
      alert(`Gagal update episode ke Notion: ${err.message}`);
      setItems(prevItems);
    }
  };

  // Add Item Handler
  const handleAddItem = async (newItemData: {
    title: string;
    status: WatchStatus;
    episode: string;
    coverUrl?: string | null;
  }) => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal menambahkan tontonan');
    }
    setItems((curr) => [data.data, ...curr]);
  };

  // Edit Item Handler
  const handleSaveEdit = async (
    id: string,
    data: { title: string; status: WatchStatus; episode: string; coverUrl?: string | null }
  ) => {
    const res = await fetch(`/api/watchlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Gagal mengedit tontonan');
    }
    setItems((curr) =>
      curr.map((it) => (it.id === id ? result.data : it))
    );
  };

  // Delete Item Handler
  const handleDeleteItem = async (id: string) => {
    const prevItems = [...items];
    setItems((curr) => curr.filter((it) => it.id !== id));

    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus item');
      }
    } catch (err: any) {
      alert(`Gagal menghapus dari Notion: ${err.message}`);
      setItems(prevItems);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <Navbar
        onAddClick={() => setIsAddOpen(true)}
        onRefresh={() => fetchWatchlist(true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error banner if any */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-semibold text-white">Gagal tersambung ke Notion</p>
                <p className="text-xs text-zinc-500">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchWatchlist(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Stats Row */}
        <StatsCards
          stats={stats}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* Search & Filters Controls */}
        <div className="my-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari judul anime, film, series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Sorting Select */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-500 hidden sm:inline">Urutan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Urutkan watchlist"
                className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="updatedDesc" className="bg-zinc-900 text-zinc-200">Update Terbaru</option>
                <option value="updatedAsc" className="bg-zinc-900 text-zinc-200">Update Terlama</option>
                <option value="titleAsc" className="bg-zinc-900 text-zinc-200">Judul (A → Z)</option>
                <option value="titleDesc" className="bg-zinc-900 text-zinc-200">Judul (Z → A)</option>
                <option value="episodeDesc" className="bg-zinc-900 text-zinc-200">Episode (Tertinggi)</option>
                <option value="episodeAsc" className="bg-zinc-900 text-zinc-200">Episode (Terendah)</option>
              </select>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <button
                onClick={() => setFormatFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium ${
                  formatFilter === 'all'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua Format
              </button>
              <button
                onClick={() => setFormatFilter('series')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium ${
                  formatFilter === 'series'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Series
              </button>
              <button
                onClick={() => setFormatFilter('movie')}
                className={`px-3.5 py-1.5 rounded-lg transition font-medium ${
                  formatFilter === 'movie'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Movie
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
            <RefreshCw className="w-7 h-7 animate-spin text-white mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Menghubungkan ke Notion...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800 p-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400 mb-3">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Tidak ada tontonan ditemukan</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada tontonan di kategori ini. Klik "Tambah" untuk menambahkan tontonan baru ke Notion.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onUpdateStatus={handleUpdateStatus}
                onIncrementEpisode={handleIncrementEpisode}
                onEdit={(it) => setEditingItem(it)}
                onDelete={handleDeleteItem}
                onImageClick={(url, title) => setLightboxImage({ url, title })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddItem}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />

      {/* Image Fullscreen Lightbox Modal */}
      <ImageLightbox
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title || ''}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
