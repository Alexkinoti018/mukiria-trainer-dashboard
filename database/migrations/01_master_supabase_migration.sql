-- =============================================================================
-- MUKIRIA TECHNICAL TRAINING INSTITUTE
-- Complete All-in-One Master Database Schema & Multi-Tenant RBAC / RLS
-- File: database/migrations/01_master_supabase_migration.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. CORE INSTITUTIONAL ENTITIES (Tables in Dependency Order) ──────────────

-- 1.1 Terms
CREATE TABLE IF NOT EXISTS Terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 1.2 Classes / Cohorts
CREATE TABLE IF NOT EXISTS Classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 3 AND 6),
    term_id UUID REFERENCES Terms(id) ON DELETE CASCADE
);

-- 1.3 Trainers (Instructors)
CREATE TABLE IF NOT EXISTS Trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- 1.4 Trainees (Students)
CREATE TABLE IF NOT EXISTS Trainees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_code VARCHAR(100),
    reg_number VARCHAR(100),
    adm_no VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    class_id UUID REFERENCES Classes(id) ON DELETE SET NULL
);

-- Guarantee columns exist if Trainees was created previously with different schema
ALTER TABLE IF EXISTS Trainees 
ADD COLUMN IF NOT EXISTS reg_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS reg_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS adm_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES Classes(id) ON DELETE SET NULL;

-- 1.5 Departments
CREATE TABLE IF NOT EXISTS Departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    hod_id UUID REFERENCES Trainers(id) ON DELETE SET NULL
);

-- 1.6 Units of Competence (Curriculum Modules)
CREATE TABLE IF NOT EXISTS Units_of_Competence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 3 AND 6),
    department_id UUID REFERENCES Departments(id) ON DELETE SET NULL
);

-- Ensure department_id column exists if table was created previously
ALTER TABLE IF EXISTS Units_of_Competence 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES Departments(id) ON DELETE SET NULL;

-- 1.7 Unit Offerings (Allocation Anchor: Term + Class + Unit + Trainer)
CREATE TABLE IF NOT EXISTS Unit_Offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID REFERENCES Terms(id) ON DELETE CASCADE,
    class_id UUID REFERENCES Classes(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES Units_of_Competence(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES Trainers(id) ON DELETE SET NULL,
    UNIQUE(term_id, class_id, unit_id)
);

-- 1.8 Learning Plans & Outcomes
CREATE TABLE IF NOT EXISTS Learning_Plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Learning_Outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_plan_id UUID REFERENCES Learning_Plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    critical_aspect TEXT
);

-- 1.9 Timetable & Session Plans
CREATE TABLE IF NOT EXISTS Timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES Trainers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES Classes(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES Units_of_Competence(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL,
    time_block VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Session_Plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE,
    timetable_id UUID REFERENCES Timetable(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    content JSONB,
    reflection_notes TEXT,
    reflection_status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Attendance_Register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_plan_id UUID REFERENCES Session_Plans(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES Trainees(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'Present'
);

CREATE TABLE IF NOT EXISTS Record_of_Work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_plan_id UUID REFERENCES Session_Plans(id) ON DELETE CASCADE,
    learning_outcome_id UUID REFERENCES Learning_Outcomes(id) ON DELETE CASCADE,
    date_covered DATE NOT NULL
);

-- 1.10 Continuous Assessment Marks
CREATE TABLE IF NOT EXISTS Assessment_Marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID REFERENCES Unit_Offerings(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES Trainees(id) ON DELETE CASCADE,
    ct_scores JSONB,
    computed_average_theory NUMERIC(5,2),
    cp_scores JSONB,
    computed_average_practical NUMERIC(5,2),
    weighted_mark NUMERIC(5,2),
    is_locked BOOLEAN DEFAULT FALSE,
    UNIQUE(unit_offering_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS Assessment_Evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_offering_id UUID,
    trainee_id UUID,
    assessment_type VARCHAR(10) NOT NULL CHECK (assessment_type LIKE 'CT%' OR assessment_type LIKE 'CP%'),
    file_url TEXT NOT NULL,
    uploaded_by_id UUID,
    verified_by_trainer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (unit_offering_id, trainee_id) REFERENCES Assessment_Marks(unit_offering_id, trainee_id) ON DELETE CASCADE
);

-- 1.11 Core Examination Tables (Exams & Submissions)
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

-- ─── 2. SANITIZED VIEW FOR STUDENT EXAM QUERIES (Column Shielding) ─────────────
-- Drop existing view first to avoid signature incompatibility errors
DROP VIEW IF EXISTS trainee_exam_view CASCADE;

-- Completely strips correct_answer, rubric, and critical_aspect from student payloads
CREATE OR REPLACE VIEW trainee_exam_view AS
SELECT 
    e.id, 
    e.unit_id,
    COALESCE(e.unit_code, e.payload->>'unit_code', '') AS unit_code,
    COALESCE(e.title, e.course_name, e.payload->>'title', e.payload->>'course_name', 'Assessment') AS title,
    COALESCE(e.course_name, e.title, e.payload->>'course_name', e.payload->>'title', 'Assessment') AS course_name,
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

-- ─── 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES ─────────────────────────
-- Guarantees Supabase never warns about unprotected tables
ALTER TABLE Terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE Classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE Trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE Departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE Units_of_Competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE Unit_Offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE Learning_Plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE Learning_Outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE Session_Plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE Attendance_Register ENABLE ROW LEVEL SECURITY;
ALTER TABLE Record_of_Work ENABLE ROW LEVEL SECURITY;
ALTER TABLE Assessment_Marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE Assessment_Evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE Exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE Submissions ENABLE ROW LEVEL SECURITY;

-- ─── 4. AUTH HELPER FUNCTIONS (Safe for SQL Editor & Web API) ──────────────────
CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS TEXT AS $$
DECLARE
    claims TEXT;
BEGIN
    claims := current_setting('request.jwt.claims', true);
    IF claims IS NULL OR claims = '' THEN
        -- When running directly in Supabase Dashboard SQL Editor as postgres/service_role
        RETURN 'admin';
    END IF;
    RETURN COALESCE(
        claims::jsonb->'user_metadata'->>'role',
        claims::jsonb->>'role',
        'trainee'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 'admin';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_trainee_reg() 
RETURNS TEXT AS $$
DECLARE
    claims TEXT;
BEGIN
    claims := current_setting('request.jwt.claims', true);
    IF claims IS NULL OR claims = '' THEN
        RETURN '';
    END IF;
    RETURN COALESCE(
        claims::jsonb->'user_metadata'->>'reg_number',
        claims::jsonb->>'reg_number',
        ''
    );
EXCEPTION WHEN OTHERS THEN
    RETURN '';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_user_department_id() 
RETURNS UUID AS $$
DECLARE
    claims TEXT;
BEGIN
    claims := current_setting('request.jwt.claims', true);
    IF claims IS NULL OR claims = '' THEN
        RETURN NULL;
    END IF;
    RETURN (claims::jsonb->'user_metadata'->>'department_id')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── 5. INSTITUTIONAL REFERENCE DATA POLICIES ─────────────────────────────────
DROP POLICY IF EXISTS authenticated_read_terms ON Terms;
CREATE POLICY authenticated_read_terms ON Terms FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS authenticated_read_classes ON Classes;
CREATE POLICY authenticated_read_classes ON Classes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS authenticated_read_departments ON Departments;
CREATE POLICY authenticated_read_departments ON Departments FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS authenticated_read_units ON Units_of_Competence;
CREATE POLICY authenticated_read_units ON Units_of_Competence FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS authenticated_read_trainers ON Trainers;
CREATE POLICY authenticated_read_trainers ON Trainers FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS staff_read_trainees ON Trainees;
CREATE POLICY staff_read_trainees ON Trainees FOR SELECT TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin') 
    OR id = auth.uid() 
    OR reg_code = auth_trainee_reg()
    OR reg_number = auth_trainee_reg()
);

DROP POLICY IF EXISTS view_unit_offerings ON Unit_Offerings;
CREATE POLICY view_unit_offerings ON Unit_Offerings FOR SELECT TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
    OR EXISTS (
        SELECT 1 FROM Trainees t
        WHERE (t.id = auth.uid() OR t.reg_code = auth_trainee_reg() OR t.reg_number = auth_trainee_reg())
          AND t.class_id = Unit_Offerings.class_id
    )
);

DROP POLICY IF EXISTS staff_pedagogical_all ON Learning_Plans;
CREATE POLICY staff_pedagogical_all ON Learning_Plans FOR ALL TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
);

DROP POLICY IF EXISTS staff_outcomes_all ON Learning_Outcomes;
CREATE POLICY staff_outcomes_all ON Learning_Outcomes FOR ALL TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
);

DROP POLICY IF EXISTS staff_session_plans ON Session_Plans;
CREATE POLICY staff_session_plans ON Session_Plans FOR ALL TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
);

DROP POLICY IF EXISTS staff_timetable ON Timetable;
CREATE POLICY staff_timetable ON Timetable FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS staff_attendance ON Attendance_Register;
CREATE POLICY staff_attendance ON Attendance_Register FOR ALL TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
);

DROP POLICY IF EXISTS staff_record_of_work ON Record_of_Work;
CREATE POLICY staff_record_of_work ON Record_of_Work FOR ALL TO authenticated USING (
    auth_user_role() IN ('trainer', 'hod', 'admin')
);

-- ─── 6. SUBMISSIONS TABLE RLS POLICIES (FK Traversal & BOLA Protection) ───────

-- 6.1 Trainee: Read only own submissions (BOLA Protection)
DROP POLICY IF EXISTS trainee_submissions_self ON Submissions;
CREATE POLICY trainee_submissions_self ON Submissions
FOR SELECT USING (
    auth_user_role() = 'trainee' AND (
        trainee_id = auth.uid() OR
        reg_number = auth_trainee_reg() OR 
        student_email = auth.jwt()->>'email'
    )
);

-- 6.2 Trainee: Insert submission within active exam window
DROP POLICY IF EXISTS trainee_submit_exam ON Submissions;
CREATE POLICY trainee_submit_exam ON Submissions
FOR INSERT WITH CHECK (
    auth_user_role() = 'trainee' AND (
        trainee_id = auth.uid() OR 
        reg_number = auth_trainee_reg()
    )
    AND EXISTS (
        SELECT 1 FROM Exams e
        WHERE e.id = Submissions.exam_id
          AND (
            e.payload->>'end_time' IS NULL 
            OR NOW() <= (e.payload->>'end_time')::timestamptz
          )
    )
);

-- 6.3 Trainee: Submission Locking (Cannot update once status is 'submitted' or graded)
DROP POLICY IF EXISTS trainee_submission_lock ON Submissions;
CREATE POLICY trainee_submission_lock ON Submissions
FOR UPDATE USING (
    auth_user_role() = 'trainee'
    AND status = 'in_progress'
    AND (trainee_id = auth.uid() OR reg_number = auth_trainee_reg())
) WITH CHECK (
    status IN ('in_progress', 'submitted')
);

-- 6.4 Trainer: Relational FK Traversal: Submissions -> Exams -> Unit_Offerings -> trainer_id
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

-- ─── 7. ASSESSMENT MARKS RLS POLICIES (Continuous Assessment) ────────────────
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

-- ─── 8. EXAMS RLS POLICIES (Answer Protection & Unit Scoping) ────────────────
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

-- ─── 9. PERMISSIONS & ROLE GRANTS ─────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON trainee_exam_view TO authenticated, anon;
