import type { SubjectAttendance } from '../types';
import { getRiskLevel } from '../utils/calculations';
import { ShieldCheck, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';

interface Props {
  attendance: SubjectAttendance[];
}

export default function RiskAnalysisPanel({ attendance }: Props) {
  const riskData = attendance.map(s => ({ subject: s, risk: getRiskLevel(s.percentage) }));

  return (
    <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5">
      <h3 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <Activity size={11} /> Attendance Health
      </h3>
      <div className="space-y-1.5">
        {riskData.map(({ subject, risk }) => {
          const Icon = risk === 'safe' ? ShieldCheck : risk === 'warning' ? AlertTriangle : AlertOctagon;
          const bgClass = risk === 'safe'
            ? 'bg-emerald-500/5 border-emerald-500/10'
            : risk === 'warning'
            ? 'bg-amber-500/5 border-amber-500/10'
            : 'bg-red-500/5 border-red-500/10';
          const textClass = risk === 'safe' ? 'text-emerald-400' : risk === 'warning' ? 'text-amber-400' : 'text-red-400';

          return (
            <div key={subject.subject} className={`flex items-center justify-between p-2.5 rounded-lg border ${bgClass}`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Icon size={13} className={textClass} />
                <span className="text-[11px] text-neutral-400 truncate">{subject.subject}</span>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${textClass} flex-shrink-0 ml-3`}>{risk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
