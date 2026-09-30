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
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-lg shadow-xl z-50">
          <div className="flex items-center gap-2 mb-2">
            {card?.icon && <Image src={card.icon} alt={card.name} width={36} height={48} className="h-12 w-auto" />}
            <p className="font-bold text-[var(--foreground)]">{card?.name || 'Unknown'}</p>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-[var(--muted)]">Win Rate: <span className={(card?.win_rate || 0) > 50 ? 'text-[#54d6b5]' : 'text-[#fa8290]'}>{card?.win_rate || 0}%</span></p>
            <p className="text-[var(--muted)]">Usage: <span className="text-[var(--primary)]">{card?.usage_rate || 0}%</span></p>
            <p className="text-[var(--muted)] italic mt-1">
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
    <div className="w-full bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4 relative">
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex flex-wrap items-center gap-2">
        Card performance
        <span className="text-xs font-normal text-[var(--muted)] bg-[#0b1829] px-2 py-1 rounded">
          Win Rate vs Usage Rate
        </span>
      </h3>

      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#28415b" />
          <XAxis
            type="number"
            dataKey="usage_rate"
            name="Usage"
            unit="%"
            stroke="#a4b8ce"
            label={{ value: 'Usage Rate (%)', position: 'bottom', offset: 0, fill: '#a4b8ce' }}
          />
          <YAxis
            type="number"
            dataKey="win_rate"
            name="Win Rate"
            unit="%"
            stroke="#a4b8ce"
            domain={['auto', 'auto']}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#a4b8ce' }}
          />
          <Tooltip content={<CustomTooltip avgWin={avgWin} avgUsage={avgUsage} />} cursor={{ stroke: '#a4b8ce', strokeDasharray: '3 3' }} />

          {/* Quadrant Lines */}
          <ReferenceLine x={avgUsage} stroke="#a4b8ce" strokeDasharray="3 3" label={{ value: "Avg Usage", fill: "#a4b8ce", fontSize: 10 }} />
          <ReferenceLine y={avgWin} stroke="#a4b8ce" strokeDasharray="3 3" label={{ value: "Avg Win Rate", fill: "#a4b8ce", fontSize: 10 }} />

          <Scatter name="Cards" data={data} fill="#48bdff">
            {data.map((entry, index) => {
              let color = '#6e91b4'; // Lower win, lower use
              if (entry.win_rate > avgWin) {
                 if (entry.usage_rate < avgUsage) color = '#54d6b5'; // Higher win, lower use
                 else color = '#ffd166'; // Higher win, higher use
              } else if (entry.usage_rate > avgUsage) {
                 color = '#fa8290'; // Lower win, higher use
              }

              return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-4 text-xs text-[var(--muted)] bg-[#0b1829] p-2 rounded border border-[var(--card-border)]">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#54d6b5]"></div> Higher win, lower use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ffd166]"></div> Higher win, higher use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fa8290]"></div> Lower win, higher use</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#6e91b4]"></div> Lower win, lower use</div>
      </div>
    </div>
  );
}
