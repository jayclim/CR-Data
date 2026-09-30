import DeckList from '@/components/DeckList';
import LeaderboardList from '@/components/LeaderboardList';
import CardTable from '@/components/CardTable';
import SnapshotNote from '@/components/SnapshotNote';
import metaData from '@/data/meta_snapshot.json';

export default function DataPage() {
  return (
    <main className="page-shell space-y-8">
      <div>
        <h1 className="page-heading">Cards & decks</h1>
        <p className="section-copy mt-4">Browse the combinations behind the charts. Usage and win rates describe this snapshot’s sampled deck observations.</p>
        <SnapshotNote />
      </div>
      <DeckList decks={metaData.top_decks} />
      <section aria-label="Leaderboards"><LeaderboardList players={metaData.leaderboards.players} clans={metaData.leaderboards.clans} /></section>
      <section id="card-stats" className="scroll-mt-24"><CardTable cards={metaData.top_cards} /></section>
      <p className="section-copy border-t border-[var(--card-border)] pt-5 text-xs">Card and deck win rates pool evolution and hero variants. Deck artwork shows the most common observed variant. Live player and clan lookup is currently unavailable.</p>
    </main>
  );
}
