import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import { apiRouter } from "../server/routes.ts";
import { requireRole, requireRoles, authenticateToken } from "../server/middleware/auth.ts";
import {
  findUserByEmail,
  findUserByAdmissionNumber,
  findUserByEmailOrAdmission,
  loadPersistentUsers,
  createUser,
} from "../server/db.ts";

describe("Unified User Management, Secure Authentication, and RBAC Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Protected test routes using the new middleware
    const protectedRouter = express.Router();
    protectedRouter.get("/trainee-only", requireRole("TRAINEE"), (_req, res) => {
      res.json({ success: true, message: "Welcome trainee" });
    });
    protectedRouter.get("/staff-only", requireRole("ADMIN", "HOD"), (_req, res) => {
      res.json({ success: true, message: "Welcome privileged staff" });
    });
    protectedRouter.get("/trainer-only", requireRole("TRAINER"), (_req, res) => {
      res.json({ success: true, message: "Welcome trainer" });
    });

    app.use("/api/protected", protectedRouter);
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

  // ─── 1. DATABASE SCHEMA & PERSISTENCE VERIFICATION ──────────────────────────
  describe("1. Centralized Database Schema & Persistence", () => {
    it("should initialize default staff accounts in the persistent user registry", () => {
      const users = loadPersistentUsers();
      expect(users.length).toBeGreaterThanOrEqual(3);

      const admin = users.find((u) => u.email === "admin@mtti.ac.ke");
      expect(admin).toBeDefined();
      expect(admin?.role).toBe("ADMIN");
      expect(admin?.password_hash).toMatch(/^\$2[aby]\$\d+\$/);

      const hod = users.find((u) => u.email === "hod.ci@mtti.ac.ke");
      expect(hod).toBeDefined();
      expect(hod?.role).toBe("HOD");

      const trainer = users.find((u) => u.email === "trainer@mtti.ac.ke");
      expect(trainer).toBeDefined();
      expect(trainer?.role).toBe("TRAINER");
    });

    it("should lookup staff by email dynamically", async () => {
      const staff = await findUserByEmail("admin@mtti.ac.ke");
      expect(staff).toBeDefined();
      expect(staff?.full_name).toBe("System Administrator");
      expect(staff?.role).toBe("ADMIN");
    });
  });

  // ─── 2. TRAINEE REGISTRATION ENDPOINT (POST /api/auth/register-trainee) ─────
  describe("2. Trainee Registration Endpoint (POST /api/auth/register-trainee)", () => {
    const testTraineeAdm = `ADM${Date.now()}`;
    const testTraineeEmail = `trainee_${Date.now()}@mtti.ac.ke`;

    it("should reject registration requests with missing required fields (HTTP 400)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Incomplete User",
          // missing admissionNumber, email, and password
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("required");
    });

    it("should reject registration requests with invalid email syntax (HTTP 400)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Invalid Email User",
          admissionNumber: `ADM_ERR_${Date.now()}`,
          email: "not-an-email",
          password: "SecurePassword123!",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("email");
    });

    it("should register a trainee successfully and salt & hash the password with bcrypt (HTTP 201)", async () => {
      const plainPassword = "TraineeSecure@2026";
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Brian Kiprono",
          admissionNumber: testTraineeAdm,
          phoneNumber: "+254712345678",
          email: testTraineeEmail,
          password: plainPassword,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.admission_number).toBe(testTraineeAdm);
      expect(data.user.email).toBe(testTraineeEmail);
      expect(data.user.role).toBe("TRAINEE");
      expect(data.user.password_hash).toBeUndefined(); // Zero plain-text / hash leak

      // Verify the record directly in the database abstraction
      const dbRecord = await findUserByAdmissionNumber(testTraineeAdm);
      expect(dbRecord).toBeDefined();
      expect(dbRecord?.password_hash).not.toBe(plainPassword);
      expect(dbRecord?.password_hash).toMatch(/^\$2[aby]\$\d+\$/);

      // Verify bcrypt comparison matches
      const isMatch = await bcrypt.compare(plainPassword, dbRecord!.password_hash);
      expect(isMatch).toBe(true);
    });

    it("should strictly enforce zero privilege escalation by forcing role to TRAINEE even if caller specifies ADMIN (HTTP 201)", async () => {
      const maliciousAdm = `HACK_${Date.now()}`;
      const maliciousEmail = `hack_${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Escalation Attempt",
          admissionNumber: maliciousAdm,
          email: maliciousEmail,
          password: "Password123!",
          role: "ADMIN", // Malicious privilege escalation attempt
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.role).toBe("TRAINEE");

      const dbUser = await findUserByAdmissionNumber(maliciousAdm);
      expect(dbUser?.role).toBe("TRAINEE");
    });

    it("should prevent duplicate registration by email (HTTP 409 Conflict)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Duplicate Email Test",
          admissionNumber: `DIFF_ADM_${Date.now()}`,
          email: testTraineeEmail, // Same email as above
          password: "SomePassword123!",
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("email");
    });

    it("should prevent duplicate registration by admission number (HTTP 409 Conflict)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Duplicate Adm Test",
          admissionNumber: testTraineeAdm, // Same adm as above
          email: `unique_${Date.now()}@mtti.ac.ke`,
          password: "SomePassword123!",
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("admission number");
    });
  });

  // ─── 3. FLEXIBLE AUTHENTICATION ENDPOINT (POST /api/auth/login) ─────────────
  describe("3. Flexible Authentication Endpoint (POST /api/auth/login)", () => {
    const loginAdm = `LOGIN_ADM_${Date.now()}`;
    const loginEmail = `login_${Date.now()}@mtti.ac.ke`;
    const traineePassword = "LoginPass@2026!";

    beforeAll(async () => {
      const hash = await bcrypt.hash(traineePassword, 10);
      await createUser({
        admission_number: loginAdm,
        phone_number: "+254700112233",
        full_name: "Faith Mwende",
        email: loginEmail,
        password_hash: hash,
        role: "TRAINEE",
      });
    });

    it("should reject login without identifier or password (HTTP 400)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("required");
    });

    it("should reject login with wrong password (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginAdm,
          password: "WrongPassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid credentials");
    });

    it("should reject login with non-existent user identifier (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "NON_EXISTENT_USER_ID",
          password: "AnyPassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid credentials");
    });

    it("should authenticate trainee using admission number and return signed JWT (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginAdm,
          password: traineePassword,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe("string");
      expect(data.token.split(".").length).toBe(3); // Valid 3-part JWT
      expect(data.user.admission_number).toBe(loginAdm);
      expect(data.user.role).toBe("TRAINEE");
    });

    it("should authenticate trainee using email address and return signed JWT (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginEmail,
          password: traineePassword,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe(loginEmail);
      expect(data.user.role).toBe("TRAINEE");
    });

    it("should authenticate staff using institutional email address (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "admin@mtti.ac.ke",
          password: "Mtti@2026!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe("admin@mtti.ac.ke");
      expect(data.user.role).toBe("ADMIN");
    });
  });

  // ─── 4. ROLE PROTECTION MIDDLEWARE (server/middleware/auth.ts) ─────────────
  describe("4. Role Protection Middleware (server/middleware/auth.ts)", () => {
    let traineeToken: string;
    let adminToken: string;
    let trainerToken: string;

    beforeAll(async () => {
      // 1. Get Trainee Token
      const adm = `RBAC_TR_${Date.now()}`;
      const hash = await bcrypt.hash("Pass123!", 10);
      await createUser({
        admission_number: adm,
        full_name: "RBAC Trainee",
        email: `rbac_tr_${Date.now()}@mtti.ac.ke`,
        password_hash: hash,
        role: "TRAINEE",
      });

      const trRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: adm, password: "Pass123!" }),
      });
      const trData = await trRes.json();
      traineeToken = trData.token;

      // 2. Get Admin Token
      const admRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "admin@mtti.ac.ke", password: "Mtti@2026!" }),
      });
      const admData = await admRes.json();
      adminToken = admData.token;

      // 3. Get Trainer Token
      const tnRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "trainer@mtti.ac.ke", password: "Mtti@2026!" }),
      });
      const tnData = await tnRes.json();
      trainerToken = tnData.token;
    });

    it("should reject requests without authorization token on protected routes (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/protected/trainee-only`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should reject requests with invalid or tampered JWT token (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/protected/trainee-only`, {
        headers: { Authorization: "Bearer invalid.tampered.token" },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should allow trainee access to trainee-only routes (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/protected/trainee-only`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should block trainee from accessing staff-only routes (HTTP 403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/protected/staff-only`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    it("should allow admin access to staff-only routes (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/protected/staff-only`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should block trainer from accessing admin/hod-only routes (HTTP 403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/protected/staff-only`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    it("should allow trainer access to trainer-only routes (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/protected/trainer-only`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
