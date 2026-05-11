CREATE DATABASE IF NOT EXISTS intelligent_network_db;
USE intelligent_network_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_phone_number (phone_number),
    INDEX idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS recharges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recharges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recharges_user_id (user_id),
    INDEX idx_recharges_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NULL,
    twilio_call_sid VARCHAR(100) NULL,
    account_sid VARCHAR(100) NULL,
    call_status VARCHAR(50) NULL,
    direction VARCHAR(50) NULL,
    decision ENUM('ALLOW_CALL', 'REJECT_CALL') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_calls_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_calls_user_id (user_id),
    INDEX idx_calls_from_number (from_number),
    INDEX idx_calls_twilio_call_sid (twilio_call_sid),
    INDEX idx_calls_created_at (created_at),
    INDEX idx_calls_decision (decision)
);

CREATE TABLE IF NOT EXISTS decision_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    phone_number VARCHAR(20) NOT NULL,
    decision ENUM('ALLOW_CALL', 'REJECT_CALL') NOT NULL,
    reason VARCHAR(255) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_decision_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_decision_logs_user_id (user_id),
    INDEX idx_decision_logs_phone_number (phone_number),
    INDEX idx_decision_logs_created_at (created_at),
    INDEX idx_decision_logs_decision (decision)
);
