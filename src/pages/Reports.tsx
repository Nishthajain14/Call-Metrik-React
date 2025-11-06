import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import Card from '../components/Dashboard/Card';
import useReportsData from '../hooks/useReportsData';
import CallTimeDistribution from '../components/Reports/CallTimeDistribution';
import PeakCallHours from '../components/Reports/PeakCallHours';
import FunnelConversion from '../components/Reports/FunnelConversion';
import EventwiseTable from '../components/Reports/EventwiseTable';
import AdherenceTable from '../components/Reports/AdherenceTable';
import AgentReportTable from '../components/Reports/AgentReportTable';
import AgentTimeline from '../components/Reports/AgentTimeline';

// Using shared Card component for KPI metrics

export default function Reports() {
  const { userId } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();
  const {
    callStatus, setCallStatus,
    scoreType, setScoreType,
    month, setMonth,
    cards, callDist, peak, funnel, agentReport, events, adherence, scoreCard,
    loading, error,
  } = useReportsData(userId);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // detect tailwind dark class or system preference
    const check = () => setIsDark(document.documentElement.classList.contains('dark') || window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    check();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = () => check();
    mq?.addEventListener?.('change', handler);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq?.removeEventListener?.('change', handler);
      obs.disconnect();
    };
  }, []);

  useEffect(() => { setGlobalLoading(loading); }, [loading, setGlobalLoading]);

  const callDistData = useMemo(() => {
    const arr = Array.isArray(callDist) ? callDist : [];
    return arr.map((x) => ({ range: x.range, count: x.count }));
  }, [callDist]);

  const peakHoursData = useMemo(() => {
    const arr = Array.isArray(peak) ? peak : [];
    return arr.map((x) => ({ range: x.timeRange, count: x.count }));
  }, [peak]);

  const funnelData = useMemo(() => {
    const arr = Array.isArray(funnel) ? funnel : [];
    // Ensure order: Connected -> Fresh -> Follow-up
    const order = { 'Connected Calls': 0, 'Fresh Calls': 1, 'Follow-up Calls': 2 };
    return [...arr].sort((a, b) => (order[a.stage] ?? 99) - (order[b.stage] ?? 99)).map((x) => {
      const count = Number(x.count) || 0;
      const color = x.stage === 'Connected Calls' ? 'url(#funnelA)' : x.stage === 'Fresh Calls' ? 'url(#funnelC)' : 'url(#funnelB)';
      // visual value to avoid pinched bands (sqrt scaling with minimum)
      const viz = Math.max(Math.sqrt(count), 8);
      return { stage: x.stage, count, conversion: x.conversion, label: x.label, color, viz };
    });
  }, [funnel]);

  const [funnelFilter, setFunnelFilter] = useState({ connected: true, fresh: true, followup: true });
  const filteredFunnel = useMemo(() => {
    return funnelData.filter((d) =>
      (d.stage === 'Connected Calls' && funnelFilter.connected) ||
      (d.stage === 'Fresh Calls' && funnelFilter.fresh) ||
      (d.stage === 'Follow-up Calls' && funnelFilter.followup)
    );
  }, [funnelData, funnelFilter]);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const timeline = useMemo(() => {
    const d = scoreCard || {};
    const users = d.users || [];
    const dates = d.dates || [];
    const grid = d.scoreCard || [];
    return { users, dates, grid };
  }, [scoreCard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 glass surface rounded-xl px-3 py-2">
        <div className="text-xl font-semibold font-display">Reports</div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-sm muted">Call Status</div>
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="input rounded-md w-full sm:w-auto"
          >
            <option value="both">Both</option>
            <option value="Fresh Call">Fresh Call</option>
            <option value="Followup Call">Followup Call</option>
          </select>
        </div>
      </div>
      {error && <div className="border border-red-600 text-red-700 dark:text-red-400 p-3 rounded-lg">{error}</div>}

      {/* KPI Cards with per-card gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card title="YTD" subtitle="Last YTD" value={Number(cards?.ytd ?? 0)} lastValue={Number(cards?.lastYear ?? 0)} info="Total calls since the start of the year" variant="metric-purple" />
        <Card title="MTD" subtitle="Last MTD" value={Number(cards?.mtd ?? 0)} lastValue={Number(cards?.lastMonth ?? 0)} info="Total calls since the start of the month" variant="metric-teal" />
        <Card title="WTD" subtitle="Last WTD" value={Number(cards?.wtd ?? 0)} lastValue={Number(cards?.lastWeek ?? 0)} info="Total calls since the start of the week" variant="metric-orange" />
        <Card title="Yesterday" subtitle="Day Before" value={Number(cards?.yesterday ?? 0)} lastValue={Number(cards?.dayBefore ?? 0)} info="Total calls made on the previous day" variant="metric-pink" />
      </div>

      {/* Call Time Distribution + Peak Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.6fr] gap-3 sm:gap-4">
        <CallTimeDistribution data={callDistData} />
        <PeakCallHours data={peakHoursData} />
      </div>

      {/* Call to Lead Conversion Ratio + Eventwise table side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <FunnelConversion
          data={filteredFunnel}
          filter={funnelFilter}
          onToggle={(k) => setFunnelFilter((s) => ({ ...s, [k]: !s[k] }))}
        />
        {/* Eventwise Agent Performance moved next to funnel */}
        <EventwiseTable rows={Array.isArray(events) ? events : []} heightRem={24} />
      </div>

      {/* Agent Script Adherence (placed below funnel/eventwise) */}
      <AdherenceTable rows={Array.isArray(adherence) ? adherence : []} />

      {/* Agent Performance Timeline */}
      <AgentTimeline
        users={timeline.users}
        dates={timeline.dates}
        grid={timeline.grid}
        scoreType={scoreType}
        month={month}
        onChangeScoreType={setScoreType}
        onChangeMonth={setMonth}
      />

      {/* Agent Performance Report (table) */}
      <AgentReportTable rows={Array.isArray(agentReport) ? agentReport : []} />

      {loading && <div className="text-sm muted">Loading reports...</div>}
    </div>
  );
}
