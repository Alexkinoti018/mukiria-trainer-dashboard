import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { 
  apiRouter, 
  DB, 
  sanitizeExamForStudent, 
  verifyTrainerSubmissionsAssigned, 
  verifyHODDepartmentScope,
  verifyEvidenceAccess,
  calculateServerWeightedMark,
  atomicSubmitSubmission 
} from "../server/routes.ts";

describe("MTTI Master Full-System End-to-End Integration & Audit Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  // Snapshot initial in-memory DB state for isolation
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
    // Reset DB state before every test
    DB.submissions = JSON.parse(JSON.stringify(initialDBState.submissions));
    DB.exams = JSON.parse(JSON.stringify(initialDBState.exams));
    DB.assessment_marks = JSON.parse(JSON.stringify(initialDBState.assessment_marks));
    DB.assessment_evidence = JSON.parse(JSON.stringify(initialDBState.assessment_evidence));
    DB.unit_offerings = JSON.parse(JSON.stringify(initialDBState.unit_offerings));
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 1: EXAMINATION & ASSESSMENT ENGINE
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Pillar 1: Examination & Assessment Engine", () => {
    it("1.1 Column Shielding: student queries strictly strip correct_answer, rubric, and critical_aspect", async () => {
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(200);
      const exam = await res.json();

      // Trainee payload must NOT expose confidential assessment keys
      expect(exam.payload.answer_key).toBeUndefined();
      expect(exam.payload.rubric).toBeUndefined();

      exam.payload.section_a.questions.forEach((q: any) => {
        expect(q.correct_answer).toBeUndefined();
        expect(q.rubric).toBeUndefined();
        expect(q.critical_aspect).toBeUndefined();
        expect(q.keywords).toBeUndefined();
        expect(q.text).toBeDefined();
        expect(q.marks).toBeDefined();
      });

      exam.payload.section_b.questions.forEach((q: any) => {
        expect(q.correct_answer).toBeUndefined();
        expect(q.rubric).toBeUndefined();
        expect(q.critical_aspect).toBeUndefined();
        expect(q.keywords).toBeUndefined();
      });
    });

    it("1.2 Temporal Window Enforcement: submissions outside active window are rejected (HTTP 403 Forbidden)", async () => {
      // Create expired exam with end_time in the past
      DB.exams.push({
        id: "exam-past-deadline",
        unit_id: "unit-cr-6",
        unit_code: "ICT/CU/IT/CR/6/6",
        course_name: "ICT Technician Level 6",
        payload: {
          title: "Closed Assessment Window",
          duration_minutes: 60,
          end_time: "2020-01-01T00:00:00Z", // Past
          section_a: { questions: [] },
          section_b: { questions: [] }
        }
      } as any);

      const res = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_id: "exam-past-deadline",
          section_a: [{ question_id: "q1", answer: "0" }],
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Exam submission window has expired");
    });

    it("1.3 Submission Immutability: re-submitting an already committed submission returns HTTP 400 Bad Request: Locked", async () => {
      // sub-101 has status: 'submitted'
      const res = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_id: "exam-cr-001",
          section_a: [{ question_id: "q1", answer: "0" }],
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Locked: Submission has already been completed");
    });

    it("1.4 Atomic Submission State Transition: atomicSubmitSubmission locks state from in_progress to submitted", () => {
      // Create an in-progress submission
      DB.submissions.push({
        id: "sub-draft-001",
        exam_id: "exam-cr-001",
        unit_code: "ICT/CU/IT/CR/6/6",
        trainee_id: "trainee-001",
        reg_number: "10525",
        student_name: "Alex Kinoti",
        status: "in_progress",
        total_score: null,
        created_at: new Date().toISOString(),
      } as any);

      // Attempt 1: successfully commit
      const commitRes = atomicSubmitSubmission("sub-draft-001", {
        section_a: [{ question_id: "q1", answer: "0" }],
      }, "trainee-001", "10525");

      expect(commitRes.success).toBe(true);
      expect(commitRes.status_code).toBe(200);

      const updatedSub = DB.submissions.find(s => s.id === "sub-draft-001");
      expect(updatedSub?.status).toBe("submitted");

      // Attempt 2: second commit must be locked (HTTP 400)
      const secondCommit = atomicSubmitSubmission("sub-draft-001", {
        section_a: [{ question_id: "q1", answer: "1" }],
      }, "trainee-001", "10525");

      expect(secondCommit.success).toBe(false);
      expect(secondCommit.status_code).toBe(400);
      expect(secondCommit.error).toContain("Locked");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 2: CONTINUOUS ASSESSMENT & TRAINEE EVIDENCE PIPELINE
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Pillar 2: Continuous Assessment & Trainee Evidence Pipeline", () => {
    it("2.1 Authenticated Binary File Streaming: serves PDF inline with application/pdf MIME type", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/file`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toContain("inline; filename=");

      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      expect(buffer.toString("utf-8", 0, 5)).toBe("%PDF-");
    });

    it("2.2 Binary Download Endpoint: serves attachment with dedicated content-disposition", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/download`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-disposition")).toContain('attachment; filename="Computer_Essentials_Practical_1.pdf"');
    });

    it("2.3 In-Modal Mark Awarding: records score, updates cp_scores/ct_scores, and calculates weighted averages", async () => {
      // Award mark 85 to ev-002 (CP2, trainee-002, uo-1)
      const res = await fetch(`${baseUrl}/evidence/ev-002/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          grade: 85,
          feedback: "Great work on motherboard diagnostic check.",
          task_code: "CP2",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.evidence.grade).toBe(85);
      expect(data.evidence.verified_by_trainer).toBe(true);
      expect(data.marks.cp_scores[1]).toBe(85);
      expect(data.marks.computed_average_practical).toBeDefined();
      expect(data.marks.weighted_mark).toBeGreaterThan(0);
    });

    it("2.4 Marksheet Lock Guard: rejects mark modification when Assessment_Marks is locked (HTTP 400)", async () => {
      // mark-01 for trainee-001 on uo-1 has is_locked: true
      const res = await fetch(`${baseUrl}/evidence/ev-001/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          grade: 95,
          feedback: "Overwriting locked mark",
          task_code: "CP1",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Marks locked");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 3: PEDAGOGICAL CDACC CURRICULUM TRACKING
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Pillar 3: Pedagogical CDACC Curriculum Tracking", () => {
    it("3.1 KNQF/CDACC Weighted Mark Calculation matches level-specific ratios", () => {
      // Level 6: 50% Theory / 50% Practical
      expect(calculateServerWeightedMark(80, 90, 6)).toBe(85);

      // Level 5: 40% Theory / 60% Practical
      expect(calculateServerWeightedMark(70, 90, 5)).toBe(82);

      // Level 4: 30% Theory / 70% Practical
      expect(calculateServerWeightedMark(60, 80, 4)).toBe(74);

      // Level 3: 20% Theory / 80% Practical
      expect(calculateServerWeightedMark(50, 80, 3)).toBe(74);
    });

    it("3.2 Pedagogical Modification Guard: Trainees cannot modify or grade assessment evidence (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainee-001",
        },
        body: JSON.stringify({ grade: 99 }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    it("3.3 Pedagogical Verification Guard: Trainees cannot verify assessment evidence (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/verify`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 4: MULTI-TENANT RBAC & ADMINISTRATIVE GOVERNANCE
  // ═════════════════════════════════════════════════════════════════════════════
  describe("Pillar 4: Multi-Tenant RBAC & Administrative Governance", () => {
    it("4.1 Trainee Cohort Isolation: Trainee cannot access exams outside enrolled units (HTTP 403)", async () => {
      // Trainee 3 (EE student) attempts to access Computing exam (exam-cr-001)
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          "x-user-role": "trainee",
          "x-user-id": "trainee-003",
          "x-user-reg": "99999",
          "x-user-dept": "dept-ee"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Trainee cohort is not enrolled in this unit");
    });

    it("4.2 Trainer Assignment Isolation: Trainer cannot access exams outside assigned unit offerings (HTTP 403)", async () => {
      // Trainer 2 is assigned to networking (uo-3), NOT computer repair (uo-1, exam-cr-001)
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-trainer-002"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Trainer is not assigned to teach this unit");
    });

    it("4.3 HOD Department Isolation: HOD cannot access exams outside their department (HTTP 403)", async () => {
      // HOD EE attempts to access Computing exam (exam-cr-001)
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-hod-ee"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Exam does not belong to your department");
    });

    it("4.4 Draft Mark Isolation: Trainee cannot view unpublished/draft marks (HTTP 200 with empty list)", async () => {
      // mark-02 for trainee-002 on uo-1 has is_locked: false
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainee-002"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      // Must not expose unpublished/draft marks to trainee
      expect(data.marks.length).toBe(0);
    });

    it("4.5 Published Mark Visibility: Trainee can view finalized marks when is_locked = true", async () => {
      // mark-01 for trainee-001 on uo-1 has is_locked: true
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainee-001"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.marks.length).toBe(1);
      expect(data.marks[0].trainee_id).toBe("trainee-001");
      expect(data.marks[0].is_locked).toBe(true);
    });

    it("4.6 Vertical Privilege Escalation Protection: Non-admin cannot create users (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainer-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Malicious User", email: "hacker@mtti.ac.ke", role: "admin" })
      });

      expect(res.status).toBe(403);
    });
  });
});
