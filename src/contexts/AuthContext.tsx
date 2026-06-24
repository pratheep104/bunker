// @refresh reset
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AuthState, Announcement, Broadcast, PlatformSettings } from '../types';
import { fetchAttendance, fetchAnnouncements, fetchBroadcasts, fetchPlatformSettings, trackUserLogin, AttendanceError } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  announcements: Announcement[];
  broadcasts: Broadcast[];
  platformSettings: PlatformSettings;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
const BLANK_STATE: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  studentInfo: null,
  attendance: [],
  timetable: []
};
const [isInitializing, setIsInitializing] = useState(true);
const [state, setState] = useState<AuthState>(() => {
  const saved = localStorage.getItem('bunker_auth');

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      const firstItem = parsed.attendance?.[0];

      const isValidShape =
        !firstItem ||
        ('percentage' in firstItem &&
         'subject' in firstItem &&
         'attended' in firstItem);

      if (parsed.isAuthenticated && isValidShape) {
        return parsed;
      }

      console.warn('Stale data in localStorage, clearing...');
      localStorage.removeItem('bunker_auth');
    } catch {
      /* ignore */
    }
  }

  return BLANK_STATE;
});
useEffect(() => {
  setIsInitializing(false);
}, []);

  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(() => {
    const saved = localStorage.getItem('bunker_creds');
    if (saved) try { return JSON.parse(saved); } catch { return null; }
    return null;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({ maintenance_mode: false, disable_new_logins: false, emergency_shutdown: false });

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements);
    fetchBroadcasts().then(setBroadcasts);
    fetchPlatformSettings().then(setPlatformSettings);
    const interval = setInterval(() => {
      fetchAnnouncements().then(setAnnouncements);
      fetchBroadcasts().then(setBroadcasts);
      fetchPlatformSettings().then(setPlatformSettings);
    }, 60000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  const login = useCallback(async (username: string, password: string, remember: boolean) => {
    const settings = await fetchPlatformSettings();
    if (settings.emergency_shutdown) {
      setState(s => ({ ...s, isLoading: false, error: 'BUNKER is currently offline. Please try again later.' }));
      return;
    }
    if (settings.maintenance_mode) {
      setState(s => ({ ...s, isLoading: false, error: 'BUNKER is under maintenance. Please try again later.' }));
      return;
    }
    if (settings.disable_new_logins) {
      const saved = localStorage.getItem('bunker_auth');
      if (!saved) {
        setState(s => ({ ...s, isLoading: false, error: 'New logins are temporarily disabled.' }));
        return;
      }
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { studentInfo, attendance, timetable } = await fetchAttendance(username, password);
      console.log('LOGIN ATTENDANCE:' + JSON.stringify(attendance[0]));
      const newState: AuthState = { isAuthenticated: true, isLoading: false, error: null, studentInfo, attendance, timetable };
      setState(newState);
      if (remember) {
        localStorage.setItem('bunker_auth', JSON.stringify(newState));
        localStorage.setItem('bunker_creds', JSON.stringify({ username, password }));
        setCredentials({ username, password });
      }
      trackUserLogin(studentInfo);
    } catch (err) {
      let message = 'An unexpected error occurred. Please try again.';
      if (err instanceof AttendanceError) {
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setState(s => ({ ...s, isLoading: false, error: message }));
    }
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, isLoading: false, error: null, studentInfo: null, attendance: [], timetable: [] });
    localStorage.removeItem('bunker_auth');
    localStorage.removeItem('bunker_creds');
    setCredentials(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!credentials) {
      setState(s => ({ ...s, error: 'Session expired. Please log in again.' }));
      return;
    }
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const { studentInfo, attendance, timetable } = await fetchAttendance(credentials.username, credentials.password);
      const newState: AuthState = { isAuthenticated: true, isLoading: false, error: null, studentInfo, attendance, timetable };
      setState(newState);
      localStorage.setItem('bunker_auth', JSON.stringify(newState));
    } catch (err) {
      let message = 'Failed to refresh attendance data.';
      if (err instanceof AttendanceError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          message = 'Session expired. Please log in again.';
          logout();
          return;
        }
        message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setState(s => ({ ...s, isLoading: false, error: message }));
    }
  }, [credentials, logout]);
if (isInitializing) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh, announcements, broadcasts, platformSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
