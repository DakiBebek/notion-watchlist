"""
Standalone Local Notion Watchlist Server
Run this with: python server.py
Then open http://localhost:3000 in your browser!
"""

import http.server
import socketserver
import urllib.request
import json
import os
import re

PORT = 3000

# Load environment variables from .env.local if present
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()

NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_DATABASE_ID = os.environ.get("NOTION_DATABASE_ID", "3c1f8a1f-7e0f-8038-8486-c67398ec30b2")

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

def call_notion(url, method="GET", data=None):
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=NOTION_HEADERS, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def format_notion_page(page):
    props = page.get("properties", {})
    
    # Title
    title_list = props.get("Judul", {}).get("title", [])
    title = "".join(t.get("plain_text", "") for t in title_list) or "Tanpa Judul"
    
    # Status
    status_obj = props.get("Status", {}).get("status") or {}
    status = status_obj.get("name", "Watchlist")
    
    # Episode
    ep_obj = props.get("Episode", {}).get("select") or {}
    episode = ep_obj.get("name", "None")
    
    # Icon
    icon = None
    icon_obj = page.get("icon")
    if icon_obj:
        itype = icon_obj.get("type")
        if itype == "emoji":
            icon = icon_obj.get("emoji")
        elif itype == "external":
            icon = icon_obj.get("external", {}).get("url")
        elif itype == "file":
            icon = icon_obj.get("file", {}).get("url")
            
    # Cover
    cover = None
    cover_obj = page.get("cover")
    if cover_obj:
        ctype = cover_obj.get("type")
        if ctype == "external":
            cover = cover_obj.get("external", {}).get("url")
        elif ctype == "file":
            cover = cover_obj.get("file", {}).get("url")
            
    return {
        "id": page.get("id"),
        "title": title,
        "status": status,
        "episode": episode,
        "icon": icon,
        "cover": cover,
        "lastEditedTime": page.get("last_edited_time"),
        "notionUrl": page.get("url"),
    }

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notion Watchlist Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          },
          colors: {
            background: "#09090b",
            surface: "#121215",
          }
        }
      }
    }
  </script>
  <style>
    body {
      background: #09090b;
      min-height: 100vh;
      color: #ededed;
      letter-spacing: -0.01em;
    }
    .card-hover {
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .card-hover:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="text-zinc-100 antialiased font-sans flex flex-col min-h-screen">
  <!-- Navbar -->
  <header class="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-zinc-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-sm">
          🎬
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-semibold text-base sm:text-lg text-white tracking-tight">Watchlist</h1>
            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Notion Live
            </span>
          </div>
          <p class="text-[11px] font-mono text-zinc-500">Film Database</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="loadWatchlist(true)" id="refreshBtn" title="Sync ulang dari Notion" class="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition">
          <svg id="refreshIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <button onclick="openAddModal()" class="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl transition shadow-sm transform active:scale-95">
          <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
          Tambah
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <button onclick="setFilter('All')" id="stat-All" class="text-left p-4 rounded-2xl bg-zinc-900 border border-white text-white shadow-md ring-1 ring-white/20">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-200 font-semibold">Semua Tontonan</div>
        <div class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono" id="count-all">0</div>
      </button>
      <button onclick="setFilter('On Going')" id="stat-On Going" class="text-left p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Sedang Ditonton</div>
        <div class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono" id="count-ongoing">0</div>
      </button>
      <button onclick="setFilter('Watchlist')" id="stat-Watchlist" class="text-left p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Rencana Nonton</div>
        <div class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono" id="count-watchlist">0</div>
      </button>
      <button onclick="setFilter('Finish')" id="stat-Finish" class="text-left p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300">
        <div class="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Telah Selesai</div>
        <div class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono" id="count-finish">0</div>
      </button>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input type="text" id="searchInput" oninput="renderItems()" placeholder="Cari anime, film, series..." class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition">
      </div>
      <div class="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs self-start">
        <button onclick="setFormat('all')" id="fmt-all" class="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold shadow-sm">Semua Format</button>
        <button onclick="setFormat('series')" id="fmt-series" class="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-white font-medium">Series</button>
        <button onclick="setFormat('movie')" id="fmt-movie" class="px-3.5 py-1.5 rounded-lg text-zinc-400 hover:text-white font-medium">Movie</button>
      </div>
    </div>

    <!-- Watchlist Grid -->
    <div id="loader" class="py-24 flex flex-col items-center justify-center text-zinc-500">
      <div class="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-xs font-mono uppercase tracking-wider text-zinc-400">Sinkronisasi Notion...</p>
    </div>

    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 hidden"></div>

    <div id="emptyState" class="hidden py-20 text-center rounded-2xl border border-dashed border-zinc-800 p-8">
      <div class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400 mb-3 text-xl">🎞</div>
      <h3 class="font-semibold text-white">Tidak ada tontonan ditemukan</h3>
      <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Gunakan tombol "Tambah" di atas untuk menambahkan tontonan baru.</p>
    </div>
  </main>

  <!-- Add Modal -->
  <div id="addModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md hidden">
    <div class="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 text-zinc-100 shadow-2xl">
      <div class="flex items-center justify-between pb-3.5 border-b border-zinc-850">
        <h2 class="text-base font-semibold text-white flex items-center gap-2">Tambah Tontonan</h2>
        <button onclick="closeAddModal()" class="p-1 text-zinc-400 hover:text-white text-lg">&times;</button>
      </div>
      <form onsubmit="submitNewItem(event)" class="mt-4 space-y-4">
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Judul Tontonan *</label>
          <input type="text" id="newTitle" required placeholder="Contoh: Frieren S2..." class="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-white transition">
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Poster / Cover Gambar (Opsional)</label>
          <div class="flex gap-2">
            <input type="url" id="newCover" placeholder="Tempel URL gambar (https://...)" class="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-white">
            <input type="file" id="newFileInput" accept="image/*" class="hidden" onchange="handleLocalUpload(this)">
            <button type="button" onclick="document.getElementById('newFileInput').click()" class="px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-300">
              📁 Upload
            </button>
          </div>
          <p id="uploadStatus" class="text-[10px] text-zinc-500 mt-1"></p>
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Status</label>
          <select id="newStatus" class="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none">
            <option value="Watchlist">⏱ Watchlist (Rencana)</option>
            <option value="On Going">▶ On Going (Sedang Nonton)</option>
            <option value="Finish">✓ Finish (Selesai)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Format / Episode</label>
          <div class="flex gap-2">
            <select id="newFormat" onchange="toggleEpInput()" class="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none">
              <option value="None">None</option>
              <option value="Movie">Movie</option>
              <option value="Series">Nomor Episode</option>
            </select>
            <input type="number" id="newEpNum" min="1" max="999" value="1" class="hidden flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none font-mono" placeholder="Episode #">
          </div>
        </div>
        <div class="pt-3 flex justify-end gap-2.5 border-t border-zinc-850">
          <button type="button" onclick="closeAddModal()" class="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl">Batal</button>
          <button type="submit" id="saveBtn" class="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-xl shadow-sm">Simpan ke Notion</button>
        </div>
      </form>
    </div>
  </div>
  </div>

  <!-- Fullscreen Lightbox Modal -->
  <div id="lightboxModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md hidden" onclick="closeLightbox()">
    <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
      <div id="lightboxTitle" class="pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs sm:text-sm font-semibold text-white truncate max-w-[70vw]"></div>
      <div class="flex items-center gap-2 pointer-events-auto">
        <a id="lightboxOpenLink" href="#" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" class="p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition" title="Buka di tab baru">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
        <button onclick="closeLightbox()" class="p-2.5 rounded-xl bg-black/60 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition" title="Tutup (Esc)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
    <div class="relative max-w-full max-h-[88vh] flex items-center justify-center" onclick="event.stopPropagation()">
      <img id="lightboxImg" src="" class="max-h-[85vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10">
    </div>
  </div>

  <script>
    let allItems = [];
    let currentFilter = 'All';
    let currentFormat = 'all';

    function openLightbox(url, title) {
      document.getElementById('lightboxImg').src = url;
      document.getElementById('lightboxTitle').innerText = title;
      document.getElementById('lightboxOpenLink').href = url;
      document.getElementById('lightboxModal').classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      document.getElementById('lightboxModal').classList.add('hidden');
      document.body.style.overflow = 'unset';
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    async function loadWatchlist(spin = false) {
      if (spin) {
        document.getElementById('refreshIcon').classList.add('animate-spin');
      }
      try {
        const res = await fetch('/api/watchlist');
        const json = await res.json();
        allItems = json.data || [];
        updateStats();
        renderItems();
      } catch (e) {
        alert('Gagal memuat dari Notion: ' + e.message);
      } finally {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('grid').classList.remove('hidden');
        document.getElementById('refreshIcon').classList.remove('animate-spin');
      }
    }

    function updateStats() {
      const ongoing = allItems.filter(i => i.status === 'On Going').length;
      const watchlist = allItems.filter(i => i.status === 'Watchlist').length;
      const finish = allItems.filter(i => i.status === 'Finish').length;
      document.getElementById('count-all').innerText = allItems.length;
      document.getElementById('count-ongoing').innerText = ongoing;
      document.getElementById('count-watchlist').innerText = watchlist;
      document.getElementById('count-finish').innerText = finish;
    }

    function setFilter(status) {
      currentFilter = status;
      ['All', 'On Going', 'Watchlist', 'Finish'].forEach(s => {
        const el = document.getElementById('stat-' + s);
        if (s === status) {
          el.className = 'text-left p-4 rounded-2xl bg-blue-950/30 border-2 border-blue-500/50 shadow-lg';
        } else {
          el.className = 'text-left p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700';
        }
      });
      renderItems();
    }

    function setFormat(fmt) {
      currentFormat = fmt;
      ['all', 'series', 'movie'].forEach(f => {
        const btn = document.getElementById('fmt-' + f);
        if (f === fmt) {
          btn.className = 'px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-medium';
        }
      });
      renderItems();
    }

    function renderItems() {
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      const grid = document.getElementById('grid');
      const empty = document.getElementById('emptyState');

      const filtered = allItems.filter(item => {
        if (currentFilter !== 'All' && item.status !== currentFilter) return false;
        if (currentFormat === 'movie' && item.episode !== 'Movie') return false;
        if (currentFormat === 'series' && (item.episode === 'Movie' || item.episode === 'None')) return false;
        if (query && !item.title.toLowerCase().includes(query)) return false;
        return true;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      grid.innerHTML = filtered.map(item => {
        const isNumEp = !isNaN(parseInt(item.episode, 10));
        let badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        if (item.status === 'On Going') badgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
        if (item.status === 'Finish') badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

        const epDisplay = item.episode === 'None' ? 'Belum Mulai' : (item.episode === 'Movie' ? 'Movie' : 'Ep. ' + item.episode);

        const cardImg = (item.icon && item.icon.startsWith('http')) ? item.icon : item.cover;

        return `
          <div class="rounded-2xl bg-[#111726]/85 border border-slate-800 hover:border-slate-700 p-4 transition card-glow flex flex-col justify-between">
            <div>
              <div class="relative h-36 rounded-xl bg-slate-900 border border-slate-800/80 mb-3 overflow-hidden flex items-center justify-center">
                ${cardImg ? `
                  <div onclick="openLightbox('${cardImg}', '${item.title.replace(/'/g, "\\'")}')" class="relative w-full h-full cursor-zoom-in group/img" title="Klik untuk melihat ukuran penuh">
                    <img src="${cardImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div class="p-1.5 px-2.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 flex items-center gap-1 shadow-lg">
                        🔍 Lihat Full
                      </div>
                    </div>
                  </div>
                ` : `
                  <div class="w-full h-full bg-gradient-to-br from-blue-900/40 via-indigo-900/20 to-purple-900/40 flex flex-col items-center justify-center p-3 text-center">
                    <div class="w-12 h-12 rounded-xl bg-slate-900/70 border border-slate-700/60 flex items-center justify-center text-xl mb-1 shadow-inner">
                      ${item.icon ? (item.icon.startsWith('http') ? `<img src="${item.icon}" class="w-full h-full object-cover rounded-xl">` : item.icon) : '🎬'}
                    </div>
                    <span class="text-[11px] font-semibold text-slate-300 truncate max-w-[90%]">${item.title}</span>
                  </div>
                `}
                <div class="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span class="px-2 py-0.5 text-xs font-semibold rounded-lg bg-black/80 backdrop-blur-md text-slate-200 border border-white/10">
                    ${epDisplay}
                  </span>
                  ${isNumEp ? `
                    <button onclick="incrementEp('${item.id}', '${item.episode}')" title="Episode Selanjutnya (+1)" class="p-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition active:scale-90">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  ` : ''}
                </div>
              </div>
              <h3 class="font-bold text-sm text-white line-clamp-2" title="${item.title}">${item.title}</h3>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <select onchange="updateStatus('${item.id}', this.value)" class="text-xs font-semibold py-1.5 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${badgeColor}">
                <option value="On Going" ${item.status === 'On Going' ? 'selected' : ''} class="bg-slate-900 text-slate-200">▶ On Going</option>
                <option value="Watchlist" ${item.status === 'Watchlist' ? 'selected' : ''} class="bg-slate-900 text-slate-200">⏱ Watchlist</option>
                <option value="Finish" ${item.status === 'Finish' ? 'selected' : ''} class="bg-slate-900 text-slate-200">✓ Finish</option>
              </select>

              <div class="flex items-center gap-1">
                <a href="${item.notionUrl}" target="_blank" title="Buka di Notion" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
                <button onclick="deleteItem('${item.id}', '${item.title.replace(/'/g, "\\'")}')" title="Hapus dari Notion" class="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    async function updateStatus(id, newStatus) {
      const it = allItems.find(i => i.id === id);
      if (it) it.status = newStatus;
      updateStats();
      renderItems();
      await fetch('/api/watchlist/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    }

    async function incrementEp(id, currEp) {
      const nextEp = String((parseInt(currEp, 10) || 0) + 1);
      const it = allItems.find(i => i.id === id);
      if (it) it.episode = nextEp;
      renderItems();
      await fetch('/api/watchlist/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episode: nextEp })
      });
    }

    async function deleteItem(id, title) {
      if (!confirm('Hapus "' + title + '" dari Notion?')) return;
      allItems = allItems.filter(i => i.id !== id);
      updateStats();
      renderItems();
      await fetch('/api/watchlist/' + id, { method: 'DELETE' });
    }

    function openAddModal() {
      document.getElementById('addModal').classList.remove('hidden');
    }
    function closeAddModal() {
      document.getElementById('addModal').classList.add('hidden');
    }
    function toggleEpInput() {
      const fmt = document.getElementById('newFormat').value;
      const numInput = document.getElementById('newEpNum');
      if (fmt === 'Series') numInput.classList.remove('hidden');
      else numInput.classList.add('hidden');
    }

    async function handleLocalUpload(input) {
      const file = input.files[0];
      if (!file) return;
      const statusEl = document.getElementById('uploadStatus');
      statusEl.innerText = '⏳ Mengunggah gambar...';
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          document.getElementById('newCover').value = data.url;
          statusEl.innerText = '✅ Gambar berhasil diupload!';
        } else {
          statusEl.innerText = '❌ Gagal upload: ' + (data.error || 'Coba gunakan link URL.');
        }
      } catch (err) {
        statusEl.innerText = '❌ Gagal upload: ' + err.message;
      }
    }

    async function submitNewItem(e) {
      e.preventDefault();
      const title = document.getElementById('newTitle').value.trim();
      const status = document.getElementById('newStatus').value;
      const fmt = document.getElementById('newFormat').value;
      const ep = fmt === 'Series' ? document.getElementById('newEpNum').value : fmt;
      const coverUrl = document.getElementById('newCover').value.trim();

      const btn = document.getElementById('saveBtn');
      btn.innerText = 'Menyimpan...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, status, episode: ep, coverUrl: coverUrl || null })
        });
        const data = await res.json();
        allItems.unshift(data.data);
        updateStats();
        renderItems();
        closeAddModal();
        document.getElementById('newTitle').value = '';
        document.getElementById('newCover').value = '';
        document.getElementById('uploadStatus').innerText = '';
      } catch (err) {
        alert('Gagal simpan ke Notion: ' + err.message);
      } finally {
        btn.innerText = 'Simpan ke Notion';
        btn.disabled = false;
      }
    }

    loadWatchlist();
  </script>
</body>
</html>
"""

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode("utf-8"))
        elif self.path == "/api/watchlist":
            try:
                data = call_notion(
                    f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query",
                    method="POST",
                    data={"sorts": [{"timestamp": "last_edited_time", "direction": "descending"}], "page_size": 100}
                )
                items = [format_notion_page(p) for p in data.get("results", [])]
                self.send_json(200, {"success": True, "data": items})
            except Exception as e:
                self.send_json(500, {"success": False, "error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/upload":
            # Direct upload with tmpfiles.org (zero key needed)
            import cgi
            content_type = self.headers.get("Content-Type", "")
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": content_type}
            )
            fileitem = form["image"] if "image" in form else (form["file"] if "file" in form else None)
            if fileitem is not None and fileitem.file:
                file_bytes = fileitem.file.read()
                filename = fileitem.filename or "upload.png"
                boundary = "----FormBoundaryUploadTmpFiles"
                body = (
                    b"--" + boundary.encode() + b"\r\n"
                    b'Content-Disposition: form-data; name="file"; filename="' + filename.encode() + b'"\r\n'
                    b"Content-Type: image/png\r\n\r\n" +
                    file_bytes +
                    b"\r\n--" + boundary.encode() + b"--\r\n"
                )
                try:
                    req = urllib.request.Request(
                        "https://tmpfiles.org/api/v1/upload",
                        data=body,
                        headers={
                            "Content-Type": f"multipart/form-data; boundary={boundary}",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                        }
                    )
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        res_json = json.loads(resp.read().decode("utf-8"))
                        raw_url = res_json["data"]["url"]
                        direct_url = raw_url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/")
                        self.send_json(200, {"success": True, "url": direct_url})
                except Exception as e:
                    self.send_json(500, {"success": False, "error": str(e)})
            else:
                self.send_json(400, {"success": False, "error": "File tidak ditemukan"})
        elif self.path == "/api/watchlist":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            title = body.get("title", "")
            status = body.get("status", "Watchlist")
            episode = body.get("episode", "None")
            cover_url = body.get("coverUrl")
            try:
                payload = {
                    "parent": {"database_id": NOTION_DATABASE_ID},
                    "properties": {
                        "Judul": {"title": [{"text": {"content": title}}]},
                        "Status": {"status": {"name": status}},
                        "Episode": {"select": {"name": episode}},
                    }
                }
                if cover_url and cover_url.startswith("http"):
                    payload["icon"] = {"type": "external", "external": {"url": cover_url}}
                    payload["cover"] = {"type": "external", "external": {"url": cover_url}}
                page = call_notion("https://api.notion.com/v1/pages", method="POST", data=payload)
                self.send_json(201, {"success": True, "data": format_notion_page(page)})
            except Exception as e:
                self.send_json(500, {"success": False, "error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_PATCH(self):
        match = re.match(r"^/api/watchlist/([^/]+)$", self.path)
        if match:
            page_id = match.group(1)
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            props = {}
            if "status" in body:
                props["Status"] = {"status": {"name": body["status"]}}
            if "episode" in body:
                props["Episode"] = {"select": {"name": body["episode"]}}
            if "title" in body:
                props["Judul"] = {"title": [{"text": {"content": body["title"]}}]}

            req_body = {"properties": props}
            if "coverUrl" in body:
                if body["coverUrl"] and body["coverUrl"].startswith("http"):
                    req_body["icon"] = {"type": "external", "external": {"url": body["coverUrl"]}}
                    req_body["cover"] = {"type": "external", "external": {"url": body["coverUrl"]}}
                else:
                    req_body["icon"] = None
                    req_body["cover"] = None

            try:
                page = call_notion(
                    f"https://api.notion.com/v1/pages/{page_id}",
                    method="PATCH",
                    data=req_body
                )
                self.send_json(200, {"success": True, "data": format_notion_page(page)})
            except Exception as e:
                self.send_json(500, {"success": False, "error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        match = re.match(r"^/api/watchlist/([^/]+)$", self.path)
        if match:
            page_id = match.group(1)
            try:
                call_notion(f"https://api.notion.com/v1/pages/{page_id}", method="PATCH", data={"archived": True})
                self.send_json(200, {"success": True, "message": "Archived"})
            except Exception as e:
                self.send_json(500, {"success": False, "error": str(e)})
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print(f"🚀 Notion Watchlist Tracker running at http://localhost:{PORT}")
        httpd.serve_forever()
