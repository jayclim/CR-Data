import assert from 'node:assert/strict';
import { trendRows } from '../src/lib/card-history.ts';

assert.deepEqual(trendRows([], 7), []);
assert.deepEqual(trendRows([
  { date: '2026-09-04', cards: [{ id: 7, count: 2, wins: 1, usage_rate: 20, win_rate: 50 }] },
  { date: '2026-09-03', cards: [{ id: 8, count: 5, wins: 2, usage_rate: 30, win_rate: 40 }] },
  { date: '2026-09-01', cards: [{ id: 7, count: 0, wins: 0, usage_rate: 0, win_rate: 0 }] },
], 7), [
  { date: '2026-09-01', usage: 0, winRate: 0, count: 0, wins: 0 },
  { date: '2026-09-02', usage: null, winRate: null, count: null, wins: null },
  { date: '2026-09-03', usage: null, winRate: null, count: null, wins: null },
  { date: '2026-09-04', usage: 20, winRate: 50, count: 2, wins: 1 },
]);

console.log('Card history checks passed');
