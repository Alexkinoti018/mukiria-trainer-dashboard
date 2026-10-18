import { describe, it, expect } from "vitest";
import {
  TVET_LEVELS,
  TVET_MODULES,
  resolveTVETModuleForUnit,
  type TVETLevel,
} from "../client/src/lib/tvetProgression";
import {
  OFFICIAL_LEARNING_PLANS,
  getLearningPlanTVETModule,
  type LearningPlanRecord,
} from "../client/src/data/learningPlans";

describe("TVET ICT Modularized Progression Graph Suite (Ministry of Education / CDACC)", () => {
  describe("1. Qualification Levels & Nominal Contact Hours Verification", () => {
    it("should correctly configure Level 3 (Basic Certificate)", () => {
      const lvl = TVET_LEVELS.LEVEL_3;
      expect(lvl.name).toBe("Level 3");
      expect(lvl.nominalHoursRange.min).toBe(300);
      expect(lvl.nominalHoursRange.max).toBe(599);
      expect(lvl.nominalHoursRange.display).toBe("300-599 HRS");
      expect(lvl.modules).toEqual([1]);
      expect(lvl.attachmentPoints.length).toBe(1);
    });

    it("should correctly configure Level 4 Artisan (National Artisan Certificate)", () => {
      const lvl = TVET_LEVELS.LEVEL_4;
      expect(lvl.name).toBe("Level 4 (Artisan)");
      expect(lvl.nominalHoursRange.min).toBe(600);
      expect(lvl.nominalHoursRange.max).toBe(1199);
      expect(lvl.nominalHoursRange.display).toBe("600-1199 HRS");
      expect(lvl.modules).toEqual([1, 2]);
      expect(lvl.attachmentPoints.some((p) => p.includes("Post-Module 2"))).toBe(true);
    });

    it("should correctly configure Level 5 Craft (National Craft Certificate)", () => {
      const lvl = TVET_LEVELS.LEVEL_5;
      expect(lvl.name).toBe("Level 5 (Craft)");
      expect(lvl.nominalHoursRange.min).toBe(1200);
      expect(lvl.nominalHoursRange.max).toBe(2399);
      expect(lvl.nominalHoursRange.display).toBe("1200-2399 HRS");
      expect(lvl.modules).toEqual([1, 2, 3, 4]);
      expect(lvl.attachmentPoints.some((p) => p.includes("Post-Module 4"))).toBe(true);
    });

    it("should correctly configure Level 6 Diploma (National Diploma)", () => {
      const lvl = TVET_LEVELS.LEVEL_6;
      expect(lvl.name).toBe("Level 6 (Diploma)");
      expect(lvl.nominalHoursRange.min).toBe(2400);
      expect(lvl.nominalHoursRange.max).toBe(4799);
      expect(lvl.nominalHoursRange.display).toBe("2400-4799 HRS");
      expect(lvl.modules).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(lvl.attachmentPoints.length).toBe(2); // Interim and Final
    });
  });

  describe("2. Module Architecture & Unit Distribution", () => {
    it("should contain exactly 7 sequential TVET modules", () => {
      expect(TVET_MODULES.length).toBe(7);
      for (let i = 1; i <= 7; i++) {
        expect(TVET_MODULES[i - 1].moduleNumber).toBe(i);
      }
    });

    it("should define Module 1 as foundational across all Levels (3, 4, 5, 6)", () => {
      const mod1 = TVET_MODULES[0];
      expect(mod1.levelsApplicable).toEqual(["LEVEL_3", "LEVEL_4", "LEVEL_5", "LEVEL_6"]);
      const titles = mod1.units.map((u) => u.title);
      expect(titles).toContain("Computer Essentials");
      expect(titles).toContain("Computer Operations");
    });

    it("should define Module 2 for Levels 4, 5, and 6 with Artisan exit gate", () => {
      const mod2 = TVET_MODULES[1];
      expect(mod2.levelsApplicable).toEqual(["LEVEL_4", "LEVEL_5", "LEVEL_6"]);
      const titles = mod2.units.map((u) => u.title);
      expect(titles).toContain("Computer Network Setup");
      expect(titles).toContain("Computer Repair and Maintenance");
      expect(mod2.hasIndustrialAttachmentAfter).toBe(true);
    });

    it("should define Module 3 for Levels 5 and 6", () => {
      const mod3 = TVET_MODULES[2];
      expect(mod3.levelsApplicable).toEqual(["LEVEL_5", "LEVEL_6"]);
      const titles = mod3.units.map((u) => u.title);
      expect(titles).toContain("Basic Electronics");
      expect(titles).toContain("Computer Software");
      expect(titles).toContain("Work Ethics and Practices");
      expect(titles).toContain("Network Design and Management");
    });

    it("should define Module 4 for Levels 5 and 6 with Craft exit gate", () => {
      const mod4 = TVET_MODULES[3];
      expect(mod4.levelsApplicable).toEqual(["LEVEL_5", "LEVEL_6"]);
      const titles = mod4.units.map((u) => u.title);
      expect(titles).toContain("Computer Programming Principles");
      expect(titles).toContain("Computerized Database Systems");
      expect(titles).toContain("Communication Skills");
      expect(titles).toContain("Entrepreneurial Skills");
      expect(mod4.hasIndustrialAttachmentAfter).toBe(true);
    });

    it("should define Modules 5, 6, and 7 exclusively for Level 6 Diploma", () => {
      for (const m of [TVET_MODULES[4], TVET_MODULES[5], TVET_MODULES[6]]) {
        expect(m.levelsApplicable).toEqual(["LEVEL_6"]);
      }
      expect(TVET_MODULES[4].units.map((u) => u.title)).toContain("Website Application");
      expect(TVET_MODULES[5].units.map((u) => u.title)).toContain("ICT Security");
      expect(TVET_MODULES[6].units.map((u) => u.title)).toContain("Desktop Application & Management");
    });
  });

  describe("3. Unit & Code Resolution to Official TVET Modules", () => {
    it("should resolve 'IT/CU/ICTA/CR/01/4/MA' to Module 1", () => {
      const res = resolveTVETModuleForUnit("IT/CU/ICTA/CR/01/4/MA");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(1);
      expect(res?.matchedUnit.title).toBe("Computer Essentials");
    });

    it("should resolve 'ICT/CU/ICTA/CC/02/4/A' (Greenwood repair) to Module 2", () => {
      const res = resolveTVETModuleForUnit("ICT/CU/ICTA/CC/02/4/A");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(2);
      expect(res?.matchedUnit.title).toBe("Computer Repair and Maintenance");
    });

    it("should resolve 'IT/OS/ICTA/CR/01/5/MA' (Install Software) to Module 3", () => {
      const res = resolveTVETModuleForUnit("IT/OS/ICTA/CR/01/5/MA");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(3);
      expect(res?.matchedUnit.title).toBe("Computer Software");
    });

    it("should resolve '0611 351 01A' (Programming Principles) to Module 4", () => {
      const res = resolveTVETModuleForUnit("0611 351 01A");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(4);
      expect(res?.matchedUnit.title).toBe("Computer Programming Principles");
    });

    it("should resolve 'IT/CU/ICT/CR/5/6' (Website Design) to Module 5", () => {
      const res = resolveTVETModuleForUnit("IT/CU/ICT/CR/5/6");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(5);
      expect(res?.matchedUnit.title).toBe("Website Application");
    });

    it("should resolve 'IT/OS/ICT/CR/8/6' (Manage Information System) to Module 7", () => {
      const res = resolveTVETModuleForUnit("IT/OS/ICT/CR/8/6");
      expect(res).toBeDefined();
      expect(res?.moduleNumber).toBe(7);
      expect(res?.matchedUnit.title).toBe("Desktop Application & Management");
    });
  });

  describe("4. Official Digitized Learning Plans Module Mapping", () => {
    it("should map all 16 digitized official learning plans to valid TVET modules (1-7)", () => {
      expect(OFFICIAL_LEARNING_PLANS.length).toBe(16);

      for (const plan of OFFICIAL_LEARNING_PLANS) {
        const mod = getLearningPlanTVETModule(plan);
        expect(mod).toBeDefined();
        expect(mod?.moduleNumber).toBeGreaterThanOrEqual(1);
        expect(mod?.moduleNumber).toBeLessThanOrEqual(7);
      }
    });

    it("should explain dual-cohort sharing: Level 4 Artisan and Level 6 Diploma sharing Module 2 units", () => {
      // Greenwood repair plan covers ICT4/J/26/ITECH6/J/26
      const greenwoodPlan = OFFICIAL_LEARNING_PLANS.find(
        (p) => p.metadata.unitCode === "ICT/CU/ICTA/CC/02/4/A"
      );
      expect(greenwoodPlan).toBeDefined();
      const mod = getLearningPlanTVETModule(greenwoodPlan as LearningPlanRecord);
      expect(mod?.moduleNumber).toBe(2);
      // Both Level 4 and Level 6 are officially applicable to Module 2
      expect(mod?.module.levelsApplicable).toContain("LEVEL_4");
      expect(mod?.module.levelsApplicable).toContain("LEVEL_6");
    });
  });
});
