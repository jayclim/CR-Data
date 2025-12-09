'use client';

import React from 'react';
import { ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter, Cell } from 'recharts';
import { Info } from 'lucide-react';

interface MatchupData {
  archetype: string;
  opponent: string;
  win_rate: number;
  total: number;
  z_score: number;
  significant: boolean;
}

interface ArchetypeMatchupHeatmapProps {
  specificData: MatchupData[];
  genericData: MatchupData[];
}


interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MatchupData;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#171717] border border-[#333] p-3 rounded-lg shadow-xl z-50 text-xs">
        <div className="font-bold text-white mb-1">
          <span className="text-blue-400">{d.archetype}</span> vs <span className="text-red-400">{d.opponent}</span>
        </div>
        <div className="space-y-1">
          <p className="text-gray-300">Win Rate: <span className={d.win_rate > 50 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{d.win_rate}%</span></p>
          <p className="text-gray-400">Games: {d.total}</p>
          <div className="pt-2 border-t border-[#333] mt-2">
               <p className="text-gray-500">Z-Score: {d.z_score}</p>
               {d.significant ? (
                   <p className="text-yellow-500 font-bold flex items-center gap-1">
                       <Info className="w-3 h-3" /> Statistically Significant
                   </p>
               ) : (
                   <p className="text-gray-600 italic">Not significant</p>
               )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ArchetypeMatchupHeatmap({ specificData, genericData }: ArchetypeMatchupHeatmapProps) {
  const [viewMode, setViewMode] = React.useState<'specific' | 'generic'>('specific');

  const processData = () => {
    const sourceData = viewMode === 'specific' ? specificData : genericData;
    
    // 1. Get unique archetypes
    const archetypes = Array.from(new Set(sourceData.map(d => d.archetype)));
    
    // 2. Sort by popularity (total games) if possible, or just usage
    // We can infer popularity by summing 'total' for each archetype
    const popularity: Record<string, number> = {};
    sourceData.forEach(d => {
        if (!popularity[d.archetype]) popularity[d.archetype] = 0;
        popularity[d.archetype] += d.total;
    });

    let sortedArchetypes = archetypes.sort((a, b) => (popularity[b] || 0) - (popularity[a] || 0));

    // 3. Filter Top 15 for Specific view to avoid clutter
    if (viewMode === 'specific') {
        sortedArchetypes = sortedArchetypes.slice(0, 15);
    }
    
    // 4. Filter data to match sorted archetypes
    const filteredData = sourceData.filter(d => 
        sortedArchetypes.includes(d.archetype) && sortedArchetypes.includes(d.opponent)
    );

    return { domain: sortedArchetypes, data: filteredData };
  };

  const { domain, data } = processData();

  const getColor = (entry: MatchupData) => {
    if (!entry.significant) return '#262626'; // Light gray background for non-significant
    
    // 0-45 (Red), 45-55 (Gray), 55-100 (Green)
    if (entry.win_rate < 45) return '#ef4444';
    if (entry.win_rate > 55) return '#22c55e';
    return '#6b7280';
  };

  const getOpacity = (significant: boolean) => {
      if (!significant) return 1; // Solid color for filtered/background dots now
      return 1;
  };

  return (
    <div className="w-full bg-[#111] border border-[#262626] rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-white">⚔️</span> Archetype Matchups
            </h3>
            <p className="text-sm text-gray-500">
                Matrix of win rates. <span className="text-green-500 font-bold">Green</span> means the row archetype wins. <span className="text-red-500 font-bold">Red</span> means it loses.
            </p>
          </div>
          
          <div className="flex bg-[#262626] p-1 rounded-lg">
             <button
               onClick={() => setViewMode('specific')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                 viewMode === 'specific' 
                   ? 'bg-[#3b82f6] text-white shadow-sm' 
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               Detailed
             </button>
             <button
               onClick={() => setViewMode('generic')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                 viewMode === 'generic' 
                   ? 'bg-[#3b82f6] text-white shadow-sm' 
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               Generic
             </button>
          </div>
      </div>

      <div className="h-[700px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 120, left: 120 }}
          >
            <XAxis 
              type="category" 
              dataKey="opponent" 
              name="Opponent" 
              allowDuplicatedCategory={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              domain={domain}
            />
            <YAxis 
              type="category" 
              dataKey="archetype" 
              name="Archetype" 
              allowDuplicatedCategory={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              domain={domain}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#333' }} />
            <Scatter name="Matchups" data={data} shape="square">
              {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry)}
                    width={100} 
                  />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="text-right text-xs text-gray-600 mt-2">
             Light gray squares indicate non-significant data
        </div>
      </div>
    </div>
  );
}
