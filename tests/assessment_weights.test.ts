import { describe, it, expect } from "vitest";

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
});
