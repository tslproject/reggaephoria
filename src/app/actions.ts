'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';
import { clearSession, getSession, requireAdmin, setSession } from '@/src/lib/auth';
import { appUrl, parseJakartaDateTimeLocal } from '@/src/lib/format';
import { nextInvoice } from '@/src/lib/invoice';
import { randomBytes } from 'node:crypto';

export type ActionState = { error?: string; success?: string };
const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const integer = (form: FormData, key: string) => Number.parseInt(text(form, key), 10);

function parseBannerUrls(value: FormDataEntryValue | null) {
  const urls = String(value ?? '').split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (urls.length > 10 || urls.some((url) => url.length > 2048)) return null;
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    } catch {
      return null;
    }
  }
  return [...new Set(urls)];
}

async function parseProductImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 1_500_000) throw new Error('Ukuran gambar maksimal 1,5 MB.');
  const data = Buffer.from(await value.arrayBuffer());
  const png = data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const webp = data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
  const mimeType = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : null;
  if (!mimeType || value.type !== mimeType) throw new Error('Format gambar harus JPEG, PNG, atau WebP yang valid.');
  return { imageData: data, imageMimeType: mimeType };
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const username = text(form, 'username');
  const password = text(form, 'password');
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return { error: 'Username atau password tidak valid.' };
  await setSession({ id: admin.id, role: admin.role });
  redirect(admin.role === 'ADMIN' ? '/admin/dashboard' : '/gate');
}

export async function logoutAction() {
  await clearSession();
  redirect('/admin/login');
}

export async function createEventAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const name = text(form, 'name');
  const slug = text(form, 'slug').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const eventDate = parseJakartaDateTimeLocal(text(form, 'eventDate'));
  const banners = parseBannerUrls(form.get('banners'));
  if (!name || !slug || !text(form, 'location') || !eventDate || !banners) return { error: 'Lengkapi data event dengan benar dan pastikan setiap banner memakai URL HTTP/HTTPS.' };
  try {
    await prisma.event.create({ data: { name, slug, description: text(form, 'description'), banners, location: text(form, 'location'), eventDate } });
  } catch { return { error: 'Slug sudah digunakan atau data event tidak valid.' }; }
  revalidatePath('/'); revalidatePath('/admin/events');
  return { success: 'Event berhasil dibuat.' };
}

export async function updateEventAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const id = text(form, 'id');
  const name = text(form, 'name');
  const location = text(form, 'location');
  const eventDate = parseJakartaDateTimeLocal(text(form, 'eventDate'));
  const banners = parseBannerUrls(form.get('banners'));
  if (!id || name.length < 2 || !location || !eventDate || !banners) return { error: 'Data event tidak valid. Pastikan setiap banner memakai URL HTTP/HTTPS.' };
  try {
    await prisma.event.update({ where: { id }, data: { name, description: text(form, 'description'), location, eventDate, banners } });
  } catch { return { error: 'Event tidak dapat diperbarui.' }; }
  revalidatePath('/'); revalidatePath('/admin/events');
  return { success: 'Event diperbarui.' };
}

export async function createProductAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const eventId = text(form, 'eventId');
  const name = text(form, 'name');
  const price = integer(form, 'price');
  const quota = integer(form, 'quota');
  const description = text(form, 'description');
  const approvalPassword = text(form, 'approvalPassword');
  if (!eventId || name.length < 2 || !description || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(quota) || quota < 1 || approvalPassword.length < 8) return { error: 'Lengkapi deskripsi, harga, kuota, dan password approval (minimal 8 karakter).' };
  try {
    const image = await parseProductImage(form.get('image'));
    await prisma.ticketProduct.create({ data: { eventId, name, description, price, quota, approvalPasswordHash: await bcrypt.hash(approvalPassword, 12), ...(image ?? {}) } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Produk gagal dibuat.' };
  }
  revalidatePath('/'); revalidatePath('/admin/products');
  return { success: 'Produk tiket berhasil dibuat.' };
}

export async function updateProductAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const id = text(form, 'id');
  const name = text(form, 'name');
  const price = integer(form, 'price');
  const quota = integer(form, 'quota');
  const description = text(form, 'description');
  const approvalPassword = text(form, 'approvalPassword');
  if (!id || name.length < 2 || !description || !Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(quota) || quota < 1 || (approvalPassword && approvalPassword.length < 8)) return { error: 'Lengkapi deskripsi, harga/kuota valid, dan password baru minimal 8 karakter.' };
  const product = await prisma.ticketProduct.findUnique({ where: { id } });
  if (!product) return { error: 'Produk tidak ditemukan.' };
  const reserved = await prisma.transactionItem.aggregate({ where: { productId: id, transaction: { status: { in: ['WAITING_PAYMENT', 'PAID'] } } }, _sum: { quantity: true } });
  if (quota < (reserved._sum.quantity ?? 0)) return { error: 'Kuota tidak dapat lebih kecil dari tiket terpesan.' };
  try {
    const image = await parseProductImage(form.get('image'));
    const removeImage = text(form, 'removeImage') === 'on';
    await prisma.ticketProduct.update({ where: { id }, data: { name, description, price, quota, active: text(form, 'active') === 'on', ...(approvalPassword ? { approvalPasswordHash: await bcrypt.hash(approvalPassword, 12) } : {}), ...(image ?? (removeImage ? { imageData: null, imageMimeType: null } : {})) } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Produk gagal diperbarui.' };
  }
  revalidatePath('/'); revalidatePath('/admin/products');
  return { success: 'Produk diperbarui.' };
}

export async function createPromoAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const name = text(form, 'name');
  const code = text(form, 'code').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const discountType = text(form, 'discountType');
  const discountValue = integer(form, 'discountValue');
  const startDate = parseJakartaDateTimeLocal(text(form, 'startDate'));
  const endDate = parseJakartaDateTimeLocal(text(form, 'endDate'));
  if (!name || name.length > 120 || !code || code.length > 32 || !['PERCENTAGE', 'FIXED'].includes(discountType) || !Number.isSafeInteger(discountValue) || discountValue < 1 || (discountType === 'PERCENTAGE' && discountValue > 100) || !startDate || !endDate || endDate <= startDate) return { error: 'Periksa kembali data promo.' };
  try {
    await prisma.promo.create({ data: { name, code, discountType: discountType as 'PERCENTAGE' | 'FIXED', discountValue, startDate, endDate } });
  } catch { return { error: 'Kode promo sudah digunakan.' }; }
  revalidatePath('/admin/products');
  return { success: 'Promo berhasil dibuat.' };
}

export async function createStaffAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Akses admin diperlukan.' };
  const username = text(form, 'username').toLowerCase();
  const password = text(form, 'password');
  const role = text(form, 'role');
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 12 || !['ADMIN', 'GATE_STAFF'].includes(role)) return { error: 'Username minimal 3 karakter, password minimal 12 karakter.' };
  try {
    await prisma.admin.create({ data: { username, passwordHash: await bcrypt.hash(password, 12), role: role as 'ADMIN' | 'GATE_STAFF' } });
  } catch { return { error: 'Username sudah digunakan.' }; }
  revalidatePath('/admin/staff');
  return { success: 'Akun staf berhasil dibuat.' };
}

export async function createOrderAction(_: ActionState, form: FormData): Promise<ActionState> {
  const productId = text(form, 'productId');
  const name = text(form, 'name');
  const rawWhatsapp = text(form, 'whatsapp').replace(/\D/g, '');
  const whatsapp = rawWhatsapp.startsWith('0') ? `62${rawWhatsapp.slice(1)}` : rawWhatsapp;
  const email = text(form, 'email');
  const quantity = integer(form, 'quantity');
  if (!productId || name.length < 2 || whatsapp.replace(/\D/g, '').length < 9 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: 'Periksa nama, WhatsApp, email, dan jumlah tiket (maksimal 10).' };
  const product = await prisma.ticketProduct.findUnique({ where: { id: productId }, include: { event: true } });
  if (!product || !product.active || product.event.eventDate < new Date()) return { error: 'Produk tiket tidak tersedia.' };
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const currentProduct = await tx.ticketProduct.findUnique({ where: { id: productId }, include: { event: true } });
      if (!currentProduct || !currentProduct.active || currentProduct.event.eventDate < new Date()) throw new Error('Produk tiket tidak tersedia.');
      const occupied = await tx.transactionItem.aggregate({ where: { productId, transaction: { status: { in: ['WAITING_PAYMENT', 'PAID'] } } }, _sum: { quantity: true } });
      if ((occupied._sum.quantity ?? 0) + quantity > currentProduct.quota) throw new Error('Kuota tiket tidak mencukupi.');
      const customer = await tx.customer.create({ data: { name, whatsapp, email: email || null } });
      const promoCode = text(form, 'promoCode').toUpperCase();
      const promo = promoCode ? await tx.promo.findFirst({ where: { code: promoCode, active: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } } }) : null;
      if (promoCode && !promo) throw new Error('Kode promo tidak valid atau sudah kedaluwarsa.');
      const subtotal = currentProduct.price * quantity;
      const discount = !promo ? 0 : promo.discountType === 'PERCENTAGE' ? Math.floor(subtotal * promo.discountValue / 100) : promo.discountValue;
      return tx.transaction.create({ data: {
        invoice: await nextInvoice(), customerId: customer.id, eventId: currentProduct.eventId, total: Math.max(0, subtotal - discount), promoId: promo?.id,
        items: { create: { productId, quantity, unitPrice: currentProduct.price } },
        paymentLogs: { create: { action: 'ORDER_CREATED' } },
        verifyToken: randomBytes(32).toString('hex'),
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return redirect(`/payment/${transaction.invoice}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    if (error instanceof Error && error.message.includes('Kuota')) return { error: error.message };
    if (error instanceof Error && error.message.includes('Produk tiket')) return { error: error.message };
    if (error instanceof Error && error.message.includes('Kode promo')) return { error: error.message };
    return { error: 'Pesanan belum dapat dibuat. Silakan coba kembali.' };
  }
}

export async function approvePaymentAction(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const token = text(form, 'token');
  const password = text(form, 'approvalPassword');
  const transaction = await prisma.transaction.findUnique({ where: { verifyToken: token }, include: { items: { include: { product: true } }, tickets: true } });
  if (!transaction) return { error: 'Transaksi tidak ditemukan.' };
  if (transaction.status === 'PAID') return { success: 'Pembayaran telah disetujui.' };
  if (transaction.status !== 'WAITING_PAYMENT' || !transaction.items.length) return { error: 'Transaksi tidak menunggu pembayaran.' };
  if (!(await bcrypt.compare(password, transaction.items[0].product.approvalPasswordHash))) return { error: 'Password approval produk salah.' };
  try {
    const issued = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({ where: { id: transaction.id, status: 'WAITING_PAYMENT' }, data: { status: 'PAID' } });
      if (!updated.count) return false;
      await tx.paymentLog.create({ data: { transactionId: transaction.id, action: 'PAYMENT_APPROVED' } });
      for (const item of transaction.items) {
        for (let index = 0; index < item.quantity; index++) {
          const ticketCode = `RGT-TICKET-${randomBytes(16).toString('hex').toUpperCase()}`;
          await tx.ticket.create({ data: { transactionId: transaction.id, ticketCode, qrData: ticketCode } });
        }
      }
      return true;
    });
    if (!issued) return { error: 'Transaksi sudah berubah status. Muat ulang halaman.' };
  } catch { return { error: 'Persetujuan gagal disimpan. Coba ulangi.' }; }
  revalidatePath('/admin/orders'); revalidatePath(`/approval/${token}`);
  return { success: 'Pembayaran disetujui dan tiket digital telah diterbitkan.' };
}

export async function scanTicketAction(_: ActionState, form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session || !['ADMIN', 'GATE_STAFF'].includes(session.role)) return { error: 'Silakan login sebagai petugas gate.' };
  const code = text(form, 'ticketCode').trim();
  const ticket = await prisma.ticket.findUnique({ where: { ticketCode: code } });
  if (!ticket) return { error: 'INVALID' };
  if (ticket.status === 'USED') {
    await prisma.scanLog.create({ data: { ticketId: ticket.id, staffId: session.id, result: 'ALREADY_USED' } });
    return { error: 'ALREADY_USED' };
  }
  const claimed = await prisma.ticket.updateMany({ where: { id: ticket.id, status: 'UNUSED' }, data: { status: 'USED' } });
  const result = claimed.count ? 'VALID' : 'ALREADY_USED';
  await prisma.scanLog.create({ data: { ticketId: ticket.id, staffId: session.id, result } });
  return claimed.count ? { success: result } : { error: result };
}

export async function sendTicketWhatsAppAction(form: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  const transactionId = text(form, 'transactionId');
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId }, include: { customer: true, tickets: true } });
  if (!transaction || transaction.status !== 'PAID') return;
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = appUrl(host ? `${protocol}://${host}` : undefined);
  const message = `Halo ${transaction.customer.name}, pembayaran Anda berhasil.\n\nTiket digital Anda:\n${transaction.tickets.map((ticket) => `${baseUrl}/ticket/${ticket.ticketCode}`).join('\n')}\n\nTunjukkan QR saat masuk event.`;
  await prisma.whatsappLog.create({ data: { transactionId, phone: transaction.customer.whatsapp, message } });
  const url = `https://wa.me/${transaction.customer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  redirect(url);
}

export async function sendApprovedTicketsWhatsAppAction(form: FormData) {
  await requireAdmin();
  const token = text(form, 'token');
  if (!token || token.length > 128) redirect('/admin/login');
  const transaction = await prisma.transaction.findUnique({
    where: { verifyToken: token },
    include: { customer: true, event: true, items: { include: { product: true } }, tickets: { orderBy: { serial: 'asc' } } },
  });
  if (!transaction || transaction.status !== 'PAID' || transaction.tickets.length === 0) redirect('/admin/login');

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = appUrl(host ? `${protocol}://${host}` : undefined);
  const ticketLinks = transaction.tickets.map((ticket, index) => `${index + 1}. ${ticket.ticketCode}\n${baseUrl}/ticket/${ticket.ticketCode}`).join('\n');
  const productSummary = transaction.items.map((item) => `${item.product.name} × ${item.quantity}`).join(', ');
  const message = `Halo ${transaction.customer.name}, pembayaran Anda berhasil.\n\nInvoice: ${transaction.invoice}\nEvent: ${transaction.event.name}\nTiket: ${productSummary}\n\nTiket digital Anda:\n${ticketLinks}\n\nTunjukkan QR tiket saat masuk event. Terima kasih telah bergabung dengan REGGAEPHORIA TANGSEL!`;

  await prisma.whatsappLog.create({ data: { transactionId: transaction.id, phone: transaction.customer.whatsapp, message } });
  revalidatePath('/admin/orders');
  redirect(`https://wa.me/${transaction.customer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`);
}

export async function cancelOrderAction(form: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  const id = text(form, 'transactionId');
  await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.updateMany({ where: { id, status: 'WAITING_PAYMENT' }, data: { status: 'CANCELLED' } });
    if (updated.count) await tx.paymentLog.create({ data: { transactionId: id, action: 'ORDER_CANCELLED' } });
  });
  revalidatePath('/admin/orders');
}
