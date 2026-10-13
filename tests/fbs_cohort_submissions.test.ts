import { describe, it, expect } from "vitest";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import { MOCK_SUBMISSIONS } from "../client/src/lib/mockData";
import { FBS_COHORT_SUBMISSIONS } from "../client/src/lib/fbsCohortSubmissions";

describe("FBS5/6/J/26 Cohort Exam Submissions & Marks Safeguard", () => {
  const fbsRoster = OFFICIAL_MTTI_TRAINEES.filter((t) => {
    const code = (t.classCode || "").toUpperCase();
    return code.includes("FBS") || code.includes("FBP");
  });

  it("verifies that all FBS cohort trainees exist in the institutional roster (29 trainees)", () => {
    expect(fbsRoster.length).toBe(29);
  });

  it("verifies that every single FBS trainee has a recorded submission for 061155101A-WA1", () => {
    const fbsSubmissions = MOCK_SUBMISSIONS.filter((s) => s.unit_code === "061155101A-WA1");

    for (const trainee of fbsRoster) {
      const traineeAdm = (trainee.admNo || "").trim();
      const match = fbsSubmissions.find(
        (sub) =>
          sub.reg_number.trim() === traineeAdm ||
          (sub.trainee_id && sub.trainee_id === trainee.id) ||
          sub.student_name.trim().toLowerCase() === trainee.name.trim().toLowerCase()
      );

      expect(
        match,
        `Expected completed submission for trainee ${trainee.name} (Adm: ${traineeAdm})`
      ).toBeDefined();

      if (match) {
        expect(match.status).toMatch(/graded|submitted/);
        expect(match.total_score).toBeGreaterThanOrEqual(40);
        expect(match.total_score).toBeLessThanOrEqual(70);
        expect(match.section_a.length).toBeGreaterThan(0);
        expect(match.section_b.length).toBeGreaterThan(0);
        expect(match.trainer_comments).toBeTruthy();
      }
    }
  });

  it("verifies key candidates Faith Mwende (13258), Eugene Murimi (12265), and Brendah Mumbi (13231)", () => {
    const faith = MOCK_SUBMISSIONS.find((s) => s.reg_number === "13258");
    const eugene = MOCK_SUBMISSIONS.find((s) => s.reg_number === "12265");
    const brendah = MOCK_SUBMISSIONS.find((s) => s.reg_number === "13231");

    expect(faith).toBeDefined();
    expect(faith?.student_name).toBe("Faith Mwende");
    expect(faith?.total_score).toBeGreaterThan(50);

    expect(eugene).toBeDefined();
    expect(eugene?.student_name).toBe("Eugene Murimi");
    expect(eugene?.total_score).toBeGreaterThan(50);

    expect(brendah).toBeDefined();
    expect(brendah?.student_name).toBe("Brendah Mumbi");
    expect(brendah?.total_score).toBeGreaterThan(50);
  });

  it("verifies that Section A answers are complete and Section B structured answers are recorded", () => {
    for (const sub of FBS_COHORT_SUBMISSIONS) {
      expect(sub.section_a.length).toBe(10);
      expect(sub.section_b.length).toBe(2);

      // Section A questions
      for (const a of sub.section_a) {
        expect(a.answer).toBeTruthy();
        expect(typeof a.marks_awarded).toBe("number");
      }

      // Section B structured questions
      for (const b of sub.section_b) {
        expect(b.answer).toBeTruthy();
        expect(typeof b.marks_awarded).toBe("number");
        expect(b.marks_awarded).toBeGreaterThan(0);
      }
    }
  });
});
