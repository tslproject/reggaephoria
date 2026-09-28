import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/src/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'REGGAEPHORIA TANGSEL — Digital Tickets',
  description: 'Official digital ticketing for REGGAEPHORIA TANGSEL.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><SiteChrome>{children}</SiteChrome></body></html>;
}

async function SiteChrome({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return <><header className="site-header px-4 py-3 sm:px-6"><nav className="site-nav"><Link href="/" className="brand-mark"><span>REGGAEPHORIA <span className="text-[#ffd447]">TANGSEL</span></span></Link><div className="site-links"><Link href="/find-ticket">Cari Tiket</Link>{session && <Link href="/gate">Gate</Link>}<Link href="/admin">Admin</Link></div></nav></header><div className="reggae-stripe"/><main className="mx-auto min-h-[80vh] w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">{children}</main><footer className="border-t-2 border-[#080908] px-4 py-7 text-center text-sm text-[#c0c1b5]">© {new Date().getFullYear()} REGGAEPHORIA TANGSEL · Official ticketing</footer></>;
}
