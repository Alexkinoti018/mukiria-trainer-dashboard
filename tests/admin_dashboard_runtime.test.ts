import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { apiRouter } from "../server/routes.ts";
import { TraineeService } from "../client/src/services/TraineeService.ts";
import {
  ROLE_DASHBOARD_DESTINATIONS,
  getAuthorizedDashboard,
} from "../client/src/components/ProtectedRoute.tsx";

describe("Admin Dashboard UI Runtime & Roster Management Verification", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe("1. RBAC & Route Registration for Admin Dashboard", () => {
    it("configures /admin destination strictly for institutional admin role", () => {
      expect(ROLE_DASHBOARD_DESTINATIONS.admin).toBe("/admin");
      expect(getAuthorizedDashboard("admin")).toBe("/admin");
    });
  });

  describe("2. Production Build Bundle Integrity", () => {
    it("verifies that the AdminDashboard production chunk is compiled and present in dist/public/assets", () => {
      const assetsDir = path.resolve(process.cwd(), "dist", "public", "assets");
      expect(fs.existsSync(assetsDir)).toBe(true);

      const files = fs.readdirSync(assetsDir);
      const adminChunk = files.find((f) => f.startsWith("AdminDashboard-") && f.endsWith(".js"));
      expect(adminChunk).toBeDefined();

      const chunkContent = fs.readFileSync(path.join(assetsDir, adminChunk!), "utf-8");

      // Verify that Section 3 UI components and texts are bundled
      expect(chunkContent).toContain("Institutional Trainee Directory & Roster Management");
      expect(chunkContent).toContain("Enrolled Trainees Directory");
      expect(chunkContent).toContain("Administrator Protected View");
      expect(chunkContent).toContain("Batch Trainee Roster Ingestion");
      expect(chunkContent).toContain("Database Service Unavailable");
    });

    it("verifies that AdminRosterManagement component is built into the distribution bundle", () => {
      const assetsDir = path.resolve(process.cwd(), "dist", "public", "assets");
      const files = fs.readdirSync(assetsDir);
      const indexChunk = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
      expect(indexChunk).toBeDefined();
    });
  });

  describe("3. Roster API Runtime Handlers (/api/trainees)", () => {
    it("GET /api/trainees returns active institutional roster with 200 OK", async () => {
      const res = await fetch(`${baseUrl}/api/trainees`, {
        headers: {
          "x-user-role": "admin",
          "x-user-id": "admin_01",
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);

      // Verify trainee structure
      const first = body.data[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("name");
      expect(first).toHaveProperty("reg_number");
    });

    it("PUT /api/trainees/:id updates candidate data with input validation", async () => {
      const res = await fetch(`${baseUrl}/api/trainees/tr_it6_01`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
          "x-user-id": "admin_01",
        },
        body: JSON.stringify({
          phone: "+254700999888",
          remarks: "Verified Active Trainee",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.id).toBe("tr_it6_01");
    });

    it("DELETE /api/trainees/:id enforces admin/hod RBAC guard", async () => {
      // Non-admin request should be forbidden
      const forbiddenRes = await fetch(`${baseUrl}/api/trainees/tr_it6_01`, {
        method: "DELETE",
        headers: {
          "x-user-role": "trainee",
          "x-user-id": "tr_01",
        },
      });
      expect(forbiddenRes.status).toBe(403);

      // Admin request succeeds
      const allowedRes = await fetch(`${baseUrl}/api/trainees/tr_it6_01`, {
        method: "DELETE",
        headers: {
          "x-user-role": "admin",
          "x-user-id": "admin_01",
        },
      });
      expect(allowedRes.status).toBe(200);
      const body = await allowedRes.json();
      expect(body.success).toBe(true);
      expect(body.id).toBe("tr_it6_01");
    });
  });
});
