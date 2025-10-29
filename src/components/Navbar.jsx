import { Bell, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 bg-neutral-950/80 backdrop-blur">
      <div className="text-lg font-semibold">Overview</div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-neutral-800">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-800">
          <div className="size-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700" />
          <div className="leading-tight">
            <div className="text-sm">Pranav</div>
            <div className="text-xs text-neutral-400">pranav@populardigital.ai</div>
          </div>
        </div>
      </div>
    </header>
  );
}
