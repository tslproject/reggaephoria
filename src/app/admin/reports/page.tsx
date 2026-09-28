import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';
import { requireAdmin } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';
export default async function ReportsPage() {
  await requireAdmin();
  const [events, status, used, tickets, daily] = await Promise.all([
    prisma.event.findMany({ include: { transactions: { where: { status: 'PAID' }, select: { total: true } } } }),
    prisma.transaction.groupBy({ by: ['status'], _count: { _all: true }, _sum: { total: true } }),
    prisma.ticket.count({ where: { status: 'USED' } }), prisma.ticket.count(),
    prisma.paymentLog.count({ where: { action: 'PAYMENT_APPROVED', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return <div className="space-y-7"><h1 className="text-3xl font-black">Laporan</h1><div className="grid gap-4 sm:grid-cols-3"><div className="card"><p className="muted">Check-in</p><p className="text-3xl font-black">{used} / {tickets}</p></div><div className="card"><p className="muted">Approval 24 jam</p><p className="text-3xl font-black">{daily}</p></div><div className="card"><p className="muted">Pendapatan</p><p className="text-3xl font-black">{rupiah(status.find((x) => x.status === 'PAID')?._sum.total ?? 0)}</p></div></div><section className="space-y-3"><h2 className="text-2xl font-bold">Per event</h2>{events.map((event) => <article key={event.id} className="card flex justify-between"><span>{event.name}</span><b>{rupiah(event.transactions.reduce((sum, t) => sum + t.total, 0))}</b></article>)}</section></div>;
}
