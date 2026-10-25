import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter } from "../server/routes.ts";
import {
  securityHeaders,
  corsMiddleware,
  validateBody,
  TraineeCreateSchema,
} from "../server/security.ts";

describe("Phases 4 & 5: Server Hardening & Payload Validation Suite", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(securityHeaders);
    app.use(corsMiddleware);
    app.use(express.json({ limit: "10mb" }));
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

  // ─── 1. HELMET SECURITY HEADERS ──────────────────────────────────────────────
  describe("1. HTTP Security Headers Verification", () => {
    it("should set X-Content-Type-Options: nosniff", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    });

    it("should set X-Frame-Options: SAMEORIGIN", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    });

    it("should set Cross-Origin-Resource-Policy header", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    });
  });

  // ─── 2. CORS HEADERS & PREFLIGHT ─────────────────────────────────────────────
  describe("2. CORS Verification", () => {
    it("should include Access-Control-Allow-Credentials", async () => {
      const res = await fetch(`${baseUrl}/health`, {
        headers: {
          Origin: "http://localhost:5173",
        },
      });
      expect(res.headers.get("access-control-allow-credentials")).toBe("true");
    });

    it("should support OPTIONS preflight requests", async () => {
      const res = await fetch(`${baseUrl}/health`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5173",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
      });
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    });
  });

  // ─── 3. ZOD PAYLOAD VALIDATION ON MUTATION ROUTES ────────────────────────────
  describe("3. Zod Payload Validation on Mutations", () => {
    it("should reject POST /api/trainees with HTTP 400 when name is missing", async () => {
      const res = await fetch(`${baseUrl}/trainees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          admNo: "12345/2026",
          // missing name
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Validation Error");
      expect(data.details.some((d: any) => d.field === "name")).toBe(true);
    });

    it("should reject POST /api/trainees with HTTP 400 when admission number is missing", async () => {
      const res = await fetch(`${baseUrl}/trainees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          name: "John Doe",
          // missing admNo
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Validation Error");
      expect(data.details.some((d: any) => d.field === "admNo")).toBe(true);
    });

    it("should accept valid payload on POST /api/trainees and persist record", async () => {
      const uniqueAdm = `TEST-${Date.now()}`;
      const res = await fetch(`${baseUrl}/trainees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          name: "Valid Trainee",
          admNo: uniqueAdm,
          department: "Computing & Informatics",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.adm_no).toBe(uniqueAdm);
    });
  });
});
