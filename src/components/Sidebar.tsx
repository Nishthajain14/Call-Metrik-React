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

  // Track if sidebar is open as overlay on small screens
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync CSS variable so content shifts correctly
  useEffect(() => {
    const applyWidth = () => {
      const isSmall = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
      const width = isSmall ? '0px' : (collapsed ? '4rem' : '16rem');
      document.documentElement.style.setProperty('--sidebar-width', width);
      try { window.dispatchEvent(new CustomEvent('sidebar-state', { detail: { collapsed: isSmall ? true : collapsed } })); } catch {}
      if (!isSmall) setMobileOpen(false);
    };
    applyWidth();
    try { localStorage.setItem('sidebar:collapsed', String(collapsed)); } catch {}
    const onResize = () => applyWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed]);

  // Listen for navbar toggle requests
  useEffect(() => {
    const onToggle = () => {
      const isSmall = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
      if (isSmall) setMobileOpen(v => !v);
      else setCollapsed(v => !v);
    };
    window.addEventListener('sidebar-toggle-request', onToggle);
    // emit initial state for navbar on mount
    try { window.dispatchEvent(new CustomEvent('sidebar-state', { detail: { collapsed } })); } catch {}
    return () => window.removeEventListener('sidebar-toggle-request', onToggle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center ${collapsed ? 'justify-center px-2' : 'justify-start px-4'} gap-3 py-3 rounded-lg transition-all ${
      isActive
        ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md'
        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
    }`;

  return (
    <>
    {/* Desktop/Tablet sidebar */}
    <aside
      className="fixed inset-y-0 left-0 hidden md:flex flex-col z-40 transition-[width] duration-300 glass surface sidebar-ambient"
      style={{ width: collapsed ? '4rem' : '16rem' }}
    >
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-center px-3'} relative`}
      >
        {collapsed ? (
          <img src={theme === 'dark' ? smallLogoDark : smallLogoLight} alt="CallMetriK" className="h-10 w-10 object-contain animate-floaty" />
        ) : (
          <img src={theme === 'dark' ? bigLogoDark : bigLogoLight} alt="CallMetriK" className="h-14 object-contain animate-fadeIn" />
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
          className={`w-full ${collapsed ? 'px-0' : 'px-4'} py-2 flex items-center gap-2 justify-center glass surface hover:brightness-110`}
        >
          <LogOut size={16} />
          <span className={collapsed ? 'hidden' : 'inline'}>Logout</span>
        </button>
      </div>
    </aside>

    {/* Mobile overlay sidebar */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)} />
        <aside className="absolute left-0 top-0 h-full w-[16rem] max-w-[80vw] glass surface sidebar-ambient shadow-xl">
          <div className="h-16 flex items-center justify-center px-3 relative">
            <img src={theme === 'dark' ? bigLogoDark : bigLogoLight} alt="CallMetriK" className="h-14 object-contain" />
          </div>
          <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
            <NavLink to="/" className={navLinkClass} end onClick={()=>setMobileOpen(false)}>
              <Home size={18} /> <span>Dashboard</span>
            </NavLink>
            <NavLink to="/audio-analysis" className={navLinkClass} onClick={()=>setMobileOpen(false)}>
              <BarChart3 size={18} /> <span>Audio Analysis</span>
            </NavLink>
            <NavLink to="/upload" className={navLinkClass} onClick={()=>setMobileOpen(false)}>
              <UploadCloud size={18} /> <span>Upload Audio</span>
            </NavLink>
            <NavLink to="/reports" className={navLinkClass} onClick={()=>setMobileOpen(false)}>
              <FileText size={18} /> <span>Reports</span>
            </NavLink>
          </nav>
          <div className="p-4">
            <button
              onClick={async ()=>{ await signOut(); setMobileOpen(false); navigate('/login', { replace: true }); }}
              className="w-full px-4 py-2 flex items-center gap-2 justify-center glass surface hover:brightness-110"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>
    )}
    </>
  );
}
