import Link from 'next/link';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';
import { cancelOrderAction, sendTicketWhatsAppAction } from '@/src/app/actions';
import { requireAdmin } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';
export default async function OrdersPage() {
  await requireAdmin();
  const orders = await prisma.transaction.findMany({ include: { customer: true, event: true, items: { include: { product: true } }, _count: { select: { tickets: true } } }, orderBy: { createdAt: 'desc' } });
  return <div className="space-y-5"><h1 className="text-3xl font-black">Transaksi</h1>{orders.map((order) => <article key={order.id} className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-sm text-[#d8ff45]">{order.invoice}</p><h2 className="mt-1 text-xl font-bold">{order.customer.name} · {order.event.name}</h2><p className="muted mt-1">{order.customer.whatsapp} · {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}</p></div><div className="text-right"><p className="font-bold">{rupiah(order.total)}</p><p className="muted text-sm">{order.status}</p></div></div><div className="mt-4 flex flex-wrap gap-3">{order.status === 'WAITING_PAYMENT' && <><Link className="button" href={`/approval/${order.verifyToken}`}>Buka approval</Link><form action={cancelOrderAction}><input type="hidden" name="transactionId" value={order.id}/><button className="bg-red-900 text-white">Batalkan</button></form></>}{order.status === 'PAID' && <form action={sendTicketWhatsAppAction}><input type="hidden" name="transactionId" value={order.id}/><button>Kirim tiket via WhatsApp</button></form>}<Link className="button bg-[#28342b] text-white" href={`/payment/${order.invoice}`}>Detail</Link><span className="self-center text-sm text-[#a1aaa2]">{order._count.tickets} tiket diterbitkan</span></div></article>)}{!orders.length && <p className="card muted">Belum ada transaksi.</p>}</div>;
}
