export default function QuestionnairePanel({ groups, openSections, setOpenSections, onSubmit, saving, setInsights }) {
  const sections = groups || [];
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mt-2 pb-2 bg-neutral-950/70 backdrop-blur border-b border-neutral-800 flex justify-end">
        <button disabled={saving} onClick={() => onSubmit(sections)} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm px-3 py-1.5 rounded-md">{saving ? 'Saving...' : 'Submit'}</button>
      </div>
      {sections.map((group, gi) => {
        const title = group?.title || group?.name || `Section ${gi + 1}`;
        const items = group?.items || group?.questions || [];
        return (
          <div key={gi} className="border border-neutral-800 rounded-lg">
            <button onClick={() => setOpenSections((s) => ({ ...s, [gi]: !s[gi] }))} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-neutral-900/60 rounded-t-lg">
              <span>{title}</span>
              <span className="text-neutral-400">{openSections?.[gi] ? '▾' : '▸'}</span>
            </button>
            {openSections?.[gi] && (
              <div className="p-3 space-y-3">
                {items.map((q, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <div>
                      <div className="text-sm">{q.question || q.title}</div>
                      {q.citation && <div className="text-xs text-neutral-400 mt-1">Citation: {q.citation}</div>}
                      {typeof q.aiAnswer !== 'undefined' && (
                        <div className="mt-1 text-xs"><span className="bg-neutral-800 px-2 py-0.5 rounded">AI Answer : {String(q.aiAnswer)}</span></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Manual Answer:</span>
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
                        className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5"
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
