import React, { useState, useEffect } from 'react';
import { TicketProduct } from '../types';
import { storage } from '../services/storage';
import { formatRupiah } from '../utils/whatsapp';
import {
  PlusCircle,
  Ticket,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  AlertCircle,
  ArrowRight,
  Upload,
  Sparkles,
} from 'lucide-react';

interface ManageTicketsViewProps {
  onTicketCreated?: () => void;
  onNavigateToBuy?: () => void;
}

const CATEGORY_PRESETS = [
  'PRESALE 1',
  'PRESALE 2',
  'EARLY BIRD',
  'REGULAR FESTIVAL',
  'VIP PASS',
  'OTS (ON THE SPOT)',
];

export const ManageTicketsView: React.FC<ManageTicketsViewProps> = ({
  onTicketCreated,
  onNavigateToBuy,
}) => {
  const [products, setProducts] = useState<TicketProduct[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [eventTitle, setEventTitle] = useState('Reggaephoria Tangsel 2026');
  const [price, setPrice] = useState<number | ''>(125000);
  const [quota, setQuota] = useState<number | ''>(500);
  const [date, setDate] = useState('Sabtu, 14 November 2026');
  const [time, setTime] = useState('15:00 - 23:30 WIB');
  const [venue, setVenue] = useState('Area Festival Tangsel');
  const [city, setCity] = useState('Tangerang Selatan');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState(
    'Akses resmi konser Reggaephoria Tangsel dengan penampilan musisi reggae terbaik dan pertunjukan spektakuler.'
  );
  const [perksText, setPerksText] = useState('Akses Masuk Festival, Wristband Resmi, Akses Food Court & Merchandise');
  const [approvalPassword, setApprovalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = () => {
    setProducts(storage.getTicketProducts());
  };

  useEffect(() => {
    reload();
    const unsub = storage.subscribe(() => {
      reload();
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('PRESALE 1');
    setEventTitle('Reggaephoria Tangsel 2026');
    setPrice(125000);
    setQuota(500);
    setDate('Sabtu, 14 November 2026');
    setTime('15:00 - 23:30 WIB');
    setVenue('Area Festival Tangsel');
    setCity('Tangerang Selatan');
    setImageUrl('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80');
    setDescription('Akses resmi konser Reggaephoria Tangsel dengan penampilan musisi reggae terbaik dan pertunjukan spektakuler.');
    setPerksText('Akses Masuk Festival, Wristband Resmi, Akses Food Court & Merchandise');
    setApprovalPassword('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (prod: TicketProduct) => {
    setEditingId(prod.id);
    setName(prod.name);
    setEventTitle(prod.eventTitle);
    setPrice(prod.price);
    setQuota(prod.quota);
    setDate(prod.date);
    setTime(prod.time);
    setVenue(prod.venue);
    setCity(prod.city);
    setImageUrl(prod.imageUrl);
    setDescription(prod.description);
    setPerksText(prod.perks.join(', '));
    setApprovalPassword(prod.approvalPassword);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`Yakin ingin menghapus produk tiket "${prodName}"?`)) {
      storage.deleteTicketProduct(id);
      reload();
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('NAMA KATEGORI TIKET WAJIB DIISI!');
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError('HARGA TIKET HARUS LEBIH BESAR DARI 0!');
      return;
    }
    if (!quota || Number(quota) <= 0) {
      setFormError('KUOTA TIKET HARUS LEBIH BESAR DARI 0!');
      return;
    }
    if (!approvalPassword.trim()) {
      setFormError(
        'PASSWORD PERSETUJUAN WAJIB DIISI! Password ini akan diminta saat admin menyetujui transaksi tiket ini.'
      );
      return;
    }

    const perksArray = perksText
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const existing = editingId ? products.find((p) => p.id === editingId) : null;
    const quotaDiff = existing ? Number(quota) - existing.quota : 0;
    const newAvailable = existing ? Math.max(0, existing.available + quotaDiff) : Number(quota);

    const newProd: TicketProduct = {
      id: editingId || `PROD-${Date.now().toString().slice(-6)}`,
      name: name.trim().toUpperCase(),
      price: Number(price),
      quota: Number(quota),
      available: newAvailable,
      eventTitle: eventTitle.trim() || 'Reggaephoria Tangsel 2026',
      date: date.trim(),
      time: time.trim(),
      venue: venue.trim(),
      city: city.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      description: description.trim(),
      perks: perksArray.length > 0 ? perksArray : ['Akses Masuk Festival', 'Wristband Resmi'],
      approvalPassword: approvalPassword.trim(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    storage.saveTicketProduct(newProd);
    setIsFormOpen(false);
    reload();

    if (onTicketCreated) {
      onTicketCreated();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 font-mono">
      {/* Header Banner Brutalist */}
      <div className="bg-black border-4 border-black p-5 sm:p-6 mb-6 shadow-[6px_6px_0px_#facc15] relative">
        <div className="reggae-stripe-h h-2.5 w-full mb-3" />
        <div className="flex items-center justify-between mb-2">
          <span className="bg-green-500 text-black font-black text-[10px] px-2.5 py-0.5 border border-black uppercase tracking-wider">
            ★ OFFICIAL REGGAE TICKETING
          </span>
          <span className="text-[11px] font-black text-yellow-400 uppercase">
            REGGAEPHORIA TANGSEL
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
          MANAJEMEN TIKET FESTIVAL
        </h1>
        <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
          Atur dan ubah kategori tiket (<strong>Presale 1, Presale 2, Early Bird, VIP</strong>, dll), harga, kuota, poster, dan tentukan password approval khusus tiap tiket.
        </p>
      </div>

      {/* Action Header: Create Ticket Button */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-6">
        <div>
          <h2 className="text-sm font-black uppercase text-white">
            DAFTAR KATALOG TIKET ({products.length})
          </h2>
          <p className="text-xs text-zinc-400">
            {products.length === 0
              ? 'Belum ada tiket diterbitkan. Klik tombol di kanan untuk membuat tiket baru.'
              : 'Tiket aktif langsung muncul di katalog halaman pembeli.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 brutal-btn shadow-[4px_4px_0px_#000] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          <span>TAMBAH TIKET (PRESALE DLL)</span>
        </button>
      </div>

      {/* Ticket Cards Grid */}
      {products.length === 0 ? (
        <div className="bg-zinc-950 border-4 border-dashed border-zinc-700 p-8 sm:p-12 text-center space-y-4 shadow-[6px_6px_0px_#000]">
          <div className="w-16 h-16 bg-yellow-400 border-3 border-black text-black flex items-center justify-center mx-auto shadow-[4px_4px_0_#fff]">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight">
            BELUM ADA PRODUK TIKET YANG DIBUAT
          </h3>
          <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
            Halaman katalog pembeli saat ini berstatus kosong. Klik tombol &quot;TAMBAH TIKET&quot; untuk membuat tiket kategori Presale 1, Early Bird, atau VIP.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black border-3 border-black font-black uppercase text-xs brutal-btn shadow-[4px_4px_0px_#000] cursor-pointer"
          >
            BUAT TIKET PERTAMA SEKARANG
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-black border-3 border-black p-4 shadow-[6px_6px_0px_#000] space-y-3 flex flex-col justify-between relative group hover:border-yellow-400 transition-all"
            >
              <div className="reggae-stripe-h h-1.5 w-full -mt-1" />

              <div>
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-zinc-900 border-2 border-black shrink-0 overflow-hidden relative">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <span className="bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black uppercase border border-black truncate">
                        {prod.name}
                      </span>
                      <span className="font-mono font-black text-sm text-yellow-300">
                        {formatRupiah(prod.price)}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-sm uppercase truncate mt-1">
                      {prod.eventTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1">
                      <Calendar className="w-3 h-3 text-green-400 shrink-0" />
                      <span className="truncate">{prod.date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-zinc-500 uppercase block">KUOTA TERSEDIA:</span>
                    <span className="font-black text-white text-xs">
                      {prod.available} / {prod.quota}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase block">PASSWORD APPROVAL:</span>
                    <span className="font-black text-yellow-400 text-xs">
                      {prod.approvalPassword}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => handleEdit(prod)}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-1.5 brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>EDIT DETAIL</span>
                </button>

                <button
                  onClick={() => handleDelete(prod.id, prod.name)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white border-2 border-black font-black uppercase text-xs flex items-center justify-center brutal-btn shadow-[2px_2px_0px_#000] cursor-pointer"
                  title="Hapus Tiket"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL TAMBAH / EDIT TIKET ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-zinc-950 border-4 border-black shadow-[10px_10px_0px_#facc15] overflow-hidden my-6">
            <div className="reggae-stripe-h h-3 w-full" />

            <div className="p-4 bg-black border-b-3 border-black flex items-center justify-between">
              <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
                <Ticket className="w-5 h-5 text-yellow-400" />
                {editingId ? 'EDIT DETAIL TIKET (PRESALE, DLL)' : 'BUAT PRODUK TIKET BARU'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1 bg-red-600 text-white border-2 border-black font-black text-xs uppercase brutal-btn cursor-pointer"
              >
                TUTUP
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 bg-red-600 border-2 border-black text-white font-bold flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Password Persetujuan */}
              <div className="p-4 bg-yellow-400 border-3 border-black shadow-[4px_4px_0_#000] space-y-2 text-black">
                <label className="block text-xs font-black uppercase flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-black" />
                  PASSWORD PERSETUJUAN TRANSAKSI (KHUSUS TIKET INI) *
                </label>
                <p className="text-[10px] font-bold text-black/90 uppercase">
                  Password rahasia ini wajib diisi dan harus dimasukkan admin saat menyetujui transaksi tiket ini.
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="CONTOH: REGGAE2026 / SENANG123"
                    value={approvalPassword}
                    onChange={(e) => setApprovalPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-black text-yellow-400 font-mono text-sm font-black uppercase focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Presets for Category Name */}
              <div>
                <label className="block font-black text-zinc-300 uppercase mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  PILIH PRESET KATEGORI / UBAH KE PRESALE:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setName(preset)}
                      className={`px-2.5 py-1 border border-black font-black uppercase text-[10px] cursor-pointer brutal-btn ${
                        name === preset
                          ? 'bg-yellow-400 text-black shadow-[2px_2px_0_#fff]'
                          : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block font-black text-zinc-300 uppercase mb-1">
                  NAMA KATEGORI TIKET *
                </label>
                <input
                  type="text"
                  placeholder="CONTOH: PRESALE 1 / VIP PASS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">
                    HARGA TIKET (RP) *
                  </label>
                  <input
                    type="number"
                    placeholder="125000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-yellow-400 font-mono text-xs font-black focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">
                    TOTAL KUOTA TIKET *
                  </label>
                  <input
                    type="number"
                    placeholder="500"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs font-black focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-zinc-300 uppercase mb-1">
                  NAMA ACARA / EVENT
                </label>
                <input
                  type="text"
                  placeholder="Reggaephoria Tangsel 2026"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">TANGGAL ACARA</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">WAKTU / JAM</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">LOKASI VENUE</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block font-black text-zinc-300 uppercase mb-1">KOTA</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs uppercase focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Poster Image */}
              <div>
                <label className="block font-black text-zinc-300 uppercase mb-1">
                  POSTER / GAMBAR TIKET (URL ATAU UPLOAD FILE):
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs focus:border-yellow-400"
                  />
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-black font-black uppercase text-[11px] flex items-center gap-1.5 cursor-pointer brutal-btn shadow-[2px_2px_0_#fff]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>UNGGAH GAMBAR DARI HP/PC</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <span className="text-[10px] text-green-400 font-bold uppercase">
                        ✓ GAMBAR TERPASANG
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-black text-zinc-300 uppercase mb-1">
                  DESKRIPSI TIKET
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block font-black text-zinc-300 uppercase mb-1">
                  FASILITAS / PERKS (PISAHKAN DENGAN KOMA)
                </label>
                <input
                  type="text"
                  placeholder="Wristband, Akses Festival, Booth Kuliner"
                  value={perksText}
                  onChange={(e) => setPerksText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-zinc-700 text-white font-mono text-xs focus:border-yellow-400"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black border-3 border-black font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 brutal-btn cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-black" />
                  <span>{editingId ? 'SIMPAN PERUBAHAN TIKET' : 'TERBITKAN TIKET SEKARANG'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
