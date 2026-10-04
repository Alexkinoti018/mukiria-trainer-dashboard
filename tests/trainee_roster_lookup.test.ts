import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { 
  apiRouter, 
  findTraineeInRoster,
  OFFICIAL_INSTITUTIONAL_ROSTER 
} from "../server/routes.ts";
import { OFFICIAL_MTTI_TRAINEES } from "../client/src/contexts/TraineeContext";

describe("Trainee Intelligent Roster Lookup & Zero-Email Verification Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  // ─── TEST 1: ONLINE LOOKUP BY ADMISSION NUMBER ──────────────────────────────
  describe("Test 1: Successful Online Roster Lookup", () => {
    it("should successfully look up student by admission number (10525) for unit 061155101A-WA1", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=10525&unitCode=061155101A-WA1`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("id");
      expect(data.admissionNumber).toBe("10525");
      expect(data.fullName).toBe("Alex Kinoti");
      expect(data.cohortCode).toBe("class-itech-6");

      // Verify ZERO email fields
      expect(data).not.toHaveProperty("email");
      expect(data).not.toHaveProperty("student_email");
    });

    it("should successfully look up student from transcribed official roster (14179/S2026)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14179/S2026&unitCode=061155101A-WA1`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
      expect(data.cohortCode).toBe("ITECH 6 MODULAR/S/2026");
      expect(data).not.toHaveProperty("email");
    });

    it("should resolve candidate when prefixed with class code (ITECH 6 MOD/14179/S2026)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("ITECH 6 MOD/14179/S2026")}&unitCode=061155101A-WA1`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
    });

    it("should resolve Hospitality trainee (13254) for shared Digital Literacy common unit", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=13254&unitCode=061155101A-WA1`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("13254");
      expect(data.fullName).toBe("Yvonne Mwende");
      expect(data.cohortCode).toBe("FBS 5 MOD/J/2026");
    });

    it("should resolve ICT4 MOD/S/2026 trainee (14076/S2026) for Computer Essentials unit (IT/CU/ICTA/CR/01/4/MA)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14076/S2026&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14076/S2026");
      expect(data.fullName).toBe("Wanjau Alvin Gatere");
      expect(data.cohortCode).toBe("ICT4 MOD/S/2026");
      expect(data).not.toHaveProperty("email");
    });

    it("should resolve ICT4 MOD/S/2026 trainee by core 5-digit number (14076) for Computer Essentials", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14076&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Wanjau Alvin Gatere");
      expect(data.cohortCode).toBe("ICT4 MOD/S/2026");
    });

    it("should resolve ICT4 MOD/S/2026 trainee by full prefixed reg code (ICT4 MOD/14107/S2026) for Computer Essentials", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("ICT4 MOD/14107/S2026")}&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Ann Mukiri Matheta");
      expect(data.cohortCode).toBe("ICT4 MOD/S/2026");
    });

    it("should resolve ICT4 MOD/S/2026 trainee (14248/S2026) for Computer Essentials unit", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14248/S2026&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Mbaabu Sarah Nkatha");
      expect(data.cohortCode).toBe("ICT4 MOD/S/2026");
    });

    it("should resolve ITECH6 trainee (14179/S2026) for Computer Essentials unit in ICT4/ITECH6/S/2026 MOD 1 cohort", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14179/S2026&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Nthiga Gakii Doris");
      expect(data.cohortCode).toBe("ITECH 6 MODULAR/S/2026");
    });

    it("should resolve candidate with ICT4/ITECH6 combined prefix (ICT4/ITECH6/14076)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("ICT4/ITECH6/14076")}&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Wanjau Alvin Gatere");
    });

    it("should reject ICT4 candidate (14076) attempting to access Digital Literacy (WA1/WA2 removed for ICT4)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14076&unitCode=061155101A-WA1`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });
  });

  // ─── TEST 2: UNREGISTERED / CROSS-COHORT ERROR HANDLING (404) ───────────────
  describe("Test 2: Unregistered and Cross-Cohort Verification Guard", () => {
    it("should return HTTP 404 with exact institutional error for non-existent admission number", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=NONEXISTENT_999&unitCode=061155101A-WA1`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });

    it("should return HTTP 404 when candidate belongs to different department (cross-cohort mismatch)", async () => {
      // 99999 is registered in Electrical (EE/CU/01/4), NOT Digital Literacy (061155101A-WA1)
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=99999&unitCode=061155101A-WA1`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });

    it("should reject cross-cohort candidate (99999) attempting to access Computer Essentials unit", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=99999&unitCode=IT/CU/ICTA/CR/01/4/MA`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });

    it("should allow electrical trainee (99999) when querying their assigned electrical unit", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=99999&unitCode=EE/CU/01/4`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("99999");
      expect(data.fullName).toBe("Other Student");
      expect(data.cohortCode).toBe("class-ee-4");
    });
  });

  // ─── TEST 3: MISSING REGISTRATION NUMBER (400) ──────────────────────────────
  describe("Test 3: Missing or Empty Registration Number", () => {
    it("should return HTTP 400 when regNo parameter is completely omitted", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?unitCode=061155101A-WA1`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Registration number is required.");
    });

    it("should return HTTP 400 when regNo is empty or whitespace only", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=%20%20%20&unitCode=061155101A-WA1`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Registration number is required.");
    });
  });

  // ─── TEST 4: OFFLINE LOOKUP SIMULATION FROM LOCAL STORAGE CACHE ─────────────
  describe("Test 4: Offline Buffered Lookup Simulation", () => {
    function simulateOfflineLookup(
      rawRegNo: string,
      unitCode: string,
      mockStorage: Record<string, string>
    ) {
      const normReg = rawRegNo.trim().toUpperCase();
      if (!normReg) return null;

      const cleanReg = normReg.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD)\//i, "").trim();
      const currentUnit = unitCode.trim().toUpperCase();
      const baseUnit = currentUnit.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");

      const checkKeys = [
        `mtti_class_register_${baseUnit}`,
        `mtti_class_register_${currentUnit}`,
        "mtti_trainees",
      ];

      for (const key of checkKeys) {
        const raw = mockStorage[key];
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((t: any) => {
              const adm = (t.admNo || t.admissionNumber || t.reg_number || t.regCode || "").trim().toUpperCase();
              const cleanAdm = adm.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD)\//i, "").trim();
              return adm === normReg || cleanAdm === cleanReg || cleanAdm === normReg || adm === cleanReg;
            });
            if (found) {
              return {
                name: found.name || found.fullName,
                classCode: found.classCode || found.cohortCode || "Active Register",
              };
            }
          }
        } catch {}
      }

      // In-memory fallback
      const found = OFFICIAL_MTTI_TRAINEES.find((t) => {
        const adm = (t.admNo || t.regCode || "").trim().toUpperCase();
        const cleanAdm = adm.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*5\s*MOD)\//i, "").trim();
        return adm === normReg || cleanAdm === cleanReg || cleanAdm === normReg || adm === cleanReg;
      });
      if (found) {
        return {
          name: found.name,
          classCode: found.classCode,
        };
      }

      return null;
    }

    it("should resolve candidate from simulated mtti_class_register_061155101A cache", () => {
      const mockStorage: Record<string, string> = {
        "mtti_class_register_061155101A": JSON.stringify([
          { id: "tr_cached_01", admNo: "13410", name: "RISPER MWENDE", classCode: "Admin 5/6/J/2026" },
          { id: "tr_cached_02", admNo: "13527", name: "Banta Micheni", classCode: "Admin 5/6/J/2026" },
        ]),
      };

      const result = simulateOfflineLookup("13410", "061155101A-WA1", mockStorage);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("RISPER MWENDE");
      expect(result?.classCode).toBe("Admin 5/6/J/2026");
    });

    it("should resolve candidate from mtti_trainees cache", () => {
      const mockStorage: Record<string, string> = {
        "mtti_trainees": JSON.stringify([
          { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admNo: "14255/S2026", name: "Kaumbuthu Belinda Mukiri", classCode: "ITECH 6 MODULAR/S/2026" },
        ]),
      };

      const result = simulateOfflineLookup("14255/S2026", "061155101A-WA1", mockStorage);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Kaumbuthu Belinda Mukiri");
      expect(result?.classCode).toBe("ITECH 6 MODULAR/S/2026");
    });

    it("should resolve candidate from in-memory official roster when storage cache is empty", () => {
      const mockStorage: Record<string, string> = {};
      const result = simulateOfflineLookup("14022/S2026", "061155101A-WA1", mockStorage);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Ltumwa Lesoipa");
      expect(result?.classCode).toBe("ITECH 6 MODULAR/S/2026");
    });

    it("should return null for unregistered trainee offline", () => {
      const mockStorage: Record<string, string> = {};
      const result = simulateOfflineLookup("FAKE_9999", "061155101A-WA1", mockStorage);
      expect(result).toBeNull();
    });
  });

  // ─── TEST 5: ZERO EMAIL FIELD INTEGRITY INVARIANTS ──────────────────────────
  describe("Test 5: Zero-Email Property Invariants across all outputs", () => {
    it("should ensure backend response strictly contains ZERO email properties", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=10525&unitCode=061155101A-WA1`);
      expect(res.status).toBe(200);

      const body = await res.json();
      const keys = Object.keys(body);

      // Verify that neither 'email' nor 'student_email' nor any key containing 'email' exists
      expect(keys.some(k => k.toLowerCase().includes("email"))).toBe(false);
      expect(body.email).toBeUndefined();
      expect(body.student_email).toBeUndefined();

      // Only the 4 permitted properties are returned
      expect(keys.sort()).toEqual(["admissionNumber", "cohortCode", "fullName", "id"].sort());
    });

    it("should ensure findTraineeInRoster helper returns zero email properties", () => {
      const trainee = findTraineeInRoster("10525", "061155101A-WA1");
      expect(trainee).not.toBeNull();
      if (trainee) {
        expect("email" in trainee).toBe(false);
        expect("student_email" in trainee).toBe(false);
        expect(Object.keys(trainee).sort()).toEqual(["admissionNumber", "cohortCode", "fullName", "id"].sort());
      }
    });

    it("should ensure all items in OFFICIAL_INSTITUTIONAL_ROSTER have zero email properties", () => {
      for (const entry of OFFICIAL_INSTITUTIONAL_ROSTER) {
        expect(entry).not.toHaveProperty("email");
        expect(entry).not.toHaveProperty("student_email");
      }
    });
  });
});
