-- ==============================================================================
-- Mukiria Technical Training Institute (MTTI)
-- Migration 16: Security Hardening & Profile ID Linkage
-- ==============================================================================

-- 1. Add persisted profile_id link to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id);

-- 2. Ensure staff tables have email lookup fields for directory resolution
ALTER TABLE Trainers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE Departments ADD COLUMN IF NOT EXISTS hod_email VARCHAR(255);

-- 3. One-off data normalization: align any historical records where trainee_id
-- was populated with admission number instead of the trainee domain profile ID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainees') THEN
        UPDATE submissions s
        SET trainee_id = t.id
        FROM trainees t
        WHERE s.trainee_id = t.reg_number;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_evidence') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainees') THEN
        UPDATE assessment_evidence e
        SET trainee_id = t.id
        FROM trainees t
        WHERE e.trainee_id = t.reg_number;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_marks') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainees') THEN
        UPDATE assessment_marks m
        SET trainee_id = t.id
        FROM trainees t
        WHERE m.trainee_id = t.reg_number;
    END IF;
END $$;
