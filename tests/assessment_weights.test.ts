import { describe, it, expect } from "vitest";
import {
  DEFAULT_COMPLIANCE_RULESETS,
  getActiveRuleset,
  calculateContinuousTheoryAverage,
  calculateWeightedMarkWithRuleset,
  validateExamStructureWithRuleset,
  type ComplianceRulesetRecord,
} from "../shared/complianceRulesets.ts";

/**
 * TVET CDACC Continuous Assessment Calculation Engine
 * Mirrors AssessmentMarksSheet.tsx for institutional compliance verification
 */
export function calculateAverages(scores: (number | string | undefined | null)[]): number {
  const validScores = scores
    .map((s) => (typeof s === "number" ? s : parseFloat(String(s))))
    .filter((s) => !isNaN(s));
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((a, b) => a + b, 0);
  return Math.round(sum / validScores.length);
}

export function calculateWeightedMark(ctAvg: number, cpAvg: number, level: number): number {
  let raw = 0;
  switch (level) {
    case 6:
      raw = ctAvg * 0.5 + cpAvg * 0.5;
      break;
    case 5:
      raw = ctAvg * 0.4 + cpAvg * 0.6;
      break;
    case 4:
      raw = ctAvg * 0.3 + cpAvg * 0.7;
      break;
    case 3:
      raw = ctAvg * 0.2 + cpAvg * 0.8;
      break;
    default:
      raw = ctAvg * 0.5 + cpAvg * 0.5;
      break;
  }
  return Math.round(raw);
}

export function getCompetencyVerdict(mark: number): "Competent" | "Not Yet Competent" {
  return mark >= 50 ? "Competent" : "Not Yet Competent";
}

export function getCDACCGrade(mark: number): "Distinction" | "Credit" | "Pass" | "Refer" {
  if (mark >= 80) return "Distinction";
  if (mark >= 65) return "Credit";
  if (mark >= 50) return "Pass";
  return "Refer";
}

describe("TVET CDACC Continuous Assessment Weighting Engine (Levels 3–6)", () => {
  // ─── 1. SCORE AVERAGING & NORMALIZATION ──────────────────────────────────────
  describe("1. Score Averaging & Empty Value Handling", () => {
    it("should compute arithmetic mean rounded to nearest integer", () => {
      const scores = [75, 82, 90];
      expect(calculateAverages(scores)).toBe(82); // 247 / 3 = 82.33 -> 82
    });

    it("should handle string-encoded numbers cleanly", () => {
      const scores = ["60", "70", "85"];
      expect(calculateAverages(scores)).toBe(72); // 215 / 3 = 71.66 -> 72
    });

    it("should ignore empty string and null scores without NaN", () => {
      const scores = [80, "", null, undefined, "90"];
      expect(calculateAverages(scores)).toBe(85); // (80 + 90) / 2 = 85
    });

    it("should return 0 when no valid scores are entered", () => {
      expect(calculateAverages([])).toBe(0);
      expect(calculateAverages(["", null, undefined])).toBe(0);
    });
  });

  // ─── 2. CDACC LEVEL RATIOS & WEIGHTINGS ─────────────────────────────────────
  describe("2. Level-Specific Weighting Formulas", () => {
    it("Level 6: should apply 50% Theory (CT) and 50% Practical (CP)", () => {
      const ctAvg = 70;
      const cpAvg = 90;
      // 70 * 0.5 + 90 * 0.5 = 35 + 45 = 80
      expect(calculateWeightedMark(ctAvg, cpAvg, 6)).toBe(80);
    });

    it("Level 5: should apply 40% Theory (CT) and 60% Practical (CP)", () => {
      const ctAvg = 70;
      const cpAvg = 90;
      // 70 * 0.4 + 90 * 0.6 = 28 + 54 = 82
      expect(calculateWeightedMark(ctAvg, cpAvg, 5)).toBe(82);
    });

    it("Level 4: should apply 30% Theory (CT) and 70% Practical (CP)", () => {
      const ctAvg = 70;
      const cpAvg = 90;
      // 70 * 0.3 + 90 * 0.7 = 21 + 63 = 84
      expect(calculateWeightedMark(ctAvg, cpAvg, 4)).toBe(84);
    });

    it("Level 3: should apply 20% Theory (CT) and 80% Practical (CP)", () => {
      const ctAvg = 70;
      const cpAvg = 90;
      // 70 * 0.2 + 90 * 0.8 = 14 + 72 = 86
      expect(calculateWeightedMark(ctAvg, cpAvg, 3)).toBe(86);
    });

    it("should round decimal weights correctly to nearest whole percentage", () => {
      const ctAvg = 65;
      const cpAvg = 72;
      // Level 5: 65 * 0.4 + 72 * 0.6 = 26 + 43.2 = 69.2 -> 69
      expect(calculateWeightedMark(ctAvg, cpAvg, 5)).toBe(69);
    });
  });

  // ─── 3. COMPETENCY CLASSIFICATION & GRADING ─────────────────────────────────
  describe("3. Competency Verifications and CDACC Grading Thresholds", () => {
    it("should classify marks >= 50 as Competent and < 50 as Not Yet Competent", () => {
      expect(getCompetencyVerdict(50)).toBe("Competent");
      expect(getCompetencyVerdict(85)).toBe("Competent");
      expect(getCompetencyVerdict(49)).toBe("Not Yet Competent");
      expect(getCompetencyVerdict(0)).toBe("Not Yet Competent");
    });

    it("should map weighted marks to correct CDACC grade bands", () => {
      expect(getCDACCGrade(85)).toBe("Distinction");
      expect(getCDACCGrade(80)).toBe("Distinction");
      expect(getCDACCGrade(79)).toBe("Credit");
      expect(getCDACCGrade(65)).toBe("Credit");
      expect(getCDACCGrade(64)).toBe("Pass");
      expect(getCDACCGrade(50)).toBe("Pass");
      expect(getCDACCGrade(49)).toBe("Refer");
      expect(getCDACCGrade(20)).toBe("Refer");
    });
  });

  // ─── 4. VERSIONED COMPLIANCE RULESETS (KNQF STANDARDS & OVERRIDES) ───────────
  describe("4. Versioned Compliance Rulesets (KNQF Standards & Overrides)", () => {
    it("should retrieve default KNQF_2026_T3 ruleset for all levels (3–6)", () => {
      const r3 = getActiveRuleset(3);
      const r4 = getActiveRuleset(4);
      const r5 = getActiveRuleset(5);
      const r6 = getActiveRuleset(6);

      expect(r3.version_tag).toBe("KNQF_2026_T3");
      expect(r3.ct_weight).toBe(0.2);
      expect(r3.cp_weight).toBe(0.8);
      expect(r3.min_attendance_pct).toBe(75);
      expect(r3.required_theory_exams).toBe(3);

      expect(r4.version_tag).toBe("KNQF_2026_T3");
      expect(r4.ct_weight).toBe(0.3);
      expect(r4.cp_weight).toBe(0.7);

      expect(r5.version_tag).toBe("KNQF_2026_T3");
      expect(r5.ct_weight).toBe(0.4);
      expect(r5.cp_weight).toBe(0.6);

      expect(r6.version_tag).toBe("KNQF_2026_T3");
      expect(r6.ct_weight).toBe(0.5);
      expect(r6.cp_weight).toBe(0.5);
    });

    it("should allow version tag filtering and custom ruleset overrides", () => {
      const customPool: ComplianceRulesetRecord[] = [
        ...DEFAULT_COMPLIANCE_RULESETS,
        {
          id: "custom-knqf-2027",
          version_tag: "KNQF_2027_PILOT",
          effective_from: "2027-01-01T00:00:00Z",
          level: 6,
          ct_weight: 0.45,
          cp_weight: 0.55,
          min_attendance_pct: 80,
          required_theory_exams: 3,
          missing_exam_policy: "zero_if_incomplete",
          exam_structure_rules: { allow_true_false: false },
        },
      ];

      const rPilot = getActiveRuleset(6, "KNQF_2027_PILOT", customPool);
      expect(rPilot.version_tag).toBe("KNQF_2027_PILOT");
      expect(rPilot.ct_weight).toBe(0.45);
      expect(rPilot.cp_weight).toBe(0.55);
      expect(rPilot.min_attendance_pct).toBe(80);

      // Calculates weighted mark using the active versioned ruleset
      const weighted = calculateWeightedMarkWithRuleset(80, 90, rPilot);
      // 80 * 0.45 + 90 * 0.55 = 36 + 49.5 = 85.5 -> 86
      expect(weighted).toBe(86);
    });

    it("should fall back to default rulesets when requesting unknown version tag or level", () => {
      const fallback = getActiveRuleset(4, "NON_EXISTENT_TAG");
      expect(fallback.level).toBe(4);
      expect(fallback.version_tag).toBe("KNQF_2026_T3");

      const outOfBounds = getActiveRuleset(10);
      expect(outOfBounds.level).toBe(6);
    });
  });

  // ─── 5. STRICT INSTITUTIONAL 3-EXAM THEORY HURDLE ENGINE ────────────────────
  describe("5. Strict Institutional 3-Exam Theory Hurdle Engine", () => {
    it("should compute arithmetic mean when all 3 required theory exams are recorded", () => {
      const scores = [70, 80, 90];
      expect(calculateContinuousTheoryAverage(scores)).toBe(80); // (70 + 80 + 90) / 3 = 80
    });

    it("should strictly return 0% when fewer than 3 exams are available (incomplete assessment)", () => {
      // 2 exams: must return 0%
      expect(calculateContinuousTheoryAverage([75, 85])).toBe(0);
      expect(calculateContinuousTheoryAverage([70, "", 80])).toBe(0);
      expect(calculateContinuousTheoryAverage([90, null, 95])).toBe(0);

      // 1 exam: must return 0%
      expect(calculateContinuousTheoryAverage([85])).toBe(0);
      expect(calculateContinuousTheoryAverage(["90", "", ""])).toBe(0);

      // 0 exams: must return 0%
      expect(calculateContinuousTheoryAverage([])).toBe(0);
      expect(calculateContinuousTheoryAverage(["", null, undefined])).toBe(0);
    });

    it("should waive 0% hurdle and compute average when resit_pending is true", () => {
      // Trainee with 2 completed exams and approved pending resit
      const twoExams = [70, 80];
      expect(calculateContinuousTheoryAverage(twoExams, { resit_pending: true })).toBe(75);

      // Trainee with 1 completed exam and approved pending resit
      const oneExam = [85];
      expect(calculateContinuousTheoryAverage(oneExam, { resit_pending: true })).toBe(85);

      // Trainee with 0 exams still receives 0 even if resit pending
      expect(calculateContinuousTheoryAverage([], { resit_pending: true })).toBe(0);
    });

    it("should normalize string-encoded and out-of-bounds theory marks to 100% scale", () => {
      const scores = ["70", "80", 90];
      expect(calculateContinuousTheoryAverage(scores)).toBe(80);

      // Clamps marks between 0 and 100
      const extremeScores = [-10, 105, 80];
      // Clamped to [0, 100, 80] -> (0 + 100 + 80) / 3 = 60
      expect(calculateContinuousTheoryAverage(extremeScores)).toBe(60);
    });
  });

  // ─── 6. EXAM STRUCTURE COMPLIANCE RULES ──────────────────────────────────────
  describe("6. Exam Structure Compliance Rules (True/False & Checklist Limits)", () => {
    it("Level 4: should strictly prohibit True/False and Matching question types", () => {
      const level4ExamWithTF = {
        type: "theory",
        section_a: {
          questions: [
            { id: "q1", marks: 5, type: "mcq" },
            { id: "q2", marks: 5, type: "true_false" },
          ],
        },
        section_b: {
          questions: [
            { id: "q3", marks: 40, type: "essay" },
          ],
        },
      };

      const errors = validateExamStructureWithRuleset(level4ExamWithTF, 4);
      expect(errors.some((e) => e.includes("True/False and Matching questions are strictly prohibited"))).toBe(true);
    });

    it("Practical: should enforce 10 to 25 items on Observation Checklists", () => {
      const tooFewItems = {
        type: "practical",
        checklist_items: Array(8).fill({ id: "item", criteria: "Test" }),
      };
      const errorsFew = validateExamStructureWithRuleset(tooFewItems, 4);
      expect(errorsFew.some((e) => e.includes("must contain between 10 and 25 items"))).toBe(true);

      const validItems = {
        type: "practical",
        checklist_items: Array(15).fill({ id: "item", criteria: "Test" }),
      };
      const errorsValid = validateExamStructureWithRuleset(validItems, 4);
      expect(errorsValid.length).toBe(0);
    });
  });
});
