import Link from 'next/link';
import { SearchX, ArrowRight } from 'lucide-react';

export default function SearchPage() {
  return (
    <main className="page-shell max-w-3xl">
      <div className="panel mt-10 p-8 sm:p-12">
        <div className="mb-6 inline-flex rounded-xl border border-[#315875] bg-[#17334d] p-3 text-[#48bdff]"><SearchX size={30} aria-hidden="true" /></div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#ffd166]">Arena status</p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Player lookup is paused</h1>
        <p className="section-copy mt-4">Individual player search is currently unavailable. You can still explore card statistics, popular decks, and the sampled leaderboards.</p>
        <Link prefetch={false} href="/data" className="button-primary mt-7">Browse cards & decks <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </main>
  );
}
