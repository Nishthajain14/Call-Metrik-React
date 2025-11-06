import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PeakCallHours({ data }: { data: Array<{ range: string; count: number }> }) {
  return (
    <div className="card-elevated p-4 hover-lift ambient">
      <div className="font-semibold font-display mb-3">Peak Call Hours</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="peakArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="90%" stopColor="#7c3aed" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} cursor={{ stroke: '#7c3aed', strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#peakArea)" isAnimationActive animationDuration={900} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
