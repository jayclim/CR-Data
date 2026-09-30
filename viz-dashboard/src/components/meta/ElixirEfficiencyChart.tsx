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
    <div className="w-full h-[400px] bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex flex-wrap items-center gap-2">
        Elixir and outcomes
        <span className="text-xs font-normal text-[var(--muted)] bg-[#0b1829] px-2 py-1 rounded">
          Win Rate by Avg Deck Elixir
        </span>
      </h3>

      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#28415b" vertical={false} />
          <XAxis
            dataKey="elixir"
            stroke="#a4b8ce"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickCount={10}
            label={{ value: 'Avg Elixir Cost', position: 'bottom', offset: 0, fill: '#a4b8ce' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#ffd166"
            domain={['auto', 'auto']}
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#ffd166' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#48bdff"
            label={{ value: 'Usage Count', angle: 90, position: 'insideRight', fill: '#48bdff' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#101f33', border: '1px solid #28415b', borderRadius: '8px', color: '#eaf4ff' }}
            labelStyle={{ color: '#eaf4ff', fontWeight: 'bold' }}
            itemStyle={{ color: '#eaf4ff' }}
            formatter={(value: number, name: string) => [
              name === 'win_rate' ? `${value}%` : value,
              name === 'win_rate' ? 'Win Rate' : 'Decks'
            ]}
          />
          {/* Usage Volume */}
          <Bar yAxisId="right" dataKey="count" barSize={20} fill="#48bdff" opacity={0.5} radius={[4, 4, 0, 0]} />

          {/* Win Rate Trend */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="win_rate"
            stroke="#ffd166"
            strokeWidth={3}
            dot={{ r: 4, fill: '#ffd166' }}
            activeDot={{ r: 6, fill: '#fff2c2', stroke: '#ffd166', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
