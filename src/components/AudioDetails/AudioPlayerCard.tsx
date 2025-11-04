export default function AudioPlayerCard({ audioId, rate, setRate, audioUrl, onDownload, audioRef }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-[60%]" title={String(audioId)}>
          
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-xs text-neutral-600 dark:text-neutral-400">Speed</div>
          <div className="inline-flex rounded-md overflow-hidden border border-neutral-300 dark:border-neutral-700">
            <button className={`px-2 py-1 text-xs ${rate === 1 ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white' : 'bg-white text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'}`} onClick={() => setRate(1)}>1x</button>
            <button className={`px-2 py-1 text-xs ${rate === 1.5 ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white' : 'bg-white text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'}`} onClick={() => setRate(1.5)}>1.5x</button>
            <button className={`px-2 py-1 text-xs ${rate === 2 ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white' : 'bg-white text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'}`} onClick={() => setRate(2)}>2x</button>
          </div>
          {audioUrl && (
            <button onClick={onDownload} className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-md bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700" title="Download audio">
              <span role="img" aria-label="download">⬇️</span>
            </button>
          )}
        </div>
      </div>
      <audio ref={audioRef} controls src={audioUrl || undefined} className="w-full" />
    </div>
  );
}
