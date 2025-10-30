import { Home, BarChart3, UploadCloud, FileText, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-800 transition-colors ${
      isActive ? 'bg-neutral-800 text-white' : 'text-neutral-300'
    }`;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-neutral-900 border-r border-neutral-800 hidden md:flex flex-col z-40">
      <div className="h-16 flex items-center px-6 text-xl font-semibold tracking-wide">CallMetriK</div>
      <nav className="flex-1 px-3 space-y-2">
        <NavLink to="/" className={navLinkClass} end>
          <Home size={18} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/audio-analysis" className={navLinkClass}>
          <BarChart3 size={18} /> <span>Audio Analysis</span>
        </NavLink>
        <NavLink to="/upload" className={navLinkClass}>
          <UploadCloud size={18} /> <span>Upload Audio</span>
        </NavLink>
        <NavLink to="/reports" className={navLinkClass}>
          <FileText size={18} /> <span>Reports</span>
        </NavLink>
      </nav>
      <div className="p-4">
        <button className="w-full border border-neutral-700 text-neutral-200 rounded-lg px-4 py-2 hover:bg-neutral-800 flex items-center gap-2 justify-center">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
