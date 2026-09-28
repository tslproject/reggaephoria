import React, { useState } from 'react';
import { TicketProduct, BuyerFormData, PaymentMethodType, Order } from '../types';
import { PAYMENT_ACCOUNTS, storage } from '../services/storage';
import { formatRupiah, buildAdminWhatsAppMessage } from '../utils/whatsapp';
import {
  X,
  Copy,
  Check,
  Upload,
  ArrowRight,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: TicketProduct;
  quantity: number;
  buyerData: BuyerFormData;
  onOrderCreated: (order: Order, waAdminUrl: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity,
  buyerData,
  onOrderCreated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('DANA');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 3-digit random unique code calculated once per session
  const [uniqueCode] = useState<number>(() => Math.floor(100 + Math.random() * 900));
  const subtotal = product.price * quantity;
  const totalAmount = subtotal + uniqueCode;

  // Proof screenshot upload state
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAccount =
    PAYMENT_ACCOUNTS.find((a) => a.method === selectedMethod) || PAYMENT_ACCOUNTS[0];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofError('FILE HARUS BERUPA GAMBAR (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProofError('UKURAN FILE MAKSIMAL 5MB');
      return;
    }

    setProofError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFinishPayment = () => {
    if (!proofPreview) {
      setProofError('UNGGAH SCREENSHOT BUKTI PEMBAYARAN TERLEBIH DAHULU!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create order in storage with product
      const newOrder = storage.createOrder({
        product,
        buyer: buyerData,
        quantity,
        paymentMethod: selectedMethod,
        paymentProofUrl: proofPreview,
      });

      // 2. Build admin notification WhatsApp message with auto-approval link
      const { url: waAdminUrl } = buildAdminWhatsAppMessage(newOrder);

      // 3. Mark admin notification sent in order
      newOrder.waAdminNotificationSent = true;
      newOrder.waAdminSentAt = new Date().toISOString();
      storage.saveOrder(newOrder);

      setIsSubmitting(false);
      onOrderCreated(newOrder, waAdminUrl);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setProofError('GAGAL MEMPROSES PESANAN. SILAKAN COBA LAGI.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#facc15] overflow-hidden my-4">
        {/* Top Reggae Stripe */}
        <div className="reggae-stripe-h h-3 w-full" />

        {/* Header */}
        <div className="p-4 bg-black border-b-3 border-black flex items-center justify-between">
          <div>
            <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2 py-0.5 border border-black uppercase tracking-wider">
              REGGAEPHORIA TANGSEL
            </span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight mt-1">
              PEMBAYARAN TIKET RESMI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-zinc-800 hover:bg-red-600 text-white border-2 border-black flex items-center justify-center brutal-btn cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-mono">
          {/* Total Tagihan Box Brutalist */}
          <div className="p-4 bg-yellow-400 border-3 border-black shadow-[5px_5px_0px_#000] text-black">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-black text-yellow-400 px-2 py-0.5">
                TOTAL TRANSFER (PERSIS):
              </span>
              <span className="font-bold text-[11px] uppercase">
                {quantity}X {product.name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight">
                {formatRupiah(totalAmount)}
              </span>

              <button
                type="button"
                onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white border-2 border-black font-black text-[11px] flex items-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#fff] cursor-pointer"
              >
                {copiedField === 'amount' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span>TERSALIN</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SALIN</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] font-bold text-black/90 mt-2 bg-yellow-300 p-1.5 border border-black">
              ⚠️ PENTING: Wajib transfer nominal persis hingga 3 digit terakhir (+{uniqueCode}) agar sistem mendeteksi transaksi Anda!
            </p>
          </div>

          {/* Payment Method Selector (DANA & BCA) */}
          <div>
            <label className="block text-[11px] font-black text-white uppercase tracking-wider mb-2">
              PILIH REKENING PEMBAYARAN RESMI:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_ACCOUNTS.map((acc) => {
                const isSelected = selectedMethod === acc.method;
                return (
                  <button
                    key={acc.method}
                    type="button"
                    onClick={() => setSelectedMethod(acc.method)}
                    className={`p-3 border-3 border-black text-left transition-all brutal-btn ${
                      isSelected
                        ? 'bg-zinc-900 border-yellow-400 shadow-[4px_4px_0px_#16a34a] ring-2 ring-yellow-400'
                        : 'bg-black border-black shadow-[3px_3px_0px_#000] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase text-white border border-black ${
                          acc.method === 'DANA' ? 'bg-sky-500' : 'bg-blue-700'
                        }`}
                      >
                        {acc.method}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                    <p className="text-xs font-mono font-black text-white tracking-wider">
                      {acc.accountNumber}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Account Details Box */}
          <div className="p-4 bg-black border-3 border-black shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono font-black text-green-400 uppercase">
                  NOMOR REKENING {currentAccount.method}:
                </p>
                <p className="text-xl font-mono font-black text-yellow-300 tracking-wider my-0.5 select-all">
                  {currentAccount.accountNumber}
                </p>
                <p className="text-[10px] font-mono text-zinc-400 uppercase">
                  A.N. {currentAccount.accountHolder}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(currentAccount.accountNumber, 'account')}
                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-black text-xs flex items-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                {copiedField === 'account' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>TERSALIN</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>SALIN NO</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Screenshot Bukti Transfer */}
          <div className="pt-1">
            <label className="text-xs font-black text-white uppercase flex items-center gap-1.5 mb-2">
              <FileCheck className="w-4 h-4 text-yellow-400" />
              UPLOAD SCREENSHOT BUKTI PEMBAYARAN *
            </label>

            <div className="border-3 border-dashed border-zinc-700 hover:border-yellow-400 p-4 text-center bg-black transition-colors">
              {proofPreview ? (
                <div className="flex flex-col items-center">
                  <div className="relative group max-w-xs border-2 border-black shadow-[3px_3px_0_#000]">
                    <img
                      src={proofPreview}
                      alt="Bukti Transfer"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label className="px-3 py-1 bg-yellow-400 text-black border-2 border-black font-black text-[10px] uppercase cursor-pointer brutal-btn">
                        GANTI FOTO
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono font-bold text-green-400 mt-2 flex items-center gap-1 uppercase">
                    <Check className="w-3.5 h-3.5" /> BUKTI PEMBAYARAN SIAP DIKIRIM
                  </p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-3">
                  <div className="w-12 h-12 bg-yellow-400 border-2 border-black text-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_#fff]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    KLIK DISINI JIKA SUDAH MELAKUKAN PEMBAYARAN
                  </span>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">
                    Unggah screenshot struk m-banking / DANA
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {proofError && (
              <p className="text-[11px] font-mono font-black text-red-400 mt-2 flex items-center gap-1 uppercase">
                <AlertTriangle className="w-3.5 h-3.5" /> {proofError}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black border-t-3 border-black flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-2 border-black font-black text-xs uppercase brutal-btn"
          >
            BATAL
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinishPayment}
            className="flex-1 py-3.5 px-4 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 cursor-pointer brutal-btn disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>MEMPROSES...</span>
            ) : (
              <>
                <span>SUDAH MEMBAYAR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
