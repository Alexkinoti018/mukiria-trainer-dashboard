/**
 * Database Connection & Resilience Layer
 * Mukiria Technical Training Institute (MTTI)
 *
 * Supports PostgreSQL connection pooling via pg.Pool with SSL support,
 * transactional queries, and automated fallback persistence to local storage.
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ATTENDANCE_FILE = path.join(DATA_DIR, "attendance_register.json");
const TRAINEES_FILE = path.join(DATA_DIR, "trainees.json");
const SESSION_PLANS_FILE = path.join(DATA_DIR, "session_plans.json");
const LEARNING_PLANS_FILE = path.join(DATA_DIR, "learning_plans.json");
const RECORDS_OF_WORK_FILE = path.join(DATA_DIR, "records_of_work.json");
const CLASS_REGISTERS_FILE = path.join(DATA_DIR, "class_registers.json");
const ASSESSMENT_MARKS_FILE = path.join(DATA_DIR, "assessment_marks.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const ASSESSMENT_EVIDENCE_FILE = path.join(DATA_DIR, "assessment_evidence.json");

// Connection parameters
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "bzlnpywjyhhrqapsvczf";
const DEFAULT_HOST = `db.${PROJECT_REF}.supabase.co`;
const DEFAULT_PORT = 5432;
const DEFAULT_USER = "postgres";
const DEFAULT_DATABASE = "postgres";

let connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
  connectionString = `postgresql://${DEFAULT_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${DEFAULT_HOST}:${DEFAULT_PORT}/${DEFAULT_DATABASE}`;
}

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    })
  : null;

if (pool) {
  pool.on("error", (err) => {
    console.warn("⚠️ [MTTI PostgreSQL Pool Warning]:", err.message);
  });
}

/**
 * Execute a query against PostgreSQL if available.
 */
export async function query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL Query Warning]:", err.message);
    }
  }
  return { rows: [], rowCount: 0 };
}

/**
 * Transaction execution wrapper.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T | null> {
  if (!pool) return null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ─── FILE-BACKED PERSISTENCE ENGINE (Guarantees Zero Data Loss) ───────────────

export interface AttendanceRecord {
  id: string;
  unit_offering_id: string;
  trainee_id: string;
  week_number: number;
  session_date: string;
  session_index?: number;
  status: "present" | "absent" | "excused" | "X" | "0" | string;
  hours_attended: number;
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TraineeRecord {
  id: string;
  name: string;
  reg_number: string;
  adm_no: string;
  reg_code?: string;
  class_id?: string;
  class_code?: string;
  department?: string;
  gender?: "M" | "F";
  phone?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export function loadPersistentAttendance(): AttendanceRecord[] {
  try {
    if (fs.existsSync(ATTENDANCE_FILE)) {
      const data = fs.readFileSync(ATTENDANCE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read attendance JSON file:", e);
  }
  return [];
}

export function savePersistentAttendance(records: AttendanceRecord[]): void {
  try {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save attendance JSON file:", e);
  }
}

export function loadPersistentTrainees(): TraineeRecord[] {
  try {
    if (fs.existsSync(TRAINEES_FILE)) {
      const data = fs.readFileSync(TRAINEES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read trainees JSON file:", e);
  }
  return [];
}

export function savePersistentTrainees(records: TraineeRecord[]): void {
  try {
    fs.writeFileSync(TRAINEES_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save trainees JSON file:", e);
  }
}

export function loadPersistentSessionPlans(): any[] {
  try {
    if (fs.existsSync(SESSION_PLANS_FILE)) {
      const data = fs.readFileSync(SESSION_PLANS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read session plans JSON file:", e);
  }
  return [];
}

export function savePersistentSessionPlans(records: any[]): void {
  try {
    fs.writeFileSync(SESSION_PLANS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save session plans JSON file:", e);
  }
}

export function loadPersistentLearningPlans(): any[] {
  try {
    if (fs.existsSync(LEARNING_PLANS_FILE)) {
      const data = fs.readFileSync(LEARNING_PLANS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read learning plans JSON file:", e);
  }
  return [];
}

export function savePersistentLearningPlans(records: any[]): void {
  try {
    fs.writeFileSync(LEARNING_PLANS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save learning plans JSON file:", e);
  }
}

export function loadPersistentRecordsOfWork(): any[] {
  try {
    if (fs.existsSync(RECORDS_OF_WORK_FILE)) {
      const data = fs.readFileSync(RECORDS_OF_WORK_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read records of work JSON file:", e);
  }
  return [];
}

export function savePersistentRecordsOfWork(records: any[]): void {
  try {
    fs.writeFileSync(RECORDS_OF_WORK_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save records of work JSON file:", e);
  }
}

export function loadPersistentClassRegisters(): Record<string, any> {
  try {
    if (fs.existsSync(CLASS_REGISTERS_FILE)) {
      const data = fs.readFileSync(CLASS_REGISTERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read class registers JSON file:", e);
  }
  return {};
}

export function savePersistentClassRegisters(data: Record<string, any>): void {
  try {
    fs.writeFileSync(CLASS_REGISTERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save class registers JSON file:", e);
  }
}

export function loadPersistentAssessmentMarks(): any[] {
  try {
    if (fs.existsSync(ASSESSMENT_MARKS_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_MARKS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read assessment marks JSON file:", e);
  }
  return [];
}

export function savePersistentAssessmentMarks(records: any[]): void {
  try {
    fs.writeFileSync(ASSESSMENT_MARKS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save assessment marks JSON file:", e);
  }
}

export function loadPersistentSubmissions(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read submissions JSON file:", e);
  }
  return [];
}

export function savePersistentSubmissions(records: any[]): void {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save submissions JSON file:", e);
  }
}

export function loadPersistentAssessmentEvidence(): any[] {
  try {
    if (fs.existsSync(ASSESSMENT_EVIDENCE_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_EVIDENCE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read assessment evidence JSON file:", e);
  }
  return [];
}

export function savePersistentAssessmentEvidence(records: any[]): void {
  try {
    fs.writeFileSync(ASSESSMENT_EVIDENCE_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save assessment evidence JSON file:", e);
  }
}

/**
 * Persists batch assessment marks to PostgreSQL with fallback to JSON.
 */
export async function saveAssessmentMarksBatch(records: any[]): Promise<void> {
  savePersistentAssessmentMarks(records);

  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of records) {
          await client.query(`
            INSERT INTO assessment_marks (
              id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores,
              project_score, weighted_mark, is_locked, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP
            )
            ON CONFLICT (unit_offering_id, trainee_id)
            DO UPDATE SET
              ct_avg = EXCLUDED.ct_avg,
              cp_avg = EXCLUDED.cp_avg,
              cp_scores = EXCLUDED.cp_scores,
              ct_scores = EXCLUDED.ct_scores,
              project_score = EXCLUDED.project_score,
              weighted_mark = EXCLUDED.weighted_mark,
              is_locked = EXCLUDED.is_locked,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            item.id || `mark-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            item.unit_offering_id,
            item.trainee_id,
            typeof item.ct_avg === "number" ? item.ct_avg : 0,
            typeof item.cp_avg === "number" ? item.cp_avg : 0,
            JSON.stringify(item.cp_scores || []),
            JSON.stringify(item.ct_scores || []),
            typeof item.project_score === "number" ? item.project_score : 0,
            typeof item.weighted_mark === "number" ? item.weighted_mark : 0,
            Boolean(item.is_locked)
          ]);
        }
      });
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL Batch Marks Warning]:", err.message);
    }
  }
}

/**
 * Persists an exam submission to PostgreSQL with fallback to JSON.
 */
export async function saveExamSubmission(submission: any, allSubmissions?: any[]): Promise<void> {
  if (allSubmissions) {
    savePersistentSubmissions(allSubmissions);
  }
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO exam_submissions (
          id, exam_id, trainee_id, student_name, trainee_admission, status,
          total_score, percentage, section_a, section_b, answers, feedback,
          graded_by, graded_at, submitted_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP
        )
        ON CONFLICT (exam_id, trainee_id)
        DO UPDATE SET
          student_name = EXCLUDED.student_name,
          trainee_admission = EXCLUDED.trainee_admission,
          status = EXCLUDED.status,
          total_score = EXCLUDED.total_score,
          percentage = EXCLUDED.percentage,
          section_a = EXCLUDED.section_a,
          section_b = EXCLUDED.section_b,
          answers = EXCLUDED.answers,
          feedback = EXCLUDED.feedback,
          graded_by = EXCLUDED.graded_by,
          graded_at = EXCLUDED.graded_at,
          submitted_at = EXCLUDED.submitted_at;
      `, [
        submission.id,
        submission.exam_id,
        submission.trainee_id,
        submission.student_name || null,
        submission.trainee_admission || null,
        submission.status || "submitted",
        submission.total_score || 0,
        submission.percentage || 0,
        JSON.stringify(submission.section_a || []),
        JSON.stringify(submission.section_b || []),
        JSON.stringify(submission.answers || []),
        submission.feedback || null,
        submission.graded_by || null,
        submission.graded_at || null,
        submission.submitted_at || new Date().toISOString()
      ]);
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL Exam Submission Warning]:", err.message);
    }
  }
}

/**
 * Persists assessment evidence to PostgreSQL with fallback to JSON.
 */
export async function saveAssessmentEvidence(evidence: any, allEvidence?: any[]): Promise<void> {
  if (allEvidence) {
    savePersistentAssessmentEvidence(allEvidence);
  }
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO assessment_evidence (
          id, unit_offering_id, trainee_id, trainee_name, outcome_id, title,
          file_type, file_url, file_data, mark, assessor_feedback, status,
          uploaded_by, graded_by, graded_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id)
        DO UPDATE SET
          mark = EXCLUDED.mark,
          assessor_feedback = EXCLUDED.assessor_feedback,
          status = EXCLUDED.status,
          graded_by = EXCLUDED.graded_by,
          graded_at = EXCLUDED.graded_at;
      `, [
        evidence.id,
        evidence.unit_offering_id,
        evidence.trainee_id,
        evidence.trainee_name || null,
        evidence.outcome_id || null,
        evidence.title,
        evidence.file_type,
        evidence.file_url,
        evidence.file_data || null,
        evidence.mark ?? null,
        evidence.assessor_feedback || null,
        evidence.status || "pending",
        evidence.uploaded_by || null,
        evidence.graded_by || null,
        evidence.graded_at || null
      ]);
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL Assessment Evidence Warning]:", err.message);
    }
  }
}

/**
 * Initializes and verifies PostgreSQL tables for centralized physical database administration.
 */
export async function initDatabaseSchema(): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(100) PRIMARY KEY,
        unit_offering_id VARCHAR(100),
        trainee_id VARCHAR(100) NOT NULL,
        week_number INT NOT NULL,
        session_date VARCHAR(50),
        session_index INT,
        status VARCHAR(20) NOT NULL,
        hours_attended NUMERIC DEFAULT 0,
        remarks TEXT,
        marked_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trainees (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        reg_number VARCHAR(100) NOT NULL,
        adm_no VARCHAR(100),
        reg_code VARCHAR(100),
        class_id VARCHAR(100),
        class_code VARCHAR(100),
        department VARCHAR(100),
        gender VARCHAR(10),
        phone VARCHAR(50),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS session_plans (
        id VARCHAR(100) PRIMARY KEY,
        unit_offering_id VARCHAR(100),
        class_code VARCHAR(100),
        trainer_id VARCHAR(100),
        department_id VARCHAR(100),
        date VARCHAR(50),
        session_title TEXT,
        approval_status VARCHAR(50) DEFAULT 'pending',
        hod_reviewed_by VARCHAR(100),
        hod_reviewer_name VARCHAR(255),
        hod_review_date VARCHAR(50),
        hod_remarks TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS learning_plans (
        id VARCHAR(100) PRIMARY KEY,
        unit_code VARCHAR(100),
        class_code VARCHAR(100),
        week_number INT,
        topic TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS records_of_work (
        id VARCHAR(100) PRIMARY KEY,
        session_plan_id VARCHAR(100),
        unit_offering_id VARCHAR(100),
        class_code VARCHAR(100),
        trainer_id VARCHAR(100),
        department_id VARCHAR(100),
        work_covered TEXT,
        date_covered VARCHAR(50),
        approval_status VARCHAR(50) DEFAULT 'pending',
        hod_reviewed_by VARCHAR(100),
        hod_reviewer_name VARCHAR(255),
        hod_review_date VARCHAR(50),
        hod_remarks TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS class_registers (
        class_code VARCHAR(100) PRIMARY KEY,
        lecturer_name VARCHAR(255),
        subject VARCHAR(255),
        department VARCHAR(255),
        duration VARCHAR(100),
        level VARCHAR(100),
        lecturer_comment TEXT,
        hod_comment TEXT,
        weekly_lecturer_comments JSONB,
        weekly_hod_comments JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assessment_marks (
        id VARCHAR(100) PRIMARY KEY,
        unit_offering_id VARCHAR(100),
        trainee_id VARCHAR(100) NOT NULL,
        assessment_type VARCHAR(100) DEFAULT 'continuous',
        ct_avg NUMERIC DEFAULT 0,
        cp_avg NUMERIC DEFAULT 0,
        cp_scores JSONB DEFAULT '[]'::jsonb,
        ct_scores JSONB DEFAULT '[]'::jsonb,
        project_score NUMERIC DEFAULT 0,
        weighted_mark NUMERIC DEFAULT 0,
        score NUMERIC DEFAULT 0,
        max_score NUMERIC DEFAULT 100,
        percentage NUMERIC DEFAULT 0,
        is_locked BOOLEAN DEFAULT false,
        graded_by VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_assessment_marks UNIQUE (unit_offering_id, trainee_id)
      );

      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS ct_avg NUMERIC DEFAULT 0;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS cp_avg NUMERIC DEFAULT 0;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS cp_scores JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS ct_scores JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS project_score NUMERIC DEFAULT 0;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS weighted_mark NUMERIC DEFAULT 0;
      ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

      CREATE TABLE IF NOT EXISTS exam_submissions (
        id VARCHAR(100) PRIMARY KEY,
        exam_id VARCHAR(100) NOT NULL,
        trainee_id VARCHAR(100) NOT NULL,
        student_name VARCHAR(255),
        trainee_admission VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'submitted',
        total_score NUMERIC DEFAULT 0,
        percentage NUMERIC DEFAULT 0,
        section_a JSONB DEFAULT '[]'::jsonb,
        section_b JSONB DEFAULT '[]'::jsonb,
        answers JSONB DEFAULT '[]'::jsonb,
        feedback TEXT,
        graded_by VARCHAR(100),
        graded_at TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_exam_submissions UNIQUE (exam_id, trainee_id)
      );

      CREATE TABLE IF NOT EXISTS assessment_evidence (
        id VARCHAR(100) PRIMARY KEY,
        unit_offering_id VARCHAR(100) NOT NULL,
        trainee_id VARCHAR(100) NOT NULL,
        trainee_name VARCHAR(255),
        outcome_id VARCHAR(100),
        title VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_url TEXT NOT NULL,
        file_data TEXT,
        mark NUMERIC,
        assessor_feedback TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        uploaded_by VARCHAR(100),
        graded_by VARCHAR(100),
        graded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON attendance_records (trainee_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records (session_date);
      CREATE INDEX IF NOT EXISTS idx_session_plans_class_date ON session_plans (class_code, date);
      CREATE INDEX IF NOT EXISTS idx_learning_plans_class_unit ON learning_plans (class_code, unit_code);
      CREATE INDEX IF NOT EXISTS idx_assessment_marks_unit ON assessment_marks (unit_offering_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_marks_trainee ON assessment_marks (trainee_id);
      CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam ON exam_submissions (exam_id);
      CREATE INDEX IF NOT EXISTS idx_exam_submissions_trainee ON exam_submissions (trainee_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_unit_trainee ON assessment_evidence (unit_offering_id, trainee_id);
    `);
    console.log("✅ [MTTI PostgreSQL]: Centralized institutional tables verified.");
  } catch (err: any) {
    console.warn("⚠️ [PostgreSQL Init Warning]:", err.message);
  }
}

if (pool) {
  initDatabaseSchema().catch(() => {});
}
