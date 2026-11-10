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
  loadPersistentTrainees,
  savePersistentTrainees,
} from "../server/db";

let server: Server;
let baseUrl: string;
const createdUserIds: string[] = [];
const createdProfileIds: string[] = [];
const createdAdmissionNumbers: string[] = [];
const createdOfferingIds: string[] = [];

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
  // Cleanup test users
  if (createdUserIds.length > 0) {
    const users = loadPersistentUsers();
    savePersistentUsers(users.filter((u) => !createdUserIds.includes(u.id)));
  }
  // Cleanup test profiles
  for (const pid of createdProfileIds) {
    removeInMemoryStaffProfile(pid);
    const trIdx = DB.trainers.findIndex((t) => t.id === pid);
    if (trIdx >= 0) DB.trainers.splice(trIdx, 1);
  }
  // Cleanup test trainees
  if (createdAdmissionNumbers.length > 0) {
    const trainees = loadPersistentTrainees();
    savePersistentTrainees(
      trainees.filter(
        (t) =>
          !createdAdmissionNumbers.includes(
            (t.reg_number || t.adm_no || "").trim().toUpperCase()
          )
      )
    );
    const dbTrainees = DB.trainees;
    for (const adm of createdAdmissionNumbers) {
      const idx = dbTrainees.findIndex(
        (t) => (t.reg_number || "").trim().toUpperCase() === adm.toUpperCase()
      );
      if (idx >= 0) dbTrainees.splice(idx, 1);
    }
  }
  // Cleanup test unit offerings
  for (const oid of createdOfferingIds) {
    const idx = DB.unit_offerings.findIndex((uo) => uo.id === oid);
    if (idx >= 0) DB.unit_offerings.splice(idx, 1);
  }

  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe("HOD & Admin Comprehensive Academic Governance & Authority Suite", () => {
  // ─── 1. STAFF ACCOUNT CREATION ──────────────────────────────────────────
  describe("1. Staff Account Creation Authority", () => {
    it("allows Admin to provision Trainer and HOD staff across any department", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const testEmail = `trainer.admin.gov.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/academic/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Mr. Geoffrey Omondi",
          email: testEmail,
          phone: "+254 712 345 678",
          role: "trainer",
          department_id: "dept-bce", // Admin can create in any department
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe("trainer");
      expect(data.user.department_id).toBe("dept-bce");
      expect(typeof data.temporaryPassword).toBe("string");

      createdUserIds.push(data.user.id);
      createdProfileIds.push(data.user.profile_id);
    });

    it("allows HOD to create Trainer staff within HOD's own department (dept-ci)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const testEmail = `trainer.hod.gov.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/hod/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Ms. Faith Mwende",
          email: testEmail,
          phone: "+254 722 111 222",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe("trainer");
      expect(data.user.department_id).toBe("dept-ci");
      expect(typeof data.temporaryPassword).toBe("string");

      createdUserIds.push(data.user.id);
      createdProfileIds.push(data.user.profile_id);
    });

    it("strictly rejects HOD from creating staff in a different department (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const testEmail = `trainer.cross.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/hod/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Intruder Staff",
          email: testEmail,
          role: "trainer",
          department_id: "dept-ee", // HOD is in dept-ci
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/department/i);
    });

    it("strictly rejects HOD from creating another HOD or Admin (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const testEmail = `hod.duplicate.${Date.now()}@mtti.ac.ke`;

      const res = await fetch(`${baseUrl}/hod/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Peer HOD Attempt",
          email: testEmail,
          role: "hod",
          department_id: "dept-ci",
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/only create trainer/i);
    });
  });

  // ─── 2. TRAINEE ACCOUNT PROVISIONING ────────────────────────────────────
  describe("2. Trainee Account Provisioning & Operational Login", () => {
    const testAdmNo = `ADM-TEST-${Date.now().toString().slice(-6)}`;
    let testTraineePassword = "";

    it("allows HOD to provision a new Trainee account in their department", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/trainees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Kelvin Mutua",
          adm_no: testAdmNo,
          class_code: "ICT4 MOD/S/2026",
          department_id: "dept-ci",
          phone: "+254 700 987 654",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.admission_number).toBe(testAdmNo);
      expect(data.user.role).toBe("trainee");
      expect(data.user.department_id).toBe("dept-ci");
      expect(typeof data.temporaryPassword).toBe("string");

      testTraineePassword = data.temporaryPassword;
      createdUserIds.push(data.user.id);
      createdAdmissionNumbers.push(testAdmNo);
    });

    it("verifies the provisioned Trainee can immediately log in with admission number and temporary password", async () => {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: testAdmNo,
          password: testTraineePassword,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.token).toBeDefined();
      expect(loginData.user.admission_number).toBe(testAdmNo);
      expect(loginData.user.role).toBe("trainee");
      expect(loginData.user.must_change_password).toBe(true);
    });

    it("rejects HOD from provisioning trainee in another department (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/trainees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Cross Dept Trainee",
          adm_no: `ADM-CROSS-${Date.now().toString().slice(-4)}`,
          class_code: "EE 6 MOD/S/2026",
          department_id: "dept-ee", // HOD is in dept-ci
        }),
      });

      expect(res.status).toBe(403);
    });

    it("allows Admin to provision Trainee in any department", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const adminAdmNo = `ADM-ADM-${Date.now().toString().slice(-5)}`;

      const res = await fetch(`${baseUrl}/academic/trainees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Mercy Chelangat",
          adm_no: adminAdmNo,
          class_code: "EE 6 MOD/S/2026",
          department_id: "dept-ee",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.department_id).toBe("dept-ee");

      createdUserIds.push(data.user.id);
      createdAdmissionNumbers.push(adminAdmNo);
    });
  });

  // ─── 3. COHORT / CLASS MANAGEMENT ───────────────────────────────────────
  describe("3. Cohort / Class Management Authority", () => {
    const cohortCode = `COHORT-CI-${Date.now().toString().slice(-5)}`;

    it("allows HOD to create a cohort for their department", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/cohorts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: cohortCode,
          name: "Cloud Computing Technician Level 6",
          department_id: "dept-ci",
          level: "Level 6",
          term: "Term 3 2026",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.cohort.code).toBe(cohortCode);
      expect(data.cohort.department_id).toBe("dept-ci");
    });

    it("rejects HOD from creating a cohort for another department (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/cohorts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: `COHORT-EE-${Date.now()}`,
          name: "Electrical Power Level 6",
          department_id: "dept-ee",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("allows Admin to list all cohorts and HOD to list department cohorts", async () => {
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const adminRes = await fetch(`${baseUrl}/academic/cohorts`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(adminRes.status).toBe(200);
      const adminData = await adminRes.json();
      expect(adminData.cohorts.length).toBeGreaterThan(0);

      const hodRes = await fetch(`${baseUrl}/academic/cohorts`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(hodRes.status).toBe(200);
      const hodData = await hodRes.json();
      expect(hodData.cohorts.every((c: any) => c.department_id === "dept-ci")).toBe(true);
    });
  });

  // ─── 4. UNIT OF COMPETENCE ALLOCATION ───────────────────────────────────
  describe("4. Unit of Competence Allocation Authority", () => {
    let createdOfferingId = "";

    it("allows HOD to assign a Unit of Competence to a Trainer in their department", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/assign-unit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainer_id: "trainer-001",
          unit_code: "ICT/CU/CYBER/CR/01/6",
          unit_name: "Perform Cybersecurity Fundamentals",
          class_id: "class-itech-6",
          department_id: "dept-ci",
          term_id: "term-2026",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.unit_offering.unit_code).toBe("ICT/CU/CYBER/CR/01/6");
      expect(data.unit_offering.trainer_id).toBe("trainer-001");

      createdOfferingId = data.unit_offering.id;
      createdOfferingIds.push(createdOfferingId);

      // Verify trainer's assigned_units includes the new unit
      const trainer = DB.trainers.find((t) => t.id === "trainer-001");
      expect(trainer?.assigned_units).toContain("ICT/CU/CYBER/CR/01/6");
    });

    it("rejects HOD from assigning units to a department outside their own (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/assign-unit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainer_id: "trainer-001",
          unit_code: "EE/CU/POWER/01/6",
          class_id: "class-ee-4",
          department_id: "dept-ee", // HOD is dept-ci
        }),
      });

      expect(res.status).toBe(403);
    });

    it("allows Admin and HOD to query unit offerings", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/offerings`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.offerings.length).toBeGreaterThan(0);
      expect(data.offerings.some((uo: any) => uo.unit_code === "ICT/CU/CYBER/CR/01/6")).toBe(true);
    });

    it("allows HOD to revoke a unit assignment in their department", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/assign-unit/${createdOfferingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${hodToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(DB.unit_offerings.some((uo) => uo.id === createdOfferingId)).toBe(false);
    });
  });

  // ─── 5. ADMINISTRATIVE PASSWORD RESET ───────────────────────────────────
  describe("5. Administrative Password Reset Authority", () => {
    let resetTargetUserId = "";
    let newTempPassword = "";

    beforeAll(async () => {
      // Create a test trainee in dept-ci
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const adm = `ADM-RST-${Date.now().toString().slice(-5)}`;
      const res = await fetch(`${baseUrl}/academic/trainees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Reset Candidate",
          adm_no: adm,
          class_code: "class-itech-6",
          department_id: "dept-ci",
        }),
      });
      const data = await res.json();
      resetTargetUserId = data.user.id;
      createdUserIds.push(resetTargetUserId);
      createdAdmissionNumbers.push(adm);
    });

    it("allows HOD to reset credentials for a departmental trainee", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");

      const res = await fetch(`${baseUrl}/academic/users/${resetTargetUserId}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${hodToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.temporaryPassword).toBe("string");
      expect(data.temporaryPassword.length).toBeGreaterThan(8);

      newTempPassword = data.temporaryPassword;
    });

    it("verifies user can immediately log in with the reset temporary password", async () => {
      const users = loadPersistentUsers();
      const user = users.find((u) => u.id === resetTargetUserId);
      expect(user).toBeDefined();

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: user!.admission_number,
          password: newTempPassword,
        }),
      });

      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.user.must_change_password).toBe(true);
    });

    it("rejects HOD from resetting password of an Admin or another HOD (HTTP 403)", async () => {
      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const users = loadPersistentUsers();
      const adminUser = users.find((u) => String(u.role).toUpperCase() === "ADMIN");

      if (adminUser) {
        const res = await fetch(`${baseUrl}/academic/users/${adminUser.id}/reset-password`, {
          method: "POST",
          headers: { Authorization: `Bearer ${hodToken}` },
        });

        expect(res.status).toBe(403);
      }
    });
  });

  // ─── 6. TRAINER & TRAINEE SUBORDINATION (FAIL-CLOSED) ───────────────────
  describe("6. Trainer & Trainee Subordination (HTTP 403 Enforced)", () => {
    it("strictly blocks Trainer from creating staff accounts", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");

      const res = await fetch(`${baseUrl}/academic/staff`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Staff",
          email: "unauthorized@mtti.ac.ke",
          role: "trainer",
          department_id: "dept-ci",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("strictly blocks Trainer from provisioning trainee accounts", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");

      const res = await fetch(`${baseUrl}/academic/trainees`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Trainee",
          adm_no: "ADM-UNAUTH-01",
          class_code: "class-itech-6",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("strictly blocks Trainer from creating cohorts", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");

      const res = await fetch(`${baseUrl}/academic/cohorts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "COHORT-UNAUTH",
          name: "Unauthorized Cohort",
          department_id: "dept-ci",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("strictly blocks Trainer from assigning units to themselves or others", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");

      const res = await fetch(`${baseUrl}/academic/assign-unit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trainerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainer_id: "trainer-001",
          unit_code: "ICT/ROGUE/01",
          class_id: "class-itech-6",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("strictly blocks Trainee from accessing any academic governance route", async () => {
      const { token: traineeToken } = await loginAs(baseUrl, "trainee");

      const endpoints = [
        { url: `${baseUrl}/academic/staff`, method: "POST" },
        { url: `${baseUrl}/academic/trainees`, method: "POST" },
        { url: `${baseUrl}/academic/cohorts`, method: "POST" },
        { url: `${baseUrl}/academic/cohorts`, method: "GET" },
        { url: `${baseUrl}/academic/assign-unit`, method: "POST" },
        { url: `${baseUrl}/academic/users/usr-test/reset-password`, method: "POST" },
      ];

      for (const ep of endpoints) {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: {
            Authorization: `Bearer ${traineeToken}`,
            "Content-Type": "application/json",
          },
          body: ep.method === "POST" ? JSON.stringify({ test: true }) : undefined,
        });

        expect(res.status).toBe(403);
      }
    });
  });
});
