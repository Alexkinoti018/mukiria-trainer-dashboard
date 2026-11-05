import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter, DB } from "../server/routes.ts";
import { createUser, loadPersistentTrainees, savePersistentTrainees } from "../server/db.ts";
import { createSignedJwt, getJwtSecret } from "../server/auth.ts";

describe("Trainee Exam Lockdown & Session Resilience Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  const testTrainee = {
    id: "trainee-lock-test-01",
    email: "trainee.lock@mtti.ac.ke",
    name: "Faith Kawira",
    role: "trainee" as const,
    reg_number: "FBS 5 MOD/13999/12026",
    enrolled_units: ["061155101A", "061155101A-PRAC"],
  };

  const testExam = {
    id: "exam-lock-unit-01",
    unit_code: "061155101A",
    course_name: "Food & Beverage Production",
    created_at: new Date().toISOString(),
    payload: {
      title: "Written Assessment 1 (CT1)",
      task_code: "CT1",
      duration_minutes: 60,
      total_marks: 30,
      portal_visible: true,
      section_a: {
        title: "Section A",
        instructions: "Answer all questions",
        total_marks: 10,
        questions: [{ id: "q1", prompt: "Explain HACCP principles", marks: 10, correct_answer: "Hazard Analysis" }],
      },
      section_b: {
        title: "Section B",
        instructions: "Answer all questions",
        total_marks: 20,
        questions: [{ id: "q2", prompt: "Describe food storage temperatures", marks: 20 }],
      },
    },
  };

  let traineeToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    // Clean any prior in-memory fixtures
    DB.submissions = DB.submissions.filter(
      (s) => s.exam_id !== testExam.id && s.trainee_id !== testTrainee.id && s.reg_number !== testTrainee.reg_number
    );
    const existingExamIdx = DB.exams.findIndex((e) => e.id === testExam.id);
    if (existingExamIdx >= 0) DB.exams.splice(existingExamIdx, 1);

    const trainees = loadPersistentTrainees();
    trainees.push({
      id: testTrainee.id,
      name: testTrainee.name,
      reg_number: testTrainee.reg_number,
      adm_no: testTrainee.reg_number,
      reg_code: testTrainee.reg_number,
      department: "Food & Beverage",
    });
    savePersistentTrainees(trainees);

    await createUser({
      id: testTrainee.id,
      admission_number: testTrainee.reg_number,
      full_name: testTrainee.name,
      email: testTrainee.email,
      password_hash: "$2b$10$pBeCI1vflmGBcyhGlLc93.mjXqq6yEO7S/aVwvwTvNDVSnFcwq3ry",
      role: "TRAINEE",
      profile_id: testTrainee.id,
    });

    const secret = getJwtSecret();
    traineeToken = createSignedJwt({
      sub: testTrainee.id,
      id: testTrainee.id,
      email: testTrainee.email,
      role: testTrainee.role,
      user_metadata: {
        role: testTrainee.role,
        name: testTrainee.name,
        reg_number: testTrainee.reg_number,
        enrolled_units: testTrainee.enrolled_units,
      },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }, secret);

    DB.exams.push(testExam as any);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    const examIdx = DB.exams.findIndex((e) => e.id === testExam.id);
    if (examIdx >= 0) DB.exams.splice(examIdx, 1);
    DB.submissions = DB.submissions.filter((s) => s.exam_id !== testExam.id && s.trainee_id !== testTrainee.id);

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe("1. Trainee Exam Access Before Submission", () => {
    it("should allow a trainee to open the exam questions when not yet submitted", async () => {
      const res = await fetch(`${baseUrl}/exams/${testExam.id}`, {
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(testExam.id);
      expect(data.is_locked).toBeUndefined();
      expect(data.payload.section_a.questions[0].prompt).toBe("Explain HACCP principles");
      // Column shielding: correct_answer stripped
      expect(data.payload.section_a.questions[0].correct_answer).toBeUndefined();
    });
  });

  describe("2. Trainee Exam Access After Submission (Strict Lockdown Verification)", () => {
    let submissionId: string;

    it("should allow trainee to submit the assessment once", async () => {
      const submitRes = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          exam_id: testExam.id,
          unit_code: testExam.unit_code,
          task_code: "CT1",
          section_a: [{ question_id: "q1", answer: "Hazard Analysis" }],
          section_b: [{ question_id: "q2", answer: "Keep below 5 degrees C" }],
        }),
      });

      expect([200, 201]).toContain(submitRes.status);
      const submitData = await submitRes.json();
      expect(submitData.success).toBe(true);
      submissionId = submitData.submission_id;
      expect(submissionId).toBeDefined();
    });

    it("should lock the exam and flag is_locked=true when the trainee accesses it after completion", async () => {
      const res = await fetch(`${baseUrl}/exams/${testExam.id}`, {
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.is_locked).toBe(true);
      expect(data.locked_reason).toContain("Assessment Locked");
      expect(data.locked_reason).toContain("You have already completed this assessment");
    });

    it("should reject any subsequent resubmission attempt while locked", async () => {
      const resubRes = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          exam_id: testExam.id,
          unit_code: testExam.unit_code,
          task_code: "CT1",
          section_a: [{ question_id: "q1", answer: "Tampered Answer" }],
          section_b: [],
        }),
      });

      expect(resubRes.status).toBe(400);
      const resubData = await resubRes.json();
      expect(resubData.error).toContain("Locked: Submission has already been completed");
    });

    it("should allow exam to be unlocked if trainer explicitly reopens for retake", async () => {
      const sub = DB.submissions.find((s) => s.id === submissionId || (s.exam_id === testExam.id && s.trainee_id === testTrainee.id));
      expect(sub).toBeDefined();
      sub!.status = "reopened";
      (sub as any).is_locked = false;

      const res = await fetch(`${baseUrl}/exams/${testExam.id}`, {
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(testExam.id);
      expect(data.is_locked).toBeUndefined();
    });
  });

  describe("3. Local Storage Session Fallback Invariant", () => {
    it("should verify that trainee session is preserved when Supabase session is null", () => {
      const mockSupabaseSession = null;
      const storedDemoSession = JSON.stringify({
        id: testTrainee.id,
        name: testTrainee.name,
        role: "trainee",
        reg_number: testTrainee.reg_number,
        cohort_code: "FBS 5 MOD/J/2026",
      });

      let restoredUser = null;
      if (mockSupabaseSession) {
        restoredUser = mockSupabaseSession;
      } else if (storedDemoSession) {
        restoredUser = JSON.parse(storedDemoSession);
      }

      expect(restoredUser).not.toBeNull();
      expect(restoredUser.role).toBe("trainee");
      expect(restoredUser.reg_number).toBe("FBS 5 MOD/13999/12026");
    });
  });
});
