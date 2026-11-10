import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter, DB } from "../server/routes";
import { loginAs } from "./test_auth_helpers";
import {
  loadPersistentUsers,
  savePersistentUsers,
  removeInMemoryStaffProfile,
} from "../server/db";

let server: Server;
let baseUrl: string;
const createdUserIds: string[] = [];
const createdProfileIds: string[] = [];

beforeAll(async () => {
  process.env.ALLOW_DEMO_AUTH = "true";
  const app = express();
  app.use(express.json());
  app.use("/api", apiRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = (server.address() as AddressInfo).port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

afterAll(async () => {
  // Clean up any test users created during the run
  if (createdUserIds.length > 0) {
    const users = loadPersistentUsers();
    savePersistentUsers(users.filter((u) => !createdUserIds.includes(u.id)));
  }
  for (const pid of createdProfileIds) {
    removeInMemoryStaffProfile(pid);
    const trIdx = DB.trainers.findIndex((t) => t.id === pid);
    if (trIdx >= 0) DB.trainers.splice(trIdx, 1);
  }

  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe("Admin Staff Account Creation & End-to-End Operationality Suite", () => {
  describe("1. Admin Staff Creation Workflow (POST /api/admin/users)", () => {
    it("allows Admin to provision a new Trainer staff account with temporary password", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const testEmail = `trainer.operational.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Eng. Victor Maina",
          email: testEmail,
          phone: "+254 711 234 567",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.name).toBe("Eng. Victor Maina");
      expect(data.user.email).toBe(testEmail);
      expect(data.user.role).toBe("trainer");
      expect(data.user.department_id).toBe("dept-ci");
      expect(data.user.must_change_password).toBe(true);
      expect(typeof data.temporaryPassword).toBe("string");
      expect(data.temporaryPassword.length).toBeGreaterThan(10);

      // Verify no password_hash leaked
      expect((data.user as any).password_hash).toBeUndefined();

      createdUserIds.push(data.user.id);
      createdProfileIds.push(data.user.profile_id);
    });

    it("allows Admin to provision a new Head of Department (HOD) staff account", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const testEmail = `hod.operational.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Dr. Catherine Wanjiku",
          email: testEmail,
          phone: "+254 722 987 654",
          role: "hod",
          department_id: "dept-ee",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.user.name).toBe("Dr. Catherine Wanjiku");
      expect(data.user.email).toBe(testEmail);
      expect(data.user.role).toBe("hod");
      expect(data.user.department_id).toBe("dept-ee");
      expect(data.user.must_change_password).toBe(true);

      createdUserIds.push(data.user.id);
      createdProfileIds.push(data.user.profile_id);
    });
  });

  describe("2. Trainer Account Operationality & Lifecycle", () => {
    let trainerEmail: string;
    let tempPass: string;
    let trainerToken: string;
    let trainerProfileId: string;
    const newPassword = "SecureTrainerPassword@2026!";

    beforeAll(async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      trainerEmail = `trainer.active.${Date.now()}@mtti.ac.ke`;

      const createRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Mr. Dennis Gitonga",
          email: trainerEmail,
          phone: "+254 733 456 789",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });

      const data = await createRes.json();
      tempPass = data.temporaryPassword;
      trainerProfileId = data.user.profile_id;
      createdUserIds.push(data.user.id);
      createdProfileIds.push(trainerProfileId);
    });

    it("allows the created Trainer to sign in using their work email and temporary password", async () => {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trainerEmail,
          password: tempPass,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();

      expect(loginData.token).toBeDefined();
      expect(loginData.user).toBeDefined();
      expect(loginData.user.email).toBe(trainerEmail);
      expect(loginData.user.role).toBe("trainer");
      expect(loginData.user.department_id).toBe("dept-ci");
      expect(loginData.user.must_change_password).toBe(true);

      trainerToken = loginData.token;
    });

    it("enforces first-login password change before permitting sensitive operations (HTTP 428)", async () => {
      // Sensitive operations like evidence or exam modifications require password change
      const blockedRes = await fetch(`${baseUrl}/evidence`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(blockedRes.status).toBe(428);
    });

    it("enables Trainer to change temporary password to a permanent secure password", async () => {
      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: tempPass,
          newPassword,
        }),
      });

      expect(changeRes.status).toBe(200);
      const changeData = await changeRes.json();
      expect(changeData.success).toBe(true);

      // Verify immediate login with the new permanent password
      const reLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trainerEmail,
          password: newPassword,
        }),
      });

      expect(reLoginRes.status).toBe(200);
      const reLoginData = await reLoginRes.json();
      expect(reLoginData.user.must_change_password).toBe(false);
      trainerToken = reLoginData.token;
    });

    it("confirms Trainer is fully operational across all pedagogical and academic document systems", async () => {
      // 1. Session Plans
      const spRes = await fetch(`${baseUrl}/documents/session-plans`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(spRes.status).toBe(200);
      const spData = await spRes.json();
      expect(spData.success).toBe(true);
      expect(Array.isArray(spData.session_plans)).toBe(true);

      // 2. Learning Plans
      const lpRes = await fetch(`${baseUrl}/documents/learning-plans`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(lpRes.status).toBe(200);
      const lpData = await lpRes.json();
      expect(lpData.success).toBe(true);
      expect(Array.isArray(lpData.learning_plans)).toBe(true);

      // 3. Records of Work
      const rowRes = await fetch(`${baseUrl}/documents/records-of-work`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(rowRes.status).toBe(200);
      const rowData = await rowRes.json();
      expect(rowData.success).toBe(true);
      expect(Array.isArray(rowData.records_of_work)).toBe(true);

      // 4. Class Registers
      const crRes = await fetch(`${baseUrl}/documents/class-registers?class_code=ADMIN5/6/J/26 MOD 3`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(crRes.status).toBe(200);
      const crData = await crRes.json();
      expect(crData.success).toBe(true);

      // 5. Batch session plan upsert capability
      const testPlan = {
        id: `sp-operational-${Date.now()}`,
        unit_offering_id: "uo-operational-1",
        class_code: "ADMIN5/6/J/26 MOD 3",
        trainer_id: trainerProfileId,
        session_title: "Operational Session Plan Verification",
        approval_status: "pending",
        date: "2026-11-10",
      };

      const batchRes = await fetch(`${baseUrl}/documents/session-plans/batch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_plans: [testPlan] }),
      });
      expect(batchRes.status).toBe(200);
      const batchData = await batchRes.json();
      expect(batchData.success).toBe(true);
    });
  });

  describe("3. Head of Department (HOD) Account Operationality & Lifecycle", () => {
    let hodEmail: string;
    let tempPass: string;
    let hodToken: string;
    const newPassword = "SecureHODPassword@2026!";

    beforeAll(async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      hodEmail = `hod.operational.ee.${Date.now()}@mtti.ac.ke`;

      const createRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Eng. Samuel Kiptoo",
          email: hodEmail,
          phone: "+254 700 112 233",
          role: "hod",
          department_id: "dept-ee",
        }),
      });

      const data = await createRes.json();
      tempPass = data.temporaryPassword;
      createdUserIds.push(data.user.id);
      createdProfileIds.push(data.user.profile_id);
    });

    it("allows the created HOD to sign in, reset password, and become fully operational", async () => {
      // 1. Login with temporary password
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: hodEmail, password: tempPass }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.user.role).toBe("hod");
      expect(loginData.user.department_id).toBe("dept-ee");

      // 2. Change password
      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${loginData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: tempPass,
          newPassword,
        }),
      });
      expect(changeRes.status).toBe(200);

      // 3. Re-login with new password
      const reLogin = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: hodEmail, password: newPassword }),
      });
      expect(reLogin.status).toBe(200);
      const activeData = await reLogin.json();
      hodToken = activeData.token;
      expect(activeData.user.must_change_password).toBe(false);

      // 4. Departmental Overview Operations
      const overviewRes = await fetch(`${baseUrl}/hod/overview`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(overviewRes.status).toBe(200);
      const overviewData = await overviewRes.json();
      expect(overviewData.success).toBe(true);
      expect(overviewData.department_id).toBe("dept-ee");
      expect(Array.isArray(overviewData.session_plans)).toBe(true);
      expect(Array.isArray(overviewData.record_of_work)).toBe(true);

      // 5. Pedagogical Quality Review & Sign-Off Operations
      const signOffRes = await fetch(`${baseUrl}/hod/sign-off`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "record_of_work",
          recordId: "row-ee-001",
          status: "approved",
          remarks: "Endorsed syllabus coverage and lab practical hours for Electrical department.",
        }),
      });
      expect(signOffRes.status).toBe(200);
      const signOffData = await signOffRes.json();
      expect(signOffData.success).toBe(true);
      expect(signOffData.record.approval_status).toBe("approved");
    });
  });

  describe("4. Fail-Closed Security & Access Control Guardrails", () => {
    it("rejects non-admin users (e.g. Trainer or Trainee) from creating staff accounts (HTTP 403)", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");
      const { token: traineeToken } = await loginAs(baseUrl, "trainee");

      // Trainer attempt
      const trainerAttempt = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Staff",
          email: "unauth@mtti.ac.ke",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });
      expect(trainerAttempt.status).toBe(403);

      // Trainee attempt
      const traineeAttempt = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${traineeToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Trainee Staff",
          email: "unauth2@mtti.ac.ke",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });
      expect(traineeAttempt.status).toBe(403);
    });

    it("rejects staff creation with an already registered email address (HTTP 409)", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");

      const dupRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Duplicate Trainer",
          email: "trainer@mtti.ac.ke", // Already exists
          role: "trainer",
          department_id: "dept-ci",
        }),
      });
      expect(dupRes.status).toBe(409);
    });

    it("rejects staff creation with an invalid department (HTTP 400)", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");

      const invalidDeptRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Invalid Dept Staff",
          email: `invalid.dept.${Date.now()}@mtti.ac.ke`,
          role: "trainer",
          department_id: "non-existent-dept-id",
        }),
      });
      expect(invalidDeptRes.status).toBe(400);
    });
  });
});
