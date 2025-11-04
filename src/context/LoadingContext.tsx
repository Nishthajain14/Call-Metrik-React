import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type LoadingContextValue = {
  loading: boolean;
  setLoading: (v: boolean) => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }){
  const [loading, setLoading] = useState(false);
  const value = useMemo(()=>({ loading, setLoading }), [loading]);
  return (
    <LoadingContext.Provider value={value}>
      {children}
      {/* Global overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-[101] glass surface rounded-xl p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-brand-600 dark:border-neutral-600 dark:border-t-brand-500" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(){
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
