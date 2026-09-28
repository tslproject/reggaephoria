import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';
import { createStaffAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';

export const dynamic = 'force-dynamic';
export default async function StaffPage() {
  await requireAdmin();
  const staff = await prisma.admin.findMany({ select: { id: true, username: true, role: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
  return <div className="grid gap-8 md:grid-cols-2"><section className="space-y-4"><h1 className="text-3xl font-black">Akun staf</h1><div className="card"><ActionForm action={createStaffAction} submitLabel="Buat akun"><label className="grid gap-2 text-sm">Username<input name="username" minLength={3} maxLength={32} required/></label><label className="grid gap-2 text-sm">Password (min. 12 karakter)<input name="password" type="password" minLength={12} required/></label><label className="grid gap-2 text-sm">Role<select name="role"><option value="GATE_STAFF">Gate staff</option><option value="ADMIN">Admin</option></select></label></ActionForm></div></section><section className="space-y-3"><h2 className="text-2xl font-bold">Pengguna</h2>{staff.map((person) => <article className="card flex justify-between" key={person.id}><span>{person.username}</span><b>{person.role}</b></article>)}</section></div>;
}
