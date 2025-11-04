type Props = {
  summary: string;
};


function getBullets(text: string, maxItems = 6) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [] as string[];
  // naive sentence split
  const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.slice(0, maxItems);
}

export default function SummaryPanel({ summary }: Props) {
  const bullets = getBullets(summary);

  if (!summary) {
    return <div className="text-sm muted">No summary provided.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="text-sm font-semibold font-display mb-2">Full Summary</div>
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <p className="text-[14.5px] leading-7 whitespace-pre-wrap">{summary}</p>
        </div>
      </div>

      <div className="rounded-xl p-3 border border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="text-sm font-semibold font-display mb-2">Key Points</div>
        <ul className="list-disc pl-5 space-y-1 text-sm leading-6">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
