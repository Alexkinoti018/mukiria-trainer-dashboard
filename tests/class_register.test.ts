import { describe, it, expect } from "vitest";
import { OFFICIAL_MTTI_TRAINEES, Trainee } from "../client/src/contexts/TraineeContext";

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
    it("should have exactly 20 official trainees registered for FBS 5 MOD/J/2026", () => {
      const fbsTrainees = OFFICIAL_MTTI_TRAINEES.filter(
        (t) => t.classCode === "FBS 5 MOD/J/2026"
      );
      expect(fbsTrainees.length).toBe(20);
    });

    it("should match first and last trainees exactly from the physical register", () => {
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
});
