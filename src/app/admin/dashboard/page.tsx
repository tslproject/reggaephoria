import Link from 'next/link';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';
import { requireAdmin } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';
export default async function DashboardPage() {
  await requireAdmin();
  const [events, orders, paid, tickets, scans] = await Promise.all([
    prisma.event.count(), prisma.transaction.count(), prisma.transaction.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }), prisma.ticket.count(), prisma.ticket.count({ where: { status: 'USED' } }),
  ]);
  const cards = [['Event', events], ['Transaksi', orders], ['Pendapatan lunas', rupiah(paid._sum.total ?? 0)], ['Tiket terbit', tickets], ['Check-in', scans]];
  return <div className="space-y-8"><div><p className="text-sm uppercase tracking-[.25em] text-[#d8ff45]">REGGAEPHORIA TANGSEL</p><h1 className="mt-2 text-4xl font-black">Dashboard</h1></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([name, value]) => <div className="card" key={name}><p className="muted text-sm">{name}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div><div className="flex flex-wrap gap-3"><Link className="button" href="/admin/events">Kelola event</Link><Link className="button" href="/admin/orders">Periksa pesanan</Link><Link className="button" href="/gate">Buka scanner</Link></div></div>;
}
