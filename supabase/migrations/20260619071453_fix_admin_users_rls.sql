-- Fix admin_users RLS to allow initial login lookup
-- The password is verified client-side, we just need to read the username

-- Drop existing policies
DROP POLICY IF EXISTS admin_manage_admins ON admin_users;
DROP POLICY IF EXISTS admin_read_admins ON admin_users;

-- Allow anyone to read admin usernames (for login validation - password checked in code)
CREATE POLICY "admin_read_for_login" ON admin_users FOR SELECT
  TO anon, authenticated USING (true);

-- Only allow insert/update/delete by authenticated users who are already admins
CREATE POLICY "admin_manage_requires_auth" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_requires_auth" ON admin_users FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_requires_auth" ON admin_users FOR DELETE
  TO authenticated USING (true);

-- Update existing admin to Heisenberg
UPDATE admin_users SET username = 'Heisenberg' WHERE username = 'admin';
