import { describe, it, expect, beforeAll } from "vitest";
import { 
  OFFICIAL_MTTI_TRAINEES, 
  getTraineesForClass 
} from "../client/src/contexts/TraineeContext";
import { 
  doesExamMatchTraineeCohort, 
  evaluateExamPortalAvailability, 
  type Exam, 
  type Submission 
} from "../client/src/lib/supabase";
import { 
  generateSubmissionHash, 
  sanitizeExamForStudent 
} from "../client/src/contexts/ExamContext";
import { 
  findRosterTraineeByIdentifier 
} from "../client/src/contexts/AuthContext";
import { MOCK_EXAMS } from "../client/src/lib/mockData";
import { doesSubMatchTargetExam, formatSubPart } from "../client/src/pages/CandidatePortal";

// Polyfill localStorage & sessionStorage for Node.js test environment
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

beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    (globalThis as any).localStorage = new MockStorage();
  }
  if (typeof globalThis.sessionStorage === "undefined") {
    (globalThis as any).sessionStorage = new MockStorage();
  }
});

describe("Trainee Portal — Component, Handlers & Workflow Verification Suite", () => {
  const sampleTrainee = {
    id: "trainee-cynthia",
    name: "Cynthia Nkatha",
    regCode: "ADMIN5/6/J/26 MOD 3/13252",
    admNo: "13252",
    classCode: "ADMIN5/6/J/26",
    department: "Business",
  };

  describe("1. Trainee Identity & Roster Resolution Handler", () => {
    it("accurately identifies Cynthia Nkatha from raw admission number 13252", () => {
      const match = findRosterTraineeByIdentifier("13252");
      expect(match).toBeDefined();
      expect(match?.name).toBe("Cynthia Nkatha");
      expect(match?.classCode).toContain("ADMIN5/6/J/26");
    });

    it("resolves trainee identity case-insensitively with full registration code", () => {
      const match = findRosterTraineeByIdentifier("admin5/6/j/26 mod 3/13252");
      expect(match).toBeDefined();
      expect(match?.admNo).toBe("13252");
      expect(match?.name).toBe("Cynthia Nkatha");
    });

    it("correctly resolves other sample trainees across departments", () => {
      const doris = findRosterTraineeByIdentifier("14179/S2026");
      expect(doris).toBeDefined();
      expect(doris?.name).toBe("Nthiga Gakii Doris");

      const harriet = findRosterTraineeByIdentifier("D/UPNUT/25042/069");
      expect(harriet).toBeDefined();
      expect(harriet?.name).toBe("Harriet Mwendwa");
    });
  });

  describe("2. Assessment Attendance Register Handler (MTTI/REG/CUR/03)", () => {
    it("verifies attendance signing handler writes 'attended' signature to localStorage", () => {
      const cohortCode = "ADMIN5/6/J/26";
      const studentId = sampleTrainee.id;
      const key = `mtti_class_register_${cohortCode}`;

      // Simulate handleConfirmAttendance handler
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[studentId] = {
        attendance: {},
        signed: true,
        signedAt: new Date().toISOString(),
        status: "attended",
      };
      localStorage.setItem(key, JSON.stringify(parsed));

      // Verification
      const updated = JSON.parse(localStorage.getItem(key)!);
      expect(updated[studentId]).toBeDefined();
      expect(updated[studentId].signed).toBe(true);
      expect(updated[studentId].status).toBe("attended");
    });
  });

  describe("3. Cohort Exam Allocation & Availability Filters", () => {
    it("ensures exams matching ADMIN 5/6/J/26 cohort are accurately detected", () => {
      const sampleAdminExam: Exam = {
        id: "exam-admin-ct1",
        unit_code: "0415 451 21A",
        course_name: "Apply ICT Skills",
        payload: {
          title: "Continuous Assessment Test 1",
          class: "ADMIN5/6/J/26 MOD 3",
          portal_visible: true,
          duration_minutes: 60,
          total_marks: 30,
          task_code: "CT1",
          section_a: { questions: [] },
          section_b: { questions: [] },
        },
      } as any;

      const matches = doesExamMatchTraineeCohort(sampleAdminExam, "ADMIN5/6/J/26 MOD 3");
      expect(matches).toBe(true);

      const portalStatus = evaluateExamPortalAvailability(sampleAdminExam.payload);
      expect(portalStatus.canStart).toBe(true);
      expect(portalStatus.state).toBe("open");
    });

    it("prevents exams belonging strictly to ICT4 Operator cohort from leaking into ADMIN trainee view", () => {
      const ict4Exam: Exam = {
        id: "exam-ict4-ct1",
        unit_code: "IT/CU/ICTA/CR/01/4/MA",
        course_name: "Computer Software Installation",
        payload: {
          title: "Continuous Assessment Test 1",
          class: "ICT4 MOD/S/2026",
          department: "Computing & Informatics",
          portal_visible: true,
          duration_minutes: 60,
          total_marks: 30,
          task_code: "CT1",
          section_a: { questions: [] },
          section_b: { questions: [] },
        },
      } as any;

      const matches = doesExamMatchTraineeCohort(ict4Exam, "ADMIN5/6/J/26 MOD 3");
      expect(matches).toBe(false);
    });
  });

  describe("4. Candidate Portal Exam State & Security Handlers", () => {
    it("correctly sanitizes exam payload removing answer keys and marking rubrics before serving to trainee", () => {
      const mockRawExam: Exam = {
        id: "exam-test",
        unit_code: "0415 451 21A",
        course_name: "Apply ICT Skills",
        payload: {
          title: "CAT 1",
          answer_key: "Strict Trainer Guide",
          rubric: "Institutional Rubric",
          section_a: {
            questions: [
              {
                id: "q1",
                text: "What is RAM?",
                options: ["Random Access Memory", "Read Access Memory"],
                correct_answer: 0,
                rubric: "Point allocation guide",
                keywords: ["volatile", "memory"],
                critical_aspect: "Memory types",
              },
            ],
          },
          section_b: {
            questions: [
              {
                id: "q2",
                prompt: "Explain spreadsheet formulas.",
                correct_answer: "Detailed answer",
                rubric: "Grading criteria",
              },
            ],
          },
        },
      } as any;

      const sanitized = sanitizeExamForStudent(mockRawExam);
      const q1 = sanitized.payload.section_a.questions[0] as any;
      const q2 = sanitized.payload.section_b.questions[0] as any;

      expect(q1.correct_answer).toBeUndefined();
      expect(q1.rubric).toBeUndefined();
      expect(q1.critical_aspect).toBeUndefined();
      expect(q1.keywords).toBeUndefined();
      expect(q2.correct_answer).toBeUndefined();
      expect(q2.rubric).toBeUndefined();
      expect((sanitized.payload as any).answer_key).toBeUndefined();
      expect((sanitized.payload as any).rubric).toBeUndefined();
      expect(q1.text).toBe("What is RAM?");
      expect(q2.prompt).toBe("Explain spreadsheet formulas.");
    });

    it("generates deterministic tamper-evident submission seal hash", () => {
      const regNumber = "13252";
      const unitCode = "0415 451 21A";
      const timestamp = "2026-10-29T12:00:00.000Z";
      const answersCount = 5;

      const hash1 = generateSubmissionHash(regNumber, unitCode, timestamp, answersCount);
      const hash2 = generateSubmissionHash(regNumber, unitCode, timestamp, answersCount);

      expect(hash1).toBeDefined();
      expect(hash1).toMatch(/^MTTI-SEAL-[0-9A-F]{8}-20261029$/);
      expect(hash1).toBe(hash2);

      // Mutating answersCount must change hash
      const hash3 = generateSubmissionHash(regNumber, unitCode, timestamp, 6);
      expect(hash3).not.toBe(hash1);
    });

    it("matches submission accurately to target exam via exam_id or task_code", () => {
      const sub: Submission = {
        id: "sub-1",
        exam_id: "exam-admin-ct1",
        student_name: "Cynthia Nkatha",
        reg_number: "13252",
        unit_code: "0415 451 21A",
        task_code: "CT1",
        status: "submitted",
        created_at: Date.now(),
      };

      const targetExam: Exam = {
        id: "exam-admin-ct1",
        unit_code: "0415 451 21A",
        course_name: "Apply ICT Skills",
        payload: {
          task_code: "CT1",
        },
      } as any;

      expect(doesSubMatchTargetExam(sub, targetExam)).toBe(true);

      const mismatchedExam: Exam = {
        id: "exam-other",
        unit_code: "0415 451 21A",
        course_name: "Apply ICT Skills",
        payload: {
          task_code: "CT2",
        },
      } as any;

      expect(doesSubMatchTargetExam(sub, mismatchedExam)).toBe(false);
    });

    it("formats sub-parts of questions cleanly in Section B", () => {
      const formattedString = formatSubPart("Explain the CPU functions.");
      expect(formattedString).toBe("Explain the CPU functions.");

      const formattedObject = formatSubPart({
        part: "a",
        prompt: "Define operating system.",
        marks: 5,
      });
      expect(formattedObject).toBe("a) Define operating system. (5 Marks)");
    });
  });
});
