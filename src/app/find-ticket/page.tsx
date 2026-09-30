import { prisma } from '@/src/lib/prisma';
import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export default async function FindTicketPage({ searchParams }: { searchParams: Promise<{ whatsapp?: string }> }) {
  const { whatsapp } = await searchParams;
  const enteredDigits = (whatsapp ?? '').replace(/\D/g, '');
  const digits = enteredDigits.startsWith('0') ? `62${enteredDigits.slice(1)}` : enteredDigits;
  const tickets = digits.length >= 9 && digits.length <= 15 ? await prisma.ticket.findMany({ where: { transaction: { status: 'PAID', customer: { whatsapp: digits } } }, include: { transaction: { include: { event: true, customer: true } } }, orderBy: { createdAt: 'desc' } }) : [];
  return <div className="mx-auto max-w-2xl space-y-6"><h1 className="text-4xl font-black">Cari tiket saya</h1><p className="muted">Masukkan nomor WhatsApp pemesan yang digunakan saat checkout.</p><form className="card flex gap-3"><input name="whatsapp" type="tel" placeholder="08… atau 628…" defaultValue={whatsapp} required/><button>Cari</button></form>{whatsapp && (tickets.length ? <div className="space-y-3">{tickets.map((ticket) => <article className="card flex items-center justify-between gap-4" key={ticket.id}><div><p className="font-bold">{ticket.transaction.event.name}</p><p className="muted text-sm">{ticket.ticketCode} · {ticket.status}</p></div><Link className="button" href={`/ticket/${ticket.ticketCode}`}>Buka tiket</Link></article>)}</div> : <p className="card">Tidak ditemukan tiket lunas untuk nomor tersebut.</p>)}</div>;
}
