'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';

interface Card {
  name: string;
  id: number;
  iconUrls: {
    medium: string;
    evolutionMedium?: string;
    heroMedium?: string;
  };
  evolutionLevel?: number;
  heroLevel?: number; // Some APIs might use this
}

interface Battle {
  type: string;
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
  cardData: any[]; // Passed from parent to help with static data if needed
}

export default function PlayerUsageStats({ battles, playerTag, cardData }: PlayerUsageStatsProps) {
  const stats = useMemo(() => {
    if (!battles || battles.length === 0) return null;

    // Filter for Ladder/PoL only to avoid non-standard modes (e.g. Mega Deck with >8 cards)
    const validBattles = battles.filter(b => b.type === 'PvP' || b.type === 'pathOfLegend');
    
    if (validBattles.length === 0) return null;

    const cardCounts: { [key: string]: { count: number; wins: number; card: Card } } = {};
    // deckCounts: Key is sorted card names (base deck). Value tracks variants.
    const deckCounts: { 
      [key: string]: { 
        count: number; 
        wins: number; 
        variants: { 
          [variantKey: string]: { count: number; wins: number; cards: Card[] } 
        } 
      } 
    } = {};

    // Create elixir lookup map
    const elixirMap = new Map<string, number>();
    cardData?.forEach(c => {
      if (c.name && c.elixir !== undefined) {
        elixirMap.set(c.name, c.elixir);
      }
    });

    validBattles.forEach(battle => {
      const playerTeam = battle.team.find(t => t.tag === playerTag) || battle.team[0]; 
      
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
      // Fix 12-card bug: Ensure we only take unique cards and max 8
      // Sometimes API returns duplicates or extra cards?
      const uniqueCardsMap = new Map<string, Card>();
      playerTeam.cards.forEach(c => uniqueCardsMap.set(c.name, c));
      
      // If we have > 8 cards, we need a strategy. 
      // Usually standard battles have 8. If it's a special mode (e.g. Mega Deck), it might have 18.
      // But user said "12 cards". 
      // Let's just take the first 8 unique cards if > 8, or maybe sort and take 8?
      // Sorting by name ensures consistency.
      let sortedCards = Array.from(uniqueCardsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      // If > 8, it's likely a non-standard deck or bug. 
      // User wants to fix "12 cards instead of 8". 
      // We will slice to 8.
      if (sortedCards.length > 8) {
        sortedCards = sortedCards.slice(0, 8);
      }
      
      if (sortedCards.length === 0) return;

      const deckKey = sortedCards.map(c => c.name).join(',');
      
      // Identify Variant (Evos/Heroes)
      // We need to construct a key that represents the specific configuration of Evos/Heroes
      const variantKeyParts: string[] = [];
      const processedCards = sortedCards.map(c => {
        // Determine if Evo or Hero based on evolutionLevel
        // Level 1 = Evo, Level 2 = Hero
        let isEvo = false;
        let isHero = false;
        
        const level = c.evolutionLevel || 0;
        if (level === 1) isEvo = true;
        else if (level === 2) isHero = true;
        
        // Fallback to icon URL if level is 0
        if (level === 0) {
           if (c.iconUrls?.medium?.includes('evo')) isEvo = true;
           else if (c.iconUrls?.medium?.includes('hero')) isHero = true;
        }

        if (isEvo) variantKeyParts.push(`${c.name}:EVO`);
        if (isHero) variantKeyParts.push(`${c.name}:HERO`);
        
        // Return a processed card object with the correct icon
        let iconUrl = c.iconUrls.medium;
        if (isEvo && c.iconUrls.evolutionMedium) iconUrl = c.iconUrls.evolutionMedium;
        if (isHero && c.iconUrls.heroMedium) iconUrl = c.iconUrls.heroMedium;
        
        return { ...c, iconUrls: { ...c.iconUrls, medium: iconUrl } };
      });
      
      const variantKey = variantKeyParts.sort().join('|') || 'BASE';

      if (!deckCounts[deckKey]) {
        deckCounts[deckKey] = { count: 0, wins: 0, variants: {} };
      }
      deckCounts[deckKey].count++;
      if (isWin) deckCounts[deckKey].wins++;
      
      if (!deckCounts[deckKey].variants[variantKey]) {
        deckCounts[deckKey].variants[variantKey] = { count: 0, wins: 0, cards: processedCards };
      }
      deckCounts[deckKey].variants[variantKey].count++;
      if (isWin) deckCounts[deckKey].variants[variantKey].wins++;
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
      // Tie breaker: Count > Wins
      if (item.count > maxDeckCount || (item.count === maxDeckCount && item.wins > mostUsedDeckWins)) {
        maxDeckCount = item.count;
        mostUsedDeckWins = item.wins;
        
        // Find best variant for this deck
        let bestVariant: Card[] | null = null;
        let maxVariantCount = -1;
        let maxVariantWins = -1;
        
        Object.values(item.variants).forEach(v => {
            if (v.count > maxVariantCount || (v.count === maxVariantCount && v.wins > maxVariantWins)) {
                maxVariantCount = v.count;
                maxVariantWins = v.wins;
                bestVariant = v.cards;
            }
        });
        
        mostUsedDeck = bestVariant;
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
  }, [battles, cardData, playerTag]);

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
          {stats.mostUsedDeck.map((card, index) => (
            <div key={index} className="relative aspect-[3/4] bg-[#0a0a0a] rounded border border-[#262626] overflow-hidden">
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
