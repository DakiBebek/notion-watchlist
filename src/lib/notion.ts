import { WatchItem, WatchStatus } from '@/types/watchlist';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const NOTION_HEADERS = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

function formatNotionPage(page: any): WatchItem {
  const props = page.properties || {};

  // Title: "Judul"
  const titleArr = props.Judul?.title || [];
  const title = titleArr.map((t: any) => t.plain_text).join('') || 'Tanpa Judul';

  // Status: "Status"
  const statusName = (props.Status?.status?.name || 'Watchlist') as WatchStatus;
  const statusColor = props.Status?.status?.color || 'yellow';

  // Episode: "Episode"
  const episode = props.Episode?.select?.name || 'None';

  // Icon
  let icon: string | null = null;
  if (page.icon) {
    if (page.icon.type === 'emoji') {
      icon = page.icon.emoji;
    } else if (page.icon.type === 'external') {
      icon = page.icon.external.url;
    } else if (page.icon.type === 'file') {
      icon = page.icon.file.url;
    }
  }

  // Cover
  let cover: string | null = null;
  if (page.cover) {
    if (page.cover.type === 'external') {
      cover = page.cover.external.url;
    } else if (page.cover.type === 'file') {
      cover = page.cover.file.url;
    }
  }

  return {
    id: page.id,
    title,
    status: statusName,
    statusColor,
    episode,
    icon,
    cover,
    lastEditedTime: page.last_edited_time || new Date().toISOString(),
    notionUrl: page.url,
  };
}

export async function getWatchlist(): Promise<WatchItem[]> {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    throw new Error('NOTION_TOKEN and NOTION_DATABASE_ID must be set in environment variables');
  }

  const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      sorts: [
        {
          timestamp: 'last_edited_time',
          direction: 'descending',
        },
      ],
      page_size: 100,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to query Notion database: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return (data.results || []).map(formatNotionPage);
}

export async function createWatchItem(params: {
  title: string;
  status?: WatchStatus;
  episode?: string;
  coverUrl?: string | null;
}): Promise<WatchItem> {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    throw new Error('NOTION_TOKEN and NOTION_DATABASE_ID must be set in environment variables');
  }

  const { title, status = 'Watchlist', episode = 'None', coverUrl } = params;

  const payload: any = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      Judul: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      Status: {
        status: {
          name: status,
        },
      },
      Episode: {
        select: {
          name: episode,
        },
      },
    },
  };

  if (coverUrl && coverUrl.startsWith('http')) {
    payload.cover = {
      type: 'external',
      external: {
        url: coverUrl,
      },
    };
  }

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: NOTION_HEADERS,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create page in Notion: ${response.status} ${errorText}`);
  }

  const page = await response.json();
  return formatNotionPage(page);
}

export async function updateWatchItem(
  pageId: string,
  params: {
    title?: string;
    status?: WatchStatus;
    episode?: string;
    coverUrl?: string | null;
  }
): Promise<WatchItem> {
  if (!NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN must be set in environment variables');
  }

  const properties: any = {};

  if (params.title !== undefined) {
    properties.Judul = {
      title: [
        {
          text: {
            content: params.title,
          },
        },
      ],
    };
  }

  if (params.status !== undefined) {
    properties.Status = {
      status: {
        name: params.status,
      },
    };
  }

  if (params.episode !== undefined) {
    properties.Episode = {
      select: {
        name: params.episode,
      },
    };
  }

  const body: any = { properties };

  if (params.coverUrl !== undefined) {
    if (params.coverUrl && params.coverUrl.startsWith('http')) {
      body.cover = {
        type: 'external',
        external: {
          url: params.coverUrl,
        },
      };
    } else {
      body.cover = null;
    }
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update page in Notion: ${response.status} ${errorText}`);
  }

  const page = await response.json();
  return formatNotionPage(page);
}

export async function deleteWatchItem(pageId: string): Promise<boolean> {
  if (!NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN must be set in environment variables');
  }

  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS,
    body: JSON.stringify({ archived: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete/archive page in Notion: ${response.status} ${errorText}`);
  }

  return true;
}
