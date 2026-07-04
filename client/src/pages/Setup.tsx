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
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase";

const SCHEMA_SQL = `-- =====================================================
-- MTTI Institutional Operating System — Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code   TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code    TEXT NOT NULL REFERENCES exams(unit_code),
  student_name TEXT NOT NULL,
  reg_number   TEXT NOT NULL,
  section_a    JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_b    JSONB NOT NULL DEFAULT '[]'::jsonb,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'graded', 'reviewed')),
  total_score  NUMERIC(5,2),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_submissions_unit_code
  ON submissions(unit_code);
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_reg_number
  ON submissions(reg_number);

-- 4. ROW LEVEL SECURITY
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Exams: public read (for Candidate Portal), authenticated write (for Trainer)
CREATE POLICY "Public can read exams"
  ON exams FOR SELECT USING (true);

CREATE POLICY "Authenticated trainers can insert exams"
  ON exams FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can update exams"
  ON exams FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can delete exams"
  ON exams FOR DELETE
  USING (auth.role() = 'authenticated');

-- Submissions: public insert (for Candidate Portal), authenticated read/update (for Trainer)
CREATE POLICY "Public can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated trainers can read submissions"
  ON submissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated trainers can update submissions"
  ON submissions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 5. TRAINER AUTH USER (run this separately in Supabase Auth)
-- In Supabase Dashboard → Authentication → Users → Add User:
-- Email: trainer@mtti.ac.ke
-- Password: (your 4-digit PIN, e.g. 1234)
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
    <DashboardLayout title="Supabase Setup" subtitle="Configure the database backend for production use">
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
    </DashboardLayout>
  );
}
