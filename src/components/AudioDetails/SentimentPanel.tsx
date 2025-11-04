import SentimentChart from './SentimentChart';

export default function SentimentPanel({ sentiment }) {
  const sentences = Array.isArray(sentiment?.sentences) ? sentiment.sentences : [];
  return (
    <div className="space-y-4">
      <div className="text-sm">Neutral: {sentiment?.neutral ?? 0}% &nbsp; Negative: {sentiment?.negative ?? 0}% &nbsp; Positive: {sentiment?.positive ?? 0}%</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3">
          <SentimentChart timeline={sentiment?.timeline} summary={sentiment} series={sentiment?.series} />
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-display text-neutral-600 dark:text-neutral-300 mb-2">Sentence-level sentiment</div>
          <div className="max-h-72 overflow-auto space-y-2 pr-1">
            {sentences.length ? sentences.map((s, i) => (
              <div key={i} className={`p-2 rounded-md border bg-neutral-100 dark:bg-neutral-900/40 ${s.label==='POSITIVE' ? 'border-emerald-300 dark:border-emerald-800/60' : s.label==='NEGATIVE' ? 'border-rose-300 dark:border-rose-800/60' : 'border-neutral-200 dark:border-neutral-800'}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-base leading-none">{s.label==='POSITIVE' ? '😄' : s.label==='NEGATIVE' ? '😡' : '😐'}</span>
                    <span className="font-medium">{s.speaker || 'Speaker'}</span>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">{s.start} – {s.end}</span>
                </div>
                <div className="text-sm text-neutral-800 dark:text-neutral-200">{s.text}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{s.label ?? ''} {typeof s.score==='number' ? `(${s.score.toFixed(3)})` : ''}</div>
              </div>
            )) : (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">No sentence-level sentiments available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
