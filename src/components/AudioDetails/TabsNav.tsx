export default function TabsNav({ tabs, tab, setTab }) {
  return (
    <div className="flex items-center gap-4 border-b border-neutral-200 mb-3 dark:border-neutral-800">
      {tabs.map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm ${tab === t ? 'text-indigo-600 border-b-2 border-indigo-500 dark:text-indigo-400' : 'text-neutral-600 dark:text-neutral-300'}`}>{t}</button>
      ))}
    </div>
  );
}
