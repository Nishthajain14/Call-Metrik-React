import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, UploadCloud, FileText, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileSidebar(){
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const onToggle = () => setOpen(v => !v);
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener('mobile-sidebar-toggle', onToggle as EventListener);
    window.addEventListener('mobile-sidebar-open', onOpen as EventListener);
    window.addEventListener('mobile-sidebar-close', onClose as EventListener);
    return () => {
      window.removeEventListener('mobile-sidebar-toggle', onToggle as EventListener);
      window.removeEventListener('mobile-sidebar-open', onOpen as EventListener);
      window.removeEventListener('mobile-sidebar-close', onClose as EventListener);
    };
  }, []);

  useEffect(() => {
    const onRoute = () => setOpen(false);
    window.addEventListener('popstate', onRoute);
    return () => window.removeEventListener('popstate', onRoute);
  }, []);

  return (
    <div className="sm:hidden">
      {open && (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[78vw] max-w-[320px] bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shadow-xl">
            <div className="h-16 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="text-base font-semibold">Menu</div>
              <button aria-label="Close" className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={()=>setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              <NavLink to="/" onClick={()=>setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`} end>
                <Home size={18} /> Dashboard
              </NavLink>
              <NavLink to="/audio-analysis" onClick={()=>setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                <BarChart3 size={18} /> Audio Analysis
              </NavLink>
              <NavLink to="/upload" onClick={()=>setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                <UploadCloud size={18} /> Upload Audio
              </NavLink>
              <NavLink to="/reports" onClick={()=>setOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-neutral-100 dark:bg-neutral-900' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                <FileText size={18} /> Reports
              </NavLink>
            </nav>
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={async ()=>{ await signOut(); setOpen(false); navigate('/login', { replace: true }); }}
                className="w-full px-3 py-2 rounded-md glass surface flex items-center justify-center gap-2 hover:brightness-110"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
