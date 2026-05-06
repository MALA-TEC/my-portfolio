-- Create database
CREATE DATABASE IF NOT EXISTS unity_registry;
USE unity_registry;

-- Events table with ALL required columns
CREATE TABLE IF NOT EXISTS `vital_events` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `certificate_id` VARCHAR(50) NOT NULL UNIQUE,
    `event_type` ENUM('birth', 'marriage', 'divorce', 'adoption', 'death') NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `event_date` DATE NOT NULL,
    `registration_date` DATETIME NOT NULL,
    `timestamp` DATETIME NOT NULL,
    
    -- Phone and Location (ADD THESE - MISSING!)
    `phone_number` VARCHAR(20) DEFAULT NULL,
    `region` VARCHAR(100) DEFAULT NULL,
    `zone` VARCHAR(100) DEFAULT NULL,
    `woreda` VARCHAR(100) DEFAULT NULL,
    `kebele` VARCHAR(100) DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT 'active',
    
    -- Personal Information
    `gender` VARCHAR(20) DEFAULT NULL,
    `date_of_birth` DATE DEFAULT NULL,
    `national_id` VARCHAR(100) DEFAULT NULL,
    `country_code` VARCHAR(10) DEFAULT '+251',
    `email` VARCHAR(100) DEFAULT NULL,
    
    -- Address fields
    `house_number` VARCHAR(50) DEFAULT NULL,
    `sub_city` VARCHAR(100) DEFAULT NULL,
    `additional_address` TEXT DEFAULT NULL,
    
    -- Event details
    `event_time` TIME DEFAULT NULL,
    `document_type` VARCHAR(100) DEFAULT NULL,
    `document_number` VARCHAR(100) DEFAULT NULL,
    
    -- Birth fields
    `birth_weight` DECIMAL(5,2) DEFAULT NULL,
    `birth_place` VARCHAR(255) DEFAULT NULL,
    `attendant` VARCHAR(255) DEFAULT NULL,
    `father_name` VARCHAR(255) DEFAULT NULL,
    `mother_name` VARCHAR(255) DEFAULT NULL,
    
    -- Marriage fields
    `spouse1_name` VARCHAR(255) DEFAULT NULL,
    `spouse2_name` VARCHAR(255) DEFAULT NULL,
    `marriage_location` VARCHAR(255) DEFAULT NULL,
    `officiant` VARCHAR(255) DEFAULT NULL,
    `marriage_cert_number` VARCHAR(100) DEFAULT NULL,
    
    -- Divorce fields
    `petitioner` VARCHAR(255) DEFAULT NULL,
    `respondent` VARCHAR(255) DEFAULT NULL,
    `court_name` VARCHAR(255) DEFAULT NULL,
    `decree_number` VARCHAR(100) DEFAULT NULL,
    `divorce_reason` TEXT DEFAULT NULL,
    
    -- Adoption fields
    `child_name` VARCHAR(255) DEFAULT NULL,
    `child_dob` DATE DEFAULT NULL,
    `adoptive_parents` VARCHAR(255) DEFAULT NULL,
    `adoption_agency` VARCHAR(255) DEFAULT NULL,
    
    -- Death fields
    `death_place` VARCHAR(255) DEFAULT NULL,
    `cause_of_death` VARCHAR(255) DEFAULT NULL,
    `physician_name` VARCHAR(255) DEFAULT NULL,
    `informant_name` VARCHAR(255) DEFAULT NULL,
    
    -- Photos (base64 strings can be long - use LONGTEXT)
    `photo` LONGTEXT DEFAULT NULL,
    `spouse1_photo` LONGTEXT DEFAULT NULL,
    `spouse2_photo` LONGTEXT DEFAULT NULL,
    
    -- Metadata
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    INDEX idx_certificate (`certificate_id`),
    INDEX idx_event_type (`event_type`),
    INDEX idx_region (`region`),
    INDEX idx_created (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table for admin authentication
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `role` ENUM('admin', 'user') DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin (password: admin123)
INSERT INTO `users` (`username`, `password_hash`, `email`, `role`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@unityregistry.gov', 'admin');

-- Create audit log table
CREATE TABLE IF NOT EXISTS `audit_log` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(50) NOT NULL,
    `certificate_id` VARCHAR(50) DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX idx_created (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;