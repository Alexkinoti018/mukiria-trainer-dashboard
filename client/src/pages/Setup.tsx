/**
 * Supabase Setup Page
 * Guides the trainer through configuring Supabase credentials and running the schema SQL
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Copy,
  CheckCircle2,
  ExternalLink,
  Key,
  Shield,
  Terminal,
  ChevronRight,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";

const SCHEMA_SQL = `-- ============================================================
-- Mukiria Technical Training Institute
-- Institutional Operating System — Normalized Relational Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing views/tables to ensure clean schema update
DROP TRIGGER IF EXISTS trg_auto_populate_attendance ON public.session_plans_data CASCADE;
DROP TRIGGER IF EXISTS trg_sync_to_record_of_work ON public.session_plans_data CASCADE;
DROP TRIGGER IF EXISTS trg_calculate_submission_score ON public.trainee_answers CASCADE;
DROP FUNCTION IF EXISTS public.fn_auto_populate_attendance() CASCADE;
DROP FUNCTION IF EXISTS public.fn_sync_to_record_of_work() CASCADE;
DROP FUNCTION IF EXISTS public.fn_calculate_submission_score() CASCADE;

-- ─── 1. CORE ENTITIES ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.terms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  department  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code  TEXT UNIQUE NOT NULL,
  term_id     UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  reg_number  TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units_of_competence (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code   TEXT UNIQUE NOT NULL,
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
  critical_aspect   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. TIMETABLE & SESSION PLANS ────────────────────────────

CREATE TABLE IF NOT EXISTS public.timetable (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id  UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES public.units_of_competence(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  time_block  TEXT NOT NULL,
  term_id     UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trainer_id, class_id, unit_id, day_of_week, time_block)
);

CREATE TABLE IF NOT EXISTS public.session_plans_data (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id        UUID NOT NULL REFERENCES public.timetable(id) ON DELETE CASCADE,
  week_number         INTEGER NOT NULL,
  date                TEXT NOT NULL,
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
  status          TEXT NOT NULL DEFAULT 'X' CHECK (status IN ('X', '0')),
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
  title             TEXT NOT NULL,
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
  correct_answer      TEXT,
  max_marks           NUMERIC(5,2) NOT NULL,
  critical_aspect_id  UUID REFERENCES public.learning_outcomes(id) ON DELETE SET NULL,
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
  trainee_answer  TEXT,
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

CREATE OR REPLACE FUNCTION public.fn_sync_to_record_of_work()
RETURNS TRIGGER AS $$
DECLARE
  v_outcomes TEXT;
  v_present_count INTEGER;
BEGIN
  IF NEW.status IN ('delivered', 'completed') THEN
    SELECT COALESCE(string_agg(lo.description, '; '), 'Delivered session plan learning outcomes.')
    INTO v_outcomes
    FROM public.session_plan_outcomes spo
    JOIN public.learning_outcomes lo ON lo.id = spo.learning_outcome_id
    WHERE spo.session_plan_id = NEW.id;

    SELECT count(*)
    INTO v_present_count
    FROM public.attendance_register
    WHERE session_plan_id = NEW.id AND status = 'X';

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
      2.0,
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

CREATE OR REPLACE FUNCTION public.fn_calculate_submission_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC(5,2);
  v_pending_count INTEGER;
BEGIN
  SELECT sum(marks_awarded)
  INTO v_total
  FROM public.trainee_answers
  WHERE submission_id = NEW.submission_id;

  SELECT count(*)
  INTO v_pending_count
  FROM public.trainee_answers
  WHERE submission_id = NEW.submission_id AND marks_awarded IS NULL;

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
`;

const ENV_TEMPLATE = `# Add to your .env file (project root)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
`;

export default function Setup() {
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const copyToClipboard = async (text: string, type: "sql" | "env") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "sql") {
        setCopiedSQL(true);
        setTimeout(() => setCopiedSQL(false), 2000);
      } else {
        setCopiedEnv(true);
        setTimeout(() => setCopiedEnv(false), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Copy failed — please select and copy manually.");
    }
  };

  return (
    <TrainerLayout title="Supabase Setup" subtitle="Configure the database backend for production use">
      {/* Status Banner */}
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6"
        style={{
          background: isConfigured
            ? "oklch(0.72 0.18 160 / 0.1)"
            : "oklch(0.75 0.14 80 / 0.1)",
          border: `1px solid ${isConfigured ? "oklch(0.72 0.18 160 / 0.3)" : "oklch(0.75 0.14 80 / 0.3)"}`,
        }}
      >
        {isConfigured ? (
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "oklch(0.72 0.18 160)" }} />
        ) : (
          <Database className="w-5 h-5 shrink-0" style={{ color: "oklch(0.75 0.14 80)" }} />
        )}
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: isConfigured ? "oklch(0.72 0.18 160)" : "oklch(0.75 0.14 80)" }}
          >
            {isConfigured ? "Supabase Connected" : "Running in Demo Mode"}
          </p>
          <p className="text-xs" style={{ color: "oklch(0.58 0.012 240)" }}>
            {isConfigured
              ? "Your Supabase credentials are configured. The system is using live data."
              : "No Supabase credentials detected. Data is loaded from mock fixtures. Follow the steps below to connect a real database."}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "oklch(0.65 0.15 200 / 0.15)", color: "oklch(0.65 0.15 200)" }}
            >
              1
            </div>
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Create a Supabase Project
            </h3>
          </div>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: "oklch(0.65 0.012 240)" }}>
            Go to <strong>supabase.com</strong>, create a new project, and note your Project URL and Anon Key from the API settings.
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: "oklch(0.65 0.15 200)" }}
          >
            Open Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "oklch(0.72 0.18 160 / 0.15)", color: "oklch(0.72 0.18 160)" }}
            >
              2
            </div>
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Set Environment Variables
            </h3>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "oklch(0.65 0.012 240)" }}>
            Create a <code className="font-mono">.env</code> file in the project root with your credentials:
          </p>
          <div className="relative">
            <pre
              className="text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed"
              style={{
                background: "oklch(0.10 0.015 240)",
                color: "oklch(0.72 0.18 160)",
                border: "1px solid oklch(1 0 0 / 0.08)",
              }}
            >
              {ENV_TEMPLATE}
            </pre>
            <button
              onClick={() => copyToClipboard(ENV_TEMPLATE, "env")}
              className="absolute top-2 right-2 p-1.5 rounded-lg transition-all"
              style={{ background: "oklch(1 0 0 / 0.08)", color: "oklch(0.58 0.012 240)" }}
            >
              {copiedEnv ? (
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.18 160)" }} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Step 3 — Full width SQL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: "oklch(0.75 0.14 80 / 0.15)", color: "oklch(0.75 0.14 80)" }}
              >
                3
              </div>
              <div>
                <h3
                  className="font-bold text-sm"
                  style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
                >
                  Run the Database Schema
                </h3>
                <p className="text-xs" style={{ color: "oklch(0.58 0.012 240)" }}>
                  Copy and run this SQL in Supabase Dashboard → SQL Editor
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(SCHEMA_SQL, "sql")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: "oklch(0.75 0.14 80 / 0.12)",
                border: "1px solid oklch(0.75 0.14 80 / 0.3)",
                color: "oklch(0.75 0.14 80)",
              }}
            >
              {copiedSQL ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy SQL</>
              )}
            </button>
          </div>
          <pre
            className="text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed max-h-96 overflow-y-auto"
            style={{
              background: "oklch(0.10 0.015 240)",
              color: "oklch(0.80 0.008 240)",
              border: "1px solid oklch(1 0 0 / 0.08)",
            }}
          >
            {SCHEMA_SQL}
          </pre>
        </motion.div>

        {/* Step 4 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "oklch(0.70 0.16 290 / 0.15)", color: "oklch(0.70 0.16 290)" }}
            >
              4
            </div>
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Create Trainer Auth User
            </h3>
          </div>
          <ol className="text-xs space-y-2 leading-relaxed" style={{ color: "oklch(0.65 0.012 240)" }}>
            <li>1. Go to <strong>Supabase → Authentication → Users</strong></li>
            <li>2. Click <strong>"Add User"</strong></li>
            <li>3. Email: <code className="font-mono text-emerald-400">trainer@mtti.ac.ke</code></li>
            <li>4. Password: <code className="font-mono text-emerald-400">your-4-digit-PIN</code></li>
            <li>5. The PIN you set here is what trainers use to log in</li>
          </ol>
        </motion.div>

        {/* Step 5 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: "oklch(0.72 0.18 160 / 0.15)", color: "oklch(0.72 0.18 160)" }}
            >
              5
            </div>
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Candidate Portal URL Format
            </h3>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "oklch(0.65 0.012 240)" }}>
            Share this URL pattern with students. Replace <code className="font-mono">COMP-204</code> with the actual unit code:
          </p>
          <div
            className="px-3 py-2.5 rounded-lg font-mono text-xs"
            style={{
              background: "oklch(0.10 0.015 240)",
              border: "1px solid oklch(1 0 0 / 0.08)",
              color: "oklch(0.72 0.18 160)",
            }}
          >
            https://your-domain.com/exam?unitCode=COMP-204
          </div>
          <p className="text-xs mt-3" style={{ color: "oklch(0.50 0.010 240)" }}>
            Demo mode supports: <code className="font-mono">COMP-204</code>, <code className="font-mono">ELEC-101</code>, <code className="font-mono">MECH-301</code>
          </p>
        </motion.div>
      </div>
    </TrainerLayout>
  );
}
