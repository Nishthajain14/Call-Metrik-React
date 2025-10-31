export default function AudioPlayerCard({ audioId, rate, setRate, audioUrl, onDownload, audioRef }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-sm break-all">{audioId}</div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-xs text-neutral-400">Speed</div>
          <div className="inline-flex rounded-md overflow-hidden border border-neutral-700">
            <button className={`px-2 py-1 text-xs ${rate === 1 ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-300'}`} onClick={() => setRate(1)}>1x</button>
            <button className={`px-2 py-1 text-xs ${rate === 1.5 ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-300'}`} onClick={() => setRate(1.5)}>1.5x</button>
            <button className={`px-2 py-1 text-xs ${rate === 2 ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-300'}`} onClick={() => setRate(2)}>2x</button>
          </div>
          {audioUrl && (
            <button onClick={onDownload} className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 hover:bg-neutral-700" title="Download audio">
              <span role="img" aria-label="download">⬇️</span>
            </button>
          )}
        </div>
      </div>
      <audio ref={audioRef} controls src={audioUrl || undefined} className="w-full" />
    </div>
  );
}
