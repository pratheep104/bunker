import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from './DashboardHeader';
import StudentInfoCard from './StudentInfoCard';
import AttendanceCard from './AttendanceCard';
import RiskAnalysisPanel from './RiskAnalysisPanel';
import TimetablePanel from './TimetablePanel';
import QuickActions from './QuickActions';
import BroadcastBanner from './BroadcastBanner';
import AnnouncementsPanel from './AnnouncementsPanel';
import type { SimulationState, SortOption } from '../types';
import { sortAttendance } from '../utils/calculations';
import { ArrowDownUp } from 'lucide-react';

type Tab = 'attendance' | 'timetable' | 'risk';

export default function Dashboard() {
  const { attendance, timetable, isLoading, platformSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [simulation, setSimulation] = useState<SimulationState>({});
  const [sortOption, setSortOption] = useState<SortOption>('lowest');
  const [showSort, setShowSort] = useState(false);

  const handleSimulationChange = useCallback((subject: string, field: 'futureAttended' | 'futureBunked', delta: number) => {
    setSimulation(prev => {
      const current = prev[subject] || { futureAttended: 0, futureBunked: 0 };
      const newVal = Math.max(0, current[field] + delta);
      return { ...prev, [subject]: { ...current, [field]: newVal } };
    });
  }, []);

  const handleResetSimulation = useCallback((subject: string) => {
    setSimulation(prev => { const next = { ...prev }; delete next[subject]; return next; });
  }, []);

  const handleResetAllSimulations = useCallback(() => { setSimulation({}); }, []);
  console.log('DASHBOARD ATTENDANCE:', attendance);
  console.log('FIRST ATTENDANCE ITEM:', attendance?.[0]);
  const sortedAttendance = sortAttendance(attendance, sortOption);
  console.log('SORTED ATTENDANCE FIRST :', sortedAttendance[0]);

  // Emergency shutdown
  if (platformSettings.emergency_shutdown) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">BUNKER is Offline</h1>
          <p className="text-sm text-neutral-500 mt-2">The platform is temporarily unavailable. Please try again later.</p>
          <p className="text-[10px] text-neutral-700 mt-6">Created by Heisenberg</p>
        </div>
      </div>
    );
  }

  // Maintenance mode
  if (platformSettings.maintenance_mode) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Under Maintenance</h1>
          <p className="text-sm text-neutral-500 mt-2">BUNKER is currently undergoing maintenance. Check back soon.</p>
          <p className="text-[10px] text-neutral-700 mt-6">Created by Heisenberg</p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'risk', label: 'Risk Analysis' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DashboardHeader />

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-neutral-500">Refreshing...</p>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <BroadcastBanner />
        <StudentInfoCard />
        <AnnouncementsPanel />
        <QuickActions simulation={simulation} onResetAllSimulations={handleResetAllSimulations} />

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 bg-[#111111] rounded-lg border border-white/[0.04]">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.06] text-white'
                  : 'text-neutral-600 hover:text-neutral-400'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'attendance' && (
          <>
            {/* Sort Controls */}
            <div className="relative">
              <button onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-neutral-500 text-[10px] hover:text-neutral-400 transition-all">
                <ArrowDownUp size={11} />
                Sort: {sortOption === 'lowest' ? 'Lowest' : sortOption === 'highest' ? 'Highest' : 'Name'}
              </button>
              {showSort && (
                <div className="absolute top-full left-0 mt-1 bg-[#161616] rounded-lg border border-white/[0.06] shadow-xl z-20 py-1 min-w-[120px]">
                  {(['lowest', 'highest', 'name'] as SortOption[]).map(opt => (
                    <button key={opt} onClick={() => { setSortOption(opt); setShowSort(false); }}
                      className={`w-full px-3 py-1.5 text-left text-[10px] ${sortOption === opt ? 'text-indigo-400 bg-indigo-500/5' : 'text-neutral-400 hover:text-neutral-300'}`}>
                      {opt === 'lowest' ? 'Lowest Attendance' : opt === 'highest' ? 'Highest Attendance' : 'Subject Name'}
                    </button>
                  ))}
                </div>
              )}
            </div>

	    {attendance[0]?.attendanceTo && (
              <p className="text-[11px] text-neutral-500 mb-1">Last updated: <span className="text-neutral-300">{attendance[0].attendanceTo}</span></p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {sortedAttendance.map(subject => (
                <AttendanceCard
                  key={subject.subject}
                  subject={subject}
                  simulation={simulation[subject.subject] || { futureAttended: 0, futureBunked: 0 }}
                  onSimulationChange={handleSimulationChange}
                  onResetSimulation={handleResetSimulation}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === 'timetable' && <TimetablePanel timetable={timetable} />}
        {activeTab === 'risk' && <RiskAnalysisPanel attendance={attendance} />}
      </main>

      <footer className="border-t border-white/[0.04] mt-12 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-[10px] text-neutral-700">BUNKER - Smart Attendance Intelligence</p>
          <p className="text-[10px] text-neutral-700">Created by Heisenberg</p>
        </div>
      </footer>
    </div>
  );
}
