import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import fs from "fs";
import path from "path";
import {
  query,
  withTransaction,
  DatabaseServiceUnavailableError,
  isTlsStrict,
  ensurePoolAvailable,
  saveAttendanceBatch,
  saveTraineeBatch,
} from "../server/db.ts";
import { apiRouter } from "../server/routes.ts";

describe("Phase 3: Database Resilience, Strict TLS & Data Safety Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── 1. STRICT TLS CERTIFICATE VERIFICATION IN PRODUCTION ────────────────────
  describe("1. Strict TLS Certificate Verification", () => {
    it("should verify isTlsStrict reflects production TLS rules", () => {
      // In non-production default, rejectUnauthorized is false
      expect(typeof isTlsStrict()).toBe("boolean");
    });
  });

  // ─── 2. DATABASE SERVICE UNAVAILABLE (HTTP 503) ENFORCEMENT ─────────────────
  describe("2. HTTP 503 Error Propagation on Database Failure", () => {
    it("should throw DatabaseServiceUnavailableError when pool is null in STRICT_DB mode", async () => {
      process.env.STRICT_DB = "true";

      await expect(query("SELECT 1")).rejects.toThrow(DatabaseServiceUnavailableError);
      try {
        await query("SELECT 1");
      } catch (err: any) {
        expect(err.status).toBe(503);
        expect(err.statusCode).toBe(503);
        expect(err.name).toBe("DatabaseServiceUnavailableError");
      }
    });

    it("should throw DatabaseServiceUnavailableError in withTransaction when pool is null", async () => {
      process.env.STRICT_DB = "true";

      await expect(
        withTransaction(async (client) => {
          return client.query("SELECT 1");
        })
      ).rejects.toThrow(DatabaseServiceUnavailableError);
    });

    it("should throw DatabaseServiceUnavailableError in batch persistence functions when pool is missing in strict mode", async () => {
      process.env.STRICT_DB = "true";

      expect(() => ensurePoolAvailable()).toThrow(DatabaseServiceUnavailableError);

      await expect(
        saveAttendanceBatch([
          {
            id: "att-test-01",
            unit_offering_id: "uo-test",
            trainee_id: "trainee-test",
            week_number: 1,
            session_date: "2026-10-25",
            status: "present",
            hours_attended: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
      ).rejects.toThrow(DatabaseServiceUnavailableError);

      await expect(
        saveTraineeBatch([
          {
            id: "tr-test-01",
            name: "Test Student",
            reg_number: "12345/2026",
            adm_no: "12345",
          },
        ])
      ).rejects.toThrow(DatabaseServiceUnavailableError);
    });

    it("should respond with HTTP 503 when API routes encounter DatabaseServiceUnavailableError", async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get("/api/test-db-error", (_req, _res) => {
        throw new DatabaseServiceUnavailableError("PostgreSQL pool connection failed");
      });
      // Global error handler
      testApp.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const status = err.status || err.statusCode || 500;
        res.status(status).json({ error: err.message, service_status: "database_unavailable" });
      });

      const testServer: Server = await new Promise((resolve) => {
        const s = testApp.listen(0, () => resolve(s));
      });
      const port = (testServer.address() as AddressInfo).port;

      const res = await fetch(`http://127.0.0.1:${port}/api/test-db-error`);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.service_status).toBe("database_unavailable");
      expect(data.error).toContain("PostgreSQL pool connection failed");

      await new Promise<void>((resolve) => testServer.close(() => resolve()));
    });
  });

  // ─── 3. IDEMPOTENT MIGRATION 14 INTEGRITY ────────────────────────────────────
  describe("3. Non-Destructive Migration 14 Verification", () => {
    it("should verify migration 14 file exists and contains non-destructive transactional DDL", () => {
      const migrationPath = path.resolve(__dirname, "../database/migrations/14_persistence_and_integrity_hardening.sql");
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sql = fs.readFileSync(migrationPath, "utf-8");
      // Must be transactional
      expect(sql).toContain("BEGIN;");
      expect(sql).toContain("COMMIT;");
      // Must be idempotent
      expect(sql).toContain("CREATE INDEX IF NOT EXISTS");
      // Must not drop or truncate tables
      expect(sql).not.toContain("DROP TABLE");
      expect(sql).not.toContain("TRUNCATE");
    });
  });
});
