import metaData from '@/data/meta_snapshot.json';

export default function SnapshotNote() {
  return (
    <div className="data-note">
      <span>Snapshot <time dateTime={metaData.timestamp.slice(0, 10)} className="font-semibold text-[#eaf4ff]">{metaData.timestamp.slice(0, 10)}</time></span>
      <span><strong className="text-[#eaf4ff]">{metaData.total_players.toLocaleString('en-US')}</strong> ranked players sampled</span>
      <span><strong className="text-[#eaf4ff]">{metaData.total_decks.toLocaleString('en-US')}</strong> deck observations</span>
      <span>Scheduled refresh · not live</span>
    </div>
  );
}
