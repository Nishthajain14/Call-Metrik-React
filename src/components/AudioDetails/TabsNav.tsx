export default function TabsNav({ tabs, tab, setTab, rightAction }: { tabs: string[]; tab: string; setTab: (t: string)=>void; rightAction?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 glass surface rounded-lg px-2 py-1 mb-3 overflow-x-auto">
      <div className="flex items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab ${tab === t ? 'tab-active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      {rightAction ? (
        <div className="shrink-0 ml-2 mr-6">{rightAction}</div>
      ) : null}
    </div>
  );
}
