-- ==============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 17b: Safe Guarded Staff Directory & Department Backfill
-- Context: Phase 1 Review Requirement 4 (Guarded Joins & Zero 403 Lockout)
-- ==============================================================================

BEGIN;

-- 1. Populate Trainers.email from matching staff users (Guarded with DISTINCT ON by name)
UPDATE Trainers t
SET email = sub.email
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(name))) LOWER(TRIM(name)) AS norm_name, email
  FROM users
  WHERE UPPER(role) IN ('TRAINER', 'HOD') AND email IS NOT NULL
  ORDER BY LOWER(TRIM(name)), created_at ASC
) sub
WHERE (t.email IS NULL OR TRIM(t.email) = '')
  AND LOWER(TRIM(t.name)) = sub.norm_name;

-- 2. Populate Departments.hod_email from Trainers (Guarded with DISTINCT ON by dept id)
UPDATE Departments d
SET hod_email = sub.email
FROM (
  SELECT DISTINCT ON (d2.id) d2.id, t.email
  FROM Departments d2
  JOIN Trainers t ON d2.hod_id = t.id
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY d2.id, t.id ASC
) sub
WHERE d.id = sub.id
  AND (d.hod_email IS NULL OR TRIM(d.hod_email) = '');

-- 3. Populate users.department_id for HODs (Guarded against duplicate department hod_email)
UPDATE users u
SET department_id = sub.dept_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(d.hod_email))) LOWER(TRIM(d.hod_email)) AS norm_hod_email, d.id AS dept_id
  FROM Departments d
  WHERE d.hod_email IS NOT NULL AND TRIM(d.hod_email) <> ''
  ORDER BY LOWER(TRIM(d.hod_email)), d.id ASC
) sub
WHERE UPPER(u.role) = 'HOD'
  AND LOWER(TRIM(u.email)) = sub.norm_hod_email
  AND u.department_id IS NULL;

-- 4. Populate users.department_id for Trainers (Guarded against duplicate department names)
UPDATE users u
SET department_id = sub.dept_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(t.email))) LOWER(TRIM(t.email)) AS norm_trainer_email, d.id AS dept_id
  FROM Trainers t
  JOIN (
    SELECT DISTINCT ON (LOWER(TRIM(name))) LOWER(TRIM(name)) AS norm_dept_name, id
    FROM Departments
    ORDER BY LOWER(TRIM(name)), id ASC
  ) d ON LOWER(TRIM(t.department)) = d.norm_dept_name
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY LOWER(TRIM(t.email)), d.id ASC
) sub
WHERE UPPER(u.role) = 'TRAINER'
  AND LOWER(TRIM(u.email)) = sub.norm_trainer_email
  AND u.department_id IS NULL;

-- 5. Populate users.profile_id for Trainers & HODs (Guarded by trainer email)
UPDATE users u
SET profile_id = sub.trainer_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(t.email))) LOWER(TRIM(t.email)) AS norm_trainer_email, t.id AS trainer_id
  FROM Trainers t
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY LOWER(TRIM(t.email)), t.id ASC
) sub
WHERE UPPER(u.role) IN ('TRAINER', 'HOD')
  AND LOWER(TRIM(u.email)) = sub.norm_trainer_email
  AND u.profile_id IS NULL;

COMMIT;
