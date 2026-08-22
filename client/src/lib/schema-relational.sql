-- ============================================================
-- Mukiria Technical Training Institute
-- Institutional Operating System — Normalized Relational Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing views/tables to ensure clean schema update if requested
DROP TRIGGER IF EXISTS trg_auto_populate_attendance ON public.session_plans_data CASCADE;
DROP TRIGGER IF EXISTS trg_sync_to_record_of_work ON public.session_plans_data CASCADE;
DROP TRIGGER IF EXISTS trg_calculate_submission_score ON public.trainee_answers CASCADE;
DROP FUNCTION IF EXISTS public.fn_auto_populate_attendance() CASCADE;
DROP FUNCTION IF EXISTS public.fn_sync_to_record_of_work() CASCADE;
DROP FUNCTION IF EXISTS public.fn_calculate_submission_score() CASCADE;

-- ─── 1. CORE ENTITIES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.terms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE, -- e.g. "Term 1 2026"
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL, -- e.g. "trainer@mtti.ac.ke"
  department  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code  TEXT UNIQUE NOT NULL, -- e.g. "ITECH6/M/24"
  term_id     UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  reg_number  TEXT UNIQUE NOT NULL, -- e.g. "ADM/ICT/001"
  email       TEXT UNIQUE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units_of_competence (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code   TEXT UNIQUE NOT NULL, -- e.g. "ICT/OS/CS/CR/11/6/A"
  unit_name   TEXT NOT NULL,
  level       INTEGER NOT NULL DEFAULT 6,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. PEDAGOGY & CURRICULUM ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.learning_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id     UUID NOT NULL REFERENCES public.units_of_competence(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  topic       TEXT NOT NULL,
  resources   JSONB NOT NULL DEFAULT '["Projector", "lab workstations", "reference materials"]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(unit_id, week_number)
);

CREATE TABLE IF NOT EXISTS public.learning_outcomes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_plan_id  UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  critical_aspect   TEXT, -- CDACC compliance aspects
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. TIMETABLE & SESSION PLANS ────────────────────────────

CREATE TABLE IF NOT EXISTS public.timetable (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id  UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES public.units_of_competence(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  time_block  TEXT NOT NULL, -- e.g. "10:30-12:30"
  term_id     UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trainer_id, class_id, unit_id, day_of_week, time_block)
);

CREATE TABLE IF NOT EXISTS public.session_plans_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id        UUID NOT NULL REFERENCES public.timetable(id) ON DELETE CASCADE,
  week_number         INTEGER NOT NULL,
  date                TEXT NOT NULL, -- Format DD/MM/YYYY
  session_title       TEXT NOT NULL,
  safety_requirements TEXT NOT NULL DEFAULT 'Ergonomic guidelines, electrical safety protocols.',
  introduction        TEXT NOT NULL,
  delivery_steps      JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_review      TEXT NOT NULL,
  assignment          TEXT NOT NULL,
  reflection          TEXT,
  status              TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'session_plan_created', 'delivered', 'completed')),
  document_code       TEXT NOT NULL DEFAULT 'MTTI/F/CUR/05',
  trainer_signature   TEXT,
  signature_date      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_plan_outcomes (
  session_plan_id     UUID NOT NULL REFERENCES public.session_plans_data(id) ON DELETE CASCADE,
  learning_outcome_id UUID NOT NULL REFERENCES public.learning_outcomes(id) ON DELETE CASCADE,
  PRIMARY KEY (session_plan_id, learning_outcome_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_register (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_plan_id UUID NOT NULL REFERENCES public.session_plans_data(id) ON DELETE CASCADE,
  trainee_id      UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'X' CHECK (status IN ('X', '0')), -- 'X' = Present, '0' = Absent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_plan_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS public.records_of_work (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_plan_id       UUID UNIQUE NOT NULL REFERENCES public.session_plans_data(id) ON DELETE CASCADE,
  date_delivered        TEXT NOT NULL,
  trainees_present      INTEGER NOT NULL DEFAULT 0,
  hours_covered         NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  work_actually_covered TEXT NOT NULL,
  reflection            TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'partial', 'postponed')),
  signature             TEXT NOT NULL,
  signature_date        TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. ASSESSMENT & ONLINE EXAM ENGINE ──────────────────────

CREATE TABLE IF NOT EXISTS public.exams (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id           UUID NOT NULL REFERENCES public.units_of_competence(id) ON DELETE CASCADE,
  class_id          UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  trainer_id        UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  title             TEXT NOT NULL, -- e.g. "Written Assessment I", "Formative Practical"
  duration_minutes  INTEGER NOT NULL DEFAULT 120,
  total_marks       NUMERIC(5,2) NOT NULL,
  instructions      TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('written', 'practical')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id             UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  section             TEXT NOT NULL CHECK (section IN ('A', 'B')),
  question_text       TEXT NOT NULL,
  question_type       TEXT NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'true_false', 'practical_task')),
  correct_answer      TEXT, -- Expected rubric or matching index for MCQs
  max_marks           NUMERIC(5,2) NOT NULL,
  critical_aspect_id  UUID REFERENCES public.learning_outcomes(id) ON DELETE SET NULL, -- Every question maps to critical aspect
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_mcq_options (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id   UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  option_text   TEXT NOT NULL,
  option_index  INTEGER NOT NULL,
  UNIQUE(question_id, option_index)
);

CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id       UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  trainee_id    UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'reviewed')),
  total_score   NUMERIC(5,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS public.trainee_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  trainee_answer  TEXT, -- Option chosen or text response
  marks_awarded   NUMERIC(5,2),
  feedback        TEXT,
  graded_by       UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  graded_at       TIMESTAMPTZ,
  UNIQUE(submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.score_audit_trail (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  original_score  NUMERIC(5,2) NOT NULL,
  new_score       NUMERIC(5,2) NOT NULL,
  override_reason TEXT NOT NULL,
  changed_by      UUID NOT NULL REFERENCES public.trainers(id) ON DELETE SET NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. DATABASE TRIGGER WORKFLOWS ───────────────────────────

-- Trigger function: Auto-Populate Attendance Register
CREATE OR REPLACE FUNCTION public.fn_auto_populate_attendance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.attendance_register (session_plan_id, trainee_id, status)
  SELECT NEW.id, t.id, 'X'
  FROM public.trainees t
  JOIN public.timetable tt ON tt.class_id = t.class_id
  WHERE tt.id = NEW.timetable_id
  ON CONFLICT (session_plan_id, trainee_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_populate_attendance
  AFTER INSERT ON public.session_plans_data
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_populate_attendance();

-- Trigger function: Auto-Sync Completed Session Plans to Record of Work
CREATE OR REPLACE FUNCTION public.fn_sync_to_record_of_work()
RETURNS TRIGGER AS $$
DECLARE
  v_outcomes TEXT;
  v_present_count INTEGER;
BEGIN
  IF NEW.status IN ('delivered', 'completed') THEN
    -- Aggregate descriptions of outcomes selected for this session plan
    SELECT COALESCE(string_agg(lo.description, '; '), 'Delivered session plan learning outcomes.')
    INTO v_outcomes
    FROM public.session_plan_outcomes spo
    JOIN public.learning_outcomes lo ON lo.id = spo.learning_outcome_id
    WHERE spo.session_plan_id = NEW.id;

    -- Count present students
    SELECT count(*)
    INTO v_present_count
    FROM public.attendance_register
    WHERE session_plan_id = NEW.id AND status = 'X';

    -- Upsert Record of Work
    INSERT INTO public.records_of_work (
      session_plan_id,
      date_delivered,
      trainees_present,
      hours_covered,
      work_actually_covered,
      reflection,
      status,
      signature,
      signature_date
    ) VALUES (
      NEW.id,
      NEW.date,
      COALESCE(v_present_count, 0),
      2.0, -- default duration
      v_outcomes,
      COALESCE(NEW.reflection, 'Completed successfully.'),
      'delivered',
      COALESCE(NEW.trainer_signature, 'Alexander Kinoti'),
      NEW.signature_date
    )
    ON CONFLICT (session_plan_id) DO UPDATE SET
      date_delivered = EXCLUDED.date_delivered,
      trainees_present = EXCLUDED.trainees_present,
      work_actually_covered = EXCLUDED.work_actually_covered,
      reflection = EXCLUDED.reflection,
      signature = EXCLUDED.signature,
      signature_date = EXCLUDED.signature_date,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_to_record_of_work
  AFTER UPDATE OF status ON public.session_plans_data
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_to_record_of_work();

-- Trigger function: Auto-Calculate Exam Submission Score
CREATE OR REPLACE FUNCTION public.fn_calculate_submission_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC(5,2);
  v_pending_count INTEGER;
BEGIN
  -- Sum up scores of all answers for this submission
  SELECT sum(marks_awarded)
  INTO v_total
  FROM public.trainee_answers
  WHERE submission_id = NEW.submission_id;

  -- Check if there are still ungraded answers
  SELECT count(*)
  INTO v_pending_count
  FROM public.trainee_answers
  WHERE submission_id = NEW.submission_id AND marks_awarded IS NULL;

  -- Update submission total score and status
  UPDATE public.exam_submissions
  SET total_score = v_total,
      status = CASE WHEN v_pending_count = 0 THEN 'graded'::text ELSE status END,
      updated_at = NOW()
  WHERE id = NEW.submission_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_submission_score
  AFTER INSERT OR UPDATE OF marks_awarded ON public.trainee_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_submission_score();

-- Enable RLS for Core Tables
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_plans_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_plan_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_audit_trail ENABLE ROW LEVEL SECURITY;

-- Allow public read on setup data
CREATE POLICY "Public read on terms" ON public.terms FOR SELECT USING (true);
CREATE POLICY "Public read on trainers" ON public.trainers FOR SELECT USING (true);
CREATE POLICY "Public read on classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public read on trainees" ON public.trainees FOR SELECT USING (true);
CREATE POLICY "Public read on units" ON public.units_of_competence FOR SELECT USING (true);
CREATE POLICY "Public read on learning plans" ON public.learning_plans FOR SELECT USING (true);
CREATE POLICY "Public read on learning outcomes" ON public.learning_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read on timetable" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "Public read on session plans" ON public.session_plans_data FOR SELECT USING (true);
CREATE POLICY "Public read on session plan outcomes" ON public.session_plan_outcomes FOR SELECT USING (true);
CREATE POLICY "Public read on attendance" ON public.attendance_register FOR SELECT USING (true);
CREATE POLICY "Public read on records of work" ON public.records_of_work FOR SELECT USING (true);
CREATE POLICY "Public read on exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Public read on exam questions" ON public.exam_questions FOR SELECT USING (true);
CREATE POLICY "Public read on exam mcq options" ON public.exam_mcq_options FOR SELECT USING (true);
CREATE POLICY "Public read on submissions" ON public.exam_submissions FOR SELECT USING (true);
CREATE POLICY "Public read on trainee answers" ON public.trainee_answers FOR SELECT USING (true);
CREATE POLICY "Public read on score audit" ON public.score_audit_trail FOR SELECT USING (true);

-- Authenticated writes
CREATE POLICY "Auth write on terms" ON public.terms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on trainers" ON public.trainers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on trainees" ON public.trainees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on units" ON public.units_of_competence FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on learning plans" ON public.learning_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on learning outcomes" ON public.learning_outcomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on timetable" ON public.timetable FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on session plans" ON public.session_plans_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on session plan outcomes" ON public.session_plan_outcomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on attendance" ON public.attendance_register FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on records of work" ON public.records_of_work FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on exams" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on exam questions" ON public.exam_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on exam mcq options" ON public.exam_mcq_options FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on submissions" ON public.exam_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on trainee answers" ON public.trainee_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write on score audit" ON public.score_audit_trail FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public insert on submissions (for students submitting assessments)
CREATE POLICY "Anon insert submissions" ON public.exam_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon insert trainee answers" ON public.trainee_answers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon update trainee answers" ON public.trainee_answers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
