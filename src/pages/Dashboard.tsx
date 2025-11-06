import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import KPICardGrid from '../components/Dashboard/KPICardGrid';
import DatewiseCountsCard from '../components/Dashboard/DatewiseCountsCard';
import MonthlySentimentCard from '../components/Dashboard/MonthlySentimentCard';
import OverallSentimentCard from '../components/Dashboard/OverallSentimentCard';
import TopKeywordsCard from '../components/Dashboard/TopKeywordsCard';
import useDashboardData from '../hooks/useDashboardData';

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
  const { loading, error, kpi, counts, sentimentMonthly, datewise, view, setViewRaw, viewRaw } = useDashboardData(userId);
  const { setLoading: setGlobalLoading } = useLoading();

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

  // datewise comes from hook

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

  useEffect(() => { setGlobalLoading(loading); }, [loading, setGlobalLoading]);

  return (
    <div className="space-y-6">
      {error && <div className="border border-red-600 text-red-400 p-3 rounded-lg">{error}</div>}
      <KPICardGrid kpis={kpis} />

      <DatewiseCountsCard data={datewise} viewRaw={viewRaw} setViewRaw={setViewRaw} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MonthlySentimentCard data={sentMonthlySeries} />
        <OverallSentimentCard donutData={donutData} />
      </div>

      <TopKeywordsCard keywords={keywords} formatNumber={number} />

      {loading && <div className="text-sm muted">Loading dashboard...</div>}
    </div>
  );
}
