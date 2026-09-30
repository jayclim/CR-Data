import { Suspense } from 'react';
import CardExplorer, { type ExplorerCard, type ExplorerHistorySnapshot } from '@/components/CardExplorer';
import SnapshotNote from '@/components/SnapshotNote';
import metaData from '@/data/meta_snapshot.json';
import historyData from '@/data/meta_history.json';

export default function ExplorePage() {
  const snapshot = metaData as typeof metaData & { cards?: ExplorerCard[] };
  const history = historyData as { snapshots: ExplorerHistorySnapshot[] };

  return (
    <main className="page-shell space-y-8">
      <div>
        <h1 className="page-heading">Card explorer</h1>
        <p className="section-copy mt-4">Pick a card to inspect its saved usage, wins, frequent partners, popular decks, and daily snapshot history.</p>
        <SnapshotNote />
      </div>
      <Suspense fallback={<p className="panel p-6 section-copy">Loading cards…</p>}>
        <CardExplorer cards={snapshot.cards ?? snapshot.top_cards} decks={snapshot.top_decks} synergies={snapshot.top_synergies} history={history.snapshots} />
      </Suspense>
    </main>
  );
}
