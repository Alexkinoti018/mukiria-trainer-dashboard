import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { setCachedUserProfile } from "../server/auth.ts";
import {
  apiRouter,
  authenticateUser,
  requireRoles,
  getAuthConfiguration,
  verifyToken,
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
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      const payload = {
        sub: "trainer-uuid-007",
        role: "trainer",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      const verified = await verifyToken(token);

      expect(verified.sub).toBe("trainer-uuid-007");
      expect(verified.role).toBe("trainer");
    });

    it("should verify valid signed JWT for trainee with admission/reg number", async () => {
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      const payload = {
        sub: "trainee-uuid-101",
        role: "trainee",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      const verified = await verifyToken(token);

      expect(verified.sub).toBe("trainee-uuid-101");
      expect(verified.role).toBe("trainee");
    });

    it("should reject a token with tampered signature (invalid signature)", async () => {
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      const payload = {
        sub: "imposter-001",
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = createSignedJwt(payload, "wrong-secret");
      await expect(verifyToken(token)).rejects.toThrow("Token verification failed");
    });

    it("should reject an expired token", async () => {
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      const payload = {
        sub: "expired-user",
        role: "trainer",
        exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
      };

      const token = createSignedJwt(payload, TEST_JWT_SECRET);
      await expect(verifyToken(token)).rejects.toThrow("Token verification failed: jwt expired");
    });

    it("should reject malformed JWT tokens lacking 3 dot-separated segments", async () => {
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      await expect(verifyToken("not-a-jwt")).rejects.toThrow("Token verification failed");
      await expect(verifyToken("header.payload")).rejects.toThrow("Token verification failed");
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
      setCachedUserProfile("usr-admin-01", {
        id: "usr-admin-01",
        profile_id: "admin-001",
        email: "admin@mtti.ac.ke",
        name: "System Administrator",
        role: "admin",
      });
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

      const adminPayload = {
        sub: "usr-admin-01",
        email: "admin@mtti.ac.ke",
        role: "admin",
        app_metadata: { role: "admin" },
        user_metadata: { name: "System Administrator" },
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
      setCachedUserProfile("usr-10525", {
        id: "usr-10525",
        profile_id: "trainee-001",
        email: "student@mtti.ac.ke",
        name: "Demo Trainee",
        role: "trainee",
        admission_number: "10525",
        reg_number: "10525",
      });
      process.env.AUTH_MODE = "supabase";
      process.env.ALLOW_DEMO_AUTH = "false";
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = TEST_JWT_SECRET;
      process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

      const traineePayload = {
        sub: "usr-10525",
        email: "student@mtti.ac.ke",
        role: "trainee",
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
