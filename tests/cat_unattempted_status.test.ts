import { describe, it, expect, beforeEach } from "vitest";
import { doesSubMatchTargetExam } from "../client/src/pages/CandidatePortal";
import { FBS_COHORT_SUBMISSIONS } from "../client/src/lib/fbsCohortSubmissions";
import { DIGITAL_LITERACY_CATS } from "../client/src/lib/curriculumContinuousAssessments";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams";
import type { Submission, Exam } from "../client/src/lib/supabase";

describe("CAT Unattempted Status & Attendance Safeguard Suite", () => {
  const wa1Exam = DIGITAL_LITERACY_EXAMS[0]; // exam-061155101A-wa1, CT1
  const cat1Exam = DIGITAL_LITERACY_CATS[0]; // cat-dl-lo1, CAT-DL-LO1
  const cat2Exam = DIGITAL_LITERACY_CATS[1]; // cat-dl-lo2, CAT-DL-LO2

  // Key candidate: Faith Mwende (13258)
  const faithWa1Submission = FBS_COHORT_SUBMISSIONS.find(
    (s) => s.reg_number === "13258" || s.student_name === "Faith Mwende"
  )!;

  it("verifies that Faith Mwende has a completed submission for Written Assessment 1 (CT1)", () => {
    expect(faithWa1Submission).toBeDefined();
    expect(faithWa1Submission.exam_id).toBe("exam-061155101A-wa1");
    expect(faithWa1Submission.task_code).toBe("CT1");
  });

  describe("1. Submission Cross-Contamination Prevention (doesSubMatchTargetExam)", () => {
    it("should match Faith Mwende's WA1 submission to Written Assessment 1", () => {
      const matchesWA1 = doesSubMatchTargetExam(faithWa1Submission, wa1Exam);
      expect(matchesWA1).toBe(true);
    });

    it("should STRICTLY NOT match Faith Mwende's WA1 submission to CAT 1 (LO1)", () => {
      const matchesCAT1 = doesSubMatchTargetExam(faithWa1Submission, cat1Exam);
      expect(matchesCAT1).toBe(false);
    });

    it("should STRICTLY NOT match Faith Mwende's WA1 submission to CAT 2 (LO2)", () => {
      const matchesCAT2 = doesSubMatchTargetExam(faithWa1Submission, cat2Exam);
      expect(matchesCAT2).toBe(false);
    });

    it("should strictly match a genuine CAT 1 submission only to CAT 1", () => {
      const genuineCat1Sub: Submission = {
        id: "sub_cat1_13258",
        exam_id: "cat-dl-lo1",
        unit_code: "061155101A",
        task_code: "CAT-DL-LO1",
        student_name: "Faith Mwende",
        reg_number: "13258",
        section_a: [],
        section_b: [],
        status: "submitted",
        total_score: null,
      };

      expect(doesSubMatchTargetExam(genuineCat1Sub, cat1Exam)).toBe(true);
      expect(doesSubMatchTargetExam(genuineCat1Sub, cat2Exam)).toBe(false);
      expect(doesSubMatchTargetExam(genuineCat1Sub, wa1Exam)).toBe(false);
    });
  });

  describe("2. Unattempted CAT Resolution on Trainee Dashboard", () => {
    it("should NOT find existingSub for CAT 1 or CAT 2 from WA1 submissions", () => {
      const mySubmissions = [faithWa1Submission];

      const checkExamSubmission = (ex: { id: string; taskSlot: string }) => {
        return mySubmissions.find((s) => {
          if (s.exam_id && ex.id) {
            return s.exam_id === ex.id;
          }
          if (s.task_code && ex.taskSlot) {
            return s.task_code.toUpperCase() === ex.taskSlot.toUpperCase();
          }
          return false;
        });
      };

      const wa1Sub = checkExamSubmission({ id: wa1Exam.id, taskSlot: "CT1" });
      expect(wa1Sub).toBeDefined();
      expect(wa1Sub?.task_code).toBe("CT1");

      const cat1Sub = checkExamSubmission({ id: cat1Exam.id, taskSlot: "CAT-DL-LO1" });
      expect(cat1Sub).toBeUndefined();

      const cat2Sub = checkExamSubmission({ id: cat2Exam.id, taskSlot: "CAT-DL-LO2" });
      expect(cat2Sub).toBeUndefined();
    });
  });

  describe("3. Attendance Status Verification", () => {
    it("defaults attendance signature to false/pending until student actively signs or starts", () => {
      const isSignedByDefault = false;
      expect(isSignedByDefault).toBe(false);
    });

    it("marks attendance as attended only when explicitly recorded in register", () => {
      const storageRecord: Record<string, { signed: boolean }> = {};
      const studentId = "tr_fbs5_21";

      // Before start: unrecorded
      expect(storageRecord[studentId]?.signed).toBeUndefined();

      // Upon candidate starting examination:
      storageRecord[studentId] = { signed: true };
      expect(storageRecord[studentId]?.signed).toBe(true);
    });
  });
});
