/**
 * Mukiria Technical Training Institute (MTTI)
 * Versioned Compliance Rulesets & Assessment Hurdle Engine
 *
 * Implements TVET CDACC / KNQF regulatory specifications with
 * data-driven rulesets, versioned overrides, and strict 3-exam theory hurdles.
 */

export interface ExamStructureRules {
  allow_true_false?: boolean;
  prohibit_true_false?: boolean;
  min_checklist_items?: number;
  max_checklist_items?: number;
  section_a_marks?: number;
  section_b_marks?: number;
  total_marks?: number;
  [key: string]: any;
}

export interface ComplianceRulesetRecord {
  id: string;
  version_tag: string;
  effective_from: string;
  level: number;
  ct_weight: number;
  cp_weight: number;
  min_attendance_pct: number;
  required_theory_exams: number;
  missing_exam_policy: "zero_if_incomplete" | string;
  exam_structure_rules: ExamStructureRules;
  created_at?: string;
  updated_at?: string;
}

/**
 * Deterministic institutional default rulesets for KNQF 2026 Term 3.
 * Serves as fail-closed fallback for offline operations and initial seeding.
 */
export const DEFAULT_COMPLIANCE_RULESETS: ComplianceRulesetRecord[] = [
  {
    id: "ruleset-knqf-2026-t3-l3",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 3,
    ct_weight: 0.20,
    cp_weight: 0.80,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: true,
      prohibit_true_false: false,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 20,
      section_b_marks: 30,
      total_marks: 50,
    },
  },
  {
    id: "ruleset-knqf-2026-t3-l4",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 4,
    ct_weight: 0.30,
    cp_weight: 0.70,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 10,
      section_b_marks: 40,
      total_marks: 50,
    },
  },
  {
    id: "ruleset-knqf-2026-t3-l5",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 5,
    ct_weight: 0.40,
    cp_weight: 0.60,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 40,
      section_b_marks: 60,
      total_marks: 100,
    },
  },
  {
    id: "ruleset-knqf-2026-t3-l6",
    version_tag: "KNQF_2026_T3",
    effective_from: "2026-08-31T00:00:00Z",
    level: 6,
    ct_weight: 0.50,
    cp_weight: 0.50,
    min_attendance_pct: 75,
    required_theory_exams: 3,
    missing_exam_policy: "zero_if_incomplete",
    exam_structure_rules: {
      allow_true_false: false,
      prohibit_true_false: true,
      min_checklist_items: 10,
      max_checklist_items: 25,
      section_a_marks: 40,
      section_b_marks: 60,
      total_marks: 100,
    },
  },
];

/**
 * Resolves the active compliance ruleset by level and optional version tag.
 * Falls back deterministically to DEFAULT_COMPLIANCE_RULESETS if not found.
 */
export function getActiveRuleset(
  level: number,
  versionTag?: string,
  rulesetPool: ComplianceRulesetRecord[] = DEFAULT_COMPLIANCE_RULESETS
): ComplianceRulesetRecord {
  const normLevel = Math.max(3, Math.min(6, Math.round(level || 6)));
  const pool = Array.isArray(rulesetPool) && rulesetPool.length > 0 ? rulesetPool : DEFAULT_COMPLIANCE_RULESETS;

  if (versionTag) {
    const matched = pool.find((r) => r.level === normLevel && r.version_tag.toUpperCase() === versionTag.trim().toUpperCase());
    if (matched) return matched;
  }

  // Find exact level in pool
  const matchedLevel = pool.find((r) => r.level === normLevel);
  if (matchedLevel) return matchedLevel;

  // Final fallback to default Level 6
  return (
    DEFAULT_COMPLIANCE_RULESETS.find((r) => r.level === normLevel) ||
    DEFAULT_COMPLIANCE_RULESETS[3]
  );
}

export interface TheoryAverageOptions {
  resit_pending?: boolean;
  required_exams?: number;
  ruleset?: ComplianceRulesetRecord;
}

/**
 * TVET CDACC Institutional 3-Exam Theory Hurdle Engine
 *
 * Rules:
 * 1. All valid theory scores are normalized to a 100% scale.
 * 2. If fewer than `required_theory_exams` (default 3) are recorded, the candidate
 *    receives 0% for Continuous Theory (CT Avg) unless explicitly overridden
 *    by `resit_pending: true`.
 * 3. When 3 exams are available (or resit_pending is true), calculates the arithmetic
 *    mean rounded to the nearest integer.
 */
export function calculateContinuousTheoryAverage(
  scores: (number | string | undefined | null)[],
  options?: TheoryAverageOptions
): number {
  if (!Array.isArray(scores)) return 0;

  const validScores: number[] = [];
  for (const s of scores) {
    if (s === null || s === undefined || s === "") continue;
    const num = typeof s === "number" ? s : parseFloat(String(s));
    if (!isNaN(num)) {
      // Normalize to 100% scale (bounds between 0 and 100)
      const clamped = Math.max(0, Math.min(100, Math.round(num)));
      validScores.push(clamped);
    }
  }

  const requiredExams = options?.ruleset?.required_theory_exams ?? options?.required_exams ?? 3;

  // Strict Hurdle: If incomplete and no resit pending, return 0%
  if (!options?.resit_pending && validScores.length < requiredExams) {
    return 0;
  }

  if (validScores.length === 0) return 0;

  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
  return Math.round(sum / validScores.length);
}

/**
 * Computes level-weighted mark according to active ruleset.
 */
export function calculateWeightedMarkWithRuleset(
  ctAvg: number,
  cpAvg: number,
  levelOrRuleset: number | ComplianceRulesetRecord = 6,
  versionTag?: string,
  rulesetPool?: ComplianceRulesetRecord[]
): number {
  const ruleset =
    typeof levelOrRuleset === "object"
      ? levelOrRuleset
      : getActiveRuleset(levelOrRuleset, versionTag, rulesetPool);

  const raw = (ctAvg || 0) * ruleset.ct_weight + (cpAvg || 0) * ruleset.cp_weight;
  return Math.round(raw);
}

/**
 * Validates exam structure rules (e.g. True/False prohibitions and checklist ranges)
 * using data-driven rulesets.
 */
export function validateExamStructureWithRuleset(
  payload: any,
  levelOrRuleset: number | ComplianceRulesetRecord,
  rulesetPool?: ComplianceRulesetRecord[]
): string[] {
  const ruleset =
    typeof levelOrRuleset === "object"
      ? levelOrRuleset
      : getActiveRuleset(levelOrRuleset, undefined, rulesetPool);

  const errors: string[] = [];
  const rules = ruleset.exam_structure_rules || {};

  if (payload.type === "practical") {
    const checklistCount = payload.checklist_items?.length || 0;
    const minItems = rules.min_checklist_items ?? 10;
    const maxItems = rules.max_checklist_items ?? 25;
    if (checklistCount < minItems || checklistCount > maxItems) {
      errors.push(`Practical Observation Checklist must contain between ${minItems} and ${maxItems} items (currently: ${checklistCount}).`);
    }
    return errors;
  }

  const sectionAQuestions = payload.section_a?.questions || [];
  const sectionBQuestions = payload.section_b?.questions || [];
  const sectionATotal = sectionAQuestions.reduce((s: number, q: any) => s + (q.marks || 0), 0);
  const sectionBTotal = sectionBQuestions.reduce((s: number, q: any) => s + (q.marks || 0), 0);
  const overallTotal = sectionATotal + sectionBTotal;

  if (rules.section_a_marks !== undefined && sectionATotal !== rules.section_a_marks) {
    errors.push(`Level ${ruleset.level} Section A must total exactly ${rules.section_a_marks} marks (currently: ${sectionATotal}).`);
  }

  if (rules.section_b_marks !== undefined && sectionBTotal !== rules.section_b_marks) {
    errors.push(`Level ${ruleset.level} Section B must total exactly ${rules.section_b_marks} marks (currently: ${sectionBTotal}).`);
  }

  if (rules.total_marks !== undefined && overallTotal !== rules.total_marks) {
    errors.push(`Level ${ruleset.level} Total marks must be exactly ${rules.total_marks} (currently: ${overallTotal}).`);
  }

  // True/False prohibition check
  if (rules.prohibit_true_false || rules.allow_true_false === false) {
    const hasProhibitedTypes = [...sectionAQuestions, ...sectionBQuestions].some(
      (q: any) => q.type === "true_false" || q.type === "matching"
    );
    if (hasProhibitedTypes) {
      errors.push(`CRITICAL: True/False and Matching questions are strictly prohibited for Level ${ruleset.level} written assessments.`);
    }
  }

  return errors;
}
