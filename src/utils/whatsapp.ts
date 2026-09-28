import { Order, AttendeeTicket } from '../types';
import { ADMIN_WHATSAPP_NUMBER } from '../services/storage';

export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * CUSTOMER NOTIFICATION TO ADMIN:
 * Sent when customer finishes payment transfer.
 * Contains invoice, name, event, ticket quantity, total, and direct transaction approval link.
 */
export function buildAdminWhatsAppMessage(
  order: Order,
  baseUrl?: string
): { text: string; url: string; verifyUrl: string } {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  // Link automatically points to admin approval view for this specific order
  const verifyUrl = `${origin}/rsadmin?view=admin&orderId=${order.id}`;

  const text = `Halo Admin REGGAEPHORIA TANGSEL

Saya sudah melakukan pembayaran tiket resmi.

Invoice:
${order.invoice || order.id}

Nama:
${order.buyer?.fullName || 'Customer'}

Event:
${order.eventTitle || 'Reggaephoria Tangsel 2026'}

Jumlah Tiket:
${order.quantity}x ${order.productName}

Total:
${formatRupiah(order.totalAmount || order.total || 0)}

Silahkan verifikasi transaksi & approval:
${verifyUrl}

Terima kasih.`;

  const cleanAdminPhone = cleanPhoneForWhatsApp(ADMIN_WHATSAPP_NUMBER);
  const url = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(text)}`;

  return { text, url, verifyUrl };
}

// Alias for PRD naming compatibility
export const buildCustomerPaymentConfirmationWAMessage = buildAdminWhatsAppMessage;

/**
 * ADMIN DISPATCH TICKET TO BUYER:
 * Sent by Admin after manual verification and password approval.
 * Contains attendee name, ticket category, and direct digital ticket link with unique QR barcode.
 */
export function buildBuyerWhatsAppMessage(
  order: Order,
  ticket?: AttendeeTicket,
  baseUrl?: string
): { text: string; url: string; ticketUrl: string } {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const ticketUrl = `${origin}/?view=ticket&orderId=${order.id}`;
  const customerName = ticket?.attendeeName || order.buyer?.fullName || 'Sahabat Reggae';

  const text = `Halo ${customerName}

Pembayaran Anda berhasil diverifikasi.

Berikut tiket digital resmi REGGAEPHORIA TANGSEL Anda:

Kategori: ${order.productName}
Jumlah: ${order.quantity} Tiket
${ticket ? `Kode Tiket: ${ticket.ticketCode}` : ''}

Link tiket:
${ticketUrl}

Silahkan tunjukkan barcode/QR Code pada link di atas saat tiba di gate masuk.
Terima kasih! Sampai jumpa di panggung Reggaephoria Tangsel 🌴`;

  const cleanCustomerPhone = cleanPhoneForWhatsApp(order.buyer?.whatsapp || '');
  const url = `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(text)}`;

  return { text, url, ticketUrl };
}

// Alias for PRD naming compatibility
export const buildAdminSendTicketWAMessage = (
  order: Order,
  tickets: AttendeeTicket[],
  baseUrl?: string
) => {
  return buildBuyerWhatsAppMessage(order, tickets[0], baseUrl);
};

