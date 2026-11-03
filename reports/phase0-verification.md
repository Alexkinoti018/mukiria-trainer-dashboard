# Phase 0 Verification & Baseline Capture Report
**Repository:** Mukiria Technical Training Institute (MTTI) Trainer Dashboard (`mukiria-trainer-dashboard`)  
**Git Branch:** `hardening/auth-persistence`  
**Timestamp:** 2026-10-25T11:28:00+03:00 (EAT)  
**Lead Systems Architect & Security Engineer:** Antigravity Principal Systems Architect  

---

## 1. Executive Summary & Safety Mandate

In strict adherence to the mandate for **Zero Data Loss and Irreplaceable Institutional Data Preservation**, all institutional trainee rosters, continuous assessment marks, attendance registers, session plans, learning plans, records of work, and exam submission records have been verified, backed up, and cryptographically hashed before introducing any code modifications.

- **Active Working Branch:** `hardening/auth-persistence` (strictly isolated from `main`)
- **Secure Backups:**
  - `backup/20261025-1120/` (contains 30 fixture, seed, and migration files with `MANIFEST.txt` containing SHA-256 checksums)
  - `backup/2026-10-25T08-02-51-850Z/` (ISO-format redundant mirror with SHA-256 checksums)
- **Baseline Verification:**
  - `npm ci --legacy-peer-deps`: 816 packages installed, 0 vulnerabilities / peer conflicts.
  - `npm run check` (`tsc --noEmit`): **0 TypeScript compiler errors**.
  - `npm test` (`vitest run --root .`): **337/337 unit and integration tests passing** across 27 test files (100% pass rate).
  - `npm run build`: Production client bundle and server bundle (`dist/index.js`, 419.0 kB) compiled cleanly.
  - Captured full logs in `reports/baseline.txt`.

---

## 2. Phase 0 Comprehensive Verification Table

| Claim | Verified (Yes/No) | Evidence | Risk |
| :--- | :---: | :--- | :--- |
| **A. Baseline Stability**<br>The codebase installs cleanly with npm, compiles without TypeScript errors, passes all 337 tests, and builds production bundles without pre-existing failures. | **YES** | `reports/baseline.txt`: `tsc --noEmit` exits 0. Vitest reports `27 passed (27)`, `Tests: 337 passed (337)`. Vite and esbuild create production client and server bundles cleanly. | **Low**<br>Stable baseline established before making any modifications. |
| **B. Unverified Header Authentication & Hardcoded Tokens**<br>`server/routes.ts` `authenticateUser` trusts arbitrary `x-user-*` headers without cryptographic signature or token verification, and relies on hardcoded bearer tokens (`token-trainer-001`, `token-admin`, etc.). | **YES** | `server/routes.ts` lines 500–552: lines 511–530 check static tokens; lines 532–548 extract `x-user-role`, `x-user-id`, `x-user-dept` directly into `req.user`. Actively sent by `AuthContext.tsx` (lines 216–227 monkey-patched `fetch`), `AdminDashboard.tsx` (lines 153, 188, 245), `CandidatePortal.tsx` (lines 640–642), and asserted across 20 test cases in `tests/centralized_database_and_register_fidelity.test.ts`, `tests/master_audit_integration.test.ts`, and `tests/rbac_security.test.ts`. | **Critical**<br>Privilege escalation and unauthorized identity impersonation if deployed to production without cryptographic verification. |
| **C. Persistence & Split-Brain In-Memory Mutations**<br>`server/db.ts` only mutates in-memory JavaScript arrays when Postgres is disconnected, silently ignoring writes without throwing errors. `getFixturePath` prioritizes `database/seeds/` over `server/data/`. | **YES** | `server/db.ts` lines 21–25: `getFixturePath` checks `SEEDS_DIR` first. Lines 164–292: `savePersistentAttendance`, `savePersistentTrainees`, etc., only execute `memoryArray = [...records]` without persisting to disk. In line 316: `saveAttendanceBatch` exits silently (`if (!pool || records.length === 0) return;`) if PostgreSQL pool is null. | **High**<br>Silent data loss on server restart or transient database disconnects; divergence between memory and disk fixtures. |
| **D. Insecure Security & Network Defaults**<br>`server/db.ts` defaults to hardcoded project ref with `ssl: { rejectUnauthorized: false }`. `api/index.ts` exposes unrestricted 50MB request body limits. No helmet or rate-limiting middleware is configured. | **YES** | `server/db.ts` line 38 (`PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "bzlnpywjyhhrqapsvczf"`), line 52 (`ssl: { rejectUnauthorized: false }`). `api/index.ts` lines 5–6 (`limit: "50mb"`). Neither `server/index.ts` nor `api/index.ts` imports or uses `helmet`, `cors`, or `express-rate-limit`. | **High**<br>Man-in-the-middle vulnerability on database TLS connection; denial of service / memory exhaustion from unrestricted large request bodies. |
| **E. Package Manager & Patch Inconsistencies**<br>`package.json` specifies `packageManager: pnpm@10.4.1` and `pnpm.patchedDependencies` for `wouter@3.7.1`, but CI (`.github/workflows/ci.yml`) and Vercel (`vercel.json`) use `npm`. The patch is neither applied nor needed. | **YES** | `package.json` line 104 (`"packageManager": "pnpm@10.4.1..."`), line 107 (`"wouter@3.7.1": "patches/wouter@3.7.1.patch"`). Installed package is `wouter@3.10.0`. `patches/wouter@3.7.1.patch` modifies `esm/index.js` to populate `window.__WOUTER_ROUTES__`. `git grep "__WOUTER_ROUTES__"` shows 0 usages in application source code. | **Medium**<br>Tooling drift between local environments, CI, and deployment targets; confusing legacy patch metadata. |
| **F. Data Fixture Duplication & Divergence**<br>Duplicate JSON files exist in both `database/seeds/` and `server/data/`. Because `server/db.ts` loads `database/seeds/` first, `server/data/` files are orphaned, and some contain divergent values. | **YES** | 9 JSON fixtures compared. 5 are identical (`attendance_register.json`, `records_of_work.json`, `session_plans.json`, `trainees.json`, `assessment_evidence.json`). 4 diverge: `assessment_marks.json` (score values differ for trainee-002: cp_avg 78 vs 80), `submissions.json` (154,817 vs 154,848 bytes), `class_registers.json` and `learning_plans.json` (formatting). | **Medium**<br>Multiple sources of truth cause confusion over canonical seed data and risk desynchronization. |
| **G. Business Rule Discrepancies (Level 3 Written Exam)**<br>Documentation and code disagree on Level 3 written exam question format and mark distribution. | **YES** | `.agents/AGENTS.md` line 20: "Sec A: 20m Short answers; Sec B: 30m Short Answers (Total 50)".<br>`gemini-code-1783461101913.md` line 20: "Sec A: 20m True/False, Matching, MCQs; Sec B: 30m Short Answers (Total 50)".<br>`client/src/pages/ExamBuilder.tsx` lines 85–91: Enforces Sec A = 20m, Sec B = 30m Short Answers.<br>`backend/main.py` lines 666–697: Generates Sec A = 5 questions × 2m = 10m; Sec B = 3 questions (choose 2) × 20m = 40m. Total = 50m. | **High**<br>Python curriculum generator generates exams that fail frontend validation in `ExamBuilder.tsx` for Level 3 courses. |
| **H. Python Backend Dependency Inconsistencies**<br>`backend/requirements.txt` is incomplete and specifies unused packages while omitting runtime dependencies. | **YES** | `backend/requirements.txt` specifies `flask==3.0.2`, `pdfplumber==0.11.0`, `python-docx==1.1.2`. `flask` is never imported in `backend/*.py` (`main.py` uses standard library `http.server.ThreadingHTTPServer`). Critical dependencies imported in `backend/main.py` (`fpdf`/`fpdf2`, `PIL`/`Pillow`, `pypdf`) are omitted from `requirements.txt`. | **Medium**<br>Python microservice fails to run in clean or containerized environments due to missing `fpdf`, `Pillow`, and `pypdf`. |

---

## 3. Cryptographic Manifest Summary

Both snapshot backups contain the exact identical set of 30 files across `server/data/`, `database/seeds/`, and `database/migrations/`.

- **Backup Folders:**
  - `backup/20261025-1120/` (Formatted as specified in Task Prompt)
  - `backup/2026-10-25T08-02-51-850Z/` (Redundant timestamped backup)
- **Manifest:** Verified with SHA-256 for all 30 files.

### Key Institutional Fixture Checksums
- `server/data/trainees.json`: `21769aad9f44b7fbcfda6780514c9274f468ad065a0c6e84ce68a94864fd8c47`
- `server/data/attendance_register.json`: `77db23b97be181181099508efa6238c7fdcb98fead03ddcb0f6ace3b345bc836`
- `server/data/assessment_marks.json`: `836f0feb6b06f504e88dc879de922986bb86b5145a031a38d1784ee05c2c4c80`
- `database/seeds/trainees.json`: `21769aad9f44b7fbcfda6780514c9274f468ad065a0c6e84ce68a94864fd8c47`
- `database/migrations/01_master_supabase_migration.sql`: `aa9d1e92f8ac7ceaac25566dcfca23455f8c16e5fdf48a7e2fae4af3afbf04ad`
- `database/migrations/13_reconcile_schema_and_persistence.sql`: `7516b336f4c1170e1ffaa07390adb9a58a8eaea6e3fb3e45f65728d9d8540feb`

---

## 4. Phase 0 Conclusion & Next Step Confirmation

Phase 0 verification is **100% complete**. All findings have been verified against the codebase, tests pass cleanly, builds succeed, and all institutional data is safeguarded in timestamped backups.

> [!IMPORTANT]
> **MANDATORY STOP POINT (SAFETY RULE 6 & PHASE 0 PROTOCOL)**
> As instructed by the safety protocol, execution is now paused.
> No files outside `reports/` and `backup/` have been modified.
> 
> **Awaiting user confirmation to proceed to Phase 1:**
> Please reply with **`PROCEED PHASE 1`** to begin Phase 1: Low-Risk Cleanup & Dependency Unification.
