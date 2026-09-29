'use client';

import React from 'react';
import Image from 'next/image';
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

function CustomTooltip({ active, payload, avgWin, avgUsage }: { active?: boolean; payload?: { payload: CardData }[]; avgWin: number; avgUsage: number }) {
    if (active && payload && payload.length) {
      const card = payload[0].payload;
      return (
        <div className="bg-[#ffffff] border border-[#cbd5e1] p-3 rounded-lg shadow-xl z-50">
          <div className="flex items-center gap-2 mb-2">
            {card?.icon && <Image src={card.icon} alt={card.name} width={36} height={48} className="h-12 w-auto" />}
            <p className="font-bold text-slate-900">{card?.name || 'Unknown'}</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-600">Win Rate: <span className={(card?.win_rate || 0) > 50 ? 'text-emerald-700' : 'text-red-500'}>{card?.win_rate || 0}%</span></p>
            <p className="text-slate-600">Usage: <span className="text-blue-700">{card?.usage_rate || 0}%</span></p>
            <p className="text-slate-500 italic mt-1">
              {card.win_rate > avgWin && card.usage_rate < avgUsage ? 'Higher win, lower use' :
               card.win_rate > avgWin && card.usage_rate > avgUsage ? 'Higher win, higher use' :
               card.win_rate < avgWin && card.usage_rate > avgUsage ? 'Lower win, higher use' : 'Lower win, lower use'}
            </p>
          </div>
        </div>
      );
    }
    return null;
}

export default function MetaScatterPlot({ cards }: MetaScatterPlotProps) {
  // Filter out cards with very low usage to reduce noise
  const data = cards.filter(c => c.usage_rate > 0.5);

  // Calculate averages for quadrants
  const avgWin = data.reduce((acc, c) => acc + c.win_rate, 0) / (data.length || 1);
  const avgUsage = data.reduce((acc, c) => acc + c.usage_rate, 0) / (data.length || 1);



  return (
    <div className="w-full h-[540px] bg-[#f4f7fa] rounded-xl border border-[#e2e8f0] p-4 relative">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        Card performance
        <span className="text-xs font-normal text-slate-500 bg-[#e2e8f0] px-2 py-1 rounded">
          Win Rate vs Usage Rate
        </span>
      </h3>

      <ResponsiveContainer width="100%" height="72%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis
            type="number"
            dataKey="usage_rate"
            name="Usage"
            unit="%"
            stroke="#64748b"
            label={{ value: 'Usage Rate (%)', position: 'bottom', offset: 0, fill: '#64748b' }}
          />
          <YAxis
            type="number"
            dataKey="win_rate"
            name="Win Rate"
            unit="%"
            stroke="#64748b"
            domain={['auto', 'auto']}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip avgWin={avgWin} avgUsage={avgUsage} />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Quadrant Lines */}
          <ReferenceLine x={avgUsage} stroke="#64748b" strokeDasharray="3 3" label={{ value: "Avg Usage", fill: "#64748b", fontSize: 10 }} />
          <ReferenceLine y={avgWin} stroke="#64748b" strokeDasharray="3 3" label={{ value: "Avg Win Rate", fill: "#64748b", fontSize: 10 }} />

          <Scatter name="Cards" data={data} fill="#2563eb">
            {data.map((entry, index) => {
              let color = '#6b7280'; // Default Gray (Niche)
              if (entry.win_rate > avgWin) {
                 if (entry.usage_rate < avgUsage) color = '#087f72'; // Purple (Sleeper)
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
      <div className="flex flex-wrap mt-4 flex flex-col gap-2 text-xs bg-white/95 p-2 rounded border border-[#cbd5e1]">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-500"></div> Higher win, lower use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Higher win, higher use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Lower win, higher use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div> Lower win, lower use</div>
      </div>
    </div>
  );
}
