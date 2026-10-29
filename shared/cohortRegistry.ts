/**
 * Mukiria Technical Training Institute (MTTI)
 * Master Institutional Cohort & Term Registry
 *
 * Centralizes cohort definitions, aliases, CDACC levels, and departments
 * to eliminate scattered, brittle regex matching across the codebase.
 */

export interface InstitutionalCohort {
  id: string; // Canonical storage key e.g. "ICT4_ITECH6"
  primaryCode: string; // Official display code e.g. "ICT4/ITECH6/S/26 MOD 1"
  name: string; // Full qualification title
  department: string; // MTTI Academic Department
  level: number; // CDACC Level (3, 4, 5, 6)
  aliases: string[]; // Known transcript / register alias strings
  defaultUnitCodes?: string[];
}

export const OFFICIAL_INSTITUTIONAL_COHORTS: InstitutionalCohort[] = [
  {
    id: "ICT4_ITECH6",
    primaryCode: "ICT4/ITECH6/S/26 MOD 1",
    name: "Information Communication Technology Level 6 / ITECH Level 4",
    department: "Computing & Informatics",
    level: 6,
    aliases: [
      "ICT4/ITECH6/S/26 MOD 1",
      "ITECH 6 MODULAR/S/2026",
      "ICT4 MOD/S/2026",
      "ICT4_ITECH6",
      "ITECH6",
      "ICT4",
      "ITECH 6",
    ],
    defaultUnitCodes: ["061155101A"],
  },
  {
    id: "FBS5_6",
    primaryCode: "FBS 5 MOD/J/2026",
    name: "Food & Beverage Sales and Service Management Levels 5 & 6",
    department: "FBS Hospitality",
    level: 5,
    aliases: [
      "FBS5/6/J/26",
      "FBS 5 MOD/J/2026",
      "FBS6 MOD/12026",
      "FBS6 MOD/J/2026",
      "FBS5_6",
      "FBS5",
      "FBS6",
      "FBP 6",
      "FBP6",
    ],
    defaultUnitCodes: ["101355101A"],
  },
  {
    id: "ADMIN5_6_MOD3",
    primaryCode: "ADMIN5/6/J/26 MOD 3",
    name: "Business Management & Administration Levels 5 & 6 (Module 3)",
    department: "Business",
    level: 6,
    aliases: [
      "ADMIN5/6/J/26 MOD 3",
      "ADMIN5_6_MOD3",
      "ADMIN 5/6 MOD 3",
      "ADMIN5/6/J/26",
      "ADMIN 5/6/J/26",
      "Admin 5/6/j 26",
      "ADMIN 5/6/J 26",
      "ADMIN5/6/J 26",
      "ADMIN5/6/J/26 MOD3",
      "ADMIN 5/6/J/26 MOD 3",
      "ADMIN5/6/J/2026",
      "ADMIN 5/6/J/2026",
      "ADMIN5/6/J/2026 MOD 3",
      "ADMIN 5/6/J/2026 MOD 3",
      "ADMIN5/6/J/256 MOD 3",
      "ADMIN5/6",
      "ADMIN 6",
      "ADMIN",
    ],
    defaultUnitCodes: [
      "0415-451-21A",
      "0415 451 21A",
      "0415-451-21A-PRAC",
      "041355101A",
    ],
  },
  {
    id: "ADMIN4_5_6_MOD1",
    primaryCode: "ADMIN4/5/6/S/26 MOD 1",
    name: "Business Management & Administration Levels 4, 5 & 6 (Module 1)",
    department: "Business",
    level: 5,
    aliases: [
      "ADMIN4/5/6/S/26 MOD 1",
      "ADMIN4_5_6_MOD1",
      "ADMIN 4/5/6 MOD 1",
      "ADMIN MOD 1",
    ],
    defaultUnitCodes: ["041355101A"],
  },
  {
    id: "LS5_6",
    primaryCode: "LS5/6/S/26",
    name: "Land Surveying Levels 5 & 6",
    department: "Building & Civil Engineering",
    level: 6,
    aliases: [
      "LS5/6/S/26",
      "LS5_6",
      "LS 5/6",
      "SURVEY",
      "LS5",
      "LS6",
    ],
    defaultUnitCodes: ["073155101A"],
  },
  {
    id: "CE6",
    primaryCode: "CE6/S/26",
    name: "Civil Engineering Level 6",
    department: "Building & Civil Engineering",
    level: 6,
    aliases: [
      "CE6/S/26",
      "CE6/M/26",
      "CE6/J/26",
      "CE6",
      "CIVIL",
    ],
    defaultUnitCodes: ["073255101A"],
  },
];

/**
 * Resolves any class code, intake string, or variant into its canonical storage key.
 */
export function resolveCanonicalCohortKey(code: string | null | undefined): string {
  if (!code) return "UNKNOWN";
  const norm = code.trim().toUpperCase();

  // 1. Direct alias match
  for (const cohort of OFFICIAL_INSTITUTIONAL_COHORTS) {
    if (cohort.id.toUpperCase() === norm || cohort.primaryCode.toUpperCase() === norm) {
      return cohort.id;
    }
    for (const alias of cohort.aliases) {
      if (alias.toUpperCase() === norm) {
        return cohort.id;
      }
    }
  }

  // 2. Pattern heuristics matching
  if (norm.includes("ICT") || norm.includes("ITECH")) return "ICT4_ITECH6";
  if (norm.includes("ADMIN") && norm.includes("MOD 1")) return "ADMIN4_5_6_MOD1";
  if (norm.includes("ADMIN") && norm.includes("MOD 3")) return "ADMIN5_6_MOD3";
  if (norm.includes("ADMIN")) return "ADMIN5_6_MOD3";
  if (norm.includes("FBS") || norm.includes("FBP")) return "FBS5_6";
  if (norm.includes("LS") || norm.includes("SURVEY")) return "LS5_6";
  if (norm.includes("CE") || norm.includes("CIVIL")) return "CE6";

  // Fallback sanitized key
  return norm.replace(/[^A-Z0-9_]/g, "_");
}

/**
 * Finds an institutional cohort definition by code or alias.
 */
export function findCohortByCodeOrAlias(code: string | null | undefined): InstitutionalCohort | undefined {
  if (!code) return undefined;
  const canonicalKey = resolveCanonicalCohortKey(code);
  return OFFICIAL_INSTITUTIONAL_COHORTS.find((c) => c.id === canonicalKey);
}

/**
 * Returns the academic department for a given cohort string.
 */
export function getDepartmentForCohort(code: string | null | undefined): string {
  const cohort = findCohortByCodeOrAlias(code);
  if (cohort) return cohort.department;

  const norm = (code || "").toUpperCase();
  if (norm.includes("FBS") || norm.includes("FBP")) return "FBS Hospitality";
  if (norm.includes("ADMIN") || norm.includes("BUS")) return "Business";
  if (norm.includes("LS") || norm.includes("CE") || norm.includes("CIVIL") || norm.includes("SURVEY")) {
    return "Building & Civil Engineering";
  }
  return "Computing & Informatics";
}

/**
 * Generates all storage keys (canonical, primary, and aliases) for a cohort.
 */
export function getStorageKeysForCohort(code: string): string[] {
  const canonical = resolveCanonicalCohortKey(code);
  const keys = new Set<string>();

  keys.add(`mtti_class_register_${canonical}`);
  keys.add(`mtti_class_register_persisted_${canonical}`);
  keys.add(`mtti_class_register_${code}`);
  keys.add(`mtti_class_register_persisted_${code}`);

  const cohort = OFFICIAL_INSTITUTIONAL_COHORTS.find((c) => c.id === canonical);
  if (cohort) {
    keys.add(`mtti_class_register_${cohort.primaryCode}`);
    keys.add(`mtti_class_register_persisted_${cohort.primaryCode}`);
    for (const alias of cohort.aliases) {
      keys.add(`mtti_class_register_${alias}`);
    }
  }

  return Array.from(keys);
}
