'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { trendRows } from '@/lib/card-history';
import DeckList from './DeckList';

export interface ExplorerCard {
  id: number;
  name: string;
  icon: string;
  elixir: number;
  count: number;
  wins?: number;
  usage_rate: number;
  win_rate?: number;
}

export interface ExplorerDeck {
  cards: { id: number; name: string; icon: string; elixir: number; is_evo?: boolean; is_hero?: boolean }[];
  avg_elixir: number;
  count: number;
  usage_rate: number;
  win_rate: number;
}

export interface ExplorerSynergy {
  cards: { id: number; name: string; icon: string }[];
  count: number;
  synergy_rate: number;
}

export interface ExplorerHistorySnapshot {
  date: string;
  timestamp: string;
  total_players: number;
  total_decks: number;
  unique_battles: number;
  cards: { id: number; name: string; count: number; wins: number; usage_rate: number; win_rate: number }[];
}

interface Props {
  cards: ExplorerCard[];
  decks: ExplorerDeck[];
  synergies: ExplorerSynergy[];
  history: ExplorerHistorySnapshot[];
}

export default function CardExplorer({ cards, decks, synergies, history }: Props) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState<'usage' | 'winRate'>('usage');
  const selected = cards.find(card => String(card.id) === searchParams.get('card')) ?? cards[0];
  const matchingCards = [...cards].sort((a, b) => a.name.localeCompare(b.name)).filter(card => card.name.toLowerCase().includes(search.trim().toLowerCase()));

  if (!selected) return <p className="panel p-6 section-copy">No card observations are available in this snapshot.</p>;

  const partners = synergies.filter(pair => pair.cards.some(card => card.id === selected.id)).slice(0, 6);
  const matchingDecks = decks.filter(deck => deck.cards.some(card => card.id === selected.id));
  const rows = trendRows(history, selected.id);
  const recordedDays = rows.filter(row => row.count !== null).length;
  const chartLabel = metric === 'usage' ? 'Usage rate' : 'Win rate';

  function selectCard(id: number) {
    const url = new URL(window.location.href);
    url.searchParams.set('card', String(id));
    window.history.replaceState(null, '', url);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel p-4 sm:p-5">
          <label htmlFor="card-search" className="block text-sm font-bold text-[var(--foreground)]">Search cards</label>
          <input id="card-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Card name" className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[#0b1829] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)]" />
          <p className="mt-3 text-xs text-[var(--muted)]" aria-live="polite">{matchingCards.length} {matchingCards.length === 1 ? 'card' : 'cards'}</p>
          <div className="mt-2 max-h-80 space-y-1 overflow-y-auto" aria-label="Card search results">
            {matchingCards.map(card => (
              <button key={card.id} type="button" onClick={() => selectCard(card.id)} aria-current={card.id === selected.id ? 'true' : undefined} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${card.id === selected.id ? 'bg-[#20445f] font-bold text-[var(--foreground)]' : 'text-[var(--muted)] hover:bg-[#18334d]'}`}>
                <span className="relative h-9 w-7 shrink-0"><Image src={card.icon} alt="" fill sizes="28px" className="object-contain" /></span>
                <span>{card.name}</span>
              </button>
            ))}
            {matchingCards.length === 0 && <p className="px-2 py-3 text-sm text-[var(--muted)]">No cards match that search.</p>}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="panel p-5 sm:p-6" aria-labelledby="selected-card-heading">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative h-36 w-28 shrink-0 rounded-xl border border-[#426183] bg-[#152942]"><Image src={selected.icon} alt={selected.name} fill sizes="112px" className="object-contain p-1" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ffd166]">Selected card</p>
                <h2 id="selected-card-heading" className="section-heading mt-1">{selected.name}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{selected.elixir} elixir</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Usage', `${selected.usage_rate}%`],
                ['Win rate', selected.win_rate === undefined ? 'Not recorded' : `${selected.win_rate}%`],
                ['Decks observed', selected.count.toLocaleString('en-US')],
                ['Wins observed', selected.wins === undefined ? 'Not recorded' : selected.wins.toLocaleString('en-US')],
              ].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--card-border)] bg-[#0b1829] p-3"><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">{value}</dd></div>)}
            </dl>
            <p className="mt-4 text-xs text-[var(--muted)]">Rates describe sampled deck observations from the saved snapshot. Card variants are pooled.</p>
          </section>

          <section className="panel p-5 sm:p-6" aria-labelledby="partners-heading">
            <h2 id="partners-heading" className="section-heading">Common partners</h2>
            <p className="section-copy mt-1 text-sm">Frequent pairs among the saved top pairs; these counts do not measure a card&apos;s effect on wins.</p>
            {partners.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {partners.map(pair => {
                const partner = pair.cards.find(card => card.id !== selected.id);
                return partner && <li key={`${selected.id}-${partner.id}`} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[#0b1829] p-3">
                  <div className="relative h-12 w-10 shrink-0"><Image src={partner.icon} alt="" fill sizes="40px" className="object-contain" /></div>
                  <div><p className="font-semibold">{partner.name}</p><p className="text-xs text-[var(--muted)] tabular-nums">{pair.count.toLocaleString('en-US')} observed decks · {pair.synergy_rate}% of sampled decks</p></div>
                </li>;
              })}
            </ul> : <p className="mt-4 text-sm text-[var(--muted)]">No saved frequent pair includes this card.</p>}
          </section>
        </div>
      </div>

      <section className="panel p-5 sm:p-6" aria-labelledby="trend-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 id="trend-heading" className="section-heading">Snapshot history</h2><p className="section-copy mt-1 text-sm">Daily saved snapshots of recent battle logs for {selected.name}. Battle logs can overlap between dates; gaps mean no observation was saved.</p></div>
          {recordedDays > 1 && <div className="flex gap-2" aria-label="Trend metric">
            <button type="button" onClick={() => setMetric('usage')} aria-pressed={metric === 'usage'} className={`rounded-lg border px-3 py-2 text-sm ${metric === 'usage' ? 'border-[#48bdff] bg-[#20445f] text-[var(--foreground)]' : 'border-[var(--card-border)] text-[var(--muted)]'}`}>Usage</button>
            <button type="button" onClick={() => setMetric('winRate')} aria-pressed={metric === 'winRate'} className={`rounded-lg border px-3 py-2 text-sm ${metric === 'winRate' ? 'border-[#54d6b5] bg-[#20445f] text-[var(--foreground)]' : 'border-[var(--card-border)] text-[var(--muted)]'}`}>Win rate</button>
          </div>}
        </div>
        {recordedDays < 2 ? <p className="mt-5 rounded-lg border border-[var(--card-border)] bg-[#0b1829] p-4 text-sm text-[var(--muted)]">{recordedDays === 1 ? 'First-day baseline saved. The trend will appear after another snapshot.' : 'No historical observation is saved for this card yet.'}</p> : <div role="img" aria-label={`${chartLabel} trend for ${selected.name}; exact values are in the table below`} className="mt-5 h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#28415b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#a4b8ce" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis stroke="#a4b8ce" tick={{ fontSize: 11 }} tickFormatter={value => `${value}%`} width={44} domain={[0, 'auto']} />
              <Tooltip contentStyle={{ background: '#101f33', border: '1px solid #28415b', borderRadius: 8 }} formatter={value => [`${value}%`, chartLabel]} />
              <Line type="linear" dataKey={metric} name={chartLabel} stroke={metric === 'usage' ? '#48bdff' : '#54d6b5'} strokeWidth={3} dot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
            <caption className="mb-2 text-left font-semibold text-[var(--foreground)]">Saved daily observations</caption>
            <thead className="border-b border-[var(--card-border)] text-[var(--muted)]"><tr><th scope="col" className="py-2 pr-3">Date</th><th scope="col" className="py-2 pr-3 text-right">Usage</th><th scope="col" className="py-2 pr-3 text-right">Win rate</th><th scope="col" className="py-2 pr-3 text-right">Decks</th><th scope="col" className="py-2 text-right">Wins</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.date} className="border-b border-[var(--card-border)] last:border-0"><th scope="row" className="py-2 pr-3 font-medium">{row.date}</th><td className="py-2 pr-3 text-right">{row.usage === null ? '—' : `${row.usage}%`}</td><td className="py-2 pr-3 text-right">{row.winRate === null ? '—' : `${row.winRate}%`}</td><td className="py-2 pr-3 text-right">{row.count === null ? '—' : row.count.toLocaleString('en-US')}</td><td className="py-2 text-right">{row.wins === null ? '—' : row.wins.toLocaleString('en-US')}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-label="Matching popular decks">
        <div className="mb-4"><h2 className="section-heading">Matching popular decks</h2><p className="section-copy mt-1 text-sm">Saved popular decks containing {selected.name}.</p></div>
        {matchingDecks.length ? <DeckList decks={matchingDecks} /> : <p className="panel p-5 text-sm text-[var(--muted)]">None of the saved popular decks contains this card.</p>}
      </section>
    </div>
  );
}
