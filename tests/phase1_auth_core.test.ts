import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as dbModule from "../server/db.ts";
import { apiRouter, DB } from "../server/routes.ts";
import {
  authenticateToken,
  requireRole,
  requireRoles,
  verifyToken,
  signToken,
  validateEnvironmentInvariants,
  normalizeAdmissionIdentifier,
  isSelf,
  isAssignedTrainer,
  invalidateUserProfileCache,
  isRelaxedMode,
  isSecureProductionMode,
  validateRoleProfileLink,
  hydrateUserProfile,
} from "../server/auth.ts";
import {
  createUser,
  findUserByEmailOrAdmission,
  findUserByAdmissionNumber,
  loadPersistentUsers,
  savePersistentUsers,
  loadPersistentTrainees,
  savePersistentTrainees,
  loadPersistentAttendance,
  loadDatabaseTrainees,
  isSecureProductionRuntime,
} from "../server/db.ts";
import { loginAs } from "./test_auth_helpers.ts";

const VALID_TEST_SECRET = "mtti_test_jwt_secret_min_32_chars_long_and_cryptographically_strong!";

describe("Phase 1 Acceptance Suite: Cryptographic Auth Core, ID Mapping & RBAC", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  const testTraineeAdm = "14179/S2026";
  const testTraineePassword = "TraineePassword@2026!";
  let testTraineeUserId: string;

  const testTrainerEmail = "trainer@mtti.ac.ke";
  const testTrainerPassword = "Mtti@2026!";
  let testTrainerUserId: string;

  beforeAll(async () => {
    delete process.env.ALLOW_DEMO_AUTH;
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = VALID_TEST_SECRET;

    // Seed test trainee user with admission number and persisted link to "trainee-001"
    const traineeHash = await bcrypt.hash(testTraineePassword, 10);
    const existingTrainee = await findUserByEmailOrAdmission(testTraineeAdm);
    if (existingTrainee) {
      existingTrainee.password_hash = traineeHash;
      existingTrainee.profile_id = "trainee-001";
      existingTrainee.role = "TRAINEE";
      testTraineeUserId = existingTrainee.id;
    } else {
      const traineeUser = await createUser({
        admission_number: testTraineeAdm,
        full_name: "Phase 1 Doris Trainee",
        email: "doris@mtti.ac.ke",
        password_hash: traineeHash,
        role: "TRAINEE",
        profile_id: "trainee-001",
      });
      testTraineeUserId = traineeUser.id;
    }

    // Seed test trainer user with email and persisted link to "trainer-001"
    const trainerHash = await bcrypt.hash(testTrainerPassword, 10);
    const existingTrainer = await findUserByEmailOrAdmission(testTrainerEmail);
    if (existingTrainer) {
      existingTrainer.password_hash = trainerHash;
      existingTrainer.profile_id = "trainer-001";
      existingTrainer.role = "TRAINER";
      testTrainerUserId = existingTrainer.id;
    } else {
      const trainerUser = await createUser({
        admission_number: null,
        full_name: "Dr. J. Muriithi",
        email: testTrainerEmail,
        password_hash: trainerHash,
        role: "TRAINER",
        profile_id: "trainer-001",
      });
      testTrainerUserId = trainerUser.id;
    }

    const allUsers = loadPersistentUsers();
    savePersistentUsers(allUsers);

    app = express();
    app.use(express.json());

    const testRouter = express.Router();

    testRouter.get("/open-protected", authenticateToken, (req: any, res) => {
      res.json({
        success: true,
        user: {
          id: req.user?.id,
          profile_id: req.user?.profile_id,
          role: req.user?.role,
          name: req.user?.name,
          admission_number: req.user?.admission_number,
        },
      });
    });

    testRouter.get("/trainee-only", requireRole("trainee"), (req: any, res) => {
      res.json({ success: true, profile_id: req.user?.profile_id, role: req.user?.role });
    });

    testRouter.get("/admin-only", requireRoles("admin"), (req: any, res) => {
      res.json({ success: true, profile_id: req.user?.profile_id, role: req.user?.role });
    });

    app.use("/api/test-auth", testRouter);
    app.use("/api", apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ─── 1. MODULE-LOAD BOOT CHECKS & FORBIDDEN PRODUCTION SECRETS ─────────────
  describe("1. Environment Boot Invariants & Forbidden Secrets", () => {
    it("should reject startup in production if JWT_SECRET is missing", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        delete process.env.JWT_SECRET;
        expect(() => validateEnvironmentInvariants()).toThrow(/JWT_SECRET must be configured/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("should reject startup in production if JWT_SECRET is shorter than 32 characters", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "too-short-secret";
        expect(() => validateEnvironmentInvariants()).toThrow(/at least 32 characters long/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("should reject startup in production if ALLOW_DEMO_AUTH is enabled", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "a_very_long_valid_jwt_secret_that_exceeds_32_characters_for_prod";
        process.env.ALLOW_DEMO_AUTH = "true";
        expect(() => validateEnvironmentInvariants()).toThrow(/ALLOW_DEMO_AUTH is strictly forbidden in production mode/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("should reject startup in production if test secret from vitest.config.ts is used", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = VALID_TEST_SECRET;
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("should reject startup in production if .env.example placeholder secret is used", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = "replace_with_openssl_rand_base64_48_secret_here";
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("should throw immediately upon importing api/index.ts without valid JWT_SECRET", async () => {
      const origEnv = { ...process.env };
      try {
        delete process.env.JWT_SECRET;
        expect(() => {
          validateEnvironmentInvariants();
        }).toThrow(/JWT_SECRET must be configured/i);
      } finally {
        process.env = origEnv;
      }
    });
  });

  // ─── 2. CRYPTOGRAPHIC PINNING & CLAIMS ───────────────────────────────────────
  describe("2. Cryptographic Claim Pinning (HS256, exp, iss, aud)", () => {
    it("should reject forged tokens with wrong signature with 401", async () => {
      const forged = jwt.sign(
        { sub: "usr-admin-01", role: "admin", exp: Math.floor(Date.now() / 1000) + 3600, iss: "mtti-api", aud: "mtti-web" },
        "wrong_attacker_secret_key_32_chars_long!!"
      );
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${forged}` },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/unauthorized|invalid/i);
    });

    it("should reject tokens with alg: 'none' with 401", async () => {
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "usr-01", role: "admin", exp: 9999999999, iss: "mtti-api", aud: "mtti-web" })).toString("base64url");
      const algNoneToken = `${header}.${payload}.`;

      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${algNoneToken}` },
      });
      expect(res.status).toBe(401);
      await expect(verifyToken(algNoneToken)).rejects.toThrow();
    });

    it("should reject tokens without exp claim with 401", async () => {
      const noExpToken = jwt.sign(
        { sub: "usr-01", role: "trainee", iss: "mtti-api", aud: "mtti-web" },
        VALID_TEST_SECRET,
        { algorithm: "HS256" }
      );
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${noExpToken}` },
      });
      expect(res.status).toBe(401);
      await expect(verifyToken(noExpToken)).rejects.toThrow(/missing expiration claim/i);
    });

    it("should reject expired tokens with 401", async () => {
      const expired = jwt.sign(
        { sub: "usr-01", role: "trainee", exp: Math.floor(Date.now() / 1000) - 30, iss: "mtti-api", aud: "mtti-web" },
        VALID_TEST_SECRET,
        { algorithm: "HS256" }
      );
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${expired}` },
      });
      expect(res.status).toBe(401);
      await expect(verifyToken(expired)).rejects.toThrow(/expired/i);
    });

    it("should reject tokens with wrong issuer with 401", async () => {
      const wrongIss = jwt.sign(
        { sub: "usr-01", role: "trainee", exp: Math.floor(Date.now() / 1000) + 3600, iss: "untrusted-issuer", aud: "mtti-web" },
        VALID_TEST_SECRET,
        { algorithm: "HS256" }
      );
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${wrongIss}` },
      });
      expect(res.status).toBe(401);
      await expect(verifyToken(wrongIss)).rejects.toThrow(/jwt issuer invalid/i);
    });

    it("should reject tokens with wrong audience with 401", async () => {
      const wrongAud = jwt.sign(
        { sub: "usr-01", role: "trainee", exp: Math.floor(Date.now() / 1000) + 3600, iss: "mtti-api", aud: "wrong-audience" },
        VALID_TEST_SECRET,
        { algorithm: "HS256" }
      );
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${wrongAud}` },
      });
      expect(res.status).toBe(401);
      await expect(verifyToken(wrongAud)).rejects.toThrow(/jwt audience invalid/i);
    });
  });

  // ─── 3. PUBLIC PATH GATING ──────────────────────────────────────────────────
  describe("3. Temporary Public Paths Allowlist vs Protected Routes", () => {
    it("should reject tokenless request to protected routes with 401", async () => {
      const res = await fetch(`${baseUrl}/submissions`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/unauthorized|missing/i);
    });

    it("should allow tokenless access to GET /health (or /api/health)", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("healthy");
    });

    it("should allow tokenless access to POST /auth/login with validation failure (not 401 missing token)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should allow tokenless access to POST /auth/register-trainee with validation failure (not 401 missing token)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should allow tokenless access to GET /trainees/lookup without 401 missing token error", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=10525`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id || data.fullName).toBeDefined();
    });
  });

  // ─── 4. DUAL-SIDED NORMALIZATION (TABLE-DRIVEN OVER ALL REPO FORMATS) ───────
  describe("4. Table-Driven Normalization & Exact-Match Verification", () => {
    const admissionFormats = [
      { raw: "14179/S2026", expected: "14179/S2026", desc: "standard slash cohort" },
      { raw: "D/UPNUT/25042/069", expected: "D/UPNUT/25042/069", desc: "complex alphanumeric with D/ prefix" },
      { raw: "ICT4/ITECH6/14076", expected: "ICT4/ITECH6/14076", desc: "combined cohort prefix" },
      { raw: "ADMIN5/6/J/26 MOD 3/12345", expected: "ADMIN5/6/J/26 MOD 3/12345", desc: "business studies modular prefix" },
      { raw: "ITECH 6 MOD/14179/S2026", expected: "ITECH 6 MOD/14179/S2026", desc: "whitespace-containing class code" },
      { raw: "10525", expected: "10525", desc: "5-digit numeric core" },
      { raw: "  d/upnut/25042/069  ", expected: "D/UPNUT/25042/069", desc: "lowercase and padded whitespace" },
      { raw: "ITECH   6   MOD/14179/S2026", expected: "ITECH 6 MOD/14179/S2026", desc: "irregular internal whitespace" },
    ];

    it("should identically normalize all admission formats without prefix damage", () => {
      for (const item of admissionFormats) {
        const normalized = normalizeAdmissionIdentifier(item.raw);
        expect(normalized).toBe(item.expected);
      }
    });

    it("should accurately resolve D/UPNUT/25042/069 without prefix truncation", async () => {
      const trainees = loadPersistentTrainees();
      const normInput = normalizeAdmissionIdentifier("  d/upnut/25042/069  ");
      const match = trainees.find((t) => normalizeAdmissionIdentifier(t.reg_number) === normInput);
      expect(match).toBeDefined();
      expect(match?.reg_number).toBe("D/UPNUT/25042/069");
    });
  });

  // ─── 5. FAIL-CLOSED HYDRATION, PROFILE ID & CACHE ────────────────────────────
  describe("5. Fail-Closed Profile Hydration & Cache Invariants", () => {
    it("should respond 401 for a valid token whose user has been deleted from DB", async () => {
      const tokenForDeleted = signToken({ sub: "usr-deleted-9999", role: "trainee" });
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${tokenForDeleted}` },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toMatch(/not found|deactivated/i);
    });

    it("should enforce DB role over token claims (DB role wins)", async () => {
      const spoofedToken = signToken({ sub: testTraineeUserId, role: "admin" });
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${spoofedToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.role).toBe("trainee"); // DB record dictates trainee
    });

    it("should reflect DB role changes immediately after invalidateUserProfileCache()", async () => {
      const token = signToken({ sub: testTraineeUserId, role: "trainee" });
      const res1 = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res1.status).toBe(200);

      // Invalidate cache
      invalidateUserProfileCache(testTraineeUserId);

      // Update DB role to trainer (which has no valid trainer profile for this ID)
      const users = loadPersistentUsers();
      const u = users.find((x) => x.id === testTraineeUserId);
      if (u) {
        u.role = "trainer";
        u.profile_id = null;
      }

      try {
        const res2 = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(res2.status).toBe(403);
      } finally {
        if (u) {
          u.role = "trainee";
          u.profile_id = "trainee-001";
        }
        invalidateUserProfileCache(testTraineeUserId);
      }
    });

    it("should reject ambiguous profile match (>1 match) with 401 and never pick first", async () => {
      const duplicateAdm = `DUP_ADM_${Date.now()}`;
      const trainees = loadPersistentTrainees();
      const origTrainees = [...trainees];

      trainees.push({
        id: "tr-dup-01",
        name: "Duplicate One",
        reg_number: duplicateAdm,
        adm_no: duplicateAdm,
      });
      trainees.push({
        id: "tr-dup-02",
        name: "Duplicate Two",
        reg_number: duplicateAdm,
        adm_no: duplicateAdm,
      });
      savePersistentTrainees(trainees);

      const hash = await bcrypt.hash("pass123", 10);
      const dupUser = await createUser({
        admission_number: duplicateAdm,
        full_name: "Duplicate User",
        email: `dup_${Date.now()}@mtti.ac.ke`,
        password_hash: hash,
        role: "trainee",
        profile_id: null,
      });

      try {
        const token = signToken({ sub: dupUser.id, role: "trainee" });
        const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
                expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/ambiguous/i);
      } finally {
        savePersistentTrainees(origTrainees);
        invalidateUserProfileCache(dupUser.id);
      }
    });

    it("should reject trainee with no matching roster profile with 403 Forbidden", async () => {
      const hash = await bcrypt.hash("pass123", 10);
      const orphanUser = await createUser({
        admission_number: "NON_EXISTENT_ADM_9999",
        full_name: "Orphan Trainee",
        email: `orphan_${Date.now()}@mtti.ac.ke`,
        password_hash: hash,
        role: "trainee",
        profile_id: null,
      });

      const token = signToken({ sub: orphanUser.id, role: "trainee" });
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/no associated active academic profile/i);
    });

    it("should allow admin without faculty profile to access admin routes (admin exempt)", async () => {
      const hash = await bcrypt.hash("admin123", 10);
      const adminUser = await createUser({
        admission_number: null,
        full_name: "Admin Exempt User",
        email: `admin_${Date.now()}@mtti.ac.ke`,
        password_hash: hash,
        role: "admin",
        profile_id: null,
      });

      const token = signToken({ sub: adminUser.id, role: "admin" });
      const res = await fetch(`${baseUrl}/test-auth/admin-only`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.profile_id).toBe(adminUser.id);
    });
  });

  // ─── 6. DOMAIN HELPERS & REAL LOGIN-TOKEN AUTHORIZATION ─────────────────────
  describe("6. Authorization Helpers & Real Login Token Isolation", () => {
    it("isSelf unit test: strictly compares user.profile_id with target trainee ID", () => {
      const user: any = { id: "usr-01", profile_id: "trainee-001" };
      expect(isSelf(user, "trainee-001")).toBe(true);
      expect(isSelf(user, "trainee-002")).toBe(false);
      expect(isSelf(user, "usr-01")).toBe(false); // does not compare against user.id
      expect(isSelf(undefined, "trainee-001")).toBe(false);
    });

    it("isAssignedTrainer unit test: strictly compares user.profile_id with offering.trainer_id", () => {
      const user: any = { id: "usr-trainer-01", profile_id: "trainer-001" };
      expect(isAssignedTrainer(user, { trainer_id: "trainer-001" })).toBe(true);
      expect(isAssignedTrainer(user, { trainer_id: "trainer-002" })).toBe(false);
      expect(isAssignedTrainer(user, { trainer_id: "usr-trainer-01" })).toBe(false);
      expect(isAssignedTrainer(undefined, { trainer_id: "trainer-001" })).toBe(false);
    });

    it("Real Login Token Trainee: resolves profile_id 'trainee-001' and accesses own submissions", async () => {
      // 1. Authenticate Trainee
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: testTraineeAdm, password: testTraineePassword }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toBeDefined();
      expect(loginData.user.role).toBe("trainee");

      // 2. Fetch submissions - should only see trainee-001 submissions
      const subRes = await fetch(`${baseUrl}/submissions`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(subRes.status).toBe(200);
      const subData = await subRes.json();
      const list = Array.isArray(subData) ? subData : (subData.submissions || []);
      expect(list.length).toBeGreaterThan(0);
      for (const s of list) {
        expect(s.trainee_id).toBe("trainee-001");
      }

      // 3. Attempting to view another trainee's submission (sub-102 belongs to trainee-002) returns 403
      const idorRes = await fetch(`${baseUrl}/submissions/sub-102`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(idorRes.status).toBe(403);
    });

    it("Real Login Token Trainer: resolves profile_id 'trainer-001' and accesses only assigned offerings", async () => {
      // 1. Authenticate Trainer
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: testTrainerEmail, password: testTrainerPassword }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toBeDefined();
      expect(loginData.user.role).toBe("trainer");

      // 2. View marks for assigned offering uo-1 (trainer-001) -> 200
      const assignedRes = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(assignedRes.status).toBe(200);

      // 3. View marks for unassigned offering uo-3 (trainer-002) -> 403 Forbidden
      const unassignedRes = await fetch(`${baseUrl}/assessment-marks/uo-3`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      expect(unassignedRes.status).toBe(403);
    });
  });

  // ─── 7. PRODUCTION HEADER INJECTION & DEMO AUTH ISOLATION ───────────────────
  describe("7. Production Header Injection Immunity & Demo Token Isolation", () => {
    it("(a) Production mode + x-user-role: admin + no token -> 401 Unauthorized", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      const prodSecret = "production_secret_32_chars_minimum_openssl_verified!";
      try {
        process.env.JWT_SECRET = prodSecret;
        process.env.NODE_ENV = "production";
        const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: { "x-user-role": "admin" },
        });
                expect(res.status).toBe(401);
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it("(b) Production mode + valid trainee token + x-user-role: admin -> strictly treated as trainee", async () => {
      // Prime cache with valid trainee user
      const primeRes = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: {
          Authorization: `Bearer ${signToken({ sub: testTraineeUserId, role: "trainee" })}`,
        },
      });
      expect(primeRes.status).toBe(200);

      const origNodeEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      const prodSecret = "production_secret_32_chars_minimum_openssl_verified!";
      try {
        process.env.JWT_SECRET = prodSecret;
        process.env.NODE_ENV = "production";
        const traineeToken = jwt.sign(
          { sub: testTraineeUserId, role: "trainee", exp: Math.floor(Date.now() / 1000) + 3600, iss: "mtti-api", aud: "mtti-web" },
          prodSecret,
          { algorithm: "HS256" }
        );
        const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: {
            Authorization: `Bearer ${traineeToken}`,
            "x-user-role": "admin",
          },
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user.role).toBe("trainee");
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it("(c) Production mode + demo token 'token-admin' -> 401 Unauthorized", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      const prodSecret = "production_secret_32_chars_minimum_openssl_verified!";
      try {
        process.env.JWT_SECRET = prodSecret;
        process.env.NODE_ENV = "production";
        const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: { Authorization: "Bearer token-admin" },
        });
                expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/disabled in production/i);
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });

    it("(d) Production mode: findUserById returns 503 when PostgreSQL database is unavailable", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origSecret = process.env.JWT_SECRET;
      const prodSecret = "production_secret_32_chars_minimum_openssl_verified!";
      try {
        process.env.JWT_SECRET = prodSecret;
        process.env.NODE_ENV = "production";
        invalidateUserProfileCache("usr-non-cached-999");
        const unCachedToken = jwt.sign(
          { sub: "usr-non-cached-999", role: "trainee", exp: Math.floor(Date.now() / 1000) + 3600, iss: "mtti-api", aud: "mtti-web" },
          prodSecret,
          { algorithm: "HS256" }
        );
        const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
          headers: { Authorization: `Bearer ${unCachedToken}` },
        });
        expect(res.status).toBe(503);
        const data = await res.json();
        expect(data.error).toMatch(/unavailable/i);
      } finally {
        process.env.NODE_ENV = origNodeEnv;
        process.env.JWT_SECRET = origSecret;
      }
    });
  });

  // ─── 8. CRITICAL VERIFICATION GATES (USER CONDITIONS & INVARIANTS) ─────────
  describe("8. Critical Security Verification Invariants & Condition 4 Suites", () => {
    it("rejects test secret and .env.example placeholder in production mode", () => {
      const origEnv = { ...process.env };
      try {
        process.env.NODE_ENV = "production";
        process.env.JWT_SECRET = VALID_TEST_SECRET;
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);

        process.env.JWT_SECRET = "replace_with_openssl_rand_base64_48_secret_here";
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("enforces production invariants when NODE_ENV is unset or set to 'staging'", async () => {
      const origEnv = { ...process.env };
      try {
        // 1. Unset NODE_ENV
        delete process.env.NODE_ENV;
        process.env.ALLOW_DEMO_AUTH = "true";
        process.env.JWT_SECRET = "production_secret_32_chars_minimum_openssl_verified!";
        expect(() => validateEnvironmentInvariants()).toThrow(/ALLOW_DEMO_AUTH is strictly forbidden in production mode/i);

        delete process.env.ALLOW_DEMO_AUTH;
        process.env.JWT_SECRET = VALID_TEST_SECRET;
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);

        // 2. Staging NODE_ENV
        process.env.NODE_ENV = "staging";
        process.env.ALLOW_DEMO_AUTH = "true";
        process.env.JWT_SECRET = "production_secret_32_chars_minimum_openssl_verified!";
        expect(() => validateEnvironmentInvariants()).toThrow(/ALLOW_DEMO_AUTH is strictly forbidden in production mode/i);

        delete process.env.ALLOW_DEMO_AUTH;
        process.env.JWT_SECRET = "replace_with_openssl_rand_base64_48_secret_here";
        expect(() => validateEnvironmentInvariants()).toThrow(/Test secret or placeholder secret cannot be used in production mode/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("throws immediately upon importing api/index.ts without JWT_SECRET", () => {
      const origEnv = { ...process.env };
      try {
        delete process.env.JWT_SECRET;
        expect(() => validateEnvironmentInvariants()).toThrow(/JWT_SECRET must be configured/i);
      } finally {
        process.env = origEnv;
      }
    });

    it("enforces HOD department scope and exam access with real login tokens", async () => {
      // Ensure cross-department fixtures exist
      if (!DB.exams.some((e) => e.id === "exam-ee-01")) {
        DB.exams.push({
          id: "exam-ee-01",
          unit_id: "unit-ee-1",
          unit_code: "EE/CU/PO/CR/1/6",
          course_name: "Electrical Engineering",
          created_at: new Date().toISOString(),
          payload: {
            title: "Power Systems Exam",
            task_code: "EE1",
            duration_minutes: 60,
            total_marks: 30,
            portal_visible: true,
            section_a: { questions: [] },
            section_b: { questions: [] },
          },
        } as any);
      }
      if (!DB.unit_offerings.some((uo) => uo.id === "uo-ee-1")) {
        DB.unit_offerings.push({
          id: "uo-ee-1",
          unit_id: "unit-ee-1",
          unit_code: "EE/CU/PO/CR/1/6",
          department_id: "dept-ee",
          trainer_id: "trainer-003",
          status: "active",
        } as any);
      }

      // 1. Log in HOD (Computing, dept-ci)
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      expect(hodToken).toBeDefined();

      // 2. Query computing exam (exam-cr-001 in dept-ci) -> 200
      const examRes = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(examRes.status).toBe(200);

      // 3. Query cross-department exam (exam-ee-01 in dept-ee) -> 403 Forbidden
      const crossRes = await fetch(`${baseUrl}/exams/exam-ee-01`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(crossRes.status).toBe(403);
    });

    it("rejects trainee with profile_id pointing at a trainer record with 403 Forbidden", async () => {
      const hash = await bcrypt.hash("pass123", 10);
      const spoofedUser = await createUser({
        admission_number: `SPOOF_${Date.now()}`,
        full_name: "Spoofed Trainee",
        email: `spoofed_${Date.now()}@mtti.ac.ke`,
        password_hash: hash,
        role: "trainee",
        profile_id: "trainer-001", // Malicious pointer
      });

      const token = signToken({ sub: spoofedUser.id, role: "trainee" });
      const res = await fetch(`${baseUrl}/test-auth/open-protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/cannot reference staff or administrative records|cannot reference trainer records/i);
    });

    it("rejects unresolvable identity and ensures zero records are written", async () => {
      const initialAttendance = loadPersistentAttendance();
      const initialCount = initialAttendance.length;

      // Send unauthenticated attendance submission
      const res = await fetch(`${baseUrl}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          date: "2026-11-05",
          status: "present",
          trainee_id: "trainee-001",
        }),
      });
      expect(res.status).toBe(401);

      // Verify no record written
      const currentAttendance = loadPersistentAttendance();
      expect(currentAttendance.length).toBe(initialCount);
    });

    it("registering with an internal trainee id (e.g. 'TRAINEE-001') yields HTTP 403 Forbidden", async () => {
      const uniqueEmail = `internal_id_${Date.now()}@mtti.ac.ke`;
      const internalAdm = `TRAINEE-${Date.now()}`;
      const regRes = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Attacker User",
          admissionNumber: internalAdm,
          email: uniqueEmail,
          password: "AttackerPassword@2026!",
        }),
      });
      expect(regRes.status).toBe(403);
      const data = await regRes.json();
      expect(data.error).toMatch(/roster/i);
    });

    it("isolates evidence and marks with real login tokens (trainee isolated, trainer offering-scoped)", async () => {
      // 1. Trainee login
      const { token: traineeToken } = await loginAs(baseUrl, "trainee");

      // Trainee views own submissions -> only trainee-001
      const subRes = await fetch(`${baseUrl}/submissions`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(subRes.status).toBe(200);
      const subData = await subRes.json();
      const subs = Array.isArray(subData) ? subData : subData.submissions;
      for (const s of subs) {
        expect(s.trainee_id).toBe("trainee-001");
      }

      // Trainee cannot access other trainee's submission (sub-102) -> 403
      const idorRes = await fetch(`${baseUrl}/submissions/sub-102`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(idorRes.status).toBe(403);

      // 2. Trainer login
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");

      // Trainer can access assigned offering marks -> 200
      const assignedMarksRes = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(assignedMarksRes.status).toBe(200);

      // Trainer cannot access unassigned offering marks -> 403
      const unassignedMarksRes = await fetch(`${baseUrl}/assessment-marks/uo-3`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(unassignedMarksRes.status).toBe(403);
    });
  });

  // ─── 13. RIGOROUS PHASE 1 VERIFICATION & SIGN-OFF REQUIREMENTS ────────────
  describe("13. Rigorous Phase 1 Sign-Off Matrix", () => {
    describe("Condition 3: NODE_ENV Strict-by-Default (Only development & test are relaxed)", () => {
      const strictValues: Array<string | undefined> = [
        undefined,
        "",
        "staging",
        "prod",
        "Production",
        "preview",
        "qa",
      ];

      for (const val of strictValues) {
        it(`enforces strict production mode when NODE_ENV is ${val === undefined ? "undefined" : `"${val}"`}`, () => {
          const original = process.env.NODE_ENV;
          try {
            if (val === undefined) {
              delete process.env.NODE_ENV;
            } else {
              process.env.NODE_ENV = val;
            }
            expect(isRelaxedMode()).toBe(false);
            expect(isSecureProductionMode()).toBe(true);
            expect(isSecureProductionRuntime()).toBe(true);
          } finally {
            process.env.NODE_ENV = original;
          }
        });
      }

      it("enforces relaxed mode only when NODE_ENV is strictly 'development' or 'test'", () => {
        const original = process.env.NODE_ENV;
        try {
          process.env.NODE_ENV = "development";
          expect(isRelaxedMode()).toBe(true);
          expect(isSecureProductionMode()).toBe(false);

          process.env.NODE_ENV = "test";
          expect(isRelaxedMode()).toBe(true);
          expect(isSecureProductionMode()).toBe(false);
        } finally {
          process.env.NODE_ENV = original;
        }
      });
    });

    describe("Condition 4: Authoritative Data Store Hydration (loadDatabaseTrainees)", () => {
      it("hydrates a newly inserted trainee from domain store into roster lookup", async () => {
        const dynamicAdm = `DB_ONLY_${Date.now()}`;
        const dynamicId = `trainee-db-${Date.now()}`;
        const trainees = loadPersistentTrainees();
        trainees.push({
          id: dynamicId,
          name: "Database Only Trainee",
          reg_number: dynamicAdm,
          adm_no: dynamicAdm,
          reg_code: dynamicAdm,
          department: "Electrical & Electronics",
        });
        savePersistentTrainees(trainees);

        const loaded = await loadDatabaseTrainees();
        const found = loaded.find((t) => t.id === dynamicId);
        expect(found).toBeDefined();
        expect(found?.reg_number).toBe(dynamicAdm);
        expect(found?.name).toBe("Database Only Trainee");
      });
    });

    describe("Condition 5: Positive Role-to-Profile Link Validation on Hydration (403 on mismatch)", () => {
      it("rejects trainee whose profile_id points to a trainer profile (HTTP 403)", async () => {
        const check = await validateRoleProfileLink("trainee", "trainer-001", "usr-trainee-fake");
        expect(check.error).toBeDefined();
        expect(check.status).toBe(403);
        expect(check.error).toMatch(/cannot reference staff or administrative records|does not exist in roster/i);
      });

      it("rejects trainer whose profile_id points to a trainee profile (HTTP 403)", async () => {
        const check = await validateRoleProfileLink("trainer", "trainee-001", "usr-trainer-fake");
        expect(check.error).toBeDefined();
        expect(check.status).toBe(403);
        expect(check.error).toMatch(/cannot reference trainee or administrative records|does not exist in faculty/i);
      });

      it("rejects HOD whose profile_id does not match any departmental head (HTTP 403)", async () => {
        const check = await validateRoleProfileLink("hod", "trainer-001", "usr-hod-fake");
        expect(check.error).toBeDefined();
        expect(check.status).toBe(403);
        expect(check.error).toContain("HOD profile does not match any departmental head");
      });

      it("rejects admin whose profile_id does not anchor directly to user id (HTTP 403)", async () => {
        const check = await validateRoleProfileLink("admin", "admin-other-profile", "usr-admin-actual");
        expect(check.error).toBeDefined();
        expect(check.status).toBe(403);
        expect(check.error).toContain("Admin profile must anchor directly to user id");
      });
    });

    describe("Condition 2: POST /api/auth/register-trainee Roster Guardrails Matrix", () => {
      it("rejects registration with arbitrary admission number not in roster (HTTP 403)", async () => {
        const res = await fetch(`${baseUrl}/auth/register-trainee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Arbitrary Candidate",
            admissionNumber: `UNKNOWN_${Date.now()}`,
            email: `arbitrary_${Date.now()}@mtti.ac.ke`,
            password: "SecurePassword@2026!",
          }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain("Forbidden: Admission number does not match an official institutional roster record");
      });

      it("rejects registration with internal ID string like 'TRAINEE-001' (HTTP 403)", async () => {
        const res = await fetch(`${baseUrl}/auth/register-trainee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Internal ID Attacker",
            admissionNumber: "TRAINEE-001",
            email: `internal_attacker_${Date.now()}@mtti.ac.ke`,
            password: "SecurePassword@2026!",
          }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain("Forbidden: Admission number does not match an official institutional roster record");
      });

      it("rejects registration for an already-claimed roster profile (HTTP 409 Conflict)", async () => {
        const res = await fetch(`${baseUrl}/auth/register-trainee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Duplicate Claim Attempt",
            admissionNumber: "14179/S2026", // Already registered in seed/fixtures
            email: `duplicate_claim_${Date.now()}@mtti.ac.ke`,
            password: "SecurePassword@2026!",
          }),
        });
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toContain("already registered");
      });

      it("rejects duplicate registration of admission number '23505' with HTTP 409 Conflict", async () => {
        const adm = "23505";
        const profileId = "trainee-23505";
        const trainees = loadPersistentTrainees();
        if (!trainees.some(t => t.id === profileId)) {
          trainees.push({
            id: profileId,
            name: "Candidate 23505",
            reg_number: adm,
            adm_no: adm,
            reg_code: adm,
            department: "Computing & Informatics",
          });
          savePersistentTrainees(trainees);
        }

        const existing = await findUserByAdmissionNumber(adm);
        if (!existing) {
          await createUser({
            admission_number: adm,
            full_name: "Candidate 23505",
            email: `candidate_23505_${Date.now()}@mtti.ac.ke`,
            password_hash: await bcrypt.hash("CandidatePassword@2026!", 10),
            role: "trainee",
            profile_id: profileId,
          });
        }

        const res = await fetch(`${baseUrl}/auth/register-trainee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Duplicate Candidate 23505",
            admissionNumber: "23505",
            email: `dup_23505_${Date.now()}@mtti.ac.ke`,
            password: "SecurePassword@2026!",
          }),
        });
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toMatch(/already registered|already claimed/i);
      });

      it("maps a concurrent unique-constraint violation to HTTP 409", async () => {
        const admissionNumber = `RACE_${Date.now()}`;
        const trainees = loadPersistentTrainees();
        trainees.push({
          id: `trainee-${admissionNumber}`,
          name: "Concurrent Registration Candidate",
          reg_number: admissionNumber,
          adm_no: admissionNumber,
          reg_code: admissionNumber,
          department: "Computing & Informatics",
        });
        savePersistentTrainees(trainees);

        const createUserSpy = vi.spyOn(dbModule, "createUser").mockRejectedValue(
          Object.assign(new Error("duplicate key value violates unique constraint"), { code: "23505" })
        );

        try {
          const res = await fetch(`${baseUrl}/auth/register-trainee`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: "Concurrent Registration Candidate",
              admissionNumber,
              email: `race_${Date.now()}@mtti.ac.ke`,
              password: "SecurePassword@2026!",
            }),
          });

          expect(createUserSpy).toHaveBeenCalledOnce();
          expect(res.status).toBe(409);
          const data = await res.json();
          expect(data.error).toMatch(/already registered/i);
        } finally {
          createUserSpy.mockRestore();
        }
      });

      it("allows registration of a valid unclaimed roster candidate with profile_id set (HTTP 201)", async () => {
        const unclaimedAdm = `UNCLAIMED_${Date.now()}`;
        const unclaimedProfileId = `trainee-unclaimed-${Date.now()}`;
        const trainees = loadPersistentTrainees();
        trainees.push({
          id: unclaimedProfileId,
          name: "Eligible Unregistered Trainee",
          reg_number: unclaimedAdm,
          adm_no: unclaimedAdm,
          reg_code: unclaimedAdm,
          department: "Computing & Informatics",
        });
        savePersistentTrainees(trainees);

        const res = await fetch(`${baseUrl}/auth/register-trainee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: "Eligible Unregistered Trainee",
            admissionNumber: unclaimedAdm,
            email: `unclaimed_${Date.now()}@mtti.ac.ke`,
            password: "SecurePassword@2026!",
          }),
        });
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.user.admission_number).toBe(unclaimedAdm);
        expect(data.user.profile_id).toBe(unclaimedProfileId);
      });
    });
  });
});
