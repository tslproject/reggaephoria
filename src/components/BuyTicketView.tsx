import React, { useState, useEffect } from 'react';
import { TicketProduct, BuyerFormData } from '../types';
import { storage } from '../services/storage';
import { formatRupiah } from '../utils/whatsapp';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  AlertCircle,
  Plus,
  Minus,
  Info,
  X,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface BuyTicketViewProps {
  onProceedToPayment: (
    product: TicketProduct,
    quantity: number,
    buyerData: BuyerFormData
  ) => void;
}

export const BuyTicketView: React.FC<BuyTicketViewProps> = ({
  onProceedToPayment,
}) => {
  const [products, setProducts] = useState<TicketProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Ticket Detail Modal State
  const [detailModalProduct, setDetailModalProduct] = useState<TicketProduct | null>(null);

  // Buyer Form fields (TIDAK PERLU KTP)
  const [fullName, setFullName] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [attendeeNames, setAttendeeNames] = useState<string[]>(['']);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const reload = () => {
    const list = storage.getTicketProducts();
    setProducts(list);
    if (list.length > 0 && !selectedProductId) {
      setSelectedProductId(list[0].id);
    }
  };

  useEffect(() => {
    reload();
    const unsub = storage.subscribe(() => {
      reload();
    });
    return () => unsub();
  }, []);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0] || null;

  const handleQuantityChange = (newQty: number) => {
    if (!selectedProduct) return;
    if (newQty < 1 || newQty > 10 || newQty > selectedProduct.available) return;
    setQuantity(newQty);
    setAttendeeNames((prev) => {
      const next = [...prev];
      if (newQty > next.length) {
        for (let i = next.length; i < newQty; i++) {
          next.push('');
        }
      } else {
        next.splice(newQty);
      }
      return next;
    });
  };

  const handleAttendeeChange = (idx: number, val: string) => {
    const next = [...attendeeNames];
    next[idx] = val;
    setAttendeeNames(next);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'NAMA LENGKAP PEMESAN WAJIB DIISI';
    if (!whatsapp.trim()) {
      errs.whatsapp = 'NOMOR WHATSAPP WAJIB DIISI';
    } else if (whatsapp.replace(/\D/g, '').length < 9) {
      errs.whatsapp = 'NOMOR WHATSAPP MINIMAL 9 DIGIT';
    }
    if (!email.trim() || !email.includes('@')) errs.email = 'FORMAT EMAIL TIDAK VALID';

    const finalAttendees = attendeeNames.map((name, i) => {
      if (i === 0 && !name.trim()) return fullName.trim();
      if (!name.trim()) return `${fullName.trim()} (Tamu ${i + 1})`;
      return name.trim();
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    onProceedToPayment(selectedProduct, quantity, {
      fullName: fullName.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      idNumber: '', // Tidak perlu KTP
      attendeeNames: finalAttendees,
    });
  };

  // State jika belum ada tiket yang diterbitkan oleh admin
  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <div className="bg-black border-4 border-yellow-400 p-8 shadow-[8px_8px_0px_#dc2626] space-y-4">
          <div className="w-16 h-16 bg-yellow-400 border-3 border-black text-black flex items-center justify-center mx-auto shadow-[4px_4px_0_#000]">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2 py-0.5 border border-black uppercase tracking-widest">
              OFFICIAL REGGAE TICKETING
            </span>
            <h2 className="text-2xl font-black uppercase text-white mt-2 tracking-tight">
              TIKET REGGAEPHORIA BELUM TERSEDIA
            </h2>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mt-2">
              Penjualan tiket pertunjukan <strong>Reggaephoria Tangsel</strong> belum dibuka oleh penyelenggara. Silakan pantau pengumuman resmi dari kami.
            </p>
          </div>
          <div className="reggae-stripe-h h-2 w-full mt-4" />
        </div>
      </div>
    );
  }

  // Tampilan Utama Pembeli (Brutalist Reggae Theme)
  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-28 font-mono">
      {/* Header Banner Brutalist */}
      <div className="bg-black border-3 border-black p-4 shadow-[6px_6px_0px_#facc15] relative overflow-hidden">
        <div className="reggae-stripe-h h-2 w-full mb-3" />
        <div className="flex items-center justify-between">
          <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2.5 py-0.5 border-2 border-black uppercase tracking-wider">
            ★ OFFICIAL REGGAE TICKETING
          </span>
          <span className="text-yellow-400 font-black text-xs uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" /> TANGSEL VIBES
          </span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-2">
          REGGAEPHORIA TANGSEL
        </h1>
        <p className="text-xs font-mono text-zinc-300 mt-0.5">
          Klik tiket untuk melihat modal detail (Presale, VIP, dll) & pesan sekarang
        </p>
      </div>

      {/* 1. Katalog Produk Tiket */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-black font-black text-xs px-2 py-0.5 border-2 border-black">
              LANGKAH 1
            </span>
            <label className="text-xs font-black text-white uppercase tracking-wider">
              PILIH KATEGORI TIKET
            </label>
          </div>
          <span className="text-[10px] text-yellow-400 font-bold uppercase animate-pulse">
            *KLIK UNTUK DETAIL TIKET
          </span>
        </div>

        <div className="space-y-3">
          {products.map((prod) => {
            const isSelected = selectedProduct?.id === prod.id;
            return (
              <div
                key={prod.id}
                onClick={() => {
                  setSelectedProductId(prod.id);
                  setDetailModalProduct(prod);
                  if (quantity > prod.available) setQuantity(Math.max(1, prod.available));
                }}
                className={`p-3.5 cursor-pointer border-3 border-black transition-all brutal-btn relative ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-[6px_6px_0px_#16a34a] ring-2 ring-green-400'
                    : 'bg-zinc-950 text-zinc-200 hover:bg-zinc-900 shadow-[4px_4px_0px_#000]'
                }`}
              >
                {/* Active Indicator Stamp */}
                {isSelected && (
                  <span className="absolute -top-3 right-3 bg-green-500 text-black font-black text-[10px] px-2 py-0.5 border-2 border-black uppercase shadow-[2px_2px_0px_#000]">
                    ✓ TERPILIH
                  </span>
                )}

                <div className="flex gap-3 items-center">
                  <div className="w-20 h-20 bg-black shrink-0 border-2 border-black overflow-hidden relative shadow-[2px_2px_0px_#000]">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <h3 className="font-black text-base uppercase text-white truncate">
                        {prod.name}
                      </h3>
                      <span className="font-mono font-black text-yellow-400 text-base shrink-0 bg-black px-1.5 py-0.5 border border-yellow-400">
                        {formatRupiah(prod.price)}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono font-bold text-zinc-400 truncate mt-0.5 uppercase">
                      {prod.eventTitle}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-red-600/90 text-white px-1.5 py-0.5 font-black uppercase border border-black">
                          SISA: {prod.available}
                        </span>
                        <span className="text-zinc-400 font-bold uppercase truncate max-w-[120px]">
                          {prod.date}
                        </span>
                      </div>
                      <span className="text-yellow-400 underline font-bold flex items-center gap-0.5">
                        <Info className="w-3 h-3" /> DETAIL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rincian Singkat Tiket Terpilih */}
      {selectedProduct && (
        <div className="p-4 bg-zinc-900 border-3 border-black shadow-[4px_4px_0px_#000] space-y-2.5">
          <div className="reggae-stripe-h h-1 w-full" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-yellow-400">
              TIKET DIPILIH: {selectedProduct.name}
            </span>
            <button
              type="button"
              onClick={() => setDetailModalProduct(selectedProduct)}
              className="text-[10px] font-black uppercase bg-black text-yellow-400 px-2 py-0.5 border border-yellow-400 flex items-center gap-1 hover:bg-zinc-800 cursor-pointer"
            >
              <Info className="w-3 h-3" /> LIHAT DETAIL
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-200">
            <Calendar className="w-4 h-4 text-green-400 shrink-0" />
            <span className="font-bold text-white uppercase">{selectedProduct.date}</span>
            <span className="text-zinc-600">|</span>
            <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{selectedProduct.time}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-200">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold uppercase truncate">
              {selectedProduct.venue}, {selectedProduct.city}
            </span>
          </div>

          {selectedProduct.description && (
            <p className="text-[11px] font-mono text-zinc-300 pt-2 border-t-2 border-dashed border-zinc-700 leading-relaxed line-clamp-2">
              {selectedProduct.description}
            </p>
          )}
        </div>
      )}

      {/* 2. Jumlah Tiket */}
      {selectedProduct && (
        <div className="p-4 bg-black border-3 border-black shadow-[4px_4px_0px_#000] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-yellow-400 text-black font-black text-xs px-2 py-0.5 border border-black">
                LANGKAH 2
              </span>
              <h2 className="text-sm font-black text-white uppercase mt-1">
                JUMLAH TIKET
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-10 h-10 bg-zinc-900 disabled:opacity-30 border-2 border-black font-black text-white text-lg flex items-center justify-center brutal-btn shadow-[2px_2px_0px_#fff] cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-mono font-black text-yellow-400 w-8 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 10 || quantity >= selectedProduct.available}
                className="w-10 h-10 bg-yellow-400 disabled:opacity-30 border-2 border-black font-black text-black text-lg flex items-center justify-center brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400">
            Maksimal 10 tiket per transaksi. Kuota tersedia: {selectedProduct.available} tiket.
          </p>
        </div>
      )}

      {/* 3. Form Data Pemesan (TIDAK PERLU KTP) */}
      {selectedProduct && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-green-500 text-black font-black text-xs px-2 py-0.5 border-2 border-black">
              LANGKAH 3
            </span>
            <label className="text-xs font-black text-white uppercase tracking-wider">
              DATA PEMESAN (TIDAK PERLU KTP)
            </label>
          </div>

          <div className="bg-zinc-950 p-4 border-3 border-black shadow-[5px_5px_0px_#000] space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase mb-1">
                NAMA LENGKAP PEMESAN *
              </label>
              <input
                type="text"
                placeholder="CONTOH: ANDRE PRASETYO"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (attendeeNames[0] === '' || attendeeNames[0] === fullName) {
                    handleAttendeeChange(0, e.target.value);
                  }
                }}
                className={`w-full px-3.5 py-2.5 bg-black border-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 ${
                  errors.fullName ? 'border-red-500 bg-red-950/20' : 'border-zinc-700'
                }`}
              />
              {errors.fullName && (
                <p className="text-[10px] font-mono font-bold text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase mb-1">
                NOMOR WHATSAPP AKTIF *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-black text-yellow-400">
                  +62
                </span>
                <input
                  type="tel"
                  placeholder="81234567890"
                  value={
                    whatsapp.startsWith('0')
                      ? whatsapp.slice(1)
                      : whatsapp.startsWith('62')
                      ? whatsapp.slice(2)
                      : whatsapp
                  }
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={`w-full pl-12 pr-3.5 py-2.5 bg-black border-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 ${
                    errors.whatsapp ? 'border-red-500 bg-red-950/20' : 'border-zinc-700'
                  }`}
                />
              </div>
              {errors.whatsapp && (
                <p className="text-[10px] font-mono font-bold text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.whatsapp}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-zinc-300 uppercase mb-1">
                ALAMAT EMAIL *
              </label>
              <input
                type="email"
                placeholder="NAMA@EMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-black border-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 ${
                  errors.email ? 'border-red-500 bg-red-950/20' : 'border-zinc-700'
                }`}
              />
              {errors.email && (
                <p className="text-[10px] font-mono font-bold text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Attendee Names if Quantity > 1 */}
            {quantity > 1 && (
              <div className="pt-2 border-t-2 border-zinc-800 space-y-2">
                <label className="block text-[11px] font-mono font-black text-yellow-400 uppercase">
                  NAMA MASING-MASING PEMEGANG TIKET ({quantity} ORANG):
                </label>
                {Array.from({ length: quantity }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`NAMA LENGKAP PEMEGANG TIKET #${i + 1}`}
                    value={attendeeNames[i] || ''}
                    onChange={(e) => handleAttendeeChange(i, e.target.value)}
                    className="w-full px-3 py-2 bg-black border-2 border-zinc-800 text-xs font-mono text-white uppercase focus:border-yellow-400"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Subtotal Banner */}
          <div className="p-4 bg-black border-3 border-black shadow-[4px_4px_0px_#dc2626] flex justify-between items-center text-xs">
            <div>
              <p className="text-zinc-400 font-mono uppercase text-[11px]">
                TOTAL ({quantity}X {selectedProduct.name})
              </p>
              <p className="text-xl font-mono font-black text-yellow-400">
                {formatRupiah(selectedProduct.price * quantity)}
              </p>
            </div>
            <div className="text-right">
              <span className="bg-red-600 text-white text-[10px] font-mono font-black px-2 py-1 border border-black uppercase">
                + KODE UNIK SAAT BAYAR
              </span>
            </div>
          </div>

          {/* Big Chunky Brutalist CTA */}
          <button
            type="submit"
            className="w-full py-4 px-4 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-sm tracking-wider shadow-[6px_6px_0px_#000] flex items-center justify-center gap-2 cursor-pointer brutal-btn"
          >
            <span>LANJUT KE PEMBAYARAN</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* ================= MODAL DETAIL TIKET (POPUP KETIKA LIST TIKET DIKLIK) ================= */}
      {detailModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#facc15] overflow-hidden my-6">
            {/* Top Reggae Stripe */}
            <div className="reggae-stripe-h h-3 w-full" />

            {/* Header */}
            <div className="p-4 bg-black border-b-3 border-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 border border-black uppercase">
                  DETAIL TIKET
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 uppercase">
                  REGGAEPHORIA TANGSEL
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalProduct(null)}
                className="w-8 h-8 bg-zinc-900 hover:bg-red-600 hover:text-white border-2 border-black flex items-center justify-center text-zinc-300 brutal-btn cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Poster Image */}
              <div className="w-full h-44 sm:h-52 bg-black border-3 border-black overflow-hidden relative shadow-[4px_4px_0px_#000]">
                <img
                  src={detailModalProduct.imageUrl}
                  alt={detailModalProduct.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-red-600 text-white font-black text-xs px-2.5 py-1 border-2 border-black uppercase shadow-[2px_2px_0_#000]">
                  SISA KUOTA: {detailModalProduct.available}
                </span>
              </div>

              {/* Title & Price */}
              <div className="p-3 bg-black border-2 border-black flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">KATEGORI TIKET</span>
                  <h3 className="text-xl font-black uppercase text-white">
                    {detailModalProduct.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono">HARGA TIKET</span>
                  <p className="text-xl font-mono font-black text-yellow-400">
                    {formatRupiah(detailModalProduct.price)}
                  </p>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-3 bg-zinc-900 border-2 border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Calendar className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="font-bold text-white uppercase">{detailModalProduct.date}</span>
                  <span className="text-zinc-600">•</span>
                  <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>{detailModalProduct.time}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-bold uppercase">
                    {detailModalProduct.venue}, {detailModalProduct.city}
                  </span>
                </div>
              </div>

              {/* Perks / Benefits */}
              {detailModalProduct.perks && detailModalProduct.perks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-yellow-400">
                    FASILITAS & BENEFIT TIKET:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {detailModalProduct.perks.map((perk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-black border border-zinc-800 text-xs text-zinc-200"
                      >
                        <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        <span className="font-mono">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {detailModalProduct.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase text-zinc-400">
                    DESKRIPSI TIKET:
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed p-3 bg-black border border-zinc-800">
                    {detailModalProduct.description}
                  </p>
                </div>
              )}

              {/* CTA Select Ticket */}
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId(detailModalProduct.id);
                  if (quantity > detailModalProduct.available) {
                    setQuantity(Math.max(1, detailModalProduct.available));
                  }
                  setDetailModalProduct(null);
                }}
                className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 brutal-btn shadow-[4px_4px_0px_#000] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PILIH TIKET INI & ISI DATA PEMESANAN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
