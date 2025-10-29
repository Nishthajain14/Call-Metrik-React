import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AudioAPI } from '../lib/api';

const USER_ID = 7;

export default function AudioDetails() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [tab, setTab] = useState('Transcription');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    async function load() {
      try {
        const [insRaw, playerRaw] = await Promise.all([
          AudioAPI.audioInsights(USER_ID, audioId),
          AudioAPI.audioPlayerUrl(USER_ID, audioId),
        ]);
        if (!on) return;
        const arr = Array.isArray(insRaw) ? insRaw : (insRaw?.data || []);
        const base = arr[0] || {};
        // Normalize into a flat object the UI expects
        const norm = {
          audioId: base.audioId,
          fileName: base.fileName,
          fileType: base.fileType,
          fileSize: base.fileSize,
          fileDuration: base.fileDuration,
          uploadSource: base.uploadSource,
          language: base.language,
          createdDate: base.createdAt,
          callStatus: base.Call || base.audioStatus,
          executiveName: base.userName || base.username,
          managerName: base.managerName,
          executiveScore: base.salespersonScore,
          executiveWeightedScore: base.weightedScore,
          talkListen: {
            customer: base?.transcription?.transcript_kpis?.customerConvo,
            agent: base?.transcription?.transcript_kpis?.salespersonConvo,
          },
          // content blocks
          transcription: {
            left: [],
            right: [],
            raw: base?.transcription?.transcription || '',
          },
          sentiment: {
            positive: base?.audioInsights?.overall_sentiment?.POSITIVE,
            negative: base?.audioInsights?.overall_sentiment?.NEGATIVE,
            neutral: base?.audioInsights?.overall_sentiment?.NEUTRAL,
          },
          topics: (base?.audioInsights?.topic_extract || []).map(t => ({
            topic: t.Topic,
            content: t.content,
          })),
          customerIntentList: (base?.audioInsights?.intent_response || []).map(i => ({
            intent: i.Intent,
            content: i.content,
          })),
          summary: base?.audioInsights?.summary,
          agentFeedback: {
            highlights: (base?.audioInsights?.feedback || []).map(f => f.Highlight).filter(Boolean),
            improvement: (base?.audioInsights?.feedback || []).map(f => f.Improvement).filter(Boolean),
          },
          keywords: ((base?.audioInsights?.Keyword_Detection?.data?.[0]?.items) || []).map(k => ({
            name: k.name,
            weightage: k.weightage,
          })),
          questionnaireGroups: (base?.questionnaire?.structured_QA || []).map(sec => ({
            title: sec.key,
            items: (sec.items || []).map(q => ({
              qCode: q.qCode,
              question: q.question,
              citation: q.citation,
              aiAnswer: q.answer,
              manualAnswer: q.manualAudit,
              answer: typeof q.manualAudit === 'boolean' ? String(q.manualAudit) : (typeof q.answer === 'boolean' ? String(q.answer) : ''),
            })),
          })),
        };

        setInsights(norm);
        const resolvedUrl = typeof playerRaw === 'string' ? playerRaw : (playerRaw?.audioUrl || playerRaw?.url || base?.audioUrl || '');
        setAudioUrl(resolvedUrl);
      } catch (e) {
        setError(e?.message || 'Failed to load details');
      }
    }
    load();
    return () => { on = false; };
  }, [audioId]);

  const tabs = ['Transcription','Sentiment Analysis','Summary','Topics','Customer Intent','Questionnaire','Agent Feedback','Keyword Detection'];

  async function onSaveQuestionnaire(updated) {
    try {
      setSaving(true);
      // Build payload expected by backend: list of { qCode, manualAudit }
      const items = [];
      (updated || []).forEach((g) => {
        (g.items || g.questions || []).forEach((q) => {
          if (q.qCode) {
            let boolVal;
            if (typeof q.answer === 'string') {
              if (q.answer === 'true') boolVal = true;
              else if (q.answer === 'false') boolVal = false;
              else boolVal = null;
            } else if (typeof q.answer === 'boolean') {
              boolVal = q.answer;
            } else if (typeof q.manualAnswer === 'boolean') {
              boolVal = q.manualAnswer;
            }
            items.push({ qCode: q.qCode, manualAudit: boolVal });
          }
        });
      });
      await AudioAPI.updateManualAudit(USER_ID, audioId, items);
      // optimistic store
      setInsights((prev) => ({ ...prev, questionnaireGroups: updated }));
    } catch (e) {
      alert(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Call Details</div>
        <button onClick={()=>navigate(-1)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm">Back</button>
      </div>

      {/* Title + Player */}
      <div className="card p-4">
        <div className="font-mono text-sm mb-2 break-all">{audioId}</div>
        <audio controls src={audioUrl} className="w-full" />
      </div>

      {/* Meta */}
      <div className="card p-4">
        <div className="font-semibold mb-3">Meta Data</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div>File Name : {insights?.fileName || '-'}</div>
            <div>File Type : {insights?.fileType || '-'}</div>
            <div>File Size : {insights?.fileSize || '-'}</div>
            <div>File Duration (HH:MM:SS) : {insights?.fileDuration || '-'}</div>
            <div>Executive Name : {insights?.executiveName || '-'}</div>
          </div>
          <div>
            <div>Upload Source : {insights?.uploadSource || '-'}</div>
            <div>Language (translated) : {insights?.language || '-'}</div>
            <div>Create Date : {insights?.createdDate || '-'}</div>
            <div>Audio ID : {insights?.audioId || '-'}</div>
            <div>Call Status : {insights?.callStatus || '-'}</div>
          </div>
          <div>
            <div>Executive Score : {insights?.executiveScore ?? '-'}</div>
            <div>Executive Weighted Score : {insights?.executiveWeightedScore ?? '-'}</div>
            <div>Talk to Listen ratio</div>
            <div className="pl-3">Customer: {insights?.talkListen?.customer ?? '-'}</div>
            <div className="pl-3">Agent: {insights?.talkListen?.agent ?? '-'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex items-center gap-4 border-b border-neutral-800 mb-3">
          {tabs.map((t) => (
            <button key={t} onClick={()=>setTab(t)} className={`pb-2 text-sm ${tab===t? 'text-indigo-400 border-b-2 border-indigo-500':'text-neutral-300'}`}>{t}</button>
          ))}
        </div>

        {/* Content simple placeholders bound to insights */}
        {tab === 'Transcription' && (
          <pre className="whitespace-pre-wrap text-sm leading-6">{insights?.transcription?.raw || '-'}</pre>
        )}

        {tab === 'Sentiment Analysis' && (
          <div className="text-sm">Neutral: {insights?.sentiment?.neutral}% &nbsp; Negative: {insights?.sentiment?.negative}% &nbsp; Positive: {insights?.sentiment?.positive}%</div>
        )}

        {tab === 'Summary' && <pre className="whitespace-pre-wrap text-sm leading-6">{insights?.summary || '-'}</pre>}

        {tab === 'Topics' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-300">
                <tr>
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Content</th>
                </tr>
              </thead>
              <tbody>
                {(insights?.topics || []).map((row, i) => {
                  const topic = row?.topic || row?.name || `Topic ${i+1}`;
                  const content = row?.content || row?.text || row?.summary || '';
                  return (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="py-2 pr-4 align-top">{topic}</td>
                      <td className="py-2 pr-4 whitespace-pre-wrap">{content}</td>
                    </tr>
                  );
                })}
                {!((insights?.topics||[]).length) && (
                  <tr><td className="py-3 text-neutral-400" colSpan={2}>No topics</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Customer Intent' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-300">
                <tr>
                  <th className="py-2 pr-4">Intent</th>
                  <th className="py-2 pr-4">Content</th>
                </tr>
              </thead>
              <tbody>
                {(insights?.customerIntentTable || insights?.customerIntentList || []).map((row, i) => (
                  <tr key={i} className="border-t border-neutral-800">
                    <td className="py-2 pr-4 align-top">{row?.intent || row?.name || `Intent ${i+1}`}</td>
                    <td className="py-2 pr-4 whitespace-pre-wrap">{row?.content || row?.text || ''}</td>
                  </tr>
                ))}
                {!(insights?.customerIntentTable || insights?.customerIntentList || []).length && (
                  <tr><td className="py-3 text-neutral-400" colSpan={2}>{insights?.customerIntent || 'No customer intent data'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'Questionnaire' && (
          <div className="space-y-5">
            {(insights?.questionnaireGroups || insights?.questionnaire || []).map((group, gi) => {
              const title = group?.title || group?.name || `Section ${gi+1}`;
              const items = group?.items || group?.questions || (Array.isArray(insights?.questionnaire) ? insights?.questionnaire : []);
              return (
                <div key={gi} className="border border-neutral-800 rounded-lg">
                  <div className="px-3 py-2 text-sm font-medium bg-neutral-900/60 rounded-t-lg">{title}</div>
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
                          <select value={q.answer ?? q.manualAnswer ?? ''} onChange={(e)=>{
                            const val = e.target.value;
                            setInsights((prev)=>{
                              const next = { ...prev };
                              const targetGroups = next.questionnaireGroups || [{ title: 'Questionnaire', items: next.questionnaire || [] }];
                              const tg = targetGroups[gi];
                              const arr = tg.items || tg.questions || [];
                              arr[i] = { ...arr[i], answer: val };
                              if (next.questionnaireGroups) next.questionnaireGroups = [...targetGroups];
                              else next.questionnaire = [...arr];
                              return next;
                            });
                          }} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
                            <option value="">Select</option>
                            <option value="true">true</option>
                            <option value="false">false</option>
                            <option value="na">Not Applicable</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div>
              <button disabled={saving} onClick={()=>onSaveQuestionnaire((insights?.questionnaireGroups||[]))} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm px-3 py-1.5 rounded-md">{saving ? 'Saving...' : 'Submit'}</button>
            </div>
          </div>
        )}

        {tab === 'Agent Feedback' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-neutral-800 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Area of Improvement</div>
              <ul className="list-disc pl-5 text-sm space-y-2">{(insights?.agentFeedback?.improvement || insights?.improvement || []).map((x,i)=>(<li key={i}>{x}</li>))}</ul>
            </div>
            <div className="border border-neutral-800 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">SalesPerson Highlights</div>
              <ul className="list-disc pl-5 text-sm space-y-2">{(insights?.agentFeedback?.highlights || insights?.highlights || []).map((x,i)=>(<li key={i}>{x}</li>))}</ul>
            </div>
          </div>
        )}

        {tab === 'Keyword Detection' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-300">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Weightage(%)</th>
                </tr>
              </thead>
              <tbody>
                {(insights?.keywords || []).map((row, i) => (
                  <tr key={i} className="border-t border-neutral-800">
                    <td className="py-2 pr-4">{row?.name || row?.keyword || row}</td>
                    <td className="py-2 pr-4">{row?.weight || row?.weightage || '-'}</td>
                  </tr>
                ))}
                {!((insights?.keywords||[]).length) && (
                  <tr><td className="py-3 text-neutral-400" colSpan={2}>No keywords</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
