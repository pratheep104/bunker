import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function BroadcastBanner() {
  const { broadcasts } = useAuth();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (broadcasts.length === 0) return null;

  const active = broadcasts.filter(b => !dismissed.has(b.id));
  if (active.length === 0) return null;

  const iconMap: Record<string, typeof Info> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    error: AlertCircle,
  };
  const colorMap: Record<string, string> = {
    info: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-2">
      {active.map(b => {
        const Icon = iconMap[b.type] || Info;
        return (
          <div key={b.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs ${colorMap[b.type]}`}>
            <Icon size={14} className="flex-shrink-0" />
            <span className="flex-1">{b.message}</span>
            <button onClick={() => setDismissed(prev => new Set([...prev, b.id]))} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
