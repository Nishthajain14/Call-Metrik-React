import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardAPI, getErrorMessage, isNetworkError } from '../lib/api';
import KPICardGrid from '../components/Dashboard/KPICardGrid';
import DatewiseCountsCard from '../components/Dashboard/DatewiseCountsCard';
import MonthlySentimentCard from '../components/Dashboard/MonthlySentimentCard';
import OverallSentimentCard from '../components/Dashboard/OverallSentimentCard';
import TopKeywordsCard from '../components/Dashboard/TopKeywordsCard';

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
      <KPICardGrid kpis={kpis} />

      <DatewiseCountsCard data={datewise} viewRaw={viewRaw} setViewRaw={setViewRaw} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MonthlySentimentCard data={sentMonthlySeries} />
        <OverallSentimentCard donutData={donutData} />
      </div>

      <TopKeywordsCard keywords={keywords} formatNumber={number} />

      {/* Local overlay kept minimal; skeletons shown above */}
    </div>
  );
}
