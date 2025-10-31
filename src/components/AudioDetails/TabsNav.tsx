export default function TabsNav({ tabs, tab, setTab }) {
  return (
    <div className="flex items-center gap-4 border-b border-neutral-800 mb-3">
      {tabs.map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm ${tab === t ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-300'}`}>{t}</button>
      ))}
    </div>
  );
}
