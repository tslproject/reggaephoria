import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { ADMIN_PASSWORD } from '../services/storage';

interface AdminLoginViewProps {
  onSuccess: () => void;
  onBackToBuyer: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onSuccess,
  onBackToBuyer,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('MASUKKAN PASSWORD ADMIN!');
      return;
    }

    // Enforce required password: "reggaephoria"
    if (password.trim() === ADMIN_PASSWORD || password.trim() === 'reggaephoria') {
      setError(null);
      onSuccess();
    } else {
      setError('PASSWORD ADMIN SALAH! SILAKAN COBA LAGI.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 font-mono">
      <div className="bg-yellow-400 text-black border-4 border-black p-6 sm:p-8 shadow-[10px_10px_0px_#dc2626] space-y-6">
        {/* Caution stripe */}
        <div className="reggae-stripe-h h-3 w-full" />

        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-black text-yellow-400 border-3 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_#fff]">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block bg-black text-yellow-400 font-mono font-black text-[10px] px-3 py-1 border border-black uppercase tracking-widest">
            AKSES TERBATAS • /rsadmin
          </span>
          <h1 className="text-2xl font-black uppercase text-black tracking-tight">
            LOGIN ADMIN REGGAEPHORIA TANGSEL
          </h1>
          <p className="text-xs font-bold text-black/80 uppercase">
            OFFICIAL REGGAE TICKETING • PORTAL ADMIN & GATE SCANNER
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black uppercase mb-1">
              PASSWORD ADMIN:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="MASUKKAN PASSWORD..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 bg-black border-3 border-black text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-2 p-2.5 bg-red-600 border-2 border-black text-white text-xs font-bold flex items-center gap-1.5 uppercase">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-black hover:bg-zinc-900 text-yellow-400 border-3 border-black font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#fff] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
          >
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <span>MASUK KE PORTAL ADMIN</span>
          </button>
        </form>

        {/* Back to buyer */}
        <div className="pt-2 text-center">
          <button
            onClick={onBackToBuyer}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-black hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI KE HALAMAN PEMESANAN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
