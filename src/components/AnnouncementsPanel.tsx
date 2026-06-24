import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Pin } from 'lucide-react';

export default function AnnouncementsPanel() {
  const { announcements } = useAuth();

  if (announcements.length === 0) return null;

  return (
    <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5">
      <h2 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Megaphone size={11} /> Announcements
      </h2>
      <div className="space-y-2">
        {announcements.map(a => (
          <div key={a.id} className={`p-3 rounded-lg border ${a.is_pinned ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white/[0.02] border-white/[0.04]'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {a.is_pinned && <Pin size={10} className="text-indigo-400" />}
                <h3 className="text-xs font-medium text-neutral-200">{a.title}</h3>
              </div>
              <span className="text-[10px] text-neutral-600 flex-shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
