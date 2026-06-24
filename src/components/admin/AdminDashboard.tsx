import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Shield, LogOut, Users, Megaphone, Radio, Settings, Activity, Plus, Trash2, Pin, PinOff, ToggleLeft, ToggleRight, AlertTriangle, Search, Ban, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  fetchBroadcasts, createBroadcast, deleteBroadcast,
  fetchPlatformSettings, updatePlatformSetting,
  fetchUsers, updateUser, deleteUser,
  fetchAdminStats, logAdminAction,
} from '../../utils/api';
import type { Announcement, Broadcast, AppUser, PlatformSettings } from '../../types';

type Tab = 'announcements' | 'broadcasts' | 'users' | 'settings' | 'stats';

export default function AdminDashboard() {
  const { logout, username, adminId } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'stats', label: 'Stats', icon: Activity },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'broadcasts', label: 'Broadcasts', icon: Radio },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="text-red-400" size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">BUNKER Admin</h1>
              <p className="text-[9px] text-neutral-600 -mt-0.5">Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-600 hidden sm:block">{username}</span>
            <button onClick={logout} className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.06] text-white border border-white/[0.08]'
                  : 'text-neutral-600 hover:text-neutral-400 border border-transparent'
              }`}>
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && <StatsPanel adminId={adminId} />}
        {activeTab === 'announcements' && <AnnouncementsPanel adminId={adminId} />}
        {activeTab === 'broadcasts' && <BroadcastsPanel adminId={adminId} />}
        {activeTab === 'users' && <UsersPanel adminId={adminId} />}
        {activeTab === 'settings' && <SettingsPanel adminId={adminId} />}
      </main>

      <footer className="border-t border-white/[0.04] mt-12 py-5 text-center">
        <p className="text-[10px] text-neutral-700">BUNKER - Created by Heisenberg</p>
      </footer>
    </div>
  );
}

// ── Stats Panel ──

function StatsPanel({ adminId: _adminId }: { adminId: string | null }) {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, todayLogins: 0 });

  useEffect(() => {
    fetchAdminStats().then(setStats);
  }, []);

  const chartData = [
    { label: 'Total', value: stats.totalUsers },
    { label: 'Active', value: stats.activeUsers },
    { label: 'Today', value: stats.todayLogins },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Users', value: stats.totalUsers, color: 'text-indigo-400' },
          { label: 'Active (7d)', value: stats.activeUsers, color: 'text-emerald-400' },
          { label: 'Today Logins', value: stats.todayLogins, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111111] rounded-xl border border-white/[0.06] p-4">
            <p className="text-[10px] text-neutral-600 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5">
        <h3 className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-4">User Activity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#525252' }} stroke="#262626" />
              <YAxis tick={{ fontSize: 10, fill: '#525252' }} stroke="#262626" />
              <Tooltip contentStyle={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Announcements Panel ──

function AnnouncementsPanel({ adminId }: { adminId: string | null }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const load = useCallback(() => {
    fetchAnnouncements().then(setAnnouncements);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return;
    await createAnnouncement(title, content, isPinned, null, expiresAt || null);
    await logAdminAction(adminId!, 'create_announcement', { title });
    setTitle(''); setContent(''); setIsPinned(false); setExpiresAt(''); setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    await logAdminAction(adminId!, 'delete_announcement', { id });
    load();
  };

  const handleTogglePin = async (a: Announcement) => {
    await updateAnnouncement(a.id, { is_pinned: !a.is_pinned } as Partial<Announcement>);
    await logAdminAction(adminId!, 'toggle_pin', { id: a.id });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-neutral-400">Manage Announcements</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
          <Plus size={12} /> New
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-xs outline-none focus:border-indigo-500/50" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content" rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-xs outline-none focus:border-indigo-500/50 resize-none" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-3 h-3 rounded" /> Pin
            </label>
            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="px-2 py-1 rounded bg-[#0A0A0A] border border-white/[0.08] text-neutral-400 text-[10px] outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-medium">Create</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-neutral-400 text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {announcements.map(a => (
          <div key={a.id} className={`p-3 rounded-xl border ${a.is_pinned ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-[#111111] border-white/[0.06]'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {a.is_pinned && <Pin size={10} className="text-indigo-400" />}
                  <h3 className="text-xs font-medium text-neutral-200">{a.title}</h3>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">{a.content}</p>
                <p className="text-[9px] text-neutral-700 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleTogglePin(a)} className="p-1.5 rounded-md text-neutral-600 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all" title={a.is_pinned ? 'Unpin' : 'Pin'}>
                  {a.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-[11px] text-neutral-600 text-center py-6">No announcements</p>}
      </div>
    </div>
  );
}

// ── Broadcasts Panel ──

function BroadcastsPanel({ adminId }: { adminId: string | null }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Broadcast['type']>('info');

  const load = useCallback(() => { fetchBroadcasts().then(setBroadcasts); }, []);
  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!message.trim()) return;
    await createBroadcast(message, type);
    await logAdminAction(adminId!, 'create_broadcast', { message, type });
    setMessage('');
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteBroadcast(id);
    await logAdminAction(adminId!, 'delete_broadcast', { id });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold text-neutral-400">Manage Broadcasts</h2>

      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4 space-y-3">
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Broadcast message..." rows={2}
          className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-xs outline-none focus:border-indigo-500/50 resize-none" />
        <div className="flex items-center gap-3">
          <select value={type} onChange={e => setType(e.target.value as Broadcast['type'])}
            className="px-2 py-1.5 rounded bg-[#0A0A0A] border border-white/[0.08] text-neutral-400 text-[10px] outline-none">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <button onClick={handleCreate} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-medium">Send</button>
        </div>
      </div>

      <div className="space-y-2">
        {broadcasts.map(b => (
          <div key={b.id} className="flex items-center gap-2 p-3 rounded-xl bg-[#111111] border border-white/[0.06]">
            <Radio size={12} className="text-indigo-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-300">{b.message}</p>
              <p className="text-[9px] text-neutral-700 mt-0.5">{b.type} - {new Date(b.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/5 transition-all flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Users Panel ──

function UsersPanel({ adminId }: { adminId: string | null }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { fetchUsers().then(setUsers); }, []);

  const filtered = users.filter(u =>
    u.register_number.toLowerCase().includes(search.toLowerCase()) ||
    (u.name?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const handleToggleDisable = async (u: AppUser) => {
    await updateUser(u.id, { is_disabled: !u.is_disabled });
    await logAdminAction(adminId!, u.is_disabled ? 'enable_user' : 'disable_user', { id: u.id });
    fetchUsers().then(setUsers);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    await logAdminAction(adminId!, 'delete_user', { id });
    setConfirmDelete(null);
    fetchUsers().then(setUsers);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-neutral-400">User Management</h2>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="pl-7 pr-3 py-1.5 rounded-lg bg-[#0A0A0A] border border-white/[0.08] text-white placeholder-neutral-600 text-[10px] outline-none w-44 focus:border-indigo-500/50" />
        </div>
      </div>

      <div className="space-y-1.5">
        {filtered.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[#111111] border border-white/[0.06]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-200">{u.name || u.register_number}</span>
                {u.is_disabled && <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20">Disabled</span>}
              </div>
              <p className="text-[10px] text-neutral-600">{u.register_number} | {u.department || 'N/A'} | Sem {u.semester || '?'}</p>
              <p className="text-[9px] text-neutral-700 mt-0.5">Logins: {u.login_count} | Last: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-3">
              <button onClick={() => handleToggleDisable(u)}
                className={`p-1.5 rounded-md transition-all ${u.is_disabled ? 'text-emerald-400 hover:bg-emerald-500/5' : 'text-amber-400 hover:bg-amber-500/5'}`}
                title={u.is_disabled ? 'Enable' : 'Disable'}>
                {u.is_disabled ? <Check size={12} /> : <Ban size={12} />}
              </button>
              {confirmDelete === u.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-md bg-red-500/10 text-red-400"><Check size={12} /></button>
                  <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-md bg-white/[0.04] text-neutral-400"><X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(u.id)}
                  className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[11px] text-neutral-600 text-center py-6">No users found</p>}
      </div>
    </div>
  );
}

// ── Settings Panel ──

function SettingsPanel({ adminId }: { adminId: string | null }) {
  const [settings, setSettings] = useState<PlatformSettings>({ maintenance_mode: false, disable_new_logins: false, emergency_shutdown: false });
  const [confirmShutdown, setConfirmShutdown] = useState(false);

  useEffect(() => { fetchPlatformSettings().then(setSettings); }, []);

  const handleToggle = async (key: keyof PlatformSettings) => {
    if (key === 'emergency_shutdown' && !confirmShutdown) {
      setConfirmShutdown(true);
      return;
    }
    const newVal = !settings[key];
    await updatePlatformSetting(key, { enabled: newVal });
    await logAdminAction(adminId!, `toggle_${key}`, { enabled: newVal });
    setSettings(s => ({ ...s, [key]: newVal }));
    setConfirmShutdown(false);
  };

  const toggles: { key: keyof PlatformSettings; label: string; desc: string; danger?: boolean }[] = [
    { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Block all student access. Admin retains access.' },
    { key: 'disable_new_logins', label: 'Disable New Logins', desc: 'Existing sessions continue. New student logins blocked.' },
    { key: 'emergency_shutdown', label: 'Emergency Shutdown', desc: 'Immediately take BUNKER offline for all students.', danger: true },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold text-neutral-400">Website Control Center</h2>

      <div className="space-y-3">
        {toggles.map(t => {
          const isOn = settings[t.key];
          const isDanger = t.danger && (isOn || confirmShutdown);

          return (
            <div key={t.key} className={`p-4 rounded-xl border ${isDanger ? 'bg-red-500/5 border-red-500/10' : 'bg-[#111111] border-white/[0.06]'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium text-neutral-200">{t.label}</h3>
                    {isOn && <span className={`px-1.5 py-0.5 rounded text-[9px] ${t.danger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>Active</span>}
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{t.desc}</p>
                </div>
                <button onClick={() => handleToggle(t.key)}
                  className={`flex-shrink-0 transition-colors ${isOn ? 'text-red-400' : 'text-neutral-600'}`}>
                  {isOn ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
              {confirmShutdown && t.key === 'emergency_shutdown' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-500/10">
                  <AlertTriangle size={13} className="text-red-400" />
                  <span className="text-[10px] text-red-400 flex-1">Confirm: Take BUNKER offline?</span>
                  <button onClick={() => handleToggle('emergency_shutdown')}
                    className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-medium">Confirm</button>
                  <button onClick={() => setConfirmShutdown(false)}
                    className="px-2.5 py-1 rounded bg-white/[0.04] text-neutral-400 text-[10px]">Cancel</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
