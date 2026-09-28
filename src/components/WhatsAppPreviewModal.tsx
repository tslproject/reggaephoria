import React, { useState } from 'react';
import { Order } from '../types';
import { buildAdminWhatsAppMessage, formatRupiah } from '../utils/whatsapp';
import {
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onOpenAdminApproval: (orderId: string) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const { text: waText, url: waUrl } = buildAdminWhatsAppMessage(order);

  const handleCopyText = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#16a34a] overflow-hidden my-6">
        {/* Top Reggae Stripe */}
        <div className="reggae-stripe-h h-3 w-full" />

        {/* Header with brutalist badge */}
        <div className="bg-black p-5 sm:p-6 border-b-3 border-black text-center space-y-2">
          <div className="w-14 h-14 bg-green-500 border-3 border-black text-black flex items-center justify-center mx-auto shadow-[4px_4px_0_#fff]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block bg-yellow-400 text-black font-mono font-black text-[10px] px-2.5 py-0.5 border border-black uppercase tracking-wider">
            STEP 2: KONFIRMASI WHATSAPP
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
            BUKTI PEMBAYARAN TERSIMPAN!
          </h2>
          <p className="text-xs font-mono text-zinc-300 max-w-md mx-auto">
            Klik tombol di bawah untuk membuka WhatsApp Admin dan mengirim detail verifikasi otomatis.
          </p>
        </div>

        {/* WhatsApp Preview Card */}
        <div className="p-5 sm:p-6 space-y-4 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-black uppercase text-yellow-400">
              <MessageSquare className="w-4 h-4 text-green-400" />
              FORMAT PESAN WHATSAPP:
            </span>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 text-[11px] font-black uppercase text-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black px-2.5 py-1 brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>TERSALIN!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>SALIN TEKS</span>
                </>
              )}
            </button>
          </div>

          {/* Formatted Message Box */}
          <div className="bg-black border-2 border-zinc-700 p-4 text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto select-all shadow-inner">
            {waText}
          </div>

          {/* Highlights Box */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-black p-3.5 border-2 border-black">
            <div>
              <p className="text-zinc-400 uppercase text-[10px]">NO. INVOICE</p>
              <p className="font-black text-white font-mono text-xs">{order.invoice || order.id}</p>
            </div>
            <div>
              <p className="text-zinc-400 uppercase text-[10px]">TOTAL TRANSFER</p>
              <p className="font-black text-yellow-400 font-mono text-xs">
                {formatRupiah(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 sm:p-6 border-t-3 border-black bg-black space-y-3">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-4 px-4 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
          >
            <MessageSquare className="w-5 h-5 text-black" />
            <span>KIRIM KE WHATSAPP ADMIN SEKARANG</span>
            <ExternalLink className="w-4 h-4 text-black" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-mono font-bold text-zinc-400 hover:text-white uppercase text-center cursor-pointer"
          >
            [ TUTUP JENDELA INI ]
          </button>
        </div>
      </div>
    </div>
  );
};
