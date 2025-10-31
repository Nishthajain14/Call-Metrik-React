import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AudioAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { ChevronLeft } from 'lucide-react';
import AudioPlayerCard from '../components/AudioDetails/AudioPlayerCard';
import MetaDataCard from '../components/AudioDetails/MetaDataCard';
import TabsNav from '../components/AudioDetails/TabsNav';
import TranscriptionPanel from '../components/AudioDetails/TranscriptionPanel';
import SentimentPanel from '../components/AudioDetails/SentimentPanel';
import SummaryPanel from '../components/AudioDetails/SummaryPanel';
import TopicsTable from '../components/AudioDetails/TopicsTable';
import CustomerIntentTable from '../components/AudioDetails/CustomerIntentTable';
import QuestionnairePanel from '../components/AudioDetails/QuestionnairePanel';
import AgentFeedbackPanel from '../components/AudioDetails/AgentFeedbackPanel';
import KeywordsTable from '../components/AudioDetails/KeywordsTable';

 

const USER_ID = 7;
const CACHE_TTL_MS = 5 * 60 * 1000;
function readCache(key){
  try{ const raw = sessionStorage.getItem(key); if(!raw) return null; const obj = JSON.parse(raw); if(!obj||!obj.t||Date.now()-obj.t> CACHE_TTL_MS) return null; return obj.v; }catch{ return null; }
}
function writeCache(key, value){ try{ sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); }catch{} }
function detailsKey(userId, audioId){ return `details:${userId}:${audioId}`; }

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
        const key = detailsKey(USER_ID, audioId);
        const cached = readCache(key);
        if (cached && on){
          setInsights(cached.insights);
          setAudioUrl(cached.audioUrl || '');
        }
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
          sentiment: (function(){
            const overall = base?.audioInsights?.overall_sentiment || {};
            const sm = base?.audioInsights?.smoothed_sentiment || {};
            const lines = [];
            // Normalize smoothed series: expect arrays of { time, sentiment_score, label }
            const pushSeries = (name, color, arr) => {
              if (!Array.isArray(arr) || !arr.length) return;
              const data = arr.map((d,i)=>({ x: Number(d.time ?? i), y: Number(d.sentiment_score ?? d.score ?? 0) || 0 }));
              lines.push({ name, color, data });
            };
            // Some APIs provide arrays with label per point; merge both if present
            const maybe = [];
            if (Array.isArray(sm.line1)) maybe.push(...sm.line1);
            if (Array.isArray(sm.line2)) maybe.push(...sm.line2);
            if (maybe.length && maybe[0] && (maybe[0].label || maybe.some(p=>p.label))){
              const byLabel = {};
              maybe.forEach(pt => {
                const key = String(pt.label || 'Series').trim();
                (byLabel[key] = byLabel[key] || []).push(pt);
              });
              const palette = { Agent: '#a78bfa', Customer: '#34d399' };
              Object.entries(byLabel).forEach(([k, arr])=> pushSeries(k, palette[k] || '#60a5fa', arr));
            } else {
              // Fallback if separate lines exist
              if (Array.isArray(sm.line1)) pushSeries('Line 1', '#60a5fa', sm.line1);
              if (Array.isArray(sm.line2)) pushSeries('Line 2', '#34d399', sm.line2);
            }
            // Sentence-level
            const sentences = (base?.audioInsights?.speaker_sentiment || []).map((s)=>({
              speaker: s.speaker,
              text: s.segments,
              start: s.start_time,
              end: s.end_time,
              score: s.sentiment_score,
              label: s.sentimentLabel,
            }));
            return {
              positive: overall?.POSITIVE,
              negative: overall?.NEGATIVE,
              neutral: overall?.NEUTRAL,
              timeline: extractTimeline(base?.audioInsights),
              series: lines,
              sentences,
            };
          })(),
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
        writeCache(key, { insights: norm, audioUrl: resolvedUrl });
      } catch (e) {
        const msg = getErrorMessage(e, 'Failed to load details');
        setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
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
      // Build payload expected by backend: { userId, audioId, responses: [{ qCode, manualAudit: boolean }] }
      const responses = [];
      (updated || []).forEach((g) => {
        (g.items || g.questions || []).forEach((q) => {
          if (!q?.qCode) return;
          const val = typeof q.answer === 'boolean' ? q.answer : (typeof q.manualAnswer === 'boolean' ? q.manualAnswer : undefined);
          if (typeof val === 'boolean') {
            responses.push({ qCode: q.qCode, manualAudit: val });
          }
        });
      });
      if (!responses.length) {
        alert('Please answer at least one question (true/false) before submitting.');
        return;
      }
      // Debug logs to verify payload and identifiers
      try {
        console.group('Manual Audit Submit');
        console.log('userId:', USER_ID, 'audioId:', audioId);
        console.log('responses count:', responses.length);
        console.table(responses);
      } catch {}

      await AudioAPI.updateManualAudit(USER_ID, audioId, responses);
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
        <div className="flex items-center gap-2">
          <button onClick={()=>navigate(-1)} aria-label="Back" className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-300"><ChevronLeft size={18} /></button>
          <div className="text-xl font-semibold">Call Details</div>
        </div>
      </div>

      {/* Title + Player */}
      <AudioPlayerCard
        audioId={audioId}
        rate={rate}
        setRate={setRate}
        audioUrl={audioUrl}
        onDownload={handleDownload}
        audioRef={audioRef}
      />

      {/* Meta */}
      <MetaDataCard insights={insights} />

      {/* Tabs */}
      <div className="card p-4">
        <TabsNav tabs={tabs} tab={tab} setTab={setTab} />

        {/* Content simple placeholders bound to insights */}
        {tab === 'Transcription' && (
          <TranscriptionPanel text={insights?.transcription?.raw} />
        )}

        {tab === 'Sentiment Analysis' && (
          <SentimentPanel sentiment={insights?.sentiment} />
        )}

        {tab === 'Summary' && (
          <SummaryPanel summary={insights?.summary} />
        )}

        {tab === 'Topics' && (
          <TopicsTable topics={insights?.topics} />
        )}

        {tab === 'Customer Intent' && (
          <CustomerIntentTable list={insights?.customerIntentTable || insights?.customerIntentList} fallbackText={insights?.customerIntent} />
        )}

        {tab === 'Questionnaire' && (
          <QuestionnairePanel
            groups={(insights?.questionnaireGroups || insights?.questionnaire || [])}
            openSections={openSections}
            setOpenSections={setOpenSections}
            onSubmit={(groups) => onSaveQuestionnaire(groups)}
            saving={saving}
            setInsights={setInsights}
          />
        )}

        {tab === 'Agent Feedback' && (
          <AgentFeedbackPanel feedback={insights?.agentFeedback} improvement={insights?.improvement} highlights={insights?.highlights} />
        )}

        {tab === 'Keyword Detection' && (
          <KeywordsTable keywords={insights?.keywords} />
        )}
      </div>
    </div>
  );
}
