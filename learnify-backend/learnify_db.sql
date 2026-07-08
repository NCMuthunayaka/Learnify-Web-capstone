-- ============================================================
--  Learnify Database Schema
--  Run this in phpMyAdmin or MySQL CLI
--  mysql -u root learnify < learnify_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS learnify
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learnify;

-- ── 1. users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT            AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150)   NOT NULL,
    email         VARCHAR(255)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)   NOT NULL,
    role          ENUM('student','mentor','admin') DEFAULT 'student',
    status        ENUM('active','pending','inactive') DEFAULT 'pending',
    avatar_url    VARCHAR(500)   NULL,
    -- student fields
    phone         VARCHAR(20)    NULL,
    bio           TEXT           NULL,
    student_id    VARCHAR(50)    NULL,
    university    VARCHAR(200)   NULL,
    faculty       VARCHAR(200)   NULL,
    year          VARCHAR(20)    NULL,
    -- mentor fields
    department    VARCHAR(200)   NULL,
    subject       VARCHAR(100)   NULL,
    experience    VARCHAR(50)    NULL,
    created_at    DATETIME       DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME       NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 2. notification_types ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_types (
    id   INT         AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 3. subjects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
    id        INT          AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL UNIQUE,
    color_hex VARCHAR(7)   DEFAULT '#4A90D9',
    icon      VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 4. file_types ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_types (
    id   INT         AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 5. token_blocklist ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_blocklist (
    id         INT         AUTO_INCREMENT PRIMARY KEY,
    jti        VARCHAR(36) NOT NULL UNIQUE,
    token_type VARCHAR(10) NOT NULL DEFAULT 'access',
    revoked_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id    INT         NULL,
    INDEX idx_jti (jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 6. notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    type_id    INT          NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT         NOT NULL,
    is_read    TINYINT(1)   DEFAULT 0,
    action_url VARCHAR(500) NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES notification_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 7. resources ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
    id             INT          AUTO_INCREMENT PRIMARY KEY,
    uploader_id    INT          NOT NULL,
    uploader_type  ENUM('mentor','peer') NOT NULL DEFAULT 'mentor',
    subject_id     INT          NOT NULL,
    file_type_id   INT          NOT NULL,
    title          VARCHAR(255) NOT NULL,
    file_url       VARCHAR(500) NOT NULL,
    file_size_mb   FLOAT        DEFAULT 0,
    duration_sec   INT          NULL,
    status         ENUM('draft','published') DEFAULT 'published',
    view_count     INT          DEFAULT 0,
    download_count INT          DEFAULT 0,
    uploaded_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    published_at   DATETIME     NULL,
    FOREIGN KEY (uploader_id)  REFERENCES users(id),
    FOREIGN KEY (subject_id)   REFERENCES subjects(id),
    FOREIGN KEY (file_type_id) REFERENCES file_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 8. feedback ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id         INT            AUTO_INCREMENT PRIMARY KEY,
    user_id    INT            NOT NULL,
    subject    VARCHAR(100)   NOT NULL,
    mentor_id  INT            NULL,
    rating     SMALLINT       NOT NULL,
    category   ENUM('Mentor Quality','Session Quality','Platform Issue','AI Assistant','General')
                              NOT NULL DEFAULT 'General',
    comment    TEXT           NOT NULL,
    sentiment  ENUM('positive','neutral','negative') NULL,
    confidence DECIMAL(4,3)   NULL,
    created_at DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 9. chat_sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    title      VARCHAR(200) DEFAULT 'New Chat',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 10. chat_messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         INT          AUTO_INCREMENT PRIMARY KEY,
    session_id INT          NOT NULL,
    role       VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    file_url   VARCHAR(500) NULL,
    file_name  VARCHAR(255) NULL,
    file_type  VARCHAR(50)  NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 11. student_profiles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
    id         INT  AUTO_INCREMENT PRIMARY KEY,
    user_id    INT  NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 12. study_sessions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
    id           INT          AUTO_INCREMENT PRIMARY KEY,
    student_id   INT          NOT NULL,
    subject_id   INT          NOT NULL,
    start_time   DATETIME     NOT NULL,
    end_time     DATETIME     NOT NULL,
    duration_min INT          DEFAULT 0,
    session_type VARCHAR(50)  DEFAULT 'study',
    completed    TINYINT(1)   DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 13. tasks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id             INT         AUTO_INCREMENT PRIMARY KEY,
    student_id     INT         NOT NULL,
    subject_id     INT         NOT NULL,
    title          VARCHAR(255) NOT NULL,
    type           ENUM('assignment','exam','project','lab_report') DEFAULT 'assignment',
    due_date       DATE        NOT NULL,
    status         ENUM('todo','in_progress','done') DEFAULT 'todo',
    completion_pct INT         DEFAULT 0,
    created_at     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── 14. student_subjects ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_subjects (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    UNIQUE KEY uq_student_subject (student_id, subject_id),
    FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  SEED DATA
-- ============================================================

-- Notification types
INSERT IGNORE INTO notification_types (name) VALUES
    ('system'),
    ('approval'),
    ('session'),
    ('feedback'),
    ('resource');

-- File types
INSERT IGNORE INTO file_types (name) VALUES
    ('PDF'),
    ('DOCX'),
    ('PPTX'),
    ('Video');

-- Subjects
INSERT IGNORE INTO subjects (name, color_hex, icon) VALUES
    ('Mathematics',        '#4A90D9', 'calculator'),
    ('Physics',            '#E07C3A', 'atom'),
    ('Chemistry',          '#2A9D8F', 'flask'),
    ('Biology',            '#27AE60', 'leaf'),
    ('Computer Science',   '#7C5CBF', 'code'),
    ('English',            '#E74C3C', 'book'),
    ('History',            '#F39C12', 'scroll'),
    ('Economics',          '#16A085', 'chart');

-- ============================================================
--  NOTE: Admin user is created by running:
--    python seed_admin.py
--  (see seed_admin.py in this folder)
-- ============================================================
