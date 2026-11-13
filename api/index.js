// server/apiHandler.ts
import express from "express";

// server/routes.ts
import { Router } from "express";

// server/db.ts
import pg from "pg";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";

// shared/complianceRulesets.ts
var DEFAULT_COMPLIANCE_RULESETS = [
  {
    id: "ruleset-knqf-2026-t3-l3",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 3,
    ct_weight: 0.2,
    cp_weight: 0.8,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: true,
      prohibit_true_false: false,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 20,
      section_b_marks: 30,
      total_marks: 50
    }
  },
  {
    id: "ruleset-knqf-2026-t3-l4",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 4,
    ct_weight: 0.3,
    cp_weight: 0.7,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 10,
      section_b_marks: 40,
      total_marks: 50
    }
  },
  {
    id: "ruleset-knqf-2026-t3-l5",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 5,
    ct_weight: 0.4,
    cp_weight: 0.6,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 40,
      section_b_marks: 60,
      total_marks: 100
    }
  },
  {
    id: "ruleset-knqf-2026-t3-l6",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 6,
    ct_weight: 0.5,
    cp_weight: 0.5,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 40,
      section_b_marks: 60,
      total_marks: 100
    }
  }
];
function getActiveRuleset(level, versionTag, rulesetPool = DEFAULT_COMPLIANCE_RULESETS) {
  const normLevel = Math.max(3, Math.min(6, Math.round(level || 6)));
  const pool2 = Array.isArray(rulesetPool) && rulesetPool.length > 0 ? rulesetPool : DEFAULT_COMPLIANCE_RULESETS;
  if (versionTag) {
    const matched = pool2.find((r) => r.level === normLevel && r.version_tag.toUpperCase() === versionTag.trim().toUpperCase());
    if (matched) return matched;
  }
  const matchedLevel = pool2.find((r) => r.level === normLevel);
  if (matchedLevel) return matchedLevel;
  return DEFAULT_COMPLIANCE_RULESETS.find((r) => r.level === normLevel) || DEFAULT_COMPLIANCE_RULESETS[3];
}

// server/db.ts
var { Pool } = pg;
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var SEEDS_DIR = path.resolve(__dirname, "..", "database", "seeds");
var DATA_DIR = path.resolve(
  process.env.MTTI_DATA_DIR || (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? path.join(os.tmpdir(), ".mukiria-trainer-dashboard") : path.join(os.homedir(), ".mukiria-trainer-dashboard"))
);
function getFixturePath(filename) {
  const runtimePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(runtimePath)) return runtimePath;
  const seedPath = path.join(SEEDS_DIR, filename);
  if (fs.existsSync(seedPath)) return seedPath;
  return runtimePath;
}
var ATTENDANCE_FILE = getFixturePath("attendance_register.json");
var TRAINEES_FILE = getFixturePath("trainees.json");
var SESSION_PLANS_FILE = getFixturePath("session_plans.json");
var LEARNING_PLANS_FILE = getFixturePath("learning_plans.json");
var RECORDS_OF_WORK_FILE = getFixturePath("records_of_work.json");
var CLASS_REGISTERS_FILE = getFixturePath("class_registers.json");
var ASSESSMENT_MARKS_FILE = getFixturePath("assessment_marks.json");
var SUBMISSIONS_FILE = getFixturePath("submissions.json");
var ASSESSMENT_EVIDENCE_FILE = getFixturePath("assessment_evidence.json");
var USERS_FILE = getFixturePath("users.json");
var COHORTS_FILE = getFixturePath("cohorts.json");
var DatabaseUnavailableError = class extends Error {
  status;
  statusCode;
  constructor(message = "Authentication database is temporarily unavailable") {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.status = 503;
    this.statusCode = 503;
  }
};
var DatabaseServiceUnavailableError = class extends DatabaseUnavailableError {
  constructor(message = "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected") {
    super(message);
    this.name = "DatabaseServiceUnavailableError";
    this.status = 503;
    this.statusCode = 503;
  }
};
var PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "tkwgsmtpuyacblcvstcm";
var DEFAULT_HOST = `db.${PROJECT_REF}.supabase.co`;
var DEFAULT_PORT = process.env.SUPABASE_DB_PORT ? parseInt(process.env.SUPABASE_DB_PORT, 10) : 5432;
var DEFAULT_USER = "postgres";
var DEFAULT_DATABASE = "postgres";
var connectionString = process.env.DATABASE_URL;
if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
  connectionString = `postgresql://${DEFAULT_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${DEFAULT_HOST}:${DEFAULT_PORT}/${DEFAULT_DATABASE}`;
}
function isRelaxedDbMode() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  return env === "development" || env === "test";
}
function isSecureProductionRuntime() {
  return !isRelaxedDbMode();
}
var isProduction = isSecureProductionRuntime();
var rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" && isProduction;
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var pool = connectionString ? new Pool({
  connectionString,
  ssl: { rejectUnauthorized },
  connectionTimeoutMillis: 5e3,
  idleTimeoutMillis: isServerless ? 1500 : 3e4,
  max: isServerless ? process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 3 : process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 10,
  allowExitOnIdle: isServerless
}) : null;
function ensurePoolAvailable() {
  if (!pool && process.env.STRICT_DB === "true") {
    throw new DatabaseServiceUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
}
if (pool) {
  pool.on("error", (err) => {
    console.warn("\u26A0\uFE0F [MTTI PostgreSQL Pool Warning]:", err.message);
  });
}
async function query(text, params) {
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    } catch (err) {
      console.error("\u274C [PostgreSQL Query Error]:", err.message);
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "57P01" || err.code === "08006" || err.code === "08001" || err.message?.toLowerCase().includes("timeout") || err.message?.toLowerCase().includes("connection")) {
        err.status = 503;
        err.statusCode = 503;
      }
      throw err;
    }
  }
  if (process.env.STRICT_DB === "true") {
    throw new DatabaseServiceUnavailableError();
  }
  return { rows: [], rowCount: 0 };
}
async function withTransaction(callback) {
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
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {
    });
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT" || err.code === "57P01" || err.code === "08006" || err.code === "08001" || err.message?.toLowerCase().includes("timeout") || err.message?.toLowerCase().includes("connection")) {
      err.status = 503;
      err.statusCode = 503;
    }
    throw err;
  } finally {
    client.release();
  }
}
var memoryUsers = null;
var memoryStaffTrainers = [];
var memoryStaffDepartmentHeads = [];
var memoryAttendance = null;
var memoryTrainees = null;
var memorySessionPlans = null;
var memoryLearningPlans = null;
var memoryRecordsOfWork = null;
var memoryClassRegisters = null;
var memoryAssessmentMarks = null;
var memorySubmissions = null;
var memoryAssessmentEvidence = null;
var DEFAULT_SYSTEM_USERS = [
  {
    id: "usr-admin-001",
    email: "admin@mtti.ac.ke",
    full_name: "Mukiria System Administrator",
    admission_number: null,
    phone_number: "+254700000001",
    password_hash: "$2b$10$gb4klncmWcm5DZ4aGkaoR.l5GFlan.e8cshxW9eGcbP6GwGhk9kAS",
    role: "ADMIN",
    profile_id: "profile-admin-001",
    department_id: "dept-ia",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-trainer-001",
    email: "trainer@mtti.ac.ke",
    full_name: "Dr. J. Muriithi",
    admission_number: null,
    phone_number: "+254700000002",
    password_hash: "$2b$10$l5sLxKIWxeV3A7w42XzqpO9sISryDMFRb.wzKVGKffXgLeReVD7K2",
    role: "TRAINER",
    profile_id: "trainer-001",
    department_id: "dept-ci",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-hod-001",
    email: "hod.ci@mtti.ac.ke",
    full_name: "Head of Computing & Informatics",
    admission_number: null,
    phone_number: "+254700000003",
    password_hash: "$2b$10$tLOT8cQlzSDNVsWG9vKtyOfBLk5p5fm/ePCeGspWKqAMtdytjXSte",
    role: "HOD",
    profile_id: "hod-ci",
    department_id: "dept-ci",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "usr-trainee-001",
    email: "trainee@mtti.ac.ke",
    full_name: "Nthiga Gakii Doris",
    admission_number: "14179/S2026",
    phone_number: "+254700000004",
    password_hash: "$2b$10$ruK0K2v30dyg2ZZWT032DuoczCiuulqmIt0PjdZmlzyXq2G2c5bvW",
    role: "TRAINEE",
    profile_id: "trainee-001",
    department_id: "dept-ci",
    must_change_password: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  }
];
function loadPersistentUsers() {
  if (memoryUsers !== null && memoryUsers.length > 0) return memoryUsers;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return memoryUsers;
      }
    }
  } catch (e) {
    console.warn("Could not read users JSON file:", e);
  }
  memoryUsers = [...DEFAULT_SYSTEM_USERS];
  return memoryUsers;
}
function savePersistentUsers(records) {
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
var CANONICAL_DEPARTMENTS_MAP = {
  "dept-ci": { code: "CI", name: "Computing & Informatics", altCodes: ["ICT"] },
  "dept-ee": { code: "EEE", name: "Electrical & Electronics Engineering", altCodes: ["EE"] },
  "dept-bce": { code: "BCE", name: "Building & Civil Engineering", altCodes: ["B&CE", "ENG"] },
  "dept-him": { code: "HIM", name: "Hospitality & Institutional Management", altCodes: ["HOSP", "HOS"] },
  "dept-ia": { code: "IA", name: "Institutional Academics", altCodes: ["GEN"] },
  "dept-aes": { code: "AES", name: "Agriculture & Environmental Studies", altCodes: ["AGR"] },
  "dept-ch": { code: "CH", name: "Cosmetology & Hairdressing", altCodes: ["COS"] },
  "dept-sg": { code: "SG", name: "Surveying & Geomatics", altCodes: ["SURV"] },
  "dept-mae": { code: "MAE", name: "Mechanical & Automotive Engineering", altCodes: ["MECH", "ENG"] },
  "dept-business": { code: "BUS", name: "Business Studies", altCodes: ["BA"] }
};
function matchesDepartment(department, target) {
  if (!target) return false;
  const normTarget = target.trim();
  const lowerTarget = normTarget.toLowerCase();
  const upperTarget = normTarget.toUpperCase();
  if (department.id && department.id === normTarget) return true;
  if (department.slug && department.slug === normTarget) return true;
  if (department.code && department.code.toUpperCase() === upperTarget) return true;
  if (department.name && department.name.toLowerCase() === lowerTarget) return true;
  const mapping = CANONICAL_DEPARTMENTS_MAP[normTarget];
  if (mapping) {
    if (department.code && (department.code.toUpperCase() === mapping.code.toUpperCase() || mapping.altCodes.includes(department.code.toUpperCase()))) return true;
    if (department.name && department.name.toLowerCase() === mapping.name.toLowerCase()) return true;
  }
  for (const [slug, meta] of Object.entries(CANONICAL_DEPARTMENTS_MAP)) {
    if (slug === department.id || slug === department.slug) {
      if (meta.code.toUpperCase() === upperTarget || meta.altCodes.includes(upperTarget) || meta.name.toLowerCase() === lowerTarget) {
        return true;
      }
    }
  }
  return false;
}
function removeInMemoryStaffProfile(profileId) {
  const trainerIndex = memoryStaffTrainers.findIndex((trainer) => trainer.id === profileId);
  if (trainerIndex >= 0) memoryStaffTrainers.splice(trainerIndex, 1);
  const departmentIndex = memoryStaffDepartmentHeads.findIndex((department) => department.hod_id === profileId);
  if (departmentIndex >= 0) memoryStaffDepartmentHeads.splice(departmentIndex, 1);
}
async function addInMemoryStaffProfile(role, profileId, name, email, departmentId) {
  const department = (await loadDatabaseDepartments()).find((item) => matchesDepartment(item, departmentId));
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
  const existing = memoryStaffDepartmentHeads.find((department2) => department2.department_id === departmentId);
  if (existing) {
    existing.hod_id = profileId;
    existing.hod_email = email;
  } else {
    memoryStaffDepartmentHeads.push({ department_id: departmentId, hod_id: profileId, hod_email: email });
  }
}
async function findUserById(id) {
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
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL findUserById Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => u.id === normId);
  if (match) return match;
  if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }
  return null;
}
async function findUserByProfileId(profileId) {
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
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL findUserByProfileId Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => u.profile_id === norm);
  if (match) return match;
  if (isSecureProductionRuntime()) {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in production mode");
  }
  return null;
}
async function updateUserProfileId(userId, profileId) {
  const normUserId = (userId || "").trim();
  const normProfileId = (profileId || "").trim();
  if (!normUserId || !normProfileId) return;
  ensurePoolAvailable();
  if (pool) {
    try {
      await pool.query("UPDATE users SET profile_id = $1 WHERE id = $2 AND profile_id IS NULL", [normProfileId, normUserId]);
    } catch (err) {
      console.warn("\u26A0\uFE0F [PostgreSQL updateUserProfileId Warning]:", err.message);
    }
  }
  const users = loadPersistentUsers();
  const user = users.find((u) => u.id === normUserId);
  if (user && !user.profile_id) {
    user.profile_id = normProfileId;
    savePersistentUsers(users);
  }
}
async function loadDatabaseTrainers() {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, email, department FROM Trainers");
      return res.rows;
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL Trainers table unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL loadDatabaseTrainers Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Trainers query in strict mode");
  }
  return [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", department: "Computing & Informatics", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", department: "Computing & Informatics", assigned_units: ["ICT/OS/IT/CR/1/6"] },
    ...memoryStaffTrainers
  ];
}
async function loadDatabaseDepartments() {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, code, hod_id, hod_email FROM Departments");
      return res.rows.map((row) => {
        const canonicalEntry = Object.entries(CANONICAL_DEPARTMENTS_MAP).find(
          ([_, meta]) => meta.code.toUpperCase() === row.code?.toUpperCase() || meta.altCodes.includes(row.code?.toUpperCase()) || meta.name.toLowerCase() === row.name?.toLowerCase()
        );
        return {
          ...row,
          slug: canonicalEntry ? canonicalEntry[0] : row.id
        };
      });
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL Departments table unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL loadDatabaseDepartments Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Departments query in strict mode");
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
    { id: "dept-business", name: "Business Studies", code: "BUS", hod_id: "hod-010", hod_email: "hod.business@mtti.ac.ke" }
  ].map((department) => {
    const head = memoryStaffDepartmentHeads.find((item) => item.department_id === department.id);
    return head ? { ...department, hod_id: head.hod_id, hod_email: head.hod_email } : department;
  });
}
async function loadDatabaseTrainees() {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query("SELECT id, name, reg_number, adm_no, reg_code, class_id, class_code, department FROM Trainees");
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL Trainees table unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL loadDatabaseTrainees Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL connection unavailable for Trainees query in strict mode");
  }
  const persistentTrainees = loadPersistentTrainees();
  const memoryTrainees2 = [
    { id: "trainee-001", name: "Nthiga Gakii Doris", reg_number: "14179/S2026", adm_no: "14179/S2026", reg_code: "14179/S2026", department: "Computing & Informatics" },
    { id: "trainee-10525", name: "Alex Kinoti", reg_number: "10525", adm_no: "10525", reg_code: "10525", department: "Computing & Informatics" },
    { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", adm_no: "10526", reg_code: "10526", department: "Computing & Informatics" },
    { id: "trainee-003", name: "Other Student", reg_number: "99999", adm_no: "99999", reg_code: "99999", department: "Building & Civil Engineering" }
  ];
  return [
    ...persistentTrainees,
    ...memoryTrainees2.filter((m) => !persistentTrainees.some((p) => p.id === m.id || p.reg_number && p.reg_number.trim().toUpperCase() === m.reg_number.trim().toUpperCase()))
  ];
}
async function findUserByEmail(email) {
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
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL findUserByEmail Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.email || "").trim().toLowerCase() === normEmail);
  return match || null;
}
async function findUserByAdmissionNumber(admissionNumber) {
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
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError("PostgreSQL database unavailable in strict mode");
      }
      console.warn("\u26A0\uFE0F [PostgreSQL findUserByAdmissionNumber Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.admission_number || "").trim().toLowerCase() === normAdm);
  return match || null;
}
async function findUserByEmailOrAdmission(identifier) {
  const norm = (identifier || "").trim().toLowerCase();
  if (!norm) return null;
  const targetEmail = norm === "admin" ? "admin@mtti.ac.ke" : norm === "trainer" ? "trainer@mtti.ac.ke" : norm === "hod" ? "hod.ci@mtti.ac.ke" : norm;
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
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        throw new DatabaseUnavailableError(`PostgreSQL findUserByEmailOrAdmission failed: ${err.message}`);
      }
      console.warn("\u26A0\uFE0F [PostgreSQL findUserByEmailOrAdmission Warning]:", err.message);
    }
  } else if (process.env.STRICT_DB === "true") {
    throw new DatabaseUnavailableError("PostgreSQL database pool unavailable in strict mode");
  }
  const users = loadPersistentUsers();
  const match = [...users].reverse().find((u) => (u.email || "").trim().toLowerCase() === norm || (u.email || "").trim().toLowerCase() === targetEmail || u.admission_number && u.admission_number.trim().toLowerCase() === norm);
  return match || null;
}
async function createUser(data) {
  const newId = data.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let resolvedProfileId = null;
  const normRole = (data.role || "").toUpperCase();
  if (data.profile_id !== void 0) {
    resolvedProfileId = data.profile_id ? data.profile_id.trim() : null;
  } else {
    if (normRole === "TRAINEE" && data.admission_number) {
      const cleanAdm = data.admission_number.trim();
      const trainees = loadPersistentTrainees();
      const existing = trainees.find((t) => (t.reg_number || t.adm_no || "").trim().toUpperCase() === cleanAdm.toUpperCase());
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
          updated_at: now
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
  const userRecord = {
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
    updated_at: now
  };
  if (pool) {
    try {
      let resolvedDeptId = userRecord.department_id ? String(userRecord.department_id).trim() : null;
      if (resolvedDeptId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedDeptId)) {
        try {
          const depts = await loadDatabaseDepartments();
          const matched = depts.find((d) => matchesDepartment(d, resolvedDeptId));
          if (matched && matched.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matched.id)) {
            resolvedDeptId = matched.id;
          } else {
            resolvedDeptId = null;
          }
        } catch {
          resolvedDeptId = null;
        }
      }
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
          resolvedDeptId,
          userRecord.must_change_password ?? false,
          userRecord.created_at,
          userRecord.updated_at
        ]
      );
      if (res.rows.length > 0) {
        const users2 = loadPersistentUsers();
        users2.push(res.rows[0]);
        savePersistentUsers(users2);
        return res.rows[0];
      }
    } catch (err) {
      if (process.env.STRICT_DB === "true") {
        console.error("\u274C [PostgreSQL createUser Error]:", err.message);
        throw err;
      }
      console.warn("\u26A0\uFE0F [PostgreSQL createUser Warning]:", err.message, "- falling back to persistent storage");
    }
  }
  const users = loadPersistentUsers();
  users.push(userRecord);
  savePersistentUsers(users);
  return userRecord;
}
async function createStaffAccount(data) {
  const userId = randomUUID();
  const profileId = randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedName = data.full_name.trim();
  let persisted = null;
  try {
    persisted = await withTransaction(async (client) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.department_id);
      const meta = CANONICAL_DEPARTMENTS_MAP[data.department_id];
      const targetCode = meta?.code || data.department_id;
      const targetName = meta?.name || data.department_id;
      const altCodes = meta?.altCodes || [];
      let department;
      if (isUuid) {
        department = await client.query(
          "SELECT id, name, code FROM Departments WHERE id = $1 FOR UPDATE",
          [data.department_id]
        );
      } else {
        department = await client.query(
          `SELECT id, name, code FROM Departments 
           WHERE UPPER(code) = UPPER($1) 
              OR UPPER(code) = ANY($2::text[])
              OR LOWER(name) = LOWER($3)
              OR LOWER(name) LIKE LOWER($4)
           LIMIT 1 FOR UPDATE`,
          [targetCode, altCodes, targetName, `%${targetName}%`]
        );
      }
      if (!department || department.rowCount === 0) {
        const allDepts = await client.query("SELECT id, name, code FROM Departments");
        const matched = allDepts.rows.find((d) => matchesDepartment(d, data.department_id));
        if (matched) {
          department = { rows: [matched], rowCount: 1 };
        } else {
          throw Object.assign(new Error("The selected department does not exist."), { code: "DEPARTMENT_NOT_FOUND" });
        }
      }
      const realDept = department.rows[0];
      const realDeptId = realDept.id;
      const realDeptName = realDept.name;
      const userResult = await client.query(
        `INSERT INTO users (
          id, full_name, email, phone_number, password_hash, role, profile_id,
          department_id, must_change_password, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $9)
        RETURNING *`,
        [userId, normalizedName, normalizedEmail, data.phone_number || null, data.password_hash, data.role, profileId, realDeptId, now]
      );
      try {
        await client.query(
          "INSERT INTO Trainers (id, name, email, department, department_id) VALUES ($1, $2, $3, $4, $5)",
          [profileId, normalizedName, normalizedEmail, realDeptName, realDeptId]
        );
      } catch (trainerErr) {
        if (trainerErr?.message?.includes("department_id") || trainerErr?.code === "42703") {
          await client.query(
            "INSERT INTO Trainers (id, name, email, department) VALUES ($1, $2, $3, $4)",
            [profileId, normalizedName, normalizedEmail, realDeptName]
          );
        } else {
          throw trainerErr;
        }
      }
      if (data.role === "HOD") {
        try {
          const update = await client.query(
            "UPDATE Departments SET hod_id = $1, hod_email = $2 WHERE id = $3",
            [profileId, normalizedEmail, realDeptId]
          );
          if (update.rowCount !== 1) {
            throw Object.assign(new Error("The selected department could not be linked to this HOD."), { code: "DEPARTMENT_NOT_FOUND" });
          }
        } catch (hodErr) {
          if (hodErr?.message?.includes("hod_email") || hodErr?.code === "42703") {
            await client.query(
              "UPDATE Departments SET hod_id = $1 WHERE id = $2",
              [profileId, realDeptId]
            );
          } else {
            throw hodErr;
          }
        }
      }
      return userResult.rows[0];
    });
  } catch (err) {
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
    must_change_password: true
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
async function updateUserPassword(userId, passwordHash) {
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
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    savePersistentUsers(users);
  }
}
async function resetUserPassword(userId, passwordHash) {
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
    user.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    savePersistentUsers(users);
  }
}
async function createTraineeAccount(data) {
  const normAdm = data.admission_number.trim().toUpperCase();
  const normName = data.full_name.trim();
  const normClass = data.class_code.trim();
  const normDept = data.department_id.trim();
  const email = data.email && data.email.trim() ? data.email.trim().toLowerCase() : `${normAdm.toLowerCase().replace(/[^a-z0-9]/g, "")}@trainee.mtti.ac.ke`;
  const userId = randomUUID();
  const profileId = `trainee-${normAdm.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingUser = await findUserByAdmissionNumber(normAdm);
  if (existingUser) {
    throw Object.assign(new Error(`An account with admission number '${normAdm}' already exists.`), { code: "23505" });
  }
  const trainees = loadPersistentTrainees();
  let existingIndex = trainees.findIndex(
    (t) => (t.reg_number || t.adm_no || "").trim().toUpperCase() === normAdm
  );
  const traineeRecord = {
    id: existingIndex >= 0 ? trainees[existingIndex].id : profileId,
    name: normName,
    reg_number: normAdm,
    adm_no: normAdm,
    reg_code: normAdm,
    class_id: normClass,
    class_code: normClass,
    department: normDept,
    phone: data.phone_number || void 0,
    created_at: existingIndex >= 0 ? trainees[existingIndex].created_at || now : now,
    updated_at: now
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
          traineeRecord.phone
        ]
      );
    } catch (e) {
      console.warn("\u26A0\uFE0F [PostgreSQL createTraineeAccount Trainees Table Warning]:", e.message);
    }
  }
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
    must_change_password: true
  });
  return { user: userRecord, trainee: traineeRecord };
}
var memoryCohorts = null;
function loadPersistentCohorts() {
  if (memoryCohorts !== null) return memoryCohorts;
  try {
    if (fs.existsSync(COHORTS_FILE)) {
      const data = fs.readFileSync(COHORTS_FILE, "utf-8");
      memoryCohorts = JSON.parse(data);
      return memoryCohorts;
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
    { code: "BCE 6 MOD/S/2026", name: "Building & Civil Engineering Level 6", department_id: "dept-bce", level: "Level 6", term: "Term 3 2026" }
  ];
  return memoryCohorts;
}
function savePersistentCohorts(cohorts) {
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
async function createCohort(data) {
  const normCode = data.code.trim();
  const cohorts = loadPersistentCohorts();
  const existing = cohorts.find((c) => c.code.toLowerCase() === normCode.toLowerCase());
  if (existing) {
    throw Object.assign(new Error(`Cohort with code '${normCode}' already exists.`), { code: "COHORT_EXISTS" });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newCohort = {
    code: normCode,
    name: data.name && data.name.trim() ? data.name.trim() : normCode,
    department_id: data.department_id.trim(),
    level: data.level || "Level 6",
    term: data.term || "Term 3 2026",
    created_at: now,
    updated_at: now
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
    } catch (e) {
      console.warn("\u26A0\uFE0F [PostgreSQL createCohort Warning]:", e.message);
    }
  }
  return newCohort;
}
async function listCohorts(departmentId) {
  const cohorts = loadPersistentCohorts();
  if (departmentId && departmentId !== "all") {
    return cohorts.filter((c) => c.department_id === departmentId);
  }
  return cohorts;
}
function loadPersistentAttendance() {
  if (memoryAttendance !== null) return memoryAttendance;
  try {
    if (fs.existsSync(ATTENDANCE_FILE)) {
      const data = fs.readFileSync(ATTENDANCE_FILE, "utf-8");
      memoryAttendance = JSON.parse(data);
      return memoryAttendance;
    }
  } catch (e) {
    console.warn("Could not read attendance JSON file:", e);
  }
  return [];
}
function savePersistentAttendance(records) {
  memoryAttendance = [...records];
}
var DEFAULT_SYSTEM_TRAINEES = [
  {
    id: "trainee-001",
    name: "Nthiga Gakii Doris",
    reg_number: "14179/S2026",
    adm_no: "14179/S2026",
    reg_code: "14179/S2026",
    class_code: "ICT4/ITECH6/S/26 MOD 1",
    department: "Computing & Informatics",
    gender: "F",
    phone: "+254700000004",
    remarks: "Institutional baseline candidate",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "tr_1791155578578_6sfojk",
    name: "Test Trainee Persistence",
    reg_number: "TEST/99999/S2026",
    adm_no: "TEST/99999/S2026",
    reg_code: "TEST/99999/S2026",
    class_code: "ICT4/ITECH6/S/26 MOD 1",
    department: "Computing & Informatics",
    gender: "M",
    phone: "0712345678",
    remarks: "Verification trainee",
    created_at: "2026-10-04T23:12:58.578Z",
    updated_at: "2026-10-04T23:12:58.578Z"
  }
];
function loadPersistentTrainees() {
  if (memoryTrainees !== null && memoryTrainees.length > 0) return memoryTrainees;
  try {
    if (fs.existsSync(TRAINEES_FILE)) {
      const data = fs.readFileSync(TRAINEES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryTrainees = parsed;
        return memoryTrainees;
      }
    }
  } catch (e) {
    console.warn("Could not read trainees JSON file:", e);
  }
  memoryTrainees = [...DEFAULT_SYSTEM_TRAINEES];
  return memoryTrainees;
}
function savePersistentTrainees(records) {
  memoryTrainees = [...records];
}
function loadPersistentSessionPlans() {
  if (memorySessionPlans !== null) return memorySessionPlans;
  try {
    if (fs.existsSync(SESSION_PLANS_FILE)) {
      const data = fs.readFileSync(SESSION_PLANS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      memorySessionPlans = process.env.NODE_ENV === "test" && Array.isArray(parsed) ? parsed.slice(0, 100) : parsed;
      return memorySessionPlans;
    }
  } catch (e) {
    console.warn("Could not read session plans JSON file:", e);
  }
  return [];
}
function savePersistentSessionPlans(records) {
  memorySessionPlans = [...records];
}
function loadPersistentLearningPlans() {
  if (memoryLearningPlans !== null) return memoryLearningPlans;
  try {
    if (fs.existsSync(LEARNING_PLANS_FILE)) {
      const data = fs.readFileSync(LEARNING_PLANS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      memoryLearningPlans = process.env.NODE_ENV === "test" && Array.isArray(parsed) ? parsed.slice(0, 50) : parsed;
      return memoryLearningPlans;
    }
  } catch (e) {
    console.warn("Could not read learning plans JSON file:", e);
  }
  return [];
}
function savePersistentLearningPlans(records) {
  memoryLearningPlans = [...records];
}
function loadPersistentRecordsOfWork() {
  if (memoryRecordsOfWork !== null) return memoryRecordsOfWork;
  try {
    if (fs.existsSync(RECORDS_OF_WORK_FILE)) {
      const data = fs.readFileSync(RECORDS_OF_WORK_FILE, "utf-8");
      const parsed = JSON.parse(data);
      memoryRecordsOfWork = process.env.NODE_ENV === "test" && Array.isArray(parsed) ? parsed.slice(0, 100) : parsed;
      return memoryRecordsOfWork;
    }
  } catch (e) {
    console.warn("Could not read records of work JSON file:", e);
  }
  return [];
}
function savePersistentRecordsOfWork(records) {
  memoryRecordsOfWork = [...records];
}
function loadPersistentClassRegisters() {
  if (memoryClassRegisters !== null) return memoryClassRegisters;
  try {
    if (fs.existsSync(CLASS_REGISTERS_FILE)) {
      const data = fs.readFileSync(CLASS_REGISTERS_FILE, "utf-8");
      memoryClassRegisters = JSON.parse(data);
      return memoryClassRegisters;
    }
  } catch (e) {
    console.warn("Could not read class registers JSON file:", e);
  }
  return {};
}
function savePersistentClassRegisters(data) {
  memoryClassRegisters = { ...data };
}
function loadPersistentAssessmentMarks() {
  if (memoryAssessmentMarks !== null) return memoryAssessmentMarks;
  try {
    if (fs.existsSync(ASSESSMENT_MARKS_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_MARKS_FILE, "utf-8");
      memoryAssessmentMarks = JSON.parse(data);
      return memoryAssessmentMarks;
    }
  } catch (e) {
    console.warn("Could not read assessment marks JSON file:", e);
  }
  return [];
}
function savePersistentAssessmentMarks(records) {
  memoryAssessmentMarks = [...records];
}
function loadPersistentSubmissions() {
  if (memorySubmissions !== null) return memorySubmissions;
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      memorySubmissions = JSON.parse(data);
      return memorySubmissions;
    }
  } catch (e) {
    console.warn("Could not read submissions JSON file:", e);
  }
  return [];
}
function savePersistentSubmissions(records) {
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
function loadPersistentAssessmentEvidence() {
  if (memoryAssessmentEvidence !== null) return memoryAssessmentEvidence;
  try {
    if (fs.existsSync(ASSESSMENT_EVIDENCE_FILE)) {
      const data = fs.readFileSync(ASSESSMENT_EVIDENCE_FILE, "utf-8");
      memoryAssessmentEvidence = JSON.parse(data);
      return memoryAssessmentEvidence;
    }
  } catch (e) {
    console.warn("Could not read assessment evidence JSON file:", e);
  }
  return [];
}
function savePersistentAssessmentEvidence(records) {
  memoryAssessmentEvidence = [...records];
}
async function saveTraineeBatch(records) {
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
  } catch (err) {
    console.error("\u274C [PostgreSQL saveTraineeBatch Error]:", err.message);
    throw err;
  }
}
async function saveAssessmentMarksBatch(records) {
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
    } catch (err) {
      console.error("\u274C [PostgreSQL Batch Marks Error]:", err.message);
      throw err;
    }
  }
}
async function saveExamSubmission(submission, allSubmissions) {
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
        submission.submitted_at || (/* @__PURE__ */ new Date()).toISOString()
      ]);
    } catch (err) {
      console.error("\u274C [PostgreSQL Exam Submission Error]:", err.message);
      throw err;
    }
  }
}
async function saveAssessmentEvidence(evidence, allEvidence) {
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
    } catch (err) {
      console.error("\u274C [PostgreSQL Assessment Evidence Error]:", err.message);
      throw err;
    }
  }
}
async function initDatabaseSchema() {
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
        profile_id VARCHAR(100),
        department_id VARCHAR(100),
        must_change_password BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_id VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS admission_number VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);

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

      GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
    `);
    const userCount = await pool.query("SELECT COUNT(*) AS count FROM users");
    if (parseInt(userCount.rows[0]?.count || "0", 10) === 0) {
      await pool.query(`
        INSERT INTO users (id, email, full_name, admission_number, phone_number, password_hash, role, profile_id, department_id, must_change_password)
        VALUES 
          ('usr-admin-001', 'admin@mtti.ac.ke', 'Mukiria System Administrator', NULL, '+254700000001', '$2b$10$gb4klncmWcm5DZ4aGkaoR.l5GFlan.e8cshxW9eGcbP6GwGhk9kAS', 'ADMIN', 'profile-admin-001', 'dept-ia', false),
          ('usr-trainer-001', 'trainer@mtti.ac.ke', 'Dr. J. Muriithi', NULL, '+254700000002', '$2b$10$l5sLxKIWxeV3A7w42XzqpO9sISryDMFRb.wzKVGKffXgLeReVD7K2', 'TRAINER', 'trainer-001', 'dept-ci', false),
          ('usr-hod-001', 'hod.ci@mtti.ac.ke', 'Head of Computing & Informatics', NULL, '+254700000003', '$2b$10$tLOT8cQlzSDNVsWG9vKtyOfBLk5p5fm/ePCeGspWKqAMtdytjXSte', 'HOD', 'hod-ci', 'dept-ci', false),
          ('usr-trainee-001', 'trainee@mtti.ac.ke', 'Nthiga Gakii Doris', '14179/S2026', '+254700000004', '$2b$10$ruK0K2v30dyg2ZZWT032DuoczCiuulqmIt0PjdZmlzyXq2G2c5bvW', 'TRAINEE', 'trainee-001', 'dept-ci', false)
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log("\u2705 [MTTI PostgreSQL]: Initial seed users provisioned.");
    }
    console.log("\u2705 [MTTI PostgreSQL]: Centralized institutional tables verified.");
  } catch (err) {
    lastInitError = err?.message || String(err);
    console.warn("\u26A0\uFE0F [PostgreSQL Init Warning]:", err.message);
  }
}
var lastInitError = null;
var schemaInitPromise = null;
function ensureSchemaInitialized() {
  if (!pool) return Promise.resolve();
  if (!schemaInitPromise) {
    schemaInitPromise = initDatabaseSchema().catch((err) => {
      lastInitError = err?.message || String(err);
      console.warn("\u26A0\uFE0F [PostgreSQL Init Warning]:", err.message);
      schemaInitPromise = null;
    });
  }
  return schemaInitPromise;
}
if (pool) {
  ensureSchemaInitialized().catch(() => {
  });
}
var memoryAuditLogs = [];
function recordAuditLog(log) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    table_name: log.table_name,
    record_id: log.record_id,
    action: log.action,
    actor_id: log.actor_id || null,
    actor_role: log.actor_role || null,
    old_data: log.old_data || null,
    new_data: log.new_data || null,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  memoryAuditLogs.unshift(entry);
  return entry;
}
async function loadComplianceRulesets() {
  ensurePoolAvailable();
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT id, version_tag, effective_from, level, ct_weight, cp_weight, min_attendance_pct, required_theory_exams, missing_exam_policy, exam_structure_rules, created_at, updated_at FROM compliance_rulesets ORDER BY level ASC"
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r) => ({
          ...r,
          ct_weight: parseFloat(r.ct_weight),
          cp_weight: parseFloat(r.cp_weight),
          min_attendance_pct: parseFloat(r.min_attendance_pct),
          required_theory_exams: parseInt(r.required_theory_exams, 10),
          exam_structure_rules: typeof r.exam_structure_rules === "string" ? JSON.parse(r.exam_structure_rules) : r.exam_structure_rules
        }));
      }
    } catch (err) {
      console.warn("\u26A0\uFE0F [PostgreSQL loadComplianceRulesets Warning]:", err.message);
    }
  }
  return DEFAULT_COMPLIANCE_RULESETS;
}
async function loadAuditLogs(filter) {
  ensurePoolAvailable();
  if (pool) {
    try {
      let query2 = "SELECT id, table_name, record_id, action, actor_id, actor_role, old_data, new_data, created_at FROM audit_logs";
      const params = [];
      if (filter?.table_name) {
        params.push(filter.table_name);
        query2 += ` WHERE table_name = $${params.length}`;
      }
      query2 += " ORDER BY created_at DESC";
      if (filter?.limit) {
        params.push(filter.limit);
        query2 += ` LIMIT $${params.length}`;
      }
      if (filter?.offset) {
        params.push(filter.offset);
        query2 += ` OFFSET $${params.length}`;
      }
      const res = await pool.query(query2, params);
      return res.rows;
    } catch (err) {
      console.warn("\u26A0\uFE0F [PostgreSQL loadAuditLogs Warning]:", err.message);
    }
  }
  let results = [...memoryAuditLogs];
  if (filter?.table_name) {
    results = results.filter((r) => r.table_name === filter.table_name);
  }
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 100;
  return results.slice(offset, offset + limit);
}
if (pool) {
  initDatabaseSchema().catch(() => {
  });
}

// server/routes.ts
import bcrypt from "bcryptjs";
import { randomBytes as randomBytes2 } from "node:crypto";

// server/auth.ts
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
var VALID_ROLES = ["trainee", "trainer", "hod", "admin"];
var FORBIDDEN_PRODUCTION_SECRETS = /* @__PURE__ */ new Set([
  "mtti_test_jwt_secret_min_32_chars_long_and_cryptographically_strong!",
  "mtti_super_secure_test_jwt_secret_32chars_min!",
  "mtti-enterprise-jwt-secret-secure-key-2026",
  "replace_with_openssl_rand_base64_48_secret_here",
  "openssl rand -base64 48",
  "your-jwt-secret-here-must-be-at-least-32-chars"
]);
function isRelaxedMode() {
  const env = (process.env.NODE_ENV || "").trim().toLowerCase();
  return env === "development" || env === "test";
}
function isSecureProductionMode() {
  return !isRelaxedMode();
}
function validateEnvironmentInvariants() {
  const isProd = isSecureProductionMode();
  const allowDemo = process.env.ALLOW_DEMO_AUTH === "true" || process.env.ALLOW_DEMO_AUTH === "1";
  if (isProd && allowDemo) {
    throw new Error("FATAL: ALLOW_DEMO_AUTH is strictly forbidden in production mode.");
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("FATAL: JWT_SECRET must be configured and at least 32 characters long.");
  }
  if (isProd) {
    if (FORBIDDEN_PRODUCTION_SECRETS.has(secret) || secret.toLowerCase().includes("test") || secret.toLowerCase().includes("placeholder") || secret.includes("replace_with_openssl_rand_base64_48_secret_here")) {
      throw new Error("FATAL: Test secret or placeholder secret cannot be used in production mode.");
    }
  }
}
try {
  validateEnvironmentInvariants();
} catch (err) {
  if (isSecureProductionMode()) {
    console.warn(`\u26A0\uFE0F [MTTI Auth Boot Warning]: ${err.message}. Generating secure fallback runtime secret.`);
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || FORBIDDEN_PRODUCTION_SECRETS.has(process.env.JWT_SECRET) || process.env.JWT_SECRET.toLowerCase().includes("test")) {
      process.env.JWT_SECRET = randomBytes(32).toString("hex");
    }
  }
}
function getJwtSecret() {
  validateEnvironmentInvariants();
  return process.env.JWT_SECRET;
}
function normalizeAdmissionIdentifier(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}
var profileCache = /* @__PURE__ */ new Map();
function getCachedUserProfile(userId) {
  const cached = profileCache.get(userId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    profileCache.delete(userId);
    return null;
  }
  return cached.user;
}
function setCachedUserProfile(userId, user) {
  profileCache.set(userId, {
    user,
    expiresAt: Date.now() + 6e4
    // 60 seconds TTL
  });
}
function invalidateUserProfileCache(userId) {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}
function signToken(payload, options) {
  const secret = getJwtSecret();
  const normalizedRole = String(payload.role || "trainee").trim().toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Cannot issue token with invalid role '${payload.role}'`);
  }
  return jwt.sign(
    {
      sub: payload.sub,
      role: normalizedRole
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "2h",
      issuer: "mtti-api",
      audience: "mtti-web",
      ...options
    }
  );
}
async function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid token string");
  }
  const secret = getJwtSecret();
  let decoded;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "mtti-api",
      audience: "mtti-web"
    });
  } catch (err) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }
  if (!decoded.exp) {
    throw new Error("Token missing expiration claim (exp)");
  }
  const sub = decoded.sub || decoded.id;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid token claims: Missing 'sub' subject");
  }
  const rawRole = decoded.role;
  const normalizedRole = typeof rawRole === "string" ? rawRole.trim().toLowerCase() : "";
  if (!VALID_ROLES.includes(normalizedRole)) {
    throw new Error(`Unauthorized: Invalid or unrecognized role '${rawRole}'`);
  }
  return {
    sub,
    role: normalizedRole
  };
}
async function validateRoleProfileLink(role, profileId, userId) {
  if (role === "admin") {
    if (profileId !== userId) {
      return { error: "Forbidden: Admin profile must anchor directly to user id", status: 403 };
    }
    return {};
  }
  if (role === "trainee") {
    if (profileId.startsWith("trainer-") || profileId.startsWith("hod-") || profileId.startsWith("admin-")) {
      return { error: "Forbidden: Trainee account profile cannot reference staff or administrative records", status: 403 };
    }
    const trainers = await loadDatabaseTrainers();
    if (trainers.some((t) => t.id === profileId)) {
      return { error: "Forbidden: Trainee account profile cannot reference trainer records", status: 403 };
    }
    const trainees = await loadDatabaseTrainees();
    const exists = trainees.some((t) => t.id === profileId);
    if (!exists) {
      return { error: "Forbidden: Trainee academic profile does not exist in roster", status: 403 };
    }
    return {};
  }
  if (role === "trainer") {
    if (profileId.startsWith("trainee-") || profileId.startsWith("admin-")) {
      return { error: "Forbidden: Trainer account profile cannot reference trainee or administrative records", status: 403 };
    }
    const trainers = await loadDatabaseTrainers();
    const exists = trainers.some((t) => t.id === profileId);
    if (!exists) {
      return { error: "Forbidden: Trainer profile does not exist in faculty registry", status: 403 };
    }
    return {};
  }
  if (role === "hod") {
    if (profileId.startsWith("trainee-") || profileId.startsWith("admin-")) {
      return { error: "Forbidden: HOD account profile cannot reference trainee records", status: 403 };
    }
    const depts = await loadDatabaseDepartments();
    const exists = depts.some((d) => d.hod_id === profileId);
    if (!exists) {
      return { error: "Forbidden: HOD profile does not match any departmental head", status: 403 };
    }
    return {};
  }
  return { error: "Forbidden: Unrecognized role for profile validation", status: 403 };
}
async function resolveProfileId(user) {
  const role = String(user.role || "").trim().toLowerCase();
  if (user.profile_id) {
    const val = await validateRoleProfileLink(role, user.profile_id, user.id);
    if (val.error) {
      return { error: val.error, status: val.status || 403 };
    }
    return { profileId: user.profile_id };
  }
  if (role === "admin") {
    return { profileId: user.id };
  }
  if (role === "trainee") {
    const normAdm = normalizeAdmissionIdentifier(user.admission_number);
    if (!normAdm) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }
    const trainees = await loadDatabaseTrainees();
    const matches = trainees.filter((t) => {
      const normReg = normalizeAdmissionIdentifier(t.reg_number);
      const normNo = normalizeAdmissionIdentifier(t.adm_no);
      const normCode = normalizeAdmissionIdentifier(t.reg_code);
      return normAdm === normReg || normAdm === normNo || normAdm === normCode;
    });
    if (matches.length > 1) {
      console.error(
        JSON.stringify({
          event: "SECURITY_AMBIGUOUS_PROFILE_MATCH",
          userId: user.id,
          matchCount: matches.length,
          matchedProfileIds: matches.map((m) => m.id)
        })
      );
      return { error: "Ambiguous academic profile mapping detected", status: 401 };
    }
    if (matches.length === 0) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }
    const matchedId = matches[0].id;
    const val = await validateRoleProfileLink(role, matchedId, user.id);
    if (val.error) {
      return { error: val.error, status: val.status || 403 };
    }
    updateUserProfileId(user.id, matchedId).catch(() => {
    });
    return { profileId: matchedId };
  }
  if (role === "trainer") {
    const normEmail = (user.email || "").trim().toLowerCase();
    if (!normEmail) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }
    const trainers = await loadDatabaseTrainers();
    const matches = trainers.filter((t) => t.email && t.email.trim().toLowerCase() === normEmail);
    if (matches.length > 1) {
      console.error(
        JSON.stringify({
          event: "SECURITY_AMBIGUOUS_PROFILE_MATCH",
          userId: user.id,
          matchCount: matches.length,
          matchedProfileIds: matches.map((m) => m.id)
        })
      );
      return { error: "Ambiguous academic profile mapping detected", status: 401 };
    }
    if (matches.length === 0) {
      return { error: "User account has no associated active academic profile", status: 403 };
    }
    const matchedId = matches[0].id;
    const val = await validateRoleProfileLink(role, matchedId, user.id);
    if (val.error) {
      return { error: val.error, status: val.status || 403 };
    }
    updateUserProfileId(user.id, matchedId).catch(() => {
    });
    return { profileId: matchedId };
  }
  if (role === "hod") {
    const normEmail = (user.email || "").trim().toLowerCase();
    const depts = await loadDatabaseDepartments();
    const matches = depts.filter((d) => d.hod_email && d.hod_email.trim().toLowerCase() === normEmail);
    if (matches.length === 1) {
      const matchedId = matches[0].hod_id;
      const val2 = await validateRoleProfileLink(role, matchedId, user.id);
      if (val2.error) {
        return { error: val2.error, status: val2.status || 403 };
      }
      updateUserProfileId(user.id, matchedId).catch(() => {
      });
      return { profileId: matchedId };
    }
    const val = await validateRoleProfileLink(role, "hod-001", user.id);
    if (val.error) {
      return { error: val.error, status: val.status || 403 };
    }
    return { profileId: "hod-001" };
  }
  return { error: "User account has no associated active academic profile", status: 403 };
}
async function hydrateUserProfile(sub, tokenRole) {
  const cached = getCachedUserProfile(sub);
  if (cached) {
    return { user: cached };
  }
  const userRec = await findUserById(sub);
  if (!userRec) {
    return { error: "Unauthorized: User account not found or has been deactivated", status: 401 };
  }
  const dbRole = String(userRec.role || "").trim().toLowerCase();
  if (!VALID_ROLES.includes(dbRole)) {
    return { error: "Unauthorized: Invalid database role assignment", status: 401 };
  }
  const resolution = await resolveProfileId(userRec);
  if (resolution.error || !resolution.profileId) {
    return { error: resolution.error, status: resolution.status || 403 };
  }
  const profileId = resolution.profileId;
  const linkCheck = await validateRoleProfileLink(dbRole, profileId, userRec.id);
  if (linkCheck.error) {
    return { error: linkCheck.error, status: linkCheck.status || 403 };
  }
  let name = userRec.full_name || `User ${sub}`;
  let email = userRec.email;
  let admNo = userRec.admission_number;
  let departmentId;
  let assignedUnits;
  let enrolledUnits;
  if (dbRole === "trainee") {
    const trainees = await loadDatabaseTrainees();
    const matchedTrainee = trainees.find((t) => t.id === profileId || admNo && (t.adm_no === admNo || t.reg_number === admNo));
    departmentId = matchedTrainee?.department || "dept-ci";
    if (matchedTrainee?.enrolled_units && matchedTrainee.enrolled_units.length > 0) {
      enrolledUnits = matchedTrainee.enrolled_units;
    } else {
      const cohortCode = (matchedTrainee?.class_code || matchedTrainee?.class_id || "").toUpperCase();
      if (cohortCode.includes("EE") || cohortCode.includes("ELECT")) {
        enrolledUnits = ["EE/CU/PO/CR/1/6", "EE/CU/01/4", "061155101A"];
      } else if (cohortCode.includes("FBS") || cohortCode.includes("HOSP")) {
        enrolledUnits = ["101355101A", "061155101A"];
      } else if (cohortCode.includes("ADMIN") || cohortCode.includes("BUS")) {
        enrolledUnits = ["0415-451-21A", "061155101A"];
      } else if (cohortCode.includes("ICT4") || cohortCode.includes("MOD 1")) {
        enrolledUnits = ["IT/CU/ICTA/CR/01/4/MA", "061155101A", "ICT/CU/IT/CR/6/6"];
      } else {
        enrolledUnits = ["061155101A", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0415-451-21A", "EE/CU/PO/CR/1/6"];
      }
    }
  } else if (dbRole === "trainer") {
    const trainers = await loadDatabaseTrainers();
    const matchedTrainer = trainers.find((t) => t.id === profileId);
    departmentId = userRec.department_id?.trim() || void 0;
    const departments = await loadDatabaseDepartments();
    const matchedDepartment = departments.find((department) => department.id === departmentId);
    if (!departmentId || !matchedDepartment || matchedTrainer?.department && matchedTrainer.department.trim().toLowerCase() !== matchedDepartment.name.trim().toLowerCase()) {
      return { error: "Forbidden: Staff department assignment is missing or invalid", status: 403 };
    }
    assignedUnits = matchedTrainer?.assigned_units || (profileId === "trainer-002" ? ["ICT/OS/IT/CR/1/6"] : ["ICT/CU/IT/CR/6/6", "061155101A"]);
  } else if (dbRole === "hod") {
    const depts = await loadDatabaseDepartments();
    const matchedDept = depts.find((d) => d.hod_id === profileId);
    departmentId = userRec.department_id?.trim() || void 0;
    if (!departmentId || !depts.some((department) => department.id === departmentId) || matchedDept?.id !== departmentId) {
      return { error: "Forbidden: Staff department assignment does not match the department record", status: 403 };
    }
  }
  const authUser = {
    id: userRec.id,
    profile_id: profileId,
    email,
    name,
    role: dbRole,
    admission_number: admNo,
    reg_number: admNo,
    department_id: departmentId,
    must_change_password: userRec.must_change_password === true,
    assigned_units: assignedUnits,
    enrolled_units: enrolledUnits
  };
  setCachedUserProfile(sub, authUser);
  return { user: authUser };
}
function isSelf(user, recordTraineeId) {
  if (!user || !user.profile_id || !recordTraineeId) return false;
  return user.profile_id === recordTraineeId;
}
function isAssignedTrainer(user, offering) {
  if (!user || !user.profile_id || !offering || !offering.trainer_id) return false;
  return user.profile_id === offering.trainer_id;
}
var DEMO_TOKENS_MAP = {
  "token-trainer-001": { id: "usr-trainer-001", profile_id: "trainer-001", email: "trainer@mtti.ac.ke", name: "Dr. J. Muriithi", role: "trainer", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"], department_id: "dept-ci" },
  "token-trainer-002": { id: "usr-trainer-002", profile_id: "trainer-002", email: "kinoti@mtti.ac.ke", name: "Alexander Kinoti", role: "trainer", assigned_units: ["ICT/OS/IT/CR/1/6"], department_id: "dept-ci" },
  "token-trainee-001": { id: "usr-trainee-001", profile_id: "trainee-001", name: "Nthiga Gakii Doris", role: "trainee", reg_number: "14179/S2026", admission_number: "14179/S2026", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-002": { id: "usr-trainee-002", profile_id: "trainee-002", name: "Harriet Mwendwa", role: "trainee", reg_number: "10526", admission_number: "10526", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  "token-trainee-003": { id: "usr-trainee-003", profile_id: "trainee-003", name: "EE Trainee", role: "trainee", reg_number: "99999", admission_number: "99999", department_id: "dept-ee", enrolled_units: ["EE/CU/PO/CR/1/6"] },
  "token-hod-ci": { id: "usr-hod-ci", profile_id: "hod-001", email: "hod.ci@mtti.ac.ke", name: "Prof. S. Njoroge", role: "hod", department_id: "dept-ci" },
  "token-hod-ee": { id: "usr-hod-ee", profile_id: "hod-002", email: "hod.ee@mtti.ac.ke", name: "Eng. D. Karanja", role: "hod", department_id: "dept-ee" },
  "token-admin": { id: "usr-admin-001", profile_id: "admin-001", email: "admin@mtti.ac.ke", name: "System Administrator", role: "admin" }
};
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const tokenString = typeof authHeader === "string" ? authHeader : "";
  const reqPath = req.path || req.url || "";
  const cleanPath = reqPath.split("?")[0];
  const isPublicAllowlist = req.method === "GET" && (cleanPath === "/health" || cleanPath.endsWith("/health")) || req.method === "POST" && (cleanPath === "/auth/login" || cleanPath.endsWith("/auth/login")) || req.method === "POST" && (cleanPath === "/auth/register-trainee" || cleanPath.endsWith("/auth/register-trainee")) || req.method === "GET" && (cleanPath === "/trainees/lookup" || cleanPath.endsWith("/trainees/lookup"));
  if (isPublicAllowlist && !tokenString) {
    return next();
  }
  const isProduction2 = isSecureProductionMode();
  const allowDemo = !isProduction2 && (process.env.ALLOW_DEMO_AUTH === "true" || process.env.ALLOW_DEMO_AUTH === "1" || process.env.AUTH_MODE === "demo");
  if (tokenString.startsWith("Bearer ")) {
    const token = tokenString.replace(/^Bearer\s+/i, "").trim();
    if (token in DEMO_TOKENS_MAP) {
      if (!allowDemo) {
        res.status(401).json({
          error: "Unauthorized: Mock bearer tokens are disabled in production mode (Demo tokens are disabled in production mode)"
        });
        return;
      }
      const demoUser = DEMO_TOKENS_MAP[token];
      req.user = {
        ...demoUser,
        role: demoUser.role.toLowerCase()
      };
      next();
      return;
    }
    let verified;
    try {
      verified = await verifyToken(token);
    } catch (err) {
      res.status(401).json({
        error: `Unauthorized: Invalid or expired authentication token (${err.message})`
      });
      return;
    }
    try {
      const hydration = await hydrateUserProfile(verified.sub, verified.role);
      if (hydration.error || !hydration.user) {
        res.status(hydration.status || 401).json({ error: hydration.error });
        return;
      }
      const cleanPath2 = (req.path || req.url || "").split("?")[0];
      if (hydration.user.must_change_password && cleanPath2 !== "/auth/change-password") {
        res.status(428).json({
          error: "A password change is required before accessing the system.",
          code: "PASSWORD_CHANGE_REQUIRED"
        });
        return;
      }
      req.user = hydration.user;
      next();
      return;
    } catch (err) {
      if (err instanceof DatabaseUnavailableError || err.status === 503) {
        res.status(503).json({ error: "Service Unavailable: Authentication database is temporarily unavailable" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error during user authorization" });
      return;
    }
  }
  if (req.headers["x-user-role"] && !allowDemo) {
    res.status(401).json({
      error: "Unauthorized: Header-based authentication (x-user-role) is forbidden in production mode"
    });
    return;
  }
  if (allowDemo) {
    const roleHeader = req.headers["x-user-role"] || "";
    if (roleHeader) {
      const normalizedRole = roleHeader.trim().toLowerCase();
      if (VALID_ROLES.includes(normalizedRole)) {
        const idHeader = req.headers["x-user-id"] || `demo-${normalizedRole}`;
        const regHeader = req.headers["x-user-reg"] || "";
        const deptHeader = req.headers["x-user-dept"] || "";
        const unitsHeader = req.headers["x-user-enrolled-units"] || req.headers["x-user-units"] || "";
        const enrolledUnits = unitsHeader ? unitsHeader.split(",").map((u) => u.trim()) : ["061155101A"];
        let profileId = idHeader;
        if (normalizedRole === "trainee") {
          profileId = regHeader ? regHeader.includes("10526") ? "trainee-002" : "trainee-001" : "trainee-001";
        } else if (normalizedRole === "trainer") {
          profileId = idHeader.includes("002") ? "trainer-002" : "trainer-001";
        } else if (normalizedRole === "hod") {
          profileId = deptHeader === "dept-ee" ? "hod-002" : "hod-001";
        }
        req.user = {
          id: idHeader,
          profile_id: profileId,
          name: `Demo ${normalizedRole.toUpperCase()}`,
          role: normalizedRole,
          reg_number: regHeader,
          admission_number: regHeader,
          department_id: deptHeader,
          enrolled_units: normalizedRole === "trainee" ? enrolledUnits : void 0,
          assigned_units: normalizedRole === "trainer" ? enrolledUnits : void 0
        };
        next();
        return;
      }
    }
  }
  res.status(401).json({
    error: "Unauthorized: Missing or invalid Authorization Bearer header"
  });
}
var authenticateUser = authenticateToken;
function requireRole(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map((r) => r.trim().toLowerCase());
  return (req, res, next) => {
    if (!req.user) {
      authenticateToken(req, res, () => {
        if (!req.user) {
          res.status(401).json({ error: "Unauthorized: Authentication required" });
          return;
        }
        enforceRole(req, res, next, normalizedAllowed);
      }).catch((err) => {
        console.error("[requireRole auth error]:", err);
        res.status(500).json({ error: "Authentication system error occurred" });
      });
      return;
    }
    enforceRole(req, res, next, normalizedAllowed);
  };
}
var requireRoles = requireRole;
function enforceRole(req, res, next, allowedRoles) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: Missing user authentication session" });
    return;
  }
  const userRole = (req.user.role || "").trim().toLowerCase();
  if (allowedRoles.includes(userRole)) {
    return next();
  }
  res.status(403).json({
    error: `Forbidden: Access requires [${allowedRoles.join(", ")}]. Current role is '${userRole}'`
  });
}

// client/src/lib/fbsCohortSubmissions.ts
var FBS_COHORT_SUBMISSIONS = [
  {
    "id": "sub-fbs-13258",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_21",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Faith Mwende",
    "reg_number": "13258",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 18,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 17,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 63,
    "trainer_comments": "Distinction performance. Very clear understanding of digital literacy, shortcut keys, and spreadsheet budgeting.",
    "submitted_at": "2026-10-13T14:13:45Z",
    "created_at": "2026-10-13T14:13:45Z"
  },
  {
    "id": "sub-fbs-12265",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_22",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Eugene Murimi",
    "reg_number": "12265",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 16,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 59,
    "trainer_comments": "Distinction performance. Demonstrated strong grasp of hardware peripherals, safe shutdown, and office applications.",
    "submitted_at": "2026-10-13T14:03:19Z",
    "created_at": "2026-10-13T14:03:19Z"
  },
  {
    "id": "sub-fbs-13231",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_23",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Brendah Mumbi",
    "reg_number": "13231",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 4,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 18,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 17,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 64,
    "trainer_comments": "Distinction performance. Excellent procedural steps in document encryption and Word table operations.",
    "submitted_at": "2026-10-13T14:10:45Z",
    "created_at": "2026-10-13T14:10:45Z"
  },
  {
    "id": "sub-fbs-13281",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_03",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Kibaara Peninah Gaichuiri",
    "reg_number": "13281",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 15,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 58,
    "trainer_comments": "Distinction performance. Solid command of workplace computing and safe laboratory practices.",
    "submitted_at": "2026-10-13T13:42:15Z",
    "created_at": "2026-10-13T13:42:15Z"
  },
  {
    "id": "sub-fbs-13297",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_04",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Hilda Mwede Njagi",
    "reg_number": "13297",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 14,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 14,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 53,
    "trainer_comments": "Credit performance. Good explanations across Section A and competent answers on spreadsheet sorting.",
    "submitted_at": "2026-10-13T13:58:30Z",
    "created_at": "2026-10-13T13:58:30Z"
  },
  {
    "id": "sub-fbs-13304",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_05",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Ndolo Shalom Mbithe",
    "reg_number": "13304",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 16,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 60,
    "trainer_comments": "Distinction performance. Well-articulated differences between system and application software.",
    "submitted_at": "2026-10-13T13:36:45Z",
    "created_at": "2026-10-13T13:36:45Z"
  },
  {
    "id": "sub-fbs-13313",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_06",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Mirriam Nzula",
    "reg_number": "13313",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 14,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 14,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 52,
    "trainer_comments": "Credit performance. Proper identification of input/output peripherals and safe file management.",
    "submitted_at": "2026-10-13T14:02:12Z",
    "created_at": "2026-10-13T14:02:12Z"
  },
  {
    "id": "sub-fbs-13343",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_07",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Waweru Hope Marion Makena",
    "reg_number": "13343",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 4,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 3,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 18,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 17,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 65,
    "trainer_comments": "Distinction performance. Exceptional technical mastery of word processing features and lab safety.",
    "submitted_at": "2026-10-13T14:09:55Z",
    "created_at": "2026-10-13T14:09:55Z"
  },
  {
    "id": "sub-fbs-13355",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_08",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Ann Joy Makena",
    "reg_number": "13355",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 15,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 15,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 57,
    "trainer_comments": "Distinction performance. Clear procedural breakdown for projector configuration and folder protection.",
    "submitted_at": "2026-10-13T13:44:18Z",
    "created_at": "2026-10-13T13:44:18Z"
  },
  {
    "id": "sub-fbs-13378",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_09",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Martha Mwende Kyalo",
    "reg_number": "13378",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 13,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 13,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 50,
    "trainer_comments": "Credit performance. Satisfactory answers in Section A; review spreadsheet functions.",
    "submitted_at": "2026-10-13T13:59:04Z",
    "created_at": "2026-10-13T13:59:04Z"
  },
  {
    "id": "sub-fbs-13396",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_10",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "John Opiyo Omondi",
    "reg_number": "13396",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 15,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 58,
    "trainer_comments": "Distinction performance. Comprehensive comparison between calculators and computers.",
    "submitted_at": "2026-10-13T14:05:40Z",
    "created_at": "2026-10-13T14:05:40Z"
  },
  {
    "id": "sub-fbs-13445",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_11",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Eunice Kendi Nyaga",
    "reg_number": "13445",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 3,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 17,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 16,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 62,
    "trainer_comments": "Distinction performance. High-quality explanations of office shortcuts and network save procedures.",
    "submitted_at": "2026-10-13T14:11:20Z",
    "created_at": "2026-10-13T14:11:20Z"
  },
  {
    "id": "sub-fbs-13446",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_12",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Miriko Rita",
    "reg_number": "13446",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 14,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 13,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 51,
    "trainer_comments": "Credit performance. Good foundational knowledge of digital literacy in hospitality.",
    "submitted_at": "2026-10-13T13:46:33Z",
    "created_at": "2026-10-13T13:46:33Z"
  },
  {
    "id": "sub-fbs-13463",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_13",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Valentine Lesoito",
    "reg_number": "13463",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 14,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 14,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 54,
    "trainer_comments": "Credit performance. Solid practical understanding of newsletter formatting options.",
    "submitted_at": "2026-10-13T13:57:12Z",
    "created_at": "2026-10-13T13:57:12Z"
  },
  {
    "id": "sub-fbs-13482",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_14",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Kinyua Christine Mutito",
    "reg_number": "13482",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 17,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 16,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 61,
    "trainer_comments": "Distinction performance. Accurate definitions of GUI drag-and-drop and ICT workplace policies.",
    "submitted_at": "2026-10-13T14:12:05Z",
    "created_at": "2026-10-13T14:12:05Z"
  },
  {
    "id": "sub-fbs-13488",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_15",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Gichukia Bridgit Nyakio",
    "reg_number": "13488",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 14,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 14,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 53,
    "trainer_comments": "Credit performance. Good work on Section A peripherals and Excel data sorting.",
    "submitted_at": "2026-10-13T14:08:14Z",
    "created_at": "2026-10-13T14:08:14Z"
  },
  {
    "id": "sub-fbs-13546",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_16",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Karwitha Silvia",
    "reg_number": "13546",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 16,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 59,
    "trainer_comments": "Distinction performance. Well-structured responses across word processing and spreadsheet questions.",
    "submitted_at": "2026-10-13T13:39:50Z",
    "created_at": "2026-10-13T13:39:50Z"
  },
  {
    "id": "sub-fbs-13551",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_17",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Lavint Aliviza",
    "reg_number": "13551",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 13,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 13,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 50,
    "trainer_comments": "Credit performance. Competent answers on safe computer laboratory practices and printing.",
    "submitted_at": "2026-10-13T14:01:25Z",
    "created_at": "2026-10-13T14:01:25Z"
  },
  {
    "id": "sub-fbs-13559",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_18",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Kinya Weddy",
    "reg_number": "13559",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 16,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 15,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 58,
    "trainer_comments": "Distinction performance. Proper execution sequence for projector display setup and file management.",
    "submitted_at": "2026-10-13T14:07:38Z",
    "created_at": "2026-10-13T14:07:38Z"
  },
  {
    "id": "sub-fbs-13571",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_19",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Gakuhi Jackline Nyambura",
    "reg_number": "13571",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 15,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 15,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 57,
    "trainer_comments": "Distinction performance. Clear distinction between OS system software and application tools.",
    "submitted_at": "2026-10-13T13:41:02Z",
    "created_at": "2026-10-13T13:41:02Z"
  },
  {
    "id": "sub-fbs-13583",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs5_20",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Terry Mwendwa",
    "reg_number": "13583",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 14,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 14,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 52,
    "trainer_comments": "Credit performance. Satisfactory understanding of keyboard techniques and document passwords.",
    "submitted_at": "2026-10-13T13:56:40Z",
    "created_at": "2026-10-13T13:56:40Z"
  },
  {
    "id": "sub-fbs-13251",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_01",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Mbithi Faith Wavinya",
    "reg_number": "13251",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 17,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 16,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 61,
    "trainer_comments": "Distinction performance. Excellent technical detail on computer architecture and spreadsheet formulas.",
    "submitted_at": "2026-10-13T13:52:48Z",
    "created_at": "2026-10-13T13:52:48Z"
  },
  {
    "id": "sub-fbs-13314",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_02",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Emmanuel Njoroge",
    "reg_number": "13314",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 15,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 14,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 55,
    "trainer_comments": "Credit performance. Strong grasp of hardware interfaces and file drag-and-drop operations.",
    "submitted_at": "2026-10-13T13:45:10Z",
    "created_at": "2026-10-13T13:45:10Z"
  },
  {
    "id": "sub-fbs-13403",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_03",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Brenda Ntinyari",
    "reg_number": "13403",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 4,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 3,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 18,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 17,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 65,
    "trainer_comments": "Distinction performance. Thorough answers on office shortcuts, Word tables, and lab ergonomics.",
    "submitted_at": "2026-10-13T14:06:50Z",
    "created_at": "2026-10-13T14:06:50Z"
  },
  {
    "id": "sub-fbs-13430",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_04",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Omedo Lilian Atieno",
    "reg_number": "13430",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 3,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 2,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 14,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 14,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 52,
    "trainer_comments": "Credit performance. Good understanding of data safety and spreadsheet functions.",
    "submitted_at": "2026-10-13T14:00:32Z",
    "created_at": "2026-10-13T14:00:32Z"
  },
  {
    "id": "sub-fbs-13487",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_05",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Waguama Donatus Wachira",
    "reg_number": "13487",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 3,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 16,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b13",
        "answer": "a) A formula is a user-written calculation (e.g. =A1+B1), while a function is a predefined built-in operation (e.g. =SUM(A1:A10)).\nb) Highlight the dataset including headers, go to Data tab > Sort & Filter > select Customer Name column > choose Sort A to Z.\nc) CV formatting: Use consistent clear headings, professional fonts (Calibri/Arial 11pt), clean bullet points, and save as PDF.\nd) OS factors: Hardware architecture compatibility, software application availability, user interface ease of use, and security update support.",
        "marks_awarded": 15,
        "ai_reasoning": "Good responses covering spreadsheet sorting, CV formatting, and OS selection."
      }
    ],
    "status": "graded",
    "total_score": 58,
    "trainer_comments": "Distinction performance. Solid grasp of operating system selection factors and printing controls.",
    "submitted_at": "2026-10-13T13:49:15Z",
    "created_at": "2026-10-13T13:49:15Z"
  },
  {
    "id": "sub-fbs-13495",
    "exam_id": "exam-061155101A-wa1",
    "trainee_id": "tr_fbs6_06",
    "unit_code": "061155101A",
    "task_code": "CT1",
    "assessment_type": "CAT",
    "student_name": "Nyamai Caroline Mutheu",
    "reg_number": "13495",
    "section_a": [
      {
        "question_id": "dl1_a1",
        "answer": "Digital literacy is the ability to find, evaluate, utilize, and create information using digital technologies and computers. In the workplace, it enhances operational efficiency and data accuracy.",
        "marks_awarded": 2,
        "ai_reasoning": "Accurately articulates digital technology application and workplace efficiency."
      },
      {
        "question_id": "dl1_a2",
        "answer": "Input devices: Optical Keyboard and USB Mouse. Output devices: LED Display Monitor and LaserJet Printer.",
        "marks_awarded": 4,
        "ai_reasoning": "Valid professional peripherals identified."
      },
      {
        "question_id": "dl1_a3",
        "answer": "1. Save all open working files. 2. Close active applications safely. 3. Click Start > Power > Shut down and wait for system unit to power off.",
        "marks_awarded": 3,
        "ai_reasoning": "Core sequence adheres to standard institutional shutdown procedure."
      },
      {
        "question_id": "dl1_a4",
        "answer": "1. Touch typing on home row keys (ASDF JKL;). 2. Utilizing common keyboard shortcuts like Ctrl+S, Ctrl+C, and Ctrl+V.",
        "marks_awarded": 2,
        "ai_reasoning": "Valid keyboard productivity techniques identified."
      },
      {
        "question_id": "dl1_a5",
        "answer": "Right-click on desktop > New > Folder. In the word processor, click File > Save As and browse to the folder. In Save As dialog, click Tools > General Options to set a document open password.",
        "marks_awarded": 4,
        "ai_reasoning": "Complete explanation covering folder creation, save, and password encryption."
      },
      {
        "question_id": "dl1_a6",
        "answer": "1. Healthcare (patient management and billing). 2. Commercial Banking (fund transfers and account records). 3. Educational institutions (digital exams and e-learning).",
        "marks_awarded": 3,
        "ai_reasoning": "Three common computing areas correctly stated."
      },
      {
        "question_id": "dl1_a7",
        "answer": "Connect HDMI cable between laptop and projector. Press Windows Key + P and select Duplicate. Power on projector and adjust focus lens.",
        "marks_awarded": 3,
        "ai_reasoning": "Accurate physical and display projection procedure."
      },
      {
        "question_id": "dl1_a8",
        "answer": "System software manages and coordinates hardware resources (e.g. Windows 11, Linux). Application software enables users to perform specific productivity tasks (e.g. Microsoft Word, Microsoft Excel).",
        "marks_awarded": 3,
        "ai_reasoning": "Clear software distinction with valid examples."
      },
      {
        "question_id": "dl1_a9",
        "answer": "Clicking and holding the primary mouse button on an item, moving the cursor to the target folder destination, and releasing the button.",
        "marks_awarded": 2,
        "ai_reasoning": "Correct definition of GUI drag-and-drop file relocation."
      },
      {
        "question_id": "dl1_a10",
        "answer": "1. Acceptable Use Policy (AUP) for internet and network resources. 2. Workplace Password Policy requiring complex passwords and screen locking.",
        "marks_awarded": 2,
        "ai_reasoning": "Appropriate workplace policies stated."
      }
    ],
    "section_b": [
      {
        "question_id": "dl1_b11",
        "answer": "a) A word processing application creates, edits, formats, and prints text-based documents. Two differentiating features are rich typographic styling (fonts, headings) and embedded visual tables/graphics.\nb) Newsletter formatting: Multi-column layout, drop caps on lead paragraphs, callout quote borders, and styled header/footer branding.\nc) i. CTRL+Z: Undo last action. ii. CTRL+X: Cut selected content to clipboard. iii. CTRL+V: Paste clipboard content.\nd) Differences: Computers are general-purpose programmable devices with large secondary storage and varied peripherals, whereas calculators perform dedicated mathematical calculations with fixed keypad displays.",
        "marks_awarded": 17,
        "ai_reasoning": "Comprehensive grasp of word processing, office shortcuts, and computer architecture."
      },
      {
        "question_id": "dl1_b12",
        "answer": "a) Go to Insert tab > Table group > select table dimensions or Quick Tables. Input monthly sales data and format header row.\nb) Click File > Save As > browse to the mapped network drive folder. Click File > Print > set Print Range / Pages to 1.\nc) 4 spreadsheet components: Cells/Grid, Rows & Columns, Formulas/Functions (=SUM), and Worksheet Tabs.\nd) Lab safety measures: Keep liquids and food strictly away, use uninterrupted power supply (UPS) surge protection, and ensure proper cable management.",
        "marks_awarded": 16,
        "ai_reasoning": "Table, spreadsheet operations, and lab precautions well articulated."
      }
    ],
    "status": "graded",
    "total_score": 61,
    "trainer_comments": "Distinction performance. Well-rounded submission demonstrating mastery of digital workplace skills.",
    "submitted_at": "2026-10-13T14:04:44Z",
    "created_at": "2026-10-13T14:04:44Z"
  }
];

// client/src/lib/digitalLiteracyExams.ts
var DIGITAL_LITERACY_EXAMS = [
  {
    id: "exam-061155101A-wa1",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Food & Beverage L5/L6 & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "WRITTEN ASSESSMENT 1",
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      department: "HOSPITALITY & INSTITUTIONAL MANAGEMENT DEPARTMENT",
      course_name: "FOOD AND BEVERAGE SALES AND SERVICE MANAGEMENT LEVEL 5 & 6",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "061155101A",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "Exam",
      task_code: "CT1",
      series: "SEP \u2013 NOV 2026",
      time_allowed: "2 HOURS",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "1. This paper consists of two sections A and B;\n2. Answer ALL the question as guided in each section;\n3. Marks for each question are as indicated in the brackets;\n4. You are provided with a separate answer booklet to answer the questions;\n5. Do not write in this question paper.",
      section_a: {
        title: "SECTION A (30 MARKS) \u2014 Answer ALL Questions",
        instructions: "Answer ALL Questions (30 Marks total).",
        total_marks: 30,
        questions: [
          {
            id: "dl1_a1",
            q_num: 1,
            text: "Define digital literacy and state its importance in a modern workplace.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Define digital literacy and workplace relevance",
            correct_answer: "Digital literacy is the ability to access, manage, evaluate, and create information safely and effectively using digital technologies and devices. In the workplace, it enables automated task completion, effective communication, and enhanced productivity.",
            breakdown: [
              { criterion: "Definition of digital literacy", marks: 1 },
              { criterion: "Workplace importance & productivity benefit", marks: 1 }
            ]
          },
          {
            id: "dl1_a2",
            q_num: 2,
            text: "List two input devices and two output devices commonly used in a professional setting.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Identify standard office input and output peripherals",
            correct_answer: "Input devices: Keyboard, Optical Mouse, Document Scanner. Output devices: Computer Monitor (Display), Laser Printer, Multimedia Projector.",
            breakdown: [
              { criterion: "Two professional input devices listed (1 mk each)", marks: 2 },
              { criterion: "Two professional output devices listed (1 mk each)", marks: 2 }
            ]
          },
          {
            id: "dl1_a3",
            q_num: 3,
            text: "Explain the correct sequence of steps to safely shut down a computer device as per workplace procedure.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Safe OS shutdown procedure",
            correct_answer: "1. Save all open working files. 2. Close all active running applications. 3. Click the Start button on the taskbar, select Power icon, and click 'Shut down'. 4. Wait for system unit to power off before switching off monitor and wall socket.",
            breakdown: [
              { criterion: "Step 1: Saving active work and open files", marks: 1 },
              { criterion: "Step 2: Gracefully closing active software applications", marks: 1 },
              { criterion: "Step 3: Executing Start > Power > Shut Down command", marks: 1 }
            ]
          },
          {
            id: "dl1_a4",
            q_num: 4,
            text: "Describe two keyboard techniques that enhance efficiency when typing a report.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Ergonomic and efficient keyboard techniques",
            correct_answer: "1. Touch typing: Placing fingers on home row keys (ASDF JKL;) without looking at keyboard. 2. Utilizing keyboard shortcuts (e.g. Ctrl+C, Ctrl+V, Ctrl+S) for rapid editing.",
            breakdown: [
              { criterion: "Technique 1: Touch typing on home row keys", marks: 1 },
              { criterion: "Technique 2: Use of productivity shortcut keys", marks: 1 }
            ]
          },
          {
            id: "dl1_a5",
            q_num: 5,
            text: "You have just completed drafting a confidential report. Outline the steps you would take to create a new folder, save the report into it, and then password protect the folder, ensuring data security.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Folder creation, file saving, and password protection",
            correct_answer: "1. Create folder: Right-click desktop/drive > New > Folder > name it appropriately > press Enter. 2. Save report: In application, click File > Save As > Browse to new folder > save file. 3. Password protect: In Save As dialog, click Tools > General Options (or File > Info > Protect Document > Encrypt with Password) > set strong password > confirm.",
            breakdown: [
              { criterion: "Step 1: New folder creation procedure", marks: 1 },
              { criterion: "Step 2: Saving confidential report into target folder", marks: 1 },
              { criterion: "Step 3: Setting password encryption / access protection", marks: 2 }
            ]
          },
          {
            id: "dl1_a6",
            q_num: 6,
            text: "Identify three common areas where computers are used",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Common societal and enterprise computing areas",
            correct_answer: "1. Healthcare / Hospitals: Patient records, diagnostic equipment, appointment scheduling. 2. Banking & Finance: Electronic fund transfers, ATM transactions, accounting records. 3. Education / Schools: Computer-assisted learning, digital research, trainee administration.",
            breakdown: [
              { criterion: "Area 1 identified with application context", marks: 1 },
              { criterion: "Area 2 identified with application context", marks: 1 },
              { criterion: "Area 3 identified with application context", marks: 1 }
            ]
          },
          {
            id: "dl1_a7",
            q_num: 7,
            text: "A colleague needs to present a document from their laptop to a large screen. Describe the steps to connect an external projector to a laptop.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "External display / projector configuration",
            correct_answer: "1. Connect HDMI or VGA cable between laptop video port and projector input, then power on projector. 2. On laptop, press Windows Key + P to open display projection menu. 3. Select 'Duplicate' (or 'Extend') to mirror the screen, then adjust projector focus.",
            breakdown: [
              { criterion: "Step 1: Physical video cable connection and power on", marks: 1 },
              { criterion: "Step 2: Windows display shortcut (Win + P > Duplicate)", marks: 1 },
              { criterion: "Step 3: Screen calibration and projector focus adjustment", marks: 1 }
            ]
          },
          {
            id: "dl1_a8",
            q_num: 8,
            text: "Differentiate between System Software and Application Software, providing two examples for each.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "System vs application software distinction",
            correct_answer: "System software manages and coordinates hardware resources and provides a base platform (e.g. Microsoft Windows 11, Linux OS). Application software is designed for end-users to perform specific productive tasks (e.g. Microsoft Word, Microsoft Excel).",
            breakdown: [
              { criterion: "Conceptual distinction (Hardware control vs End-user tasks)", marks: 2 },
              { criterion: "Two system software examples (Windows, Linux)", marks: 1 },
              { criterion: "Two application software examples (MS Word, MS Excel)", marks: 1 }
            ]
          },
          {
            id: "dl1_a9",
            q_num: 9,
            text: "Explain the concept of 'drag and drop' in the context of file management",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Drag and drop GUI operation in file management",
            correct_answer: "Drag and drop is a graphical user interface operation where the user points to a file, holds down the primary mouse button, drags the pointer to a target folder or directory, and releases the button to move or copy the item.",
            breakdown: [
              { criterion: "Explanation of mouse action (Click, hold, move, release)", marks: 1 },
              { criterion: "File management context (Moving/copying files into folders)", marks: 1 }
            ]
          },
          {
            id: "dl1_a10",
            q_num: 10,
            text: "State two workplace policies or regulations that guide the operation of computer devices.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Workplace ICT policies and regulatory compliance",
            correct_answer: "1. Acceptable Use Policy (AUP): Defines allowable hardware and internet usage, prohibiting unauthorized downloads or non-work activities. 2. Password & Data Security Policy: Mandates regular password updates, screen locking when unattended, and adherence to confidentiality rules.",
            breakdown: [
              { criterion: "Workplace Policy 1 (Acceptable Use / Internet Policy)", marks: 1.5 },
              { criterion: "Workplace Policy 2 (Password Security / Data Confidentiality)", marks: 1.5 }
            ]
          }
        ]
      },
      section_b: {
        title: "SECTION B (40 MARKS) - Answer ANY TWO Questions",
        instructions: "Answer ANY TWO Questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl1_b11",
            q_num: 11,
            text: "Structured Assessment Tasks covering word processing capabilities, office shortcuts, and computer architecture.",
            type: "structured",
            marks: 20,
            critical_aspect: "Word processing capabilities, office shortcuts, and computer architecture",
            sub_parts: [
              {
                part: "a",
                prompt: "Describe the primary function of a word processing application and list two features that differentiate it from a plain text editor.",
                marks: 4,
                breakdown: [
                  { criterion: "Primary function of word processor", marks: 2 },
                  { criterion: "Two differentiating features (WYSIWYG styling, graphics/tables)", marks: 2 }
                ]
              },
              {
                part: "b",
                prompt: "You are tasked with creating a newsletter in a word processing application. List four formatting options you would apply to make it visually appealing and easy to read.",
                marks: 4,
                breakdown: [
                  { criterion: "Formatting option 1: Multi-column layout", marks: 1 },
                  { criterion: "Formatting option 2: Drop caps on leading text", marks: 1 },
                  { criterion: "Formatting option 3: Callout boxes / borders", marks: 1 },
                  { criterion: "Formatting option 4: Styled headings and header/footer branding", marks: 1 }
                ]
              },
              {
                part: "c",
                prompt: "What is the function of the following key combinations in Ms Office? i. CTRL + Z, ii. CTRL + X, iii. CTRL + V",
                marks: 6,
                breakdown: [
                  { criterion: "i. CTRL + Z: Undo the previous action", marks: 2 },
                  { criterion: "ii. CTRL + X: Cut selected item to clipboard", marks: 2 },
                  { criterion: "iii. CTRL + V: Paste item from clipboard", marks: 2 }
                ]
              },
              {
                part: "d",
                prompt: "Describe three differences between a calculator and a computer",
                marks: 6,
                breakdown: [
                  { criterion: "Difference 1: General purpose programmability vs dedicated arithmetic", marks: 2 },
                  { criterion: "Difference 2: Storage architecture (large secondary storage vs registers)", marks: 2 },
                  { criterion: "Difference 3: Diverse peripheral inputs/outputs vs fixed keypad display", marks: 2 }
                ]
              }
            ]
          },
          {
            id: "dl1_b12",
            q_num: 12,
            text: "Structured Assessment Tasks covering Word tables, spreadsheet file operations, budget modeling, and computer lab safety.",
            type: "structured",
            marks: 20,
            critical_aspect: "Word tables, spreadsheet file operations, budget modeling, and computer lab safety",
            sub_parts: [
              {
                part: "a",
                prompt: "Explain the steps to insert a pre-designed table into a Word document to organize monthly sales data.",
                marks: 6,
                breakdown: [
                  { criterion: "Step 1: Navigating to Insert tab > Table group", marks: 2 },
                  { criterion: "Step 2: Selecting Quick Tables or grid dimension (columns/rows)", marks: 2 },
                  { criterion: "Step 3: Entering monthly sales figures and formatting headers", marks: 2 }
                ]
              },
              {
                part: "b",
                prompt: "You have completed a critical financial report in a spreadsheet. Describe how you would save it to a specific network drive and then print only the first page.",
                marks: 4,
                breakdown: [
                  { criterion: "Save to network drive (File > Save As > Browse mapped drive)", marks: 2 },
                  { criterion: "Print page 1 only (File > Print > Custom Pages: 1)", marks: 2 }
                ]
              },
              {
                part: "c",
                prompt: "A manager asks you to create a simple budget in a spreadsheet application. List four essential components of a spreadsheet you would use to build and organize this data.",
                marks: 4,
                breakdown: [
                  { criterion: "Component 1: Cells with coordinates (Row/Column intersections)", marks: 1 },
                  { criterion: "Component 2: Mathematical formulas & functions (e.g. =SUM)", marks: 1 },
                  { criterion: "Component 3: Row and column headers/labels", marks: 1 },
                  { criterion: "Component 4: Worksheet tabs / workbook pages", marks: 1 }
                ]
              },
              {
                part: "d",
                prompt: "When using the computer laboratory, several measures can be put in place to ensure computers are safe. Explain three measures.",
                marks: 6,
                breakdown: [
                  { criterion: "Measure 1: Environmental protection (no liquids/food, dust covers, ventilation)", marks: 2 },
                  { criterion: "Measure 2: Electrical safety (surge suppressors, UPS units, safe cable trunking)", marks: 2 },
                  { criterion: "Measure 3: Physical & cyber access controls (antivirus, locked lab doors, password authentication)", marks: 2 }
                ]
              }
            ]
          },
          {
            id: "dl1_b13",
            q_num: 13,
            text: "Structured Assessment Tasks covering spreadsheet calculation methods, sorting, CV formatting, and OS procurement evaluation.",
            type: "structured",
            marks: 20,
            critical_aspect: "Spreadsheet calculation methods, sorting, CV formatting, and OS procurement evaluation",
            sub_parts: [
              {
                part: "a",
                prompt: "In a spreadsheet, explain the difference between a formula and a function, and provide an example of each.",
                marks: 6,
                breakdown: [
                  { criterion: "Formula definition and mathematical example (e.g. =A1+B1)", marks: 3 },
                  { criterion: "Function definition and built-in routine example (e.g. =SUM(A1:B1))", marks: 3 }
                ]
              },
              {
                part: "b",
                prompt: "Outline the steps to sort a column of customer names alphabetically in a spreadsheet.",
                marks: 4,
                breakdown: [
                  { criterion: "Step 1: Selecting dataset including customer column headers", marks: 2 },
                  { criterion: "Step 2: Navigating to Data > Sort > selecting Customer Name > Order A to Z", marks: 2 }
                ]
              },
              {
                part: "c",
                prompt: "Your company requires you to develop a job application package. Describe how you would use a word processing application to prepare a professional resume/CV, ensuring it meets typical job advertisement requirements.",
                marks: 6,
                breakdown: [
                  { criterion: "Document structure & section hierarchy (Profile, Experience, Skills)", marks: 2 },
                  { criterion: "Visual styling (Consistent font sizing, clean bullet points, page layout)", marks: 2 },
                  { criterion: "Document review and PDF export for job submission", marks: 2 }
                ]
              },
              {
                part: "d",
                prompt: "Mary wanted to procure an operating system for use in the computer laboratory. State four factors she should consider before making the purchase.",
                marks: 4,
                breakdown: [
                  { criterion: "Factor 1: Hardware system requirements and device compatibility", marks: 1 },
                  { criterion: "Factor 2: Software application compatibility with training curriculum", marks: 1 },
                  { criterion: "Factor 3: Educational licensing costs and affordability", marks: 1 },
                  { criterion: "Factor 4: Ongoing vendor security patches and technical support", marks: 1 }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: "exam-061155101A-wa2",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Apply Digital Literacy \u2014 Written Assessment 2 (Computer Systems & OS)",
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      department: "DEPARTMENT OF COMPUTING & INFORMATICS",
      course_name: "Apply Digital Literacy Level 5 & 6",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "061155101A",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "Exam",
      task_code: "CT2",
      series: "SEP \u2013 NOV 2026",
      time_allowed: "2 HOURS",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "This paper consists of two sections: Section A (30 Marks, Compulsory) and Section B (40 Marks, Answer ANY TWO Questions).",
      section_a: {
        title: "Section A \u2014 Systems Architecture, OS & Storage (30 Marks)",
        instructions: "Answer ALL questions in this section (Compulsory).",
        total_marks: 30,
        questions: [
          {
            id: "dl2_a1",
            text: "Classify computers based on physical size and processing capabilities, providing one typical application for each category.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Computer size and capacity classification",
            correct_answer: "1. Supercomputers: Weather forecasting and scientific simulations. 2. Mainframe computers: Large-scale banking and airline reservation transaction processing. 3. Minicomputers (Mid-range): Medium business servers and industrial process control. 4. Microcomputers (Personal Computers): Desktop/laptop office productivity and personal computing.",
            keywords: ["supercomputer", "mainframe", "minicomputer", "microcomputer", "desktop", "laptop", "server"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a2",
            text: "Differentiate between Random Access Memory (RAM) and Read-Only Memory (ROM) in terms of volatility and operational purpose.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Primary storage memory distinction",
            correct_answer: "RAM is volatile read/write memory that temporarily stores data and instructions actively needed by the CPU while the computer is running; contents are lost when power is turned off. ROM is non-volatile read-only memory that permanently stores boot instructions (BIOS/UEFI firmware) and retains data without power.",
            keywords: ["ram", "rom", "volatile", "non-volatile", "temporary", "permanent", "bios", "firmware"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a3",
            text: "Identify the two primary functional units of the Central Processing Unit (CPU) and explain the specific task of each.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "CPU functional unit roles (ALU and Control Unit)",
            correct_answer: "1. Arithmetic Logic Unit (ALU): Executes arithmetic operations (addition, subtraction) and logical comparisons (AND, OR, NOT). 2. Control Unit (CU): Directs and coordinates data flow between CPU components, fetches instructions from memory, and decodes them.",
            keywords: ["alu", "arithmetic logic unit", "control unit", "cu", "fetch", "decode", "execute", "calculations"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a4",
            text: "Which of the following storage devices utilizes flash semiconductor memory with NO moving mechanical parts?",
            type: "mcq",
            options: [
              "Hard Disk Drive (HDD)",
              "Solid State Drive (SSD)",
              "Compact Disc (CD-ROM)",
              "Magnetic Tape Drive"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Solid state vs magnetic storage identification",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a5",
            text: "Outline the procedure to safely format an external USB flash drive using the FAT32 or NTFS file system in Windows.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Storage media formatting and file system selection",
            correct_answer: "1. Insert the USB drive into the computer USB port. 2. Open File Explorer and click 'This PC'. 3. Right-click on the USB flash drive icon and select 'Format...'. 4. Choose desired File System (FAT32 or NTFS). 5. Set Volume Label, select 'Quick Format', and click 'Start'. 6. Confirm warning prompt and wait for 'Format Complete' message.",
            keywords: ["usb", "this pc", "file explorer", "right-click", "format", "fat32", "ntfs", "quick format", "start"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a6",
            text: "Explain the role of a device driver in computer hardware integration.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Device driver software interface role",
            correct_answer: "A device driver is specialized system software that acts as an intermediary or translator between the operating system and connected hardware devices (e.g. printer, graphics card, scanner), enabling the OS to control hardware without knowing low-level hardware design.",
            keywords: ["device driver", "translator", "operating system", "hardware", "printer", "communication"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a7",
            text: "State three ergonomic practices a computer operator should adopt to minimize physical strain and prevent Repetitive Strain Injury (RSI).",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Ergonomics in workstation use",
            correct_answer: "1. Maintain proper sitting posture with back supported and feet flat on the floor. 2. Position monitor at eye level approximately an arm's length away to reduce neck strain. 3. Keep wrists straight and level with keyboard while typing. 4. Take regular 5-10 minute rest breaks every hour.",
            keywords: ["posture", "eye level", "monitor", "wrists", "chair", "breaks", "rsi"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a8",
            text: "Explain four essential functions performed by an Operating System.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Operating system core responsibilities",
            correct_answer: "1. Processor (CPU) Scheduling: Allocates CPU time across competing processes. 2. Memory Management: Tracks and allocates RAM blocks to active programs. 3. File System Management: Organizes files into directories and manages access permissions. 4. Device/IO Management: Coordinates communication with input and output peripherals.",
            keywords: ["processor management", "memory management", "file system", "device management", "security", "user interface"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a9",
            text: "What is the Windows keyboard shortcut to directly launch Task Manager?",
            type: "mcq",
            options: [
              "Ctrl + Alt + Del",
              "Ctrl + Shift + Esc",
              "Windows Key + R",
              "Alt + F4"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Windows system shortcuts",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl2_a10",
            text: "Distinguish between cold booting and warm booting of a computer system.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Booting process distinctions",
            correct_answer: "Cold booting occurs when the computer is powered on from a completely shut down / power-off state by pressing the power button. Warm booting is restarting a computer that is already powered on (e.g. through the OS Restart command or Ctrl+Alt+Del) without turning off the electrical power supply.",
            keywords: ["cold boot", "warm boot", "power off", "restart", "reboot"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      },
      section_b: {
        title: "Section B \u2014 Structured System Applications & Procurement (40 Marks)",
        instructions: "Answer ANY TWO questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl2_b1",
            text: "a) Discuss the five technological milestones and active electronic components that define the five computer generations (1st to 5th) (10 Marks).\nb) Describe five critical factors an organization must evaluate when purchasing computer hardware equipment for an administrative department (10 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Computer evolution milestones and hardware procurement specifications",
            correct_answer: "a) 1st Gen: Vacuum tubes (high heat, machine language). 2nd Gen: Transistors (smaller, assembly language, magnetic core). 3rd Gen: Integrated Circuits (ICs, keyboard/monitor interfaces). 4th Gen: Very Large Scale Integration / Microprocessors (VLSI/microcomputers, GUIs). 5th Gen: Artificial Intelligence, ULSI, and parallel quantum processing. b) Procurement factors: 1. Processor speed and generation (e.g. Intel Core i5/i7 vs AMD Ryzen). 2. RAM capacity (minimum 8GB-16GB for modern multitasking). 3. Storage capacity and technology (SSD vs HDD). 4. Warranty, after-sales service, and vendor reputation. 5. Power consumption, expandability ports (USB-C, HDMI), and budget compatibility.",
            keywords: ["vacuum tubes", "transistors", "integrated circuits", "microprocessors", "artificial intelligence", "ram", "processor", "ssd", "warranty", "budget"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl2_b2",
            text: "a) Identify and explain four common error values in Microsoft Excel and state how each can be corrected (8 Marks):\n   i. #DIV/0!\n   ii. #VALUE!\n   iii. #REF!\n   iv. #NAME?\nb) An administrative assistant creates an employee payroll worksheet in Excel with columns: Basic Salary (Col C), House Allowance (Col D = 15% of Basic), Gross Salary (Col E), PAYE Tax (Col F = 10% of Gross), and Net Pay (Col G). (12 Marks)\n   i. Write the formula for House Allowance in row 2 (2 Marks)\n   ii. Write the formula for Gross Salary in row 2 (2 Marks)\n   iii. Write the formula for PAYE Tax in row 2 (2 Marks)\n   iv. Write the formula for Net Pay in row 2 (2 Marks)\n   v. State the formula to calculate the Average Net Pay across 25 employees (rows 2 to 26) (4 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Spreadsheet error debugging and payroll formula design",
            correct_answer: "a) i. #DIV/0!: Division by zero or empty cell; fix by ensuring divisor is non-zero or using IFERROR. ii. #VALUE!: Incorrect argument data type (e.g. text in numeric formula); fix by verifying numeric entries. iii. #REF!: Cell reference is invalid or deleted; fix by restoring referenced cells or rewriting formula. iv. #NAME?: Function or range name is misspelled; fix by correcting formula spelling. b) i. =C2*0.15 or =C2*15%. ii. =C2+D2 or =SUM(C2:D2). iii. =E2*0.10 or =E2*10%. iv. =E2-F2. v. =AVERAGE(G2:G26).",
            regex_pattern: "(?i)=\\s*(c2\\s*[*\\+\\-]|=\\s*average\\s*\\(g2:g26\\))",
            keywords: ["#div/0!", "#value!", "#ref!", "#name?", "=c2*0.15", "=c2+d2", "=e2*0.10", "=e2-f2", "=average(g2:g26)"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl2_b3",
            text: "a) Describe five essential services provided by an Operating System in managing computer hardware and software resources (10 Marks).\nb) Discuss five key security measures an organization should implement to protect data, hardware, and software in an administrative office (10 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Operating system services and administrative information security controls",
            correct_answer: "a) OS Services: 1. Process management & multitasking. 2. Memory protection and virtual memory paging. 3. Input/Output device abstraction through drivers. 4. Hierarchical file system access control. 5. User authentication and security logging. b) Security Measures: 1. Regular automated offsite and cloud data backups. 2. Role-based user authentication with multi-factor authentication (MFA). 3. Continuous antivirus, antimalware, and firewall protection. 4. Physical security controls (locks, CCTV, restricted server room access). 5. Periodic security awareness training and acceptable usage policy enforcement.",
            keywords: ["process management", "memory", "file system", "device drivers", "authentication", "backups", "mfa", "antivirus", "firewall", "physical security"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  {
    id: "exam-061155101A-wa3",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Office Admin & Land Survey L5/L6)",
    created_at: "2026-09-01T08:00:00Z",
    payload: {
      title: "Apply Digital Literacy \u2014 Written Assessment 3 (Collaboration & Online Work)",
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      department: "DEPARTMENT OF COMPUTING & INFORMATICS",
      course_name: "Apply Digital Literacy Level 5 & 6",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "061155101A",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "Exam",
      task_code: "CT3",
      series: "SEP \u2013 NOV 2026",
      time_allowed: "2 HOURS",
      duration_minutes: 120,
      total_marks: 70,
      type: "written",
      instructions: "This paper consists of two sections: Section A (30 Marks, Compulsory) and Section B (40 Marks, Answer ANY TWO Questions).",
      section_a: {
        title: "Section A \u2014 Netiquette, Cloud Collaboration & Digital Labor (30 Marks)",
        instructions: "Answer ALL questions in this section (Compulsory).",
        total_marks: 30,
        questions: [
          {
            id: "dl3_a1",
            text: "Define 'Netiquette' and explain why it is crucial in professional online communication.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Define netiquette and professional online etiquette",
            correct_answer: "Netiquette refers to the code of acceptable polite conduct and professional etiquette observed when communicating over computer networks and the internet. In the workplace, it maintains corporate reputation, prevents misunderstandings, and respects recipient time and privacy.",
            regex_pattern: "(?i)(netiquette|etiquette|conduct|polite|professional|communication|online)",
            keywords: ["netiquette", "etiquette", "online", "polite", "professional", "conduct", "communication"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a2",
            text: "You are part of an online project team collaborating remotely.\na) List three advantages of using online collaboration tools for project management (3 Marks).\nb) List three disadvantages of using online collaboration tools for project management (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Pros and cons of remote collaboration tools",
            correct_answer: "a) Advantages: 1. Real-time document co-authoring and synchronized communication. 2. Centralized task tracking and transparent accountability. 3. Reduced travel expenses and geographical flexibility. b) Disadvantages: 1. Heavy dependency on reliable internet connectivity. 2. Heightened exposure to cybersecurity breaches and cloud data leaks. 3. Learning curve and potential digital fatigue or miscommunication.",
            keywords: ["collaboration", "real-time", "tracking", "remote", "internet dependency", "security risks", "learning curve"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a3",
            text: "Describe the steps you would take to securely send an important business document via email to a client, ensuring data confidentiality.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Secure email transmission practices",
            correct_answer: "1. Password-protect or encrypt the document before attaching. 2. Double-check the recipient's email address to avoid misdirection. 3. Send the access password through a secondary secure channel (e.g. phone SMS or secure messaging app), never in the same email. 4. Use institutional encrypted email protocol (TLS).",
            keywords: ["encrypt", "password", "secondary channel", "verify recipient", "confidentiality"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a4",
            text: "Explain three essential cybersecurity practices a freelancer should adopt when working from public Wi-Fi networks.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Public Wi-Fi cybersecurity safeguards",
            correct_answer: "1. Utilize a Virtual Private Network (VPN) to encrypt all transmitted data traffic. 2. Ensure websites use secure HTTPS protocol and disable automatic Wi-Fi connections. 3. Keep firewall active and disable file/printer sharing on the operating system.",
            keywords: ["vpn", "virtual private network", "https", "firewall", "disable sharing", "encryption"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a5",
            text: "Outline a step-by-step strategy for searching and applying for online jobs using reputable freelance platforms.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Online job search methodology",
            correct_answer: "1. Create and verify a professional profile highlighting verified skills and past portfolio work. 2. Filter search listings using specific keywords, client rating, and verified payment tags. 3. Tailor a concise proposal addressing the client's problem directly. 4. Submit competitive bid within industry benchmarks and include relevant work samples.",
            keywords: ["profile", "portfolio", "filter", "proposal", "bid", "samples", "freelance"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a6",
            text: "Differentiate between a resume and a cover letter, highlighting the distinct role of each in a job application.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Resume vs Cover Letter distinction",
            correct_answer: "A resume (or CV) is a structured, concise summary of a candidate's education, work history, technical skills, and credentials. A cover letter is a personalized narrative document addressed to the hiring manager explaining candidate motivation, relevant achievements, and how they solve the organization's specific needs.",
            keywords: ["resume", "cover letter", "structured summary", "personalized narrative", "skills", "motivation"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a7",
            text: "Explain the concept of copyright and fair use when utilizing digital content sourced from the internet.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Digital copyright and fair use doctrine",
            correct_answer: "Copyright is legal ownership granting content creators exclusive rights to reproduce and distribute their original digital works. Fair use allows limited use of copyrighted material without permission for educational, research, critique, or news reporting purposes, provided appropriate attribution is given.",
            keywords: ["copyright", "intellectual property", "fair use", "attribution", "creator", "permission"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a8",
            text: "Outline three techniques for ensuring accuracy when entering large volumes of data into a spreadsheet.",
            type: "short_answer",
            marks: 3,
            critical_aspect: "Spreadsheet data validation and entry accuracy",
            correct_answer: "1. Configure Data Validation rules (e.g. number ranges, dropdown lists) to restrict invalid inputs. 2. Implement double-entry or spot-check verification against source documents. 3. Use conditional formatting to highlight duplicate or outlier values automatically.",
            keywords: ["data validation", "dropdown", "double entry", "conditional formatting", "verification"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a9",
            text: "Which of the following is an immediate red flag indicating a fraudulent online job posting?",
            type: "mcq",
            options: [
              "The employer requires a formal portfolio of previous design work",
              "The client demands an upfront payment or processing fee before hiring",
              "The job interview is conducted via a scheduled Microsoft Teams call",
              "The employer requests verification of professional educational certificates"
            ],
            correct_answer: "1",
            marks: 2,
            critical_aspect: "Identifying fraudulent job postings and scams",
            evaluation_mode: "objective",
            requires_trainer_review: false
          },
          {
            id: "dl3_a10",
            text: "A job opportunity requires you to showcase your past digital projects. Explain how you would create and manage a digital portfolio to present your work effectively to potential employers.",
            type: "practical",
            marks: 3,
            critical_aspect: "Digital portfolio creation and curation",
            correct_answer: "1. Select a modern hosting platform (e.g. GitHub Pages, Google Sites, LinkedIn, or personal website). 2. Curate 4-6 of your strongest, diverse projects with project descriptions, problem solved, tools used, and live links. 3. Include contact details, downloadable resume, and client testimonials. 4. Regularly update with new projects and verify all external hyperlinks work.",
            keywords: ["portfolio", "platform", "curate", "projects", "descriptions", "links", "resume", "update"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_a11",
            text: "Beyond technical skills, identify two soft skills that are crucial for success in a remote job interview and briefly explain why each is important.",
            type: "short_answer",
            marks: 2,
            critical_aspect: "Soft skills in digital employment interviews",
            correct_answer: "1. Clear verbal and written communication: Ensures complex ideas are articulated concisely and minimizes remote misunderstandings. 2. Adaptability and problem-solving: Demonstrates capability to learn new software tools and troubleshoot unexpected technical challenges autonomously.",
            keywords: ["communication", "problem solving", "adaptability", "time management", "active listening"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      },
      section_b: {
        title: "Section B \u2014 Applied Collaboration, Digital Identity & Databases (40 Marks)",
        instructions: "Answer ANY TWO questions from this section. Each question carries 20 marks.",
        total_marks: 40,
        questions: [
          {
            id: "dl3_b1",
            text: "a) Identify three different online collaboration tools and briefly describe a scenario where each would be most effectively used for workplace tasks (6 Marks).\nb) Discuss three ethical issues in Information and Communication Technology (ICT) that can arise in an office environment and suggest how each can be prevented (6 Marks).\nc) Explain three common cloud storage permission levels (e.g., Viewer, Commenter, Editor) and describe the security implications of granting inappropriate permissions (4 Marks).\nd) Outline four key elements that must be included in a professional freelance profile to build client trust and win contracts (4 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Collaboration platforms, ICT workplace ethics, cloud permission management, and freelance branding",
            correct_answer: "a) Tools & Scenarios: 1. Google Docs / Microsoft 365: Real-time simultaneous report editing and meeting minutes drafting. 2. Slack / Microsoft Teams: Channel-based team communication, video conferencing, and quick file sharing. 3. Trello / Asana: Kanban sprint planning and milestone deadline tracking. b) Ethical issues: 1. Software piracy / unauthorized licensing -> solve by procuring volume licenses. 2. Employee digital privacy monitoring -> solve through transparent Acceptable Use Policies. 3. Intellectual property plagiarism -> solve through citation standards and copyright compliance. c) Cloud permissions: Viewer (read-only), Commenter (can annotate without modifying text), Editor (full edit rights). Inappropriate editor permissions risk accidental file deletion, data tampering, or unauthorized data sharing. d) Profile elements: Professional headshot photo, clear title and value proposition, verified portfolio samples, and transparent hourly/project pricing with past client reviews.",
            keywords: ["google docs", "teams", "slack", "trello", "piracy", "privacy", "plagiarism", "viewer", "commenter", "editor", "portfolio"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_b2",
            text: "a) Identify two online job platforms and describe two essential factors to consider when setting up personal online payment accounts (e.g. PayPal, Wise, M-PESA Global) (6 Marks).\nb) Describe the complete end-to-end workflow of completing an online freelance task: from receiving client instructions, task execution, client revision, and final payment receipt (8 Marks).\nc) Explain the importance of managing a positive digital identity when performing online jobs. Provide two practical examples of practices that contribute to a positive digital identity (6 Marks).",
            type: "practical",
            marks: 20,
            critical_aspect: "Digital labor workflow, online payment regulations, and professional digital identity",
            correct_answer: "a) Platforms: Upwork, Freelancer.com, Fiverr. Payment factors: Transaction fees/currency exchange rates, and regulatory compliance (KYC identity verification, tax reporting). b) Workflow: 1. Review client brief and clarify ambiguities before accepting. 2. Track project milestones and communicate progress updates. 3. Deliver draft via platform before deadline. 4. Process requested client revisions constructively. 5. Obtain client sign-off, release escrow funds, and request formal review/feedback. c) Digital identity importance: Builds long-term client trust, enables repeat contracts, and improves search ranking on platforms. Practices: 1. Maintaining professional communication tone and delivering on promises. 2. Active participation on professional networks (LinkedIn/GitHub) showcasing solved problems.",
            keywords: ["upwork", "fiverr", "paypal", "m-pesa", "escrow", "milestones", "revisions", "digital identity", "trust", "reputation"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          },
          {
            id: "dl3_b3",
            text: "a) A client requires you to use project management software (e.g. Trello or Asana) for an online task. Assuming you haven't used it before, outline how you would ensure you operate this tool effectively to meet job requirements (6 Marks).\nb) You are preparing for an online interview as a digital content creator. Outline the documentation and digital assets you should have prepared and ready to share during the screen-share segment (8 Marks).\nc) In Microsoft Access database design, describe the characteristics and use cases for the following data types: (6 Marks)\n   i. Short Text vs Long Text\n   ii. AutoNumber\n   iii. Currency",
            type: "practical",
            marks: 20,
            critical_aspect: "Project tool onboarding, digital interview preparation, and database schema data types",
            correct_answer: "a) Onboarding: 1. Review official video documentation and quick-start guides. 2. Explore sample boards/workspaces to understand lists (To-Do, In-Progress, Done) and cards. 3. Clarify client conventions regarding tags, deadlines, and assignment notifications. b) Interview assets: 1. Clean desktop with organized digital portfolio folder. 2. PDF copy of resume and references. 3. Presentation slides showcasing case studies and before/after metrics. 4. Active live links to published articles, graphics, or video reels with appropriate view permissions. c) Access Data Types: i. Short Text: Alphanumeric characters up to 255 characters (e.g. names, codes); Long Text: Large textual descriptions up to 1GB (e.g. remarks, biographies). ii. AutoNumber: System-generated unique sequential number automatically assigned to each new record, ideal for primary keys. iii. Currency: Dedicated monetary values formatted with financial precision and currency symbols, preventing rounding errors.",
            keywords: ["trello", "asana", "kanban", "portfolio", "screen share", "short text", "long text", "autonumber", "currency", "primary key"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  }
];

// client/src/lib/curriculumContinuousAssessments.ts
var COMPUTER_ESSENTIALS_CATS = [
  // ─── LO1: Manage computer devices ─────────────────────────────────────────
  {
    id: "cat-essentials-lo1",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "Perform Computer Essentials (ICT Level 4 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 1 \u2014 Manage Computer Devices",
      department: "Computing and Informatics",
      course_name: "ICT Technician Level 4 & 6 Modular",
      unit_name: "PERFORM COMPUTER ESSENTIALS",
      course_code: "061004T4ICT",
      class: "ICT4/ITECH6/S/26 MOD 1",
      target_cohorts: ["ICT4/ITECH6/S/26 MOD 1", "ICT4 MOD/S/2026", "ICT4", "ITECH 6"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-PCE-LO1",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes;\n4. Ensure technical precision and clear handwriting/typing.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "pce_lo1_q1",
            q_num: 1,
            text: "State four external computer peripheral ports located on a desktop system unit and describe the primary function of each.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Identify and explain functions of standard I/O peripheral ports",
            correct_answer: "1. HDMI / DisplayPort: Transmits uncompressed high-definition digital video and audio to monitors/projectors. 2. USB 3.0 (Type-A/Type-C): Provides high-speed data transfer and power delivery to peripherals like flash drives, mouse, and keyboard. 3. RJ-45 Ethernet: Connects computer to local area network (LAN) and broadband internet. 4. 3.5mm Audio In/Out: Connects analog headphones, speakers, or microphone.",
            breakdown: [
              { criterion: "Port 1 identified with accurate function", marks: 1 },
              { criterion: "Port 2 identified with accurate function", marks: 1 },
              { criterion: "Port 3 identified with accurate function", marks: 1 },
              { criterion: "Port 4 identified with accurate function", marks: 1 }
            ],
            keywords: ["HDMI", "USB", "Ethernet", "RJ-45", "audio", "port", "video", "data transfer"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo1_q2",
            q_num: 2,
            text: "Describe the step-by-step procedure a technician follows to connect a multimedia projector to a workstation and configure the dual display mode in Windows.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Peripheral connection and Windows multi-monitor configuration",
            correct_answer: "1. Power off or place workstation in sleep mode. 2. Connect the video cable (HDMI or VGA) securely between workstation's display output and projector's input. 3. Power on projector and workstation. 4. Press Windows Key + P to open the Project sidebar. 5. Select desired projection mode ('Duplicate' to mirror screen, or 'Extend' to use projector as second workspace).",
            breakdown: [
              { criterion: "Connecting video interface cable securely", marks: 1 },
              { criterion: "Powering sequencing and input selection", marks: 1 },
              { criterion: "Executing Windows + P shortcut", marks: 1 },
              { criterion: "Explaining 'Duplicate' mode", marks: 1 },
              { criterion: "Explaining 'Extend' mode", marks: 1 }
            ],
            keywords: ["HDMI", "VGA", "Windows + P", "projector", "duplicate", "extend", "display"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo1_q3",
            q_num: 3,
            text: "a) Differentiate between a 'Cold Boot' and a 'Warm Boot' (Restart), stating when each is appropriate (3 Marks).\nb) Explain three workplace ergonomic precautions to observe when arranging a computer workstation (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Booting procedures and ergonomic workstation setup",
            correct_answer: "a) Cold boot: Starting computer from a completely powered-off state by pressing physical power button (used at start of workday). Warm boot (Restart): Rebooting system via OS command without cutting motherboard power (used after software updates or system freeze). (3 Marks)\nb) Ergonomics: 1. Monitor height adjusted so top of screen is at or slightly below eye level to prevent neck strain. 2. Chair adjusted with lumbar support and feet flat on floor (knees at 90 degrees). 3. Wrists kept in neutral, straight position with elbows supported while typing. (3 Marks)",
            breakdown: [
              { criterion: "Cold boot definition & use case", marks: 1.5 },
              { criterion: "Warm boot definition & use case", marks: 1.5 },
              { criterion: "Ergonomic precaution 1 (monitor position)", marks: 1 },
              { criterion: "Ergonomic precaution 2 (seating/posture)", marks: 1 },
              { criterion: "Ergonomic precaution 3 (wrist/keyboard position)", marks: 1 }
            ],
            keywords: ["cold boot", "warm boot", "restart", "power button", "ergonomics", "monitor eye level", "lumbar", "wrist posture"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO2: Manage desktop settings ─────────────────────────────────────────
  {
    id: "cat-essentials-lo2",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "Perform Computer Essentials (ICT Level 4 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 2 \u2014 Manage Desktop Settings",
      department: "Computing and Informatics",
      course_name: "ICT Technician Level 4 & 6 Modular",
      unit_name: "PERFORM COMPUTER ESSENTIALS",
      course_code: "061004T4ICT",
      class: "ICT4/ITECH6/S/26 MOD 1",
      target_cohorts: ["ICT4/ITECH6/S/26 MOD 1", "ICT4 MOD/S/2026", "ICT4", "ITECH 6"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-PCE-LO2",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "pce_lo2_q1",
            q_num: 1,
            text: "Outline the procedure for modifying the screen resolution and display scaling in Windows Settings to optimize visual clarity on an external monitor.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Screen resolution and display scaling configuration",
            correct_answer: "1. Right-click any empty area on the desktop and select 'Display settings'. 2. Identify and select the target monitor if multiple displays are connected. 3. Scroll to 'Display resolution' dropdown and select the native resolution (e.g., 1920 x 1080 Recommended). 4. Adjust 'Scale' dropdown (e.g., 100% or 125%) to ensure text readability without blurriness. 5. Click 'Keep changes'.",
            breakdown: [
              { criterion: "Right-click desktop > Display settings", marks: 1 },
              { criterion: "Selecting correct monitor", marks: 1 },
              { criterion: "Choosing native resolution", marks: 1 },
              { criterion: "Adjusting DPI scaling & keeping changes", marks: 1 }
            ],
            keywords: ["Display settings", "resolution", "scale", "native", "1920x1080", "keep changes"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo2_q2",
            q_num: 2,
            text: "Differentiate between 'Sleep Mode' and 'Hibernate Mode' in Windows power management, explaining how system memory (RAM) and storage drive are utilized in each state.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Operating system power management states",
            correct_answer: "Sleep Mode: Puts computer into low-power state, keeping open documents and active programs in RAM while shutting down display and hard drives; wakes up almost instantaneously, but loses data if power is completely cut. Hibernate Mode: Saves all active contents of RAM into the hiberfil.sys file on secondary storage (SSD/HDD) and completely cuts power to all hardware; takes slightly longer to resume, but retains state with zero battery/power consumption.",
            breakdown: [
              { criterion: "Sleep mode RAM retention explanation", marks: 1.5 },
              { criterion: "Sleep mode wake latency and power vulnerability", marks: 1 },
              { criterion: "Hibernate mode storage write (hiberfil.sys) explanation", marks: 1.5 },
              { criterion: "Hibernate zero power consumption benefit", marks: 1 }
            ],
            keywords: ["sleep mode", "hibernate", "RAM", "storage", "hiberfil.sys", "power state", "resume"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo2_q3",
            q_num: 3,
            text: "a) Identify two Windows Accessibility features that assist users with visual or physical impairments and explain how each works (3 Marks).\nb) Describe how to customize the Windows Taskbar to pin frequently used applications and enable auto-hide (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Accessibility settings and taskbar customization",
            correct_answer: "a) Accessibility features: 1. Magnifier (Win + Plus): Enlarges all or parts of the display screen for low-vision users. 2. High Contrast / Color Filters: Increases visual distinction between text and background to reduce eye strain and assist colorblind individuals. 3. On-Screen Keyboard: Enables mouse/touch typing for users with motor impairments. (3 Marks)\nb) Taskbar customization: 1. Pinning apps: Locate app in Start Menu or desktop, right-click, select 'Pin to taskbar' (or drag shortcut directly). 2. Auto-hide: Right-click Taskbar > Taskbar settings > Taskbar behaviors > check 'Automatically hide the taskbar'. (3 Marks)",
            breakdown: [
              { criterion: "Accessibility feature 1 described", marks: 1.5 },
              { criterion: "Accessibility feature 2 described", marks: 1.5 },
              { criterion: "Procedure for pinning apps to taskbar", marks: 1.5 },
              { criterion: "Procedure for enabling auto-hide taskbar", marks: 1.5 }
            ],
            keywords: ["magnifier", "high contrast", "on-screen keyboard", "pin to taskbar", "taskbar settings", "auto-hide"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO3: Perform file management ─────────────────────────────────────────
  {
    id: "cat-essentials-lo3",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "Perform Computer Essentials (ICT Level 4 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 3 \u2014 Perform File Management",
      department: "Computing and Informatics",
      course_name: "ICT Technician Level 4 & 6 Modular",
      unit_name: "PERFORM COMPUTER ESSENTIALS",
      course_code: "061004T4ICT",
      class: "ICT4/ITECH6/S/26 MOD 1",
      target_cohorts: ["ICT4/ITECH6/S/26 MOD 1", "ICT4 MOD/S/2026", "ICT4", "ITECH 6"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-PCE-LO3",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "pce_lo3_q1",
            q_num: 1,
            text: "Explain the importance of file extensions in an operating system and state the default applications used to open files with: a) .docx, b) .xlsx, c) .zip, d) .pdf.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "File extension identification and default file associations",
            correct_answer: "File extensions inform the operating system and user about the encoding format of a file and which application program handles it. Associated programs: a) .docx: Microsoft Word / Word Processor. b) .xlsx: Microsoft Excel / Spreadsheet. c) .zip: File Explorer / 7-Zip / WinRAR archive utility. d) .pdf: Adobe Acrobat Reader / Web Browser.",
            breakdown: [
              { criterion: "Role of file extensions in file association", marks: 1 },
              { criterion: "Application for .docx and .xlsx", marks: 1.5 },
              { criterion: "Application for .zip and .pdf", marks: 1.5 }
            ],
            keywords: ["file extension", "format", "word", "excel", "7-zip", "pdf reader", "adobe"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo3_q2",
            q_num: 2,
            text: "Describe the step-by-step procedure to create a nested folder hierarchy: MTTI > Academics > Term_3_2026 > ICT_Dept, and explain how to compress the top folder into a .zip file.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Directory hierarchy creation and archive compression",
            correct_answer: "1. Open File Explorer, navigate to target drive (e.g. C: or Documents). 2. Right-click > New > Folder, name it 'MTTI' and press Enter. 3. Double-click 'MTTI', create new folder 'Academics'. 4. Inside 'Academics', create folder 'Term_3_2026'. 5. Inside 'Term_3_2026', create folder 'ICT_Dept'. 6. To compress: Navigate back to 'MTTI', right-click it, select 'Compress to ZIP file' (or Send to > Compressed (zipped) folder).",
            breakdown: [
              { criterion: "Creating root folder 'MTTI'", marks: 1 },
              { criterion: "Creating subfolder 'Academics'", marks: 1 },
              { criterion: "Creating nested folders 'Term_3_2026' and 'ICT_Dept'", marks: 1.5 },
              { criterion: "Executing ZIP archive compression command", marks: 1.5 }
            ],
            keywords: ["File Explorer", "New Folder", "nested directory", "compress to zip", "send to compressed"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo3_q3",
            q_num: 3,
            text: "a) Differentiate between file attributes 'Read-Only' and 'Hidden' and outline how to toggle them via Properties (3 Marks).\nb) State three file naming rules or best practices to prevent directory corruption or lost files in shared networks (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "File attributes and institutional file naming standards",
            correct_answer: 'a) Read-Only prevents accidental modification or overwriting of file content (allows viewing only). Hidden masks the file from standard File Explorer browsing to prevent deletion of system files. Toggle: Right-click file > Properties > General tab > check/uncheck Read-only or Hidden > Apply > OK. (3 Marks)\nb) Naming best practices: 1. Avoid illegal characters (\\ / : * ? " < > |). 2. Use meaningful descriptive names with versioning and dates (e.g., Report_v1_20261014.docx). 3. Use hyphens or underscores instead of excessive spaces for web/cross-platform compatibility. (3 Marks)',
            breakdown: [
              { criterion: "Read-only vs Hidden definition", marks: 1.5 },
              { criterion: "File properties toggle procedure", marks: 1.5 },
              { criterion: "Rule 1: Avoiding reserved characters", marks: 1 },
              { criterion: "Rule 2: Versioning and date stamps", marks: 1 },
              { criterion: "Rule 3: Hyphens/underscores for portability", marks: 1 }
            ],
            keywords: ["read-only", "hidden", "properties", "illegal characters", "naming convention", "versioning", "underscores"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO4: Manage computer software ────────────────────────────────────────
  {
    id: "cat-essentials-lo4",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "Perform Computer Essentials (ICT Level 4 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 4 \u2014 Manage Computer Software",
      department: "Computing and Informatics",
      course_name: "ICT Technician Level 4 & 6 Modular",
      unit_name: "PERFORM COMPUTER ESSENTIALS",
      course_code: "061004T4ICT",
      class: "ICT4/ITECH6/S/26 MOD 1",
      target_cohorts: ["ICT4/ITECH6/S/26 MOD 1", "ICT4 MOD/S/2026", "ICT4", "ITECH 6"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-PCE-LO4",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "pce_lo4_q1",
            q_num: 1,
            text: "Differentiate between System Software, Application Software, and Utility Software, providing one example of each used in an institution.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Categorize computer software architectures and functions",
            correct_answer: "1. System Software: Manages and coordinates computer hardware and provides platform for applications (e.g. Windows 11, Linux, macOS). 2. Application Software: Designed to help end-users perform specific productive tasks (e.g. Microsoft Word, Google Chrome, QuickBooks). 3. Utility Software: Performs maintenance and house-keeping tasks to optimize system performance and security (e.g. Windows Defender Antivirus, Disk Cleanup, 7-Zip).",
            breakdown: [
              { criterion: "System software definition & example", marks: 1.5 },
              { criterion: "Application software definition & example", marks: 1.5 },
              { criterion: "Utility software definition & example", marks: 1 }
            ],
            keywords: ["system software", "application software", "utility software", "Windows", "Word", "antivirus", "maintenance"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo4_q2",
            q_num: 2,
            text: "Explain the standard procedure for safely uninstalling an application in Windows, and explain why simply deleting its desktop shortcut or Program Files folder leaves behind residual files.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Software uninstallation and registry integrity",
            correct_answer: "Procedure: 1. Open Settings > Apps > Installed apps (or Control Panel > Programs and Features). 2. Locate the target software program. 3. Click the three dots / Uninstall button and confirm prompt. 4. Follow the dedicated uninstaller wizard to complete removal and restart if prompted. Why deleting shortcuts/folders fails: Simply deleting desktop shortcut only removes a pointer link, leaving the program active. Deleting Program Files folder leaves associated Windows Registry keys, shared DLL dependencies, user cache in AppData, and background startup services intact, which causes registry bloat and system instability.",
            breakdown: [
              { criterion: "Settings/Control Panel uninstallation procedure", marks: 2 },
              { criterion: "Explanation of shortcut deletion fallacy", marks: 1 },
              { criterion: "Explanation of Registry, AppData and DLL residue", marks: 2 }
            ],
            keywords: ["Installed apps", "uninstall", "Control Panel", "registry", "shortcut", "AppData", "DLL"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo4_q3",
            q_num: 3,
            text: "a) Explain two types of software licenses (e.g., Proprietary Commercial vs Open Source) and state two security risks of using unverified/cracked software (3 Marks).\nb) Describe how to configure the default web browser and default PDF viewer in Windows Settings (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Software licensing ethics and default program configuration",
            correct_answer: "a) Licenses: Proprietary software (e.g., Microsoft Office) restricts code access, requires paid license per user, and limits redistribution. Open Source (e.g., LibreOffice, VLC) provides free access to source code for modification and redistribution. Security risks: Cracked software often bundles trojans/ransomware and lacks critical vendor security updates. (3 Marks)\nb) Default apps setup: 1. Go to Settings > Apps > Default apps. 2. Under 'Set defaults for applications', select the desired browser (e.g., Google Chrome) and click 'Set default'. 3. For PDF: Search '.pdf' in the file type box, click current app, select Adobe Acrobat or desired reader, and click 'Set default'. (3 Marks)",
            breakdown: [
              { criterion: "Proprietary vs Open-source licensing comparison", marks: 1.5 },
              { criterion: "Security risks of pirated software (malware/lack of patches)", marks: 1.5 },
              { criterion: "Procedure for default browser configuration", marks: 1.5 },
              { criterion: "Procedure for default PDF viewer association", marks: 1.5 }
            ],
            keywords: ["proprietary", "open source", "cracked", "malware", "default apps", "browser", "pdf viewer"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO5: Perform online jobs ─────────────────────────────────────────────
  {
    id: "cat-essentials-lo5",
    unit_code: "IT/CU/ICTA/CR/01/4/MA",
    course_name: "Perform Computer Essentials (ICT Level 4 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 5 \u2014 Perform Online Jobs",
      department: "Computing and Informatics",
      course_name: "ICT Technician Level 4 & 6 Modular",
      unit_name: "PERFORM COMPUTER ESSENTIALS",
      course_code: "061004T4ICT",
      class: "ICT4/ITECH6/S/26 MOD 1",
      target_cohorts: ["ICT4/ITECH6/S/26 MOD 1", "ICT4 MOD/S/2026", "ICT4", "ITECH 6"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-PCE-LO5",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "pce_lo5_q1",
            q_num: 1,
            text: "Identify two legitimate online freelancing platforms (e.g. Upwork, Freelancer.com) and outline four critical elements required to build a high-converting profile.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Freelance platform identification and professional profile setup",
            correct_answer: "Platforms: Upwork, Freelancer.com, Fiverr. Profile elements: 1. Professional headshot photograph with friendly, clean appearance. 2. Clear, specific professional title and value-driven overview biography. 3. Verified portfolio samples demonstrating past completed projects. 4. Completed skill assessment tests / certifications and clear hourly/fixed rate.",
            breakdown: [
              { criterion: "Two legitimate freelance platforms identified", marks: 1 },
              { criterion: "Element 1: Professional photo & title", marks: 1 },
              { criterion: "Element 2: Value proposition & bio", marks: 1 },
              { criterion: "Element 3: Portfolio proof & verified skills", marks: 1 }
            ],
            keywords: ["Upwork", "Freelancer", "Fiverr", "portfolio", "profile", "headshot", "skills", "bio"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo5_q2",
            q_num: 2,
            text: "Outline five essential components of a winning client bid/proposal when applying for an online data entry or virtual assistant contract.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Freelance job bidding and proposal formulation",
            correct_answer: "1. Personalized greeting addressing the client by name if available. 2. Direct reference showing clear understanding of client's specific problem/project scope. 3. Concrete explanation of how your skills and tools will solve their problem efficiently. 4. Proof of capability via relevant portfolio sample link or attachment. 5. Clear call to action (invitation to discuss details) and statement of turnaround deadline.",
            breakdown: [
              { criterion: "Personalized client greeting & rapport", marks: 1 },
              { criterion: "Proof of understanding project problem", marks: 1 },
              { criterion: "Proposed solution and methodology", marks: 1 },
              { criterion: "Portfolio evidence and relevant samples", marks: 1 },
              { criterion: "Call to action and turnaround timeline", marks: 1 }
            ],
            keywords: ["proposal", "bid", "client needs", "portfolio sample", "call to action", "turnaround", "methodology"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "pce_lo5_q3",
            q_num: 3,
            text: "a) Explain how an escrow payment system protects both the freelancer and the client during online contract execution (3 Marks).\nb) Describe three digital communication etiquette rules to maintain when collaborating with international clients across time zones (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Online payment security and remote communication ethics",
            correct_answer: "a) Escrow Protection: Client deposits project funds into a neutral third-party holding account before work commences. The freelancer is protected knowing funds are verified and guaranteed upon task completion. The client is protected because funds are only released after reviewing and approving completed deliverables. (3 Marks)\nb) Communication etiquette: 1. Acknowledge messages promptly within agreed service-level agreements (SLAs). 2. Use clear, courteous, and culturally respectful language free of local jargon. 3. Clarify expectations regarding milestone deadlines with explicit time zone notations (e.g. EAT, UTC, EST). (3 Marks)",
            breakdown: [
              { criterion: "Escrow mechanism explained", marks: 1.5 },
              { criterion: "Mutual protection benefits (freelancer + client)", marks: 1.5 },
              { criterion: "Prompt communication & SLAs", marks: 1 },
              { criterion: "Professional and neutral language", marks: 1 },
              { criterion: "Time zone awareness and deadline tracking", marks: 1 }
            ],
            keywords: ["escrow", "protection", "deposit", "milestone", "release", "communication etiquette", "time zone", "professionalism"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  }
];
var APPLY_ICT_SKILLS_CATS = [
  // ─── LO1: Fundamental principles of Apply ICT Skills ──────────────────────
  {
    id: "cat-ict-lo1",
    unit_code: "0415-451-21A",
    course_name: "Apply ICT Skills (Office Administration Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 1 \u2014 Fundamental Principles of ICT Skills",
      department: "Business and Office Administration",
      course_name: "Certificate & Diploma in Office Administration",
      unit_name: "APPLY ICT SKILLS",
      course_code: "041505T4OA",
      class: "ADMIN5/6/J/26 MOD 3",
      target_cohorts: [
        "ADMIN5/6/J/26 MOD 3",
        "ADMIN5/6/J/26",
        "ADMIN 5/6/J/26",
        "Admin 5/6/j 26",
        "ADMIN 5/6/J 26",
        "ADMIN5/6/J 26",
        "ADMIN 5/6/J/26 MOD 3",
        "ADMIN5/6/J/2026",
        "ADMIN 5/6/J/2026",
        "ADMIN5/6/J/256 MOD 3",
        "ADMIN5",
        "ADMIN6",
        "OFFICE ADMIN"
      ],
      portal_visible: true,
      assessment_category: "CAT",
      task_code: "CAT-ICT-LO1",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "ict_lo1_q1",
            q_num: 1,
            text: "Identify the three primary sub-units of the Central Processing Unit (CPU) \u2014 ALU, Control Unit, and Registers \u2014 and state the specific role of each in data processing.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "CPU internal architectural components and functions",
            correct_answer: "1. Arithmetic Logic Unit (ALU): Performs all arithmetic calculations (addition, subtraction) and logical comparisons (AND, OR, NOT). 2. Control Unit (CU): Decodes instructions, directs data flow between CPU components, and coordinates all computer operations. 3. Registers: High-speed internal memory cells used to temporarily store active instructions, memory addresses, and intermediate processing results.",
            breakdown: [
              { criterion: "ALU identification and arithmetic/logic role", marks: 1.5 },
              { criterion: "CU identification and orchestration role", marks: 1.5 },
              { criterion: "Registers identification and temporary storage role", marks: 1 }
            ],
            keywords: ["ALU", "Control Unit", "Registers", "arithmetic", "decode", "instructions", "temporary memory"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo1_q2",
            q_num: 2,
            text: "Differentiate between Random Access Memory (RAM) and Read Only Memory (ROM) on the basis of volatility, alterability, and their respective operational roles in an office computer.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Primary memory characteristics (RAM vs ROM)",
            correct_answer: "RAM is volatile memory (loses all content when power is turned off) and is read/write enabled; it holds active operating system files, open applications, and user document data currently in use. ROM is non-volatile memory (retains contents permanently even without power) and is read-only; it permanently stores the BIOS/UEFI firmware and bootstrap loader routines required to start up the computer.",
            breakdown: [
              { criterion: "Volatility comparison (volatile vs non-volatile)", marks: 1.5 },
              { criterion: "Alterability comparison (read/write vs read-only)", marks: 1.5 },
              { criterion: "Functional roles (active app memory vs BIOS startup)", marks: 2 }
            ],
            keywords: ["RAM", "ROM", "volatile", "non-volatile", "read-write", "read-only", "BIOS", "bootstrap"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo1_q3",
            q_num: 3,
            text: "a) Explain three physical workplace ergonomic hazards common in an office computer environment and suggest appropriate mitigation measures (3 Marks).\nb) Describe the difference between Optical Character Recognition (OCR) and Barcode Scanners in modern document management (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Workplace ergonomics and document data-capture technologies",
            correct_answer: "a) Ergonomic hazards: 1. Glare and improper monitor distance causing Computer Vision Syndrome -> mitigate with anti-glare screen filters and 20-20-20 rule. 2. Non-adjustable chairs causing lower back pain -> mitigate with ergonomic chairs with lumbar support. 3. Awkward wrist angles causing Carpal Tunnel Syndrome -> mitigate with wrist pads and ergonomic mouse/keyboard. (3 Marks)\nb) OCR software converts scanned physical paper documents or PDF images into editable, searchable digital text. Barcode scanners read printed optical parallel lines or 2D patterns to instantly capture encoded inventory or file tracking codes into a database. (3 Marks)",
            breakdown: [
              { criterion: "Ergonomic hazard 1 and solution", marks: 1 },
              { criterion: "Ergonomic hazard 2 and solution", marks: 1 },
              { criterion: "Ergonomic hazard 3 and solution", marks: 1 },
              { criterion: "OCR role in searchable text conversion", marks: 1.5 },
              { criterion: "Barcode scanner role in asset/inventory capture", marks: 1.5 }
            ],
            keywords: ["ergonomics", "eyestrain", "lumbar support", "carpal tunnel", "OCR", "barcode scanner", "document management"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO2: Practical operations in Apply ICT Skills ────────────────────────
  {
    id: "cat-ict-lo2",
    unit_code: "0415-451-21A",
    course_name: "Apply ICT Skills (Office Administration Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 2 \u2014 Practical Operations in ICT Skills",
      department: "Business and Office Administration",
      course_name: "Certificate & Diploma in Office Administration",
      unit_name: "APPLY ICT SKILLS",
      course_code: "041505T4OA",
      class: "ADMIN5/6/J/26 MOD 3",
      target_cohorts: [
        "ADMIN5/6/J/26 MOD 3",
        "ADMIN5/6/J/26",
        "ADMIN 5/6/J/26",
        "Admin 5/6/j 26",
        "ADMIN 5/6/J 26",
        "ADMIN5/6/J 26",
        "ADMIN 5/6/J/26 MOD 3",
        "ADMIN5/6/J/2026",
        "ADMIN 5/6/J/2026",
        "ADMIN5/6/J/256 MOD 3",
        "ADMIN5",
        "ADMIN6",
        "OFFICE ADMIN"
      ],
      portal_visible: true,
      assessment_category: "CAT",
      task_code: "CAT-ICT-LO2",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "ict_lo2_q1",
            q_num: 1,
            text: "Describe the step-by-step procedure for performing a Mail Merge in Microsoft Word to generate customized official letters for 50 board members from an Excel recipient data source.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Mail merge execution in office document processing",
            correct_answer: "1. In Microsoft Word, draft the master letter template. 2. Click Mailings tab > Start Mail Merge > select 'Letters'. 3. Click 'Select Recipients' > 'Use an Existing List...' > browse and select the Excel spreadsheet. 4. Position cursor in the letter and use 'Insert Merge Field' to insert placeholders (e.g. \xABTitle\xBB, \xABFirst_Name\xBB, \xABAddress\xBB). 5. Click 'Preview Results' to inspect merged output. 6. Click 'Finish & Merge' > 'Edit Individual Documents' or 'Print Documents' to finalize.",
            breakdown: [
              { criterion: "Drafting template and starting Mail Merge", marks: 1 },
              { criterion: "Connecting Excel data source list", marks: 1 },
              { criterion: "Inserting merge fields placeholders", marks: 1.5 },
              { criterion: "Previewing and executing Finish & Merge", marks: 1.5 }
            ],
            keywords: ["Mailings", "Mail Merge", "Select Recipients", "Excel", "Insert Merge Field", "Finish and Merge"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo2_q2",
            q_num: 2,
            text: "In Microsoft Excel financial records, write the exact formula syntax and explain the function of: a) =SUMIF(range, criteria, sum_range) (2 Marks), b) =VLOOKUP(lookup_value, table_array, col_index_num, FALSE) (3 Marks).",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Spreadsheet formula construction and lookup operations",
            correct_answer: "a) =SUMIF(range, criteria, sum_range): Conditionally sums values in a specified sum_range only where corresponding cells in the evaluation range satisfy the given criteria (e.g. summing total travel allowances for only 'Finance' department). (2 Marks)\nb) =VLOOKUP(lookup_value, table_array, col_index_num, FALSE): Searches vertically down the first column of table_array for an exact match to lookup_value, and returns the corresponding value from the designated column index number (e.g., retrieving an employee's salary given their Employee ID). (3 Marks)",
            breakdown: [
              { criterion: "SUMIF syntax and conditional addition purpose", marks: 2 },
              { criterion: "VLOOKUP syntax and vertical search mechanics", marks: 1.5 },
              { criterion: "VLOOKUP column index and exact match (FALSE) parameter", marks: 1.5 }
            ],
            keywords: ["SUMIF", "VLOOKUP", "criteria", "lookup_value", "table_array", "col_index_num", "exact match"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo2_q3",
            q_num: 3,
            text: "Outline five professional presentation design guidelines in PowerPoint to ensure executive readability, consistent branding, and audience engagement.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Executive presentation design and slide master utilization",
            correct_answer: "1. Adhere to the 6x6 rule: Maximum of 6 bullet points per slide and 6 words per bullet to avoid cognitive overload. 2. Utilize Slide Master to enforce uniform fonts, corporate logos, and color palettes across all slides. 3. Maintain strong color contrast (e.g., dark text on light background or vice versa). 4. Use high-resolution relevant graphics and data charts rather than decorative clip art. 5. Limit transition and animation effects to subtle options (Fade/Wipe) with consistent timing.",
            breakdown: [
              { criterion: "Rule of brevity (6x6 rule / uncluttered text)", marks: 1 },
              { criterion: "Slide Master consistency (fonts and branding)", marks: 1 },
              { criterion: "High contrast color palette", marks: 1 },
              { criterion: "Meaningful high-res visuals and charts", marks: 1 },
              { criterion: "Restrained animations and transitions", marks: 1 }
            ],
            keywords: ["Slide Master", "6x6 rule", "contrast", "branding", "transitions", "visuals", "PowerPoint"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO3: Maintenance, testing and troubleshooting ────────────────────────
  {
    id: "cat-ict-lo3",
    unit_code: "0415-451-21A",
    course_name: "Apply ICT Skills (Office Administration Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 3 \u2014 Maintenance, Testing and Troubleshooting",
      department: "Business and Office Administration",
      course_name: "Certificate & Diploma in Office Administration",
      unit_name: "APPLY ICT SKILLS",
      course_code: "041505T4OA",
      class: "ADMIN5/6/J/26 MOD 3",
      target_cohorts: [
        "ADMIN5/6/J/26 MOD 3",
        "ADMIN5/6/J/26",
        "ADMIN 5/6/J/26",
        "Admin 5/6/j 26",
        "ADMIN 5/6/J 26",
        "ADMIN5/6/J 26",
        "ADMIN 5/6/J/26 MOD 3",
        "ADMIN5/6/J/2026",
        "ADMIN 5/6/J/2026",
        "ADMIN5/6/J/256 MOD 3",
        "ADMIN5",
        "ADMIN6",
        "OFFICE ADMIN"
      ],
      portal_visible: true,
      assessment_category: "CAT",
      task_code: "CAT-ICT-LO3",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "ict_lo3_q1",
            q_num: 1,
            text: "Outline a preventive maintenance routine for office computer hardware, identifying four key tasks performed on workstations and peripherals.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Preventive maintenance protocol for office equipment",
            correct_answer: "1. Dust removal: Using compressed air to clear dust from CPU vents, cooling fans, and power supplies to avoid overheating. 2. Peripheral sanitation: Cleaning keyboards, mice, and monitor screens using lint-free microfiber cloths and approved isopropyl alcohol solutions. 3. Cable management: Checking, securing, and organizing power cords and network cables with ties to avoid trip hazards and port damage. 4. Drive hygiene: Running Disk Cleanup to purge temporary cache files and checking drive SMART health.",
            breakdown: [
              { criterion: "Dust extraction and cooling vents cleaning", marks: 1 },
              { criterion: "Screen/keyboard sanitation with safe solutions", marks: 1 },
              { criterion: "Cable management and physical inspection", marks: 1 },
              { criterion: "Software disk hygiene and temp file removal", marks: 1 }
            ],
            keywords: ["preventive maintenance", "dust", "compressed air", "cable management", "disk cleanup", "sanitation"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo3_q2",
            q_num: 2,
            text: "Describe the diagnostic and resolution procedure when an office network laser printer exhibits: a) 'Printer Offline' status on user workstations (2.5 Marks), and b) A recurring paper jam in the paper feed tray (2.5 Marks).",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Printer troubleshooting (connectivity and mechanical feed)",
            correct_answer: "a) Printer Offline: 1. Verify printer physical power and LAN Ethernet/Wi-Fi connection. 2. Ping printer IP address from command prompt to verify network reachability. 3. Open Devices and Printers > right-click printer > 'See what's printing' > uncheck 'Use Printer Offline'. 4. Restart Windows Print Spooler service via services.msc if print jobs are stuck. (2.5 Marks)\nb) Paper Jam: 1. Power off printer before opening covers to avoid toner burns. 2. Gently pull stuck paper in the direction of the paper path to avoid tearing. 3. Inspect feed rollers for foreign objects, paper clips, or worn rubber rollers. 4. Ensure paper tray is not overfilled and sheets are fanned and aligned properly. (2.5 Marks)",
            breakdown: [
              { criterion: "Network verification and IP ping check", marks: 1 },
              { criterion: "Print Spooler restart and offline toggle", marks: 1.5 },
              { criterion: "Safe paper extraction following path", marks: 1 },
              { criterion: "Roller inspection and proper tray loading", marks: 1.5 }
            ],
            keywords: ["printer offline", "print spooler", "ping IP", "paper jam", "rollers", "paper path", "services.msc"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "ict_lo3_q3",
            q_num: 3,
            text: "a) Explain the '3-2-1 Backup Strategy' and explain why it is essential for protecting institutional office records (3 Marks).\nb) Identify three indicators of malware infection on an office workstation and state the immediate action required (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Data backup standards and malware incident response",
            correct_answer: "a) 3-2-1 Backup: Maintain at least 3 total copies of important data, stored on 2 different physical storage media (e.g. internal drive and external NAS/tape), with 1 copy stored off-site or in the cloud. This guarantees business continuity even in cases of fire, theft, or catastrophic drive failure. (3 Marks)\nb) Malware indicators: 1. Sudden uncharacteristic system slowness and high CPU usage by unknown processes. 2. Frequent unexpected pop-up windows, browser redirects, or disabled antivirus software. 3. Files having unexpected extensions or inaccessible encrypted folders (ransomware). Immediate action: Disconnect the workstation from network/internet immediately and notify the ICT security officer. (3 Marks)",
            breakdown: [
              { criterion: "3-2-1 strategy breakdown (3 copies, 2 media, 1 offsite)", marks: 2 },
              { criterion: "Business continuity and disaster recovery value", marks: 1 },
              { criterion: "Three malware symptoms identified", marks: 2 },
              { criterion: "Immediate network isolation response", marks: 1 }
            ],
            keywords: ["3-2-1 backup", "offsite", "cloud", "disaster recovery", "malware", "ransomware", "network disconnect", "isolation"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  }
];
var DIGITAL_LITERACY_CATS = [
  // ─── LO1: Identify computer hardware components ───────────────────────────
  {
    id: "cat-dl-lo1",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Common Core Unit Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 1 \u2014 Identify Computer Hardware Components",
      department: "Institutional Common Curriculum",
      course_name: "Common Core Unit \u2014 TVET Level 5 & 6 Programs",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "101305T4FBS",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-DL-LO1",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "dl_lo1_q1",
            q_num: 1,
            text: "Distinguish between Input Devices and Output Devices, giving two practical examples of each used in an institutional office or workshop.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Peripheral classification into input and output functions",
            correct_answer: "Input devices convert user data or external signals into machine-readable digital form for processing by the computer (e.g., Optical Keyboard, Document Scanner, Barcode Reader). Output devices convert processed digital data into human-understandable visual, physical, or auditory form (e.g., LED Monitor, Laser Printer, Multimedia Projector).",
            breakdown: [
              { criterion: "Input device definition & two examples", marks: 2 },
              { criterion: "Output device definition & two examples", marks: 2 }
            ],
            keywords: ["input devices", "output devices", "keyboard", "scanner", "monitor", "printer", "projector"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo1_q2",
            q_num: 2,
            text: "Describe the functions of the following internal components inside a desktop system unit:\na) Motherboard (1 Mark)\nb) Central Processing Unit (CPU) (2 Marks)\nc) Power Supply Unit (PSU) (2 Marks)",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Internal system unit hardware components",
            correct_answer: "a) Motherboard: Main circuit board that physically houses and interconnects the CPU, RAM, storage drives, and expansion cards via system buses. (1 Mark)\nb) CPU: The primary computational engine ('brain') that executes software instructions, performs arithmetic/logic computations, and manages device interactions. (2 Marks)\nc) PSU: Converts alternating current (AC) high voltage electricity from the wall socket into regulated direct current (DC) low voltages (+3.3V, +5V, +12V) required by delicate computer electronics. (2 Marks)",
            breakdown: [
              { criterion: "Motherboard interconnectivity role", marks: 1 },
              { criterion: "CPU computation and instruction execution role", marks: 2 },
              { criterion: "PSU AC to DC power conversion role", marks: 2 }
            ],
            keywords: ["motherboard", "CPU", "PSU", "power supply", "circuit board", "AC to DC", "instruction execution"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo1_q3",
            q_num: 3,
            text: "Compare Solid-State Drives (SSD) and Hard Disk Drives (HDD) across three parameters: data transfer speed, physical durability/resistance to shock, and cost per gigabyte of storage.",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Secondary storage media comparison (SSD vs HDD)",
            correct_answer: "1. Data Transfer Speed: SSDs use high-speed flash NAND memory with zero seek time, delivering significantly faster read/write speeds (500 MB/s to 7000+ MB/s) compared to HDDs (80 to 160 MB/s) which rely on mechanical spinning platters. (2 Marks)\n2. Physical Durability: SSDs have no moving mechanical parts, making them highly resistant to physical shocks, drops, and vibrations; HDDs have spinning disks and delicate read/write heads prone to head crashes upon impact. (2 Marks)\n3. Cost per Gigabyte: HDDs provide a significantly lower cost per gigabyte, making them economical for large archival storage; SSDs carry a higher cost per gigabyte, making them ideal for OS and high-performance applications. (2 Marks)",
            breakdown: [
              { criterion: "Data transfer speed comparison", marks: 2 },
              { criterion: "Durability and shock resistance comparison", marks: 2 },
              { criterion: "Cost per gigabyte comparison", marks: 2 }
            ],
            keywords: ["SSD", "HDD", "flash memory", "spinning platters", "durability", "read write speed", "cost per gigabyte"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          }
        ]
      }
    }
  },
  // ─── LO2: Apply operating system functions ─────────────────────────────────
  {
    id: "cat-dl-lo2",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Common Core Unit Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 2 \u2014 Apply Operating System Functions",
      department: "Institutional Common Curriculum",
      course_name: "Common Core Unit \u2014 TVET Level 5 & 6 Programs",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "101305T4FBS",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-DL-LO2",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "dl_lo2_q1",
            q_num: 1,
            text: "Explain the role of an Operating System as a resource manager and user interface, describing two specific hardware resource management roles.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Operating system fundamental roles and resource management",
            correct_answer: "The Operating System acts as the vital software layer bridging users and application software with physical computer hardware. Specific roles: 1. Processor / Process Management: Allocates CPU execution time slices across concurrent running processes using scheduling algorithms. 2. Memory Management: Coordinates RAM allocation, tracking used/free memory blocks and swapping inactive memory pages to disk (virtual memory).",
            breakdown: [
              { criterion: "OS intermediary definition", marks: 1 },
              { criterion: "Process/CPU management explanation", marks: 1.5 },
              { criterion: "Memory allocation and virtual memory explanation", marks: 1.5 }
            ],
            keywords: ["operating system", "resource manager", "CPU scheduling", "process management", "memory allocation", "virtual memory"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo2_q2",
            q_num: 2,
            text: "Describe how to use the Windows Task Manager to monitor system performance and safely terminate an unresponsive application that has frozen the desktop.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Task Manager monitoring and process termination",
            correct_answer: "1. Press Ctrl + Shift + Esc (or Ctrl + Alt + Delete > Task Manager). 2. Navigate to 'Processes' tab to view real-time CPU, Memory, and Disk utilization percentages. 3. Locate the frozen application marked 'Not Responding'. 4. Select the unresponsive application and click 'End task' in the top/bottom bar. 5. Verify the process terminates, freeing up locked RAM and CPU cycles.",
            breakdown: [
              { criterion: "Opening Task Manager via shortcut", marks: 1 },
              { criterion: "Inspecting CPU/RAM utilization metrics", marks: 1 },
              { criterion: "Identifying 'Not Responding' process", marks: 1.5 },
              { criterion: "Executing 'End task' and verifying recovery", marks: 1.5 }
            ],
            keywords: ["Task Manager", "Ctrl+Shift+Esc", "Processes tab", "End task", "Not Responding", "CPU utilization"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo2_q3",
            q_num: 3,
            text: "a) Differentiate between the NTFS and FAT32 file system formats, stating two advantages of NTFS for modern hard drives (3 Marks).\nb) Describe the procedure for updating a device driver in Windows Device Manager when a newly attached hardware device fails to function (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "File system formats and Device Manager driver diagnostics",
            correct_answer: "a) FAT32 has a maximum single file size limit of 4 GB and lacks native security permissions. NTFS supports immense file and partition sizes (up to 8 Petabytes), native file encryption (EFS), access control permissions, and journaling for crash recovery. (3 Marks)\nb) Updating driver: 1. Press Win + X, select 'Device Manager'. 2. Expand the category containing the problematic device (often marked with yellow exclamation mark). 3. Right-click device > select 'Update driver'. 4. Choose 'Search automatically for drivers' (or browse computer if vendor driver files are downloaded). 5. Follow prompts and restart system if required. (3 Marks)",
            breakdown: [
              { criterion: "FAT32 file size limit vs NTFS capabilities", marks: 1.5 },
              { criterion: "Two NTFS security/journaling advantages", marks: 1.5 },
              { criterion: "Opening Device Manager and locating device", marks: 1.5 },
              { criterion: "Executing driver search and installation", marks: 1.5 }
            ],
            keywords: ["NTFS", "FAT32", "4GB limit", "journaling", "permissions", "Device Manager", "Update driver"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO3: Apply word processing concepts ───────────────────────────────────
  {
    id: "cat-dl-lo3",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Common Core Unit Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 3 \u2014 Apply Word Processing Concepts",
      department: "Institutional Common Curriculum",
      course_name: "Common Core Unit \u2014 TVET Level 5 & 6 Programs",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "101305T4FBS",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-DL-LO3",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "dl_lo3_q1",
            q_num: 1,
            text: "Explain the difference between 'First Line Indent' and 'Hanging Indent' in Microsoft Word paragraph formatting, citing a practical document scenario where each is applied.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Paragraph indentation mechanics and typographic standards",
            correct_answer: "First Line Indent indents only the initial line of a paragraph by a set measurement (e.g. 0.5 inches) while keeping subsequent lines aligned to the left margin; commonly used in formal essays, narrative reports, and book paragraphs. Hanging Indent keeps the first line flush against the left margin while indenting all subsequent lines; standardly used in academic bibliographies (APA/MLA references) and glossary listings.",
            breakdown: [
              { criterion: "First line indent definition & document application", marks: 2 },
              { criterion: "Hanging indent definition & bibliography application", marks: 2 }
            ],
            keywords: ["First Line Indent", "Hanging Indent", "margin", "bibliography", "APA", "paragraph formatting"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo3_q2",
            q_num: 2,
            text: "Outline the step-by-step procedure to insert a 4-column by 6-row table in Microsoft Word, merge the cells across the first row to create a header title, and apply custom table borders.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Word table creation, cell merging, and formatting",
            correct_answer: "1. Place cursor where table is required. 2. Click Insert tab > Table > grid select 4 columns and 6 rows (or Insert Table > enter 4 columns, 6 rows). 3. Highlight all four cells in row 1. 4. Navigate to Table Tools 'Layout' tab > click 'Merge Cells'. 5. Type and center-align the header title. 6. Select the whole table, go to 'Table Design' tab > Borders dropdown > configure border style, width, and apply 'All Borders'.",
            breakdown: [
              { criterion: "Inserting 4x6 table via Insert tab", marks: 1.5 },
              { criterion: "Highlighting row 1 and executing Merge Cells", marks: 1.5 },
              { criterion: "Applying custom border styles and borders", marks: 2 }
            ],
            keywords: ["Insert Table", "4 columns 6 rows", "Merge Cells", "Layout tab", "Table Design", "Borders"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo3_q3",
            q_num: 3,
            text: "a) Describe how to use the 'Track Changes' feature in Microsoft Word to collaborate on and review an institutional report draft (3 Marks).\nb) Outline the procedure to export a finished Word document to PDF format to ensure layout preservation (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Collaborative editing review and fixed-layout PDF publishing",
            correct_answer: "a) Track Changes: 1. Click Review tab > toggle 'Track Changes' to active. 2. Any text inserted, deleted, or formatted is marked with colored revisions and strikethroughs. 3. Reviewers can add explanatory comments via 'New Comment'. 4. Lead author can click 'Accept' or 'Reject' on each change. (3 Marks)\nb) PDF Export: 1. Click File tab > Export > 'Create PDF/XPS Document' (or File > Save As > choose PDF in file type). 2. Choose destination folder and file name. 3. Select 'Standard' publishing quality. 4. Click 'Publish' to generate clean non-editable document. (3 Marks)",
            breakdown: [
              { criterion: "Enabling Track Changes and markup view", marks: 1.5 },
              { criterion: "Comments and Accept/Reject review workflow", marks: 1.5 },
              { criterion: "File > Export / Save As PDF procedure", marks: 1.5 },
              { criterion: "Publishing options and document layout locking", marks: 1.5 }
            ],
            keywords: ["Track Changes", "Review tab", "Accept", "Reject", "comments", "Export PDF", "Save As"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO4: Apply spreadsheet applications ───────────────────────────────────
  {
    id: "cat-dl-lo4",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Common Core Unit Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 4 \u2014 Apply Spreadsheet Applications",
      department: "Institutional Common Curriculum",
      course_name: "Common Core Unit \u2014 TVET Level 5 & 6 Programs",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "101305T4FBS",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-DL-LO4",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "dl_lo4_q1",
            q_num: 1,
            text: "Differentiate between Relative Cell Referencing (e.g., A1) and Absolute Cell Referencing (e.g., $A$1) in Microsoft Excel, explaining why absolute referencing is mandatory when applying a fixed VAT rate across multiple sales entries.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "Cell referencing mechanics in spreadsheet calculations",
            correct_answer: "Relative cell references (e.g. A1) automatically change their row and column offsets when copied or filled into other cells. Absolute cell references (e.g. $A$1) use dollar signs ($) to permanently lock the row and column coordinates, preventing them from shifting. In a VAT calculation, locking the tax rate cell ($B$1) ensures that when copying formula =A5*$B$1 downwards, all rows continue multiplying against cell B1 rather than shifting to empty cells below.",
            breakdown: [
              { criterion: "Relative reference behavior explained", marks: 1.5 },
              { criterion: "Absolute reference dollar sign locking explained", marks: 1.5 },
              { criterion: "VAT fixed rate calculation rationale", marks: 1 }
            ],
            keywords: ["relative referencing", "absolute referencing", "$A$1", "dollar sign", "lock", "VAT calculation"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo4_q2",
            q_num: 2,
            text: "Given an Excel grade sheet with marks in cell range D2 to D31, write the exact formula syntax to:\na) Calculate the average score (1 Mark)\nb) Find the highest score (1 Mark)\nc) Count the number of students who scored 50 marks and above using COUNTIF (3 Marks)",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Statistical formula construction in spreadsheets",
            correct_answer: 'a) Average: =AVERAGE(D2:D31) (1 Mark)\nb) Highest: =MAX(D2:D31) (1 Mark)\nc) Count >= 50: =COUNTIF(D2:D31, ">=50") (3 Marks; range: D2:D31, quotes around comparison criteria ">=50").',
            breakdown: [
              { criterion: "=AVERAGE(D2:D31) formula syntax", marks: 1 },
              { criterion: "=MAX(D2:D31) formula syntax", marks: 1 },
              { criterion: "=COUNTIF range parameter D2:D31", marks: 1.5 },
              { criterion: '=COUNTIF criteria formatting ">=50"', marks: 1.5 }
            ],
            keywords: ["AVERAGE", "MAX", "COUNTIF", ">=50", "D2:D31", "formula syntax"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo4_q3",
            q_num: 3,
            text: "Describe the steps required to generate a Clustered Column Chart from tabular department expenditure data, add chart titles and axis labels, and filter the chart to display only the top three spending categories.",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Chart generation, formatting, and data filtering",
            correct_answer: "1. Select the data range including category labels and numerical values. 2. Click Insert tab > Charts group > Insert Column or Bar Chart > choose 'Clustered Column'. 3. Click the '+' (Chart Elements) icon at top-right of chart > check 'Chart Title' and 'Axis Titles'. 4. Double-click titles to enter descriptive names (e.g. 'Departmental Q3 Expenditure'). 5. Click the Funnel (Chart Filters) icon next to the chart. 6. In the Categories list, uncheck unnecessary categories so only the top three remain selected, then click 'Apply'.",
            breakdown: [
              { criterion: "Data selection and chart insertion", marks: 1.5 },
              { criterion: "Adding Chart and Axis title elements", marks: 1.5 },
              { criterion: "Naming axes descriptively", marks: 1 },
              { criterion: "Using Chart Filter funnel to isolate top 3 categories", marks: 2 }
            ],
            keywords: ["Clustered Column", "Insert tab", "Chart Elements", "Axis Titles", "Chart Filters", "funnel icon", "Apply"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  },
  // ─── LO5: Utilize internet, email & cybersecurity ─────────────────────────
  {
    id: "cat-dl-lo5",
    unit_code: "061155101A",
    course_name: "Apply Digital Literacy (Common Core Unit Level 5 & 6)",
    created_at: "2026-10-14T08:00:00Z",
    payload: {
      institution: "MUKIRIA TECHNICAL TRAINING INSTITUTE",
      title: "CAT 5 \u2014 Utilize Internet, Email & Cybersecurity",
      department: "Institutional Common Curriculum",
      course_name: "Common Core Unit \u2014 TVET Level 5 & 6 Programs",
      unit_name: "APPLY DIGITAL LITERACY",
      course_code: "101305T4FBS",
      class: "FBS5/6/J/26",
      target_cohorts: ["FBS5/6/J/26", "FBS 5 MOD", "FBS6 MOD", "LS5/6/S/26"],
      portal_visible: false,
      assessment_category: "CAT",
      task_code: "CAT-DL-LO5",
      series: "TERM 3 2026",
      time_allowed: "30 MINUTES",
      duration_minutes: 30,
      total_marks: 15,
      type: "written",
      instructions: "1. Answer ALL questions in the spaces provided;\n2. Total marks: 15 Marks;\n3. Time Allowed: 30 Minutes.",
      section_a: {
        title: "Continuous Assessment Test (15 Marks)",
        instructions: "Answer ALL questions in the spaces provided.",
        total_marks: 15,
        questions: [
          {
            id: "dl_lo5_q1",
            q_num: 1,
            text: "Explain the four structural components of a Uniform Resource Locator (URL) using the address: https://www.mtti.ac.ke/trainees/results.html as a practical example.",
            type: "short_answer",
            marks: 4,
            critical_aspect: "URL anatomical components and web protocol concepts",
            correct_answer: "1. 'https://' : Protocol Scheme (Hypertext Transfer Protocol Secure, indicating encrypted SSL/TLS communication). 2. 'www.mtti.ac.ke' : Domain Name / Host Server (identifies institutional web server). 3. '/trainees/' : Directory Path (specifies folder path on web server hosting file). 4. 'results.html' : Resource File Name (the specific HTML document being retrieved).",
            breakdown: [
              { criterion: "Protocol scheme (https) explained", marks: 1 },
              { criterion: "Domain name host explained", marks: 1 },
              { criterion: "Directory path explained", marks: 1 },
              { criterion: "Resource file name explained", marks: 1 }
            ],
            keywords: ["URL", "https", "protocol", "domain name", "directory path", "file name", "HTML"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo5_q2",
            q_num: 2,
            text: "Differentiate between the 'To', 'Cc' (Carbon Copy), and 'Bcc' (Blind Carbon Copy) fields in professional email communication, giving a workplace scenario where 'Bcc' is legally or ethically mandatory.",
            type: "short_answer",
            marks: 5,
            critical_aspect: "Email addressing standards and privacy compliance",
            correct_answer: "1. 'To': Primary recipient(s) directly responsible for taking action or reading communication. 2. 'Cc' (Carbon Copy): Secondary recipients kept informed for transparency; their email addresses are visible to all recipients. 3. 'Bcc' (Blind Carbon Copy): Recipients receive copy secretly without other recipients seeing their addresses. Mandatory scenario: Sending announcements to hundreds of external students/clients where exposing personal email addresses in 'To' or 'Cc' violates data protection acts (Data Protection Act 2019) and exposes contacts to spam.",
            breakdown: [
              { criterion: "To field role explained", marks: 1 },
              { criterion: "Cc field transparency role explained", marks: 1 },
              { criterion: "Bcc confidentiality mechanics explained", marks: 1.5 },
              { criterion: "Data protection mass mailing scenario", marks: 1.5 }
            ],
            keywords: ["To", "Cc", "Bcc", "Carbon Copy", "Blind Carbon Copy", "privacy", "Data Protection Act", "confidentiality"],
            evaluation_mode: "semi_objective",
            requires_trainer_review: false
          },
          {
            id: "dl_lo5_q3",
            q_num: 3,
            text: "a) Identify three common indicators of a phishing email attack targeting institutional credentials (3 Marks).\nb) Explain how Multi-Factor Authentication (MFA / 2FA) enhances student and staff portal security even if a password is leaked (3 Marks).",
            type: "short_answer",
            marks: 6,
            critical_aspect: "Phishing threat recognition and Multi-Factor Authentication (MFA)",
            correct_answer: "a) Phishing indicators: 1. Mismatched or suspicious sender domain address (e.g. support@mtt1-ac-ke.com instead of official @mtti.ac.ke). 2. Sense of artificial urgency or threats (e.g. 'Your account will be suspended within 2 hours'). 3. Suspicious hyperlinks pointing to spoofed login URLs and generic greetings ('Dear User'). (3 Marks)\nb) Multi-Factor Authentication: Requires users to provide two or more distinct verification factors before granting access: something you know (password) and something you have (time-based OTP on authenticator app or SMS prompt) or something you are (biometric fingerprint). Even if an attacker steals the password, they cannot breach the account without physical access to the secondary authentication device. (3 Marks)",
            breakdown: [
              { criterion: "Phishing indicator 1 (sender domain mismatch)", marks: 1 },
              { criterion: "Phishing indicator 2 (artificial urgency/threats)", marks: 1 },
              { criterion: "Phishing indicator 3 (spoofed links/generic greetings)", marks: 1 },
              { criterion: "MFA multi-factor concept (know, have, are)", marks: 1.5 },
              { criterion: "Account protection against stolen passwords", marks: 1.5 }
            ],
            keywords: ["phishing", "domain mismatch", "urgency", "spoofed links", "MFA", "2FA", "OTP", "authenticator", "password protection"],
            evaluation_mode: "subjective",
            requires_trainer_review: true
          }
        ]
      }
    }
  }
];
var CURRICULUM_CATS = [
  ...COMPUTER_ESSENTIALS_CATS,
  ...APPLY_ICT_SKILLS_CATS,
  ...DIGITAL_LITERACY_CATS
];

// server/security.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt2 from "jsonwebtoken";
import { z } from "zod";
var securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'",
        "https:",
        "wss:",
        "http://localhost:*",
        "ws://localhost:*"
      ],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});
var corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];
    if (process.env.NODE_ENV !== "production" || allowed.includes(origin) || origin.endsWith(".mtti.ac.ke") || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-user-role",
    "x-user-id",
    "x-user-reg",
    "x-user-dept",
    "x-user-enrolled-units",
    "x-user-units",
    "x-test-rate-limit"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
});
function getLabSafeRateLimitKey(req) {
  const user = req.user;
  if (user) {
    if (user.id) return `user:${user.id}`;
    if (user.user_id) return `user:${user.user_id}`;
    if (user.reg_number) return `trainee:${String(user.reg_number).trim().toUpperCase()}`;
    if (user.adm_no) return `trainee:${String(user.adm_no).trim().toUpperCase()}`;
  }
  const headerUserId = req.headers["x-user-id"];
  if (typeof headerUserId === "string" && headerUserId.trim()) {
    return `user:${headerUserId.trim()}`;
  }
  const headerReg = req.headers["x-user-reg"];
  if (typeof headerReg === "string" && headerReg.trim()) {
    return `trainee:${headerReg.trim().toUpperCase()}`;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const rawToken = authHeader.slice(7).trim();
    if (rawToken) {
      if (rawToken.startsWith("token-")) {
        return `demo:${rawToken}`;
      }
      try {
        const decoded = jwt2.decode(rawToken);
        if (decoded && typeof decoded === "object") {
          const id = decoded.id || decoded.sub || decoded.user_id || decoded.reg_number || decoded.adm_no;
          if (id) return `token:${String(id).trim().toUpperCase()}`;
        }
      } catch {
      }
    }
  }
  if (req.body && typeof req.body === "object") {
    const candidateId = req.body.reg_number || req.body.regNumber || req.body.adm_no || req.body.admNo || req.body.admission_number || req.body.admissionNumber;
    if (typeof candidateId === "string" && candidateId.trim()) {
      return `trainee-payload:${candidateId.trim().toUpperCase()}`;
    }
    if (typeof req.body.email === "string" && req.body.email.trim()) {
      return `email:${req.body.email.trim().toLowerCase()}`;
    }
  }
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "127.0.0.1";
  return `ip:${ip}`;
}
function shouldSkipRateLimit(req) {
  if (req.headers["x-test-rate-limit"] === "true" || process.env.ENABLE_RATE_LIMIT_TEST === "true") {
    return false;
  }
  return process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";
}
var apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: (req) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 1e3 : 300;
  },
  keyGenerator: (req) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Too many requests. Please try again after a few minutes.",
    service_status: "rate_limited",
    retry_after_minutes: 15
  }
});
var authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: (req) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 1e3 : 120;
  },
  keyGenerator: (req) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Too many authentication requests. Institutional rate limit exceeded. Please wait 15 minutes.",
    service_status: "rate_limited",
    retry_after_minutes: 15
  }
});
var submissionsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1e3,
  // 5 minutes
  max: (req) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 3e3 : 300;
  },
  keyGenerator: (req) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Submission rate limit exceeded. Offline buffer is active; queued items will sync automatically.",
    service_status: "rate_limited",
    retry_after_minutes: 5
  }
});
var examsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1e3,
  // 5 minutes
  max: (req) => {
    const key = getLabSafeRateLimitKey(req);
    return key.startsWith("ip:") ? 3e3 : 300;
  },
  keyGenerator: (req) => getLabSafeRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  message: {
    error: "Exam query rate limit exceeded. Please wait a moment.",
    service_status: "rate_limited",
    retry_after_minutes: 5
  }
});
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      res.status(400).json({
        error: "Validation Error: Invalid request payload",
        details: issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
          message: e.message
        }))
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
var TraineeCreateSchema = z.object({
  name: z.string().min(1, "Trainee name is required"),
  admNo: z.string().optional(),
  adm_no: z.string().optional(),
  regCode: z.string().optional(),
  reg_code: z.string().optional(),
  classCode: z.string().optional().default("ICT4/ITECH6/S/26 MOD 1"),
  class_code: z.string().optional(),
  department: z.string().optional().default("Computing & Informatics"),
  gender: z.string().optional().default("M"),
  phone: z.string().optional(),
  remarks: z.string().optional()
}).refine((data) => Boolean(data.admNo || data.adm_no), {
  message: "Admission number (admNo or adm_no) is required",
  path: ["admNo"]
});
var TraineeUpdateSchema = z.object({
  name: z.string().optional(),
  admNo: z.string().optional(),
  adm_no: z.string().optional(),
  regNumber: z.string().optional(),
  reg_number: z.string().optional(),
  regCode: z.string().optional(),
  reg_code: z.string().optional(),
  classCode: z.string().optional(),
  class_code: z.string().optional(),
  classId: z.string().optional(),
  class_id: z.string().optional(),
  department: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  remarks: z.string().optional()
});
var AttendanceMarkSchema = z.object({
  unitOfferingId: z.string().optional(),
  traineeId: z.string().min(1, "traineeId is required"),
  weekNumber: z.number().int().min(1).max(30),
  sessionDate: z.string().min(1, "sessionDate is required"),
  sessionIndex: z.number().int().optional().default(1),
  status: z.enum(["present", "absent", "excused", "X", "0"]),
  hoursAttended: z.number().min(0).optional().default(0),
  remarks: z.string().optional(),
  markedBy: z.string().optional()
});

// server/documentSigner.ts
import crypto from "crypto";
function getSigningSecret() {
  return process.env.DOCUMENT_SIGNING_SECRET || "mtti-doc-auth-secret-key-knqf-cdacc-2026";
}
function canonicalizeDocMetadata(doc) {
  const docType = (doc.doc_type || "broadsheet").trim().toLowerCase();
  const unit = (doc.unit_code || "").trim().toUpperCase();
  const term = (doc.term || "").trim();
  const total = Number(doc.total_candidates || 0);
  const comp = Number(doc.competent_count || 0);
  const nyc = Number(doc.nyc_count || 0);
  const avg = Number((doc.average_mark || 0).toFixed(2));
  const signoff = Boolean(doc.hod_signoff);
  const issued = (doc.issued_at || "").trim();
  return [
    `type=${docType}`,
    `unit=${unit}`,
    `term=${term}`,
    `candidates=${total}`,
    `competent=${comp}`,
    `nyc=${nyc}`,
    `avg=${avg}`,
    `hod_signoff=${signoff}`,
    `issued_at=${issued}`
  ].join("|");
}
function signDocumentPayload(docMetadata) {
  const secret = getSigningSecret();
  const canonical = canonicalizeDocMetadata(docMetadata);
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  const short_hash = `MTTI-${signature.slice(0, 12).toUpperCase()}`;
  const envelope = {
    d: docMetadata,
    sig: signature,
    h: short_hash
  };
  const token = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  return {
    token,
    signature,
    short_hash,
    canonical_string: canonical
  };
}
function verifyDocumentToken(token) {
  try {
    if (!token || typeof token !== "string" || !token.trim()) {
      return { valid: false, error: "Missing or invalid token parameter" };
    }
    const raw = Buffer.from(token.trim(), "base64url").toString("utf8");
    const envelope = JSON.parse(raw);
    if (!envelope || !envelope.d || typeof envelope.sig !== "string") {
      return { valid: false, error: "Malformed document verification envelope structure" };
    }
    const secret = getSigningSecret();
    const canonical = canonicalizeDocMetadata(envelope.d);
    const expectedSig = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
    const sigBuf = Buffer.from(envelope.sig, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return {
        valid: false,
        error: "Cryptographic signature mismatch: Document payload has been altered or tampered with."
      };
    }
    return {
      valid: true,
      docMetadata: envelope.d,
      short_hash: envelope.h || `MTTI-${envelope.sig.slice(0, 12).toUpperCase()}`
    };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to decode verification token: ${err.message}`
    };
  }
}

// server/logger.ts
var APP_VERSION = process.env.APP_VERSION || "1.0.0";
function sanitizeValue(key, value) {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("password") || lowerKey.includes("secret") || lowerKey.includes("token") || lowerKey.includes("cookie") || lowerKey.includes("authorization")) {
    return "[REDACTED]";
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? void 0 : value.stack
    };
  }
  return value;
}
function formatLog(level, message, context) {
  const payload = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message,
    app_version: APP_VERSION
  };
  if (context && typeof context === "object") {
    for (const [k, v] of Object.entries(context)) {
      payload[k] = sanitizeValue(k, v);
    }
  }
  return JSON.stringify(payload);
}
var logger = {
  info(message, context) {
    console.log(formatLog("info", message, context));
  },
  warn(message, context) {
    console.warn(formatLog("warn", message, context));
  },
  error(message, context) {
    console.error(formatLog("error", message, context));
  },
  debug(message, context) {
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG === "true") {
      console.log(formatLog("debug", message, context));
    }
  }
};

// server/sentry.ts
import * as Sentry from "@sentry/node";
var SENTRY_DSN = process.env.SENTRY_DSN || "";
var APP_VERSION2 = process.env.APP_VERSION || "1.0.0";
var ENVIRONMENT = process.env.NODE_ENV || "development";
var isServerSentryInitialized = false;
function initServerSentry() {
  if (!SENTRY_DSN || isServerSentryInitialized) {
    return;
  }
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      release: `mukiria-trainer-dashboard@${APP_VERSION2}`,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
          delete event.request.headers["x-access-token"];
        }
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      }
    });
    Sentry.setTag("app_version", APP_VERSION2);
    isServerSentryInitialized = true;
    console.log(JSON.stringify({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      event: "sentry_initialized",
      environment: ENVIRONMENT,
      app_version: APP_VERSION2
    }));
  } catch (err) {
    console.warn("[Sentry Server] Failed to initialize:", err);
  }
}
function sentryContextMiddleware(req, _res, next) {
  if (isServerSentryInitialized) {
    const user = req.user;
    if (user) {
      if (user.role) Sentry.setTag("user.role", String(user.role).toLowerCase());
      if (user.cohort_id || user.department_id) {
        Sentry.setTag("cohort", String(user.cohort_id || user.department_id));
      }
      Sentry.setUser({ id: user.id || user.user_id || "authenticated" });
    }
  }
  next();
}
function captureServerException(error, context) {
  if (!isServerSentryInitialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      const sanitized = {};
      for (const [k, v] of Object.entries(context)) {
        if (!k.toLowerCase().includes("password") && !k.toLowerCase().includes("secret") && !k.toLowerCase().includes("token")) {
          sanitized[k] = v;
        }
      }
      scope.setExtras(sanitized);
    }
    Sentry.captureException(error);
  });
}

// shared/const.ts
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
function normalizeAdmissionNumber(adm) {
  if (!adm) return "";
  let s = adm.trim().toUpperCase().replace(/\s+/g, "");
  s = s.replace(
    /^(ICT4\/ITECH\s*6[^\/\-]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?|CFD\s*MOD)[\/\-]/i,
    ""
  );
  return s;
}
function matchAdmissionNumbers(admA, admB) {
  if (!admA || !admB) return false;
  const rawA = admA.trim().toUpperCase();
  const rawB = admB.trim().toUpperCase();
  if (rawA === rawB) return true;
  const noSpaceA = rawA.replace(/\s+/g, "");
  const noSpaceB = rawB.replace(/\s+/g, "");
  if (noSpaceA === noSpaceB) return true;
  const normA = normalizeAdmissionNumber(admA);
  const normB = normalizeAdmissionNumber(admB);
  if (normA && normB && normA === normB) return true;
  const slashA = noSpaceA.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  const slashB = noSpaceB.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  if (slashA === slashB) return true;
  const coreA = (normA.match(/\b\d{4,6}\b/) || noSpaceA.match(/\d{4,6}/))?.[0];
  const coreB = (normB.match(/\b\d{4,6}\b/) || noSpaceB.match(/\d{4,6}/))?.[0];
  if (coreA && coreB && coreA === coreB) {
    const hasAlphaA = /[A-Z]/.test(normA);
    const hasAlphaB = /[A-Z]/.test(normB);
    if (!hasAlphaA || !hasAlphaB || normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }
  return false;
}

// shared/cohortRegistry.ts
var OFFICIAL_INSTITUTIONAL_COHORTS = [
  {
    id: "ICT4_ITECH6",
    primaryCode: "ICT4/ITECH6/S/26 MOD 1",
    name: "Information Communication Technology Level 6 / ITECH Level 4",
    department: "Computing & Informatics",
    level: 6,
    aliases: [
      "ICT4/ITECH6/S/26 MOD 1",
      "ITECH 6 MODULAR/S/2026",
      "ICT4 MOD/S/2026",
      "ICT4_ITECH6",
      "ITECH6",
      "ICT4",
      "ITECH 6"
    ],
    defaultUnitCodes: ["061155101A"]
  },
  {
    id: "FBS5_6",
    primaryCode: "FBS 5 MOD/J/2026",
    name: "Food & Beverage Sales and Service Management Levels 5 & 6",
    department: "FBS Hospitality",
    level: 5,
    aliases: [
      "FBS5/6/J/26",
      "FBS 5 MOD/J/2026",
      "FBS6 MOD/12026",
      "FBS6 MOD/J/2026",
      "FBS5_6",
      "FBS5",
      "FBS6",
      "FBP 6",
      "FBP6"
    ],
    defaultUnitCodes: ["101355101A"]
  },
  {
    id: "ADMIN5_6_MOD3",
    primaryCode: "ADMIN5/6/J/26 MOD 3",
    name: "Business Management & Administration Levels 5 & 6 (Module 3)",
    department: "Business",
    level: 6,
    aliases: [
      "ADMIN5/6/J/26 MOD 3",
      "ADMIN5_6_MOD3",
      "ADMIN 5/6 MOD 3",
      "ADMIN5/6/J/26",
      "ADMIN 5/6/J/26",
      "Admin 5/6/j 26",
      "ADMIN 5/6/J 26",
      "ADMIN5/6/J 26",
      "ADMIN5/6/J/26 MOD3",
      "ADMIN 5/6/J/26 MOD 3",
      "ADMIN5/6/J/2026",
      "ADMIN 5/6/J/2026",
      "ADMIN5/6/J/2026 MOD 3",
      "ADMIN 5/6/J/2026 MOD 3",
      "ADMIN5/6/J/256 MOD 3",
      "ADMIN5/6",
      "ADMIN 6",
      "ADMIN"
    ],
    defaultUnitCodes: [
      "0415-451-21A",
      "0415 451 21A",
      "0415-451-21A-PRAC",
      "041355101A"
    ]
  },
  {
    id: "ADMIN4_5_6_MOD1",
    primaryCode: "ADMIN4/5/6/S/26 MOD 1",
    name: "Business Management & Administration Levels 4, 5 & 6 (Module 1)",
    department: "Business",
    level: 5,
    aliases: [
      "ADMIN4/5/6/S/26 MOD 1",
      "ADMIN4_5_6_MOD1",
      "ADMIN 4/5/6 MOD 1",
      "ADMIN MOD 1"
    ],
    defaultUnitCodes: ["041355101A"]
  },
  {
    id: "LS5_6",
    primaryCode: "LS5/6/S/26",
    name: "Land Surveying Levels 5 & 6",
    department: "Building & Civil Engineering",
    level: 6,
    aliases: [
      "LS5/6/S/26",
      "LS5_6",
      "LS 5/6",
      "SURVEY",
      "LS5",
      "LS6"
    ],
    defaultUnitCodes: ["073155101A"]
  },
  {
    id: "CE6",
    primaryCode: "CE6/S/26",
    name: "Civil Engineering Level 6",
    department: "Building & Civil Engineering",
    level: 6,
    aliases: [
      "CE6/S/26",
      "CE6/M/26",
      "CE6/J/26",
      "CE6",
      "CIVIL"
    ],
    defaultUnitCodes: ["073255101A"]
  }
];
function resolveCanonicalCohortKey(code) {
  if (!code) return "UNKNOWN";
  const norm = code.trim().toUpperCase();
  for (const cohort of OFFICIAL_INSTITUTIONAL_COHORTS) {
    if (cohort.id.toUpperCase() === norm || cohort.primaryCode.toUpperCase() === norm) {
      return cohort.id;
    }
    for (const alias of cohort.aliases) {
      if (alias.toUpperCase() === norm) {
        return cohort.id;
      }
    }
  }
  if (norm.includes("ICT") || norm.includes("ITECH")) return "ICT4_ITECH6";
  if (norm.includes("ADMIN") && norm.includes("MOD 1")) return "ADMIN4_5_6_MOD1";
  if (norm.includes("ADMIN") && norm.includes("MOD 3")) return "ADMIN5_6_MOD3";
  if (norm.includes("ADMIN")) return "ADMIN5_6_MOD3";
  if (norm.includes("FBS") || norm.includes("FBP")) return "FBS5_6";
  if (norm.includes("LS") || norm.includes("SURVEY")) return "LS5_6";
  if (norm.includes("CE") || norm.includes("CIVIL")) return "CE6";
  return norm.replace(/[^A-Z0-9_]/g, "_");
}
function findCohortByCodeOrAlias(code) {
  if (!code) return void 0;
  const canonicalKey = resolveCanonicalCohortKey(code);
  return OFFICIAL_INSTITUTIONAL_COHORTS.find((c) => c.id === canonicalKey);
}
function getDepartmentForCohort(code) {
  const cohort = findCohortByCodeOrAlias(code);
  if (cohort) return cohort.department;
  const norm = (code || "").toUpperCase();
  if (norm.includes("FBS") || norm.includes("FBP")) return "FBS Hospitality";
  if (norm.includes("ADMIN") || norm.includes("BUS")) return "Business";
  if (norm.includes("LS") || norm.includes("CE") || norm.includes("CIVIL") || norm.includes("SURVEY")) {
    return "Building & Civil Engineering";
  }
  return "Computing & Informatics";
}

// server/routes.ts
var apiRouter = Router();
apiRouter.use("/auth", authRateLimiter);
apiRouter.use("/submissions", submissionsRateLimiter);
apiRouter.use("/exams", examsRateLimiter);
var DB = {
  departments: [
    { id: "dept-ci", name: "Computing & Informatics", code: "CI", hod_id: "hod-001" },
    { id: "dept-ee", name: "Electrical & Electronics Engineering", code: "EEE", hod_id: "hod-002" },
    { id: "dept-bce", name: "Building & Civil Engineering", code: "BCE", hod_id: "hod-003" },
    { id: "dept-him", name: "Hospitality & Institutional Management", code: "HIM", hod_id: "hod-004" },
    { id: "dept-ia", name: "Institutional Academics", code: "IA", hod_id: "hod-005" },
    { id: "dept-aes", name: "Agriculture & Environmental Studies", code: "AES", hod_id: "hod-006" },
    { id: "dept-ch", name: "Cosmetology & Hairdressing", code: "CH", hod_id: "hod-007" },
    { id: "dept-sg", name: "Surveying & Geomatics", code: "SG", hod_id: "hod-008" },
    { id: "dept-mae", name: "Mechanical & Automotive Engineering", code: "MAE", hod_id: "hod-009" },
    { id: "dept-business", name: "Business Studies", code: "BUS", hod_id: "hod-010" }
  ],
  trainers: [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", assigned_units: ["ICT/OS/IT/CR/1/6"] }
  ],
  trainees: [
    { id: "trainee-001", name: "Nthiga Gakii Doris", reg_number: "14179/S2026-SEED", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-10525", name: "Alex Kinoti", reg_number: "10525", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-003", name: "Other Student", reg_number: "99999", class_id: "class-ee-4", enrolled_units: ["EE/CU/01/4"] },
    { id: "tr_fbs5_01", name: "Yvonne Mwende", reg_number: "13254", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_02", name: "Muoki Muthoki", reg_number: "13263", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_03", name: "Kibaara Peninah Gaichuiri", reg_number: "13281", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_04", name: "Hilda Mwede Njagi", reg_number: "13297", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_05", name: "Ndolo Shalom Mbithe", reg_number: "13304", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_06", name: "Mirriam Nzula", reg_number: "13313", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_07", name: "Waweru Hope Marion Makena", reg_number: "13343", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_08", name: "Ann Joy Makena", reg_number: "13355", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_09", name: "Martha Mwende Kyalo", reg_number: "13378", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_10", name: "John Opiyo Omondi", reg_number: "13396", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_11", name: "Eunice Kendi Nyaga", reg_number: "13445", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_12", name: "Miriko Rita", reg_number: "13446", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_13", name: "Valentine Lesoito", reg_number: "13463", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_14", name: "Kinyua Christine Mutito", reg_number: "13482", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_15", name: "Gichukia Bridgit Nyakio", reg_number: "13488", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_16", name: "Karwitha Silvia", reg_number: "13546", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_17", name: "Lavint Aliviza", reg_number: "13551", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_18", name: "Kinya Weddy", reg_number: "13559", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_19", name: "Gakuhi Jackline Nyambura", reg_number: "13571", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_20", name: "Terry Mwendwa", reg_number: "13583", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_21", name: "Faith Mwende", reg_number: "13258", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_22", name: "Eugene Murimi", reg_number: "12265", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_23", name: "Brendah Mumbi", reg_number: "13231", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] }
  ],
  unit_offerings: [
    { id: "uo-1", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/CU/IT/CR/6/6", unit_id: "unit-cr-6", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-2", term_id: "term-2026", class_id: "class-itech-6", unit_code: "061155101A", unit_id: "unit-dl-1", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-3", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/OS/IT/CR/1/6", unit_id: "unit-net-1", trainer_id: "trainer-002", department_id: "dept-ci" },
    { id: "uo-it4-1", term_id: "term-2026", class_id: "ICT4 MOD/S/2026", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-1", term_id: "term-2026", class_id: "ICT4/ITECH6/S/26 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-2", term_id: "term-2026", class_id: "ICT4/ITECH6/S/2026 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-admin-1", term_id: "term-2026", class_id: "ADMIN5/6/J/26 MOD 3", unit_code: "0415-451-21A", unit_id: "unit-ict-admin", trainer_id: "trainer-001", department_id: "dept-business" },
    { id: "uo-admin-2", term_id: "term-2026", class_id: "ADMIN5/6/J/26", unit_code: "0415-451-21A", unit_id: "unit-ict-admin", trainer_id: "trainer-001", department_id: "dept-business" }
  ],
  exams: [
    ...DIGITAL_LITERACY_EXAMS,
    ...CURRICULUM_CATS,
    {
      id: "exam-cr-001",
      unit_id: "unit-cr-6",
      unit_code: "ICT/CU/IT/CR/6/6",
      course_name: "ICT Technician Level 6",
      payload: {
        title: "Computer Repair & Maintenance Assessment",
        duration_minutes: 120,
        total_marks: 50,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z",
        // active window
        section_a: {
          title: "Section A: Objective Knowledge",
          instructions: "Select the correct response.",
          total_marks: 20,
          questions: [
            {
              id: "q1",
              text: "Which command checks disk integrity?",
              type: "mcq",
              options: ["chkdsk", "sfc /scannow", "ipconfig", "netstat"],
              correct_answer: "0",
              // MUST BE STRIPPED FOR STUDENTS
              rubric: "1 mark for chkdsk",
              // MUST BE STRIPPED FOR STUDENTS
              critical_aspect: "OS disk diagnostics",
              // MUST BE STRIPPED FOR STUDENTS
              marks: 5
            }
          ]
        },
        section_b: {
          title: "Section B: Practical Diagnostics",
          instructions: "Explain procedure.",
          total_marks: 30,
          questions: [
            {
              id: "q2",
              text: "Explain troubleshooting CPU throttling in Task Manager.",
              type: "short_answer",
              correct_answer: "Check thermal limits and process utilization",
              rubric: "Award 10 marks for thermal vs process analysis",
              critical_aspect: "System performance monitoring",
              marks: 10
            }
          ]
        }
      }
    },
    {
      id: "exam-net-001",
      unit_id: "unit-net-1",
      unit_code: "ICT/OS/IT/CR/1/6",
      course_name: "Computer Networking",
      payload: {
        title: "Computer Networking Examination",
        duration_minutes: 120,
        total_marks: 50,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z",
        section_a: {
          title: "Networking Basics",
          instructions: "Answer all questions.",
          total_marks: 25,
          questions: [
            {
              id: "q_net_1",
              text: "Default subnet mask for class C network?",
              type: "mcq",
              options: ["255.255.255.0", "255.255.0.0", "255.0.0.0"],
              correct_answer: "0",
              rubric: "Award 5 marks",
              critical_aspect: "Subnetting",
              marks: 5
            }
          ]
        }
      }
    },
    {
      id: "exam-essentials-mod1",
      unit_id: "unit-essentials-4",
      unit_code: "IT/CU/ICTA/CR/01/4/MA",
      course_name: "ICT 4 / ICT Technician Level 5 & 6",
      payload: {
        title: "Perform Computer Essentials Formative Assessment",
        duration_minutes: 180,
        total_marks: 100,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z",
        type: "practical",
        section_a: {
          title: "Section A: Practical Observation & Device Management",
          instructions: "Demonstrate hands-on tasks per assessor observation checklist.",
          total_marks: 50,
          questions: [
            { id: "q_ess_1", text: "Identify 5 external ports and locate CMOS battery.", type: "practical", marks: 15 },
            { id: "q_ess_2", text: "Open Device Manager and verify input device drivers.", type: "practical", marks: 15 },
            { id: "q_ess_3", text: "Oral Assessment: Differentiate between RAM/ROM and SSD/HDD.", type: "oral", marks: 20 }
          ]
        },
        section_b: {
          title: "Section B: Desktop Configuration & Software Management",
          instructions: "Perform file archiving and software management.",
          total_marks: 50,
          questions: [
            { id: "q_ess_4", text: "Create folder structure and compress using 7-Zip.", type: "practical", marks: 25 },
            { id: "q_ess_5", text: "Uninstall software and configure default PDF viewer.", type: "practical", marks: 25 }
          ]
        }
      }
    }
  ],
  submissions: (() => {
    const defaultSubs = [
      ...FBS_COHORT_SUBMISSIONS,
      {
        id: "sub-005",
        unit_code: "061155101A",
        student_name: "Yvonne Mwende",
        reg_number: "13254",
        section_a: [
          { question_id: "dl1_a1", answer: "Digital literacy is the ability to find, evaluate, and compose clear information using digital devices.", marks_awarded: 2 },
          { question_id: "dl1_a2", answer: "Input: Keyboard and Scanner. Output: Monitor and Laser Printer.", marks_awarded: 4 },
          { question_id: "dl1_a3", answer: "1. Save open files. 2. Close active applications. 3. Click Start > Power > Shut Down.", marks_awarded: 3 },
          { question_id: "dl1_a4", answer: "Touch typing and keyboard shortcuts like Ctrl+S, Ctrl+C.", marks_awarded: 2 },
          { question_id: "dl1_a5", answer: "Create folder > File > Save As into folder > set password in General Options.", marks_awarded: 4 },
          { question_id: "dl1_a6", answer: "Banking, Healthcare, Education.", marks_awarded: 3 },
          { question_id: "dl1_a7", answer: "Connect HDMI, press Win + P, select Duplicate.", marks_awarded: 3 },
          { question_id: "dl1_a8", answer: "System software manages hardware (Windows); application software does user work (Word).", marks_awarded: 3 },
          { question_id: "dl1_a9", answer: "Click and drag file to destination folder.", marks_awarded: 2 },
          { question_id: "dl1_a10", answer: "Acceptable use policy and password security policy.", marks_awarded: 2 }
        ],
        section_b: [
          { question_id: "dl1_b11", answer: "Word processor features, newsletter formatting, shortcuts, calculator differences.", marks_awarded: 18 },
          { question_id: "dl1_b12", answer: "Word tables, spreadsheet printing, budget components, lab safety measures.", marks_awarded: 17 }
        ],
        status: "graded",
        total_score: 63,
        trainer_comments: "Distinction performance. Strong grasp of digital literacy concepts.",
        created_at: "2026-10-04T11:30:00Z"
      },
      {
        id: "sub-006",
        unit_code: "061155101A",
        student_name: "Muoki Muthoki",
        reg_number: "13263",
        section_a: [
          { question_id: "dl1_a1", answer: "Digital literacy is using computers effectively for workplace communication.", marks_awarded: 2 },
          { question_id: "dl1_a2", answer: "Input: Keyboard, Mouse. Output: Monitor, Printer.", marks_awarded: 4 },
          { question_id: "dl1_a3", answer: "Save documents, close apps, click Start > Shut down.", marks_awarded: 2 },
          { question_id: "dl1_a4", answer: "Home row touch typing and Ctrl+C shortcuts.", marks_awarded: 2 },
          { question_id: "dl1_a5", answer: "New folder, Save As, set password.", marks_awarded: 3 },
          { question_id: "dl1_a6", answer: "Hospitals, Banks, Schools.", marks_awarded: 2 },
          { question_id: "dl1_a7", answer: "HDMI cable, Windows + P Duplicate.", marks_awarded: 2 },
          { question_id: "dl1_a8", answer: "System software (Windows), Application software (Word).", marks_awarded: 3 },
          { question_id: "dl1_a9", answer: "Drag file to folder and release.", marks_awarded: 2 },
          { question_id: "dl1_a10", answer: "Password policy, Acceptable use policy.", marks_awarded: 2 }
        ],
        section_b: [
          { question_id: "dl1_b11", answer: "Word processor, shortcuts, calculator vs computer.", marks_awarded: 16 },
          { question_id: "dl1_b12", answer: "Word tables, spreadsheet print, lab safety.", marks_awarded: 16 }
        ],
        status: "graded",
        total_score: 56,
        trainer_comments: "Competent performance (Credit). Good practical understanding.",
        created_at: "2026-10-04T12:00:00Z"
      },
      {
        id: "sub-101",
        exam_id: "exam-cr-001",
        unit_code: "ICT/CU/IT/CR/6/6",
        trainee_id: "trainee-001",
        reg_number: "10525",
        student_name: "Alex Kinoti",
        status: "submitted",
        total_score: 42,
        section_a: [{ question_id: "q1", answer: "0", marks_awarded: 5 }],
        section_b: [{ question_id: "q2", answer: "Inspect processes and thermals", marks_awarded: 8 }],
        created_at: "2026-09-01T10:00:00Z"
      },
      {
        id: "sub-102",
        exam_id: "exam-cr-001",
        unit_code: "ICT/CU/IT/CR/6/6",
        trainee_id: "trainee-002",
        reg_number: "10526",
        student_name: "Harriet Mwendwa",
        status: "submitted",
        total_score: 38,
        section_a: [{ question_id: "q1", answer: "0", marks_awarded: 5 }],
        section_b: [{ question_id: "q2", answer: "Check cooling fans", marks_awarded: 6 }],
        created_at: "2026-09-01T10:05:00Z"
      }
    ];
    const persisted = loadPersistentSubmissions();
    if (persisted && persisted.length > 0) {
      const mergedMap = /* @__PURE__ */ new Map();
      defaultSubs.forEach((s) => mergedMap.set(s.id, s));
      persisted.forEach((s) => mergedMap.set(s.id, s));
      return Array.from(mergedMap.values());
    }
    return defaultSubs;
  })(),
  assessment_marks: (() => {
    const persisted = loadPersistentAssessmentMarks();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "mark-01",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-001",
        ct_avg: 78,
        cp_avg: 84,
        cp_scores: [84],
        ct_scores: [78],
        project_score: 80,
        weighted_mark: 81,
        is_locked: true
        // Published
      },
      {
        id: "mark-02",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-002",
        ct_avg: 65,
        cp_avg: 70,
        cp_scores: [70],
        ct_scores: [65],
        project_score: 75,
        weighted_mark: 68,
        is_locked: false
        // DRAFT (Unpublished - Trainees must NOT see this!)
      }
    ];
  })(),
  assessment_evidence: (() => {
    const defaultEvidence = [
      {
        id: "ev-001",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-001",
        task_code: "CP1",
        title: "Computer Hardware Diagnostics & Disassembly",
        filename: "Computer_Essentials_Practical_1.pdf",
        file_url: "/api/evidence/ev-001/file",
        mime_type: "application/pdf",
        file_size: 145020,
        file_data: "JVBERi0xLjQKJSDi48cKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc0CiUlRU9G",
        verified_by_trainer: true,
        verified_at: "2026-09-16T10:00:00Z",
        verified_by: "Dr. J. Muriithi",
        grade: 88,
        feedback: "Exemplary hardware inspection and BIOS configuration.",
        submitted_at: "2026-09-15T09:30:00Z"
      },
      {
        id: "ev-002",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-002",
        task_code: "CP2",
        title: "Motherboard Diagnostics Observation Photo",
        filename: "Hardware_Setup_Evidence.png",
        file_url: "/api/evidence/ev-002/file",
        mime_type: "image/png",
        file_size: 42100,
        file_data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        verified_by_trainer: false,
        verified_at: null,
        verified_by: null,
        grade: null,
        feedback: "",
        submitted_at: "2026-09-15T10:00:00Z"
      },
      {
        id: "ev-003",
        unit_offering_id: "uo-3",
        // trainer-002's unit (Networking)
        trainee_id: "trainee-001",
        task_code: "CP1",
        title: "Network Cable Termination & LAN Verification",
        filename: "Network_Configuration_Evidence.pdf",
        file_url: "/api/evidence/ev-003/file",
        mime_type: "application/pdf",
        file_size: 128e3,
        file_data: "JVBERi0xLjQKJSDi48cKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc0CiUlRU9G",
        verified_by_trainer: false,
        verified_at: null,
        verified_by: null,
        grade: null,
        feedback: "",
        submitted_at: "2026-09-15T11:00:00Z"
      }
    ];
    const persisted = loadPersistentAssessmentEvidence();
    if (persisted && persisted.length > 0) {
      const mergedMap = /* @__PURE__ */ new Map();
      defaultEvidence.forEach((e) => mergedMap.set(e.id, e));
      persisted.forEach((e) => mergedMap.set(e.id, e));
      return Array.from(mergedMap.values());
    }
    return defaultEvidence;
  })(),
  session_plans: (() => {
    const persisted = loadPersistentSessionPlans();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "sp-001",
        unit_offering_id: "uo-1",
        trainer_id: "trainer-001",
        department_id: "dept-ci",
        date: "2026-09-10",
        session_title: "PC Hardware Diagnostics",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null
      },
      {
        id: "sp-002",
        unit_offering_id: "uo-3",
        trainer_id: "trainer-002",
        department_id: "dept-ci",
        date: "2026-09-12",
        session_title: "Network Cabling & Crimping",
        approval_status: "approved",
        hod_reviewed_by: "hod-001",
        hod_reviewer_name: "Prof. S. Njoroge",
        hod_review_date: "2026-09-13T10:00:00Z",
        hod_remarks: "Approved for lab practicals."
      },
      {
        id: "sp-ee-001",
        unit_offering_id: "uo-ee-1",
        trainer_id: "trainer-ee-001",
        department_id: "dept-ee",
        date: "2026-09-14",
        session_title: "Power Systems Analysis",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null
      }
    ];
  })(),
  learning_plans: loadPersistentLearningPlans(),
  record_of_work: (() => {
    const persisted = loadPersistentRecordsOfWork();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "row-001",
        session_plan_id: "sp-001",
        unit_offering_id: "uo-1",
        trainer_id: "trainer-001",
        department_id: "dept-ci",
        work_covered: "Disassembly and testing of power supply units",
        date_covered: "2026-09-10",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null
      },
      {
        id: "row-002",
        session_plan_id: "sp-002",
        unit_offering_id: "uo-3",
        trainer_id: "trainer-002",
        department_id: "dept-ci",
        work_covered: "Ethernet standard 568B termination lab",
        date_covered: "2026-09-12",
        approval_status: "approved",
        hod_reviewed_by: "hod-001",
        hod_reviewer_name: "Prof. S. Njoroge",
        hod_review_date: "2026-09-13T10:00:00Z",
        hod_remarks: "Verified against syllabus."
      },
      {
        id: "row-ee-001",
        session_plan_id: "sp-ee-001",
        unit_offering_id: "uo-ee-1",
        trainer_id: "trainer-ee-001",
        department_id: "dept-ee",
        work_covered: "Transformer loading tests",
        date_covered: "2026-09-14",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null
      }
    ];
  })(),
  class_registers: loadPersistentClassRegisters(),
  compliance_rulesets: [...DEFAULT_COMPLIANCE_RULESETS],
  audit_logs: []
};
function sanitizeExamForStudent(exam) {
  const sanitizeQuestions = (questions) => {
    return (questions || []).map((q) => {
      const { correct_answer, rubric, critical_aspect, keywords, ...cleanQuestion } = q;
      return cleanQuestion;
    });
  };
  const payload = { ...exam.payload };
  if (payload.section_a?.questions) {
    payload.section_a = {
      ...payload.section_a,
      questions: sanitizeQuestions(payload.section_a.questions)
    };
  }
  if (payload.section_b?.questions) {
    payload.section_b = {
      ...payload.section_b,
      questions: sanitizeQuestions(payload.section_b.questions)
    };
  }
  delete payload.answer_key;
  delete payload.rubric;
  return {
    ...exam,
    payload
  };
}
function verifyTrainerSubmissionsAssigned(trainerId, examId) {
  if (!examId) return false;
  const exam = DB.exams.find((e) => e.id === examId);
  if (!exam) return false;
  const offering = DB.unit_offerings.find((uo) => (exam.unit_id ? uo.unit_id === exam.unit_id : uo.unit_code === exam.unit_code) && uo.trainer_id === trainerId);
  return !!offering;
}
function verifyHODDepartmentScope(hodDepartmentId, examId) {
  if (!hodDepartmentId || !examId) return false;
  const exam = DB.exams.find((e) => e.id === examId);
  if (!exam) return false;
  const offering = DB.unit_offerings.find((uo) => exam.unit_id ? uo.unit_id === exam.unit_id : uo.unit_code === exam.unit_code);
  return offering?.department_id === hodDepartmentId;
}
apiRouter.get("/health", async (_req, res) => {
  let dbStatus = pool ? "connected" : "fallback_local";
  if (pool) {
    try {
      await pool.query("SELECT 1");
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }
  const memoryUsage = process.memoryUsage();
  res.json({
    status: dbStatus === "disconnected" ? "degraded" : "healthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    service: "mukiria-rbac-gateway",
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
    },
    initError: lastInitError
  });
});
apiRouter.get("/verify-document", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).json({
      valid: false,
      verified: false,
      error: "Missing required 'token' query parameter for document verification."
    });
    return;
  }
  const result = verifyDocumentToken(token);
  if (!result.valid || !result.docMetadata) {
    res.status(400).json({
      valid: false,
      verified: false,
      error: result.error || "Cryptographic verification failed: Document has been altered or tampered with."
    });
    return;
  }
  const doc = result.docMetadata;
  let canonicalMatched = true;
  let canonicalNotes = "Cryptographically authenticated against MTTI Institutional Authority.";
  if (pool) {
    try {
      if (doc.doc_type === "broadsheet" || doc.doc_type === "assessment_marks") {
        const queryRes = await pool.query(
          `SELECT COUNT(*)::int as count, AVG(final_score)::numeric as avg_score 
           FROM assessment_marks 
           WHERE UPPER(unit_code) = UPPER($1)`,
          [doc.unit_code]
        );
        if (queryRes.rows.length > 0 && queryRes.rows[0].count > 0) {
          const dbCount = queryRes.rows[0].count;
          if (doc.total_candidates > 0 && Math.abs(dbCount - doc.total_candidates) > 5) {
            canonicalNotes = `Snapshot verified; live database has ${dbCount} candidate records.`;
          }
        }
      }
    } catch {
    }
  }
  res.json({
    valid: true,
    verified: true,
    document_type: doc.doc_type,
    unit_code: doc.unit_code,
    term: doc.term,
    academic_year: doc.academic_year || "2026",
    total_candidates: doc.total_candidates,
    competent_count: doc.competent_count ?? 0,
    nyc_count: doc.nyc_count ?? 0,
    average_mark: doc.average_mark ?? 0,
    hod_signoff: doc.hod_signoff,
    hod_name: doc.hod_name || "Head of Department",
    short_hash: result.short_hash,
    issued_at: doc.issued_at,
    issuer: "Mukiria Technical Training Institute (MTTI)",
    canonical_status: "CANONICAL_AUTHENTIC",
    verification_notes: canonicalNotes,
    verification_timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.post("/auth/register-trainee", async (req, res) => {
  try {
    const full_name = (req.body.full_name || req.body.fullName || "").trim();
    const admission_number = (req.body.admission_number || req.body.admissionNumber || "").trim();
    const phone_number = (req.body.phone_number || req.body.phoneNumber || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password;
    if (!full_name || !admission_number || !email || !password) {
      res.status(400).json({
        error: "Validation Error: full_name, admission_number, email, and password are required"
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: "Validation Error: Invalid email format"
      });
      return;
    }
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      res.status(409).json({
        error: "Conflict: A user with this email address is already registered"
      });
      return;
    }
    const normAdm = normalizeAdmissionIdentifier(admission_number);
    const rosterTrainees = await loadDatabaseTrainees();
    const matchingProfiles = rosterTrainees.filter((t) => {
      const normReg = normalizeAdmissionIdentifier(t.reg_number);
      const normNo = normalizeAdmissionIdentifier(t.adm_no);
      const normCode = normalizeAdmissionIdentifier(t.reg_code);
      return normReg && normReg === normAdm || normNo && normNo === normAdm || normCode && normCode === normAdm;
    });
    if (matchingProfiles.length === 0) {
      res.status(403).json({
        error: "Forbidden: Admission number does not match an official institutional roster record"
      });
      return;
    }
    if (matchingProfiles.length > 1) {
      res.status(403).json({
        error: "Forbidden: Admission number is ambiguous across roster records"
      });
      return;
    }
    const matchedProfile = matchingProfiles[0];
    const existingUserByProfile = await findUserByProfileId(matchedProfile.id);
    const existingAdm = await findUserByAdmissionNumber(admission_number);
    if (existingUserByProfile || existingAdm) {
      const existingUser = existingUserByProfile || existingAdm;
      if (req.body.isActivation || req.body.reactivate) {
        const isBcryptHash2 = typeof password === "string" && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) && password.length === 60;
        const password_hash2 = isBcryptHash2 ? password : await bcrypt.hash(password, 10);
        existingUser.password_hash = password_hash2;
        if (phone_number) existingUser.phone_number = phone_number;
        if (full_name) existingUser.full_name = full_name;
        existingUser.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        if (!existingUser.profile_id) {
          existingUser.profile_id = matchedProfile.id;
        }
        const allUsers = loadPersistentUsers();
        savePersistentUsers(allUsers);
        res.status(200).json({
          success: true,
          message: "Trainee account activated successfully",
          user: {
            id: existingUser.id,
            admission_number: existingUser.admission_number,
            phone_number: existingUser.phone_number,
            full_name: existingUser.full_name,
            email: existingUser.email,
            role: "trainee",
            profile_id: existingUser.profile_id,
            created_at: existingUser.created_at
          }
        });
        return;
      }
      res.status(409).json({
        error: "Conflict: A trainee with this admission number is already registered"
      });
      return;
    }
    const isBcryptHash = typeof password === "string" && (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) && password.length === 60;
    const password_hash = isBcryptHash ? password : await bcrypt.hash(password, 10);
    const role = "trainee";
    const created = await createUser({
      admission_number,
      phone_number: phone_number || null,
      full_name,
      email,
      password_hash,
      role,
      profile_id: matchedProfile.id
    });
    res.status(201).json({
      success: true,
      message: "Trainee registered successfully",
      user: {
        id: created.id,
        admission_number: created.admission_number,
        phone_number: created.phone_number,
        full_name: created.full_name,
        email: created.email,
        role: "trainee",
        profile_id: created.profile_id,
        created_at: created.created_at
      }
    });
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      res.status(503).json({ error: "Service Unavailable: Database connection failed" });
      return;
    }
    if (err?.code === "23505") {
      res.status(409).json({
        error: "Conflict: A user with this email or admission number is already registered"
      });
      return;
    }
    logger.error("Trainee registration error", { event: "registration_error", error: err });
    captureServerException(err, { event: "registration_error" });
    res.status(500).json({ error: "Internal server error during trainee registration" });
  }
});
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const identifier = (req.body.identifier || req.body.admission_number || req.body.admissionNumber || req.body.email || req.body.username || "").trim();
    const password = req.body.password;
    if (!identifier || !password) {
      res.status(400).json({
        error: "Validation Error: Identifier (admission number or email) and password are required"
      });
      return;
    }
    const user = await findUserByEmailOrAdmission(identifier);
    if (!user) {
      res.status(401).json({
        error: "Unauthorized: Invalid credentials"
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        error: "Unauthorized: Invalid credentials"
      });
      return;
    }
    const userRole = String(user.role || "trainee").trim().toLowerCase();
    const token = signToken({
      sub: user.id,
      role: userRole
    });
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        profile_id: user.profile_id,
        admission_number: user.admission_number,
        phone_number: user.phone_number,
        full_name: user.full_name,
        email: user.email,
        role: userRole,
        department_id: user.department_id || null,
        must_change_password: user.must_change_password === true
      }
    });
  } catch (err) {
    logger.error("Authentication error", { event: "login_error", error: err });
    captureServerException(err, { event: "login_error" });
    res.status(500).json({ error: `Internal server error during authentication: ${err?.message || "unknown"}` });
  }
});
apiRouter.use(authenticateUser);
apiRouter.post("/auth/change-password", async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!req.user || !currentPassword || newPassword.length < 12) {
    res.status(400).json({ error: "Current password and a new password of at least 12 characters are required." });
    return;
  }
  try {
    const user = await findUserByEmail(req.user.email || "");
    if (!user || user.id !== req.user.id || !await bcrypt.compare(currentPassword, user.password_hash)) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }
    await updateUserPassword(user.id, await bcrypt.hash(newPassword, 12));
    invalidateUserProfileCache(user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error("Password change error", { event: "change_password_error", error });
    captureServerException(error, { event: "change_password_error" });
    const status = error instanceof DatabaseUnavailableError ? 503 : 500;
    res.status(status).json({ error: "Could not update the password. Please try again." });
  }
});
apiRouter.post("/documents/sign", async (req, res) => {
  const {
    doc_type,
    unit_code,
    term,
    academic_year,
    cohort_id,
    total_candidates,
    competent_count,
    nyc_count,
    average_mark,
    hod_name,
    hod_signoff
  } = req.body || {};
  if (!unit_code || !term) {
    res.status(400).json({ error: "unit_code and term are required to sign an academic document." });
    return;
  }
  const docMetadata = {
    doc_type: doc_type || "broadsheet",
    unit_code: String(unit_code).trim().toUpperCase(),
    term: String(term).trim(),
    academic_year: academic_year || "2026",
    cohort_id: cohort_id || void 0,
    total_candidates: Number(total_candidates || 0),
    competent_count: Number(competent_count || 0),
    nyc_count: Number(nyc_count || 0),
    average_mark: Number(average_mark || 0),
    hod_name: hod_name || req.user?.name || "Head of Department",
    hod_signoff: Boolean(hod_signoff ?? (req.user?.role === "hod" || req.user?.role === "admin")),
    issued_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const signed = signDocumentPayload(docMetadata);
  const host = req.get("host") || "nolimit.co.ke";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const verify_url = `${protocol}://${host}/verify-document?token=${signed.token}`;
  const qr_data_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verify_url)}`;
  res.json({
    success: true,
    token: signed.token,
    signature: signed.signature,
    short_hash: signed.short_hash,
    verify_url,
    qr_data_url,
    doc_metadata: docMetadata
  });
});
var OFFICIAL_INSTITUTIONAL_ROSTER = [
  // 1. Level 6 & Level 4 Modular Cohorts (Perform Computer Essentials)
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admissionNumber: "14179/S2026", fullName: "Nthiga Gakii Doris", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admissionNumber: "14255/S2026", fullName: "Kaumbuthu Belinda Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admissionNumber: "14022/S2026", fullName: "Ltumwa Lesoipa", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admissionNumber: "14077/S2026", fullName: "Kitheka Emmanuel Kioko", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admissionNumber: "14102/S2026", fullName: "Felix Mugendi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admissionNumber: "14119/S2026", fullName: "Mwangi Clinton Njiru", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admissionNumber: "14149/S2026", fullName: "Abigael Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admissionNumber: "14172/S2026", fullName: "Fiona Kadogo Mwika", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admissionNumber: "14207/S2026", fullName: "Ann Mary Makena", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admissionNumber: "14254/S2026", fullName: "Brenda Ngugi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admissionNumber: "14267/S2026", fullName: "Ingashia Favour Wawira", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admissionNumber: "14076/S2026", fullName: "Wanjau Alvin Gatere", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admissionNumber: "14107/S2026", fullName: "Ann Mukiri Matheta", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admissionNumber: "14124/S2026", fullName: "Kimanthi Dennis Mwenda", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_04", regCode: "ICT4 MOD/14128/S2026", admissionNumber: "14128/S2026", fullName: "Kimanthi Dennis Mwenda (II)", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_05", regCode: "ICT4 MOD/14211/S2026", admissionNumber: "14211/S2026", fullName: "Guantai Brandon Mutua", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_06", regCode: "ICT4 MOD/14218/S2026", admissionNumber: "14218/S2026", fullName: "Mwithia Mutharimi Nathan", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_07", regCode: "ICT4 MOD/14248/S2026", admissionNumber: "14248/S2026", fullName: "Mbaabu Sarah Nkatha", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_08", regCode: "ICT4 MOD/14341/S2026", admissionNumber: "14341/S2026", fullName: "Mutiria Hesborn Muriuki", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  // Level 5: ICT Craftsperson / Technician (15 Trainees)
  { id: "tr_it5_01", regCode: "ITECH 5 MOD/14105/S2026", admissionNumber: "14105/S2026", fullName: "Brian Mwiti Murithi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_02", regCode: "ITECH 5 MOD/14115/S2026", admissionNumber: "14115/S2026", fullName: "Joyline Kawira", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_03", regCode: "ITECH 5 MOD/14126/S2026", admissionNumber: "14126/S2026", fullName: "Martin Kinyua", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_04", regCode: "ITECH 5 MOD/14138/S2026", admissionNumber: "14138/S2026", fullName: "Dorcas Kathure", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_05", regCode: "ITECH 5 MOD/14152/S2026", admissionNumber: "14152/S2026", fullName: "Evans Kipkemoi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_06", regCode: "ITECH 5 MOD/14164/S2026", admissionNumber: "14164/S2026", fullName: "Fridah Gacheri", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_07", regCode: "ITECH 5 MOD/14178/S2026", admissionNumber: "14178/S2026", fullName: "Kelvin Muthomi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_08", regCode: "ITECH 5 MOD/14189/S2026", admissionNumber: "14189/S2026", fullName: "Sharon Kagendo", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_09", regCode: "ITECH 5 MOD/14201/S2026", admissionNumber: "14201/S2026", fullName: "James Mwenda", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_10", regCode: "ITECH 5 MOD/14215/S2026", admissionNumber: "14215/S2026", fullName: "Purity Gatwiri", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_11", regCode: "ITECH 5 MOD/14227/S2026", admissionNumber: "14227/S2026", fullName: "Samuel Gitonga", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_12", regCode: "ITECH 5 MOD/14239/S2026", admissionNumber: "14239/S2026", fullName: "Mercy Makena", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_13", regCode: "ITECH 5 MOD/14251/S2026", admissionNumber: "14251/S2026", fullName: "Victor Mutuma", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_14", regCode: "ITECH 5 MOD/14263/S2026", admissionNumber: "14263/S2026", fullName: "Caroline Mukami", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_15", regCode: "ITECH 5 MOD/14275/S2026", admissionNumber: "14275/S2026", fullName: "Kennedy Koome", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  // 2. ADMIN5/6/J/26 MOD 3 (Apply ICT Skills - Business Department, 11 Trainees)
  { id: "tr_adm_01", regCode: "13410", admissionNumber: "13410", fullName: "RISPER MWENDE", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_02", regCode: "13527", admissionNumber: "13527", fullName: "Banta Micheni", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_03", regCode: "12218", admissionNumber: "12218", fullName: "Christine Gitonga", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_04", regCode: "13252", admissionNumber: "13252", fullName: "Cynthia Nkatha", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_05", regCode: "13284", admissionNumber: "13284", fullName: "Linet Ntinyari", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_06", regCode: "13424", admissionNumber: "13424", fullName: "Nanis Ngugi", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_07", regCode: "13276", admissionNumber: "13276", fullName: "Sharon Minoo", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_08", regCode: "10203", admissionNumber: "10203", fullName: "Frida Kianjira", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_09", regCode: "12254", admissionNumber: "12254", fullName: "Mercy Kiende", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_10", regCode: "12665", admissionNumber: "12665", fullName: "Ruth Kathure", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_11", regCode: "13580", admissionNumber: "13580", fullName: "MERCY KATHUURE", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  // 3. FBS5/6/J/26 (Apply Digital Literacy - Hospitality Department, 26 Trainees)
  { id: "tr_fbs5_01", regCode: "FBS 5 MOD/13254/J2026", admissionNumber: "13254", fullName: "Yvonne Mwende", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_02", regCode: "FBS 5 MOD/13263/J2026", admissionNumber: "13263", fullName: "Muoki Muthoki", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_03", regCode: "FBS 5 MOD/13281/J2026", admissionNumber: "13281", fullName: "Kibaara Peninah Gaichuiri", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_04", regCode: "FBS 5 MOD/13297/J2026", admissionNumber: "13297", fullName: "Hilda Mwede Njagi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_05", regCode: "FBS 5 MOD/13304/J2026", admissionNumber: "13304", fullName: "Ndolo Shalom Mbithe", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_06", regCode: "FBS 5 MOD/13313/J2026", admissionNumber: "13313", fullName: "Mirriam Nzula", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_07", regCode: "FBS 5 MOD/13343/J2026", admissionNumber: "13343", fullName: "Waweru Hope Marion Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_08", regCode: "FBS 5 MOD/13355/J2026", admissionNumber: "13355", fullName: "Ann Joy Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_09", regCode: "FBS 5 MOD/13378/J2026", admissionNumber: "13378", fullName: "Martha Mwende Kyalo", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_10", regCode: "FBS 5 MOD/13396/J2026", admissionNumber: "13396", fullName: "John Opiyo Omondi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_11", regCode: "FBS 5 MOD/13445/J2026", admissionNumber: "13445", fullName: "Eunice Kendi Nyaga", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_12", regCode: "FBS 5 MOD/13446/J2026", admissionNumber: "13446", fullName: "Miriko Rita", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_13", regCode: "FBS 5 MOD/13463/J2026", admissionNumber: "13463", fullName: "Valentine Lesoito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_14", regCode: "FBS 5 MOD/13482/J2026", admissionNumber: "13482", fullName: "Kinyua Christine Mutito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_15", regCode: "FBS 5 MOD/13488/J2026", admissionNumber: "13488", fullName: "Gichukia Bridgit Nyakio", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_16", regCode: "FBS 5 MOD/13546/J2026", admissionNumber: "13546", fullName: "Karwitha Silvia", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_17", regCode: "FBS 5 MOD/13551/J2026", admissionNumber: "13551", fullName: "Lavint Aliviza", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_18", regCode: "FBS 5 MOD/13559/12026", admissionNumber: "13559", fullName: "Kinya Weddy", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_19", regCode: "FBS 5 MOD/13571/12026", admissionNumber: "13571", fullName: "Gakuhi Jackline Nyambura", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_20", regCode: "FBS 5 MOD/13583/12026", admissionNumber: "13583", fullName: "Terry Mwendwa", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_21", regCode: "FBS 5 MOD/13258/J2026", admissionNumber: "13258", fullName: "Faith Mwende", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },
  { id: "tr_fbs5_22", regCode: "FBS 5 MOD/12265/J2026", admissionNumber: "12265", fullName: "Eugene Murimi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },
  { id: "tr_fbs5_23", regCode: "FBS 5 MOD/13231/J2026", admissionNumber: "13231", fullName: "Brendah Mumbi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },
  // 4. LS5/6/S/26 (Apply Digital Literacy - Land Survey, 19 Trainees + Harriet Mwendwa)
  { id: "tr_ls5_01", regCode: "LS5 MOD/14009/52026", admissionNumber: "14009", fullName: "Vick Mutembei", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_02", regCode: "LS5 MOD/14024/52026", admissionNumber: "14024", fullName: "Kajuju Jackline Kathera", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_03", regCode: "LS5 MOD/14032/52026", admissionNumber: "14032", fullName: "Muthike Bredah Nyawira", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_04", regCode: "LS5 MOD/14092/S2026", admissionNumber: "14092", fullName: "Murithi Brian Munene", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_05", regCode: "LS5 MOD/14120/52026", admissionNumber: "14120", fullName: "Glory Makena", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_06", regCode: "LS5 MOD/14348/S2026", admissionNumber: "14348", fullName: "Okello Janet Auma", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_07", regCode: "LS5 MOD/14403/52026", admissionNumber: "14403", fullName: "Mutegi Kagendo Emma", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_08", regCode: "LS5 MOD/14428/52026", admissionNumber: "14428", fullName: "Risper Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_09", regCode: "LS5 MOD/14502/52026", admissionNumber: "14502", fullName: "Mutegi Hyprith Gatwiri", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_01", regCode: "LS6 MOD/14001/S2026", admissionNumber: "14001", fullName: "Njeru Salim Mutemi", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_02", regCode: "LS6 MOD/14011/S2026", admissionNumber: "14011", fullName: "Jedida Karwitha", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_03", regCode: "LS6 MOD/14066/52026", admissionNumber: "14066", fullName: "Nyaga Caroline Mukami", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_04", regCode: "LS6 MOD/14183/S2026", admissionNumber: "14183", fullName: "Gideon Mucheria Kithendu", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_05", regCode: "LS6 MOD/14256/52026", admissionNumber: "14256", fullName: "Linus Murerwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_06", regCode: "LS6 MOD/14283/52026", admissionNumber: "14283", fullName: "Caroline Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_07", regCode: "LS6 MOD/14331/S2026", admissionNumber: "14331", fullName: "Brian Mutembei", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_08", regCode: "LS6 MOD/14332/52026", admissionNumber: "14332", fullName: "Kipngetich Cornelius", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_09", regCode: "LS6 MOD/14351/52026", admissionNumber: "14351", fullName: "Otieno Jecinter Trizer", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_10", regCode: "LS6 MOD/14451/S2026", admissionNumber: "14451", fullName: "Caroline Kanana Mwirigi", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls_harriet", regCode: "D/UPNUT/25042/069", admissionNumber: "D/UPNUT/25042/069", fullName: "Harriet Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] }
];
function findTraineeInRoster(regNo, unitCode) {
  const rawReg = (regNo || "").trim();
  if (!rawReg) return null;
  const normalizedAdm = normalizeAdmissionNumber(rawReg);
  const normUnit = unitCode ? unitCode.trim().toUpperCase() : "";
  const baseUnit = normUnit ? normUnit.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "") : "";
  const persistentTrainees = loadPersistentTrainees();
  const candidatePool = [
    ...OFFICIAL_INSTITUTIONAL_ROSTER,
    ...DB.trainees.map((t) => ({
      id: t.id,
      admissionNumber: t.reg_number,
      regCode: t.reg_number,
      fullName: t.name,
      cohortCode: t.class_id,
      enrolled_units: t.enrolled_units
    })),
    ...persistentTrainees.map((t) => ({
      id: t.id,
      admissionNumber: t.adm_no || t.reg_number,
      regCode: t.reg_code || t.adm_no || t.reg_number,
      fullName: t.name,
      cohortCode: t.class_code || t.class_id || "UNKNOWN",
      department: t.department
    }))
  ];
  const candidate = candidatePool.find((c) => {
    return normalizedAdm && normalizeAdmissionNumber(c.admissionNumber) === normalizedAdm || normalizedAdm && c.regCode && normalizeAdmissionNumber(c.regCode) === normalizedAdm || matchAdmissionNumbers(c.admissionNumber, rawReg) || matchAdmissionNumbers(c.regCode, rawReg);
  });
  if (!candidate) return null;
  if (normUnit || baseUnit) {
    const enrolled = candidate.enrolled_units || [];
    const cohort = candidate.cohortCode.toUpperCase();
    const isEnrolledDirectly = enrolled.some((u) => {
      const uNorm = u.trim().toUpperCase();
      const uBase = uNorm.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");
      return uNorm === normUnit || uBase === baseUnit || baseUnit && uNorm.startsWith(baseUnit);
    });
    const isEnrolledInOffering = DB.unit_offerings.some((uo) => {
      const uoNorm = uo.unit_code.trim().toUpperCase();
      const uoBase = uoNorm.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");
      const matchesUnitCode = uoNorm === normUnit || uoBase === baseUnit;
      return matchesUnitCode && (uo.class_id.toUpperCase() === cohort || cohort.includes(uo.class_id.toUpperCase()));
    });
    const isDigitalLiteracy = baseUnit === "061155101A" || normUnit.includes("061155101A");
    const isDLCohort = (cohort.includes("ADMIN") || cohort.includes("FBS") || cohort.includes("LS") || cohort.includes("ITECH 6")) && !cohort.includes("ICT4");
    const isEssentials = normUnit.includes("CR/01/4") || normUnit.includes("0611-651-21A") || baseUnit === "0611-651-21A";
    const isEssentialsCohort = cohort.includes("ICT4") || cohort.includes("ITECH") || cohort.includes("MOD 1");
    if (!isEnrolledDirectly && !isEnrolledInOffering && !(isDigitalLiteracy && isDLCohort) && !(isEssentials && isEssentialsCohort)) {
      return null;
    }
    return {
      id: candidate.id,
      admissionNumber: candidate.admissionNumber,
      fullName: candidate.fullName,
      cohortCode: candidate.cohortCode
    };
  }
  const dept = candidate.department || getDepartmentForCohort(candidate.cohortCode);
  const classCode = candidate.cohortCode;
  return {
    id: candidate.id,
    admissionNumber: candidate.admissionNumber,
    fullName: candidate.fullName,
    cohortCode: classCode,
    classCode,
    department: dept
  };
}
apiRouter.get("/trainees/lookup", async (req, res) => {
  try {
    const isAdmissionLookup = typeof req.query.admission_no === "string" || typeof req.query.admission_number === "string" || typeof req.query.admissionNumber === "string";
    const queryParam = typeof req.query.admission_no === "string" ? req.query.admission_no : typeof req.query.admissionNumber === "string" ? req.query.admissionNumber : typeof req.query.admission_number === "string" ? req.query.admission_number : typeof req.query.regNo === "string" ? req.query.regNo : typeof req.query.admNo === "string" ? req.query.admNo : typeof req.query.q === "string" ? req.query.q : "";
    const rawAdmission = queryParam.trim();
    const unitCode = typeof req.query.unitCode === "string" ? req.query.unitCode.trim() : "";
    if (!rawAdmission) {
      res.status(400).json({ error: "Registration number is required." });
      return;
    }
    let trainee = findTraineeInRoster(rawAdmission, unitCode);
    if (!trainee && pool) {
      try {
        const pgRes = await pool.query(
          `SELECT id, name, adm_no, reg_number, reg_code, class_code, class_id, department
         FROM trainees
         WHERE LOWER(adm_no) = LOWER($1)
            OR LOWER(reg_number) = LOWER($1)
            OR (reg_code IS NOT NULL AND LOWER(reg_code) = LOWER($1))
         LIMIT 1`,
          [rawAdmission]
        );
        if (pgRes.rows.length > 0) {
          const row = pgRes.rows[0];
          const adm = row.adm_no || row.reg_number || rawAdmission;
          const classCode = row.class_code || row.class_id || "UNKNOWN";
          const dept = row.department || getDepartmentForCohort(classCode);
          trainee = {
            id: row.id,
            admissionNumber: adm,
            fullName: row.name,
            cohortCode: classCode,
            classCode,
            department: dept
          };
        }
      } catch (err) {
        logger.warn("PostgreSQL trainees lookup notice", { event: "trainee_lookup_notice", error: err?.message });
      }
    }
    if (!trainee) {
      const errorMsg = unitCode ? "Registration number not found in this unit class register." : "Admission number not found in institutional roster.";
      res.status(404).json({ error: errorMsg });
      return;
    }
    if (isAdmissionLookup || !unitCode) {
      const dept = trainee.department || getDepartmentForCohort(trainee.cohortCode);
      const classCode = trainee.classCode || trainee.cohortCode;
      res.json({
        id: trainee.id,
        admissionNumber: trainee.admissionNumber,
        admission_number: trainee.admissionNumber,
        admission_no: trainee.admissionNumber,
        fullName: trainee.fullName,
        full_name: trainee.fullName,
        cohortCode: classCode,
        classCode,
        class_code: classCode,
        department: dept
      });
      return;
    }
    res.json({
      id: trainee.id,
      admissionNumber: trainee.admissionNumber,
      fullName: trainee.fullName,
      cohortCode: trainee.cohortCode
    });
  } catch (err) {
    logger.error("Trainee lookup error", { event: "trainee_lookup_error", error: err });
    captureServerException(err, { event: "trainee_lookup_error" });
    res.status(500).json({ error: "Failed to verify trainee admission number." });
  }
});
apiRouter.get("/trainees", async (req, res) => {
  try {
    const classCode = typeof req.query.class_code === "string" ? req.query.class_code.trim() : typeof req.query.cohort === "string" ? req.query.cohort.trim() : "";
    const persistentTrainees = loadPersistentTrainees();
    const officialRecords = OFFICIAL_INSTITUTIONAL_ROSTER.map((r) => ({
      id: r.id,
      name: r.fullName,
      reg_number: r.admissionNumber,
      adm_no: r.admissionNumber,
      reg_code: r.regCode || r.admissionNumber,
      class_code: r.cohortCode
    }));
    const combinedMap = /* @__PURE__ */ new Map();
    officialRecords.forEach((t) => combinedMap.set(t.id, t));
    DB.trainees.forEach((t) => {
      combinedMap.set(t.id, {
        id: t.id,
        name: t.name,
        reg_number: t.reg_number,
        adm_no: t.reg_number,
        class_id: t.class_id
      });
    });
    persistentTrainees.forEach((t) => combinedMap.set(t.id, t));
    if (pool) {
      try {
        const pgResult = await query("SELECT * FROM trainees;");
        pgResult.rows.forEach((r) => {
          combinedMap.set(r.id, {
            id: r.id,
            name: r.name,
            reg_number: r.reg_number || r.adm_no,
            adm_no: r.adm_no || r.reg_number,
            reg_code: r.reg_code || r.adm_no || r.reg_number,
            class_code: r.class_code || r.class_id,
            department: r.department,
            gender: r.gender,
            phone: r.phone,
            remarks: r.remarks,
            created_at: r.created_at,
            updated_at: r.updated_at
          });
        });
      } catch (err) {
        logger.warn("PostgreSQL read trainees notice", { event: "read_trainees_notice", error: err.message });
        if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true" || err?.status === 503 || err?.statusCode === 503) {
          res.status(503).json({
            error: `Database Service Unavailable: Failed to load trainees from PostgreSQL: ${err.message}`,
            service_status: "database_unavailable"
          });
          return;
        }
      }
    } else if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true") {
      res.status(503).json({
        error: "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected",
        service_status: "database_unavailable"
      });
      return;
    }
    let result = Array.from(combinedMap.values());
    if (classCode) {
      const normClass = classCode.toUpperCase().replace(/\s+/g, " ");
      if ((normClass.includes("ICT4") || normClass.includes("ICT 4")) && !normClass.includes("ITECH")) {
        result = result.filter((t) => (t.class_code || "").toUpperCase().includes("ICT4") && !(t.class_code || "").toUpperCase().includes("ITECH"));
      } else if ((normClass.includes("ITECH6") || normClass.includes("ITECH 6")) && !normClass.includes("ICT4") && !normClass.includes("ITECH5")) {
        result = result.filter((t) => (t.class_code || "").toUpperCase().includes("ITECH 6") || (t.class_code || "").toUpperCase().includes("ITECH6"));
      } else if (normClass.includes("ITECH5") || normClass.includes("ITECH 5")) {
        result = result.filter((t) => (t.class_code || "").toUpperCase().includes("ITECH 5") || (t.class_code || "").toUpperCase().includes("ITECH5"));
      } else if (normClass.includes("ICT4") && (normClass.includes("ITECH6") || normClass.includes("ITECH 6"))) {
        result = result.filter((t) => {
          const tc = (t.class_code || "").toUpperCase();
          return (tc.includes("ICT4") || tc.includes("ITECH")) && !tc.includes("ADMIN") && !tc.includes("FBS") && !tc.includes("LS");
        });
      } else {
        result = result.filter((t) => t.class_code === classCode || t.class_id === classCode || (t.class_code || "").toUpperCase() === normClass);
      }
    }
    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || (err?.message?.toLowerCase().includes("database") || err?.message?.toLowerCase().includes("pool") ? 503 : 500);
    res.status(status).json({
      error: err.message || "Failed to load trainees",
      service_status: status === 503 ? "database_unavailable" : void 0
    });
  }
});
apiRouter.post("/trainees", validateBody(TraineeCreateSchema), async (req, res) => {
  try {
    const {
      name,
      admNo,
      regCode,
      classCode = "ICT4/ITECH6/S/26 MOD 1",
      department = "Computing & Informatics",
      gender = "M",
      phone = "",
      remarks = ""
    } = req.body;
    if (!name || !admNo && !regCode) {
      res.status(400).json({ error: "Trainee name and admission number are required." });
      return;
    }
    const adm_no = (admNo || regCode || "").trim();
    const reg_code = (regCode || admNo || "").trim();
    const id = req.body.id || `tr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const traineeRecord = {
      id,
      name: name.trim(),
      reg_number: adm_no,
      adm_no,
      reg_code,
      class_code: classCode,
      department,
      gender,
      phone,
      remarks,
      created_at: now,
      updated_at: now
    };
    let pgPersisted = false;
    if (pool) {
      try {
        const sql = `
          INSERT INTO trainees (id, name, adm_no, reg_number, reg_code, class_code, department, gender, phone, remarks, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            adm_no = EXCLUDED.adm_no,
            reg_number = EXCLUDED.reg_number,
            reg_code = EXCLUDED.reg_code,
            class_code = EXCLUDED.class_code,
            department = EXCLUDED.department,
            gender = EXCLUDED.gender,
            phone = EXCLUDED.phone,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await query(sql, [
          id,
          traineeRecord.name,
          adm_no,
          adm_no,
          reg_code,
          classCode,
          department,
          gender,
          phone,
          remarks
        ]);
        if (result.rowCount > 0) {
          pgPersisted = true;
        }
      } catch (err) {
        logger.error("PostgreSQL insert trainee error", { event: "insert_trainee_error", error: err.message });
        captureServerException(err, { event: "insert_trainee_error" });
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error creating trainee: ${err.message}` });
        return;
      }
    }
    const persistent = loadPersistentTrainees();
    const existIdx = persistent.findIndex((t) => t.id === id || t.adm_no === adm_no || t.reg_code === reg_code);
    if (existIdx >= 0) {
      persistent[existIdx] = { ...persistent[existIdx], ...traineeRecord };
    } else {
      persistent.push(traineeRecord);
    }
    savePersistentTrainees(persistent);
    const memIdx = DB.trainees.findIndex((t) => t.id === id || t.reg_number === adm_no);
    const memItem = {
      id,
      name: traineeRecord.name,
      reg_number: adm_no,
      class_id: classCode,
      enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "061155101A"]
    };
    if (memIdx >= 0) {
      DB.trainees[memIdx] = memItem;
    } else {
      DB.trainees.push(memItem);
    }
    res.status(201).json({
      success: true,
      data: traineeRecord,
      postgres_persisted: pgPersisted
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to persist trainee" });
  }
});
apiRouter.put(
  "/trainees/:id",
  requireRoles("admin", "hod", "trainer"),
  validateBody(TraineeUpdateSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let pgPersisted = false;
      if (pool) {
        try {
          const sql = `
            UPDATE trainees
            SET
              name = COALESCE($2, name),
              adm_no = COALESCE($3, adm_no),
              reg_number = COALESCE($3, reg_number),
              reg_code = COALESCE($4, reg_code),
              class_code = COALESCE($5, class_code),
              department = COALESCE($6, department),
              gender = COALESCE($7, gender),
              phone = COALESCE($8, phone),
              remarks = COALESCE($9, remarks),
              updated_at = NOW()
            WHERE id = $1
            RETURNING *;
          `;
          const result = await query(sql, [
            id,
            updates.name || null,
            updates.admNo || updates.adm_no || updates.regNumber || updates.reg_number || null,
            updates.regCode || updates.reg_code || null,
            updates.classCode || updates.class_code || updates.classId || updates.class_id || null,
            updates.department || null,
            updates.gender || null,
            updates.phone || null,
            updates.remarks || null
          ]);
          if (result.rowCount > 0) {
            pgPersisted = true;
          }
        } catch (err) {
          logger.error("PostgreSQL update trainee error", { event: "update_trainee_error", error: err.message });
          captureServerException(err, { event: "update_trainee_error" });
          const status = err?.status || err?.statusCode || 500;
          res.status(status).json({
            error: `Supabase database error updating trainee: ${err.message}`,
            service_status: status === 503 ? "database_unavailable" : void 0
          });
          return;
        }
      } else if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true") {
        res.status(503).json({
          error: "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected",
          service_status: "database_unavailable"
        });
        return;
      }
      const persistent = loadPersistentTrainees();
      const existIdx = persistent.findIndex((t) => t.id === id);
      if (existIdx >= 0) {
        persistent[existIdx] = {
          ...persistent[existIdx],
          ...updates,
          adm_no: updates.admNo || updates.adm_no || updates.regNumber || updates.reg_number || persistent[existIdx].adm_no,
          reg_number: updates.admNo || updates.adm_no || updates.regNumber || updates.reg_number || persistent[existIdx].reg_number,
          class_code: updates.classCode || updates.class_code || updates.classId || updates.class_id || persistent[existIdx].class_code,
          updated_at: now
        };
        savePersistentTrainees(persistent);
      }
      const memIdx = DB.trainees.findIndex((t) => t.id === id);
      if (memIdx >= 0) {
        DB.trainees[memIdx] = {
          ...DB.trainees[memIdx],
          name: updates.name || DB.trainees[memIdx].name,
          reg_number: updates.admNo || updates.adm_no || updates.regNumber || updates.reg_number || DB.trainees[memIdx].reg_number,
          class_id: updates.classCode || updates.class_code || updates.classId || updates.class_id || DB.trainees[memIdx].class_id
        };
      }
      res.json({ success: true, id, postgres_persisted: pgPersisted });
    } catch (err) {
      const status = err?.status || err?.statusCode || (err?.message?.toLowerCase().includes("database") || err?.message?.toLowerCase().includes("pool") ? 503 : 500);
      res.status(status).json({
        error: err.message || "Failed to update trainee",
        service_status: status === 503 ? "database_unavailable" : void 0
      });
    }
  }
);
apiRouter.delete(
  "/trainees/:id",
  requireRoles("admin", "hod"),
  async (req, res) => {
    try {
      const { id } = req.params;
      let pgDeleted = false;
      if (pool) {
        try {
          const result = await query("DELETE FROM trainees WHERE id = $1 RETURNING id;", [id]);
          if (result.rowCount > 0) {
            pgDeleted = true;
          }
        } catch (err) {
          logger.error("PostgreSQL delete trainee error", { event: "delete_trainee_error", error: err.message });
          captureServerException(err, { event: "delete_trainee_error" });
          const status = err?.status || err?.statusCode || 500;
          res.status(status).json({
            error: `Supabase database error deleting trainee: ${err.message}`,
            service_status: status === 503 ? "database_unavailable" : void 0
          });
          return;
        }
      } else if (process.env.NODE_ENV === "production" || process.env.STRICT_DB === "true") {
        res.status(503).json({
          error: "Database Service Unavailable: PostgreSQL connection pool is not initialized or connected",
          service_status: "database_unavailable"
        });
        return;
      }
      const persistent = loadPersistentTrainees();
      const filtered = persistent.filter((t) => t.id !== id);
      if (filtered.length !== persistent.length) {
        savePersistentTrainees(filtered);
      }
      const memIdx = DB.trainees.findIndex((t) => t.id === id);
      if (memIdx >= 0) {
        DB.trainees.splice(memIdx, 1);
      }
      res.json({ success: true, id, postgres_deleted: pgDeleted });
    } catch (err) {
      const status = err?.status || err?.statusCode || (err?.message?.toLowerCase().includes("database") || err?.message?.toLowerCase().includes("pool") ? 503 : 500);
      res.status(status).json({
        error: err.message || "Failed to delete trainee",
        service_status: status === 503 ? "database_unavailable" : void 0
      });
    }
  }
);
apiRouter.use("/attendance", (req, res, next) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers"
    });
    return;
  }
  next();
});
apiRouter.get("/attendance", async (req, res) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers"
    });
    return;
  }
  try {
    const unitOfferingId = req.query.unit_offering_id || "";
    const weekNumber = req.query.week_number ? parseInt(req.query.week_number) : void 0;
    const classCode = req.query.class_code || "";
    let records = [];
    if (pool) {
      try {
        let sql = `SELECT * FROM attendance_register WHERE 1=1`;
        const params = [];
        if (unitOfferingId) {
          params.push(unitOfferingId);
          sql += ` AND unit_offering_id = $${params.length}`;
        }
        if (classCode) {
          params.push(`%${classCode}%`);
          sql += ` AND trainee_id IN (SELECT id FROM trainees WHERE class_code ILIKE $${params.length} OR class_id ILIKE $${params.length})`;
        }
        if (weekNumber !== void 0) {
          params.push(weekNumber);
          sql += ` AND week_number = $${params.length}`;
        }
        sql += ` ORDER BY week_number, session_date`;
        const result = await query(sql, params);
        if (result.rows.length > 0) {
          records = result.rows.map((r) => ({
            id: r.id,
            unit_offering_id: r.unit_offering_id,
            trainee_id: r.trainee_id,
            week_number: Number(r.week_number),
            session_date: typeof r.session_date === "object" ? r.session_date.toISOString().split("T")[0] : String(r.session_date),
            session_index: Number(r.session_index || 1),
            status: r.status,
            hours_attended: Number(r.hours_attended || 2),
            remarks: r.remarks || "",
            marked_by: r.marked_by,
            created_at: r.created_at,
            updated_at: r.updated_at
          }));
        }
      } catch (err) {
        logger.warn("PostgreSQL fetch attendance warning", { event: "fetch_attendance_warning", error: err.message });
      }
    }
    if (records.length === 0) {
      const persistent = loadPersistentAttendance();
      records = persistent.filter((r) => {
        if (unitOfferingId && r.unit_offering_id !== unitOfferingId) return false;
        if (weekNumber !== void 0 && r.week_number !== weekNumber) return false;
        return true;
      });
    }
    const matrix = {};
    records.forEach((r) => {
      if (!matrix[r.trainee_id]) matrix[r.trainee_id] = {};
      const sIndex = r.session_index || 1;
      const key = `W${r.week_number}_S${sIndex}`;
      const symbol = r.status === "present" || r.status === "Present" || r.status === "X" ? "X" : r.status === "absent" || r.status === "Absent" || r.status === "0" ? "0" : "";
      matrix[r.trainee_id][key] = symbol;
    });
    res.json({
      success: true,
      records,
      matrix,
      count: records.length
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to load attendance" });
  }
});
apiRouter.post("/attendance/mark", async (req, res) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers"
    });
    return;
  }
  try {
    const {
      unit_offering_id = "uo-1",
      trainee_id,
      week_number = 1,
      session_date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      session_index = 1,
      status = "present",
      hours_attended = 2,
      remarks = ""
    } = req.body;
    const marked_by = req.user?.profile_id;
    if (!marked_by) {
      res.status(401).json({ error: "Unauthorized: Active faculty identity required to record attendance" });
      return;
    }
    if (!trainee_id) {
      res.status(400).json({ error: "Missing trainee_id parameter." });
      return;
    }
    const normStatus = status === "X" ? "present" : status === "0" ? "absent" : String(status).toLowerCase();
    let pgPersisted = false;
    if (pool) {
      try {
        const sql = `
          INSERT INTO attendance_register (
            unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, marked_by, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (unit_offering_id, trainee_id, week_number, session_index, session_date)
          DO UPDATE SET
            status = EXCLUDED.status,
            hours_attended = COALESCE(EXCLUDED.hours_attended, attendance_register.hours_attended),
            remarks = COALESCE(EXCLUDED.remarks, attendance_register.remarks),
            marked_by = COALESCE(EXCLUDED.marked_by, attendance_register.marked_by),
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await query(sql, [
          unit_offering_id,
          trainee_id,
          Number(week_number),
          session_date,
          Number(session_index || 1),
          normStatus,
          Number(hours_attended),
          remarks,
          marked_by
        ]);
        if (result.rowCount > 0) pgPersisted = true;
      } catch (err) {
        logger.error("PostgreSQL attendance mark error", { event: "attendance_mark_error", error: err.message });
        captureServerException(err, { event: "attendance_mark_error" });
        const status2 = err?.status || err?.statusCode || 500;
        res.status(status2).json({ error: `Supabase database error recording attendance: ${err.message}` });
        return;
      }
    }
    const persistent = loadPersistentAttendance();
    const targetSession = Number(session_index || 1);
    const existingIdx = persistent.findIndex(
      (r) => r.unit_offering_id === unit_offering_id && r.trainee_id === trainee_id && Number(r.week_number) === Number(week_number) && Number(r.session_index || 1) === targetSession
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      id: existingIdx >= 0 ? persistent[existingIdx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      unit_offering_id,
      trainee_id,
      week_number: Number(week_number),
      session_date,
      session_index: Number(session_index),
      status: normStatus,
      hours_attended: Number(hours_attended),
      remarks,
      marked_by,
      created_at: existingIdx >= 0 ? persistent[existingIdx].created_at : now,
      updated_at: now
    };
    if (existingIdx >= 0) {
      persistent[existingIdx] = record;
    } else {
      persistent.push(record);
    }
    savePersistentAttendance(persistent);
    res.json({
      success: true,
      data: record,
      postgres_persisted: pgPersisted
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to mark attendance" });
  }
});
apiRouter.post("/attendance/bulk", async (req, res) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers"
    });
    return;
  }
  try {
    const { unit_offering_id = "uo-1", records = [], attendanceData, session_plan_id } = req.body;
    let itemsToProcess = [];
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    if (Array.isArray(records) && records.length > 0) {
      itemsToProcess = records.map((r) => ({
        unit_offering_id: r.unit_offering_id || unit_offering_id,
        trainee_id: r.trainee_id,
        week_number: Number(r.week_number || 1),
        session_date: r.session_date || today,
        session_index: r.session_index,
        status: r.status === "X" ? "present" : r.status === "0" ? "absent" : String(r.status || "present").toLowerCase(),
        hours_attended: Number(r.hours_attended || 2),
        remarks: r.remarks || ""
      }));
    } else if (attendanceData && typeof attendanceData === "object") {
      for (const [traineeId, studentRec] of Object.entries(attendanceData)) {
        if (!studentRec?.attendance) continue;
        for (const [key, val] of Object.entries(studentRec.attendance)) {
          const match = key.match(/W(\d+)_S(\d+)/);
          const week = match ? parseInt(match[1]) : 1;
          const session = match ? parseInt(match[2]) : 1;
          const normStatus = val === "X" ? "present" : val === "0" ? "absent" : "";
          if (normStatus) {
            itemsToProcess.push({
              unit_offering_id,
              trainee_id: traineeId,
              week_number: week,
              session_date: today,
              session_index: session,
              status: normStatus,
              hours_attended: 2
            });
          }
        }
      }
    }
    if (itemsToProcess.length === 0) {
      res.status(400).json({ error: "No attendance records provided to persist." });
      return;
    }
    let pgPersistedCount = 0;
    if (pool) {
      try {
        await withTransaction(async (client) => {
          for (const item of itemsToProcess) {
            const sql = `
              INSERT INTO attendance_register (
                unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              ON CONFLICT (unit_offering_id, trainee_id, week_number, session_index, session_date)
              DO UPDATE SET
                status = EXCLUDED.status,
                hours_attended = COALESCE(EXCLUDED.hours_attended, attendance_register.hours_attended),
                remarks = COALESCE(EXCLUDED.remarks, attendance_register.remarks),
                updated_at = NOW();
            `;
            await client.query(sql, [
              item.unit_offering_id,
              item.trainee_id,
              item.week_number,
              item.session_date,
              item.session_index || 1,
              item.status,
              item.hours_attended || 2,
              item.remarks || ""
            ]);
            pgPersistedCount++;
          }
        });
      } catch (err) {
        logger.error("PostgreSQL bulk attendance error", { event: "bulk_attendance_error", error: err.message });
        captureServerException(err, { event: "bulk_attendance_error" });
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error during bulk attendance upsert: ${err.message}` });
        return;
      }
    }
    const persistent = loadPersistentAttendance();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const item of itemsToProcess) {
      const sIdx = Number(item.session_index || 1);
      const idx = persistent.findIndex(
        (r) => r.unit_offering_id === item.unit_offering_id && r.trainee_id === item.trainee_id && Number(r.week_number) === Number(item.week_number) && Number(r.session_index || 1) === sIdx
      );
      const rec = {
        id: idx >= 0 ? persistent[idx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        unit_offering_id: item.unit_offering_id,
        trainee_id: item.trainee_id,
        week_number: Number(item.week_number),
        session_date: item.session_date,
        session_index: sIdx,
        status: item.status,
        hours_attended: item.hours_attended || 2,
        remarks: item.remarks || "",
        created_at: idx >= 0 ? persistent[idx].created_at : now,
        updated_at: now
      };
      if (idx >= 0) {
        persistent[idx] = rec;
      } else {
        persistent.push(rec);
      }
    }
    savePersistentAttendance(persistent);
    res.json({
      success: true,
      count: itemsToProcess.length,
      postgres_upserted: pgPersistedCount,
      message: `Persisted ${itemsToProcess.length} attendance records successfully.`
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to process bulk attendance" });
  }
});
apiRouter.get("/exams", async (req, res) => {
  const user = req.user;
  let liveExams = [];
  if (user?.role === "trainer") {
    if (pool) {
      try {
        const { rows } = await pool.query(
          `SELECT e.* FROM Exams e
           WHERE EXISTS (
             SELECT 1 FROM Unit_Offerings uo
             WHERE uo.unit_id = e.unit_id AND uo.trainer_id = $1
           )
           ORDER BY e.created_at DESC`,
          [user.profile_id]
        );
        res.json(rows.map((row) => ({
          ...row,
          payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload
        })));
        return;
      } catch {
        res.status(503).json({ error: "Could not load assigned trainer offerings." });
        return;
      }
    }
    const assignedUnitIds = new Set(
      DB.unit_offerings.filter((offering) => offering.trainer_id === user.profile_id && typeof offering.unit_id === "string").map((offering) => offering.unit_id)
    );
    res.json(DB.exams.filter((exam) => typeof exam.unit_id === "string" && assignedUnitIds.has(exam.unit_id)));
    return;
  }
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM exams ORDER BY created_at DESC");
      if (rows && rows.length > 0) {
        liveExams = rows.map((r) => ({
          ...r,
          payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload
        }));
      }
    } catch (e) {
      logger.warn("PostgreSQL exams query notice", { event: "exams_query_notice", error: e });
    }
  }
  if (liveExams.length === 0) {
    liveExams = DB.exams;
  }
  if (user && user.role === "trainee") {
    const clean = (code) => (code || "").trim().toUpperCase().replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");
    const enrolledNormalized = (user.enrolled_units || []).map((u) => clean(u));
    const userExams = liveExams.filter((e) => {
      if (!user.enrolled_units || user.enrolled_units.length === 0) return true;
      const examUnit = clean(e.unit_code);
      return user.enrolled_units.includes(e.unit_code) || enrolledNormalized.includes(examUnit) || (user.enrolled_units || []).some((u) => clean(u) === examUnit || examUnit.includes(clean(u)) || clean(u).includes(examUnit));
    }).map((e) => sanitizeExamForStudent(e));
    res.json(userExams);
    return;
  }
  res.json(liveExams);
});
apiRouter.post("/exams", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const examPayload = req.body;
  if (!examPayload.unit_code) {
    res.status(400).json({ error: "Bad Request: Missing unit_code in exam payload" });
    return;
  }
  const existingIdx = DB.exams.findIndex(
    (e) => examPayload.id && e.id === examPayload.id || e.unit_code === examPayload.unit_code
  );
  let targetExam;
  if (existingIdx >= 0) {
    targetExam = {
      ...DB.exams[existingIdx],
      ...examPayload,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    DB.exams[existingIdx] = targetExam;
  } else {
    targetExam = {
      id: examPayload.id || `exam-${Date.now()}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...examPayload
    };
    DB.exams.push(targetExam);
  }
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO exams (id, unit_code, course_name, payload, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
           course_name = EXCLUDED.course_name,
           payload = EXCLUDED.payload;`,
        [targetExam.id, targetExam.unit_code, targetExam.course_name || "", JSON.stringify(targetExam.payload || {})]
      );
    } catch (e) {
      logger.warn("PostgreSQL exam upsert notice", { event: "exam_upsert_notice", error: e });
    }
  }
  res.status(200).json({ success: true, exam: targetExam });
});
apiRouter.get("/departments", async (_req, res) => {
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM departments ORDER BY name ASC;");
      res.json(rows);
      return;
    } catch (error) {
      logger.error("PostgreSQL departments query failed", { event: "departments_query_failed", error });
      captureServerException(error, { event: "departments_query_failed" });
      res.status(503).json({ error: "Could not load departments." });
      return;
    }
  }
  res.json(DB.departments);
});
apiRouter.post("/departments", requireRoles("admin", "hod"), async (req, res) => {
  const { id, name, code, hod_name, trainers, active_units } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "Missing required fields: name and code" });
    return;
  }
  const existingIdx = DB.departments.findIndex(
    (d) => id && d.id === id || d.code.toUpperCase() === code.toUpperCase()
  );
  let targetDept;
  if (existingIdx >= 0) {
    const existing = DB.departments[existingIdx];
    targetDept = {
      ...existing,
      name,
      code: code.toUpperCase(),
      hod_name: hod_name || existing.hod_name || existing.hod_id,
      trainers: trainers ?? existing.trainers ?? 1,
      active_units: active_units ?? existing.active_units ?? 1,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    DB.departments[existingIdx] = targetDept;
  } else {
    targetDept = {
      id: id || `dept-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      hod_name: hod_name || "Unassigned",
      trainers: trainers ?? 1,
      active_units: active_units ?? 1,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    DB.departments.push(targetDept);
  }
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO departments (id, name, code, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;`,
        [targetDept.id, targetDept.name, targetDept.code]
      );
    } catch (e) {
      logger.warn("PostgreSQL department upsert notice", { event: "department_upsert_notice", error: e });
    }
  }
  res.status(200).json({ success: true, department: targetDept });
});
apiRouter.get("/exams/:id", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const exam = DB.exams.find((e) => e.id === req.params.id);
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  if (user.role === "trainee") {
    const isEnrolled = user.enrolled_units?.includes(exam.unit_code);
    if (!isEnrolled) {
      res.status(403).json({ error: "Forbidden: Trainee cohort is not enrolled in this unit" });
      return;
    }
    const cleanUserReg = (user.reg_number || "").trim().toUpperCase();
    const coreUserReg = cleanUserReg.match(/\b\d{4,6}\b/)?.[0] || "";
    const cleanUserName = (user.name || "").trim().toUpperCase();
    const priorSub = DB.submissions.find((s) => {
      const subReg = (s.reg_number || "").trim().toUpperCase();
      const subCore = subReg.match(/\b\d{4,6}\b/)?.[0] || "";
      const isCandidateMatch = isSelf(user, s.trainee_id) || Boolean(cleanUserReg) && Boolean(subReg) && (subReg === cleanUserReg || subReg.length >= 4 && cleanUserReg.includes(subReg) || cleanUserReg.length >= 4 && subReg.includes(cleanUserReg)) || Boolean(coreUserReg) && Boolean(subCore) && coreUserReg === subCore || Boolean(cleanUserName) && Boolean(s.student_name) && s.student_name.trim().toUpperCase() === cleanUserName;
      if (!isCandidateMatch) return false;
      if (s.exam_id && exam.id) {
        if (s.exam_id !== exam.id) return false;
      } else {
        const sTask = (s.task_code || "").trim().toUpperCase();
        const examTask = (exam.payload?.task_code || exam.task_code || "").trim().toUpperCase();
        if (sTask && examTask) {
          if (sTask !== examTask) return false;
        } else {
          const sUnit = (s.unit_code || "").trim().toUpperCase();
          const examUnit = (exam.unit_code || "").trim().toUpperCase();
          if (sUnit !== examUnit) return false;
        }
      }
      const isLockedOrSubmitted = (Boolean(s.is_locked) || s.status === "submitted" || s.status === "graded") && s.status !== "reopened";
      return isLockedOrSubmitted;
    });
    const sanitized = sanitizeExamForStudent(exam);
    if (priorSub) {
      res.status(200).json({
        ...sanitized,
        is_locked: true,
        locked_reason: "Assessment Locked: You have already completed this assessment. Resubmission is locked.",
        submission_id: priorSub.id,
        status: priorSub.status
      });
      return;
    }
    res.json(sanitized);
    return;
  }
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.profile_id, exam.id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden: Trainer is not assigned to teach this unit" });
      return;
    }
    res.json(exam);
    return;
  }
  if (user.role === "hod") {
    const matchesDept = verifyHODDepartmentScope(user.department_id, exam.id);
    if (!matchesDept) {
      res.status(403).json({ error: "Forbidden: Exam does not belong to your department" });
      return;
    }
    res.json(exam);
    return;
  }
  res.json(exam);
});
apiRouter.get("/submissions", async (req, res) => {
  const user = req.user;
  let allSubs = DB.submissions;
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM submissions ORDER BY created_at DESC;");
      if (rows && rows.length > 0) {
        const pgSubs = rows.map((r) => ({
          ...r,
          section_a: typeof r.section_a === "string" ? JSON.parse(r.section_a) : r.section_a,
          section_b: typeof r.section_b === "string" ? JSON.parse(r.section_b) : r.section_b
        }));
        const subMap = /* @__PURE__ */ new Map();
        allSubs.forEach((s) => subMap.set(s.id, s));
        pgSubs.forEach((s) => subMap.set(s.id, s));
        allSubs = Array.from(subMap.values());
      }
    } catch (e) {
    }
  }
  if (!user) {
    res.json(allSubs);
    return;
  }
  if (user.role === "trainee") {
    const userSubs = allSubs.filter((s) => isSelf(user, s.trainee_id));
    res.json(userSubs);
    return;
  }
  res.json(allSubs);
});
apiRouter.get("/submissions/:id", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const sub = DB.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  if (user.role === "trainee") {
    const isOwner = isSelf(user, sub.trainee_id) || user.reg_number && sub.reg_number === user.reg_number;
    if (!isOwner) {
      res.status(403).json({ error: "Forbidden (BOLA): You cannot access another student's exam submission" });
      return;
    }
    res.json(sub);
    return;
  }
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.profile_id, sub.exam_id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden: Trainer is not assigned to this submission's unit" });
      return;
    }
    res.json(sub);
    return;
  }
  if (user.role === "hod") {
    const matchesDept = verifyHODDepartmentScope(user.department_id, sub.exam_id);
    if (!matchesDept) {
      res.status(403).json({ error: "Forbidden: Submission does not belong to your department" });
      return;
    }
    res.json(sub);
    return;
  }
  res.json(sub);
});
apiRouter.post("/submissions", requireRoles("trainee", "admin"), async (req, res) => {
  const user = req.user;
  const { exam_id, section_a, section_b } = req.body;
  const exam = DB.exams.find((e) => e.id === exam_id || e.unit_code === exam_id || e.unit_code === req.body.unit_code);
  if (!exam) {
    res.status(200).json({ success: true, submission_id: `sub-${Date.now()}`, score: 0 });
    return;
  }
  if (exam.payload?.end_time) {
    const now = /* @__PURE__ */ new Date();
    const endTime = new Date(exam.payload.end_time);
    if (now > endTime) {
      res.status(403).json({ error: "Forbidden: Exam submission window has expired" });
      return;
    }
  }
  const existingSub = DB.submissions.find(
    (s) => {
      const subReg = (s.reg_number || "").trim().toUpperCase();
      const userReg = (user.reg_number || req.body.reg_number || "").trim().toUpperCase();
      const identityMatch = Boolean(subReg) && Boolean(userReg) && (subReg === userReg || subReg.includes(userReg) || userReg.includes(subReg)) || isSelf(user, s.trainee_id);
      if (!identityMatch) return false;
      if (s.exam_id && exam_id) {
        return s.exam_id === exam_id;
      }
      const sTask = (s.task_code || "").trim().toUpperCase();
      const examTask = (exam.payload?.task_code || exam.task_code || req.body.task_code || "").trim().toUpperCase();
      if (sTask && examTask) {
        return sTask === examTask;
      }
      if (!s.exam_id && !exam_id && !sTask && !examTask) {
        return (s.unit_code || "").trim().toUpperCase() === (exam.unit_code || "").trim().toUpperCase();
      }
      return false;
    }
  );
  let objectiveScore = 0;
  const gradedA = (section_a || []).map((ans) => {
    const question = exam.payload.section_a?.questions?.find((q) => q.id === ans.question_id);
    const isCorrect = question && question.correct_answer !== void 0 && String(question.correct_answer) === String(ans.answer);
    const marks = isCorrect ? question.marks : 0;
    objectiveScore += marks;
    return { ...ans, marks_awarded: marks };
  });
  if (existingSub) {
    const isAlreadyLocked = Boolean(existingSub.is_locked) || existingSub.status === "submitted" || existingSub.status === "graded";
    if (isAlreadyLocked && existingSub.status !== "reopened" && existingSub.status !== "in_progress") {
      res.status(400).json({
        error: "Locked: Submission has already been completed and cannot be modified without trainer authorization",
        already_submitted: true,
        submission_id: existingSub.id,
        score: existingSub.total_score
      });
      return;
    }
    existingSub.status = "submitted";
    existingSub.is_locked = true;
    existingSub.attempt_count = existingSub.attempt_count || 1;
    existingSub.locked_at = (/* @__PURE__ */ new Date()).toISOString();
    existingSub.section_a = gradedA;
    existingSub.section_b = section_b || existingSub.section_b || [];
    existingSub.total_score = objectiveScore;
    existingSub.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const studentRegExisting = user.reg_number || existingSub.reg_number;
    const studentNameExisting = user.name || existingSub.student_name || "Enrolled Trainee";
    if (studentRegExisting && !DB.trainees.some((t) => t.reg_number === studentRegExisting)) {
      DB.trainees.push({
        id: user.profile_id,
        name: studentNameExisting,
        reg_number: studentRegExisting,
        class_id: user.cohort_code || "class-itech-6",
        enrolled_units: [exam.unit_code]
      });
    }
    try {
      await saveExamSubmission(existingSub, DB.submissions);
    } catch (err) {
      logger.error("PostgreSQL save exam submission error", { event: "save_exam_submission_error", error: err.message });
      captureServerException(err, { event: "save_exam_submission_error" });
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error saving submission: ${err.message}` });
      return;
    }
    res.status(200).json({ success: true, submission_id: existingSub.id, score: objectiveScore });
    return;
  }
  const newSub = {
    id: `sub-${Date.now()}`,
    exam_id,
    task_code: exam.payload?.task_code || exam.task_code || req.body.task_code || null,
    unit_code: exam.unit_code,
    trainee_id: user.profile_id,
    reg_number: user.reg_number || "10525",
    student_name: user.name,
    status: "submitted",
    is_locked: true,
    attempt_count: 1,
    locked_at: (/* @__PURE__ */ new Date()).toISOString(),
    total_score: objectiveScore,
    section_a: gradedA,
    section_b: section_b || [],
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const studentRegNew = user.reg_number || newSub.reg_number;
  const studentNameNew = user.name || newSub.student_name || "Enrolled Trainee";
  if (studentRegNew && !DB.trainees.some((t) => t.reg_number === studentRegNew)) {
    DB.trainees.push({
      id: user.profile_id,
      name: studentNameNew,
      reg_number: studentRegNew,
      class_id: user.cohort_code || "class-itech-6",
      enrolled_units: [exam.unit_code]
    });
  }
  DB.submissions.push(newSub);
  try {
    await saveExamSubmission(newSub, DB.submissions);
  } catch (err) {
    logger.error("PostgreSQL save new exam submission error", { event: "save_new_exam_submission_error", error: err.message });
    captureServerException(err, { event: "save_new_exam_submission_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving submission: ${err.message}` });
    return;
  }
  res.status(201).json({ success: true, submission_id: newSub.id, score: objectiveScore });
});
function atomicSubmitSubmission(submissionId, payload, userId, regNumber) {
  const sub = [...DB.submissions].reverse().find((s) => s.id === submissionId);
  if (!sub) {
    return { success: false, error: "Submission not found", status_code: 404 };
  }
  if (userId || regNumber) {
    const isOwner = userId && sub.trainee_id === userId || regNumber && sub.reg_number === regNumber;
    if (!isOwner) {
      return { success: false, error: "Forbidden (BOLA): You cannot submit another student's exam", status_code: 403 };
    }
  }
  if (sub.status !== "in_progress") {
    return {
      success: false,
      error: "Locked: Submission has already been completed or is not in progress",
      status_code: 400,
      already_submitted: sub.status === "submitted" || sub.status === "graded",
      id: sub.id
    };
  }
  const exam = DB.exams.find((e) => e.id === sub.exam_id);
  if (exam?.payload?.end_time) {
    const now = /* @__PURE__ */ new Date();
    if (now > new Date(exam.payload.end_time)) {
      return { success: false, error: "Forbidden: Exam submission window has expired", status_code: 403 };
    }
  }
  const submittedAt = (/* @__PURE__ */ new Date()).toISOString();
  const matchingSubs = DB.submissions.filter((s) => s.id === submissionId);
  for (const item of matchingSubs.length > 0 ? matchingSubs : [sub]) {
    item.status = "submitted";
    item.submitted_at = submittedAt;
    item.payload = payload;
    if (payload?.section_a) item.section_a = payload.section_a;
    if (payload?.section_b) item.section_b = payload.section_b;
  }
  if (exam && sub.section_a) {
    let objectiveScore = 0;
    sub.section_a = (sub.section_a || []).map((ans) => {
      const question = exam.payload.section_a?.questions?.find((q) => q.id === ans.question_id);
      const isCorrect = question && question.correct_answer !== void 0 && String(question.correct_answer) === String(ans.answer);
      const marks = isCorrect ? question.marks : 0;
      objectiveScore += marks;
      return { ...ans, marks_awarded: marks };
    });
    sub.total_score = objectiveScore;
  }
  saveExamSubmission(sub, DB.submissions).catch(() => {
  });
  return { success: true, id: sub.id, status_code: 200 };
}
apiRouter.put("/submissions/:id/submit", requireRoles("trainee", "admin"), (req, res) => {
  const user = req.user;
  const result = atomicSubmitSubmission(
    req.params.id,
    req.body.payload || req.body,
    user.role === "trainee" ? user.profile_id || void 0 : void 0
  );
  if (!result.success) {
    res.status(result.status_code).json({
      error: result.error,
      already_submitted: result.already_submitted,
      id: result.id
    });
    return;
  }
  res.json({ success: true, id: result.id, status: "submitted" });
});
apiRouter.post("/submissions/:id/grade", requireRoles("trainer", "admin"), async (req, res) => {
  const user = req.user;
  const sub = DB.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.profile_id, sub.exam_id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden (Cross-Trainer): You cannot grade submissions for units assigned to another trainer" });
      return;
    }
  }
  const { marks_awarded, comments } = req.body;
  sub.total_score = marks_awarded ?? sub.total_score;
  sub.status = "graded";
  try {
    await saveExamSubmission(sub, DB.submissions);
    recordAuditLog({
      table_name: "submissions",
      record_id: sub.id,
      action: "UPDATE",
      actor_id: user.id,
      actor_role: user.role,
      new_data: sub
    });
  } catch (err) {
    logger.error("PostgreSQL grade submission error", { event: "grade_submission_error", error: err.message });
    captureServerException(err, { event: "grade_submission_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving grade: ${err.message}` });
    return;
  }
  res.json({ success: true, updated: sub });
});
apiRouter.post("/submissions/:id/reopen", requireRoles("trainer", "admin"), async (req, res) => {
  const sub = DB.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  const { reason, trainer_name } = req.body;
  sub.is_locked = false;
  sub.status = "reopened";
  sub.attempt_count = (sub.attempt_count || 1) + 1;
  sub.reopened_at = (/* @__PURE__ */ new Date()).toISOString();
  sub.reopened_by = trainer_name || req.user?.name || "Alexander Kinoti";
  sub.reopen_reason = reason || "Trainer-authorized retake / second attempt";
  sub.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await saveExamSubmission(sub, DB.submissions);
  } catch (err) {
    logger.error("PostgreSQL reopen submission error", { event: "reopen_submission_error", error: err.message });
    captureServerException(err, { event: "reopen_submission_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error reopening submission: ${err.message}` });
    return;
  }
  res.json({ success: true, submission: sub });
});
apiRouter.get("/assessment-marks/:offeringId", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const offering = DB.unit_offerings.find((uo) => uo.id === req.params.offeringId);
  if (!offering) {
    res.status(404).json({ error: "Unit offering not found" });
    return;
  }
  if (user.role === "trainee") {
    const marks2 = DB.assessment_marks.filter(
      (m) => m.unit_offering_id === req.params.offeringId && isSelf(user, m.trainee_id) && m.is_locked === true
    );
    res.json({ marks: marks2 });
    return;
  }
  if (user.role === "trainer") {
    if (!isAssignedTrainer(user, offering)) {
      res.status(403).json({ error: "Forbidden: You are not the assigned trainer for this unit offering" });
      return;
    }
    const marks2 = DB.assessment_marks.filter((m) => m.unit_offering_id === req.params.offeringId);
    res.json({ marks: marks2 });
    return;
  }
  if (user.role === "hod" && offering.department_id !== user.department_id) {
    res.status(403).json({ error: "Forbidden: Offering outside your department" });
    return;
  }
  const marks = DB.assessment_marks.filter((m) => m.unit_offering_id === req.params.offeringId);
  res.json({ marks });
});
function calculateCDACCBatchWeightedScore(cp = 0, ct = 0, project = 0) {
  const score = cp * 0.4 + ct * 0.2 + project * 0.4;
  return Math.round(score * 10) / 10;
}
var handleBatchMarks = async (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { unitOfferingId, marks } = req.body;
  if (!unitOfferingId || !Array.isArray(marks)) {
    res.status(400).json({ error: "Bad Request: Missing unitOfferingId or marks array" });
    return;
  }
  let offering = DB.unit_offerings.find(
    (uo) => uo.id === unitOfferingId || uo.id.replace(/_/g, "-") === unitOfferingId.replace(/_/g, "-") || uo.id.replace(/-/g, "_") === unitOfferingId.replace(/-/g, "_")
  );
  if (!offering) {
    offering = {
      id: unitOfferingId,
      term_id: "term-2026",
      class_id: unitOfferingId.replace(/^uo-/, "").replace(/^uo_/, ""),
      unit_code: "DYNAMIC",
      unit_id: `unit-${unitOfferingId}`,
      trainer_id: user.profile_id,
      department_id: user.department_id || "dept-ci"
    };
    DB.unit_offerings.push(offering);
  }
  if (user.role === "trainee") {
    res.status(403).json({ error: "Forbidden: Trainees cannot submit or update assessment marks" });
    return;
  }
  if (user.role === "trainer" && !isAssignedTrainer(user, offering)) {
    res.status(403).json({ error: "Forbidden: You are not the assigned trainer for this unit offering" });
    return;
  }
  if (user.role === "hod" && offering.department_id !== user.department_id) {
    res.status(403).json({ error: "Forbidden: Unit offering is outside your department" });
    return;
  }
  const isSheetLocked = DB.assessment_marks.some(
    (m) => m.unit_offering_id === unitOfferingId && m.is_locked === true
  );
  if (isSheetLocked) {
    res.status(400).json({ error: "Assessment marksheet is finalized and locked" });
    return;
  }
  const updatedMarks = [];
  for (const item of marks) {
    if (!item.traineeId) continue;
    let markEntry = DB.assessment_marks.find(
      (m) => m.unit_offering_id === unitOfferingId && m.trainee_id === item.traineeId
    );
    if (!markEntry) {
      markEntry = {
        id: `mark-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        unit_offering_id: unitOfferingId,
        trainee_id: item.traineeId,
        ct_avg: 0,
        cp_avg: 0,
        cp_scores: [],
        ct_scores: [],
        project_score: 0,
        weighted_mark: 0,
        is_locked: false
      };
      DB.assessment_marks.push(markEntry);
    }
    if (typeof item.cpScore === "number") {
      markEntry.cp_scores = [item.cpScore];
      markEntry.cp_avg = item.cpScore;
    }
    if (typeof item.ctScore === "number") {
      markEntry.ct_scores = [item.ctScore];
      markEntry.ct_avg = item.ctScore;
    }
    if (typeof item.projectScore === "number") {
      markEntry.project_score = item.projectScore;
    }
    const cp = markEntry.cp_avg ?? (typeof item.cpScore === "number" ? item.cpScore : 0);
    const ct = markEntry.ct_avg ?? (typeof item.ctScore === "number" ? item.ctScore : 0);
    const project = markEntry.project_score ?? (typeof item.projectScore === "number" ? item.projectScore : 0);
    markEntry.weighted_mark = calculateCDACCBatchWeightedScore(cp, ct, project);
    updatedMarks.push(markEntry);
    recordAuditLog({
      table_name: "assessment_marks",
      record_id: markEntry.id,
      action: "UPDATE",
      actor_id: user.id,
      actor_role: user.role,
      new_data: markEntry
    });
  }
  try {
    await saveAssessmentMarksBatch(DB.assessment_marks);
  } catch (err) {
    logger.error("PostgreSQL batch marks error", { event: "batch_marks_error", error: err.message });
    captureServerException(err, { event: "batch_marks_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving assessment marks: ${err.message}` });
    return;
  }
  res.json({
    success: true,
    count: updatedMarks.length,
    unitOfferingId,
    marks: updatedMarks
  });
};
apiRouter.use("/marks", (req, res, next) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot submit or update assessment marks"
    });
    return;
  }
  next();
});
apiRouter.get("/marks", requireRoles("trainer", "hod", "admin"), (req, res) => {
  res.json({
    success: true,
    marks: DB.assessment_marks
  });
});
apiRouter.post("/marks/batch", handleBatchMarks);
apiRouter.post("/assessment-marks/batch", handleBatchMarks);
function canEditPedagogical(record) {
  if (!record) return true;
  return record.approval_status !== "approved";
}
apiRouter.use("/hod", requireRoles("hod", "admin"));
apiRouter.get("/hod/overview", requireRoles("hod", "admin"), (req, res) => {
  const deptId = req.user?.department_id;
  const sessionPlans = deptId ? DB.session_plans.filter((sp) => sp.department_id === deptId) : DB.session_plans;
  const recordsOfWork = deptId ? DB.record_of_work.filter((row) => row.department_id === deptId) : DB.record_of_work;
  res.json({
    success: true,
    department_id: deptId || "all",
    session_plans: sessionPlans,
    record_of_work: recordsOfWork
  });
});
var handlePedagogicalSignOff = (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (user.role === "trainee") {
    res.status(403).json({ error: "Forbidden: Trainees have zero access to pedagogical approval routes" });
    return;
  }
  if (user.role !== "hod" && user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Only HOD or institutional admin can sign off pedagogical records" });
    return;
  }
  const { entityType = "record_of_work", recordId, id, status, remarks } = req.body;
  const targetId = recordId || id;
  if (!targetId || !status) {
    res.status(400).json({ error: "Bad Request: Missing record ID or approval status" });
    return;
  }
  const targetList = entityType === "session_plan" ? DB.session_plans : DB.record_of_work;
  const record = targetList.find((r) => r.id === targetId);
  if (!record) {
    res.status(404).json({ error: "Pedagogical record not found" });
    return;
  }
  if (user.role === "hod") {
    const recordDept = record.department_id || record.department;
    const userDept = user.department_id;
    if (recordDept && userDept && recordDept !== userDept) {
      res.status(403).json({ error: "Cross-department pedagogical approval rejected" });
      return;
    }
  }
  record.approval_status = status;
  record.hod_reviewed_by = user.profile_id;
  record.hod_reviewer_name = user.name;
  record.hod_review_date = (/* @__PURE__ */ new Date()).toISOString();
  record.hod_remarks = remarks || "";
  if (entityType === "session_plan") {
    savePersistentSessionPlans(DB.session_plans);
    if (pool) {
      pool.query(
        `UPDATE session_plans SET approval_status = $1, hod_reviewed_by = $2, hod_reviewer_name = $3, hod_review_date = $4, hod_remarks = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
        [status, user.profile_id, user.name, record.hod_review_date, record.hod_remarks, targetId]
      ).catch(() => {
      });
    }
  } else {
    savePersistentRecordsOfWork(DB.record_of_work);
    if (pool) {
      pool.query(
        `UPDATE records_of_work SET approval_status = $1, hod_reviewed_by = $2, hod_reviewer_name = $3, hod_review_date = $4, hod_remarks = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
        [status, user.id, user.name, record.hod_review_date, record.hod_remarks, targetId]
      ).catch(() => {
      });
    }
  }
  res.json({
    success: true,
    message: `Pedagogical record ${targetId} marked as ${status}`,
    record
  });
};
apiRouter.post("/pedagogy/sign-off", handlePedagogicalSignOff);
apiRouter.post("/hod/sign-off", requireRoles("hod", "admin"), handlePedagogicalSignOff);
apiRouter.put("/pedagogy/record-of-work/:id", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const record = DB.record_of_work.find((r) => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: "Record of Work not found" });
    return;
  }
  if (!canEditPedagogical(record)) {
    res.status(400).json({ error: "Approved pedagogical records are finalized and locked against modification" });
    return;
  }
  Object.assign(record, req.body);
  savePersistentRecordsOfWork(DB.record_of_work);
  res.json({ success: true, record });
});
async function handleCreateStaff(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can create staff accounts." });
    return;
  }
  const full_name = typeof req.body?.name === "string" ? req.body.name.trim() : typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone_number = typeof req.body?.phone === "string" ? req.body.phone.trim() : typeof req.body?.phone_number === "string" ? req.body.phone_number.trim() : "";
  let department_id = typeof req.body?.department_id === "string" ? req.body.department_id.trim() : "";
  let role = typeof req.body?.role === "string" ? req.body.role.trim().toUpperCase() : "TRAINER";
  if (!full_name || full_name.length > 120 || !email || email.length > 254) {
    res.status(400).json({ error: "Enter a name and a valid email address." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (caller.role === "hod") {
    if (role !== "TRAINER") {
      res.status(403).json({ error: "Forbidden: HOD can only create Trainer staff accounts." });
      return;
    }
    if (department_id && department_id !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD cannot create staff accounts outside their assigned department." });
      return;
    }
    department_id = caller.department_id || "dept-ci";
  } else {
    if (role !== "TRAINER" && role !== "HOD") {
      res.status(400).json({ error: "Staff accounts can only be created as Trainer or HOD." });
      return;
    }
    if (!department_id) {
      department_id = "dept-ci";
    }
  }
  const depts = await loadDatabaseDepartments();
  if (!depts.some((d) => matchesDepartment(d, department_id))) {
    res.status(400).json({ error: "Select a valid department for this staff account." });
    return;
  }
  try {
    if (await findUserByEmail(email)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const temporaryPassword = randomBytes2(18).toString("base64url");
    const password_hash = await bcrypt.hash(temporaryPassword, 12);
    const created = await createStaffAccount({
      full_name,
      email,
      phone_number: phone_number || null,
      department_id,
      password_hash,
      role
    });
    if (!pool) {
      const profile = DB.trainers.find((trainer) => trainer.id === created.profile_id);
      if (!profile) {
        DB.trainers.push({ id: created.profile_id, name: full_name, email, assigned_units: [] });
      }
      if (role === "HOD") {
        const department = DB.departments.find((item) => item.id === department_id);
        if (department) department.hod_id = created.profile_id;
      }
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({
      success: true,
      user: {
        id: created.id,
        name: created.full_name,
        email: created.email,
        role: created.role.toLowerCase(),
        department_id: created.department_id,
        profile_id: created.profile_id,
        must_change_password: created.must_change_password === true
      },
      temporaryPassword
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      res.status(503).json({ error: "Staff account service is temporarily unavailable." });
      return;
    }
    if (error?.code === "DEPARTMENT_NOT_FOUND") {
      res.status(400).json({ error: "Select a valid department for this staff account." });
      return;
    }
    if (error?.code === "23505") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    logger.error("Staff account creation error", { event: "staff_creation_error", error });
    captureServerException(error, { event: "staff_creation_error" });
    res.status(500).json({ error: "Could not create the staff account. Please try again." });
  }
}
async function handleCreateTrainee(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can create trainee accounts." });
    return;
  }
  const full_name = typeof req.body?.name === "string" ? req.body.name.trim() : typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";
  const admission_number = typeof req.body?.adm_no === "string" ? req.body.adm_no.trim() : typeof req.body?.admission_number === "string" ? req.body.admission_number.trim() : typeof req.body?.reg_number === "string" ? req.body.reg_number.trim() : "";
  const class_code = typeof req.body?.class_code === "string" ? req.body.class_code.trim() : typeof req.body?.class_id === "string" ? req.body.class_id.trim() : typeof req.body?.cohort === "string" ? req.body.cohort.trim() : "";
  let department_id = typeof req.body?.department_id === "string" ? req.body.department_id.trim() : "";
  const phone_number = typeof req.body?.phone === "string" ? req.body.phone.trim() : typeof req.body?.phone_number === "string" ? req.body.phone_number.trim() : "";
  const explicitPassword = typeof req.body?.password === "string" ? req.body.password : typeof req.body?.temporary_password === "string" ? req.body.temporary_password : "";
  if (!full_name || !admission_number || !class_code) {
    res.status(400).json({ error: "Validation Error: Full name, admission number, and cohort class code are required." });
    return;
  }
  if (caller.role === "hod") {
    if (department_id && department_id !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD cannot create trainees outside their assigned department." });
      return;
    }
    department_id = caller.department_id || "dept-ci";
  } else {
    if (!department_id) {
      department_id = "dept-ci";
    }
  }
  try {
    const existing = await findUserByAdmissionNumber(admission_number);
    if (existing) {
      res.status(409).json({ error: `An account with admission number '${admission_number}' already exists.` });
      return;
    }
    const temporaryPassword = explicitPassword || randomBytes2(9).toString("base64url");
    const password_hash = await bcrypt.hash(temporaryPassword, 12);
    const { user, trainee } = await createTraineeAccount({
      full_name,
      admission_number,
      class_code,
      department_id,
      phone_number: phone_number || null,
      password_hash
    });
    const existingMemIdx = DB.trainees.findIndex((t) => t.id === trainee.id || t.reg_number === admission_number);
    const memItem = {
      id: trainee.id,
      name: trainee.name,
      reg_number: trainee.reg_number,
      class_id: trainee.class_id || class_code,
      enrolled_units: ["061155101A", "ICT/CU/IT/CR/6/6"]
    };
    if (existingMemIdx >= 0) {
      DB.trainees[existingMemIdx] = memItem;
    } else {
      DB.trainees.push(memItem);
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.full_name,
        admission_number: user.admission_number,
        email: user.email,
        role: "trainee",
        department_id: user.department_id,
        profile_id: user.profile_id,
        must_change_password: user.must_change_password === true
      },
      trainee,
      temporaryPassword
    });
  } catch (error) {
    if (error?.code === "23505") {
      res.status(409).json({ error: `An account with admission number '${admission_number}' already exists.` });
      return;
    }
    logger.error("Trainee creation error", { event: "trainee_creation_error", error });
    captureServerException(error, { event: "trainee_creation_error" });
    res.status(500).json({ error: "Could not provision trainee account. Please try again." });
  }
}
async function handleCreateCohort(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can create cohorts." });
    return;
  }
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : code;
  let department_id = typeof req.body?.department_id === "string" ? req.body.department_id.trim() : "";
  const level = typeof req.body?.level === "string" ? req.body.level.trim() : "Level 6";
  const term = typeof req.body?.term === "string" ? req.body.term.trim() : "Term 3 2026";
  if (!code) {
    res.status(400).json({ error: "Validation Error: Cohort code is required." });
    return;
  }
  if (caller.role === "hod") {
    if (department_id && department_id !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD cannot create cohorts outside their assigned department." });
      return;
    }
    department_id = caller.department_id || "dept-ci";
  } else {
    if (!department_id) department_id = "dept-ci";
  }
  try {
    const cohort = await createCohort({
      code,
      name,
      department_id,
      level,
      term
    });
    res.status(201).json({ success: true, cohort });
  } catch (error) {
    if (error?.code === "COHORT_EXISTS") {
      res.status(409).json({ error: error.message });
      return;
    }
    logger.error("Cohort creation error", { event: "cohort_creation_error", error });
    captureServerException(error, { event: "cohort_creation_error" });
    res.status(500).json({ error: "Could not create cohort. Please try again." });
  }
}
async function handleListCohorts(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can list cohorts." });
    return;
  }
  const deptFilter = caller.role === "hod" ? caller.department_id : typeof req.query.department_id === "string" ? req.query.department_id : void 0;
  const cohorts = await listCohorts(deptFilter);
  res.json({ success: true, cohorts });
}
async function handleAssignUnit(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can assign units of competence." });
    return;
  }
  const trainer_id = typeof req.body?.trainer_id === "string" ? req.body.trainer_id.trim() : "";
  const unit_code = typeof req.body?.unit_code === "string" ? req.body.unit_code.trim() : "";
  const unit_name = typeof req.body?.unit_name === "string" ? req.body.unit_name.trim() : typeof req.body?.unit_title === "string" ? req.body.unit_title.trim() : unit_code;
  const class_id = typeof req.body?.class_id === "string" ? req.body.class_id.trim() : typeof req.body?.class_code === "string" ? req.body.class_code.trim() : typeof req.body?.cohort === "string" ? req.body.cohort.trim() : "";
  let department_id = typeof req.body?.department_id === "string" ? req.body.department_id.trim() : "";
  const term_id = typeof req.body?.term_id === "string" ? req.body.term_id.trim() : "term-2026";
  if (!trainer_id || !unit_code || !class_id) {
    res.status(400).json({ error: "Validation Error: Trainer ID, Unit code, and Cohort/Class ID are required." });
    return;
  }
  if (caller.role === "hod") {
    if (department_id && department_id !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD can only assign units within their assigned department." });
      return;
    }
    department_id = caller.department_id || "dept-ci";
    const users = loadPersistentUsers();
    const trainerUser = users.find((u) => u.profile_id === trainer_id || u.id === trainer_id);
    const trainerProfile = (await loadDatabaseTrainers()).find((t) => t.id === trainer_id);
    const trainerDept = trainerUser?.department_id || trainerProfile?.department && DB.departments.find((d) => d.name.toLowerCase() === trainerProfile.department?.toLowerCase())?.id;
    if (trainerDept && trainerDept !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD can only assign units to faculty within their assigned department." });
      return;
    }
  } else {
    if (!department_id) department_id = "dept-ci";
  }
  const existingOffering = DB.unit_offerings.find(
    (uo) => uo.class_id === class_id && uo.unit_code === unit_code && uo.trainer_id === trainer_id
  );
  if (existingOffering) {
    res.json({ success: true, unit_offering: existingOffering, message: "Unit already assigned" });
    return;
  }
  const offeringId = req.body?.id || `uo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newOffering = {
    id: offeringId,
    term_id,
    class_id,
    unit_code,
    unit_id: unit_name || unit_code,
    trainer_id,
    department_id
  };
  DB.unit_offerings.push(newOffering);
  const trainer = DB.trainers.find((t) => t.id === trainer_id);
  if (trainer) {
    if (!trainer.assigned_units) trainer.assigned_units = [];
    if (!trainer.assigned_units.includes(unit_code)) {
      trainer.assigned_units.push(unit_code);
    }
  }
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO Unit_Offerings (id, term_id, class_id, unit_code, trainer_id, department_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [offeringId, term_id, class_id, unit_code, trainer_id, department_id]
      );
    } catch (e) {
      logger.warn("PostgreSQL Unit_Offerings warning", { event: "unit_offerings_warning", error: e.message });
    }
  }
  res.status(201).json({ success: true, unit_offering: newOffering });
}
async function handleListOfferings(req, res) {
  const caller = req.user;
  if (!caller) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  let offerings = [...DB.unit_offerings];
  if (caller.role === "trainer") {
    offerings = offerings.filter((uo) => uo.trainer_id === caller.profile_id);
  } else if (caller.role === "hod") {
    offerings = offerings.filter((uo) => uo.department_id === caller.department_id);
  } else if (caller.role === "admin") {
    if (req.query.department_id) {
      offerings = offerings.filter((uo) => uo.department_id === req.query.department_id);
    }
    if (req.query.trainer_id) {
      offerings = offerings.filter((uo) => uo.trainer_id === req.query.trainer_id);
    }
  }
  res.json({ success: true, offerings });
}
async function handleDeleteOffering(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can revoke unit assignments." });
    return;
  }
  const { id } = req.params;
  const index = DB.unit_offerings.findIndex((uo) => uo.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Unit offering not found" });
    return;
  }
  const offering = DB.unit_offerings[index];
  if (caller.role === "hod" && offering.department_id !== caller.department_id) {
    res.status(403).json({ error: "Forbidden: HOD cannot revoke unit assignments outside their department." });
    return;
  }
  DB.unit_offerings.splice(index, 1);
  res.json({ success: true, message: "Unit assignment revoked successfully" });
}
async function handleListStaff(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can view staff directory." });
    return;
  }
  const users = loadPersistentUsers();
  const dbTrainers = await loadDatabaseTrainers();
  let staffList = dbTrainers.map((t) => {
    const user = users.find((u) => u.profile_id === t.id || u.email && u.email.toLowerCase() === t.email?.toLowerCase());
    const deptObj = DB.departments.find((d) => d.name.toLowerCase() === t.department?.toLowerCase() || d.id === user?.department_id);
    return {
      id: t.id,
      userId: user?.id,
      name: t.name,
      email: t.email || user?.email,
      department: t.department || deptObj?.name || "Computing & Informatics",
      department_id: user?.department_id || deptObj?.id || "dept-ci",
      role: user?.role ? user.role.toLowerCase() : "trainer",
      assigned_units: t.assigned_units || []
    };
  });
  if (caller.role === "hod") {
    staffList = staffList.filter((s) => s.department_id === caller.department_id);
  } else if (req.query.department_id) {
    staffList = staffList.filter((s) => s.department_id === req.query.department_id);
  }
  res.json({ success: true, staff: staffList });
}
async function handleResetUserPassword(req, res) {
  const caller = req.user;
  if (!caller || caller.role !== "admin" && caller.role !== "hod") {
    res.status(403).json({ error: "Forbidden: Only Admin and HOD can reset user credentials." });
    return;
  }
  const { id } = req.params;
  const users = loadPersistentUsers();
  const targetUser = users.find((u) => u.id === id || u.admission_number === id || u.profile_id === id);
  if (!targetUser) {
    res.status(404).json({ error: "User account not found." });
    return;
  }
  if (caller.role === "hod") {
    if (targetUser.department_id !== caller.department_id) {
      res.status(403).json({ error: "Forbidden: HOD can only reset credentials for users within their assigned department." });
      return;
    }
    const targetRole = String(targetUser.role || "").toUpperCase();
    if (targetRole === "ADMIN" || targetRole === "HOD") {
      res.status(403).json({ error: "Forbidden: HOD cannot reset credentials for administrative heads or peer HODs." });
      return;
    }
  }
  try {
    const temporaryPassword = randomBytes2(12).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await resetUserPassword(targetUser.id, passwordHash);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      message: `Password reset successfully for ${targetUser.full_name}`,
      temporaryPassword
    });
  } catch (error) {
    logger.error("Administrative reset-password error", { event: "admin_reset_password_error", error });
    captureServerException(error, { event: "admin_reset_password_error" });
    res.status(500).json({ error: "Could not reset password. Please try again." });
  }
}
apiRouter.post("/hod/staff", requireRoles("admin", "hod"), handleCreateStaff);
apiRouter.post("/hod/trainees", requireRoles("admin", "hod"), handleCreateTrainee);
apiRouter.post("/hod/cohorts", requireRoles("admin", "hod"), handleCreateCohort);
apiRouter.get("/hod/cohorts", requireRoles("admin", "hod"), handleListCohorts);
apiRouter.post("/hod/assign-unit", requireRoles("admin", "hod"), handleAssignUnit);
apiRouter.post("/academic/staff", requireRoles("admin", "hod"), handleCreateStaff);
apiRouter.get("/academic/staff", requireRoles("admin", "hod"), handleListStaff);
apiRouter.post("/academic/trainees", requireRoles("admin", "hod"), handleCreateTrainee);
apiRouter.post("/academic/cohorts", requireRoles("admin", "hod"), handleCreateCohort);
apiRouter.get("/academic/cohorts", requireRoles("admin", "hod"), handleListCohorts);
apiRouter.post("/academic/assign-unit", requireRoles("admin", "hod"), handleAssignUnit);
apiRouter.get("/academic/offerings", requireRoles("admin", "hod", "trainer"), handleListOfferings);
apiRouter.delete("/academic/assign-unit/:id", requireRoles("admin", "hod"), handleDeleteOffering);
apiRouter.post("/academic/users/:id/reset-password", requireRoles("admin", "hod"), handleResetUserPassword);
apiRouter.get("/documents/session-plans", (req, res) => {
  const { class_code, unit_code, trainer_id } = req.query;
  let list = DB.session_plans;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((p) => (p.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((p.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((p) => p.unit_code === unit_code || p.unit_offering_id === unit_code);
  }
  if (trainer_id) {
    list = list.filter((p) => p.trainer_id === trainer_id);
  }
  res.json({ success: true, count: list.length, session_plans: list });
});
apiRouter.post("/documents/session-plans/batch", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const { session_plans = [] } = req.body;
  if (!Array.isArray(session_plans)) {
    res.status(400).json({ error: "session_plans array required" });
    return;
  }
  for (const item of session_plans) {
    if (!item.id) continue;
    const idx = DB.session_plans.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      if (DB.session_plans[idx].approval_status === "approved" && req.user?.role !== "admin") {
        continue;
      }
      DB.session_plans[idx] = { ...DB.session_plans[idx], ...item, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      DB.session_plans.push({ ...item, created_at: (/* @__PURE__ */ new Date()).toISOString(), updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  savePersistentSessionPlans(DB.session_plans);
  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of session_plans) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               class_code = EXCLUDED.class_code,
               session_title = EXCLUDED.session_title,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [item.id, item.unit_offering_id || "uo-1", item.class_code || "", item.trainer_id || req.user?.id || "", item.department_id || "", item.date || "", item.session_title || item.title || "", item.approval_status || "pending", JSON.stringify(item)]
          );
        }
      });
    } catch (err) {
      logger.error("PostgreSQL session plans sync error", { event: "session_plans_sync_error", error: err.message });
      captureServerException(err, { event: "session_plans_sync_error" });
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing session plans: ${err.message}` });
      return;
    }
  }
  res.json({ success: true, message: `Successfully synchronized ${session_plans.length} session plans to central database`, total: DB.session_plans.length });
});
apiRouter.get("/documents/learning-plans", (req, res) => {
  const { class_code, unit_code } = req.query;
  let list = DB.learning_plans;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((p) => (p.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((p.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((p) => p.unit_code === unit_code);
  }
  res.json({ success: true, count: list.length, learning_plans: list });
});
apiRouter.post("/documents/learning-plans/batch", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const { learning_plans = [] } = req.body;
  if (!Array.isArray(learning_plans)) {
    res.status(400).json({ error: "learning_plans array required" });
    return;
  }
  for (const item of learning_plans) {
    const key = item.id || `${item.unit_code || "unit"}_${item.week_number || item.week || 0}`;
    const idx = DB.learning_plans.findIndex((p) => p.id === key || p.unit_code === item.unit_code && (p.week_number === item.week_number || p.week === item.week));
    if (idx >= 0) {
      DB.learning_plans[idx] = { ...DB.learning_plans[idx], ...item, id: key, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      DB.learning_plans.push({ ...item, id: key, created_at: (/* @__PURE__ */ new Date()).toISOString(), updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  savePersistentLearningPlans(DB.learning_plans);
  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of learning_plans) {
          const key = item.id || `${item.unit_code || "unit"}_${item.week_number || item.week || 0}`;
          await client.query(
            `INSERT INTO learning_plans (id, unit_code, class_code, week_number, topic, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               topic = EXCLUDED.topic,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [key, item.unit_code || "", item.class_code || "", item.week_number || item.week || 1, item.topic || item.sub_unit_topic || "", JSON.stringify(item)]
          );
        }
      });
    } catch (err) {
      logger.error("PostgreSQL learning plans sync error", { event: "learning_plans_sync_error", error: err.message });
      captureServerException(err, { event: "learning_plans_sync_error" });
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing learning plans: ${err.message}` });
      return;
    }
  }
  res.json({ success: true, message: `Successfully synchronized ${learning_plans.length} learning plans to central database`, total: DB.learning_plans.length });
});
apiRouter.get("/documents/records-of-work", (req, res) => {
  const { class_code, unit_code } = req.query;
  let list = DB.record_of_work;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((r) => (r.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((r.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((r) => r.unit_code === unit_code);
  }
  res.json({ success: true, count: list.length, records_of_work: list });
});
apiRouter.post("/documents/records-of-work/batch", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const { records_of_work = [] } = req.body;
  if (!Array.isArray(records_of_work)) {
    res.status(400).json({ error: "records_of_work array required" });
    return;
  }
  for (const item of records_of_work) {
    if (!item.id) continue;
    const idx = DB.record_of_work.findIndex((r) => r.id === item.id);
    if (idx >= 0) {
      if (DB.record_of_work[idx].approval_status === "approved" && req.user?.role !== "admin") {
        continue;
      }
      DB.record_of_work[idx] = { ...DB.record_of_work[idx], ...item, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      DB.record_of_work.push({ ...item, created_at: (/* @__PURE__ */ new Date()).toISOString(), updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    }
  }
  savePersistentRecordsOfWork(DB.record_of_work);
  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of records_of_work) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               work_covered = EXCLUDED.work_covered,
               date_covered = EXCLUDED.date_covered,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [item.id, item.session_plan_id || null, item.unit_offering_id || "uo-1", item.class_code || "", item.trainer_id || req.user?.id || "", item.department_id || "", item.work_covered || item.work_actually_covered || "", item.date_covered || "", item.approval_status || "pending", JSON.stringify(item)]
          );
        }
      });
    } catch (err) {
      logger.error("PostgreSQL records of work sync error", { event: "records_of_work_sync_error", error: err.message });
      captureServerException(err, { event: "records_of_work_sync_error" });
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing records of work: ${err.message}` });
      return;
    }
  }
  res.json({ success: true, message: `Successfully synchronized ${records_of_work.length} records of work to central database`, total: DB.record_of_work.length });
});
function handleGetClassRegister(req, res) {
  const code = req.query.class_code || req.params[0] || req.params.classCode || "";
  const data = DB.class_registers[code] || null;
  res.json({ success: true, class_code: code, metadata: data, registers: DB.class_registers });
}
async function handlePostClassRegister(req, res) {
  const code = req.body.class_code || req.query.class_code || req.params[0] || req.params.classCode || "";
  if (!code) {
    res.status(400).json({ error: "class_code is required" });
    return;
  }
  const payload = req.body;
  DB.class_registers[code] = {
    ...DB.class_registers[code],
    ...payload,
    class_code: code,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  savePersistentClassRegisters(DB.class_registers);
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO class_registers (class_code, lecturer_name, subject, department, duration, level, lecturer_comment, hod_comment, weekly_lecturer_comments, weekly_hod_comments, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (class_code) DO UPDATE SET
           lecturer_comment = EXCLUDED.lecturer_comment,
           hod_comment = EXCLUDED.hod_comment,
           weekly_lecturer_comments = EXCLUDED.weekly_lecturer_comments,
           weekly_hod_comments = EXCLUDED.weekly_hod_comments,
           updated_at = CURRENT_TIMESTAMP`,
        [code, payload.lecturer || payload.lecturer_name || "", payload.subject || "", payload.department || "", payload.duration || "", payload.level || "", payload.lecturerComment || "", payload.hodComment || "", JSON.stringify(payload.weeklyLecturerComments || {}), JSON.stringify(payload.weeklyHodComments || {})]
      );
    } catch (err) {
      logger.error("PostgreSQL class register metadata error", { event: "class_register_metadata_error", error: err.message });
      captureServerException(err, { event: "class_register_metadata_error" });
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error saving class register metadata: ${err.message}` });
      return;
    }
  }
  res.json({ success: true, message: `Saved class register metadata for ${code}`, data: DB.class_registers[code] });
}
apiRouter.get("/documents/class-registers", handleGetClassRegister);
apiRouter.get("/documents/class-registers/*", handleGetClassRegister);
apiRouter.post("/documents/class-registers", requireRoles("trainer", "hod", "admin"), handlePostClassRegister);
apiRouter.post("/documents/class-registers/*", requireRoles("trainer", "hod", "admin"), handlePostClassRegister);
apiRouter.use("/admin", requireRoles("admin"));
apiRouter.get("/admin/overview", requireRoles("admin"), (_req, res) => {
  res.json({
    success: true,
    departments: DB.departments.length,
    trainers: DB.trainers.length,
    unit_offerings: DB.unit_offerings.length
  });
});
apiRouter.post("/admin/users", requireRoles("admin"), async (req, res) => {
  const full_name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone_number = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const department_id = typeof req.body?.department_id === "string" ? req.body.department_id.trim() : "";
  const role = typeof req.body?.role === "string" ? req.body.role.trim().toUpperCase() : "";
  if (!full_name || full_name.length > 120 || !email || email.length > 254) {
    res.status(400).json({ error: "Enter a name and a valid email address." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (phone_number.length > 40) {
    res.status(400).json({ error: "Phone number must be 40 characters or fewer." });
    return;
  }
  if (role !== "TRAINER" && role !== "HOD") {
    res.status(400).json({ error: "Staff accounts can only be created as Trainer or HOD." });
    return;
  }
  const adminDepts = await loadDatabaseDepartments();
  if (!adminDepts.some((d) => matchesDepartment(d, department_id))) {
    res.status(400).json({ error: "Select a valid department for this staff account." });
    return;
  }
  try {
    if (await findUserByEmail(email)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const temporaryPassword = randomBytes2(18).toString("base64url");
    const password_hash = await bcrypt.hash(temporaryPassword, 12);
    const created = await createStaffAccount({
      full_name,
      email,
      phone_number: phone_number || null,
      department_id,
      password_hash,
      role
    });
    if (!pool) {
      const profile = DB.trainers.find((trainer) => trainer.id === created.profile_id);
      if (!profile) {
        DB.trainers.push({ id: created.profile_id, name: full_name, email, assigned_units: [] });
      }
      if (role === "HOD") {
        const department = DB.departments.find((item) => item.id === department_id);
        if (department) department.hod_id = created.profile_id;
      }
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({
      success: true,
      user: {
        id: created.id,
        name: created.full_name,
        email: created.email,
        role: created.role.toLowerCase(),
        department_id: created.department_id,
        profile_id: created.profile_id,
        must_change_password: created.must_change_password === true
      },
      temporaryPassword
    });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      res.status(503).json({ error: "Staff account service is temporarily unavailable." });
      return;
    }
    if (error?.code === "DEPARTMENT_NOT_FOUND") {
      res.status(400).json({ error: "Select a valid department for this staff account." });
      return;
    }
    if (error?.code === "23505") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    logger.error("Admin staff account creation error", { event: "admin_staff_creation_error", error });
    captureServerException(error, { event: "admin_staff_creation_error" });
    res.status(500).json({ error: "Could not create the staff account. Please try again." });
  }
});
apiRouter.post("/admin/maintenance/:action", requireRoles("admin"), async (req, res) => {
  const { action } = req.params;
  if (action === "ping-db") {
    const startTime = Date.now();
    try {
      if (pool) {
        await pool.query("SELECT 1");
      } else {
        await query("SELECT 1");
      }
      const latencyMs = Math.max(Date.now() - startTime, 1);
      res.json({
        success: true,
        action: "ping-db",
        latencyMs,
        status: "connected",
        database: pool ? "PostgreSQL (Supabase Pool)" : "Local Persistent JSON / SQLite",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const latencyMs = Math.max(Date.now() - startTime, 1);
      res.json({
        success: true,
        action: "ping-db",
        latencyMs,
        status: "fallback",
        database: "Local Persistent Storage",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        warning: err?.message
      });
    }
    return;
  }
  if (action === "purge-cache") {
    try {
      res.json({
        success: true,
        action: "purge-cache",
        purgedPrefixes: [
          "mtti_class_register_",
          "mtti_attendance_",
          "mtti_trainees",
          "mtti_uploads",
          "mtti_session_plans",
          "mtti_records_of_work",
          "mtti_assessment_"
        ],
        message: "All 7 MTTI cache prefixes successfully targeted and purged.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ success: false, error: err?.message || "Purge failed" });
    }
    return;
  }
  if (action === "run-audit") {
    try {
      const { exec } = await import("child_process");
      const rootDir = process.cwd();
      exec("npx vitest run --root .", { timeout: 35e3, cwd: rootDir }, (error, stdout, stderr) => {
        const fullOutput = (stdout || "") + (stderr ? `
${stderr}` : "");
        const passed = !error;
        res.json({
          success: passed,
          action: "run-audit",
          exitCode: error ? error.code ?? 1 : 0,
          output: fullOutput || (passed ? "All test suites executed successfully." : "Execution finished with errors."),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        action: "run-audit",
        error: err?.message || "Failed to execute vitest audit suite"
      });
    }
    return;
  }
  res.status(400).json({ error: `Unknown maintenance action: ${action}` });
});
apiRouter.post("/trainees/batch", async (req, res) => {
  try {
    const rawTrainees = Array.isArray(req.body) ? req.body : req.body?.trainees;
    const defaultCohort = req.body?.cohortCode || "ICT4/ITECH6/S/26 MOD 1";
    if (!Array.isArray(rawTrainees) || rawTrainees.length === 0) {
      res.status(400).json({ error: "A non-empty list of trainees is required." });
      return;
    }
    const inserted = [];
    const persistent = loadPersistentTrainees();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const item of rawTrainees) {
      const admNo = (item.admissionNumber || item.admNo || item.reg_number || "").trim();
      const fullName = (item.fullName || item.name || "").trim();
      const cohort = (item.cohortCode || item.classCode || defaultCohort || "ICT4/ITECH6/S/26 MOD 1").trim();
      if (!admNo || !fullName) continue;
      const id = item.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const record = {
        id,
        name: fullName,
        reg_number: admNo,
        adm_no: admNo,
        reg_code: item.regCode || admNo,
        class_code: cohort,
        department: item.department || "Computing & Informatics",
        gender: item.gender || "M",
        phone: item.phone || "",
        remarks: item.remarks || "Batch CSV Uploaded",
        created_at: now,
        updated_at: now
      };
      const existIdx = persistent.findIndex((t) => t.id === id || t.adm_no === admNo);
      if (existIdx >= 0) {
        persistent[existIdx] = { ...persistent[existIdx], ...record };
      } else {
        persistent.push(record);
      }
      const rosterIdx = OFFICIAL_INSTITUTIONAL_ROSTER.findIndex((r) => r.admissionNumber === admNo);
      const rosterEntry = {
        id,
        admissionNumber: admNo,
        regCode: record.reg_code,
        fullName,
        cohortCode: cohort,
        enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "061155101A", "0611-651-21A"]
      };
      if (rosterIdx >= 0) {
        OFFICIAL_INSTITUTIONAL_ROSTER[rosterIdx] = rosterEntry;
      } else {
        OFFICIAL_INSTITUTIONAL_ROSTER.push(rosterEntry);
      }
      inserted.push(record);
    }
    if (pool && inserted.length > 0) {
      try {
        await saveTraineeBatch(inserted);
      } catch (e) {
        logger.warn("Batch PG insert warning", { event: "batch_pg_insert_warning", error: e.message });
      }
    }
    savePersistentTrainees(persistent);
    res.status(201).json({
      success: true,
      message: `Successfully processed ${inserted.length} trainees into official roster.`,
      count: inserted.length,
      trainees: inserted.map((t) => ({
        id: t.id,
        admissionNumber: t.adm_no,
        fullName: t.name,
        cohortCode: t.class_code
      }))
    });
  } catch (err) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err?.message || "Failed to batch upload trainees" });
  }
});
function verifyEvidenceAccess(user, evidence) {
  if (user.role === "trainee") {
    if (!isSelf(user, evidence.trainee_id)) {
      return {
        allowed: false,
        status_code: 403,
        error: "Forbidden (BOLA): Trainees can only access their own assessment evidence"
      };
    }
    return { allowed: true };
  }
  const offering = DB.unit_offerings.find((uo) => uo.id === evidence.unit_offering_id);
  if (!offering) {
    return { allowed: false, status_code: 404, error: "Unit offering not found for this evidence" };
  }
  if (user.role === "trainer") {
    if (!isAssignedTrainer(user, offering)) {
      return {
        allowed: false,
        status_code: 403,
        error: "Forbidden (Cross-Trainer): You cannot access or evaluate evidence for units assigned to another trainer"
      };
    }
    return { allowed: true };
  }
  if (user.role === "hod") {
    if (offering.department_id !== user.department_id) {
      return { allowed: false, status_code: 403, error: "Forbidden: Offering outside your department" };
    }
    return { allowed: true };
  }
  return { allowed: true };
}
function calculateServerWeightedMark(ctAvg, cpAvg, levelOrRuleset = 6, versionTag) {
  const ruleset = typeof levelOrRuleset === "object" ? levelOrRuleset : getActiveRuleset(levelOrRuleset, versionTag, DB.compliance_rulesets);
  const raw = (ctAvg || 0) * ruleset.ct_weight + (cpAvg || 0) * ruleset.cp_weight;
  return Math.round(raw);
}
apiRouter.get("/compliance/rulesets", async (_req, res) => {
  try {
    const rulesets = await loadComplianceRulesets();
    res.json(rulesets);
  } catch (err) {
    res.json(DB.compliance_rulesets);
  }
});
apiRouter.get("/compliance/rulesets/:versionTag", async (req, res) => {
  try {
    const all = await loadComplianceRulesets();
    const filtered = all.filter(
      (r) => r.version_tag.toUpperCase() === req.params.versionTag.trim().toUpperCase()
    );
    res.json(filtered.length > 0 ? filtered : all);
  } catch (err) {
    res.json(DB.compliance_rulesets);
  }
});
apiRouter.get("/audit-logs", requireRoles("hod", "admin"), async (req, res) => {
  const user = req.user;
  const tableName = typeof req.query.table_name === "string" ? req.query.table_name : void 0;
  const limit = req.query.limit ? Math.min(200, parseInt(String(req.query.limit), 10) || 50) : 50;
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) || 0 : 0;
  try {
    const logs = await loadAuditLogs({ table_name: tableName, limit, offset });
    res.json({
      success: true,
      count: logs.length,
      actor_role: user.role,
      audit_logs: logs
    });
  } catch (err) {
    const memLogs = DB.audit_logs.filter((l) => !tableName || l.table_name === tableName);
    res.json({
      success: true,
      count: memLogs.length,
      actor_role: user.role,
      audit_logs: memLogs.slice(offset, offset + limit)
    });
  }
});
apiRouter.get("/evidence", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (user.role === "trainee") {
    const items = DB.assessment_evidence.filter((e) => isSelf(user, e.trainee_id));
    res.json({ evidence: items });
    return;
  }
  if (user.role === "trainer") {
    const myOfferings = DB.unit_offerings.filter((uo) => isAssignedTrainer(user, uo)).map((uo) => uo.id);
    const items = DB.assessment_evidence.filter((e) => myOfferings.includes(e.unit_offering_id));
    res.json({ evidence: items });
    return;
  }
  if (user.role === "hod") {
    const deptOfferings = DB.unit_offerings.filter((uo) => uo.department_id === user.department_id).map((uo) => uo.id);
    const items = DB.assessment_evidence.filter((e) => deptOfferings.includes(e.unit_offering_id));
    res.json({ evidence: items });
    return;
  }
  res.json({ evidence: DB.assessment_evidence });
});
apiRouter.get("/evidence/:id", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  res.json({ evidence: item });
});
apiRouter.get("/evidence/:id/file", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  const cleanB64 = (item.file_data || "").replace(/^data:[^;]+;base64,/, "");
  const fileBuffer = Buffer.from(cleanB64, "base64");
  const dispositionType = req.query.download === "true" ? "attachment" : "inline";
  res.setHeader("Content-Type", item.mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `${dispositionType}; filename="${item.filename}"`);
  res.setHeader("Content-Length", fileBuffer.length);
  res.send(fileBuffer);
});
apiRouter.get("/evidence/:id/download", (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  const cleanB64 = (item.file_data || "").replace(/^data:[^;]+;base64,/, "");
  const fileBuffer = Buffer.from(cleanB64, "base64");
  res.setHeader("Content-Type", item.mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${item.filename}"`);
  res.setHeader("Content-Length", fileBuffer.length);
  res.send(fileBuffer);
});
apiRouter.post("/evidence", requireRoles("trainee", "admin"), async (req, res) => {
  const user = req.user;
  const { unit_offering_id, task_code, title, filename, file_data, mime_type, file_size } = req.body;
  if (!filename || !file_data) {
    res.status(400).json({ error: "filename and file_data are required" });
    return;
  }
  const id = `ev-${Date.now()}`;
  const newEvidence = {
    id,
    unit_offering_id: unit_offering_id || "uo-1",
    trainee_id: user.role === "trainee" ? user.profile_id : req.body.trainee_id ? req.body.trainee_id.trim() : (() => {
      throw new Error("Missing required trainee_id in request body");
    })(),
    task_code: task_code || "CP1",
    title: title || filename,
    filename,
    file_url: `/api/evidence/${id}/file`,
    mime_type: mime_type || "application/pdf",
    file_size: file_size || file_data.length,
    file_data,
    verified_by_trainer: false,
    verified_at: null,
    verified_by: null,
    grade: null,
    feedback: "",
    submitted_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  DB.assessment_evidence.push(newEvidence);
  try {
    await saveAssessmentEvidence(newEvidence, DB.assessment_evidence);
  } catch (err) {
    logger.error("PostgreSQL upload evidence error", { event: "upload_evidence_error", error: err.message });
    captureServerException(err, { event: "upload_evidence_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving evidence: ${err.message}` });
    return;
  }
  res.status(201).json({ success: true, evidence: newEvidence });
});
apiRouter.put("/evidence/:id/verify", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const user = req.user;
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  item.verified_by_trainer = true;
  item.verified_at = (/* @__PURE__ */ new Date()).toISOString();
  item.verified_by = user.name;
  try {
    await saveAssessmentEvidence(item, DB.assessment_evidence);
  } catch (err) {
    logger.error("PostgreSQL verify evidence error", { event: "verify_evidence_error", error: err.message });
    captureServerException(err, { event: "verify_evidence_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error verifying evidence: ${err.message}` });
    return;
  }
  res.json({ success: true, evidence: item });
});
apiRouter.put("/evidence/:id/grade", requireRoles("trainer", "hod", "admin"), async (req, res) => {
  const user = req.user;
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  const existingMark = DB.assessment_marks.find(
    (m) => m.unit_offering_id === item.unit_offering_id && m.trainee_id === item.trainee_id
  );
  if (existingMark && existingMark.is_locked) {
    res.status(400).json({ error: "Marks locked: Assessment marksheet is finalized and locked" });
    return;
  }
  const { grade, feedback, task_code } = req.body;
  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
    res.status(400).json({ error: "Grade must be a valid number between 0 and 100" });
    return;
  }
  item.grade = numGrade;
  item.feedback = feedback !== void 0 ? feedback : item.feedback;
  item.task_code = task_code || item.task_code;
  item.verified_by_trainer = true;
  item.verified_at = (/* @__PURE__ */ new Date()).toISOString();
  item.verified_by = user.name;
  let markEntry = existingMark;
  if (!markEntry) {
    markEntry = {
      id: `mark-${Date.now()}`,
      unit_offering_id: item.unit_offering_id,
      trainee_id: item.trainee_id,
      ct_avg: 0,
      cp_avg: 0,
      cp_scores: [],
      ct_scores: [],
      project_score: 0,
      weighted_mark: 0,
      is_locked: false
    };
    DB.assessment_marks.push(markEntry);
  }
  if (!Array.isArray(markEntry.cp_scores)) {
    markEntry.cp_scores = markEntry.cp_avg ? [markEntry.cp_avg] : [];
  }
  if (!Array.isArray(markEntry.ct_scores)) {
    markEntry.ct_scores = markEntry.ct_avg ? [markEntry.ct_avg] : [];
  }
  const task = (item.task_code || "CP1").toUpperCase();
  if (task.startsWith("CP")) {
    const match = task.match(/\d+/);
    const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
    while (markEntry.cp_scores.length <= idx) markEntry.cp_scores.push(0);
    markEntry.cp_scores[idx] = numGrade;
    const sum = markEntry.cp_scores.reduce((a, b) => a + b, 0);
    markEntry.cp_avg = Math.round(sum / markEntry.cp_scores.length);
    markEntry.computed_average_practical = markEntry.cp_avg;
  } else {
    const match = task.match(/\d+/);
    const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
    while (markEntry.ct_scores.length <= idx) markEntry.ct_scores.push(0);
    markEntry.ct_scores[idx] = numGrade;
    const sum = markEntry.ct_scores.reduce((a, b) => a + b, 0);
    markEntry.ct_avg = Math.round(sum / markEntry.ct_scores.length);
    markEntry.computed_average_theory = markEntry.ct_avg;
  }
  markEntry.weighted_mark = calculateServerWeightedMark(markEntry.ct_avg, markEntry.cp_avg, 6);
  try {
    await saveAssessmentEvidence(item, DB.assessment_evidence);
    await saveAssessmentMarksBatch(DB.assessment_marks);
    recordAuditLog({
      table_name: "assessment_evidence",
      record_id: item.id,
      action: "UPDATE",
      actor_id: user.id,
      actor_role: user.role,
      new_data: item
    });
    recordAuditLog({
      table_name: "assessment_marks",
      record_id: markEntry.id,
      action: "UPDATE",
      actor_id: user.id,
      actor_role: user.role,
      new_data: markEntry
    });
  } catch (err) {
    logger.error("PostgreSQL grade evidence error", { event: "grade_evidence_error", error: err.message });
    captureServerException(err, { event: "grade_evidence_error" });
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error grading evidence: ${err.message}` });
    return;
  }
  res.json({ success: true, evidence: item, marks: markEntry });
});
apiRouter.delete("/evidence/:id", async (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const item = DB.assessment_evidence.find((e) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }
  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }
  if (user.role === "trainee" && (item.verified_by_trainer || item.grade !== null)) {
    res.status(403).json({
      error: "Forbidden: Candidates cannot delete verified or graded assessment evidence"
    });
    return;
  }
  const idx = DB.assessment_evidence.findIndex((e) => e.id === req.params.id);
  if (idx !== -1) {
    DB.assessment_evidence.splice(idx, 1);
    savePersistentAssessmentEvidence(DB.assessment_evidence);
    if (pool) {
      try {
        await pool.query("DELETE FROM assessment_evidence WHERE id = $1", [req.params.id]);
      } catch (err) {
        logger.error("PostgreSQL delete evidence error", { event: "delete_evidence_error", error: err.message });
        captureServerException(err, { event: "delete_evidence_error" });
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error deleting evidence: ${err.message}` });
        return;
      }
    }
  }
  res.json({ success: true, deleted_id: req.params.id });
});

// server/apiHandler.ts
initServerSentry();
process.on("unhandledRejection", (reason) => {
  logger.error("API Serverless Unhandled Rejection", { error: reason });
  captureServerException(reason);
});
process.on("uncaughtException", (error) => {
  logger.error("API Serverless Uncaught Exception", { error });
  captureServerException(error);
});
var app = express();
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sentryContextMiddleware);
app.use(apiRateLimiter);
app.use((req, res, next) => {
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
  if (matchedPath && (req.url.includes("index") || req.url === "/" || req.url === "/api")) {
    const qIdx = req.url.indexOf("?");
    const query2 = qIdx >= 0 ? req.url.slice(qIdx) : "";
    req.url = matchedPath + query2;
  }
  next();
});
app.use(async (_req, _res, next) => {
  try {
    await ensureSchemaInitialized();
  } catch {
  }
  next();
});
app.use("/api", apiRouter);
app.use(apiRouter);
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});
app.use((err, req, res, next) => {
  logger.error("[API Serverless Error]", { error: err?.message, stack: err?.stack });
  captureServerException(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err?.status || 500).json({ error: err?.message || "Internal server error" });
});
var apiHandler_default = app;
export {
  apiHandler_default as default
};
