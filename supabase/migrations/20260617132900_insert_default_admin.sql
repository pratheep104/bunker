-- Insert default admin user (username: admin, password: bunker2024)
-- In production, this should be a properly hashed password
INSERT INTO admin_users (username, password_hash) VALUES
  ('admin', '$2a$10$placeholder_hash_change_in_production')
ON CONFLICT (username) DO NOTHING;
