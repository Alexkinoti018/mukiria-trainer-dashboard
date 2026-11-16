/**
 * Mukiria Technical Training Institute (MTTI)
 * Authoritative Single-Source-of-Truth Route Access Policy
 *
 * Defines the security clearance, authorization mechanism, and BOLA checks
 * for every route mounted on the API router.
 */

export type RouteAccessType = "public" | "roles" | "scoped-in-handler";
export type InstitutionalRole = "admin" | "hod" | "trainer" | "trainee";

export interface RouteAccessRule {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  type: RouteAccessType;
  allowedRoles?: InstitutionalRole[];
  hasBolaCheck?: boolean;
  description: string;
}

export const ROUTE_ACCESS_POLICY: RouteAccessRule[] = [
  // ─── 1. Public Gateway Endpoints ──────────────────────────────────────────
  { method: "GET", path: "/health", type: "public", description: "Liveness probe" },
  { method: "GET", path: "/verify-document", type: "public", description: "Public broadsheet QR verification" },
  { method: "POST", path: "/auth/register-trainee", type: "public", description: "Candidate self-activation" },
  { method: "POST", path: "/auth/login", type: "public", description: "Authentication gateway" },
  { method: "GET", path: "/trainees/lookup", type: "public", description: "Public activation lookup (rate limited, masked)" },
  { method: "GET", path: "/compliance/rulesets", type: "public", description: "Public CDACC ruleset catalog" },
  { method: "GET", path: "/compliance/rulesets/:versionTag", type: "public", description: "Public CDACC ruleset specification" },

  // ─── 2. Authenticated General Endpoints ───────────────────────────────────
  { method: "POST", path: "/auth/change-password", type: "roles", allowedRoles: ["admin", "hod", "trainer", "trainee"], description: "Authenticated password modification" },
  { method: "GET", path: "/departments", type: "roles", allowedRoles: ["admin", "hod", "trainer", "trainee"], description: "List institutional academic departments" },

  // ─── 3. Trainees & Roster Management ─────────────────────────────────────
  { method: "GET", path: "/trainees", type: "roles", allowedRoles: ["admin", "hod", "trainer"], description: "Candidate records query (staff only)" },
  { method: "POST", path: "/trainees", type: "roles", allowedRoles: ["admin", "hod"], description: "Transactional candidate persistence" },
  { method: "PUT", path: "/trainees/:id", type: "scoped-in-handler", allowedRoles: ["admin", "hod", "trainer"], hasBolaCheck: true, description: "Update candidate (trainer scoped to assigned class)" },
  { method: "DELETE", path: "/trainees/:id", type: "roles", allowedRoles: ["admin", "hod"], description: "Delete candidate record" },
  { method: "POST", path: "/trainees/batch", type: "roles", allowedRoles: ["admin", "hod"], description: "Batch candidate CSV upload" },

  // ─── 4. Attendance Management ─────────────────────────────────────────────
  { method: "GET", path: "/attendance", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Rehydrate attendance records" },
  { method: "POST", path: "/attendance/mark", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Record single attendance entry" },
  { method: "POST", path: "/attendance/bulk", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Record bulk attendance register" },

  // ─── 5. Exams & Assessments ───────────────────────────────────────────────
  { method: "GET", path: "/exams", type: "scoped-in-handler", allowedRoles: ["admin", "hod", "trainer", "trainee"], hasBolaCheck: true, description: "List exams (trainees see published-only, sanitized)" },
  { method: "POST", path: "/exams", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Create or update exam definition" },
  { method: "GET", path: "/exams/:id", type: "scoped-in-handler", allowedRoles: ["admin", "hod", "trainer", "trainee"], hasBolaCheck: true, description: "Get exam details (trainees see sanitized)" },

  // ─── 6. Submissions & Grading ─────────────────────────────────────────────
  { method: "GET", path: "/submissions", type: "scoped-in-handler", allowedRoles: ["admin", "hod", "trainer", "trainee"], hasBolaCheck: true, description: "List submissions (trainees see only own)" },
  { method: "GET", path: "/submissions/:id", type: "scoped-in-handler", allowedRoles: ["admin", "hod", "trainer", "trainee"], hasBolaCheck: true, description: "Get single submission (trainees see only own)" },
  { method: "POST", path: "/submissions", type: "roles", allowedRoles: ["trainee", "admin"], description: "Create candidate submission" },
  { method: "PUT", path: "/submissions/:id/submit", type: "scoped-in-handler", allowedRoles: ["trainee", "admin"], hasBolaCheck: true, description: "Finalize candidate submission" },
  { method: "POST", path: "/submissions/:id/grade", type: "roles", allowedRoles: ["trainer", "admin"], description: "Grade candidate submission" },
  { method: "POST", path: "/submissions/:id/reopen", type: "roles", allowedRoles: ["trainer", "admin"], description: "Reopen candidate submission" },

  // ─── 7. Assessment Marks ──────────────────────────────────────────────────
  { method: "GET", path: "/assessment-marks/:offeringId", type: "scoped-in-handler", allowedRoles: ["trainer", "hod", "admin", "trainee"], hasBolaCheck: true, description: "Get marks for unit offering (trainee sees own published marks)" },
  { method: "GET", path: "/marks", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get assessment marks" },
  { method: "POST", path: "/marks/batch", type: "scoped-in-handler", allowedRoles: ["trainer", "hod", "admin"], hasBolaCheck: true, description: "Batch marks persistence (trainer scoped to unit offering)" },
  { method: "POST", path: "/assessment-marks/batch", type: "scoped-in-handler", allowedRoles: ["trainer", "hod", "admin"], hasBolaCheck: true, description: "Alias for batch marks persistence" },

  // ─── 8. Document Signing & Verification ───────────────────────────────────
  { method: "POST", path: "/documents/sign", type: "roles", allowedRoles: ["admin", "hod"], description: "Cryptographic document signing with server-derived stats" },

  // ─── 9. Pedagogical Records & Sign-Offs ───────────────────────────────────
  { method: "POST", path: "/pedagogy/sign-off", type: "roles", allowedRoles: ["hod", "admin"], description: "Sign-off pedagogical record" },
  { method: "POST", path: "/hod/sign-off", type: "roles", allowedRoles: ["hod", "admin"], description: "HOD pedagogical sign-off" },
  { method: "PUT", path: "/pedagogy/record-of-work/:id", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Update record of work" },

  // ─── 10. HOD Management Subsystem ─────────────────────────────────────────
  { method: "GET", path: "/hod/overview", type: "roles", allowedRoles: ["hod", "admin"], description: "HOD departmental metrics" },
  { method: "POST", path: "/hod/staff", type: "roles", allowedRoles: ["admin", "hod"], description: "Create staff account" },
  { method: "POST", path: "/hod/trainees", type: "roles", allowedRoles: ["admin", "hod"], description: "Create trainee account" },
  { method: "POST", path: "/hod/cohorts", type: "roles", allowedRoles: ["admin", "hod"], description: "Create cohort" },
  { method: "GET", path: "/hod/cohorts", type: "roles", allowedRoles: ["admin", "hod"], description: "List cohorts" },
  { method: "POST", path: "/hod/assign-unit", type: "roles", allowedRoles: ["admin", "hod"], description: "Assign unit offering" },

  // ─── 11. Academic Registrar Subsystem ─────────────────────────────────────
  { method: "POST", path: "/academic/staff", type: "roles", allowedRoles: ["admin", "hod"], description: "Create academic staff" },
  { method: "GET", path: "/academic/staff", type: "roles", allowedRoles: ["admin", "hod"], description: "List academic staff" },
  { method: "POST", path: "/academic/trainees", type: "roles", allowedRoles: ["admin", "hod"], description: "Create academic trainee" },
  { method: "POST", path: "/academic/cohorts", type: "roles", allowedRoles: ["admin", "hod"], description: "Create academic cohort" },
  { method: "GET", path: "/academic/cohorts", type: "roles", allowedRoles: ["admin", "hod"], description: "List academic cohorts" },
  { method: "POST", path: "/academic/assign-unit", type: "roles", allowedRoles: ["admin", "hod"], description: "Assign academic unit" },
  { method: "GET", path: "/academic/offerings", type: "roles", allowedRoles: ["admin", "hod", "trainer"], description: "List academic offerings" },
  { method: "DELETE", path: "/academic/assign-unit/:id", type: "roles", allowedRoles: ["admin", "hod"], description: "Delete academic offering" },
  { method: "POST", path: "/academic/users/:id/reset-password", type: "roles", allowedRoles: ["admin", "hod"], description: "Reset user password" },
  { method: "POST", path: "/departments", type: "roles", allowedRoles: ["admin", "hod"], description: "Create academic department" },

  // ─── 12. Pedagogical Documents (Curriculum) ───────────────────────────────
  { method: "GET", path: "/documents/session-plans", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get session plans" },
  { method: "POST", path: "/documents/session-plans/batch", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Batch save session plans" },
  { method: "GET", path: "/documents/learning-plans", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get learning plans" },
  { method: "POST", path: "/documents/learning-plans/batch", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Batch save learning plans" },
  { method: "GET", path: "/documents/records-of-work", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get records of work" },
  { method: "POST", path: "/documents/records-of-work/batch", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Batch save records of work" },
  { method: "GET", path: "/documents/class-registers", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get class register" },
  { method: "GET", path: "/documents/class-registers/*", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Get class register wildcard" },
  { method: "POST", path: "/documents/class-registers", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Save class register" },
  { method: "POST", path: "/documents/class-registers/*", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Save class register wildcard" },

  // ─── 13. System Administration ────────────────────────────────────────────
  { method: "GET", path: "/admin/overview", type: "roles", allowedRoles: ["admin"], description: "Admin dashboard overview" },
  { method: "POST", path: "/admin/users", type: "roles", allowedRoles: ["admin"], description: "Admin user management" },
  { method: "POST", path: "/admin/maintenance/:action", type: "roles", allowedRoles: ["admin"], description: "Admin system maintenance actions" },
  { method: "GET", path: "/audit-logs", type: "roles", allowedRoles: ["hod", "admin"], description: "Audit trail log viewer" },

  // ─── 14. Assessment Evidence Subsystem ────────────────────────────────────
  { method: "GET", path: "/evidence", type: "scoped-in-handler", allowedRoles: ["trainee", "trainer", "hod", "admin"], hasBolaCheck: true, description: "List assessment evidence" },
  { method: "GET", path: "/evidence/:id", type: "scoped-in-handler", allowedRoles: ["trainee", "trainer", "hod", "admin"], hasBolaCheck: true, description: "Get evidence details" },
  { method: "GET", path: "/evidence/:id/file", type: "scoped-in-handler", allowedRoles: ["trainee", "trainer", "hod", "admin"], hasBolaCheck: true, description: "Download evidence file" },
  { method: "GET", path: "/evidence/:id/download", type: "scoped-in-handler", allowedRoles: ["trainee", "trainer", "hod", "admin"], hasBolaCheck: true, description: "Download evidence file alias" },
  { method: "POST", path: "/evidence", type: "roles", allowedRoles: ["trainee", "admin"], description: "Upload assessment evidence" },
  { method: "PUT", path: "/evidence/:id/verify", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Verify assessment evidence" },
  { method: "PUT", path: "/evidence/:id/grade", type: "roles", allowedRoles: ["trainer", "hod", "admin"], description: "Grade assessment evidence" },
  { method: "DELETE", path: "/evidence/:id", type: "scoped-in-handler", allowedRoles: ["trainee", "admin"], hasBolaCheck: true, description: "Delete assessment evidence" },
];

/**
 * Public routes lookup set for middleware.
 */
export const PUBLIC_ROUTES_SET = new Set(
  ROUTE_ACCESS_POLICY.filter((r) => r.type === "public").map((r) => `${r.method} ${r.path}`)
);

/**
 * Helper to test if a request matches a public route.
 */
export function isPublicRoute(method: string, reqPath: string): boolean {
  const normMethod = method.toUpperCase();
  const clean = reqPath.split("?")[0].replace(/\/+$/, "") || "/";

  for (const rule of ROUTE_ACCESS_POLICY) {
    if (rule.type !== "public" || rule.method !== normMethod) continue;
    // Parameterized or wildcard matching
    const pattern = new RegExp(
      "^" +
        rule.path
          .replace(/:[a-zA-Z0-9_]+/g, "[^/]+")
          .replace(/\/\*/g, "(?:/.*)?") +
        "$"
    );
    if (pattern.test(clean) || pattern.test(reqPath)) {
      return true;
    }
  }
  return false;
}
