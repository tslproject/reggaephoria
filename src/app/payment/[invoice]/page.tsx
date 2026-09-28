import { notFound } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';

export const dynamic = 'force-dynamic';
export default async function PaymentPage({ params }: { params: Promise<{ invoice: string }> }) {
  const { invoice } = await params;
  const order = await prisma.transaction.findUnique({ where: { invoice }, include: { customer: true, event: true, items: { include: { product: true } } } });
  if (!order) notFound();
  const productNames = order.items.map((item) => `${item.product.name} × ${item.quantity}`).join(', ');
  return <div className="mx-auto max-w-2xl space-y-6"><p className="text-sm uppercase tracking-[.25em] text-[#d8ff45]">Satu langkah lagi</p><h1 className="text-4xl font-black">Pembayaran</h1><div className="card space-y-5"><div><p className="muted text-sm">INVOICE</p><p className="text-xl font-bold">{order.invoice}</p></div><div className="grid gap-4 sm:grid-cols-2"><div><p className="muted text-sm">Event</p><p>{order.event.name}</p></div><div><p className="muted text-sm">Pemesan</p><p>{order.customer.name}</p></div><div><p className="muted text-sm">Tiket</p><p>{productNames}</p></div><div><p className="muted text-sm">Status</p><p>{order.status === 'PAID' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}</p></div></div><hr className="border-[#29332b]"/><p className="muted">Transfer manual sesuai total berikut:</p><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#1b241d] p-4"><b>DANA</b><p>088210516736</p></div><div className="rounded-xl bg-[#1b241d] p-4"><b>BCA</b><p>6760633851</p></div></div><div className="flex items-center justify-between text-xl"><b>Total</b><b className="text-[#d8ff45]">{rupiah(order.total)}</b></div>{order.status === 'WAITING_PAYMENT' ? <a className="button w-full" href={`/api/whatsapp/payment/${encodeURIComponent(order.invoice)}`}>SAYA SUDAH BAYAR - KONFIRMASI WHATSAPP</a> : <p className="text-[#d8ff45]">Pembayaran telah disetujui. Tiket digital sudah terbit.</p>}</div></div>;
}
