'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

interface CardData {
  name: string;
  usage_rate: number;
  win_rate: number;
  icon: string;
  type: string | null;
}

interface MetaScatterPlotProps {
  cards: CardData[];
}

export default function MetaScatterPlot({ cards }: MetaScatterPlotProps) {
  // Filter out cards with very low usage to reduce noise
  const data = cards.filter(c => c.usage_rate > 0.5);

  // Calculate averages for quadrants
  const avgWin = data.reduce((acc, c) => acc + c.win_rate, 0) / data.length;
  const avgUsage = data.reduce((acc, c) => acc + c.usage_rate, 0) / data.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const card = payload[0].payload;
      return (
        <div className="bg-[#171717] border border-[#333] p-3 rounded-lg shadow-xl z-50">
          <div className="flex items-center gap-2 mb-2">
            {card?.icon && <img src={card.icon} alt={card.name || 'Card'} className="h-12 w-auto" />}
            <p className="font-bold text-white">{card?.name || 'Unknown'}</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-gray-400">Win Rate: <span className={(card?.win_rate || 0) > 50 ? 'text-green-500' : 'text-red-500'}>{card?.win_rate || 0}%</span></p>
            <p className="text-gray-400">Usage: <span className="text-blue-400">{card?.usage_rate || 0}%</span></p>
            <p className="text-gray-500 italic mt-1">
              {card.win_rate > avgWin && card.usage_rate < avgUsage ? '💎 Sleeper Pick' : 
               card.win_rate > avgWin && card.usage_rate > avgUsage ? '🔥 Meta Staple' :
               card.win_rate < avgWin && card.usage_rate > avgUsage ? '📉 Overrated' : '💀 Niche'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[500px] bg-[#0a0a0a] rounded-xl border border-[#262626] p-4 relative">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        💎 The Sleeper Hunt
        <span className="text-xs font-normal text-gray-500 bg-[#262626] px-2 py-1 rounded">
          Win Rate vs Usage Rate
        </span>
      </h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            type="number" 
            dataKey="usage_rate" 
            name="Usage" 
            unit="%" 
            stroke="#666"
            label={{ value: 'Usage Rate (%)', position: 'bottom', offset: 0, fill: '#666' }}
          />
          <YAxis 
            type="number" 
            dataKey="win_rate" 
            name="Win Rate" 
            unit="%" 
            stroke="#666"
            domain={['auto', 'auto']}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Quadrant Lines */}
          <ReferenceLine x={avgUsage} stroke="#444" strokeDasharray="3 3" label={{ value: "Avg Usage", fill: "#444", fontSize: 10 }} />
          <ReferenceLine y={avgWin} stroke="#444" strokeDasharray="3 3" label={{ value: "Avg Win Rate", fill: "#444", fontSize: 10 }} />

          <Scatter name="Cards" data={data} fill="#8884d8">
            {data.map((entry, index) => {
              let color = '#6b7280'; // Default Gray (Niche)
              if (entry.win_rate > avgWin) {
                 if (entry.usage_rate < avgUsage) color = '#a855f7'; // Purple (Sleeper)
                 else color = '#22c55e'; // Green (Meta)
              } else if (entry.usage_rate > avgUsage) {
                 color = '#ef4444'; // Red (Overrated)
              }
              
              return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 text-xs bg-[#000]/80 p-2 rounded border border-[#333]">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Sleeper (High Win, Low Use)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Meta (High Win, High Use)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Overrated (Low Win, High Use)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div> Niche (Low Win, Low Use)</div>
      </div>
    </div>
  );
}
