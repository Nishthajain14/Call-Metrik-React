import React from 'react';

export default function EventwiseTable({ rows, heightRem = 24 }: { rows: Array<{ Event: string; AgentsFollowedRate: any }>; heightRem?: number }) {
  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3">Eventwise Agent Performance</div>
      <div className="overflow-x-auto overflow-y-auto rounded-lg" style={{ maxHeight: `${heightRem}rem`, minHeight: `${heightRem}rem` }}>
        <table className="w-full text-sm table-zebra table-sticky">
          <thead className="text-left text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900">
            <tr>
              <th className="py-2 pr-4">Event</th>
              <th className="py-2 pr-4">Agents Followed(%)</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rows) && rows.length ? (
              rows.map((e, i) => (
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
  );
}
