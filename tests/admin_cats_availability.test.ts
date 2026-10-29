import { describe, it, expect } from "vitest";
import { APPLY_ICT_SKILLS_CATS } from "../client/src/lib/curriculumContinuousAssessments";
import {
  doesExamMatchTraineeCohort,
  doesCohortTagMatch,
  evaluateExamPortalAvailability,
  type Exam,
} from "../client/src/lib/supabase";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import { doesSubMatchTargetExam } from "../client/src/pages/CandidatePortal";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "../client/src/lib/mockData";
import { resolveCanonicalCohortKey, findCohortByCodeOrAlias } from "../shared/cohortRegistry";
import { normalizeCohortCode } from "../client/src/lib/curriculumDatabase";

describe("ADMIN5/6/J/26 MOD 3 CATs and Exams Verification Suite", () => {
  const adminTrainees = OFFICIAL_MTTI_TRAINEES.filter(
    (t) => t.classCode === "ADMIN5/6/J/26 MOD 3"
  );

  const cohortVariants = [
    "Admin 5/6/j 26",
    "ADMIN 5/6/j 26",
    "ADMIN 5/6/J/26",
    "ADMIN5/6/J/26",
    "ADMIN 5/6/J 26",
    "ADMIN5/6/J 26",
    "ADMIN 5/6/J/26 MOD 3",
    "ADMIN5/6/J/26 MOD 3",
    "ADMIN5/6/J/2026",
    "ADMIN 5/6/J/2026",
    "ADMIN5/6/J/256 MOD 3",
  ];

  it("should have all 11 registered trainees for ADMIN5/6/J/26 MOD 3 in official roster", () => {
    expect(adminTrainees.length).toBe(11);
    const admNumbers = adminTrainees.map((t) => t.admNo);
    expect(admNumbers).toContain("13410"); // Risper Mwende
    expect(admNumbers).toContain("13527"); // Banta Micheni
    expect(admNumbers).toContain("12218"); // Christine Gitonga
    expect(admNumbers).toContain("13252"); // Cynthia Nkatha
    expect(admNumbers).toContain("13284"); // Linet Ntinyari
    expect(admNumbers).toContain("13424"); // Nanis Ngugi
    expect(admNumbers).toContain("13276"); // Sharon Minoo
    expect(admNumbers).toContain("10203"); // Frida Kianjira
    expect(admNumbers).toContain("12254"); // Mercy Kiende
    expect(admNumbers).toContain("12665"); // Ruth Kathure
    expect(admNumbers).toContain("13580"); // MERCY KATHUURE
  });

  describe("1. Master CAT Availability & TVET CDACC 15-Mark Structure", () => {
    it("should provide exactly 3 Continuous Assessment Tests for Apply ICT Skills (0415-451-21A)", () => {
      expect(APPLY_ICT_SKILLS_CATS.length).toBe(3);

      const cat1 = APPLY_ICT_SKILLS_CATS.find((c) => c.id === "cat-ict-lo1");
      const cat2 = APPLY_ICT_SKILLS_CATS.find((c) => c.id === "cat-ict-lo2");
      const cat3 = APPLY_ICT_SKILLS_CATS.find((c) => c.id === "cat-ict-lo3");

      expect(cat1).toBeDefined();
      expect(cat2).toBeDefined();
      expect(cat3).toBeDefined();

      [cat1!, cat2!, cat3!].forEach((cat) => {
        expect(cat.unit_code).toBe("0415-451-21A");
        expect(cat.payload.assessment_category).toBe("CAT");
        expect(cat.payload.total_marks).toBe(15);
        expect(cat.payload.duration_minutes).toBe(30);
        expect(cat.payload.portal_visible).toBe(true);
        expect(cat.payload.section_a?.questions.length).toBeGreaterThan(0);
      });
    });

    it("should have all 3 CATs in OPEN state with canStart: true for candidate portal access", () => {
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        const portalStatus = evaluateExamPortalAvailability(cat.payload);
        expect(portalStatus.isVisible).toBe(true);
        expect(portalStatus.canStart).toBe(true);
        expect(portalStatus.state).toBe("open");
        expect(portalStatus.categoryLabel).toBe("CAT");
      });
    });
  });

  describe("2. Summative Assessment Suite (WA1, WA2, WA3, and PRAC)", () => {
    const wa1 = (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa1-0415");
    const wa2 = (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa2-0415");
    const wa3 = (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa3-0415");
    const prac = (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-prac-0415");

    it("should have all 4 terminal assessments properly configured in mock data", () => {
      expect(wa1).toBeDefined();
      expect(wa2).toBeDefined();
      expect(wa3).toBeDefined();
      expect(prac).toBeDefined();

      expect(wa1!.payload.task_code).toBe("CT1");
      expect(wa2!.payload.task_code).toBe("CT2");
      expect(wa3!.payload.task_code).toBe("CT3");
      expect(prac!.payload.task_code).toBe("CP1");

      expect(wa1!.payload.assessment_category).toBe("Exam");
      expect(wa2!.payload.assessment_category).toBe("Exam");
      expect(wa3!.payload.assessment_category).toBe("Exam");
      expect(prac!.payload.assessment_category).toBe("Practical");
    });

    it("should verify Section B consists of structured/essay questions (not short answer)", () => {
      [wa1!, wa2!, wa3!].forEach((exam) => {
        const secB = exam.payload.section_b;
        expect(secB).toBeDefined();
        expect(secB!.questions.length).toBeGreaterThan(0);
        secB!.questions.forEach((q) => {
          expect(["essay", "structured"]).toContain(q.type);
          expect(q.marks).toBeGreaterThanOrEqual(10);
        });
      });
    });
  });

  describe("3. Cohort Code Normalization & Multi-Variant Matching", () => {
    it("should resolve all cohort variants to the canonical ADMIN5_6_MOD3 key", () => {
      cohortVariants.forEach((variant) => {
        const canonicalKey = resolveCanonicalCohortKey(variant);
        expect(canonicalKey).toBe("ADMIN5_6_MOD3");

        const cohortDef = findCohortByCodeOrAlias(variant);
        expect(cohortDef).toBeDefined();
        expect(cohortDef?.id).toBe("ADMIN5_6_MOD3");
      });
    });

    it("should normalize all cohort variants to official canonical string in curriculum database", () => {
      cohortVariants.forEach((variant) => {
        const normalized = normalizeCohortCode(variant);
        expect(normalized).toBe("ADMIN5/6/J/26 MOD 3");
      });
    });

    it("should match all cohort variants to all 3 Apply ICT Skills CATs", () => {
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        cohortVariants.forEach((variant) => {
          const matchWithEnrolled = doesExamMatchTraineeCohort(cat, variant, ["0415-451-21A"]);
          expect(matchWithEnrolled).toBe(true);

          const matchWithoutEnrolled = doesExamMatchTraineeCohort(cat, variant, []);
          expect(matchWithoutEnrolled).toBe(true);
        });
      });
    });

    it("should match all cohort variants to all 4 terminal assessments (WA1, WA2, WA3, PRAC)", () => {
      const terminalExams = [
        (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa1-0415")!,
        (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa2-0415")!,
        (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-wa3-0415")!,
        (MOCK_EXAMS as Exam[]).find((e) => e.id === "exam-prac-0415")!,
      ];

      terminalExams.forEach((exam) => {
        cohortVariants.forEach((variant) => {
          const matchWithEnrolled = doesExamMatchTraineeCohort(exam, variant, ["0415-451-21A"]);
          expect(matchWithEnrolled).toBe(true);

          const matchWithoutEnrolled = doesExamMatchTraineeCohort(exam, variant, []);
          expect(matchWithoutEnrolled).toBe(true);
        });
      });
    });

    it("should handle unit code formatting variations between hyphens and spaces", () => {
      const cat = APPLY_ICT_SKILLS_CATS[0];
      // Enrolled unit with space "0415 451 21A" vs exam unit "0415-451-21A"
      expect(doesExamMatchTraineeCohort(cat, "Admin 5/6/j 26", ["0415 451 21A"])).toBe(true);
      expect(doesExamMatchTraineeCohort(cat, "ADMIN5/6/J/26 MOD 3", ["0415-451-21A"])).toBe(true);
    });
  });

  describe("4. Isolation and Submission Integrity", () => {
    it("should not confuse Risper Mwende's WA1 submission with unattempted CATs", () => {
      const risperSub = MOCK_SUBMISSIONS.find((s) => s.reg_number === "13410")!;
      expect(risperSub).toBeDefined();

      // Risper's submission is specifically for Written Assessment 1 (CT1)
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        const matchesCat = doesSubMatchTargetExam(risperSub, cat);
        expect(matchesCat).toBe(false);
      });
    });

    it("should not confuse Banta Micheni's WA1 submission with unattempted CATs", () => {
      const bantaSub = MOCK_SUBMISSIONS.find((s) => s.reg_number === "13527")!;
      expect(bantaSub).toBeDefined();

      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        const matchesCat = doesSubMatchTargetExam(bantaSub, cat);
        expect(matchesCat).toBe(false);
      });
    });
  });
});
