import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, Area } from 'recharts';

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

function Card({ title, value, hint, info, variant = 'metric-purple' }) {
  return (
    <div className={`metric-subtle ${variant} relative hover-lift`}>
      {info ? (
        <div className="absolute right-3 top-3">
          <Info text={info} />
        </div>
      ) : null}
      <div className="text-sm muted mb-2 italic">
        {title}
      </div>
      <div className="text-2xl font-semibold kpi-number">{value}</div>
      {hint ? <div className="text-xs muted mt-1">{hint}</div> : null}
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
      { title: 'Total Duration Analysed', value: number(d?.totalDuration), info: 'The total sum of all analysed audio durations', variant: variants[0] },
      { title: 'Avg Duration Of Call', value: number(d?.averageDuration), info: 'The average length of all analysed audio files', variant: variants[1] },
      { title: 'Total Calls Analysed', value: number(d?.audioCount), info: 'Total count of Audios Analysed', variant: variants[2] },
      { title: 'Avg Executive Score', value: `${number(d?.avgSalesPersonScore ?? d?.avgWeightedScore)}%`, info: 'The average performance score of all conversations, calculated using a predefined question set and a scoring algorithm', variant: variants[3] },
      { title: 'Talk : Listen', value: `${number(d?.speechPercentage?.customerAvg)}% / ${number(d?.speechPercentage?.salespersonAvg)}%`, hint: 'Customer / Salesperson', info: 'Talk to listne ratio shows the average share of conversation: how much customer talks versus how much the salesperson does', variant: variants[4] },
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

  return (
    <div className="space-y-6">
      {error && <div className="border border-red-600 text-red-400 p-3 rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Card key={k.title} title={k.title} value={k.value} hint={k.hint} info={k.info} variant={k.variant} />
        ))}
      </div>

      <div className="card-elevated p-4 hover-lift ambient">
        <div className="flex items-center justify-between mb-3 glass surface rounded-lg px-3 py-2">
          <div className="font-semibold font-display">Datewise Counts</div>
          <div>
            <select
              value={viewRaw}
              onChange={(e) => setViewRaw(e.target.value)}
              className="input rounded-md"
            >
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
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
            Monthly Sentiment Analysis
            <Info text="Shows monthly sentiment trends based on the analysed audio for each month" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentMonthlySeries}>
                <defs />
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }}
                  labelStyle={{ color: 'var(--chart-tick)', fontWeight: 600 }}
                  formatter={(value: any, name: any) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    String(name)
                  ]}
                  labelFormatter={(label: any) => String(label)}
                />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
                <Line type="monotone" dataKey="neutral" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-elevated p-4 hover-lift">
          <div className="font-semibold font-display mb-3 flex items-center glass surface rounded-lg px-3 py-2">
            Overall Sentiment of Audios
            <Info text="Displays the percentage breakdown of positive, negative and neutral sentiments across all analysed audios" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2} cornerRadius={6} stroke="none" style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.25))' }}>
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-elevated p-4 hover-lift">
        <div className="font-semibold font-display mb-3">Top Mentioned Keywords</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-glass table-zebra">
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

      {/* Local overlay kept minimal to avoid duplication with global loader */}
      {loading && (
        <div className="text-sm muted">Loading dashboard...</div>
      )}
    </div>
  );
}
