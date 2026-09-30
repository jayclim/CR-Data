'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ElixirData {
  elixir: number;
  win_rate: number;
  count: number;
}

interface ElixirEfficiencyChartProps {
  data: ElixirData[];
}

export default function ElixirEfficiencyChart({ data }: ElixirEfficiencyChartProps) {
  // Data is already pre-processed and sorted by fetch_meta.py

  return (
    <div className="w-full h-[400px] bg-[#f4f7fa] rounded-xl border border-[#e2e8f0] p-4">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex flex-wrap items-center gap-2">
        Elixir and outcomes
        <span className="text-xs font-normal text-slate-500 bg-[#e2e8f0] px-2 py-1 rounded">
          Win Rate by Avg Deck Elixir
        </span>
      </h3>

      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
          <XAxis
            dataKey="elixir"
            stroke="#64748b"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={10}
            label={{ value: 'Avg Elixir Cost', position: 'bottom', offset: 0, fill: '#64748b' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#087f72"
            domain={['auto', 'auto']}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#087f72' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6"
            label={{ value: 'Usage Count', angle: 90, position: 'insideRight', fill: '#3b82f6' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
            labelStyle={{ color: '#142a40', fontWeight: 'bold' }}
            formatter={(value: number, name: string) => [
              name === 'win_rate' ? `${value}%` : value,
              name === 'win_rate' ? 'Win Rate' : 'Decks'
            ]}
          />
          {/* Usage Volume */}
          <Bar yAxisId="right" dataKey="count" barSize={20} fill="#3b82f6" opacity={0.3} radius={[4, 4, 0, 0]} />

          {/* Win Rate Trend */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="win_rate"
            stroke="#087f72"
            strokeWidth={3}
            dot={{ r: 4, fill: '#087f72' }}
            activeDot={{ r: 6, fill: '#142a40' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
