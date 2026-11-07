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

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // ImgBB API Key: user can set IMGBB_API_KEY in .env, or use default public key
    const apiKey = process.env.IMGBB_API_KEY || '6d207e02198a847aa5ad3ac5054f8178';

    const uploadBody = new URLSearchParams();
    uploadBody.append('image', base64Image);
    uploadBody.append('name', file.name.replace(/[^a-zA-Z0-9_-]/g, '_'));

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: uploadBody.toString(),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('ImgBB upload error:', data);
      throw new Error(data?.error?.message || 'Gagal mengupload gambar ke image host');
    }

    const imageUrl = data.data.display_url || data.data.url;
    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat upload gambar' },
      { status: 500 }
    );
  }
}
