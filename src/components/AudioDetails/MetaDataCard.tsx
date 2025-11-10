export default function MetaDataCard({ insights }) {
  const langs = Array.isArray(insights?.language) ? insights?.language?.filter(Boolean) : [insights?.language]?.filter(Boolean);
  
  const customer = Number(insights?.talkListen?.customer ?? NaN);
  const agent = Number(insights?.talkListen?.agent ?? NaN);
  const fmtPct = (n: number) => (isFinite(n) ? `${n.toFixed(2)}%` : '-');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Info card */}
      <div className="card p-4 lg:col-span-2">
        <div className="text-base md:text-lg font-semibold font-display mb-3">Meta Data</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="sm:col-span-2"><MetaItem k="File Name" v={insights?.fileName || '-'} /></div>
          <MetaItem k="File Type" v={insights?.fileType || '-'} />
          <MetaItem k="File Size" v={insights?.fileSize || '-'} />
          <MetaItem k="Duration (HH:MM:SS)" v={insights?.fileDuration || '-'} />
          {/* Agent Name moved to right KPI card */}
          <div className="flex items-center gap-2"><span className="muted">Upload Source</span>: {insights?.uploadSource ? (
            <a href={insights.uploadSource} target="_blank" rel="noreferrer" className="text-brand-600" title={String(insights.uploadSource)}>🔗</a>
          ) : (
            <span>-</span>
          )}
          </div>
          <MetaItem k="Create Date" v={insights?.createdDate || '-'} />
          <MetaItem k="Audio ID" v={insights?.audioId || '-'} />
          <MetaItem k="Call Status" v={insights?.callStatus || '-'} />
          <div className="sm:col-span-2 flex items-center gap-2">
            <span className="muted">Language (translated)</span>:
            {langs?.length ? (
              <span>[{langs.map((l) => String(l)).join(', ')}]</span>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI card */}
      <div className="card p-4">
        <div className="text-base md:text-lg font-semibold font-display mb-3">Scores</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="muted">Agent Name</span>
            <span className="text-sm md:text-base font-body">{insights?.executiveName || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted">Agent Score</span>
            <span className="text-sm md:text-base font-body">{fmtPct(Number(insights?.executiveScore))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="muted">Weighted Score</span>
            <span className="text-sm md:text-base font-body">{fmtPct(Number(insights?.executiveWeightedScore))}</span>
          </div>
          <div className="text-sm font-semibold font-display">Talk to Listen</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg px-3 py-2 border border-neutral-200 bg-neutral-50 dark:bg-neutral-900/60 dark:border-neutral-800">
              <div className="text-xs muted">Customer</div>
              <div className="text-sm md:text-base font-body">{fmtPct(customer)}</div>
            </div>
            <div className="rounded-lg px-3 py-2 border border-neutral-200 bg-neutral-50 dark:bg-neutral-900/60 dark:border-neutral-800">
              <div className="text-xs muted">Agent</div>
              <div className="text-sm md:text-base font-body">{fmtPct(agent)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ k, v, href, mono, strong }: { k: string; v: any; href?: string; mono?: boolean; strong?: boolean }) {
  const Val = () => <span className={`${mono ? 'font-mono text-xs' : strong ? 'font-semibold' : ''}`}>{v}</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="muted">{k}</span>: {href ? <a href={href} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline"><Val /></a> : <Val />}
    </div>
  );
}
