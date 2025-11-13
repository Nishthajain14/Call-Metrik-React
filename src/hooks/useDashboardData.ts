import { useEffect, useMemo, useState } from 'react';
import { DashboardAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { cacheKey, readCache, writeCache } from '../lib/cache';

function monthName(date = new Date()) { return date.toLocaleString('en-US', { month: 'long' }); }

export default function useDashboardData(userId: string | number | undefined) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [kpi, setKpi] = useState<any>(null);
  const [counts, setCounts] = useState<any>([]);
  const [sentimentMonthly, setSentimentMonthly] = useState<any>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = monthName(now);

  const [viewRaw, setViewRaw] = useState(() => {
    try { return sessionStorage.getItem('dashboard:view') || 'Monthly'; } catch { return 'Monthly'; }
  });
  const [view, setView] = useState(viewRaw);

  useEffect(() => {
    const t = setTimeout(() => setView(viewRaw), 300);
    return () => clearTimeout(t);
  }, [viewRaw]);

  useEffect(() => {
    try { sessionStorage.setItem('dashboard:view', view); } catch {}
  }, [view]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const key = cacheKey('dashboard', String(userId), year, month, view);

    const cached = readCache<any>(key);
    if (cached && mounted) {
      setKpi(cached.kpi);
      setCounts(cached.counts);
      setSentimentMonthly(cached.sentimentMonthly);
      setLoading(false);
    }

    async function fetchAll() {
      try {
        if (!cached) setLoading(true);
        const kpiRes = await DashboardAPI.audioKPI(userId as any);
        if (!mounted) return;
        setKpi(kpiRes);
        if (!cached) setLoading(false);

        const countsPromise = (
          view === 'Monthly'
            ? DashboardAPI.monthwiseCounts(userId as any, year as any)
            : view === 'Weekly'
            ? DashboardAPI.weekwiseCounts(userId as any, month as any, year as any)
            : DashboardAPI.datewiseCounts(userId as any, month as any, year as any)
        );
        const sentPromise = DashboardAPI.sentimentMonthly(userId as any, year as any);
        const [countsRes, sentRes] = await Promise.all([countsPromise, sentPromise]);
        if (!mounted) return;
        const cnt = Array.isArray((countsRes as any)?.data) ? (countsRes as any).data : countsRes;
        setCounts(cnt);
        setSentimentMonthly(sentRes);
        writeCache(key, { kpi: kpiRes, counts: cnt, sentimentMonthly: sentRes });
      } catch (e: any) {
        const msg = getErrorMessage(e, 'Failed to load dashboard');
        setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, [userId, view, year, month]);

  const datewise = useMemo(() => {
    const payload = (counts as any)?.data ?? counts;
    if ((view === 'Weekly') && payload && !Array.isArray(payload) && typeof payload === 'object') {
      return Object.entries(payload).map(([k, v]) => ({ date: k, count: Number(v) || 0 }));
    }
    const arr = Array.isArray(payload) ? payload : [];
    if (!Array.isArray(arr)) return [] as Array<{ date: string; count: number }>;
    if (view === 'Monthly') {
      return arr.map((x: any) => ({ date: x.month || x.name, count: x.totalRecords ?? x.count ?? 0 }));
    }
    if (view === 'Weekly') {
      return arr.map((x: any) => ({ date: x.week || x.name || x[0] || Object.keys(x)[0], count: x.totalRecords ?? x.count ?? x[Object.keys(x)[0]] ?? 0 }));
    }
    return arr.map((x: any) => ({ date: x.date || x.Day || x.day, count: x.totalRecords ?? x.count ?? x.n ?? 0 }));
  }, [counts, view]);

  return {
    loading, error,
    kpi, counts, sentimentMonthly, datewise,
    view, setViewRaw, viewRaw,
  };
}
