import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await prisma.ticketProduct.findUnique({ where: { id: productId }, select: { id: true, name: true, description: true, price: true, quota: true, active: true, imageMimeType: true, event: true } });
  if (!product || !product.active || product.event.eventDate < new Date()) notFound();
  const soldAndReserved = await prisma.transactionItem.aggregate({ where: { productId, transaction: { status: { in: ['WAITING_PAYMENT', 'PAID'] } } }, _sum: { quantity: true } });
  const remaining = Math.max(0, product.quota - (soldAndReserved._sum.quantity ?? 0));
  return <article className="mx-auto max-w-3xl space-y-7">
    {product.imageMimeType && <img src={`/api/products/${product.id}/image`} alt={product.name} className="max-h-[28rem] w-full rounded-lg border-2 border-black object-cover shadow-[6px_6px_0_#ee3b32]"/>}
    <header className="card space-y-4">
      <p className="text-sm font-black uppercase tracking-[.2em] text-[#d8ff45]">Detail tiket · {product.event.name}</p>
      <h1 className="text-4xl font-black">{product.name}</h1>
      <p className="whitespace-pre-wrap text-[#d0d0c4]">{product.description || 'Tidak ada deskripsi tambahan.'}</p>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-[#393d34] pt-4">
        <div><p className="text-sm text-[#c0c1b5]">Harga tiket</p><p className="text-3xl font-black text-[#ffd447]">{rupiah(product.price)}</p></div>
        <p className={`font-bold ${remaining ? 'text-[#39b765]' : 'text-[#ee3b32]'}`}>{remaining ? `${remaining} tiket tersedia` : 'Tiket habis'}</p>
      </div>
      <p className="text-sm text-[#c0c1b5]">{product.event.eventDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })}<br/>{product.event.location}</p>
      {remaining > 0 ? <Link className="button w-full sm:w-fit" href={`/event/${product.event.slug}?productId=${product.id}#order`}>Pilih tiket ini</Link> : <button disabled>Tiket habis</button>}
    </header>
    <Link className="font-bold text-[#ffd447] underline underline-offset-4" href={`/event/${product.event.slug}`}>← Kembali ke event</Link>
  </article>;
}
