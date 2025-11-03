import { useMemo, useRef, useState } from 'react';

export default function SentimentChart({ timeline, summary, series }) {
  const multi = Array.isArray(series) && series.length;
  const wrapRef = useRef(null);
  const [tip, setTip] = useState({ show: false, x: 0, y: 0, items: [], xVal: 0 });

  const singleData = useMemo(() => {
    const arr = Array.isArray(timeline) ? timeline : [];
    if (!arr.length) return [];
    return arr
      .map((d, i) => {
        if (typeof d === 'number') return { x: i, y: d };
        if (typeof d === 'object' && d) {
          const y = d.overall ?? d.value ?? d.score ?? d.sentiment ?? 0;
          const x = d.time ?? d.t ?? i;
          return { x: Number(x) || i, y: Number(y) || 0 };
        }
        return { x: i, y: 0 };
      })
      .sort((a, b) => a.x - b.x);
  }, [timeline]);

  const hasAnyLine = useMemo(() => {
    if (multi) {
      return series.some((s) => Array.isArray(s.data) && s.data.some(d => Math.abs(Number(d.y) || 0) > 0.0001));
    }
    return singleData.length && singleData.some(d => Math.abs(Number(d.y) || 0) > 0.0001);
  }, [multi, series, singleData]);

  if (!hasAnyLine) {
    const pos = Number(summary?.positive ?? 0);
    const neg = Number(summary?.negative ?? 0);
    const neu = Number(summary?.neutral ?? 0);
    const Row = ({ color, label, val, icon }) => (
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="inline-flex items-center gap-1">{icon}{label}</span>
          <span>{val}%</span>
        </div>
        <div className="w-full h-2 rounded bg-neutral-800 overflow-hidden">
          <div className="h-2" style={{ width: `${Math.max(0, Math.min(100, val))}%`, backgroundColor: color }} />
        </div>
      </div>
    );
    return (
      <div className="max-w-xl">
        <div className="text-xs text-neutral-400 mb-2">Timeline not available.</div>
        <Row color="#22c55e" label="Positive" val={pos} icon={<span>😄</span>} />
        <Row color="#f43f5e" label="Negative" val={neg} icon={<span>😡</span>} />
        <Row color="#94a3b8" label="Neutral" val={neu} icon={<span>😐</span>} />
      </div>
    );
  }

  const width = 640; const height = 260; const pad = 36;
  const useSeries = multi ? series : [{ name: 'Sentiment', color: '#60a5fa', data: singleData }];
  const xsAll = useSeries.flatMap(s => s.data.map(d => d.x));
  const ysAll = useSeries.flatMap(s => s.data.map(d => d.y));
  const xMin = Math.min(...xsAll), xMax = Math.max(...xsAll);
  const yMin = Math.min(...ysAll, -1), yMax = Math.max(...ysAll, 1);
  const xScale = (x) => pad + (xMax === xMin ? 0 : (x - xMin) / (xMax - xMin)) * (width - pad * 2);
  const yScale = (y) => height - pad - (yMax === yMin ? 0 : (y - yMin) / (yMax - yMin)) * (height - pad * 2);
  const zeroY = yScale(0);
  const posCut = 0.33, negCut = -0.33;
  const posY = yScale(posCut);
  const negY = yScale(negCut);

  function onMove(e){
    const rect = (wrapRef.current?.getBoundingClientRect && wrapRef.current.getBoundingClientRect()) || e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // convert mx to domain x
    const xDom = (mx - pad) / (width - pad * 2) * (xMax - xMin) + xMin;
    if (!isFinite(xDom)) return setTip(t => ({ ...t, show: false }));
    const items = useSeries.map(s => {
      // nearest point by x
      let nearest = null; let best = Infinity;
      for (const d of s.data){
        const diff = Math.abs(d.x - xDom);
        if (diff < best){ best = diff; nearest = d; }
      }
      if (!nearest) return null;
      return {
        name: s.name,
        color: s.color,
        x: nearest.x,
        y: nearest.y,
        xPx: xScale(nearest.x),
        yPx: yScale(nearest.y),
      };
    }).filter(Boolean);
    const xPx = items.length ? items[0].xPx : xScale(xDom);
    setTip({ show: true, x: xPx, y: my, items, xVal: xDom });
  }

  function onLeave(){ setTip(t => ({ ...t, show: false })); }

  return (
    <div className="overflow-x-auto relative" ref={wrapRef}>
      <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-300 mb-2">
        <span className="inline-flex items-center gap-1"><span>📈</span> Sentiment timeline</span>
        <div className="flex items-center gap-3">
          {useSeries.map((s,i)=> (
            <span key={i} className="inline-flex items-center gap-1"><span className="inline-block w-3 h-1.5 rounded" style={{ backgroundColor: s.color }} />{s.name}</span>
          ))}
        </div>
      </div>
      <svg width={width} height={height} className="rounded-md border bg-neutral-100 border-neutral-200 dark:bg-neutral-900/40 dark:border-neutral-800" onMouseMove={onMove} onMouseLeave={onLeave}>
        {/* guide lines */}
        <line x1={pad} y1={posY} x2={width - pad} y2={posY} stroke="#34d399" strokeDasharray="6 6" opacity="0.6" />
        <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke="#94a3b8" strokeDasharray="6 6" opacity="0.6" />
        <line x1={pad} y1={negY} x2={width - pad} y2={negY} stroke="#f43f5e" strokeDasharray="6 6" opacity="0.6" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="var(--chart-grid)" />
        {/* emoji markers */}
        <text x={pad - 18} y={posY + 4} fontSize="14" textAnchor="end">😄</text>
        <text x={pad - 18} y={zeroY + 4} fontSize="14" textAnchor="end">😐</text>
        <text x={pad - 18} y={negY + 4} fontSize="14" textAnchor="end">😡</text>
        {useSeries.map((s, si) => {
          const path = s.data
            .sort((a,b)=>a.x-b.x)
            .map((d, i) => `${i ? 'L' : 'M'}${xScale(d.x)},${yScale(d.y)}`)
            .join(' ');
          return (
            <g key={si}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="1.5" />
              {s.data.map((d, i) => (
                <circle key={i} cx={xScale(d.x)} cy={yScale(d.y)} r="1.5" fill={s.color} />
              ))}
            </g>
          );
        })}
        {/* labels for cutoffs */}
        <text x={width - pad + 4} y={posY + 3} fill="#34d399" fontSize="10">0.33</text>
        <text x={width - pad + 4} y={zeroY + 3} fill="var(--chart-tick)" fontSize="10">0</text>
        <text x={width - pad + 4} y={negY + 3} fill="#f43f5e" fontSize="10">-0.33</text>
        <text x={pad} y={pad - 8} fill="var(--chart-tick)" fontSize="10">Sentiment over time</text>
        <text x={width - pad} y={height - 6} fill="var(--chart-tick)" fontSize="10" textAnchor="end">Time</text>
        {/* hover crosshair */}
        {tip.show && (
          <g>
            <line x1={tip.x} y1={pad} x2={tip.x} y2={height - pad} stroke="#64748b" strokeDasharray="4 4" />
            {tip.items.map((it, i)=> (
              <circle key={i} cx={it.xPx} cy={it.yPx} r="3" fill={it.color} />
            ))}
          </g>
        )}
      </svg>
      {tip.show && (
        <div style={{ position: 'absolute', left: Math.min(Math.max(tip.x + 10, 0), width - 180), top: Math.max(tip.y + 10, 0) }} className="pointer-events-none rounded-md px-2 py-1 text-xs shadow border bg-[var(--chart-tooltip-bg)] text-[var(--chart-tick)] border-[var(--chart-tooltip-border)]">
          <div className="mb-1 opacity-80">t: {tip.items[0]?.x?.toFixed ? tip.items[0].x.toFixed(2) : String(tip.items[0]?.x ?? '')}s</div>
          {tip.items.map((it,i)=> (
            <div key={i} className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: it.color }} />
              <span className="min-w-[72px]">{it.name}</span>
              <span className="font-mono">{(Number(it.y)*100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
