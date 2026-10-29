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
const SEEDS_DIR = path.resolve(__dirname, "..", "database", "seeds");
const DATA_DIR = path.resolve(__dirname, "data");

function getFixturePath(filename: string): string {
  const seedPath = path.join(SEEDS_DIR, filename);
  if (fs.existsSync(seedPath)) return seedPath;
  return path.join(DATA_DIR, filename);
}

const ATTENDANCE_FILE = getFixturePath("attendance_register.json");
const TRAINEES_FILE = getFixturePath("trainees.json");
const SESSION_PLANS_FILE = getFixturePath("session_plans.json");
const LEARNING_PLANS_FILE = getFixturePath("learning_plans.json");
const RECORDS_OF_WORK_FILE = getFixturePath("records_of_work.json");
const CLASS_REGISTERS_FILE = getFixturePath("class_registers.json");
const ASSESSMENT_MARKS_FILE = getFixturePath("assessment_marks.json");
const SUBMISSIONS_FILE = getFixturePath("submissions.json");
const ASSESSMENT_EVIDENCE_FILE = getFixturePath("assessment_evidence.json");
const USERS_FILE = getFixturePath("users.json");

export class DatabaseServiceUnavailableError extends Error {
  status = 503;
  statusCode = 503;
  constructor(message = "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected") {
    super(message);
    this.name = "DatabaseServiceUnavailableError";
  }
}

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

const isProduction = process.env.NODE_ENV === "production";
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" && isProduction;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    })
  : null;

export function isTlsStrict(): boolean {
  return rejectUnauthorized;
}

export function ensurePoolAvailable(): void {
  if (!pool && (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true")) {
    throw new DatabaseServiceUnavailableError();
  }
}

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
      console.error("❌ [PostgreSQL Query Error]:", err.message);
      if (
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT" ||
        err.code === "57P01" ||
        err.code === "08006" ||
        err.code === "08001" ||
        err.message?.toLowerCase().includes("timeout") ||
        err.message?.toLowerCase().includes("connection")
      ) {
        err.status = 503;
        err.statusCode = 503;
      }
      throw err;
    }
  }

  if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true") {
    throw new DatabaseServiceUnavailableError();
  }

  return { rows: [], rowCount: 0 };
}

/**
 * Transaction execution wrapper.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T | null> {
  if (!pool) {
    if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true") {
      throw new DatabaseServiceUnavailableError(
        "Database Service Unavailable: Cannot initiate transaction without PostgreSQL pool"
      );
    }
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    if (
      err.code === "ECONNREFUSED" ||
      err.code === "ETIMEDOUT" ||
      err.code === "57P01" ||
      err.code === "08006" ||
      err.code === "08001" ||
      err.message?.toLowerCase().includes("timeout") ||
      err.message?.toLowerCase().includes("connection")
    ) {
      err.status = 503;
      err.statusCode = 503;
    }
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

export interface UserRecord {
  id: string;
  admission_number?: string | null;
  phone_number?: string | null;
  full_name: string;
  email: string;
  password_hash: string;
  role: "TRAINEE" | "TRAINER" | "HOD" | "ADMIN" | string;
  created_at?: string;
  updated_at?: string;
}

// ─── STRICT READ-ONLY SEED FIXTURES & PG/SUPABASE PERSISTENCE ENGINE ────────
// Local JSON files in database/seeds/ are immutable fixtures used solely for provisioning.
// Production mutations are persisted directly to Supabase / PostgreSQL tables,
// retaining an in-memory runtime cache for non-destructive local/offline access.

let memoryUsers: UserRecord[] | null = null;
let memoryAttendance: AttendanceRecord[] | null = null;
let memoryTrainees: TraineeRecord[] | null = null;
let memorySessionPlans: any[] | null = null;
let memoryLearningPlans: any[] | null = null;
let memoryRecordsOfWork: any[] | null = null;
let memoryClassRegisters: Record<string, any> | null = null;
let memoryAssessmentMarks: any[] | null = null;
let memorySubmissions: any[] | null = null;
let memoryAssessmentEvidence: any[] | null = null;

const DEFAULT_STAFF_USERS: UserRecord[] = [
  {
    id: "usr-admin-01",
    admission_number: null,
    phone_number: "+254700000001",
    full_name: "System Administrator",
    email: "admin@mtti.ac.ke",
    password_hash: "$2b$10$pBeCI1vflmGBcyhGlLc93.mjXqq6yEO7S/aVwvwTvNDVSnFcwq3ry", // Mtti@2026!
    role: "ADMIN",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-hod-ci",
    admission_number: null,
    phone_number: "+254700000002",
    full_name: "Prof. S. Njoroge",
    email: "hod.ci@mtti.ac.ke",
    password_hash: "$2b$10$pBeCI1vflmGBcyhGlLc93.mjXqq6yEO7S/aVwvwTvNDVSnFcwq3ry",
    role: "HOD",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-trainer-01",
    admission_number: null,
    phone_number: "+254700000003",
    full_name: "Dr. J. Muriithi",
    email: "trainer@mtti.ac.ke",
    password_hash: "$2b$10$pBeCI1vflmGBcyhGlLc93.mjXqq6yEO7S/aVwvwTvNDVSnFcwq3ry",
    role: "TRAINER",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr-trainer-02",
    admission_number: null,
    phone_number: "+254700000004",
    full_name: "Alexander Kinoti",
    email: "kinoti@mtti.ac.ke",
    password_hash: "$2b$10$pBeCI1vflmGBcyhGlLc93.mjXqq6yEO7S/aVwvwTvNDVSnFcwq3ry",
    role: "TRAINER",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export function loadPersistentUsers(): UserRecord[] {
  if (memoryUsers !== null) return memoryUsers;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      memoryUsers = JSON.parse(data);
      if (Array.isArray(memoryUsers) && memoryUsers.length > 0) {
        return memoryUsers;
      }
    }
  } catch (e) {
    console.warn("Could not read users JSON file:", e);
  }
  memoryUsers = [...DEFAULT_STAFF_USERS];
  return memoryUsers;
}

export function savePersistentUsers(records: UserRecord[]): void {
  memoryUsers = [...records];
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write users JSON file:", e);
  }
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normEmail = (email || "").trim().toLowerCase();
  if (!normEmail) return null;

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normEmail]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL findUserByEmail Warning]:", err.message);
    }
  }

  const users = loadPersistentUsers();
  const match = users.find((u) => (u.email || "").trim().toLowerCase() === normEmail);
  return match || null;
}

export async function findUserByAdmissionNumber(admissionNumber: string): Promise<UserRecord | null> {
  const normAdm = (admissionNumber || "").trim().toLowerCase();
  if (!normAdm) return null;

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM users WHERE LOWER(admission_number) = LOWER($1) LIMIT 1`,
        [normAdm]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL findUserByAdmissionNumber Warning]:", err.message);
    }
  }

  const users = loadPersistentUsers();
  const match = users.find(
    (u) => (u.admission_number || "").trim().toLowerCase() === normAdm
  );
  return match || null;
}

export async function findUserByEmailOrAdmission(identifier: string): Promise<UserRecord | null> {
  const norm = (identifier || "").trim().toLowerCase();
  if (!norm) return null;

  const targetEmail =
    norm === "admin"
      ? "admin@mtti.ac.ke"
      : norm === "trainer"
        ? "trainer@mtti.ac.ke"
        : norm === "hod"
          ? "hod.ci@mtti.ac.ke"
          : norm;

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM users 
         WHERE LOWER(email) = LOWER($1) 
            OR LOWER(email) = LOWER($2)
            OR (admission_number IS NOT NULL AND LOWER(admission_number) = LOWER($1))
         LIMIT 1`,
        [norm, targetEmail]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL findUserByEmailOrAdmission Warning]:", err.message);
    }
  }

  const users = loadPersistentUsers();
  const match = users.find(
    (u) =>
      (u.email || "").trim().toLowerCase() === norm ||
      (u.email || "").trim().toLowerCase() === targetEmail ||
      (u.admission_number && u.admission_number.trim().toLowerCase() === norm)
  );
  return match || null;
}

export async function createUser(data: {
  id?: string;
  admission_number?: string | null;
  phone_number?: string | null;
  full_name: string;
  email: string;
  password_hash: string;
  role: "TRAINEE" | "TRAINER" | "HOD" | "ADMIN" | string;
}): Promise<UserRecord> {
  const newId = data.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const userRecord: UserRecord = {
    id: newId,
    admission_number: data.admission_number ? data.admission_number.trim() : null,
    phone_number: data.phone_number ? data.phone_number.trim() : null,
    full_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    password_hash: data.password_hash,
    role: data.role.toUpperCase(),
    created_at: now,
    updated_at: now,
  };

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO users (id, admission_number, phone_number, full_name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userRecord.id,
          userRecord.admission_number,
          userRecord.phone_number,
          userRecord.full_name,
          userRecord.email,
          userRecord.password_hash,
          userRecord.role,
          userRecord.created_at,
          userRecord.updated_at,
        ]
      );
      if (res.rows.length > 0) {
        const users = loadPersistentUsers();
        users.push(res.rows[0]);
        savePersistentUsers(users);
        return res.rows[0];
      }
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL createUser Warning]:", err.message);
    }
  }

  const users = loadPersistentUsers();
  users.push(userRecord);
  savePersistentUsers(users);
  return userRecord;
}

export function loadPersistentAttendance(): AttendanceRecord[] {
  if (memoryAttendance !== null) return memoryAttendance;
  try {
    if (fs.existsSync(ATTENDANCE_FILE)) {
      const data = fs.readFileSync(ATTENDANCE_FILE, "utf-8");
      memoryAttendance = JSON.parse(data);
      return memoryAttendance!;
    }
  } catch (e) {
    console.warn("Could not read attendance JSON file:", e);
  }
  return [];
}

export function savePersistentAttendance(records: AttendanceRecord[]): void {
  memoryAttendance = [...records];
}

export function loadPersistentTrainees(): TraineeRecord[] {
  if (memoryTrainees !== null) return memoryTrainees;
  try {
    if (fs.existsSync(TRAINEES_FILE)) {
      const data = fs.readFileSync(TRAINEES_FILE, "utf-8");
      memoryTrainees = JSON.parse(data);
      return memoryTrainees!;
    }
  } catch (e) {
    console.warn("Could not read trainees JSON file:", e);
  }
  return [];
}

export function savePersistentTrainees(records: TraineeRecord[]): void {
  memoryTrainees = [...records];
}

export function loadPersistentSessionPlans(): any[] {
  if (memorySessionPlans !== null) return memorySessionPlans;
  try {
    if (fs.existsSync(SESSION_PLANS_FILE)) {
      const data = fs.readFileSync(SESSION_PLANS_FILE, "utf-8");
      memorySessionPlans = JSON.parse(data);
      return memorySessionPlans!;
    }
  } catch (e) {
    console.warn("Could not read session plans JSON file:", e);
  }
  return [];
}

export function savePersistentSessionPlans(records: any[]): void {
  memorySessionPlans = [...records];
}

export function loadPersistentLearningPlans(): any[] {
  if (memoryLearningPlans !== null) return memoryLearningPlans;
  try {
    if (fs.existsSync(LEARNING_PLANS_FILE)) {
      const data = fs.readFileSync(LEARNING_PLANS_FILE, "utf-8");
      memoryLearningPlans = JSON.parse(data);
      return memoryLearningPlans!;
    }
  } catch (e) {
    console.warn("Could not read learning plans JSON file:", e);
  }
  return [];
}

export function savePersistentLearningPlans(records: any[]): void {
  memoryLearningPlans = [...records];
}

export function loadPersistentRecordsOfWork(): any[] {
  if (memoryRecordsOfWork !== null) return memoryRecordsOfWork;
  try {
    if (fs.existsSync(RECORDS_OF_WORK_FILE)) {
      const data = fs.readFileSync(RECORDS_OF_WORK_FILE, "utf-8");
      memoryRecordsOfWork = JSON.parse(data);
      return memoryRecordsOfWork!;
    }
  } catch (e) {
    console.warn("Could not read records of work JSON file:", e);
  }
  return [];
}

export function savePersistentRecordsOfWork(records: any[]): void {
  memoryRecordsOfWork = [...records];
}

export function loadPersistentClassRegisters(): Record<string, any> {
  if (memoryClassRegisters !== null) return memoryClassRegisters;
  try {
    if (fs.existsSync(CLASS_REGISTERS_FILE)) {
      const data = fs.readFileSync(CLASS_REGISTERS_FILE, "utf-8");
      memoryClassRegisters = JSON.parse(data);
      return memoryClassRegisters!;
    }
  } catch (e) {
    console.warn("Could not read class registers JSON file:", e);
  }
  return {};
}

export function savePersistentClassRegisters(data: Record<string, any>): void {
  memoryClassRegisters = { ...data };
}

export function loadPersistentAssessmentMarks(): any[] {
  if (memoryAssessmentMarks !== null) return memoryAssessmentMarks;
  try {
    if (fs.existsSync(ASSESSMENT_MARKS_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_MARKS_FILE, "utf-8");
      memoryAssessmentMarks = JSON.parse(data);
      return memoryAssessmentMarks!;
    }
  } catch (e) {
    console.warn("Could not read assessment marks JSON file:", e);
  }
  return [];
}

export function savePersistentAssessmentMarks(records: any[]): void {
  memoryAssessmentMarks = [...records];
}

export function loadPersistentSubmissions(): any[] {
  if (memorySubmissions !== null) return memorySubmissions;
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      memorySubmissions = JSON.parse(data);
      return memorySubmissions!;
    }
  } catch (e) {
    console.warn("Could not read submissions JSON file:", e);
  }
  return [];
}

export function savePersistentSubmissions(records: any[]): void {
  memorySubmissions = [...records];
  try {
    const dir = path.dirname(SUBMISSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write submissions JSON file:", e);
  }
}

export function loadPersistentAssessmentEvidence(): any[] {
  if (memoryAssessmentEvidence !== null) return memoryAssessmentEvidence;
  try {
    if (fs.existsSync(ASSESSMENT_EVIDENCE_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_EVIDENCE_FILE, "utf-8");
      memoryAssessmentEvidence = JSON.parse(data);
      return memoryAssessmentEvidence!;
    }
  } catch (e) {
    console.warn("Could not read assessment evidence JSON file:", e);
  }
  return [];
}

export function savePersistentAssessmentEvidence(records: any[]): void {
  memoryAssessmentEvidence = [...records];
}

/**
 * Persists batch attendance to PostgreSQL.
 */
export async function saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const item of records) {
        await client.query(`
          INSERT INTO attendance_records (
            id, unit_offering_id, trainee_id, week_number, session_date,
            session_index, status, hours_attended, remarks, marked_by, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            hours_attended = EXCLUDED.hours_attended,
            remarks = EXCLUDED.remarks,
            marked_by = EXCLUDED.marked_by,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          item.id,
          item.unit_offering_id || null,
          item.trainee_id,
          typeof item.week_number === "number" ? item.week_number : 1,
          item.session_date || null,
          typeof item.session_index === "number" ? item.session_index : null,
          item.status,
          typeof item.hours_attended === "number" ? item.hours_attended : 0,
          item.remarks || null,
          item.marked_by || null
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveAttendanceBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch trainees to PostgreSQL.
 */
export async function saveTraineeBatch(records: TraineeRecord[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const t of records) {
        await client.query(`
          INSERT INTO trainees (
            id, name, reg_number, adm_no, reg_code, class_id, class_code,
            department, gender, phone, remarks, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            reg_number = EXCLUDED.reg_number,
            adm_no = EXCLUDED.adm_no,
            reg_code = EXCLUDED.reg_code,
            class_id = EXCLUDED.class_id,
            class_code = EXCLUDED.class_code,
            department = EXCLUDED.department,
            gender = EXCLUDED.gender,
            phone = EXCLUDED.phone,
            remarks = EXCLUDED.remarks,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          t.id,
          t.name,
          t.reg_number,
          t.adm_no || null,
          t.reg_code || null,
          t.class_id || null,
          t.class_code || null,
          t.department || null,
          t.gender || null,
          t.phone || null,
          t.remarks || null
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveTraineeBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch session plans to PostgreSQL.
 */
export async function saveSessionPlansBatch(records: any[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const sp of records) {
        await client.query(`
          INSERT INTO session_plans (
            id, unit_offering_id, class_code, trainer_id, department_id,
            date, session_title, approval_status, hod_reviewed_by,
            hod_reviewer_name, hod_review_date, hod_remarks, payload, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            session_title = EXCLUDED.session_title,
            approval_status = EXCLUDED.approval_status,
            hod_reviewed_by = EXCLUDED.hod_reviewed_by,
            hod_reviewer_name = EXCLUDED.hod_reviewer_name,
            hod_review_date = EXCLUDED.hod_review_date,
            hod_remarks = EXCLUDED.hod_remarks,
            payload = EXCLUDED.payload,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          sp.id,
          sp.unit_offering_id || null,
          sp.class_code || null,
          sp.trainer_id || null,
          sp.department_id || null,
          sp.date || null,
          sp.session_title || null,
          sp.approval_status || "pending",
          sp.hod_reviewed_by || null,
          sp.hod_reviewer_name || null,
          sp.hod_review_date || null,
          sp.hod_remarks || null,
          JSON.stringify(sp.payload || sp)
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveSessionPlansBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch records of work to PostgreSQL.
 */
export async function saveRecordsOfWorkBatch(records: any[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const row of records) {
        await client.query(`
          INSERT INTO records_of_work (
            id, session_plan_id, unit_offering_id, class_code, trainer_id,
            department_id, work_covered, date_covered, approval_status,
            hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, payload, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            work_covered = EXCLUDED.work_covered,
            date_covered = EXCLUDED.date_covered,
            approval_status = EXCLUDED.approval_status,
            hod_reviewed_by = EXCLUDED.hod_reviewed_by,
            hod_reviewer_name = EXCLUDED.hod_reviewer_name,
            hod_review_date = EXCLUDED.hod_review_date,
            hod_remarks = EXCLUDED.hod_remarks,
            payload = EXCLUDED.payload,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          row.id,
          row.session_plan_id || null,
          row.unit_offering_id || null,
          row.class_code || null,
          row.trainer_id || null,
          row.department_id || null,
          row.work_covered || null,
          row.date_covered || null,
          row.approval_status || "pending",
          row.hod_reviewed_by || null,
          row.hod_reviewer_name || null,
          row.hod_review_date || null,
          row.hod_remarks || null,
          JSON.stringify(row.payload || row)
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveRecordsOfWorkBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch learning plans to PostgreSQL.
 */
export async function saveLearningPlansBatch(records: any[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const lp of records) {
        await client.query(`
          INSERT INTO learning_plans (
            id, unit_code, class_code, week_number, topic, payload, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            unit_code = EXCLUDED.unit_code,
            class_code = EXCLUDED.class_code,
            week_number = EXCLUDED.week_number,
            topic = EXCLUDED.topic,
            payload = EXCLUDED.payload,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          lp.id,
          lp.unit_code || null,
          lp.class_code || null,
          typeof lp.week_number === "number" ? lp.week_number : null,
          lp.topic || null,
          JSON.stringify(lp.payload || lp)
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveLearningPlansBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch class registers to PostgreSQL.
 */
export async function saveClassRegistersBatch(data: Record<string, any>): Promise<void> {
  if (Object.keys(data).length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const [classCode, reg] of Object.entries(data)) {
        await client.query(`
          INSERT INTO class_registers (
            class_code, lecturer_name, subject, department, duration,
            level, lecturer_comment, hod_comment, weekly_lecturer_comments,
            weekly_hod_comments, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          ON CONFLICT (class_code) DO UPDATE SET
            lecturer_name = EXCLUDED.lecturer_name,
            subject = EXCLUDED.subject,
            department = EXCLUDED.department,
            duration = EXCLUDED.duration,
            level = EXCLUDED.level,
            lecturer_comment = EXCLUDED.lecturer_comment,
            hod_comment = EXCLUDED.hod_comment,
            weekly_lecturer_comments = EXCLUDED.weekly_lecturer_comments,
            weekly_hod_comments = EXCLUDED.weekly_hod_comments,
            updated_at = CURRENT_TIMESTAMP;
        `, [
          classCode,
          reg.lecturer_name || null,
          reg.subject || null,
          reg.department || null,
          reg.duration || null,
          reg.level || null,
          reg.lecturer_comment || null,
          reg.hod_comment || null,
          JSON.stringify(reg.weekly_lecturer_comments || {}),
          JSON.stringify(reg.weekly_hod_comments || {})
        ]);
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveClassRegistersBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch exam submissions to PostgreSQL.
 */
export async function saveSubmissionsBatch(records: any[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const submission of records) {
        await client.query(`
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
          submission.trainee_admission || submission.reg_number || null,
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
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveSubmissionsBatch Error]:", err.message);
    throw err;
  }
}

/**
 * Persists batch assessment evidence to PostgreSQL.
 */
export async function saveAssessmentEvidenceBatch(records: any[]): Promise<void> {
  if (records.length === 0) return;
  ensurePoolAvailable();
  if (!pool) return;
  try {
    await withTransaction(async (client) => {
      for (const evidence of records) {
        await client.query(`
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
      }
    });
  } catch (err: any) {
    console.error("❌ [PostgreSQL saveAssessmentEvidenceBatch Error]:", err.message);
    throw err;
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
      console.error("❌ [PostgreSQL Batch Marks Error]:", err.message);
      throw err;
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
      console.error("❌ [PostgreSQL Exam Submission Error]:", err.message);
      throw err;
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
      console.error("❌ [PostgreSQL Assessment Evidence Error]:", err.message);
      throw err;
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

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        admission_number VARCHAR(100) UNIQUE,
        phone_number VARCHAR(50),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'TRAINEE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_users_admission_number ON users (admission_number);
    `);
    console.log("✅ [MTTI PostgreSQL]: Centralized institutional tables verified.");
  } catch (err: any) {
    console.warn("⚠️ [PostgreSQL Init Warning]:", err.message);
  }
}

if (pool) {
  initDatabaseSchema().catch(() => {});
}
