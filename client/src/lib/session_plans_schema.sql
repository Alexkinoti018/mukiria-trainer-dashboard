-- =====================================================
-- MTTI Institutional Operating System — Session Plans Schema
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS session_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code       TEXT NOT NULL DEFAULT 'MTTI/F/CUR/05',
  trainer_name        TEXT NOT NULL,
  department          TEXT NOT NULL,
  unit_name           TEXT NOT NULL,
  unit_code           TEXT NOT NULL,
  class_code          TEXT NOT NULL,
  level               TEXT NOT NULL,
  trainees_count      INTEGER NOT NULL DEFAULT 0,
  date                TEXT NOT NULL,
  time_duration       TEXT NOT NULL,
  week_number         INTEGER NOT NULL,
  session_title       TEXT NOT NULL,
  learning_outcomes   JSONB NOT NULL DEFAULT '[]'::jsonb,
  resources           JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_requirements TEXT NOT NULL,
  introduction        TEXT NOT NULL,
  delivery_steps      JSONB NOT NULL DEFAULT '[]'::jsonb,
  session_review      TEXT NOT NULL,
  assignment          TEXT NOT NULL,
  reflection          TEXT NOT NULL,
  signature           TEXT NOT NULL,
  signature_date      TEXT NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by unit and week
CREATE INDEX IF NOT EXISTS idx_session_plans_unit_week
  ON session_plans(unit_code, week_number);

-- Enable RLS
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;

-- Select policy: public read or authenticated read (let's allow read for anyone)
CREATE POLICY "Anyone can select session plans"
  ON session_plans FOR SELECT USING (true);

-- Insert/Update/Delete policies for authenticated trainers
CREATE POLICY "Authenticated trainers can insert session plans"
  ON session_plans FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can update session plans"
  ON session_plans FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can delete session plans"
  ON session_plans FOR DELETE
  USING (auth.role() = 'authenticated');
