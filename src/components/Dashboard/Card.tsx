import React from 'react';
import Info from './Info';
import Art from './Art';

export default function Card({ title, value, hint, info, variant = 'metric-purple', art }: { title: any; value: any; hint?: any; info?: any; variant?: string; art?: string }) {
  return (
    <div className={`metric-subtle kpi-card ${variant} relative hover-lift`}>
      {info ? (
        <div className="kpi-info absolute right-3 top-3 z-[11]">
          <Info text={info} />
        </div>
      ) : null}
      {art ? (
        <div className="kpi-inner-overlays" aria-hidden>
          <Art kind={art} className="watermark-icon" />
        </div>
      ) : null}
      <div className="text-content">
        <div className="title">{title}</div>
        <div className="value kpi-number">{value}</div>
        {hint ? <div className="text-xs muted mt-1">{hint}</div> : null}
      </div>
    </div>
  );
}
