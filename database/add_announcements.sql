-- ============================================================
-- Migration: Add Announcements table
-- Run this once against your placement_db database
-- ============================================================

CREATE TABLE IF NOT EXISTS Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    body            TEXT         NOT NULL,
    priority        ENUM('Info', 'Warning', 'Urgent') DEFAULT 'Info',
    target_role     ENUM('all', 'student', 'company') DEFAULT 'all',
    created_by      INT,                          -- admin user_id
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATE,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);
