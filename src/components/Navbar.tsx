import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile, session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isSubPage = pathname.startsWith('/audio-analysis') || pathname.startsWith('/audio-details');
  const canGoBack = pathname !== '/' && !isSubPage;
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('sidebar:collapsed') === 'true');
    } catch {}
    const onState = (e: any) => setCollapsed(!!e?.detail?.collapsed);
    window.addEventListener('sidebar-state', onState as EventListener);
    return () => window.removeEventListener('sidebar-state', onState as EventListener);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 h-16 border-b flex items-center justify-between px-4 md:px-6 bg-white/80 border-neutral-200 text-neutral-900 dark:bg-neutral-950/80 dark:border-neutral-800 dark:text-neutral-100 backdrop-blur z-30"
      style={{ left: 'var(--sidebar-width)' }}
    >
      <div className="flex items-center gap-3">
        <button
          style={{
            background: theme === 'dark' ? '#111827' : '#f8f9fa',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            padding: '1px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            boxShadow: 'none',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          aria-label="Toggle sidebar"
          onClick={() => window.dispatchEvent(new Event('sidebar-toggle-request'))}
        >
          <div
            style={{
              width: '12px',
              height: '22px',
              backgroundColor: theme === 'dark' ? '#9ca3af' : '#6b7280',
              borderRadius: '4px',
              position: 'absolute',
              left: collapsed ? '2px' : '11px',
              transition: 'all 0.5s ease'
            }}
          />
        </button>
        {canGoBack && (
          <button
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-300"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div className="text-lg font-semibold">{title}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="size-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700" />
          <div className="leading-tight">
            <div className="text-sm">{profile?.User_Name || session?.user?.email || 'User'}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{profile?.User_Email || session?.user?.email || ''}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
