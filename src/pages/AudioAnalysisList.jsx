import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AudioAPI } from '../lib/api';

const USER_ID = 7;

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
  const [pageSize, setPageSize] = useState(-1);
  const [page, setPage] = useState(1);

  async function load() {
    try {
      setLoading(true);
      const params = {};
      if (filters.audioStatus?.length) params.audioStatus = filters.audioStatus.join(',');
      if (filters.sentiment?.length) params.sentiment = filters.sentiment.join(',');
      if (filters.uploadSource?.length) params.uploadSource = filters.uploadSource.join(',');
      params.limit = 10000; // fetch all
      const data = await AudioAPI.monthRecords(USER_ID, month, year, params);
      const arr = Array.isArray(data) ? data : data?.data || [];
      setRows(arr);
    } catch (e) {
      setError(e?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month, year, JSON.stringify(filters)]);

  useEffect(() => {
    async function loadOptions(){
      try {
        const res = await AudioAPI.recordFilterOptions();
        setOptions(res || {});
      } catch {}
    }
    loadOptions();
  }, []);

  const filtered = rows; // server-side filtering

  const totalPages = Math.max(1, Math.ceil(filtered.length / (pageSize === -1 ? filtered.length : pageSize)));
  const pageRows = useMemo(() => {
    if (pageSize === -1) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Audio Analysis</div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm">Reload</button>
          <button onClick={()=>setShowFilters(true)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm">Filter</button>
          <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-500 text-sm px-3 py-1.5 rounded-md">Add New Audio</Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Analysed Audio Files</div>
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
              <option value={-1}>All</option>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
            </select>
          </div>
        </div>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-300">
              <tr>
                <th className="py-2 pr-4">SL No</th>
                <th className="py-2 pr-4">File Name</th>
                <th className="py-2 pr-4">Duration (HH:MM:SS)</th>
                <th className="py-2 pr-4">Upload Source</th>
                <th className="py-2 pr-4">Executive Name</th>
                <th className="py-2 pr-4">Manager Name</th>
                <th className="py-2 pr-4">OFE Accuracy</th>
                <th className="py-2 pr-4">Sentiment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created Date</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-3" colSpan={11}>Loading...</td></tr>
              ) : pageRows.length ? (
                pageRows.map((r, i) => {
                  const idx = (page - 1) * pageSize + i + 1;
                  const audioId = r.audioId || r.audio_id || r.id || r.audioID;
                  const execName = r.executiveName || r.username || r.userName || r.executive || '-';
                  const ofe = r.ofeAccuracy ?? r.salespersonScore ?? r.weightedScore ?? r.OFE_Accuracy ?? '-';
                  const sent = r.sentiment || r.overallsentiment || r.overallSentiment || r.overall_sentiment || '-';
                  const status = r.audiostatus || r.audioStatus || r.status || '-';
                  return (
                    <tr key={audioId || idx} className="border-t border-neutral-800 hover:bg-neutral-900/40">
                      <td className="py-2 pr-4">{idx}</td>
                      <td className="py-2 pr-4 text-indigo-400 underline cursor-pointer" onClick={()=>navigate(`/audio-details/${audioId}`)}>{r.fileName || r.filename || audioId}</td>
                      <td className="py-2 pr-4">{r.duration || r.fileDuration || '-'}</td>
                      <td className="py-2 pr-4">{r.uploadSource || '-'}</td>
                      <td className="py-2 pr-4">{execName}</td>
                      <td className="py-2 pr-4">{r.managerName || r.manager || '-'}</td>
                      <td className="py-2 pr-4">{ofe}</td>
                      <td className="py-2 pr-4">{sent}</td>
                      <td className="py-2 pr-4">{status}</td>
                      <td className="py-2 pr-4">{r.createdDate || r.createdAt || '-'}</td>
                      <td className="py-2 pr-4">
                        <button onClick={()=>navigate(`/audio-details/${audioId}`)} className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs">View</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td className="py-3 text-neutral-400" colSpan={11}>No records</td></tr>
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
