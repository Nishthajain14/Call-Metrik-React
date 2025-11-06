import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Link2, FileText, FolderOpen } from 'lucide-react';
import { AudioAPI, AudioProcessAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

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
  const { userId } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();
  const [year] = useState(Number(q.get('year')) || new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<any>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ audioStatus: string[]; sentiment: string[]; uploadSource: string[] }>({ audioStatus: [], sentiment: [], uploadSource: [] });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('createdDate');
  const [sortDir, setSortDir] = useState('desc');
  const [busy, setBusy] = useState({}); // { [audioId]: true }
  const [notice, setNotice] = useState({ type: '', text: '' });

  async function load() {
    try {
      if (!userId) return;
      const cacheK = keyRows(userId, month, year, filters);
      const cached = readCache(cacheK);
      if (cached) { setRows(cached); setLoading(false); }
      else { setLoading(true); }
      setGlobalLoading(true);
      const params: any = {};
      if (filters.audioStatus?.length) params.audioStatus = filters.audioStatus.join(',');
      if (filters.sentiment?.length) params.sentiment = filters.sentiment.join(',');
      if (filters.uploadSource?.length) params.uploadSource = filters.uploadSource.join(',');
      params.limit = 10000; // fetch all
      const data = await AudioAPI.monthRecords(userId, month, year, params);
      const arr = Array.isArray(data) ? data : data?.data || [];
      setRows(arr);
      writeCache(cacheK, arr);
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to load records');
      setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year, JSON.stringify(filters), userId]);

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

  // no-op: viewport-centered modal

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
      setGlobalLoading(true);
      setBusy((b)=>({ ...b, [audioId]: true }));
      const res = await AudioProcessAPI.process(userId, audioId);
      try { console.group('Process Trigger'); console.log('audioId', audioId); console.log('response', res); console.groupEnd(); } catch {}
      const msg = typeof res === 'string' ? res : (res?.message || 'Processing triggered');
      setNotice({ type: 'ok', text: msg });
      await load();
    } catch(e){
      const msg = getErrorMessage(e, 'Failed to start processing');
      setNotice({ type: 'err', text: isNetworkError(e) ? 'Network error. Please check your connection.' : msg });
    } finally{
      setBusy((b)=>{ const x = { ...b }; delete x[audioId]; return x; });
      setGlobalLoading(false);
    }
  }

  async function handleReAudit(audioId){
    try{
      setGlobalLoading(true);
      setBusy((b)=>({ ...b, [audioId]: true }));
      const res = await AudioProcessAPI.reAudit(userId, audioId);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 glass surface rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <button onClick={()=>navigate(-1)} aria-label="Back" className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-300"><ChevronLeft size={18} /></button>
          <div className="text-xl font-semibold">Analysed Audio Files</div>
        </div>
      {notice.text && (
        <div className={`text-sm px-3 py-2 rounded-md glass surface ${notice.type==='err' ? 'text-rose-300':'text-emerald-300'}`}>{notice.text}</div>
      )}
        <div className="flex flex-wrap items-center gap-2">
          <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} className="input rounded-md">
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={75}>75</option>
            <option value={-1}>All</option>
          </select>
          <button onClick={load} className="rounded-md px-2 py-1 text-sm glass surface hover:brightness-110">Reload</button>
          <button onClick={()=>setShowFilters(true)} className="rounded-md px-2 py-1 text-sm glass surface hover:brightness-110">Filter</button>
          <Link to="/upload" className="btn-gradient text-sm px-3 py-1.5 rounded-md">Add New Audio</Link>
        </div>
      </div>

      <div className="card-elevated p-4 hover-lift">
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
         <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm table-zebra table-sticky no-row-borders">
            <thead className="text-left text-neutral-600 dark:text-neutral-300" style={{ backdropFilter: 'none', background: 'transparent' }}>
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
                    if (s.includes('positive')) return <span className="pill pill-ok">🙂<span className="hidden sm:inline">Positive</span></span>;
                    if (s.includes('negative')) return <span className="pill pill-bad">🙁<span className="hidden sm:inline">Negative</span></span>;
                    if (s.includes('neutral')) return <span className="pill pill-info">😐<span className="hidden sm:inline">Neutral</span></span>;
                    return <span className="pill pill-warn">?<span className="hidden sm:inline">Unknown</span></span>;
                  })();
                  const statusUi = (()=>{
                    const s = String(status).toLowerCase();
                    if (!hasCall && s.includes('processed')) return <span className="pill pill-ok">Processed</span>;
                    if (s.includes('insufficient')) return <span className="pill pill-warn">Insufficient</span>;
                    if (s.includes('failed')) return <span className="pill pill-bad">Failed</span>;
                    if (s) return <span className="pill pill-info capitalize">{s}</span>;
                    return <span className="pill">-</span>;
                  })();
                  return (
                    <tr key={audioId || idx} className="border-t border-neutral-800 hover:bg-neutral-900/40 cursor-pointer" onClick={()=>navigate(`/audio-details/${audioId}`)}>
                      <td className="py-2 pr-4">{idx}</td>
                      <td className="py-2 pr-4">
                        {(() => {
                          const full = String(r.fileName || r.filename || audioId);
                          const limit = 28;
                          const short = full.length > limit ? full.slice(0, limit) + '…' : full;
                          return (
                            <div
                              className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-neutral-800 dark:text-neutral-200 font-body"
                              title={full}
                            >
                              {short}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 pr-4">{r.duration || r.fileDuration || '-'}</td>
                      <td className="py-2 pr-4">
                        {(()=>{
                          const src = String(r.uploadSource || '').toLowerCase();
                          if (!src) return '•';
                          const isLink = src.includes('link') || src.includes('url') || src.includes('http');
                          const isBrowse = src.includes('browse') || src.includes('local') || src.includes('file') || src.includes('doc');
                          return (
                            <div className="flex justify-center">
                              {isLink ? (
                                <span className="inline-flex items-center text-neutral-600 dark:text-neutral-300" title="Link"><Link2 size={18}/></span>
                              ) : isBrowse ? (
                                <span className="inline-flex items-center text-neutral-600 dark:text-neutral-300" title="Browse"><FolderOpen size={18}/></span>
                              ) : (
                                <span className="inline-flex items-center text-neutral-600 dark:text-neutral-300" title={String(r.uploadSource || '')}><FileText size={18}/></span>
                              )}
                            </div>
                          );
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
                          if (s === 'process' || s === 'processed') return <span className="text-emerald-700 dark:text-emerald-300">Done</span>;
                          if (s === 'uploaded') return (
                            <button
                              onClick={(e)=>{ e.stopPropagation(); handleProcess(audioId); }}
                              disabled={!!busy[audioId]}
                              className="btn-gradient rounded-md px-2 py-1 text-xs disabled:opacity-60"
                            >
                              {busy[audioId] ? '...' : 'Process'}
                            </button>
                          );
                          if (s === 'not audited' || s === 'not_audited' || s==='nonaudited' || s==='notaudited') return (
                            <button
                              onClick={(e)=>{ e.stopPropagation(); handleReAudit(audioId); }}
                              disabled={!!busy[audioId]}
                              className="btn-gradient rounded-md px-2 py-1 text-xs disabled:opacity-60"
                            >
                              {busy[audioId] ? '...' : 'Re-Audit'}
                            </button>
                          );
                          if (s === 'processing') return <span className="text-amber-700 dark:text-amber-300">In-Progress</span>;
                          if (s.includes('insufficient')) return <span>-</span>;
                          return <span>-</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={11}>{(filters.audioStatus?.length || filters.sentiment?.length || filters.uploadSource?.length) ? 'No results found' : 'No records'}</td></tr>
            )}
            </tbody>
          </table>
        </div>
        {pageSize !== -1 && (
          <div className="flex items-center justify-end gap-2 mt-3 text-sm">
            <span className="muted">{(page-1)*pageSize+1} - {Math.min(page*pageSize, filtered.length)} of {filtered.length}</span>
            <button disabled={page<=1} onClick={()=>setPage((p)=>Math.max(1,p-1))} className="rounded-md px-2 py-1 border border-neutral-300 disabled:opacity-50 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">Prev</button>
            <button disabled={page>=totalPages} onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} className="rounded-md px-2 py-1 border border-neutral-300 disabled:opacity-50 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">Next</button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm" onClick={()=>setShowFilters(false)}>
          <div
            className="fixed left-1/2 -translate-x-1/2 top-[12vh] w-[92vw] sm:w-[85vw] md:w-[720px] max-w-[92vw] max-h-[76vh] overflow-y-auto bg-white border border-neutral-200 rounded-xl p-4 dark:bg-neutral-900 dark:border-neutral-800"
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-4">Filter Options</div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Audio Status</div>
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
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500 text-white':'bg-neutral-100 border-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}>{o.label || o.value || o}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Sentiment</div>
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
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500 text-white':'bg-neutral-100 border-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}>{o.label || o.value || o}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Upload Source</div>
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
                      }} className={`px-3 py-1.5 rounded-full text-xs border ${active? 'bg-indigo-600 border-indigo-500 text-white':'bg-neutral-100 border-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'}`}>{o.label || o.value || o}</button>
                  );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button onClick={()=>{ setFilters({ audioStatus: [], sentiment: [], uploadSource: [] }); }} className="rounded-md px-3 py-1.5 text-sm border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">Reset Filters</button>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button onClick={()=>setShowFilters(false)} className="rounded-md px-3 py-1.5 text-sm border border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">Close</button>
                <button onClick={()=>{ setShowFilters(false); load(); }} className="btn-primary rounded-md px-3 py-1.5 text-sm w-full sm:w-auto">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
