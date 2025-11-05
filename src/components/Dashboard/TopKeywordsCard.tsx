import React from 'react';
import { Hash } from 'lucide-react';

export default function TopKeywordsCard({ keywords, formatNumber }: { keywords: any[]; formatNumber: (x:any)=>string }){
  return (
    <div className="card-elevated p-4 hover-lift">
      <div className="font-semibold font-display mb-3 inline-flex items-center gap-2"><Hash size={16} /> Top Mentioned Keywords</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-glass table-zebra table-sticky">
          <thead className="text-left text-neutral-600 dark:text-neutral-300">
            <tr>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Weightage (%)</th>
              <th className="py-2 pr-4">Occurrence in Conversation (%)</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(keywords) && keywords.length > 0 ? (
              keywords.map((k, i) => (
                <tr key={i} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">{k.name}</td>
                  <td className="py-2 pr-4">{formatNumber(k.avgTranscriptWeightage)}</td>
                  <td className="py-2 pr-4">{formatNumber(k.avgTranscriptPercentage)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={3}>No keywords available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
