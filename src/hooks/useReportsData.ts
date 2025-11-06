import { useEffect, useState } from 'react';
import { ReportsAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { readCache, writeCache, cacheKey } from '../lib/cache';

export default function useReportsData(userId: string | number | undefined, opts?: { initialCallStatus?: string; initialMonth?: string; initialScoreType?: string }) {
  const [callStatus, setCallStatus] = useState(opts?.initialCallStatus ?? 'both');
  const [scoreType, setScoreType] = useState(opts?.initialScoreType ?? 'OFE Score');
  const [month, setMonth] = useState(opts?.initialMonth ?? new Date().toLocaleString('en-US', { month: 'long' }));

  const [cards, setCards] = useState<any>(null);
  const [callDist, setCallDist] = useState<any[]>([]);
  const [peak, setPeak] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [agentReport, setAgentReport] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any[]>([]);
  const [scoreCard, setScoreCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let on = true;
    async function load() {
      try {
        const key = cacheKey('reports', String(userId), callStatus, month, scoreType);
        const cached = readCache(key);
        if (cached && on){
          setCards(cached.cards);
          setCallDist(cached.callDist);
          setPeak(cached.peak);
          setFunnel(cached.funnel);
          setAgentReport(cached.agentReport);
          setEvents(cached.events);
          setAdherence(cached.adherence);
          setScoreCard(cached.scoreCard);
          setLoading(false);
        } else {
          setLoading(true);
        }
        const [cm, cd, ph, funnelRes, ar, ev, ad, sc] = await Promise.all([
          ReportsAPI.cardMetrics(userId as any, { callStatus }),
          ReportsAPI.callTimeDistribution(userId as any, { callStatus }),
          ReportsAPI.peakCallHours(userId as any, { callStatus }),
          ReportsAPI.callToLeadConversion(userId as any, { callStatus }),
          ReportsAPI.agentReport(userId as any, { callStatus }),
          ReportsAPI.eventsByAgent(userId as any),
          ReportsAPI.agentFollowedScript(userId as any, { callStatus }),
          ReportsAPI.agentScoreCard(userId as any, { month, scoreType, callStatus }),
        ]);
        if (!on) return;
        setCards(cm);
        setCallDist(cd);
        setPeak(ph);
        setFunnel(Array.isArray(funnelRes) ? funnelRes : []);
        setAgentReport(ar);
        setEvents(ev);
        setAdherence(Array.isArray(ad) ? ad : []);
        setScoreCard(sc);
        writeCache(key, { cards: cm, callDist: cd, peak: ph, funnel: Array.isArray(funnelRes)?funnelRes:[], agentReport: ar, events: ev, adherence: Array.isArray(ad)?ad:[], scoreCard: sc });
      } catch (e: any) {
        const msg = getErrorMessage(e, 'Failed to load reports');
        setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { on = false; };
  }, [callStatus, month, scoreType, userId]);

  return {
    callStatus, setCallStatus,
    scoreType, setScoreType,
    month, setMonth,
    cards, callDist, peak, funnel, agentReport, events, adherence, scoreCard,
    loading, error,
  };
}
