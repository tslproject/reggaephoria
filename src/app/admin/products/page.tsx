import { prisma } from '@/src/lib/prisma';
import { createProductAction, createPromoAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';
import { rupiah } from '@/src/lib/format';
import { requireAdmin } from '@/src/lib/auth';
import ProductEditor from './ProductEditor';

export const dynamic = 'force-dynamic';
export default async function ProductsPage() {
  await requireAdmin();
  const [events, products, promos] = await Promise.all([
    prisma.event.findMany({ orderBy: { eventDate: 'desc' } }),
    prisma.ticketProduct.findMany({ select: { id: true, name: true, description: true, price: true, quota: true, active: true, imageMimeType: true, event: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.promo.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);
  const productRows = products.map((product) => ({ ...product, hasImage: Boolean(product.imageMimeType) }));
  return <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Produk tiket</h1>
      <div className="card">{events.length ? <ActionForm action={createProductAction} submitLabel="Buat produk">
        <label className="grid gap-2 text-sm">Event<select name="eventId" required defaultValue=""><option value="" disabled>Pilih event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Nama tiket<input name="name" required/></label>
        <label className="grid gap-2 text-sm">Deskripsi tiket<textarea name="description" rows={3} required/></label>
        <label className="grid gap-2 text-sm">Gambar tiket (JPEG/PNG/WebP, maks. 1,5 MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></label>
        <label className="grid gap-2 text-sm">Harga (IDR)<input name="price" type="number" min="0" step="1000" required/></label>
        <label className="grid gap-2 text-sm">Kuota<input name="quota" type="number" min="1" required/></label>
        <label className="grid gap-2 text-sm">Password approval (min. 8 karakter)<input name="approvalPassword" type="password" minLength={8} required/></label>
      </ActionForm> : <p className="muted">Buat event terlebih dahulu.</p>}</div>
      <div className="card"><h2 className="mb-4 text-xl font-bold">Buat promo</h2><ActionForm action={createPromoAction} submitLabel="Simpan promo">
        <label className="grid gap-2 text-sm">Nama promo<input name="name" required/></label>
        <label className="grid gap-2 text-sm">Kode promo<input name="code" required/></label>
        <label className="grid gap-2 text-sm">Jenis diskon<select name="discountType"><option value="PERCENTAGE">Persentase</option><option value="FIXED">Nominal rupiah</option></select></label>
        <label className="grid gap-2 text-sm">Nilai<input name="discountValue" type="number" min="1" required/></label>
        <label className="grid gap-2 text-sm">Mulai<input name="startDate" type="datetime-local" required/></label>
        <label className="grid gap-2 text-sm">Berakhir<input name="endDate" type="datetime-local" required/></label>
      </ActionForm></div>
    </section>
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Produk</h2>
      {productRows.map((product) => <article key={product.id} className="card">
        <div className="flex justify-between gap-4"><div><h3 className="text-xl font-bold">{product.name}</h3><p className="muted">{product.event.name}</p></div><p className="font-bold text-[#d8ff45]">{rupiah(product.price)}</p></div>
        <p className="mt-3 text-sm">Kuota {product.quota} · status {product.active ? 'aktif' : 'nonaktif'}</p><ProductEditor product={product}/>
      </article>)}
      {!products.length && <p className="card muted">Belum ada produk.</p>}
      <h2 className="pt-4 text-2xl font-bold">Promo aktif</h2>
      {promos.map((promo) => <article key={promo.id} className="card flex justify-between"><span>{promo.name} · {promo.code}</span><span>{promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : rupiah(promo.discountValue)}</span></article>)}
    </section>
  </div>;
}
