export type WatchStatus = 'On Going' | 'Watchlist' | 'Finish';

export interface WatchItem {
  id: string;
  title: string;
  status: WatchStatus;
  statusColor?: string;
  episode: string;
  icon?: string | null;
  cover?: string | null;
  lastEditedTime: string;
  notionUrl: string;
}

export interface WatchlistStats {
  total: number;
  onGoing: number;
  watchlist: number;
  finish: number;
}
