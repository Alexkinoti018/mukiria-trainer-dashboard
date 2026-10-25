/**
 * Unit Tests for TraineeService Abstraction Layer
 * Mukiria Technical Training Institute (MTTI)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TraineeService,
  DatabaseUnavailableError,
} from "../client/src/services/TraineeService";

describe("TraineeService Repository Abstraction Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchRoster()", () => {
    it("fetches all trainees and maps fields to Trainee interface", async () => {
      const mockApiResponse = {
        success: true,
        data: [
          {
            id: "tr_it6_01",
            name: "Nthiga Gakii Doris",
            reg_number: "14179/S2026",
            adm_no: "14179/S2026",
            reg_code: "ITECH 6 MOD/14179/S2026",
            class_code: "ITECH 6 MODULAR/S/2026",
            department: "Computing & Informatics",
            gender: "F",
            phone: "+254700000001",
            email: "doris@mtti.ac.ke",
            remarks: "Class Representative",
          },
        ],
        count: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
      } as any);

      const trainees = await TraineeService.fetchRoster();

      expect(global.fetch).toHaveBeenCalledWith("/api/trainees");
      expect(trainees).toHaveLength(1);
      expect(trainees[0]).toEqual({
        id: "tr_it6_01",
        name: "Nthiga Gakii Doris",
        admNo: "14179/S2026",
        regCode: "ITECH 6 MOD/14179/S2026",
        classCode: "ITECH 6 MODULAR/S/2026",
        department: "Computing & Informatics",
        gender: "F",
        phone: "+254700000001",
        email: "doris@mtti.ac.ke",
        remarks: "Class Representative",
      });
    });

    it("applies cohort filtering query parameter when specified", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      } as any);

      await TraineeService.fetchRoster("ITECH 6 MODULAR/S/2026");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/trainees?class_code=ITECH%206%20MODULAR%2FS%2F2026"
      );
    });

    it("throws DatabaseUnavailableError on HTTP 503 response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          error: "Database Service Unavailable: PostgreSQL connection failed",
          service_status: "database_unavailable",
        }),
      } as any);

      await expect(TraineeService.fetchRoster()).rejects.toThrow(DatabaseUnavailableError);
    });

    it("throws standard Error on generic non-ok HTTP responses", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      } as any);

      await expect(TraineeService.fetchRoster()).rejects.toThrow("Internal Server Error");
    });
  });

  describe("updateTrainee()", () => {
    it("issues a PUT request with serialized payload and returns response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, id: "tr_it6_01", postgres_persisted: true }),
      } as any);

      const updates = { name: "Nthiga Gakii Doris (Updated)", phone: "+254711223344" };
      const res = await TraineeService.updateTrainee("tr_it6_01", updates);

      expect(global.fetch).toHaveBeenCalledWith("/api/trainees/tr_it6_01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      expect(res.success).toBe(true);
      expect(res.postgres_persisted).toBe(true);
    });

    it("throws DatabaseUnavailableError when update encounters HTTP 503", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "Database Service Unavailable" }),
      } as any);

      await expect(
        TraineeService.updateTrainee("tr_it6_01", { name: "New Name" })
      ).rejects.toThrow(DatabaseUnavailableError);
    });
  });

  describe("deleteTrainee()", () => {
    it("issues a DELETE request and returns confirmation", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, id: "tr_to_delete", postgres_deleted: true }),
      } as any);

      const res = await TraineeService.deleteTrainee("tr_to_delete");

      expect(global.fetch).toHaveBeenCalledWith("/api/trainees/tr_to_delete", {
        method: "DELETE",
      });
      expect(res.success).toBe(true);
      expect(res.postgres_deleted).toBe(true);
    });

    it("throws DatabaseUnavailableError when deletion encounters HTTP 503", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "Database Service Unavailable" }),
      } as any);

      await expect(TraineeService.deleteTrainee("tr_to_delete")).rejects.toThrow(
        DatabaseUnavailableError
      );
    });
  });
});
