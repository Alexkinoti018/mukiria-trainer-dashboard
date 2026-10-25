/**
 * Trainee Service Abstraction Layer
 * Mukiria Technical Training Institute (MTTI)
 *
 * Provides a unified API repository abstraction for institutional trainee roster
 * operations (fetch, update, delete) with resilient HTTP 503 database-unavailable
 * error handling and offline fallback support.
 */

import type { Trainee } from "@/contexts/TraineeContext";

export class DatabaseUnavailableError extends Error {
  status = 503;
  statusCode = 503;
  serviceStatus = "database_unavailable";

  constructor(message = "Database Service Unavailable: PostgreSQL connection pool is unreachable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export class TraineeServiceClass {
  /**
   * Fetches the institutional roster from /api/trainees with optional cohort filtering.
   * Gracefully throws DatabaseUnavailableError if the database is in 503 status.
   */
  async fetchRoster(cohort?: string): Promise<Trainee[]> {
    const url = cohort && cohort !== "all"
      ? `/api/trainees?class_code=${encodeURIComponent(cohort)}`
      : "/api/trainees";

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 503) {
        const errJson = await res.json().catch(() => ({}));
        throw new DatabaseUnavailableError(
          errJson.error || "Database Service Unavailable (HTTP 503): Database connection pool is offline"
        );
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to fetch trainees (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map((r: any): Trainee => ({
        id: r.id,
        name: r.name,
        admNo: r.adm_no || r.reg_number,
        regCode: r.reg_code || r.adm_no || r.reg_number,
        classCode: r.class_code || r.class_id || "ICT4/ITECH6/S/26 MOD 1",
        department: r.department || "Computing & Informatics",
        gender: r.gender || "M",
        phone: r.phone || "",
        email: r.email,
        remarks: r.remarks || "",
      }));
    }

    return [];
  }

  /**
   * Updates an existing trainee record in PostgreSQL and persistent runtime state.
   */
  async updateTrainee(
    id: string,
    payload: Partial<Trainee>
  ): Promise<{ success: boolean; id: string; postgres_persisted?: boolean }> {
    const res = await fetch(`/api/trainees/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 503) {
        const errJson = await res.json().catch(() => ({}));
        throw new DatabaseUnavailableError(
          errJson.error || "Database Service Unavailable (HTTP 503): Cannot update trainee while database is offline"
        );
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to update trainee (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * Removes a trainee record from PostgreSQL and persistent storage (admin/HOD only).
   */
  async deleteTrainee(
    id: string
  ): Promise<{ success: boolean; id: string; postgres_deleted?: boolean }> {
    const res = await fetch(`/api/trainees/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      if (res.status === 503) {
        const errJson = await res.json().catch(() => ({}));
        throw new DatabaseUnavailableError(
          errJson.error || "Database Service Unavailable (HTTP 503): Cannot delete trainee while database is offline"
        );
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to delete trainee (HTTP ${res.status})`);
    }

    return await res.json();
  }
}

export const TraineeService = new TraineeServiceClass();
export default TraineeService;
