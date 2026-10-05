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
    class_code: "BUS/L5/25",
    level: "5, 6",
    trainees_count: 30,
    weeks: [
      { week: 1, title: "Hardware ID", outcomes: ["Identify internal and external hardware components."] },
      { week: 2, title: "Software/OS", outcomes: ["Classify software and navigate OS interfaces."] },
      { week: 3, title: "Operating Procedures", outcomes: ["Perform safe startup, shutdown, and peripheral connection."] },
      { week: 4, title: "File Management", outcomes: ["Create and manage file directories efficiently."] },
      { week: 5, title: "Formative Assessment", outcomes: ["Demonstrate mastery of introductory ICT concepts."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Word Processing", outcomes: ["Execute administrative tasks using word processing."] },
      { week: 7, title: "Spreadsheets", outcomes: ["Perform data entry, editing, and manipulation."] },
      { week: 8, title: "Databases", outcomes: ["Enter and retrieve database records."] },
      { week: 9, title: "Presentations", outcomes: ["Create professional organizational presentations."] },
      { week: 10, title: "Internet/Networks", outcomes: ["Navigate networks and office online services."] },
      { week: 11, title: "Advanced Tasks", outcomes: ["Execute advanced organizational administrative tasks."] },
      { week: 12, title: "Summative Assessment", outcomes: ["Complete final evaluation of all ICT competencies."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
  {
    unit_code: "ICT/OS/DL/CR/11/5/A",
    unit_name: "APPLY DIGITAL LITERACY",
    department: "COMPUTING AND INFORMATICS",
    class_code: "ICT/L5/26",
    level: "5",
    trainees_count: 20,
    weeks: [
      { week: 1, title: "Reporting", outcomes: ["Understand admission and course requirements."] },
      { week: 2, title: "Foundations", outcomes: ["Understand hardware basics and digital literacy."] },
      { week: 3, title: "Word Processing", outcomes: ["Create and format digital documents."] },
      { week: 4, title: "Spreadsheets", outcomes: ["Enter data and apply basic formulas."] },
      { week: 5, title: "Formative Assessment", outcomes: ["Demonstrate basic digital literacy skills."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Presentations", outcomes: ["Create and format slide presentations."] },
      { week: 7, title: "Internet Browsing", outcomes: ["Apply search techniques and manage information."] },
      { week: 8, title: "Communication", outcomes: ["Utilize email and online collaboration tools."] },
      { week: 9, title: "Cybersecurity", outcomes: ["Identify threats and apply basic controls."] },
      { week: 10, title: "Online Jobs", outcomes: ["Identify digital platforms and build profiles."] },
      { week: 11, title: "Job Entry", outcomes: ["Perform CV writing and interview techniques."] },
      { week: 12, title: "Summative Assessment", outcomes: ["Complete final evaluation of digital literacy."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
  {
    unit_code: "ICT/OS/ES/CR/11/6/A",
    unit_name: "DEMONSTRATE ENVIRONMENTAL LITERACY",
    department: "COMPUTING AND INFORMATICS",
    class_code: "ITECH6//24",
    level: "6",
    trainees_count: 11,
    weeks: [
      { week: 1, title: "Reporting & Admission", outcomes: ["Understand course requirements for environmental literacy."] },
      { week: 2, title: "Hazard Control", outcomes: ["Identify hazards per EMCA 1999 guidelines."] },
      { week: 3, title: "Waste Management", outcomes: ["Implement hazardous waste storage methods."] },
      { week: 4, title: "Pollution Control", outcomes: ["Classify pollution types and solid waste."] },
      { week: 5, title: "Formative Assessment", outcomes: ["Demonstrate knowledge of environmental hazards."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Noise Pollution", outcomes: ["Apply noise minimization methods."] },
      { week: 7, title: "Sustainable Resources", outcomes: ["Measure and manage resource usage."] },
      { week: 8, title: "3Rs Principles", outcomes: ["Apply Reduce, Reuse, Recycle principles."] },
      { week: 9, title: "Efficiency Systems", outcomes: ["Evaluate resource efficiency systems."] },
      { week: 10, title: "Purchasing Strategies", outcomes: ["Analyze environmentally friendly purchasing strategies."] },
      { week: 11, title: "Protocols", outcomes: ["Understand international environmental protocols."] },
      { week: 12, title: "Summative Assessment", outcomes: ["Complete final environmental literacy evaluation."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
  {
    unit_code: "ICT/OS/CS/CR/11/6/A",
    unit_name: "PERFORM GRAPHIC DESIGN",
    department: "COMPUTING AND INFORMATICS",
    class_code: "ITECH6/M/J/24",
    level: "6",
    trainees_count: 15,
    weeks: [
      {
        week: 1,
        title: "Opening & Admission",
        outcomes: ["Understand unit orientation, course requirements, and professional conduct expectations."],
        steps: [
          { time_minutes: 60, trainer_activity: "Present course outline and grading criteria.", learner_activity: "Review syllabus and ask questions.", assessment: "Q&A" },
          { time_minutes: 60, trainer_activity: "Discuss professional conduct and lab rules.", learner_activity: "Sign lab agreement forms.", assessment: "Document submission" },
        ],
      },
      { week: 2, title: "Design Fundamentals", outcomes: ["Define design and apply basic tools."] },
      { week: 3, title: "Elements of Design", outcomes: ["Define and apply line, shape, color, and texture."] },
      { week: 4, title: "Principles of Design", outcomes: ["Apply balance, contrast, and unity to compositions."] },
      { week: 5, title: "Typography Basics", outcomes: ["Identify font guidelines and classification."] },
      { week: 6, title: "Formative Assessment", outcomes: ["Demonstrate mastery of Learning Outcomes 1-3."], steps: [
          { time_minutes: 15, trainer_activity: "Distribute papers and explain tasks.", learner_activity: "Review instructions.", assessment: "N/A" },
          { time_minutes: 45, trainer_activity: "Invigilate written section.", learner_activity: "Complete written questions.", assessment: "Written CAT" },
          { time_minutes: 60, trainer_activity: "Invigilate practical design task.", learner_activity: "Execute practical design brief.", assessment: "Practical CAT" },
        ]
      },
      { week: 7, title: "Typography Mastery", outcomes: ["Apply measurements and design standards in InDesign/Canva."] },
      { week: 8, title: "Image Editing Basics", outcomes: ["Perform cropping and basic image manipulation."] },
      { week: 9, title: "Advanced Image Editing", outcomes: ["Create layered designs using photo assets."] },
      { week: 10, title: "Layout Design", outcomes: ["Utilize grid systems for advertisement design."] },
      { week: 11, title: "Printing Techniques", outcomes: ["Identify print materials and set up files for printers."] },
      { week: 12, title: "Summative Assessment", outcomes: ["Complete final unit evaluation."], steps: [
          { time_minutes: 15, trainer_activity: "Distribute final exam brief.", learner_activity: "Review brief.", assessment: "N/A" },
          { time_minutes: 90, trainer_activity: "Invigilate final project execution.", learner_activity: "Design final project based on brief.", assessment: "Summative Exam" },
          { time_minutes: 15, trainer_activity: "Collect final files and portfolios.", learner_activity: "Submit digital and printed work.", assessment: "Submission Check" },
        ]
      },
    ],
  },
  {
    unit_code: "0612 451 07A",
    unit_name: "NETWORK DESIGN AND MANAGEMENT",
    department: "COMPUTING AND INFORMATICS",
    class_code: "ITECH5/S/25",
    level: "5",
    trainees_count: 18,
    weeks: [
      { week: 1, title: "Reporting & Admission", outcomes: ["Understand unit orientation and course requirements."] },
      { week: 2, title: "User Needs Analysis", outcomes: ["Collect and analyze user network requirements."] },
      { week: 3, title: "Logical Design", outcomes: ["Develop logical network topology."] },
      { week: 4, title: "Safety & Components", outcomes: ["Implement safety protocols and identify components."] },
      { week: 5, title: "Formative Assessment", outcomes: ["Demonstrate understanding of network fundamentals."], steps: DEFAULT_STEPS_ASSESSMENT },
      { week: 6, title: "Configuration", outcomes: ["Configure network devices based on design."] },
      { week: 7, title: "Documentation", outcomes: ["Document network architecture accurately."] },
      { week: 8, title: "Testing Tools", outcomes: ["Identify and use network testing equipment."] },
      { week: 9, title: "Network Monitoring", outcomes: ["Monitor network performance and traffic."] },
      { week: 10, title: "Optimization", outcomes: ["Optimize network routing and performance."] },
      { week: 11, title: "Maintenance Report", outcomes: ["Develop comprehensive maintenance reports."] },
      { week: 12, title: "Summative Assessment", outcomes: ["Complete end-of-term evaluations."], steps: DEFAULT_STEPS_ASSESSMENT },
    ],
  },
];

export const generateMockSessionPlans = (): SessionPlan[] => {
  const plans: SessionPlan[] = [];

  COURSE_TEMPLATES.forEach((template) => {
    template.weeks.forEach((week) => {
      // Calculate date based on week offset
      const startDate = new Date(2026, 4, 4); // May 4, 2026
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
        signature_date: "03/07/2026",
        status: week.week <= 3 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? "delivered" : "planned"
      });
    });
  });

  return plans;
};

export const generateMockLearningPlans = (): LearningPlanWeek[] => {
  const plans: LearningPlanWeek[] = [];

  COURSE_TEMPLATES.forEach((template) => {
    template.weeks.forEach((week) => {
      // Pre-link week 1 to 3 of Apply ICT Skills
      const isDelivered = week.week <= 3 && template.unit_code === "BUS/OS/IS/CR/11/5/A";
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
        status: isDelivered ? "delivered" : (week.week <= 6 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? "session_plan_created" : "planned"),
        session_plan_id: week.week <= 6 && template.unit_code === "BUS/OS/IS/CR/11/5/A" ? `plan-${template.unit_code.replace(/\//g, "-")}-w${week.week}` : undefined
      });
    });
  });

  return plans;
};

export const generateMockRecordsOfWork = (): RecordOfWork[] => {
  const records: RecordOfWork[] = [];
  
  // Preload weeks 1-3 for BUS/OS/IS/CR/11/5/A
  const dates = ["04/05/2026", "11/05/2026", "18/05/2026"];
  const topics = ["Hardware ID", "Software/OS", "Operating Procedures"];
  const outcomes = [
    "Identify internal and external hardware components.",
    "Classify software and navigate OS interfaces.",
    "Perform safe startup, shutdown, and peripheral connection."
  ];

  for (let i = 0; i < 3; i++) {
    records.push({
      id: `row-${Date.now()}-${i}`,
      session_plan_id: `plan-BUS-OS-IS-CR-11-5-A-w${i + 1}`,
      unit_code: "BUS/OS/IS/CR/11/5/A",
      class_code: "BUS/L5/25",
      week_number: i + 1,
      date_delivered: dates[i],
      trainees_present: 28 - i, // realistic attendance (out of 30)
      hours_covered: 2, // 120 min
      work_actually_covered: `Successfully conducted presentation and practical lab session on ${topics[i]}. Trainees completed all tasks.`,
      reflection: `Learners achieved the outcome: ${outcomes[i]} Good engagement.`,
      status: "delivered",
      signature: "Alexander Kinoti",
      signature_date: dates[i]
    });
  }

  return records;
};

// Singleton storage loader for local development
export const getStoredSessionPlans = (): SessionPlan[] => {
  if (typeof window === "undefined") return generateMockSessionPlans();
  const saved = localStorage.getItem("mtti_session_plans");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  const generated = generateMockSessionPlans();
  localStorage.setItem("mtti_session_plans", JSON.stringify(generated));
  return generated;
};

export const saveStoredSessionPlans = (plans: SessionPlan[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mtti_session_plans", JSON.stringify(plans));
  }
};

export const getStoredLearningPlans = (): LearningPlanWeek[] => {
  if (typeof window === "undefined") return generateMockLearningPlans();
  const saved = localStorage.getItem("mtti_learning_plans");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  const generated = generateMockLearningPlans();
  localStorage.setItem("mtti_learning_plans", JSON.stringify(generated));
  return generated;
};

export const saveStoredLearningPlans = (plans: LearningPlanWeek[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mtti_learning_plans", JSON.stringify(plans));
  }
};

export const getStoredRecordsOfWork = (): RecordOfWork[] => {
  if (typeof window === "undefined") return generateMockRecordsOfWork();
  const saved = localStorage.getItem("mtti_records_of_work");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  const generated = generateMockRecordsOfWork();
  localStorage.setItem("mtti_records_of_work", JSON.stringify(generated));
  return generated;
};

export const saveStoredRecordsOfWork = (records: RecordOfWork[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mtti_records_of_work", JSON.stringify(records));
  }
};
