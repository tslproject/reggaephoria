import React from 'react';
import { Order, AttendeeTicket } from '../types';
import { QrCodeRenderer, OneDBarcodeRenderer } from './BarcodeRenderer';
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronLeft,
  ShieldAlert,
  Ban,
} from 'lucide-react';

interface TicketDetailViewProps {
  order: Order;
  onBack: () => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({ order, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareTicket = (tkt: AttendeeTicket) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareText = `Halo ${tkt.attendeeName}, ini e-tiket resmi kamu untuk ${order.eventTitle}!\n\nKategori: ${order.productName}\nKode Tiket: ${tkt.ticketCode}\nBarcode: ${tkt.barcode}\nAkses Tiket: ${origin}/?view=ticket&orderId=${order.id}\n\nTunjukkan barcode ini di gate masuk!`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const isOrderBlocked = order.status === 'blocked';
  const isOrderCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-md mx-auto px-4 py-4 pb-24 space-y-4 font-mono">
      {/* Top Bar Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-black text-white hover:bg-zinc-800 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#fff] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>KEMBALI</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
        >
          <Printer className="w-4 h-4 text-black" />
          <span>CETAK / PDF</span>
        </button>
      </div>

      {/* Warning if Blocked, Cancelled, or Pending */}
      {(isOrderBlocked || isOrderCancelled) && (
        <div className="p-4 bg-red-950 border-3 border-red-600 text-white shadow-[4px_4px_0_#000] space-y-1">
          <div className="flex items-center gap-2 font-black uppercase text-sm text-red-400">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <span>
              {isOrderBlocked ? 'TIKET TRANSAKSI INI DIBLOKIR' : 'TRANSAKSI INI DIBATALKAN'}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-200">
            <strong>Alasan:</strong> {order.blockReason || order.rejectionReason || 'Dibatalkan oleh Admin'}
          </p>
          <p className="text-[10px] text-zinc-400">
            Tiket ini tidak berlaku untuk memasuki area festival Reggaephoria Tangsel.
          </p>
        </div>
      )}

      {order.status !== 'approved' && !isOrderBlocked && !isOrderCancelled && (
        <div
          className={`p-4 border-3 border-black text-xs shadow-[4px_4px_0_#000] ${
            order.status === 'pending_approval'
              ? 'bg-yellow-400 text-black'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2 font-black uppercase text-sm mb-1">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>
              {order.status === 'pending_approval'
                ? 'MENUNGGU VERIFIKASI ADMIN'
                : 'TRANSAKSI INI DITOLAK'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {order.status === 'pending_approval'
              ? 'Admin sedang memverifikasi bukti transfer dengan password persetujuan tiket. Barcode akan otomatis aktif setelah disetujui.'
              : `Catatan: ${order.rejectionReason || 'Silakan hubungi admin di WhatsApp.'}`}
          </p>
        </div>
      )}

      {/* Printable Tickets Stack */}
      <div id="printable-ticket" className="space-y-6">
        {order.tickets.length > 0 ? (
          order.tickets.map((tkt: AttendeeTicket, idx: number) => {
            const isTicketBlocked = isOrderBlocked || isOrderCancelled || tkt.isBlocked || tkt.status === 'BLOCKED';

            return (
              <div
                key={tkt.ticketCode}
                className={`bg-zinc-950 border-4 border-black shadow-[8px_8px_0px_#facc15] overflow-hidden ${
                  isTicketBlocked ? 'border-red-600 ring-2 ring-red-500' : ''
                }`}
              >
                {/* Reggae Tricolor Top Stripe */}
                <div className="reggae-stripe-h h-3 w-full" />

                {/* Header Stub */}
                <div className="p-4 bg-black border-b-3 border-dashed border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 border border-black uppercase tracking-wider">
                      PASS #{idx + 1} OF {order.tickets.length}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black flex items-center gap-1 ${
                        isTicketBlocked
                          ? 'bg-red-600 text-white'
                          : tkt.isUsed
                          ? 'bg-zinc-700 text-zinc-300'
                          : 'bg-green-500 text-black'
                      }`}
                    >
                      {isTicketBlocked ? (
                        <>
                          <Ban className="w-3 h-3 text-white" />
                          <span>DIBLOKIR / BATAL</span>
                        </>
                      ) : tkt.isUsed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUDAH DIGUNAKAN</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>TIKET AKTIF</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h2 className="text-xl font-black uppercase text-white tracking-tight">
                    {order.eventTitle}
                  </h2>

                  <div className="mt-2 space-y-1 text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="font-bold text-white uppercase">
                        {order.eventDate || tkt.date || 'Sabtu, 14 November 2026'}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span>{order.eventTime || tkt.time || '15:00 - 23:30 WIB'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate uppercase">
                        {order.eventVenue || (tkt.venue ? `${tkt.venue}, ${tkt.city}` : 'Area Festival Tangsel, Tangerang Selatan')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Perforation Notch */}
                <div className="relative flex items-center justify-between px-1 -my-3 z-10">
                  <div className="w-6 h-6 rounded-full bg-[#0c0d0e] border-2 border-black -ml-3" />
                  <div className="w-full border-t-2 border-dashed border-zinc-700 mx-1" />
                  <div className="w-6 h-6 rounded-full bg-[#0c0d0e] border-2 border-black -mr-3" />
                </div>

                {/* Body Stub */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase">NAMA PEMEGANG TIKET</span>
                      <h3 className="text-lg font-black uppercase text-white mt-0.5">
                        {tkt.attendeeName}
                      </h3>
                      <p className="text-xs font-black uppercase text-yellow-400 mt-0.5 bg-black px-2 py-0.5 border border-yellow-400 inline-block">
                        {tkt.tierName || tkt.productName || order.productName}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 uppercase">NO. INVOICE</span>
                      <p className="font-black text-xs text-zinc-200">#{order.invoice || order.id}</p>
                    </div>
                  </div>

                  {/* QR Code Brutalist Frame */}
                  <div className="relative flex flex-col items-center justify-center p-4 bg-white border-3 border-black shadow-[4px_4px_0_#000] text-center overflow-hidden">
                    {isTicketBlocked && (
                      <div className="absolute inset-0 bg-red-600/85 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-3 text-white">
                        <Ban className="w-12 h-12 text-white animate-bounce mb-1" />
                        <span className="text-base font-black uppercase tracking-wider bg-black text-red-400 px-3 py-1 border border-white">
                          TIKET DIBLOKIR
                        </span>
                        <p className="text-[10px] font-bold mt-1 text-center max-w-[200px]">
                          {tkt.blockReason || order.blockReason || 'Dibatalkan oleh Admin'}
                        </p>
                      </div>
                    )}

                    <QrCodeRenderer value={tkt.ticketCode} size={160} />
                    <p className="mt-2 font-mono text-sm font-black text-black tracking-widest bg-yellow-400 px-3 py-1 border-2 border-black uppercase">
                      {tkt.ticketCode}
                    </p>
                    <span className="text-[9px] font-bold text-black mt-1 uppercase">
                      TUNJUKKAN QR / BARCODE INI KE STAF DI GATE MASUK
                    </span>
                  </div>

                  {/* 1D Barcode Container */}
                  <div className="p-3 bg-white border-2 border-black flex flex-col items-center">
                    <OneDBarcodeRenderer value={tkt.barcode} height={42} showText={false} />
                    <span className="font-mono text-[10px] font-black text-black tracking-widest mt-1">
                      *{tkt.barcode}*
                    </span>
                  </div>

                  {/* Share button */}
                  {!isTicketBlocked && (
                    <button
                      onClick={() => handleShareTicket(tkt)}
                      className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-2 brutal-btn shadow-[3px_3px_0px_#000] cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-black" />
                      <span>BAGIKAN TIKET KE WHATSAPP PEMEGANG</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-black border-3 border-black p-6 text-center text-xs text-zinc-300">
            <p>Tiket barcode akan otomatis diterbitkan setelah admin menyetujui transaksi.</p>
          </div>
        )}
      </div>
    </div>
  );
};
