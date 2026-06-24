import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, RotateCcw } from 'lucide-react';
import type { SimulationState } from '../types';

interface Props {
  simulation: SimulationState;
  onResetAllSimulations: () => void;
}

export default function QuickActions({ simulation, onResetAllSimulations }: Props) {
  const { refresh, isLoading } = useAuth();
  const hasSimulations = Object.values(simulation).some(s => s.futureAttended > 0 || s.futureBunked > 0);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={refresh}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 transition-all"
      >
        <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        Refresh
      </button>
      {hasSimulations && (
        <button
          onClick={onResetAllSimulations}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 text-xs font-medium border border-white/[0.06] transition-all"
        >
          <RotateCcw size={13} />
          Reset Sims
        </button>
      )}
    </div>
  );
}
