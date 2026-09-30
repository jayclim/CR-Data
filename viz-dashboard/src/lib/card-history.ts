export interface CardHistorySnapshot {
  date: string;
  cards: { id: number; count: number; wins: number; usage_rate: number; win_rate: number }[];
}

export interface TrendRow {
  date: string;
  usage: number | null;
  winRate: number | null;
  count: number | null;
  wins: number | null;
}

export function trendRows(snapshots: CardHistorySnapshot[], cardId: number): TrendRow[] {
  if (!snapshots.length) return [];
  const byDate = new Map(snapshots.map(snapshot => [snapshot.date, snapshot]));
  const dates = [...byDate.keys()].sort();
  const rows: TrendRow[] = [];
  for (let day = new Date(`${dates[0]}T00:00:00Z`); day <= new Date(`${dates[dates.length - 1]}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + 1)) {
    const date = day.toISOString().slice(0, 10);
    const card = byDate.get(date)?.cards.find(item => item.id === cardId);
    rows.push({ date, usage: card?.usage_rate ?? null, winRate: card?.win_rate ?? null, count: card?.count ?? null, wins: card?.wins ?? null });
  }
  return rows;
}
