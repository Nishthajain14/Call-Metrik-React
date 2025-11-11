import React from 'react';

export default function AgentTimeline({ users, dates, grid, scoreType, month, onChangeScoreType, onChangeMonth }: { users: string[]; dates: string[]; grid: any[][]; scoreType: string; month: string; onChangeScoreType: (v: string) => void; onChangeMonth: (v: string) => void; }) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
        <div className="font-semibold font-display">Agent Performance Timeline</div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <select value={scoreType} onChange={(e) => onChangeScoreType(e.target.value)} className="input rounded-md w-full sm:w-auto">
            <option>OFE Score</option>
            <option>Weighted Score</option>
          </select>
          <select value={month} onChange={(e) => onChangeMonth(e.target.value)} className="input rounded-md w-full sm:w-auto">
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      {dates.length && users.length ? (
        <div className="relative overflow-auto mx-auto">
          <div className="min-w-[640px] sm:min-w-[820px]">
            <div className="grid" style={{ gridTemplateColumns: `min(140px, 32vw) repeat(${dates.length}, 1fr)`, paddingTop: 28 }}>
              <div className="sticky top-0 left-0 z-20 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40" style={{ height: 28 }} />
              {dates.map((d) => (
                <div key={d} className="sticky top-0 z-10 text-[9px] sm:text-[10px] text-neutral-600 text-center py-1 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:text-neutral-300 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40">
                  {new Date(d).getDate().toString().padStart(2, '0')}
                </div>
              ))}
              {users.map((u, ri) => (
                <React.Fragment key={`${u}-row`}>
                  <div className="sticky left-0 z-10 text-[11px] sm:text-xs text-neutral-900 py-1 pr-3 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:text-neutral-200 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40 overflow-hidden text-ellipsis whitespace-nowrap" style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                    {u}
                  </div>
                  {grid[ri]?.map?.((val: any, ci: number) => {
                    const hasData = !(val === '-' || val === null || val === undefined || val === '');
                    const v = hasData ? (Number(val) || 0) : 0;
                    // Multi-stop gradient across ranges: 0-15-30-45-60-80-95-100
                    const stops = [0, 15, 30, 45, 60, 80, 95, 100].map(x => x / 100);
                    const H = [0, 10, 25, 40, 60, 85, 105, 120];
                    const S = [85, 85, 84, 82, 80, 75, 70, 65];
                    const L = [55, 54, 53, 52, 50, 50, 52, 54];
                    const t = Math.max(0, Math.min(1, v / 100));
                    let h = H[0], s = S[0], l = L[0];
                    if (hasData) {
                      for (let i = 0; i < stops.length - 1; i++) {
                        const a = stops[i], b = stops[i + 1];
                        if (t >= a && t <= b) {
                          const p = (t - a) / (b - a);
                          const lerp = (x: number, y: number) => x + (y - x) * p;
                          h = lerp(H[i], H[i + 1]);
                          s = lerp(S[i], S[i + 1]);
                          l = lerp(L[i], L[i + 1]);
                          break;
                        }
                      }
                    }
                    const bg = hasData ? `hsl(${h}deg ${s}% ${l}%)` : 'var(--chart-grid)';
                    const title = hasData ? `${u} • ${dates[ci]}: ${v}%` : `${u} • ${dates[ci]}: No data`;
                    return (
                      <div key={`${u}-${ci}`} className="h-4 sm:h-5 mx-0.5 sm:mx-[2px] my-1 sm:my-[3px] rounded-md shadow-sm transition-transform duration-150" style={{ background: bg }} title={title} onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')} />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 sm:gap-3 justify-center sm:justify-end">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Low</span>
            <div
              className="h-2 w-24 sm:w-40 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg,' +
                  'hsl(0 85% 55%) 0%,' +
                  'hsl(10 85% 54%) 15%,' +
                  'hsl(25 84% 53%) 30%,' +
                  'hsl(40 82% 52%) 45%,' +
                  'hsl(60 80% 50%) 60%,' +
                  'hsl(85 75% 50%) 80%,' +
                  'hsl(105 70% 52%) 95%,' +
                  'hsl(120 65% 54%) 100%)'
              }}
            />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">High</span>
            <div className="ml-2 flex items-center gap-1">
              <div className="h-2 w-4 rounded" style={{ background: 'var(--chart-grid)' }} />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">No data</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm muted">No timeline data</div>
      )}
    </div>
  );
}
