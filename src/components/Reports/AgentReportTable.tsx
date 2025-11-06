import React from 'react';

type Row = {
  userName: string;
  ncalls: any;
  avgFileDurationSeconds?: number;
  avgSalespersonScore?: number;
  avgWeightedScore?: number;
  avgPositiveSentiment?: number;
  avgNegativeSentiment?: number;
  avgNeutralSentiment?: number;
  avgCustomerConvo?: number;
  avgSalespersonConvo?: number;
};

export default function AgentReportTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3 flex items-center">Agent Performance Report</div>
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-lg">
        <table className="w-full text-sm table-sticky">
          <thead className="text-left text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900">
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
            {Array.isArray(rows) && rows.length ? (
              rows.map((r, i) => (
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
  );
}
