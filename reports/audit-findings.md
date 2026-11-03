# Full Integrity & Security Audit Findings Report

> **Generated:** 2026-10-29  
> **System:** Mukiria Technical Training Institute (MTTI) Academic ERP & Assessment Engine  
> **Branch:** `audit/integrity-security` (Read-Only Phase 1)  
> **Audit Status:** PHASE 1 COMPLETE — PENDING USER APPROVAL FOR PHASE 2  

---

## Findings Summary Matrix (Sorted by Severity)

| ID | Category | Severity | File & Location | Summary of Finding | Proposed Phase 2 Fix |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **FIND-A01** | A. Errors / Security | **CRITICAL** | `server/auth.ts:143-166` | Unsigned JWT acceptance when `SUPABASE_JWT_SECRET` is unset | Fail fast in production; enforce HMAC-SHA256 signature check unconditionally |
| **FIND-A02** | A. Errors / Security | **CRITICAL** | `server/routes.ts:756`, `server/middleware/auth.ts:33` | Hardcoded static JWT secret fallback string in public source | Remove fallback; fail startup if missing in production; gate dev secret behind `AUTH_MODE=demo` |
| **FIND-F01** | F. Breach / Security | **CRITICAL** | `server/routes.ts:2060-2095` | Unauthenticated `GET /api/submissions` dumps all exam answers & grades | Require authentication and enforce strict BOLA ownership check |
| **FIND-F02** | F. Breach / Security | **CRITICAL** | `database/migrations/15_unified_user_management.sql:30-31` | Committed plaintext staff password in SQL header comment | Delete plaintext comment; invalidate and rotate staff credential hashes |
| **FIND-A03** | A. Errors / Security | **HIGH** | `server/routes.ts:753`, `server/auth.ts:143` | JWT signing secret vs verification secret divergence | Unify issuance and verification onto single `getJwtSecret()` helper |
| **FIND-A04** | A. Errors / Data Integrity | **HIGH** | `server/routes.ts:657-674`, `server/db.ts:114` | Trainee activation updates JSON only; never writes to PostgreSQL | Add SQL `UPDATE users SET password_hash = ...` in PostgreSQL transaction |
| **FIND-A05** | A. Errors / RBAC | **HIGH** | `server/routes.ts:756`, `2088` | Role casing mismatch (`"TRAINEE"` vs `"trainee"`) breaks RBAC guards | Case-normalize roles to uppercase throughout middleware and handlers |
| **FIND-C01** | C. Gaps / Security | **HIGH** | `server/routes.ts:1027, 1124, 1506, 3392` | Missing authentication & RBAC guards on sensitive data endpoints | Mount `requireRoles` and BOLA checks across all unprotected data routes |
| **FIND-C02** | C. Gaps / Validation | **HIGH** | `server/routes.ts` (multiple mutations) | Missing Zod payload validation on critical mutations | Add Zod schema middleware to all mutating routes |
| **FIND-C03** | C. Gaps / Integrity | **HIGH** | `server/routes.ts:2400, 2663` | Missing immutable audit log for grade and marks modifications | Create `assessment_marks_audit` table with trigger/logging on mark changes |
| **FIND-F03** | F. Breach / Security | **HIGH** | `server/routes.ts:1027-1120` | Unauthenticated `/api/trainees/lookup` permits trainee enumeration | Restrict lookup response, require auth, or add strict endpoint rate limiting |
| **FIND-F04** | F. Breach / PII | **HIGH** | `server/routes.ts:810-935`, `server/data/users.json` | 110+ real trainees' PII (names, reg numbers, phone numbers) in code | Migrate institutional roster to PostgreSQL; scrub PII from repository code |
| **FIND-F07** | F. Breach / Security | **HIGH** | `AuthContext.tsx:220`, `server/auth.ts:265` | Header-trust spoofing path allows unverified admin escalation | Disallow `x-user-*` headers in production; remove header transmission when real token exists |
| **FIND-D01** | D. Disconnections | **HIGH** | `server/db.ts`, `server/routes.ts` | Competing data stores; writes succeed without reaching PostgreSQL | Enforce PostgreSQL as authoritative transactional store; treat JSON as seeds |
| **FIND-A06** | A. Errors / Resilience | **MEDIUM** | `server/routes.ts:585, 1053, 1857, etc.` | Direct `pool.query()` calls bypass 503 handling and crash on null pool | Wrap all database queries in safe `query()` with 503 error mapping |
| **FIND-A07** | A. Errors / Testing | **MEDIUM** | `server/db.ts:382-385` | Swallowed database errors in `query()` under non-strict mode | Make `query()` throw 503 on pool absence, preventing silent fake success |
| **FIND-B01** | B. Inconsistencies | **MEDIUM** | `server/auth.ts` vs `server/middleware/auth.ts` | Duplicate and conflicting authentication middleware implementations | Consolidate into single authoritative auth middleware |
| **FIND-B02** | B. Inconsistencies | **MEDIUM** | `.agents/AGENTS.md:20` vs `gemini-code-1783461101913.md:20` | Conflicting exam structure rules (Short answers vs MCQs in Sec A) | Document conflict for stakeholder decision; do not alter exam logic |
| **FIND-B03** | B. Inconsistencies | **MEDIUM** | SQL vs Server vs Client | Mismatched field names (`adm_no`, `admission_number`, `reg_code`) | Add unified normalization mapping layer without modifying SQL columns |
| **FIND-B04** | B. Inconsistencies | **MEDIUM** | `package.json:28` vs `patches/` | Package declaration (`wouter ^3.3.5`) diverges from patch (`3.10.0`) | Pin `wouter` to exact version `3.10.0` in `package.json` |
| **FIND-C04** | C. Gaps / Security | **MEDIUM** | `server/security.ts:52-66` | Permissive CORS configuration falls through to allow all origins | Strictly enforce CORS origin whitelist in production |
| **FIND-C05** | C. Gaps / Hardening | **MEDIUM** | `server/index.ts:27`, `api/index.ts:18` | Excessive 10MB global body limit on all non-upload routes | Lower global limit to 100kb; restrict 10MB to named upload endpoints |
| **FIND-D02** | D. Disconnections | **MEDIUM** | Client Pages vs `server/routes.ts` | 13 client API calls target non-existent backend endpoints | Implement missing endpoints or gracefully handle non-existent routes in client |
| **FIND-E01** | E. Redundancies | **MEDIUM** | `client/src/pages` vs `components` | Duplicate `AdminRosterManagement` component | Consolidate onto single authoritative component |
| **FIND-F05** | F. Breach / Security | **MEDIUM** | `server/routes.ts` (20+ routes) | Database error messages & schema details leaked in HTTP responses | Return generic error messages to client; log details server-side |
| **FIND-F06** | F. Breach / Privacy | **MEDIUM** | `client/public/sw.js:79-90` | Service worker blindly caches API responses containing personal PII | Explicitly exclude `/api/*` routes from Service Worker caching |
| **FIND-E02** | E. Redundancies | **LOW** | `backend/__pycache__`, `debug-collector.js` | Committed Python cache files and 26KB debug collector script | Add to `.gitignore` and remove from tracking |
| **FIND-E03** | E. Redundancies | **LOW** | `package.json` | 7 unused dependencies/devDependencies identified by `depcheck` | Document unused packages for removal after approval |

---

## Detailed Lead Confirmations & Findings

### Category A: Errors & Broken Implementation

#### LEAD-A1: Hardcoded JWT Secret Fallback & Secret Divergence
- **Status:** **CONFIRMED (CRITICAL)**
- **Evidence:**
  - In `server/routes.ts` line 756:
    ```typescript
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "mtti-enterprise-jwt-secret-secure-key-2026";
    ```
  - In `server/middleware/auth.ts` line 33:
    ```typescript
    export function getJwtSecret(): string {
      return process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || "mtti-enterprise-jwt-secret-secure-key-2026";
    }
    ```
  - In `server/auth.ts` line 143:
    ```typescript
    const secret = secretOverride || process.env.SUPABASE_JWT_SECRET;
    if (secret) { ... }
    ```
- **Impact:**
  1. Anyone who knows the static fallback string `"mtti-enterprise-jwt-secret-secure-key-2026"` can forge valid tokens for any user or role.
  2. If only `JWT_SECRET` is provided in production, login signs tokens with `JWT_SECRET`, but `server/auth.ts` evaluates `secret` as `undefined` and skips signature verification completely.
- **Proposed Phase 2 Fix:** Fail startup immediately if JWT secret is missing in production. Unify all token signing and verification on a single validated secret.

#### LEAD-A2: Trainee Activation Fails to Persist to PostgreSQL
- **Status:** **CONFIRMED (HIGH)**
- **Evidence:** In `server/routes.ts` lines 657–674, when `isActivation: true`, the server mutates `existingAdm.password_hash` in memory and invokes `savePersistentUsers(allUsers)`, which only writes to `server/data/users.json`. No SQL query is sent to PostgreSQL.
- **Impact:** Trainees appear activated in local tests, but cannot log in against PostgreSQL in production, receiving HTTP 401 `Invalid credentials`.
- **Proposed Phase 2 Fix:** Add SQL `UPDATE users SET password_hash = $1, ... WHERE id = $2` inside a database transaction.

---

### Category B: Inconsistencies

#### LEAD-B1: Dual Conflicting Auth Middleware & Role Casing
- **Status:** **CONFIRMED (HIGH)**
- **Evidence:**
  - `server/auth.ts` defines lowercase roles (`"trainee" | "trainer" | "hod" | "admin"`).
  - `server/middleware/auth.ts` defines uppercase roles (`"TRAINEE" | "TRAINER" | "HOD" | "ADMIN"`).
  - `database/migrations/15_unified_user_management.sql` enforces `CHECK (role IN ('TRAINEE', 'TRAINER', 'HOD', 'ADMIN'))`.
  - When tokens are decoded, `req.user.role` is uppercase (`"TRAINEE"`), but handler checks compare against `user.role === "trainee"`, causing evaluation to fail.
- **Proposed Phase 2 Fix:** Merge into one middleware file and normalize roles to uppercase throughout.

#### LEAD-B2: Conflicting Level 3 Written Exam Rules
- **Status:** **CONFIRMED (MEDIUM - REPORT ONLY)**
- **Evidence:**
  - `.agents/AGENTS.md` line 20: `Level 3: 50 marks total (Sec A: 20m Short answers; Sec B: 30m Extended Essay / Structured questions)`.
  - `gemini-code-1783461101913.md` line 20: `Level 3: 50 marks total (Sec A: 20m True/False, Matching, MCQs; Sec B: 30m Extended Essay / Structured questions)`.
- **Action:** Reported per safety rules; no code modifications will be made without explicit user instruction.

#### LEAD-B3: Wouter Package & Patch Inconsistency
- **Status:** **CONFIRMED (MEDIUM)**
- **Evidence:** `package.json` requests `"wouter": "^3.3.5"`, while `patches/wouter+3.10.0.patch` strictly requires `wouter@3.10.0`.
- **Proposed Phase 2 Fix:** Pin `"wouter": "3.10.0"` in `package.json`.

---

### Category C: Gaps

#### LEAD-C1: Middleware Application in `server/index.ts` and `api/index.ts`
- **Status:** **CONFIRMED (HIGH)**
- **Evidence:** Both `server/index.ts` and `api/index.ts` import and mount `securityHeaders`, `corsMiddleware`, and `apiRateLimiter`. However:
  1. `securityHeaders` disables Content Security Policy (CSP) when `NODE_ENV !== "production"`.
  2. `corsMiddleware` falls through to allow all origins unconditionally.
  3. Global body limit is set to `10mb` for all requests.
- **Proposed Phase 2 Fix:** Tighten CORS origins, lower global body limit to 100kb, and restrict 10MB to upload endpoints.

---

### Category D: Disconnections

#### LEAD-D1: Competing User & Trainee Stores
- **Status:** **CONFIRMED (HIGH)**
- **Evidence:**
  - Trainees exist in: `trainees` table (Postgres), `OFFICIAL_INSTITUTIONAL_ROSTER` (TS code), `DB.trainees` (TS code), `server/data/trainees.json`, `database/seeds/trainees.json`, `localStorage.mtti_trainees`.
  - Users exist in: `users` table (Postgres), `server/data/users.json`, `localStorage.mtti_demo_session`.
  - Writes to one store frequently fail to propagate to the authoritative database.
- **Proposed Phase 2 Fix:** Route all writes through PostgreSQL in transactions; use JSON only as static seeds during initial setup.

---

### Category E: Redundancies
- **Duplicate Files:** `client/src/pages/AdminRosterManagement.tsx` and `client/src/components/AdminRosterManagement.tsx`.
- **Committed Bytecode:** `backend/__pycache__` and root `__pycache__`.
- **Debug Artifact:** `client/public/__manus__/debug-collector.js` (26KB).
- **Unused Dependencies:** `@hookform/resolvers`, `axios`, `tailwindcss-animate`, `@tailwindcss/typography`, `@types/google.maps`, `autoprefixer`, `postcss`, `tailwindcss`, `tw-animate-css`.

---

### Category F: Data Breach & Security Exposure

#### LEAD-F1: Header-Based Trust & Demo Tokens in Production
- **Status:** **CONFIRMED (CRITICAL)**
- **Evidence:** Client passes `x-user-role: admin`. If `ALLOW_DEMO_AUTH` is active or `NODE_ENV !== "production"`, `server/auth.ts` grants full administrative privileges without verification.
- **Proposed Phase 2 Fix:** Enforce `AUTH_MODE=supabase` in production; reject all `x-user-*` headers; remove mock tokens from production builds.

#### LEAD-F2: Committed Plaintext Staff Password in Migration 15
- **Status:** **CONFIRMED (CRITICAL)**
- **Evidence:** Lines 30–31 of `database/migrations/15_unified_user_management.sql` contain the plaintext password in a comment above staff account inserts.
- **Proposed Phase 2 Fix:** Delete the comment and rotate password hashes.

#### LEAD-F3: Unauthenticated Trainee Lookup Enumeration
- **Status:** **CONFIRMED (HIGH)**
- **Evidence:** `GET /api/trainees/lookup?admission_no=13254` returns full student name, department, and class code without authentication or rate limiting.
- **Proposed Phase 2 Fix:** Require authentication or rate limit and return minimal boolean verification status.

---

## Verification Check Before Phase 2
- Baseline verification recorded in `reports/baseline.txt`.
- SHA-256 backup verified in `backup/20261029-1912/MANIFEST.txt`.
- Branch is `audit/integrity-security`.
- **Awaiting User Confirmation:** `"PROCEED PHASE 2"`
