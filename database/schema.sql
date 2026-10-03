-- ══════════════════════════════════════════════════════════════════════════════
--  Smart Inclusive Ed — Database Schema
--  MySQL 8.0+ / MariaDB 10.6+
--
--  Cara pakai:
--    1. Buka phpMyAdmin atau MySQL CLI
--    2. Jalankan: SOURCE /path/ke/schema.sql;
--       ATAU salin-tempel isi file ini ke query editor phpMyAdmin
-- ══════════════════════════════════════════════════════════════════════════════

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS `smart_inclusive_ed`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smart_inclusive_ed`;

-- ─────────────────────────────────────────────────────────────────────────────
-- Nonaktifkan foreign key check sementara agar DROP tabel aman
-- ─────────────────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `accessibility_preferences`;
DROP TABLE IF EXISTS `module_progress`;
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `assignments`;
DROP TABLE IF EXISTS `modules`;
DROP TABLE IF EXISTS `class_members`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)    NOT NULL,
  `email`         VARCHAR(100)    NOT NULL,
  `password_hash` VARCHAR(255)    NOT NULL,
  `role`          ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SESSIONS (dikelola otomatis oleh express-mysql-session)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `sessions` (
  `session_id`  VARCHAR(128)  CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires`     INT UNSIGNED  NOT NULL,
  `data`        MEDIUMTEXT    CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,

  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CLASSES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `classes` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `teacher_id`  INT UNSIGNED  NOT NULL,
  `name`        VARCHAR(150)  NOT NULL,
  `description` TEXT,
  `class_code`  VARCHAR(20)   NOT NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_classes_code` (`class_code`),
  KEY `idx_classes_teacher` (`teacher_id`),
  CONSTRAINT `fk_classes_teacher`
    FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CLASS_MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `class_members` (
  `class_id`    INT UNSIGNED  NOT NULL,
  `student_id`  INT UNSIGNED  NOT NULL,
  `joined_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`class_id`, `student_id`),
  KEY `idx_class_members_student` (`student_id`),
  CONSTRAINT `fk_cm_class`
    FOREIGN KEY (`class_id`)   REFERENCES `classes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cm_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MODULES (materi pembelajaran)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `modules` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `class_id`     INT UNSIGNED  NOT NULL,
  `title`        VARCHAR(200)  NOT NULL,
  `description`  TEXT,
  `content`      LONGTEXT      NOT NULL,
  `content_type` ENUM('text','video','audio','mixed') NOT NULL DEFAULT 'text',
  `is_published` TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_modules_class`     (`class_id`),
  KEY `idx_modules_published` (`class_id`, `is_published`),
  CONSTRAINT `fk_modules_class`
    FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MODULE_PROGRESS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `module_progress` (
  `module_id`        INT UNSIGNED  NOT NULL,
  `student_id`       INT UNSIGNED  NOT NULL,
  `status`           ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
  `last_accessed_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  `completed_at`     DATETIME      DEFAULT NULL,

  PRIMARY KEY (`module_id`, `student_id`),
  KEY `idx_mp_student` (`student_id`),
  CONSTRAINT `fk_mp_module`
    FOREIGN KEY (`module_id`)  REFERENCES `modules` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mp_student`
    FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ASSIGNMENTS (tugas)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `assignments` (
  `id`           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `class_id`     INT UNSIGNED  NOT NULL,
  `title`        VARCHAR(200)  NOT NULL,
  `instructions` TEXT          NOT NULL,
  `due_at`       DATETIME      DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_assignments_class`  (`class_id`),
  KEY `idx_assignments_due`    (`due_at`),
  CONSTRAINT `fk_assignments_class`
    FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. SUBMISSIONS (pengumpulan tugas)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `submissions` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `assignment_id` INT UNSIGNED    NOT NULL,
  `student_id`    INT UNSIGNED    NOT NULL,
  `answer`        TEXT            NOT NULL,
  `score`         DECIMAL(5,2)    DEFAULT NULL COMMENT '0.00 – 100.00',
  `feedback`      TEXT            DEFAULT NULL,
  `submitted_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submission` (`assignment_id`, `student_id`),
  KEY `idx_submissions_student`    (`student_id`),
  KEY `idx_submissions_ungraded`   (`assignment_id`, `score`),
  CONSTRAINT `fk_sub_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_student`
    FOREIGN KEY (`student_id`)    REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `notifications` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED  NOT NULL,
  `type`       VARCHAR(50)   NOT NULL
               COMMENT 'new_assignment | deadline_reminder | graded | grading_reminder',
  `title`      VARCHAR(200)  NOT NULL,
  `message`    TEXT          NOT NULL,
  `related_id` INT UNSIGNED  DEFAULT NULL COMMENT 'ID tugas atau materi terkait',
  `is_read`    TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_notif_user_unread` (`user_id`, `is_read`),
  KEY `idx_notif_created`     (`created_at`),
  CONSTRAINT `fk_notif_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. ACCESSIBILITY_PREFERENCES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE `accessibility_preferences` (
  `user_id`               INT UNSIGNED    NOT NULL,
  `font_size`             TINYINT UNSIGNED NOT NULL DEFAULT 18
                          COMMENT 'Ukuran font dalam px (14–32)',
  `line_spacing`          DECIMAL(3,1)    NOT NULL DEFAULT 1.8
                          COMMENT 'Jarak baris: 1.5 | 1.8 | 2.2',
  `high_contrast`         TINYINT(1)      NOT NULL DEFAULT 0,
  `dyslexia_friendly_font` TINYINT(1)     NOT NULL DEFAULT 0,
  `text_to_speech`        TINYINT(1)      NOT NULL DEFAULT 0,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_prefs_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════════════════════
--  DATA AWAL — Akun Admin
--  Password: Admin123! (bcrypt hash rounds=12)
--  GANTI HASH INI setelah menjalankan: node createTestUser.js
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `is_active`)
VALUES (
  'Administrator',
  'admin@smartinclusive.test',
  '$2a$12$placeholder_run_createTestUser_to_generate_real_hash',
  'admin',
  1
);

-- ══════════════════════════════════════════════════════════════════════════════
--  SELESAI
-- ══════════════════════════════════════════════════════════════════════════════
SELECT 'Schema smart_inclusive_ed berhasil dibuat.' AS status;
