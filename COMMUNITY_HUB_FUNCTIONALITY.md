# Community Hub - Complete Functionality & System Specification

## 1. Executive Summary
The **Community Hub** replaces the former Help module on WhisperHive. It provides a dual-tiered academic assistance ecosystem:
1. **Public Forum**: An open, subject-categorized Q&A platform for public discussions, flat answer lists, mentor escalation, and real-time live reply updates.
2. **Direct Requests**: A private 1-on-1 communication channel connecting students to mentors, and mentors to fellow mentors, with strict role-based participant rules, real-time message delivery, and conversation read tracking.

---

## 2. System Architecture & Navigation Structure

### 2.1 Navigation Hierarchy
```
Sidebar: Community (Renamed from "Help" -> /community)
 ├── Landing View (Top Tabs: [ Public Forum ] | [ Direct Requests ])
 ├── Header Action: "Ask a Question" (Routes to unified creation form)
 └── Summary Strip: Live metrics (e.g. "3 open requests · 12 answered this week")
```

### 2.2 Role-Based Workspace Routing
- **Student Accounts**:
  - Direct Requests section opens directly into **Sent** requests (Inbox tab is hidden).
  - Can initiate Direct Requests with **Mentors** only.
- **Mentor Accounts**:
  - Direct Requests section displays **Inbox / Sent** toggle (defaults to Inbox).
  - Can initiate Direct Requests with **Mentors**.

---

## 3. Real-Time Live Update Engine

### 3.1 Live Delivery Scope
- **Public Forum Q&A**: Active public questions feature real-time live updates (via live polling or event stream) so newly posted answers and status changes appear live on visitors' screens.
- **Direct Requests Chat**: 1-on-1 messaging threads deliver messages instantly in real time and track `read_at` receipt indicators when opened by the recipient.

---

## 4. Multi-Resource Attachment Engine

### 4.1 Upload & Validation Rules
- **Supported Formats**: Images (`.png`, `.jpg`, `.jpeg`) and Documents (`.pdf`, `.docx`).
- **File Size Limit**: Recommended 10MB per file size cap.
- **Multi-File Selection**: Users can attach multiple files per request or reply.
- **Pre-Submit Preview**: Display interactive file chips showing `Filename`, `File Size`, and an `(×)` Remove button before submitting.

### 4.2 Database Schema: `request_attachments`
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique attachment ID |
| `request_id` | `INT` | `NOT NULL` | FK to `public_requests` or `direct_requests` |
| `request_type` | `VARCHAR(20)` | `NOT NULL` | `'public'` or `'direct'` |
| `file_url` | `VARCHAR(255)` | `NOT NULL` | Upload path on storage backend |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | Original filename |
| `file_size` | `INT` | `NOT NULL` | Size in bytes |
| `uploaded_by` | `INT` | `FK to users.id` | User ID of uploader |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Upload timestamp |

---

## 5. Public Forum (Open Q&A)

### 5.1 Question Creation & Categorization
- Every public question must be assigned a **Subject / Category** (`subject_id`) selected from WhisperHive's master `subjects` table.
- Questions include title, detailed problem description, priority level, and optional resource attachments.

### 5.2 Reply Rules & Flat Thread Model
- **Flat Answer Model**: All replies display directly under the main question as a single flat list.
- **One Reply Per User Restriction**: Each user is allowed **exactly one reply per question**. Once a user posts an answer, the reply button is disabled for them on that question.
- **Database Constraint**: `UNIQUE (request_id, author_id)` on `public_replies` table.
- **No Follow-up Chat**: Public answers cannot have nested sub-comments or threaded chat replies.
- **Real-Time Feed Updates**: Incoming public answers update live on active question views.

### 5.3 Escalate to Direct Message ("Continue Privately")
- If a replier is a **Mentor**, their answer card includes a **"Continue Privately"** button for the student requester.
- Clicking **"Continue Privately"** auto-creates or opens a `direct_requests` thread between the student and that mentor, populating `origin_public_request_id` & `origin_public_reply_id` so the mentor has full problem context.
- **Student (Peer) Replies**: Do not display this button (no peer-to-peer escalation).

### 5.4 Filtering & Search Capabilities
- **My Requests Filter**: Shows only public questions posted by the current user.
- **Subject Filter**: Filter feed by specific academic subjects (e.g. Mathematics, Physics, Chemistry).
- **Status Filter**: `Open` (0 replies) vs `Answered` (≥1 reply).
- **Keyword Search**: Instant search bar querying across subject names and question titles.

### 5.5 Database Schemas: `public_requests` & `public_replies`
```sql
CREATE TABLE public_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    subject_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'answered') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE public_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    author_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES public_requests(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT unique_user_reply_per_request UNIQUE (request_id, author_id)
);
```

---

## 6. Direct Requests (Private 1-on-1 Threads)

### 6.1 Participant Permission Rules
- **Student → Mentor**: ✅ Allowed (Students can message any mentor).
- **Mentor → Mentor**: ✅ Allowed (Mentors can message fellow mentors).
- **Student → Student**: ❌ **Forbidden** (Direct student-to-student private messaging is disabled).

### 6.2 Notification & Unread Tracking
- **Nav Item Badge**: Unread messages render a small notification count/dot badge on the **Direct Requests** navigation tab.
- **Clearing Logic**: The badge for a specific conversation **clears only when that individual conversation thread is opened**. Viewing the conversation list without opening the thread will NOT clear the unread badge.
- **Real-Time Chat & Read Receipts**: Live message stream with `read_at` status updating when opened.

### 6.3 Database Schemas: `direct_requests` & `direct_messages`
```sql
CREATE TABLE direct_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    initial_message TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
    origin_public_request_id INT NULL,
    origin_public_reply_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (origin_public_request_id) REFERENCES public_requests(id),
    FOREIGN KEY (origin_public_reply_id) REFERENCES public_replies(id)
);

CREATE TABLE direct_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    sender_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (request_id) REFERENCES direct_requests(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

---

## 7. Backend Technical Stack Alignment

- **Framework**: Flask (`app/routes/community.py` with `community_bp` Blueprint).
- **ORM / Queries**: SQLAlchemy ORM & parameterized raw SQL.
- **Authentication**: JWT token headers via `flask_jwt_extended` (`@jwt_required()`).
