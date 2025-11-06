import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Notice = {
  id: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // ms
  position?: 'top-right' | 'center';
};

type Ctx = {
  notify: (n: Omit<Notice, 'id'>) => void;
  remove: (id: string) => void;
  toasts: Notice[];
};

const NotificationContext = createContext<Ctx | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = useState<Notice[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback((n: Omit<Notice, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Notice = { id, type: 'info', duration: 3500, position: 'top-right', ...n };
    setToasts((t) => [...t, toast]);
    if (toast.duration && toast.duration > 0){
      window.setTimeout(() => remove(id), toast.duration);
    }
  }, [remove]);

  const value = useMemo(() => ({ notify, remove, toasts }), [notify, remove, toasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(){
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
