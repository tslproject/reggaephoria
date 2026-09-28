import Link from 'next/link';
import { getSession } from '@/src/lib/auth';
import { logoutAction } from '@/src/app/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return <>{children}</>;
  return <div><nav className="admin-nav mb-8"><span className="admin-label">ADMIN · {session.role}</span><Link href="/admin/dashboard">Ringkasan</Link><Link href="/admin/events">Event</Link><Link href="/admin/products">Produk</Link><Link href="/admin/orders">Pesanan</Link><Link href="/admin/tickets">Tiket</Link><Link href="/admin/reports">Laporan</Link><Link href="/admin/staff">Staf</Link><form action={logoutAction}><button className="bg-[#28342b] text-white">Keluar</button></form></nav>{children}</div>;
}
