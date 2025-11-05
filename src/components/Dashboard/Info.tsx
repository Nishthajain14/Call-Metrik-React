import React from 'react';

export default function Info({ text }: { text: any }) {
  return (
    <span
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] border-neutral-300 text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-white"
      title={text}
    >
      i
    </span>
  );
}
