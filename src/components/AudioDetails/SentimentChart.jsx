import { useMemo } from 'react';

export default function SentimentChart({ timeline, summary }) {
  const data = useMemo(() => {
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

  const hasLine = data.length && (() => {
    const ys = data.map((d) => d.y);
    const maxAbs = Math.max(...ys.map((y) => Math.abs(Number(y) || 0)));
    return maxAbs > 0.0001;
  })();

  if (!hasLine) {
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
        <div className="text-xs text-neutral-400 mb-2">Timeline not available from API. Showing distribution.</div>
        <Row color="#22c55e" label="Positive" val={pos} icon={<span>🙂</span>} />
        <Row color="#f43f5e" label="Negative" val={neg} icon={<span>🙁</span>} />
        <Row color="#94a3b8" label="Neutral" val={neu} icon={<span>😐</span>} />
      </div>
    );
  }

  const width = 560; const height = 220; const pad = 28;
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys, -1), yMax = Math.max(...ys, 1);
  const xScale = (x) => pad + (xMax === xMin ? 0 : (x - xMin) / (xMax - xMin)) * (width - pad * 2);
  const yScale = (y) => height - pad - (yMax === yMin ? 0 : (y - yMin) / (yMax - yMin)) * (height - pad * 2);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${xScale(d.x)},${yScale(d.y)}`).join(' ');
  const zeroY = yScale(0);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 text-xs text-neutral-300 mb-2">
        <span className="inline-flex items-center gap-1"><span>📈</span> Sentiment timeline</span>
        <span className="text-neutral-500">(baseline 0 dotted)</span>
      </div>
      <svg width={width} height={height} className="bg-neutral-900/40 rounded-md border border-neutral-800">
        <defs>
          <linearGradient id="sentigrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} stroke="#475569" strokeDasharray="4 4" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#475569" />
        <path d={`${path} L ${xScale(xMax)},${yScale(0)} L ${xScale(xMin)},${yScale(0)} Z`} fill="url(#sentigrad)" />
        <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" />
        {data.map((d, i) => (
          <circle key={i} cx={xScale(d.x)} cy={yScale(d.y)} r="2" fill="#60a5fa" />
        ))}
        <text x={pad} y={pad - 8} fill="#94a3b8" fontSize="10">Sentiment over time</text>
        <text x={width - pad} y={height - 6} fill="#94a3b8" fontSize="10" textAnchor="end">Time</text>
      </svg>
    </div>
  );
}
