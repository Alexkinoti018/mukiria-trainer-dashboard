import { describe, it, expect } from "vitest";
import { APPLY_ICT_SKILLS_CATS, CURRICULUM_CATS } from "../client/src/lib/curriculumContinuousAssessments";
import { doesExamMatchTraineeCohort, doesCohortTagMatch, evaluateExamPortalAvailability } from "../client/src/lib/supabase";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import { doesSubMatchTargetExam } from "../client/src/pages/CandidatePortal";
import { MOCK_SUBMISSIONS } from "../client/src/lib/mockData";

describe("ADMIN5/6/J/26 MOD 3 CATs Availability Verification Suite", () => {
  const adminTrainees = OFFICIAL_MTTI_TRAINEES.filter(
    (t) => t.classCode === "ADMIN5/6/J/26 MOD 3"
  );

  it("should have all 11 registered trainees for ADMIN5/6/J/26 MOD 3", () => {
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

    it("should have all 3 CATs in OPEN state with canStart: true for online access this morning", () => {
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        const portalStatus = evaluateExamPortalAvailability(cat.payload);
        expect(portalStatus.isVisible).toBe(true);
        expect(portalStatus.canStart).toBe(true);
        expect(portalStatus.state).toBe("open");
        expect(portalStatus.categoryLabel).toBe("CAT");
      });
    });
  });

  describe("2. Cohort Code Normalization & Trainee Allocation", () => {
    it("should match ADMIN5/6/J/26 MOD 3 trainees to all 3 Apply ICT Skills CATs", () => {
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        // Enrolled unit match
        const matchesEnrolled = doesExamMatchTraineeCohort(cat, "ADMIN5/6/J/26 MOD 3", ["0415-451-21A"]);
        expect(matchesEnrolled).toBe(true);

        // Cohort code string match
        const matchesCohort = doesExamMatchTraineeCohort(cat, "ADMIN5/6/J/26 MOD 3", []);
        expect(matchesCohort).toBe(true);
      });
    });

    it("should tolerate typographical variants such as 'Admin5/6/J/256 MOD 3'", () => {
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        const matchesTypo = doesExamMatchTraineeCohort(cat, "Admin5/6/J/256 MOD 3", ["0415-451-21A"]);
        expect(matchesTypo).toBe(true);

        const tagMatch = doesCohortTagMatch("Admin5/6/J/256 MOD 3", "ADMIN5/6/J/26 MOD 3");
        expect(tagMatch).toBe(true);
      });
    });
  });

  describe("3. Isolation from Written Assessment (WA1 / CT1) Submissions", () => {
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
