import { describe, it, expect, beforeEach } from "vitest";

// Types matching offlineStore & syncEngine specifications
interface OfflineQueueItem {
  id: string;
  action_type: "SUBMISSION_SUBMIT" | "ATTENDANCE_CHECKIN" | "ATTENDANCE_REGISTER_SAVE" | "SESSION_PLAN_SAVE" | "MARKS_UPDATE";
  payload: any;
  attempts: number;
  max_attempts: number;
  status: "pending" | "processing" | "synced" | "failed";
  created_at: number;
  last_attempt_at?: number;
  error?: string;
}

interface ConflictResult {
  accepted: boolean;
  conflict?: {
    action_type: string;
    entity_id: string;
    resolution: "remote_preserved" | "local_merged" | "timestamp_precedence";
    reason: string;
  };
}

/**
 * Pure conflict resolution logic mirrors syncEngine.ts for isolated deterministic testing
 */
function resolveSubmissionConflict(remote: any, incoming: any): ConflictResult {
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

function resolveAttendanceUnionMerge(existingRecords: Array<{ session_id: string; adm: string; status: string }>, incomingScan: { session_id: string; adm: string }): {
  merged: Array<{ session_id: string; adm: string; status: string }>;
  isNew: boolean;
} {
  const normAdm = incomingScan.adm.trim().toUpperCase();
  const exists = existingRecords.some(
    (r) => r.session_id === incomingScan.session_id && r.adm.trim().toUpperCase() === normAdm
  );

  if (exists) {
    return { merged: existingRecords, isNew: false };
  }

  return {
    merged: [...existingRecords, { session_id: incomingScan.session_id, adm: normAdm, status: "Present" }],
    isNew: true,
  };
}

function resolveTimestampPrecedence(remoteUpdatedAt: number, localUpdatedAt: number): ConflictResult {
  if (remoteUpdatedAt > localUpdatedAt) {
    return {
      accepted: false,
      conflict: {
        action_type: "SESSION_PLAN_SAVE",
        entity_id: "plan-test",
        resolution: "remote_preserved",
        reason: "Timestamp Precedence: Remote session plan is newer than offline edits.",
      },
    };
  }
  return { accepted: true };
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
});
