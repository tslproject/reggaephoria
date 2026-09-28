import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { appUrl } from '@/src/lib/format';

export async function GET(request: Request, { params }: { params: Promise<{ invoice: string }> }) {
  const { invoice } = await params;
  const order = await prisma.transaction.findUnique({ where: { invoice }, include: { customer: true, event: true, items: true } });
  if (!order || order.status !== 'WAITING_PAYMENT') return NextResponse.redirect(new URL(`/payment/${encodeURIComponent(invoice)}`, request.url));
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const message = `Halo Admin REGGAEPHORIA TANGSEL\n\nSaya sudah melakukan pembayaran.\n\nInvoice: ${order.invoice}\nNama: ${order.customer.name}\nEvent: ${order.event.name}\nJumlah Tiket: ${quantity}\nTotal: ${order.total}\n\nMohon cek pembayaran saya:\n${appUrl()}/approval/${order.verifyToken}\n\nTerima kasih.`;
  await prisma.whatsappLog.create({ data: { transactionId: order.id, phone: process.env.ADMIN_WHATSAPP || '6288210516736', message } });
  const whatsapp = (process.env.ADMIN_WHATSAPP || '6288210516736').replace(/\D/g, '');
  return NextResponse.redirect(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`);
}
