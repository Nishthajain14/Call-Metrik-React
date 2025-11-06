import React from 'react';

export default function LegendItem({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-sm ${active ? 'text-neutral-900 dark:text-neutral-200' : 'text-neutral-500 line-through'} hover:opacity-90`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 18L3 6h18L12 18z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
