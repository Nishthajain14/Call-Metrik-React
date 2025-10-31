import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AudioAPI } from '../lib/api';

const USER_ID = 1;

export default function AudioAnalysisMonthly() {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let on = true;
    async function load() {
      try {
        setLoading(true);
        const data = await AudioAPI.monthlySummary(USER_ID, year);
        if (!on) return;
        setRows(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        setError(e?.message || 'Failed to load monthly data');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { on = false; };
  }, [year]);

  const months = useMemo(() => [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Monthwise Audio Analysis</div>
        <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-500 text-sm px-3 py-1.5 rounded-md">Add New Audio</Link>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Month View of Analysed Audio Files</div>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-300">
              <tr>
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Total Records</th>
                <th className="py-2 pr-4">Average Call Duration (HH:MM:SS)</th>
                <th className="py-2 pr-4">Positive%</th>
                <th className="py-2 pr-4">Negative%</th>
                <th className="py-2 pr-4">Neutral%</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="py-3" colSpan={6}>Loading...</td></tr>
              ) : rows?.length ? (
                rows.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-800 hover:bg-neutral-900/40 cursor-pointer" onClick={() => navigate(`/audio-analysis/${r.month}?year=${year}`)}>
                    <td className="py-2 pr-4 text-indigo-400 underline">{months[r.monthIndex ?? (months.indexOf(r.month) >= 0 ? months.indexOf(r.month) : 0)] || r.month}</td>
                    <td className="py-2 pr-4">{r.totalRecords ?? r.TotalRecords ?? '-'}</td>
                    <td className="py-2 pr-4">{r.averageCallDuration ?? '-'}</td>
                    <td className="py-2 pr-4">{r.positivePercentage ?? r.PositivePercentage ?? '-'}</td>
                    <td className="py-2 pr-4">{r.negativePercentage ?? r.NegativePercentage ?? '-'}</td>
                    <td className="py-2 pr-4">{r.neutralPercentage ?? r.NeutralPercentage ?? '-'}</td>
                  </tr>
                ))
              ) : (
                <tr><td className="py-3 text-neutral-400" colSpan={6}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
