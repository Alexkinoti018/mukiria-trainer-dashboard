import { describe, it, expect } from "vitest";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams";
import {
  COMPUTER_ESSENTIALS_CATS,
  APPLY_ICT_SKILLS_CATS,
  DIGITAL_LITERACY_CATS,
  CURRICULUM_CATS,
} from "../client/src/lib/curriculumContinuousAssessments";
import { MOCK_EXAMS } from "../client/src/lib/mockData";
import { evaluateExamPortalAvailability, doesExamMatchTraineeCohort } from "../client/src/lib/supabase";

describe("Trainer Consent and Trainee Portal Lockdown Suite", () => {
  describe("1. Written Assessments / Summative Exams (CT1, CT2, CT3)", () => {
    it("should strictly set portal_visible to false for all 70-mark terminal exams", () => {
      DIGITAL_LITERACY_EXAMS.forEach((exam) => {
        expect(exam.payload.portal_visible).toBe(false);
        const status = evaluateExamPortalAvailability(exam.payload);
        expect(status.isVisible).toBe(false);
        expect(status.canStart).toBe(false);
        expect(status.state).toBe("hidden");
        expect(status.statusLabel).toBe("Not Allocated to Trainee Portal");
      });
    });

    it("should prevent direct portal entry into CT1 (061155101A-wa1) without trainer consent", () => {
      const ct1 = DIGITAL_LITERACY_EXAMS.find((e) => e.id === "exam-061155101A-wa1")!;
      expect(ct1).toBeDefined();
      expect(ct1.payload.portal_visible).toBe(false);
      const evalStatus = evaluateExamPortalAvailability(ct1.payload);
      expect(evalStatus.canStart).toBe(false);
    });
  });

  describe("2. Unconsented Continuous Assessment Tests (CATs)", () => {
    it("should strictly set portal_visible to false for Computer Essentials CATs (CAT-PCE-LO1..5)", () => {
      expect(COMPUTER_ESSENTIALS_CATS.length).toBe(5);
      COMPUTER_ESSENTIALS_CATS.forEach((cat) => {
        expect(cat.payload.portal_visible).toBe(false);
        const status = evaluateExamPortalAvailability(cat.payload);
        expect(status.isVisible).toBe(false);
        expect(status.canStart).toBe(false);
        expect(status.state).toBe("hidden");
      });
    });

    it("should strictly set portal_visible to false for Digital Literacy CATs (CAT-DL-LO1..5)", () => {
      expect(DIGITAL_LITERACY_CATS.length).toBe(5);
      DIGITAL_LITERACY_CATS.forEach((cat) => {
        expect(cat.payload.portal_visible).toBe(false);
        const status = evaluateExamPortalAvailability(cat.payload);
        expect(status.isVisible).toBe(false);
        expect(status.canStart).toBe(false);
        expect(status.state).toBe("hidden");
      });
    });
  });

  describe("3. Explicit Trainer-Consented CATs (ADMIN5/6/J/26 MOD 3)", () => {
    it("should keep ONLY the 3 trainer-authorized Apply ICT Skills CATs open for online access", () => {
      expect(APPLY_ICT_SKILLS_CATS.length).toBe(3);
      APPLY_ICT_SKILLS_CATS.forEach((cat) => {
        expect(cat.payload.portal_visible).toBe(true);
        const status = evaluateExamPortalAvailability(cat.payload);
        expect(status.isVisible).toBe(true);
        expect(status.canStart).toBe(true);
        expect(status.state).toBe("open");
      });
    });

    it("should verify that among all CURRICULUM_CATS, ONLY the 3 ADMIN CATs are portal_visible", () => {
      const visibleCats = CURRICULUM_CATS.filter((c) => c.payload?.portal_visible === true);
      expect(visibleCats.length).toBe(3);
      const visibleIds = visibleCats.map((c) => c.id);
      expect(visibleIds).toEqual(["cat-ict-lo1", "cat-ict-lo2", "cat-ict-lo3"]);
    });
  });

  describe("4. Trainee Scoping Protection", () => {
    it("should return zero open exams for an FBS trainee until trainer consents to publish", () => {
      const fbsAllocatedExams = (MOCK_EXAMS as any[]).filter(
        (ex) =>
          ex.payload?.portal_visible === true &&
          doesExamMatchTraineeCohort(ex, "FBS5/6/J/26", ["061155101A"])
      );
      expect(fbsAllocatedExams.length).toBe(0);
    });

    it("should return zero open exams for an ICT4 trainee until trainer consents to publish", () => {
      const ictAllocatedExams = (MOCK_EXAMS as any[]).filter(
        (ex) =>
          ex.payload?.portal_visible === true &&
          doesExamMatchTraineeCohort(ex, "ICT4/ITECH6/S/26 MOD 1", ["IT/CU/ICTA/CR/01/4/MA"])
      );
      expect(ictAllocatedExams.length).toBe(0);
    });

    it("should return exactly the 3 consented CATs for an ADMIN5/6/J/26 MOD 3 trainee", () => {
      const adminAllocatedExams = (MOCK_EXAMS as any[]).filter(
        (ex) =>
          ex.payload?.portal_visible === true &&
          doesExamMatchTraineeCohort(ex, "ADMIN5/6/J/26 MOD 3", ["0415-451-21A"])
      );
      expect(adminAllocatedExams.length).toBe(3);
      expect(adminAllocatedExams.map((e) => e.payload.task_code)).toEqual([
        "CAT-ICT-LO1",
        "CAT-ICT-LO2",
        "CAT-ICT-LO3",
      ]);
    });
  });
});
