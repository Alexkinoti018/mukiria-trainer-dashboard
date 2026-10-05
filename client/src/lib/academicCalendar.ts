/**
 * Mukiria Technical Training Institute (MTTI)
 * Official Institutional Academic Calendar & Live Clock Synchronization Engine
 * Source of Truth for: Date, Day, Time, Term, Academic Year, Term Week, and Class Period
 */

import masterTimetable from "./timetableData.json";

export interface PeriodSlot {
  period: number | string;
  name: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  timeRange: string;
  type: "class" | "break";
}

export interface AcademicContext {
  dateIso: string;          // "2026-10-05"
  formattedDate: string;    // "Monday, 05 October 2026"
  shortDate: string;        // "05/10/2026"
  dayName: string;          // "Monday"
  timeFormatted: string;    // "10:02 AM"
  time24: string;           // "10:02"
  term: string;             // "Term 3, 2026"
  termCode: string;         // "TERM-3-2026"
  academicYear: number;     // 2026
  currentWeek: number;      // 2
  termDuration: string;     // "28 Sept 2026 – 27 Nov 2026"
  activeSlot: PeriodSlot | null;
  statusText: string;       // "Tea Break (10:00 - 10:30)" or "Period 1 (8:00 - 10:00)"
  isBreak: boolean;
}

export interface TimetableSession {
  period: number;
  periodName: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  classCode: string;
  unitTitle: string;
  venue: string;
  trainer: string;
}

// MTTI Standard Term 3 2026 Schedule Structure
export const TERM_CONFIG = {
  term: "Term 3, 2026",
  academicYear: 2026,
  termStartDate: new Date(2026, 7, 31), // 31 August 2026 (Month is 0-indexed: 7 is August)
  termEndDate: new Date(2026, 10, 20),   // 20 November 2026 (Month 10 is Nov)
  totalWeeks: 12,
  referenceDate: "2026-10-07",          // Fixed reference anchor for system synchronization
  referenceDay: "Monday",
  referenceFormattedDate: "Monday, 07 October 2026",
  referenceShortDate: "07/10/2026",
  termDuration: "31 Aug 2026 – 20 Nov 2026",
};

export const MTTI_PERIODS: PeriodSlot[] = [
  { period: 1, name: "Period 1", startTime: "08:00", endTime: "10:00", timeRange: "8:00 - 10:00", type: "class" },
  { period: "tea", name: "Tea Break", startTime: "10:00", endTime: "10:30", timeRange: "10:00 - 10:30", type: "break" },
  { period: 2, name: "Period 2", startTime: "10:30", endTime: "12:30", timeRange: "10:30 - 12:30", type: "class" },
  { period: "lunch", name: "Lunch Hour", startTime: "12:30", endTime: "13:30", timeRange: "12:30 - 13:30", type: "break" },
  { period: 3, name: "Period 3", startTime: "13:30", endTime: "15:30", timeRange: "13:30 - 15:30", type: "class" },
  { period: "short_break", name: "Short Break", startTime: "15:30", endTime: "15:35", timeRange: "15:30 - 15:35", type: "break" },
  { period: 4, name: "Period 4", startTime: "15:35", endTime: "17:35", timeRange: "15:35 - 17:35", type: "class" },
];

/**
 * Calculates current Academic Week relative to Term 3 start date (31 August 2026)
 */
export function calculateAcademicWeek(currentDate: Date = new Date(2026, 9, 7)): number {
  const diffTime = currentDate.getTime() - TERM_CONFIG.termStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 1;
  const weekNum = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(1, weekNum), TERM_CONFIG.totalWeeks);
}

/**
 * Parse time string "HH:MM" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Get the current active period or break slot based on time "HH:MM"
 */
export function getActivePeriodSlot(timeStr: string): PeriodSlot | null {
  const currMins = timeToMinutes(timeStr);
  for (const slot of MTTI_PERIODS) {
    const startMins = timeToMinutes(slot.startTime);
    const endMins = timeToMinutes(slot.endTime);
    if (currMins >= startMins && currMins < endMins) {
      return slot;
    }
  }
  return null;
}

/**
 * Get comprehensive academic context for the current moment
 */
export function getAcademicContext(customDate?: Date): AcademicContext {
  const now = customDate || new Date();
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, "0");
  const time24 = `${String(hours).padStart(2, "0")}:${mins}`;
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  const timeFormatted = `${hours12}:${mins} ${ampm}`;

  const isCustom = Boolean(customDate);
  const targetDate = isCustom 
    ? customDate! 
    : new Date(2026, 9, 7, hours, now.getMinutes(), now.getSeconds());

  const dayName = isCustom
    ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][targetDate.getDay()]
    : TERM_CONFIG.referenceDay;

  const formattedDate = isCustom
    ? targetDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    : TERM_CONFIG.referenceFormattedDate;

  const shortDate = isCustom
    ? `${String(targetDate.getDate()).padStart(2, "0")}/${String(targetDate.getMonth() + 1).padStart(2, "0")}/${targetDate.getFullYear()}`
    : TERM_CONFIG.referenceShortDate;

  const dateIso = isCustom
    ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
    : TERM_CONFIG.referenceDate;

  const currentWeek = calculateAcademicWeek(targetDate);
  const activeSlot = getActivePeriodSlot(time24);

  let statusText = "Off-Hours / Campus Closed";
  let isBreak = false;

  if (activeSlot) {
    statusText = `${activeSlot.name} (${activeSlot.timeRange})`;
    isBreak = activeSlot.type === "break";
  } else {
    const currMins = timeToMinutes(time24);
    if (currMins < timeToMinutes("08:00")) {
      statusText = "Pre-Assembly / Classes Begin at 8:00 AM";
    } else if (currMins >= timeToMinutes("17:35")) {
      statusText = "Evening / Scheduled Classes Concluded";
    }
  }

  return {
    dateIso,
    formattedDate,
    shortDate,
    dayName,
    timeFormatted,
    time24,
    term: TERM_CONFIG.term,
    termCode: "TERM-3-2026",
    academicYear: 2026,
    currentWeek,
    termDuration: TERM_CONFIG.termDuration,
    activeSlot,
    statusText,
    isBreak
  };
}

/**
 * Look up trainer by name (case-insensitive substring or slug match)
 */
export function findTrainer(trainerNameOrId: string) {
  const query = trainerNameOrId.trim().toLowerCase();
  const trainers = (masterTimetable as any).trainers || [];
  return trainers.find((t: any) => 
    t.id === query || 
    t.name.toLowerCase() === query || 
    t.name.toLowerCase().includes(query) ||
    query.includes(t.name.toLowerCase())
  );
}

/**
 * Get live session status for a specific trainer (what they are teaching NOW, or NEXT)
 */
export function getTrainerLiveStatus(trainerNameOrId: string = "Alexander Kinoti", customDate?: Date) {
  const ctx = getAcademicContext(customDate);
  const trainer = findTrainer(trainerNameOrId);

  if (!trainer) {
    return {
      trainer: null,
      context: ctx,
      currentSession: null,
      nextSession: null,
      status: "unknown",
      summary: "Trainer not found"
    };
  }

  const todaySessions: TimetableSession[] = trainer.schedule[ctx.dayName] || [];
  const currMins = timeToMinutes(ctx.time24);

  // 1. Is the trainer in a class right now?
  let currentSession: TimetableSession | null = null;
  if (ctx.activeSlot && typeof ctx.activeSlot.period === "number") {
    currentSession = todaySessions.find(s => s.period === ctx.activeSlot?.period) || null;
  }

  // 2. What is the next session today?
  let nextSession: TimetableSession | null = null;
  for (const s of todaySessions) {
    const startMins = timeToMinutes(s.startTime);
    if (startMins > currMins) {
      nextSession = s;
      break;
    }
  }

  let status: "in_class" | "in_break" | "free_now" | "day_ended" | "no_classes_today" = "free_now";
  let summary = "";

  if (todaySessions.length === 0) {
    status = "no_classes_today";
    summary = `No lectures scheduled on ${ctx.dayName} for ${trainer.name}`;
  } else if (currentSession) {
    status = "in_class";
    summary = `Teaching ${currentSession.unitTitle} to ${currentSession.classCode} in ${currentSession.venue} (${currentSession.timeRange})`;
  } else if (ctx.isBreak) {
    status = "in_break";
    summary = `${ctx.activeSlot?.name} (${ctx.activeSlot?.timeRange})${nextSession ? ` • Next: ${nextSession.classCode} at ${nextSession.startTime} in ${nextSession.venue}` : ""}`;
  } else if (nextSession) {
    status = "free_now";
    summary = `Free period • Next lecture: ${nextSession.unitTitle} (${nextSession.classCode}) at ${nextSession.startTime} in ${nextSession.venue}`;
  } else {
    status = "day_ended";
    summary = `All ${todaySessions.length} sessions completed for today (${ctx.dayName})`;
  }

  return {
    trainer,
    context: ctx,
    currentSession,
    nextSession,
    todaySessions,
    status,
    summary
  };
}

export default {
  TERM_CONFIG,
  MTTI_PERIODS,
  getAcademicContext,
  calculateAcademicWeek,
  getActivePeriodSlot,
  findTrainer,
  getTrainerLiveStatus
};
