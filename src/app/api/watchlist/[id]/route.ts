import { NextResponse } from 'next/server';
import { updateWatchItem, deleteWatchItem } from '@/lib/notion';
import { isAuthorized } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak: Password diperlukan' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { title, status, episode, coverUrl } = body;

    const updated = await updateWatchItem(id, {
      title,
      status,
      episode,
      coverUrl,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in PATCH /api/watchlist/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Akses ditolak: Password diperlukan' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    await deleteWatchItem(id);
    return NextResponse.json({ success: true, message: 'Item archived in Notion' });
  } catch (error: any) {
    console.error('Error in DELETE /api/watchlist/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
