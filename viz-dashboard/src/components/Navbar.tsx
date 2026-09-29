'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartNoAxesCombined, ArrowUpRight } from 'lucide-react';

const links = [{ href: '/', label: 'Overview' }, { href: '/data', label: 'Cards & decks' }];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <nav aria-label="Main navigation" className="max-w-[1280px] mx-auto px-4 sm:px-8 min-h-18 flex flex-wrap items-center justify-between gap-3 py-3">
        <Link prefetch={false} href="/" className="flex items-center gap-3 font-semibold text-lg tracking-tight">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#142a40] text-white"><ChartNoAxesCombined size={21} /></span>
          Royale <span className="font-normal text-slate-500 -ml-2">Index</span>
        </Link>
        <div className="flex gap-1 sm:gap-3 items-center text-sm">
          {links.map(link => <Link prefetch={false} key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className={`px-3 py-2 rounded-md ${pathname === link.href ? 'bg-blue-50 text-blue-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>{link.label}</Link>)}
          <a href="https://supercell.com/en/games/clashroyale/blog/" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1 text-slate-500 pl-3">Game updates <ArrowUpRight size={14} /></a>
        </div>
      </nav>
    </header>
  );
}
