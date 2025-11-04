type Props = {
  text: string;
  audioRef?: any;
};

function hmsToSeconds(hms: string) {
  const parts = String(hms || '0').split(':').map((x) => Number(x) || 0);
  // supports H:MM:SS or MM:SS
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0] || 0, parts[1] || 0];
  return h * 3600 + m * 60 + s;
}

export default function TranscriptionPanel({ text, audioRef }: Props) {
  const raw = String(text || '').trim();
  // Try to parse lines like: [0:00:11 - 0:00:13] Agent: Yes. What is your name?
  // or [00:00:11 - 00:00:13] Customer: Hello
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = [] as Array<{ speaker: string; from: number; to?: number; content: string; fromText: string }>; 
  const re = /^\s*\[(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}))?\]\s*(Agent|Customer)\s*:\s*(.*)$/i;
  for (const l of lines) {
    const m = l.match(re);
    if (m) {
      const fromText = m[1];
      const toText = m[2];
      const speaker = m[3];
      const content = m[4];
      rows.push({ speaker, from: hmsToSeconds(fromText), to: toText ? hmsToSeconds(toText) : undefined, content, fromText });
    }
  }

  if (!rows.length) {
    return <pre className="whitespace-pre-wrap text-sm leading-6">{raw || '-'}</pre>;
  }

  function seek(t: number) {
    try {
      const el = audioRef?.current as HTMLAudioElement | undefined;
      if (!el) return;
      el.currentTime = Math.max(0, t - 0.1);
      el.play?.();
    } catch {}
  }

  return (
    <div className="space-y-3">
      {rows.map((r, i) => {
        const isAgent = /agent/i.test(r.speaker || '');
        const align = isAgent ? 'items-end justify-end' : 'items-start justify-start';
        const bubbleColor = isAgent
          ? 'bg-violet-500/85 text-white dark:bg-violet-500/70'
          : 'bg-teal-500/85 text-white dark:bg-teal-500/70';
        const avatarBg = isAgent ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200' : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200';
        const initial = (r.speaker || '?').trim().charAt(0).toUpperCase();
        return (
          <div key={i} className={`w-full flex ${align} gap-2`}>
            {!isAgent && (
              <div className={`mt-1 h-7 w-7 rounded-full ${avatarBg} flex items-center justify-center text-xs font-medium font-display select-none`}>{initial}</div>
            )}
            <button
              type="button"
              onClick={() => seek(r.from)}
              title={`Play from ${r.fromText}`}
              className={`max-w-[78%] text-left rounded-2xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400 ${bubbleColor}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] opacity-85 font-display">{r.speaker}</span>
                <span className="text-[11px] font-mono/\[0.95\] opacity-75">{r.fromText}</span>
              </div>
              <div className="mt-1 text-[13.5px] leading-6 font-body">{r.content}</div>
            </button>
            {isAgent && (
              <div className={`mt-1 h-7 w-7 rounded-full ${avatarBg} flex items-center justify-center text-xs font-medium font-display select-none`}>{initial}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
