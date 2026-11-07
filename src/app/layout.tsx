import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notion Watchlist Tracker',
  description: 'Track film, anime, and series synced with Notion database',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased min-h-screen text-zinc-100 bg-[#09090b]">
        {children}
      </body>
    </html>
  );
}
