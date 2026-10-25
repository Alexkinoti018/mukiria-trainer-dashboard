import { describe, it, expect } from "vitest";
import { normalizeAdmissionNumber, matchAdmissionNumbers } from "../shared/const.ts";

describe("MTTI Institutional Admission Number Normalization & Matching Harness", () => {
  describe("1. Core Normalization (normalizeAdmissionNumber)", () => {
    it("normalizes standard student admission numbers", () => {
      expect(normalizeAdmissionNumber("14179/S2026")).toBe("14179/S2026");
      expect(normalizeAdmissionNumber(" 14179 / S2026 ")).toBe("14179/S2026");
      expect(normalizeAdmissionNumber("10525")).toBe("10525");
      expect(normalizeAdmissionNumber(" 10525 ")).toBe("10525");
    });

    it("strips institutional cohort prefixes cleanly", () => {
      expect(normalizeAdmissionNumber("ITECH 6 MOD/14179/S2026")).toBe("14179/S2026");
      expect(normalizeAdmissionNumber("ICT4 MOD/14179/S2026")).toBe("14179/S2026");
      expect(normalizeAdmissionNumber("ICT4/ITECH 6 MOD/14179/S2026")).toBe("14179/S2026");
      expect(normalizeAdmissionNumber("FBS 5 MOD/10525")).toBe("10525");
      expect(normalizeAdmissionNumber("FBS 6 MOD-10525")).toBe("10525");
      expect(normalizeAdmissionNumber("FBP 6 MOD/10525")).toBe("10525");
      expect(normalizeAdmissionNumber("ADMIN 5/6/12345")).toBe("12345");
      expect(normalizeAdmissionNumber("LS 6 MOD/9876")).toBe("9876");
      expect(normalizeAdmissionNumber("CFD MOD/5544")).toBe("5544");
    });

    it("preserves complex alphanumeric identifiers intact", () => {
      expect(normalizeAdmissionNumber("D/UPNUT/25042/069")).toBe("D/UPNUT/25042/069");
      expect(normalizeAdmissionNumber("CDACC/2026/01")).toBe("CDACC/2026/01");
      expect(normalizeAdmissionNumber("KUCCPS/2025/1109")).toBe("KUCCPS/2025/1109");
    });

    it("handles null, undefined, and empty string safely", () => {
      expect(normalizeAdmissionNumber(null)).toBe("");
      expect(normalizeAdmissionNumber(undefined)).toBe("");
      expect(normalizeAdmissionNumber("")).toBe("");
      expect(normalizeAdmissionNumber("   ")).toBe("");
    });
  });

  describe("2. Bidirectional Admission Matching (matchAdmissionNumbers)", () => {
    it("matches identical numbers with casing or whitespace differences", () => {
      expect(matchAdmissionNumbers("14179/S2026", "14179/s2026")).toBe(true);
      expect(matchAdmissionNumbers(" 14179 / S2026 ", "14179/S2026")).toBe(true);
      expect(matchAdmissionNumbers("10525", " 10525 ")).toBe(true);
    });

    it("matches candidates when one side includes a cohort prefix", () => {
      expect(matchAdmissionNumbers("ITECH 6 MOD/14179/S2026", "14179/S2026")).toBe(true);
      expect(matchAdmissionNumbers("14179/S2026", "ITECH 6 MOD/14179/S2026")).toBe(true);
      expect(matchAdmissionNumbers("FBS 5 MOD/10525", "10525")).toBe(true);
      expect(matchAdmissionNumbers("10525", "FBS 5 MOD/10525")).toBe(true);
    });

    it("matches complex alphanumeric admission numbers across formatting variances", () => {
      expect(matchAdmissionNumbers("D/UPNUT/25042/069", "d/upnut/25042/069")).toBe(true);
      expect(matchAdmissionNumbers(" D / UPNUT / 25042 / 069 ", "D/UPNUT/25042/069")).toBe(true);
    });

    it("matches transcription variances (12026 vs J2026, 52026 vs S2026)", () => {
      expect(matchAdmissionNumbers("10525/12026", "10525/J2026")).toBe(true);
      expect(matchAdmissionNumbers("14179/52026", "14179/S2026")).toBe(true);
    });

    it("matches core numeric token for 4+ character sequences", () => {
      expect(matchAdmissionNumbers("14179", "14179/S2026")).toBe(true);
      expect(matchAdmissionNumbers("14179/S2026", "14179")).toBe(true);
    });

    it("rejects distinct non-matching candidate IDs", () => {
      expect(matchAdmissionNumbers("14179/S2026", "14254/S2026")).toBe(false);
      expect(matchAdmissionNumbers("10525", "10526")).toBe(false);
      expect(matchAdmissionNumbers("14179", "99999")).toBe(false);
      expect(matchAdmissionNumbers(null, "14179")).toBe(false);
      expect(matchAdmissionNumbers("14179", undefined)).toBe(false);
      expect(matchAdmissionNumbers("", "")).toBe(false);
    });
  });
});
