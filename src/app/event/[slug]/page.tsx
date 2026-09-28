import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';
import ActionForm from '@/src/app/components/ActionForm';
import { createOrderAction } from '@/src/app/actions';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ productId?: string }> }) {
  const [{ slug }, { productId }] = await Promise.all([params, searchParams]);
  const event = await prisma.event.findUnique({ where: { slug }, include: { products: { where: { active: true }, select: { id: true, name: true, description: true, price: true, quota: true, imageMimeType: true }, orderBy: { price: 'asc' } } } });
  if (!event) notFound();
  const available = await Promise.all(event.products.map(async (product) => {
    const sum = await prisma.transactionItem.aggregate({ where: { productId: product.id, transaction: { status: { in: ['WAITING_PAYMENT', 'PAID'] } } }, _sum: { quantity: true } });
    return { ...product, remaining: Math.max(0, product.quota - (sum._sum.quantity ?? 0)) };
  }));
  return <div className="mx-auto max-w-4xl space-y-8">
    {event.banner && <img src={event.banner} alt={event.name} className="max-h-96 w-full rounded-lg border-2 border-black object-cover shadow-[6px_6px_0_#39b765]"/>}
    <header className="space-y-3"><p className="text-sm font-black uppercase tracking-[.2em] text-[#d8ff45]">REGGAEPHORIA TANGSEL</p><h1 className="text-4xl font-black">{event.name}</h1><p className="text-[#c0c1b5]">{event.eventDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} · {event.location}</p><p className="whitespace-pre-wrap text-[#d0d0c4]">{event.description}</p></header>
    <section className="space-y-4"><h2 className="text-2xl font-black">Pilih kategori tiket</h2>{available.length ? <div className="grid gap-4 sm:grid-cols-2">{available.map((product) => <article key={product.id} className="card space-y-3">
      {product.imageMimeType && <img src={`/api/products/${product.id}/image`} alt={product.name} className="h-40 w-full rounded-md border-2 border-black object-cover"/>}
      <h3 className="text-xl font-black">{product.name}</h3><p className="text-sm text-[#c0c1b5]">{product.description || 'Tidak ada deskripsi tambahan.'}</p>
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-lg text-[#ffd447]">{rupiah(product.price)}</strong><span className="text-sm text-[#39b765]">{product.remaining} tersedia</span></div>
      <Link className="button w-full" href={`/product/${product.id}`}>Detail tiket</Link>
    </article>)}</div> : <p className="card muted">Belum ada tiket aktif untuk event ini.</p>}</section>
    <section id="order" className="card scroll-mt-6 space-y-5"><h2 className="text-2xl font-black">Pesan tiket</h2>{available.length ? <ActionForm action={createOrderAction} submitLabel="Lanjut ke pembayaran">
      <label className="grid gap-2 text-sm">Pilih tiket<select name="productId" required defaultValue={available.some((p) => p.id === productId) ? productId : ''}><option value="" disabled>Pilih kategori</option>{available.map((p) => <option key={p.id} value={p.id} disabled={p.remaining === 0}>{p.name} — {rupiah(p.price)}{p.remaining === 0 ? ' (Habis)' : ` · tersedia ${p.remaining}`}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Jumlah tiket<input name="quantity" type="number" min="1" max="10" defaultValue="1" required/></label>
      <label className="grid gap-2 text-sm">Nama lengkap<input name="name" autoComplete="name" required minLength={2}/></label>
      <label className="grid gap-2 text-sm">Nomor WhatsApp<input name="whatsapp" type="tel" autoComplete="tel" placeholder="08… atau 628…" required/></label>
      <label className="grid gap-2 text-sm">Email (opsional)<input name="email" type="email" autoComplete="email"/></label>
      <label className="grid gap-2 text-sm">Kode promo (opsional)<input name="promoCode" autoComplete="off"/></label>
    </ActionForm> : <p className="muted">Belum ada tiket aktif untuk event ini.</p>}</section>
  </div>;
}
