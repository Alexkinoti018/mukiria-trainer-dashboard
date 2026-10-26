import { describe, it, expect } from "vitest";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import { MOCK_EXAMS } from "../client/src/lib/mockData";
import { doesExamMatchTraineeCohort, doesCohortTagMatch } from "../client/src/lib/supabase";

describe("FBS Trainees Cohort Access Regression Suite", () => {
  const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter((t) => {
    const code = (t.classCode || "").toUpperCase();
    const dept = (t.department || "").toUpperCase();
    return code.includes("FBS") || code.includes("FBP") || dept.includes("FBS") || dept.includes("HOSPITALITY");
  });

  const fbsExams = (MOCK_EXAMS as any[]).filter((e) => {
    const u = (e.unit_code || "").toUpperCase();
    const c = (e.payload?.class || "").toUpperCase();
    const t = (e.payload?.target_cohorts || []).join(" ").toUpperCase();
    return u.includes("061155101A") || c.includes("FBS") || t.includes("FBS");
  });

  it("verifies all 23 FBS trainees are present in official roster", () => {
    expect(fbsTrainees.length).toBe(23);
  });

  it("ensures every FBS trainee matches all FBS exams and continuous assessment CATs when enrolledUnits are present", () => {
    expect(fbsExams.length).toBeGreaterThan(0);
    for (const exam of fbsExams) {
      for (const trainee of fbsTrainees) {
        const matches = doesExamMatchTraineeCohort(exam, trainee.classCode, ["061155101A"]);
        expect(
          matches,
          `Trainee ${trainee.name} (${trainee.admNo}, class: ${trainee.classCode}) failed to match exam ${exam.id}`
        ).toBe(true);
      }
    }
  });

  it("ensures every FBS trainee matches all FBS exams solely via cohort code without enrolledUnits", () => {
    for (const exam of fbsExams) {
      for (const trainee of fbsTrainees) {
        const matches = doesExamMatchTraineeCohort(exam, trainee.classCode, undefined);
        expect(
          matches,
          `Trainee ${trainee.name} (${trainee.admNo}, class: ${trainee.classCode}) failed cohort-only match for exam ${exam.id}`
        ).toBe(true);
      }
    }
  });

  it("verifies cross-level canonical matching for FBS5 and FBS6", () => {
    expect(doesCohortTagMatch("FBS 5 MOD/J/2026", "FBS5/6/J/26")).toBe(true);
    expect(doesCohortTagMatch("FBS6 MOD/12026", "FBS5/6/J/26")).toBe(true);
    expect(doesCohortTagMatch("FBS 5 MOD", "FBS6 MOD")).toBe(true);
    expect(doesCohortTagMatch("FBS6 MOD/12026", "FBS 5 MOD/J/2026")).toBe(true);
  });
});
