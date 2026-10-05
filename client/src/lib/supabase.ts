/**
 * Supabase Client Configuration
 * Mukiria Technical Training Institute — Institutional Operating System
 *
 * Design: Institutional Glassmorphism — deep slate-navy + emerald accent
 * This module provides the single Supabase client instance shared across
 * both the Trainer Dashboard and Candidate Portal logic.
 *
 * IMPORTANT: Replace VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with
 * your actual Supabase project credentials in the .env file.
 */

import { createClient } from "@supabase/supabase-js";

// ─── Environment Variables ───────────────────────────────────────────────────
// Try to load from import.meta.env first, then fall back to window.__SUPABASE_CONFIG__
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || (typeof window !== 'undefined' && (window as any).__SUPABASE_CONFIG__?.url)) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && (window as any).__SUPABASE_CONFIG__?.anonKey)) as string;

// ─── Database Type Definitions ───────────────────────────────────────────────

export interface ExamQuestion {
  id: string;
  text: string;
  type: "mcq" | "short_answer" | "true_false" | "practical" | "essay";
  options?: string[];
  correct_answer?: string | number;
  marks: number;
  critical_aspect?: string;
  regex_pattern?: string;
  keywords?: string[];
  evaluation_mode?: "objective" | "semi_objective" | "subjective";
  requires_trainer_review?: boolean;
}

export interface ExamSection {
  title: string;
  instructions: string;
  questions: ExamQuestion[];
  total_marks: number;
}

export interface ExamPayload {
  title: string;
  duration_minutes: number;
  total_marks: number;
  instructions: string;
  type?: "written" | "practical";
  class?: string;
  series?: string;
  section_a?: ExamSection;
  section_b?: ExamSection;
  project_brief?: string;
  elements_covered?: string[];
  tasks?: Array<{ id: string; title: string; marks: number; details: string[] }>;
  rubric?: Array<{ category: string; max_marks: number; criteria: Array<{ description: string; marks: number }> }>;
  checklist_items?: Array<{ id: string; task: string; criteria: string; marks: number; critical_aspect?: string }>;
}

export interface Exam {
  id: string;
  unit_code: string;
  course_name: string;
  payload: ExamPayload;
  created_at: string;
}

export interface StudentAnswer {
  question_id: string;
  answer: string | number;
  marks_awarded?: number;
  ai_reasoning?: string;
  flagged_for_review?: boolean;
}

export interface Submission {
  id: string;
  exam_id?: string;
  trainee_id?: string;
  unit_code: string;
  student_name: string;
  reg_number: string;
  student_email?: string;
  section_a: StudentAnswer[];
  section_b: StudentAnswer[];
  status: "pending" | "graded" | "reviewed" | "submitted" | "in_progress";
  total_score: number | null;
  trainer_comments?: string;
  submitted_at?: string;
  payload?: any;
  created_at: string;
  updated_at?: string;
}

export interface ScoreAuditEntry {
  id: string;
  submission_id: string;
  question_id: string;
  section: "A" | "B";
  original_score: number;
  new_score: number;
  override_reason?: string;
  changed_by: string;
  changed_at: string;
}

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: Exam;
        Insert: Omit<Exam, "id" | "created_at">;
        Update: Partial<Omit<Exam, "id" | "created_at">>;
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id" | "created_at">;
        Update: Partial<Omit<Submission, "id" | "created_at">>;
      };
      session_plans: {
        Row: {
          id: string;
          document_code: string;
          trainer_name: string;
          department: string;
          unit_name: string;
          unit_code: string;
          class_code: string;
          level: string;
          trainees_count: number;
          date: string;
          time_duration: string;
          week_number: number;
          session_title: string;
          learning_outcomes: any;
          resources: any;
          safety_requirements: string;
          introduction: string;
          delivery_steps: any;
          session_review: string;
          assignment: string;
          reflection: string;
          signature: string;
          signature_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          document_code?: string;
          trainer_name?: string;
          department?: string;
          unit_name?: string;
          unit_code?: string;
          class_code?: string;
          level?: string;
          trainees_count?: number;
          date?: string;
          time_duration?: string;
          week_number?: number;
          session_title?: string;
          learning_outcomes?: any;
          resources?: any;
          safety_requirements?: string;
          introduction?: string;
          delivery_steps?: any;
          session_review?: string;
          assignment?: string;
          reflection?: string;
          signature?: string;
          signature_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_code?: string;
          trainer_name?: string;
          department?: string;
          unit_name?: string;
          unit_code?: string;
          class_code?: string;
          level?: string;
          trainees_count?: number;
          date?: string;
          time_duration?: string;
          week_number?: number;
          session_title?: string;
          learning_outcomes?: any;
          resources?: any;
          safety_requirements?: string;
          introduction?: string;
          delivery_steps?: any;
          session_review?: string;
          assignment?: string;
          reflection?: string;
          signature?: string;
          signature_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_plans: {
        Row: {
          id: string;
          unit_code: string;
          unit_name: string;
          trainer_name: string;
          class_code: string;
          week_number: number;
          topic: string;
          learning_outcomes: any;
          resources: any;
          status: string;
          session_plan_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: any;
        Update: any;
      };
      records_of_work: {
        Row: {
          id: string;
          session_plan_id: string;
          unit_code: string;
          class_code: string;
          week_number: number;
          date_delivered: string;
          trainees_present: number;
          hours_covered: number;
          work_actually_covered: string;
          reflection: string;
          status: string;
          signature: string;
          signature_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: any;
        Update: any;
      };
      unit_offerings: {
        Row: {
          id: string;
          term_id: string;
          class_id: string;
          unit_id: string;
          trainer_id: string | null;
        };
        Insert: any;
        Update: any;
      };
      assessment_marks: {
        Row: {
          id: string;
          unit_offering_id: string;
          trainee_id: string;
          ct1: number | null;
          ct2: number | null;
          ct3: number | null;
          computed_average_theory: number | null;
          cp1: number | null;
          cp2: number | null;
          cp3: number | null;
          computed_average_practical: number | null;
          weighted_mark: number | null;
          is_locked: boolean;
        };
        Insert: any;
        Update: any;
      };
      assessment_evidence: {
        Row: {
          id: string;
          unit_offering_id: string;
          trainee_id: string;
          assessment_type: string;
          file_url: string;
          uploaded_by_id: string | null;
          verified_by_trainer: boolean;
          created_at?: string;
        };
        Insert: any;
        Update: any;
      };
    };
  };
}

// ─── Client Instance ─────────────────────────────────────────────────────────

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [MTTI] Supabase credentials not configured. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. " +
      "The app will run in demo mode with mock data."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// ─── Database State Verification ─────────────────────────────────────────────

export async function verifyDatabaseState() {
  console.group("🔍 [MTTI] Database State Verification");
  try {
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id, unit_code, course_name, created_at")
      .limit(5);

    if (examsError) {
      console.error("❌ Exams table:", examsError.message);
    } else {
      console.log(`✅ Exams table: ${exams?.length ?? 0} records (sample)`);
      console.table(exams);
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("id, unit_code, student_name, status, total_score, created_at")
      .limit(5);

    if (submissionsError) {
      console.error("❌ Submissions table:", submissionsError.message);
    } else {
      console.log(
        `✅ Submissions table: ${submissions?.length ?? 0} records (sample)`
      );
      console.table(submissions);
    }
  } catch (err) {
    console.error("❌ Database verification failed:", err);
  }
  console.groupEnd();
}

// ─── Helper: Check if Supabase is configured ─────────────────────────────────
export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co"
  );
}
