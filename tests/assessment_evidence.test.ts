import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { 
  apiRouter, 
  DB, 
  verifyEvidenceAccess,
  calculateServerWeightedMark 
} from "../server/routes.ts";

describe("Trainee Assessment Evidence Pipeline & Security Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  // Snapshot initial DB state for isolation
  const initialDBState = JSON.parse(JSON.stringify(DB));

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    DB.assessment_evidence = JSON.parse(JSON.stringify(initialDBState.assessment_evidence));
    DB.assessment_marks = JSON.parse(JSON.stringify(initialDBState.assessment_marks));
    DB.unit_offerings = JSON.parse(JSON.stringify(initialDBState.unit_offerings));
  });

  // ─── 1. STORAGE & BINARY FILE HANDLING (PHASE 1) ────────────────────────────
  describe("1. Binary Streaming & File Handling Integrity", () => {
    it("should stream binary PDF with application/pdf Content-Type and proper Content-Disposition", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/file`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toContain('inline; filename="Computer_Essentials_Practical_1.pdf"');

      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      expect(buffer.length).toBeGreaterThan(0);
      // Valid PDF begins with %PDF-
      expect(buffer.toString("utf-8", 0, 5)).toBe("%PDF-");
    });

    it("should stream binary image with image/png Content-Type", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/file`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/png");
      expect(res.headers.get("content-disposition")).toContain('filename="Hardware_Setup_Evidence.png"');

      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBeGreaterThan(0);
    });

    it("should set attachment disposition when download query parameter is set to true", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/file?download=true`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-disposition")).toContain('attachment; filename="Computer_Essentials_Practical_1.pdf"');
    });

    it("should serve binary attachment download via dedicated GET /api/evidence/:id/download endpoint", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/download`, {
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toBe('attachment; filename="Computer_Essentials_Practical_1.pdf"');
      const arrayBuf = await res.arrayBuffer();
      expect(arrayBuf.byteLength).toBeGreaterThan(0);
    });
  });

  // ─── 2. SCOPED LISTING & OBJECT AUTHORIZATION (PHASE 4) ─────────────────────
  describe("2. Scoped Access & Trainee BOLA Protection", () => {
    it("should restrict trainee to only listing their own evidence submissions", async () => {
      const res = await fetch(`${baseUrl}/evidence`, {
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.evidence)).toBe(true);
      data.evidence.forEach((ev: any) => {
        expect(ev.trainee_id).toBe("trainee-001");
      });
    });

    it("should reject Trainee 1 attempting to view Trainee 2's evidence (HTTP 403 BOLA)", async () => {
      // Trainee 1 tries to view ev-002 (belonging to Trainee 2)
      const res = await fetch(`${baseUrl}/evidence/ev-002`, {
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (BOLA)");
    });

    it("should reject Trainee 1 attempting to download Trainee 2's binary file (HTTP 403 BOLA)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/file`, {
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (BOLA)");
    });

    it("should allow Trainee 1 to download their own binary file (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/file`, {
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(200);
    });
  });

  // ─── 3. CROSS-TRAINER ESCALATION GUARDS ──────────────────────────────────────
  describe("3. Cross-Trainer Escalation Guards", () => {
    it("should reject unassigned trainer attempting GET /api/evidence/:id/file (HTTP 403)", async () => {
      // Trainer 2 is not assigned to uo-1 (ev-001)
      const res = await fetch(`${baseUrl}/evidence/ev-001/file`, {
        headers: {
          Authorization: "Bearer token-trainer-002",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (Cross-Trainer)");
    });

    it("should reject unassigned trainer attempting GET /api/evidence/:id/download (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/download`, {
        headers: {
          Authorization: "Bearer token-trainer-002",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (Cross-Trainer)");
    });

    it("should prevent Trainer B from evaluating or grading Trainer A's unit evidence (HTTP 403)", async () => {
      // Trainer 2 tries to grade ev-001 (assigned to Trainer 1, uo-1)
      const res = await fetch(`${baseUrl}/evidence/ev-001/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-002",
        },
        body: JSON.stringify({
          grade: 95,
          feedback: "Attempted cross-trainer grade",
          task_code: "CP1",
        }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (Cross-Trainer)");
    });

    it("should prevent Trainer B from verifying Trainer A's unit evidence (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-001/verify`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainer-002",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden (Cross-Trainer)");
    });

    it("should allow assigned Trainer 1 to verify evidence in their assigned unit (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/verify`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer token-trainer-001",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.evidence.verified_by_trainer).toBe(true);
      expect(data.evidence.verified_by).toBe("Dr. J. Muriithi");
    });
  });

  // ─── 4. IN-MODAL MARK AWARDING & MARKSHEET SYNC (PHASE 3) ───────────────────
  describe("4. In-Modal Mark Awarding & Continuous Assessment Marksheet Sync", () => {
    it("should award score to CP2 and recalculate cp_avg, computed_average_practical, and weighted_mark", async () => {
      // Assign mark 90 to ev-002 (CP2, trainee-002, uo-1)
      const res = await fetch(`${baseUrl}/evidence/ev-002/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          grade: 90,
          feedback: "Outstanding motherboard diagnostics.",
          task_code: "CP2",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.evidence.grade).toBe(90);
      expect(data.evidence.verified_by_trainer).toBe(true);
      expect(data.marks.cp_scores[1]).toBe(90);

      // Trainee 2 had CP1: 70, now CP2: 90 -> cp_avg = (70 + 90) / 2 = 80
      expect(data.marks.cp_avg).toBe(80);
      expect(data.marks.computed_average_practical).toBe(80);

      // Level 6 weighting: 50% Theory (65) + 50% Practical (80) = 32.5 + 40 = 72.5 -> 73
      expect(data.marks.weighted_mark).toBe(73);
    });

    it("should disallow modifying marks when Assessment_Marks is locked (HTTP 400 Bad Request)", async () => {
      // mark-01 is is_locked: true in DB (uo-1, trainee-001)
      // Attempting to grade ev-001
      const res = await fetch(`${baseUrl}/evidence/ev-001/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          grade: 92,
          feedback: "Trying to overwrite locked score",
          task_code: "CP1",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Marks locked");
    });

    it("should reject grade inputs outside 0-100 range (HTTP 400)", async () => {
      const res = await fetch(`${baseUrl}/evidence/ev-002/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-trainer-001",
        },
        body: JSON.stringify({
          grade: 125,
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Grade must be a valid number between 0 and 100");
    });
  });

  // ─── 5. DELETION SECURITY (PHASE 4) ──────────────────────────────────────────
  describe("5. Submission Deletion Integrity", () => {
    it("should prevent trainee from deleting verified assessment evidence (HTTP 403)", async () => {
      // ev-001 is verified_by_trainer: true
      const res = await fetch(`${baseUrl}/evidence/ev-001`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Candidates cannot delete verified or graded assessment evidence");
    });

    it("should allow trainee to delete their own unverified, ungraded submission", async () => {
      // ev-003 belongs to trainee-001 and is unverified & ungraded
      const res = await fetch(`${baseUrl}/evidence/ev-003`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token-trainee-001",
        },
      });

      expect(res.status).toBe(200);
      const check = DB.assessment_evidence.find(e => e.id === "ev-003");
      expect(check).toBeUndefined();
    });
  });
});
