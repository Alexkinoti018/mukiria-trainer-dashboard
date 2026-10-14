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

export type AssessmentCategory = "CAT" | "Exam" | "Practical" | "Assignment" | "Project";

export interface ExamPayload {
  institution?: string;
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
  assessment_category?: AssessmentCategory;
  class?: string;
  target_cohorts?: string[];
  start_time?: string;
  end_time?: string;
  /** Whether the exam/CAT/assignment is published & visible on the Trainee Portal (defaults to true) */
  portal_visible?: boolean;
  /** ISO / datetime-local string when the assessment unlocks on the Trainee Portal */
  available_from?: string;
  /** ISO / datetime-local string when the assessment is due / closes */
  due_at?: string;
  /** Behavior after due_at passes */
  late_submission_policy?: "strict_lock" | "allow_flagged";
  /** Maximum attempts allowed per trainee (defaults to 1) */
  max_attempts?: number;
  /** Whether objective scores are shown immediately or held until trainer grading */
  release_results_mode?: "immediate_objective" | "after_trainer_grading";
  /** Whether live tab-switch & focus proctoring is enforced */
  proctoring_required?: boolean;
  section_a?: ExamSection;
  section_b?: ExamSection;
  project_brief?: string;
  elements_covered?: string[];
  tasks?: Array<{ id: string; title: string; marks: number; details: string[] }>;
  rubric?: Array<{ category: string; max_marks: number; criteria: Array<{ description: string; marks: number }> }>;
  checklist_items?: Array<{ id: string; task: string; criteria: string; marks: number; critical_aspect?: string }>;
}

export interface PortalAvailabilityStatus {
  isVisible: boolean;
  state: "hidden" | "scheduled" | "open" | "past_due_open" | "closed";
  canStart: boolean;
  statusLabel: string;
  availableFromFormatted: string | null;
  dueAtFormatted: string | null;
  categoryLabel: AssessmentCategory;
  latePolicy: "strict_lock" | "allow_flagged";
  maxAttempts: number;
}

/**
 * Normalizes any institutional cohort code/string by removing spaces, dashes, slashes, etc.
 * E.g., "FBS 5 MOD/J/2026" -> "FBS5MODJ2026", "FBS5/6/J/26" -> "FBS56J26"
 */
export function cleanCohortIdentifier(raw?: string): string {
  return (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Robust institutional cohort matching:
 * Returns true if a trainee's cohort matches an exam's target cohort tag or class code.
 * Handles combined cohorts (e.g. FBS5/6/J/26, ADMIN5/6/J/26, LS5/6/S/26, ICT4/ITECH6/S/26).
 */
export function doesCohortTagMatch(traineeCohort?: string, targetTag?: string): boolean {
  const tCohort = (traineeCohort || "").trim().toUpperCase();
  const tTag = (targetTag || "").trim().toUpperCase();
  if (!tCohort || !tTag) return false;

  // Wildcards
  if (tTag === "ALL" || tTag === "ALL COHORTS" || tTag === "CAMPUS-WIDE" || tTag === "ANY") {
    return true;
  }

  const cleanTrainee = cleanCohortIdentifier(tCohort);
  const cleanTarget = cleanCohortIdentifier(tTag);

  // Exact or cleaned equality
  if (tCohort === tTag || cleanTrainee === cleanTarget) return true;
  if (cleanTrainee.includes(cleanTarget) || cleanTarget.includes(cleanTrainee)) return true;

  // 1. Food & Beverage Sales / Hospitality Department:
  // Combined Institutional Cohort: "FBS5/6/J/26" (matches Level 5: "FBS 5 MOD/J/2026" & Level 6: "FBS6 MOD/12026")
  const isTraineeFBS =
    cleanTrainee.startsWith("FBS") ||
    cleanTrainee.startsWith("FBP") ||
    tCohort.includes("FOOD") ||
    tCohort.includes("BEVERAGE");
  const isTargetFBS =
    cleanTarget.startsWith("FBS") ||
    cleanTarget.startsWith("FBP") ||
    tTag.includes("FOOD") ||
    tTag.includes("BEVERAGE");
  if (isTraineeFBS && isTargetFBS) {
    // If target is combined FBS5/6 (e.g. "FBS5/6/J/26", "FBS56J26", "FBS 5/6", "FBS"):
    if (
      cleanTarget.includes("56") ||
      (cleanTarget.includes("5") && cleanTarget.includes("6")) ||
      (!cleanTarget.includes("5") && !cleanTarget.includes("6")) ||
      cleanTarget === "FBS" ||
      cleanTarget === "FBP"
    ) {
      return true;
    }
    // If target specifies Level 5 specifically:
    if (cleanTarget.includes("5") && !cleanTarget.includes("6")) {
      return cleanTrainee.includes("5");
    }
    // If target specifies Level 6 specifically:
    if (cleanTarget.includes("6") && !cleanTarget.includes("5")) {
      return cleanTrainee.includes("6");
    }
    return true;
  }

  // 2. Business / Office Administration Department:
  // Combined Institutional Cohort: "ADMIN5/6/J/26"
  const isTraineeAdmin = cleanTrainee.includes("ADMIN") || cleanTrainee.includes("BUS");
  const isTargetAdmin = cleanTarget.includes("ADMIN") || cleanTarget.includes("BUS");
  if (isTraineeAdmin && isTargetAdmin) {
    return true;
  }

  // 3. Building & Civil / Land Survey:
  // Combined Institutional Cohort: "LS5/6/S/26"
  const isTraineeLS = cleanTrainee.includes("LS") || cleanTrainee.includes("SURVEY") || cleanTrainee.includes("CIVIL");
  const isTargetLS = cleanTarget.includes("LS") || cleanTarget.includes("SURVEY") || cleanTarget.includes("CIVIL");
  if (isTraineeLS && isTargetLS) {
    return true;
  }

  // 4. Computing & Informatics (ITECH 6 vs ICT 4):
  const isTraineeICT = cleanTrainee.includes("ITECH") || cleanTrainee.includes("ICT") || cleanTrainee.includes("CSDP");
  const isTargetICT = cleanTarget.includes("ITECH") || cleanTarget.includes("ICT") || cleanTarget.includes("CSDP");
  if (isTraineeICT && isTargetICT) {
    if (
      (cleanTarget.includes("4") && cleanTarget.includes("6")) ||
      cleanTarget === "ICT" ||
      cleanTarget === "ITECH"
    ) {
      return true;
    }
    if (cleanTarget.includes("6")) {
      return cleanTrainee.includes("6") || cleanTrainee.includes("ITECH");
    }
    if (cleanTarget.includes("4")) {
      return cleanTrainee.includes("4");
    }
    return true;
  }

  return false;
}

export function doesExamMatchTraineeCohort(exam: Exam, cohortCode?: string, enrolledUnits?: string[]): boolean {
  const unitUpper = (exam.unit_code || "").trim().toUpperCase();

  // 1. Direct Enrolled Units Match
  if (enrolledUnits && enrolledUnits.length > 0) {
    if (
      enrolledUnits.some((u) => {
        const uUpper = u.trim().toUpperCase();
        return unitUpper === uUpper || unitUpper.startsWith(uUpper) || uUpper.startsWith(unitUpper);
      })
    ) {
      return true;
    }
  }

  const upperCohort = (cohortCode || "").trim().toUpperCase();
  if (!upperCohort) return false;

  // 2. Custom Target Cohorts (explicit tags set by Trainer in ExamBuilder)
  const customCohorts = exam.payload?.target_cohorts;
  if (customCohorts && customCohorts.length > 0) {
    return customCohorts.some((tag) => doesCohortTagMatch(upperCohort, tag));
  }

  // 3. Class Field on Exam Payload (e.g. "FBS5/6/J/26", "FBS5/6/J/25, LS5/6/S/25", "ADMIN5/6/J/26")
  const examClass = (exam.payload?.class || "").trim().toUpperCase();
  if (examClass) {
    // If comma-separated or slash-separated classes, check each token
    const classTokens = examClass.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    if (classTokens.some((tok) => doesCohortTagMatch(upperCohort, tok))) {
      return true;
    }
    if (doesCohortTagMatch(upperCohort, examClass)) {
      return true;
    }
  }

  // 4. Department / Course Name Match
  const courseUpper = (exam.course_name || "").toUpperCase();
  const deptUpper = (exam.payload?.department || "").toUpperCase();
  const isFBS = upperCohort.includes("FBS") || upperCohort.includes("FBP");
  if (
    isFBS &&
    (courseUpper.includes("FOOD") || courseUpper.includes("BEVERAGE") || deptUpper.includes("HOSPITALITY"))
  ) {
    return true;
  }
  const isAdmin = upperCohort.includes("ADMIN");
  if (isAdmin && (courseUpper.includes("OFFICE ADMIN") || deptUpper.includes("BUSINESS"))) {
    return true;
  }
  const isLS = upperCohort.includes("LS") || upperCohort.includes("SURVEY");
  if (isLS && (courseUpper.includes("LAND SURVEY") || deptUpper.includes("BUILDING"))) {
    return true;
  }

  // 5. Institutional Common Curriculum Mapping
  if (unitUpper.startsWith("061155101A")) {
    // Apply Digital Literacy is common to FBS (Food & Beverage), LS (Land Survey), and CSDP
    return isFBS || isLS || upperCohort.includes("CSDP") || upperCohort.includes("ADMIN");
  }
  if (unitUpper.startsWith("0415-451-21A") || unitUpper.startsWith("0415 451 21A")) {
    return isAdmin;
  }
  if (unitUpper.startsWith("IT/CU/ICTA/CR/01/4/MA")) {
    return upperCohort.includes("ICT4") || upperCohort.includes("ICTT");
  }
  if (unitUpper.startsWith("IT/CU/ICTA/CR/01/6/MA")) {
    return upperCohort.includes("ITECH 6") || upperCohort.includes("ICT6") || upperCohort.includes("CSDP");
  }

  return false;
}

export function evaluateExamPortalAvailability(
  payload: ExamPayload,
  now: Date = new Date()
): PortalAvailabilityStatus {
  // STRICT ANTI-LEAKAGE POLICY: Assessments are hidden from trainees unless explicitly allocated (portal_visible === true)
  const isVisible = payload.portal_visible === true;
  const latePolicy = payload.late_submission_policy || "strict_lock";
  const maxAttempts = payload.max_attempts && payload.max_attempts > 0 ? payload.max_attempts : 1;

  const formatDt = (raw?: string): string | null => {
    if (!raw || !raw.trim()) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const availableFromRaw = payload.available_from || payload.start_time;
  const dueAtRaw = payload.due_at || payload.end_time;
  const availableFromDate = availableFromRaw ? new Date(availableFromRaw) : null;
  const dueAtDate = dueAtRaw ? new Date(dueAtRaw) : null;

  const derivedCategory: AssessmentCategory =
    payload.assessment_category ||
    (payload.type === "practical"
      ? "Practical"
      : (payload.task_code || "").toUpperCase().startsWith("CT") ||
        (payload.title || "").toUpperCase().includes("CAT") ||
        (payload.title || "").toUpperCase().includes("WRITTEN ASSESSMENT")
      ? "CAT"
      : "Exam");

  if (!isVisible) {
    return {
      isVisible: false,
      state: "hidden",
      canStart: false,
      statusLabel: "Not Allocated to Trainee Portal",
      availableFromFormatted: formatDt(availableFromRaw),
      dueAtFormatted: formatDt(dueAtRaw),
      categoryLabel: derivedCategory,
      latePolicy,
      maxAttempts,
    };
  }

  if (availableFromDate && !isNaN(availableFromDate.getTime()) && now < availableFromDate) {
    return {
      isVisible: true,
      state: "scheduled",
      canStart: false,
      statusLabel: `Scheduled • Opens ${formatDt(availableFromRaw)}`,
      availableFromFormatted: formatDt(availableFromRaw),
      dueAtFormatted: formatDt(dueAtRaw),
      categoryLabel: derivedCategory,
      latePolicy,
      maxAttempts,
    };
  }

  if (dueAtDate && !isNaN(dueAtDate.getTime()) && now > dueAtDate) {
    if (latePolicy === "allow_flagged") {
      return {
        isVisible: true,
        state: "past_due_open",
        canStart: true,
        statusLabel: `Past Due (${formatDt(dueAtRaw)}) • Late Submission Allowed`,
        availableFromFormatted: formatDt(availableFromRaw),
        dueAtFormatted: formatDt(dueAtRaw),
        categoryLabel: derivedCategory,
        latePolicy,
        maxAttempts,
      };
    }
    return {
      isVisible: true,
      state: "closed",
      canStart: false,
      statusLabel: `Closed • Due ${formatDt(dueAtRaw)}`,
      availableFromFormatted: formatDt(availableFromRaw),
      dueAtFormatted: formatDt(dueAtRaw),
      categoryLabel: derivedCategory,
      latePolicy,
      maxAttempts,
    };
  }

  return {
    isVisible: true,
    state: "open",
    canStart: true,
    statusLabel: dueAtRaw ? `Open • Due ${formatDt(dueAtRaw)}` : "Open on Trainee Portal",
    availableFromFormatted: formatDt(availableFromRaw),
    dueAtFormatted: formatDt(dueAtRaw),
    categoryLabel: derivedCategory,
    latePolicy,
    maxAttempts,
  };
}

export interface Exam {
  id: string;
  unit_code: string;
  unit_id?: string;
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
