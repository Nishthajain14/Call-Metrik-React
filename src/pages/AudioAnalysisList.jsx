import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Link2, FileText } from 'lucide-react';
import { AudioAPI, AudioProcessAPI, getErrorMessage, isNetworkError } from '../lib/api';

const USER_ID = 7;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  try{ sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); }catch{}
}
function keyRows(userId, month, year, filters){
  return `list:${userId}:${month}:${year}:${JSON.stringify(filters||{})}`;
}
function keyOpts(){ return 'list:options'; }

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function AudioAnalysisList() {
  const { month } = useParams();
  const q = useQuery();
  const navigate = useNavigate();
  const [year] = useState(Number(q.get('year')) || new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ audioStatus: [], sentiment: [], uploadSource: [] });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('createdDate');
  const [sortDir, setSortDir] = useState('desc');
  const [busy, setBusy] = useState({}); // { [audioId]: true }
  const [notice, setNotice] = useState({ type: '', text: '' });

  async function load() {
    try {
      const cacheK = keyRows(USER_ID, month, year, filters);
      const cached = readCache(cacheK);
      if (cached) { setRows(cached); setLoading(false); }
      else { setLoading(true); }
      const params = {};
      if (filters.audioStatus?.length) params.audioStatus = filters.audioStatus.join(',');
      if (filters.sentiment?.length) params.sentiment = filters.sentiment.join(',');
      if (filters.uploadSource?.length) params.uploadSource = filters.uploadSource.join(',');
      params.limit = 10000; // fetch all
      const data = await AudioAPI.monthRecords(USER_ID, month, year, params);
      const arr = Array.isArray(data) ? data : data?.data || [];
      setRows(arr);
      writeCache(cacheK, arr);
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to load records');
      setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year, JSON.stringify(filters)]);

  useEffect(() => {
    async function loadOptions(){
      try {
        const k = keyOpts();
        const cached = readCache(k);
        if (cached) setOptions(cached);
        const res = await AudioAPI.recordFilterOptions();
        setOptions(res || {});
        writeCache(k, res || {});
      } catch {}
    }
    loadOptions();
  }, []);

  function toSeconds(hms) {
    if (!hms) return 0;
    const s = String(hms).trim();
    const parts = s.split(':').map(Number).filter((n)=>!Number.isNaN(n));
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === 'desc' ? -1 : 1;
    arr.sort((a,b) => {
      const key = sortKey;
      let av, bv;
      switch(key){
        case 'fileName':
          av = a.fileName || a.filename || '';
          bv = b.fileName || b.filename || '';
          return av.localeCompare(bv) * dir;
        case 'duration':
          av = toSeconds(a.duration || a.fileDuration);
          bv = toSeconds(b.duration || b.fileDuration);
          return (av - bv) * dir;
        case 'uploadSource':
          av = a.uploadSource || '';
          bv = b.uploadSource || '';
          return av.localeCompare(bv) * dir;
        case 'executiveName':
          av = a.executiveName || a.username || a.userName || '';
          bv = b.executiveName || b.username || b.userName || '';
          return av.localeCompare(bv) * dir;
        case 'managerName':
          av = a.managerName || a.manager || '';
          bv = b.managerName || b.manager || '';
          return av.localeCompare(bv) * dir;
        case 'ofeAccuracy': {
          const ao = Number(a.ofeAccuracy ?? a.salespersonScore ?? a.weightedScore ?? a.OFE_Accuracy ?? 0) || 0;
          const bo = Number(b.ofeAccuracy ?? b.salespersonScore ?? b.weightedScore ?? b.OFE_Accuracy ?? 0) || 0;
          return (ao - bo) * dir;
        }
        case 'sentiment': {
          const as = String(a.sentiment || a.overallsentiment || a.overallSentiment || a.overall_sentiment || '').toLowerCase();
          const bs = String(b.sentiment || b.overallsentiment || b.overallSentiment || b.overall_sentiment || '').toLowerCase();
          return as.localeCompare(bs) * dir;
        }
        case 'status': {
          av = a.audiostatus || a.audioStatus || a.status || '';
          bv = b.audiostatus || b.audioStatus || b.status || '';
          return av.localeCompare(bv) * dir;
        }
        case 'createdDate':
        default:
          av = Date.parse(a.createdDate || a.createdAt || 0);
          bv = Date.parse(b.createdDate || b.createdAt || 0);
          return (av - bv) * dir;
      }
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function normalizeSentiment(val) {
    const s = String(val || '').toUpperCase();
    if (s.includes('POSITIVE')) return 'POSITIVE';
    if (s.includes('NEGATIVE')) return 'NEGATIVE';
    if (s.includes('NEUTRAL')) return 'NEUTRAL';
    return '';
  }

  function normalizeText(val){
    return String(val || '').trim().toLowerCase();
  }

  const filtered = useMemo(() => {
    const hasAnyFilter = (filters.audioStatus?.length || filters.sentiment?.length || filters.uploadSource?.length);
    if (!hasAnyFilter) return sorted;
    const st = new Set((filters.audioStatus||[]).map((x)=>normalizeText(x)));
    const se = new Set((filters.sentiment||[]).map((x)=>String(x).toUpperCase()));
    const us = new Set((filters.uploadSource||[]).map((x)=>normalizeText(x)));
    return sorted.filter((r)=>{
      let ok = true;
      if (st.size){
        const status = normalizeText(r.audiostatus || r.audioStatus || r.status);
        ok = ok && st.has(status);
      }
      if (se.size){
        const sent = normalizeSentiment(r.sentiment || r.overallsentiment || r.overallSentiment || r.overall_sentiment);
        ok = ok && se.has(sent);
      }
      if (us.size){
        const src = normalizeText(r.uploadSource);
        ok = ok && us.has(src);
      }
      return ok;
    });
  }, [sorted, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / (pageSize === -1 ? filtered.length : pageSize)));
  const pageRows = useMemo(() => {
    if (pageSize === -1) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  async function handleProcess(audioId){
    try{
      setBusy((b)=>({ ...b, [audioId]: true }));
      const res = await AudioProcessAPI.process(USER_ID, audioId);
      try { console.group('Process Trigger'); console.log('audioId', audioId); console.log('response', res); console.groupEnd(); } catch {}
      const msg = typeof res === 'string' ? res : (res?.message || 'Processing triggered');
      setNotice({ type: 'ok', text: msg });
      await load();
    } catch(e){
      const msg = getErrorMessage(e, 'Failed to start processing');
      setNotice({ type: 'err', text: isNetworkError(e) ? 'Network error. Please check your connection.' : msg });
    } finally{
      setBusy((b)=>{ const x = { ...b }; delete x[audioId]; return x; });
    }
  }

  async function handleReAudit(audioId){
    try{
      setBusy((b)=>({ ...b, [audioId]: true }));
      const res = await AudioProcessAPI.reAudit(USER_ID, audioId);
      try { console.group('Re-Audit Trigger'); console.log('audioId', audioId); console.log('response', res); console.groupEnd(); } catch {}
      const msg = typeof res === 'string' ? res : (res?.message || 'Re-Audit triggered');
      setNotice({ type: 'ok', text: msg });
      await load();
    } catch(e){
      const msg = getErrorMessage(e, 'Failed to trigger re-audit');
      setNotice({ type: 'err', text: isNetworkError(e) ? 'Network error. Please check your connection.' : msg });
    } finally{
      setBusy((b)=>{ const x = { ...b }; delete x[audioId]; return x; });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={()=>navigate(-1)} aria-label="Back" className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-300"><ChevronLeft size={18} /></button>
          <div className="text-xl font-semibold">Analysed Audio Files</div>
        </div>
      {notice.text && (
        <div className={`text-sm px-3 py-2 rounded-md border ${notice.type==='err' ? 'bg-rose-950/40 text-rose-300 border-rose-800':'bg-emerald-950/40 text-emerald-300 border-emerald-800'}`}>{notice.text}</div>
      )}
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={75}>75</option>
            <option value={-1}>All</option>
          </select>
          <button onClick={load} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm">Reload</button>
          <button onClick={()=>setShowFilters(true)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm">Filter</button>
          <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-500 text-sm px-3 py-1.5 rounded-md">Add New Audio</Link>
        </div>
      </div>

      <div className="card p-4">
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-300">
              <tr>
                <th className="py-2 pr-4">SL No</th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={()=>handleSort('fileName')}>File Name {sortKey==='fileName' ? (sortDir==='asc' ? '▲':'▼') : '↕'}</th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={()=>handleSort('duration')}>Duration (HH:MM:SS) {sortKey==='duration' ? (sortDir==='asc' ? '▲':'▼') : '↕'}</th>
                <th className="py-2 pr-4">Upload Source</th>
                <th className="py-2 pr-4">Agent Name</th>
                <th className="py-2 pr-4">Manager Name</th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={()=>handleSort('ofeAccuracy')}>OFE Accuracy {sortKey==='ofeAccuracy' ? (sortDir==='asc' ? '▲':'▼') : '↕'}</th>
                <th className="py-2 pr-4">Sentiment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 cursor-pointer select-none" onClick={()=>handleSort('createdDate')}>Created Date {sortKey==='createdDate' ? (sortDir==='asc' ? '▲':'▼') : '↕'}</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-3" colSpan={11}>Loading...</td></tr>
              ) : pageRows.length ? (
                pageRows.map((r, i) => {
                  const perPage = (pageSize === -1 ? filtered.length : pageSize);
                  const idx = (page - 1) * perPage + i + 1;
                  const audioId = r.audioId || r.audio_id || r.id || r.audioID;
                  const execName = r.executiveName || r.username || r.userName || r.executive || '-';
                  const ofeRaw = r.ofeAccuracy ?? r.salespersonScore ?? r.weightedScore ?? r.OFE_Accuracy;
                  const ofe = (ofeRaw === null || ofeRaw === undefined || ofeRaw === '' || ofeRaw === '-') ? 0 : ofeRaw;
                  const sent = r.sentiment || r.overallsentiment || r.overallSentiment || r.overall_sentiment || '';
                  // If backend provides Call field, prefer it even if it's an empty string
                  const hasCall = Object.prototype.hasOwnProperty.call(r, 'Call') || Object.prototype.hasOwnProperty.call(r, 'call');
                  const status = hasCall ? (r.Call ?? r.call ?? '') : (r.audiostatus || r.audioStatus || r.status || '');
                  const sentimentUi = (()=>{
                    const s = String(sent).toLowerCase();
                    if (s.includes('positive')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300">🙂<span className="hidden sm:inline">Positive</span></span>;
                    if (s.includes('negative')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300">🙁<span className="hidden sm:inline">Negative</span></span>;
                    if (s.includes('neutral')) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-600/20 text-slate-300">😐<span className="hidden sm:inline">Neutral</span></span>;
                    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300">?<span className="hidden sm:inline">Unknown</span></span>;
                  })();
                  const statusUi = (()=>{
                    const s = String(status).toLowerCase();
                    if (!hasCall && s.includes('processed')) return <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-600/70 text-black">Processed</span>;
                    if (s.includes('insufficient')) return <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/80 text-black">Insufficient Audio Duration</span>;
                    if (s.includes('failed')) return <span className="inline-block px-2 py-0.5 rounded-md bg-rose-500/80 text-black">Failed</span>;
                    if (s) return <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 capitalize">{s}</span>;
                    return <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-700 text-neutral-200">-</span>;
                  })();
                  return (
                    <tr key={audioId || idx} className="border-t border-neutral-800 hover:bg-neutral-900/40 cursor-pointer" onClick={()=>navigate(`/audio-details/${audioId}`)}>
                      <td className="py-2 pr-4">{idx}</td>
                      <td className="py-2 pr-4 text-indigo-400 underline">{r.fileName || r.filename || audioId}</td>
                      <td className="py-2 pr-4">{r.duration || r.fileDuration || '-'}</td>
                      <td className="py-2 pr-4">
                        {(()=>{
                          const src = String(r.uploadSource || '').toLowerCase();
                          if (!src) return '•';
                          const isUrl = src.includes('url');
                          const isDoc = src.includes('doc') || src.includes('file');
                          return isUrl ? <span className="inline-flex items-center gap-1 text-neutral-300"><Link2 size={14}/> URL</span> : isDoc ? <span className="inline-flex items-center gap-1 text-neutral-300"><FileText size={14}/> Document</span> : <span className="inline-flex items-center gap-1 text-neutral-300"><FileText size={14}/> {r.uploadSource}</span>;
                        })()}
                      </td>
                      <td className="py-2 pr-4">{execName}</td>
                      <td className="py-2 pr-4">{r.managerName || r.manager || '-'}</td>
                      <td className="py-2 pr-4">{ofe}</td>
                      <td className="py-2 pr-4">{sentimentUi}</td>
                      <td className="py-2 pr-4">{statusUi}</td>
                      <td className="py-2 pr-4">{r.createdDate || r.createdAt || '-'}</td>
                      <td className="py-2 pr-4">
                        {(()=>{
                          const s = String(status).toLowerCase();
                          if (s === 'process' || s === 'processed') return <span className="text-emerald-300">Done</span>;
                          if (s === 'uploaded') return (
                            <button
                              onClick={(e)=>{ e.stopPropagation(); handleProcess(audioId); }}
                              disabled={!!busy[audioId]}
                              className="bg-indigo-600 hover:bg-indigo-500 rounded-md px-2 py-1 text-xs disabled:opacity-60"
                            >
                              {busy[audioId] ? '...' : 'Process'}
                            </button>
                          );
                          if (s === 'not audited' || s === 'not_audited' || s==='nonaudited' || s==='notaudited') return (
                            <button
                              onClick={(e)=>{ e.stopPropagation(); handleReAudit(audioId); }}
                              disabled={!!busy[audioId]}
                              className="bg-violet-600 hover:bg-violet-500 rounded-md px-2 py-1 text-xs disabled:opacity-60"
                            >
                              {busy[audioId] ? '...' : 'Re-Audit'}
                            </button>
                          );
                          if (s === 'processing') return <span className="text-amber-300">In-Progress</span>;
                          if (s.includes('insufficient')) return <span>-</span>;
                          return <span>-</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="py-3 text-neutral-400" colSpan={11}>{(filters.audioStatus?.length || filters.sentiment?.length || filters.uploadSource?.length) ? 'No results found' : 'No records'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pageSize !== -1 && (
          <div className="flex items-center justify-end gap-2 mt-3 text-sm">
            <span className="muted">{(page-1)*pageSize+1} - {Math.min(page*pageSize, filtered.length)} of {filtered.length}</span>
            <button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 disabled:opacity-50">Prev</button>
            <button disabled={page>=totalPages} onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="text-lg font-semibold mb-4">Filter Options</div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-300 mb-2">Audio Status</div>
                <div className="flex flex-wrap gap-2">
                  {(options.audioStatus || []).map((o) => {
                    const active = filters.audioStatus.includes(o.value || o.label || o);
                    const val = o.value || o.label || o;
                    return (
                      <button key={val} onClick={()=>{
                        setFilters((f)=>{
                          const s = new Set(f.audioStatus);
                          if (s.has(val)) s.delete(val); else s.add(val);
                          return { ...f, audioStatus: Array.from(s) };
                        });
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500':'bg-neutral-800 border-neutral-700'}`}>{o.label || o.value || o}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-300 mb-2">Sentiment</div>
                <div className="flex flex-wrap gap-2">
                  {(options.sentiment || []).map((o) => {
                    const active = filters.sentiment.includes(o.value || o.label || o);
                    const val = o.value || o.label || o;
                    return (
                      <button key={val} onClick={()=>{
                        setFilters((f)=>{
                          const s = new Set(f.sentiment);
                          if (s.has(val)) s.delete(val); else s.add(val);
                          return { ...f, sentiment: Array.from(s) };
                        });
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500':'bg-neutral-800 border-neutral-700'}`}>{o.label || o.value || o}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-300 mb-2">Upload Source</div>
                <div className="flex flex-wrap gap-2">
                  {(options.uploadSource || []).map((o) => {
                    const active = filters.uploadSource.includes(o.value || o.label || o);
                    const val = o.value || o.label || o;
                    return (
                      <button key={val} onClick={()=>{
                        setFilters((f)=>{
                          const s = new Set(f.uploadSource);
                          if (s.has(val)) s.delete(val); else s.add(val);
                          return { ...f, uploadSource: Array.from(s) };
                        });
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500':'bg-neutral-800 border-neutral-700'}`}>{o.label || o.value || o}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={()=>{ setFilters({ audioStatus: [], sentiment: [], uploadSource: [] }); }} className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm">Reset Filters</button>
              <div className="flex items-center gap-2">
                <button onClick={()=>setShowFilters(false)} className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-sm">Close</button>
                <button onClick={()=>{ setShowFilters(false); load(); }} className="bg-indigo-600 hover:bg-indigo-500 rounded-md px-3 py-1.5 text-sm">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
