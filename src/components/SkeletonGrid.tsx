'use client';

import React from 'react';

interface SkeletonGridProps {
  count?: number;
}

export default function SkeletonGrid({ count = 10 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl bg-zinc-950/80 border border-zinc-850 p-3 sm:p-3.5 flex flex-col justify-between"
        >
          <div>
            {/* Poster Skeleton */}
            <div className="relative mb-3 w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 animate-shimmer" />

            {/* Title Skeleton */}
            <div className="space-y-1.5 mt-2">
              <div className="h-4 bg-zinc-900 rounded-md w-3/4 animate-shimmer" />
              <div className="h-3 bg-zinc-900/60 rounded-md w-1/2 animate-shimmer" />
            </div>
          </div>

          {/* Episode & Status Skeleton */}
          <div className="mt-4 pt-2.5 border-t border-zinc-850/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-zinc-900 rounded w-16 animate-shimmer" />
              <div className="h-5 bg-zinc-900 rounded w-7 animate-shimmer" />
            </div>
            <div className="h-8 bg-zinc-900 rounded-lg w-full animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
