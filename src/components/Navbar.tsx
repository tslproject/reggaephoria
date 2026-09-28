import React from 'react';
import {
  Ticket,
  Search,
  Lock,
  SlidersHorizontal,
  QrCode,
  LogOut,
} from 'lucide-react';

export type AppView =
  | 'buy_ticket'
  | 'check_ticket'
  | 'admin_approval'
  | 'manage_tickets'
  | 'gate_scanner'
  | 'ticket_detail';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, params?: { orderId?: string }) => void;
  pendingApprovalsCount: number;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  pendingApprovalsCount,
  onAdminLogout,
}) => {
  const isAdminView =
    currentView === 'manage_tickets' ||
    currentView === 'admin_approval' ||
    currentView === 'gate_scanner';

  // ================= ADMIN HEADER & NAVBAR (KHUSUS DI /rsadmin) =================
  if (isAdminView) {
    return (
      <>
        {/* Reggae Tricolor Top Accent Strip */}
        <div className="reggae-stripe-h h-2 w-full sticky top-0 z-50" />

        {/* Top Header Admin */}
        <header className="sticky top-2 z-40 bg-yellow-400 text-black border-b-4 border-black shadow-[0_4px_0_#000]">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 border-2 border-black animate-pulse" />
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase tracking-tight leading-none text-black">
                  PORTAL ADMIN REGGAEPHORIA
                </span>
                <span className="text-[10px] font-mono font-bold text-black/80">
                  /rsadmin • TANGSEL
                </span>
              </div>
            </div>

            {/* Logout Admin */}
            {onAdminLogout && (
              <button
                onClick={onAdminLogout}
                className="px-3 py-1.5 bg-black text-red-400 hover:text-white border-2 border-black font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#fff] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>KELUAR</span>
              </button>
            )}
          </div>
        </header>

        {/* Bottom Bar Khusus Admin (3 Tab Brutalist: Atur Tiket, Approval, Gate Scan) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t-4 border-black pb-safe shadow-[0_-4px_0_#000]">
          <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-2 gap-1.5">
            <button
              onClick={() => onNavigate('manage_tickets')}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wider transition-all brutal-btn ${
                currentView === 'manage_tickets'
                  ? 'bg-yellow-400 text-black shadow-[2px_2px_0_#000]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>ATUR TIKET</span>
            </button>

            <button
              onClick={() => onNavigate('admin_approval')}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wider relative transition-all brutal-btn ${
                currentView === 'admin_approval'
                  ? 'bg-red-500 text-white shadow-[2px_2px_0_#000]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Lock className="w-4 h-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center bg-yellow-300 text-black border border-black text-[9px] font-black">
                    {pendingApprovalsCount}
                  </span>
                )}
              </div>
              <span>APPROVAL</span>
            </button>

            <button
              onClick={() => onNavigate('gate_scanner')}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 border-2 border-black font-black uppercase text-[10px] tracking-wider transition-all brutal-btn ${
                currentView === 'gate_scanner'
                  ? 'bg-green-500 text-black shadow-[2px_2px_0_#000]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>GATE SCAN</span>
            </button>
          </div>
        </nav>
      </>
    );
  }

  // ================= BUYER HEADER & NAVBAR (MURNI UNTUK PEMBELI - TANPA TOMBOL ADMIN) =================
  return (
    <>
      {/* Reggae Tricolor Top Accent Strip */}
      <div className="reggae-stripe-h h-2.5 w-full sticky top-0 z-50" />

      <header className="sticky top-2.5 z-40 bg-black text-white border-b-4 border-yellow-400 shadow-[0_4px_0_#000]">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div
            onClick={() => onNavigate('buy_ticket')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 bg-yellow-400 border-2 border-black shadow-[2px_2px_0_#fff] flex items-center justify-center">
              <Ticket className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight uppercase text-white">
                  REGGAEPHORIA <span className="bg-yellow-400 text-black px-1.5 py-0.5 border border-black">TANGSEL</span>
                </span>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-green-400 font-bold">
                OFFICIAL REGGAE TICKETING
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-600 border border-white" />
            <span className="w-2.5 h-2.5 bg-yellow-400 border border-white" />
            <span className="w-2.5 h-2.5 bg-green-600 border border-white" />
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Bar KHUSUS PEMBELI (Hanya Beli Tiket & Cek Tiket) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t-4 border-black pb-safe shadow-[0_-4px_0_#18181b]">
        <div className="max-w-md mx-auto grid grid-cols-2 h-16 items-center px-3 gap-2">
          {/* 1. Beli Tiket */}
          <button
            onClick={() => onNavigate('buy_ticket')}
            className={`flex items-center justify-center gap-2 py-2.5 border-2 border-black font-black uppercase text-xs tracking-wider transition-all brutal-btn ${
              currentView === 'buy_ticket'
                ? 'bg-yellow-400 text-black shadow-[3px_3px_0_#fff]'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>BELI TIKET</span>
          </button>

          {/* 2. Cek Tiket */}
          <button
            onClick={() => onNavigate('check_ticket')}
            className={`flex items-center justify-center gap-2 py-2.5 border-2 border-black font-black uppercase text-xs tracking-wider transition-all brutal-btn ${
              currentView === 'check_ticket'
                ? 'bg-green-500 text-black shadow-[3px_3px_0_#fff]'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>CEK TIKET</span>
          </button>
        </div>
      </nav>
    </>
  );
};
