'use client';

import React from 'react';
import MetaNetworkGraph from './MetaNetworkGraph';
import PlayerMap from './PlayerMap';
import { ArrowUpRight, Users, Trophy, Swords } from 'lucide-react';

interface BentoGridProps {
  synergies: any[];
  playerLocations: any[];
  stats: {
    totalPlayers: number;
    totalDecks: number;
    topArchetype: string;
  };
}

export default function BentoGrid({ synergies, playerLocations, stats }: BentoGridProps) {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-4 flex items-center justify-between group hover:border-[#404040] transition-colors">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Players</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalPlayers}</h3>
          </div>
          <div className="bg-[#262626] p-2 rounded-lg group-hover:bg-[#333] transition-colors">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-[#171717] border border-[#262626] rounded-xl p-4 flex items-center justify-between group hover:border-[#404040] transition-colors">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Battles Analyzed</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalDecks}</h3>
          </div>
          <div className="bg-[#262626] p-2 rounded-lg group-hover:bg-[#333] transition-colors">
            <Swords className="w-5 h-5 text-red-500" />
          </div>
        </div>

        <div className="bg-[#171717] border border-[#262626] rounded-xl p-4 flex items-center justify-between group hover:border-[#404040] transition-colors">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Top Archetype</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.topArchetype}</h3>
          </div>
          <div className="bg-[#262626] p-2 rounded-lg group-hover:bg-[#333] transition-colors">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[800px]">
        {/* Large Cell: Meta Network Graph (Takes up 2/3 width) */}
        <div className="lg:col-span-2 h-[500px] lg:h-full relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
          <MetaNetworkGraph synergies={synergies} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 lg:h-full">
          {/* Map Cell (Takes up top half of right column) */}
          <div className="h-[360px] lg:h-auto lg:flex-1 min-h-0">
            <PlayerMap locations={playerLocations} />
          </div>

          {/* Placeholder / Future Viz Cell */}
          <div className="h-[180px] lg:h-auto lg:flex-1 min-h-0 bg-[#171717] border border-[#262626] rounded-xl p-4 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
            <div className="z-10">
              <h3 className="text-lg font-bold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-500 text-sm max-w-[200px]">
                More visualizations coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
