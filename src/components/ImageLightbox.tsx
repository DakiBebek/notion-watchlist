'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageUrl,
  title,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top action bar */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none"
      >
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs sm:text-sm font-semibold text-white truncate max-w-[70vw]">
          {title}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Buka gambar asli di tab baru"
            className="p-2.5 rounded-xl bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="p-2.5 rounded-xl bg-black/60 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="relative max-w-full max-h-[88vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title}
          className="max-h-[85vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
        />
      </div>
    </div>
  );
}
