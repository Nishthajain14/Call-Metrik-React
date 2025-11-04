import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReportsAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Sankey } from 'recharts';
import { useLoading } from '../context/LoadingContext';

const CACHE_TTL_MS = 5 * 60 * 1000;
function readCache(key){ try{ const raw = sessionStorage.getItem(key); if(!raw) return null; const obj = JSON.parse(raw); if(!obj||!obj.t||Date.now()-obj.t> CACHE_TTL_MS) return null; return obj.v; }catch{ return null; } }
function writeCache(key, value){ try{ sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); }catch{} }
function keyReports(userId, callStatus, month, scoreType){ return `reports:${userId}:${callStatus}:${month}:${scoreType}`; }

function Arrow({ up }) {
  return (
    <span className={up ? 'text-emerald-400' : 'text-rose-400'}>
      {up ? '▲' : '▼'}
    </span>
  );
}

function Info({ text }){
  return (
    <span
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] border-neutral-300 text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white"
      title={text}
    >
      i
    </span>
  );
}

function Card({ title, subtitle, value, lastValue, info, variant = 'metric-purple' }) {
  const up = typeof value === 'number' && typeof lastValue === 'number' ? value >= lastValue : null;
  return (
    <div className={`metric-subtle ${variant}`}>
      <div className="text-sm muted mb-1 flex items-center gap-2 italic">
        {title}
        {info ? <Info text={info} /> : null}
      </div>
      <div className="text-2xl font-semibold flex items-center gap-2">
        <span className="kpi-number">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {up !== null && <Arrow up={up} />}
      </div>
      {subtitle ? (
        <div className="text-xs mt-1 opacity-90">
          {subtitle} : <span className="font-medium">{typeof lastValue === 'number' ? lastValue.toLocaleString() : lastValue}</span>
        </div>
      ) : null}
    </div>
  );
}

function LegendItem({ color, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-sm ${active ? 'text-neutral-900 dark:text-neutral-200' : 'text-neutral-500 line-through'} hover:opacity-90`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 18L3 6h18L12 18z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

export default function Reports() {
  const { userId } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();
  const [cards, setCards] = useState(null);
  const [callDist, setCallDist] = useState([]);
  const [peak, setPeak] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [agentReport, setAgentReport] = useState([]);
  const [events, setEvents] = useState([]);
  const [adherence, setAdherence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callStatus, setCallStatus] = useState('both'); // both | Fresh Call | Followup Call
  const [scoreType, setScoreType] = useState('OFE Score'); // default per request
  const [month, setMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
  const [scoreCard, setScoreCard] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let on = true;
    async function load() {
      try {
        const key = keyReports(userId, callStatus, month, scoreType);
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
        setGlobalLoading(true);
        const [cm, cd, ph, funnelRes, ar, ev, ad, sc] = await Promise.all([
          ReportsAPI.cardMetrics(userId, { callStatus }),
          ReportsAPI.callTimeDistribution(userId, { callStatus }),
          ReportsAPI.peakCallHours(userId, { callStatus }),
          ReportsAPI.callToLeadConversion(userId, { callStatus }),
          ReportsAPI.agentReport(userId, { callStatus }),
          ReportsAPI.eventsByAgent(userId),
          ReportsAPI.agentFollowedScript(userId, { callStatus }),
          ReportsAPI.agentScoreCard(userId, { month, scoreType, callStatus }),
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
      } catch (e) {
        const msg = getErrorMessage(e, 'Failed to load reports');
        setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
      } finally {
        setLoading(false);
        setGlobalLoading(false);
      }
    }
    load();
    return () => {
      on = false;
    };
  }, [callStatus, month, scoreType, userId]);

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

  const sankeyConv = useMemo(() => {
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z]/g, '');
    const getCount = (key: string) => {
      const item = funnelData.find(d => norm(String(d.stage)) === key);
      return Number(item?.count ?? 0);
    };
    const connected = getCount('connectedcalls');
    const fresh = getCount('freshcalls');
    // handle "followup calls" or "follow-up calls"
    const follow = getCount('followupcalls');
    const undef = Math.max(0, connected - fresh - follow);
    const nodes = [
      { name: `Connected Calls` },
      { name: `Fresh Calls` },
      { name: `Follow-up Calls` },
      { name: `Undefined` },
    ];
    const links = [
      { source: 0, target: 1, value: Math.max(fresh, 0), color: '#22c55e80' },
      { source: 0, target: 2, value: Math.max(follow, 0), color: '#6366f180' },
      { source: 0, target: 3, value: Math.max(undef, 0), color: '#9d434380' },
    ];
    return { nodes, links, totals: { connected, fresh, follow, undef } };
  }, [funnelData]);

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
      <div className="flex items-center justify-between glass surface rounded-xl px-3 py-2">
        <div className="text-xl font-semibold font-display">Reports</div>
        <div className="flex items-center gap-3">
          <div className="text-sm muted">Call Status</div>
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="input rounded-md"
          >
            <option value="both">Both</option>
            <option value="Fresh Call">Fresh Call</option>
            <option value="Followup Call">Followup Call</option>
          </select>
        </div>

      </div>
      {error && <div className="border border-red-600 text-red-700 dark:text-red-400 p-3 rounded-lg">{error}</div>}

      {/* KPI Cards with per-card gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="YTD" subtitle="Last YTD" value={Number(cards?.ytd ?? 0)} lastValue={Number(cards?.lastYear ?? 0)} info="Total calls since the start of the year" variant="metric-purple" />
        <Card title="MTD" subtitle="Last MTD" value={Number(cards?.mtd ?? 0)} lastValue={Number(cards?.lastMonth ?? 0)} info="Total calls since the start of the month" variant="metric-teal" />
        <Card title="WTD" subtitle="Last WTD" value={Number(cards?.wtd ?? 0)} lastValue={Number(cards?.lastWeek ?? 0)} info="Total calls since the start of the week" variant="metric-orange" />
        <Card title="Yesterday" subtitle="Day Before" value={Number(cards?.yesterday ?? 0)} lastValue={Number(cards?.dayBefore ?? 0)} info="Total calls made on the previous day" variant="metric-pink" />
      </div>

      {/* Call Time Distribution + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4">
        <div className="card-elevated p-4 hover-lift ambient">
          <div className="font-semibold font-display mb-3">Call Time Distribution</div>
          <div className={`h-72`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callDistData}>
                <defs>
                  <linearGradient id="barA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7"/>
                    <stop offset="100%" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="url(#barA)" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-elevated p-4 hover-lift ambient">
          <div className="font-semibold font-display mb-3">Peak Call Hours</div>
          <div className={`h-72`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHoursData} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="peakArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                    <stop offset="90%" stopColor="#7c3aed" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }} cursor={{ stroke: '#7c3aed', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#peakArea)" isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Call to Lead Conversion Ratio + Eventwise table side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-elevated p-4 hover-lift">
          <div className="font-semibold font-display mb-3">Call To Lead Conversion Ratio</div>
          <div className="h-[28rem]">
            {sankeyConv.totals.connected ? (
              <ResponsiveContainer width="100%" height="100%" className="max-w-3xl">
                <Sankey
                  data={{
                    nodes: sankeyConv.nodes,
                    links: sankeyConv.links
                  }}
                  nodeWidth={8}
                  nodePadding={24}
                  margin={{ top: 8, right: 40, bottom: 8, left: 40 }}
                  node={{ fill: 'rgba(123, 55, 241, 0.57)', stroke: 'rgba(123, 55, 241, 0.57)' }}                >
                  <Tooltip
                    formatter={(v, n, p) => {
                      const total = sankeyConv.totals.connected || 0;
                      const val = Number(p?.payload?.value ?? v) || 0;
                      const pct = total ? ((val/total)*100).toFixed(2) : '0.00';
                      const label = p?.payload?.target?.name ?? '';
                      return [`${val.toLocaleString()} (${pct}%)`, label];
                    }}
                    contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)' }}
                    cursor={{ fill: 'transparent' }}
                  />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm muted">No data</div>
            )}
          </div>
          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            <div>Connected Calls: <span className="font-medium text-neutral-700 dark:text-neutral-300">{sankeyConv.totals.connected?.toLocaleString?.() ?? 0}</span></div>
            <div className="flex flex-wrap gap-4 mt-1">
              <span className="inline-flex items-center gap-2"><span style={{ width:10, height:10, borderRadius:9999, background:'#22c55e', display:'inline-block' }} /> Fresh Calls: {sankeyConv.totals.fresh?.toLocaleString?.() ?? 0}</span>
              <span className="inline-flex items-center gap-2"><span style={{ width:10, height:10, borderRadius:9999, background:'#6366f1', display:'inline-block' }} /> Follow-up Calls: {sankeyConv.totals.follow?.toLocaleString?.() ?? 0}</span>
              <span className="inline-flex items-center gap-2"><span style={{ width:10, height:10, borderRadius:9999, background:'#9d4343ff', display:'inline-block' }} /> Undefined: {sankeyConv.totals.undef?.toLocaleString?.() ?? 0}</span>
            </div>
          </div>
        </div>
        {/* Eventwise Agent Performance moved next to funnel */}
        <div className="card-elevated p-4 hover-lift">
          <div className="font-semibold font-display mb-3">Eventwise Agent Performance</div>
          <div className="overflow-x-auto max-h-[48vh] overflow-y-auto rounded-lg">
            <table className="w-full text-sm table-zebra table-sticky">
              <thead className="text-left text-neutral-600 dark:text-neutral-300">
                <tr>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Agents Followed(%)</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(events) && events.length ? (
                  events.map((e, i) => (
                    <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="py-2 pr-4">{e.Event}</td>
                      <td className="py-2 pr-4">{e.AgentsFollowedRate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={2}>No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Agent Script Adherence (placed below funnel/eventwise) */}
      <div className="card-elevated p-4 hover-lift">
        <div className="font-semibold font-display mb-3">Agent Script Adherence</div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-lg">
          <table className="w-full text-sm table-glass table-zebra table-sticky">
            <thead className="text-left text-neutral-600 dark:text-neutral-300">
              <tr>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Number of Calls</th>
                <th className="py-2 pr-4">Average Script Adherence(%)</th>
                <th className="py-2 pr-4">Profile</th>
                <th className="py-2 pr-4">Followup Specific</th>
                <th className="py-2 pr-4">Introduction</th>
                <th className="py-2 pr-4">Conversion</th>
                <th className="py-2 pr-4">Profiling</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(adherence) && adherence.length ? (
                adherence.map((r, i) => {
                  const map = Object.fromEntries((r.scriptStats || []).map(s => [s.event, s.averagePercent]));
                  return (
                    <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="py-2 pr-4">{r.agent}</td>
                      <td className="py-2 pr-4">{r.nCalls}</td>
                      <td className="py-2 pr-4">{r.avgFullScriptPercent?.toFixed?.(2)}</td>
                      <td className="py-2 pr-4">{map['Profile'] ?? '-'}</td>
                      <td className="py-2 pr-4">{map['Followup Specific'] ?? '-'}</td>
                      <td className="py-2 pr-4">{map['Introduction'] ?? '-'}</td>
                      <td className="py-2 pr-4">{map['Conversion'] ?? '-'}</td>
                      <td className="py-2 pr-4">{map['Profiling'] ?? '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={8}>No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Performance Timeline */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold font-display">Agent Performance Timeline</div>
          <div className="flex items-center gap-2">
            <select value={scoreType} onChange={(e) => setScoreType(e.target.value)} className="input rounded-md">
              <option>OFE Score</option>
              <option>Weighted Score</option>
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="input rounded-md">
              {months.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        {timeline.dates.length && timeline.users.length ? (
          <div className="relative overflow-auto">
            <div className="min-w-[820px]">
              <div
                className="grid"
                style={{ gridTemplateColumns: `160px repeat(${timeline.dates.length}, 1fr)`, paddingTop: 28 }}
              >
                {/* Sticky corner blank cell */}
                <div
                  className="sticky top-0 left-0 z-20 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40"
                  style={{ height: 28 }}
                />
                {/* Sticky date headers */}
                {timeline.dates.map((d) => (
                  <div
                    key={d}
                    className="sticky top-0 z-10 text-[10px] text-neutral-600 text-center py-1 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:text-neutral-300 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40"
                  >
                    {new Date(d).getDate().toString().padStart(2, '0')}
                  </div>
                ))}
                {/* Rows */}
                {timeline.users.map((u, ri) => (
                  <>
                    <div
                      key={`${u}-label`}
                      className="sticky left-0 z-10 text-xs text-neutral-900 py-1 pr-3 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:text-neutral-200 dark:bg-neutral-900/60 dark:supports-[backdrop-filter]:bg-neutral-900/40"
                      style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}
                    >
                      {u}
                    </div>
                    {timeline.grid[ri]?.map?.((val, ci) => {
                      const v = val === '-' ? 0 : Number(val) || 0;
                      // perceptual scale with better low-end sensitivity and broader range
                      let t = Math.max(0, Math.min(1, v / 100));
                      t = Math.pow(t, 0.5); // emphasize small differences
                      const hue = 250 - 190 * t; // purple(250) -> greenish(60)
                      const sat = 70 + 20 * t;   // 70%..90%
                      const light = 88 - 38 * t; // 88%..50%
                      const bg = v ? `hsl(${hue}deg ${sat}% ${light}%)` : 'var(--chart-grid)';
                      return (
                        <div
                          key={`${u}-${ci}`}
                          className="h-5 mx-[2px] my-[3px] rounded-md shadow-sm transition-transform duration-150"
                          style={{ background: bg }}
                          title={`${u} • ${timeline.dates[ci]}: ${v}%`}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="mt-3 flex items-center gap-3 justify-end">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Low</span>
              <div className="h-2 w-40 rounded-full" style={{
                background: 'linear-gradient(90deg, rgb(40,80,160) 0%, rgb(180,160,60) 50%, rgb(180,220,80) 100%)'
              }} />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">High</span>
            </div>
          </div>
        ) : (
          <div className="text-sm muted">No timeline data</div>
        )}
      </div>

      {/* Agent Performance Report (table) */}
      <div className="card-elevated p-4 hover-lift">
        <div className="font-semibold font-display mb-3 flex items-center">
        Agent Performance Report
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-lg">
          <table className="w-full text-sm table-sticky">
            <thead className="text-left text-neutral-600 dark:text-neutral-300">
              <tr>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Number of Calls</th>
                <th className="py-2 pr-4">Avg Call Duration (sec)</th>
                <th className="py-2 pr-4">Avg OFE Score (%)</th>
                <th className="py-2 pr-4">Avg Weighted Score (%)</th>
                <th className="py-2 pr-4">Avg Positive Sentiment (%)</th>
                <th className="py-2 pr-4">Avg Negative Sentiment (%)</th>
                <th className="py-2 pr-4">Avg Neutral Sentiment (%)</th>
                <th className="py-2 pr-4">Avg Customer Talk Time (%)</th>
                <th className="py-2 pr-4">Avg Agent Talk Time (%)</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(agentReport) && agentReport.length ? (
                agentReport.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 pr-4">{r.userName}</td>
                    <td className="py-2 pr-4">{r.ncalls}</td>
                    <td className="py-2 pr-4">{r.avgFileDurationSeconds?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgSalespersonScore?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgWeightedScore?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgPositiveSentiment?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgNegativeSentiment?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgNeutralSentiment?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgCustomerConvo?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{r.avgSalespersonConvo?.toFixed?.(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={10}>No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <div className="text-sm muted">Loading reports...</div>}
    </div>
  );
}
