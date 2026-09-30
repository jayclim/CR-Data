'use client';

import { useState } from 'react';

interface MatchupData {
  archetype: string;
  opponent: string;
  win_rate: number;
  total: number;
  battle_count?: number;
  significant: boolean;
}

export default function ArchetypeMatchupHeatmap({ specificData, genericData }: { specificData: MatchupData[]; genericData: MatchupData[] }) {
  const [view, setView] = useState<'specific' | 'generic'>('generic');
  const data = view === 'specific' ? specificData : genericData;
  const popularity = new Map<string, number>();
  for (const item of data) popularity.set(item.archetype, (popularity.get(item.archetype) ?? 0) + (item.battle_count ?? item.total));
  const names = [...popularity.keys()].sort((a, b) => popularity.get(b)! - popularity.get(a)!).slice(0, 15);
  const cells = new Map(data.map(item => [`${item.archetype}|${item.opponent}`, item]));

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap justify-between items-start gap-5 mb-6">
        <div><h2 className="section-heading">Archetype matchups</h2><p className="section-copy text-sm mt-2">Row deck against column opponent. Each cell shows the observed win rate.</p></div>
        <div className="flex bg-[#0b1829] border border-[var(--card-border)] p-1 rounded-lg" aria-label="Matchup detail">
          {(['generic', 'specific'] as const).map(mode => <button key={mode} onClick={() => setView(mode)} aria-pressed={view === mode} className={`px-4 py-2 rounded-md text-sm ${view === mode ? 'bg-[var(--primary)] text-[#081321] shadow-sm font-semibold' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>{mode === 'generic' ? 'Overview' : 'Detailed'}</button>)}
        </div>
      </div>
      {names.length ? <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable matchup table">
        <table className="w-full text-xs border-separate border-spacing-1 min-w-[700px]">
          <caption className="sr-only">Observed matchup win rates. A dash means fewer than 30 unique battles.</caption>
          <thead><tr><th className="text-left text-[var(--muted)] p-2">Deck / opponent</th>{names.map(name => <th key={name} scope="col" className="text-center text-[var(--muted)] font-medium p-2 min-w-18 max-w-28">{name}</th>)}</tr></thead>
          <tbody>{names.map(name => <tr key={name}><th scope="row" className="text-left text-[var(--foreground)] font-medium p-2 whitespace-nowrap">{name}</th>{names.map(opponent => {
            const cell = cells.get(`${name}|${opponent}`);
            const tone = !cell?.significant ? 'bg-[#0b1829] text-[var(--muted)]' : cell.win_rate > 55 ? 'bg-[#174a43] text-[#9bf3d9]' : cell.win_rate < 45 ? 'bg-[#512c3b] text-[#ffc0c6]' : 'bg-[#193248] text-[var(--foreground)]';
            return <td key={opponent} className={`text-center rounded py-3 px-2 tabular-nums ${tone}`} title={cell ? `${name} vs ${opponent}: ${cell.win_rate}% across ${cell.battle_count ?? cell.total} ${cell.battle_count === undefined ? 'observations' : 'unique battles'}` : 'Insufficient observations'}>{cell ? `${cell.win_rate}%` : '—'}</td>;
          })}</tr>)}</tbody>
        </table>
      </div> : <p className="section-copy">Not enough matchup observations in this snapshot.</p>}
      <p className="text-xs text-[var(--muted)] mt-5 leading-relaxed">Mint: higher observed wins. Coral: lower observed wins. Slate: no clear signal. Cells require at least 30 unique battles. Same-archetype matchups are 50% by definition; repeated players still limit statistical independence.</p>
    </div>
  );
}
