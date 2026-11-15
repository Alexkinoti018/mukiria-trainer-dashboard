import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter, getJwtSecret, DB } from "../server/routes.ts";
import { setCachedUserProfile } from "../server/auth.ts";
import {
  ROUTE_ACCESS_POLICY,
  isPublicRoute,
  type RouteAccessRule,
} from "../server/accessPolicy.ts";

describe("Phase H0: Single-Source-of-Truth Access Policy & BOLA Enforcement", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const TEST_SECRET = "mtti_enterprise_super_secret_jwt_key_strictly_for_production_verification_2026_valid!";

  beforeAll(async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = TEST_SECRET;

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

  function createRoleToken(role: string, sub: string, extra: any = {}) {
    const userObj = {
      id: sub,
      profile_id: extra.profile_id || `${role}-test-profile`,
      email: `${role}@mtti.ac.ke`,
      name: `Test ${role}`,
      role: role.toLowerCase(),
      department_id: extra.department_id || "dept-ci",
      admission_number: role === "trainee" ? (extra.admission_number || "14179/S2026") : undefined,
      reg_number: role === "trainee" ? (extra.reg_number || "14179/S2026") : undefined,
      assigned_units: extra.assigned_units || ["ICT/CU/IT/CR/6/6", "061155101A"],
      enrolled_units: extra.enrolled_units || ["ICT/CU/IT/CR/6/6", "061155101A"],
      ...extra,
    };
    setCachedUserProfile(sub, userObj as any);

    return jwt.sign(
      { sub, role: role.toLowerCase(), iss: "mtti-api", aud: "mtti-web", exp: Math.floor(Date.now() / 1000) + 3600 },
      getJwtSecret(),
      { algorithm: "HS256" }
    );
  }

  // ─── 1. Access Policy Parity ──────────────────────────────────────────────
  describe("1. Access Policy Table Parity", () => {
    it("ensures all 72 API routes are defined in the access policy", () => {
      expect(ROUTE_ACCESS_POLICY.length).toBe(72);
      const publicRules = ROUTE_ACCESS_POLICY.filter((r) => r.type === "public");
      expect(publicRules.length).toBe(7);
      expect(publicRules.map((r) => `${r.method} ${r.path}`)).toEqual([
        "GET /health",
        "GET /verify-document",
        "POST /auth/register-trainee",
        "POST /auth/login",
        "GET /trainees/lookup",
        "GET /compliance/rulesets",
        "GET /compliance/rulesets/:versionTag",
      ]);
    });

    it("verifies public routes are correctly resolved by isPublicRoute", () => {
      expect(isPublicRoute("GET", "/health")).toBe(true);
      expect(isPublicRoute("GET", "/verify-document")).toBe(true);
      expect(isPublicRoute("POST", "/auth/login")).toBe(true);
      expect(isPublicRoute("POST", "/auth/register-trainee")).toBe(true);
      expect(isPublicRoute("GET", "/trainees/lookup")).toBe(true);
      expect(isPublicRoute("GET", "/compliance/rulesets")).toBe(true);
      expect(isPublicRoute("GET", "/compliance/rulesets/v2026")).toBe(true);

      // Sensitive routes MUST NOT be public
      expect(isPublicRoute("GET", "/trainees")).toBe(false);
      expect(isPublicRoute("POST", "/documents/sign")).toBe(false);
      expect(isPublicRoute("POST", "/marks/batch")).toBe(false);
      expect(isPublicRoute("GET", "/admin/overview")).toBe(false);
    });
  });

  // ─── 2. BOLA & Scoped-in-Handler Tests ─────────────────────────────────────
  describe("2. BOLA & Scoped Handler Verifications", () => {
    it("PUT /trainees/:id blocks trainer from editing a trainee in an unassigned class (BOLA Defense)", async () => {
      // trainer-002 Alexander Kinoti is assigned to "ICT/OS/IT/CR/1/6" in CI, not EE
      const trainerToken = createRoleToken("trainer", "usr-trainer-bola-01", {
        profile_id: "trainer-002",
        assigned_units: ["ICT/OS/IT/CR/1/6"],
      });

      // Target trainee-003 is in "class-ee-4" (Electrical Engineering)
      const res = await fetch(`${baseUrl}/trainees/trainee-003`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          name: "Attacked Trainee Name",
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Trainers may only edit candidates in their assigned classes");
    });

    it("GET /exams shields answer keys and hides draft exams for trainees", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-bola-01", {
        enrolled_units: ["ICT/CU/IT/CR/6/6"],
      });

      const res = await fetch(`${baseUrl}/exams`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });

      expect(res.status).toBe(200);
      const exams = await res.json();
      expect(Array.isArray(exams)).toBe(true);

      // Verify no answer keys, marking guides, or rubrics leak to student
      for (const exam of exams) {
        expect(exam.answer_key).toBeUndefined();
        expect(exam.marking_guide).toBeUndefined();
        expect(exam.rubric).toBeUndefined();
        expect(exam.is_published).not.toBe(false);
      }
    });

    it("GET /submissions enforces BOLA: trainee only receives their own submissions", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-bola-02", {
        profile_id: "trainee-001",
      });

      const res = await fetch(`${baseUrl}/submissions`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });

      expect(res.status).toBe(200);
      const subs = await res.json();
      expect(Array.isArray(subs)).toBe(true);

      for (const sub of subs) {
        expect(sub.trainee_id).toBe("trainee-001");
      }
    });

    it("POST /marks/batch enforces BOLA: trainer cannot write marks to an unassigned unit offering", async () => {
      // trainer-002 is not assigned to uo-1 (trainer-001 is assigned to uo-1)
      const trainerToken = createRoleToken("trainer", "usr-trainer-bola-02", {
        profile_id: "trainer-002",
      });

      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          unitOfferingId: "uo-1", // belongs to trainer-001
          marks: [{ traineeId: "trainee-001", cpScore: 85 }],
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });
  });
});
