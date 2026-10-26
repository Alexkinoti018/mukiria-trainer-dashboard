import { describe, it, expect } from "vitest";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import { findRosterTraineeByIdentifier } from "../client/src/contexts/AuthContext";

describe("FBS Trainee Authentication & Identification Regression Suite", () => {
  const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter((t) => {
    const code = (t.classCode || "").toUpperCase();
    return code.includes("FBS") || code.includes("FBP");
  });

  it("checks findRosterTraineeByIdentifier for all 23 FBS trainees by admNo", () => {
    for (const t of fbsTrainees) {
      const match = findRosterTraineeByIdentifier(t.admNo);
      expect(match, `Failed to match by admNo: ${t.admNo} (${t.name})`).toBeDefined();
      expect(match?.name).toBe(t.name);
    }
  });

  it("checks findRosterTraineeByIdentifier for all 23 FBS trainees by regCode", () => {
    for (const t of fbsTrainees) {
      const match = findRosterTraineeByIdentifier(t.regCode);
      expect(match, `Failed to match by regCode: ${t.regCode} (${t.name})`).toBeDefined();
      expect(match?.name).toBe(t.name);
    }
  });

  it("checks common transcription variances (e.g. 12026 vs J2026)", () => {
    for (const t of fbsTrainees) {
      const variant1 = t.regCode.replace("J2026", "12026");
      const match1 = findRosterTraineeByIdentifier(variant1);
      expect(match1, `Failed to match by 12026 variant: ${variant1}`).toBeDefined();

      const shortAdmVariant = `${t.admNo}/12026`;
      const match2 = findRosterTraineeByIdentifier(shortAdmVariant);
      expect(match2, `Failed to match by shortAdmVariant: ${shortAdmVariant}`).toBeDefined();
    }
  });
});
