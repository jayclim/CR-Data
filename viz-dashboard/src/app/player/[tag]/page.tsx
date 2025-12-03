'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Swords, Shield, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SkillRadar from '@/components/SkillRadar';
import BattleLogAnalytics from '@/components/player/BattleLogAnalytics';
import PlayerUsageStats from '@/components/player/PlayerUsageStats';
import metaData from '@/data/meta_snapshot.json';

export default function PlayerDashboard() {
  const params = useParams();
  const tag = params.tag as string;
  
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tag) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Clean tag just in case, though URL param should be clean
        const cleanTag = tag.replace('#', '').toUpperCase();
        const res = await fetch(`/api/player/${cleanTag}`);
        
        if (!res.ok) {
          if (res.status === 404) throw new Error('Player not found');
          throw new Error('Failed to fetch player data');
        }

        const data = await res.json();
        setPlayerData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tag]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 bg-red-900/20 border border-red-900/50 p-4 rounded-lg">
          {error}
        </div>
        <Link href="/player" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>
    );
  }

  if (!playerData) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Link */}
        <Link href="/player" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Player Profile Card */}
          <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  {playerData.name}
                  <span className="text-sm font-normal text-gray-500 bg-[#262626] px-2 py-1 rounded">{playerData.tag}</span>
                </h2>
                {playerData.clan && (
                  <p className="text-gray-400 mt-1 flex items-center gap-2">
                    <span className="text-purple-400 font-bold">{playerData.role}</span> in 
                    <Link href={`/clan/${playerData.clan.tag.replace('#', '')}`} className="text-white font-medium hover:underline">
                      {playerData.clan.name}
                    </Link>
                    <span className="text-xs text-gray-600">({playerData.clan.tag})</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500 uppercase font-bold">Best Trophies</div>
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Trophy className="w-5 h-5" />
                    <span className="text-2xl font-bold">{playerData.bestTrophies?.toLocaleString()}</span>
                  </div>
                </div>
                {playerData.leagueStatistics && (
                    <div className="flex flex-col items-end border-l border-[#262626] pl-4">
                    <div className="text-xs text-gray-500 uppercase font-bold">Current Season</div>
                    <div className="flex items-center gap-2 text-blue-500">
                      <Trophy className="w-5 h-5" />
                      <span className="text-2xl font-bold">{playerData.leagueStatistics.currentSeason.trophies?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#262626]">
              <div className="bg-[#262626]/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                  <Swords className="w-4 h-4" /> Wins
                </div>
                <div className="text-2xl font-bold">{playerData.wins.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Total Battles: {playerData.battleCount?.toLocaleString()}</div>
              </div>
              <div className="bg-[#262626]/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                  <img src="/assets/crown.png" alt="Crown" className="w-4 h-4 object-contain" /> 3-Crowns
                </div>
                <div className="text-2xl font-bold">{playerData.threeCrownWins.toLocaleString()}</div>
              </div>
              <div className="bg-[#262626]/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                  <Shield className="w-4 h-4" /> War Wins
                </div>
                <div className="text-2xl font-bold">{playerData.warDayWins.toLocaleString()}</div>
              </div>
              <div className="bg-[#262626]/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                  <Zap className="w-4 h-4" /> Cards Won
                </div>
                <div className="text-2xl font-bold">{playerData.challengeCardsWon.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Donations: {playerData.totalDonations?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <PlayerUsageStats 
            battles={playerData.battleLog} 
            playerTag={playerData.tag} 
            cardData={metaData.top_cards}
          />

          {/* Radar Charts Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Radar */}
            <div className="h-[500px] bg-[#171717] border border-[#262626] rounded-xl p-2">
              <SkillRadar 
                title="Player Skill Profile"
                color="#8884d8"
                playerStats={playerData} 
                globalAverages={metaData.global_averages}
                globalQ3={metaData.global_q3}
              />
            </div>

            {/* Top 500 Radar (Benchmark) */}
            <div className="h-[500px] bg-[#171717] border border-[#262626] rounded-xl p-2">
              <SkillRadar 
                title="Top 500 Benchmark Profile"
                color="#3b82f6"
                playerStats={metaData.global_averages} 
                globalAverages={metaData.global_averages}
                globalQ3={metaData.global_q3}
              />
            </div>
          </div>
          
          {/* Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-500">📊</span> Performance Analytics
            </h2>
            
            {/* Battle Log Analytics */}
            <BattleLogAnalytics battles={playerData.battleLog} playerTag={playerData.tag} />
          </div>

        </div>
      </div>
    </main>
  );
}
