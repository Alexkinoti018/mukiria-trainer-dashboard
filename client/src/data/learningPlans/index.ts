import type { LearningPlanRecord } from "./types";
import plan0415Admin from "./plan_0415_451_12A_admin.json";
import planItech5ComputerOps from "./plan_IT_CU_ICTA_CR_02_5_MA_itech5.json";
import planDigitalLiteracyEe6 from "./plan_digital_literacy_ee6.json";
import planWorkEthicsItech6 from "./plan_IT_OS_ICTA_BC_02_5_MA_itech6.json";
import planAgre6DigitalLiteracy from "./plan_AGR_CU_EXT_BC_01_5_MA_agre6.json";
import planFbp6DigitalLiteracy from "./plan_HOS_OS_FBO_BC_01_5_MA_fbp6.json";
import planIct4Itech6ComputerOps from "./plan_IT_CU_ICTA_CR_02_4_MA_ict4_itech6.json";
import planItech6InstallSoftware from "./plan_IT_CU_ICTA_CR_01_5_MA_itech6.json";
import planItech5Repair from "./plan_IT_CU_ICTA_CR_04_4_MA_itech5.json";
import planEe5DigitalLiteracy from "./plan_0611_441_02B_ee5.json";
import planItech5WorkEthics from "./plan_IT_OS_ICTA_BC_02_5_MA_itech5.json";
import planItech5InstallSoftware from "./plan_IT_OS_ICTA_CR_01_5_MA_itech5.json";
import planMisManageIS from "./plan_IT_OS_ICT_CR_8_6_mis.json";

export * from "./types";

export const OFFICIAL_LEARNING_PLANS: LearningPlanRecord[] = [
  plan0415Admin as LearningPlanRecord,
  planItech5ComputerOps as LearningPlanRecord,
  planDigitalLiteracyEe6 as LearningPlanRecord,
  planWorkEthicsItech6 as LearningPlanRecord,
  planAgre6DigitalLiteracy as LearningPlanRecord,
  planFbp6DigitalLiteracy as LearningPlanRecord,
  planIct4Itech6ComputerOps as LearningPlanRecord,
  planItech6InstallSoftware as LearningPlanRecord,
  planItech5Repair as LearningPlanRecord,
  planEe5DigitalLiteracy as LearningPlanRecord,
  planItech5WorkEthics as LearningPlanRecord,
  planItech5InstallSoftware as LearningPlanRecord,
  planMisManageIS as LearningPlanRecord,
];

/**
 * Normalizes a code or title string for robust lookup matching.
 */
function normalizeKey(str?: string): string {
  if (!str) return "";
  return str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Finds an official digitized learning plan matching unit code or cohort code.
 */
export function getOfficialLearningPlan(
  unitCode?: string,
  cohortCode?: string
): LearningPlanRecord | undefined {
  const normUnit = normalizeKey(unitCode);
  const normCohort = normalizeKey(cohortCode);

  return OFFICIAL_LEARNING_PLANS.find((plan) => {
    const pUnit = normalizeKey(plan.metadata.unitCode);
    const pTitle = normalizeKey(plan.metadata.unitTitle);
    const pCohort = normalizeKey(plan.metadata.cohortCode);

    if (normUnit) {
      const unitMatches = pUnit && (pUnit === normUnit || pUnit.includes(normUnit) || normUnit.includes(pUnit));
      const titleMatches = pTitle && (pTitle === normUnit || pTitle.includes(normUnit));
      if (unitMatches || titleMatches) {
        if (normCohort) {
          return pCohort.includes(normCohort) || normCohort.includes(pCohort) || pCohort === normCohort;
        }
        return true;
      }
    }

    if (normCohort && (pCohort.includes(normCohort) || normCohort.includes(pCohort))) {
      return true;
    }

    return false;
  });
}

/**
 * Converts a digitized LearningPlanRecord into the UI's LearningPlanDocument shape.
 */
export function convertRecordToLearningPlanDocument(
  record: LearningPlanRecord,
  customId?: string
) {
  const levelNum = parseInt(record.metadata.level.replace(/[^0-9]/g, "").charAt(0) || "6", 10);
  const elements = record.metadata.elementsAndPerformanceCriteria.map((el) => ({
    title: el.elementTitle,
    performanceCriteria: el.criteria,
  }));

  const weeks = record.schedule.map((s, idx) => {
    // Parse numeric session start from string e.g. "1&2" -> 1, "3,4,5&6" -> 3
    const firstDigit = parseInt(s.sessionNumber.match(/\d+/)?.[0] || String(idx + 1), 10);
    return {
      week: s.week,
      sessionNo: firstDigit,
      title: s.sessionTitle,
      outcome: s.learningOutcomes.join("\n"),
      trainerActivities: s.trainerActivities.join("\n"),
      traineeActivities: s.traineeActivities.join("\n"),
      resources: s.resourcesAndRefs.join("\n"),
      assessments: s.assessments.join("\n"),
      reflections: s.reflectionsAndDate || "",
    };
  });

  return {
    id: customId || `official-lp-${(record.metadata.unitCode || "unit").replace(/[^a-zA-Z0-9]/g, "-")}-${(record.metadata.cohortCode || "all").replace(/[^a-zA-Z0-9]/g, "-")}`,
    unitCode: record.metadata.unitCode || "0415 451 12A",
    unitTitle: record.metadata.unitTitle,
    trainerName: record.metadata.trainerName,
    department: record.metadata.cohortCode.includes("ADMIN")
      ? "Business Studies"
      : record.metadata.cohortCode.includes("AGRE")
      ? "Agriculture"
      : record.metadata.cohortCode.includes("EE")
      ? "Electrical & Electronics"
      : record.metadata.cohortCode.includes("FBP")
      ? "Hospitality & Institutional Management"
      : "Computing and Informatics",
    duration: "07 SEP – 13 NOV 2026",
    level: levelNum,
    traineesCount: record.metadata.numberOfTrainees,
    classCode: record.metadata.cohortCode,
    datePrepared: record.metadata.dateOfPreparation,
    dateRevised: record.metadata.dateOfRevision || undefined,
    trainerSignDate: record.metadata.preparedBy.date || record.metadata.dateOfPreparation,
    trainerSignature: record.metadata.preparedBy.name,
    approvedBy: record.metadata.approvedBy.name ? `${record.metadata.approvedBy.name}${record.metadata.approvedBy.title ? `, ${record.metadata.approvedBy.title}` : ""}` : undefined,
    approvalDate: record.metadata.approvedBy.date || undefined,
    approvalSignature: record.metadata.approvedBy.name || undefined,
    skillOrJobTask: record.metadata.skillsSummary.join(", "),
    elements,
    weeks,
  };
}
