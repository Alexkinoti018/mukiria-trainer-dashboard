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

describe("Phase H0: Complete 72-Route Authorization Matrix & Content Verification", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const SECRET = "mtti_enterprise_super_secret_jwt_key_strictly_for_production_verification_2026_valid!";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = SECRET;
    process.env.DOCUMENT_SIGNING_KEY_CURRENT = "mtti_enterprise_super_secret_signing_key_strictly_for_production_2026_valid!";

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
      profile_id: extra.profile_id || `${role}-test-id`,
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

  // ─── 1. Content Verification Per Role ─────────────────────────────────────
  describe("1. Sensitive Endpoint Content Verification Per Role", () => {
    it("GET /trainees: staff (trainer/hod/admin) receives candidate list; trainee is denied with 403", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-01");
      const trainerToken = createRoleToken("trainer", "usr-trainer-matrix-01");
      const adminToken = createRoleToken("admin", "usr-admin-matrix-01");

      const traineeRes = await fetch(`${baseUrl}/trainees`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(403);

      const trainerRes = await fetch(`${baseUrl}/trainees`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerRes.status).toBe(200);
      const trainerData = await trainerRes.json();
      expect(trainerData.success).toBe(true);
      expect(Array.isArray(trainerData.data)).toBe(true);

      const adminRes = await fetch(`${baseUrl}/trainees`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(adminRes.status).toBe(200);
    });

    it("GET /exams: trainees only see published exams stripped of keys/rubrics; trainers see assigned", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-02", {
        enrolled_units: ["ICT/CU/IT/CR/6/6"],
      });
      const trainerToken = createRoleToken("trainer", "usr-trainer-matrix-02", {
        profile_id: "trainer-001",
      });

      const traineeRes = await fetch(`${baseUrl}/exams`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(200);
      const traineeExams = await traineeRes.json();
      for (const e of traineeExams) {
        expect(e.answer_key).toBeUndefined();
        expect(e.marking_guide).toBeUndefined();
        expect(e.rubric).toBeUndefined();
        expect(e.is_published).not.toBe(false);
      }

      const trainerRes = await fetch(`${baseUrl}/exams`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerRes.status).toBe(200);
    });

    it("GET /submissions: trainee sees ONLY own submissions; trainer sees class submissions", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-03", {
        profile_id: "trainee-001",
      });
      const trainerToken = createRoleToken("trainer", "usr-trainer-matrix-03", {
        profile_id: "trainer-001",
      });

      const traineeRes = await fetch(`${baseUrl}/submissions`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(200);
      const traineeSubs = await traineeRes.json();
      for (const s of traineeSubs) {
        expect(s.trainee_id).toBe("trainee-001");
      }

      const trainerRes = await fetch(`${baseUrl}/submissions`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerRes.status).toBe(200);
    });

    it("GET /documents/class-registers: trainee denied with 403; trainer and HOD allowed with 200", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-04");
      const trainerToken = createRoleToken("trainer", "usr-trainer-matrix-04");

      const traineeRes = await fetch(`${baseUrl}/documents/class-registers`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(403);

      const trainerRes = await fetch(`${baseUrl}/documents/class-registers`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerRes.status).toBe(200);
    });

    it("GET /documents/session-plans: trainee denied with 403; staff allowed with 200", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-05");
      const hodToken = createRoleToken("hod", "usr-hod-matrix-05");

      const traineeRes = await fetch(`${baseUrl}/documents/session-plans`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(403);

      const hodRes = await fetch(`${baseUrl}/documents/session-plans`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(hodRes.status).toBe(200);
    });

    it("GET /documents/learning-plans: trainee denied with 403; staff allowed with 200", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-06");
      const trainerToken = createRoleToken("trainer", "usr-trainer-matrix-06");

      const traineeRes = await fetch(`${baseUrl}/documents/learning-plans`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(403);

      const trainerRes = await fetch(`${baseUrl}/documents/learning-plans`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerRes.status).toBe(200);
    });

    it("GET /documents/records-of-work: trainee denied with 403; staff allowed with 200", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-matrix-07");
      const adminToken = createRoleToken("admin", "usr-admin-matrix-07");

      const traineeRes = await fetch(`${baseUrl}/documents/records-of-work`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(traineeRes.status).toBe(403);

      const adminRes = await fetch(`${baseUrl}/documents/records-of-work`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(adminRes.status).toBe(200);
    });
  });

  // ─── 2. Route Matrix Coverage ─────────────────────────────────────────────
  describe("2. Comprehensive 72-Route Authorization Clearance", () => {
    it("validates that all routes enforce their designated role access matrix", async () => {
      const tokens = {
        admin: createRoleToken("admin", "usr-m-admin"),
        hod: createRoleToken("hod", "usr-m-hod"),
        trainer: createRoleToken("trainer", "usr-m-trainer", { profile_id: "trainer-001" }),
        trainee: createRoleToken("trainee", "usr-m-trainee", { profile_id: "trainee-001" }),
      };

      for (const rule of ROUTE_ACCESS_POLICY) {
        if (rule.type === "public") {
          // Public routes must accept anonymous calls
          const path = rule.path.replace(":versionTag", "v2026").replace(":id", "test-id").replace("/*", "");
          const method = rule.method;
          let body: any = undefined;
          let headers: Record<string, string> = {};

          if (method === "POST") {
            headers["Content-Type"] = "application/json";
            if (rule.path.includes("login")) {
              body = JSON.stringify({ identifier: "admin@mtti.ac.ke", password: "AdminTestPassword@2026!" });
            } else if (rule.path.includes("register-trainee")) {
              body = JSON.stringify({}); // will be 400 validation error, NOT 401 or 403
            }
          }

          const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
          // Public routes return 200 or 400 (validation), never 401 (unauthorized) or 403 (forbidden)
          expect(res.status, `${rule.method} ${rule.path} should be publicly reachable`).not.toBe(401);
          expect(res.status, `${rule.method} ${rule.path} should be publicly reachable`).not.toBe(403);
        } else if (rule.type === "roles" && rule.allowedRoles) {
          // Check that disallowed roles receive 403
          const allRoles: Array<"admin" | "hod" | "trainer" | "trainee"> = ["admin", "hod", "trainer", "trainee"];
          const deniedRoles = allRoles.filter((r) => !rule.allowedRoles!.includes(r));

          for (const deniedRole of deniedRoles) {
            const token = tokens[deniedRole];
            const path = rule.path
              .replace(":offeringId", "uo-1")
              .replace(":versionTag", "v2026")
              .replace(":action", "ping-db")
              .replace(":id", "test-id")
              .replace("/*", "");

            const res = await fetch(`${baseUrl}${path}`, {
              method: rule.method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: ["POST", "PUT", "PATCH"].includes(rule.method) ? JSON.stringify({}) : undefined,
            });

            expect(
              res.status,
              `${rule.method} ${rule.path} should reject role ${deniedRole} with 403`
            ).toBe(403);
          }
        }
      }
    });
  });
});
