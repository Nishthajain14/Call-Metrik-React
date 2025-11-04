import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, PieChart as PieIcon, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DashboardAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { ResponsiveContainer, CartesianGrid, Tooltip, Legend, XAxis, YAxis } from 'recharts';
import { LineChart, Line } from 'recharts';
import { AreaChart, Area } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { ScatterChart, Scatter, ZAxis } from 'recharts';
import ratio3d from '../assets/ratio3d.png';
import avgscore3d from '../assets/avgscore3d.png';
import totalcall3d from '../assets/totalcall3d.png';
import avgduration3d from '../assets/avgduration3d.png';
import totalduration3d from '../assets/totalduration3d.png';
const COLORS = ['#34d399', '#f87171', '#8b5cf6'];
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(userId, year, month, view){
  return `dashboard:${userId}:${year}:${month}:${view}`;
}

function readCache(key){
  try{
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.t || Date.now() - obj.t > CACHE_TTL_MS) return null;
    return obj.v;
  }catch{ return null; }
}

function writeCache(key, value){
  try{
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
  }catch{}
}

function monthName(date = new Date()) {
  return date.toLocaleString('en-US', { month: 'long' });
}

function number(x) {
  if (x == null) return '-';
  if (typeof x === 'string' && /\d+:\d{2}:\d{2}/.test(x)) return x; // already formatted duration
  return new Intl.NumberFormat('en-IN').format(Number(x));
}

function Info({ text }) {
  return (
    <span
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] border-neutral-300 text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white"
      title={text}
    >
      i
    </span>
  );
}

function Art({ kind, className }: { kind?: string; className?: string }) {
  if (!kind) return null;
  const MAP: Record<string, string> = {
    ratio: ratio3d,
    score: avgscore3d,
    calls: totalcall3d,
    stopwatch: avgduration3d,
    hourglass: totalduration3d,
  };
  const src = MAP[kind] || MAP.stopwatch;
  return <img src={src} alt="" className={className} loading="lazy" />;
}

function Card({ title, value, hint, info, variant = 'metric-purple', art }: { title: any; value: any; hint?: any; info?: any; variant?: string; art?: string }) {
  return (
    <div className={`metric-subtle kpi-card ${variant} relative hover-lift`}>
      {info ? (
        <div className="kpi-info absolute right-3 top-3 z-[11]">
          <Info text={info} />
        </div>
      ) : null}
      {art ? (
        <div className="kpi-inner-overlays" aria-hidden>
          <Art kind={art} className="watermark-icon" />
        </div>
      ) : null}
      <div className="text-content">
        <div className="title">{title}</div>
        <div className="value kpi-number">{value}</div>
        {hint ? <div className="text-xs muted mt-1">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [kpi, setKpi] = useState(null);
  const [counts, setCounts] = useState<any>([]);
  const [sentimentMonthly, setSentimentMonthly] = useState(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = monthName(now);
  const [viewRaw, setViewRaw] = useState(()=>{
    try{ return sessionStorage.getItem('dashboard:view') || 'Monthly'; }catch{ return 'Monthly'; }
  });
  const [view, setView] = useState(viewRaw);

  useEffect(() => {
    if (!userId) return; // wait for auth mapping
    let mounted = true;
    const key = cacheKey(userId, year, month, view);

    // 1) Fast-hydrate from cache if available
    const cached = readCache(key);
    if (cached && mounted){
      setKpi(cached.kpi);
      setCounts(cached.counts);
      setSentimentMonthly(cached.sentimentMonthly);
      setLoading(false);
    }

    async function fetchAll() {
      try {
        if (!cached) setLoading(true);
        const [kpiRes, countsRes, sentRes] = await Promise.all([
          DashboardAPI.audioKPI(userId),
          view === 'Monthly'
            ? DashboardAPI.monthwiseCounts(userId, year)
            : view === 'Weekly'
            ? DashboardAPI.weekwiseCounts(userId, month, year)
            : DashboardAPI.datewiseCounts(userId, month, year),
          DashboardAPI.sentimentMonthly(userId, year),
        ]);
        if (!mounted) return;
        setKpi(kpiRes);
        setCounts(Array.isArray(countsRes?.data) ? countsRes.data : countsRes);
        setSentimentMonthly(sentRes);
        // persist
        writeCache(key, {
          kpi: kpiRes,
          counts: Array.isArray(countsRes?.data) ? countsRes.data : countsRes,
          sentimentMonthly: sentRes,
        });
      } catch (e) {
        const msg = getErrorMessage(e, 'Failed to load dashboard');
        setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [month, year, view, userId]);

  useEffect(()=>{
    const t = setTimeout(()=> setView(viewRaw), 300);
    return ()=> clearTimeout(t);
  }, [viewRaw]);

  useEffect(()=>{
    try{ sessionStorage.setItem('dashboard:view', view); }catch{}
  }, [view]);

  const kpis = useMemo(() => {
    if (!kpi) return [];
    const d = kpi?.data || kpi; // endpoint returns fields at root
    const variants = ['metric-purple','metric-teal','metric-orange','metric-pink','metric-blue'];
    return [
      { title: 'Total Duration Analysed', value: number(d?.totalDuration), info: 'The total sum of all analysed audio durations', variant: variants[0], art: 'hourglass' },
      { title: 'Avg Duration Of Call', value: number(d?.averageDuration), info: 'The average length of all analysed audio files', variant: variants[1], art: 'stopwatch' },
      { title: 'Total Calls Analysed', value: number(d?.audioCount), info: 'Total count of Audios Analysed', variant: variants[2], art: 'calls' },
      { title: 'Avg Executive Score', value: `${number(d?.avgSalesPersonScore ?? d?.avgWeightedScore)}%`, info: 'The average performance score of all conversations, calculated using a predefined question set and a scoring algorithm', variant: variants[3], art: 'score' },
      { title: 'Talk : Listen', value: `${number(d?.speechPercentage?.customerAvg)}% / ${number(d?.speechPercentage?.salespersonAvg)}%`, hint: 'Customer / Salesperson', info: 'Talk to listne ratio shows the average share of conversation: how much customer talks versus how much the salesperson does', variant: variants[4], art: 'ratio' },
    ];
  }, [kpi]);

  function DatewiseTooltip(props: any){
    const { active, label, payload } = props || {};
    if (!active || !payload || !payload.length) return null;
    const v = Number(payload[0]?.value ?? 0);
    return (
      <div style={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ color: 'var(--chart-tick)', fontWeight: 600, marginBottom: 4 }}>{String(label)}</div>
        <div style={{ color: '#7c3aed' }}>count : {v.toLocaleString()}</div>
      </div>
    );
  }

  const keywords = useMemo(() => {
    const d = kpi?.data || kpi;
    const metrics = d?.keywordData?.[0]?.keywordMetrics;
    return Array.isArray(metrics) ? metrics : [];
  }, [kpi]);

  const datewise = useMemo(() => {
    const payload = counts?.data ?? counts;
    // Weekly endpoint returns an object like { Monday: 216, ... }
    if (view === 'Weekly' && payload && !Array.isArray(payload) && typeof payload === 'object') {
      return Object.entries(payload).map(([k, v]) => ({ date: k, count: Number(v) || 0 }));
    }
    const arr = Array.isArray(payload) ? payload : [];
    if (!Array.isArray(arr)) return [];
    if (view === 'Monthly') {
      return arr.map((x) => ({ date: x.month || x.name, count: x.totalRecords ?? x.count ?? 0 }));
    }
    if (view === 'Weekly') {
      return arr.map((x) => ({ date: x.week || x.name || x[0] || Object.keys(x)[0], count: x.totalRecords ?? x.count ?? x[Object.keys(x)[0]] ?? 0 }));
    }
    return arr.map((x) => ({ date: x.date || x.Day || x.day, count: x.totalRecords ?? x.count ?? x.n ?? 0 }));
  }, [counts, view]);

  const sentMonthlySeries = useMemo(() => {
    const d = sentimentMonthly?.data || sentimentMonthly;
    const arr = d?.monthlySentimentScore || [];
    return arr.map((row) => ({
      name: row.month,
      positive: row.avgPositivePercentage ?? 0,
      negative: row.avgNegativePercentage ?? 0,
      neutral: row.avgNeutralPercentage ?? 0,
    }));
  }, [sentimentMonthly]);

  const donutData = useMemo(() => {
    const d = (kpi?.data || kpi)?.overallSentiment;
    const positive = d?.avgPositivePercentage ?? 0;
    const negative = d?.avgNegativePercentage ?? 0;
    const neutral = d?.avgNeutralPercentage ?? 0;
    return [
      { name: 'Positive', value: positive },
      { name: 'Negative', value: negative },
      { name: 'Neutral', value: neutral },
    ];
  }, [kpi]);

  const sankeyData = useMemo(() => {
    const d = (kpi?.data || kpi) || {};
    const sp = d.speechPercentage || {};
    const os = d.overallSentiment || {};
    const customer = Number(sp.customerAvg ?? 0);
    const sales = Number(sp.salespersonAvg ?? 0);
    const pos = Number(os.avgPositivePercentage ?? 0);
    const neg = Number(os.avgNegativePercentage ?? 0);
    const neu = Number(os.avgNeutralPercentage ?? 0);
    const nodes = [
      { name: 'Customer' },
      { name: 'Salesperson' },
      { name: 'Conversation' },
      { name: 'Positive' },
      { name: 'Negative' },
      { name: 'Neutral' },
    ];
    const links = [
      { source: 0, target: 2, value: Math.max(customer, 0.01), color: '#7c3aed' },
      { source: 1, target: 2, value: Math.max(sales, 0.01), color: '#a78bfa' },
      { source: 2, target: 3, value: Math.max(pos, 0.01), color: '#22c55e' },
      { source: 2, target: 4, value: Math.max(neg, 0.01), color: '#ef4444' },
      { source: 2, target: 5, value: Math.max(neu, 0.01), color: '#60a5fa' },
    ];
    return { nodes, links };
  }, [kpi]);

  return (
    <div className="space-y-6">
      {error && <div className="border border-red-600 text-red-400 p-3 rounded-lg">{error}</div>}

      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card-elevated p-4">
                <div className="h-3 w-24 mb-3 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-6 w-32 bg-neutral-200 rounded dark:bg-neutral-800" />
                <div className="h-3 w-20 mt-2 bg-neutral-200 rounded dark:bg-neutral-800" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card-elevated p-4 lg:col-span-2">
              <div className="h-6 w-48 mb-3 bg-neutral-200 rounded dark:bg-neutral-800" />
              <div className="h-72 w-full bg-neutral-200 rounded dark:bg-neutral-800" />
            </div>
            <div className="card-elevated p-4">
              <div className="h-6 w-56 mb-3 bg-neutral-200 rounded dark:bg-neutral-800" />
              <div className="h-72 w-full bg-neutral-200 rounded dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="kpi-wrapper">
            <Art kind={k.art} className="kpi-icon" />
            <Card title={k.title} value={k.value} hint={k.hint} info={k.info} variant={k.variant} art={k.art} />
          </div>
        ))}
      </div>

      <div className="card-elevated p-4 hover-lift ambient">
        <div className="flex items-center justify-between mb-3 glass surface rounded-lg px-3 py-2">
          <div className="font-semibold font-display inline-flex items-center gap-2"><TrendingUp size={16} /> Datewise Counts</div>
          <div className="segmented">
            {(['Monthly','Weekly','Daily'] as const).map((v)=> (
              <button key={v} className={viewRaw===v? 'active' : ''} onClick={()=> setViewRaw(v)}>{v}</button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datewise} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="dateArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8058f7ff" stopOpacity="0.85" />
                  <stop offset="80%" stopColor="#7a49c9ff" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#53189cff" stopOpacity="0.0" />
                </linearGradient>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
              <Tooltip content={<DatewiseTooltip />} />
              <Area type="monotone" dataKey="count" stroke="none" fill="url(#dateArea)" isAnimationActive animationDuration={700} />
              <Line type="monotone" dataKey="count" stroke="#9d45e5ff" strokeOpacity={0.35} strokeWidth={6} dot={false} isAnimationActive animationDuration={700} filter="url(#softGlow)" />
              <Line type="monotone" dataKey="count" stroke="#9d45e5ff" strokeWidth={2.5} dot={false} isAnimationActive animationDuration={700} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-elevated p-4 lg:col-span-2 hover-lift">
          <div className="font-semibold font-display mb-3 flex items-center glass surface rounded-lg px-3 py-2">
            <span className="inline-flex items-center gap-2"><TrendingUp size={16} /> Monthly Sentiment Analysis</span>
            <Info text="Shows monthly sentiment trends based on the analysed audio for each month" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentMonthlySeries} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="90%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="90%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="90%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} />
                <Legend />
                <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="url(#gPos)" isAnimationActive animationDuration={700} />
                <Area type="monotone" dataKey="neutral" stroke="#60a5fa" fill="url(#gNeu)" isAnimationActive animationDuration={700} />
                <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="url(#gNeg)" isAnimationActive animationDuration={700} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-elevated p-4 hover-lift">
          <div className="font-semibold font-display mb-3 flex items-center glass surface rounded-lg px-3 py-2">
            <span className="inline-flex items-center gap-2"><PieIcon size={16} /> Overall Sentiment</span>
            <Info text="Positive vs Neutral vs Negative sentiment split" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                <defs>
                  <filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.25)" />
                  </filter>
                </defs>
                <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                <ZAxis type="number" dataKey="z" range={[30, 110]} />
                {/* Legend rendered below */}
                {
                  (() => {
                    const data = donutData || [];
                    const pos = data.find(d => d.name === 'Positive')?.value ?? 0;
                    const neg = data.find(d => d.name === 'Negative')?.value ?? 0;
                    const neu = data.find(d => d.name === 'Neutral')?.value ?? 0;
                    const base = [
                      { name: 'Positive', value: pos, fill: '#22c55e' },
                      { name: 'Neutral', value: neu, fill: '#60a5fa' },
                      { name: 'Negative', value: neg, fill: '#ef4444' },
                    ].sort((a,b)=> (b.value||0) - (a.value||0));
                    // Largest centered, others overlay with slight offsets based on their rank
                    const centers = [
                      { x: 50, y: 50 },      // largest
                      { x: 63, y: 42 },      // second
                      { x: 57, y: 64 },      // third
                    ];
                    // map value -> radius (perceptual sqrt scaling) as fallback if node.radius absent
                    const toRadius = (v:number) => {
                      const t = Math.max(0, Math.min(1, v/100));
                      return 18 + 42 * Math.sqrt(t); // 18..60
                    };
                    const bubbles = base.map((b, i) => ({
                      name: b.name,
                      x: centers[i]?.x ?? 50 + i * 4,
                      y: centers[i]?.y ?? 50 + i * 4,
                      z: b.value,
                      value: b.value,
                      r: toRadius(b.value || 0),
                      fill: b.fill,
                    }));
                    return (
                      <Scatter data={bubbles} shape={(props: any) => {
                        const { cx, cy, fill, node } = props as any;
                        const r = (node && node.radius) ? node.radius : (props?.payload?.r ?? 24);
                        return (
                          <g filter="url(#bubbleShadow)">
                            <circle cx={cx} cy={cy} r={r} fill={fill} opacity={0.9} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(12, r * 0.42)} fill="#ffffff">
                              {`${Math.round((props?.payload?.value ?? 0))}%`}
                            </text>
                          </g>
                        );
                      }} />
                    );
                  })()
                }
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated p-4 hover-lift">
        <div className="font-semibold font-display mb-3 inline-flex items-center gap-2"><Hash size={16} /> Top Mentioned Keywords</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-glass table-zebra table-sticky">
            <thead className="text-left text-neutral-600 dark:text-neutral-300">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Weightage (%)</th>
                <th className="py-2 pr-4">Occurrence in Conversation (%)</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(keywords) && keywords.length > 0 ? (
                keywords.map((k, i) => (
                  <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 pr-4">{k.name}</td>
                    <td className="py-2 pr-4">{number(k.avgTranscriptWeightage)}</td>
                    <td className="py-2 pr-4">{number(k.avgTranscriptPercentage)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={3}>No keywords available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Local overlay kept minimal; skeletons shown above */}
    </div>
  );
}
