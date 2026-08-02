# Community Hub - Feature Specification & Implementation Checklist

## 1. Overview
The Community Hub replaces the former **Help** module with a unified Q&A and private messaging workspace consisting of:
- **Public Forum**: Open Q&A visible to all users, organized by course/subject, featuring a flat reply structure (1 reply limit per user) and mentor escalation.
- **Direct Requests**: Private 1-on-1 messaging threads supporting **Student → Mentor** and **Mentor → Mentor** communications.

---

## 2. Feature Checklist

### ⚙️ Database & Backend Architecture
- [x] **DB Migration**: Created SQL schema for `request_attachments`, `public_requests`, `public_replies`, `direct_requests`, and `direct_messages`.
- [x] **Flask Blueprint**: Registered `/api/community` routes (`community_bp`) in `learnify-backend`.

### 🌐 Public Forum (`/community` → Public Forum)
- [x] **Question Posting**: Allow any user to post a public question tagged with a `subject_id`.
- [x] **Filtering & Search**:
  - [x] Filter by **My Requests**
  - [x] Filter by **Subject / Category**
  - [x] Filter by **Status (Open / Answered)**
  - [x] Keyword Search across Title & Subject
- [x] **Reply Rules**:
  - [x] Flat list display of answers underneath questions.
  - [x] **Enforce 1 reply per user** per public question (DB `UNIQUE(request_id, author_id)` & API constraint).
  - [x] **Real-Time Live Updates**: Live polling feed updates incoming answers without page reloads.
- [x] **Mentor Escalation ("Continue Privately")**:
  - [x] Show "Continue Privately" button on mentor replies.
  - [x] Auto-create a Direct Request thread linking `origin_public_request_id` & `origin_public_reply_id`.

### ✉️ Direct Requests (`/community` → Direct Requests)
- [x] **Participant Rules**:
  - [x] Student → Mentor: Allowed
  - [x] Mentor → Mentor: Allowed
  - [x] Student → Student: **Blocked / Forbidden** (returns HTTP 403)
- [x] **Role-Based Layout**:
  - [x] Mentor Accounts: **Inbox** / **Sent** toggle (default to Inbox).
  - [x] Student Accounts: Load directly into **Sent** list (hide Inbox toggle).
- [x] **Notification & Unread Badges**:
  - [x] Badge dot/count on Direct Requests tab for unread messages.
  - [x] Badge clears **only when specific conversation is opened** (`read_at` timestamp tracking).
- [x] **Real-Time 1-on-1 Chat**: Live message stream workspace.

### 📎 Multi-File Resource Attachments
- [x] **File Selection**: Multi-file picker accepting images (`.png`, `.jpg`, `.jpeg`) and documents (`.pdf`, `.docx`).
- [x] **File Size Cap**: 10MB per file validation.
- [x] **Preview Chips**: Display file chips (filename + size) with remove (`×`) action before submission.
- [x] **Inline Rendering**: Render attachment chips inline on questions, replies, and direct messages.

### 🎨 Sidebar & Navigation Updates
- [x] **Rename Sidebar Link**: Help → **Community** (`/community`).
- [x] **Persistent Action**: "Ask a Question" button in header routing to unified request form.
- [x] **Summary Strip**: Display stats banner (e.g. *"3 open requests · 12 answered questions"*).
