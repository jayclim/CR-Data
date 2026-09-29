import Link from 'next/link';
import { SearchX, ArrowRight } from 'lucide-react';

export default function SearchPage() {
  return (
    <main className="page-shell max-w-3xl">
      <div className="panel p-8 sm:p-12 mt-10">
        <SearchX className="text-slate-400 mb-6" size={32} />
        <h1 className="text-3xl font-semibold tracking-tight">Clan lookup is paused</h1>
        <p className="section-copy mt-4">Individual clan search is currently unavailable. You can still explore card statistics, popular decks, and the sampled leaderboards.</p>
        <Link prefetch={false} href="/data" className="inline-flex items-center gap-2 text-blue-700 font-medium text-sm mt-7">Browse cards & decks <ArrowRight size={16} /></Link>
      </div>
    </main>
  );
}
