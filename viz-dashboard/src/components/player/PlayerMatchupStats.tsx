'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Crown, Swords, ShieldAlert, ShieldCheck, Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { getArchetype } from '@/lib/royale-utils';

interface Card {
  name: string;
  id: number;
  iconUrls: {
    medium: string;
    evolutionMedium?: string;
  };
  elixirCost?: number;
}

interface BattlePlayer {
  tag: string;
  name: string;
  cards: Card[];
  crowns: number;
  startingTrophies?: number; // PB proxy
  queenTowerHitPoints?: number; // Level Proxy (rough)
}

interface Battle {
  type: string;
  battleTime: string;
  team: BattlePlayer[];
  opponent: BattlePlayer[];
  gameMode: { name: string };
}

interface PlayerMatchupStatsProps {
  battles: Battle[];
  playerTag: string;
}

export default function PlayerMatchupStats({ battles, playerTag }: PlayerMatchupStatsProps) {
  const stats = useMemo(() => {
    if (!battles || battles.length === 0) return null;

    // Stats Containers
    const cardStats: Record<string, { faced: number; wins: number; card: Card }> = {};
    const deckStats: Record<string, { faced: number; wins: number; cards: Card[] }> = {};
    const archetypeStats: Record<string, { faced: number; wins: number }> = {};
    
    // Matchup Difficulty Stats
    let higherTrophiesFaced = 0;
    let higherTrophiesWins = 0;
    let lowerTrophiesFaced = 0;
    let lowerTrophiesWins = 0;
    
    let totalBattles = 0;

    battles.forEach(battle => {
      // Filter valid PvP
      if (battle.type !== 'PvP' && battle.type !== 'pathOfLegend') return;
      
      const player = battle.team.find(t => t.tag === playerTag) || battle.team[0];
      const opponent = battle.opponent[0];

      if (!player || !opponent) return;

      totalBattles++;
      const isWin = (player.crowns > opponent.crowns);

      // 1. Card Stats (Individually)
      opponent.cards.forEach(card => {
        if (!cardStats[card.name]) {
          cardStats[card.name] = { faced: 0, wins: 0, card };
        }
        cardStats[card.name].faced++;
        if (isWin) cardStats[card.name].wins++;
      });

      // 2. Deck Stats (Full Deck)
      const deckKey = opponent.cards
        .map(c => c.name)
        .sort()
        .join(',');
      
      if (!deckStats[deckKey]) {
        deckStats[deckKey] = { faced: 0, wins: 0, cards: opponent.cards };
      }
      deckStats[deckKey].faced++;
      if (isWin) deckStats[deckKey].wins++;

      // 3. Archetype Stats
      const archetype = getArchetype(opponent.cards);
      if (!archetypeStats[archetype]) {
        archetypeStats[archetype] = { faced: 0, wins: 0 };
      }
      archetypeStats[archetype].faced++;
      if (isWin) archetypeStats[archetype].wins++;

      // 4. Matchup Difficulty (Trophies)
      // Note: startingTrophies might be undefined in some modes
      if (player.startingTrophies && opponent.startingTrophies) {
        if (opponent.startingTrophies > player.startingTrophies) {
          higherTrophiesFaced++;
          if (isWin) higherTrophiesWins++;
        } else if (opponent.startingTrophies < player.startingTrophies) {
          lowerTrophiesFaced++;
          if (isWin) lowerTrophiesWins++;
        }
      }
    });

    // Process & Sort Data

    // Struggling Against: High Faced count (> 3), Low WR
    const cardsArray = Object.values(cardStats);
    const strugglingCards = cardsArray
      .filter(s => s.faced >= 3 && (s.wins / s.faced) < 0.5)
      .sort((a, b) => (a.wins / a.faced) - (b.wins / b.faced)) // Lowest WR first
      .slice(0, 6);

    // Easy Matchups: High Faced count (> 3), High WR
    const easyCards = cardsArray
      .filter(s => s.faced >= 3 && (s.wins / s.faced) >= 0.5)
      .sort((a, b) => (b.wins / b.faced) - (a.wins / a.faced)) // Highest WR first
      .slice(0, 6);

    // Most Faced Cards
    const mostFacedCards = cardsArray
      .sort((a, b) => b.faced - a.faced)
      .slice(0, 8);

    // Most Faced Decks
    const mostFacedDecks = Object.values(deckStats)
      .sort((a, b) => b.faced - a.faced)
      .slice(0, 5);

    // Archetype Data for Chart
    const archetypeChartData = Object.entries(archetypeStats)
      .filter(([name]) => name !== 'Unknown') // Hide Unknown for cleanliness unless it's dominant
      .map(([name, stat]) => ({
        name,
        faced: stat.faced,
        winRate: Math.round((stat.wins / stat.faced) * 100)
      }))
      .sort((a, b) => b.faced - a.faced);

    return {
      totalBattles,
      strugglingCards,
      easyCards,
      mostFacedCards,
      mostFacedDecks,
      archetypeChartData,
      matchupDifficulty: {
        higher: { faced: higherTrophiesFaced, wins: higherTrophiesWins },
        lower: { faced: lowerTrophiesFaced, wins: lowerTrophiesWins }
      }
    };
  }, [battles, playerTag]);

  if (!stats || stats.totalBattles === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-red-500" />
          Matchup Analytics
        </h2>
        <span className="text-xs text-gray-500 bg-[#262626] px-2 py-1 rounded">
          Last {stats.totalBattles} Battles
        </span>
      </div>

      {/* Row 1: Struggling vs Easy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Struggling Against */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6">
          <h3 className="text-red-400 text-sm font-bold uppercase flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4" /> Hardest Counters
            <span className="text-[10px] text-gray-500 normal-case ml-auto">Min 3 matchups</span>
          </h3>
          {stats.strugglingCards.length > 0 ? (
            <div className="space-y-3">
              {stats.strugglingCards.map((stat, i) => (
                <div key={i} className="flex items-center justify-between bg-[#262626]/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-12">
                      <Image 
                        src={stat.card.iconUrls.medium} 
                        alt={stat.card.name} 
                        fill 
                        className="object-contain" 
                      />
                    </div>
                    <div className="text-sm font-bold text-white">{stat.card.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-500 font-bold text-sm">
                      {Math.round((stat.wins / stat.faced) * 100)}% WR
                    </div>
                    <div className="text-xs text-gray-500">
                      vs {stat.faced} times
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-gray-500 py-8 text-sm">
               No major struggles detected in recent battles.
             </div>
          )}
        </div>

        {/* Easy Matchups */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6">
          <h3 className="text-green-400 text-sm font-bold uppercase flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4" /> Best Matchups
            <span className="text-[10px] text-gray-500 normal-case ml-auto">Min 3 matchups</span>
          </h3>
          {stats.easyCards.length > 0 ? (
            <div className="space-y-3">
              {stats.easyCards.map((stat, i) => (
                <div key={i} className="flex items-center justify-between bg-[#262626]/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-12">
                      <Image 
                        src={stat.card.iconUrls.medium} 
                        alt={stat.card.name} 
                        fill 
                        className="object-contain" 
                      />
                    </div>
                    <div className="text-sm font-bold text-white">{stat.card.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500 font-bold text-sm">
                      {Math.round((stat.wins / stat.faced) * 100)}% WR
                    </div>
                    <div className="text-xs text-gray-500">
                      vs {stat.faced} times
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 text-sm">
               No clear easy matchups in recent battles.
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Archetype Performance & Trophies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Archetype Chart */}
        <div className="lg:col-span-2 bg-[#171717] border border-[#262626] rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2 mb-6">
            <Swords className="w-4 h-4" /> Performance vs Archetypes
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.archetypeChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#333" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{fill: '#333', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                  formatter={(val: number) => [`${val}%`, 'Win Rate']}
                />
                <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.archetypeChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.winRate >= 50 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matchup Difficulty (Trophies) */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex flex-col">
            <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2 mb-6">
              <Trophy className="w-4 h-4" /> Trophy Gap
            </h3>
            
            <div className="flex-1 space-y-6">
               <div className="bg-[#262626]/30 p-4 rounded-lg">
                 <div className="flex items-center justify-between mb-2">
                   <div className="text-sm text-gray-300">Higher Trophies</div>
                   <TrendingUp className="w-4 h-4 text-red-400" />
                 </div>
                 <div className="text-2xl font-bold text-white">
                   {stats.matchupDifficulty.higher.faced > 0 
                     ? Math.round((stats.matchupDifficulty.higher.wins / stats.matchupDifficulty.higher.faced) * 100) 
                     : 0}%
                 </div>
                 <div className="text-xs text-gray-500">
                   Win Rate ({stats.matchupDifficulty.higher.faced} matches)
                 </div>
               </div>

               <div className="bg-[#262626]/30 p-4 rounded-lg">
                 <div className="flex items-center justify-between mb-2">
                   <div className="text-sm text-gray-300">Lower Trophies</div>
                   <TrendingDown className="w-4 h-4 text-green-400" />
                 </div>
                 <div className="text-2xl font-bold text-white">
                   {stats.matchupDifficulty.lower.faced > 0 
                     ? Math.round((stats.matchupDifficulty.lower.wins / stats.matchupDifficulty.lower.faced) * 100) 
                     : 0}%
                 </div>
                 <div className="text-xs text-gray-500">
                   Win Rate ({stats.matchupDifficulty.lower.faced} matches)
                 </div>
               </div>
            </div>
        </div>
      </div>

      {/* Row 3: Most Faced Decks */}
      <div className="bg-[#171717] border border-[#262626] rounded-xl p-6">
        <h3 className="text-gray-400 text-sm font-bold uppercase flex items-center gap-2 mb-6">
          <Crown className="w-4 h-4" /> Most Faced Decks
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {stats.mostFacedDecks.map((item, i) => (
             <div key={i} className="flex flex-col md:flex-row md:items-center justify-between bg-[#262626]/30 p-3 rounded-lg gap-4">
                <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  {item.cards.map((card, j) => (
                    <div key={j} className="relative w-8 h-10 flex-shrink-0">
                       <Image 
                         src={card.iconUrls.medium} 
                         alt={card.name} 
                         fill 
                         className="object-contain" 
                       />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                   <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase">Faced</div>
                      <div className="font-bold text-white">{item.faced}</div>
                   </div>
                   <div className="text-right w-16">
                      <div className="text-xs text-gray-500 uppercase">Your WR</div>
                      <div className={`font-bold ${item.wins/item.faced >= 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.round((item.wins / item.faced) * 100)}%
                      </div>
                   </div>
                </div>
             </div>
          ))}
          {stats.mostFacedDecks.length === 0 && (
             <div className="text-center text-gray-500">Not enough data to determine frequent opposing decks.</div>
          )}
        </div>
      </div>
    </div>
  );
}
