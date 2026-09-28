import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth';
import { loginAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === 'ADMIN' ? '/admin/dashboard' : '/gate');
  return <div className="mx-auto max-w-md space-y-6"><p className="text-sm uppercase tracking-[.2em] text-[#d8ff45]">Secure staff access</p><h1 className="text-4xl font-black">Masuk Admin</h1><div className="card"><ActionForm action={loginAction} submitLabel="Masuk dashboard"><label className="grid gap-2 text-sm">Username<input name="username" autoComplete="username" required/></label><label className="grid gap-2 text-sm">Password<input name="password" type="password" autoComplete="current-password" required/></label></ActionForm></div><p className="muted text-sm">Akun awal: admin. Jalankan seed untuk membuatnya dan ubah password setelah login pertama.</p></div>;
}
