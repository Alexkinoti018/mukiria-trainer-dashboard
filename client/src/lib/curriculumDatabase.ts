import staticUnits from "./curriculum_database.json";

export interface LearningOutcome {
  title: string;
  duration_hours: number;
  content: string[];
  assessment_methods: string[];
}

export interface ElementOfCompetence {
  element_title: string;
  performance_criteria: string[];
}

export interface WeekPlan {
  week: number;
  title: string;
  outcomes: string[];
  resources: string[];
  safety: string;
}

export interface CurriculumUnit {
  id: string;
  unit_code: string;
  isced_code: string;
  cdacc_code: string;
  unit_title: string;
  department: string;
  course: string;
  level: number;
  duration_hours: number;
  description: string;
  source_file?: string;
  learning_outcomes: LearningOutcome[];
  elements: ElementOfCompetence[];
  weeks_breakdown: WeekPlan[];
  suggested_resources: string[];
  safety_protocols: string;
}

export interface DepartmentSummary {
  name: string;
  unit_count: number;
}

// Fetch all departments
export async function getCurriculumDepartments(): Promise<DepartmentSummary[]> {
  try {
    const res = await fetch("/api/curriculum/departments");
    if (res.ok) {
      const data = await res.json();
      if (data.departments && data.departments.length > 0) {
        return data.departments;
      }
    }
  } catch (err) {
    console.warn("Curriculum API unavailable, using local static data:", err);
  }

  // Fallback to local JSON
  const depts: Record<string, number> = {};
  (staticUnits as CurriculumUnit[]).forEach(u => {
    depts[u.department] = (depts[u.department] || 0) + 1;
  });
  return Object.entries(depts).map(([name, unit_count]) => ({ name, unit_count }));
}

// Fetch units with optional filters
export async function getCurriculumUnits(filters?: {
  department?: string;
  level?: number;
  search?: string;
}): Promise<CurriculumUnit[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.department && filters.department !== "All") params.append("department", filters.department);
    if (filters?.level) params.append("level", String(filters.level));
    if (filters?.search) params.append("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/curriculum/units${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.units && data.units.length > 0) {
        return data.units as CurriculumUnit[];
      }
    }
  } catch (err) {
    console.warn("Curriculum API unavailable, using local static fallback:", err);
  }

  // Fallback to local static JSON
  let results = (staticUnits as unknown) as CurriculumUnit[];
  if (filters?.department && filters.department !== "All") {
    const dLower = filters.department.toLowerCase();
    results = results.filter(u => u.department.toLowerCase().includes(dLower));
  }
  if (filters?.level) {
    results = results.filter(u => u.level === filters.level);
  }
  if (filters?.search) {
    const sLower = filters.search.toLowerCase();
    results = results.filter(
      u =>
        u.unit_title.toLowerCase().includes(sLower) ||
        u.unit_code.toLowerCase().includes(sLower) ||
        u.course.toLowerCase().includes(sLower)
    );
  }
  return results;
}

// Fetch single unit details
export async function getUnitDetails(code: string): Promise<CurriculumUnit | null> {
  try {
    const res = await fetch(`/api/curriculum/unit/${encodeURIComponent(code)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.unit) return data.unit as CurriculumUnit;
    }
  } catch (err) {
    console.warn("Unit details API unavailable:", err);
  }

  // Fallback to static units
  const codeClean = code.trim().toUpperCase().replace(/[\s\/-]/g, "");
  const found = (staticUnits as unknown as CurriculumUnit[]).find(u => {
    const c1 = u.unit_code.toUpperCase().replace(/[\s\/-]/g, "");
    const c2 = u.cdacc_code.toUpperCase().replace(/[\s\/-]/g, "");
    const c3 = u.id.toUpperCase().replace(/[\s\/-]/g, "");
    return c1 === codeClean || c2 === codeClean || c3 === codeClean || u.unit_title.toLowerCase().includes(code.toLowerCase());
  });

  return found || null;
}

// Trigger rescan of D:\Curriculum and OS
export async function rescanCurriculumFolder(): Promise<{ success: boolean; count?: number; message?: string }> {
  try {
    const res = await fetch("/api/curriculum/rescan", {
      method: "POST"
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to reach curriculum scanner" };
  }
}

// =============================================================================
// PART 1: MASTER NORMALIZATION ENGINE & CURRICULUM RESOLUTION
// =============================================================================

export interface ResolvedUnitProfile {
  canonicalCohortId: string;
  unitCode: string;
  unitTitle: string;
  departmentId: string;
  departmentName: string;
  tvetLevel: 'Level 4' | 'Level 5' | 'Level 6';
  qualificationTitle: string;
  totalNominalHours: number;
  learningOutcomes: Array<{
    loNumber: number;
    loId: string;
    loTitle: string;
    performanceCriteria: string[];
  }>;
  resolvedStatus: 'EXACT_MATCH' | 'ALIASED_MATCH' | 'FALLBACK_WARNING';
}

/**
 * 1.1 Strict Canonical Cohort Code Normalizer
 * Strips duplicate spaces, standardizes delimiters, modular suffixes, and resolves aliases.
 */
export function canonicalizeCohortCode(rawCohort: string): string {
  if (!rawCohort) return "";
  
  let cleaned = rawCohort.trim();
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ");
  // Standardize punctuation spacing around delimiters: ' / ' -> '/', ' - ' -> '-'
  cleaned = cleaned.replace(/\s*(\/|-)\s*/g, "$1");
  // Normalize modular notation: 'MOD 01' or 'MOD I' or 'MOD1' -> 'MOD 1'
  cleaned = cleaned.replace(/\bMOD\s*I\b/gi, "MOD 1");
  cleaned = cleaned.replace(/\bMOD\s*II\b/gi, "MOD 2");
  cleaned = cleaned.replace(/\bMOD\s*III\b/gi, "MOD 3");
  cleaned = cleaned.replace(/\bMOD\s*IV\b/gi, "MOD 4");
  cleaned = cleaned.replace(/\bMOD(\d+)\b/gi, "MOD $1");
  
  // Normalize year representation: '/2026' -> '/26' or keep uniform
  // Known alias mappings to official canonical keys:
  const ALIAS_MAP: Record<string, string> = {
    "ICT4/ITECH6/S/26 MOD 1": "ICT4/ITECH6/S/26 MOD 1",
    "ICT4/ITECH6/S/ 26 MOD 1": "ICT4/ITECH6/S/26 MOD 1",
    "ICT4/ITECH6/S/2026 MOD 1": "ICT4/ITECH6/S/26 MOD 1",
    "ICT4/ITECH6/S/26MOD1": "ICT4/ITECH6/S/26 MOD 1",
    "ADMIN5/6/J/26": "ADMIN5/6/J/26",
    "ADMIN5/6/J/26 MOD 3": "ADMIN5/6/J/26 MOD 3",
    "ICT SKILLS ADMIN5/6/J/26 MOD 3": "ADMIN5/6/J/26 MOD 3",
    "ICT SKILS 1 ADMIN4/5/6/S/ 26 MOD 1": "ADMIN4/5/6/S/26 MOD 1",
    "ADMIN4/5/6/S/26 MOD 1": "ADMIN4/5/6/S/26 MOD 1",
    "FBS5/6/J/26": "FBS5/6/J/26",
    "FBS 5 MOD/J/2026": "FBS 5 MOD/J/2026",
    "FBS6 MOD/J/2026": "FBS6 MOD/J/2026",
    "LS5/6/S/26": "LS5/6/S/26",
    "LS5 MOD/S/2026": "LS5 MOD/S/2026",
    "LS6 MOD/S/2026": "LS6 MOD/S/2026"
  };

  const directMatch = ALIAS_MAP[cleaned];
  if (directMatch) return directMatch;

  // Case-insensitive lookup in alias map
  const cleanedUpper = cleaned.toUpperCase();
  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (alias.toUpperCase() === cleanedUpper) return canonical;
  }

  return cleaned;
}

/**
 * Normalizes unit title string representations into canonical CDACC competency titles
 */
export function canonicalizeUnitTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  const cleaned = rawTitle.trim().replace(/\s+/g, " ");
  const upper = cleaned.toUpperCase();

  // Basic / Common TVET CDACC Competencies Mapping
  if (upper.includes("DIGITAL LITERACY") || upper.includes("DIGITAL LIT") || upper.includes("COMPUTING ESSENTIALS")) {
    return "Apply Digital Literacy";
  }
  if (upper.includes("COMMUNICATION SKILLS") || upper.includes("COMMUNICATION SKIL")) {
    return "Demonstrate Communication Skills";
  }
  if (upper.includes("NUMERACY") || upper.includes("MATHEMATICS") || upper.includes("CALCULATIONS")) {
    return "Demonstrate Numeracy Skills";
  }
  if (upper.includes("ENTREPRENEURSHIP") || upper.includes("ENTREPRENEURIAL")) {
    return "Demonstrate Entrepreneurship Skills";
  }
  if (upper.includes("ENVIRONMENTAL LITERACY") || upper.includes("ENVIRONMENTAL SKILLS")) {
    return "Demonstrate Environmental Literacy";
  }
  if (upper.includes("SAFETY AND HEALTH") || upper.includes("OSH") || upper.includes("OCCUPATIONAL SAFETY")) {
    return "Demonstrate Occupational Safety and Health Practices";
  }
  if (upper.includes("EMPLOYABILITY") || upper.includes("LIFE SKILLS")) {
    return "Demonstrate Employability Skills";
  }

  // Core Vocational Units
  if (upper.includes("COMPUTER ESSENTIALS")) {
    return "Perform Computer Essentials";
  }
  if (upper.includes("APPLY ICT SKILLS") || upper.includes("ICT SKILLS")) {
    return "Apply ICT Skills";
  }

  return cleaned;
}

export interface TradeContext {
  departmentId: string;
  departmentName: string;
  qualificationTitle: string;
  tvetLevel: 'Level 4' | 'Level 5' | 'Level 6';
}

/**
 * Trade Context Ingestion: Extracts department, level, and qualification descriptor from cohort identifier
 */
export function extractTradeContext(cohortCode: string): TradeContext {
  const code = canonicalizeCohortCode(cohortCode).toUpperCase();

  if (code.startsWith("FBS6") || code.startsWith("FBS 6") || code.startsWith("FBS5/6") || code.includes("FBS5/6")) {
    return {
      departmentId: "dept-hos",
      departmentName: "Hospitality Management",
      qualificationTitle: "Food and Beverage Sales and Services Management",
      tvetLevel: "Level 6"
    };
  }
  if (code.startsWith("FBS5") || code.startsWith("FBS 5") || code.includes("FBS 5")) {
    return {
      departmentId: "dept-hos",
      departmentName: "Hospitality Management",
      qualificationTitle: "Food and Beverage Sales and Services",
      tvetLevel: "Level 5"
    };
  }
  if (code.startsWith("ICT4") || code.includes("ICT4/")) {
    return {
      departmentId: "dept-ict",
      departmentName: "Computing and Informatics",
      qualificationTitle: "Information Communication Technology",
      tvetLevel: "Level 4"
    };
  }
  if (code.startsWith("ITECH6") || code.includes("ITECH6")) {
    return {
      departmentId: "dept-ict",
      departmentName: "Computing and Informatics",
      qualificationTitle: "ICT Technician",
      tvetLevel: "Level 6"
    };
  }
  if (code.startsWith("ADMIN5") || code.startsWith("ADMIN 5")) {
    return {
      departmentId: "dept-bus",
      departmentName: "Business Studies",
      qualificationTitle: "Office Administration",
      tvetLevel: "Level 5"
    };
  }
  if (code.startsWith("ADMIN6") || code.startsWith("ADMIN 6") || code.includes("ADMIN5/6") || code.includes("ADMIN4/5/6")) {
    return {
      departmentId: "dept-bus",
      departmentName: "Business Studies",
      qualificationTitle: "Office Administration",
      tvetLevel: "Level 6"
    };
  }
  if (code.startsWith("CE5") || code.startsWith("CE 5")) {
    return {
      departmentId: "dept-eng",
      departmentName: "Building and Civil Engineering",
      qualificationTitle: "Civil Engineering",
      tvetLevel: "Level 5"
    };
  }
  if (code.startsWith("CE6") || code.startsWith("CE 6")) {
    return {
      departmentId: "dept-eng",
      departmentName: "Building and Civil Engineering",
      qualificationTitle: "Civil Engineering",
      tvetLevel: "Level 6"
    };
  }
  if (code.startsWith("LSM") || code.startsWith("LS5") || code.startsWith("LS6") || code.includes("LS5/6")) {
    return {
      departmentId: "dept-surv",
      departmentName: "Surveying and Geomatics",
      qualificationTitle: "Land Survey",
      tvetLevel: code.includes("5") && !code.includes("6") ? "Level 5" : "Level 6"
    };
  }
  if (code.startsWith("AGR") || code.startsWith("AGRE")) {
    return {
      departmentId: "dept-agr",
      departmentName: "Agriculture & Agricultural Engineering",
      qualificationTitle: "Agricultural Extension & Engineering",
      tvetLevel: "Level 6"
    };
  }
  if (code.startsWith("COS") || code.startsWith("BEAUTY") || code.startsWith("HAIR")) {
    return {
      departmentId: "dept-cos",
      departmentName: "Cosmetology & Hair Dressing",
      qualificationTitle: "Cosmetology and Beauty Therapy",
      tvetLevel: "Level 5"
    };
  }

  // Institutional default fallback
  return {
    departmentId: "dept-gen",
    departmentName: "Institutional Curriculum Division",
    qualificationTitle: "Technical and Vocational Education Training",
    tvetLevel: "Level 5"
  };
}

/**
 * 1.2 Program-Specific Common Unit Resolution Engine
 * Resolves trade-specific unit packages dynamically (e.g. Apply Digital Literacy for FBS returns Hospitality unit package)
 */
export function resolveProgramUnitProfile(rawCohort: string, rawUnitTitleOrCode: string): ResolvedUnitProfile {
  const canonicalCohort = canonicalizeCohortCode(rawCohort);
  const canonicalTitle = canonicalizeUnitTitle(rawUnitTitleOrCode);
  const trade = extractTradeContext(canonicalCohort);

  // Common Unit Specific Master Matrix
  const COMMON_UNIT_PACKAGES: Record<string, Record<string, { unitCode: string; totalHours: number }>> = {
    "Apply Digital Literacy": {
      "dept-hos": { unitCode: "061155101A", totalHours: 60 },
      "dept-bus": { unitCode: "0415 451 21A", totalHours: 60 },
      "dept-ict": { unitCode: "IT/CU/ICTA/CR/01/4/MA", totalHours: 120 },
      "dept-eng": { unitCode: "0611 541 01B", totalHours: 60 },
      "dept-surv": { unitCode: "LSM/CU/LM/BC/01/5/MA", totalHours: 60 },
      "dept-agr": { unitCode: "AGR/BC/01/6/MA", totalHours: 60 },
      "dept-cos": { unitCode: "COS/BC/01/5/MA", totalHours: 60 },
      "dept-gen": { unitCode: "061155101A", totalHours: 60 }
    },
    "Demonstrate Communication Skills": {
      "dept-hos": { unitCode: "HBS/OS/COS/BC/01/5/A", totalHours: 40 },
      "dept-bus": { unitCode: "ADM/BC/01/6/A", totalHours: 40 },
      "dept-ict": { unitCode: "IT/BC/01/6/A", totalHours: 40 },
      "dept-eng": { unitCode: "ENG/BC/01/6/A", totalHours: 40 },
      "dept-surv": { unitCode: "LSM/BC/01/6/A", totalHours: 40 },
      "dept-gen": { unitCode: "TVET/BC/01/A", totalHours: 40 }
    },
    "Demonstrate Numeracy Skills": {
      "dept-hos": { unitCode: "HBS/BC/02/5/A", totalHours: 40 },
      "dept-bus": { unitCode: "ADM/BC/02/6/A", totalHours: 40 },
      "dept-ict": { unitCode: "IT/BC/02/6/A", totalHours: 40 },
      "dept-eng": { unitCode: "ENG/BC/02/6/A", totalHours: 60 },
      "dept-surv": { unitCode: "LSM/BC/02/6/A", totalHours: 60 },
      "dept-gen": { unitCode: "TVET/BC/02/A", totalHours: 40 }
    },
    "Perform Computer Essentials": {
      "dept-ict": { unitCode: "IT/CU/ICTA/CR/01/4/MA", totalHours: 120 },
      "dept-gen": { unitCode: "IT/CU/ICTA/CR/01/4/MA", totalHours: 120 }
    },
    "Apply ICT Skills": {
      "dept-bus": { unitCode: "0415 451 21A", totalHours: 60 },
      "dept-gen": { unitCode: "0415 451 21A", totalHours: 60 }
    }
  };

  let resolvedCode = "";
  let nominalHours = 60;
  let matchStatus: 'EXACT_MATCH' | 'ALIASED_MATCH' | 'FALLBACK_WARNING' = 'EXACT_MATCH';

  // Check Common Unit Matrix
  if (COMMON_UNIT_PACKAGES[canonicalTitle]) {
    const deptPkg = COMMON_UNIT_PACKAGES[canonicalTitle][trade.departmentId] || COMMON_UNIT_PACKAGES[canonicalTitle]["dept-gen"];
    if (deptPkg) {
      resolvedCode = deptPkg.unitCode;
      nominalHours = deptPkg.totalHours;
      matchStatus = 'ALIASED_MATCH';
    }
  }

  // If not found in common matrix, look up in static curriculum database
  let foundUnit: CurriculumUnit | undefined;
  if (!resolvedCode) {
    const rawClean = rawUnitTitleOrCode.trim().toUpperCase().replace(/[\s\/-]/g, "");
    foundUnit = (staticUnits as unknown as CurriculumUnit[]).find(u => {
      const uCodeClean = u.unit_code.toUpperCase().replace(/[\s\/-]/g, "");
      const uTitleUpper = u.unit_title.toUpperCase();
      return uCodeClean === rawClean || uTitleUpper === canonicalTitle.toUpperCase();
    });

    if (foundUnit) {
      resolvedCode = foundUnit.unit_code;
      nominalHours = foundUnit.duration_hours || 60;
      matchStatus = 'EXACT_MATCH';
    } else {
      // Diagnostic fallback warning
      resolvedCode = rawUnitTitleOrCode.includes("/") || rawUnitTitleOrCode.includes("-") ? rawUnitTitleOrCode : `CU-${trade.departmentId.toUpperCase()}-01`;
      nominalHours = 60;
      matchStatus = 'FALLBACK_WARNING';
      console.warn(`[CurriculumResolver] Unmapped unit/trade pair: "${rawUnitTitleOrCode}" for cohort "${rawCohort}". Defaulting to fallback profile.`);
    }
  }

  // Resolve or generate learning outcomes
  const learningOutcomes: Array<{ loNumber: number; loId: string; loTitle: string; performanceCriteria: string[] }> = [];
  if (foundUnit && foundUnit.learning_outcomes && foundUnit.learning_outcomes.length > 0) {
    foundUnit.learning_outcomes.forEach((lo, i) => {
      const matchingElem = foundUnit?.elements?.[i];
      learningOutcomes.push({
        loNumber: i + 1,
        loId: `LO-${i + 1}`,
        loTitle: lo.title,
        performanceCriteria: matchingElem ? matchingElem.performance_criteria : [
          `${i + 1}.1 Tools, equipment and materials are prepared according to task requirements.`,
          `${i + 1}.2 Tasks are executed in compliance with CDACC occupational standards and safety procedures.`,
          `${i + 1}.3 Quality checks and verification are documented accurately.`
        ]
      });
    });
  } else {
    // Standard CDACC generic 5 outcomes structure
    const defaultOutcomes = [
      "Demonstrate understanding of fundamental concepts and occupational safety",
      "Prepare tools, equipment, and resources for tasks",
      "Execute practical operations according to standard procedures",
      "Perform diagnostic checks, testing, and quality verification",
      "Document results and adhere to workplace reporting protocols"
    ];
    defaultOutcomes.forEach((title, idx) => {
      learningOutcomes.push({
        loNumber: idx + 1,
        loId: `LO-${idx + 1}`,
        loTitle: title,
        performanceCriteria: [
          `${idx + 1}.1 Occupational safety and health standards are observed.`,
          `${idx + 1}.2 Procedures comply with statutory TVET CDACC guidelines.`,
          `${idx + 1}.3 Performance records are maintained in institutional portfolios.`
        ]
      });
    });
  }

  return {
    canonicalCohortId: canonicalCohort,
    unitCode: resolvedCode,
    unitTitle: canonicalTitle,
    departmentId: trade.departmentId,
    departmentName: trade.departmentName,
    tvetLevel: trade.tvetLevel,
    qualificationTitle: trade.qualificationTitle,
    totalNominalHours: nominalHours,
    learningOutcomes,
    resolvedStatus: matchStatus
  };
}
