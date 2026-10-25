import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import {
  apiRouter,
  authenticateUser,
  requireRoles,
  getAuthConfiguration,
  verifySupabaseToken,
  createSignedJwt,
} from "../server/routes.ts";

describe("Phase 2: Secure Cryptographic Authentication & RBAC Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;
  const TEST_JWT_SECRET = "mtti-super-secure-production-jwt-secret-2026";

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

  // ─── 1. CONFIGURATION & MODE SWITCHING ───────────────────────────────────────
  describe("1. Environment & Auth Mode Resolution", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it("should resolve to 'demo' mode with allowDemoAuth=true by default in test/dev", () => {
      delete process.env.AUTH_MODE;
      delete process.env.ALLOW_DEMO_AUTH;
      process.env.NODE_ENV = "test";

      const config = getAuthConfiguration();
      expect(config.mode).toBe("demo");
      expect(config.allowDemoAuth).toBe(true);
      expect(config.isProduction).toBe(false);
    });

    it("should resolve to 'supabase' mode with allowDemoAuth=false in production by default", () => {
      delete process.env.AUTH_MODE;
      delete process.env.ALLOW_DEMO_AUTH;
      process.env.NODE_ENV = "production";

      const config = getAuthConfiguration();
      expect(config.mode).toBe("supabase");
      expect(config.allowDemoAuth).toBe(false);
      expect(config.isProduction).toBe(true);
    });

    it("should allow demo auth in production when ALLOW_DEMO_AUTH=true is explicitly set", () => {
      process.env.NODE_ENV = "production";
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "true";

      const config = getAuthConfiguration();
      expect(config.mode).toBe("supabase");
      expect(config.allowDemoAuth).toBe(true);
    });

    it("should enforce 'supabase' mode when AUTH_MODE=supabase is explicitly declared", () => {
      process.env.NODE_ENV = "development";
      process.env.AUTH_MODE = "supabase";
      delete process.env.ALLOW_DEMO_AUTH;

      const config = getAuthConfiguration();
      expect(config.mode).toBe("supabase");
      expect(config.allowDemoAuth).toBe(false);
    });
  });

  // ─── 2. CRYPTOGRAPHIC TOKEN VERIFICATION ─────────────────────────────────────
  describe("2. Cryptographic JWT Verification Engine", () => {
    it("should verify valid signed JWT and extract full trainer identity claims", async () => {
      const payload = {
        sub: "trainer-uuid-007",
        email: "alexander.kinoti@mtti.ac.ke",
        exp: Math.floor(Date.now() / 1000) + 3600,
        app_metadata: { role: "trainer" },
        user_metadata: {
          name: "Alexander Kinoti",
          department_id: "dept-ci",
          assigned_units: ["ICT/OS/IT/CR/1/6"],
        },
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      const user = await verifySupabaseToken(token, TEST_JWT_SECRET);

      expect(user.id).toBe("trainer-uuid-007");
      expect(user.email).toBe("alexander.kinoti@mtti.ac.ke");
      expect(user.name).toBe("Alexander Kinoti");
      expect(user.role).toBe("trainer");
      expect(user.department_id).toBe("dept-ci");
      expect(user.assigned_units).toEqual(["ICT/OS/IT/CR/1/6"]);
    });

    it("should verify valid signed JWT for trainee with admission/reg number", async () => {
      const payload = {
        sub: "trainee-uuid-101",
        exp: Math.floor(Date.now() / 1000) + 3600,
        app_metadata: { role: "trainee" },
        user_metadata: {
          name: "Nthiga Gakii Doris",
          reg_number: "14179/S2026",
          department_id: "dept-ci",
          enrolled_units: ["ICT/CU/IT/CR/6/6"],
        },
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      const user = await verifySupabaseToken(token, TEST_JWT_SECRET);

      expect(user.id).toBe("trainee-uuid-101");
      expect(user.role).toBe("trainee");
      expect(user.reg_number).toBe("14179/S2026");
      expect(user.enrolled_units).toEqual(["ICT/CU/IT/CR/6/6"]);
    });

    it("should reject a token with tampered signature (invalid signature)", async () => {
      const payload = {
        sub: "imposter-001",
        app_metadata: { role: "admin" },
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = createSignedJwt(payload, "wrong-secret");
      await expect(verifySupabaseToken(token, TEST_JWT_SECRET)).rejects.toThrow(
        "Cryptographic verification failed: Invalid JWT signature"
      );
    });

    it("should reject an expired token", async () => {
      const payload = {
        sub: "expired-user",
        app_metadata: { role: "trainer" },
        exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      await expect(verifySupabaseToken(token, TEST_JWT_SECRET)).rejects.toThrow("Token expired");
    });

    it("should reject malformed JWT tokens lacking 3 dot-separated segments", async () => {
      await expect(verifySupabaseToken("not-a-jwt", TEST_JWT_SECRET)).rejects.toThrow(
        "Malformed JWT"
      );
      await expect(verifySupabaseToken("header.payload", TEST_JWT_SECRET)).rejects.toThrow(
        "Malformed JWT"
      );
    });
  });

  // ─── 3. PRODUCTION MODE PROTECTION & DEMO ISOLATION ─────────────────────────
  describe("3. Production Mode Header & Mock Rejection", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("should reject unverified x-user-role header spoofing with HTTP 401 when AUTH_MODE=supabase", async () => {
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          "x-user-role": "admin",
          "x-user-id": "spoofed-admin",
        },
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Header-based authentication (x-user-role) is forbidden in production mode");
    });

    it("should reject mock bearer simulation tokens with HTTP 401 when AUTH_MODE=supabase", async () => {
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          Authorization: "Bearer token-admin",
        },
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Mock bearer tokens are disabled in production mode");
    });

    it("should accept verified cryptographic JWT in production mode and grant role-scoped access", async () => {
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";
      process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

      const adminPayload = {
        sub: "real-admin-uuid",
        email: "admin@mtti.ac.ke",
        app_metadata: { role: "admin" },
        user_metadata: { name: "Principal Administrator" },
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validToken = createSignedJwt(adminPayload, TEST_JWT_SECRET);

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should enforce RBAC with HTTP 403 when a valid trainee JWT accesses an admin endpoint", async () => {
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";
      process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

      const traineePayload = {
        sub: "trainee-uuid-403",
        email: "student@mtti.ac.ke",
        app_metadata: { role: "trainee" },
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const traineeToken = createSignedJwt(traineePayload, TEST_JWT_SECRET);

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden: Access requires [admin]");
    });
  });

  // ─── 4. DEMO MODE PRESERVATION ──────────────────────────────────────────────
  describe("4. Demo Mode Preservation & Zero Regression", () => {
    it("should allow demo tokens when AUTH_MODE=demo", async () => {
      process.env.AUTH_MODE = "demo";

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          Authorization: "Bearer token-admin",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should allow header auth in demo mode for backward compatibility", async () => {
      process.env.AUTH_MODE = "demo";

      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: {
          "x-user-role": "admin",
          "x-user-id": "admin-demo-header",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
