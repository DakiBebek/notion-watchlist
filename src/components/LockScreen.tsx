'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (password: string) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setErrorMessage('');

    if (!password.trim()) {
      setError(true);
      setErrorMessage('Password tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);

    // Verify against 160208
    if (password.trim() === '160208') {
      onUnlock(password.trim());
    } else {
      setIsSubmitting(false);
      setError(true);
      setErrorMessage('Password salah! Akses ditolak.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] text-zinc-100 p-4 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950/80 border border-zinc-850 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {/* Lock Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-4 shadow-inner">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Akses Terkunci</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
            Masukkan kata sandi untuk membuka koleksi watchlist Anda.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-900 border ${
                  error ? 'border-rose-500/80 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-zinc-800 focus:border-white'
                } text-sm text-white placeholder-zinc-500 focus:outline-none transition tracking-wider font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 px-1 pt-1 text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-white hover:bg-zinc-200 text-black transition duration-150 active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            <span>Buka Akses</span>
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-6 pt-5 border-t border-zinc-850/80 text-center">
          <p className="text-[11px] font-mono text-zinc-500">
            🔒 Dilindungi sandi keamanan pribadi
          </p>
        </div>
      </div>
    </div>
  );
}
