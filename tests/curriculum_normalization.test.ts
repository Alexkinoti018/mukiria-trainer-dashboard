import { describe, it, expect } from "vitest";
import {
  canonicalizeCohortCode,
  canonicalizeUnitTitle,
  extractTradeContext,
  resolveProgramUnitProfile
} from "../client/src/lib/curriculumDatabase";

describe("Part 1: Master Normalization Engine & Resolution Suite", () => {
  it("canonicalizes cohort codes by stripping rogue whitespace and mapping known aliases", () => {
    expect(canonicalizeCohortCode("  ICT4 / ITECH6 / S /  26 MOD 1 ")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ICT4/ITECH6/S/ 26 MOD 1")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ICT4/ITECH6/S/2026 MOD 1")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ADMIN5 / 6 / J / 26 MOD 3")).toBe("ADMIN5/6/J/26 MOD 3");
    expect(canonicalizeCohortCode("FBS5/6/J/26")).toBe("FBS5/6/J/26");
  });

  it("canonicalizes unit titles to TVET CDACC occupational standards", () => {
    expect(canonicalizeUnitTitle("DIGITAL LITERACY")).toBe("Apply Digital Literacy");
    expect(canonicalizeUnitTitle("  APPLY DIGITAL LITERACY  ")).toBe("Apply Digital Literacy");
    expect(canonicalizeUnitTitle("COMMUNICATION SKILLS")).toBe("Demonstrate Communication Skills");
    expect(canonicalizeUnitTitle("NUMERACY")).toBe("Demonstrate Numeracy Skills");
    expect(canonicalizeUnitTitle("COMPUTER ESSENTIALS")).toBe("Perform Computer Essentials");
  });

  it("extracts precise trade context from cohort identifiers", () => {
    const fbsContext = extractTradeContext("FBS5/6/J/26");
    expect(fbsContext.departmentId).toBe("dept-hos");
    expect(fbsContext.departmentName).toBe("Hospitality Management");
    expect(fbsContext.tvetLevel).toBe("Level 6");

    const ictContext = extractTradeContext("ICT4/ITECH6/S/26 MOD 1");
    expect(ictContext.departmentId).toBe("dept-ict");
    expect(ictContext.departmentName).toBe("Computing and Informatics");

    const adminContext = extractTradeContext("ADMIN5/6/J/26 MOD 3");
    expect(adminContext.departmentId).toBe("dept-bus");
    expect(adminContext.departmentName).toBe("Business Studies");
  });

  it("resolves trade-specific unit profiles dynamically (resolving FBS to Hospitality package)", () => {
    const fbsProfile = resolveProgramUnitProfile("FBS5/6/J/26", "DIGITAL LITERACY");
    expect(fbsProfile.canonicalCohortId).toBe("FBS5/6/J/26");
    expect(fbsProfile.unitTitle).toBe("Apply Digital Literacy");
    expect(fbsProfile.unitCode).toBe("061155101A");
    expect(fbsProfile.departmentId).toBe("dept-hos");
    expect(fbsProfile.departmentName).toBe("Hospitality Management");
    expect(fbsProfile.learningOutcomes.length).toBeGreaterThan(0);
    expect(fbsProfile.resolvedStatus).toBe("ALIASED_MATCH");
  });

  it("resolves ICT4/ITECH6 unit profiles accurately without nulls", () => {
    const ictProfile = resolveProgramUnitProfile("ICT4/ITECH6/S/ 26 MOD 1", "Perform Computer Essentials");
    expect(ictProfile.canonicalCohortId).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(ictProfile.unitCode).toBe("IT/CU/ICTA/CR/01/4/MA");
    expect(ictProfile.departmentId).toBe("dept-ict");
    expect(ictProfile.tvetLevel).toBe("Level 4");
    expect(ictProfile.learningOutcomes.length).toBe(5);
  });

  it("accurately matches FBS5/6/J/26 allocated exams to all FBS Level 5 and Level 6 trainees while shielding other cohorts", async () => {
    const { doesExamMatchTraineeCohort, doesCohortTagMatch } = await import("../client/src/lib/supabase");

    // 1. doesCohortTagMatch assertions
    expect(doesCohortTagMatch("FBS 5 MOD/J/2026", "FBS5/6/J/26")).toBe(true);
    expect(doesCohortTagMatch("FBS6 MOD/12026", "FBS5/6/J/26")).toBe(true);
    expect(doesCohortTagMatch("FBS 5 MOD", "FBS5/6/J/26")).toBe(true);
    expect(doesCohortTagMatch("FBS5/6/J/26", "FBS 5 MOD/J/2026")).toBe(true);
    expect(doesCohortTagMatch("ITECH 6 MODULAR/S/2026", "FBS5/6/J/26")).toBe(false);
    expect(doesCohortTagMatch("ADMIN5/6/J/26 MOD 3", "FBS5/6/J/26")).toBe(false);
    expect(doesCohortTagMatch("LS5/6/S/26", "FBS5/6/J/26")).toBe(false);

    // 2. Exam targeted via target_cohorts: ["FBS5/6/J/26"]
    const examWithTargetCohort = {
      id: "exam-fbs-test",
      unit_code: "061155101A-WA1",
      course_name: "Apply Digital Literacy",
      created_at: new Date().toISOString(),
      payload: {
        title: "WRITTEN ASSESSMENT 1",
        portal_visible: true,
        target_cohorts: ["FBS5/6/J/26"],
        duration_minutes: 120,
        total_marks: 70,
        type: "written",
      },
    };

    // Must match Yvonne Mwende (Level 5) and Faith Wavinya (Level 6)
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "FBS 5 MOD/J/2026")).toBe(true);
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "FBS6 MOD/12026")).toBe(true);
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "FBS5/6/J/26")).toBe(true);

    // Must NOT match ITECH 6 or ICT 4 or ADMIN trainees
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "ITECH 6 MODULAR/S/2026")).toBe(false);
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "ICT4 MOD/S/2026")).toBe(false);
    expect(doesExamMatchTraineeCohort(examWithTargetCohort, "ADMIN5/6/J/26 MOD 3")).toBe(false);

    // 3. Exam targeted via class: "FBS5/6/J/26"
    const examWithClass = {
      id: "exam-fbs-class",
      unit_code: "FBS/OS/HOS/BC/01/5/MA",
      course_name: "Food & Beverage Operations",
      created_at: new Date().toISOString(),
      payload: {
        title: "Beverage Service CAT 1",
        portal_visible: true,
        class: "FBS5/6/J/26",
        duration_minutes: 90,
        total_marks: 50,
        type: "written",
      },
    };

    expect(doesExamMatchTraineeCohort(examWithClass, "FBS 5 MOD/J/2026")).toBe(true);
    expect(doesExamMatchTraineeCohort(examWithClass, "FBS6 MOD/12026")).toBe(true);
    expect(doesExamMatchTraineeCohort(examWithClass, "ITECH 6 MODULAR/S/2026")).toBe(false);
  });
});
