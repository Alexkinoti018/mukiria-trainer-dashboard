import parsedTemplates from "./parsed_templates.json";

export interface SessionDeliveryStep {
  time_minutes: number;
  trainer_activity: string;
  learner_activity: string;
  assessment: string;
}

export interface SessionPlan {
  id: string;
  document_code: string;
  trainer_name: string;
  department: string;
  unit_name: string;
  unit_code: string;
  class_code: string;
  level: string;
  trainees_count: number;
  date: string;
  time_duration: string;
  week_number: number;
  session_title: string;
  learning_outcomes: string[];
  resources: string[];
  safety_requirements: string;
  introduction: string;
  delivery_steps: SessionDeliveryStep[];
  session_review: string;
  assignment: string;
  reflection: string;
  signature: string;
  signature_date: string;
  session_number?: number;
  status?: "planned" | "delivered"; // Linking field
  approval_status?: "draft" | "pending" | "approved" | "rejected" | "revision_requested";
  hod_reviewed_by?: string | null;
  hod_reviewer_name?: string | null;
  hod_review_date?: string | null;
  hod_remarks?: string | null;
}

export interface LearningPlanWeek {
  id: string;
  unit_code: string;
  unit_name: string;
  trainer_name: string;
  class_code: string;
  week_number: number;
  topic: string;
  learning_outcomes: string[];
  resources: string[];
  status: "planned" | "session_plan_created" | "delivered";
  session_plan_id?: string;
}

export interface RecordOfWork {
  id: string;
  session_plan_id: string;
  unit_code: string;
  class_code: string;
  week_number: number;
  date_delivered: string;
  trainees_present: number;
  hours_covered: number;
  work_actually_covered: string;
  reflection: string;
  status: "delivered" | "partial" | "postponed";
  signature: string;
  signature_date: string;
  approval_status?: "draft" | "pending" | "approved" | "rejected" | "revision_requested";
  hod_reviewed_by?: string | null;
  hod_reviewer_name?: string | null;
  hod_review_date?: string | null;
  hod_remarks?: string | null;
}

export function canEditPedagogical(record?: { approval_status?: string } | null): boolean {
  if (!record) return true;
  return record.approval_status !== "approved";
}

const DEFAULT_STEPS_REGULAR: SessionDeliveryStep[] = [
  {
    time_minutes: 40,
    trainer_activity: "Present concepts on the topic.",
    learner_activity: "Active listening and note-taking.",
    assessment: "Oral Questioning",
  },
  {
    time_minutes: 60,
    trainer_activity: "Demonstrate and supervise practical application.",
    learner_activity: "Execute practical tasks on workstations.",
    assessment: "Observation",
  },
  {
    time_minutes: 20,
    trainer_activity: "Review progress and address challenges.",
    learner_activity: "Present completed tasks.",
    assessment: "Practical Checklist",
  },
];

const DEFAULT_STEPS_ASSESSMENT: SessionDeliveryStep[] = [
  {
    time_minutes: 15,
    trainer_activity: "Distribute assessment materials.",
    learner_activity: "Review instructions.",
    assessment: "N/A",
  },
  {
    time_minutes: 90,
    trainer_activity: "Invigilate Assessment.",
    learner_activity: "Complete assessment tasks.",
    assessment: "Written/Practical Exam",
  },
  {
    time_minutes: 15,
    trainer_activity: "Collect scripts and files.",
    learner_activity: "Submit work.",
    assessment: "Submission",
  },
];

interface CourseTemplate {
  unit_code: string;
  unit_name: string;
  department: string;
  class_code: string;
  level: string;
  trainees_count: number;
  weeks: {
    week: number;
    title: string;
    outcomes: string[];
    resources?: string[];
    safety?: string;
    intro?: string;
    steps?: SessionDeliveryStep[];
    review?: string;
    assignment?: string;
  }[];
}

const COURSE_TEMPLATES: CourseTemplate[] = [
  ...(parsedTemplates as any),
  {
    unit_code: "BUS/OS/IS/CR/11/5/A",
    unit_name: "APPLY ICT SKILLS",
    department: "BUSINESS ADMINISTRATION",
    class_code: "ADMIN5/6/J/26 MOD 3",
    level: "5, 6",
    trainees_count: 11,
    weeks: [
      { week: 1, title: "Hardware ID", outcomes: ["Identify internal and external hardware components."] },
      { week: 2, title: "Software/OS", outcomes: ["Classify software and navigate OS interfaces."] },
      { week: 3, title: "Operating Procedures", outcomes: ["Perform safe startup, shutdown, and peripheral connection."] },
      { week: 4, title: "File Management", outcomes: ["Create and manage file directories efficiently."] },
      { week: 5, title: "Formative Assessment (CT1)", outcomes: ["Demonstrate mastery of introductory ICT concepts."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Word Processing", outcomes: ["Execute administrative tasks using word processing."] },
      { week: 7, title: "Spreadsheets", outcomes: ["Perform data entry, editing, and manipulation."] },
      { week: 8, title: "Databases", outcomes: ["Enter and retrieve database records."] },
      { week: 9, title: "Presentations", outcomes: ["Create professional organizational presentations."] },
      { week: 10, title: "Summative Assessment & Portfolio", outcomes: ["Complete final evaluation of all ICT competencies."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
  {
    unit_code: "061155101A",
    unit_name: "APPLY DIGITAL LITERACY",
    department: "HOSPITALITY MANAGEMENT",
    class_code: "FBS 5 MOD/J/2026",
    level: "5",
    trainees_count: 23,
    weeks: [
      { week: 1, title: "Reporting & Orientation", outcomes: ["Understand admission and course requirements."] },
      { week: 2, title: "Foundations of Digital Literacy", outcomes: ["Understand hardware basics and digital literacy."] },
      { week: 3, title: "Word Processing Documents", outcomes: ["Create and format digital documents."] },
      { week: 4, title: "Spreadsheets & Arithmetic Formulas", outcomes: ["Enter data and apply basic formulas."] },
      { week: 5, title: "Continuous Assessment Test 1 (CT1)", outcomes: ["Demonstrate digital literacy written and practical skills."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Presentation Slides", outcomes: ["Create and format slide presentations."] },
      { week: 7, title: "Internet Browsing & Cloud Collaboration", outcomes: ["Apply search techniques and manage information."] },
      { week: 8, title: "Communication & Online Collaboration", outcomes: ["Utilize email and online collaboration tools."] },
      { week: 9, title: "Cybersecurity & Data Privacy", outcomes: ["Identify threats and apply basic controls."] },
      { week: 10, title: "Summative Assessment & Portfolio Review", outcomes: ["Complete final evaluation of digital literacy."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
];

export const generateMockSessionPlans = (): SessionPlan[] => {
  const plans: SessionPlan[] = [];

  COURSE_TEMPLATES.forEach((template) => {
    template.weeks.forEach((week) => {
      // Calculate date based on week offset for Term 3, 2026 (Starts 31 August 2026)
      const startDate = new Date(2026, 7, 31); // 31 August 2026 (Term 3, 2026)
      startDate.setDate(startDate.getDate() + (week.week - 1) * 7);
      
      const day = String(startDate.getDate()).padStart(2, '0');
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const year = startDate.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      const isAssessment = week.title.toLowerCase().includes("assessment");
      const steps = week.steps || (isAssessment ? DEFAULT_STEPS_ASSESSMENT : DEFAULT_STEPS_REGULAR);

      plans.push({
        id: `plan-${template.unit_code.replace(/\//g, "-")}-w${week.week}`,
        document_code: "MTTI/F/CUR/05",
        trainer_name: "MR. ALEXANDER KINOTI",
        department: template.department,
        unit_name: template.unit_name,
        unit_code: template.unit_code,
        class_code: template.class_code,
        level: template.level,
        trainees_count: template.trainees_count,
        date: dateString,
        time_duration: "10:30-12:30",
        week_number: week.week,
        session_title: week.title,
        learning_outcomes: week.outcomes,
        resources: week.resources || ["Projector", "lab workstations", "reference materials"],
        safety_requirements: week.safety || "Ergonomic guidelines, electrical safety protocols.",
        introduction: week.intro || `Overview of ${week.title} and alignment with learning outcomes.`,
        delivery_steps: steps,
        session_review: week.review || `Recap of core competencies in ${week.title}.`,
        assignment: week.assignment || `Practical reinforcement exercise related to ${week.title}.`,
        reflection: "Pending review of trainee engagement and comprehension.",
        signature: "Alexander Kinoti",
        signature_date: "07/10/2026",
        status: week.week <= 6 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? "delivered" : "planned"
      });
    });
  });

  return plans;
};

export const generateMockLearningPlans = (): LearningPlanWeek[] => {
  const plans: LearningPlanWeek[] = [];

  COURSE_TEMPLATES.forEach((template) => {
    template.weeks.forEach((week) => {
      // Pre-link week 1 to 6 of Apply ICT Skills
      const isDelivered = week.week <= 6 && template.unit_code === "BUS/OS/IS/CR/11/5/A";
      plans.push({
        id: `lp-${template.unit_code.replace(/\//g, "-")}-w${week.week}`,
        unit_code: template.unit_code,
        unit_name: template.unit_name,
        trainer_name: "MR. ALEXANDER KINOTI",
        class_code: template.class_code,
        week_number: week.week,
        topic: week.title,
        learning_outcomes: week.outcomes,
        resources: week.resources || ["Projector", "lab workstations", "reference materials"],
        status: isDelivered ? "delivered" : (week.week <= 8 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? "session_plan_created" : "planned"),
        session_plan_id: week.week <= 8 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? `plan-${template.unit_code.replace(/\//g, "-")}-w${week.week}` : undefined
      });
    });
  });

  return plans;
};

export const generateMockRecordsOfWork = (): RecordOfWork[] => {
  const records: RecordOfWork[] = [];
  
  // Preload weeks 1-6 for Term 3, 2026 (Started 31 August 2026, Current: Week 6 on 07/10/2026)
  const dates = ["31/08/2026", "07/09/2026", "14/09/2026", "21/09/2026", "28/09/2026", "07/10/2026"];
  const topics = [
    "Hardware ID",
    "Software/OS",
    "Operating Procedures",
    "File Management",
    "Formative Assessment",
    "Word Processing"
  ];
  const outcomes = [
    "Identify internal and external hardware components.",
    "Classify software and navigate OS interfaces.",
    "Perform safe startup, shutdown, and peripheral connection.",
    "Create and manage file directories efficiently.",
    "Demonstrate mastery of introductory ICT concepts.",
    "Execute administrative tasks using word processing."
  ];

  for (let i = 0; i < 6; i++) {
    records.push({
      id: `row-${Date.now()}-${i}`,
      session_plan_id: `plan-BUS-OS-IS-CR-11-5-A-w${i + 1}`,
      unit_code: "BUS/OS/IS/CR/11/5/A",
      class_code: "ADMIN5/6/J/26 MOD 3",
      week_number: i + 1,
      date_delivered: dates[i],
      trainees_present: 11 - (i % 2), // realistic attendance for Admin cohort
      hours_covered: 2, // 120 min
      work_actually_covered: `Successfully conducted presentation and practical lab session on ${topics[i]}. Trainees completed all tasks.`,
      reflection: `Learners achieved the outcome: ${outcomes[i]} Good engagement and mastery.`,
      status: "delivered",
      signature: "Alexander Kinoti",
      signature_date: dates[i]
    });
  }

  return records;
};

const isTerm3CompliantUnit = (unitCode?: string, unitName?: string, classCode?: string): boolean => {
  const u = (unitName || "").toUpperCase();
  const c = (unitCode || "").toUpperCase();
  const cls = (classCode || "").toUpperCase();

  // Pull down Graphic Design unit
  if (u.includes("GRAPHIC DESIGN") || c === "ICT/OS/CS/CR/11/6/A") return false;

  // Pull down FBS6 MOD/12026
  if (cls === "FBS6 MOD/12026" || cls.includes("12026")) return false;

  // Remove non-Term 3 cohorts (2023, 2024, 2025)
  if (cls.includes("/24") || cls.includes("/25") || cls.includes("/23")) return false;

  return true;
};

// Singleton storage loader for local development
export const getStoredSessionPlans = (): SessionPlan[] => {
  if (typeof window === "undefined") return generateMockSessionPlans();
  const saved = localStorage.getItem("mtti_session_plans");
  if (saved) {
    try {
      const parsed: SessionPlan[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(p => isTerm3CompliantUnit(p.unit_code, p.unit_name, p.class_code));
        if (filtered.length !== parsed.length) {
          localStorage.setItem("mtti_session_plans", JSON.stringify(filtered));
        }
        return filtered.length > 0 ? filtered : generateMockSessionPlans();
      }
    } catch {}
  }
  const generated = generateMockSessionPlans();
  localStorage.setItem("mtti_session_plans", JSON.stringify(generated));
  return generated;
};

export const saveStoredSessionPlans = (plans: SessionPlan[]) => {
  if (typeof window !== "undefined") {
    const filtered = plans.filter(p => isTerm3CompliantUnit(p.unit_code, p.unit_name, p.class_code));
    localStorage.setItem("mtti_session_plans", JSON.stringify(filtered));
  }
};

export const getStoredLearningPlans = (): LearningPlanWeek[] => {
  if (typeof window === "undefined") return generateMockLearningPlans();
  const saved = localStorage.getItem("mtti_learning_plans");
  if (saved) {
    try {
      const parsed: LearningPlanWeek[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(p => isTerm3CompliantUnit(p.unit_code, p.unit_name, p.class_code));
        if (filtered.length !== parsed.length) {
          localStorage.setItem("mtti_learning_plans", JSON.stringify(filtered));
        }
        return filtered.length > 0 ? filtered : generateMockLearningPlans();
      }
    } catch {}
  }
  const generated = generateMockLearningPlans();
  localStorage.setItem("mtti_learning_plans", JSON.stringify(generated));
  return generated;
};

export const saveStoredLearningPlans = (plans: LearningPlanWeek[]) => {
  if (typeof window !== "undefined") {
    const filtered = plans.filter(p => isTerm3CompliantUnit(p.unit_code, p.unit_name, p.class_code));
    localStorage.setItem("mtti_learning_plans", JSON.stringify(filtered));
  }
};

export const getStoredRecordsOfWork = (): RecordOfWork[] => {
  if (typeof window === "undefined") return generateMockRecordsOfWork();
  const saved = localStorage.getItem("mtti_records_of_work");
  if (saved) {
    try {
      const parsed: RecordOfWork[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter(r => isTerm3CompliantUnit(r.unit_code, r.work_actually_covered, r.class_code));
        if (filtered.length !== parsed.length) {
          localStorage.setItem("mtti_records_of_work", JSON.stringify(filtered));
        }
        return filtered.length > 0 ? filtered : generateMockRecordsOfWork();
      }
    } catch {}
  }
  const generated = generateMockRecordsOfWork();
  localStorage.setItem("mtti_records_of_work", JSON.stringify(generated));
  return generated;
};

export const saveStoredRecordsOfWork = (records: RecordOfWork[]) => {
  if (typeof window !== "undefined") {
    const filtered = records.filter(r => isTerm3CompliantUnit(r.unit_code, r.work_actually_covered, r.class_code));
    localStorage.setItem("mtti_records_of_work", JSON.stringify(filtered));
  }
};

