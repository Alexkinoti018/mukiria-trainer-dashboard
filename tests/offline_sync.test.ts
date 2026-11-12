import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveSubmissionConflict,
  resolveAttendanceUnionMerge,
  resolveMonotonicVersionConflict,
  resolveTimestampPrecedence,
} from "../client/src/lib/syncEngine";
import {
  extractEntityId,
  type SyncQueueItem,
  type FailedSyncItem,
  type OfflineQueueItem,
} from "../client/src/lib/offlineStore";

interface ConflictResult {
  accepted: boolean;
  conflict?: {
    action_type: string;
    entity_id: string;
    resolution: "remote_preserved" | "local_merged" | "timestamp_precedence";
    reason: string;
  };
}

describe("MTTI PWA Offline Synchronization & Conflict Resolution Suite", () => {
  let queue: OfflineQueueItem[];

  beforeEach(() => {
    queue = [];
  });

  // ─── 1. BACKGROUND SYNC QUEUE BUFFERING ─────────────────────────────────────
  describe("1. Background Sync Queue & FIFO Buffering", () => {
    it("should enqueue actions with pending status and sequential created_at timestamps", () => {
      const item1: OfflineQueueItem = {
        id: "sync_1",
        action_type: "ATTENDANCE_CHECKIN",
        payload: { session_id: "sp-101", adm: "ITECH/14001/S2026", name: "David Mwangi" },
        attempts: 0,
        max_attempts: 5,
        status: "pending",
        created_at: 1000,
      };

      const item2: OfflineQueueItem = {
        id: "sync_2",
        action_type: "SUBMISSION_SUBMIT",
        payload: { unit_code: "COMP-204", reg_number: "ITECH/14002/S2026", status: "submitted" },
        attempts: 0,
        max_attempts: 5,
        status: "pending",
        created_at: 1050,
      };

      queue.push(item1, item2);

      expect(queue.length).toBe(2);
      expect(queue[0].status).toBe("pending");
      expect(queue[0].created_at).toBeLessThan(queue[1].created_at);
      expect(queue[0].attempts).toBe(0);
    });

    it("should increment attempts and flag failed on exceeding max_attempts", () => {
      const item: OfflineQueueItem = {
        id: "sync_fail_test",
        action_type: "SUBMISSION_SUBMIT",
        payload: { unit_code: "COMP-204" },
        attempts: 4,
        max_attempts: 5,
        status: "pending",
        created_at: Date.now(),
      };

      // Simulate failed network attempt
      item.attempts += 1;
      item.status = item.attempts >= item.max_attempts ? "failed" : "pending";
      item.error = "Failed to reach remote Supabase endpoint";

      expect(item.attempts).toBe(5);
      expect(item.status).toBe("failed");
      expect(item.error).toContain("Failed to reach remote Supabase");
    });
  });

  // ─── 2. SUBMISSION LOCKING DEFENSE ─────────────────────────────────────────
  describe("2. Conflict Resolution: Exam Submission Locking Defense", () => {
    it("should reject an incoming offline draft if remote exam is already submitted", () => {
      const remoteRecord = {
        id: "sub-999",
        unit_code: "COMP-204",
        reg_number: "ITECH/14010/S2026",
        status: "submitted",
        total_score: 85,
        submitted_at: "2026-10-04T12:00:00Z",
      };

      const incomingDraft = {
        id: "draft_COMP-204_ITECH/14010/S2026",
        unit_code: "COMP-204",
        reg_number: "ITECH/14010/S2026",
        status: "draft",
        section_a: [{ question_id: "q1", answer: "A" }],
        section_b: [],
      };

      const result = resolveSubmissionConflict(remoteRecord, incomingDraft);

      expect(result.accepted).toBe(false);
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.resolution).toBe("remote_preserved");
      expect(result.conflict?.reason).toContain("Submission Locking Defense");
    });

    it("should accept an incoming offline submission if no remote submission exists", () => {
      const remoteRecord = null; // No prior submission
      const incomingSubmission = {
        id: "sub-new-123",
        unit_code: "COMP-204",
        reg_number: "ITECH/14011/S2026",
        status: "submitted",
        total_score: 92,
      };

      const result = resolveSubmissionConflict(remoteRecord, incomingSubmission);

      expect(result.accepted).toBe(true);
      expect(result.conflict).toBeUndefined();
    });

    it("should allow a finalized submission to supersede a remote draft", () => {
      const remoteRecord = {
        id: "sub-draft-1",
        unit_code: "COMP-204",
        reg_number: "ITECH/14012/S2026",
        status: "draft",
      };

      const incomingFinalSubmission = {
        id: "sub-final-1",
        unit_code: "COMP-204",
        reg_number: "ITECH/14012/S2026",
        status: "submitted",
        total_score: 78,
      };

      const result = resolveSubmissionConflict(remoteRecord, incomingFinalSubmission);

      expect(result.accepted).toBe(true);
    });
  });

  // ─── 3. ATTENDANCE UNION MERGING ───────────────────────────────────────────
  describe("3. Conflict Resolution: Trainee Attendance Union Merging", () => {
    it("should merge offline door QR scans without dropping concurrent check-ins", () => {
      const existingRecords = [
        { session_id: "sp-w1-s1", adm: "ITECH/14001/S2026", status: "Present" },
        { session_id: "sp-w1-s1", adm: "ITECH/14002/S2026", status: "Present" },
      ];

      const offlineScan = {
        session_id: "sp-w1-s1",
        adm: "ITECH/14003/S2026",
      };

      const { merged, isNew } = resolveAttendanceUnionMerge(existingRecords, offlineScan);

      expect(isNew).toBe(true);
      expect(merged.length).toBe(3);
      expect(merged.map((m) => m.adm)).toContain("ITECH/14003/S2026");
      expect(merged.map((m) => m.adm)).toContain("ITECH/14001/S2026");
      expect(merged.map((m) => m.adm)).toContain("ITECH/14002/S2026");
    });

    it("should handle duplicate door QR scans idempotently without duplication", () => {
      const existingRecords = [
        { session_id: "sp-w1-s1", adm: "ITECH/14001/S2026", status: "Present" },
      ];

      // Student re-scanned the poster
      const duplicateScan = {
        session_id: "sp-w1-s1",
        adm: "itech/14001/s2026", // case insensitive
      };

      const { merged, isNew } = resolveAttendanceUnionMerge(existingRecords, duplicateScan);

      expect(isNew).toBe(false);
      expect(merged.length).toBe(1);
      expect(merged[0].adm).toBe("ITECH/14001/S2026");
    });
  });

  // ─── 4. TIMESTAMP PRECEDENCE ──────────────────────────────────────────────
  describe("4. Conflict Resolution: Timestamp Precedence for Session Plans", () => {
    it("should preserve remote record if remote timestamp is newer than offline edit", () => {
      const remoteUpdatedAt = 1728100000000; // Newer
      const localUpdatedAt = 1728090000000;  // Stale offline write

      const result = resolveTimestampPrecedence(remoteUpdatedAt, localUpdatedAt);

      expect(result.accepted).toBe(false);
      expect(result.conflict?.resolution).toBe("remote_preserved");
      expect(result.conflict?.reason).toContain("Remote session plan is newer");
    });

    it("should accept local record if local offline edit timestamp is newer", () => {
      const remoteUpdatedAt = 1728090000000;
      const localUpdatedAt = 1728100000000; // Newer local edit

      const result = resolveTimestampPrecedence(remoteUpdatedAt, localUpdatedAt);

      expect(result.accepted).toBe(true);
      expect(result.conflict).toBeUndefined();
    });
  });

  // ─── 5. CANDIDATE PORTAL COLUMN SHIELDING VERIFICATION ─────────────────────
  describe("5. Candidate Portal Shielding & Offline Cache Integrity", () => {
    it("should ensure student cached questions do not contain correct_answer or rubrics", () => {
      const fullExamPayload = {
        title: "Computer Networks Assessment",
        questions: [
          {
            id: "q1",
            question_text: "What layer of OSI is IP?",
            options: ["Transport", "Network", "Data Link", "Physical"],
            correct_answer: "Network",
            trainer_rubric: "Award 2 marks for Network.",
            critical_aspect: "Network layer addressing",
          },
        ],
      };

      // Trainee view simulation (column shielded)
      const sanitizedExam = {
        title: fullExamPayload.title,
        questions: fullExamPayload.questions.map(({ correct_answer, trainer_rubric, critical_aspect, ...safe }) => safe),
      };

      expect(sanitizedExam.questions[0]).toHaveProperty("question_text");
      expect(sanitizedExam.questions[0]).toHaveProperty("options");
      expect(sanitizedExam.questions[0]).not.toHaveProperty("correct_answer");
      expect(sanitizedExam.questions[0]).not.toHaveProperty("trainer_rubric");
      expect(sanitizedExam.questions[0]).not.toHaveProperty("critical_aspect");
    });
  });

  // ─── 6. DEAD-LETTER QUEUE (DLQ) & RETRY BACKOFF ISOLATION ────────────────
  describe("6. Dead-Letter Queue (DLQ) & Failure Isolation", () => {
    // Pure simulator replicating syncEngine.flushQueue() loop
    async function simulateQueueProcessor(
      queue: OfflineQueueItem[],
      dlq: FailedSyncItem[],
      handler: (item: OfflineQueueItem) => Promise<{ success: boolean; statusCode?: number; error?: string }>
    ) {
      const itemsToProcess = [...queue];
      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      for (const item of itemsToProcess) {
        processed++;
        item.attempts += 1;
        item.status = "processing";
        const res = await handler(item);

        if (res.success) {
          succeeded++;
          const idx = queue.findIndex((q) => q.id === item.id);
          if (idx !== -1) queue.splice(idx, 1);
        } else {
          failed++;
          const statusCode = res.statusCode;
          const isPermanent =
            statusCode === 400 ||
            statusCode === 403 ||
            statusCode === 422 ||
            item.attempts >= item.max_attempts;

          if (isPermanent) {
            // Remove from active queue and route to DLQ
            const idx = queue.findIndex((q) => q.id === item.id);
            if (idx !== -1) queue.splice(idx, 1);
            dlq.push({
              ...item,
              status: "failed",
              failed_at: Date.now(),
              error_reason: res.error || `HTTP ${statusCode || "max-attempts"}`,
              status_code: statusCode,
              entity_id: extractEntityId(item),
            });
          } else {
            item.status = "pending";
            item.error = res.error;
          }
        }
      }

      return { processed, succeeded, failed };
    }

    it("should isolate 1 failing item (HTTP 422) without blocking 3 valid items behind it", async () => {
      const activeQueue: OfflineQueueItem[] = [
        {
          id: "queue_item_1",
          action_type: "SUBMISSION_SUBMIT",
          payload: { unit_code: "COMP-204", reg_number: "INVALID_STUDENT", section_a: [] },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 1000,
        },
        {
          id: "queue_item_2",
          action_type: "ATTENDANCE_CHECKIN",
          payload: { session_id: "sp-201", adm: "ITECH/14001/S2026", name: "Alice Chebet" },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 1010,
        },
        {
          id: "queue_item_3",
          action_type: "MARKS_UPDATE",
          payload: { id: "mark_301", unit_code: "COMP-204", theory_mark: 78 },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 1020,
        },
        {
          id: "queue_item_4",
          action_type: "SESSION_PLAN_SAVE",
          payload: { id: "plan_401", title: "Networking Lab 2" },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 1030,
        },
      ];

      const dlqStore: FailedSyncItem[] = [];

      // Handler: item_1 fails with HTTP 422 Unprocessable Entity, all others succeed
      const handler = async (item: OfflineQueueItem) => {
        if (item.id === "queue_item_1") {
          return {
            success: false,
            statusCode: 422,
            error: "HTTP 422: Missing required competence assessment criteria for trainee",
          };
        }
        return { success: true };
      };

      const result = await simulateQueueProcessor(activeQueue, dlqStore, handler);

      // Verify all 4 were processed in sequence
      expect(result.processed).toBe(4);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(1);

      // Verify active queue is drained (item 1 went to DLQ, items 2, 3, 4 succeeded)
      expect(activeQueue.length).toBe(0);

      // Verify DLQ contains exactly item 1 with diagnostic metadata
      expect(dlqStore.length).toBe(1);
      expect(dlqStore[0].id).toBe("queue_item_1");
      expect(dlqStore[0].status_code).toBe(422);
      expect(dlqStore[0].error_reason).toContain("HTTP 422: Missing required competence");
      expect(dlqStore[0].entity_id).toBe("COMP-204 / INVALID_STUDENT");
      expect(dlqStore[0].status).toBe("failed");
    });

    it("should immediately move HTTP 403 Forbidden cross-trainer violations to DLQ", async () => {
      const activeQueue: OfflineQueueItem[] = [
        {
          id: "queue_forbidden_1",
          action_type: "MARKS_UPDATE",
          payload: { id: "mark_ee_501", department_id: "dept-ee" },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 2000,
        },
      ];
      const dlqStore: FailedSyncItem[] = [];

      const handler = async () => ({
        success: false,
        statusCode: 403,
        error: "HTTP 403: Cross-trainer authorization denied (BOLA violation)",
      });

      await simulateQueueProcessor(activeQueue, dlqStore, handler);

      expect(activeQueue.length).toBe(0);
      expect(dlqStore.length).toBe(1);
      expect(dlqStore[0].status_code).toBe(403);
      expect(dlqStore[0].error_reason).toContain("HTTP 403: Cross-trainer authorization denied");
    });

    it("should keep transient network errors (HTTP 503) in the queue for retry backoff", async () => {
      const activeQueue: OfflineQueueItem[] = [
        {
          id: "queue_transient_1",
          action_type: "ATTENDANCE_CHECKIN",
          payload: { session_id: "sp-99", adm: "ITECH/14099/S2026" },
          attempts: 0,
          max_attempts: 5,
          status: "pending",
          created_at: 3000,
        },
      ];
      const dlqStore: FailedSyncItem[] = [];

      const handler = async () => ({
        success: false,
        statusCode: 503,
        error: "HTTP 503: Database connection pool saturating; transient backoff",
      });

      await simulateQueueProcessor(activeQueue, dlqStore, handler);

      // Not in DLQ yet because attempts < max_attempts and status code is not permanent 4xx
      expect(dlqStore.length).toBe(0);
      expect(activeQueue.length).toBe(1);
      expect(activeQueue[0].attempts).toBe(1);
      expect(activeQueue[0].status).toBe("pending");
      expect(activeQueue[0].error).toContain("503");
    });

    it("should transition transient item to DLQ once max_attempts (5) is exhausted", async () => {
      const activeQueue: OfflineQueueItem[] = [
        {
          id: "queue_exhaust_1",
          action_type: "ATTENDANCE_REGISTER_SAVE",
          payload: { rows: [] },
          attempts: 4,
          max_attempts: 5,
          status: "pending",
          created_at: 4000,
        },
      ];
      const dlqStore: FailedSyncItem[] = [];

      const handler = async () => ({
        success: false,
        statusCode: 500,
        error: "Persistent internal error",
      });

      await simulateQueueProcessor(activeQueue, dlqStore, handler);

      expect(activeQueue.length).toBe(0);
      expect(dlqStore.length).toBe(1);
      expect(dlqStore[0].id).toBe("queue_exhaust_1");
      expect(dlqStore[0].attempts).toBe(5);
      expect(dlqStore[0].status).toBe("failed");
    });

    it("should allow a DLQ item to be retried by resetting attempts and re-enqueuing", () => {
      const failedItem: FailedSyncItem = {
        id: "dlq_retry_test",
        action_type: "SUBMISSION_SUBMIT",
        payload: { unit_code: "COMP-204", reg_number: "ITECH/14050/S2026" },
        attempts: 5,
        max_attempts: 5,
        status: "failed",
        created_at: 1000,
        failed_at: 2000,
        status_code: 422,
        error_reason: "HTTP 422: Fixed by administrator",
        entity_id: "COMP-204 / ITECH/14050/S2026",
      };

      // Emulate retryFailedSyncItem logic
      const restoredItem: OfflineQueueItem = {
        id: failedItem.id,
        action_type: failedItem.action_type,
        payload: failedItem.payload,
        attempts: 0,
        max_attempts: failedItem.max_attempts,
        status: "pending",
        created_at: failedItem.created_at,
        last_attempt_at: undefined,
        error: undefined,
      };

      expect(restoredItem.attempts).toBe(0);
      expect(restoredItem.status).toBe("pending");
      expect(restoredItem.error).toBeUndefined();
    });
  });

  // ─── 7. CLOCK-SKEW-SAFE MONOTONIC VERSION CONFLICT RESOLUTION ──────────────
  describe("7. Clock-Skew-Safe Conflict Resolution (Monotonic Version & Server Timestamp)", () => {
    it("should reject stale local edit if remote monotonic version is higher, even if local clock is skewed to the future", () => {
      // Skewed lab PC system clock: October 25, 2026
      const futureLocalTime = new Date("2026-10-25T14:00:00Z").getTime();
      // Server record updated on October 10, 2026, version 4
      const remoteRecord = {
        id: "plan-skew-1",
        version: 4,
        updated_at: "2026-10-10T12:00:00Z",
      };

      // Local edit based on version 2
      const localEdit = {
        id: "plan-skew-1",
        base_version: 2,
        version: 2,
        updated_at: futureLocalTime, // Clock is running in the future!
      };

      const result = resolveMonotonicVersionConflict(remoteRecord, localEdit);

      // Skew-safe version check detects remote (v4) > local (v2), rejecting local overwrite
      expect(result.accepted).toBe(false);
      expect(result.conflict?.resolution).toBe("remote_preserved");
      expect(result.conflict?.reason).toContain("Monotonic Version Precedence");
      expect(result.conflict?.reason).toContain("v4");
      expect(result.conflict?.reason).toContain("v2");
    });

    it("should accept local edit when local incremented version is >= remote version", () => {
      const remoteRecord = {
        id: "plan-skew-2",
        version: 3,
        updated_at: "2026-10-10T12:00:00Z",
      };

      const localEdit = {
        id: "plan-skew-2",
        version: 4, // Incremented after local edit
        base_version: 3,
        updated_at: Date.now(),
      };

      const result = resolveMonotonicVersionConflict(remoteRecord, localEdit);

      expect(result.accepted).toBe(true);
      expect(result.conflict).toBeUndefined();
    });

    it("should accept write when remote does not exist (new record)", () => {
      const remoteRecord = null;
      const localNewRecord = {
        id: "plan-brand-new",
        version: 1,
        updated_at: Date.now(),
      };

      const result = resolveMonotonicVersionConflict(remoteRecord, localNewRecord);

      expect(result.accepted).toBe(true);
    });

    it("should use authoritative server_updated_at when numeric version is missing, immune to local clock drift", () => {
      // Remote updated at 12:00 UTC by another trainer
      const remoteRecord = {
        id: "plan-server-ts",
        server_updated_at: "2026-10-10T12:00:00Z",
      };

      // Local trainer checked out at 10:00 UTC, but local clock is running slow (8:00 UTC)
      const localEdit = {
        id: "plan-server-ts",
        server_updated_at: "2026-10-10T10:00:00Z", // Checkout timestamp assigned by server
        updated_at: "2026-10-10T08:00:00Z",        // Skewed local clock
      };

      const result = resolveMonotonicVersionConflict(remoteRecord, localEdit);

      expect(result.accepted).toBe(false);
      expect(result.conflict?.resolution).toBe("remote_preserved");
      expect(result.conflict?.reason).toContain("Server Timestamp Precedence");
    });
  });
});
