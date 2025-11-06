import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip, LabelList } from 'recharts';
import LegendItem from './LegendItem';

export type FunnelDatum = { stage: string; count: number; viz: number; color: string };
export type FunnelFilter = { connected: boolean; fresh: boolean; followup: boolean };

export default function FunnelConversion({ data, filter, onToggle }: { data: FunnelDatum[]; filter: FunnelFilter; onToggle: (key: keyof FunnelFilter) => void; }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark') || window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    check();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = () => check();
    mq?.addEventListener?.('change', handler);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => { mq?.removeEventListener?.('change', handler); obs.disconnect(); };
  }, []);

  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3">Call To Lead Conversion Ratio</div>
      <div className="h-[24rem] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%" className="max-w-3xl">
          <FunnelChart margin={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <defs>
              <linearGradient id="funnelA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="funnelB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="funnelC" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <Tooltip formatter={(v: any, _n: any, p: any) => [p?.payload?.count ?? v, `${p?.payload?.stage ?? ''}`]} contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} cursor={{ fill: 'transparent' }} />
            <Funnel dataKey="viz" data={data.map((d) => ({ ...d, fill: d.color }))} isAnimationActive={false}>
              <LabelList position="center" dataKey="count" fill={isDark ? '#F8FAFC' : '#111827'} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <LegendItem color="#f59e0b" label="Connected Calls" active={filter.connected} onClick={() => onToggle('connected')} />
        <LegendItem color="#10b981" label="Fresh Calls" active={filter.fresh} onClick={() => onToggle('fresh')} />
        <LegendItem color="#6366f1" label="Follow-up Calls" active={filter.followup} onClick={() => onToggle('followup')} />
      </div>
    </div>
  );
}
