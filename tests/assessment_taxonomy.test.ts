import { describe, it, expect } from "vitest";
import {
  CANONICAL_ASSESSMENT_TYPES,
  getCanonicalAssessmentType,
  getCanonicalAssessmentTitle,
  normalizeCatScoreToTheorySlot,
  calculateCdaccWeightedMark,
  isAssessmentSlotRecognized,
} from "../client/src/lib/assessmentTaxonomy";

describe("Assessment Taxonomy & CDACC Double-Hurdle Engine", () => {
  describe("1. Canonical 6 Assessment Types Taxonomy", () => {
    it("should strictly define the canonical assessment types", () => {
      const typeCodes = CANONICAL_ASSESSMENT_TYPES.map((t) => t.code);
      expect(typeCodes).toEqual(["CT1", "CT2", "CT3", "CP1", "CP2", "CP3", "CAT", "PROJECT"]);
    });

    it("should resolve canonical metadata by code or alias", () => {
      expect(getCanonicalAssessmentType("CT1")?.name).toBe("Written Assessment I (Exam 1)");
      expect(getCanonicalAssessmentType("CT2")?.name).toBe("Written Assessment II (Exam 2)");
      expect(getCanonicalAssessmentType("CT3")?.name).toBe("Written Assessment III (Exam 3)");
      expect(getCanonicalAssessmentType("CP1")?.name).toBe("Practical Assessment I (Prac 1)");
      expect(getCanonicalAssessmentType("CP2")?.name).toBe("Practical Assessment II (Prac 2)");
      expect(getCanonicalAssessmentType("CP3")?.name).toBe("Practical Assessment III (Prac 3)");
      expect(getCanonicalAssessmentType("CAT")?.name).toBe("Continuous Assessment Test (CAT)");
      expect(getCanonicalAssessmentType("PROJECT")?.name).toBe("Course Project");

      // Test alias resolution
      expect(getCanonicalAssessmentType("cat1")?.code).toBe("CT1");
      expect(getCanonicalAssessmentType("exam 1")?.code).toBe("CT1");
      expect(getCanonicalAssessmentType("practical 1")?.code).toBe("CP1");
      expect(getCanonicalAssessmentType("assignment")?.code).toBe("CAT");
    });

    it("should correctly identify recognized assessment slots", () => {
      expect(isAssessmentSlotRecognized("CT1")).toBe(true);
      expect(isAssessmentSlotRecognized("CT2")).toBe(true);
      expect(isAssessmentSlotRecognized("CT3")).toBe(true);
      expect(isAssessmentSlotRecognized("CP1")).toBe(true);
      expect(isAssessmentSlotRecognized("CP2")).toBe(true);
      expect(isAssessmentSlotRecognized("CP3")).toBe(true);
      expect(isAssessmentSlotRecognized("CAT")).toBe(true);
      expect(isAssessmentSlotRecognized("PROJECT")).toBe(true);
      expect(isAssessmentSlotRecognized("UNKNOWN_MOCK")).toBe(false);
    });

    it("should return human-readable canonical titles", () => {
      expect(getCanonicalAssessmentTitle("CT1")).toBe("Written Assessment I (Exam 1)");
      expect(getCanonicalAssessmentTitle("CP2")).toBe("Practical Assessment II (Prac 2)");
      expect(getCanonicalAssessmentTitle("CAT")).toBe("Continuous Assessment Test (CAT)");
      expect(getCanonicalAssessmentTitle("PROJECT")).toBe("Course Project");
    });
  });

  describe("2. Continuous Assessment Test (CAT) Normalization", () => {
    it("should normalize 15-mark CATs to 100% scale", () => {
      expect(normalizeCatScoreToTheorySlot(15, 15)).toBe(100);
      expect(normalizeCatScoreToTheorySlot(12, 15)).toBe(80);
      expect(normalizeCatScoreToTheorySlot(7.5, 15)).toBe(50);
      expect(normalizeCatScoreToTheorySlot(0, 15)).toBe(0);
    });

    it("should normalize 20, 25, and 30-mark CATs to 100% scale", () => {
      expect(normalizeCatScoreToTheorySlot(18, 20)).toBe(90);
      expect(normalizeCatScoreToTheorySlot(20, 25)).toBe(80);
      expect(normalizeCatScoreToTheorySlot(27, 30)).toBe(90);
    });

    it("should clamp values between 0 and 100%", () => {
      expect(normalizeCatScoreToTheorySlot(-5, 20)).toBe(0);
      expect(normalizeCatScoreToTheorySlot(35, 30)).toBe(100);
    });
  });

  describe("3. CDACC Weightings (Levels 3–6) & Double-Hurdle Rule", () => {
    it("Level 6: applies 50% Theory + 50% Practical", () => {
      const result = calculateCdaccWeightedMark(80, 70, 6);
      // 80 * 0.5 + 70 * 0.5 = 75
      expect(result.weightedMark).toBe(75);
      expect(result.theoryWeight).toBe(0.5);
      expect(result.practicalWeight).toBe(0.5);
      expect(result.passedTheoryHurdle).toBe(true);
      expect(result.passedPracticalHurdle).toBe(true);
      expect(result.isCompetent).toBe(true);
      expect(result.gradeBand).toBe("Credit");
      expect(result.verdict).toBe("Competent");
    });

    it("Level 5: applies 40% Theory + 60% Practical", () => {
      const result = calculateCdaccWeightedMark(70, 80, 5);
      // 70 * 0.4 + 80 * 0.6 = 28 + 48 = 76
      expect(result.weightedMark).toBe(76);
      expect(result.theoryWeight).toBe(0.4);
      expect(result.practicalWeight).toBe(0.6);
      expect(result.isCompetent).toBe(true);
    });

    it("Level 4: applies 30% Theory + 70% Practical", () => {
      const result = calculateCdaccWeightedMark(60, 90, 4);
      // 60 * 0.3 + 90 * 0.7 = 18 + 63 = 81
      expect(result.weightedMark).toBe(81);
      expect(result.theoryWeight).toBe(0.3);
      expect(result.practicalWeight).toBe(0.7);
      expect(result.gradeBand).toBe("Distinction");
    });

    it("Level 3: applies 20% Theory + 80% Practical", () => {
      const result = calculateCdaccWeightedMark(50, 90, 3);
      // 50 * 0.2 + 90 * 0.8 = 10 + 72 = 82
      expect(result.weightedMark).toBe(82);
      expect(result.theoryWeight).toBe(0.2);
      expect(result.practicalWeight).toBe(0.8);
    });

    it("Double-Hurdle: fails if Theory average < 50% even if total is high", () => {
      // Candidate got 45% in CT and 100% in CP on Level 6
      // Weighted = 45 * 0.5 + 100 * 0.5 = 72.5 -> 73%
      const result = calculateCdaccWeightedMark(45, 100, 6);
      expect(result.weightedMark).toBe(73);
      expect(result.passedTheoryHurdle).toBe(false);
      expect(result.passedPracticalHurdle).toBe(true);
      // Despite 73%, candidate failed theory hurdle (<50%)
      expect(result.isCompetent).toBe(false);
      expect(result.verdict).toBe("Refer [NYC]");
      expect(result.gradeBand).toBe("Refer");
    });

    it("Double-Hurdle: fails if Practical average < 50% even if total is high", () => {
      // Candidate got 100% in CT and 48% in CP on Level 6
      // Weighted = 100 * 0.5 + 48 * 0.5 = 74%
      const result = calculateCdaccWeightedMark(100, 48, 6);
      expect(result.weightedMark).toBe(74);
      expect(result.passedTheoryHurdle).toBe(true);
      expect(result.passedPracticalHurdle).toBe(false);
      // Despite 74%, candidate failed practical hurdle (<50%)
      expect(result.isCompetent).toBe(false);
      expect(result.verdict).toBe("Refer [NYC]");
      expect(result.gradeBand).toBe("Refer");
    });
  });

  describe("4. 60% Internal Continuous Assessment Contribution", () => {
    it("should compute 60% internal certification contribution according to TVET CDACC regulations", () => {
      // 100% -> 60
      expect(calculateCdaccWeightedMark(100, 100, 6).internalContribution).toBe(60);
      // 75% -> 45
      expect(calculateCdaccWeightedMark(80, 70, 6).internalContribution).toBe(45);
      // 50% -> 30
      expect(calculateCdaccWeightedMark(50, 50, 6).internalContribution).toBe(30);
      // 82% -> 82 * 0.6 = 49.2 -> 49
      expect(calculateCdaccWeightedMark(50, 90, 3).internalContribution).toBe(49);
    });
  });
});
