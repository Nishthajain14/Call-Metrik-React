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
          <div key={gi} className="card p-3">
            <button onClick={() => setOpenSections((s) => ({ ...s, [gi]: !s[gi] }))} className="w-full flex items-center justify-between px-2 py-1.5 rounded-md">
              <span className="text-sm font-semibold font-display">{title}</span>
              <span className="text-neutral-500 dark:text-neutral-400">{openSections?.[gi] ? '▾' : '▸'}</span>
            </button>
            {openSections?.[gi] && (
              <div className="mt-2 space-y-3">
                {items.map((q, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium font-display text-neutral-900 dark:text-neutral-100"><span className="mr-2 text-neutral-500">Q{String(i + 1)}</span>{q.question || q.title}</div>
                        {q.citation && (
                          <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                            <div className="px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 dark:bg-neutral-900/60 dark:border-neutral-800">{q.citation}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof q.aiAnswer !== 'undefined' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 border border-violet-500/30 dark:text-violet-300">AI Answer: {String(q.aiAnswer)}</span>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">Manual:</span>
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`q-${gi}-${i}`}
                              checked={(q.answer ?? q.manualAnswer) === true}
                              onChange={() => {
                                setInsights((prev) => {
                                  const next: any = { ...prev };
                                  const targetGroups = next.questionnaireGroups || [{ title: 'Questionnaire', items: next.questionnaire || [] }];
                                  const tg = targetGroups[gi] || { items: [] };
                                  const arr = tg.items || tg.questions || [];
                                  arr[i] = { ...(arr[i] || q), answer: true };
                                  if (next.questionnaireGroups) next.questionnaireGroups = [...targetGroups];
                                  else next.questionnaire = [...arr];
                                  return next;
                                });
                              }}
                            />
                            <span>true</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`q-${gi}-${i}`}
                              checked={(q.answer ?? q.manualAnswer) === false}
                              onChange={() => {
                                setInsights((prev) => {
                                  const next: any = { ...prev };
                                  const targetGroups = next.questionnaireGroups || [{ title: 'Questionnaire', items: next.questionnaire || [] }];
                                  const tg = targetGroups[gi] || { items: [] };
                                  const arr = tg.items || tg.questions || [];
                                  arr[i] = { ...(arr[i] || q), answer: false };
                                  if (next.questionnaireGroups) next.questionnaireGroups = [...targetGroups];
                                  else next.questionnaire = [...arr];
                                  return next;
                                });
                              }}
                            />
                            <span>false</span>
                          </label>
                        </div>
                      </div>
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
