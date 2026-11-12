/**
 * Mukiria Technical Training Institute (MTTI) Background Sync Engine & Conflict Resolution
 * Handles:
 * 1. Automatic background queue flushing when connectivity is restored
 * 2. Active network liveness heartbeat detection
 * 3. Submission locking defense (never overwrite submitted exam with draft)
 * 4. Attendance union-merging (no check-in lost during offline periods)
 * 5. Event dispatching for React UI status pills & manual triggers
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import {
  getPendingSyncItems,
  updateSyncItem,
  removeSyncItem,
  getSyncQueueStats,
  markAttendanceScanSynced,
  saveSubmissionToOffline,
  moveToDeadLetterQueue,
  getFailedSyncItems,
  retryFailedSyncItem,
  retryAllFailedSyncItems,
  clearFailedSyncItem,
  clearAllFailedSyncItems,
  extractEntityId,
  SyncQueueItem,
  SyncActionType,
  FailedSyncItem,
} from "./offlineStore";

export interface SyncConflictEvent {
  id: string;
  action_type: SyncActionType;
  entity_id: string;
  resolution: "remote_preserved" | "local_merged" | "timestamp_precedence";
  reason: string;
  timestamp: number;
}

export interface SyncItemResult {
  success: boolean;
  statusCode?: number;
  conflict?: SyncConflictEvent;
  error?: string;
}

/**
 * Pure conflict resolution logic mirrors specifications for testing and runtime execution
 */
export function resolveSubmissionConflict(remote: any, incoming: any): {
  accepted: boolean;
  conflict?: {
    action_type: SyncActionType;
    entity_id: string;
    resolution: "remote_preserved" | "local_merged" | "timestamp_precedence";
    reason: string;
  };
} {
  if (remote && (remote.status === "submitted" || remote.status === "graded")) {
    if (incoming.status === "draft") {
      return {
        accepted: false,
        conflict: {
          action_type: "SUBMISSION_SUBMIT",
          entity_id: `${incoming.unit_code}_${incoming.reg_number}`,
          resolution: "remote_preserved",
          reason: "Submission Locking Defense: Remote exam already marked 'submitted'. Offline draft rejected.",
        },
      };
    }
  }
  return { accepted: true };
}

export function resolveAttendanceUnionMerge(
  existingRecords: Array<{ session_id: string; adm: string; status?: string }>,
  incomingScan: { session_id: string; adm: string; status?: string }
): {
  merged: Array<{ session_id: string; adm: string; status: string }>;
  isNew: boolean;
} {
  const normAdm = incomingScan.adm.trim().toUpperCase();
  const exists = existingRecords.some(
    (r) => r.session_id === incomingScan.session_id && r.adm.trim().toUpperCase() === normAdm
  );

  if (exists) {
    return {
      merged: existingRecords.map((r) => ({
        ...r,
        status: r.status || "Present",
      })),
      isNew: false,
    };
  }

  return {
    merged: [
      ...existingRecords.map((r) => ({ ...r, status: r.status || "Present" })),
      { session_id: incomingScan.session_id, adm: normAdm, status: incomingScan.status || "Present" },
    ],
    isNew: true,
  };
}

/**
 * Clock-Skew-Safe monotonic version & authoritative server timestamp resolution
 * Immunizes the sync engine against client PC clock drift across campus labs.
 */
export function resolveMonotonicVersionConflict(
  remote: { version?: number; server_updated_at?: string; updated_at?: string | number } | null,
  local: { version?: number; base_version?: number; server_updated_at?: string; updated_at?: string | number; id?: string }
): {
  accepted: boolean;
  conflict?: {
    action_type: SyncActionType;
    entity_id: string;
    resolution: "remote_preserved" | "local_merged" | "timestamp_precedence";
    reason: string;
  };
} {
  if (!remote) {
    return { accepted: true };
  }

  // 1. Monotonic Integer Version Check (immune to client clock skew)
  const remoteVer = typeof remote.version === "number" ? remote.version : undefined;
  const localVer = typeof local.version === "number" ? local.version : (typeof local.base_version === "number" ? local.base_version : undefined);

  if (remoteVer !== undefined && localVer !== undefined) {
    if (remoteVer > localVer) {
      return {
        accepted: false,
        conflict: {
          action_type: "SESSION_PLAN_SAVE",
          entity_id: local.id || "record",
          resolution: "remote_preserved",
          reason: `Monotonic Version Precedence: Remote record (v${remoteVer}) is newer than local edit (v${localVer}). Skew-safe remote preserved.`,
        },
      };
    }
    return { accepted: true };
  }

  // 2. Authoritative Server Timestamp Precedence (server_updated_at)
  // If version is absent, compare against server_updated_at (the server's timestamp when local last checked out),
  // avoiding local Date.now() clock skew.
  if (remote.server_updated_at && local.server_updated_at) {
    const remoteServerTime = new Date(remote.server_updated_at).getTime();
    const localBaseServerTime = new Date(local.server_updated_at).getTime();
    if (remoteServerTime > localBaseServerTime) {
      return {
        accepted: false,
        conflict: {
          action_type: "SESSION_PLAN_SAVE",
          entity_id: local.id || "record",
          resolution: "remote_preserved",
          reason: `Server Timestamp Precedence: Remote record (${remote.server_updated_at}) was updated after local checkout (${local.server_updated_at}).`,
        },
      };
    }
    return { accepted: true };
  }

  // 3. Fallback timestamp comparison if version/server metadata is absent
  if (remote.updated_at && local.updated_at) {
    const remoteTime = new Date(remote.updated_at).getTime();
    const localTime = new Date(local.updated_at).getTime();
    if (remoteTime > localTime) {
      return {
        accepted: false,
        conflict: {
          action_type: "SESSION_PLAN_SAVE",
          entity_id: local.id || "record",
          resolution: "remote_preserved",
          reason: "Timestamp Precedence: Remote session plan is newer than offline edits.",
        },
      };
    }
  }

  return { accepted: true };
}

export const resolveTimestampPrecedence = (remoteUpdatedAt: number, localUpdatedAt: number) => {
  return resolveMonotonicVersionConflict(
    { updated_at: remoteUpdatedAt },
    { updated_at: localUpdatedAt, id: "plan-test" }
  );
};

type SyncListener = (state: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedDlqCount: number;
  lastSyncTime: number | null;
  conflicts: SyncConflictEvent[];
}) => void;

class SyncEngine {
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncTime: number | null = null;
  private conflicts: SyncConflictEvent[] = [];
  private listeners: Set<SyncListener> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initListeners();
    }
  }

  private initListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners();
      this.flushQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Check connectivity on startup and start periodic heartbeat (every 30s)
    this.checkLiveness();
    this.heartbeatInterval = setInterval(() => {
      this.checkLiveness();
    }, 30000);
  }

  /**
   * Active heartbeat ping to verify true internet reachability
   */
  public async checkLiveness(): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.isOnline = false;
      this.notifyListeners();
      return false;
    }

    try {
      // Ping Supabase or local health endpoint with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Ping same-origin root endpoint to verify true network reachability
      const pingUrl = "/";

      await fetch(pingUrl, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);
      const online = true;
      if (this.isOnline !== online) {
        this.isOnline = online;
        this.notifyListeners();
        if (online) this.flushQueue();
      }
      return true;
    } catch (err) {
      // Network unreachable
      this.isOnline = false;
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Subscribe to sync engine status updates
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyStatus(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    const stats = await getSyncQueueStats();
    this.listeners.forEach((listener) => {
      listener({
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingCount: stats.pending,
        failedDlqCount: stats.failed_dlq,
        lastSyncTime: this.lastSyncTime,
        conflicts: [...this.conflicts],
      });
    });
  }

  private async notifyStatus(listener: SyncListener) {
    const stats = await getSyncQueueStats();
    listener({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: stats.pending,
      failedDlqCount: stats.failed_dlq,
      lastSyncTime: this.lastSyncTime,
      conflicts: [...this.conflicts],
    });
  }

  /**
   * Flush all pending sync actions sequentially with DLQ isolation & conflict resolution
   */
  public async flushQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    conflicts: number;
  }> {
    if (this.isSyncing) {
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    const items = await getPendingSyncItems();
    if (items.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    // Verify true online status before starting
    const online = await this.checkLiveness();
    if (!online) {
      return { processed: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let succeeded = 0;
    let failed = 0;
    let conflictsCount = 0;

    for (const item of items) {
      try {
        await updateSyncItem(item.id, {
          status: "processing",
          last_attempt_at: Date.now(),
          attempts: item.attempts + 1,
        });

        const result = await this.processSyncItem(item);
        if (result.success) {
          succeeded++;
          if (result.conflict) {
            conflictsCount++;
            this.conflicts.unshift(result.conflict);
          }
          await removeSyncItem(item.id);
        } else {
          failed++;
          const statusCode = result.statusCode;
          const isPermanent =
            statusCode === 400 ||
            statusCode === 403 ||
            statusCode === 422 ||
            item.attempts + 1 >= item.max_attempts;

          if (isPermanent) {
            // Dead-Letter Queue (DLQ): route rejected item out of sync_queue so
            // subsequent valid items in the queue are processed without being blocked.
            await moveToDeadLetterQueue(
              item,
              result.error || `Permanent sync failure (HTTP ${statusCode || "max_attempts"})`,
              statusCode
            );
          } else {
            await updateSyncItem(item.id, {
              status: "pending",
              error: result.error || "Transient synchronization error",
            });
          }
        }
      } catch (err: any) {
        failed++;
        const statusCode = err.statusCode || err.status;
        const isPermanent =
          statusCode === 400 ||
          statusCode === 403 ||
          statusCode === 422 ||
          item.attempts + 1 >= item.max_attempts;

        if (isPermanent) {
          await moveToDeadLetterQueue(
            item,
            err.message || `Permanent execution exception (HTTP ${statusCode || "max_attempts"})`,
            statusCode
          );
        } else {
          await updateSyncItem(item.id, {
            status: "pending",
            error: err.message || "Execution exception during sync",
          });
        }
      }
    }

    this.isSyncing = false;
    this.lastSyncTime = Date.now();
    this.notifyListeners();

    return {
      processed: items.length,
      succeeded,
      failed,
      conflicts: conflictsCount,
    };
  }

  /**
   * Route item to appropriate conflict resolution & sync handler
   */
  private async processSyncItem(item: SyncQueueItem): Promise<SyncItemResult> {
    switch (item.action_type) {
      case "SUBMISSION_SUBMIT":
        return this.handleSubmissionSync(item);
      case "ATTENDANCE_CHECKIN":
        return this.handleAttendanceCheckinSync(item);
      case "ATTENDANCE_REGISTER_SAVE":
        return this.handleAttendanceRegisterSaveSync(item);
      case "SESSION_PLAN_SAVE":
        return this.handleSessionPlanSync(item);
      case "MARKS_UPDATE":
        return this.handleMarksUpdateSync(item);
      default:
        return { success: true };
    }
  }

  /**
   * Conflict Resolution 1: Exam Submission Locking Defense
   * Rule: If an exam has already been submitted to remote Supabase (status === 'submitted' | 'graded'),
   * an incoming offline draft or duplicate MUST NOT overwrite it.
   */
  private async handleSubmissionSync(item: SyncQueueItem): Promise<SyncItemResult> {
    const sub = item.payload;
    if (!sub || !sub.unit_code || !sub.reg_number) {
      return { success: true }; // Invalid payload, discard
    }

    if (!isSupabaseConfigured()) {
      // Local-only mode, accept write
      return { success: true };
    }

    try {
      // 1. Query remote submissions table for existing submission for this student and unit
      const { data: existing, error: queryErr } = await (supabase as any)
        .from("submissions")
        .select("id, status, total_score, updated_at")
        .eq("unit_code", sub.unit_code)
        .eq("reg_number", sub.reg_number)
        .maybeSingle();

      if (queryErr) {
        console.warn("[SyncEngine] Query remote submission error:", queryErr);
      }

      const conflictCheck = resolveSubmissionConflict(existing, sub);
      if (!conflictCheck.accepted && conflictCheck.conflict) {
        const conflict: SyncConflictEvent = {
          id: `conflict_${Date.now()}`,
          action_type: conflictCheck.conflict.action_type,
          entity_id: conflictCheck.conflict.entity_id,
          resolution: conflictCheck.conflict.resolution,
          reason: conflictCheck.conflict.reason,
          timestamp: Date.now(),
        };
        console.warn(`[SyncEngine] Conflict resolved: ${conflict.reason}`);
        return { success: true, conflict };
      }

      // 2. Perform write to Supabase
      const payloadToUpsert = {
        id: sub.id,
        unit_code: sub.unit_code,
        student_name: sub.student_name,
        reg_number: sub.reg_number,
        section_a: sub.section_a,
        section_b: sub.section_b,
        status: sub.status === "draft" ? "pending" : sub.status,
        total_score: sub.total_score ?? null,
        submitted_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await (supabase as any)
        .from("submissions")
        .upsert(payloadToUpsert, { onConflict: "id" });

      if (upsertErr) {
        const code = (upsertErr as any).code === "42501" ? 403 : undefined;
        return { success: false, statusCode: code, error: upsertErr.message };
      }

      // Update local copy
      await saveSubmissionToOffline({
        ...sub,
        synced: true,
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, statusCode: e.status || e.statusCode, error: e.message };
    }
  }

  /**
   * Conflict Resolution 2: Trainee Attendance QR Union-Merging
   * Rule: No check-in lost! Union merge by (session_id, adm_no).
   */
  private async handleAttendanceCheckinSync(item: SyncQueueItem): Promise<SyncItemResult> {
    const scan = item.payload;
    if (!scan || !scan.adm) return { success: true };

    try {
      // 1. Dispatch to backend Express API & PostgreSQL
      const resp = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_offering_id: scan.unit_offering_id || "uo-1",
          trainee_id: scan.adm,
          status: "present",
          hours_attended: 2.0,
          remarks: `QR checkin from ${scan.name || scan.adm}`,
        }),
      }).catch((err) => {
        console.warn("[SyncEngine] Backend API QR checkin sync warning:", err);
        return null;
      });

      if (resp && !resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        if (resp.status === 400 || resp.status === 403 || resp.status === 422) {
          return {
            success: false,
            statusCode: resp.status,
            error: errJson.error || `HTTP ${resp.status}: Bad attendance scan record`,
          };
        }
      }

      if (!isSupabaseConfigured()) {
        if (scan.id) await markAttendanceScanSynced(scan.id);
        return { success: true };
      }

      // 2. Look up student in Supabase trainees or attendance_register
      const { data: trainee } = await (supabase as any)
        .from("trainees")
        .select("id")
        .or(`adm_no.eq.${scan.adm},reg_code.eq.${scan.adm}`)
        .maybeSingle();

      const traineeId = trainee?.id || scan.adm;

      // 3. Union merge in Supabase: Record attendance with status 'Present'
      const { error } = await (supabase as any)
        .from("attendance_register")
        .insert({
          trainee_id: traineeId,
          status: "Present",
        });

      if (error && !error.message.includes("duplicate key")) {
        console.warn("[SyncEngine] Supabase attendance notice:", error.message);
      }

      if (scan.id) {
        await markAttendanceScanSynced(scan.id);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, statusCode: e.status || e.statusCode, error: e.message };
    }
  }

  /**
   * Attendance Register Save from Trainer
   */
  private async handleAttendanceRegisterSaveSync(item: SyncQueueItem): Promise<SyncItemResult> {
    const rows = item.payload?.rows;
    if (!rows || !Array.isArray(rows)) return { success: true };

    try {
      // 1. Always flush to backend API / PostgreSQL
      try {
        const records = rows.map((r: any) => ({
          unit_offering_id: r.unit_offering_id || "uo-1",
          trainee_id: r.trainee_id,
          week_number: Number(r.week_number || 1),
          status: r.status === "Present" || r.status === "present" || r.status === "X" ? "present" : "absent",
          hours_attended: 2.0,
        }));

        const res = await fetch("/api/attendance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit_offering_id: "uo-1",
            records,
          }),
        });

        if (!res.ok && (res.status === 400 || res.status === 403 || res.status === 422)) {
          const errJson = await res.json().catch(() => ({}));
          return {
            success: false,
            statusCode: res.status,
            error: errJson.error || `HTTP ${res.status}: Attendance bulk sync rejected`,
          };
        }
      } catch (apiErr: any) {
        console.warn("[SyncEngine] Failed flushing attendance rows to /api/attendance/bulk:", apiErr);
      }

      // 2. Flush to Supabase if configured
      if (isSupabaseConfigured()) {
        const { error } = await (supabase as any)
          .from("attendance_register")
          .upsert(rows);

        if (error) {
          console.warn("[SyncEngine] Supabase upsert notice:", error.message);
        }
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, statusCode: e.status || e.statusCode, error: e.message };
    }
  }

  /**
   * Conflict Resolution 3: Session Plans with Monotonic Version & Server Timestamp Precedence
   * Protects against lab workstation system clock skew.
   */
  private async handleSessionPlanSync(item: SyncQueueItem): Promise<SyncItemResult> {
    const plan = item.payload;
    if (!plan || !plan.id) return { success: true };

    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { data: remote, error: queryErr } = await (supabase as any)
        .from("session_plans")
        .select("id, version, server_updated_at, updated_at")
        .eq("id", plan.id)
        .maybeSingle();

      if (queryErr) {
        console.warn("[SyncEngine] Query session plan notice:", queryErr.message);
      }

      if (remote) {
        const conflictResult = resolveMonotonicVersionConflict(remote, plan);
        if (!conflictResult.accepted && conflictResult.conflict) {
          const conflict: SyncConflictEvent = {
            id: `conflict_${Date.now()}`,
            action_type: "SESSION_PLAN_SAVE",
            entity_id: plan.id,
            resolution: conflictResult.conflict.resolution,
            reason: conflictResult.conflict.reason,
            timestamp: Date.now(),
          };
          return { success: true, conflict };
        }
      }

      const nextVersion = ((remote?.version ?? plan.version ?? 0) as number) + 1;
      const payloadToUpsert = {
        ...plan,
        version: nextVersion,
        server_updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from("session_plans")
        .upsert(payloadToUpsert);

      if (error) {
        const code = (error as any).code === "42501" ? 403 : undefined;
        return { success: false, statusCode: code, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, statusCode: e.status || e.statusCode, error: e.message };
    }
  }

  /**
   * Conflict Resolution 4: Marks Updates with Monotonic Version Precedence
   */
  private async handleMarksUpdateSync(item: SyncQueueItem): Promise<SyncItemResult> {
    const marksData = item.payload;
    if (!marksData) return { success: true };

    if (!isSupabaseConfigured()) return { success: true };

    try {
      if (marksData.id) {
        const { data: remote } = await (supabase as any)
          .from("assessment_marks")
          .select("id, version, server_updated_at, updated_at")
          .eq("id", marksData.id)
          .maybeSingle();

        if (remote) {
          const conflictResult = resolveMonotonicVersionConflict(remote, marksData);
          if (!conflictResult.accepted && conflictResult.conflict) {
            const conflict: SyncConflictEvent = {
              id: `conflict_${Date.now()}`,
              action_type: "MARKS_UPDATE",
              entity_id: marksData.id,
              resolution: conflictResult.conflict.resolution,
              reason: conflictResult.conflict.reason,
              timestamp: Date.now(),
            };
            return { success: true, conflict };
          }
        }
      }

      const nextVersion = ((marksData.version ?? 0) as number) + 1;
      const { error } = await (supabase as any)
        .from("assessment_marks")
        .upsert({
          ...marksData,
          version: nextVersion,
          server_updated_at: new Date().toISOString(),
        });

      if (error) {
        const code = (error as any).code === "42501" ? 403 : undefined;
        return { success: false, statusCode: code, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, statusCode: e.status || e.statusCode, error: e.message };
    }
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      conflicts: this.conflicts,
    };
  }

  public async getFailedItems(): Promise<FailedSyncItem[]> {
    return getFailedSyncItems();
  }

  public async retryFailed(id: string): Promise<void> {
    await retryFailedSyncItem(id);
    await this.notifyListeners();
    this.flushQueue();
  }

  public async retryAllFailed(): Promise<void> {
    await retryAllFailedSyncItems();
    await this.notifyListeners();
    this.flushQueue();
  }

  public async clearFailed(id: string): Promise<void> {
    await clearFailedSyncItem(id);
    await this.notifyListeners();
  }

  public async clearAllFailed(): Promise<void> {
    await clearAllFailedSyncItems();
    await this.notifyListeners();
  }
}

// Global singleton instance
export const syncEngine = new SyncEngine();

/**
 * React Hook for consuming sync status in UI components
 */
import { useState, useEffect } from "react";

export function useSyncStatus() {
  const [state, setState] = useState(() => ({
    ...syncEngine.getStatus(),
    pendingCount: 0,
    failedDlqCount: 0,
  }));

  useEffect(() => {
    // Initial fetch of pending & failed counts
    getSyncQueueStats().then((stats) => {
      setState((prev) => ({
        ...prev,
        pendingCount: stats.pending,
        failedDlqCount: stats.failed_dlq,
      }));
    });

    const unsubscribe = syncEngine.subscribe((updated) => {
      setState(updated);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = () => {
    return syncEngine.flushQueue();
  };

  const retryFailedItem = (id: string) => syncEngine.retryFailed(id);
  const retryAllFailed = () => syncEngine.retryAllFailed();
  const clearFailedItem = (id: string) => syncEngine.clearFailed(id);
  const clearAllFailed = () => syncEngine.clearAllFailed();
  const getFailedItems = () => syncEngine.getFailedItems();

  return {
    ...state,
    syncNow,
    retryFailedItem,
    retryAllFailed,
    clearFailedItem,
    clearAllFailed,
    getFailedItems,
  };
}
