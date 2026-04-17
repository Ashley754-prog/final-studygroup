-- Study Group Database Setup for Railway (Fixed to match your actual structure)
-- Run this script in your Railway MySQL database

-- Create users table (matches your actual structure)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  google_id VARCHAR(255),
  is_verified TINYINT(1) DEFAULT 0,
  verification_code VARCHAR(10),
  reset_password_token VARCHAR(255),
  reset_password_expire DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active','banned') DEFAULT 'active',
  bio TEXT,
  profile_photo VARCHAR(255),
  is_admin TINYINT(1) DEFAULT 0
);

-- Create study_groups table (matches your actual structure)
CREATE TABLE IF NOT EXISTS study_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INT,
  size INT,
  current_members INT DEFAULT 1,
  course VARCHAR(100),
  topic VARCHAR(100),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','approved','declined') DEFAULT 'pending',
  remarks VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  email_sent TINYINT(1) DEFAULT 0,
  visibility ENUM('visible','hidden') DEFAULT 'visible',
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create group_members table (matches your actual structure)
CREATE TABLE IF NOT EXISTS group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  user_id INT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending','approved','declined') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create schedules table (matches your actual structure)
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start DATETIME,
  end DATETIME,
  location VARCHAR(255),
  meetingLink VARCHAR(255),
  attendees LONGTEXT DEFAULT '[]',
  googleEventId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  meetingType ENUM('physical','online') DEFAULT 'physical',
  FOREIGN KEY (groupId) REFERENCES study_groups(id)
);

-- Create announcements table (matches your actual structure)
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  target VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  sender_id INT,
  text TEXT,
  file_link TEXT,
  time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255),
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_starred TINYINT(1) DEFAULT 0,
  is_archived TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  type VARCHAR(50) DEFAULT 'general',
  related_id INT,
  requester_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reported_by INT,
  reported_user INT,
  group_id INT,
  reason VARCHAR(255),
  status ENUM('pending','resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (reported_user) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES study_groups(id)
);

-- Create group_join_requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  user_id INT,
  status ENUM('pending','approved','declined') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create group_pending_requests table
CREATE TABLE IF NOT EXISTS group_pending_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  user_id INT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert admin user (ID: 35) - using correct password hash for "test123"
INSERT INTO users (id, username, email, password, first_name, last_name, is_admin, is_verified, status) 
VALUES (35, 'admin', 'admin@wmsu.edu.ph', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 1, 1, 'active')
ON DUPLICATE KEY UPDATE email='admin@wmsu.edu.ph';

-- Show created tables
SHOW TABLES;

-- Verify admin user
SELECT id, username, email, is_admin FROM users WHERE id = 35;
