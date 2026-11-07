import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File gambar tidak ditemukan' },
        { status: 400 }
      );
    }

    // 1. If IMGBB_API_KEY is configured by user in .env / Vercel, try ImgBB first
    const imgbbKey = process.env.IMGBB_API_KEY;
    if (imgbbKey && imgbbKey.trim()) {
      try {
        const bytes = await file.arrayBuffer();
        const base64Image = Buffer.from(bytes).toString('base64');
        const uploadBody = new URLSearchParams();
        uploadBody.append('image', base64Image);
        uploadBody.append('name', file.name.replace(/[^a-zA-Z0-9_-]/g, '_'));

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: uploadBody.toString(),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const imgUrl = data.data.display_url || data.data.url;
          return NextResponse.json({ success: true, url: imgUrl });
        }
      } catch (e) {
        console.warn('ImgBB upload failed, falling back to instant provider...', e);
      }
    }

    // 2. Instant Free Fallback: tmpfiles.org (No API key needed, zero-config)
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file, file.name);

      const res = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: uploadForm,
      });

      const data = await res.json();
      if (res.ok && data.status === 'success' && data.data?.url) {
        // Convert to direct download/render link (https://tmpfiles.org/123/img.png -> https://tmpfiles.org/dl/123/img.png)
        const rawUrl = data.data.url;
        const directUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
        return NextResponse.json({ success: true, url: directUrl });
      }
    } catch (e) {
      console.error('tmpfiles upload failed:', e);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          'Gagal mengunggah gambar. Kamu bisa copy-paste link gambar langsung di kolom "Link URL", atau tambahkan IMGBB_API_KEY gratis dari api.imgbb.com di Vercel.',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat upload gambar' },
      { status: 500 }
    );
  }
}
