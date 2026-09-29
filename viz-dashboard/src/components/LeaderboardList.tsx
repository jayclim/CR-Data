interface Player {
  tag: string;
  name: string;
  expLevel: number;
  trophies?: number;
  eloRating?: number; // Path of Legends uses eloRating
  clan?: {
    name: string;
  };
}

interface Clan {
  tag: string;
  name: string;
  score?: number;
  clanScore?: number; // API uses clanScore
  members: number;
  badgeId: number;
}

import Link from 'next/link';

export default function LeaderboardList({ players, clans }: { players: Player[], clans: Clan[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Royales */}
      <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <h2 className="text-xs font-bold text-slate-700 normal-case tracking-normal flex items-center gap-2">
            <span className="text-amber-700">🏆</span> Top Royales
          </h2>
        </div>
        <div className="divide-y divide-[#e2e8f0]">
          {players.map((player, index) => (
            <Link prefetch={false} href="/player" key={player.tag} className="px-3 py-2 flex items-center justify-between hover:bg-[#f1f5f9] transition-colors group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-amber-700' :
                  index === 1 ? 'bg-gray-400/20 text-slate-600' :
                  index === 2 ? 'bg-orange-600/20 text-orange-600' :
                  'bg-[#e2e8f0] text-slate-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                    {player.name}
                    <span className="text-[9px] bg-[#e2e8f0] px-1 rounded text-slate-600 border border-[#cbd5e1]">Lvl {player.expLevel}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    {player.clan ? (
                      <span className="text-slate-600">{player.clan.name}</span>
                    ) : (
                      <span className="italic opacity-50">No Clan</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-teal-400 tabular-nums">
                  {(player.eloRating || player.trophies || 0).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Clan Leaderboard */}
      <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <h2 className="text-xs font-bold text-slate-700 normal-case tracking-normal flex items-center gap-2">
            <img src="/assets/clan.png" alt="Clan" className="w-5 h-5 object-contain" /> Clan Leaderboard
          </h2>
        </div>
        <div className="divide-y divide-[#e2e8f0]">
          {clans.map((clan, index) => (
            <Link prefetch={false} href="/clan" key={clan.tag} className="px-3 py-2 flex items-center justify-between hover:bg-[#f1f5f9] transition-colors group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  index === 0 ? 'bg-yellow-500/20 text-amber-700' :
                  index === 1 ? 'bg-gray-400/20 text-slate-600' :
                  index === 2 ? 'bg-orange-600/20 text-orange-600' :
                  'bg-[#e2e8f0] text-slate-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{clan.name}</div>
                  <div className="text-[10px] text-slate-500">{clan.members}/50 Members</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-teal-400 tabular-nums">
                  {(clan.clanScore || clan.score || 0).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
