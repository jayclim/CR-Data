'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import metaData from '@/data/meta_snapshot.json';

const links = [
  { href: '/', label: 'Meta Deep Dives', match: (p: string) => p === '/' },
  { href: '/data', label: 'Data Tables', match: (p: string) => p === '/data' },
  { href: '/player', label: 'Player Search', match: (p: string) => p.startsWith('/player') },
  { href: '/clan', label: 'Clan Search', match: (p: string) => p.startsWith('/clan') },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-[#262626] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo + desktop links */}
          <div className="flex items-center gap-8 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity shrink-0"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                CR Meta
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {links.map(({ href, label, match }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors hover:text-white whitespace-nowrap ${
                    match(pathname) ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: version (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <div className="text-xs text-gray-500 font-mono">v1.0.0</div>
              <div className="text-[10px] text-gray-600 font-mono">
                Updated: {metaData.timestamp}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center p-2 -mr-2 text-gray-300 hover:text-white"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                  match(pathname)
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="px-3 pt-2 text-[10px] text-gray-600 font-mono">
              v1.0.0 • Updated: {metaData.timestamp}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
