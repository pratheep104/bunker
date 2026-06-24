-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false}'),
  ('disable_new_logins', '{"enabled": false}'),
  ('emergency_shutdown', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- Users table (tracks student usage)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  register_number TEXT UNIQUE NOT NULL,
  name TEXT,
  department TEXT,
  semester TEXT,
  section TEXT,
  is_disabled BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin action logs
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Announcements: anyone can read active ones
CREATE POLICY "read_active_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_announcements" ON announcements FOR ALL
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users)) WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- Broadcasts: anyone can read active ones
CREATE POLICY "read_active_broadcasts" ON broadcasts FOR SELECT
  TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin_broadcasts" ON broadcasts FOR ALL
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users)) WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- Platform settings: anyone can read, admin can update
CREATE POLICY "read_platform_settings" ON platform_settings FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "admin_platform_settings" ON platform_settings FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users)) WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- Users: anyone can insert (on login), admin can do everything
CREATE POLICY "insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "read_users" ON users FOR SELECT
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users));
CREATE POLICY "update_users" ON users FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users));
CREATE POLICY "admin_delete_users" ON users FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users));

-- Admin users: only admin can read/manage
CREATE POLICY "admin_read_admins" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users));
CREATE POLICY "admin_manage_admins" ON admin_users FOR ALL
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users)) WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- Admin action logs: admin can read, admin can insert
CREATE POLICY "admin_read_logs" ON admin_action_logs FOR SELECT
  TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users));
CREATE POLICY "admin_insert_logs" ON admin_action_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));
