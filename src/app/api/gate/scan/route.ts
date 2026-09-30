import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getSession } from '@/src/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ result: 'UNAUTHORIZED' }, { status: 401 });
  if (!['ADMIN', 'GATE_STAFF'].includes(session.role)) return NextResponse.json({ result: 'UNAUTHORIZED' }, { status: 403 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ result: 'INVALID_REQUEST' }, { status: 403 });
  let data: { ticketCode?: string; checkIn?: boolean };
  try { data = await request.json(); } catch { return NextResponse.json({ result: 'INVALID_REQUEST' }, { status: 400 }); }
  const code = String(data.ticketCode ?? '').trim();
  if (!/^RGT-TICKET-(?:\d{6,}|[A-F0-9]{32})$/.test(code)) return NextResponse.json({ result: 'INVALID' });
  const ticket = await prisma.ticket.findUnique({ where: { ticketCode: code }, include: { transaction: { include: { customer: true, event: true, items: { include: { product: true } } } } } });
  if (!ticket || ticket.transaction.status !== 'PAID') return NextResponse.json({ result: 'INVALID' });
  if (ticket.status === 'USED') {
    await prisma.scanLog.create({ data: { ticketId: ticket.id, staffId: session.id, result: 'ALREADY_USED' } });
    return NextResponse.json({ result: 'ALREADY_USED' });
  }
  if (!data.checkIn) {
    await prisma.scanLog.create({ data: { ticketId: ticket.id, staffId: session.id, result: 'VALID' } });
    return NextResponse.json({ result: 'VALID', ticket: { ticketCode: ticket.ticketCode, name: ticket.transaction.customer.name, event: ticket.transaction.event.name, product: ticket.transaction.items[0]?.product.name ?? '-' } });
  }
  // Atomic compare-and-set makes concurrent/repeated check-ins one-time only.
  const updated = await prisma.ticket.updateMany({ where: { id: ticket.id, status: 'UNUSED' }, data: { status: 'USED' } });
  const result = updated.count ? 'VALID' : 'ALREADY_USED';
  await prisma.scanLog.create({ data: { ticketId: ticket.id, staffId: session.id, result } });
  return NextResponse.json({ result, ticket: updated.count ? { ticketCode: ticket.ticketCode, name: ticket.transaction.customer.name } : undefined });
}
