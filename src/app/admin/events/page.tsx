import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';
import EventEditor from './EventEditor';
import EventCreateModal from './EventCreateModal';

export const dynamic = 'force-dynamic';
export default async function EventsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({ include: { _count: { select: { products: true, transactions: true } } }, orderBy: { createdAt: 'desc' } });
  return <div className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-black">Event</h1><EventCreateModal/></div><section className="space-y-4"><h2 className="text-2xl font-bold">Event terdaftar</h2>{events.map((event) => <article key={event.id} className="card"><h3 className="text-xl font-bold">{event.name}</h3><p className="muted">/{event.slug} · {event.location}</p><p className="mt-2 text-sm">{event._count.products} produk · {event._count.transactions} pesanan</p><EventEditor event={event}/></article>)}{!events.length && <p className="card muted">Belum ada event. Buat event pertama.</p>}</section></div>;
}
