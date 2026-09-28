import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';
export default async function TicketPage({ params }: { params: Promise<{ ticketCode: string }> }) {
  const { ticketCode } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { ticketCode }, include: { transaction: { include: { customer: true, event: true, items: { include: { product: true } } } } } });
  if (!ticket || ticket.transaction.status !== 'PAID') notFound();
  const qr = await QRCode.toDataURL(ticket.ticketCode, { width: 280, margin: 2, color: { dark: '#101410', light: '#ffffff' } });
  return <article className="mx-auto max-w-lg space-y-6 text-center"><p className="text-sm uppercase tracking-[.3em] text-[#d8ff45]">REGGAEPHORIA TANGSEL</p><section className="card space-y-4"><h1 className="text-3xl font-black">Tiket Digital</h1><p className="text-xl">{ticket.transaction.event.name}</p><p className="muted">{ticket.transaction.event.eventDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })}</p><img src={qr} alt={`QR tiket ${ticket.ticketCode}`} className="mx-auto rounded-xl bg-white p-2"/><p className="font-mono text-lg font-bold">{ticket.ticketCode}</p><div className="grid grid-cols-2 gap-3 text-left"><div><p className="muted text-sm">Nama</p><p>{ticket.transaction.customer.name}</p></div><div><p className="muted text-sm">Tipe tiket</p><p>{ticket.transaction.items.map((item) => item.product.name).join(', ')}</p></div></div><p className={`rounded-full px-4 py-2 font-bold ${ticket.status === 'UNUSED' ? 'bg-[#d8ff45] text-black' : 'bg-red-900 text-red-100'}`}>{ticket.status === 'UNUSED' ? 'VALID' : 'SUDAH DIGUNAKAN'}</p><p className="muted text-sm">QR code ini hanya berlaku satu kali masuk.</p></section></article>;
}
