import { useEffect, useState } from 'react';
import { Home, BarChart3, UploadCloud, FileText, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bigLogoLight from '../assets/callmetrik-auth.png';
import smallLogoLight from '../assets/small-callmetrik-nobg.png';
import bigLogoDark from '../assets/CallMetriK-Logo-Design.png';
import smallLogoDark from '../assets/small-cm-nobg-dark.png';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sidebar:collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Sync CSS variable so content shifts correctly
  useEffect(() => {
    const width = collapsed ? '4rem' : '16rem';
    document.documentElement.style.setProperty('--sidebar-width', width);
    try { localStorage.setItem('sidebar:collapsed', String(collapsed)); } catch {}
    // notify listeners (Navbar) of current state
    try { window.dispatchEvent(new CustomEvent('sidebar-state', { detail: { collapsed } })); } catch {}
  }, [collapsed]);

  // Listen for navbar toggle requests
  useEffect(() => {
    const onToggle = () => setCollapsed(v => !v);
    window.addEventListener('sidebar-toggle-request', onToggle);
    // emit initial state for navbar on mount
    try { window.dispatchEvent(new CustomEvent('sidebar-state', { detail: { collapsed } })); } catch {}
    return () => window.removeEventListener('sidebar-toggle-request', onToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} gap-3 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white'
        : 'text-neutral-700 dark:text-neutral-300'
    } hover:bg-neutral-200 dark:hover:bg-neutral-800`;

  return (
    <aside
      className="fixed inset-y-0 left-0 bg-white border-r border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 hidden md:flex flex-col z-40 transition-[width] duration-200"
      style={{ width: collapsed ? '4rem' : '16rem' }}
    >
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-center px-3'} relative`}
      >
        {collapsed ? (
          <img src={theme === 'dark' ? smallLogoDark : smallLogoLight} alt="CallMetriK" className="h-10 w-10 object-contain" />
        ) : (
          <img src={theme === 'dark' ? bigLogoDark : bigLogoLight} alt="CallMetriK" className="h-14 object-contain" />
        )}
      </div>
      <nav className="flex-1 px-3 space-y-2">
        <NavLink to="/" className={navLinkClass} end>
          <Home size={18} /> <span className={collapsed ? 'hidden' : 'inline'}>Dashboard</span>
        </NavLink>
        <NavLink to="/audio-analysis" className={navLinkClass}>
          <BarChart3 size={18} /> <span className={collapsed ? 'hidden' : 'inline'}>Audio Analysis</span>
        </NavLink>
        <NavLink to="/upload" className={navLinkClass}>
          <UploadCloud size={18} /> <span className={collapsed ? 'hidden' : 'inline'}>Upload Audio</span>
        </NavLink>
        <NavLink to="/reports" className={navLinkClass}>
          <FileText size={18} /> <span className={collapsed ? 'hidden' : 'inline'}>Reports</span>
        </NavLink>
      </nav>
      <div className="p-4">
        <button
          onClick={async ()=>{ await signOut(); navigate('/login', { replace: true }); }}
          className={`w-full border rounded-lg ${collapsed ? 'px-0' : 'px-4'} py-2 flex items-center gap-2 justify-center border-neutral-300 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800`}
        >
          <LogOut size={16} />
          <span className={collapsed ? 'hidden' : 'inline'}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
