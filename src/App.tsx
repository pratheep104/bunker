import { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminLoginPage from './components/admin/AdminLoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import { fetchPlatformSettings } from './utils/api';
import type { PlatformSettings } from './types';

interface RouterCtxType {
  showAdmin: boolean;
  setShowAdmin: (v: boolean) => void;
}

const RouterCtx = createContext<RouterCtxType>({ showAdmin: false, setShowAdmin: () => {} });

export function useRouter() {
  return useContext(RouterCtx);
}

function StudentApp() {
  const { isAuthenticated, platformSettings } = useAuth();
  console.log('STUDENT APP RENDERED');
  console.log('AUTH STATUS:', isAuthenticated);
  if (platformSettings.emergency_shutdown || platformSettings.maintenance_mode) {
    if (isAuthenticated) return <Dashboard />;
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">BUNKER is Unavailable</h1>
          <p className="text-sm text-neutral-500 mt-2">The platform is currently offline. Please try again later.</p>
          <p className="text-[10px] text-neutral-700 mt-6">Created by Heisenberg</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}

function AdminApp() {
  const { isAuthenticated } = useAdminAuth();
  const { setShowAdmin } = useRouter();
  return isAuthenticated ? <AdminDashboard /> : <AdminLoginPage onBack={() => setShowAdmin(false)} />;
}

function AppRouter() {
  const [showAdmin, setShowAdmin] = useState(false);

const [settings, setSettings] = useState<PlatformSettings>(() => {
  const cached = localStorage.getItem('bunker_settings');

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  return {
    maintenance_mode: false,
    disable_new_logins: false,
    emergency_shutdown: false,
  };
});
  useEffect(() => {
    fetchPlatformSettings().then((s) => {
      setSettings(s);
      localStorage.setItem('bunker_settings', JSON.stringify(s));
    });
  }, []);

  if (settings.emergency_shutdown && !showAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">TEST BUILD</h1>
          <p className="text-sm text-neutral-500 mt-2">The platform is temporarily unavailable.</p>
          <button onClick={() => setShowAdmin(true)} className="mt-4 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">Admin Access</button>
          <p className="text-[10px] text-neutral-700 mt-6">Created by Heisenberg</p>
        </div>
      </div>
    );
  }

  if (settings.disable_new_logins) {
    const savedAuth = localStorage.getItem('bunker_auth');
    if (!savedAuth && !showAdmin) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Logins Temporarily Disabled</h1>
            <p className="text-sm text-neutral-500 mt-2">New student logins are currently restricted.</p>
            <button onClick={() => setShowAdmin(true)} className="mt-4 text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors">Admin Access</button>
            <p className="text-[10px] text-neutral-700 mt-6">Created by Heisenberg</p>
          </div>
        </div>
      );
    }
  }

  return (
    <RouterCtx.Provider value={{ showAdmin, setShowAdmin }}>
      {showAdmin ? (
        <AdminAuthProvider>
          <AdminApp />
        </AdminAuthProvider>
      ) : (
        <AuthProvider>
          <StudentApp />
        </AuthProvider>
      )}
    </RouterCtx.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}
