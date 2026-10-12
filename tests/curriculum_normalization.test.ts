import { describe, it, expect } from "vitest";
import {
  canonicalizeCohortCode,
  canonicalizeUnitTitle,
  extractTradeContext,
  resolveProgramUnitProfile
} from "../client/src/lib/curriculumDatabase";

describe("Part 1: Master Normalization Engine & Resolution Suite", () => {
  it("canonicalizes cohort codes by stripping rogue whitespace and mapping known aliases", () => {
    expect(canonicalizeCohortCode("  ICT4 / ITECH6 / S /  26 MOD 1 ")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ICT4/ITECH6/S/ 26 MOD 1")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ICT4/ITECH6/S/2026 MOD 1")).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(canonicalizeCohortCode("ADMIN5 / 6 / J / 26 MOD 3")).toBe("ADMIN5/6/J/26 MOD 3");
    expect(canonicalizeCohortCode("FBS5/6/J/26")).toBe("FBS5/6/J/26");
  });

  it("canonicalizes unit titles to TVET CDACC occupational standards", () => {
    expect(canonicalizeUnitTitle("DIGITAL LITERACY")).toBe("Apply Digital Literacy");
    expect(canonicalizeUnitTitle("  APPLY DIGITAL LITERACY  ")).toBe("Apply Digital Literacy");
    expect(canonicalizeUnitTitle("COMMUNICATION SKILLS")).toBe("Demonstrate Communication Skills");
    expect(canonicalizeUnitTitle("NUMERACY")).toBe("Demonstrate Numeracy Skills");
    expect(canonicalizeUnitTitle("COMPUTER ESSENTIALS")).toBe("Perform Computer Essentials");
  });

  it("extracts precise trade context from cohort identifiers", () => {
    const fbsContext = extractTradeContext("FBS5/6/J/26");
    expect(fbsContext.departmentId).toBe("dept-hos");
    expect(fbsContext.departmentName).toBe("Hospitality Management");
    expect(fbsContext.tvetLevel).toBe("Level 6");

    const ictContext = extractTradeContext("ICT4/ITECH6/S/26 MOD 1");
    expect(ictContext.departmentId).toBe("dept-ict");
    expect(ictContext.departmentName).toBe("Computing and Informatics");

    const adminContext = extractTradeContext("ADMIN5/6/J/26 MOD 3");
    expect(adminContext.departmentId).toBe("dept-bus");
    expect(adminContext.departmentName).toBe("Business Studies");
  });

  it("resolves trade-specific unit profiles dynamically (resolving FBS to Hospitality package)", () => {
    const fbsProfile = resolveProgramUnitProfile("FBS5/6/J/26", "DIGITAL LITERACY");
    expect(fbsProfile.canonicalCohortId).toBe("FBS5/6/J/26");
    expect(fbsProfile.unitTitle).toBe("Apply Digital Literacy");
    expect(fbsProfile.unitCode).toBe("061155101A");
    expect(fbsProfile.departmentId).toBe("dept-hos");
    expect(fbsProfile.departmentName).toBe("Hospitality Management");
    expect(fbsProfile.learningOutcomes.length).toBeGreaterThan(0);
    expect(fbsProfile.resolvedStatus).toBe("ALIASED_MATCH");
  });

  it("resolves ICT4/ITECH6 unit profiles accurately without nulls", () => {
    const ictProfile = resolveProgramUnitProfile("ICT4/ITECH6/S/ 26 MOD 1", "Perform Computer Essentials");
    expect(ictProfile.canonicalCohortId).toBe("ICT4/ITECH6/S/26 MOD 1");
    expect(ictProfile.unitCode).toBe("IT/CU/ICTA/CR/01/4/MA");
    expect(ictProfile.departmentId).toBe("dept-ict");
    expect(ictProfile.tvetLevel).toBe("Level 4");
    expect(ictProfile.learningOutcomes.length).toBe(5);
  });
});
