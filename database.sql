-- Create database
CREATE DATABASE IF NOT EXISTS unity_registry;
USE unity_registry;

-- Events table
CREATE TABLE IF NOT EXISTS `vital_events` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `certificate_id` VARCHAR(50) NOT NULL UNIQUE,
    `event_type` ENUM('birth', 'marriage', 'divorce', 'adoption', 'death') NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `event_date` DATE NOT NULL,
    `registration_date` DATETIME NOT NULL,
    `timestamp` DATETIME NOT NULL,
    
    -- Birth fields
    `gender` VARCHAR(20) DEFAULT NULL,
    `birth_weight` DECIMAL(5,2) DEFAULT NULL,
    `birth_place` VARCHAR(255) DEFAULT NULL,
    `attendant` VARCHAR(255) DEFAULT NULL,
    `father_name` VARCHAR(255) DEFAULT NULL,
    `mother_name` VARCHAR(255) DEFAULT NULL,
    
    -- Marriage fields
    `spouse1_name` VARCHAR(255) DEFAULT NULL,
    `spouse2_name` VARCHAR(255) DEFAULT NULL,
    `marriage_location` VARCHAR(255) DEFAULT NULL,
    `officiant_name` VARCHAR(255) DEFAULT NULL,
    `contract_number` VARCHAR(100) DEFAULT NULL,
    
    -- Divorce fields
    `petitioner_name` VARCHAR(255) DEFAULT NULL,
    `respondent_name` VARCHAR(255) DEFAULT NULL,
    `court_name` VARCHAR(255) DEFAULT NULL,
    `decree_number` VARCHAR(100) DEFAULT NULL,
    `divorce_reason` TEXT DEFAULT NULL,
    
    -- Adoption fields
    `child_name` VARCHAR(255) DEFAULT NULL,
    `child_dob` DATE DEFAULT NULL,
    `adoptive_parents` VARCHAR(255) DEFAULT NULL,
    `adoption_agency` VARCHAR(255) DEFAULT NULL,
    `court_order_number` VARCHAR(100) DEFAULT NULL,
    
    -- Death fields
    `death_date` DATE DEFAULT NULL,
    `death_place` VARCHAR(255) DEFAULT NULL,
    `cause_of_death` VARCHAR(255) DEFAULT NULL,
    `physician_name` VARCHAR(255) DEFAULT NULL,
    `informant_name` VARCHAR(255) DEFAULT NULL,
    
    -- Metadata
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    INDEX (`certificate_id`),
    INDEX (`event_type`),
    INDEX (`event_date`),
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table for admin authentication (optional)
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
    INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;