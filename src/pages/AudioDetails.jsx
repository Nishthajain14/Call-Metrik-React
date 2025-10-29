import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AudioAPI } from '../lib/api';

function SentimentChart({ timeline, summary }) {
  const data = useMemo(() => {
    const arr = Array.isArray(timeline) ? timeline : [];
    if (!arr.length) return [];
    return arr.map((d, i) => {
      if (typeof d === 'number') return { x: i, y: d };
      if (typeof d === 'object' && d) {
        const y = d.overall ?? d.value ?? d.score ?? d.sentiment ?? 0;
        const x = d.time ?? d.t ?? i;
        return { x: Number(x) || i, y: Number(y) || 0 };
      }
      return { x: i, y: 0 };
    }).sort((a,b)=> (a.x - b.x));
  }, [timeline]);
  const hasLine = data.length && (()=>{
    const ys = data.map(d=>d.y);
    const maxAbs = Math.max(...ys.map((y)=>Math.abs(Number(y)||0)));
    return maxAbs > 0.0001; // not a flat zero line
  })();

  if (!hasLine) {
    const pos = Number(summary?.positive ?? 0);
    const neg = Number(summary?.negative ?? 0);
    const neu = Number(summary?.neutral ?? 0);
    const Row = ({color,label,val,icon}) => (
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1"><span className="inline-flex items-center gap-1">{icon}{label}</span><span>{val}%</span></div>
        <div className="w-full h-2 rounded bg-neutral-800 overflow-hidden"><div className="h-2" style={{width: `${Math.max(0, Math.min(100, val))}%`, backgroundColor: color}} /></div>
      </div>
    );
    return (
      <div className="max-w-xl">
        <div className="text-xs text-neutral-400 mb-2">Timeline not available from API. Showing distribution.</div>
        <Row color="#22c55e" label="Positive" val={pos} icon={<span>🙂</span>} />
        <Row color="#f43f5e" label="Negative" val={neg} icon={<span>🙁</span>} />
        <Row color="#94a3b8" label="Neutral" val={neu} icon={<span>😐</span>} />
      </div>
    );
  }

  const width = 560; const height = 220; const pad = 28;
  const xs = data.map(d=>d.x);
  const ys = data.map(d=>d.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys, -1), yMax = Math.max(...ys, 1);
  const xScale = (x)=> pad + (xMax===xMin?0:(x - xMin) / (xMax - xMin)) * (width - pad*2);
  const yScale = (y)=> height - pad - (yMax===yMin?0:(y - yMin) / (yMax - yMin)) * (height - pad*2);
  const path = data.map((d,i)=> `${i?'L':'M'}${xScale(d.x)},${yScale(d.y)}`).join(' ');
  const zeroY = yScale(0);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-3 text-xs text-neutral-300 mb-2">
        <span className="inline-flex items-center gap-1"><span>📈</span> Sentiment timeline</span>
        <span className="text-neutral-500">(baseline 0 dotted)</span>
      </div>
      <svg width={width} height={height} className="bg-neutral-900/40 rounded-md border border-neutral-800">
        <defs>
          <linearGradient id="sentigrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={zeroY} x2={width-pad} y2={zeroY} stroke="#475569" strokeDasharray="4 4" />
        <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#475569" />
        <path d={`${path} L ${xScale(xMax)},${yScale(0)} L ${xScale(xMin)},${yScale(0)} Z`} fill="url(#sentigrad)" />
        <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" />
        {data.map((d,i)=>(
          <circle key={i} cx={xScale(d.x)} cy={yScale(d.y)} r="2" fill="#60a5fa" />
        ))}
        <text x={pad} y={pad-8} fill="#94a3b8" fontSize="10">Sentiment over time</text>
        <text x={width-pad} y={height-6} fill="#94a3b8" fontSize="10" textAnchor="end">Time</text>
      </svg>
    </div>
  );
}

const USER_ID = 7;

export default function AudioDetails() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [tab, setTab] = useState('Transcription');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const [rate, setRate] = useState(1);
  const [openSections, setOpenSections] = useState({});
  async function handleDownload(){
    try {
      if (!audioUrl) return;
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const type = res.headers.get('content-type') || '';
      const extFromType = type.includes('wav') ? 'wav' : type.includes('mpeg') ? 'mp3' : (insights?.fileType || '').toLowerCase();
      const baseName = (insights?.fileName && String(insights.fileName).split('/').pop()) || String(audioId);
      const hasExt = /\.[a-z0-9]+$/i.test(baseName);
      a.href = url;
      a.download = hasExt ? baseName : `${baseName}${extFromType?'.'+extFromType:''}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    } catch (e) {
      try { window.open(audioUrl, '_blank'); } catch {}
    }
  }

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
        // Try to robustly extract a sentiment timeline from various API shapes
        function extractTimeline(ai){
          if (!ai || typeof ai !== 'object') return [];
          const candidates = [
            ai.sentiment_timeline, ai.sentimentTimeline, ai.timeline, ai.sentiment_time_series,
            ai.sentimentSeries, ai.series, ai.timeseries, ai.timeSeries, ai.sentiment_graph,
            ai.graphData
          ];
          const isValid = (arr) => {
            if (!Array.isArray(arr) || !arr.length) return false;
            // map to numbers using known keys
            const ys = arr.map((d,i)=>{
              if (typeof d === 'number') return d;
              if (d && typeof d === 'object') return Number(d.overall ?? d.sentiment ?? d.value ?? d.score ?? 0) || 0;
              return 0;
            });
            return ys.some((y)=> y !== 0);
          };
          for (const c of candidates){ if (isValid(c)) return c; }
          for (const k of Object.keys(ai)){
            const v = ai[k];
            if (isValid(v)) return v;
            if (v && typeof v === 'object'){
              const found = extractTimeline(v);
              if (found.length) return found;
            }
          }
          return [];
        }

        const norm = {
          audioId: base.audioId,
          fileName: base.fileName,
          fileType: base.fileType,
          fileSize: base.fileSize,
          fileDuration: base.fileDuration,
          uploadSource: base.uploadSource,
          language: base.language,
          createdDate: base.createdAt,
          callStatus: base.Call,
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
            timeline: extractTimeline(base?.audioInsights),
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
        // initialize collapsible state for questionnaire
        const groups = norm?.questionnaireGroups || [];
        const init = {};
        groups.forEach((_, i)=>{ init[i] = true; });
        setOpenSections(init);
        const resolvedUrl = typeof playerRaw === 'string' ? playerRaw : (playerRaw?.audioUrl || playerRaw?.url || base?.audioUrl || '');
        setAudioUrl(resolvedUrl);
      } catch (e) {
        setError(e?.message || 'Failed to load details');
      }

    }
    load();
    return () => { on = false; };
  }, [audioId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, [rate]);

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
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-sm break-all">{audioId}</div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-xs text-neutral-400">Speed</div>
            <div className="inline-flex rounded-md overflow-hidden border border-neutral-700">
              <button className={`px-2 py-1 text-xs ${rate===1?'bg-neutral-800 text-white':'bg-neutral-900 text-neutral-300'}`} onClick={()=>setRate(1)}>1x</button>
              <button className={`px-2 py-1 text-xs ${rate===1.5?'bg-neutral-800 text-white':'bg-neutral-900 text-neutral-300'}`} onClick={()=>setRate(1.5)}>1.5x</button>
              <button className={`px-2 py-1 text-xs ${rate===2?'bg-neutral-800 text-white':'bg-neutral-900 text-neutral-300'}`} onClick={()=>setRate(2)}>2x</button>
            </div>
            {audioUrl && (
              <button onClick={handleDownload} className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-md bg-neutral-800 border border-neutral-700 hover:bg-neutral-700" title="Download audio">
                <span role="img" aria-label="download">⬇️</span>
              </button>
            )}
          </div>
        </div>
        <audio ref={audioRef} controls src={audioUrl || undefined} className="w-full" />
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
            <div>Agent Name : {insights?.executiveName || '-'}</div>
          </div>
          <div>
            <div>Upload Source : {insights?.uploadSource ? <span title={insights.uploadSource}>🔗</span> : '-'}</div>
            <div>Language (translated) : {Array.isArray(insights?.language) ? `[${insights.language.filter(Boolean).join(', ')}]` : (insights?.language || '-')}</div>
            <div>Create Date : {insights?.createdDate || '-'}</div>
            <div>Audio ID : {insights?.audioId || '-'}</div>
            <div>Call Status : {insights?.callStatus || '-'}</div>
          </div>
          <div>
            <div>Agent Score : {insights?.executiveScore ?? '-'}</div>
            <div>Agent Weighted Score : {insights?.executiveWeightedScore ?? '-'}</div>
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
          <div className="space-y-4">
            <div className="text-sm">Neutral: {insights?.sentiment?.neutral ?? 0}% &nbsp; Negative: {insights?.sentiment?.negative ?? 0}% &nbsp; Positive: {insights?.sentiment?.positive ?? 0}%</div>
            <SentimentChart timeline={insights?.sentiment?.timeline} summary={insights?.sentiment} />
          </div>
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
            <div className="sticky top-0 z-10 -mt-2 pb-2 bg-neutral-950/70 backdrop-blur border-b border-neutral-800 flex justify-end">
              <button disabled={saving} onClick={()=>onSaveQuestionnaire((insights?.questionnaireGroups||[]))} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm px-3 py-1.5 rounded-md">{saving ? 'Saving...' : 'Submit'}</button>
            </div>
            {(insights?.questionnaireGroups || insights?.questionnaire || []).map((group, gi) => {
              const title = group?.title || group?.name || `Section ${gi+1}`;
              const items = group?.items || group?.questions || (Array.isArray(insights?.questionnaire) ? insights?.questionnaire : []);
              return (
                <div key={gi} className="border border-neutral-800 rounded-lg">
                  <button onClick={()=>setOpenSections((s)=>({...s, [gi]: !s[gi]}))} className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-neutral-900/60 rounded-t-lg">
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
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'Agent Feedback' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-neutral-800 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Area of Improvement</div>
              <ul className="list-disc pl-5 text-sm space-y-2">{(insights?.agentFeedback?.improvement || insights?.improvement || []).map((x,i)=>(<li key={i}>{x}</li>))}</ul>
            </div>
            <div className="border border-neutral-800 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Agent Highlights</div>
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
