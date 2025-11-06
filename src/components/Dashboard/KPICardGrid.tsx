import React from 'react';
import Card from './Card';

export default function KPICardGrid({ kpis }: { kpis: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {kpis.map((k) => (
        <div key={k.title} className="kpi-wrapper">
          <Card title={k.title} value={k.value} hint={k.hint} info={k.info} variant={k.variant} art={k.art} />
        </div>
      ))}
    </div>
  );
}
