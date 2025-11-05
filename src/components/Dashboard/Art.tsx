import React from 'react';
import ratio3d from '../../assets/ratio3d.png';
import avgscore3d from '../../assets/avgscore3d.png';
import totalcall3d from '../../assets/totalcall3d.png';
import avgduration3d from '../../assets/avgduration3d.png';
import totalduration3d from '../../assets/totalduration3d.png';

export default function Art({ kind, className }: { kind?: string; className?: string }) {
  if (!kind) return null;
  const MAP: Record<string, string> = {
    ratio: ratio3d as unknown as string,
    score: avgscore3d as unknown as string,
    calls: totalcall3d as unknown as string,
    stopwatch: avgduration3d as unknown as string,
    hourglass: totalduration3d as unknown as string,
  };
  const src = MAP[kind] || MAP.stopwatch;
  return <img src={src} alt="" className={className} loading="lazy" />;
}
