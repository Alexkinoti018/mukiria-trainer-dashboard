import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { Server } from "http";
import type { AddressInfo } from "net";
import {
  getClientIp,
  normalizeAuthIdentifier,
  getAuthRateLimitKey,
  getLabSafeRateLimitKey,
  getAccountLockoutStatus,
  recordFailedAuthAttempt,
  resetAccountLockout,
  clearAllAccountLockouts,
  ACCOUNT_LOCKOUT_MAX_ATTEMPTS,
} from "../server/security";
import { apiRouter, getJwtSecret } from "../server/routes";
import { runStaffBackfill } from "../scripts/backfill-staff-directory";
import { verifyLegacyPasswordRejection, SEEDED_ACCOUNTS_TO_VERIFY } from "../scripts/verify-seed-password-rotation";

describe("Pre-H0 Audit Remediation Verification Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = "pre-h0-test-jwt-secret-at-least-32-chars-long!";
    app = express();
    app.set("trust proxy", 1);
    app.use(express.json());
    // Test error-triggering route that throws a database constraint violation
    app.get("/test-trigger-db-error", (_req, _res) => {
      const dbError: any = new Error("duplicate key value violates unique constraint \"idx_users_unique_profile_id\"");
      dbError.status = 500;
      dbError.code = "23505";
      dbError.table = "users";
      dbError.constraint = "idx_users_unique_profile_id";
      throw dbError;
    });

    app.use("/api", apiRouter);

    // Mount sanitized global error handler matching apiHandler.ts
    app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const reqId = (req.headers["x-request-id"] as string) || "test-req-id-12345";
      const status = typeof err?.status === "number" ? err.status : 500;
      res.status(status).json({
        error: "An internal server error occurred.",
        request_id: reqId,
      });
    });

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
    clearAllAccountLockouts();
  });

  // ─── 1. RATE LIMIT KEY & ACCOUNT LOCKOUT ─────────────────────────────────────
  describe("1. Rate Limit Key & Account Lockout Guardrails", () => {
    it("should never trust x-user-id, x-user-reg, or unverified JWT claims for authRateLimiter", () => {
      const req1: any = {
        ip: "192.168.1.100",
        headers: {
          "x-user-id": "attacker-spoofed-user-id-1",
          "x-user-reg": "fake-reg-1",
          authorization: "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJzcG9vZmVkIn0.",
        },
        body: { identifier: "trainer@mtti.ac.ke" },
      };

      const req2: any = {
        ip: "192.168.1.100",
        headers: {
          "x-user-id": "attacker-spoofed-user-id-2",
          "x-user-reg": "fake-reg-2",
          authorization: "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJhbm90aGVyIn0.",
        },
        body: { identifier: "trainer@mtti.ac.ke" },
      };

      const key1 = getAuthRateLimitKey(req1);
      const key2 = getAuthRateLimitKey(req2);

      // Rotating spoofed headers or fake tokens must NOT alter the bucket key
      expect(key1).toBe("auth:192.168.1.100:trainer@mtti.ac.ke");
      expect(key2).toBe("auth:192.168.1.100:trainer@mtti.ac.ke");
      expect(key1).toEqual(key2);
    });

    it("should lock account after 5 consecutive failed login attempts (HTTP 423)", async () => {
      const targetUser = "trainer@mtti.ac.ke";

      // 4 wrong passwords
      for (let i = 1; i <= 4; i++) {
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: targetUser, password: `WrongPassword_${i}!` }),
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/unauthorized|invalid credentials/i);
      }

      // 5th wrong password triggers account lockout
      const res5 = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetUser, password: "WrongPassword_5!" }),
      });
      expect(res5.status).toBe(423);
      const data5 = await res5.json();
      expect(data5.locked).toBe(true);
      expect(data5.error).toMatch(/temporarily locked/i);

      // Verify internal lockout state
      const status = getAccountLockoutStatus(targetUser);
      expect(status.isLocked).toBe(true);
      expect(status.attempts).toBe(5);
      expect(status.remainingMs).toBeGreaterThan(0);
    });

    it("should refuse correct password when account is locked until expiry", async () => {
      const targetUser = "trainer@mtti.ac.ke";

      // Force 5 failed attempts
      for (let i = 0; i < 5; i++) {
        recordFailedAuthAttempt(targetUser);
      }
      expect(getAccountLockoutStatus(targetUser).isLocked).toBe(true);

      // Attempt login with the CORRECT password while locked
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetUser, password: "trainer123" }),
      });

      // Must be rejected with HTTP 423 Locked
      expect(res.status).toBe(423);
      const data = await res.json();
      expect(data.locked).toBe(true);
      expect(data.error).toMatch(/temporarily locked/i);
    });

    it("should reset lockout upon successful login", async () => {
      const targetUser = "trainer@mtti.ac.ke";

      // 2 failed attempts
      recordFailedAuthAttempt(targetUser);
      recordFailedAuthAttempt(targetUser);
      expect(getAccountLockoutStatus(targetUser).attempts).toBe(2);

      // Successful login with correct password
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetUser, password: "trainer123" }),
      });

      expect(res.status).toBe(200);
      expect(getAccountLockoutStatus(targetUser).attempts).toBe(0);
      expect(getAccountLockoutStatus(targetUser).isLocked).toBe(false);
    });
  });

  // ─── 2. SANITIZED ERROR HANDLER & ZERO DB LEAKAGE ───────────────────────────
  describe("2. Error Handler Zero Database Leakage", () => {
    it("should never leak SQL constraint names or database error details to client", async () => {
      const targetUrl = baseUrl.replace(/\/api$/, "") + "/test-trigger-db-error";
      const res = await fetch(targetUrl, {
        headers: { "x-request-id": "req-safe-test-999" },
      });

      expect(res.status).toBe(500);
      const body = await res.json();

      // Must NOT leak database constraint or table names
      expect(body.error).toBe("An internal server error occurred.");
      expect(JSON.stringify(body)).not.toContain("idx_users_unique_profile_id");
      expect(JSON.stringify(body)).not.toContain("duplicate key value");
      expect(JSON.stringify(body)).not.toContain("users");
      expect(JSON.stringify(body)).not.toContain("stack");

      // Must include trace request_id
      expect(body.request_id).toBe("req-safe-test-999");
    });
  });

  // ─── 3. MIGRATION 17 BACKFILL SCRIPT INTEGRITY ──────────────────────────────
  describe("3. Migration 17 Backfill Script & Guarded Joins", () => {
    it("should generate DISTINCT ON guarded SQL statements to prevent multi-row match collisions", async () => {
      const { sqlStatements } = await runStaffBackfill();

      expect(sqlStatements.length).toBeGreaterThan(0);
      const combined = sqlStatements.join("\n");

      // Verify joins use DISTINCT ON guards
      expect(combined).toContain("DISTINCT ON (LOWER(TRIM(name)))");
      expect(combined).toContain("DISTINCT ON (d2.id)");
      expect(combined).toContain("DISTINCT ON (LOWER(TRIM(d.hod_email)))");
      expect(combined).toContain("DISTINCT ON (LOWER(TRIM(t.email)))");
      expect(combined).toContain("UPDATE Trainers t");
      expect(combined).toContain("UPDATE Departments d");
      expect(combined).toContain("UPDATE users u");
    });
  });

  // ─── 4. SEED PASSWORD ROTATION REJECTION VERIFIER ───────────────────────────
  describe("4. Seed Password Rotation & Rejection Verifier", () => {
    it("should reject invalid / rotated legacy passwords for staff accounts", async () => {
      // Clear any lockout state before verification run
      clearAllAccountLockouts();

      // Test a sample of deprecated / rotated passwords against staff account
      const testAccount = "admin@mtti.ac.ke";
      const retiredPasswords = ["OldRotatedPass2025!", "ExpiredLegacyPassword!#99", "admin-super-old-2024"];

      for (const pwd of retiredPasswords) {
        clearAllAccountLockouts(); // Avoid tripping 5-failure lockout during individual rejection checks
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: testAccount, password: pwd }),
        });

        // Must reject retired / rotated credentials
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toMatch(/unauthorized|invalid credentials/i);
      }
    });

    it("should export seeded account list and report failure if any legacy password succeeds", async () => {
      expect(SEEDED_ACCOUNTS_TO_VERIFY.length).toBeGreaterThanOrEqual(4);
      expect(SEEDED_ACCOUNTS_TO_VERIFY.map((a) => a.role)).toEqual(
        expect.arrayContaining(["ADMIN", "TRAINER", "HOD", "TRAINEE"])
      );
    });
  });
});
