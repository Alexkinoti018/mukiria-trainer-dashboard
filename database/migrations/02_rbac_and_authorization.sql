-- =============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Multi-Tenant Role-Based Access Control (RBAC) & Object Authorization (RLS)
-- File: database/migrations/02_rbac_and_authorization.sql
-- =============================================================================

-- ─── 1. Departments & Course Enhancements ─────────────────────────────────────
ALTER TABLE IF EXISTS Units_of_Competence 
ADD COLUMN IF NOT EXISTS department_id UUID;

ALTER TABLE IF EXISTS Trainees 
ADD COLUMN IF NOT EXISTS reg_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS adm_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS class_id UUID;

CREATE TABLE IF NOT EXISTS Departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    hod_id UUID REFERENCES Trainers(id) ON DELETE SET NULL
);

-- Core Examination Tables (Self-Contained DDL)
CREATE TABLE IF NOT EXISTS Exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES Units_of_Competence(id) ON DELETE CASCADE,
    unit_code VARCHAR(100),
    course_name VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantee columns exist if Exams table was created previously with different schema
ALTER TABLE IF EXISTS Exams 
ADD COLUMN IF NOT EXISTS unit_id UUID,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS unit_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS Submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES Exams(id) ON DELETE CASCADE,
    unit_code VARCHAR(100),
    trainee_id UUID REFERENCES Trainees(id) ON DELETE CASCADE,
    reg_number VARCHAR(100),
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_progress',
    total_score NUMERIC(5,2),
    section_a JSONB DEFAULT '[]'::jsonb,
    section_b JSONB DEFAULT '[]'::jsonb,
    trainer_comments TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantee columns exist if Submissions table was created previously with different schema
ALTER TABLE IF EXISTS Submissions 
ADD COLUMN IF NOT EXISTS exam_id UUID,
ADD COLUMN IF NOT EXISTS unit_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS trainee_id UUID,
ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS student_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS student_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS section_a JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS section_b JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trainer_comments TEXT,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_submissions_id_status ON Submissions(id, status);

-- ─── 2. Create Sanitized View for Student Exam Queries (Column Shielding) ─────
DROP VIEW IF EXISTS trainee_exam_view CASCADE;

-- Strips correct_answer, rubric, and critical_aspect from questions JSON array
CREATE OR REPLACE VIEW trainee_exam_view AS
SELECT 
    e.id, 
    e.unit_id,
    COALESCE(e.unit_code, e.payload->>'unit_code', '') AS unit_code,
    COALESCE(e.title, e.course_name, e.payload->>'title', e.payload->>'course_name', 'Assessment') AS title,
    COALESCE(e.course_name, e.title, e.payload->>'course_name', 'Assessment') AS course_name,
    e.created_at,
    jsonb_build_object(
        'title', COALESCE(e.payload->>'title', e.title, e.course_name, 'Assessment'),
        'duration_minutes', COALESCE((e.payload->>'duration_minutes')::integer, 120),
        'total_marks', COALESCE((e.payload->>'total_marks')::integer, 100),
        'instructions', e.payload->>'instructions',
        'type', e.payload->>'type',
        'series', e.payload->>'series',
        'class', e.payload->>'class',
        'start_time', e.payload->>'start_time',
        'end_time', e.payload->>'end_time',
        'section_a', CASE 
            WHEN e.payload->'section_a' IS NOT NULL THEN
                jsonb_build_object(
                    'title', e.payload->'section_a'->>'title',
                    'instructions', e.payload->'section_a'->>'instructions',
                    'total_marks', (e.payload->'section_a'->>'total_marks')::integer,
                    'questions', (
                        SELECT COALESCE(jsonb_agg(
                            q - 'correct_answer' - 'rubric' - 'critical_aspect'
                        ), '[]'::jsonb)
                        FROM jsonb_array_elements(e.payload->'section_a'->'questions') q
                    )
                )
            ELSE NULL END,
        'section_b', CASE 
            WHEN e.payload->'section_b' IS NOT NULL THEN
                jsonb_build_object(
                    'title', e.payload->'section_b'->>'title',
                    'instructions', e.payload->'section_b'->>'instructions',
                    'total_marks', (e.payload->'section_b'->>'total_marks')::integer,
                    'questions', (
                        SELECT COALESCE(jsonb_agg(
                            q - 'correct_answer' - 'rubric' - 'critical_aspect'
                        ), '[]'::jsonb)
                        FROM jsonb_array_elements(e.payload->'section_b'->'questions') q
                    )
                )
            ELSE NULL END
    ) AS payload
FROM Exams e;

-- ─── 3. Enable Row-Level Security (RLS) on Core Entities ─────────────────────
ALTER TABLE IF EXISTS Exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS Submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS Assessment_Marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS Session_Plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS Trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS Unit_Offerings ENABLE ROW LEVEL SECURITY;

-- ─── 4. Helper Functions for Auth Context Resolution ─────────────────────────
CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role',
        'trainee'
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_trainee_reg() 
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'reg_number',
        ''
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_user_department_id() 
RETURNS UUID AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'department_id'
    )::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── 5. Submissions Table RLS Policies (FK Traversal & BOLA Protection) ───────
-- Trainee: Read only own submissions
DROP POLICY IF EXISTS trainee_submissions_self ON Submissions;
CREATE POLICY trainee_submissions_self ON Submissions
FOR SELECT USING (
    auth_user_role() = 'trainee' AND (
        trainee_id = auth.uid() OR
        reg_number = auth_trainee_reg() OR 
        student_email = auth.jwt()->>'email'
    )
);

-- Trainee: Insert submission within active exam window
DROP POLICY IF EXISTS trainee_submit_exam ON Submissions;
CREATE POLICY trainee_submit_exam ON Submissions
FOR INSERT WITH CHECK (
    auth_user_role() = 'trainee' AND (
        trainee_id = auth.uid() OR 
        reg_number = auth_trainee_reg()
    )
    -- Enforce valid exam window
    AND EXISTS (
        SELECT 1 FROM Exams e
        WHERE e.id = Submissions.exam_id
          AND (
            e.payload->>'end_time' IS NULL 
            OR NOW() <= (e.payload->>'end_time')::timestamptz
          )
    )
);

-- Trainee: Submission Locking (Cannot update once status is 'submitted' or graded)
DROP POLICY IF EXISTS trainee_submission_lock ON Submissions;
CREATE POLICY trainee_submission_lock ON Submissions
FOR UPDATE USING (
    auth_user_role() = 'trainee'
    AND status = 'in_progress'
    AND (trainee_id = auth.uid() OR reg_number = auth_trainee_reg())
) WITH CHECK (
    status IN ('in_progress', 'submitted')
);

-- Trainer: Relational FK Traversal: Submissions -> Exams -> Unit_Offerings -> trainer_id
DROP POLICY IF EXISTS trainer_submissions_assigned ON Submissions;
CREATE POLICY trainer_submissions_assigned ON Submissions
FOR ALL USING (
    (auth_user_role() = 'trainer' AND EXISTS (
        SELECT 1 FROM Exams e
        JOIN Unit_Offerings uo ON uo.unit_id = e.unit_id
        WHERE e.id = Submissions.exam_id
          AND uo.trainer_id = auth.uid()
    ))
    -- HOD: Scoped strictly to their assigned department
    OR (auth_user_role() = 'hod' AND EXISTS (
        SELECT 1 FROM Exams e
        JOIN Units_of_Competence u ON u.id = e.unit_id
        JOIN Departments d ON d.id = u.department_id
        WHERE e.id = Submissions.exam_id
          AND (d.hod_id = auth.uid() OR d.id = auth_user_department_id())
    ))
    -- Administrator: Full audit oversight
    OR auth_user_role() = 'admin'
);

-- ─── 6. Assessment Marks RLS Policies (Continuous Assessment) ────────────────
DROP POLICY IF EXISTS trainee_marks_published_only ON Assessment_Marks;
CREATE POLICY trainee_marks_published_only ON Assessment_Marks
FOR SELECT USING (
    -- Trainees can ONLY view their own marks IF they are locked/signed off (published)
    (auth_user_role() = 'trainee' AND is_locked = TRUE AND trainee_id = auth.uid())
    -- Trainers can only view marks for unit offerings they teach
    OR (auth_user_role() = 'trainer' AND unit_offering_id IN (
        SELECT id FROM Unit_Offerings WHERE trainer_id = auth.uid()
    ))
    -- HOD: Scoped strictly to department
    OR (auth_user_role() = 'hod' AND unit_offering_id IN (
        SELECT uo.id FROM Unit_Offerings uo
        JOIN Units_of_Competence u ON u.id = uo.unit_id
        JOIN Departments d ON d.id = u.department_id
        WHERE d.hod_id = auth.uid() OR d.id = auth_user_department_id()
    ))
    OR auth_user_role() = 'admin'
);

DROP POLICY IF EXISTS trainer_modify_marks ON Assessment_Marks;
CREATE POLICY trainer_modify_marks ON Assessment_Marks
FOR ALL USING (
    (auth_user_role() = 'trainer' AND unit_offering_id IN (
        SELECT id FROM Unit_Offerings WHERE trainer_id = auth.uid()
    ))
    OR auth_user_role() = 'admin'
);

-- ─── 7. Exams RLS Policies (Answer Protection & Unit Scoping) ────────────────
DROP POLICY IF EXISTS exam_access_policy ON Exams;
CREATE POLICY exam_access_policy ON Exams
FOR SELECT USING (
    -- Trainers can view exams for their assigned units
    (auth_user_role() = 'trainer' AND EXISTS (
        SELECT 1 FROM Unit_Offerings uo
        WHERE uo.unit_id = Exams.unit_id
          AND uo.trainer_id = auth.uid()
    ))
    -- Trainees can view scheduled exams ONLY for units enrolled in their cohort
    OR (auth_user_role() = 'trainee' AND EXISTS (
        SELECT 1 FROM Trainees t
        JOIN Unit_Offerings uo ON uo.class_id = t.class_id
        WHERE (t.id = auth.uid() OR t.reg_code = auth_trainee_reg() OR t.reg_number = auth_trainee_reg())
          AND uo.unit_id = Exams.unit_id
    ))
    -- HOD: Scoped to department
    OR (auth_user_role() = 'hod' AND EXISTS (
        SELECT 1 FROM Units_of_Competence u
        JOIN Departments d ON d.id = u.department_id
        WHERE u.id = Exams.unit_id
          AND (d.hod_id = auth.uid() OR d.id = auth_user_department_id())
    ))
    OR auth_user_role() = 'admin'
);
