import React from 'react';
import Info from './Info';
import Art from './Art';

type Props = {
  title: any;
  value: any;
  hint?: any;
  info?: any;
  variant?: string;
  art?: string;
  subtitle?: any;
  lastValue?: any;
};

export default function Card({ title, value, hint, info, variant = 'metric-purple', art, subtitle, lastValue }: Props) {
  const bothNums = typeof value === 'number' && typeof lastValue === 'number';
  const up = bothNums ? Number(value) >= Number(lastValue) : null;
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
        <div className="value kpi-number flex items-center gap-2">
          <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
          {up !== null && <span className={up ? 'text-emerald-500' : 'text-rose-500'}>{up ? '▲' : '▼'}</span>}
        </div>
        {subtitle ? (
          <div className="text-xs muted mt-1">
            {subtitle} : <span className="font-medium">{typeof lastValue === 'number' ? lastValue.toLocaleString() : lastValue}</span>
          </div>
        ) : hint ? (
          <div className="text-xs muted mt-1">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
