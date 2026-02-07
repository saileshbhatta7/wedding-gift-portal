-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  required_amount INTEGER DEFAULT 2000,
  event_name TEXT DEFAULT 'Wedding Contribution Portal',
  deadline TEXT,
  admin_password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (102 coursemates)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roll_no TEXT,
  phone TEXT,
  has_paid INTEGER DEFAULT 0,
  last_submission_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  uploaded_image_url TEXT NOT NULL,
  ocr_detected_amount INTEGER,
  ocr_confidence REAL,
  ocr_raw_text TEXT,
  status TEXT DEFAULT 'PENDING',
  payment_method TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_admin INTEGER DEFAULT 0,
  admin_comment TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_has_paid ON users(has_paid);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_submitted_at ON payments(submitted_at DESC);

-- Insert default settings
INSERT INTO settings (admin_password_hash, event_name, deadline) 
VALUES ('admin123', 'Wedding Gift Contribution', '2026-02-15');

-- Insert sample users (you can replace with actual 102 coursemates)
INSERT INTO users (user_id, name, roll_no, phone) VALUES
('U001', 'Ram Bahadur Thapa', '23', '9812345678'),
('U002', 'Shyam Kumar Rana', '45', '9823456789'),
('U003', 'Sita Kumari Sharma', '12', '9834567890'),
('U004', 'Gita Devi Poudel', '67', '9845678901'),
('U005', 'Krishna Prasad Bhatta', '34', '9856789012'),
('U006', 'Radha Kumari Karki', '56', '9867890123'),
('U007', 'Hari Bahadur Magar', '78', '9878901234'),
('U008', 'Laxmi Devi Gurung', '89', '9889012345'),
('U009', 'Narayan Prasad Koirala', '90', '9890123456'),
('U010', 'Saraswati Kumari Ghimire', '11', '9801234567');
