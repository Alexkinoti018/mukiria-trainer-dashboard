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

/**
 * Retrieve the active trainer profile from storage or fallback to authenticated user/defaults
 */
export function getCurrentTrainerProfile(fallbackUser?: any): TrainerProfile {
  if (typeof window === "undefined") return DEFAULT_TRAINER_PROFILE;

  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return parsed;
      }
    }
  } catch {}

  // Build from authenticated user if available
  if (fallbackUser && fallbackUser.name && fallbackUser.role === "trainer") {
    const matched = findFacultyInTimetable(fallbackUser.name);
    return {
      id: fallbackUser.id || "trainer-001",
      name: fallbackUser.name,
      email: fallbackUser.email || "trainer@mtti.ac.ke",
      phone: fallbackUser.phone || "+254 722 000 000",
      department: fallbackUser.department || matched?.department || "Computing & Informatics",
      timetableTrainerId: matched?.id || "mr-alexander-kinoti",
      classes: matched?.classes || DEFAULT_TRAINER_PROFILE.classes,
      units: matched?.units || DEFAULT_TRAINER_PROFILE.units,
      schedule: matched?.schedule,
    };
  }

  return DEFAULT_TRAINER_PROFILE;
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
 * Query master timetable to find matching faculty by name or ID
 */
export function findFacultyInTimetable(query: string) {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  const trainers: any[] = (masterTimetable as any).trainers || [];

  return (
    trainers.find(
      (t) =>
        t.id?.toLowerCase() === clean ||
        t.name?.toLowerCase() === clean ||
        t.name?.toLowerCase().includes(clean) ||
        clean.includes(t.name?.toLowerCase().replace(/^(mr|md|ms|mrs)\.?\s+/i, ""))
    ) || null
  );
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

  const matchedFaculty = profile.timetableTrainerId
    ? findTrainer(profile.timetableTrainerId)
    : findFacultyInTimetable(profile.name);

  const timetableTrainerId = matchedFaculty?.id || profile.timetableTrainerId || "mr-alexander-kinoti";
  const timetableSessions = matchedFaculty?.schedule
    ? Object.values(matchedFaculty.schedule).flat()
    : [];

  if (typeof window !== "undefined") {
    // 1. Synchronize Master Timetable active selection
    localStorage.setItem("mtti_selected_timetable_trainer", timetableTrainerId);

    // 2. Synchronize Daily Session Plans (MTTI/F/CUR/05)
    try {
      const rawSP = localStorage.getItem("mtti_session_plans");
      if (rawSP) {
        const plans = JSON.parse(rawSP);
        if (Array.isArray(plans)) {
          const updatedPlans = plans.map((p) => {
            sessionPlansSynced++;
            return {
              ...p,
              trainer_name: profile.name,
              trainer_phone: profile.phone,
              trainer_email: profile.email,
              signature: profile.name,
              department: p.department || profile.department,
            };
          });
          localStorage.setItem("mtti_session_plans", JSON.stringify(updatedPlans));
        }
      }
    } catch (e) {
      console.warn("Session plans sync notice:", e);
    }

    // 3. Synchronize Learning Plans (MTTI/F/CUR/02)
    try {
      const rawLP = localStorage.getItem("mtti_learning_plans");
      if (rawLP) {
        const plans = JSON.parse(rawLP);
        if (Array.isArray(plans)) {
          const updatedLP = plans.map((lp) => {
            learningPlansSynced++;
            return {
              ...lp,
              trainer_name: profile.name,
              trainerName: profile.name,
              trainer_email: profile.email,
              trainer_phone: profile.phone,
              department: lp.department || profile.department,
            };
          });
          localStorage.setItem("mtti_learning_plans", JSON.stringify(updatedLP));
        }
      }

      // Also update official learning plans cache if present
      const rawOfficialLP = localStorage.getItem("mtti_official_learning_plans_v1");
      if (rawOfficialLP) {
        const offPlans = JSON.parse(rawOfficialLP);
        if (Array.isArray(offPlans)) {
          const updatedOff = offPlans.map((op) => ({
            ...op,
            trainerName: profile.name,
            trainerSignature: profile.name,
            department: op.department || profile.department,
          }));
          localStorage.setItem("mtti_official_learning_plans_v1", JSON.stringify(updatedOff));
        }
      }
    } catch (e) {
      console.warn("Learning plans sync notice:", e);
    }

    // 4. Synchronize Records of Work (MTTI/F/CUR/03)
    try {
      const rawRoW = localStorage.getItem("mtti_records_of_work");
      if (rawRoW) {
        const rows = JSON.parse(rawRoW);
        if (Array.isArray(rows)) {
          const updatedRoW = rows.map((r) => {
            recordsOfWorkSynced++;
            return {
              ...r,
              signature: profile.name,
              trainer_name: profile.name,
              trainer_email: profile.email,
              trainer_phone: profile.phone,
            };
          });
          localStorage.setItem("mtti_records_of_work", JSON.stringify(updatedRoW));
        }
      }
    } catch (e) {
      console.warn("Records of work sync notice:", e);
    }

    // 5. Synchronize Class Registers (MTTI/REG/CUR/02 & 03) metadata
    try {
      const registerClasses = [
        "ICT4/ITECH6/S/26 MOD 1",
        "ADMIN5/6/J/26 MOD 3",
        "ADMIN4/5/6/S/26 MOD 1",
        "FBS5/6/J/26",
        "LS5/6/S/26",
        ...(profile.classes || []),
      ];

      registerClasses.forEach((clsCode) => {
        const commentsKey = `mtti_class_register_comments_${clsCode}`;
        const rawComments = localStorage.getItem(commentsKey);
        let curComments: any = {};
        if (rawComments) {
          try {
            curComments = JSON.parse(rawComments);
          } catch {}
        }
        curComments.lecturer = profile.name;
        curComments.lecturerEmail = profile.email;
        curComments.lecturerPhone = profile.phone;
        localStorage.setItem(commentsKey, JSON.stringify(curComments));
        registersSynced++;
      });
    } catch (e) {
      console.warn("Class register sync notice:", e);
    }
  }

  // Save updated profile
  saveTrainerProfile({
    ...profile,
    timetableTrainerId,
    classes: matchedFaculty?.classes || profile.classes,
    units: matchedFaculty?.units || profile.units,
    schedule: matchedFaculty?.schedule || profile.schedule,
  });

  return {
    success: true,
    trainerName: profile.name,
    email: profile.email,
    phone: profile.phone,
    department: profile.department,
    timetableSessionsCount: timetableSessions.length,
    sessionPlansSynced,
    learningPlansSynced,
    recordsOfWorkSynced,
    registersSynced,
    timestamp: new Date().toISOString(),
  };
}
