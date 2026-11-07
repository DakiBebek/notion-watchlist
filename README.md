# 🎬 Notion Watchlist Tracker

Web Tracker interaktif untuk katalog tontonan (Film, Anime, Series) yang terhubung **dua arah secara realtime dengan database Notion kamu**, dan siap langsung di-deploy ke **Vercel**!

---

## ✨ Fitur Utama

- **Koneksi Penuh ke Notion**:
  - Membaca semua data tontonan dari database Notion (`Film`).
  - Update status langsung (*On Going*, *Watchlist*, *Finish*).
  - Quick `+1` button untuk update nomor episode anime/series yang sedang ditonton.
  - Tambah tontonan baru langsung masuk ke database Notion.
  - Hapus / arsipkan tontonan dari Notion.
- **Tampilan Modern & Responsif**:
  - Dark mode aesthetic.
  - Filter berdasarkan status & format (Movie / Series).
  - Fitur pencarian cepat judul tontonan.
  - Responsif di HP & Desktop.
- **Siap Deploy ke Vercel**:
  - Dibuat dengan **Next.js 14 App Router + Tailwind CSS**.
  - Server-side API Routes aman untuk melindungi Notion Token.

---

## 🚀 Cara 1: Jalankan Langsung di Komputer (Tanpa Install Apa-apa)

Di folder proyek ini sudah disediakan runner server mandiri:

```powershell
python server.py
```

Lalu buka di browser kamu:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Cara 2: Deploy ke Vercel (Gratis & Online 24 Jam)

### Langkah 1: Upload ke GitHub

1. Buka folder ini di terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Notion Watchlist Tracker"
   ```
2. Buat repository baru di [GitHub](https://github.com/new) (beri nama misalnya `notion-watchlist`).
3. Push kode kamu ke GitHub:
   ```bash
   git remote add origin https://github.com/USERNAME_KAMU/notion-watchlist.git
   git branch -M main
   git push -u origin main
   ```

### Langkah 2: Hubungkan ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login (bisa langsung pakai akun GitHub).
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repository `notion-watchlist` yang baru saja kamu push.
4. Di bagian **Environment Variables**, tambahkan 2 variabel berikut:

| Key | Value |
|---|---|
| `NOTION_TOKEN` | Token Notion Integration kamu (`ntn_...`) |
| `NOTION_DATABASE_ID` | `3c1f8a1f-7e0f-8038-8486-c67398ec30b2` |

5. Klik tombol **"Deploy"**!
6. Dalam 1-2 menit, web kamu sudah aktif di URL publik (contoh: `https://notion-watchlist.vercel.app`).

---

## 📁 Struktur File

```
notion-watchlist-tracker/
├── .env.local             # Konfigurasi Notion API Token & Database ID
├── .env.example
├── package.json           # Dependencies Next.js & Tailwind
├── tailwind.config.ts
├── server.py              # Server lokal instan (bisa langsung dijalankan)
├── src/
│   ├── app/
│   │   ├── page.tsx       # Halaman utama tracker & filters
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/watchlist/ # API Routes penghubung ke Notion
│   ├── components/        # Navbar, Kartu Tontonan, Modal Tambah & Edit
│   ├── lib/notion.ts      # Logika fetch & update ke Notion REST API
│   └── types/             # TypeScript definitions
└── README.md
```
