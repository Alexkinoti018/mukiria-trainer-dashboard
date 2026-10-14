/**
 * CANONICAL TVET CDACC ASSESSMENT TAXONOMY
 * Mukiria Technical Training Institute (MTTI)
 * 
 * Standardized across all client pages, modals, assessment broadsheets, and database schemas.
 * Strictly and only recognizes the six canonical assessment types:
 * 
 * TYPE 1: Written Assessment I (Exam 1) -> Marksheet Column: CT1 (100%)
 * TYPE 2: Written Assessment II (Exam 2) -> Marksheet Column: CT2 (100%)
 * TYPE 3: Written Assessment III (Exam 3) -> Marksheet Column: CT3 (100%)
 * TYPE 4: Practical Assessments (I, II, and III) -> Marksheet Columns: CP1, CP2, CP3 (100%)
 * TYPE 5: Continuous Assessment Tests (CAT) -> Flexible 15-30 Marks, normalizes to CT1/CT2/CT3
 * TYPE 6: Course Projects -> Discretionary portfolio/group project, feeds into CP1/CP2/CP3
 */

export type CanonicalAssessmentType =
  | "WRITTEN_ASSESSMENT_1"
  | "WRITTEN_ASSESSMENT_2"
  | "WRITTEN_ASSESSMENT_3"
  | "PRACTICAL_ASSESSMENT_1"
  | "PRACTICAL_ASSESSMENT_2"
  | "PRACTICAL_ASSESSMENT_3"
  | "CONTINUOUS_ASSESSMENT_TEST"
  | "COURSE_PROJECT";

export type MarksheetSlot = "CT1" | "CT2" | "CT3" | "CP1" | "CP2" | "CP3";

export type AssessmentTypeCode =
  | "CT1"
  | "CT2"
  | "CT3"
  | "CP1"
  | "CP2"
  | "CP3"
  | "CAT"
  | "PROJECT";

export interface AssessmentTypeDefinition {
  type: CanonicalAssessmentType;
  code: AssessmentTypeCode;
  title: string;
  name: string;
  shortTitle: string;
  role: string;
  marksheetSlot?: MarksheetSlot;
  defaultMaxScore: number;
  delivery: string;
  governance: string;
  category: "Theory" | "Practical" | "Discretionary";
  badgeClass: {
    bg: string;
    text: string;
    border: string;
  };
}

export const CANONICAL_ASSESSMENT_MAP: Record<CanonicalAssessmentType, AssessmentTypeDefinition> = {
  WRITTEN_ASSESSMENT_1: {
    type: "WRITTEN_ASSESSMENT_1",
    code: "CT1",
    title: "Written Assessment I (Exam 1)",
    name: "Written Assessment I (Exam 1)",
    shortTitle: "Written Assessment I",
    role: "Formative Continuous Theory Assessment 1",
    marksheetSlot: "CT1",
    defaultMaxScore: 100,
    delivery: "Online proctored exam paper or physical written test entry",
    governance: "Mandatory Formative Assessment 1. Scored out of 100%, populates Marksheet column CT1.",
    category: "Theory",
    badgeClass: {
      bg: "bg-blue-50 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
    },
  },
  WRITTEN_ASSESSMENT_2: {
    type: "WRITTEN_ASSESSMENT_2",
    code: "CT2",
    title: "Written Assessment II (Exam 2)",
    name: "Written Assessment II (Exam 2)",
    shortTitle: "Written Assessment II",
    role: "Formative Continuous Theory Assessment 2",
    marksheetSlot: "CT2",
    defaultMaxScore: 100,
    delivery: "Online proctored exam paper or physical written test entry",
    governance: "Mandatory Formative Assessment 2. Scored out of 100%, populates Marksheet column CT2.",
    category: "Theory",
    badgeClass: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-800",
    },
  },
  WRITTEN_ASSESSMENT_3: {
    type: "WRITTEN_ASSESSMENT_3",
    code: "CT3",
    title: "Written Assessment III (Exam 3)",
    name: "Written Assessment III (Exam 3)",
    shortTitle: "Written Assessment III",
    role: "Formative Continuous Theory Assessment 3",
    marksheetSlot: "CT3",
    defaultMaxScore: 100,
    delivery: "Online proctored exam paper or physical written test entry",
    governance: "Mandatory Formative Assessment 3. Scored out of 100%, populates Marksheet column CT3.",
    category: "Theory",
    badgeClass: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-200 dark:border-purple-800",
    },
  },
  PRACTICAL_ASSESSMENT_1: {
    type: "PRACTICAL_ASSESSMENT_1",
    code: "CP1",
    title: "Practical Assessment I (Prac 1)",
    name: "Practical Assessment I (Prac 1)",
    shortTitle: "Practical Assessment I",
    role: "Formative Continuous Practical Assessment 1",
    marksheetSlot: "CP1",
    defaultMaxScore: 100,
    delivery: "Interactive online observation checklist (ObservationChecklistMarkingModal)",
    governance: "Discrete competency indicators computed dynamically to percentage, populates Marksheet column CP1.",
    category: "Practical",
    badgeClass: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-800",
    },
  },
  PRACTICAL_ASSESSMENT_2: {
    type: "PRACTICAL_ASSESSMENT_2",
    code: "CP2",
    title: "Practical Assessment II (Prac 2)",
    name: "Practical Assessment II (Prac 2)",
    shortTitle: "Practical Assessment II",
    role: "Formative Continuous Practical Assessment 2",
    marksheetSlot: "CP2",
    defaultMaxScore: 100,
    delivery: "Interactive online observation checklist (ObservationChecklistMarkingModal)",
    governance: "Discrete competency indicators computed dynamically to percentage, populates Marksheet column CP2.",
    category: "Practical",
    badgeClass: {
      bg: "bg-teal-50 dark:bg-teal-900/30",
      text: "text-teal-700 dark:text-teal-300",
      border: "border-teal-200 dark:border-teal-800",
    },
  },
  PRACTICAL_ASSESSMENT_3: {
    type: "PRACTICAL_ASSESSMENT_3",
    code: "CP3",
    title: "Practical Assessment III (Prac 3)",
    name: "Practical Assessment III (Prac 3)",
    shortTitle: "Practical Assessment III",
    role: "Formative Continuous Practical Assessment 3",
    marksheetSlot: "CP3",
    defaultMaxScore: 100,
    delivery: "Interactive online observation checklist (ObservationChecklistMarkingModal)",
    governance: "Discrete competency indicators computed dynamically to percentage, populates Marksheet column CP3.",
    category: "Practical",
    badgeClass: {
      bg: "bg-cyan-50 dark:bg-cyan-900/30",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-200 dark:border-cyan-800",
    },
  },
  CONTINUOUS_ASSESSMENT_TEST: {
    type: "CONTINUOUS_ASSESSMENT_TEST",
    code: "CAT",
    title: "Continuous Assessment Test (CAT)",
    name: "Continuous Assessment Test (CAT)",
    shortTitle: "Continuous Assessment Test",
    role: "Discretionary Trainer Theory Test (15–30 Marks)",
    defaultMaxScore: 30,
    delivery: "Administered physically or online via TraineeAssignments / Online Portal",
    governance: "Flexible mark scale (15–30 marks). Recorded independently or normalized to 100% to populate CT1, CT2, or CT3.",
    category: "Discretionary",
    badgeClass: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800",
    },
  },
  COURSE_PROJECT: {
    type: "COURSE_PROJECT",
    code: "PROJECT",
    title: "Course Project",
    name: "Course Project",
    shortTitle: "Course Project",
    role: "Discretionary Student Portfolio or Group Project",
    defaultMaxScore: 100,
    delivery: "Managed via TraineeAssignments and UploadGrading",
    governance: "Scored using trainer rubrics, with option to feed into continuous practical evidence (CP1, CP2, or CP3).",
    category: "Discretionary",
    badgeClass: {
      bg: "bg-rose-50 dark:bg-rose-900/30",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800",
    },
  },
};

export const CANONICAL_ASSESSMENT_TYPES: AssessmentTypeDefinition[] = Object.values(CANONICAL_ASSESSMENT_MAP);
export const CANONICAL_ASSESSMENT_LIST = CANONICAL_ASSESSMENT_TYPES;

/**
 * Normalizes any incoming task code, file name, or title to canonical AssessmentTypeCode.
 */
export function normalizeToCanonicalAssessmentSlot(
  rawTaskCode?: string,
  unitCode?: string,
  title?: string,
  examType?: string
): AssessmentTypeCode {
  const code = (rawTaskCode || "").trim().toUpperCase();

  // Exact canonical codes
  if (code === "CT1" || code === "CAT1" || code === "CAT 1" || code === "EXAM 1" || code === "WA1" || code === "WRITTEN ASSESSMENT 1") return "CT1";
  if (code === "CT2" || code === "CAT2" || code === "CAT 2" || code === "EXAM 2" || code === "WA2" || code === "WRITTEN ASSESSMENT 2") return "CT2";
  if (code === "CT3" || code === "CAT3" || code === "CAT 3" || code === "EXAM 3" || code === "WA3" || code === "WRITTEN ASSESSMENT 3") return "CT3";
  if (code === "CP1" || code === "PRAC 1" || code === "PRACTICAL 1" || code === "PA1" || code === "PRACTICAL ASSESSMENT 1") return "CP1";
  if (code === "CP2" || code === "PRAC 2" || code === "PRACTICAL 2" || code === "PA2" || code === "PRACTICAL ASSESSMENT 2") return "CP2";
  if (code === "CP3" || code === "PRAC 3" || code === "PRACTICAL 3" || code === "PA3" || code === "PRACTICAL ASSESSMENT 3") return "CP3";
  if (code === "CAT" || code === "CATS" || code.startsWith("CAT-") || code.startsWith("CAT_") || code === "ASSIGNMENT") return "CAT";
  if (code === "PROJECT" || code === "PROJ" || code.includes("PROJECT")) return "PROJECT";

  const combined = `${unitCode || ""} ${title || ""} ${rawTaskCode || ""}`.toUpperCase();

  if (combined.includes("PROJECT")) return "PROJECT";

  // Check if it's a practical assessment
  const isPractical =
    examType === "practical" ||
    combined.includes("PRAC") ||
    combined.includes("PRACTICAL") ||
    combined.includes("OBSERVATION") ||
    combined.includes("CHECKLIST") ||
    combined.includes("-PA") ||
    combined.includes("CP1") ||
    combined.includes("CP2") ||
    combined.includes("CP3");

  if (isPractical) {
    if (combined.includes("3") || combined.includes("THREE") || combined.includes("CP3") || combined.includes("PA3")) return "CP3";
    if (combined.includes("2") || combined.includes("TWO") || combined.includes("CP2") || combined.includes("PA2")) return "CP2";
    return "CP1";
  }

  // Check if it's a specific written assessment 1, 2, or 3
  if (combined.includes("WA3") || combined.includes("WRITTEN ASSESSMENT 3") || combined.includes("EXAM 3") || combined.includes("CT3")) return "CT3";
  if (combined.includes("WA2") || combined.includes("WRITTEN ASSESSMENT 2") || combined.includes("EXAM 2") || combined.includes("CT2")) return "CT2";
  if (combined.includes("WA1") || combined.includes("WRITTEN ASSESSMENT 1") || combined.includes("EXAM 1") || combined.includes("CT1")) return "CT1";

  // Discretionary CAT check (e.g. Learning outcome CATs for 15-30 marks)
  if (combined.includes("CAT") || combined.includes("CONTINUOUS ASSESSMENT TEST") || combined.includes("ASSIGNMENT")) return "CAT";

  return "CT1";
}

export function getCanonicalAssessmentType(codeOrAlias: string): AssessmentTypeDefinition | undefined {
  if (!codeOrAlias) return undefined;
  const raw = codeOrAlias.trim();
  const normalized = normalizeToCanonicalAssessmentSlot(raw);
  return CANONICAL_ASSESSMENT_LIST.find(
    (t) => t.code === normalized || t.type.toLowerCase() === raw.toLowerCase()
  );
}

export function isAssessmentSlotRecognized(slot: string): boolean {
  const recognizedCodes: string[] = ["CT1", "CT2", "CT3", "CP1", "CP2", "CP3", "CAT", "PROJECT"];
  return recognizedCodes.includes((slot || "").trim().toUpperCase());
}

/**
 * Normalizes a discretionary CAT score (15, 20, 25, 30 marks) into standard 100% scale.
 */
export function normalizeCatScoreToTheorySlot(rawScore: number, maxScore: number = 30): number {
  if (!maxScore || maxScore <= 0) return 0;
  const pct = (rawScore / maxScore) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * TVET CDACC Official Weight Formula & Double-Hurdle Engine
 * 
 * Rules:
 * 1. Double Hurdle: Candidate must attain >= 50% in both Theory Average (CT_Avg)
 *    and Practical Average (CP_Avg) to be deemed "Competent".
 * 2. Level Ratios:
 *    - Level 6: Theory 50% (0.50), Practical 50% (0.50)
 *    - Level 5: Theory 40% (0.40), Practical 60% (0.60)
 *    - Level 4: Theory 30% (0.30), Practical 70% (0.70)
 *    - Level 3: Theory 20% (0.20), Practical 80% (0.80)
 * 3. 60% Internal Certification Contribution:
 *    Continuous internal assessment contributes 60% of the final qualification award.
 */
export interface CdaccDoubleHurdleResult {
  ctAvg: number;
  cpAvg: number;
  weightedMark: number;
  theoryWeight: number;
  practicalWeight: number;
  passedTheoryHurdle: boolean;
  passedPracticalHurdle: boolean;
  isCompetent: boolean;
  internalContribution: number; // Scored out of 60%
  internalCertificationContribution: number; // Scored out of 60%
  verdict: "Competent" | "Refer [NYC]";
  gradeBand: "Distinction" | "Credit" | "Pass" | "Refer";
}

export function calculateCdaccWeightedMark(
  ctAvg: number,
  cpAvg: number,
  level: number = 6
): CdaccDoubleHurdleResult {
  const roundCt = Math.round(ctAvg || 0);
  const roundCp = Math.round(cpAvg || 0);

  let ctWeight = 0.5;
  let cpWeight = 0.5;

  switch (level) {
    case 6:
      ctWeight = 0.5;
      cpWeight = 0.5;
      break;
    case 5:
      ctWeight = 0.4;
      cpWeight = 0.6;
      break;
    case 4:
      ctWeight = 0.3;
      cpWeight = 0.7;
      break;
    case 3:
      ctWeight = 0.2;
      cpWeight = 0.8;
      break;
    default:
      ctWeight = 0.5;
      cpWeight = 0.5;
      break;
  }

  const rawWeighted = roundCt * ctWeight + roundCp * cpWeight;
  const weightedMark = Math.round(rawWeighted);

  // Double Hurdle Enforcement (>= 50% on both theory & practical)
  const passedTheoryHurdle = roundCt >= 50;
  const passedPracticalHurdle = roundCp >= 50;
  const isCompetent = passedTheoryHurdle && passedPracticalHurdle && weightedMark >= 50;

  // 60% Internal Certification Contribution (TVET CDACC continuous ratio)
  const internalContribution = Math.round(weightedMark * 0.6);

  let gradeBand: "Distinction" | "Credit" | "Pass" | "Refer" = "Refer";
  if (isCompetent) {
    if (weightedMark >= 80) gradeBand = "Distinction";
    else if (weightedMark >= 65) gradeBand = "Credit";
    else gradeBand = "Pass";
  }

  return {
    ctAvg: roundCt,
    cpAvg: roundCp,
    weightedMark,
    theoryWeight: ctWeight,
    practicalWeight: cpWeight,
    passedTheoryHurdle,
    passedPracticalHurdle,
    isCompetent,
    internalContribution,
    internalCertificationContribution: internalContribution,
    verdict: isCompetent ? "Competent" : "Refer [NYC]",
    gradeBand,
  };
}

export function getCanonicalAssessmentTitle(code: AssessmentTypeCode): string {
  switch (code) {
    case "CT1": return "Written Assessment I (Exam 1)";
    case "CT2": return "Written Assessment II (Exam 2)";
    case "CT3": return "Written Assessment III (Exam 3)";
    case "CP1": return "Practical Assessment I (Prac 1)";
    case "CP2": return "Practical Assessment II (Prac 2)";
    case "CP3": return "Practical Assessment III (Prac 3)";
    case "CAT": return "Continuous Assessment Test (CAT)";
    case "PROJECT": return "Course Project";
    default: return code;
  }
}
