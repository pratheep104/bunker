import type { SubjectAttendance, SimulationState } from '../types';
import { getAttendanceStatus, calculateSafeBunks, calculateSimulatedAttendance, calculateRecovery, getProgressColor, getStatusBadgeClasses } from '../utils/calculations';
import { useState } from 'react';
import { Minus, Plus, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, AlertOctagon, Target, Calculator } from 'lucide-react';

interface Props {
  subject: SubjectAttendance;
  simulation: SimulationState[string];
  onSimulationChange: (subject: string, field: 'futureAttended' | 'futureBunked', delta: number) => void;
  onResetSimulation: (subject: string) => void;
}

export default function AttendanceCard({ subject, simulation, onSimulationChange, onResetSimulation }: Props) {
  console.log('CARD SUBJECT:', subject);
  const [expanded, setExpanded] = useState(false);
  console.log('ATTENDANCE CARD SUBJECT:', subject);

  if (!subject || typeof subject.percentage === 'undefined' || typeof subject.subject === 'undefined') {
    console.error('AttendanceCard received invalid subject shape:', subject);
    return null;
  }
  const status = getAttendanceStatus(subject.percentage);
  const safeBunks = calculateSafeBunks(subject.attended, subject.conducted);
  const sim = calculateSimulatedAttendance(subject.attended, subject.conducted, simulation.futureAttended, simulation.futureBunked);
  const recovery = calculateRecovery(subject.attended, subject.conducted);
  const hasSimulation = simulation.futureAttended > 0 || simulation.futureBunked > 0;

  const StatusIcon = status === 'safe' ? ShieldCheck : status === 'warning' ? AlertTriangle : AlertOctagon;
  const statusLabel = status === 'safe' ? 'Safe' : status === 'warning' ? 'Warning' : 'Critical';

  return (
    <div className="bg-[#111111] rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-neutral-200 leading-snug">{subject.subject}</h3>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              {subject.courseCode && <span className="text-indigo-500">{subject.courseCode}</span>}
              {subject.courseCode && ' · '}
              {subject.attended} / {subject.conducted} classes
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClasses(status)}`}>
            <StatusIcon size={10} />
            {statusLabel}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold text-white">{subject.percentage ? Number(subject.percentage).toFixed(1) : 'NO_PERCENTAGE'}%</span>
            {hasSimulation && (
              <span className={`text-xs font-semibold ${sim.newPercentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Number(sim.newPercentage || 0).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(subject.percentage)}`} style={{ width: `${Math.min(subject.percentage, 100)}%` }} />
          </div>
          {hasSimulation && (
            <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(sim.newPercentage)}`} style={{ width: `${Math.min(sim.newPercentage, 100)}%` }} />
            </div>
          )}
        </div>

        {/* Safe Bunks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <span className={`text-xl font-bold ${
              safeBunks > 3 ? 'text-emerald-400' : safeBunks > 0 ? 'text-amber-400' : 'text-red-400'
            }`}>{safeBunks}</span>
            <span className="text-[10px] text-neutral-500">safe bunks</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-400 hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-4">
          {/* Simulator */}
          <div>
            <h4 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Calculator size={10} /> Simulator
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-600 mb-1 block">Attended</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => onSimulationChange(subject.subject, 'futureAttended', -1)} disabled={simulation.futureAttended <= 0}
                    className="w-7 h-7 rounded bg-white/[0.04] flex items-center justify-center text-neutral-500 hover:bg-white/[0.08] transition-colors disabled:opacity-30">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-medium text-neutral-300">{simulation.futureAttended}</span>
                  <button onClick={() => onSimulationChange(subject.subject, 'futureAttended', 1)}
                    className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-600 mb-1 block">Bunked</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => onSimulationChange(subject.subject, 'futureBunked', -1)} disabled={simulation.futureBunked <= 0}
                    className="w-7 h-7 rounded bg-white/[0.04] flex items-center justify-center text-neutral-500 hover:bg-white/[0.08] transition-colors disabled:opacity-30">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-xs font-medium text-neutral-300">{simulation.futureBunked}</span>
                  <button onClick={() => onSimulationChange(subject.subject, 'futureBunked', 1)}
                    className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
            {hasSimulation && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-neutral-500">
                  Projected: <span className="font-medium text-neutral-300">{sim.newAttended}/{sim.newConducted}</span> = <span className={`font-bold ${sim.newPercentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{Number(sim.newPercentage || 0).toFixed(2)}%</span>
                </p>
              </div>
            )}
            {hasSimulation && (
              <button onClick={() => onResetSimulation(subject.subject)} className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                Reset
              </button>
            )}
          </div>

          {/* Recovery */}
          <div>
            <h4 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-2.5 flex items-center gap-1">
              <Target size={10} /> Recovery
            </h4>
            <div className="space-y-1.5">
              {recovery.map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-white/[0.02]">
                  <span className="text-[10px] text-neutral-500">Reach {r.label}</span>
                  <span className={`text-[10px] font-semibold ${r.classesNeeded === 0 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {r.classesNeeded === 0 ? 'Already reached' : `${r.classesNeeded} classes`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
