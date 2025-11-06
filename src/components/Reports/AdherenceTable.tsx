import React from 'react';

type ScriptStat = { event: string; averagePercent: any };

type Row = {
  agent: string;
  nCalls: any;
  avgFullScriptPercent?: number;
  scriptStats?: ScriptStat[];
};

export default function AdherenceTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3">Agent Script Adherence</div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-lg">
        <table className="w-full text-sm table-zebra table-sticky">
          <thead className="text-left text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900">
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
            {Array.isArray(rows) && rows.length ? (
              rows.map((r, i) => {
                const map = Object.fromEntries((r.scriptStats || []).map((s) => [s.event, s.averagePercent]));
                return (
                  <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 pr-4">{r.agent}</td>
                    <td className="py-2 pr-4">{r.nCalls}</td>
                    <td className="py-2 pr-4">{r.avgFullScriptPercent?.toFixed?.(2)}</td>
                    <td className="py-2 pr-4">{(map as any)['Profile'] ?? '-'}</td>
                    <td className="py-2 pr-4">{(map as any)['Followup Specific'] ?? '-'}</td>
                    <td className="py-2 pr-4">{(map as any)['Introduction'] ?? '-'}</td>
                    <td className="py-2 pr-4">{(map as any)['Conversion'] ?? '-'}</td>
                    <td className="py-2 pr-4">{(map as any)['Profiling'] ?? '-'}</td>
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
  );
}
