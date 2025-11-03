export default function QuestionnairePanel({ groups, openSections, setOpenSections, onSubmit, saving, setInsights }) {
  const sections = groups || [];
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mt-2 pb-2 bg-white/70 backdrop-blur border-b border-neutral-200 flex justify-end dark:bg-neutral-900/80 dark:border-neutral-800">
        <button disabled={saving} onClick={() => onSubmit(sections)} className="btn-primary disabled:opacity-60 text-sm px-3 py-1.5 rounded-md">{saving ? 'Saving...' : 'Submit'}</button>
      </div>
      {sections.map((group, gi) => {
        const title = group?.title || group?.name || `Section ${gi + 1}`;
        const items = group?.items || group?.questions || [];
        return (
          <div key={gi} className="border rounded-lg border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setOpenSections((s) => ({ ...s, [gi]: !s[gi] }))} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-neutral-100 rounded-t-lg dark:bg-neutral-900/60">
              <span>{title}</span>
              <span className="text-neutral-500 dark:text-neutral-400">{openSections?.[gi] ? '▾' : '▸'}</span>
            </button>
            {openSections?.[gi] && (
              <div className="p-3 space-y-3">
                {items.map((q, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <div>
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">{q.question || q.title}</div>
                      {q.citation && <div className="text-xs text-neutral-600 mt-1 dark:text-neutral-400">Citation: {q.citation}</div>}
                      {typeof q.aiAnswer !== 'undefined' && (
                        <div className="mt-1 text-xs"><span className="px-2 py-0.5 rounded border border-neutral-300 bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300">AI Answer : {String(q.aiAnswer)}</span></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">Manual Answer:</span>
                      <select
                        value={(q.answer ?? q.manualAnswer) === true ? 'true' : ((q.answer ?? q.manualAnswer) === false ? 'false' : '')}
                        onChange={(e) => {
                          const v = e.target.value;
                          const boolVal = v === 'true' ? true : v === 'false' ? false : undefined;
                          setInsights((prev) => {
                            const next = { ...prev };
                            const targetGroups = next.questionnaireGroups || [{ title: 'Questionnaire', items: next.questionnaire || [] }];
                            const tg = targetGroups[gi];
                            const arr = tg.items || tg.questions || [];
                            arr[i] = { ...arr[i], answer: boolVal };
                            if (next.questionnaireGroups) next.questionnaireGroups = [...targetGroups];
                            else next.questionnaire = [...arr];
                            return next;
                          });
                        }}
                        className="input rounded-md"
                      >
                        <option value="">Select</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
