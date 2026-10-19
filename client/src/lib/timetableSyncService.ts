/**
 * Mukiria Technical Training Institute (MTTI)
 * Master Timetable & Professional Documents Synchronization Service
 *
 * Facilitates automatic synchronization of timetables with:
 * 1. Learning Plans (MTTI/F/CUR/02)
 * 2. Daily Session Plans (MTTI/F/CUR/05)
 * 3. Class Registers (MTTI/REG/CUR/02 & MTTI/REG/CUR/03)
 * 4. Records of Work (MTTI/F/CUR/03)
 *
 * Triggered when trainers register or update their profiles using their Email, Phone Number, and Name.
 */

import masterTimetable from "./timetableData.json";
import { findTrainer } from "./academicCalendar";

export interface TrainerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  timetableTrainerId?: string;
  classes: string[];
  units: string[];
  schedule?: Record<string, any[]>;
  registeredAt?: string;
  pin?: string;
}

const DEFAULT_TRAINER_PROFILE: TrainerProfile = {
  id: "trainer-001",
  name: "Alexander Kinoti",
  email: "trainer@mtti.ac.ke",
  phone: "+254 722 000 000",
  department: "Computing & Informatics",
  timetableTrainerId: "mr-alexander-kinoti",
  classes: [
    "FBS5/6/J/26",
    "ADMIN5/6/J/26 MOD 3",
    "ADMIN4/5/6/S/26 MOD 1",
    "ICT4/ITECH6/S/26 MOD 1",
    "LS5/6/S/26",
  ],
  units: [
    "DIGITAL LITERACY",
    "COMPUTER ESSENTIALS",
    "APPLY ICT SKILLS",
    "ICT SKILLS 1",
  ],
};

const STORAGE_ACTIVE_PROFILE = "mtti_active_trainer_profile";
const STORAGE_REGISTERED_TRAINERS = "mtti_registered_trainers";

export interface DynamicClassConfig {
  code: string;
  name: string;
  subject: string;
  department: string;
  level: string;
  duration: string;
  assessmentType: string;
  docCode: "MTTI/REG/CUR/02" | "MTTI/REG/CUR/03";
}

/**
 * Retrieve the active trainer profile from storage or fallback to authenticated user/defaults
 */
export function getCurrentTrainerProfile(fallbackUser?: any): TrainerProfile {
  if (typeof window === "undefined") return DEFAULT_TRAINER_PROFILE;

  // 1. If fallbackUser is provided, prioritize matching their specific identity
  if (fallbackUser && fallbackUser.name && fallbackUser.role === "trainer") {
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_PROFILE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          parsed.name &&
          (parsed.name.toLowerCase() === fallbackUser.name.toLowerCase() ||
            parsed.id === fallbackUser.id)
        ) {
          return parsed;
        }
      }
    } catch {}

    // Match directly in master timetable faculty directory
    const matched = resolveFacultyForTrainer(fallbackUser.name, fallbackUser.email);
    if (matched) {
      const canonicalName = matched.name.replace(/^(mr|md|ms|mrs)\.?\s+/i, (m: string) => m.toUpperCase());
      const resolved: TrainerProfile = {
        id: fallbackUser.id || `trainer-${matched.id}`,
        name: canonicalName,
        email: fallbackUser.email || `${matched.id}@mtti.ac.ke`,
        phone: fallbackUser.phone || "+254 722 000 000",
        department: fallbackUser.department || matched.department || "Computing & Informatics",
        timetableTrainerId: matched.id,
        classes: matched.classes && matched.classes.length > 0 ? matched.classes : [],
        units: matched.units && matched.units.length > 0 ? matched.units : [],
        schedule: matched.schedule,
      };
      saveTrainerProfile(resolved);
      return resolved;
    }

    return {
      id: fallbackUser.id || "trainer-001",
      name: fallbackUser.name,
      email: fallbackUser.email || "trainer@mtti.ac.ke",
      phone: fallbackUser.phone || "+254 722 000 000",
      department: fallbackUser.department || "Computing & Informatics",
      timetableTrainerId: "mr-alexander-kinoti",
      classes: DEFAULT_TRAINER_PROFILE.classes,
      units: DEFAULT_TRAINER_PROFILE.units,
      schedule: undefined,
    };
  }

  // Fallback when no user is provided: read stored profile or default
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_TRAINER_PROFILE;
}

/**
 * Dynamically builds class configurations for any trainer based on their timetable schedule & classes
 */
export function buildClassConfigsForTrainer(profile: TrainerProfile): DynamicClassConfig[] {
  const classes = profile.classes && profile.classes.length > 0 ? profile.classes : DEFAULT_TRAINER_PROFILE.classes;
  const schedule = profile.schedule || {};
  const allSessions: any[] = Object.values(schedule).flat();

  return classes.map((rawCode, index) => {
    const code = rawCode.trim();
    // Locate session matching this class to extract accurate unit title
    const session = allSessions.find(
      (s) =>
        s.classCode &&
        (s.classCode.toLowerCase().replace(/\s+/g, "") === code.toLowerCase().replace(/\s+/g, "") ||
          s.classCode.toLowerCase().includes(code.toLowerCase()) ||
          code.toLowerCase().includes(s.classCode.toLowerCase()))
    );

    const unitTitle =
      session?.unitTitle ||
      (profile.units && profile.units[index % profile.units.length]) ||
      (profile.units && profile.units[0]) ||
      "General Competency";

    let department = profile.department || "Computing & Informatics";
    const uCode = code.toUpperCase();
    if (uCode.includes("EE")) department = "Electrical & Electronics Engineering";
    else if (uCode.includes("AGRE") || uCode.includes("AGR")) department = "Agriculture";
    else if (uCode.includes("ADMIN") || uCode.includes("BUS")) department = "Business Studies";
    else if (uCode.includes("FBS") || uCode.includes("FBP")) department = "Hospitality Management";
    else if (uCode.includes("LS") || uCode.includes("SURV")) department = "Surveying & Geomatics";
    else if (uCode.includes("ICT") || uCode.includes("ITECH")) department = "Computing & Informatics";

    let level = "Level 5 & 6";
    if (uCode.includes("MOD 1") || uCode.includes("MOD1") || uCode.includes("4")) level = "Level 4 & 6";
    else if (uCode.includes("MOD IV") || uCode.includes("MOD 4") || uCode.includes("MOD 3") || uCode.includes("MOD III") || uCode.includes("6")) level = "Level 6";
    else if (uCode.includes("5")) level = "Level 5";

    return {
      code,
      name: code,
      subject: unitTitle,
      department,
      level,
      duration: "Term 3 2026",
      assessmentType: "General Class Register",
      docCode: "MTTI/REG/CUR/02" as const,
    };
  });
}

/**
 * Persist active trainer profile into local storage and registered trainers store
 */
export function saveTrainerProfile(profile: TrainerProfile): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_ACTIVE_PROFILE, JSON.stringify(profile));

    // Also persist in the registered trainers directory
    const existingRaw = localStorage.getItem(STORAGE_REGISTERED_TRAINERS);
    let list: TrainerProfile[] = [];
    if (existingRaw) {
      try {
        list = JSON.parse(existingRaw);
      } catch {}
    }
    if (!Array.isArray(list)) list = [];

    const idx = list.findIndex(
      (t) =>
        t.email.toLowerCase() === profile.email.toLowerCase() ||
        t.name.toLowerCase() === profile.name.toLowerCase() ||
        (t.phone && profile.phone && t.phone === profile.phone)
    );

    if (idx >= 0) {
      list[idx] = { ...list[idx], ...profile };
    } else {
      list.push(profile);
    }

    localStorage.setItem(STORAGE_REGISTERED_TRAINERS, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to persist trainer profile:", err);
  }
}

/**
 * Resolve faculty from master timetable by name, ID, or email
 */
export function resolveFacultyForTrainer(nameOrId?: string, email?: string) {
  if (!nameOrId && !email) return null;
  const trainers: any[] = (masterTimetable as any).trainers || [];

  if (nameOrId) {
    const clean = nameOrId.trim().toLowerCase();
    const cleanWithoutTitle = clean.replace(/^(mr|md|ms|mrs|dr|prof)\.?\s+/i, "").trim();

    // Check exact id match
    const byId = trainers.find((t) => t.id?.toLowerCase() === clean);
    if (byId) return byId;

    // Check exact or partial name match
    const byExactName = trainers.find(
      (t) =>
        t.name.toLowerCase() === clean ||
        t.name.toLowerCase().replace(/^(mr|md|ms|mrs|dr|prof)\.?\s+/i, "").trim() === cleanWithoutTitle
    );
    if (byExactName) return byExactName;

    // Substring match with minimum 3 chars
    const bySubstring = trainers.find((t) => {
      const tClean = t.name.toLowerCase().replace(/^(mr|md|ms|mrs|dr|prof)\.?\s+/i, "").trim();
      return cleanWithoutTitle.length >= 3 && (tClean.includes(cleanWithoutTitle) || cleanWithoutTitle.includes(tClean));
    });
    if (bySubstring) return bySubstring;
  }

  if (email) {
    const handle = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (handle.length >= 3) {
      const byEmail = trainers.find((t) => {
        const tId = t.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        const tName = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return tId.includes(handle) || handle.includes(tId) || tName.includes(handle) || handle.includes(tName);
      });
      if (byEmail) return byEmail;
    }
  }

  return null;
}

/**
 * Query master timetable to find matching faculty by name or ID
 */
export function findFacultyInTimetable(query: string) {
  return resolveFacultyForTrainer(query);
}

/**
 * Get all available institutional faculty from the master timetable
 */
export function getAllTimetableFaculty() {
  const trainers: any[] = (masterTimetable as any).trainers || [];
  return trainers.map((t) => ({
    id: t.id,
    name: t.name,
    department: t.department,
    classesCount: t.classes?.length || 0,
    unitsCount: t.units?.length || 0,
    classes: t.classes || [],
    units: t.units || [],
  }));
}

export interface SyncResult {
  success: boolean;
  trainerName: string;
  email: string;
  phone: string;
  department: string;
  timetableSessionsCount: number;
  sessionPlansSynced: number;
  learningPlansSynced: number;
  recordsOfWorkSynced: number;
  registersSynced: number;
  timestamp: string;
}

/**
 * Synchronize the trainer's registered profile (name, email, phone) and timetable schedule
 * across all professional documents:
 * - Timetable Page Selection
 * - Learning Plans (MTTI/F/CUR/02)
 * - Daily Session Plans (MTTI/F/CUR/05)
 * - Class Registers (MTTI/REG/CUR/02 & 03)
 * - Records of Work (MTTI/F/CUR/03)
 */
export function syncTrainerToProfessionalDocuments(profile: TrainerProfile): SyncResult {
  let sessionPlansSynced = 0;
  let learningPlansSynced = 0;
  let recordsOfWorkSynced = 0;
  let registersSynced = 0;

  const matchedFaculty =
    resolveFacultyForTrainer(profile.name, profile.email) ||
    (profile.timetableTrainerId ? findTrainer(profile.timetableTrainerId) : null);

  const timetableTrainerId = matchedFaculty?.id || profile.timetableTrainerId || "mr-alexander-kinoti";
  const trainerClasses =
    matchedFaculty?.classes && matchedFaculty.classes.length > 0
      ? matchedFaculty.classes
      : profile.classes && profile.classes.length > 0
      ? profile.classes
      : DEFAULT_TRAINER_PROFILE.classes;
  const trainerUnits =
    matchedFaculty?.units && matchedFaculty.units.length > 0
      ? matchedFaculty.units
      : profile.units && profile.units.length > 0
      ? profile.units
      : DEFAULT_TRAINER_PROFILE.units;

  const timetableSessions = matchedFaculty?.schedule ? Object.values(matchedFaculty.schedule).flat() : [];

  const canonicalProfile: TrainerProfile = {
    ...profile,
    timetableTrainerId,
    classes: trainerClasses,
    units: trainerUnits,
    department: matchedFaculty?.department || profile.department || "Computing & Informatics",
    schedule: matchedFaculty?.schedule || profile.schedule,
  };

  saveTrainerProfile(canonicalProfile);

  if (typeof window !== "undefined") {
    // 1. Synchronize Master Timetable active selection
    localStorage.setItem("mtti_selected_timetable_trainer", timetableTrainerId);

    const term3Dates = [
      "31/08/2026",
      "07/09/2026",
      "14/09/2026",
      "21/09/2026",
      "28/09/2026",
      "05/10/2026",
      "12/10/2026",
      "19/10/2026",
      "26/10/2026",
      "02/11/2026",
    ];

    const dynamicConfigs = buildClassConfigsForTrainer(canonicalProfile);

    // 2. Synchronize Daily Session Plans (MTTI/F/CUR/05)
    try {
      const rawSP = localStorage.getItem("mtti_session_plans");
      let plans = rawSP ? JSON.parse(rawSP) : [];
      if (!Array.isArray(plans)) plans = [];

      dynamicConfigs.forEach((cfg) => {
        const clsCode = cfg.code;
        const uTitle = cfg.subject;
        const unitCode = `CU/${clsCode.split("/")[0] || "MTTI"}/01`;

        const hasExisting = plans.some(
          (p: any) =>
            p.class_code === clsCode &&
            p.trainer_name?.toLowerCase().includes(canonicalProfile.name.toLowerCase())
        );

        if (!hasExisting) {
          for (let w = 1; w <= 10; w++) {
            const dateStr = term3Dates[w - 1] || "07/10/2026";
            const isDelivered = w <= 6;
            const isAssessment = w === 5 || w === 10;
            const topic =
              w === 1
                ? "Admission, Course Overview & Safety Briefing"
                : isAssessment
                ? `Continuous Assessment Test ${w === 5 ? "1 (CAT 1)" : "2 (Final Practical Assessment)"}`
                : `${uTitle} — Practical Lab & Core Competency ${w}`;

            plans.push({
              id: `sp-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${w}`,
              document_code: "MTTI/F/CUR/05",
              trainer_name: canonicalProfile.name,
              department: cfg.department,
              unit_name: uTitle,
              unit_code: unitCode,
              class_code: clsCode,
              level: cfg.level,
              trainees_count: 20,
              date: dateStr,
              time_duration: "10:30-12:30",
              week_number: w,
              session_title: topic,
              learning_outcomes: [
                w === 1
                  ? "Understand admission, laboratory safety protocols, and course overview."
                  : `Demonstrate mastery of core principles and practical operations in ${uTitle}.`,
              ],
              resources: ["Projector", "Laboratory workstations", "Reference materials", "Safety manuals"],
              safety_requirements: "Standard laboratory electrical safety protocols and workstation ergonomics.",
              introduction: `Introduction to ${topic} aligning with TVET CDACC curriculum standards.`,
              delivery_steps: isAssessment
                ? [
                    { time_minutes: 15, trainer_activity: "Distribute assessment materials & briefing.", learner_activity: "Review instructions & sign attendance.", assessment: "N/A" },
                    { time_minutes: 90, trainer_activity: "Invigilate practical exam & supervise lab.", learner_activity: "Execute assessment tasks.", assessment: "Exam scripts & practical test" },
                    { time_minutes: 15, trainer_activity: "Collect answer files & verify submissions.", learner_activity: "Submit practical work.", assessment: "Submission checklist" },
                  ]
                : [
                    { time_minutes: 30, trainer_activity: `Present theoretical framework of ${topic}.`, learner_activity: "Active listening and note-taking.", assessment: "Oral Questioning" },
                    { time_minutes: 70, trainer_activity: `Demonstrate and supervise practical hands-on tasks for ${topic}.`, learner_activity: "Perform workstation exercises.", assessment: "Observation" },
                    { time_minutes: 20, trainer_activity: "Address learner challenges and summarize session outcomes.", learner_activity: "Present completed scripts.", assessment: "Practical Checklist" },
                  ],
              session_review: `Review and consolidation of competencies delivered in Week ${w}.`,
              assignment: `Practical reinforcement assignment for ${topic}.`,
              reflection: "Trainees engaged actively. Satisfactory comprehension of core competencies.",
              signature: canonicalProfile.name,
              signature_date: dateStr,
              status: isDelivered ? "delivered" : "planned",
            });
            sessionPlansSynced++;
          }
        }
      });
      localStorage.setItem("mtti_session_plans", JSON.stringify(plans));
    } catch (e) {
      console.warn("Session plans sync notice:", e);
    }

    // 3. Synchronize Learning Plans Weeks for SessionPlans Tab (MTTI/F/CUR/02)
    try {
      const rawLP = localStorage.getItem("mtti_learning_plans");
      let lpWeeks = rawLP ? JSON.parse(rawLP) : [];
      if (!Array.isArray(lpWeeks)) lpWeeks = [];

      dynamicConfigs.forEach((cfg) => {
        const clsCode = cfg.code;
        const uTitle = cfg.subject;
        const unitCode = `CU/${clsCode.split("/")[0] || "MTTI"}/01`;

        const hasExisting = lpWeeks.some(
          (lp: any) =>
            lp.class_code === clsCode &&
            lp.trainer_name?.toLowerCase().includes(canonicalProfile.name.toLowerCase())
        );

        if (!hasExisting) {
          for (let w = 1; w <= 10; w++) {
            const isDelivered = w <= 6;
            const isAssessment = w === 5 || w === 10;
            const topic =
              w === 1
                ? "Admission, Course Overview & Safety Briefing"
                : isAssessment
                ? `Continuous Assessment Test ${w === 5 ? "1 (CAT 1)" : "2 (Final Evaluation)"}`
                : `${uTitle} — Practical Lab & Core Competency ${w}`;

            lpWeeks.push({
              id: `lp-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${w}`,
              unit_code: unitCode,
              unit_name: uTitle,
              trainer_name: canonicalProfile.name,
              class_code: clsCode,
              week_number: w,
              topic: topic,
              learning_outcomes: [
                w === 1
                  ? "Understand admission, laboratory safety protocols, and course overview."
                  : `Demonstrate mastery of core principles and practical operations in ${uTitle}.`,
              ],
              resources: ["Projector", "Laboratory workstations", "Reference materials", "Safety manuals"],
              status: isDelivered ? "delivered" : "planned",
              session_plan_id: `sp-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${w}`,
            });
            learningPlansSynced++;
          }
        }
      });
      localStorage.setItem("mtti_learning_plans", JSON.stringify(lpWeeks));
    } catch (e) {
      console.warn("Learning plans sync notice:", e);
    }

    // 4. Synchronize Full Learning Plans for LearningPlan.tsx (mtti_custom_learning_plans)
    try {
      const rawCustomLP = localStorage.getItem("mtti_custom_learning_plans");
      let customLPs = rawCustomLP ? JSON.parse(rawCustomLP) : [];
      if (!Array.isArray(customLPs)) customLPs = [];

      dynamicConfigs.forEach((cfg) => {
        const clsCode = cfg.code;
        const uTitle = cfg.subject;
        const unitCode = `CU/${clsCode.split("/")[0] || "MTTI"}/01`;

        const existingIdx = customLPs.findIndex(
          (p: any) =>
            p.classCode === clsCode &&
            p.trainerName?.toLowerCase().includes(canonicalProfile.name.toLowerCase())
        );

        const newDoc = {
          id: `lp-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}`,
          unitCode: unitCode,
          unitTitle: uTitle,
          trainerName: canonicalProfile.name,
          department: cfg.department,
          duration: "07 SEP – 13 NOV 2026",
          level: cfg.level.includes("4") ? 4 : cfg.level.includes("5") ? 5 : 6,
          traineesCount: 20,
          classCode: clsCode,
          datePrepared: "07/09/2026",
          dateOfPreparation: "07/09/2026",
          trainerSignature: canonicalProfile.name,
          trainerSignDate: "07/09/2026",
          skillOrJobTask: `Perform core technical competencies and practical applications in ${uTitle} for ${clsCode}.`,
          elements: [
            {
              title: `Demonstrate Core Competencies in ${uTitle}`,
              performanceCriteria: [
                `1.1 Fundamental principles of ${uTitle} are applied following institutional standards.`,
                `1.2 Practical procedures for ${clsCode} are performed in compliance with laboratory protocols.`,
                `1.3 Technical documentation and competence logs are maintained accurately.`,
              ],
            },
          ],
          weeks: Array.from({ length: 10 }, (_, wIdx) => {
            const w = wIdx + 1;
            const isAssessment = w === 5 || w === 10;
            return {
              week: w,
              sessionNo: 1,
              title:
                w === 1
                  ? "ADMISSION AND ORIENTATION"
                  : isAssessment
                  ? `CONTINUOUS ASSESSMENT TEST ${w === 5 ? "1 (CAT 1)" : "2 (PRACTICAL EVALUATION)"}`
                  : `Technical Competency Block ${w - 1} — ${uTitle}`,
              outcome:
                w === 1
                  ? "Reporting, admission verification & laboratory safety orientation"
                  : `Trainees apply practical skills in ${uTitle}`,
              trainerActivities:
                w === 1
                  ? "• Conducts orientation & safety briefing"
                  : `• Demonstrates practical workflows for ${uTitle}\n• Supervises laboratory exercise`,
              traineeActivities:
                w === 1
                  ? "• Completes registration & laboratory safety pledge"
                  : "• Practical laboratory execution & competence logging",
              resources: "Course syllabus, Laboratory workstation, Workshop safety handbook",
              assessments: w === 1 ? "Orientation checklist" : "Continuous Practical Assessment (CP)",
              reflections: "All trainees achieved target competencies.",
            };
          }),
        };

        if (existingIdx >= 0) {
          customLPs[existingIdx] = { ...customLPs[existingIdx], ...newDoc };
        } else {
          customLPs.push(newDoc);
        }
      });
      localStorage.setItem("mtti_custom_learning_plans", JSON.stringify(customLPs));
    } catch (e) {
      console.warn("Custom learning plans sync notice:", e);
    }

    // 5. Synchronize Records of Work (MTTI/F/CUR/06)
    try {
      const rawRoW = localStorage.getItem("mtti_records_of_work");
      let rows = rawRoW ? JSON.parse(rawRoW) : [];
      if (!Array.isArray(rows)) rows = [];

      dynamicConfigs.forEach((cfg) => {
        const clsCode = cfg.code;
        const uTitle = cfg.subject;
        const unitCode = `CU/${clsCode.split("/")[0] || "MTTI"}/01`;

        const hasExisting = rows.some(
          (r: any) =>
            r.class_code === clsCode &&
            r.signature?.toLowerCase().includes(canonicalProfile.name.toLowerCase())
        );

        if (!hasExisting) {
          for (let w = 1; w <= 6; w++) {
            const dateStr = term3Dates[w - 1] || "07/10/2026";
            const topic =
              w === 1
                ? "Course orientation and laboratory safety briefing."
                : `Conducted lecture and practical exercises on ${uTitle} (Block ${w - 1}).`;

            rows.push({
              id: `row-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${w}`,
              session_plan_id: `sp-${canonicalProfile.id}-${clsCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${w}`,
              unit_code: unitCode,
              class_code: clsCode,
              week_number: w,
              date_delivered: dateStr,
              trainees_present: 19 - (w % 2),
              hours_covered: 2,
              work_actually_covered: `${topic} All scheduled laboratory exercises completed successfully.`,
              reflection: "Satisfactory learner engagement, active participation and concept comprehension.",
              status: "delivered",
              signature: canonicalProfile.name,
              signature_date: dateStr,
            });
            recordsOfWorkSynced++;
          }
        }
      });
      localStorage.setItem("mtti_records_of_work", JSON.stringify(rows));
    } catch (e) {
      console.warn("Records of work sync notice:", e);
    }

    // 6. Synchronize Class Registers metadata (comments, lecturer name)
    try {
      trainerClasses.forEach((clsCode: string) => {
        const commentsKey = `mtti_class_register_comments_${clsCode}`;
        const rawComments = localStorage.getItem(commentsKey);
        let curComments: any = {};
        if (rawComments) {
          try {
            curComments = JSON.parse(rawComments);
          } catch {}
        }
        curComments.lecturer = canonicalProfile.name;
        curComments.lecturerEmail = canonicalProfile.email;
        curComments.lecturerPhone = canonicalProfile.phone;
        localStorage.setItem(commentsKey, JSON.stringify(curComments));
        registersSynced++;
      });
    } catch (e) {
      console.warn("Class register sync notice:", e);
    }
  }

  return {
    success: true,
    trainerName: canonicalProfile.name,
    email: canonicalProfile.email,
    phone: canonicalProfile.phone,
    department: canonicalProfile.department,
    timetableSessionsCount: timetableSessions.length,
    sessionPlansSynced,
    learningPlansSynced,
    recordsOfWorkSynced,
    registersSynced,
    timestamp: new Date().toISOString(),
  };
}
