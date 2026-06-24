import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../App';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const { setShowAdmin } = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password, remember);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 mb-5">
            <Shield className="text-indigo-400" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BUNKER</h1>
          <p className="text-sm text-neutral-500 mt-1">Smart Attendance Intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Register Number
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 22ITR001"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-400 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-neutral-700 bg-[#0A0A0A] text-indigo-500 focus:ring-indigo-500/20"
              />
              <label htmlFor="remember" className="text-xs text-neutral-500">Remember me</label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <p className="text-[11px] text-neutral-600 text-center leading-relaxed">
              Credentials are sent securely to PSG eCampus portal.<br />
              Passwords are never stored.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8">
          <p className="text-[11px] text-neutral-700">Created by Heisenberg</p>
          <button onClick={() => setShowAdmin(true)} className="text-[10px] text-neutral-700 hover:text-neutral-500 transition-colors">Admin</button>
        </div>
      </div>
    </div>
  );
}
