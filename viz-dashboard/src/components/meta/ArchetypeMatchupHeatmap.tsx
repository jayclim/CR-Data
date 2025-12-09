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
  data: MatchupData[];
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

export default function ArchetypeMatchupHeatmap({ data }: ArchetypeMatchupHeatmapProps) {
  // Transform data for Recharts Scatter (which handles grids well)
  // X = Opponent, Y = Player
  const chartData = data.map(d => ({
    x: d.opponent,
    y: d.archetype,
    z: d.win_rate, // Size/Color based on this
    ...d
  }));

  const getColor = (entry: MatchupData) => {
    if (!entry.significant) return '#ffffffff'; // Dark inactive color for non-significant
    
    // 0-45 (Red), 45-55 (Gray), 55-100 (Green)
    if (entry.win_rate < 45) return '#ef4444';
    if (entry.win_rate > 55) return '#22c55e';
    return '#6b7280';
  };

  const getOpacity = (significant: boolean) => {
      if (!significant) return 0.2; // Faded for non-significant
      return 1;
  };

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-[#262626] p-6 h-[600px] flex flex-col">
       <div className="flex justify-between items-start mb-6">
           <div>
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   ⚔️ Archetype Matchups
               </h3>
               <p className="text-gray-400 text-sm mt-1">
                   Matrix of win rates. <span className="text-green-500">Green</span> means the row archetype wins. <span className="text-red-500">Red</span> means it loses.
               </p>
           </div>
           <div className="text-right text-xs text-gray-500">
               <p>Opacity indicates</p>
               <p>statistical significance</p>
           </div>
       </div>

       <div className="flex-1 w-full min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <XAxis 
                type="category" 
                dataKey="x" 
                name="Opponent" 
                interval={0}
                tick={{ fill: '#9ca3af', fontSize: 10, textAnchor: 'end' }}
                angle={-45}
                allowDuplicatedCategory={false}
              />
              <YAxis 
                type="category" 
                dataKey="y" 
                name="Archetype" 
                interval={0}
                tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 'bold' }}
                allowDuplicatedCategory={false}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Matchups" data={chartData} shape="square">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry)}
                    fillOpacity={getOpacity(entry.significant)}
                    width={100} // Scatter cells don't strictly use width/height like bar cells, usually size is used
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}
