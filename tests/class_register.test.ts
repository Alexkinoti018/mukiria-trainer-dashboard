import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { OFFICIAL_MTTI_TRAINEES, Trainee } from "../client/src/contexts/TraineeContext";

// Provide Storage mock for Node test runner environment
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

// Pure attendance helper functions matching ClassRegister.tsx
type AttendanceStatus = "X" | "0" | "";

export function calculateAttendanceStats(
  attendance: Record<string, AttendanceStatus>,
  hoursPerSession = 2
) {
  let presentCount = 0;
  let absentCount = 0;

  Object.values(attendance).forEach((status) => {
    if (status === "X") presentCount++;
    if (status === "0") absentCount++;
  });

  const totalMarkedSessions = presentCount + absentCount;
  const actualHrs = presentCount * hoursPerSession;
  const possibleHrs = totalMarkedSessions * hoursPerSession;

  const percentage =
    totalMarkedSessions === 0
      ? 0
      : Math.round((presentCount / totalMarkedSessions) * 100);

  return { actualHrs, possibleHrs, percentage, totalMarkedSessions, presentCount, absentCount };
}

export function matchQRScanToTrainees(
  scannedAdm: string,
  trainees: Trainee[]
): Trainee | undefined {
  const normScan = scannedAdm.trim().toUpperCase();
  const cleanScan = normScan.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD)\//i, "").trim();

  return trainees.find((t) => {
    const normAdm = (t.admNo || "").trim().toUpperCase();
    const normReg = (t.regCode || "").trim().toUpperCase();
    const cleanAdm = normAdm.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD)\//i, "").trim();

    return (
      normAdm === normScan ||
      normReg === normScan ||
      cleanAdm === cleanScan ||
      cleanAdm === normScan ||
      normAdm === cleanScan
    );
  });
}

describe("MTTI Institutional Class Register (CUR/02 & CUR/03) Suite", () => {
  // ─── 1. ROSTER VERIFICATION FOR FBS 5 MOD/J/2026 ─────────────────────────────
  describe("1. Official Register Roster: FBS 5 MOD/J/2026 (Apply Digital Literacy)", () => {
    it("should have all official trainees registered for FBS 5 MOD/J/2026 including Faith Mwende & Eugene Murimi", () => {
      const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter(
        (t) => t.classCode === "FBS 5 MOD/J/2026"
      );
      expect(fbsTrainees.length).toBeGreaterThanOrEqual(20);

      const faith = fbsTrainees.find((t) => t.admNo === "13258");
      expect(faith).toBeDefined();
      expect(faith?.name).toBe("Faith Mwende");

      const eugine = fbsTrainees.find((t) => t.admNo === "12265");
      expect(eugine).toBeDefined();
      expect(eugine?.name).toBe("Eugene Murimi");

      const brendah = fbsTrainees.find((t) => t.admNo === "13231");
      expect(brendah).toBeDefined();
      expect(brendah?.name).toBe("Brendah Mumbi");
    });

    it("should match first and institutional trainees exactly from the physical register", () => {
      const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter(
        (t) => t.classCode === "FBS 5 MOD/J/2026"
      );

      // Trainee 1
      expect(fbsTrainees[0].name).toBe("Yvonne Mwende");
      expect(fbsTrainees[0].admNo).toBe("13254");
      expect(fbsTrainees[0].regCode).toBe("FBS 5 MOD/13254/J2026");

      // Trainee 20
      expect(fbsTrainees[19].name).toBe("Terry Mwendwa");
      expect(fbsTrainees[19].admNo).toBe("13583");
      expect(fbsTrainees[19].regCode).toBe("FBS 5 MOD/13583/J2026");
    });

    it("should ensure all FBS trainees belong to FBS Hospitality department", () => {
      const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter(
        (t) => t.classCode === "FBS 5 MOD/J/2026"
      );
      fbsTrainees.forEach((t) => {
        expect(t.department).toBe("FBS Hospitality");
      });
    });
  });

  // ─── 2. ATTENDANCE STATISTICS CALCULATIONS ──────────────────────────────────
  describe("2. Attendance Percentage & Hours Calculations (CUR/02)", () => {
    it("should compute 100% attendance when all sessions are marked X", () => {
      const attendance: Record<string, AttendanceStatus> = {
        W1_S1: "X",
        W1_S2: "X",
        W1_S3: "X",
        W2_S1: "X",
        W2_S2: "X",
      };
      const stats = calculateAttendanceStats(attendance, 2);
      expect(stats.presentCount).toBe(5);
      expect(stats.absentCount).toBe(0);
      expect(stats.actualHrs).toBe(10);
      expect(stats.possibleHrs).toBe(10);
      expect(stats.percentage).toBe(100);
    });

    it("should correctly handle partial attendance with absences (0)", () => {
      const attendance: Record<string, AttendanceStatus> = {
        W1_S1: "X",
        W1_S2: "0",
        W1_S3: "X",
        W2_S1: "0",
      };
      const stats = calculateAttendanceStats(attendance, 2);
      expect(stats.presentCount).toBe(2);
      expect(stats.absentCount).toBe(2);
      expect(stats.totalMarkedSessions).toBe(4);
      expect(stats.actualHrs).toBe(4);
      expect(stats.possibleHrs).toBe(8);
      expect(stats.percentage).toBe(50);
    });

    it("should return 0% when no sessions are marked", () => {
      const stats = calculateAttendanceStats({}, 2);
      expect(stats.actualHrs).toBe(0);
      expect(stats.possibleHrs).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });

  // ─── 3. WORKSHOP DOOR QR SCAN RESOLUTION ─────────────────────────────────────
  describe("3. Mobile Workshop Door QR Scan Trainee Matching", () => {
    it("should match trainee by short admission number (e.g. 13254)", () => {
      const match = matchQRScanToTrainees("13254", OFFICIAL_MTTI_TRAINEES);
      expect(match).toBeDefined();
      expect(match?.name).toBe("Yvonne Mwende");
    });

    it("should match trainee by full modular reg code (e.g. FBS 5 MOD/13263/J2026)", () => {
      const match = matchQRScanToTrainees("FBS 5 MOD/13263/J2026", OFFICIAL_MTTI_TRAINEES);
      expect(match).toBeDefined();
      expect(match?.name).toBe("Muoki Muthoki");
    });

    it("should return undefined for unregistered scan numbers", () => {
      const match = matchQRScanToTrainees("999999", OFFICIAL_MTTI_TRAINEES);
      expect(match).toBeUndefined();
    });
  });

  // ─── 4. ASSESSMENT ATTENDANCE REGISTER (CUR/03) SIGNATURE SUITE ──────────────
  describe("4. Assessment Attendance Register (CUR/03) Signature Representation", () => {
    function renderAttendanceSignature(isSigned: boolean, isOwnRecord = false): string {
      if (isSigned) {
        return "attended";
      }
      return isOwnRecord ? "Click to Sign (attended)" : "Not Signed";
    }

    function canToggleAttendanceSignature(
      role: "trainer" | "admin" | "hod" | "trainee",
      candidateAdm: string,
      userReg: string
    ): boolean {
      if (role === "trainer" || role === "admin" || role === "hod") {
        return true;
      }
      if (role === "trainee") {
        const cleanCand = candidateAdm.trim().toUpperCase();
        const cleanUser = userReg.trim().toUpperCase();
        const candCore = cleanCand.match(/\b\d{4,6}\b/)?.[0] || cleanCand;
        const userCore = cleanUser.match(/\b\d{4,6}\b/)?.[0] || cleanUser;
        return cleanCand === cleanUser || candCore === userCore;
      }
      return false;
    }

    it("should render strictly 'attended' in signature column when attendance is confirmed, NOT the trainee's name", () => {
      const faithMwende = OFFICIAL_MTTI_TRAINEES.find((t) => t.admNo === "13258");
      expect(faithMwende).toBeDefined();

      // Ensure signature text is 'attended', not 'Faith' or 'Mwende'
      const signatureText = renderAttendanceSignature(true, false);
      expect(signatureText).toBe("attended");
      expect(signatureText).not.toBe(faithMwende?.name);
      expect(signatureText).not.toBe("Faith");

      const yvonne = OFFICIAL_MTTI_TRAINEES.find((t) => t.admNo === "13254");
      const yvonneSignature = renderAttendanceSignature(true, false);
      expect(yvonneSignature).toBe("attended");
      expect(yvonneSignature).not.toBe("Yvonne");
    });

    it("should render 'Not Signed' or 'Click to Sign (attended)' when attendance has not been confirmed", () => {
      expect(renderAttendanceSignature(false, false)).toBe("Not Signed");
      expect(renderAttendanceSignature(false, true)).toBe("Click to Sign (attended)");
    });

    it("should permit trainees to toggle and confirm their own signature record as 'attended'", () => {
      const allowed = canToggleAttendanceSignature("trainee", "13258", "13258");
      expect(allowed).toBe(true);

      const modularAllowed = canToggleAttendanceSignature(
        "trainee",
        "13254",
        "FBS 5 MOD/13254/J2026"
      );
      expect(modularAllowed).toBe(true);
    });

    it("should forbid trainees from signing or toggling another candidate's attendance record", () => {
      const forbidden = canToggleAttendanceSignature("trainee", "13254", "13258");
      expect(forbidden).toBe(false);
    });

    it("should permit trainers, HODs, and administrators to toggle any candidate's signature", () => {
      expect(canToggleAttendanceSignature("trainer", "13254", "")).toBe(true);
      expect(canToggleAttendanceSignature("hod", "13258", "")).toBe(true);
      expect(canToggleAttendanceSignature("admin", "12265", "")).toBe(true);
    });
  });

  // ─── 5. PERSISTENCE & ROLL CALL LIFECYCLE (WEEKS 1 TO 10 DATA RETENTION) ───
  describe("5. Attendance Persistence, Multi-Session Independence & Roll Call Sync", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should resolve canonical storage keys across all cohort representation aliases", async () => {
      const { getCanonicalAttendanceClassKey } = await import("../client/src/lib/attendanceStorage");

      expect(getCanonicalAttendanceClassKey("ICT4/ITECH6/S/26 MOD 1")).toBe("ICT4_ITECH6");
      expect(getCanonicalAttendanceClassKey("ITECH 6 MODULAR/S/2026")).toBe("ICT4_ITECH6");
      expect(getCanonicalAttendanceClassKey("ICT4 MOD/S/2026")).toBe("ICT4_ITECH6");

      expect(getCanonicalAttendanceClassKey("ADMIN5/6/J/26 MOD 3")).toBe("ADMIN5_6");
      expect(getCanonicalAttendanceClassKey("ADMIN4/5/6/S/26 MOD 1")).toBe("ADMIN5_6");

      expect(getCanonicalAttendanceClassKey("FBS5/6/J/26")).toBe("FBS5_6");
      expect(getCanonicalAttendanceClassKey("FBS 5 MOD/J/2026")).toBe("FBS5_6");
      expect(getCanonicalAttendanceClassKey("FBS6 MOD/12026")).toBe("FBS5_6");

      expect(getCanonicalAttendanceClassKey("LS5/6/S/26")).toBe("LS5_6");
    });

    it("should apply roll call into canonical class register without losing weeks beyond week 3", async () => {
      const { applyRollCallToRegister, loadClassAttendanceRegister, saveClassAttendanceRegister } = await import(
        "../client/src/lib/attendanceStorage"
      );

      // 1. Seed initial 3 weeks
      const seedData = {
        tr_fbs5_01: {
          attendance: {
            W1_S1: "X" as const,
            W1_S2: "X" as const,
            W1_S3: "X" as const,
            W2_S1: "X" as const,
            W2_S2: "X" as const,
            W2_S3: "X" as const,
            W3_S1: "X" as const,
            W3_S2: "X" as const,
            W3_S3: "X" as const,
          },
          signed: true,
        },
      };
      saveClassAttendanceRegister("FBS5/6/J/26", seedData);

      // 2. Perform roll call for Week 5, Session 2
      applyRollCallToRegister("FBS 5 MOD/J/2026", 5, 2, {
        tr_fbs5_01: "X",
        tr_fbs5_02: "0",
      });

      // 3. Load via any cohort alias and verify all weeks are preserved
      const reloaded = loadClassAttendanceRegister("FBS5/6/J/26");
      expect(reloaded["tr_fbs5_01"]).toBeDefined();
      expect(reloaded["tr_fbs5_01"].attendance["W1_S1"]).toBe("X");
      expect(reloaded["tr_fbs5_01"].attendance["W3_S3"]).toBe("X");
      expect(reloaded["tr_fbs5_01"].attendance["W5_S2"]).toBe("X");

      expect(reloaded["tr_fbs5_02"]).toBeDefined();
      expect(reloaded["tr_fbs5_02"].attendance["W5_S2"]).toBe("0");
    });

    it("should maintain multi-session independence in the same week without overwrites", async () => {
      const { applyRollCallToRegister, loadClassAttendanceRegister } = await import(
        "../client/src/lib/attendanceStorage"
      );

      // Mark Session 1, Session 2, and Session 3 in Week 6
      applyRollCallToRegister("ICT4/ITECH6/S/26 MOD 1", 6, 1, { tr_it6_01: "X" });
      applyRollCallToRegister("ICT4/ITECH6/S/26 MOD 1", 6, 2, { tr_it6_01: "0" });
      applyRollCallToRegister("ICT4/ITECH6/S/26 MOD 1", 6, 3, { tr_it6_01: "X" });

      const reloaded = loadClassAttendanceRegister("ICT4/ITECH6/S/26 MOD 1");
      const att = reloaded["tr_it6_01"].attendance;

      // All 3 sessions in Week 6 must coexist simultaneously
      expect(att["W6_S1"]).toBe("X");
      expect(att["W6_S2"]).toBe("0");
      expect(att["W6_S3"]).toBe("X");
    });
  });
});


