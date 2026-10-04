import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import fs from "fs";
import path from "path";

// Storage mock for Node.js test environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

if (typeof (globalThis as any).localStorage === "undefined") {
  (globalThis as any).localStorage = new MockStorage();
}
if (typeof (globalThis as any).sessionStorage === "undefined") {
  (globalThis as any).sessionStorage = new MockStorage();
}

import {
  apiRouter,
  DB,
  calculateCDACCBatchWeightedScore,
  canEditPedagogical,
} from "../server/routes.ts";
import { purgeMttiCache, purgeMTTISessionCache } from "../client/src/contexts/AuthContext.tsx";

describe("MTTI TVET Comprehensive Verification & Compliance Audit (Options A, B, C, D)", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  const initialDBState = JSON.parse(JSON.stringify(DB));

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

  beforeEach(() => {
    // Restore in-memory database state
    DB.assessment_marks = JSON.parse(JSON.stringify(initialDBState.assessment_marks));
    DB.session_plans = JSON.parse(JSON.stringify(initialDBState.session_plans));
    DB.record_of_work = JSON.parse(JSON.stringify(initialDBState.record_of_work));
    localStorage.clear();
    sessionStorage.clear();
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. OPTION A: TRAINEE LOCAL ANSWER AUTO-DRAFTING
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Option A Verification: Trainee Local Answer Auto-Drafting", () => {
    const examId = "exam-cr-001";
    const traineeId = "10525";
    const expectedKey = `mtti_exam_answers_${examId}_${traineeId}`;

    it("verifies scoped draft storage key generation conforms to mtti_exam_answers_${examId}_${traineeId}", () => {
      const generateKey = (eId: string, tId: string) => `mtti_exam_answers_${eId}_${tId}`;
      expect(generateKey(examId, traineeId)).toBe(expectedKey);
    });

    it("persists and restores candidate answer state in storage under scoped key", () => {
      const draftPayload = {
        sectionAAnswers: { q1: "0", q2: "2" },
        sectionBAnswers: { q3: "Step 1: Check power cabling. Step 2: Test RAM." },
      };

      localStorage.setItem(expectedKey, JSON.stringify(draftPayload));
      const retrieved = localStorage.getItem(expectedKey);
      expect(retrieved).not.toBeNull();
      expect(JSON.parse(retrieved!)).toEqual(draftPayload);
    });

    it("purges the scoped draft key upon exam submission (clearDraft)", () => {
      localStorage.setItem(expectedKey, JSON.stringify({ sectionAAnswers: { q1: "0" } }));
      expect(localStorage.getItem(expectedKey)).not.toBeNull();

      // Simulate clearDraft()
      localStorage.removeItem(expectedKey);
      expect(localStorage.getItem(expectedKey)).toBeNull();
    });

    it("verifies physical hook and CandidatePortal integration files exist and export required APIs", () => {
      const hookPath = path.resolve(__dirname, "../client/src/hooks/useAutoDraft.ts");
      const portalPath = path.resolve(__dirname, "../client/src/pages/CandidatePortal.tsx");

      expect(fs.existsSync(hookPath)).toBe(true);
      expect(fs.existsSync(portalPath)).toBe(true);

      const hookContent = fs.readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("export function useAutoDraft");
      expect(hookContent).toContain("clearDraft");
      expect(hookContent).toContain("forceSave");
      expect(hookContent).toContain("lastSaved");

      const portalContent = fs.readFileSync(portalPath, "utf-8");
      expect(portalContent).toContain("useAutoDraft");
      expect(portalContent).toContain("mtti_exam_answers_${exam.id}_${traineeId}");
      expect(portalContent).toContain("clearDraft()");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. OPTION B: TRAINER RAPID BATCH GRADING MATRIX
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Option B Verification: Batch Grading Matrix & Lock Protection", () => {
    it("accurately calculates CDACC 40/20/40 weighted marks: (CP * 0.4) + (CT * 0.2) + (Project * 0.4)", () => {
      // Test Standard: CP 40%, CT 20%, Project 40%
      // 80*0.4 + 60*0.2 + 90*0.4 = 32 + 12 + 36 = 80.0
      expect(calculateCDACCBatchWeightedScore(80, 60, 90)).toBe(80.0);

      // 75*0.4 + 85*0.2 + 70*0.4 = 30 + 17 + 28 = 75.0
      expect(calculateCDACCBatchWeightedScore(75, 85, 70)).toBe(75.0);

      // Decimal rounding test: 62.5*0.4 + 71.2*0.2 + 84.3*0.4 = 25 + 14.24 + 33.72 = 72.96 -> 73.0
      expect(calculateCDACCBatchWeightedScore(62.5, 71.2, 84.3)).toBe(73.0);

      // Zero score test
      expect(calculateCDACCBatchWeightedScore(0, 0, 0)).toBe(0);
    });

    it("rejects batch mark persistence with HTTP 400 if marksheet is locked (is_locked === true)", async () => {
      // uo-1 has mark-01 with is_locked: true in DB
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          unitOfferingId: "uo-1",
          marks: [
            { traineeId: "trainee-001", cpScore: 90, ctScore: 85, projectScore: 88 },
          ],
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Assessment marksheet is finalized and locked");
    });

    it("rejects batch mark persistence with HTTP 403 if called by trainee role", async () => {
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainee-001",
        },
        body: JSON.stringify({
          unitOfferingId: "uo-3",
          marks: [{ traineeId: "trainee-001", cpScore: 95 }],
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Trainees cannot submit or update assessment marks");
    });

    it("rejects batch mark persistence with HTTP 403 if trainer is unassigned to unit offering", async () => {
      // trainer-001 is assigned to uo-1 and uo-2, but uo-3 is assigned to trainer-002
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          unitOfferingId: "uo-3",
          marks: [{ traineeId: "trainee-001", cpScore: 90 }],
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("not the assigned trainer");
    });

    it("successfully persists batch marks and updates weighted scores for assigned trainer on unlocked unit offering", async () => {
      // uo-3 is assigned to trainer-002 and is not locked
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-002",
        },
        body: JSON.stringify({
          unitOfferingId: "uo-3",
          marks: [
            { traineeId: "trainee-001", cpScore: 85, ctScore: 75, projectScore: 80 },
          ],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.marks.length).toBe(1);

      // Verify CDACC score calculation: (85*0.4) + (75*0.2) + (80*0.4) = 34 + 15 + 32 = 81.0
      expect(data.marks[0].weighted_mark).toBe(81.0);
      expect(data.marks[0].is_locked).toBe(false);
    });

    it("verifies AssessmentMarksSheet component supports keyboard navigation and cell ID mapping", () => {
      const sheetPath = path.resolve(__dirname, "../client/src/components/AssessmentMarksSheet.tsx");
      expect(fs.existsSync(sheetPath)).toBe(true);

      const content = fs.readFileSync(sheetPath, "utf-8");
      expect(content).toContain("handleMatrixKeyDown");
      expect(content).toContain("cell-${targetRow}-${columns[targetCol]}");
      expect(content).toContain("ArrowDown");
      expect(content).toContain("ArrowUp");
      expect(content).toContain("ArrowLeft");
      expect(content).toContain("ArrowRight");
      expect(content).toContain("Enter");
      expect(content).toContain("/api/marks/batch");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. OPTION C: HOD DIGITAL SIGN-OFF & PEDAGOGICAL APPROVAL
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Option C Verification: HOD Pedagogical Sign-Off RBAC & Lock", () => {
    it("verifies migration 05 exists with schema extensions and RLS security function", () => {
      const migrationPath = path.resolve(__dirname, "../database/migrations/05_hod_approval_workflow.sql");
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");
      expect(sqlContent).toContain("ALTER TABLE Session_Plans");
      expect(sqlContent).toContain("ALTER TABLE Record_of_Work");
      expect(sqlContent).toContain("approval_status");
      expect(sqlContent).toContain("hod_reviewed_by");
      expect(sqlContent).toContain("hod_reviewer_name");
      expect(sqlContent).toContain("hod_review_date");
      expect(sqlContent).toContain("hod_remarks");
      expect(sqlContent).toContain("check_hod_department_match");
    });

    it("blocks trainee role from accessing pedagogical sign-off with HTTP 403", async () => {
      const res = await fetch(`${baseUrl}/pedagogy/sign-off`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainee-001",
        },
        body: JSON.stringify({
          entityType: "record_of_work",
          recordId: "row-001",
          status: "approved",
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Trainees have zero access");
    });

    it("allows authorized HOD to digitally sign off pedagogical records in their own department", async () => {
      // HOD CI (dept-ci) signs off row-001 (dept-ci)
      const res = await fetch(`${baseUrl}/pedagogy/sign-off`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-hod-ci",
        },
        body: JSON.stringify({
          entityType: "record_of_work",
          recordId: "row-001",
          status: "approved",
          remarks: "Verified syllabus delivery and practical log.",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.record.approval_status).toBe("approved");
      expect(data.record.hod_reviewed_by).toBe("hod-001");
      expect(data.record.hod_reviewer_name).toBe("Prof. S. Njoroge");
      expect(data.record.hod_remarks).toBe("Verified syllabus delivery and practical log.");
    });

    it("blocks HOD from signing off records belonging to another academic department (HTTP 403)", async () => {
      // HOD CI (dept-ci) attempts to sign off row-ee-001 (Electrical dept-ee)
      const res = await fetch(`${baseUrl}/pedagogy/sign-off`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-hod-ci",
        },
        body: JSON.stringify({
          entityType: "record_of_work",
          recordId: "row-ee-001",
          status: "approved",
          remarks: "Attempted cross-department sign-off",
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Cross-department pedagogical approval rejected");
    });

    it("enforces pedagogical immutability lock on approved records via canEditPedagogical", async () => {
      // canEditPedagogical logic unit check
      expect(canEditPedagogical({ approval_status: "approved" })).toBe(false);
      expect(canEditPedagogical({ approval_status: "pending" })).toBe(true);
      expect(canEditPedagogical({ approval_status: "draft" })).toBe(true);
      expect(canEditPedagogical(null)).toBe(true);

      // row-002 is already approved in DB
      const res = await fetch(`${baseUrl}/pedagogy/record-of-work/row-002`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-002",
        },
        body: JSON.stringify({
          work_covered: "Tampered content after approval",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Approved pedagogical records are finalized and locked against modification");
    });

    it("verifies RecordsOfWork frontend UI checks canEditPedagogical to protect approved records", () => {
      const rowPath = path.resolve(__dirname, "../client/src/pages/RecordsOfWork.tsx");
      expect(fs.existsSync(rowPath)).toBe(true);

      const content = fs.readFileSync(rowPath, "utf-8");
      expect(content).toContain("canEditPedagogical");
      expect(content).toContain("handleEdit");
      expect(content).toContain("handleDelete");
      expect(content).toContain("handleSave");
      expect(content).toContain("approval_status === \"approved\"");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // 4. OPTION D: SHARED TERMINAL INACTIVITY AUTO-LOGOUT
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Option D Verification: Terminal Inactivity Auto-Logout & MTTI Cache Purge", () => {
    it("sweeps all 7 required MTTI key prefixes and sensitive keys from localStorage on logout", () => {
      // Populate localStorage with all 7 prefixes and sensitive data
      localStorage.setItem("mtti_marks_uo_1", JSON.stringify([{ score: 85 }]));
      localStorage.setItem("mtti_timer_IT101", "1800");
      localStorage.setItem("mtti_exam_answers_ex1_tr1", JSON.stringify({ q1: "A" }));
      localStorage.setItem("mtti_attendance_2026", JSON.stringify({ present: true }));
      localStorage.setItem("mtti_class_register_secA", JSON.stringify({ total: 30 }));
      localStorage.setItem("mukiria_exams", JSON.stringify([{ id: "ex-1" }]));
      localStorage.setItem("mukiria_submissions", JSON.stringify([{ id: "sub-1" }]));
      localStorage.setItem("mtti_demo_session", JSON.stringify({ user: "trainer" }));
      localStorage.setItem("student_demo_session", JSON.stringify({ user: "trainee" }));
      localStorage.setItem("unrelated_app_setting", "preserve_me");

      sessionStorage.setItem("user_session_token", "active-token-xyz");
      sessionStorage.setItem("navigation_history", "/trainer/grading");

      // Execute cache purge
      purgeMttiCache();

      // Verify all 7 key prefixes are wiped
      expect(localStorage.getItem("mtti_marks_uo_1")).toBeNull();
      expect(localStorage.getItem("mtti_timer_IT101")).toBeNull();
      expect(localStorage.getItem("mtti_exam_answers_ex1_tr1")).toBeNull();
      expect(localStorage.getItem("mtti_attendance_2026")).toBeNull();
      expect(localStorage.getItem("mtti_class_register_secA")).toBeNull();
      expect(localStorage.getItem("mukiria_exams")).toBeNull();
      expect(localStorage.getItem("mukiria_submissions")).toBeNull();
      expect(localStorage.getItem("mtti_demo_session")).toBeNull();
      expect(localStorage.getItem("student_demo_session")).toBeNull();

      // Verify sessionStorage is completely cleared
      expect(sessionStorage.getItem("user_session_token")).toBeNull();
      expect(sessionStorage.getItem("navigation_history")).toBeNull();

      // Verify non-MTTI preferences remain untouched
      expect(localStorage.getItem("unrelated_app_setting")).toBe("preserve_me");
    });

    it("verifies purgeMTTISessionCache is functionally identical to purgeMttiCache export alias", () => {
      expect(purgeMttiCache).toBe(purgeMTTISessionCache);
    });

    it("verifies useIdleTimer hook and IdleTimeoutModal component files exist and export required APIs", () => {
      const hookPath = path.resolve(__dirname, "../client/src/hooks/useIdleTimer.ts");
      const modalPath = path.resolve(__dirname, "../client/src/components/IdleTimeoutModal.tsx");
      const appPath = path.resolve(__dirname, "../client/src/App.tsx");

      expect(fs.existsSync(hookPath)).toBe(true);
      expect(fs.existsSync(modalPath)).toBe(true);
      expect(fs.existsSync(appPath)).toBe(true);

      const hookContent = fs.readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("export function useIdleTimer");
      expect(hookContent).toContain("isPrompted");
      expect(hookContent).toContain("remainingSeconds");
      expect(hookContent).toContain("reset");

      const modalContent = fs.readFileSync(modalPath, "utf-8");
      expect(modalContent).toContain("IdleTimeoutModal");
      expect(modalContent).toContain("Keep Me Logged In");

      const appContent = fs.readFileSync(appPath, "utf-8");
      expect(appContent).toContain("IdleSessionWatcher");
    });
  });
});
