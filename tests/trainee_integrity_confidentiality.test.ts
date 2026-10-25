import { describe, it, expect, beforeAll } from "vitest";
import { 
  OFFICIAL_MTTI_TRAINEES, 
  getTraineesForClass, 
  getOrGenerateDepartmentalTrainees 
} from "../client/src/contexts/TraineeContext";

// Provide Storage mock for Node test environment
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

describe("Trainee Data Integrity, Cohort Segregation & Confidentiality Suite", () => {
  const allTrainees = OFFICIAL_MTTI_TRAINEES;

  // ─── 1. LEVEL 4 ICT OPERATOR INTEGRITY ─────────────────────────────────────
  describe("1. KNQF Level 4 ICT Operator Roster Integrity", () => {
    it("strictly isolates Level 4 trainees without contamination from Level 6 or other departments", () => {
      const ict4List = getTraineesForClass(allTrainees, "ICT4 MOD/S/2026");
      expect(ict4List.length).toBe(8);

      // Verify all candidates are strictly Level 4
      ict4List.forEach((t) => {
        expect(t.regCode).toContain("ICT4");
        expect(t.department).toBe("Computing & Informatics");
        expect(t.classCode).not.toContain("ITECH 6");
        expect(t.classCode).not.toContain("ADMIN");
        expect(t.classCode).not.toContain("FBS");
        expect(t.classCode).not.toContain("LS");
      });

      // Specific known candidate checks
      expect(ict4List.some((t) => t.name === "Wanjau Alvin Gatere")).toBe(true);
      expect(ict4List.some((t) => t.name === "Mutiria Hesborn Muriuki")).toBe(true);

      // Level 6 students must NOT be present
      expect(ict4List.some((t) => t.name === "Nthiga Gakii Doris")).toBe(false);
      expect(ict4List.some((t) => t.name === "Kaumbuthu Belinda Mukiri")).toBe(false);
    });
  });

  // ─── 2. LEVEL 6 ICT TECHNICIAN INTEGRITY ───────────────────────────────────
  describe("2. KNQF Level 6 ICT Technician Roster Integrity", () => {
    it("strictly isolates Level 6 trainees without contamination from Level 4 or other departments", () => {
      const itech6List = getTraineesForClass(allTrainees, "ITECH 6 MODULAR/S/2026");
      expect(itech6List.length).toBe(11);

      // Verify all candidates are strictly Level 6
      itech6List.forEach((t) => {
        expect(t.regCode).toContain("ITECH 6");
        expect(t.department).toBe("Computing & Informatics");
        expect(t.classCode).not.toContain("ICT4");
        expect(t.classCode).not.toContain("ADMIN");
        expect(t.classCode).not.toContain("FBS");
      });

      // Specific known candidate checks
      expect(itech6List.some((t) => t.name === "Nthiga Gakii Doris")).toBe(true);
      expect(itech6List.some((t) => t.name === "Felix Mugendi")).toBe(true);

      // Level 4 students must NOT be present
      expect(itech6List.some((t) => t.name === "Wanjau Alvin Gatere")).toBe(false);
    });
  });

  // ─── 3. LEVEL 5 ICT CRAFTSPERSON INTEGRITY ─────────────────────────────────
  describe("3. KNQF Level 5 ICT Craftsperson Roster Integrity", () => {
    it("strictly isolates Level 5 craftsperson trainees", () => {
      const itech5List = getTraineesForClass(allTrainees, "ITECH 5 MODULAR/S/2026");
      expect(itech5List.length).toBe(15);

      itech5List.forEach((t) => {
        expect(t.regCode).toContain("ITECH 5");
        expect(t.department).toBe("Computing & Informatics");
        expect(t.classCode).not.toContain("ICT4");
        expect(t.classCode).not.toContain("ITECH 6");
      });

      expect(itech5List.some((t) => t.name === "Brian Mwiti Murithi")).toBe(true);
      expect(itech5List.some((t) => t.name === "Caroline Mukami")).toBe(true);
    });
  });

  // ─── 4. BUSINESS ADMINISTRATION COHORT INTEGRITY ───────────────────────────
  describe("4. Business Administration (ADMIN5/6/J/26 MOD 3) Integrity", () => {
    it("strictly isolates Admin trainees without leaking into ICT, FBS, or LS", () => {
      const adminList = getTraineesForClass(allTrainees, "ADMIN5/6/J/26 MOD 3");
      expect(adminList.length).toBe(11);

      adminList.forEach((t) => {
        expect(t.classCode).toBe("ADMIN5/6/J/26 MOD 3");
        expect(t.department).toBe("Business");
      });

      expect(adminList.some((t) => t.name === "RISPER MWENDE")).toBe(true);
      expect(adminList.some((t) => t.name === "MERCY KATHUURE")).toBe(true);

      // Must NOT contain ICT or Hospitality
      expect(adminList.some((t) => t.name === "Nthiga Gakii Doris")).toBe(false);
      expect(adminList.some((t) => t.name === "Yvonne Mwende")).toBe(false);
    });
  });

  // ─── 5. HOSPITALITY (FBS 5 MOD/J/2026) INTEGRITY ───────────────────────────
  describe("5. Hospitality Management (FBS5/6/J/26) Integrity", () => {
    it("strictly isolates FBS trainees without leaking across departments", () => {
      const fbsList = getTraineesForClass(allTrainees, "FBS 5 MOD/J/2026");
      expect(fbsList.length).toBe(23);

      fbsList.forEach((t) => {
        expect(t.department).toBe("FBS Hospitality");
      });

      expect(fbsList.some((t) => t.name === "Yvonne Mwende")).toBe(true);
      expect(fbsList.some((t) => t.name === "Faith Mwende")).toBe(true);
      expect(fbsList.some((t) => t.name === "Eugene Murimi")).toBe(true);
      expect(fbsList.some((t) => t.name === "Brendah Mumbi")).toBe(true);

      // Must NOT contain ICT, Survey, or Business Administration
      expect(fbsList.some((t) => t.name === "Wanjau Alvin Gatere")).toBe(false);
      expect(fbsList.some((t) => t.name === "Vick Mutembei")).toBe(false);
      expect(fbsList.some((t) => t.name === "Harriet Mwendwa")).toBe(false);
      expect(fbsList.some((t) => t.name === "Nthiga Gakii Doris")).toBe(false);
      expect(fbsList.some((t) => t.name === "Kaumbuthu Belinda Mukiri")).toBe(false);
      expect(fbsList.some((t) => t.name === "Ltumwa Lesoipa")).toBe(false);
      expect(fbsList.some((t) => t.name === "RISPER MWENDE")).toBe(false);
      expect(fbsList.some((t) => t.name === "Banta Micheni")).toBe(false);
    });

    it("strictly isolates FBS5/6/J/26 register preventing any foreign student pollution", () => {
      const fbs6List = getTraineesForClass(allTrainees, "FBS5/6/J/26");
      expect(fbs6List.length).toBe(23);

      fbs6List.forEach((t) => {
        expect(t.department).toBe("FBS Hospitality");
      });

      // Assert none of the 8 foreign trainees from other departments bleed in
      const foreignAdmNos = [
        "D/UPNUT/25042/069", // Harriet Mwendwa (LS)
        "14179/S2026",      // Nthiga Gakii Doris (ITECH 6)
        "14255/S2026",      // Kaumbuthu Belinda (ITECH 6)
        "14076/S2026",      // Wanjau Alvin (ITECH 6)
        "14022/S2026",      // Ltumwa Lesoipa (ITECH 6)
        "14009",            // Vick Mutembei (LS)
        "13410",            // Risper Mwende (Business Admin)
        "13527",            // Banta Micheni (Business Admin)
      ];

      foreignAdmNos.forEach((adm) => {
        const found = fbs6List.some((t) => (t.admNo || t.regCode || "").includes(adm));
        expect(found).toBe(false);
      });
    });
  });

  // ─── 6. LAND SURVEY (LS5/6/S/26) INTEGRITY ─────────────────────────────────
  describe("6. Land Survey (LS5/6/S/26) Integrity", () => {
    it("strictly isolates Land Survey trainees", () => {
      const lsList = getTraineesForClass(allTrainees, "LS5/6/S/26");
      expect(lsList.length).toBe(20);

      lsList.forEach((t) => {
        expect(t.department).toBe("Building & Civil Engineering");
      });

      expect(lsList.some((t) => t.name === "Vick Mutembei")).toBe(true);
      expect(lsList.some((t) => t.name === "Harriet Mwendwa")).toBe(true);

      // Must NOT contain FBS or Business
      expect(lsList.some((t) => t.name === "Yvonne Mwende")).toBe(false);
      expect(lsList.some((t) => t.name === "RISPER MWENDE")).toBe(false);
    });
  });

  // ─── 7. JOINT TIMETABLE COMBINED SESSION SHIELDING ─────────────────────────
  describe("7. Joint Timetable Slot Shielding (ICT4/ITECH6/S/ 26 MOD 1)", () => {
    it("returns ONLY genuine ICT trainees (Level 4 + Level 6 = 19) and shields external departments", () => {
      const jointList = getTraineesForClass(allTrainees, "ICT4/ITECH6/S/ 26 MOD 1");
      expect(jointList.length).toBe(19);

      jointList.forEach((t) => {
        expect(t.department).toBe("Computing & Informatics");
      });

      // Contains both Level 4 and Level 6
      expect(jointList.some((t) => t.name === "Wanjau Alvin Gatere")).toBe(true); // Level 4
      expect(jointList.some((t) => t.name === "Nthiga Gakii Doris")).toBe(true);   // Level 6

      // Absolutely shields other departments
      expect(jointList.some((t) => t.name === "RISPER MWENDE")).toBe(false); // Admin
      expect(jointList.some((t) => t.name === "Yvonne Mwende")).toBe(false); // FBS
      expect(jointList.some((t) => t.name === "Vick Mutembei")).toBe(false); // LS
    });
  });

  // ─── 8. DYNAMIC DEPARTMENTAL ACCESSIBILITY ─────────────────────────────────
  describe("8. Dynamic Departmental Cohort Accessibility", () => {
    it("generates authentic department-specific rosters for unmapped classes (e.g. Agriculture)", () => {
      const agreTrainees = getOrGenerateDepartmentalTrainees("AGRE 5/6/J/26");
      expect(agreTrainees.length).toBe(12);

      agreTrainees.forEach((t) => {
        expect(t.department).toBe("Agriculture & Environmental Studies");
        expect(t.regCode).toContain("AGRE");
      });
    });

    it("generates authentic department-specific rosters for Electrical Engineering", () => {
      const eeTrainees = getOrGenerateDepartmentalTrainees("EE5/6/J/26");
      expect(eeTrainees.length).toBe(12);

      eeTrainees.forEach((t) => {
        expect(t.department).toBe("Electrical & Electronics Engineering");
        expect(t.regCode).toContain("EE");
      });
    });
  });
});
