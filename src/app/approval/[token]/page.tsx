import { notFound } from 'next/navigation';
import { requireAdmin } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';
import ActionForm from '@/src/app/components/ActionForm';
import { approvePaymentAction, sendApprovedTicketsWhatsAppAction } from '@/src/app/actions';

export const dynamic = 'force-dynamic';
export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  await requireAdmin();
  const { token } = await params;
  const order = await prisma.transaction.findUnique({ where: { verifyToken: token }, include: { customer: true, event: true, items: { include: { product: true } }, tickets: true } });
  if (!order) notFound();
  const quantity = order.items.reduce((total, item) => total + item.quantity, 0);
  return <div className="mx-auto max-w-2xl space-y-6"><p className="text-sm uppercase tracking-[.25em] text-[#d8ff45]">Admin · Verifikasi manual</p><h1 className="text-4xl font-black">Approval pembayaran</h1><div className="card space-y-4"><div className="grid gap-4 sm:grid-cols-2">{[['Invoice', order.invoice], ['Pelanggan', order.customer.name], ['WhatsApp', order.customer.whatsapp], ['Event', order.event.name], ['Tiket', `${quantity} · ${order.items.map((i) => i.product.name).join(', ')}`], ['Total', rupiah(order.total)], ['Status', order.status]].map(([label, value]) => <div key={label}><p className="muted text-sm">{label}</p><p className="font-semibold">{value}</p></div>)}</div>{order.status === 'WAITING_PAYMENT' ? <ActionForm action={approvePaymentAction} submitLabel="Setujui & terbitkan tiket"><input type="hidden" name="token" value={token}/><label className="grid gap-2 text-sm">Approval password untuk produk<input name="approvalPassword" type="password" autoComplete="off" required/></label><p className="muted text-xs">Pastikan mutasi bank telah dikonfirmasi sebelum menyetujui.</p></ActionForm> : order.status === 'PAID' && order.tickets.length > 0 ? <div className="space-y-3"><p className="text-[#39b765]">Pembayaran disetujui. {order.tickets.length} tiket digital sudah diterbitkan.</p><form action={sendApprovedTicketsWhatsAppAction}><input type="hidden" name="token" value={token}/><button className="w-full">Kirim link tiket & data ke WhatsApp pembeli</button></form></div> : <p className="text-red-300">Transaksi dibatalkan. Tiket tidak diterbitkan.</p>}</div></div>;
}
