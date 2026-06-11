CREATE DATABASE IF NOT EXISTS learnify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learnify;

SET FOREIGN_KEY_CHECKS = 0;


-- user role definitions
CREATE TABLE roles (
    id   TINYINT      NOT NULL AUTO_INCREMENT,
    name VARCHAR(50)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE = InnoDB;


-- course subjects available on the platform
CREATE TABLE subjects (
    id        INT         NOT NULL AUTO_INCREMENT,
    name      VARCHAR(100) NOT NULL,
    color_hex CHAR(7)      NOT NULL DEFAULT '#4A90D9',
    icon      VARCHAR(100) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_subjects_name (name)
) ENGINE = InnoDB;


-- allowed file types for uploaded resources
CREATE TABLE file_types (
    id   TINYINT     NOT NULL AUTO_INCREMENT,
    name VARCHAR(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_file_types_name (name)
) ENGINE = InnoDB;


-- types that can trigger an achievement badge
CREATE TABLE achievement_trigger_types (
    id   TINYINT     NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_att_name (name)
) ENGINE = InnoDB;


-- categories of notifications (deadline, reminder, etc.)
CREATE TABLE notification_types (
    id   TINYINT     NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_nt_name (name)
) ENGINE = InnoDB;


-- lookup table for Mon–Sun
CREATE TABLE days_of_week (
    id   TINYINT     NOT NULL,
    name VARCHAR(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dow_name (name)
) ENGINE = InnoDB;


-- all platform users (students, mentors, admins)
CREATE TABLE users (
    id            INT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('student', 'mentor', 'admin') NOT NULL DEFAULT 'student',
    status        ENUM('active', 'pending', 'inactive') NOT NULL DEFAULT 'pending',
    avatar_url    VARCHAR(500) NULL,
    phone         VARCHAR(20) NULL,
    bio           TEXT NULL,
    student_id    VARCHAR(50) NULL,
    university    VARCHAR(200) NULL,
    faculty       VARCHAR(200) NULL,
    year          VARCHAR(20) NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role   (role),
    INDEX idx_users_status (status)
) ENGINE = InnoDB;


-- extra info for students (streak, points, goals)
CREATE TABLE student_profiles (
    id                       INT          NOT NULL AUTO_INCREMENT,
    user_id                  INT          NOT NULL,
    available_hours_per_week INT          NOT NULL DEFAULT 0,
    study_streak_days        INT          NOT NULL DEFAULT 0,
    total_points             INT          NOT NULL DEFAULT 0,
    semester_goal_pct        DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sp_user (user_id),
    CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- subjects a student is enrolled in
CREATE TABLE student_subjects (
    id         INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_subject (student_id, subject_id),
    CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)         ON DELETE CASCADE
) ENGINE = InnoDB;


-- extra info for mentors (bio, rating, settings)
CREATE TABLE mentor_profiles (
    id                    INT          NOT NULL AUTO_INCREMENT,
    user_id               INT          NOT NULL,
    title                 VARCHAR(100) NULL,
    institution           VARCHAR(200) NULL,
    years_experience      INT          NOT NULL DEFAULT 0,
    rating                DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_students_helped INT          NOT NULL DEFAULT 0,
    avg_response_time_min INT          NOT NULL DEFAULT 0,
    accept_urgent         TINYINT(1)   NOT NULL DEFAULT 1,
    email_notifications   TINYINT(1)   NOT NULL DEFAULT 1,
    auto_accept_returning TINYINT(1)   NOT NULL DEFAULT 0,
    bio                   TEXT         NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mp_user (user_id),
    CONSTRAINT fk_mp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- subject tags listed on a mentor's profile
CREATE TABLE mentor_expertise_tags (
    id        INT          NOT NULL AUTO_INCREMENT,
    mentor_id INT          NOT NULL,
    tag       VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_met_mentor (mentor_id),
    CONSTRAINT fk_met_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- time slots when a mentor is available each week
CREATE TABLE mentor_availability (
    id                 INT     NOT NULL AUTO_INCREMENT,
    mentor_id          INT     NOT NULL,
    day_id             TINYINT NOT NULL,
    from_time          TIME    NOT NULL,
    until_time         TIME    NOT NULL,
    max_daily_requests INT     NOT NULL DEFAULT 5,
    PRIMARY KEY (id),
    INDEX idx_ma_mentor (mentor_id),
    CONSTRAINT fk_ma_mentor FOREIGN KEY (mentor_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ma_day    FOREIGN KEY (day_id)    REFERENCES days_of_week(id)
) ENGINE = InnoDB;


-- admin review queue for new mentor applications
CREATE TABLE mentor_approvals (
    id           INT      NOT NULL AUTO_INCREMENT,
    applicant_id INT      NOT NULL,
    reviewed_by  INT      NULL,
    status       ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    review_notes TEXT     NULL,
    applied_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at  DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mapp_applicant (applicant_id),
    INDEX idx_mapp_status (status),
    CONSTRAINT fk_mapp_applicant FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mapp_reviewed  FOREIGN KEY (reviewed_by)  REFERENCES users(id) ON DELETE SET NULL
) ENGINE = InnoDB;


-- peer study groups created by users
CREATE TABLE study_groups (
    id          INT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150) NOT NULL,
    description TEXT         NULL,
    created_by  INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sg_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE = InnoDB;


-- members who belong to a study group
CREATE TABLE study_group_members (
    id        INT      NOT NULL AUTO_INCREMENT,
    group_id  INT      NOT NULL,
    user_id   INT      NOT NULL,
    role      ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_group_member (group_id, user_id),
    CONSTRAINT fk_sgm_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_sgm_user  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE
) ENGINE = InnoDB;


-- individual study blocks logged by a student
CREATE TABLE study_sessions (
    id           INT        NOT NULL AUTO_INCREMENT,
    student_id   INT        NOT NULL,
    subject_id   INT        NOT NULL,
    start_time   DATETIME   NOT NULL,
    end_time     DATETIME   NOT NULL,
    duration_min INT        NOT NULL DEFAULT 0,
    session_type ENUM('study', 'exam_prep', 'break') NOT NULL DEFAULT 'study',
    ai_suggested TINYINT(1) NOT NULL DEFAULT 0,
    completed    TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_session_student (student_id),
    INDEX idx_session_subject (subject_id),
    INDEX idx_session_start   (start_time),
    CONSTRAINT fk_sess_student FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_sess_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- ai-generated weekly timetable for a student
CREATE TABLE schedule_plans (
    id           INT          NOT NULL AUTO_INCREMENT,
    student_id   INT          NOT NULL,
    week_start   DATE         NOT NULL,
    label        VARCHAR(200) NULL,
    is_accepted  TINYINT(1)   NOT NULL DEFAULT 0,
    generated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_plan_student (student_id),
    CONSTRAINT fk_plan_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- links a schedule plan to its study sessions
CREATE TABLE schedule_plan_sessions (
    id         INT NOT NULL AUTO_INCREMENT,
    plan_id    INT NOT NULL,
    session_id INT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plan_session (plan_id, session_id),
    CONSTRAINT fk_sps_plan    FOREIGN KEY (plan_id)    REFERENCES schedule_plans(id)  ON DELETE CASCADE,
    CONSTRAINT fk_sps_session FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- assignments, exams and projects due for a student
CREATE TABLE tasks (
    id             INT          NOT NULL AUTO_INCREMENT,
    student_id     INT          NOT NULL,
    subject_id     INT          NOT NULL,
    title          VARCHAR(255) NOT NULL,
    type           ENUM('assignment', 'exam', 'project', 'lab_report') NOT NULL DEFAULT 'assignment',
    due_date       DATE         NOT NULL,
    status         ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo',
    completion_pct INT          NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_task_student (student_id),
    INDEX idx_task_due     (due_date),
    CONSTRAINT fk_task_student FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_task_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
) ENGINE = InnoDB;


-- help tickets raised by students to mentors or peers
CREATE TABLE help_requests (
    id             INT          NOT NULL AUTO_INCREMENT,
    student_id     INT          NOT NULL,
    subject_id     INT          NOT NULL,
    assigned_to    INT          NULL,
    request_type   ENUM('mentor', 'peer') NOT NULL DEFAULT 'mentor',
    topic_title    VARCHAR(255) NOT NULL,
    description    TEXT         NOT NULL,
    priority       ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status         ENUM('pending', 'accepted', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
    attachment_url VARCHAR(500) NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at    DATETIME     NULL,
    PRIMARY KEY (id),
    INDEX idx_hr_student     (student_id),
    INDEX idx_hr_assigned_to (assigned_to),
    INDEX idx_hr_status      (status),
    CONSTRAINT fk_hr_student     FOREIGN KEY (student_id)  REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_hr_subject     FOREIGN KEY (subject_id)  REFERENCES subjects(id),
    CONSTRAINT fk_hr_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE = InnoDB;


-- replies posted on a help request
CREATE TABLE help_responses (
    id             INT          NOT NULL AUTO_INCREMENT,
    request_id     INT          NOT NULL,
    responder_id   INT          NOT NULL,
    content        TEXT         NOT NULL,
    attachment_url VARCHAR(500) NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_hresp_request (request_id),
    CONSTRAINT fk_hresp_request   FOREIGN KEY (request_id)   REFERENCES help_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_hresp_responder FOREIGN KEY (responder_id) REFERENCES users(id)
) ENGINE = InnoDB;


-- star rating left by a student after a help session
CREATE TABLE mentor_reviews (
    id         INT      NOT NULL AUTO_INCREMENT,
    request_id INT      NOT NULL,
    student_id INT      NOT NULL,
    mentor_id  INT      NOT NULL,
    rating     TINYINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT     NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mr_request (request_id),
    CONSTRAINT fk_mr_request FOREIGN KEY (request_id) REFERENCES help_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_mr_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_mr_mentor  FOREIGN KEY (mentor_id)  REFERENCES users(id)
) ENGINE = InnoDB;


-- study materials uploaded by mentors
CREATE TABLE resources (
    id             INT          NOT NULL AUTO_INCREMENT,
    uploader_id    INT          NOT NULL,
    subject_id     INT          NOT NULL,
    file_type_id   TINYINT      NOT NULL,
    title          VARCHAR(255) NOT NULL,
    file_url       VARCHAR(500) NOT NULL,
    file_size_mb   DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    duration_sec   INT          NULL,
    status         ENUM('draft', 'pending_review', 'published', 'hidden') NOT NULL DEFAULT 'draft',
    view_count     INT          NOT NULL DEFAULT 0,
    download_count INT          NOT NULL DEFAULT 0,
    uploaded_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at   DATETIME     NULL,
    PRIMARY KEY (id),
    INDEX idx_res_uploader  (uploader_id),
    INDEX idx_res_subject   (subject_id),
    INDEX idx_res_status    (status),
    CONSTRAINT fk_res_uploader  FOREIGN KEY (uploader_id)  REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_res_subject   FOREIGN KEY (subject_id)   REFERENCES subjects(id),
    CONSTRAINT fk_res_file_type FOREIGN KEY (file_type_id) REFERENCES file_types(id)
) ENGINE = InnoDB;


-- tracks every view or download of a resource
CREATE TABLE resource_engagement (
    id          INT      NOT NULL AUTO_INCREMENT,
    resource_id INT      NOT NULL,
    user_id     INT      NOT NULL,
    action      ENUM('view', 'download') NOT NULL,
    acted_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_re_resource (resource_id),
    INDEX idx_re_user     (user_id),
    CONSTRAINT fk_re_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_re_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
) ENGINE = InnoDB;


-- in-app alerts sent to a user
CREATE TABLE notifications (
    id         INT          NOT NULL AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    type_id    TINYINT      NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT         NOT NULL,
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    action_url VARCHAR(500) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_user    (user_id),
    INDEX idx_notif_is_read (is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)  REFERENCES users(id)             ON DELETE CASCADE,
    CONSTRAINT fk_notif_type FOREIGN KEY (type_id)  REFERENCES notification_types(id)
) ENGINE = InnoDB;


-- per-user toggle settings for each notification channel
CREATE TABLE notification_preferences (
    id                  INT        NOT NULL AUTO_INCREMENT,
    user_id             INT        NOT NULL,
    deadline_alerts     TINYINT(1) NOT NULL DEFAULT 1,
    mentor_replies      TINYINT(1) NOT NULL DEFAULT 1,
    new_resources       TINYINT(1) NOT NULL DEFAULT 1,
    email_notifications TINYINT(1) NOT NULL DEFAULT 1,
    browser_push        TINYINT(1) NOT NULL DEFAULT 0,
    daily_digest        TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_np_user (user_id),
    CONSTRAINT fk_np_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- daily snapshot of a student's progress per subject
CREATE TABLE progress_snapshots (
    id             INT          NOT NULL AUTO_INCREMENT,
    student_id     INT          NOT NULL,
    subject_id     INT          NOT NULL,
    snapshot_date  DATE         NOT NULL,
    completion_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    study_hours    DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    avg_score      DECIMAL(5,2) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_snapshot (student_id, subject_id, snapshot_date),
    INDEX idx_snap_student (student_id),
    CONSTRAINT fk_snap_student FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_snap_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- student rankings and points for a given period
CREATE TABLE leaderboard_entries (
    id            INT  NOT NULL AUTO_INCREMENT,
    student_id    INT  NOT NULL,
    points        INT  NOT NULL DEFAULT 0,
    rank_position INT  NOT NULL DEFAULT 0,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_lb_student (student_id),
    INDEX idx_lb_period  (period_start, period_end),
    CONSTRAINT fk_lb_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- badge definitions with unlock conditions
CREATE TABLE achievements (
    id              INT          NOT NULL AUTO_INCREMENT,
    trigger_type_id TINYINT      NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT         NOT NULL,
    icon            VARCHAR(100) NULL,
    threshold       INT          NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_achievements_name (name),
    CONSTRAINT fk_ach_trigger FOREIGN KEY (trigger_type_id) REFERENCES achievement_trigger_types(id)
) ENGINE = InnoDB;


-- badges that a user has earned
CREATE TABLE user_achievements (
    id             INT      NOT NULL AUTO_INCREMENT,
    user_id        INT      NOT NULL,
    achievement_id INT      NOT NULL,
    earned_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_achievement (user_id, achievement_id),
    CONSTRAINT fk_ua_user        FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- ai assistant conversation started by a user
CREATE TABLE ai_chat_sessions (
    id            INT      NOT NULL AUTO_INCREMENT,
    user_id       INT      NOT NULL,
    started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at      DATETIME NULL,
    message_count INT      NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_acs_user (user_id),
    CONSTRAINT fk_acs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- individual messages inside an ai chat session
CREATE TABLE ai_chat_messages (
    id         INT      NOT NULL AUTO_INCREMENT,
    session_id INT      NOT NULL,
    sender     ENUM('user', 'ai') NOT NULL,
    content    TEXT     NOT NULL,
    sent_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_acm_session (session_id),
    CONSTRAINT fk_acm_session FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
) ENGINE = InnoDB;


-- log of every action performed by an admin
CREATE TABLE admin_audit_logs (
    id            INT          NOT NULL AUTO_INCREMENT,
    admin_id      INT          NOT NULL,
    action        VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id     INT          NULL,
    metadata      JSON         NULL,
    performed_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_aal_admin  (admin_id),
    INDEX idx_aal_entity (target_entity),
    CONSTRAINT fk_aal_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE = InnoDB;

SET FOREIGN_KEY_CHECKS = 1;


INSERT INTO days_of_week (id, name) VALUES
(1, 'Mon'), (2, 'Tue'), (3, 'Wed'),
(4, 'Thu'), (5, 'Fri'), (6, 'Sat'), (7, 'Sun');

INSERT INTO roles (name) VALUES
('student'), ('mentor'), ('admin');

INSERT INTO file_types (name) VALUES
('pdf'), ('docx'), ('pptx'), ('mp4');

INSERT INTO notification_types (name) VALUES
('deadline'), ('mentor_reply'), ('resource'),
('achievement'), ('reminder'), ('system'),
('group_invite'), ('result');

INSERT INTO achievement_trigger_types (name) VALUES
('streak'), ('tasks'), ('requests'), ('score');

INSERT INTO subjects (name, color_hex, icon) VALUES
('Mathematics',          '#4A90D9', 'calculator'),
('Physics',              '#E07C3A', 'atom'),
('Chemistry',            '#2A9D8F', 'flask'),
('Biology',              '#27AE60', 'leaf'),
('Data Structures',      '#7C5CBF', 'binary-tree'),
('Calculus III',         '#4A90D9', 'function'),
('Database Systems',     '#E07C3A', 'database'),
('Software Engineering', '#2A9D8F', 'gear'),
('Computer Networks',    '#7C5CBF', 'network'),
('Operating Systems',    '#888888', 'cpu');

INSERT INTO achievements (trigger_type_id, name, description, threshold) VALUES
(2, 'Consistent Learner',  'Complete 7 assignments in a week without missing deadlines', 7),
(1, 'Study Streak 14',     'Maintain a 14-day study streak', 14),
(1, 'Study Streak 30',     'Maintain a 30-day study streak', 30),
(3, 'Help Seeker',         'Submit your first help request', 1),
(4, 'Outstanding Student', 'Score above 90% on 5 consecutive tasks', 5),
(3, 'Community Helper',    'Respond to 10 peer help requests', 10);
