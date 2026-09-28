import { requireStaff } from '@/src/lib/auth';
import Scanner from './Scanner';

export const dynamic = 'force-dynamic';
export default async function GatePage() {
  const session = await requireStaff();
  return <div className="mx-auto max-w-xl space-y-6"><p className="text-sm uppercase tracking-[.25em] text-[#d8ff45]">Gate scanner · {session.role}</p><h1 className="text-4xl font-black">Validasi tiket</h1><p className="muted">Pindai QR tiket atau masukkan kode. Check-in hanya dilakukan setelah tombol CHECK IN ditekan.</p><Scanner/></div>;
}
