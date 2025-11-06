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
            <ZAxis type="number" dataKey="z" range={[40, 140]} />
            {
              (() => {
                const data = donutData || [];
                const pos = data.find(d => d.name === 'Positive')?.value ?? 0;
                const neg = data.find(d => d.name === 'Negative')?.value ?? 0;
                const neu = data.find(d => d.name === 'Neutral')?.value ?? 0;
                const items = [
                  { name: 'Positive', value: pos, fill: '#22c55e' },
                  { name: 'Neutral', value: neu, fill: '#60a5fa' },
                  { name: 'Negative', value: neg, fill: '#ef4444' },
                ];

                // Radius in px based on percentage with sqrt scaling for perceptual balance
                const rMin = 26; // px
                const rMax = 84; // px (fits within h-72 with padding)
                const radiusFromPct = (v:number) => {
                  const t = Math.max(0, Math.min(1, (v||0)/100));
                  return rMin + (rMax - rMin) * Math.sqrt(t);
                };

                const scale = 0.92; // slight shrink for consistent edge padding
                const withR = items.map((it) => ({ ...it, r: radiusFromPct(it.value||0) * scale }));
                // Determine main (largest) bubble
                const main = withR.slice().sort((a,b)=> (b.value||0) - (a.value||0))[0];
                const others = withR.filter((it)=> it.name !== main.name);

                // Convert px displacement to chart percent (approx) so it scales responsively.
                // ResponsiveContainer height ~ 288px (h-72). 1% ~ 2.88px ≈ 3px for simplicity.
                const pxToPct = (px:number) => px / 3;

                // Center largest; place others around it using polar offsets for a natural overlap.
                const c0 = { x: 46, y: 55 };
                const placeAround = (radiusMain:number, radiusChild:number, angleDeg:number, tightness:number, overlapFactor:number = 0.35) => {
                  const angle = (Math.PI/180) * angleDeg;
                  // Allow a small controlled overlap based on child radius (clean aesthetic)
                  const overlap = Math.max(6, Math.min(22, radiusChild * overlapFactor)); // px
                  const d = Math.max(radiusMain + radiusChild - overlap, radiusMain * tightness);
                  const dx = Math.cos(angle) * d;
                  const dy = Math.sin(angle) * d;
                  // Equal padding from edges based on circle size + fixed margin
                  const padPct = pxToPct(12);
                  const childPct = pxToPct(radiusChild);
                  const minPct = padPct + childPct;
                  const maxPct = 100 - minPct;
                  const x = Math.min(maxPct, Math.max(minPct, c0.x + pxToPct(dx)));
                  const y = Math.min(maxPct, Math.max(minPct, c0.y + pxToPct(dy)));
                  return { x, y };
                };
                // Desired angles: Positive (green) upper-right, Negative (red) lower-left
                const angleFor = (name:string) => name === 'Positive' ? 12 : name === 'Negative' ? 200 : -26;
                const overlapFor = (name:string) => name === 'Positive' ? 0.60 : name === 'Negative' ? 0.38 : 0.35;
                const childTightness = 0.56;
                const bubbles = [
                  { name: main.name, value: main.value, x: c0.x, y: c0.y, r: main.r, z: main.value, fill: main.fill },
                  ...others.map((o)=>{
                    const a = angleFor(o.name);
                    const c = placeAround(main.r, o.r, a, childTightness, overlapFor(o.name));
                    return { name: o.name, value: o.value, x: c.x, y: c.y, r: o.r, z: o.value, fill: o.fill };
                  })
                ];
                const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
                const labelColor = isDark ? '#ffffff' : '#111827';
                return (
                  <Scatter data={bubbles} shape={(props: any) => {
                    const { cx, cy, fill, node } = props as any;
                    const r = (node && node.radius) ? node.radius : (props?.payload?.r ?? 24);
                    return (
                      <g filter="url(#bubbleShadow)">
                        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.9} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(14, r * 0.46)} fill={labelColor}>
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
