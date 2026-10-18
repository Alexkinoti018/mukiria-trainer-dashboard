export interface ElementAndPerformanceCriteria {
  elementTitle: string;
  criteria: string[];
}

export interface LearningPlanScheduleSession {
  week: number;
  sessionNumber: string;
  sessionTitle: string;
  learningOutcomes: string[];
  trainerActivities: string[];
  traineeActivities: string[];
  resourcesAndRefs: string[];
  assessments: string[];
  reflectionsAndDate: string;
}

export interface LearningPlanRecord {
  metadata: {
    formNumber: string;
    institution: string;
    unitTitle: string;
    unitCode: string;
    trainerName: string;
    level: string;
    dateOfPreparation: string;
    dateOfRevision: string;
    numberOfTrainees: number;
    cohortCode: string;
    skillsSummary: string[];
    elementsAndPerformanceCriteria: ElementAndPerformanceCriteria[];
    preparedBy: { name: string; date: string };
    approvedBy: { name: string; date: string; title: string };
  };
  schedule: LearningPlanScheduleSession[];
}
