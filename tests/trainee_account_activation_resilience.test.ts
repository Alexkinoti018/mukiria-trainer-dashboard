import { describe, it, expect, beforeEach, beforeAll } from "vitest";

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    (globalThis as any).localStorage = new MockStorage();
  }
  if (typeof globalThis.sessionStorage === "undefined") {
    (globalThis as any).sessionStorage = new MockStorage();
  }
});

import {
  activateTraineeAccount,
  findLocalActivatedTrainee,
  getLocalActivatedTrainees,
} from "../client/src/lib/traineeActivationService";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";
import bcrypt from "bcryptjs";

describe("Trainee Account Activation Resilience Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("1. Institutional Candidate Roster Activation (e.g. Cynthia Nkatha)", () => {
    it("successfully activates Cynthia Nkatha (13252) with locked institutional details", async () => {
      const cynthia = OFFICIAL_MTTI_TRAINEES.find((t) => t.admNo === "13252");
      expect(cynthia).toBeDefined();
      expect(cynthia?.name).toBe("Cynthia Nkatha");
      expect(cynthia?.classCode).toBe("ADMIN5/6/J/26 MOD 3");
      expect(cynthia?.department).toBe("Business");

      const plainPassword = "CynthiaSecurePass@2026";
      const result = await activateTraineeAccount({
        admissionNumber: "13252",
        phoneNumber: "+254 712 345 678",
        password: plainPassword,
      });

      expect(result.success).toBe(true);
      expect(result.profile.admissionNumber).toBe("13252");
      expect(result.profile.fullName).toBe("Cynthia Nkatha");
      expect(result.profile.department).toBe("Business");
      expect(result.profile.classCode).toBe("ADMIN5/6/J/26 MOD 3");

      // Verify persistent record stored in browser localStorage
      const activatedRecord = findLocalActivatedTrainee("13252");
      expect(activatedRecord).not.toBeNull();
      expect(activatedRecord?.fullName).toBe("Cynthia Nkatha");
      expect(activatedRecord?.department).toBe("Business");
      expect(activatedRecord?.classCode).toBe("ADMIN5/6/J/26 MOD 3");
      expect(activatedRecord?.email).toBe("student.13252@mtti.ac.ke");

      // Verify Zero Plain-Text Rule: password must be a 60-char bcrypt hash
      expect(activatedRecord?.passwordHash).toBeDefined();
      expect(activatedRecord?.passwordHash.startsWith("$2")).toBe(true);
      expect(activatedRecord?.passwordHash.length).toBe(60);
      expect(bcrypt.compareSync(plainPassword, activatedRecord!.passwordHash)).toBe(true);
    });

    it("successfully activates trainees across all departments and cohorts", async () => {
      // 1. Business: Risper Mwende (13410)
      const resRisper = await activateTraineeAccount({
        admissionNumber: "13410",
        password: "RisperPassword@2026",
      });
      expect(resRisper.success).toBe(true);
      expect(resRisper.profile.fullName).toBe("RISPER MWENDE");
      expect(resRisper.profile.department).toBe("Business");

      // 2. Hospitality: Yvonne Mwende (13254)
      const resYvonne = await activateTraineeAccount({
        admissionNumber: "13254",
        password: "YvonnePassword@2026",
      });
      expect(resYvonne.success).toBe(true);
      expect(resYvonne.profile.fullName).toBe("Yvonne Mwende");
      expect(resYvonne.profile.department).toBe("FBS Hospitality");

      // 3. Computing: Doris Gakii (14179/S2026)
      const resDoris = await activateTraineeAccount({
        admissionNumber: "14179/S2026",
        password: "DorisPassword@2026",
      });
      expect(resDoris.success).toBe(true);
      expect(resDoris.profile.fullName).toBe("Nthiga Gakii Doris");
      expect(resDoris.profile.department).toBe("Computing & Informatics");

      // 4. Land Survey: Harriet Mwendwa (D/UPNUT/25042/069)
      const resHarriet = await activateTraineeAccount({
        admissionNumber: "D/UPNUT/25042/069",
        password: "HarrietPassword@2026",
      });
      expect(resHarriet.success).toBe(true);
      expect(resHarriet.profile.fullName).toBe("Harriet Mwendwa");
      expect(resHarriet.profile.department).toBe("Building & Civil Engineering");

      // Verify all 4 are present in localStorage
      const allActivated = getLocalActivatedTrainees();
      expect(allActivated.length).toBeGreaterThanOrEqual(4);
    });

    it("rejects activation for unknown non-roster admission numbers", async () => {
      await expect(
        activateTraineeAccount({
          admissionNumber: "99999999_NON_EXISTENT",
          password: "SomePassword123!",
        })
      ).rejects.toThrow("institutional roster");
    });

    it("rejects activation for passwords shorter than 6 characters", async () => {
      await expect(
        activateTraineeAccount({
          admissionNumber: "13252",
          password: "123",
        })
      ).rejects.toThrow("at least 6 characters");
    });
  });
});
