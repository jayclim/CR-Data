'use client';

import { useState } from 'react';

interface MatchupData {
  archetype: string;
  opponent: string;
  win_rate: number;
  total: number;
  significant: boolean;
}

export default function ArchetypeMatchupHeatmap({ specificData, genericData }: { specificData: MatchupData[]; genericData: MatchupData[] }) {
  const [view, setView] = useState<'specific' | 'generic'>('generic');
  const data = view === 'specific' ? specificData : genericData;
  const popularity = new Map<string, number>();
  for (const item of data) popularity.set(item.archetype, (popularity.get(item.archetype) ?? 0) + item.total);
  const names = [...popularity.keys()].sort((a, b) => popularity.get(b)! - popularity.get(a)!).slice(0, 15);
  const cells = new Map(data.map(item => [`${item.archetype}|${item.opponent}`, item]));

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex flex-wrap justify-between items-start gap-5 mb-6">
        <div><h2 className="section-heading">Archetype matchups</h2><p className="section-copy text-sm mt-2">Row deck against column opponent. Each cell shows the observed win rate.</p></div>
        <div className="flex bg-slate-100 p-1 rounded-lg" aria-label="Matchup detail">
          {(['generic', 'specific'] as const).map(mode => <button key={mode} onClick={() => setView(mode)} aria-pressed={view === mode} className={`px-4 py-2 rounded-md text-sm ${view === mode ? 'bg-white text-blue-800 shadow-sm font-semibold' : 'text-slate-600'}`}>{mode === 'generic' ? 'Overview' : 'Detailed'}</button>)}
        </div>
      </div>
      {names.length ? <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable matchup table">
        <table className="w-full text-xs border-separate border-spacing-1 min-w-[700px]">
          <caption className="sr-only">Observed matchup win rates. A dash means fewer than 30 observations.</caption>
          <thead><tr><th className="text-left text-slate-500 p-2">Deck / opponent</th>{names.map(name => <th key={name} scope="col" className="text-center text-slate-600 font-medium p-2 min-w-18 max-w-28">{name}</th>)}</tr></thead>
          <tbody>{names.map(name => <tr key={name}><th scope="row" className="text-left font-medium p-2 whitespace-nowrap">{name}</th>{names.map(opponent => {
            const cell = cells.get(`${name}|${opponent}`);
            const tone = !cell?.significant ? 'bg-slate-100 text-slate-600' : cell.win_rate > 55 ? 'bg-teal-100 text-teal-900' : cell.win_rate < 45 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-700';
            return <td key={opponent} className={`text-center rounded py-3 px-2 tabular-nums ${tone}`} title={cell ? `${name} vs ${opponent}: ${cell.win_rate}% across ${cell.total} observations` : 'Insufficient observations'}>{cell ? `${cell.win_rate}%` : '—'}</td>;
          })}</tr>)}</tbody>
        </table>
      </div> : <p className="section-copy">Not enough matchup observations in this snapshot.</p>}
      <p className="text-xs text-slate-500 mt-5 leading-relaxed">Teal: higher observed wins. Rose: lower observed wins. Gray: no clear signal. Cells require at least 30 observations; repeated players and battles limit statistical independence.</p>
    </div>
  );
}
