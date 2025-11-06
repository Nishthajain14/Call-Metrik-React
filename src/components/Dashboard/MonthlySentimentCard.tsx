import React from 'react';
import { TrendingUp } from 'lucide-react';
import Info from './Info';
import { ResponsiveContainer, CartesianGrid, Tooltip, Legend, XAxis, YAxis } from 'recharts';
import { AreaChart, Area } from 'recharts';

export default function MonthlySentimentCard({ data }: { data: any[] }){
  return (
    <div className="card-elevated p-4 lg:col-span-2 hover-lift hide-legend-xs">
      <div className="font-semibold font-display mb-3 flex items-center glass surface rounded-lg px-3 py-2">
        <span className="inline-flex items-center gap-2"><TrendingUp size={16} /> Monthly Sentiment Analysis</span>
        <Info text="Shows monthly sentiment trends based on the analysed audio for each month" />
      </div>
      <div className="h-64 sm:h-72 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="90%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="90%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#31639fff" stopOpacity={0.3} />
                <stop offset="90%" stopColor="#31639fff" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
            <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="url(#gPos)" isAnimationActive animationDuration={700} />
            <Area type="monotone" dataKey="neutral" stroke="#31639fff" fill="url(#gNeu)" isAnimationActive animationDuration={700} />
            <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#gNeg)" isAnimationActive animationDuration={700} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
