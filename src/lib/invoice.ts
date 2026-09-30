import { randomBytes } from 'node:crypto';

export async function nextInvoice() {
  const prefix = `RGT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-`;
  return `${prefix}${randomBytes(8).toString('hex').toUpperCase()}`;
}
