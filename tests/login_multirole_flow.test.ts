import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import { apiRouter } from "../server/routes.ts";
import {
  findUserByEmail,
  findUserByAdmissionNumber,
  createUser,
  loadPersistentUsers,
} from "../server/db.ts";

describe("Secure Multi-Role Login & Authentication Flow Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
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

  // ─── 1. TRAINEE ZERO-EMAIL AUTHENTICATION ──────────────────────────────────
  describe("1. Trainee Login via Admission Number (Zero-Email Rule)", () => {
    const testAdmNo = "14179/S2026";
    const testPassword = "TraineePass@2026!";

    beforeAll(async () => {
      const hash = await bcrypt.hash(testPassword, 10);
      await createUser({
        admission_number: testAdmNo,
        full_name: "Nthiga Gakii Doris",
        email: "nthiga.gakii@mtti.ac.ke",
        password_hash: hash,
        role: "TRAINEE",
      });
    });

    it("should authenticate trainee using Admission Number strictly without email (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: testAdmNo,
          password: testPassword,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe("string");
      expect(data.user.admission_number).toBe(testAdmNo);
      expect(data.user.role).toBe("TRAINEE");

      // Verify destination mapping for Trainee is /trainee/exam
      const targetDestination = data.user.role.toLowerCase() === "trainee" ? "/trainee/exam" : "/trainer/dashboard";
      expect(targetDestination).toBe("/trainee/exam");
    });

    it("should authenticate trainee using TVET national format (e.g., D/UPNUT/25042/069)", async () => {
      const tvetAdm = "D/UPNUT/25042/069";
      const hash = await bcrypt.hash("TvetPass@2026!", 10);
      await createUser({
        admission_number: tvetAdm,
        full_name: "Eugene Murimi",
        email: "eugene.murimi@mtti.ac.ke",
        password_hash: hash,
        role: "TRAINEE",
      });

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: tvetAdm,
          password: "TvetPass@2026!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.admission_number).toBe(tvetAdm);
      expect(data.user.role).toBe("TRAINEE");
    });
  });

  // ─── 2. STAFF AUTHENTICATION VIA INSTITUTIONAL EMAIL ───────────────────────
  describe("2. Staff & Admin Login via Institutional Email", () => {
    it("should authenticate Admin via email and map destination to /admin/roster", async () => {
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
      expect(data.user.email).toBe("admin@mtti.ac.ke");
      expect(data.user.role).toBe("ADMIN");

      // Role-Based Redirection: Admins/HODs route to /admin/roster
      const targetDestination = ["admin", "hod"].includes(data.user.role.toLowerCase())
        ? "/admin/roster"
        : "/trainer/dashboard";
      expect(targetDestination).toBe("/admin/roster");
    });

    it("should authenticate HOD via email and map destination to /admin/roster", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "hod.ci@mtti.ac.ke",
          password: "Mtti@2026!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("hod.ci@mtti.ac.ke");
      expect(data.user.role).toBe("HOD");

      const targetDestination = ["admin", "hod"].includes(data.user.role.toLowerCase())
        ? "/admin/roster"
        : "/trainer/dashboard";
      expect(targetDestination).toBe("/admin/roster");
    });

    it("should authenticate Trainer via email and map destination to /trainer/dashboard", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "trainer@mtti.ac.ke",
          password: "Mtti@2026!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("trainer@mtti.ac.ke");
      expect(data.user.role).toBe("TRAINER");

      const targetDestination = data.user.role.toLowerCase() === "trainer"
        ? "/trainer/dashboard"
        : "/admin/roster";
      expect(targetDestination).toBe("/trainer/dashboard");
    });
  });

  // ─── 3. TRAINEE SIGN UP & INSTANT AUTHENTICATION ───────────────────────────
  describe("3. Trainee Sign Up (POST /api/auth/register-trainee)", () => {
    it("should register new trainee with salted bcrypt hash and allow immediate login", async () => {
      const newAdm = `ADM_${Date.now()}`;
      const newEmail = `trainee_${Date.now()}@mtti.ac.ke`;
      const pass = "NewTraineeSecure@2026";

      // 1. Register Trainee
      const regRes = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Brendah Mumbi",
          admissionNumber: newAdm,
          phoneNumber: "+254711223344",
          email: newEmail,
          password: pass,
        }),
      });

      expect(regRes.status).toBe(201);
      const regData = await regRes.json();
      expect(regData.success).toBe(true);
      expect(regData.user.role).toBe("TRAINEE");

      // Verify password was salted & hashed in the database
      const dbUser = await findUserByAdmissionNumber(newAdm);
      expect(dbUser?.password_hash).not.toBe(pass);
      expect(dbUser?.password_hash).toMatch(/^\$2[aby]\$\d+\$/);

      // 2. Immediately Login using the Admission Number
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: newAdm,
          password: pass,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toBeDefined();
      expect(loginData.user.admission_number).toBe(newAdm);
      expect(loginData.user.role).toBe("TRAINEE");
    });
  });

  // ─── 4. SECURITY & ERROR RESILIENCE ─────────────────────────────────────────
  describe("4. Security Safeguards & Error Resilience", () => {
    it("should reject login with invalid password (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "admin@mtti.ac.ke",
          password: "CompletelyWrongPassword!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid credentials");
    });

    it("should reject login with non-existent admission number (HTTP 401)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "NON_EXISTENT_ADM_99999",
          password: "SomePassword123!",
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Invalid credentials");
    });
  });
});
