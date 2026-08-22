-- =====================================================
-- MTTI Institutional Operating System — Records of Work & Learning Plans
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. LEARNING PLANS TABLE
CREATE TABLE IF NOT EXISTS learning_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code         TEXT NOT NULL,
  unit_name         TEXT NOT NULL,
  trainer_name      TEXT NOT NULL,
  class_code        TEXT NOT NULL,
  week_number       INTEGER NOT NULL,
  topic             TEXT NOT NULL,
  learning_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
  resources         JSONB NOT NULL DEFAULT '[]'::jsonb,
  status            TEXT NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned', 'session_plan_created', 'delivered')),
  session_plan_id   TEXT, -- Stored locally or points to session_plans.id
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_learning_plans_unit_week
  ON learning_plans(unit_code, week_number);

-- 2. RECORDS OF WORK TABLE
CREATE TABLE IF NOT EXISTS records_of_work (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_plan_id       TEXT NOT NULL,
  unit_code             TEXT NOT NULL,
  class_code            TEXT NOT NULL,
  week_number           INTEGER NOT NULL,
  date_delivered        TEXT NOT NULL,
  trainees_present      INTEGER NOT NULL DEFAULT 0,
  hours_covered         NUMERIC(4,2) NOT NULL DEFAULT 2,
  work_actually_covered TEXT NOT NULL,
  reflection            TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'delivered'
                        CHECK (status IN ('delivered', 'partial', 'postponed')),
  signature             TEXT NOT NULL,
  signature_date        TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_records_of_work_unit_week
  ON records_of_work(unit_code, week_number);

-- Row-Level Security Configuration
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE records_of_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select learning plans"
  ON learning_plans FOR SELECT USING (true);

CREATE POLICY "Authenticated trainers can insert learning plans"
  ON learning_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can update learning plans"
  ON learning_plans FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can select records of work"
  ON records_of_work FOR SELECT USING (true);

CREATE POLICY "Authenticated trainers can insert records of work"
  ON records_of_work FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can update records of work"
  ON records_of_work FOR UPDATE USING (auth.role() = 'authenticated');
