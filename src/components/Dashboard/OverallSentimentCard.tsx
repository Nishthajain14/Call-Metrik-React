import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';
import Info from './Info';
import { ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ScatterChart, Scatter, ZAxis } from 'recharts';

export default function OverallSentimentCard({ donutData }: { donutData: { name: string; value: number }[] }){
  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3 flex items-center glass surface rounded-lg px-3 py-2">
        <span className="inline-flex items-center gap-2"><PieIcon size={16} /> Overall Sentiment</span>
        <Info text="Positive vs Neutral vs Negative sentiment split" />
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <defs>
              <filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
              </filter>
            </defs>
            <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
            <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
            <ZAxis type="number" dataKey="z" range={[30, 110]} />
            {
              (() => {
                const data = donutData || [];
                const pos = data.find(d => d.name === 'Positive')?.value ?? 0;
                const neg = data.find(d => d.name === 'Negative')?.value ?? 0;
                const neu = data.find(d => d.name === 'Neutral')?.value ?? 0;
                const base = [
                  { name: 'Positive', value: pos, fill: '#22c55e' },
                  { name: 'Neutral', value: neu, fill: '#60a5fa' },
                  { name: 'Negative', value: neg, fill: '#ef4444' },
                ].sort((a,b)=> (b.value||0) - (a.value||0));
                const centers = [
                  { x: 50, y: 50 },
                  { x: 63, y: 42 },
                  { x: 57, y: 64 },
                ];
                const toRadius = (v:number) => {
                  const t = Math.max(0, Math.min(1, v/100));
                  return 18 + 42 * Math.sqrt(t);
                };
                const bubbles = base.map((b, i) => ({
                  name: b.name,
                  x: centers[i]?.x ?? 50 + i * 4,
                  y: centers[i]?.y ?? 50 + i * 4,
                  z: b.value,
                  value: b.value,
                  r: toRadius(b.value || 0),
                  fill: b.fill,
                }));
                return (
                  <Scatter data={bubbles} shape={(props: any) => {
                    const { cx, cy, fill, node } = props as any;
                    const r = (node && node.radius) ? node.radius : (props?.payload?.r ?? 24);
                    return (
                      <g filter="url(#bubbleShadow)">
                        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.9} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, r * 0.42)} fill="#ffffff">
                          {`${Math.round((props?.payload?.value ?? 0))}%`}
                        </text>
                      </g>
                    );
                  }} />
                );
              })()
            }
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
