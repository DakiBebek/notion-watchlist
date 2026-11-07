export const APP_PASSWORD = process.env.APP_PASSWORD || '160208';

export function isAuthorized(request: Request): boolean {
  // Check custom header
  const pinHeader = request.headers.get('x-watchlist-pin');
  if (pinHeader && pinHeader === APP_PASSWORD) {
    return true;
  }

  // Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  if (cookieHeader.includes(`wl_pin=${APP_PASSWORD}`)) {
    return true;
  }

  return false;
}
