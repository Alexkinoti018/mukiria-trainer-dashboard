/**
 * Mukiria Technical Training Institute (MTTI) Offline Storage Layer
 * High-performance typed IndexedDB wrapper for offline resilience:
 * - Candidate Portal exams & submission drafts
 * - Workshop door QR attendance scans
 * - TVET session plans & records of work
 * - Resilient background sync queue
 */

export interface OfflineExam {
  id: string;
  unit_code: string;
  title: string;
  payload: any;
  cached_at: number;
}

export interface OfflineSubmission {
  id: string;
  unit_code: string;
  student_name: string;
  reg_number: string;
  student_email?: string;
  section_a: any[];
  section_b: any[];
  status: "draft" | "submitted" | "pending" | "graded" | "reviewed";
  total_score?: number;
  created_at: number;
  updated_at: number;
  synced: boolean;
}

export interface OfflineAttendanceScan {
  id: string;
  session_id: string;
  class_code?: string;
  adm: string;
  name: string;
  time: string;
  date: string;
  timestamp: number;
  synced: boolean;
}

export interface OfflineSessionPlan {
  id: string;
  data: any;
  updated_at: number;
}

export type SyncActionType =
  | "SUBMISSION_SUBMIT"
  | "ATTENDANCE_CHECKIN"
  | "ATTENDANCE_REGISTER_SAVE"
  | "SESSION_PLAN_SAVE"
  | "MARKS_UPDATE";

export type SyncStatus = "pending" | "processing" | "synced" | "failed";

export interface SyncQueueItem {
  id: string;
  action_type: SyncActionType;
  payload: any;
  attempts: number;
  max_attempts: number;
  status: SyncStatus;
  created_at: number;
  last_attempt_at?: number;
  error?: string;
}

const DB_NAME = "mtti_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or upgrade the IndexedDB instance
 */
export function openOfflineDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment."));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Exams store (Key: unit_code)
      if (!db.objectStoreNames.contains("exams")) {
        const examStore = db.createObjectStore("exams", { keyPath: "unit_code" });
        examStore.createIndex("by_id", "id", { unique: false });
      }

      // 2. Submissions store (Key: id)
      if (!db.objectStoreNames.contains("submissions")) {
        const subStore = db.createObjectStore("submissions", { keyPath: "id" });
        subStore.createIndex("by_unit_code", "unit_code", { unique: false });
        subStore.createIndex("by_reg_number", "reg_number", { unique: false });
        subStore.createIndex("by_status", "status", { unique: false });
      }

      // 3. Attendance scans store (Key: id)
      if (!db.objectStoreNames.contains("attendance_scans")) {
        const attStore = db.createObjectStore("attendance_scans", { keyPath: "id" });
        attStore.createIndex("by_session", "session_id", { unique: false });
        attStore.createIndex("by_adm", "adm", { unique: false });
        attStore.createIndex("by_timestamp", "timestamp", { unique: false });
      }

      // 4. Session plans store (Key: id)
      if (!db.objectStoreNames.contains("session_plans")) {
        db.createObjectStore("session_plans", { keyPath: "id" });
      }

      // 5. Background sync queue (Key: id)
      if (!db.objectStoreNames.contains("sync_queue")) {
        const queueStore = db.createObjectStore("sync_queue", { keyPath: "id" });
        queueStore.createIndex("by_status", "status", { unique: false });
        queueStore.createIndex("by_created", "created_at", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

/* ─────────────────────────────────────────────────────────────
 * Generic IDB Transaction Helpers
 * ───────────────────────────────────────────────────────────── */

async function getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openOfflineDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ─────────────────────────────────────────────────────────────
 * 1. Exams API
 * ───────────────────────────────────────────────────────────── */

export async function saveExamToOffline(exam: { unit_code: string; [key: string]: any }): Promise<void> {
  try {
    const store = await getStore("exams", "readwrite");
    const item: OfflineExam = {
      id: exam.id || exam.unit_code,
      unit_code: exam.unit_code.toUpperCase(),
      title: exam.title || exam.payload?.title || exam.unit_code,
      payload: exam.payload || exam,
      cached_at: Date.now(),
    };
    await reqToPromise(store.put(item));
  } catch (err) {
    console.warn("[OfflineStore] Failed to cache exam in IDB:", err);
  }
}

export async function getExamFromOffline(unitCode: string): Promise<OfflineExam | null> {
  try {
    const store = await getStore("exams", "readonly");
    const result = await reqToPromise(store.get(unitCode.toUpperCase()));
    return result || null;
  } catch (err) {
    console.warn("[OfflineStore] Failed to get exam from IDB:", err);
    return null;
  }
}

export async function getAllOfflineExams(): Promise<OfflineExam[]> {
  try {
    const store = await getStore("exams", "readonly");
    const result = await reqToPromise(store.getAll());
    return result || [];
  } catch (err) {
    console.warn("[OfflineStore] Failed to get all exams:", err);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
 * 2. Submissions & Drafts API
 * ───────────────────────────────────────────────────────────── */

export async function saveSubmissionToOffline(submission: OfflineSubmission): Promise<void> {
  try {
    const store = await getStore("submissions", "readwrite");
    await reqToPromise(store.put(submission));
  } catch (err) {
    console.warn("[OfflineStore] Failed to save submission in IDB:", err);
  }
}

export async function getSubmissionFromOffline(id: string): Promise<OfflineSubmission | null> {
  try {
    const store = await getStore("submissions", "readonly");
    const result = await reqToPromise(store.get(id));
    return result || null;
  } catch (err) {
    console.warn("[OfflineStore] Failed to get submission from IDB:", err);
    return null;
  }
}

export async function getDraftSubmissionFromOffline(
  unitCode: string,
  regNumber?: string
): Promise<OfflineSubmission | null> {
  try {
    const store = await getStore("submissions", "readonly");
    const all = await reqToPromise<OfflineSubmission[]>(store.getAll());
    const drafts = all.filter(
      (s) =>
        s.unit_code.toUpperCase() === unitCode.toUpperCase() &&
        s.status === "draft" &&
        (!regNumber || s.reg_number.toUpperCase() === regNumber.toUpperCase())
    );
    // Sort by updated_at descending
    drafts.sort((a, b) => b.updated_at - a.updated_at);
    return drafts[0] || null;
  } catch (err) {
    console.warn("[OfflineStore] Failed to get draft submission from IDB:", err);
    return null;
  }
}

export async function getAllOfflineSubmissions(): Promise<OfflineSubmission[]> {
  try {
    const store = await getStore("submissions", "readonly");
    const result = await reqToPromise(store.getAll());
    return result || [];
  } catch (err) {
    console.warn("[OfflineStore] Failed to get all submissions:", err);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
 * 3. Attendance Scans API
 * ───────────────────────────────────────────────────────────── */

export async function saveAttendanceScanToOffline(scan: Omit<OfflineAttendanceScan, "id" | "timestamp" | "synced"> & { id?: string }): Promise<OfflineAttendanceScan> {
  const item: OfflineAttendanceScan = {
    id: scan.id || `${scan.session_id}_${scan.adm}_${Date.now()}`,
    session_id: scan.session_id,
    class_code: scan.class_code,
    adm: scan.adm.trim().toUpperCase(),
    name: scan.name.trim(),
    time: scan.time,
    date: scan.date,
    timestamp: Date.now(),
    synced: false,
  };

  try {
    const store = await getStore("attendance_scans", "readwrite");
    await reqToPromise(store.put(item));
  } catch (err) {
    console.warn("[OfflineStore] Failed to save attendance scan in IDB:", err);
  }

  return item;
}

export async function getAttendanceScansFromOffline(sessionId?: string): Promise<OfflineAttendanceScan[]> {
  try {
    const store = await getStore("attendance_scans", "readonly");
    const all = await reqToPromise<OfflineAttendanceScan[]>(store.getAll());
    if (sessionId) {
      return all.filter((s) => s.session_id === sessionId);
    }
    return all;
  } catch (err) {
    console.warn("[OfflineStore] Failed to get attendance scans from IDB:", err);
    return [];
  }
}

export async function markAttendanceScanSynced(id: string): Promise<void> {
  try {
    const store = await getStore("attendance_scans", "readwrite");
    const scan = await reqToPromise<OfflineAttendanceScan>(store.get(id));
    if (scan) {
      scan.synced = true;
      await reqToPromise(store.put(scan));
    }
  } catch (err) {
    console.warn("[OfflineStore] Failed to mark attendance scan as synced:", err);
  }
}

/* ─────────────────────────────────────────────────────────────
 * 4. Session Plans & Curricula Cache API
 * ───────────────────────────────────────────────────────────── */

export async function saveSessionPlanToOffline(plan: { id: string; [key: string]: any }): Promise<void> {
  try {
    const store = await getStore("session_plans", "readwrite");
    const item: OfflineSessionPlan = {
      id: plan.id,
      data: plan,
      updated_at: Date.now(),
    };
    await reqToPromise(store.put(item));
  } catch (err) {
    console.warn("[OfflineStore] Failed to save session plan in IDB:", err);
  }
}

export async function getAllOfflineSessionPlans(): Promise<any[]> {
  try {
    const store = await getStore("session_plans", "readonly");
    const results = await reqToPromise<OfflineSessionPlan[]>(store.getAll());
    return results.map((r) => r.data);
  } catch (err) {
    console.warn("[OfflineStore] Failed to get session plans from IDB:", err);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
 * 5. Resilient Sync Queue API
 * ───────────────────────────────────────────────────────────── */

export async function enqueueSyncItem(
  action_type: SyncActionType,
  payload: any,
  max_attempts = 5
): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action_type,
    payload,
    attempts: 0,
    max_attempts,
    status: "pending",
    created_at: Date.now(),
  };

  try {
    const store = await getStore("sync_queue", "readwrite");
    await reqToPromise(store.put(item));
  } catch (err) {
    console.warn("[OfflineStore] Failed to enqueue sync item:", err);
  }

  return item;
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  try {
    const store = await getStore("sync_queue", "readonly");
    const all = await reqToPromise<SyncQueueItem[]>(store.getAll());
    return all
      .filter((i) => i.status === "pending" || i.status === "failed")
      .sort((a, b) => a.created_at - b.created_at);
  } catch (err) {
    console.warn("[OfflineStore] Failed to get pending sync items:", err);
    return [];
  }
}

export async function updateSyncItem(
  id: string,
  updates: Partial<SyncQueueItem>
): Promise<void> {
  try {
    const store = await getStore("sync_queue", "readwrite");
    const item = await reqToPromise<SyncQueueItem>(store.get(id));
    if (item) {
      const updated = { ...item, ...updates };
      await reqToPromise(store.put(updated));
    }
  } catch (err) {
    console.warn("[OfflineStore] Failed to update sync item:", err);
  }
}

export async function removeSyncItem(id: string): Promise<void> {
  try {
    const store = await getStore("sync_queue", "readwrite");
    await reqToPromise(store.delete(id));
  } catch (err) {
    console.warn("[OfflineStore] Failed to remove sync item:", err);
  }
}

export async function getSyncQueueStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  failed: number;
  synced: number;
}> {
  try {
    const store = await getStore("sync_queue", "readonly");
    const all = await reqToPromise<SyncQueueItem[]>(store.getAll());
    return {
      total: all.length,
      pending: all.filter((i) => i.status === "pending").length,
      processing: all.filter((i) => i.status === "processing").length,
      failed: all.filter((i) => i.status === "failed").length,
      synced: all.filter((i) => i.status === "synced").length,
    };
  } catch (err) {
    return { total: 0, pending: 0, processing: 0, failed: 0, synced: 0 };
  }
}
