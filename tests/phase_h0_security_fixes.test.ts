import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter, getJwtSecret } from "../server/routes.ts";
import { setCachedUserProfile } from "../server/auth.ts";
import { signDocumentPayload, verifyDocumentToken, type DocumentMetadata } from "../server/documentSigner.ts";

describe("Phase H0: Security Hotfixes & Verification Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const PROD_VALID_SECRET = "mtti_enterprise_super_secret_jwt_key_strictly_for_production_verification_2026_valid!";

  beforeAll(async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = PROD_VALID_SECRET;
    process.env.DOCUMENT_SIGNING_KEY_CURRENT = "mtti_enterprise_super_secret_signing_key_strictly_for_production_2026_valid!";

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

  function createRoleToken(role: string, sub: string, extra: any = {}) {
    const userObj = {
      id: sub,
      profile_id: extra.profile_id || `${role}-h0`,
      email: `${role}@mtti.ac.ke`,
      name: `Test ${role}`,
      role: role.toLowerCase(),
      department_id: "dept-ci",
      admission_number: role === "trainee" ? "14179/S2026" : undefined,
      reg_number: role === "trainee" ? "14179/S2026" : undefined,
      ...extra,
    };
    setCachedUserProfile(sub, userObj as any);

    return jwt.sign(
      { sub, role: role.toLowerCase(), iss: "mtti-api", aud: "mtti-web", exp: Math.floor(Date.now() / 1000) + 3600 },
      getJwtSecret(),
      { algorithm: "HS256" }
    );
  }

  describe("1. Document Signing Authorization & Dual-Key Verification", () => {
    it("rejects POST /api/documents/sign with HTTP 403 when called by a trainee", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-h0-01");
      const res = await fetch(`${baseUrl}/documents/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          unit_code: "ICT06101",
          term: "TERM-1-2026",
          hod_signoff: true,
        }),
      });

      expect(res.status).toBe(403);
    });

    it("allows authorized HOD to sign documents with HTTP 200", async () => {
      const hodToken = createRoleToken("hod", "usr-hod-h0-01");
      const res = await fetch(`${baseUrl}/documents/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${hodToken}`,
        },
        body: JSON.stringify({
          unit_code: "ICT06101",
          term: "TERM-1-2026",
          total_candidates: 35,
          competent_count: 32,
          nyc_count: 3,
          average_mark: 74.5,
          hod_name: "Dr. Alexander Kinoti",
          hod_signoff: true,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
    });

    it("verifies dual-key rotation: valid previous key verifies with legacy grace period notice", () => {
      const oldSecret = "mtti-legacy-secret-2025-key-with-sufficient-32-chars!";
      const newSecret = "mtti-current-rotated-secret-2026-key-sufficient-32-chars!";

      process.env.DOCUMENT_SIGNING_KEY_CURRENT = oldSecret;
      const meta: DocumentMetadata = {
        doc_type: "broadsheet",
        unit_code: "ICT06101",
        term: "TERM-1-2026",
        total_candidates: 25,
        hod_signoff: true,
        issued_at: new Date().toISOString(),
      };

      const signedWithOld = signDocumentPayload(meta);

      // Now rotate to new secret
      process.env.DOCUMENT_SIGNING_KEY_CURRENT = newSecret;
      process.env.DOCUMENT_SIGNING_KEY_PREVIOUS = oldSecret;

      const result = verifyDocumentToken(signedWithOld.token);
      expect(result.valid).toBe(true);
      expect(result.legacy_key).toBe(true);
      expect(result.warning).toContain("grace period");

      // Verify tampering still fails
      const tampered = signedWithOld.token.slice(0, -4) + "AAAA";
      const tamperedResult = verifyDocumentToken(tampered);
      expect(tamperedResult.valid).toBe(false);
    });
  });

  describe("2. Trainee Management Authorization Guards", () => {
    it("rejects POST /api/trainees with HTTP 403 when called by trainee", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-h0-02");
      const res = await fetch(`${baseUrl}/trainees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          name: "Unauthorized Student Entry",
          admNo: "H0-ATTACK-001",
        }),
      });

      expect(res.status).toBe(403);
    });

    it("rejects POST /api/trainees/batch with HTTP 403 when called by trainee", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-h0-03");
      const res = await fetch(`${baseUrl}/trainees/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          trainees: [{ name: "Bulk Attack", admNo: "BULK-001" }],
        }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe("3. Marks Batch Mutation Ordering & Escalation Defenses", () => {
    it("rejects POST /api/marks/batch with HTTP 403 when called by trainee", async () => {
      const traineeToken = createRoleToken("trainee", "usr-trainee-h0-04");
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${traineeToken}`,
        },
        body: JSON.stringify({
          unitOfferingId: "uo-h0-fake-offering",
          marks: [{ traineeId: "trainee-001", cpScore: 90 }],
        }),
      });

      expect(res.status).toBe(403);
    });

    it("rejects POST /api/marks/batch with HTTP 404 when unit offering does not exist (prevents self-assignment exploit)", async () => {
      const trainerToken = createRoleToken("trainer", "usr-trainer-h0-01", { profile_id: "trainer-h0-01" });
      const res = await fetch(`${baseUrl}/marks/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          unitOfferingId: "uo-completely-nonexistent-offering-xyz",
          marks: [{ traineeId: "trainee-001", cpScore: 80 }],
        }),
      });

      // Crucial fix: Should return 404 Not Found, NEVER 200 or self-assign!
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Unit offering not found");
    });
  });

  describe("4. Administrative Maintenance Command Decoupling", () => {
    it("safely handles run-audit without executing shell child processes", async () => {
      const adminToken = createRoleToken("admin", "usr-admin-h0-01");
      const res = await fetch(`${baseUrl}/admin/maintenance/run-audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.action).toBe("run-audit");
      expect(data.output).toContain("decoupled");
    });
  });
});
