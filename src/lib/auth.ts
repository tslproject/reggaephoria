import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'rgt_session';
const secret = () => process.env.SESSION_SECRET;

type Session = { id: string; role: 'ADMIN' | 'GATE_STAFF'; exp: number };
function sign(payload: string) {
  const key = secret();
  if (!key || key.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export async function setSession(session: Omit<Session, 'exp'>) {
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
    return session.exp > Date.now() ? session : null;
  } catch { return null; }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/admin/login');
  return session;
}

export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}
