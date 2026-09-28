# PANDUAN LENGKAP DEPLOYMENT REGGAE SENANG TIX
### Database Neon PostgreSQL + Hosting di Vercel via GitHub

Panduan ini memandu Anda langkah demi langkah untuk menghubungkan aplikasi **Reggae Senang Tix** ke database **Neon PostgreSQL**, sinkronisasi skema dengan **Prisma ORM**, dan mendeploy ke **Vercel** melalui Git.

---

## 📋 DAFTAR ISI
1. [Struktur File yang Telah Disiapkan](#1-struktur-file-yang-telah-disiapkan)
2. [Langkah 1: Membuat Database di Neon (Gratis)](#langkah-1-membuat-database-di-neon)
3. [Langkah 2: Menyiapkan Konfigurasi Lokal (.env)](#langkah-2-menyiapkan-konfigurasi-lokal)
4. [Langkah 3: Sinkronisasi Skema Database (Prisma DB Push)](#langkah-3-sinkronisasi-skema-database)
5. [Langkah 4: Push Kode ke GitHub](#langkah-4-push-kode-ke-github)
6. [Langkah 5: Deploy ke Vercel via GitHub](#langkah-5-deploy-ke-vercel)
7. [Langkah 6: Verifikasi & Testing di Production](#langkah-6-verifikasi--testing)

---

## 1. STRUKTUR FILE YANG TELAH DISIAPKAN

Aplikasi Anda telah dilengkapi dengan:
- **`prisma/schema.prisma`**: Skema database PostgreSQL untuk 5 tabel utama:
  - `ticket_products` (Kategori tiket, harga, kuota, password persetujuan khusus tiket)
  - `orders` (Invoice, customer data, bukti bayar DANA/BCA, approval status)
  - `attendee_tickets` (E-tiket digital, kode `RST-TICKET-xxxx`, status `UNUSED`/`USED`)
  - `gate_scan_records` (Audit log scan gate masuk QR/Barcode)
  - `delivery_logs` (Riwayat pengiriman e-tiket ke WhatsApp)
- **`src/lib/prisma.ts`**: Client singleton Prisma untuk serverless functions
- **`vercel.json`**: Konfigurasi routing SPA dan API untuk Vercel
- **`.env.example`**: Template environment variable untuk Neon & Vercel
- **`package.json`**: Build script yang otomatis menjalankan `prisma generate && vite build`

---

## LANGKAH 1: MEMBUAT DATABASE DI NEON

1. Buka browser dan kunjungi **[https://neon.tech](https://neon.tech)**.
2. Klik **Sign Up** (bisa login dengan akun GitHub atau Google).
3. Setelah masuk ke Console, klik tombol **Create Project**:
   - **Name**: `reggae-senang-tix` (atau nama lain)
   - **Postgres version**: `16` (Default terbaru)
   - **Cloud Region**: Pilih **AWS / Singapore (`ap-southeast-1`)** untuk latensi tercepat dari Indonesia.
4. Klik **Create Project**.
5. Pada panel **Connection Details**, pilih dropdown:
   - Pilih tab **Prisma** atau **Pooled connection**.
   - Salin **Connection String**. Contoh:
     ```bash
     postgresql://neondb_owner:npg_AbCdEf123456@ep-sweet-mountain-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Catat juga **Direct connection string** (tanpa `-pooler`) untuk migrasi skema.

---

## LANGKAH 2: MENYIAPKAN KONFIGURASI LOKAL

1. Ekstrak file source code yang Anda download ke komputer Anda.
2. Buka folder proyek di VS Code atau terminal favorit Anda.
3. Duplikat file `.env.example` dan ubah namanya menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. Buka file `.env` dan masukkan connection string dari Neon:
   ```env
   # Connection pooling dari Neon (port 5432/6543 dengan -pooler)
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sweet-mountain-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

   # Direct connection dari Neon (tanpa -pooler)
   DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sweet-mountain-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

   # Admin & WA Settings
   ADMIN_SECRET_KEY="reggaesenang"
   ADMIN_WHATSAPP_NUMBER="088210516736"
   ```

5. Install dependensi proyek:
   ```bash
   npm install --legacy-peer-deps
   ```

---

## LANGKAH 3: SINKRONISASI SKEMA DATABASE

Jalankan perintah ini di terminal komputer Anda untuk membuat tabel otomatis di database Neon:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push skema ke database Neon PostgreSQL
npx prisma db push
```

Output sukses:
```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema. Done in 1.4s
```

*(Opsional)* Anda dapat membuka antarmuka visual GUI tabel database dengan perintah:
```bash
npx prisma studio
```
Buka browser di `http://localhost:5555` untuk melihat tabel `ticket_products`, `orders`, dan `attendee_tickets`.

---

## LANGKAH 4: PUSH KODE KE GITHUB

1. Buka **[https://github.com](https://github.com)** dan buat Repository baru (misal: `reggae-senang-tix`).
   - Jadikan repository **Private** atau **Public**.
   - Jangan centang "Add a README" jika sudah ada file lokal.
2. Di terminal folder proyek Anda, inisialisasi Git dan push:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit Reggae Senang Tix with Neon and Prisma"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/reggae-senang-tix.git
   git push -u origin main
   ```

---

## LANGKAH 5: DEPLOY KE VERCEL

1. Kunjungi **[https://vercel.com](https://vercel.com)** dan login dengan akun GitHub Anda.
2. Pada Dashboard Vercel, klik tombol **Add New...** -> **Project**.
3. Cari repository **`reggae-senang-tix`** yang baru saja Anda push, lalu klik **Import**.
4. Di halaman konfigurasi proyek:
   - **Framework Preset**: Pilih `Vite`.
   - **Root Directory**: `./` (Default).
   - **Build Command**: `npm run build` (Otomatis menjalankan `prisma generate && vite build`).
   - **Install Command**: `npm install --legacy-peer-deps`.
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut:
   | Key | Value (Contoh) |
   |---|---|
   | `DATABASE_URL` | `postgresql://neondb_owner:***-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
   | `DIRECT_URL` | `postgresql://neondb_owner:***.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
   | `ADMIN_SECRET_KEY` | `reggaesenang` |
   | `ADMIN_WHATSAPP_NUMBER` | `088210516736` |

6. Klik tombol **Deploy**!
7. Tunggu sekitar 1–2 menit sampai muncul status **Congratulations! Your project has been deployed**.

---

## LANGKAH 6: VERIFIKASI & TESTING

Setelah Vercel selesai melakukan build, Anda akan mendapatkan URL domain aktif (misal: `https://reggae-senang-tix.vercel.app`).

1. **Akses Halaman Pembeli**:
   - URL: `https://reggae-senang-tix.vercel.app/`
   - Tanpa menu admin sama sekali. Jika belum ada tiket yang dibuat, status adalah *"Tiket Belum Tersedia"*.
2. **Akses Halaman Cek Tiket**:
   - URL: `https://reggae-senang-tix.vercel.app/?view=check`
   - Pembeli dapat melacak e-tiket berdasarkan nomor WhatsApp atau Invoice.
3. **Akses Portal Admin**:
   - URL: `https://reggae-senang-tix.vercel.app/rsadmin`
   - Masukkan Password Admin: **`reggaesenang`**
   - Masuk ke tab **Atur Tiket** -> Buat produk tiket pertama (unggah foto/poster, atur harga, kuota, dan **Password Persetujuan Khusus Tiket**).
4. **Uji Transaksi Pembelian**:
   - Buka halaman depan pembeli, pilih tiket, isi data diri, lalu klik *Lakukan Pembayaran*.
   - Transfer ke DANA / BCA sesuai nominal persis + 3 digit kode unik.
   - Unggah screenshot bukti transfer -> Kirim pesan konfirmasi ke WhatsApp Admin.
5. **Approval Admin & WhatsApp Tiket**:
   - Buka `/rsadmin` -> tab **Approval**.
   - Periksa bukti screenshot transfer.
   - Masukkan password persetujuan khusus tiket tersebut.
   - Klik tombol **Kirim Tiket ke WhatsApp Pembeli** (berisi link e-tiket barcode resmi).
6. **Scan di Gate Masuk**:
   - Buka `/rsadmin` -> tab **Gate Scanner**.
   - Arahkan kamera ke QR Code e-tiket pengunjung untuk validasi instant!
