-- ============================================================
-- Mukiria Technical Training Institute
-- Institutional Operating System — Updated Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Table: exams ────────────────────────────────────────────
-- Stores standardized JSON assessment payloads created by trainers.
-- Each exam is uniquely identified by its unit_code.

CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code   TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.exams IS 'Standardized JSON assessment payloads for each unit';
COMMENT ON COLUMN public.exams.unit_code IS 'Unique unit identifier, e.g. COMP-204';
COMMENT ON COLUMN public.exams.payload IS 'Full exam structure: title, duration, sections, questions';

-- ─── Table: submissions ──────────────────────────────────────
-- Stores student responses submitted through the Candidate Portal.
-- UPDATED: Added student_email for student-owned result lookup

CREATE TABLE IF NOT EXISTS public.submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code    TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reg_number   TEXT NOT NULL,
  student_email TEXT,
  section_a    JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_b    JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'graded', 'reviewed')),
  total_score  NUMERIC(5,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.submissions IS 'Student exam responses submitted via Candidate Portal';
COMMENT ON COLUMN public.submissions.section_a IS 'Array of {question_id, answer, marks_awarded}';
COMMENT ON COLUMN public.submissions.section_b IS 'Array of {question_id, answer, marks_awarded}';
COMMENT ON COLUMN public.submissions.status IS 'pending | graded | reviewed';
COMMENT ON COLUMN public.submissions.student_email IS 'Student email for authenticated result lookup';

-- ─── Table: score_audit_trail ────────────────────────────────
-- NEW: Tracks all score changes with audit trail for accountability

CREATE TABLE IF NOT EXISTS public.score_audit_trail (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  question_id     TEXT NOT NULL,
  section         TEXT NOT NULL CHECK (section IN ('A', 'B')),
  original_score  NUMERIC(5,2) NOT NULL,
  new_score       NUMERIC(5,2) NOT NULL,
  override_reason TEXT,
  changed_by      TEXT NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.score_audit_trail IS 'Audit trail for all score overrides and changes';
COMMENT ON COLUMN public.score_audit_trail.changed_by IS 'Email of trainer who made the change';
COMMENT ON COLUMN public.score_audit_trail.override_reason IS 'Reason for score override';

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exams_unit_code ON public.exams(unit_code);
CREATE INDEX IF NOT EXISTS idx_submissions_unit_code ON public.submissions(unit_code);
CREATE INDEX IF NOT EXISTS idx_submissions_reg_number ON public.submissions(reg_number);
CREATE INDEX IF NOT EXISTS idx_submissions_student_email ON public.submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_submission_id ON public.score_audit_trail(submission_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.score_audit_trail(changed_at DESC);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_audit_trail ENABLE ROW LEVEL SECURITY;

-- EXAMS policies:
-- Public (anon) can READ exams (Candidate Portal fetches exam by unit_code)
-- Authenticated trainers can INSERT, UPDATE, DELETE exams

CREATE POLICY "Public can read exams"
  ON public.exams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated trainers can insert exams"
  ON public.exams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can update exams"
  ON public.exams FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can delete exams"
  ON public.exams FOR DELETE
  TO authenticated
  USING (true);

-- SUBMISSIONS policies:
-- Public (anon) can INSERT submissions (students submit from Candidate Portal)
-- Authenticated trainers can READ, UPDATE submissions (grading interface)
-- Students can READ their own submissions by email

CREATE POLICY "Public can insert submissions"
  ON public.submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can read all submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can read their own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (student_email = auth.jwt() ->> 'email');

CREATE POLICY "Authenticated trainers can update submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SCORE_AUDIT_TRAIL policies:
-- Authenticated trainers can INSERT and READ audit trail
-- Students can READ audit trail for their own submissions

CREATE POLICY "Authenticated trainers can insert audit entries"
  ON public.score_audit_trail FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can read all audit entries"
  ON public.score_audit_trail FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can read audit for their submissions"
  ON public.score_audit_trail FOR SELECT
  TO authenticated
  USING (
    submission_id IN (
      SELECT id FROM public.submissions
      WHERE student_email = auth.jwt() ->> 'email'
    )
  );

-- ─── Table: unit_offerings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unit_offerings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID, -- References a terms table if it exists
  class_id UUID, -- References a classes table if it exists
  unit_id UUID, -- References units
  trainer_id UUID, -- References trainers
  UNIQUE(term_id, class_id, unit_id)
);
ALTER TABLE public.unit_offerings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers can manage unit offerings" ON public.unit_offerings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Table: assessment_marks ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessment_marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_offering_id UUID REFERENCES public.unit_offerings(id) ON DELETE CASCADE,
  trainee_id UUID, -- References trainees
  ct1 NUMERIC(5,2),
  ct2 NUMERIC(5,2),
  ct3 NUMERIC(5,2),
  computed_average_theory NUMERIC(5,2),
  cp1 NUMERIC(5,2),
  cp2 NUMERIC(5,2),
  cp3 NUMERIC(5,2),
  computed_average_practical NUMERIC(5,2),
  weighted_mark NUMERIC(5,2),
  is_locked BOOLEAN DEFAULT FALSE,
  UNIQUE(unit_offering_id, trainee_id)
);
COMMENT ON TABLE public.assessment_marks IS 'Continuous assessment marks sheet data, normalized';
ALTER TABLE public.assessment_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers can read assessment marks" ON public.assessment_marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Trainers can insert assessment marks" ON public.assessment_marks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Trainers can update assessment marks" ON public.assessment_marks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── Table: assessment_evidence ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessment_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_offering_id UUID,
  trainee_id UUID,
  assessment_type VARCHAR(10) NOT NULL CHECK (assessment_type IN ('CT1', 'CT2', 'CT3', 'CP1', 'CP2', 'CP3')),
  file_url TEXT NOT NULL,
  uploaded_by_id UUID,
  verified_by_trainer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (unit_offering_id, trainee_id) REFERENCES public.assessment_marks(unit_offering_id, trainee_id) ON DELETE CASCADE
);
ALTER TABLE public.assessment_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trainers can manage evidence" ON public.assessment_evidence FOR ALL TO authenticated USING (true) WITH CHECK (true);


