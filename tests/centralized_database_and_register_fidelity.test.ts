import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter } from "../server/routes";
import {
  loadPersistentSessionPlans,
  savePersistentSessionPlans,
  loadPersistentLearningPlans,
  savePersistentLearningPlans,
  loadPersistentRecordsOfWork,
  savePersistentRecordsOfWork,
  loadPersistentClassRegisters,
  savePersistentClassRegisters,
} from "../server/db";
import { canonicalizeCohortCode } from "../client/src/lib/curriculumDatabase";
import { buildClassConfigsForTrainer } from "../client/src/lib/timetableSyncService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
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
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe("Centralized Physical Database & Register Fidelity Suite", () => {
  describe("Part 1: Cohort Code Canonicalization & Typo Elimination", () => {
    it("canonicalizes redundant subject prefixes from class codes", () => {
      expect(canonicalizeCohortCode("ICT SKILLS ADMIN5/6/J/26 MOD 3")).toBe("ADMIN5/6/J/26 MOD 3");
      expect(canonicalizeCohortCode("ICT SKILS 1 ADMIN4/5/6/S/ 26 MOD 1")).toBe("ADMIN4/5/6/S/26 MOD 1");
      expect(canonicalizeCohortCode("ICT SKILLS 1 ADMIN4/5/6/S/ 26 MOD 1")).toBe("ADMIN4/5/6/S/26 MOD 1");
      expect(canonicalizeCohortCode("ICT4/ITECH6/S/ 26 MOD 1")).toBe("ICT4/ITECH6/S/26 MOD 1");
    });

    it("builds dynamic class configs with canonicalized codes and clean unit titles", () => {
      const mockProfile = {
        id: "trainer-001",
        name: "Alexander Kinoti",
        email: "kinoti@mtti.ac.ke",
        phone: "+254 722 000 000",
        department: "Computing & Informatics",
        timetableTrainerId: "mr-alexander-kinoti",
        classes: [
          "FBS5/6/J/26",
          "ICT SKILLS ADMIN5/6/J/26 MOD 3",
          "ICT SKILS 1 ADMIN4/5/6/S/ 26 MOD 1",
          "ICT4/ITECH6/S/ 26 MOD 1",
          "LS5/6/S/26",
        ],
        units: ["DIGITAL LITERACY", "ICT SKILLS", "ICT SKILLS 1", "COMPUTER ESSENTIALS"],
      };

      const configs = buildClassConfigsForTrainer(mockProfile);
      expect(configs).toHaveLength(5);

      const admin3 = configs.find((c) => c.code === "ADMIN5/6/J/26 MOD 3");
      expect(admin3).toBeDefined();
      expect(admin3?.name).toBe("ADMIN5/6/J/26 MOD 3");
      expect(admin3?.department).toBe("Business Studies");

      const admin1 = configs.find((c) => c.code === "ADMIN4/5/6/S/26 MOD 1");
      expect(admin1).toBeDefined();
      expect(admin1?.name).toBe("ADMIN4/5/6/S/26 MOD 1");
      expect(admin1?.department).toBe("Business Studies");
    });
  });

  describe("Part 2: Centralized Database Persistence Engine", () => {
    it("persists and rehydrates Session Plans via server file-backed storage", () => {
      const testPlan = {
        id: `sp-test-${Date.now()}`,
        unit_offering_id: "uo-test",
        class_code: "ADMIN5/6/J/26 MOD 3",
        trainer_id: "trainer-001",
        session_title: "Automated Central DB Verification",
        approval_status: "pending",
        created_at: new Date().toISOString(),
      };

      const current = loadPersistentSessionPlans();
      savePersistentSessionPlans([...current, testPlan]);

      const reloaded = loadPersistentSessionPlans();
      const found = reloaded.find((p) => p.id === testPlan.id);
      expect(found).toBeDefined();
      expect(found?.session_title).toBe("Automated Central DB Verification");

      // Cleanup
      savePersistentSessionPlans(reloaded.filter((p) => p.id !== testPlan.id));
    });

    it("persists and rehydrates Learning Plans via server file-backed storage", () => {
      const testLP = {
        id: `lp-test-${Date.now()}`,
        unit_code: "CU/ADMIN/01",
        class_code: "ADMIN5/6/J/26 MOD 3",
        week_number: 1,
        topic: "Centralized Data Governance & Storage",
      };

      const current = loadPersistentLearningPlans();
      savePersistentLearningPlans([...current, testLP]);

      const reloaded = loadPersistentLearningPlans();
      const found = reloaded.find((p) => p.id === testLP.id);
      expect(found).toBeDefined();
      expect(found?.topic).toBe("Centralized Data Governance & Storage");

      // Cleanup
      savePersistentLearningPlans(reloaded.filter((p) => p.id !== testLP.id));
    });

    it("persists and rehydrates Records of Work via server file-backed storage", () => {
      const testRoW = {
        id: `row-test-${Date.now()}`,
        session_plan_id: "sp-test-1",
        unit_offering_id: "uo-test",
        class_code: "ADMIN5/6/J/26 MOD 3",
        work_covered: "Physical DB transactions and centralized sync",
        date_covered: "2026-10-21",
        approval_status: "pending",
      };

      const current = loadPersistentRecordsOfWork();
      savePersistentRecordsOfWork([...current, testRoW]);

      const reloaded = loadPersistentRecordsOfWork();
      const found = reloaded.find((r) => r.id === testRoW.id);
      expect(found).toBeDefined();
      expect(found?.work_covered).toBe("Physical DB transactions and centralized sync");

      // Cleanup
      savePersistentRecordsOfWork(reloaded.filter((r) => r.id !== testRoW.id));
    });

    it("persists and rehydrates Class Register metadata and comments", () => {
      const classCode = "ADMIN5/6/J/26 MOD 3";
      const metadata = {
        lecturer: "ALEXANDER KINOTI",
        subject: "ICT SKILLS",
        lecturerComment: "All students attended practical session.",
        hodComment: "Satisfactory delivery.",
        weeklyLecturerComments: { 1: "Great start" },
        weeklyHodComments: { 1: "Noted" },
      };

      const registers = loadPersistentClassRegisters();
      registers[classCode] = metadata;
      savePersistentClassRegisters(registers);

      const reloaded = loadPersistentClassRegisters();
      expect(reloaded[classCode]).toBeDefined();
      expect(reloaded[classCode].lecturerComment).toBe("All students attended practical session.");
      expect(reloaded[classCode].hodComment).toBe("Satisfactory delivery.");
    });
  });

  describe("Part 3: Centralized REST API Endpoints & RBAC Security", () => {
    it("allows trainers/admins to batch upsert session plans and retrieves them", async () => {
      const testPlan = {
        id: `sp-api-${Date.now()}`,
        unit_offering_id: "uo-api",
        class_code: "ADMIN5/6/J/26 MOD 3",
        trainer_id: "trainer-001",
        session_title: "Central API Sync Test",
        approval_status: "pending",
      };

      const postRes = await fetch(`${baseUrl}/documents/session-plans/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainer",
        },
        body: JSON.stringify({ session_plans: [testPlan] }),
      });

      expect(postRes.status).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);

      const getRes = await fetch(`${baseUrl}/documents/session-plans?class_code=ADMIN5/6/J/26 MOD 3`, {
        headers: { "x-user-role": "trainer" },
      });

      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.session_plans.some((p: any) => p.id === testPlan.id)).toBe(true);
    });

    it("allows trainers/admins to batch upsert learning plans", async () => {
      const testLP = {
        id: `lp-api-${Date.now()}`,
        unit_code: "CU/ADMIN/01",
        class_code: "ADMIN5/6/J/26 MOD 3",
        week_number: 2,
        topic: "Spreadsheets & Database Integration",
      };

      const postRes = await fetch(`${baseUrl}/documents/learning-plans/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainer",
        },
        body: JSON.stringify({ learning_plans: [testLP] }),
      });

      expect(postRes.status).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);

      const getRes = await fetch(`${baseUrl}/documents/learning-plans?class_code=ADMIN5/6/J/26 MOD 3`, {
        headers: { "x-user-role": "trainer" },
      });

      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.learning_plans.some((p: any) => p.id === testLP.id)).toBe(true);
    });

    it("allows trainers/admins to batch upsert records of work", async () => {
      const testRoW = {
        id: `row-api-${Date.now()}`,
        unit_offering_id: "uo-api",
        class_code: "ADMIN5/6/J/26 MOD 3",
        work_covered: "Completed database integration practical",
        date_covered: "2026-10-21",
        approval_status: "pending",
      };

      const postRes = await fetch(`${baseUrl}/documents/records-of-work/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainer",
        },
        body: JSON.stringify({ records_of_work: [testRoW] }),
      });

      expect(postRes.status).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);

      const getRes = await fetch(`${baseUrl}/documents/records-of-work?class_code=ADMIN5/6/J/26 MOD 3`, {
        headers: { "x-user-role": "trainer" },
      });

      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.records_of_work.some((r: any) => r.id === testRoW.id)).toBe(true);
    });

    it("saves and retrieves class register metadata centrally", async () => {
      const classCode = "ADMIN5/6/J/26 MOD 3";
      const payload = {
        lecturer: "ALEXANDER KINOTI",
        subject: "ICT SKILLS",
        lecturerComment: "Updated from central test suite",
        hodComment: "Approved by HOD",
      };

      const postRes = await fetch(`${baseUrl}/documents/class-registers/${encodeURIComponent(classCode)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainer",
        },
        body: JSON.stringify(payload),
      });

      expect(postRes.status).toBe(200);
      const postJson = await postRes.json();
      expect(postJson.success).toBe(true);

      const getRes = await fetch(`${baseUrl}/documents/class-registers/${encodeURIComponent(classCode)}`, {
        headers: { "x-user-role": "trainer" },
      });

      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.metadata.lecturerComment).toBe("Updated from central test suite");
    });

    it("blocks trainees from modifying professional documents (HTTP 403)", async () => {
      const postRes = await fetch(`${baseUrl}/documents/session-plans/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainee",
        },
        body: JSON.stringify({ session_plans: [] }),
      });

      expect(postRes.status).toBe(403);

      const regRes = await fetch(`${baseUrl}/documents/class-registers/ADMIN5/6/J/26 MOD 3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "trainee",
        },
        body: JSON.stringify({}),
      });

      expect(regRes.status).toBe(403);
    });
  });
});
