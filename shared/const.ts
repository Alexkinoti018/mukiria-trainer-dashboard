export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

/**
 * Centralized Admission Number & Registration String Normalizer
 * Mukiria Technical Training Institute (MTTI)
 *
 * Normalizes an institutional admission number or registration code for robust matching.
 * - Strips leading/trailing and inner whitespace and transforms to uppercase.
 * - Strips common institutional cohort prefixes (e.g. "ITECH 6 MOD/", "ICT4 MOD/", "FBS 5 MOD/", "LS6 MOD/")
 *   followed by a slash or dash separator.
 * - Preserves full alphanumeric structure (e.g. "D/UPNUT/25042/069", "14179/S2026", "CDACC/2026/01").
 */
export function normalizeAdmissionNumber(adm: string | null | undefined): string {
  if (!adm) return "";
  let s = adm.trim().toUpperCase().replace(/\s+/g, "");
  // Strip known institutional cohort prefix followed by a slash or dash
  s = s.replace(
    /^(ICT4\/ITECH\s*6[^\/\-]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?|CFD\s*MOD)[\/\-]/i,
    ""
  );
  return s;
}

/**
 * Robust bidirectional matching for admission numbers and candidate registration strings.
 * Handles:
 * - Direct equality (case/whitespace insensitive)
 * - Normalized admission string equality
 * - Common transcription variances (e.g., 12026 vs J2026, 52026 vs S2026)
 * - Core numeric identification matches (e.g. "14179" in "14179/S2026")
 * - Substring containment for 4+ character registration tokens
 */
export function matchAdmissionNumbers(
  admA: string | null | undefined,
  admB: string | null | undefined
): boolean {
  if (!admA || !admB) return false;
  const rawA = admA.trim().toUpperCase();
  const rawB = admB.trim().toUpperCase();
  if (rawA === rawB) return true;

  const noSpaceA = rawA.replace(/\s+/g, "");
  const noSpaceB = rawB.replace(/\s+/g, "");
  if (noSpaceA === noSpaceB) return true;

  const normA = normalizeAdmissionNumber(admA);
  const normB = normalizeAdmissionNumber(admB);
  if (normA && normB && normA === normB) return true;

  // Slash substitution normalization (e.g., 12026 vs J2026, 52026 vs S2026)
  const slashA = noSpaceA.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  const slashB = noSpaceB.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  if (slashA === slashB) return true;

  // Check core digit matches if applicable (e.g. "14179" in "14179/S2026")
  const coreA = (normA.match(/\b\d{4,6}\b/) || noSpaceA.match(/\d{4,6}/))?.[0];
  const coreB = (normB.match(/\b\d{4,6}\b/) || noSpaceB.match(/\d{4,6}/))?.[0];
  if (coreA && coreB && coreA === coreB) {
    const hasAlphaA = /[A-Z]/.test(normA);
    const hasAlphaB = /[A-Z]/.test(normB);
    // If both have complex alphanumeric codes (like D/UPNUT/25042/069), don't false match unless one contains the other
    if (!hasAlphaA || !hasAlphaB || normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  // Substring containment for 4+ char registration numbers (e.g. "14179" in "ITECH 6 MOD/14179/S2026")
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  return false;
}
