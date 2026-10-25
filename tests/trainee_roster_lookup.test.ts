import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { 
  apiRouter, 
  findTraineeInRoster,
  normalizeAdmissionNumber as serverNormalize,
  matchAdmissionNumbers as serverMatch,
  OFFICIAL_INSTITUTIONAL_ROSTER,
  createSignedJwt
} from "../server/routes.ts";
import { 
  OFFICIAL_MTTI_TRAINEES, 
  findMatchingTrainee, 
  normalizeAdmissionNumber as clientNormalize, 
  matchAdmissionNumbers as clientMatch 
} from "../client/src/contexts/TraineeContext";
import {
  normalizeAdmissionNumber as sharedNormalize,
  matchAdmissionNumbers as sharedMatch,
} from "../shared/const.ts";
import {
  normalizeAdmissionNumber as utilsNormalize,
  matchAdmissionNumbers as utilsMatch,
} from "../client/src/lib/utils.ts";

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
    it("should successfully look up student by admission number (10525) for unit 061155101A", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=10525&unitCode=061155101A`);
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
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14179/S2026&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
      expect(data.cohortCode).toBe("ITECH 6 MODULAR/S/2026");
      expect(data).not.toHaveProperty("email");
    });

    it("should resolve candidate when prefixed with class code (ITECH 6 MOD/14179/S2026)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("ITECH 6 MOD/14179/S2026")}&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("14179/S2026");
      expect(data.fullName).toBe("Nthiga Gakii Doris");
    });

    it("should resolve Hospitality trainee (13254) for shared Digital Literacy common unit", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=13254&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("13254");
      expect(data.fullName).toBe("Yvonne Mwende");
      expect(data.cohortCode).toBe("FBS 5 MOD/J/2026");
    });

    it("should resolve Faith Mwende (13258) for Apply Digital Literacy written assessment 1", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=13258&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("13258");
      expect(data.fullName).toBe("Faith Mwende");
      expect(data.cohortCode).toBe("FBS 5 MOD/J/2026");
    });

    it("should resolve Eugene Murimi (12265) for Apply Digital Literacy written assessment 1", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=12265&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("12265");
      expect(data.fullName).toBe("Eugene Murimi");
      expect(data.cohortCode).toBe("FBS 5 MOD/J/2026");
    });

    it("should resolve Brendah Mumbi (13231) for Apply Digital Literacy written assessment 1", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=13231&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("13231");
      expect(data.fullName).toBe("Brendah Mumbi");
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
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=14076&unitCode=061155101A`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });

    it("should resolve Land Survey candidate Harriet Mwendwa with complex alphanumeric registration number (D/UPNUT/25042/069)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("D/UPNUT/25042/069")}&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.admissionNumber).toBe("D/UPNUT/25042/069");
      expect(data.fullName).toBe("Harriet Mwendwa");
      expect(data.cohortCode).toBe("LS5/6/S/26");
    });

    it("should resolve Harriet Mwendwa with whitespace variations (D / UPNUT / 25042 / 069)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("D / UPNUT / 25042 / 069")}&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Harriet Mwendwa");
    });

    it("should resolve Harriet Mwendwa with lowercase registration string (d/upnut/25042/069)", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=${encodeURIComponent("d/upnut/25042/069")}&unitCode=061155101A`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.fullName).toBe("Harriet Mwendwa");
    });
  });

  // ─── TEST 2: UNREGISTERED / CROSS-COHORT ERROR HANDLING (404) ───────────────
  describe("Test 2: Unregistered and Cross-Cohort Verification Guard", () => {
    it("should return HTTP 404 with exact institutional error for non-existent admission number", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=NONEXISTENT_999&unitCode=061155101A`);
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Registration number not found in this unit class register.");
    });

    it("should return HTTP 404 when candidate belongs to different department (cross-cohort mismatch)", async () => {
      // 99999 is registered in Electrical (EE/CU/01/4), NOT Digital Literacy (061155101A)
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=99999&unitCode=061155101A`);
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
      const res = await fetch(`${baseUrl}/trainees/lookup?unitCode=061155101A`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Registration number is required.");
    });

    it("should return HTTP 400 when regNo is empty or whitespace only", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=%20%20%20&unitCode=061155101A`);
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

      const result = simulateOfflineLookup("13410", "061155101A", mockStorage);
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

      const result = simulateOfflineLookup("14255/S2026", "061155101A", mockStorage);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Kaumbuthu Belinda Mukiri");
      expect(result?.classCode).toBe("ITECH 6 MODULAR/S/2026");
    });

    it("should resolve candidate from in-memory official roster when storage cache is empty", () => {
      const mockStorage: Record<string, string> = {};
      const result = simulateOfflineLookup("14022/S2026", "061155101A", mockStorage);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Ltumwa Lesoipa");
      expect(result?.classCode).toBe("ITECH 6 MODULAR/S/2026");
    });

    it("should return null for unregistered trainee offline", () => {
      const mockStorage: Record<string, string> = {};
      const result = simulateOfflineLookup("FAKE_9999", "061155101A", mockStorage);
      expect(result).toBeNull();
    });
  });

  // ─── TEST 5: ZERO EMAIL FIELD INTEGRITY INVARIANTS ──────────────────────────
  describe("Test 5: Zero-Email Property Invariants across all outputs", () => {
    it("should ensure backend response strictly contains ZERO email properties", async () => {
      const res = await fetch(`${baseUrl}/trainees/lookup?regNo=10525&unitCode=061155101A`);
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
      const trainee = findTraineeInRoster("10525", "061155101A");
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

  // ─── TEST 6: ADMISSION NUMBER NORMALIZATION FIX (STEP 1 MANDATE) ────────────
  describe("Test 6: Admission Number Normalization Fix", () => {
    it("normalizes client and server admission numbers consistently", () => {
      expect(clientNormalize("  d / upnut / 25042 / 069  ")).toBe("D/UPNUT/25042/069");
      expect(serverNormalize("  d / upnut / 25042 / 069  ")).toBe("D/UPNUT/25042/069");
      expect(clientNormalize("ITECH 6 MOD / 14179 / S2026")).toBe("14179/S2026");
      expect(serverNormalize("ITECH 6 MOD / 14179 / S2026")).toBe("14179/S2026");
    });

    it("matches candidates bidirectionally regardless of cohort prefix or spacing", () => {
      expect(clientMatch("D/UPNUT/25042/069", "d / upnut / 25042 / 069")).toBe(true);
      expect(serverMatch("D/UPNUT/25042/069", "d / upnut / 25042 / 069")).toBe(true);
      expect(clientMatch("14179/S2026", "ITECH 6 MOD/14179/S2026")).toBe(true);
      expect(serverMatch("14179/S2026", "ITECH 6 MOD/14179/S2026")).toBe(true);
      expect(clientMatch("13254", "FBS 5 MOD/13254/J2026")).toBe(true);
      expect(serverMatch("13254", "FBS 5 MOD/13254/J2026")).toBe(true);
    });

    it("ensures findMatchingTrainee resolves complex registration numbers in client context", () => {
      const matchedHarriet = findMatchingTrainee(OFFICIAL_MTTI_TRAINEES, {
        regNumber: "D / UPNUT / 25042 / 069"
      });
      expect(matchedHarriet).toBeDefined();
      expect(matchedHarriet?.name).toBe("Harriet Mwendwa");

      const matchedDoris = findMatchingTrainee(OFFICIAL_MTTI_TRAINEES, {
        regNumber: "14179 / S2026"
      });
      expect(matchedDoris).toBeDefined();
      expect(matchedDoris?.name).toBe("Nthiga Gakii Doris");
    });
  });

  // ─── TEST 7: ENDPOINTS, RBAC, AND CENTRALIZED NORMALIZATION ─────────────────
  describe("Test 7: Centralized Normalization, GET Roster Filtering, PUT Updates, and Admin-Only DELETE RBAC", () => {
    const TEST_JWT_SECRET = "test-secret-trainee-roster-management-12345678";
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAuthMode = process.env.AUTH_MODE;
    const prevStrictDb = process.env.STRICT_DB;

    beforeAll(() => {
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "test";
      process.env.STRICT_DB = "false";
      process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
    });

    afterAll(() => {
      process.env.NODE_ENV = prevNodeEnv;
      process.env.AUTH_MODE = prevAuthMode;
      process.env.STRICT_DB = prevStrictDb;
    });

    it("verifies shared, utils, client, and server normalizers produce identical results", () => {
      const samples = [
        "  d / upnut / 25042 / 069  ",
        "ITECH 6 MOD/14179/S2026",
        "  ICT4 MOD / 14076 / S2026  ",
        "FBS 5 MOD/13254/J2026",
        "LS 6 MOD / 14351 / 52026",
        "CFD MOD/14020/S2026",
      ];

      for (const sample of samples) {
        const shared = sharedNormalize(sample);
        const utils = utilsNormalize(sample);
        const client = clientNormalize(sample);
        const server = serverNormalize(sample);

        expect(shared).toBe(utils);
        expect(shared).toBe(client);
        expect(shared).toBe(server);
      }
    });

    it("GET /api/trainees returns active institutional roster with count", async () => {
      const res = await fetch(`${baseUrl}/trainees`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.count).toBeGreaterThan(0);
      expect(json.data.length).toBe(json.count);
    });

    it("GET /api/trainees filters accurately by class_code or cohort", async () => {
      const res = await fetch(`${baseUrl}/trainees?class_code=ITECH 6 MODULAR/S/2026`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      for (const t of json.data) {
        expect((t.class_code || "").toUpperCase().replace(/\s+/g, "")).toContain("ITECH6");
      }
    });

    it("PUT /api/trainees/:id updates trainee record when called by authorized role", async () => {
      const trainerToken = createSignedJwt(
        {
          sub: "trainer-uuid-001",
          email: "trainer@mtti.ac.ke",
          app_metadata: { role: "trainer" },
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_JWT_SECRET
      );

      const res = await fetch(`${baseUrl}/trainees/tr_it6_01`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          name: "Nthiga Gakii Doris (Updated)",
          phone: "+254711223344",
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.id).toBe("tr_it6_01");
    });

    it("PUT /api/trainees/:id rejects trainee role with HTTP 403 Forbidden", async () => {
      const traineeToken = createSignedJwt(
        {
          sub: "trainee-uuid-002",
          email: "trainee@mtti.ac.ke",
          app_metadata: { role: "trainee" },
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_JWT_SECRET
      );

      const res = await fetch(`${baseUrl}/trainees/tr_it6_01`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          name: "Attempted Unauthorized Name Change",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("DELETE /api/trainees/:id rejects trainee role with HTTP 403 Forbidden", async () => {
      const traineeToken = createSignedJwt(
        {
          sub: "trainee-uuid-002",
          email: "trainee@mtti.ac.ke",
          app_metadata: { role: "trainee" },
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_JWT_SECRET
      );

      const res = await fetch(`${baseUrl}/trainees/tr_temp_candidate`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });

      expect(res.status).toBe(403);
    });

    it("DELETE /api/trainees/:id allows admin role to securely remove trainee", async () => {
      const adminToken = createSignedJwt(
        {
          sub: "admin-uuid-001",
          email: "admin@mtti.ac.ke",
          app_metadata: { role: "admin" },
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_JWT_SECRET
      );

      const res = await fetch(`${baseUrl}/trainees/tr_temp_candidate_to_delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.id).toBe("tr_temp_candidate_to_delete");
    });

    it("explicitly returns HTTP 503 Service Unavailable when database connection is unavailable in strict mode", async () => {
      process.env.STRICT_DB = "true";

      const adminToken = createSignedJwt(
        {
          sub: "admin-uuid-001",
          email: "admin@mtti.ac.ke",
          app_metadata: { role: "admin" },
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_JWT_SECRET
      );

      // GET /api/trainees under STRICT_DB should return 503
      const getRes = await fetch(`${baseUrl}/trainees`);
      expect(getRes.status).toBe(503);
      const getJson = await getRes.json();
      expect(getJson.service_status).toBe("database_unavailable");

      // PUT /api/trainees/:id under STRICT_DB should return 503
      const putRes = await fetch(`${baseUrl}/trainees/tr_it6_01`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: "Fail due to DB" }),
      });
      expect(putRes.status).toBe(503);

      // DELETE /api/trainees/:id under STRICT_DB should return 503
      const delRes = await fetch(`${baseUrl}/trainees/tr_it6_01`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      expect(delRes.status).toBe(503);

      process.env.STRICT_DB = "false";
    });
  });
});
