import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import { apiRouter } from "../server/routes.ts";
import { normalizeAdmissionNumber } from "../shared/const.ts";

describe("Roster-Verified Trainee Account Activation & Lookup Suite", () => {
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

  // ─── 1. ROSTER LOOKUP ENDPOINT (GET /api/trainees/lookup?admission_no=...) ────
  describe("1. Authoritative Roster Lookup Endpoint (GET /api/trainees/lookup)", () => {
    it("successfully looks up Level 6 Computing trainee by admission_no=14179/S2026", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=14179/S2026`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
      expect(data.classCode).toBe("ITECH 6 MODULAR/S/2026");
      expect(data.department).toBe("Computing & Informatics");

      // Verify Zero-Email Rule: strictly zero email properties
      expect(data.email).toBeUndefined();
      expect(data.student_email).toBeUndefined();
    });

    it("successfully looks up Land Surveying trainee by admission_no=D/UPNUT/25042/069", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=${encodeURIComponent("D/UPNUT/25042/069")}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("D/UPNUT/25042/069");
      expect(data.fullName).toBe("Harriet Mwendwa");
      expect(data.classCode).toBe("LS5/6/S/26");
      expect(data.department).toBe("Building & Civil Engineering");
    });

    it("successfully looks up Business Admin trainee by admission_no=13410", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=13410`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("13410");
      expect(data.fullName).toBe("RISPER MWENDE");
      expect(data.classCode).toBe("ADMIN5/6/J/26 MOD 3");
      expect(data.department).toBe("Business");
    });

    it("normalizes admission numbers with lowercase and whitespace variations via normalizeAdmissionNumber", async () => {
      const rawInput = "  itech 6 mod / 14179 / s2026  ";
      const normalized = normalizeAdmissionNumber(rawInput);
      expect(normalized).toBe("14179/S2026");

      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=${encodeURIComponent(rawInput)}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
    });

    it("returns HTTP 404 with descriptive error if admission number is not in institutional roster", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?admission_no=NON_EXISTENT_ADM_00000`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toContain("institutional roster");
    });

    it("returns HTTP 400 if admission number query parameter is missing", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("required");
    });

    it("maintains full backward compatibility with existing unitCode class register lookups", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=10525&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("10525");
      expect(data.fullName).toBe("Alex Kinoti");
    });
  });

  // ─── 2. ROSTER-VERIFIED ACTIVATION & REGISTRATION FLOW ────────────────────────
  describe("2. Trainee Account Activation Flow (POST /api/auth/register-trainee)", () => {
    const uniqueTimestamp = Date.now();
    const testAdmNo = `ACT_${uniqueTimestamp}`;
    const testEmail = `activate_${uniqueTimestamp}@mtti.ac.ke`;
    const plainPassword = "SecureTrainee@2026!";

    it("activates trainee account and stores bcrypt hash with enforced TRAINEE role", async () => {
      // Client-side bcrypt hashing simulation
      const salt = bcrypt.genSaltSync(10);
      const clientHashedPassword = bcrypt.hashSync(plainPassword, salt);

      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Brenda Mukiri Test",
          admissionNumber: testAdmNo,
          phoneNumber: "+254711223344",
          email: testEmail,
          password: clientHashedPassword,
          role: "ADMIN", // Attacker trying privilege escalation
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.admission_number).toBe(testAdmNo);
      // Strictly enforced role
      expect(data.user.role).toBe("TRAINEE");
      expect(data.user.password_hash).toBeUndefined(); // Zero plain-text / hash leak
    });

    it("allows the activated trainee to authenticate via POST /api/auth/login with plain password", async () => {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: testAdmNo,
          password: plainPassword,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.success).toBe(true);
      expect(loginData.token).toBeDefined();
      expect(loginData.user.role).toBe("TRAINEE");
      expect(loginData.user.admission_number).toBe(testAdmNo);
    });

    it("rejects duplicate registration of already-activated admission number (HTTP 409 Conflict)", async () => {
      const res = await fetch(`${baseUrl}/auth/register-trainee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Duplicate Candidate Attempt",
          admissionNumber: testAdmNo,
          phoneNumber: "+254799887766",
          email: `unique_${Date.now()}@mtti.ac.ke`,
          password: "AnotherPassword123!",
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already registered");
    });
  });
});

