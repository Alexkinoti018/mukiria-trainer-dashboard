import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { apiRouter } from "../server/routes.ts";
import {
  ACCESS_ALERT_STORAGE_KEY,
  ACCESS_RESTRICTED_MESSAGE,
  ROLE_DASHBOARD_DESTINATIONS,
  getAuthorizedDashboard,
  evaluateProtectedRouteAccess,
  type InstitutionalRole,
} from "../client/src/components/ProtectedRoute.tsx";

/**
 * Route configuration table mirroring client/src/App.tsx ProtectedRoute definitions
 */
const APP_PROTECTED_ROUTES: Record<string, InstitutionalRole[]> = {
  "/admin": ["admin"],
  "/dashboard": ["trainer", "admin", "hod"],
  "/trainer/dashboard": ["trainer", "admin", "hod"],
  "/hod/dashboard": ["hod", "admin"],
  "/trainee/dashboard": ["trainee"],
  "/candidate/portal": ["trainee", "admin"],
};

function createMockSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe("RBAC Gateway Redirection & Alert Banner Verification", () => {
  let mockStorage = createMockSessionStorage();

  beforeEach(() => {
    mockStorage = createMockSessionStorage();
  });

  describe("1. Frontend ProtectedRoute Redirection & Alert Persistence", () => {
    it("maps each institutional role to its canonical authorized dashboard destination", () => {
      expect(ROLE_DASHBOARD_DESTINATIONS).toEqual({
        trainee: "/trainee/dashboard",
        trainer: "/dashboard",
        hod: "/hod/dashboard",
        admin: "/admin",
      });
      expect(getAuthorizedDashboard("trainee")).toBe("/trainee/dashboard");
      expect(getAuthorizedDashboard("trainer")).toBe("/dashboard");
      expect(getAuthorizedDashboard("hod")).toBe("/hod/dashboard");
      expect(getAuthorizedDashboard("admin")).toBe("/admin");
    });

    it("redirects unauthenticated users to /login without setting an RBAC alert banner", () => {
      const result = evaluateProtectedRouteAccess({
        isAuthenticated: false,
        user: null,
        allowedRoles: APP_PROTECTED_ROUTES["/dashboard"],
        storage: mockStorage,
      });

      expect(result.allowed).toBe(false);
      expect(result.redirectTo).toBe("/login");
      expect(result.alertMessage).toBeNull();
      expect(mockStorage.getItem(ACCESS_ALERT_STORAGE_KEY)).toBeNull();
    });

    it("redirects Trainees attempting to view /admin or /dashboard to /trainee/dashboard with an alert", () => {
      // Trainee -> /admin
      const adminAttempt = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "trainee" },
        allowedRoles: APP_PROTECTED_ROUTES["/admin"],
        storage: mockStorage,
      });

      expect(adminAttempt.allowed).toBe(false);
      expect(adminAttempt.redirectTo).toBe("/trainee/dashboard");
      expect(adminAttempt.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
      expect(mockStorage.getItem(ACCESS_ALERT_STORAGE_KEY)).toBe(ACCESS_RESTRICTED_MESSAGE);

      // Clear and test Trainee -> /dashboard
      mockStorage.clear();
      const dashboardAttempt = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "trainee" },
        allowedRoles: APP_PROTECTED_ROUTES["/dashboard"],
        storage: mockStorage,
      });

      expect(dashboardAttempt.allowed).toBe(false);
      expect(dashboardAttempt.redirectTo).toBe("/trainee/dashboard");
      expect(dashboardAttempt.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
      expect(mockStorage.getItem(ACCESS_ALERT_STORAGE_KEY)).toBe(ACCESS_RESTRICTED_MESSAGE);

      // Verify when Trainee arrives at /trainee/dashboard, access is allowed and alert banner persists for display
      const traineeLanding = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "trainee" },
        allowedRoles: APP_PROTECTED_ROUTES["/trainee/dashboard"],
        storage: mockStorage,
      });

      expect(traineeLanding.allowed).toBe(true);
      expect(traineeLanding.redirectTo).toBeNull();
      expect(traineeLanding.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
    });

    it("redirects Trainers attempting to view /admin to /dashboard with an alert", () => {
      const adminAttempt = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "trainer" },
        allowedRoles: APP_PROTECTED_ROUTES["/admin"],
        storage: mockStorage,
      });

      expect(adminAttempt.allowed).toBe(false);
      expect(adminAttempt.redirectTo).toBe("/dashboard");
      expect(adminAttempt.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
      expect(mockStorage.getItem(ACCESS_ALERT_STORAGE_KEY)).toBe(ACCESS_RESTRICTED_MESSAGE);

      // Verify when Trainer lands on /dashboard, access is permitted and banner message is active
      const trainerLanding = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "trainer" },
        allowedRoles: APP_PROTECTED_ROUTES["/dashboard"],
        storage: mockStorage,
      });

      expect(trainerLanding.allowed).toBe(true);
      expect(trainerLanding.redirectTo).toBeNull();
      expect(trainerLanding.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
    });

    it("redirects HODs attempting to take exams at /candidate/portal to /hod/dashboard with an alert", () => {
      const examAttempt = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "hod" },
        allowedRoles: APP_PROTECTED_ROUTES["/candidate/portal"],
        storage: mockStorage,
      });

      expect(examAttempt.allowed).toBe(false);
      expect(examAttempt.redirectTo).toBe("/hod/dashboard");
      expect(examAttempt.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
      expect(mockStorage.getItem(ACCESS_ALERT_STORAGE_KEY)).toBe(ACCESS_RESTRICTED_MESSAGE);

      // Verify when HOD lands on /hod/dashboard, access is permitted and banner message is active
      const hodLanding = evaluateProtectedRouteAccess({
        isAuthenticated: true,
        user: { role: "hod" },
        allowedRoles: APP_PROTECTED_ROUTES["/hod/dashboard"],
        storage: mockStorage,
      });

      expect(hodLanding.allowed).toBe(true);
      expect(hodLanding.redirectTo).toBeNull();
      expect(hodLanding.alertMessage).toBe(ACCESS_RESTRICTED_MESSAGE);
    });
  });

  describe("2. Backend API Route Protection (HTTP 403 Enforcement)", () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      const app = express();
      app.use(express.json());
      app.use("/api", apiRouter);

      await new Promise<void>((resolve) => {
        server = createServer(app);
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address() as AddressInfo;
          baseUrl = `http://127.0.0.1:${addr.port}`;
          resolve();
        });
      });
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    });

    it("rejects non-admin users from /api/admin/* with HTTP 403", async () => {
      for (const token of ["token-trainee-001", "token-trainer-001", "token-hod-ci"]) {
        const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Unauthorized User", role: "admin" }),
        });
        expect(usersRes.status).toBe(403);

        const maintRes = await fetch(`${baseUrl}/api/admin/maintenance/ping-db`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        expect(maintRes.status).toBe(403);
      }

      // Confirm admin succeeds
      const adminRes = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: "Bearer token-admin" },
      });
      expect(adminRes.status).toBe(200);
    });

    it("rejects non-HOD/non-admin users from /api/hod/* with HTTP 403", async () => {
      for (const token of ["token-trainee-001", "token-trainer-001"]) {
        const overviewRes = await fetch(`${baseUrl}/api/hod/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect(overviewRes.status).toBe(403);

        const signOffRes = await fetch(`${baseUrl}/api/hod/sign-off`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recordId: "sp-001", entityType: "session_plan", status: "approved" }),
        });
        expect(signOffRes.status).toBe(403);
      }

      // Confirm HOD succeeds
      const hodRes = await fetch(`${baseUrl}/api/hod/overview`, {
        headers: { Authorization: "Bearer token-hod-ci" },
      });
      expect(hodRes.status).toBe(200);
    });

    it("rejects trainees from /api/attendance/* and /api/marks/* with HTTP 403", async () => {
      const traineeHeaders = {
        Authorization: "Bearer token-trainee-001",
        "Content-Type": "application/json",
      };

      // GET /api/attendance
      const getAttRes = await fetch(`${baseUrl}/api/attendance`, {
        headers: traineeHeaders,
      });
      expect(getAttRes.status).toBe(403);

      // POST /api/attendance/mark
      const markAttRes = await fetch(`${baseUrl}/api/attendance/mark`, {
        method: "POST",
        headers: traineeHeaders,
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          trainee_id: "trainee-001",
          week_number: 1,
          status: "present",
        }),
      });
      expect(markAttRes.status).toBe(403);

      // POST /api/attendance/bulk
      const bulkAttRes = await fetch(`${baseUrl}/api/attendance/bulk`, {
        method: "POST",
        headers: traineeHeaders,
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          records: [{ trainee_id: "trainee-001", week_number: 1, status: "present" }],
        }),
      });
      expect(bulkAttRes.status).toBe(403);

      // GET /api/marks
      const getMarksRes = await fetch(`${baseUrl}/api/marks`, {
        headers: traineeHeaders,
      });
      expect(getMarksRes.status).toBe(403);

      // POST /api/marks/batch
      const batchMarksRes = await fetch(`${baseUrl}/api/marks/batch`, {
        method: "POST",
        headers: traineeHeaders,
        body: JSON.stringify({
          unitOfferingId: "uo-1",
          marks: [{ traineeId: "trainee-001", cpScore: 100 }],
        }),
      });
      expect(batchMarksRes.status).toBe(403);
    });
  });
});
