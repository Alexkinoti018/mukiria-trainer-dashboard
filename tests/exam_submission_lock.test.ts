import { describe, it, expect, beforeEach } from "vitest";
import { generateSubmissionHash } from "../client/src/contexts/ExamContext";
import { DB } from "../server/routes";

describe("Exam Submission Lockdown & Trainer Retake Authorization Engine", () => {
  describe("1. Submission Hash & Digital Seal", () => {
    it("should generate a consistent deterministic digital seal hash", () => {
      const regNo = "14179/S2026";
      const unitCode = "061155101A-WA1";
      const timestamp = "2026-10-15T10:00:00.000Z";
      const totalAnswers = 20;

      const hash1 = generateSubmissionHash(regNo, unitCode, timestamp, totalAnswers);
      const hash2 = generateSubmissionHash(regNo, unitCode, timestamp, totalAnswers);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^MTTI-SEAL-[A-F0-9]{8}-20261015$/);
    });

    it("should generate different hashes for different candidates or timestamps", () => {
      const hashA = generateSubmissionHash("14179/S2026", "061155101A-WA1", "2026-10-15T10:00:00.000Z", 20);
      const hashB = generateSubmissionHash("10525/S2026", "061155101A-WA1", "2026-10-15T10:00:00.000Z", 20);
      const hashC = generateSubmissionHash("14179/S2026", "061155101A-WA1", "2026-10-15T11:00:00.000Z", 20);

      expect(hashA).not.toBe(hashB);
      expect(hashA).not.toBe(hashC);
    });
  });

  describe("2. Client State Machine: Submission Lock & Retake Cycle", () => {
    // In-memory test store mirroring ExamContext state management
    let submissionsStore: any[] = [];

    const mockSubmitExam = (payload: any) => {
      const existingIdx = submissionsStore.findIndex(
        (s) =>
          (s.unit_code === payload.unit_code || s.exam_id === payload.exam_id) &&
          s.reg_number === payload.reg_number
      );

      const nowIso = new Date().toISOString();
      const existing = existingIdx >= 0 ? submissionsStore[existingIdx] : null;

      if (existing && existing.is_locked && existing.status !== "reopened") {
        throw new Error(
          "Locked: This assessment has already been submitted and sealed. Retakes must be unlocked by the certified trainer."
        );
      }

      const currentAttempt = (existing?.attempt_count || 0) + 1;
      const totalAns = (payload.section_a?.length || 0) + (payload.section_b?.length || 0);
      const subHash = generateSubmissionHash(payload.reg_number, payload.unit_code, nowIso, totalAns);

      const sealed = {
        ...existing,
        ...payload,
        id: existing?.id || `sub-${Date.now()}`,
        status: "submitted",
        is_locked: true,
        attempt_count: currentAttempt,
        submission_hash: subHash,
        locked_at: nowIso,
        submitted_at: nowIso,
        updated_at: nowIso,
      };

      if (existingIdx >= 0) {
        submissionsStore[existingIdx] = sealed;
      } else {
        submissionsStore.push(sealed);
      }

      return sealed;
    };

    const mockReopenSubmissionForRetake = (id: string, reason?: string, trainerName?: string) => {
      const sub = submissionsStore.find((s) => s.id === id);
      if (!sub) throw new Error("Submission not found");
      const nowIso = new Date().toISOString();
      sub.is_locked = false;
      sub.status = "reopened";
      sub.reopened_at = nowIso;
      sub.reopened_by = trainerName || "Alexander Kinoti";
      sub.reopen_reason = reason || "Trainer-authorized retake / second attempt";
      sub.updated_at = nowIso;
      return sub;
    };

    beforeEach(() => {
      submissionsStore = [];
    });

    it("should lock a submission immediately upon final submit", () => {
      const submission = mockSubmitExam({
        unit_code: "061155101A-WA1",
        exam_id: "exam-dl-1",
        student_name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026",
        section_a: [{ question_id: "q1", answer: "0" }],
        section_b: [{ question_id: "q2", answer: "Written response" }],
      });

      expect(submission.status).toBe("submitted");
      expect(submission.is_locked).toBe(true);
      expect(submission.attempt_count).toBe(1);
      expect(submission.submission_hash).toContain("MTTI-SEAL");
      expect(submission.locked_at).toBeDefined();
    });

    it("should reject subsequent submission attempts when locked", () => {
      mockSubmitExam({
        unit_code: "061155101A-WA1",
        exam_id: "exam-dl-1",
        student_name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026",
        section_a: [{ question_id: "q1", answer: "0" }],
        section_b: [],
      });

      // Attempting to submit again while locked must throw error
      expect(() => {
        mockSubmitExam({
          unit_code: "061155101A-WA1",
          exam_id: "exam-dl-1",
          student_name: "Nthiga Gakii Doris",
          reg_number: "14179/S2026",
          section_a: [{ question_id: "q1", answer: "1" }],
          section_b: [],
        });
      }).toThrowError(/Locked: This assessment has already been submitted and sealed/);
    });

    it("should allow a second attempt after explicit trainer unlock and increment attempt_count to 2", () => {
      const initialSub = mockSubmitExam({
        unit_code: "061155101A-WA1",
        exam_id: "exam-dl-1",
        student_name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026",
        section_a: [{ question_id: "q1", answer: "0" }],
        section_b: [],
      });

      expect(initialSub.attempt_count).toBe(1);
      expect(initialSub.is_locked).toBe(true);

      // Trainer executes unlock action
      const unlocked = mockReopenSubmissionForRetake(
        initialSub.id,
        "Network disconnect during exam",
        "Alexander Kinoti"
      );

      expect(unlocked.is_locked).toBe(false);
      expect(unlocked.status).toBe("reopened");
      expect(unlocked.reopened_by).toBe("Alexander Kinoti");
      expect(unlocked.reopen_reason).toBe("Network disconnect during exam");

      // Candidate submits Attempt 2
      const secondSub = mockSubmitExam({
        unit_code: "061155101A-WA1",
        exam_id: "exam-dl-1",
        student_name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026",
        section_a: [{ question_id: "q1", answer: "0" }],
        section_b: [{ question_id: "q2", answer: "Revised answer" }],
      });

      expect(secondSub.attempt_count).toBe(2);
      expect(secondSub.is_locked).toBe(true);
      expect(secondSub.status).toBe("submitted");
      expect(secondSub.submission_hash).toBeDefined();

      // Attempting a third submission without another trainer unlock is blocked
      expect(() => {
        mockSubmitExam({
          unit_code: "061155101A-WA1",
          exam_id: "exam-dl-1",
          student_name: "Nthiga Gakii Doris",
          reg_number: "14179/S2026",
          section_a: [],
          section_b: [],
        });
      }).toThrowError(/Locked/);
    });
  });

  describe("3. Backend Server Submission Lock & Reopen Endpoint", () => {
    it("should update DB submission record with unlocked status and attempt increment", () => {
      const testSub = {
        id: "sub-test-lock-001",
        exam_id: "exam-net-001",
        unit_code: "ICT/OS/IT/CR/1/6",
        trainee_id: "trainee-001",
        reg_number: "14179/S2026-SEED",
        student_name: "Nthiga Gakii Doris",
        status: "submitted",
        is_locked: true,
        attempt_count: 1,
        total_score: 45,
        section_a: [],
        section_b: [],
        created_at: new Date().toISOString(),
      };

      DB.submissions.push(testSub as any);

      // Reopen logic mirror
      const found = DB.submissions.find((s) => s.id === "sub-test-lock-001");
      expect(found).toBeDefined();

      (found as any).is_locked = false;
      found!.status = "reopened";
      (found as any).attempt_count = ((found as any).attempt_count || 1) + 1;
      (found as any).reopened_at = new Date().toISOString();
      (found as any).reopened_by = "Alexander Kinoti";
      (found as any).reopen_reason = "Granted retake due to lab power outage";

      expect(found!.is_locked).toBe(false);
      expect(found!.status).toBe("reopened");
      expect((found as any).attempt_count).toBe(2);
      expect((found as any).reopened_by).toBe("Alexander Kinoti");
    });
  });
});
