import { useAuth } from '../contexts/AuthContext';
import { Shield, LogOut, RefreshCw, User } from 'lucide-react';

export default function DashboardHeader() {
  const { logout, refresh, isLoading, studentInfo } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center">
            <Shield className="text-indigo-400" size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">BUNKER</h1>
            <p className="text-[9px] text-neutral-600 -mt-0.5 hidden sm:block">Smart Attendance Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <User size={13} className="text-indigo-400" />
            <span className="text-xs text-neutral-400 max-w-[100px] truncate">{studentInfo?.name}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
