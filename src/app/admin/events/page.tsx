import { prisma } from '@/src/lib/prisma';
import { createEventAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';
import { requireAdmin } from '@/src/lib/auth';
import EventEditor from './EventEditor';

export const dynamic = 'force-dynamic';
export default async function EventsPage() {
  await requireAdmin();
  const events = await prisma.event.findMany({ include: { _count: { select: { products: true, transactions: true } } }, orderBy: { createdAt: 'desc' } });
  return <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]"><section className="space-y-4"><h1 className="text-3xl font-black">Event</h1><div className="card"><ActionForm action={createEventAction} submitLabel="Buat event"><label className="grid gap-2 text-sm">Nama event<input name="name" required/></label><label className="grid gap-2 text-sm">Slug URL<input name="slug" placeholder="reggaephoria-tangsel" required/></label><label className="grid gap-2 text-sm">Deskripsi<textarea name="description" rows={4} required/></label><label className="grid gap-2 text-sm">Lokasi<input name="location" required/></label><label className="grid gap-2 text-sm">Tanggal & waktu (WIB)<input name="eventDate" type="datetime-local" required/></label><label className="grid gap-2 text-sm">URL banner (opsional, satu URL per baris)<textarea name="banners" rows={3} placeholder="https://contoh.com/banner-1.jpg&#10;https://contoh.com/banner-2.jpg"/></label></ActionForm></div></section><section className="space-y-4"><h2 className="text-2xl font-bold">Event terdaftar</h2>{events.map((event) => <article key={event.id} className="card"><h3 className="text-xl font-bold">{event.name}</h3><p className="muted">/{event.slug} · {event.location}</p><p className="mt-2 text-sm">{event._count.products} produk · {event._count.transactions} pesanan</p><EventEditor event={event}/></article>)}{!events.length && <p className="card muted">Belum ada event. Buat event pertama.</p>}</section></div>;
}
