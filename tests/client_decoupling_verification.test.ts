import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import { apiRouter } from "../server/routes.ts";
import { getJwtSecret, setCachedUserProfile } from "../server/auth.ts";

describe("Phase H0 - Step 2: Client Decoupling from Direct Supabase Writes", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  let trainerToken: string;
  let adminToken: string;
  let traineeToken: string;

  function createRoleToken(role: string, sub: string, extra: any = {}) {
    const userObj = {
      id: sub,
      profile_id: extra.profile_id || `${role}-test-id`,
      email: `${role}@mtti.ac.ke`,
      name: `Test ${role}`,
      role: role.toLowerCase(),
      department_id: extra.department_id || "dept-ci",
      admission_number: role === "trainee" ? (extra.admission_number || "14179/S2026") : undefined,
      reg_number: role === "trainee" ? (extra.reg_number || "14179/S2026") : undefined,
      assigned_units: extra.assigned_units || ["ICT/CU/IT/CR/6/6", "061155101A", "uo-1"],
      enrolled_units: extra.enrolled_units || ["ICT/CU/IT/CR/6/6", "061155101A", "uo-1"],
      ...extra,
    };
    setCachedUserProfile(sub, userObj as any);

    return jwt.sign(
      { sub, role: role.toLowerCase(), iss: "mtti-api", aud: "mtti-web", exp: Math.floor(Date.now() / 1000) + 3600 },
      getJwtSecret(),
      { algorithm: "HS256" }
    );
  }

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-mukiria-2026";
    process.env.DOCUMENT_SIGNING_KEY_CURRENT = "mtti_enterprise_super_secret_signing_key_strictly_for_production_2026_valid!";

    trainerToken = createRoleToken("trainer", "usr-trainer-decouple-01", {
      profile_id: "trainer-001",
    });

    adminToken = createRoleToken("admin", "usr-admin-decouple-01", {
      profile_id: "usr-admin-001",
    });

    traineeToken = createRoleToken("trainee", "usr-trainee-decouple-01", {
      profile_id: "trainee-001",
      admission_number: "23501",
      reg_number: "23501",
    });

    app = express();
    app.set("trust proxy", 1);
    app.use(express.json());
    app.use("/api", apiRouter);

    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}/api`;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe("1. Static Codebase Audit: Zero Direct Supabase Mutations in Client", () => {
    it("should confirm 0 occurrences of direct supabase table mutations in client/src", () => {
      const clientSrcDir = path.resolve(__dirname, "../client/src");

      function findFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            findFiles(filePath, fileList);
          } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
            fileList.push(filePath);
          }
        }
        return fileList;
      }

      const allFiles = findFiles(clientSrcDir);
      expect(allFiles.length).toBeGreaterThan(20);

      const violatingFiles: { file: string; line: number; match: string }[] = [];
      const mutationPattern = /supabase(\s+as\s+any)?\s*\.\s*from\([^)]+\)\s*\.\s*(insert|update|upsert|delete)\(/;

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (mutationPattern.test(line)) {
            violatingFiles.push({
              file: path.relative(clientSrcDir, filePath),
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violatingFiles).toEqual([]);
    });

    it("should confirm 0 occurrences of direct supabase storage bucket mutations in client/src", () => {
      const clientSrcDir = path.resolve(__dirname, "../client/src");

      function findFiles(dir: string, fileList: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            findFiles(filePath, fileList);
          } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
            fileList.push(filePath);
          }
        }
        return fileList;
      }

      const allFiles = findFiles(clientSrcDir);
      const violatingFiles: { file: string; line: number; match: string }[] = [];
      const storagePattern = /supabase\s*\.\s*storage\s*\.\s*from\([^)]+\)\s*\.\s*(upload|remove|update)\(/;

      for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (storagePattern.test(line)) {
            violatingFiles.push({
              file: path.relative(clientSrcDir, filePath),
              line: idx + 1,
              match: line.trim(),
            });
          }
        });
      }

      expect(violatingFiles).toEqual([]);
    });
  });

  describe("2. Decoupled Backend Write Endpoints Verification", () => {
    it("POST /api/marks/batch accepts batch assessment marks with Bearer authentication", async () => {
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          unitOfferingId: "uo-2",
          marks: [
            {
              traineeId: "trainee-001",
              cpScore: 78,
              ctScore: 72,
              finalScore: 75,
              isLocked: false,
            },
          ],
        }),
      });

      expect([200, 201]).toContain(res.status);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("POST /api/attendance/bulk persists session attendance with Bearer authentication", async () => {
      const res = await fetch(`${baseUrl}/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          class_code: "DICT/2026/J",
          session_plan_id: "plan-test-001",
          records: [
            {
              unit_offering_id: "uo-1",
              trainee_id: "trainee-001",
              week_number: 1,
              status: "present",
              hours_attended: 2.0,
            },
          ],
        }),
      });

      expect([200, 201]).toContain(res.status);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("POST /api/documents/session-plans/batch and DELETE /api/documents/session-plans/:id operate authoritatively", async () => {
      const testPlanId = `plan-authed-${Date.now()}`;
      const saveRes = await fetch(`${baseUrl}/documents/session-plans/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          session_plans: [
            {
              id: testPlanId,
              unit_offering_id: "uo-1",
              class_code: "DICT/2026/J",
              trainer_id: "trainer-001",
              date: "2026-11-16",
              session_title: "Database Indexing & Architecture",
              approval_status: "pending",
            },
          ],
        }),
      });

      expect(saveRes.status).toBe(200);

      // Verify deletion endpoint works
      const deleteRes = await fetch(`${baseUrl}/documents/session-plans/${testPlanId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
        },
      });

      expect(deleteRes.status).toBe(200);
      const delBody = await deleteRes.json();
      expect(delBody.success).toBe(true);
    });

    it("POST /api/documents/records-of-work/batch persists records of work with Bearer authentication", async () => {
      const res = await fetch(`${baseUrl}/documents/records-of-work/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          records_of_work: [
            {
              id: `row-${Date.now()}`,
              session_plan_id: "plan-test-001",
              unit_offering_id: "uo-1",
              class_code: "DICT/2026/J",
              work_actually_covered: "Network topology implementation",
              date_delivered: "2026-11-16",
              trainees_present: 24,
              hours_covered: 2.5,
              approval_status: "pending",
            },
          ],
        }),
      });

      expect([200, 201]).toContain(res.status);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it("POST /api/trainees/batch persists roster candidates under Admin authority", async () => {
      const res = await fetch(`${baseUrl}/trainees/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          cohortCode: "DICT/2026/J",
          trainees: [
            {
              admissionNumber: "99901",
              fullName: "Batch Candidate One",
              email: "cand1@test.mtti.ac.ke",
              phone: "0711000111",
              cohortCode: "DICT/2026/J",
            },
          ],
        }),
      });

      expect([200, 201]).toContain(res.status);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
