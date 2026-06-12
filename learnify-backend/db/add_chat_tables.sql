-- Migration: Add chat_sessions and chat_messages tables for the Learnify AI Chatbot
-- Run this against the learnify database when MySQL is running.

USE learnify;

-- AI Chat Sessions (one conversation thread per user)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         INT          NOT NULL AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    title      VARCHAR(200) NOT NULL DEFAULT 'New Chat',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cs_user (user_id),
    CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;


-- AI Chat Messages (individual messages within a session)
CREATE TABLE IF NOT EXISTS chat_messages (
    id         INT          NOT NULL AUTO_INCREMENT,
    session_id INT          NOT NULL,
    role       VARCHAR(20)  NOT NULL,          -- 'user' | 'assistant'
    content    LONGTEXT     NOT NULL,
    file_url   VARCHAR(500) NULL,              -- path/URL of an uploaded file (if any)
    file_name  VARCHAR(255) NULL,              -- original file name
    file_type  VARCHAR(50)  NULL,              -- 'pdf' | 'image'
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cm_session (session_id),
    CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
