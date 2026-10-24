import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { 
  syncExamSubmissionToAssessmentRegister,
  loadClassAttendanceRegister,
  saveClassAttendanceRegister 
} from "../client/src/lib/attendanceStorage";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";

// Provide Storage mock for Node test runner environment
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
});

describe("Assessment Attendance Register (CUR/03) & Online Exam Linkage", () => {
  const cohort = "ICT4/ITECH6/S/26 MOD 1";

  beforeEach(() => {
    localStorage.clear();
    // Seed existing official roster
    localStorage.setItem("mtti_trainees", JSON.stringify(OFFICIAL_MTTI_TRAINEES));
    // Seed initial register
    saveClassAttendanceRegister(cohort, {
      tr_it6_01: {
        attendance: { W1_S1: "X", W1_S2: "X" },
        signed: false,
      },
    });
  });

  it("1. Marks register as 'attended' (signed = true) upon online exam submission", () => {
    const result = syncExamSubmissionToAssessmentRegister({
      studentName: "Nthiga Gakii Doris",
      regNumber: "14179/S2026",
      classCode: cohort,
      unitCode: "061155101A",
      examTitle: "Apply Digital Literacy - Written Assessment 1",
    });

    expect(result.marked).toBe(true);
    expect(result.assessmentType).toBe("Written Assessment 1");

    // Verify CUR/03 register updated
    const register = loadClassAttendanceRegister(cohort);
    expect(register["tr_it6_01"].signed).toBe(true);
    expect(register["tr_it6_01"].assessmentType).toBe("Written Assessment 1");
    // Verify attendance history is preserved non-destructively
    expect(register["tr_it6_01"].attendance["W1_S1"]).toBe("X");
    expect(register["tr_it6_01"].attendance["W1_S2"]).toBe("X");
  });

  it("2. Automatically adds candidate to the register and roster if missing", () => {
    const missingCandidateAdm = "19999/MOD/2026";
    const missingCandidateName = "Grace Wanjiku New";

    const result = syncExamSubmissionToAssessmentRegister({
      studentName: missingCandidateName,
      regNumber: missingCandidateAdm,
      classCode: cohort,
      unitCode: "061155101A",
      examTitle: "Apply Digital Literacy - Written Assessment 2 (Computer Systems & OS)",
    });

    expect(result.marked).toBe(true);
    expect(result.traineeAdded).toBe(true);
    expect(result.assessmentType).toBe("Written Assessment 2");

    // Verify candidate is now in mtti_trainees
    const storedTrainees = JSON.parse(localStorage.getItem("mtti_trainees") || "[]");
    const foundInRoster = storedTrainees.find((t: any) => t.admNo === missingCandidateAdm);
    expect(foundInRoster).toBeDefined();
    expect(foundInRoster.name).toBe(missingCandidateName);

    // Verify candidate is recorded in CUR/03 register as attended
    const register = loadClassAttendanceRegister(cohort);
    const traineeRecord = register[result.traineeId];
    expect(traineeRecord).toBeDefined();
    expect(traineeRecord.signed).toBe(true);
    expect(traineeRecord.assessmentType).toBe("Written Assessment 2");
  });

  it("3. Records distinct assessment types (Written Assessment 1, 2, 3, CAT 1)", () => {
    const res1 = syncExamSubmissionToAssessmentRegister({
      studentName: "Nthiga Gakii Doris",
      regNumber: "14179/S2026",
      classCode: cohort,
      examTitle: "Written Assessment 3",
    });
    expect(res1.assessmentType).toBe("Written Assessment 3");

    const res2 = syncExamSubmissionToAssessmentRegister({
      studentName: "Nthiga Gakii Doris",
      regNumber: "14179/S2026",
      classCode: cohort,
      examTitle: "CAT 1 - Manage Computer Devices",
    });
    expect(res2.assessmentType).toBe("Continuous Assessment Test 1 (CAT 1)");
  });

  it("4. Non-destructive: preserves existing roster and does not wipe out other candidates", () => {
    const initialTrainees = JSON.parse(localStorage.getItem("mtti_trainees") || "[]");
    const initialCount = initialTrainees.length;

    syncExamSubmissionToAssessmentRegister({
      studentName: "Brenda Ngugi",
      regNumber: "14254/S2026",
      classCode: cohort,
      examTitle: "Written Assessment 1",
    });

    const afterTrainees = JSON.parse(localStorage.getItem("mtti_trainees") || "[]");
    expect(afterTrainees.length).toBe(initialCount); // Did not delete or duplicate existing
    expect(afterTrainees.some((t: any) => t.admNo === "14254/S2026")).toBe(true);
    expect(afterTrainees.some((t: any) => t.admNo === "14179/S2026")).toBe(true);
  });
});
