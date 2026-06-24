import { useAuth } from '../contexts/AuthContext';
import { User, Hash, BookOpen, GraduationCap, Users } from 'lucide-react';

export default function StudentInfoCard() {
  const { studentInfo } = useAuth();
  if (!studentInfo) return null;

  const items = [
    { icon: User, label: 'Name', value: studentInfo.name },
    { icon: Hash, label: 'Register No.', value: studentInfo.registerNumber },
    { icon: BookOpen, label: 'Department', value: studentInfo.department },
    { icon: GraduationCap, label: 'Semester', value: studentInfo.semester },
    { icon: Users, label: 'Section', value: studentInfo.section },
  ].filter(i => i.value);

  return (
    <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5">
      <h2 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-4">Student Information</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Icon size={13} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider">{label}</p>
              <p className="text-xs font-medium text-neutral-200 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
