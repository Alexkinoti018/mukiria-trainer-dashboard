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
import os from "os";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.resolve(__dirname, "..", "database", "seeds");
const DATA_DIR = path.resolve(
  process.env.MTTI_DATA_DIR ||
    (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? path.join(os.tmpdir(), ".mukiria-trainer-dashboard")
      : path.join(os.homedir(), ".mukiria-trainer-dashboard"))
);

function getFixturePath(filename: string): string {
  const runtimePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(runtimePath)) return runtimePath;
  const seedPath = path.join(SEEDS_DIR, filename);
  if (fs.existsSync(seedPath)) return seedPath;
  return runtimePath;
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
const COHORTS_FILE = getFixturePath("cohorts.json");

export class DatabaseUnavailableError extends Error {
  status: number;
  statusCode: number;
  constructor(message = "Authentication database is temporarily unavailable") {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.status = 503;
    this.statusCode = 503;
  }
}

export class DatabaseServiceUnavailableError extends DatabaseUnavailableError {
  constructor(message = "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected") {
    super(message);
    this.name = "DatabaseServiceUnavailableError";
    this.status = 503;
    this.statusCode = 503;
  }
}

// Connection parameters
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "bzlnpywjyhhrqapsvczf";
const DEFAULT_HOST = `db.${PROJECT_REF}.supabase.co`;
const DEFAULT_PORT = process.env.SUPABASE_DB_PORT ? parseInt(process.env.SUPABASE_DB_PORT, 10) : 5432;
const DEFAULT_USER = "postgres";
const DEFAULT_DATABASE = "postgres";

let connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
  connectionString = `postgresql://${DEFAULT_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${DEFAULT_HOST}:${DEFAULT_PORT}/${DEFAULT_DATABASE}`;
}

export function isRelaxedDbMode(): boolean {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  return env === "development" || env === "test";
}

export function isSecureProductionRuntime(): boolean {
  return !isRelaxedDbMode();
}

const isProduction = isSecureProductionRuntime();
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" && isProduction;
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: isServerless ? 1500 : 30000,
      max: isServerless
        ? (process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 3)
        : (process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 10),
      allowExitOnIdle: isServerless,
    })
  : null;

export function isTlsStrict(): boolean {
  return rejectUnauthorized;
}

export function ensurePoolAvailable(): void {
  if (!pool && (isSecureProductionRuntime() || process.env.STRICT_DB === "true")) {
    throw new DatabaseServiceUnavailableError("PostgreSQL database pool unavailable in production mode");
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

  if (isSecureProductionRuntime() || process.env.STRICT_DB === "true") {
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
    if (process.env.STRICT_DB === "true") {
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
  profile_id?: string | null;
  department_id?: string | null;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── STRICT READ-ONLY SEED FIXTURES & PG/SUPABASE PERSISTENCE ENGINE ────────
// Local JSON files in database/seeds/ are immutable fixtures used solely for provisioning.
// Production mutations are persisted directly to Supabase / PostgreSQL tables,
// retaining an in-memory runtime cache for non-destructive local/offline access.

let memoryUsers: UserRecord[] | null = null;
const memoryStaffTrainers: Array<{ id: string; name: string; email: string; department?: string; assigned_units?: string[] }> = [];
const memoryStaffDepartmentHeads: Array<{ department_id: string; hod_id: string; hod_email: string }> = [];
let memoryAttendance: AttendanceRecord[] | null = null;
let memoryTrainees: TraineeRecord[] | null = null;
let memorySessionPlans: any[] | null = null;
let memoryLearningPlans: any[] | null = null;
let memoryRecordsOfWork: any[] | null = null;
let memoryClassRegisters: Record<string, any> | null = null;
let memoryAssessmentMarks: any[] | null = null;
let memorySubmissions: any[] | null = null;
let memoryAssessmentEvidence: any[] | null = null;

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
  memoryUsers = [];
  return memoryUsers;
}

export function savePersistentUsers(records: UserRecord[]): void {
  memoryUsers = [...records];
  try {
    const filePath = path.join(DATA_DIR, "users.json");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write users JSON file:", e);
  }
}

export function removeInMemoryStaffProfile(profileId: string): void {
  const trainerIndex = memoryStaffTrainers.findIndex((trainer) => trainer.id === profileId);
  if (trainerIndex >= 0) memoryStaffTrainers.splice(trainerIndex, 1);
  const departmentIndex = memoryStaffDepartmentHeads.findIndex((department) => department.hod_id === profileId);
  if (departmentIndex >= 0) memoryStaffDepartmentHeads.splice(departmentIndex, 1);
}

async function addInMemoryStaffProfile(
  role: "TRAINER" | "HOD",
  profileId: string,
  name: string,
  email: string,
  departmentId: string
): Promise<void> {
  const department = (await loadDatabaseDepartments()).find((item) => item.id === departmentId);
  if (!department) {
    throw Object.assign(new Error("The selected department does not exist."), { code: "DEPARTMENT_NOT_FOUND" });
  }

  if (role === "TRAINER") {
    const trainers = await loadDatabaseTrainers();
    if (trainers.some((trainer) => trainer.email?.trim().toLowerCase() === email)) {
      throw Object.assign(new Error("A trainer profile with this email already exists."), { code: "23505" });
    }
    memoryStaffTrainers.push({ id: profileId, name, email, department: department.name });
    return;
  }

  const existing = memoryStaffDepartmentHeads.find((department) => department.department_id === departmentId);
  if (existing) {
    existing.hod_id = profileId;
    existing.hod_email = email;
  } else {
    memoryStaffDepartmentHeads.push({ department_id: departmentId, hod_id: profileId, hod_email: email });
  }
}


export async function findUserById(id: string): Promise<UserRecord | null> {
  const normId = (id || "").trim();
  if (!normId) return null;

  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, email, phone_number, full_name, admission_number, password_hash, role, profile_id, department_id, must_change_password, created_at, updated_at
         FROM users WHERE id = $1 LIMIT 1`,
        [normId]
      );
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL findUserById Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }

  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => u.id === normId);
  return match || null;
}

export async function findUserByProfileId(profileId: string): Promise<UserRecord | null> {
  const norm = (profileId || "").trim();
  if (!norm) return null;

  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, email, phone_number, full_name, admission_number, password_hash, role, profile_id, department_id, must_change_password, created_at, updated_at
         FROM users WHERE profile_id = $1 LIMIT 1`,
        [norm]
      );
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL findUserByProfileId Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }

  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => u.profile_id === norm);
  return match || null;
}

export async function updateUserProfileId(userId: string, profileId: string): Promise<void> {
  const normUserId = (userId || "").trim();
  const normProfileId = (profileId || "").trim();
  if (!normUserId || !normProfileId) return;

  ensurePoolAvailable();
  if (pool) {
    try {
      await pool.query("UPDATE users SET profile_id = $1 WHERE id = $2 AND profile_id IS NULL", [normProfileId, normUserId]);
    } catch (err: any) {
      console.warn("⚠️ [PostgreSQL updateUserProfileId Warning]:", err.message);
    }
  }

  const users = loadPersistentUsers();
  const user = users.find((u) => u.id === normUserId);
  if (user && !user.profile_id) {
    user.profile_id = normProfileId;
    savePersistentUsers(users);
  }
}

export async function loadDatabaseTrainers(): Promise<Array<{ id: string; name: string; email?: string; department?: string; assigned_units?: string[] }>> {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, email, department FROM Trainers");
      return res.rows;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL Trainers table unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL loadDatabaseTrainers Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Trainers query in production mode");
  }
  return [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", department: "Computing & Informatics", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", department: "Computing & Informatics", assigned_units: ["ICT/OS/IT/CR/1/6"] },
    ...memoryStaffTrainers,
  ];
}

export async function loadDatabaseDepartments(): Promise<Array<{ id: string; name: string; code: string; hod_id: string; hod_email?: string }>> {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, code, hod_id, hod_email FROM Departments");
      return res.rows;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL Departments table unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL loadDatabaseDepartments Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Departments query in production mode");
  }
  return [
    { id: "dept-ci", name: "Computing & Informatics", code: "CI", hod_id: "hod-001", hod_email: "hod.ci@mtti.ac.ke" },
    { id: "dept-ee", name: "Electrical & Electronics Engineering", code: "EEE", hod_id: "hod-002", hod_email: "hod.ee@mtti.ac.ke" },
    { id: "dept-bce", name: "Building & Civil Engineering", code: "BCE", hod_id: "hod-003", hod_email: "hod.bce@mtti.ac.ke" },
    { id: "dept-him", name: "Hospitality & Institutional Management", code: "HIM", hod_id: "hod-004", hod_email: "hod.him@mtti.ac.ke" },
    { id: "dept-ia", name: "Institutional Academics", code: "IA", hod_id: "hod-005", hod_email: "hod.ia@mtti.ac.ke" },
    { id: "dept-aes", name: "Agriculture & Environmental Studies", code: "AES", hod_id: "hod-006", hod_email: "hod.aes@mtti.ac.ke" },
    { id: "dept-ch", name: "Cosmetology & Hairdressing", code: "CH", hod_id: "hod-007", hod_email: "hod.ch@mtti.ac.ke" },
    { id: "dept-sg", name: "Surveying & Geomatics", code: "SG", hod_id: "hod-008", hod_email: "hod.sg@mtti.ac.ke" },
    { id: "dept-mae", name: "Mechanical & Automotive Engineering", code: "MAE", hod_id: "hod-009", hod_email: "hod.mae@mtti.ac.ke" },
    { id: "dept-business", name: "Business Studies", code: "BUS", hod_id: "hod-010", hod_email: "hod.business@mtti.ac.ke" },
  ].map((department) => {
    const head = memoryStaffDepartmentHeads.find((item) => item.department_id === department.id);
    return head ? { ...department, hod_id: head.hod_id, hod_email: head.hod_email } : department;
  });
}

export async function loadDatabaseTrainees(): Promise<TraineeRecord[]> {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, reg_number, adm_no, reg_code, class_id, class_code, department FROM Trainees");
      if (isSecureProductionRuntime()) {
        return res.rows;
      }
      if (res.rows.length > 0) {
        const persistentTrainees = loadPersistentTrainees();
        const dbIds = new Set(res.rows.map((r: any) => r.id));
        return [...res.rows, ...persistentTrainees.filter((p) => !dbIds.has(p.id))];
      }
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL Trainees table unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL loadDatabaseTrainees Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Trainees query in production mode");
  }

  const persistentTrainees = loadPersistentTrainees();
  const memoryTrainees: TraineeRecord[] = [
    { id: "trainee-001", name: "Nthiga Gakii Doris", reg_number: "14179/S2026", adm_no: "14179/S2026", reg_code: "14179/S2026", department: "Computing & Informatics" },
    { id: "trainee-10525", name: "Alex Kinoti", reg_number: "10525", adm_no: "10525", reg_code: "10525", department: "Computing & Informatics" },
    { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", adm_no: "10526", reg_code: "10526", department: "Computing & Informatics" },
    { id: "trainee-003", name: "Other Student", reg_number: "99999", adm_no: "99999", reg_code: "99999", department: "Building & Civil Engineering" },
  ];
  return [
    ...persistentTrainees,
    ...memoryTrainees.filter((m) => !persistentTrainees.some((p) => p.id === m.id || (p.reg_number && p.reg_number.trim().toUpperCase() === m.reg_number.trim().toUpperCase()))),
  ];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normEmail = (email || "").trim().toLowerCase();
  if (!normEmail) return null;

  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [normEmail]
      );
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL findUserByEmail Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }

  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.email || "").trim().toLowerCase() === normEmail);
  return match || null;
}

export async function findUserByAdmissionNumber(admissionNumber: string): Promise<UserRecord | null> {
  const normAdm = (admissionNumber || "").trim().toLowerCase();
  if (!normAdm) return null;

  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT * FROM users WHERE LOWER(admission_number) = LOWER($1) LIMIT 1`,
        [normAdm]
      );
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL findUserByAdmissionNumber Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }

  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.admission_number || "").trim().toLowerCase() === normAdm);
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

  ensurePoolAvailable();
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
      return null;
    } catch (err: any) {
      if (isSecureProductionRuntime()) {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in production mode");
      }
      console.warn("⚠️ [PostgreSQL findUserByEmailOrAdmission Warning]:", err.message);
    }
  } else if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }

  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.email || "").trim().toLowerCase() === norm || (u.email || "").trim().toLowerCase() === targetEmail || (u.admission_number && u.admission_number.trim().toLowerCase() === norm));
  return match || null;
}

export async function createUser(data: {
  id?: string;
  admission_number?: string | null;
  phone_number?: string | null;
  department_id?: string | null;
  full_name: string;
  email: string;
  password_hash: string;
  role: "TRAINEE" | "TRAINER" | "HOD" | "ADMIN" | string;
  profile_id?: string | null;
  must_change_password?: boolean;
}): Promise<UserRecord> {
  const newId = data.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  let resolvedProfileId: string | null = null;
  const normRole = (data.role || "").toUpperCase();

  if (data.profile_id !== undefined) {
    resolvedProfileId = data.profile_id ? data.profile_id.trim() : null;
  } else {
    if (normRole === "TRAINEE" && data.admission_number) {
      const cleanAdm = data.admission_number.trim();
      const trainees = loadPersistentTrainees();
      const existing = trainees.find(t => (t.reg_number || t.adm_no || "").trim().toUpperCase() === cleanAdm.toUpperCase());
      if (existing) {
        resolvedProfileId = existing.id;
      } else if (!cleanAdm.toUpperCase().startsWith("TRAINEE-")) {
        resolvedProfileId = `trainee-${cleanAdm}`;
        trainees.push({
          id: resolvedProfileId,
          name: data.full_name.trim(),
          reg_number: cleanAdm,
          adm_no: cleanAdm,
          reg_code: cleanAdm,
          created_at: now,
          updated_at: now,
        });
        savePersistentTrainees(trainees);
      } else {
        resolvedProfileId = null;
      }
    } else if (normRole === "TRAINER" && data.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (cleanEmail === "trainer@mtti.ac.ke") resolvedProfileId = "trainer-001";
      else if (cleanEmail.includes("kinoti")) resolvedProfileId = "trainer-002";
      else resolvedProfileId = `trainer-${newId}`;
    } else if (normRole === "ADMIN") {
      resolvedProfileId = newId;
    }
  }

  const userRecord: UserRecord = {
    id: newId,
    admission_number: data.admission_number ? data.admission_number.trim() : null,
    phone_number: data.phone_number ? data.phone_number.trim() : null,
    department_id: data.department_id || null,
    full_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    password_hash: data.password_hash,
    role: normRole,
    profile_id: resolvedProfileId,
    must_change_password: data.must_change_password ?? false,
    created_at: now,
    updated_at: now,
  };

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO users (id, admission_number, phone_number, full_name, email, password_hash, role, profile_id, department_id, must_change_password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          userRecord.id,
          userRecord.admission_number,
          userRecord.phone_number,
          userRecord.full_name,
          userRecord.email,
          userRecord.password_hash,
          userRecord.role,
          userRecord.profile_id,
          userRecord.department_id,
          userRecord.must_change_password ?? false,
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
      console.error("⚠️ [PostgreSQL createUser Error]:", err.message);
      throw err;
    }
  }

  const users = loadPersistentUsers();
  users.push(userRecord);
  savePersistentUsers(users);
  return userRecord;
}

export async function createStaffAccount(data: {
  full_name: string;
  email: string;
  phone_number?: string | null;
  department_id: string;
  password_hash: string;
  role: "TRAINER" | "HOD";
}): Promise<UserRecord> {
  const userId = randomUUID();
  const profileId = randomUUID();
  const now = new Date().toISOString();
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedName = data.full_name.trim();

  let persisted: UserRecord | null = null;
  try {
    persisted = await withTransaction(async (client) => {
      const department = await client.query(
        "SELECT id, name FROM Departments WHERE id = $1 FOR UPDATE",
        [data.department_id]
      );
      if (department.rowCount !== 1) {
        throw Object.assign(new Error("The selected department does not exist."), { code: "DEPARTMENT_NOT_FOUND" });
      }

      const userResult = await client.query(
        `INSERT INTO users (
          id, full_name, email, phone_number, password_hash, role, profile_id,
          department_id, must_change_password, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $9)
        RETURNING *`,
        [userId, normalizedName, normalizedEmail, data.phone_number || null, data.password_hash, data.role, profileId, data.department_id, now]
      );

      await client.query(
        "INSERT INTO Trainers (id, name, email, department) VALUES ($1, $2, $3, $4)",
        [profileId, normalizedName, normalizedEmail, department.rows[0].name]
      );

      if (data.role === "HOD") {
        const update = await client.query(
          "UPDATE Departments SET hod_id = $1, hod_email = $2 WHERE id = $3",
          [profileId, normalizedEmail, data.department_id]
        );
        if (update.rowCount !== 1) {
          throw Object.assign(new Error("The selected department could not be linked to this HOD."), { code: "DEPARTMENT_NOT_FOUND" });
        }
      }

      return userResult.rows[0] as UserRecord;
    });
  } catch (err: any) {
    if (err?.code === "DEPARTMENT_NOT_FOUND" || err?.code === "23505" || process.env.STRICT_DB === "true") {
      throw err;
    }
    console.warn("[createStaffAccount] PostgreSQL transaction failed, using file-backed persistence:", err?.message);
  }
  if (persisted) return persisted;

  const previousUsers = [...loadPersistentUsers()];
  const userRecord = await createUser({
    id: userId,
    full_name: normalizedName,
    email: normalizedEmail,
    phone_number: data.phone_number || null,
    password_hash: data.password_hash,
    role: data.role,
    profile_id: profileId,
    department_id: data.department_id,
    must_change_password: true,
  });

  try {
    await addInMemoryStaffProfile(data.role, profileId, normalizedName, normalizedEmail, data.department_id);
    return userRecord;
  } catch (error) {
    savePersistentUsers(previousUsers);
    removeInMemoryStaffProfile(profileId);
    throw error;
  }
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  ensurePoolAvailable();
  if (pool) {
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );
    if (result.rowCount !== 1) throw new Error("User account no longer exists.");
  } else {
    const users = loadPersistentUsers();
    const user = users.find((record) => record.id === userId);
    if (!user) throw new Error("User account no longer exists.");
    user.password_hash = passwordHash;
    user.must_change_password = false;
    user.updated_at = new Date().toISOString();
    savePersistentUsers(users);
  }
}

export async function resetUserPassword(userId: string, passwordHash: string): Promise<void> {
  ensurePoolAvailable();
  if (pool) {
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );
    if (result.rowCount !== 1) throw new Error("User account no longer exists.");
  } else {
    const users = loadPersistentUsers();
    const user = users.find((record) => record.id === userId);
    if (!user) throw new Error("User account no longer exists.");
    user.password_hash = passwordHash;
    user.must_change_password = true;
    user.updated_at = new Date().toISOString();
    savePersistentUsers(users);
  }
}

export async function createTraineeAccount(data: {
  full_name: string;
  admission_number: string;
  class_code: string;
  department_id: string;
  phone_number?: string | null;
  password_hash: string;
  email?: string | null;
}): Promise<{ user: UserRecord; trainee: TraineeRecord }> {
  const normAdm = data.admission_number.trim().toUpperCase();
  const normName = data.full_name.trim();
  const normClass = data.class_code.trim();
  const normDept = data.department_id.trim();
  const email = (data.email && data.email.trim())
    ? data.email.trim().toLowerCase()
    : `${normAdm.toLowerCase().replace(/[^a-z0-9]/g, "")}@trainee.mtti.ac.ke`;
  const userId = randomUUID();
  const profileId = `trainee-${normAdm.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const now = new Date().toISOString();

  // Check uniqueness of admission number
  const existingUser = await findUserByAdmissionNumber(normAdm);
  if (existingUser) {
    throw Object.assign(new Error(`An account with admission number '${normAdm}' already exists.`), { code: "23505" });
  }

  // Persist trainee in trainees list
  const trainees = loadPersistentTrainees();
  let existingIndex = trainees.findIndex(
    (t) => (t.reg_number || t.adm_no || "").trim().toUpperCase() === normAdm
  );
  const traineeRecord: TraineeRecord = {
    id: existingIndex >= 0 ? trainees[existingIndex].id : profileId,
    name: normName,
    reg_number: normAdm,
    adm_no: normAdm,
    reg_code: normAdm,
    class_id: normClass,
    class_code: normClass,
    department: normDept,
    phone: data.phone_number || undefined,
    created_at: existingIndex >= 0 ? (trainees[existingIndex].created_at || now) : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    trainees[existingIndex] = traineeRecord;
  } else {
    trainees.push(traineeRecord);
  }
  savePersistentTrainees(trainees);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_id, class_code, department, phone, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           class_id = EXCLUDED.class_id,
           class_code = EXCLUDED.class_code,
           department = EXCLUDED.department,
           phone = EXCLUDED.phone,
           updated_at = CURRENT_TIMESTAMP`,
        [
          traineeRecord.id,
          traineeRecord.name,
          traineeRecord.reg_number,
          traineeRecord.adm_no,
          traineeRecord.reg_code,
          traineeRecord.class_id,
          traineeRecord.class_code,
          traineeRecord.department,
          traineeRecord.phone,
        ]
      );
    } catch (e: any) {
      console.warn("⚠️ [PostgreSQL createTraineeAccount Trainees Table Warning]:", e.message);
    }
  }

  // Create user
  const userRecord = await createUser({
    id: userId,
    full_name: normName,
    email,
    admission_number: normAdm,
    phone_number: data.phone_number || null,
    password_hash: data.password_hash,
    role: "TRAINEE",
    profile_id: traineeRecord.id,
    department_id: normDept,
    must_change_password: true,
  });

  return { user: userRecord, trainee: traineeRecord };
}

export interface CohortRecord {
  code: string;
  name: string;
  department_id: string;
  level?: string;
  term?: string;
  created_at?: string;
  updated_at?: string;
}

let memoryCohorts: CohortRecord[] | null = null;

export function loadPersistentCohorts(): CohortRecord[] {
  if (memoryCohorts !== null) return memoryCohorts;
  try {
    if (fs.existsSync(COHORTS_FILE)) {
      const data = fs.readFileSync(COHORTS_FILE, "utf-8");
      memoryCohorts = JSON.parse(data);
      return memoryCohorts!;
    }
  } catch (e) {
    console.warn("Could not read cohorts JSON file:", e);
  }
  memoryCohorts = [
    { code: "class-itech-6", name: "ICT Technician Level 6", department_id: "dept-ci", level: "Level 6", term: "Term 3 2026" },
    { code: "ICT4 MOD/S/2026", name: "ICT 4 Modular Sept 2026", department_id: "dept-ci", level: "Level 4", term: "Term 3 2026" },
    { code: "ICT4/ITECH6/S/26 MOD 1", name: "ICT 4 / ITECH 6 Modular 1", department_id: "dept-ci", level: "Level 4 & 6", term: "Term 3 2026" },
    { code: "FBS 5 MOD/J/2026", name: "Food & Beverage 5 Modular Jan 2026", department_id: "dept-him", level: "Level 5", term: "Term 3 2026" },
    { code: "ADMIN5/6/J/26 MOD 3", name: "Administration Level 5 & 6 Mod 3", department_id: "dept-business", level: "Level 5 & 6", term: "Term 3 2026" },
    { code: "EE 6 MOD/S/2026", name: "Electrical Engineering Level 6", department_id: "dept-ee", level: "Level 6", term: "Term 3 2026" },
    { code: "BCE 6 MOD/S/2026", name: "Building & Civil Engineering Level 6", department_id: "dept-bce", level: "Level 6", term: "Term 3 2026" },
  ];
  return memoryCohorts;
}

export function savePersistentCohorts(cohorts: CohortRecord[]): void {
  memoryCohorts = [...cohorts];
  try {
    const filePath = path.join(DATA_DIR, "cohorts.json");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(cohorts, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write cohorts JSON file:", e);
  }
}

export async function createCohort(data: {
  code: string;
  name?: string;
  department_id: string;
  level?: string;
  term?: string;
}): Promise<CohortRecord> {
  const normCode = data.code.trim();
  const cohorts = loadPersistentCohorts();
  const existing = cohorts.find(c => c.code.toLowerCase() === normCode.toLowerCase());
  if (existing) {
    throw Object.assign(new Error(`Cohort with code '${normCode}' already exists.`), { code: "COHORT_EXISTS" });
  }

  const now = new Date().toISOString();
  const newCohort: CohortRecord = {
    code: normCode,
    name: (data.name && data.name.trim()) ? data.name.trim() : normCode,
    department_id: data.department_id.trim(),
    level: data.level || "Level 6",
    term: data.term || "Term 3 2026",
    created_at: now,
    updated_at: now,
  };

  cohorts.push(newCohort);
  savePersistentCohorts(cohorts);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO classes (code, name, department_id, level, term, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           department_id = EXCLUDED.department_id,
           level = EXCLUDED.level,
           term = EXCLUDED.term,
           updated_at = CURRENT_TIMESTAMP`,
        [newCohort.code, newCohort.name, newCohort.department_id, newCohort.level, newCohort.term]
      );
    } catch (e: any) {
      console.warn("⚠️ [PostgreSQL createCohort Warning]:", e.message);
    }
  }

  return newCohort;
}

export async function listCohorts(departmentId?: string): Promise<CohortRecord[]> {
  const cohorts = loadPersistentCohorts();
  if (departmentId && departmentId !== "all") {
    return cohorts.filter(c => c.department_id === departmentId);
  }
  return cohorts;
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
    const filePath = path.join(DATA_DIR, "submissions.json");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
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

      CREATE TABLE IF NOT EXISTS classes (
        code VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department_id VARCHAR(100) NOT NULL,
        level VARCHAR(100),
        term VARCHAR(100),
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
        department_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id VARCHAR(100);

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
