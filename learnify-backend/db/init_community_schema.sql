-- ─────────────────────────────────────────────────────────────
-- Community Hub Database Schema Migration
-- Module: Public Forum, Direct Requests, Attachments & Messaging
-- ─────────────────────────────────────────────────────────────

-- 1. Public Forum Requests
CREATE TABLE IF NOT EXISTS public_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'answered') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 2. Public Forum Replies (Flat thread, max 1 reply per user per request)
CREATE TABLE IF NOT EXISTS public_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    author_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES public_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_reply_per_request UNIQUE (request_id, author_id)
);

-- 3. Direct Requests (1-on-1 private messaging threads)
CREATE TABLE IF NOT EXISTS direct_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    initial_message TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
    origin_public_request_id INT NULL,
    origin_public_reply_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (origin_public_request_id) REFERENCES public_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (origin_public_reply_id) REFERENCES public_replies(id) ON DELETE SET NULL
);

-- 4. Direct Messages (1-on-1 chat history inside a direct request)
CREATE TABLE IF NOT EXISTS direct_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    sender_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (request_id) REFERENCES direct_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Polymorphic Attachments (Public & Direct attachment files)
CREATE TABLE IF NOT EXISTS request_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    request_type ENUM('public', 'direct') NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);
