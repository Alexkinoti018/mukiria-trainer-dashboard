-- Migration 14: Persistence & Data Safety Hardening
-- Mukiria Technical Training Institute (MTTI)
-- Non-destructive, idempotent performance and integrity hardening

BEGIN;

-- 1. Ensure composite lookup index for attendance roll calls
CREATE INDEX IF NOT EXISTS idx_attendance_composite_lookup 
    ON attendance_records (unit_offering_id, trainee_id, week_number);

-- 2. Ensure indexes on trainee admission and registration numbers for sub-millisecond lookups
CREATE INDEX IF NOT EXISTS idx_trainees_adm_no 
    ON trainees (adm_no);

CREATE INDEX IF NOT EXISTS idx_trainees_reg_number 
    ON trainees (reg_number);

-- 3. Ensure index on exam submissions by candidate admission number
CREATE INDEX IF NOT EXISTS idx_exam_submissions_admission 
    ON exam_submissions (trainee_admission);

-- 4. Ensure index on class registers by department
CREATE INDEX IF NOT EXISTS idx_class_registers_dept 
    ON class_registers (department);

-- 5. Ensure index on assessment marks by composite status and lock
CREATE INDEX IF NOT EXISTS idx_assessment_marks_locked 
    ON assessment_marks (unit_offering_id, is_locked);

COMMIT;
