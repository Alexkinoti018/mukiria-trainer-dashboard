/**
 * attendanceStorage.ts
 * Unified Persistence & Normalization Layer for MTTI Class Registers and Roll Calls.
 * Resolves cohort key fragmentation, multi-session collision, and data loss once and for all.
 */

export type AttendanceStatus = "X" | "0" | "";

export interface StudentAttendanceRecord {
  attendance: Record<string, AttendanceStatus>; // key: "W{week}_S{session}"
  signed?: boolean;
}

/**
 * Normalizes any cohort or class code into a canonical storage key.
 * Prevents split records between "FBS5/6/J/26", "FBS 5 MOD/J/2026", and "FBS6 MOD/12026".
 */
export function getCanonicalAttendanceClassKey(code: string): string {
  const norm = (code || "").toUpperCase();
  if (norm.includes("ICT") || norm.includes("ITECH")) return "ICT4_ITECH6";
  if (norm.includes("ADMIN")) return "ADMIN5_6";
  if (norm.includes("FBS")) return "FBS5_6";
  if (norm.includes("LS") || norm.includes("SURVEY")) return "LS5_6";
  return norm.replace(/[^A-Z0-9_]/g, "_");
}

/**
 * Retrieves all localStorage keys associated with a class code
 * (canonical, original, and backup keys).
 */
export function getStorageKeysForClass(classCode: string): string[] {
  const canonical = getCanonicalAttendanceClassKey(classCode);
  const keys = new Set<string>();
  
  keys.add(`mtti_class_register_${canonical}`);
  keys.add(`mtti_class_register_persisted_${canonical}`);
  keys.add(`mtti_class_register_${classCode}`);
  keys.add(`mtti_class_register_persisted_${classCode}`);

  if (canonical === "FBS5_6") {
    keys.add("mtti_class_register_FBS5/6/J/26");
    keys.add("mtti_class_register_FBS 5 MOD/J/2026");
    keys.add("mtti_class_register_FBS6 MOD/12026");
  } else if (canonical === "ICT4_ITECH6") {
    keys.add("mtti_class_register_ICT4/ITECH6/S/26 MOD 1");
    keys.add("mtti_class_register_ITECH 6 MODULAR/S/2026");
    keys.add("mtti_class_register_ICT4 MOD/S/2026");
  } else if (canonical === "ADMIN5_6") {
    keys.add("mtti_class_register_ADMIN5/6/J/26 MOD 3");
    keys.add("mtti_class_register_ADMIN4/5/6/S/26 MOD 1");
  } else if (canonical === "LS5_6") {
    keys.add("mtti_class_register_LS5/6/S/26");
  }

  return Array.from(keys);
}

/**
 * Loads the class attendance register for a class code by checking
 * canonical and alias keys, merging any historical records so data is never lost.
 */
export function loadClassAttendanceRegister(classCode: string): Record<string, StudentAttendanceRecord> {
  const keys = getStorageKeysForClass(classCode);
  const merged: Record<string, StudentAttendanceRecord> = {};

  if (typeof localStorage === "undefined") return merged;

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          for (const [studentId, rec] of Object.entries(parsed as Record<string, any>)) {
            if (!merged[studentId]) {
              merged[studentId] = {
                attendance: {},
                signed: rec?.signed ?? false,
              };
            }
            if (rec?.attendance && typeof rec.attendance === "object") {
              merged[studentId].attendance = {
                ...merged[studentId].attendance,
                ...rec.attendance,
              };
            }
            if (rec?.signed !== undefined) {
              merged[studentId].signed = merged[studentId].signed || rec.signed;
            }
          }
        }
      }
    } catch (e) {
      console.warn("loadClassAttendanceRegister parse error for key:", k, e);
    }
  }

  return merged;
}

/**
 * Persists class attendance register across canonical and alias keys.
 */
export function saveClassAttendanceRegister(
  classCode: string,
  data: Record<string, StudentAttendanceRecord>
): void {
  if (typeof localStorage === "undefined") return;

  const keys = getStorageKeysForClass(classCode);
  const serialized = JSON.stringify(data);

  keys.forEach((k) => {
    try {
      localStorage.setItem(k, serialized);
    } catch (e) {
      console.warn("saveClassAttendanceRegister setItem error for key:", k, e);
    }
  });
}

/**
 * Applies a roll call session (e.g. from rapid marking or modal) directly
 * into the class attendance register and synchronizes storage.
 */
export function applyRollCallToRegister(
  classCode: string,
  weekNumber: number,
  sessionIndex: number,
  rollCallMap: Record<string, "X" | "0" | "">
): Record<string, StudentAttendanceRecord> {
  const currentRegister = loadClassAttendanceRegister(classCode);
  const sessionKey = `W${weekNumber}_S${sessionIndex}`;

  for (const [traineeId, status] of Object.entries(rollCallMap)) {
    if (!currentRegister[traineeId]) {
      currentRegister[traineeId] = { attendance: {}, signed: false };
    }
    currentRegister[traineeId].attendance[sessionKey] = status as AttendanceStatus;
    if (status === "X") {
      currentRegister[traineeId].signed = true;
    }
  }

  saveClassAttendanceRegister(classCode, currentRegister);

  // Notify any active components to re-render
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mtti-attendance-updated", {
        detail: { classCode, weekNumber, sessionIndex },
      })
    );
  }

  return currentRegister;
}
