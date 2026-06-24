-- Fix security issues with RLS policies

-- ============================================
-- admin_users table fixes
-- ============================================

-- Drop insecure policies
DROP POLICY IF EXISTS admin_delete_requires_auth ON admin_users;
DROP POLICY IF EXISTS admin_manage_requires_auth ON admin_users;
DROP POLICY IF EXISTS admin_update_requires_auth ON admin_users;

-- INSERT: Only allow inserting the configured admin (username check)
-- This prevents arbitrary user creation while allowing initial admin setup
CREATE POLICY "admin_insert_configured_only" ON admin_users FOR INSERT
  TO anon, authenticated
  WITH CHECK (username = 'Heisenberg');

-- UPDATE: Only allow updating the configured admin
CREATE POLICY "admin_update_configured_only" ON admin_users FOR UPDATE
  TO anon, authenticated
  USING (username = 'Heisenberg')
  WITH CHECK (username = 'Heisenberg');

-- DELETE: Only allow deleting the configured admin
CREATE POLICY "admin_delete_configured_only" ON admin_users FOR DELETE
  TO anon, authenticated
  USING (username = 'Heisenberg');

-- ============================================
-- users table fixes
-- ============================================

-- Drop insecure insert policy
DROP POLICY IF EXISTS insert_users ON users;

-- INSERT: Allow tracking user logins (upsert pattern)
-- Restrict to users with valid register_number format
CREATE POLICY "users_insert_tracking" ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    register_number IS NOT NULL 
    AND length(register_number) >= 3
    AND length(register_number) <= 20
  );
