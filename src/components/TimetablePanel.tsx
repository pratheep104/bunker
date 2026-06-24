import type { TimetableEntry } from '../types';
import { getDaysTimetable } from '../utils/calculations';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

interface Props {
  timetable: TimetableEntry[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePanel({ timetable }: Props) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const jsDay = new Date().getDay();
    return DAYS[Math.max(0, jsDay - 1)] || 'Monday';
  });

  const dayEntries = getDaysTimetable(timetable, selectedDay);
  const hasTimetable = timetable.length > 0;

  return (
    <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5">
      <h3 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <Calendar size={11} /> Timetable
      </h3>

      {/* Day Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-neutral-600 hover:text-neutral-400 border border-transparent hover:border-white/[0.04]'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {!hasTimetable ? (
        <p className="text-[11px] text-neutral-600 text-center py-6">No timetable data available</p>
      ) : dayEntries.length === 0 ? (
        <p className="text-[11px] text-neutral-600 text-center py-6">No classes on {selectedDay}</p>
      ) : (
        <div className="space-y-1.5">
          {dayEntries.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-indigo-400">P{entry.period}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-neutral-200 truncate">{entry.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {entry.staff && <span className="text-[10px] text-neutral-600">{entry.staff}</span>}
                  {entry.room && <span className="text-[10px] text-neutral-700">{entry.room}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
