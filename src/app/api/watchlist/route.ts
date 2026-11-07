import { NextResponse } from 'next/server';
import { getWatchlist, createWatchItem } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getWatchlist();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error in GET /api/watchlist:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, status, episode } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul tontonan wajib diisi' },
        { status: 400 }
      );
    }

    const newItem = await createWatchItem({
      title: title.trim(),
      status: status || 'Watchlist',
      episode: episode || 'None',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/watchlist:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}
