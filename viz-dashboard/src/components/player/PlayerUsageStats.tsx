'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface Card {
  name: string;
  id: number;
  iconUrls: {
    medium: string;
  };
}

interface Battle {
  team: {
    tag: string;
    cards: Card[];
    supportCards?: Card[];
    crowns?: number;
  }[];
  opponent: {
    tag: string;
    crowns?: number;
  }[];
}

interface PlayerUsageStatsProps {
  battles: Battle[];
  playerTag: string;
}

export default function PlayerUsageStats({ battles, playerTag, cardData }: PlayerUsageStatsProps & { cardData: any[] }) {
  const stats = useMemo(() => {
    if (!battles || battles.length === 0) return null;

    const cardCounts: { [key: string]: { count: number; wins: number; card: Card } } = {};
    const deckCounts: { [key: string]: { count: number; wins: number; cards: Card[] } } = {};

    // Create elixir lookup map
    const elixirMap = new Map<string, number>();
    cardData?.forEach(c => {
      if (c.name && c.elixir !== undefined) {
        elixirMap.set(c.name, c.elixir);
      }
    });

    battles.forEach(battle => {
      const playerTeam = battle.team.find(t => t.tag === playerTag) || battle.team[0]; 
      // Determine win (if team[0] crowns > opponent crowns)
      // Note: Battle log structure varies. Usually team[0] is player.
      // We need to check the result. 
      // Assuming simple win check: team[0].crowns > opponent.crowns
      // But the API response usually has 'crowns'.
      // Let's assume we can infer win from context or if it's not available, we can't calculate win rate accurately without more data.
      // However, usually battle log has 'crowns' property on team.
      // Let's check if we can access crowns. The interface 'Battle' above didn't have it.
      // I need to update the interface to include crowns to calculate wins.
      
      // Let's assume for now we just count appearances if we can't determine win.
      // Wait, user asked for winrate. I MUST determine win.
      // Standard Clash Royale API battle log has:
      // team: [{ tag, crowns, ... }], opponent: [{ tag, crowns, ... }]
      // I need to update the interface.
      
      const playerCrowns = playerTeam.crowns || 0;
      const opponentCrowns = battle.opponent[0].crowns || 0;
      const isWin = playerCrowns > opponentCrowns;

      if (!playerTeam || !playerTeam.cards) return;

      // Count Cards
      playerTeam.cards.forEach(card => {
        if (!cardCounts[card.name]) {
          cardCounts[card.name] = { count: 0, wins: 0, card };
        }
        cardCounts[card.name].count++;
        if (isWin) cardCounts[card.name].wins++;
      });

      // Count Decks
      const sortedCards = [...playerTeam.cards].sort((a, b) => a.name.localeCompare(b.name));
      const deckKey = sortedCards.map(c => c.name).join(',');
      
      if (!deckCounts[deckKey]) {
        deckCounts[deckKey] = { count: 0, wins: 0, cards: sortedCards };
      }
      deckCounts[deckKey].count++;
      if (isWin) deckCounts[deckKey].wins++;
    });

    // Find Highest Win Rate Card (min 5 battles)
    let bestCard: Card | null = null;
    let bestCardWinRate = -1;
    let bestCardCount = 0;
    
    Object.values(cardCounts).forEach(item => {
      if (item.count >= 5) {
        const winRate = item.wins / item.count;
        if (winRate > bestCardWinRate) {
          bestCardWinRate = winRate;
          bestCard = item.card;
          bestCardCount = item.count;
        }
      }
    });

    // Find Most Used Card
    let mostUsedCard: Card | null = null;
    let maxCardCount = 0;
    Object.values(cardCounts).forEach(item => {
      if (item.count > maxCardCount) {
        maxCardCount = item.count;
        mostUsedCard = item.card;
      }
    });

    // Fallback if no card has 5 battles
    if (!bestCard) {
       // Just use most used
       let maxCount = 0;
       Object.values(cardCounts).forEach(item => {
         if (item.count > maxCount) {
           maxCount = item.count;
           bestCard = item.card;
           bestCardCount = item.count;
           bestCardWinRate = item.wins / item.count;
         }
       });
    }

    // Find Most Used Deck
    let mostUsedDeck: Card[] | null = null;
    let maxDeckCount = 0;
    let mostUsedDeckWins = 0;
    
    Object.values(deckCounts).forEach(item => {
      if (item.count > maxDeckCount) {
        maxDeckCount = item.count;
        mostUsedDeck = item.cards;
        mostUsedDeckWins = item.wins;
      }
    });

    // Calculate Deck Elixir Avg
    let deckElixirAvg = 0;
    if (mostUsedDeck) {
      const deck = mostUsedDeck as Card[];
      let totalElixir = 0;
      let count = 0;
      
      deck.forEach(card => {
        const cost = elixirMap.get(card.name);
        if (cost !== undefined) {
          totalElixir += cost;
          count++;
        }
      });
      
      deckElixirAvg = count > 0 ? totalElixir / count : 0;
    }

    // Find Most Used Tower Troop
    const towerCounts: { [key: string]: { count: number; card: Card } } = {};
    let totalTowerBattles = 0;

    battles.forEach(battle => {
      // Find the actual player in the team by matching tags
      // API tags usually include '#', ensure we match correctly
      const playerTeam = battle.team.find(t => t.tag === playerTag) || battle.team[0];
      
      if (playerTeam && playerTeam.supportCards && playerTeam.supportCards.length > 0) {
        totalTowerBattles++;
        playerTeam.supportCards.forEach(card => {
          if (!towerCounts[card.name]) {
            towerCounts[card.name] = { count: 0, card };
          }
          towerCounts[card.name].count++;
        });
      }
    });

    let mostUsedTower: Card | null = null;
    let maxTowerCount = 0;
    Object.values(towerCounts).forEach(item => {
      if (item.count > maxTowerCount) {
        maxTowerCount = item.count;
        mostUsedTower = item.card;
      }
    });

    return {
      bestCard,
      bestCardWinRate,
      bestCardCount,
      mostUsedCard,
      mostUsedCardCount: maxCardCount,
      mostUsedDeck,
      mostUsedDeckCount: maxDeckCount,
      mostUsedDeckWins,
      deckElixirAvg,
      mostUsedTower,
      mostUsedTowerCount: maxTowerCount,
      totalTowerBattles,
      totalBattles: battles.length
    } as {
      bestCard: Card | null;
      bestCardWinRate: number;
      bestCardCount: number;
      mostUsedCard: Card | null;
      mostUsedCardCount: number;
      mostUsedDeck: Card[] | null;
      mostUsedDeckCount: number;
      mostUsedDeckWins: number;
      deckElixirAvg: number;
      mostUsedTower: Card | null;
      mostUsedTowerCount: number;
      totalTowerBattles: number;
      totalBattles: number;
    };
  }, [battles, cardData]);

  if (!stats || !stats.bestCard || !stats.mostUsedDeck || !stats.mostUsedCard) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Stacked Cards */}
      <div className="space-y-6">
        {/* Most Used Tower Troop */}
        {stats.mostUsedTower && (
          <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex items-center gap-6">
            <div className="relative w-16 h-20 flex-shrink-0">
              <Image 
                src={stats.mostUsedTower.iconUrls.medium} 
                alt={stats.mostUsedTower.name}
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
            <div>
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Most Used Tower</h3>
              <div className="text-xl font-bold text-white mb-1">{stats.mostUsedTower.name}</div>
              <div className="text-sm text-yellow-400 font-mono">
                {stats.mostUsedTowerCount} Battles
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((stats.mostUsedTowerCount / stats.totalTowerBattles) * 100)}% usage
              </div>
            </div>
          </div>
        )}

        {/* Highest Win Rate Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex items-center gap-6">
          <div className="relative w-16 h-20 flex-shrink-0">
            <Image 
              src={stats.bestCard.iconUrls.medium} 
              alt={stats.bestCard.name}
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
          <div>
            <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Highest Win Rate Card</h3>
            <div className="text-xl font-bold text-white mb-1">{stats.bestCard.name}</div>
            <div className="text-sm text-green-400 font-mono">
              {Math.round(stats.bestCardWinRate * 100)}% Win Rate
            </div>
            <div className="text-xs text-gray-500 mt-1">
              in {stats.bestCardCount} battles
            </div>
          </div>
        </div>

        {/* Most Used Card */}
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex items-center gap-6">
          <div className="relative w-16 h-20 flex-shrink-0">
            <Image 
              src={stats.mostUsedCard.iconUrls.medium} 
              alt={stats.mostUsedCard.name}
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
          <div>
            <h3 className="text-gray-400 text-xs uppercase font-bold mb-1">Most Used Card</h3>
            <div className="text-xl font-bold text-white mb-1">{stats.mostUsedCard.name}</div>
            <div className="text-sm text-blue-400 font-mono">
              {stats.mostUsedCardCount} Battles
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((stats.mostUsedCardCount / stats.totalBattles) * 100)}% usage
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Most Used Deck */}
      <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">Most Used Deck</h3>
            <div className="flex items-center gap-3">
               <div className="text-sm text-purple-400 font-mono">
                {stats.mostUsedDeckCount} Battles
              </div>
              <div className="text-xs text-gray-600">|</div>
              <div className="text-sm text-green-400 font-mono">
                {Math.round((stats.mostUsedDeckWins / stats.mostUsedDeckCount) * 100)}% WR
              </div>
               <div className="text-xs text-gray-600">|</div>
              <div className="text-sm text-blue-400 font-mono">
                {stats.deckElixirAvg.toFixed(1)} Avg Elixir
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {stats.mostUsedDeck.map((card) => (
            <div key={card.id} className="relative aspect-[3/4] bg-[#0a0a0a] rounded border border-[#262626] overflow-hidden">
              <Image
                src={card.iconUrls.medium}
                alt={card.name}
                fill
                className="object-contain p-0.5"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
