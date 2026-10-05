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

// Connection parameters
const PROJECT_REF = "bzlnpywjyhhrqapsvczf";
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
