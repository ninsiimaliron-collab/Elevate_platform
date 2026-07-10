-- Create elevate_db database if not exists
CREATE DATABASE IF NOT EXISTS elevate_db;
USE elevate_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('youth', 'employer', 'admin') NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_changed_at TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_phone CHECK (phone REGEXP '^(\\+256|0)(7[0-9])[0-9]{7}$'),
  INDEX idx_users_role (role)
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user (user_id)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_tokens_user (user_id)
);

-- Youth profiles table
CREATE TABLE IF NOT EXISTS youth_profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  date_of_birth DATE NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(50),
  division ENUM('Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'),
  sub_county VARCHAR(255),
  skills JSON NOT NULL DEFAULT (JSON_ARRAY()),
  education_level ENUM('none', 'certificate', 'diploma', 'bachelors', 'masters', 'phd', 'vocational'),
  education_details JSON NOT NULL DEFAULT (JSON_OBJECT()),
  bio TEXT,
  cv_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  profile_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_youth_age CHECK (age BETWEEN 18 AND 30),
  INDEX idx_youth_division (division)
);

-- Employer profiles table
CREATE TABLE IF NOT EXISTS employer_profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  industry ENUM('technology', 'construction', 'healthcare', 'education', 'finance', 'retail', 'hospitality', 'manufacturing', 'logistics', 'other') NOT NULL,
  registration_number VARCHAR(255),
  registration_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  location_division ENUM('Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'),
  address TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(255),
  description TEXT,
  contact_person VARCHAR(255),
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_employer_division (location_division)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employer_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  requirements JSON NOT NULL DEFAULT (JSON_ARRAY()),
  responsibilities JSON NOT NULL DEFAULT (JSON_ARRAY()),
  job_type ENUM('full-time', 'part-time', 'internship', 'apprenticeship', 'contract', 'volunteer'),
  division ENUM('Central', 'Kawempe', 'Makindye', 'Nakawa', 'Rubaga'),
  location_detail VARCHAR(255),
  skills_required JSON NOT NULL DEFAULT (JSON_ARRAY()),
  education_level ENUM('none', 'certificate', 'diploma', 'bachelors', 'masters', 'phd', 'vocational'),
  experience_years INT,
  salary_min DECIMAL(12, 2),
  salary_max DECIMAL(12, 2),
  salary_currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
  is_salary_visible BOOLEAN NOT NULL DEFAULT false,
  application_deadline DATE,
  status ENUM('draft', 'active', 'closed', 'expired', 'archived') NOT NULL DEFAULT 'draft',
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employer_id) REFERENCES employer_profiles(id) ON DELETE CASCADE,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_division (division),
  INDEX idx_jobs_job_type (job_type),
  INDEX idx_jobs_deadline (application_deadline),
  FULLTEXT INDEX idx_jobs_search (title, description)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  job_id CHAR(36) NOT NULL,
  youth_id CHAR(36) NOT NULL,
  cover_letter TEXT,
  status ENUM('pending', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  employer_notes TEXT,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (youth_id) REFERENCES youth_profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_job_youth (job_id, youth_id),
  INDEX idx_applications_job (job_id),
  INDEX idx_applications_youth (youth_id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  created_by CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  body LONGTEXT,
  category ENUM('mentorship', 'free_courses', 'resume_tips', 'career_advice', 'skills_training') NOT NULL,
  external_url VARCHAR(255),
  thumbnail_url VARCHAR(255),
  is_published BOOLEAN NOT NULL DEFAULT false,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_resources_published (is_published),
  INDEX idx_resources_category (category)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  youth_id CHAR(36) NOT NULL,
  resource_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youth_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE KEY unique_youth_resource (youth_id, resource_id)
);
