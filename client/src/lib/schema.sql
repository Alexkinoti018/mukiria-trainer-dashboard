-- ============================================================
-- Mukiria Technical Training Institute
-- Institutional Operating System — Database Schema
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

CREATE TABLE IF NOT EXISTS public.submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code    TEXT NOT NULL,
  student_name TEXT NOT NULL,
  reg_number   TEXT NOT NULL,
  section_a    JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_b    JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'graded', 'reviewed')),
  total_score  NUMERIC(5,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.submissions IS 'Student exam responses submitted via Candidate Portal';
COMMENT ON COLUMN public.submissions.section_a IS 'Array of {question_id, answer, marks_awarded}';
COMMENT ON COLUMN public.submissions.section_b IS 'Array of {question_id, answer, marks_awarded}';
COMMENT ON COLUMN public.submissions.status IS 'pending | graded | reviewed';

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exams_unit_code ON public.exams(unit_code);
CREATE INDEX IF NOT EXISTS idx_submissions_unit_code ON public.submissions(unit_code);
CREATE INDEX IF NOT EXISTS idx_submissions_reg_number ON public.submissions(reg_number);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Public can insert submissions"
  ON public.submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can read submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated trainers can update submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Sample Data (for development/testing) ───────────────────
-- Uncomment to seed initial data:

/*
INSERT INTO public.exams (unit_code, course_name, payload) VALUES (
  'COMP-204',
  'Computer Science Fundamentals',
  '{
    "title": "Computer Science Fundamentals — CAT 1",
    "duration_minutes": 90,
    "total_marks": 100,
    "instructions": "Answer ALL questions in Section A and ANY TWO questions in Section B.",
    "section_a": {
      "title": "Section A — Multiple Choice",
      "instructions": "Circle the correct answer for each question. Each question carries 2 marks.",
      "total_marks": 40,
      "questions": [
        {
          "id": "q1",
          "text": "Which data structure uses LIFO (Last In, First Out) ordering?",
          "type": "mcq",
          "options": ["Queue", "Stack", "Linked List", "Tree"],
          "correct_answer": 1,
          "marks": 2
        },
        {
          "id": "q2",
          "text": "What is the time complexity of binary search?",
          "type": "mcq",
          "options": ["O(n)", "O(n²)", "O(log n)", "O(1)"],
          "correct_answer": 2,
          "marks": 2
        }
      ]
    },
    "section_b": {
      "title": "Section B — Short Answer",
      "instructions": "Answer any TWO questions. Each question carries 30 marks.",
      "total_marks": 60,
      "questions": [
        {
          "id": "q3",
          "text": "Explain the concept of Object-Oriented Programming and its four main pillars.",
          "type": "short_answer",
          "correct_answer": "",
          "marks": 30
        }
      ]
    }
  }'::jsonb
);
*/
