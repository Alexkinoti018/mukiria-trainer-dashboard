-- ==============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 17: Phase 1 Profile ID Linkage
-- File: database/migrations/17_phase1_profile_link.sql
-- ==============================================================================

-- 1. Add persisted profile_id link to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id);

-- Phase 1 Partial Unique Index: Ensures a domain profile cannot be claimed by multiple user accounts
-- Deduplication Guidance (Run before applying the unique index if existing duplicate links exist):
-- 1. Identify duplicates:
--    SELECT profile_id, COUNT(*) FROM users WHERE profile_id IS NOT NULL GROUP BY profile_id HAVING COUNT(*) > 1;
-- 2. Clean up duplicates, retaining the earliest created user:
--    UPDATE users SET profile_id = NULL WHERE id NOT IN (
--      SELECT DISTINCT ON (profile_id) id FROM users WHERE profile_id IS NOT NULL ORDER BY profile_id, created_at ASC
--    ) AND profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_profile_id
ON users(profile_id)
WHERE profile_id IS NOT NULL;

-- 2. Ensure staff tables have email lookup fields for directory resolution
ALTER TABLE Trainers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE Trainers ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE Departments ADD COLUMN IF NOT EXISTS hod_email VARCHAR(255);

-- Preserve department scope for existing staff using their authoritative directory links.
UPDATE Departments d
SET hod_email = t.email
FROM Trainers t
WHERE d.hod_id = t.id
  AND d.hod_email IS NULL;

UPDATE users u
SET department_id = d.id::text
FROM Departments d
WHERE UPPER(u.role) = 'HOD'
  AND LOWER(u.email) = LOWER(d.hod_email)
  AND u.department_id IS NULL;

UPDATE users u
SET department_id = d.id::text
FROM Trainers t
JOIN Departments d ON LOWER(d.name) = LOWER(t.department)
WHERE UPPER(u.role) = 'TRAINER'
  AND LOWER(u.email) = LOWER(t.email)
  AND u.department_id IS NULL;
