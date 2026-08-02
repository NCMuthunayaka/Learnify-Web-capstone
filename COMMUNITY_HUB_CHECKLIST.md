# Community Hub - Feature Specification & Implementation Checklist

## 1. Overview
The Community Hub replaces the former **Help** module with a unified Q&A and private messaging workspace consisting of:
- **Public Forum**: Open Q&A visible to all users, organized by course/subject, featuring a flat reply structure (1 reply limit per user) and mentor escalation.
- **Direct Requests**: Private 1-on-1 messaging threads supporting **Student → Mentor** and **Mentor → Mentor** communications.

---

## 2. Feature Checklist

### ⚙️ Database & Backend Architecture
- [ ] **DB Migration**: Create SQL schema for `request_attachments`, `public_requests`, `public_replies`, `direct_requests`, and `direct_messages`.
- [ ] **Flask Blueprint**: Register `/api/community` routes in `learnify-backend`.

### 🌐 Public Forum (`/community` → Public Forum)
- [ ] **Question Posting**: Allow any user to post a public question tagged with a `subject_id`.
- [ ] **Filtering & Search**:
  - [ ] Filter by **My Requests**
  - [ ] Filter by **Subject / Category**
  - [ ] Filter by **Status (Open / Answered)**
  - [ ] Keyword Search across Title & Subject
- [ ] **Reply Rules**:
  - [ ] Flat list display of answers underneath questions.
  - [ ] **Enforce 1 reply per user** per public question (DB & API constraint).
- [ ] **Mentor Escalation ("Continue Privately")**:
  - [ ] Show "Continue Privately" button on mentor replies.
  - [ ] Auto-create a Direct Request thread linking `origin_public_request_id` & `origin_public_reply_id`.

### ✉️ Direct Requests (`/community` → Direct Requests)
- [ ] **Participant Rules**:
  - [ ] Student → Mentor: Allowed
  - [ ] Mentor → Mentor: Allowed
  - [ ] Student → Student: **Blocked / Forbidden**
- [ ] **Role-Based Layout**:
  - [ ] Mentor Accounts: **Inbox** / **Sent** toggle (default to Inbox).
  - [ ] Student Accounts: Load directly into **Sent** list (hide Inbox toggle).
- [ ] **Notification & Unread Badges**:
  - [ ] Badge dot/count on Direct Requests tab for unread messages.
  - [ ] Badge clears **only when specific conversation is opened**.

### 📎 Multi-File Resource Attachments
- [ ] **File Selection**: Multi-file picker accepting images (`.png`, `.jpg`, `.jpeg`) and documents (`.pdf`, `.docx`).
- [ ] **File Size Cap**: 10MB per file validation.
- [ ] **Preview Chips**: Display file chips (filename + size) with remove (`×`) action before submission.
- [ ] **Inline Rendering**: Render attachment chips inline on questions, replies, and direct messages.

### 🎨 Sidebar & Navigation Updates
- [ ] **Rename Sidebar Link**: Help → **Community** (`/community`).
- [ ] **Persistent Action**: "Ask a Question" button in header routing to unified request form.
- [ ] **Summary Strip**: Display stats banner (e.g. *"3 open requests · 12 answered this week"*).
