import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';
export default async function TicketsPage() {
  await requireAdmin();
  const tickets = await prisma.ticket.findMany({ include: { transaction: { include: { customer: true, event: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return <div className="space-y-5"><h1 className="text-3xl font-black">Tiket terbit</h1><div className="overflow-x-auto rounded-xl border border-[#29332b]"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#172019]"><tr>{['Kode', 'Pemilik', 'Event', 'Status', 'Tautan'].map((x) => <th key={x} className="p-4">{x}</th>)}</tr></thead><tbody>{tickets.map((t) => <tr key={t.id} className="border-t border-[#29332b]"><td className="p-4 font-mono">{t.ticketCode}</td><td className="p-4">{t.transaction.customer.name}</td><td className="p-4">{t.transaction.event.name}</td><td className="p-4">{t.status}</td><td className="p-4"><a className="text-[#d8ff45]" href={`/ticket/${t.ticketCode}`}>Buka</a></td></tr>)}</tbody></table></div></div>;
}
