import { createClient } from '@supabase/supabase-js';
import type { StudentInfo, SubjectAttendance, TimetableEntry, Announcement, Broadcast, PlatformSettings, AppUser, AdminActionLog } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Admin credentials (configurable via environment)
const ADMIN_USERNAME = 'Heisenberg';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'timeless';

// ── Student API ──

export class AttendanceError extends Error {
  constructor(message: string, public code: 'INVALID_CREDENTIALS' | 'UNAVAILABLE' | 'NETWORK_ERROR' | 'UNKNOWN') {
    super(message);
    this.name = 'AttendanceError';
  }
}
export async function fetchAttendance(
  username: string,
  password: string
): Promise<{ studentInfo: StudentInfo; attendance: SubjectAttendance[]; timetable: TimetableEntry[] }> {

  const res = await fetch('http://127.0.0.1:8000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rollno: username,
      password: password
    }),
  });

  const data = await res.json().catch(() => ({
    error: 'Failed to parse response'
  }));
  console.log('API RESPONSE:', data);

  if (!res.ok) {
    const errorMsg = data.error || `Server error (${res.status})`;

    if (res.status === 401 || errorMsg.includes('Invalid')) {
      throw new AttendanceError(
        'Invalid register number or password.',
        'INVALID_CREDENTIALS'
      );
    }

    throw new AttendanceError(errorMsg, 'UNKNOWN');
  }

  if (!data.attendance || data.attendance.length === 0) {
    throw new AttendanceError(
      'No attendance records found.',
      'UNAVAILABLE'
    );
  }
console.log('ATTENDANCE ARRAY:', data.attendance);

console.log('=== FETCH ATTENDANCE RAW ===');
console.log('data keys:', Object.keys(data));
console.log('data.attendance?.[0]:', data.attendance?.[0]);

const mappedAttendance = data.attendance.map((item: any) => {
  const mapped = {
    courseCode: item.name,
    subject: item.course_title,
    totalHours: item.total_hours,
    totalPresent: item.total_present,
    totalAbsent: item.total_hours - item.total_present,
    attended: item.total_present,
    conducted: item.total_hours,
    percentage: item.percentage_of_attendance,
  };

  console.log('MAPPED ITEM:', mapped);
  return mapped;
});

console.log('FINAL MAPPED[0]:', mappedAttendance[0]);

console.log('RAW STUDENT INFO:', JSON.stringify(data.studentInfo));
console.log('RAW API KEYS:', JSON.stringify(Object.keys(data)));

return {
  studentInfo: data.studentInfo,
  attendance: mappedAttendance,

timetable: (() => {
  if (!data.timetable?.rows) return [];

  const timeHeaders = data.timetable.headers;
  const timeRow = data.timetable.rows[0];
  const dayRows = data.timetable.rows.slice(1);

  const dayMap: Record<string, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday'
  };

  const entries: TimetableEntry[] = [];

  dayRows.forEach((row: any[]) => {
    const day = dayMap[row[0]] || row[0];

    row.slice(1).forEach((cell: string, idx: number) => {
      if (!cell || !cell.startsWith('DS_2')) return;

      const courseCode = cell.replace('DS_2', '');

      const subject =
        data.attendance.find((a: any) => a.name === courseCode)?.course_title ||
        courseCode;

      entries.push({
        day,
        period: idx + 1,
        subject,
        staff: '',
        room: timeRow[idx + 1] || '',
      });
    });
  });

  return entries;
})()
};
}
// ── Announcements API ──

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  return (data as Announcement[]) || [];
}

// ── Broadcasts API ──

export async function fetchBroadcasts(): Promise<Broadcast[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);
  return (data as Broadcast[]) || [];
}

// ── Platform Settings API ──

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  if (!supabase) return { maintenance_mode: false, disable_new_logins: false, emergency_shutdown: false };
  const { data } = await supabase.from('platform_settings').select('*');
  const rows = data as { key: string; value: { enabled: boolean } }[] | null;
  if (!rows) return { maintenance_mode: false, disable_new_logins: false, emergency_shutdown: false };
  return {
    maintenance_mode: rows.find(r => r.key === 'maintenance_mode')?.value?.enabled ?? false,
    disable_new_logins: rows.find(r => r.key === 'disable_new_logins')?.value?.enabled ?? false,
    emergency_shutdown: rows.find(r => r.key === 'emergency_shutdown')?.value?.enabled ?? false,
  };
}

// ── Admin Auth API ──

export async function adminLogin(username: string, password: string): Promise<{ id: string; username: string }> {
  // Check against configured admin credentials
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    throw new Error('Invalid admin credentials');
  }

  // If Supabase is configured, verify/update in database
  if (supabase) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (error || !data) {
      // Create admin user if doesn't exist
      const { data: newAdmin } = await supabase
        .from('admin_users')
        .insert({ username, password_hash: 'managed_via_env' })
        .select('id, username')
        .single();
      return newAdmin as { id: string; username: string };
    }

    return data as { id: string; username: string };
  }

  // Demo mode: return mock admin
  return { id: 'admin-001', username };
}

// ── Admin Announcements API ──

export async function createAnnouncement(title: string, content: string, isPinned: boolean, scheduledAt: string | null, expiresAt: string | null): Promise<void> {
  if (!supabase) return;
  await supabase.from('announcements').insert({ title, content, is_pinned: isPinned, scheduled_at: scheduledAt, expires_at: expiresAt });
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  if (!supabase) return;
  await supabase.from('announcements').update(updates).eq('id', id);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('announcements').delete().eq('id', id);
}

// ── Admin Broadcasts API ──

export async function createBroadcast(message: string, type: Broadcast['type']): Promise<void> {
  if (!supabase) return;
  await supabase.from('broadcasts').insert({ message, type });
}

export async function deleteBroadcast(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('broadcasts').delete().eq('id', id);
}

// ── Admin Platform Settings API ──

export async function updatePlatformSetting(key: string, value: { enabled: boolean }): Promise<void> {
  if (!supabase) return;
  await supabase.from('platform_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
}

// ── Admin Users API ──

export async function fetchUsers(): Promise<AppUser[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
  return (data as AppUser[]) || [];
}

export async function updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
  if (!supabase) return;
  await supabase.from('app_users').update(updates).eq('id', id);
}

export async function deleteUser(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('app_users').delete().eq('id', id);
}

// ── Admin Action Logs ──

export async function logAdminAction(adminId: string, action: string, details: Record<string, unknown> = {}): Promise<void> {
  if (!supabase) return;
  await supabase.from('admin_action_logs').insert({ admin_id: adminId, action, details });
}

export async function fetchAdminLogs(): Promise<AdminActionLog[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('admin_action_logs').select('*').order('created_at', { ascending: false }).limit(100);
  return (data as AdminActionLog[]) || [];
}

// ── User tracking ──

export async function trackUserLogin(info: StudentInfo): Promise<void> {
  if (!supabase) return;
  await supabase.from('app_users').upsert({
    register_number: info.registerNumber,
    name: info.name,
    department: info.department,
    semester: info.semester,
    section: info.section,
    last_login: new Date().toISOString(),
    login_count: 1,
  }, { onConflict: 'register_number' });
}

// ── Admin stats ──

export async function fetchAdminStats(): Promise<{ totalUsers: number; activeUsers: number; todayLogins: number }> {
  if (!supabase) return { totalUsers: 0, activeUsers: 0, todayLogins: 0 };
  const { count: totalUsers } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('is_disabled', false);
  const today = new Date().toISOString().split('T')[0];
  const { count: todayLogins } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).gte('last_login', today);
  const { count: activeUsers } = await supabase.from('app_users').select('*', { count: 'exact', head: true }).gte('last_login', new Date(Date.now() - 7 * 86400000).toISOString());
  return { totalUsers: totalUsers ?? 0, activeUsers: activeUsers ?? 0, todayLogins: todayLogins ?? 0 };
}
