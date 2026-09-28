import Link from 'next/link';
import { prisma } from '@/src/lib/prisma';
import { rupiah } from '@/src/lib/format';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await prisma.event.findMany({ where: { eventDate: { gte: new Date() } }, include: { products: { where: { active: true }, select: { id: true, name: true, price: true }, orderBy: { price: 'asc' } } }, orderBy: { eventDate: 'asc' } });
  return <div className="space-y-12">
    <section className="relative grid gap-8 overflow-hidden rounded-xl border-2 border-black bg-[radial-gradient(ellipse_at_top_right,_#315a36,_#171a16_62%)] px-5 py-10 shadow-[7px_7px_0_#ee3b32] sm:px-8 sm:py-14 md:grid-cols-[1.2fr_.8fr] md:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#ee3b32_0_33.33%,#ffd447_33.33%_66.66%,#39b765_66.66%)]"/>
      <div className="relative space-y-6"><p className="text-xs font-black uppercase tracking-[.22em] text-[#d8ff45] sm:text-sm sm:tracking-[.3em]">One rhythm. One island.</p><h1 className="hero-title font-black">REGGAEPHORIA<br/><span className="text-[#d8ff45]">TANGSEL</span></h1><p className="max-w-xl text-base text-[#bac3ba] sm:text-lg">Amankan tiket digital resmi. Pembayaran diverifikasi admin dan tiket dikirim langsung melalui WhatsApp.</p><Link className="button w-full sm:w-fit" href="#events">Jelajahi event</Link></div>
      <div className="flex min-h-44 items-center justify-center rounded-lg border-2 border-black bg-[#0b0d0c]/55 p-6 text-center shadow-[5px_5px_0_#ffd447] sm:min-h-56 sm:p-8"><div><div className="text-6xl">♫</div><p className="mt-3 text-xs font-bold uppercase tracking-[.16em] text-[#c5d0c5] sm:text-sm sm:tracking-[.2em]">Good music · Good people</p></div></div>
    </section>
    <section id="events" className="space-y-6"><div><p className="text-sm font-black uppercase tracking-[.25em] text-[#d8ff45]">Jadwal mendatang</p><h2 className="mt-2 text-3xl font-black">Pilih event Anda</h2></div>
      {events.length ? <div className="grid gap-6 md:grid-cols-2">{events.map((event) => <article key={event.id} className="card overflow-hidden p-0">
        {event.banner && <img src={event.banner} alt={event.name} className="h-44 w-full object-cover sm:h-52"/>}
        <div className="space-y-4 p-5 sm:p-6"><div><h3 className="text-2xl font-black">{event.name}</h3><p className="mt-2 text-sm text-[#a1aaa2]">{event.eventDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' })} · {event.location}</p></div><p className="line-clamp-3 text-[#bac3ba]">{event.description}</p>
          {event.products.length > 0 && <div className="space-y-2 border-t border-[#414439] pt-3"><p className="text-xs font-black uppercase tracking-[.16em] text-[#ffd447]">Pilihan tiket · klik untuk detail</p>{event.products.map((product) => <Link key={product.id} href={`/product/${product.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-[#42463d] bg-[#10120f] p-3 transition hover:border-[#ffd447] hover:shadow-[3px_3px_0_#39b765]"><span className="min-w-0 truncate font-bold">{product.name}</span><span className="shrink-0 text-sm font-black text-[#ffd447]">{rupiah(product.price)} <span aria-hidden="true">→</span></span></Link>)}</div>}
          <Link className="button w-full" href={`/event/${event.slug}`}>Lihat event & pesan tiket</Link>
        </div>
      </article>)}</div> : <div className="card muted">Belum ada event tersedia. Silakan cek kembali nanti.</div>}
    </section>
  </div>;
}
