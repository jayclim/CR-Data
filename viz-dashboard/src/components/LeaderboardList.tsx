import Image from 'next/image';
import Link from 'next/link';

interface Player {
  tag: string;
  name: string;
  expLevel: number;
  trophies?: number;
  eloRating?: number; // Path of Legends uses eloRating
  clan?: { name: string };
}

interface Clan {
  tag: string;
  name: string;
  score?: number;
  clanScore?: number; // API uses clanScore
  members: number;
  badgeId: number;
}

export default function LeaderboardList({ players, clans }: { players: Player[], clans: Clan[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_16px_32px_#030b1780]">
        <div className="border-b border-[var(--card-border)] bg-[#152942] px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]"><span aria-hidden="true">🏆</span> Top Royales</h2>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {players.map((player, index) => (
            <Link prefetch={false} href="/player" key={player.tag} className="group flex min-w-0 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#192d47]">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-black tabular-nums ${
                  index === 0 ? 'border-[#b88e3d] bg-[#4a3b23] text-[#ffd166]' :
                  index === 1 ? 'border-[#7d91a7] bg-[#26384b] text-[#d4e3f2]' :
                  index === 2 ? 'border-[#9e6b4f] bg-[#422c2b] text-[#ffb38c]' :
                  'border-[var(--card-border)] bg-[#0b1829] text-[var(--muted)]'
                }`}>{index + 1}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[#48bdff]">{player.name}</span>
                    <span className="shrink-0 rounded border border-[var(--card-border)] bg-[#0b1829] px-1 text-[10px] text-[var(--muted)]">Lvl {player.expLevel}</span>
                  </div>
                  <div className="truncate text-xs text-[var(--muted)]">{player.clan?.name || 'No Clan'}</div>
                </div>
              </div>
              <div className="shrink-0 text-right text-sm font-bold text-[#ffd166] tabular-nums">{(player.eloRating || player.trophies || 0).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_16px_32px_#030b1780]">
        <div className="border-b border-[var(--card-border)] bg-[#152942] px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]"><Image src="/assets/clan.png" alt="" width={22} height={22} className="object-contain" /> Clan Leaderboard</h2>
        </div>
        <div className="divide-y divide-[var(--card-border)]">
          {clans.map((clan, index) => (
            <Link prefetch={false} href="/clan" key={clan.tag} className="group flex min-w-0 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#192d47]">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-black tabular-nums ${
                  index === 0 ? 'border-[#b88e3d] bg-[#4a3b23] text-[#ffd166]' :
                  index === 1 ? 'border-[#7d91a7] bg-[#26384b] text-[#d4e3f2]' :
                  index === 2 ? 'border-[#9e6b4f] bg-[#422c2b] text-[#ffb38c]' :
                  'border-[var(--card-border)] bg-[#0b1829] text-[var(--muted)]'
                }`}>{index + 1}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[#48bdff]">{clan.name}</div>
                  <div className="text-xs text-[var(--muted)]">{clan.members}/50 Members</div>
                </div>
              </div>
              <div className="shrink-0 text-right text-sm font-bold text-[#ffd166] tabular-nums">{(clan.clanScore || clan.score || 0).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
