import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth';
export default async function AdminIndex() { const session = await getSession(); redirect(session?.role === 'ADMIN' ? '/admin/dashboard' : session ? '/gate' : '/admin/login'); }
