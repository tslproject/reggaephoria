import React, { useState } from 'react';
import { Order } from '../types';
import { storage } from '../services/storage';
import { formatRupiah } from '../utils/whatsapp';
import {
  Search,
  Ticket,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface CheckTicketViewProps {
  onOpenTicket: (orderId: string) => void;
  onNavigateToBuy: () => void;
}

export const CheckTicketView: React.FC<CheckTicketViewProps> = ({
  onOpenTicket,
  onNavigateToBuy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Order[]>([]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const found = storage.findOrdersByQuery(searchQuery);
    setResults(found);
    setHasSearched(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 pb-24 space-y-5 font-mono">
      {/* Brutalist Header Banner */}
      <div className="bg-black border-3 border-black p-4 shadow-[6px_6px_0px_#16a34a] relative overflow-hidden">
        <div className="reggae-stripe-h h-2 w-full mb-3" />
        <span className="bg-green-600 text-black font-black text-[10px] px-2.5 py-0.5 border-2 border-black uppercase tracking-wider inline-flex items-center gap-1.5">
          <Search className="w-3 h-3 text-black" />
          LACAK E-TIKET DIGITAL
        </span>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-2">
          CEK & UNDUH E-TIKET
        </h1>
        <p className="text-xs text-zinc-300 mt-1">
          Link hilang atau belum sempat download barcode? Masukkan No. WhatsApp atau Invoice pemesanan Anda.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-zinc-950 border-3 border-black p-4 sm:p-5 shadow-[5px_5px_0px_#000]">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-[11px] font-black uppercase text-yellow-400 mb-1.5">
              CARI BERDASARKAN NO. WHATSAPP / INVOICE:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="CONTOH: 08123456789 ATAU RST-2026..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-3 bg-black border-2 border-zinc-700 text-xs text-white uppercase placeholder-zinc-600 focus:outline-none focus:border-yellow-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
          >
            <Search className="w-4 h-4 text-black" />
            <span>CARI TIKET SAYA SEKARANG</span>
          </button>
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
            <span className="text-xs font-black uppercase text-white">
              HASIL PENCARIAN ({results.length})
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">
              QUERY: &quot;{searchQuery}&quot;
            </span>
          </div>

          {results.length === 0 ? (
            <div className="bg-black border-3 border-black p-6 text-center shadow-[4px_4px_0px_#dc2626] space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-white">TIKET TIDAK DITEMUKAN</h3>
              <p className="text-xs text-zinc-400">
                Pastikan nomor WhatsApp yang Anda masukkan sama persis dengan yang digunakan saat memesan tiket.
              </p>
              <button
                onClick={onNavigateToBuy}
                className="mt-2 px-4 py-2 bg-green-500 text-black border-2 border-black font-black uppercase text-xs brutal-btn shadow-[2px_2px_0px_#000]"
              >
                PESAN TIKET BARU
              </button>
            </div>
          ) : (
            results.map((order) => {
              const isApproved = order.status === 'approved';
              const isPending = order.status === 'pending_approval';

              return (
                <div
                  key={order.id}
                  className="bg-black border-3 border-black p-4 shadow-[5px_5px_0px_#000] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase">NO. INVOICE</span>
                      <p className="font-mono font-black text-white text-xs">
                        #{order.invoice || order.id}
                      </p>
                      <h4 className="font-black text-sm uppercase text-yellow-400 mt-1">
                        {order.productName} ({order.quantity} TIKET)
                      </h4>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black ${
                        isApproved
                          ? 'bg-green-500 text-black shadow-[2px_2px_0px_#fff]'
                          : isPending
                          ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_#fff]'
                          : order.status === 'blocked' || order.status === 'cancelled'
                          ? 'bg-red-600 text-white shadow-[2px_2px_0px_#fff]'
                          : 'bg-red-600 text-white shadow-[2px_2px_0px_#fff]'
                      }`}
                    >
                      {isApproved
                        ? '✓ DISETUJUI'
                        : isPending
                        ? '⏳ PROSES APPROVAL'
                        : order.status === 'blocked'
                        ? '⛔ DIBLOKIR'
                        : order.status === 'cancelled'
                        ? '✕ DIBATALKAN'
                        : '✕ DITOLAK'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950 p-2.5 border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase">PEMESAN:</span>
                      <p className="text-zinc-200 font-bold truncate">{order.buyer.fullName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase">TOTAL:</span>
                      <p className="text-yellow-400 font-bold">{formatRupiah(order.totalAmount)}</p>
                    </div>
                  </div>

                  {(order.blockReason || order.rejectionReason) && (
                    <div className="p-2 bg-red-950/60 border border-red-800 text-[10px] text-red-300">
                      <strong>Alasan:</strong> {order.blockReason || order.rejectionReason}
                    </div>
                  )}

                  {/* Action */}
                  <div className="pt-1">
                    {isApproved ? (
                      <button
                        onClick={() => onOpenTicket(order.id)}
                        className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-black border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-1.5 brutal-btn shadow-[3px_3px_0px_#000] cursor-pointer"
                      >
                        <Ticket className="w-4 h-4 text-black" />
                        <span>BUKA & CETAK E-TIKET ({order.tickets.length} TIKET)</span>
                        <ArrowRight className="w-4 h-4 text-black" />
                      </button>
                    ) : order.status === 'blocked' || order.status === 'cancelled' ? (
                      <button
                        onClick={() => onOpenTicket(order.id)}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-700 font-black uppercase text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>LIHAT STATUS PEMBATALAN TIKET</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                        <span>Menunggu verifikasi admin dengan password persetujuan tiket.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
