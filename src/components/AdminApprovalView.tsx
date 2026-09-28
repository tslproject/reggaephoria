import React, { useState, useEffect } from 'react';
import { Order, AttendeeTicket } from '../types';
import { storage } from '../services/storage';
import { formatRupiah, buildBuyerWhatsAppMessage } from '../utils/whatsapp';
import { OneDBarcodeRenderer } from './BarcodeRenderer';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  ExternalLink,
  Eye,
  FileCheck,
  Search,
  Lock,
  EyeOff,
  AlertTriangle,
  Ban,
  ShieldAlert,
  RotateCcw,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminApprovalViewProps {
  initialOrderId?: string;
  onViewTicket: (orderId: string) => void;
}

type ActionModalType = 'block_order' | 'cancel_order' | 'block_ticket' | null;

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({
  initialOrderId,
  onViewTicket,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Password Approval State
  const [approvalPasswordInput, setApprovalPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // WhatsApp Buyer message preview modal state
  const [waModalOpen, setWaModalOpen] = useState<boolean>(false);
  const [activeWaMessage, setActiveWaMessage] = useState<{ text: string; url: string; ticketUrl?: string } | null>(null);

  // Screenshot Zoom Modal
  const [zoomProofUrl, setZoomProofUrl] = useState<string | null>(null);

  // Block & Cancel Action Modal State
  const [actionModal, setActionModal] = useState<ActionModalType>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [targetTicketCode, setTargetTicketCode] = useState<string | null>(null);

  const reload = () => {
    setOrders(storage.getOrders());
  };

  useEffect(() => {
    reload();
    const unsub = storage.subscribe(() => {
      reload();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    setApprovalPasswordInput('');
    setPasswordError(null);
  }, [selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const isBlockedOrCancelled = o.status === 'blocked' || o.status === 'cancelled';
    const matchFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending'
        ? o.status === 'pending_approval'
        : filterStatus === 'approved'
        ? o.status === 'approved'
        : filterStatus === 'blocked_or_cancelled'
        ? isBlockedOrCancelled
        : o.status === 'rejected';

    const matchSearch =
      !searchQuery.trim() ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer.whatsapp.includes(searchQuery) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchFilter && matchSearch;
  });

  // Handle password-protected approval
  const handleApproveWithPassword = (order: Order) => {
    if (!approvalPasswordInput.trim()) {
      setPasswordError(
        `MASUKKAN PASSWORD PERSETUJUAN KHUSUS TIKET "${order.productName}"!`
      );
      return;
    }

    const result = storage.approveOrder(
      order.id,
      approvalPasswordInput.trim(),
      'Admin Reggaephoria Tangsel'
    );

    if (!result.success) {
      setPasswordError(result.message);
      return;
    }

    setPasswordError(null);
    setApprovalPasswordInput('');
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    reload();

    if (result.order) {
      handleOpenSendTicketModal(result.order);
    }
  };

  const handleReject = (orderId: string) => {
    const reason = prompt(
      'Alasan penolakan pembayaran:',
      'Bukti transfer tidak sesuai / dana belum masuk rekening'
    );
    if (reason !== null) {
      storage.rejectOrder(orderId, reason || 'Ditolak admin');
      reload();
    }
  };

  // Open Block Order Modal
  const openBlockOrderModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActionModal('block_order');
    setActionReason('Bukti transfer palsu / pelanggaran syarat tiket');
  };

  // Open Cancel Order Modal
  const openCancelOrderModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActionModal('cancel_order');
    setActionReason('Permintaan pembeli / kuota dibatalkan');
  };

  // Open Block Single Ticket Modal
  const openBlockSingleTicketModal = (orderId: string, ticketCode: string) => {
    setSelectedOrderId(orderId);
    setTargetTicketCode(ticketCode);
    setActionModal('block_ticket');
    setActionReason('Tiket dilaporkan hilang / disalahgunakan');
  };

  // Confirm Block / Cancel Action
  const handleConfirmAction = () => {
    if (!selectedOrder) return;

    if (actionModal === 'block_order') {
      storage.blockOrder(selectedOrder.id, actionReason.trim() || 'Diblokir oleh Admin');
    } else if (actionModal === 'cancel_order') {
      storage.cancelOrder(selectedOrder.id, actionReason.trim() || 'Dibatalkan oleh Admin');
    } else if (actionModal === 'block_ticket' && targetTicketCode) {
      storage.blockTicket(selectedOrder.id, targetTicketCode, actionReason.trim() || 'Tiket diblokir');
    }

    setActionModal(null);
    setActionReason('');
    setTargetTicketCode(null);
    reload();
  };

  // Unblock order
  const handleUnblockOrder = (orderId: string) => {
    if (confirm('Yakin ingin memulihkan dan mengaktifkan kembali transaksi & tiket ini?')) {
      storage.unblockOrder(orderId);
      reload();
    }
  };

  // Unblock single ticket
  const handleUnblockSingleTicket = (orderId: string, ticketCode: string) => {
    if (confirm(`Yakin ingin membuka blokir tiket ${ticketCode}?`)) {
      storage.unblockTicket(orderId, ticketCode);
      reload();
    }
  };

  const handleOpenSendTicketModal = (order: Order) => {
    const wa = buildBuyerWhatsAppMessage(order);
    setActiveWaMessage(wa);
    setWaModalOpen(true);
  };

  const handleMarkAsSentToBuyer = (orderId: string) => {
    storage.markBuyerTicketSent(orderId);
    reload();
    setWaModalOpen(false);
  };

  const pendingCount = orders.filter((o) => o.status === 'pending_approval').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const blockedOrCancelledCount = orders.filter(
    (o) => o.status === 'blocked' || o.status === 'cancelled'
  ).length;
  const rejectedCount = orders.filter((o) => o.status === 'rejected').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 font-mono">
      {/* Header Banner Brutalist */}
      <div className="bg-black border-4 border-black p-5 sm:p-6 mb-6 shadow-[6px_6px_0px_#dc2626] relative">
        <div className="reggae-stripe-h h-2.5 w-full mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="bg-yellow-400 text-black font-black text-[10px] px-2.5 py-0.5 border border-black uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-black" />
            REGGAEPHORIA TANGSEL • OFFICIAL REGGAE TICKETING
          </span>
          <span className="text-[11px] font-black text-yellow-400 uppercase">
            {pendingCount} MENUNGGU VERIFIKASI
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          APPROVAL & MANAJEMEN TRANSAKSI
        </h1>
        <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
          Verifikasi bukti pembayaran dengan password tiket. Anda juga dapat <strong>memblokir</strong> atau <strong>membatalkan</strong> tiket beserta alasannya.
        </p>
      </div>

      {/* Filter Tabs & Search Brutalist */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: `SEMUA (${orders.length})` },
            { id: 'pending', label: `MENUNGGU (${pendingCount})` },
            { id: 'approved', label: `DISETUJUI (${approvedCount})` },
            { id: 'blocked_or_cancelled', label: `DIBLOKIR / BATAL (${blockedOrCancelledCount})` },
            { id: 'rejected', label: `DITOLAK (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-2 border-2 border-black font-black text-xs uppercase tracking-wider transition-all brutal-btn cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-yellow-400 text-black shadow-[3px_3px_0px_#000]'
                  : 'bg-black text-zinc-300 hover:text-white hover:bg-zinc-900 shadow-[2px_2px_0px_#000]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="CARI ID INVOICE, NAMA PEMBELI, NO WHATSAPP, KODE TIKET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black border-2 border-zinc-700 text-xs text-white placeholder-zinc-500 uppercase focus:border-yellow-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content: Orders List & Detail Split */}
      {filteredOrders.length === 0 ? (
        <div className="bg-black border-3 border-dashed border-zinc-700 p-8 text-center space-y-3 shadow-[4px_4px_0_#000]">
          <Clock className="w-8 h-8 text-yellow-400 mx-auto" />
          <h3 className="text-sm font-black uppercase text-white">TIDAK ADA TRANSAKSI DITEMUKAN</h3>
          <p className="text-xs text-zinc-400 uppercase">
            Belum ada data transaksi pada kategori ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Order List Column */}
          <div className="md:col-span-5 space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const isApproved = ord.status === 'approved';
              const isPending = ord.status === 'pending_approval';
              const isBlocked = ord.status === 'blocked';
              const isCancelled = ord.status === 'cancelled';

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`p-3.5 border-3 border-black cursor-pointer transition-all brutal-btn relative ${
                    isSelected
                      ? 'bg-zinc-900 border-yellow-400 shadow-[4px_4px_0px_#facc15]'
                      : 'bg-black text-zinc-200 hover:bg-zinc-900 shadow-[3px_3px_0px_#000]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">
                        #{ord.invoice || ord.id}
                      </span>
                      <h4 className="font-black text-xs uppercase text-white truncate max-w-[170px]">
                        {ord.buyer.fullName}
                      </h4>
                      <p className="text-[11px] font-bold text-yellow-400 mt-0.5 uppercase truncate">
                        {ord.productName} ({ord.quantity}x)
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase border border-black ${
                        isApproved
                          ? 'bg-green-500 text-black'
                          : isPending
                          ? 'bg-yellow-400 text-black'
                          : isBlocked
                          ? 'bg-red-600 text-white animate-pulse'
                          : isCancelled
                          ? 'bg-zinc-700 text-zinc-300'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {isApproved
                        ? 'DISETUJUI'
                        : isPending
                        ? 'PENDING'
                        : isBlocked
                        ? 'DIBLOKIR'
                        : isCancelled
                        ? 'DIBATALKAN'
                        : 'DITOLAK'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-zinc-800 text-zinc-400">
                    <span className="font-black text-white">{formatRupiah(ord.totalAmount)}</span>
                    <span className="uppercase">{ord.paymentMethod}</span>
                  </div>

                  {(ord.blockReason || ord.rejectionReason) && (
                    <p className="text-[9px] text-red-400 truncate mt-1 bg-red-950/40 p-1 border border-red-900/60 font-mono">
                      Alasan: {ord.blockReason || ord.rejectionReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Order Detail Column */}
          {selectedOrder && (
            <div className="md:col-span-7 bg-black border-4 border-black p-5 shadow-[8px_8px_0px_#000] space-y-4">
              {/* Header Box */}
              <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] text-yellow-400 uppercase font-bold">
                    DETAIL TRANSAKSI PEMBELIAN
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    INVOICE: #{selectedOrder.invoice || selectedOrder.id}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    WAKTU: {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-black uppercase border-2 border-black ${
                    selectedOrder.status === 'approved'
                      ? 'bg-green-500 text-black shadow-[2px_2px_0px_#fff]'
                      : selectedOrder.status === 'pending_approval'
                      ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_#fff]'
                      : selectedOrder.status === 'blocked'
                      ? 'bg-red-600 text-white shadow-[2px_2px_0px_#fff]'
                      : selectedOrder.status === 'cancelled'
                      ? 'bg-zinc-700 text-white shadow-[2px_2px_0px_#fff]'
                      : 'bg-red-600 text-white shadow-[2px_2px_0px_#fff]'
                  }`}
                >
                  {selectedOrder.status === 'approved'
                    ? '✓ DISETUJUI'
                    : selectedOrder.status === 'pending_approval'
                    ? '⏳ MENUNGGU APPROVAL'
                    : selectedOrder.status === 'blocked'
                    ? '⛔ DIBLOKIR'
                    : selectedOrder.status === 'cancelled'
                    ? '✕ DIBATALKAN'
                    : '✕ DITOLAK'}
                </span>
              </div>

              {/* Status Warning Banner if Blocked or Cancelled */}
              {(selectedOrder.status === 'blocked' || selectedOrder.status === 'cancelled') && (
                <div className="p-3.5 bg-red-950/80 border-3 border-red-600 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase flex items-center gap-1.5 text-red-400">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      {selectedOrder.status === 'blocked' ? 'TIKET INI TELAH DIBLOKIR' : 'TRANSAKSI INI DIBATALKAN'}
                    </span>
                    <button
                      onClick={() => handleUnblockOrder(selectedOrder.id)}
                      className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black border border-black font-black uppercase text-[10px] flex items-center gap-1 brutal-btn cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>PULIHKAN TIKET</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-zinc-200">
                    <strong>Alasan:</strong> {selectedOrder.blockReason || selectedOrder.rejectionReason || 'Tidak ada keterangan'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Tiket ini ditolak dan ditandai merah jika dipindai di Gate Scanner.
                  </p>
                </div>
              )}

              {/* Buyer & Ticket Info */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-3.5 border-2 border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase">DATA PEMBELI:</span>
                  <p className="font-black text-white">{selectedOrder.buyer.fullName}</p>
                  <p className="text-[11px] text-zinc-300 font-mono">
                    WA: {selectedOrder.buyer.whatsapp}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{selectedOrder.buyer.email}</p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase">TIKET & PEMBAYARAN:</span>
                  <p className="font-black text-white uppercase">{selectedOrder.productName}</p>
                  <p className="text-[11px] text-zinc-300">
                    {selectedOrder.quantity} Tiket @ {formatRupiah(selectedOrder.unitPrice)}
                  </p>
                  <p className="font-black text-yellow-400 text-sm mt-1">
                    TOTAL: {formatRupiah(selectedOrder.totalAmount)}
                  </p>
                  <span className="inline-block mt-1 bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase border border-zinc-700">
                    VIA {selectedOrder.paymentMethod} (+{selectedOrder.uniqueCode})
                  </span>
                </div>
              </div>

              {/* Bukti Transfer Box */}
              <div>
                <span className="block text-[11px] font-black uppercase text-white mb-1.5 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-green-400" />
                  BUKTI TRANSFER YANG DIUNGGAH PEMBELI:
                </span>

                {selectedOrder.paymentProofUrl ? (
                  <div className="relative border-3 border-black bg-zinc-950 p-2 shadow-[3px_3px_0px_#000] flex items-center justify-between">
                    <div
                      onClick={() => setZoomProofUrl(selectedOrder.paymentProofUrl!)}
                      className="cursor-pointer group relative flex items-center gap-3"
                    >
                      <div className="w-16 h-16 border-2 border-black overflow-hidden bg-black shrink-0">
                        <img
                          src={selectedOrder.paymentProofUrl}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-black text-yellow-400 uppercase flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> KLIK UNTUK MEMPERBESAR BUKTI
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Format gambar struk transfer berhasil diunggah
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 border-2 border-zinc-800 text-center text-xs text-zinc-400">
                    Tidak ada bukti gambar diunggah.
                  </div>
                )}
              </div>

              {/* Password Approval Area */}
              {selectedOrder.status === 'pending_approval' && (
                <div className="p-4 bg-yellow-400 border-3 border-black shadow-[4px_4px_0_#000] space-y-3 text-black">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-black" />
                    <label className="text-xs font-black uppercase tracking-wider">
                      MASUKKAN PASSWORD PERSETUJUAN TIKET &quot;{selectedOrder.productName}&quot; *:
                    </label>
                  </div>
                  <p className="text-[10px] font-bold text-black/80 uppercase">
                    Setiap produk tiket memiliki password rahasia approval yang berbeda sesuai yang diatur pada halaman Atur Tiket.
                  </p>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="MASUKKAN PASSWORD APPROVAL..."
                      value={approvalPasswordInput}
                      onChange={(e) => setApprovalPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black border-2 border-black text-yellow-400 font-mono text-xs font-black uppercase focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="p-2 bg-red-600 border border-black text-white text-[11px] font-bold uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Approval & Reject Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleReject(selectedOrder.id)}
                      className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white border-2 border-black font-black uppercase text-xs brutal-btn cursor-pointer"
                    >
                      TOLAK
                    </button>

                    <button
                      onClick={() => handleApproveWithPassword(selectedOrder)}
                      className="flex-1 py-3 bg-black hover:bg-zinc-900 text-green-400 border-2 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#fff] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>SETUJUI DENGAN PASSWORD</span>
                    </button>
                  </div>
                </div>
              )}

              {/* If already approved, show Send WhatsApp Ticket Button & Block/Cancel Actions */}
              {selectedOrder.status === 'approved' && (
                <div className="p-4 bg-zinc-950 border-3 border-black space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400 font-black uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      TIKET BERHASIL DITERBITKAN ({selectedOrder.tickets.length} E-TIKET)
                    </span>
                    <button
                      onClick={() => onViewTicket(selectedOrder.id)}
                      className="text-xs text-yellow-400 underline font-bold uppercase hover:text-yellow-300 cursor-pointer"
                    >
                      LIHAT E-TIKET
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenSendTicketModal(selectedOrder)}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
                  >
                    <MessageSquare className="w-4 h-4 text-black" />
                    <span>KIRIM TIKET KE WHATSAPP PEMBELI</span>
                    <ExternalLink className="w-4 h-4 text-black" />
                  </button>

                  {/* Blokir / Batalkan Transaksi Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                    <button
                      onClick={() => openCancelOrderModal(selectedOrder.id)}
                      className="py-2.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-2 border-black font-black uppercase text-[11px] flex items-center justify-center gap-1.5 brutal-btn shadow-[2px_2px_0_#000] cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5 text-red-400" />
                      <span>BATALKAN TIKET</span>
                    </button>

                    <button
                      onClick={() => openBlockOrderModal(selectedOrder.id)}
                      className="py-2.5 px-2 bg-red-600 hover:bg-red-500 text-white border-2 border-black font-black uppercase text-[11px] flex items-center justify-center gap-1.5 brutal-btn shadow-[2px_2px_0_#000] cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-300" />
                      <span>BLOKIR TRANSAKSI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Individual Tickets Breakdown */}
              {selectedOrder.tickets && selectedOrder.tickets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-black uppercase text-yellow-400 block">
                    DAFTAR TIKET INDIVIDUAL ({selectedOrder.tickets.length}):
                  </span>
                  <div className="space-y-2">
                    {selectedOrder.tickets.map((tkt, idx) => (
                      <div
                        key={tkt.ticketCode}
                        className={`p-3 border-2 border-black flex items-center justify-between gap-2 text-xs ${
                          tkt.isBlocked || tkt.status === 'BLOCKED'
                            ? 'bg-red-950/50 border-red-700'
                            : tkt.isUsed
                            ? 'bg-zinc-900'
                            : 'bg-zinc-950'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-white">
                              #{idx + 1} {tkt.ticketCode}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-black uppercase border border-black ${
                                tkt.isBlocked || tkt.status === 'BLOCKED'
                                  ? 'bg-red-600 text-white'
                                  : tkt.isUsed
                                  ? 'bg-zinc-700 text-zinc-300'
                                  : 'bg-green-500 text-black'
                              }`}
                            >
                              {tkt.isBlocked || tkt.status === 'BLOCKED'
                                ? 'DIBLOKIR'
                                : tkt.isUsed
                                ? 'SUDAH SCAN'
                                : 'AKTIF'}
                            </span>
                          </div>
                          <p className="text-zinc-300 font-bold text-[11px] uppercase mt-0.5">
                            {tkt.attendeeName}
                          </p>
                          {tkt.blockReason && (
                            <p className="text-[10px] text-red-400 font-mono">
                              Alasan: {tkt.blockReason}
                            </p>
                          )}
                        </div>

                        <div>
                          {tkt.isBlocked || tkt.status === 'BLOCKED' ? (
                            <button
                              onClick={() => handleUnblockSingleTicket(selectedOrder.id, tkt.ticketCode)}
                              className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border border-black font-black uppercase text-[10px] flex items-center gap-1 cursor-pointer brutal-btn"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>BUKA BLOKIR</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => openBlockSingleTicketModal(selectedOrder.id, tkt.ticketCode)}
                              className="px-2.5 py-1.5 bg-black hover:bg-red-600 hover:text-white text-red-400 border border-red-600 font-black uppercase text-[10px] flex items-center gap-1 cursor-pointer brutal-btn"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>BLOKIR</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL BLOKIR / BATALKAN DENGAN ALASAN ================= */}
      {actionModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#dc2626] overflow-hidden">
            <div className="reggae-stripe-h h-3 w-full" />
            <div className="p-4 bg-black border-b-3 border-black flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {actionModal === 'block_order'
                  ? 'BLOKIR TRANSAKSI & SELURUH TIKET'
                  : actionModal === 'cancel_order'
                  ? 'BATALKAN TRANSAKSI TIKET'
                  : `BLOKIR TIKET ${targetTicketCode}`}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="w-7 h-7 bg-zinc-900 hover:bg-red-600 hover:text-white border border-black flex items-center justify-center text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs font-mono">
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-200">
                <p className="font-bold uppercase">
                  {actionModal === 'block_order'
                    ? 'Tiket yang diblokir tidak akan dapat digunakan masuk di Gate Scanner.'
                    : actionModal === 'cancel_order'
                    ? 'Transaksi akan ditandai dibatalkan dan tiket digital dinonaktifkan.'
                    : `Hanya tiket ${targetTicketCode} yang akan dinonaktifkan.`}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-white mb-1.5">
                  MASUKKAN ALASAN (WAJIB):
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Contoh: Bukti transfer terindikasi palsu / Pembatalan oleh pembeli / Tiket dilaporkan hilang"
                  className="w-full p-3 bg-black border-2 border-zinc-700 text-white font-mono text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-3 bg-zinc-900 text-zinc-300 hover:text-white border-2 border-black font-black uppercase text-xs cursor-pointer brutal-btn"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white border-2 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_#000] cursor-pointer brutal-btn"
                >
                  KONFIRMASI {actionModal === 'cancel_order' ? 'PEMBATALAN' : 'PEMBLOKIRAN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Dispatch Modal for Admin */}
      {waModalOpen && activeWaMessage && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#16a34a] overflow-hidden my-6">
            <div className="reggae-stripe-h h-3 w-full" />
            <div className="p-4 bg-black border-b-3 border-black flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                KIRIM TIKET KE WHATSAPP ({selectedOrder.buyer.whatsapp})
              </h3>
              <button
                onClick={() => setWaModalOpen(false)}
                className="px-2.5 py-1 bg-red-600 text-white border-2 border-black font-black text-xs uppercase cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs font-mono">
              <p className="text-zinc-300 uppercase">
                Pesan berikut berisi tautan resmi e-tiket dengan QR Code / Barcode unik pengunjung:
              </p>

              <div className="bg-black border-2 border-zinc-700 p-3.5 text-zinc-200 whitespace-pre-wrap leading-relaxed select-all">
                {activeWaMessage.text}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.open(activeWaMessage.url, '_blank');
                    handleMarkAsSentToBuyer(selectedOrder.id);
                  }}
                  className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-xs flex items-center justify-center gap-2 brutal-btn shadow-[3px_3px_0px_#000] cursor-pointer"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span>BUKA WHATSAPP & KIRIM TIKET</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Zoom Modal */}
      {zoomProofUrl && (
        <div
          onClick={() => setZoomProofUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
        >
          <div className="max-w-xl max-h-[85vh] border-4 border-white bg-black overflow-hidden shadow-[10px_10px_0px_#facc15]">
            <img src={zoomProofUrl} alt="Bukti Transfer Zoom" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
