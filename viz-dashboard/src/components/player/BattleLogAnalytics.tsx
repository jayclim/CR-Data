'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Trophy, Swords } from 'lucide-react';

import Link from 'next/link';

interface Card {
  name: string;
  id: number;
  iconUrls: {
    medium: string;
  };
}

interface Player {
  tag: string;
  name: string;
  crowns: number;
  trophyChange?: number;
  cards: Card[];
}

interface Battle {
  type: string;
  battleTime: string;
  team: Player[];
  opponent: Player[];
  gameMode: { name: string };
}

interface BattleLogAnalyticsProps {
  battles: Battle[];
  playerTag: string;
}

export default function BattleLogAnalytics({ battles, playerTag }: BattleLogAnalyticsProps) {
  const [selectedBattleIndex, setSelectedBattleIndex] = useState<number | null>(null);

  if (!battles || battles.length === 0) return null;

  // Filter out boat battles
  const filteredBattles = battles.filter(b => b.gameMode?.name !== 'ClanWar_BoatBattle');

  // Process data for charts
  let cumulativeTrophies = 0;
  
  // Filter for Ladder matches only for the Tilt Tracker
  const trophyData = filteredBattles
    .filter(b => b.type === 'PvP' && b.gameMode?.name === 'Ladder' && b.team[0].trophyChange !== undefined)
    .reverse() // Oldest first
    .map((b, i) => {
      const change = b.team[0].trophyChange || 0;
      cumulativeTrophies += change;
      return {
        index: i + 1,
        change: change,
        cumulative: cumulativeTrophies,
        mode: b.gameMode?.name || 'Unknown',
        result: change > 0 ? 'Win' : change < 0 ? 'Loss' : 'Draw'
      };
    });

  // Calculate Win/Loss stats (All battles)
  const stats = filteredBattles.reduce(
    (acc, b) => {
      const crownsWon = b.team[0].crowns;
      const crownsLost = b.opponent[0].crowns;
      const won = crownsWon > crownsLost;
      
      acc.total++;
      if (won) acc.wins++;
      else if (crownsWon < crownsLost) acc.losses++;
      
      acc.crownsWon += crownsWon;
      acc.crownsLost += crownsLost;
      return acc;
    },
    { wins: 0, losses: 0, total: 0, crownsWon: 0, crownsLost: 0 }
  );

  // Helper to get result color
  const getResultColor = (battle: Battle) => {
    const crownsWon = battle.team[0].crowns;
    const crownsLost = battle.opponent[0].crowns;
    if (crownsWon > crownsLost) return 'bg-green-500/20 border-green-500 text-green-500';
    if (crownsWon < crownsLost) return 'bg-red-500/20 border-red-500 text-red-500';
    return 'bg-gray-500/20 border-gray-500 text-gray-500';
  };

  const formatChange = (val: number) => (val > 0 ? `+${val}` : val);

  return (
    <div className="space-y-6">
      {/* Recent Battles Grid */}
      <div className="bg-[#171717] border border-[#262626] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2">
            <Swords className="w-4 h-4" /> Recent Battles
          </h3>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-green-500">W{stats.wins}</span>
            <span className="text-gray-600">•</span>
            <span className="text-red-500">L{stats.losses}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {filteredBattles.map((battle, i) => {
             const crownsWon = battle.team[0].crowns;
             const crownsLost = battle.opponent[0].crowns;
             const isWin = crownsWon > crownsLost;
             const isLoss = crownsWon < crownsLost;
             const isLadder = battle.gameMode?.name === 'Ladder';
             const isSelected = selectedBattleIndex === i;
             
             return (
              <div 
                key={i} 
                onClick={() => setSelectedBattleIndex(isSelected ? null : i)}
                className={`relative group w-12 h-12 rounded-lg border-b-4 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${getResultColor(battle)} ${isSelected ? 'ring-2 ring-white scale-105' : ''}`}
              >
                {isLadder ? <Trophy className="w-5 h-5" /> : <Swords className="w-5 h-5" />}

                {/* Hover Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[300px] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 p-4 ${isSelected ? 'block' : 'hidden group-hover:block'}`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#333]"> 
                        <span className="text-xs text-gray-400 font-bold uppercase">{battle.gameMode?.name || 'Unknown'}</span>
                        <span className={`text-xs font-bold ${isWin ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-gray-500'}`}>
                            {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'} ({crownsWon}-{crownsLost})
                        </span>
                    </div>

                    {/* Teams */}
                    <div className="space-y-4">
                        {/* Our Team */}
                        <div>
                            <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Team</div>
                            {battle.team.map((p, idx) => (
                                <div key={idx} className="mb-2 last:mb-0">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <Link href={`/player/${p.tag.replace('#', '')}`} className="text-white hover:text-blue-400 truncate max-w-[150px] block">
                                            {p.name}
                                        </Link>
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500 text-[10px] font-bold">{p.crowns}</span>
                                            <img src="/assets/crown.png" alt="crown" className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-0.5">
                                        {Array.from(new Map(p.cards.map(c => [c.id, c])).values()).map((c) => (
                                            <img key={c.id} src={c.iconUrls?.medium} className="w-6 h-auto" alt={c.name} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                         {/* Opponent Team */}
                         <div>
                            <div className="text-[10px] text-red-400 font-bold uppercase mb-1">Opponent</div>
                            {battle.opponent.map((p, idx) => (
                                <div key={idx} className="mb-2 last:mb-0">
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <Link href={`/player/${p.tag.replace('#', '')}`} className="text-white hover:text-red-400 truncate max-w-[150px] block">
                                            {p.name}
                                        </Link>
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500 text-[10px] font-bold">{p.crowns}</span>
                                            <img src="/assets/crown.png" alt="crown" className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-0.5">
                                        {Array.from(new Map(p.cards.map(c => [c.id, c])).values()).map((c) => (
                                            <img key={c.id} src={c.iconUrls?.medium} className="w-6 h-auto" alt={c.name} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
             );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crown Ratio */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex flex-col justify-between min-h-[200px]">
          <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2">
            <img src="/assets/crown.png" alt="Crown" className="w-5 h-5 object-contain" />
            Crown Ratio
          </h3>
          <div className="flex items-end gap-3 mt-4">
             <div className="flex flex-col">
                <span className="text-4xl font-bold text-white">{stats.crownsWon}</span>
                <span className="text-xs text-green-500 font-bold uppercase">Won</span>
             </div>
             <span className="text-gray-600 text-2xl mb-2">/</span>
             <div className="flex flex-col">
                <span className="text-4xl font-bold text-gray-400">{stats.crownsLost}</span>
                <span className="text-xs text-red-500 font-bold uppercase">Lost</span>
             </div>
          </div>
          <div className="w-full bg-[#262626] h-2 rounded-full mt-6 overflow-hidden">
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${(stats.crownsWon / (stats.crownsWon + stats.crownsLost || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Tilt Tracker Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6">
           <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4" /> Tilt Tracker (Ladder Only)
           </h3>
           <div className="h-[150px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trophyData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                 <XAxis 
                    dataKey="index" 
                    stroke="#666" 
                    tick={{ fontSize: 10 }} 
                    tickFormatter={(val) => `#${val}`}
                 />
                 <YAxis 
                    stroke="#666" 
                    tick={{ fontSize: 10 }}
                    domain={['auto', 'auto']}
                 />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                    cursor={{ stroke: '#666', strokeWidth: 1 }}
                    formatter={(value: any, name: string) => [formatChange(value), name === 'cumulative' ? 'Net Change' : name]}
                    labelFormatter={(label) => `Match #${label}`}
                 />
                 <Line 
                   type="monotone" 
                   dataKey="cumulative" 
                   stroke="#8884d8" 
                   strokeWidth={3} 
                   dot={{ r: 2, fill: '#8884d8' }}
                   activeDot={{ r: 6, fill: '#fff' }}
                 />
               </LineChart>
             </ResponsiveContainer>
           </div>
           <div className="text-xs text-center text-gray-500 mt-2">
             Net Trophy Change (Last {trophyData.length} Ladder Matches)
           </div>
        </div>
      </div>
    </div>
  );
}
