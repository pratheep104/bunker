import type { SubjectAttendance, AttendanceStatus, RecoveryTarget, RiskLevel } from '../types';

export function getAttendanceStatus(percentage: number): AttendanceStatus {
  if (percentage >= 85) return 'safe';
  if (percentage >= 75) return 'warning';
  return 'critical';
}

export function getRiskLevel(percentage: number): RiskLevel {
  if (percentage >= 85) return 'safe';
  if (percentage >= 75) return 'warning';
  return 'critical';
}

export function calculateSafeBunks(attended: number, conducted: number, threshold = 75): number {
  if (conducted === 0) return 0;
  const currentPerc = (attended / conducted) * 100;
  if (currentPerc < threshold) return 0;
  let bunks = 0;
  while (((attended) / (conducted + bunks + 1)) * 100 >= threshold) {
    bunks++;
  }
  return bunks;
}

export function calculateSimulatedAttendance(
  attended: number,
  conducted: number,
  futureAttended: number,
  futureBunked: number
): { newAttended: number; newConducted: number; newPercentage: number } {
  const newAttended = attended + futureAttended;
  const newConducted = conducted + futureAttended + futureBunked;
  const newPercentage = newConducted > 0 ? (newAttended / newConducted) * 100 : 0;
  return {
    newAttended,
    newConducted,
    newPercentage: Math.round(newPercentage * 100) / 100,
  };
}

export function calculateRecovery(attended: number, conducted: number): RecoveryTarget[] {
  const targets = [
    { label: '75%', target: 75 },
    { label: '80%', target: 80 },
    { label: '85%', target: 85 },
    { label: '90%', target: 90 },
  ];

  return targets.map(({ label, target }) => {
    if (conducted === 0) return { label, target, classesNeeded: 0 };
    const currentPerc = (attended / conducted) * 100;
    if (currentPerc >= target) return { label, target, classesNeeded: 0 };
    const needed = Math.ceil((target * conducted - 100 * attended) / (100 - target));
    return { label, target, classesNeeded: Math.max(0, needed) };
  });
}

export function getStatusColor(status: AttendanceStatus): string {
  if (status === 'safe') return 'text-emerald-400';
  if (status === 'warning') return 'text-amber-400';
  return 'text-red-400';
}

export function getStatusBg(status: AttendanceStatus): string {
  if (status === 'safe') return 'bg-emerald-500/10 border-emerald-500/20';
  if (status === 'warning') return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 85) return 'bg-emerald-500';
  if (percentage >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getStatusBadgeClasses(status: AttendanceStatus): string {
  if (status === 'safe') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export function sortAttendance(attendance: SubjectAttendance[], sortBy: string): SubjectAttendance[] {
  const sorted = [...attendance];
  switch (sortBy) {
    case 'lowest': return sorted.sort((a, b) => a.percentage - b.percentage);
    case 'highest': return sorted.sort((a, b) => b.percentage - a.percentage);
    case 'name': return sorted.sort((a, b) => a.subject.localeCompare(b.subject));
    default: return sorted;
  }
}

export function getDaysTimetable(entries: { day: string; period: number; subject: string; staff: string; room: string }[], day: string) {
  return entries.filter(e => e.day === day).sort((a, b) => a.period - b.period);
}
