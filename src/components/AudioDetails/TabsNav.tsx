export default function TabsNav({ tabs, tab, setTab }) {
  return (
    <div className="flex items-center gap-2 glass surface rounded-lg px-2 py-1 mb-3 overflow-x-auto">
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
  );
}
