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
                    const v = val === '-' ? 0 : Number(val) || 0;
                    let t = Math.max(0, Math.min(1, v / 100));
                    t = Math.pow(t, 0.5);
                    const hue = 250 - 190 * t;
                    const sat = 70 + 20 * t;
                    const light = 88 - 38 * t;
                    const bg = v ? `hsl(${hue}deg ${sat}% ${light}%)` : 'var(--chart-grid)';
                    return (
                      <div key={`${u}-${ci}`} className="h-4 sm:h-5 mx-0.5 sm:mx-[2px] my-1 sm:my-[3px] rounded-md shadow-sm transition-transform duration-150" style={{ background: bg }} title={`${u} • ${dates[ci]}: ${v}%`} onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')} />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 sm:gap-3 justify-center sm:justify-end">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Low</span>
            <div className="h-2 w-24 sm:w-40 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(40,80,160) 0%, rgb(180,160,60) 50%, rgb(180,220,80) 100%)' }} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">High</span>
          </div>
        </div>
      ) : (
        <div className="text-sm muted">No timeline data</div>
      )}
    </div>
  );
}
