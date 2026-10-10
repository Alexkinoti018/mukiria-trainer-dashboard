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
  q_num?: number;
  text: string;
  type: "mcq" | "short_answer" | "true_false" | "practical" | "essay" | "structured" | "oral";
  options?: string[];
  correct_answer?: string | number;
  marks: number;
  critical_aspect?: string;
  regex_pattern?: string;
  keywords?: string[];
  evaluation_mode?: "objective" | "semi_objective" | "subjective";
  requires_trainer_review?: boolean;
  breakdown?: Array<{ criterion: string; marks: number }>;
  sub_parts?: any[];
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
  series?: string;
  department?: string;
  course_code?: string;
  course_name?: string;
  unit_name?: string;
  time_allowed?: string;
  type?: "written" | "practical";
  task_code?: string;
  assessment_type?: string;
  class?: string;
  start_time?: string;
  end_time?: string;
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
  notes?: string;
  flagged_for_review?: boolean;
}

export type AssessmentTaskSlot =
  | "CT1"
  | "CT2"
  | "CT3"
  | "CP1"
  | "CP2"
  | "CP3"
  | "Project"
  | "Assignment";

export function normalizeAssessmentTaskSlot(
  rawTaskCode?: string,
  unitCode?: string,
  title?: string,
  examType?: string
): AssessmentTaskSlot {
  const code = (rawTaskCode || "").trim().toUpperCase();
  if (code === "CT1" || code === "CAT1" || code === "CAT 1" || code === "EXAM 1" || code === "WA1") return "CT1";
  if (code === "CT2" || code === "CAT2" || code === "CAT 2" || code === "CAT" || code === "CATS" || code === "EXAM 2" || code === "WA2") return "CT2";
  if (code === "CT3" || code === "CAT3" || code === "CAT 3" || code === "EXAM 3" || code === "WA3") return "CT3";
  if (code === "CP1" || code === "PRAC 1" || code === "PRACTICAL 1" || code === "PA1" || code === "OBSERVATION CHECKLIST") return "CP1";
  if (code === "CP2" || code === "PRAC 2" || code === "PRACTICAL 2" || code === "PA2") return "CP2";
  if (code === "CP3" || code === "PRAC 3" || code === "PRACTICAL 3" || code === "PA3") return "CP3";
  if (code.includes("PROJ")) return "Project";
  if (code.includes("ASSIGN")) return "Assignment";

  const combined = `${unitCode || ""} ${title || ""} ${rawTaskCode || ""}`.toUpperCase();
  if (combined.includes("PROJECT")) return "Project";
  if (combined.includes("ASSIGNMENT")) return "Assignment";

  const isPractical =
    examType === "practical" ||
    combined.includes("PRAC") ||
    combined.includes("PRACTICAL") ||
    combined.includes("OBSERVATION") ||
    combined.includes("CHECKLIST") ||
    combined.includes("-PA") ||
    combined.includes("CP1") ||
    combined.includes("CP2") ||
    combined.includes("CP3");

  if (isPractical) {
    if (combined.includes("3") || combined.includes("THREE") || combined.includes("CP3") || combined.includes("PA3")) return "CP3";
    if (combined.includes("2") || combined.includes("TWO") || combined.includes("CP2") || combined.includes("PA2")) return "CP2";
    return "CP1";
  }

  if (combined.includes("WA3") || combined.includes("ASSESSMENT 3") || combined.includes("EXAM 3") || combined.includes("CAT 3") || combined.includes("CT3")) return "CT3";
  if (combined.includes("WA2") || combined.includes("ASSESSMENT 2") || combined.includes("EXAM 2") || combined.includes("CAT 2") || combined.includes("CT2")) return "CT2";
  return "CT1";
}

export interface Submission {
  id: string;
  exam_id?: string;
  trainee_id?: string;
  unit_code: string;
  task_code?: string;
  assessment_type?: string;
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

if (typeof globalThis.WebSocket === "undefined") {
  class FallbackWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    readyState = 3;
    url = "";
    protocol = "";
    extensions = "";
    bufferedAmount = 0;
    binaryType: BinaryType = "blob";
    onopen: ((ev: any) => any) | null = null;
    onerror: ((ev: any) => any) | null = null;
    onclose: ((ev: any) => any) | null = null;
    onmessage: ((ev: any) => any) | null = null;
    constructor(url?: string | URL) {
      this.url = url ? String(url) : "";
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return false;
    }
  }
  (globalThis as any).WebSocket = FallbackWebSocket;
}

export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
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
