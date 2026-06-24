import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AdminAuthState } from '../types';
import { adminLogin } from '../utils/api';

interface AdminAuthContextType extends AdminAuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>(() => {
    const saved = localStorage.getItem('bunker_admin_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isAuthenticated) return parsed;
      } catch { /* ignore */ }
    }
    return { isAuthenticated: false, isLoading: false, error: null, adminId: null, username: null };
  });

  const login = useCallback(async (username: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const admin = await adminLogin(username, password);
      const newState: AdminAuthState = { isAuthenticated: true, isLoading: false, error: null, adminId: admin.id, username: admin.username };
      setState(newState);
      localStorage.setItem('bunker_admin_auth', JSON.stringify(newState));
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: err instanceof Error ? err.message : 'Admin login failed' }));
    }
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, isLoading: false, error: null, adminId: null, username: null });
    localStorage.removeItem('bunker_admin_auth');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
