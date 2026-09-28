# REGGAE SENANG TIX 🌴🎟️
> **Digital Ticket Management & Gate Scanner System**  
> Neo-Brutalism Reggae Theme (Black, Red, Yellow, Green)

Aplikasi pemesanan tiket festival musik digital berbasis web dengan sistem approval password per tiket, barcode unik, notifikasi WhatsApp otomatis, dan scanner kamera gate masuk.

---

## 🚀 Fitur Utama

- **Halaman Pembeli Terpisah**:
  - Katalog tiket dinamis (hanya tampil jika tiket dibuat oleh admin).
  - Formulir pemesanan lengkap (Nama KTP, WhatsApp, Email, NIK/KTP, nama pemegang tiket).
  - Pembayaran manual via **DANA (088210516736)** dan **BCA (6760633851)** dengan 3-digit kode unik verifikasi.
  - Upload screenshot bukti transfer.
  - Konfirmasi WhatsApp instan ke Admin dengan link approval langsung.
- **Halaman Cek Tiket (`/?view=check`)**:
  - Pelacakan dan unduh ulang e-tiket yang hilang hanya dengan nomor WhatsApp atau nomor invoice.
- **Portal Admin Terproteksi (`/rsadmin`)**:
  - Dilindungi login password: `reggaesenang`.
  - **Manajemen Tiket**: Buat tiket baru, upload gambar poster, harga, kuota, dan **Password Persetujuan Transaksi Khusus Tiket**.
  - **Approval Transaksi**: Verifikasi screenshot struk dengan input sandi persetujuan tiket.
  - **Kirim Tiket WhatsApp**: Pengiriman e-tiket barcode & QR code langsung ke nomor WhatsApp pembeli.
- **Gate Scanner Masuk (`/rsadmin` -> Gate Scanner)**:
  - Scanner QR kamera browser langsung (menggunakan `jsqr`).
  - Audio beep feedback harmonis: Chime hijau (Valid), Double-buzz kuning (Sudah Digunakan), Buzzer merah (Tidak Valid).
  - Counter pengunjung *real-time* (Total Tiket, Check-in, Sisa Masuk).
  - Alternatif input manual dan upload gambar QR.

---

## 🛠️ Tech Stack & Database

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Canvas Confetti
- **QR & Barcode**: QRCode, jsQR (Real-time camera scanner), SVG 1D Barcode
- **Database**: **Neon PostgreSQL** (Serverless Cloud Postgres)
- **ORM**: **Prisma ORM** v5
- **Hosting & Deployment**: **Vercel**

---

## 📖 Panduan Deployment

Panduan langkah-demi-langkah dari pembuatan database di **Neon**, konfigurasi **Prisma**, hingga hosting di **Vercel** via **GitHub** tersedia lengkap di file:
👉 **[DEPLOYMENT_TUTORIAL.md](./DEPLOYMENT_TUTORIAL.md)**

### Quick Start Lokal:

```bash
# 1. Install dependensi
npm install --legacy-peer-deps

# 2. Salin environment variable
cp .env.example .env
# Edit .env dan masukkan DATABASE_URL dari console.neon.tech

# 3. Sinkronkan skema database ke Neon
npx prisma generate
npx prisma db push

# 4. Jalankan dev server
npm run dev
```

Buka browser di `http://localhost:3000`.
- Halaman Pembeli: `http://localhost:3000/`
- Halaman Admin: `http://localhost:3000/rsadmin` (Password: `reggaesenang`)
