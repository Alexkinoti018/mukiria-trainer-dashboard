import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import bcrypt from "bcryptjs";
import {
  createStaffAccount,
  createUser,
  findUserByEmail,
  loadPersistentUsers,
  removeInMemoryStaffProfile,
  savePersistentUsers,
} from "../server/db.ts";
import { 
  apiRouter, 
  DB, 
  sanitizeExamForStudent, 
  verifyTrainerSubmissionsAssigned, 
  verifyHODDepartmentScope,
  atomicSubmitSubmission 
} from "../server/routes.ts";
import { loginAs } from "./test_auth_helpers.ts";

describe("MTTI RBAC & Object Authorization Security Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const createdStaffProfileIds: string[] = [];
  const initialPersistentUsers = JSON.parse(JSON.stringify(loadPersistentUsers()));

  // Snapshot initial in-memory DB state for isolation
  const initialDBState = JSON.parse(JSON.stringify(DB));

  beforeAll(async () => {
    process.env.ALLOW_DEMO_AUTH = "true";
    await createUser({
      id: "rbac-real-login-trainee",
      admission_number: "14179/S2026",
      full_name: "RBAC Login Trainee",
      email: "rbac-login-trainee@mtti.ac.ke",
      password_hash: await bcrypt.hash("TraineePassword@2026!", 12),
      role: "TRAINEE",
      profile_id: "trainee-001",
    });
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
    savePersistentUsers(initialPersistentUsers);
    new Set(createdStaffProfileIds).forEach(removeInMemoryStaffProfile);
    DB.trainers = initialDBState.trainers;
    DB.departments = initialDBState.departments;
    DB.unit_offerings = initialDBState.unit_offerings;
    DB.assessment_evidence = initialDBState.assessment_evidence;
  });

  beforeEach(() => {
    // Reset DB state before every test
    DB.submissions = JSON.parse(JSON.stringify(initialDBState.submissions));
    DB.exams = JSON.parse(JSON.stringify(initialDBState.exams));
    DB.assessment_marks = JSON.parse(JSON.stringify(initialDBState.assessment_marks));
  });

  // ─── 1. HORIZONTAL ESCALATION (TRAINEE BOLA / IDOR) ──────────────────────────
  describe("1. Horizontal Escalation & Trainee BOLA Protection", () => {
    it("should prevent Trainee A from accessing Trainee B's exam submission (HTTP 403)", async () => {
      // Trainee 1 (Alex Kinoti) tries to access Trainee 2's submission (sub-102)
      const res = await fetch(`${baseUrl}/submissions/sub-102`, {
        headers: {
          Authorization: "Bearer token-trainee-001"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (BOLA)");
    });

    it("should allow Trainee A to access their own exam submission (HTTP 200)", async () => {
      // Trainee 1 accesses own submission (sub-101)
      const res = await fetch(`${baseUrl}/submissions/sub-101`, {
        headers: {
          Authorization: "Bearer token-trainee-001"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("sub-101");
      expect(data.trainee_id).toBe("trainee-001");
    });
  });

  // ─── 2. CROSS-TRAINER ESCALATION ─────────────────────────────────────────────
  describe("2. Cross-Trainer Escalation & Assignment Guard", () => {
    it("should reject Trainer B attempting to grade Trainer A's unit submission (HTTP 403)", async () => {
      // Trainer 2 (Alexander Kinoti, networking) attempts to grade sub-101 (Computer Repair, assigned to Trainer 1)
      const res = await fetch(`${baseUrl}/submissions/sub-101/grade`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainer-002",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          marks_awarded: 49,
          comments: "Attempted cross-trainer grade tampering"
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (Cross-Trainer)");
    });

    it("should allow assigned Trainer A to grade their own unit submission (HTTP 200)", async () => {
      // Trainer 1 grades sub-101
      const res = await fetch(`${baseUrl}/submissions/sub-101/grade`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainer-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          marks_awarded: 45,
          comments: "Competent demonstration of diagnostic procedures"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.updated.total_score).toBe(45);
      expect(data.updated.status).toBe("graded");
    });
  });

  // ─── 3. VERTICAL PRIVILEGE ESCALATION ────────────────────────────────────────
  describe("3. Vertical Privilege Escalation Protection", () => {
    it("should reject Trainee attempting to invoke Admin user creation endpoint (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Escalated Student",
          email: "escalated@mtti.ac.ke",
          role: "admin"
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Access requires [admin]");
    });

    it("should reject Trainer attempting to invoke Admin user creation endpoint (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainer-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Escalated Trainer",
          email: "trainer-admin@mtti.ac.ke",
          role: "admin"
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Access requires [admin]");
    });

    it("should allow Administrator to create institutional users (HTTP 201)", async () => {
      const createdStaffEmail = `staff-${Date.now()}@mtti.ac.ke`;
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-admin",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Eng. Faith Mutua",
          email: createdStaffEmail,
          role: "trainer",
          department_id: "dept-ci",
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe("trainer");
      expect(data.user.department_id).toBe("dept-ci");
      expect(data.user.profile_id).toBeTruthy();
      expect(data.user.must_change_password).toBe(true);
      expect(data.temporaryPassword).toHaveLength(24);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(data.user.password_hash).toBeUndefined();
      createdStaffProfileIds.push(data.user.profile_id);

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: createdStaffEmail,
          password: data.temporaryPassword,
        }),
      });
      expect(loginRes.status).toBe(200);
      const loginData = await loginRes.json();
      expect(loginData.user.role).toBe("trainer");
      expect(loginData.user.department_id).toBe("dept-ci");
      expect(loginData.user.must_change_password).toBe(true);
    });

    it("creates a trainer profile atomically, enforces first-login password change, and scopes evidence to their own offerings", async () => {
      const email = `scoped-trainer-${Date.now()}@mtti.ac.ke`;
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const createRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Scoped Trainer", email, role: "trainer", department_id: "dept-ci" }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      createdStaffProfileIds.push(created.user.profile_id);

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password: created.temporaryPassword }),
      });
      expect(loginRes.status).toBe(200);
      const login = await loginRes.json();
      expect(login.user.profile_id).toBe(created.user.profile_id);

      const blocked = await fetch(`${baseUrl}/evidence`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(blocked.status).toBe(428);

      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${login.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: created.temporaryPassword, newPassword: "A-new-strong-password-2026!" }),
      });
      expect(changeRes.status).toBe(200);

      const ownOffering = `offering-own-${Date.now()}`;
      const otherOffering = `offering-other-${Date.now()}`;
      const ownUnit = `unit-own-${Date.now()}`;
      const otherUnit = `unit-other-${Date.now()}`;
      const ownExam = `exam-${ownOffering}`;
      const otherExam = `exam-${otherOffering}`;
      DB.unit_offerings.push(
        { id: ownOffering, unit_id: ownUnit, trainer_id: created.user.profile_id, department_id: "dept-ci" },
        { id: otherOffering, unit_id: otherUnit, trainer_id: "trainer-002", department_id: "dept-ci" },
      );
      DB.exams.push(
        { id: ownExam, unit_id: ownUnit, unit_code: "OWN-UNIT", payload: {} },
        { id: otherExam, unit_id: otherUnit, unit_code: "OTHER-UNIT", payload: {} },
      );
      DB.assessment_evidence.push(
        { id: `evidence-${ownOffering}`, unit_offering_id: ownOffering, trainee_id: "trainee-001" },
        { id: `evidence-${otherOffering}`, unit_offering_id: otherOffering, trainee_id: "trainee-001" },
      );

      const evidenceRes = await fetch(`${baseUrl}/evidence`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(evidenceRes.status).toBe(200);
      const evidence = await evidenceRes.json();
      expect(evidence.evidence.map((item: any) => item.id)).toContain(`evidence-${ownOffering}`);
      expect(evidence.evidence.map((item: any) => item.id)).not.toContain(`evidence-${otherOffering}`);
      const examsRes = await fetch(`${baseUrl}/exams`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(examsRes.status).toBe(200);
      const exams = await examsRes.json();
      expect(exams.map((exam: any) => exam.id)).toContain(ownExam);
      expect(exams.map((exam: any) => exam.id)).not.toContain(otherExam);
      DB.unit_offerings = DB.unit_offerings.filter((item: any) => item.id !== ownOffering && item.id !== otherOffering);
      DB.assessment_evidence = DB.assessment_evidence.filter((item: any) => ![ownOffering, otherOffering].includes(item.unit_offering_id));
      DB.exams = DB.exams.filter((exam: any) => exam.id !== ownExam && exam.id !== otherExam);
    }, 20000);

    it("scopes an HOD account created through the admin form to the assigned department", async () => {
      const email = `scoped-hod-${Date.now()}@mtti.ac.ke`;
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const createRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Scoped HOD", email, role: "hod", department_id: "dept-ee" }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      createdStaffProfileIds.push(created.user.profile_id);

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password: created.temporaryPassword }),
      });
      const login = await loginRes.json();
      expect(login.user.department_id).toBe("dept-ee");

      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${login.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: created.temporaryPassword, newPassword: "A-new-HOD-password-2026!" }),
      });
      expect(changeRes.status).toBe(200);

      const eeOffering = `offering-ee-${Date.now()}`;
      const ciOffering = `offering-ci-${Date.now()}`;
      DB.unit_offerings.push(
        { id: eeOffering, trainer_id: "trainer-002", department_id: "dept-ee" },
        { id: ciOffering, trainer_id: "trainer-001", department_id: "dept-ci" },
      );
      DB.assessment_evidence.push(
        { id: `evidence-${eeOffering}`, unit_offering_id: eeOffering, trainee_id: "trainee-001" },
        { id: `evidence-${ciOffering}`, unit_offering_id: ciOffering, trainee_id: "trainee-001" },
      );
      const evidenceRes = await fetch(`${baseUrl}/evidence`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(evidenceRes.status).toBe(200);
      const evidence = await evidenceRes.json();
      expect(evidence.evidence.map((item: any) => item.id)).toContain(`evidence-${eeOffering}`);
      expect(evidence.evidence.map((item: any) => item.id)).not.toContain(`evidence-${ciOffering}`);
      DB.unit_offerings = DB.unit_offerings.filter((item: any) => item.id !== eeOffering && item.id !== ciOffering);
      DB.assessment_evidence = DB.assessment_evidence.filter((item: any) => ![eeOffering, ciOffering].includes(item.unit_offering_id));
    }, 20000);

    it("fails closed when the stored staff department does not match a real department", async () => {
      const email = `mismatch-${Date.now()}@mtti.ac.ke`;
      const { token: adminToken } = await loginAs(baseUrl, "admin");
      const createRes = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Mismatch Trainer", email, role: "trainer", department_id: "dept-ci" }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();
      createdStaffProfileIds.push(created.user.profile_id);
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password: created.temporaryPassword }),
      });
      const login = await loginRes.json();

      const users = loadPersistentUsers();
      const account = users.find((item) => item.email === email)!;
      account.department_id = "department-does-not-exist";
      savePersistentUsers(users);

      const response = await fetch(`${baseUrl}/evidence`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      expect(response.status).toBe(403);
    }, 20000);

    it("rolls back the user row when staff profile creation fails", async () => {
      const email = `rollback-${Date.now()}@mtti.ac.ke`;
      const passwordHash = await bcrypt.hash("Test-password-2026!", 12);
      await expect(createStaffAccount({
        full_name: "Rollback Test",
        email,
        department_id: "missing-department",
        password_hash: passwordHash,
        role: "HOD",
      })).rejects.toMatchObject({ code: "DEPARTMENT_NOT_FOUND" });
      expect(await findUserByEmail(email)).toBeNull();
    });
  });

  // ─── 4. MANDATORY MOD 1: COLUMN SHIELDING (trainee_exam_view) ────────────────
  describe("4. Mandatory Mod 1: Column Shielding & Student Payload Sanitization", () => {
    it("should strip correct_answer, rubric, and critical_aspect from student exam payloads (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-trainee-001"
        }
      });

      expect(res.status).toBe(200);
      const exam = await res.json();

      // Section A questions verification
      const sectionAQuestions = exam.payload?.section_a?.questions || [];
      expect(sectionAQuestions.length).toBeGreaterThan(0);
      for (const q of sectionAQuestions) {
        expect(q.correct_answer).toBeUndefined();
        expect(q.rubric).toBeUndefined();
        expect(q.critical_aspect).toBeUndefined();
        expect(q.text).toBeDefined();
        expect(q.options).toBeDefined();
      }

      // Section B questions verification
      const sectionBQuestions = exam.payload?.section_b?.questions || [];
      expect(sectionBQuestions.length).toBeGreaterThan(0);
      for (const q of sectionBQuestions) {
        expect(q.correct_answer).toBeUndefined();
        expect(q.rubric).toBeUndefined();
        expect(q.critical_aspect).toBeUndefined();
        expect(q.text).toBeDefined();
      }

      // Top-level payload shielding
      expect(exam.payload.answer_key).toBeUndefined();
      expect(exam.payload.rubric).toBeUndefined();
    });

    it("should retain full answer keys and rubrics when fetched by the assigned Trainer", async () => {
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-trainer-001"
        }
      });

      expect(res.status).toBe(200);
      const exam = await res.json();

      const q1 = exam.payload.section_a.questions[0];
      expect(q1.correct_answer).toBe("0");
      expect(q1.rubric).toBe("1 mark for chkdsk");
      expect(q1.critical_aspect).toBe("OS disk diagnostics");

      const q2 = exam.payload.section_b.questions[0];
      expect(q2.correct_answer).toBe("Check thermal limits and process utilization");
      expect(q2.rubric).toBe("Award 10 marks for thermal vs process analysis");
      expect(q2.critical_aspect).toBe("System performance monitoring");
    });

    it("should verify sanitizeExamForStudent function isolates sensitive keys completely", () => {
      const rawExam = {
        id: "test-exam",
        payload: {
          title: "Test Exam",
          answer_key: { q1: "A" },
          rubric: "Overall rubric",
          section_a: {
            questions: [
              { id: "q1", text: "Question 1", correct_answer: "A", rubric: "R1", critical_aspect: "C1", marks: 2 }
            ]
          }
        }
      };

      const sanitized = sanitizeExamForStudent(rawExam);
      expect(sanitized.payload.answer_key).toBeUndefined();
      expect(sanitized.payload.rubric).toBeUndefined();
      expect(sanitized.payload.section_a.questions[0].correct_answer).toBeUndefined();
      expect(sanitized.payload.section_a.questions[0].rubric).toBeUndefined();
      expect(sanitized.payload.section_a.questions[0].critical_aspect).toBeUndefined();
      expect(sanitized.payload.section_a.questions[0].text).toBe("Question 1");
    });
  });

  // ─── 5. MANDATORY MOD 3: FOREIGN KEY TRAVERSAL ───────────────────────────────
  describe("5. Mandatory Mod 3: Relational Foreign Key Traversal Verification", () => {
    it("should correctly traverse Exams -> Unit_Offerings -> trainer_id", () => {
      // Trainer 1 is assigned to exam-cr-001 via uo-1
      expect(verifyTrainerSubmissionsAssigned("trainer-001", "exam-cr-001")).toBe(true);

      // Trainer 2 is NOT assigned to exam-cr-001
      expect(verifyTrainerSubmissionsAssigned("trainer-002", "exam-cr-001")).toBe(false);

      // Trainer 2 is assigned to exam-net-001 via uo-3
      expect(verifyTrainerSubmissionsAssigned("trainer-002", "exam-net-001")).toBe(true);

      // Trainer 1 is NOT assigned to exam-net-001
      expect(verifyTrainerSubmissionsAssigned("trainer-001", "exam-net-001")).toBe(false);

      // Non-existent exam returns false
      expect(verifyTrainerSubmissionsAssigned("trainer-001", "exam-non-existent")).toBe(false);
    });
  });

  // ─── 6. MANDATORY MOD 4: HOD DEPARTMENT SCOPE ────────────────────────────────
  describe("6. Mandatory Mod 4: HOD Department Scope Verification", () => {
    it("should allow HOD to access exams belonging to their department (HTTP 200)", async () => {
      // HOD of Computing & Informatics accesses exam-cr-001 (Dept: dept-ci)
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-hod-ci"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("exam-cr-001");
    });

    it("should reject HOD attempting to access exams of another department (HTTP 403)", async () => {
      // HOD of Electrical & Electronics accesses exam-cr-001 (Computing Dept)
      const res = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: {
          Authorization: "Bearer token-hod-ee"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Exam does not belong to your department");
    });

    it("should verify verifyHODDepartmentScope helper function", () => {
      expect(verifyHODDepartmentScope("dept-ci", "exam-cr-001")).toBe(true);
      expect(verifyHODDepartmentScope("dept-ee", "exam-cr-001")).toBe(false);
      expect(verifyHODDepartmentScope(undefined, "exam-cr-001")).toBe(false);
    });
  });

  // ─── 7. MANDATORY MOD 5: SUBMISSION LOCKING & WINDOW GUARD ───────────────────
  describe("7. Mandatory Mod 5: Submission Locking & Window Verification", () => {
    it("should reject re-submitting an already submitted exam (HTTP 400 Locked)", async () => {
      // Trainee 1 already has sub-101 with status: 'submitted' for exam-cr-001
      const res = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          exam_id: "exam-cr-001",
          section_a: [{ question_id: "q1", answer: "0" }]
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Locked: Submission has already been completed");
    });

    it("should reject exam submissions outside the valid window (HTTP 403 Expired)", async () => {
      // Create an expired exam
      DB.exams.push({
        id: "exam-expired",
        unit_id: "unit-cr-6",
        unit_code: "ICT/CU/IT/CR/6/6",
        course_name: "ICT Level 6",
        payload: {
          title: "Expired Exam",
          duration_minutes: 60,
          total_marks: 50,
          end_time: "2020-01-01T00:00:00Z", // Past window
          section_a: { questions: [] }
        } as any
      });

      // Trainee 3 has no prior submission on exam-expired
      const res = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "x-user-role": "trainee",
          "x-user-id": "trainee-003",
          "x-user-reg": "99999",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          exam_id: "exam-expired",
          section_a: []
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Exam submission window has expired");
    });

    it("should accept valid submissions within active window and compute server-side score", async () => {
      // Trainee 3 submitting for active exam-net-001
      const res = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "x-user-role": "trainee",
          "x-user-id": "trainee-003",
          "x-user-reg": "99999",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          exam_id: "exam-net-001",
          section_a: [
            { question_id: "q_net_1", answer: "0" } // Correct option (255.255.255.0)
          ]
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.score).toBe(5); // 5 marks awarded server-side without leaking correct_answer
    });

    it("should atomically transition in_progress submission to submitted (WHERE status = 'in_progress' RETURNING id)", async () => {
      // Seed an in_progress submission for Trainee 1
      DB.submissions.push({
        id: "sub-in-progress-1",
        exam_id: "exam-cr-001",
        unit_code: "ICT/CU/IT/CR/6/6",
        trainee_id: "trainee-001",
        reg_number: "10525",
        student_name: "Alex Kinoti",
        status: "in_progress",
        total_score: null,
        section_a: [],
        section_b: [],
        created_at: new Date().toISOString()
      } as any);

      // Trainee 1 calls PUT /api/submissions/sub-in-progress-1/submit
      const res = await fetch(`${baseUrl}/submissions/sub-in-progress-1/submit`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          payload: {
            answers: { q1: "0" },
            section_a: [{ question_id: "q1", answer: "0" }]
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.id).toBe("sub-in-progress-1");
      expect(data.status).toBe("submitted");

      // Verify the record was updated in DB
      const updatedSub = DB.submissions.find(s => s.id === "sub-in-progress-1");
      expect(updatedSub?.status).toBe("submitted");
      expect((updatedSub as any)?.submitted_at).toBeDefined();
    });

    it("should fail atomic transition when submission is already locked/submitted (idempotency guard)", async () => {
      // Trainee 1 tries to submit already submitted sub-101
      const res = await fetch(`${baseUrl}/submissions/sub-101/submit`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          payload: { answers: { q1: "0" } }
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Locked: Submission has already been completed or is not in progress");
    });

    it("should reject BOLA attempt on atomic submission transition (Trainee A submitting Trainee B's exam)", async () => {
      // Seed an in_progress submission for Trainee 2
      DB.submissions.push({
        id: "sub-in-progress-2",
        exam_id: "exam-cr-001",
        unit_code: "ICT/CU/IT/CR/6/6",
        trainee_id: "trainee-002",
        reg_number: "10526",
        student_name: "Harriet Mwendwa",
        status: "in_progress",
        total_score: null,
        section_a: [],
        section_b: [],
        created_at: new Date().toISOString()
      } as any);

      // Trainee 1 attempts to submit Trainee 2's submission
      const res = await fetch(`${baseUrl}/submissions/sub-in-progress-2/submit`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainee-001",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          payload: { answers: {} }
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (BOLA)");
    });
  });

  // ─── 8. MANDATORY MOD 6: DRAFT VS PUBLISHED MARKS SHIELDING ──────────────────
  describe("8. Continuous Assessment Marks: Draft vs Published Shielding", () => {
    it("should allow Trainee 1 to see their published mark (is_locked: true)", async () => {
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainee-001"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.marks.length).toBe(1);
      expect(data.marks[0].id).toBe("mark-01");
      expect(data.marks[0].is_locked).toBe(true);
    });

    it("should shield draft marks (is_locked: false) from Trainee 2", async () => {
      // Trainee 2 has mark-02 which has is_locked: false
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainee-002"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      // Should NOT see unpublished draft mark!
      expect(data.marks.length).toBe(0);
    });

    it("should allow the assigned Trainer to view both draft and published marks", async () => {
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainer-001"
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.marks.length).toBe(2);
    });

    it("should reject unassigned Trainer from accessing offering marks (HTTP 403)", async () => {
      // Trainer 2 is not assigned to uo-1
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: {
          Authorization: "Bearer token-trainer-002"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: You are not the assigned trainer");
    });
  });

  // ─── 8. REAL LOGIN TOKEN BOLA & RBAC VERIFICATION ───────────────────────────
  describe("8. Real Login Token BOLA & RBAC Coverage (ALLOW_DEMO_AUTH disabled)", () => {
    let origDemoAuth: string | undefined;

    beforeAll(() => {
      origDemoAuth = process.env.ALLOW_DEMO_AUTH;
      delete process.env.ALLOW_DEMO_AUTH;
    });

    afterAll(() => {
      if (origDemoAuth !== undefined) {
        process.env.ALLOW_DEMO_AUTH = origDemoAuth;
      }
    });

    it("prevents Trainee from accessing another trainee's submission using real login token (HTTP 403)", async () => {
      const { token: traineeToken } = await loginAs(baseUrl, "trainee");
      const res = await fetch(`${baseUrl}/submissions/sub-102`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (BOLA)");
    });

    it("allows Trainee to access their own submission using real login token (HTTP 200)", async () => {
      const { token: traineeToken } = await loginAs(baseUrl, "trainee");
      const res = await fetch(`${baseUrl}/submissions/sub-101`, {
        headers: { Authorization: `Bearer ${traineeToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("sub-101");
      expect(data.trainee_id).toBe("trainee-001");
    });

    it("allows assigned Trainer to access offering marks using real login token (HTTP 200)", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");
      const res = await fetch(`${baseUrl}/assessment-marks/uo-1`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.marks.length).toBe(2);
    });

    it("rejects unassigned Trainer from accessing offering marks using real login token (HTTP 403)", async () => {
      const { token: trainerToken } = await loginAs(baseUrl, "trainer");
      const res = await fetch(`${baseUrl}/assessment-marks/uo-3`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: You are not the assigned trainer");
    });

    it("enforces HOD department scope using real login token", async () => {
      if (!DB.exams.some((e) => e.id === "exam-ee-01")) {
        DB.exams.push({
          id: "exam-ee-01",
          unit_id: "unit-ee-1",
          unit_code: "EE/CU/PO/CR/1/6",
          course_name: "Electrical Engineering",
          created_at: new Date().toISOString(),
          payload: {
            title: "Power Systems Exam",
            task_code: "EE1",
            duration_minutes: 60,
            total_marks: 30,
            portal_visible: true,
            section_a: { questions: [] },
            section_b: { questions: [] },
          },
        } as any);
      }
      if (!DB.unit_offerings.some((uo) => uo.id === "uo-ee-1")) {
        DB.unit_offerings.push({
          id: "uo-ee-1",
          unit_id: "unit-ee-1",
          unit_code: "EE/CU/PO/CR/1/6",
          department_id: "dept-ee",
          trainer_id: "trainer-003",
          status: "active",
        } as any);
      }

      const { token: hodToken } = await loginAs(baseUrl, "hod");
      const examRes = await fetch(`${baseUrl}/exams/exam-cr-001`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(examRes.status).toBe(200);

      const crossRes = await fetch(`${baseUrl}/exams/exam-ee-01`, {
        headers: { Authorization: `Bearer ${hodToken}` },
      });
      expect(crossRes.status).toBe(403);
    });
  });
});
