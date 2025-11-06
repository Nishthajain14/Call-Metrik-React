import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function CallTimeDistribution({ data }: { data: Array<{ range: string; count: number }> }) {
  return (
    <div className="card-elevated p-4 hover-lift ambient">
      <div className="font-semibold font-display mb-3">Call Time Distribution</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="barA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7"/>
                <stop offset="100%" stopColor="#6366f1"/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="count" fill="url(#barA)" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
