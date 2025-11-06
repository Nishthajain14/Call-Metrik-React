import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart, Line } from 'recharts';
import { AreaChart, Area } from 'recharts';

function DatewiseTooltip(props: any){
  const { active, label, payload } = props || {};
  if (!active || !payload || !payload.length) return null;
  const v = Number(payload[0]?.value ?? 0);
  return (
    <div style={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ color: 'var(--chart-tick)', fontWeight: 600, marginBottom: 4 }}>{String(label)}</div>
      <div style={{ color: '#7c3aed' }}>count : {v.toLocaleString()}</div>
    </div>
  );
}

export default function DatewiseCountsCard({ data, viewRaw, setViewRaw }: { data: any[]; viewRaw: string; setViewRaw: (v: string) => void }){
  return (
    <div className="card-elevated p-4 hover-lift ambient">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 glass surface rounded-lg px-3 py-2">
        <div className="font-semibold font-display inline-flex items-center gap-2"><TrendingUp size={16} /> Datewise Counts</div>
        <div className="max-w-full overflow-x-auto hide-scrollbar pt-0.5">
          <div className="segmented" style={{ minWidth: 'max-content' }}>
            {(['Monthly','Weekly','Daily'] as const).map((v)=> (
              <button key={v} className={viewRaw===v? 'active' : ''} onClick={()=> setViewRaw(v)}>{v}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-56 sm:h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="dateArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8058f7ff" stopOpacity="0.85" />
                <stop offset="80%" stopColor="#7a49c9ff" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#53189cff" stopOpacity="0.0" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
            <Tooltip content={<DatewiseTooltip />} />
            <Area type="monotone" dataKey="count" stroke="none" fill="url(#dateArea)" isAnimationActive animationDuration={700} />
            <Line type="monotone" dataKey="count" stroke="#9d45e5ff" strokeOpacity={0.35} strokeWidth={6} dot={false} isAnimationActive animationDuration={700} filter="url(#softGlow)" />
            <Line type="monotone" dataKey="count" stroke="#9d45e5ff" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={700} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
