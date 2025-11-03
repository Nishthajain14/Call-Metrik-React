import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ReportsAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, FunnelChart, Funnel, LabelList } from 'recharts';

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
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-700 text-[10px] text-neutral-300 hover:text-white"
      title={text}
    >
      i
    </span>
  );
}

function Card({ title, subtitle, value, lastValue, info }) {
  const up = typeof value === 'number' && typeof lastValue === 'number' ? value >= lastValue : null;
  return (
    <div className="card p-4">
      <div className="text-sm muted mb-1 flex items-center gap-2">
        {title}
        {info ? <Info text={info} /> : null}
      </div>
      <div className="text-2xl font-semibold flex items-center gap-2">
        <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {up !== null && <Arrow up={up} />}
      </div>
      {subtitle ? (
        <div className="text-xs muted mt-1">
          {subtitle} : <span className="text-neutral-300">{typeof lastValue === 'number' ? lastValue.toLocaleString() : lastValue}</span>
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
      className={`flex items-center gap-2 text-sm ${active ? 'text-neutral-200' : 'text-neutral-500 line-through'} hover:opacity-90`}
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
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Reports</div>
        <div className="flex items-center gap-3">
          <div className="text-sm muted">Call Status</div>
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5"
          >
            <option value="both">Both</option>
            <option value="Fresh Call">Fresh Call</option>
            <option value="Followup Call">Followup Call</option>
          </select>
        </div>

      </div>
      {error && <div className="border border-red-600 text-red-400 p-3 rounded-lg">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="YTD" subtitle="Last YTD" value={Number(cards?.ytd ?? 0)} lastValue={Number(cards?.lastYear ?? 0)} info="Total calls since the start of the year" />
        <Card title="MTD" subtitle="Last MTD" value={Number(cards?.mtd ?? 0)} lastValue={Number(cards?.lastMonth ?? 0)} info="Total calls since the start of the month" />
        <Card title="WTD" subtitle="Last WTD" value={Number(cards?.wtd ?? 0)} lastValue={Number(cards?.lastWeek ?? 0)} info="Total calls since the start of the week" />
        <Card title="Yesterday" subtitle="Day Before" value={Number(cards?.yesterday ?? 0)} lastValue={Number(cards?.dayBefore ?? 0)} info="Total calls made on the previous day" />
      </div>

      {/* Call Time Distribution + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4">
        <div className="card p-4">
          <div className="font-semibold mb-3">Call Time Distribution</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callDistData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'transparent', border: 'none' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-3">Peak Call Hours</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <YAxis tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'transparent', border: 'none' }} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Call to Lead Conversion Ratio + Eventwise table side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-semibold mb-3">Call To Lead Conversion Ratio</div>
          <div className="h-[28rem] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" className="max-w-3xl">
              <FunnelChart margin={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="funnelA" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <linearGradient id="funnelB" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <linearGradient id="funnelC" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                <Tooltip formatter={(v, n, p) => [p?.payload?.count ?? v, `${p?.payload?.stage ?? ''}`]} contentStyle={{ background: 'transparent', border: 'none' }} cursor={{ fill: 'transparent' }} />
                <Funnel
                  dataKey="viz"
                  data={filteredFunnel.map((d) => ({ ...d, fill: d.color }))}
                  isAnimationActive={false}
                >
                  <LabelList position="center" dataKey="count" fill="#e5e7eb" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2">
            <LegendItem
              color="#f59e0b"
              label="Connected Calls"
              active={funnelFilter.connected}
              onClick={() => setFunnelFilter((s) => ({ ...s, connected: !s.connected }))}
            />
            <LegendItem
              color="#10b981"
              label="Fresh Calls"
              active={funnelFilter.fresh}
              onClick={() => setFunnelFilter((s) => ({ ...s, fresh: !s.fresh }))}
            />
            <LegendItem
              color="#6366f1"
              label="Follow-up Calls"
              active={funnelFilter.followup}
              onClick={() => setFunnelFilter((s) => ({ ...s, followup: !s.followup }))}
            />
          </div>
        </div>
        {/* Eventwise Agent Performance moved next to funnel */}
        <div className="card p-4">
          <div className="font-semibold mb-3">Eventwise Agent Performance</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-300">
                <tr>
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Agents Followed(%)</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(events) && events.length ? (
                  events.map((e, i) => (
                    <tr key={i} className="border-t border-neutral-800">
                      <td className="py-2 pr-4">{e.Event}</td>
                      <td className="py-2 pr-4">{e.AgentsFollowedRate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 text-neutral-400" colSpan={2}>No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Agent Script Adherence (placed below funnel/eventwise) */}
      <div className="card p-4">
        <div className="font-semibold mb-3">Agent Script Adherence</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-300">
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
                    <tr key={i} className="border-t border-neutral-800">
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
                  <td className="py-3 text-neutral-400" colSpan={8}>No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Performance Timeline */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Agent Performance Timeline</div>
          <div className="flex items-center gap-2">
            <select value={scoreType} onChange={(e) => setScoreType(e.target.value)} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
              <option>OFE Score</option>
              <option>Weighted Score</option>
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
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
                style={{ gridTemplateColumns: `160px repeat(${timeline.dates.length}, 1fr)` }}
              >
                {/* Sticky corner blank cell */}
                <div
                  className="sticky top-0 left-0 z-20 bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/40"
                  style={{ height: 28 }}
                />
                {/* Sticky date headers */}
                {timeline.dates.map((d) => (
                  <div
                    key={d}
                    className="sticky top-0 z-10 text-[10px] text-neutral-300 text-center py-1 bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/40"
                  >
                    {new Date(d).getDate().toString().padStart(2, '0')}
                  </div>
                ))}
                {/* Rows */}
                {timeline.users.map((u, ri) => (
                  <>
                    <div
                      key={`${u}-label`}
                      className="sticky left-0 z-10 text-xs text-neutral-200 py-1 pr-3 bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/40"
                      style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}
                    >
                      {u}
                    </div>
                    {timeline.grid[ri]?.map?.((val, ci) => {
                      const v = val === '-' ? 0 : Number(val) || 0;
                      // blue -> yellow -> green scale
                      const t = v / 100;
                      const r = Math.round(40 + 140 * t);
                      const g = Math.round(80 + 120 * t);
                      const b = Math.round(160 - 120 * t);
                      const bg = v ? `rgb(${r}, ${g}, ${b})` : 'rgba(17,24,39,1)';
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
              <span className="text-xs text-neutral-400">Low</span>
              <div className="h-2 w-40 rounded-full" style={{
                background: 'linear-gradient(90deg, rgb(40,80,160) 0%, rgb(180,160,60) 50%, rgb(180,220,80) 100%)'
              }} />
              <span className="text-xs text-neutral-400">High</span>
            </div>
          </div>
        ) : (
          <div className="text-sm muted">No timeline data</div>
        )}
      </div>

      {/* Agent Performance Report (table) */}
      <div className="card p-4">
        <div className="font-semibold mb-3 flex items-center">
        Agent Performance Report
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-300">
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
                  <tr key={i} className="border-t border-neutral-800">
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
                  <td className="py-3 text-neutral-400" colSpan={10}>No data</td>
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
