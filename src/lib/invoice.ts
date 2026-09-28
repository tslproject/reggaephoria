import { randomInt } from 'node:crypto';
import { prisma } from './prisma';

export async function nextInvoice() {
  const prefix = `RGT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-`;
  const count = await prisma.transaction.count({ where: { invoice: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(5, '0')}${String(randomInt(0, 1000)).padStart(3, '0')}`;
}
