-- Migration 13: Reconcile Schema Divergence & Add Missing Tables for Full Persistence
-- Mukiria Technical Training Institute (MTTI)

BEGIN;

-- 1. Ensure Assessment Marks Table with strict composite constraints
CREATE TABLE IF NOT EXISTS assessment_marks (
    id VARCHAR(100) PRIMARY KEY,
    unit_offering_id VARCHAR(100) NOT NULL,
    trainee_id VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'continuous',
    ct_avg NUMERIC(5, 2) DEFAULT 0,
    cp_avg NUMERIC(5, 2) DEFAULT 0,
    cp_scores JSONB DEFAULT '[]'::jsonb,
    ct_scores JSONB DEFAULT '[]'::jsonb,
    project_score NUMERIC(5, 2) DEFAULT 0,
    weighted_mark NUMERIC(5, 2) DEFAULT 0,
    score NUMERIC(5, 2) DEFAULT 0,
    max_score NUMERIC(5, 2) DEFAULT 100,
    weighting NUMERIC(5, 2) DEFAULT 100,
    competence_achieved BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    assessed_by VARCHAR(100),
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trainee_assessment UNIQUE (unit_offering_id, trainee_id)
);

-- Indices for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_assessment_marks_unit ON assessment_marks (unit_offering_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_trainee ON assessment_marks (trainee_id);

-- 2. Ensure Exam Submissions Table
CREATE TABLE IF NOT EXISTS exam_submissions (
    id VARCHAR(100) PRIMARY KEY,
    exam_id VARCHAR(100) NOT NULL,
    trainee_id VARCHAR(100) NOT NULL,
    student_name VARCHAR(255),
    trainee_admission VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- 'draft', 'submitted', 'graded'
    total_score NUMERIC(5, 2) DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0,
    section_a JSONB NOT NULL DEFAULT '[]'::jsonb,
    section_b JSONB NOT NULL DEFAULT '[]'::jsonb,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback TEXT,
    graded_by VARCHAR(100),
    graded_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_submission UNIQUE (exam_id, trainee_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON exam_submissions (exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_trainee ON exam_submissions (trainee_id);

-- 3. Ensure Assessment Evidence Table
CREATE TABLE IF NOT EXISTS assessment_evidence (
    id VARCHAR(100) PRIMARY KEY,
    unit_offering_id VARCHAR(100) NOT NULL,
    trainee_id VARCHAR(100) NOT NULL,
    trainee_name VARCHAR(255),
    outcome_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_data TEXT,
    mark NUMERIC(5, 2),
    assessor_feedback TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'graded', 'verified'
    uploaded_by VARCHAR(100),
    graded_by VARCHAR(100),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_unit_trainee ON assessment_evidence (unit_offering_id, trainee_id);

-- 4. Add Missing Performance Indices on existing high-frequency query paths
CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON attendance_records (trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records (session_date);
CREATE INDEX IF NOT EXISTS idx_session_plans_class_date ON session_plans (class_code, date);
CREATE INDEX IF NOT EXISTS idx_learning_plans_class_unit ON learning_plans (class_code, unit_code);

COMMIT;
