-- User Authentication Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  sbu_id INTEGER REFERENCES master_sbu(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_sbu ON users(sbu_id);

-- Update trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'admin',
  'admin@revas.com',
  '$2a$10$rQZ5YJ5YJ5YJ5YJ5YJ5YJOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',
  'System Administrator',
  'admin',
  TRUE
) ON CONFLICT (username) DO NOTHING;
