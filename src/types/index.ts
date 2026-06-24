export interface StudentInfo {
  name: string;
  registerNumber: string;
  department: string;
  semester: string;
  section: string;
}

export interface SubjectAttendance {
  courseCode: string;
  subject: string;
  totalHours: number;
  totalPresent: number;
  totalAbsent: number;
  attended: number;
  conducted: number;
  percentage: number;
}

export interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  staff: string;
  room: string;
}

export type AttendanceStatus = 'safe' | 'warning' | 'critical';
export type RiskLevel = 'safe' | 'warning' | 'critical';

export interface SimulationState {
  [subject: string]: {
    futureAttended: number;
    futureBunked: number;
  };
}

export interface RecoveryTarget {
  label: string;
  target: number;
  classesNeeded: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  scheduled_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Broadcast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  created_at: string;
}

export interface PlatformSettings {
  maintenance_mode: boolean;
  disable_new_logins: boolean;
  emergency_shutdown: boolean;
}

export interface AppUser {
  id: string;
  register_number: string;
  name: string | null;
  department: string | null;
  semester: string | null;
  section: string | null;
  is_disabled: boolean;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  admin_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type SortOption = 'lowest' | 'highest' | 'name';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  studentInfo: StudentInfo | null;
  attendance: SubjectAttendance[];
  timetable: TimetableEntry[];
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  adminId: string | null;
  username: string | null;
}
