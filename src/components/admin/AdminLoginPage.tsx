import { useState, type FormEvent } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function AdminLoginPage({ onBack }: Props) {
  const { login, isLoading, error } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    await login(username.trim(), password);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Student Login
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
            <Shield className="text-red-400" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Access</h1>
          <p className="text-xs text-neutral-600 mt-1">BUNKER Control Center</p>
        </div>

        <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-400" tabIndex={-1}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading || !username.trim() || !password.trim()}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={14} className="animate-spin" /> Authenticating...</> : 'Access Control Center'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
