import React from 'react';
import { useNotifications } from '../context/NotificationContext';

export default function Toasts(){
  const { toasts, remove } = useNotifications();
  const topRight = toasts.filter(t => (t.position ?? 'top-right') === 'top-right');
  const center = toasts.filter(t => t.position === 'center');
  const renderItem = (t: any) => (
    <div key={t.id}
         className={`rounded-md border px-3 py-2 text-sm shadow-sm backdrop-blur-md ring-1 ring-black/5 dark:ring-white/5 ${
           t.type==='success' ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300'
           : t.type==='error' ? 'bg-red-50/85 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300'
           : t.type==='warning' ? 'bg-amber-50/85 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300'
           : 'bg-white/90 border-neutral-200 text-neutral-800 dark:bg-neutral-900/90 dark:border-neutral-700 dark:text-neutral-200'
         }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 break-words">{t.message}</div>
        <button className="text-xs opacity-70 hover:opacity-100" onClick={()=>remove(t.id)}>✕</button>
      </div>
    </div>
  );
  return (
    <>
      {/* Top-right stack */}
      {!!topRight.length && (
        <div className="fixed z-[1000] right-3 top-16 space-y-2 w-[min(92vw,380px)]">
          {topRight.map(renderItem)}
        </div>
      )}
      {/* Center overlay (single stack) */}
      {!!center.length && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pointer-events-none">
          <div className="mt-24 w-[min(92vw,520px)] space-y-2 pointer-events-auto">
            {center.map(renderItem)}
          </div>
        </div>
      )}
    </>
  );
}
