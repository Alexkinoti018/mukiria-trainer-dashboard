# API Route Security & Authorization Matrix

> **Generated:** 2026-10-29  
> **Source:** `server/routes.ts` (Total Routes: 50)  
> **Stack:** Express 4.x on Node.js / Vercel Serverless Function  

| Line | Method | Path | Authentication | Required Role(s) | Ownership / Scope Check | Validation |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| 581 | `GET` | `/api/health` | None (Pre-auth) | None (Public) | None | None (Manual/Loose) |
| 612 | `POST` | `/api/auth/register-trainee` | None (Pre-auth) | None (Public) | None | None (Manual/Loose) |
| 718 | `POST` | `/api/auth/login` | None (Pre-auth) | None (Public) | None | None (Manual/Loose) |
| 1027 | `GET` | `/api/trainees/lookup` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 1124 | `GET` | `/api/trainees` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 1227 | `POST` | `/api/trainees` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | Yes (Zod) |
| 1506 | `GET` | `/api/attendance` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | Trainee self-check (BOLA) | None (Manual/Loose) |
| 1594 | `POST` | `/api/attendance/mark` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | Trainee self-check (BOLA) | None (Manual/Loose) |
| 1703 | `POST` | `/api/attendance/bulk` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | Trainee self-check (BOLA) | None (Manual/Loose) |
| 1850 | `GET` | `/api/exams` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 1887 | `POST` | `/api/exams` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 1935 | `GET` | `/api/departments` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 1954 | `POST` | `/api/departments` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 2008 | `GET` | `/api/exams/:id` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2060 | `GET` | `/api/submissions` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2106 | `GET` | `/api/submissions/:id` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2157 | `POST` | `/api/submissions` | Yes (Route guard) | TRAINEE,ADMIN | None | None (Manual/Loose) |
| 2375 | `PUT` | `/api/submissions/:id/submit` | Yes (Route guard) | TRAINEE,ADMIN | None | None (Manual/Loose) |
| 2393 | `POST` | `/api/submissions/:id/grade` | Yes (Route guard) | TRAINER,ADMIN | None | None (Manual/Loose) |
| 2426 | `POST` | `/api/submissions/:id/reopen` | Yes (Route guard) | TRAINER,ADMIN | None | None (Manual/Loose) |
| 2452 | `GET` | `/api/assessment-marks/:offeringId` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | Trainee self-check (BOLA) | None (Manual/Loose) |
| 2656 | `GET` | `/api/marks` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 2663 | `POST` | `/api/marks/batch` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2664 | `POST` | `/api/assessment-marks/batch` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2682 | `GET` | `/api/hod/overview` | Yes (Route guard) | HOD,ADMIN | None | None (Manual/Loose) |
| 2776 | `POST` | `/api/pedagogy/sign-off` | Yes (Route guard) | HOD,ADMIN | None | None (Manual/Loose) |
| 2777 | `POST` | `/api/hod/sign-off` | Yes (Route guard) | HOD,ADMIN | None | None (Manual/Loose) |
| 2780 | `PUT` | `/api/pedagogy/record-of-work/:id` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2803 | `GET` | `/api/documents/session-plans` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2819 | `POST` | `/api/documents/session-plans/batch` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 2870 | `GET` | `/api/documents/learning-plans` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2883 | `POST` | `/api/documents/learning-plans/batch` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 2930 | `GET` | `/api/documents/records-of-work` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 2943 | `POST` | `/api/documents/records-of-work/batch` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3040 | `GET` | `/api/documents/class-registers` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3041 | `GET` | `/api/documents/class-registers/*` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3042 | `POST` | `/api/documents/class-registers` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3043 | `POST` | `/api/documents/class-registers/*` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3048 | `GET` | `/api/admin/overview` | Yes (Route guard) | ADMIN | None | None (Manual/Loose) |
| 3058 | `POST` | `/api/admin/users` | Yes (Route guard) | ADMIN | None | None (Manual/Loose) |
| 3064 | `POST` | `/api/admin/maintenance/:action` | Yes (Route guard) | ADMIN | None | None (Manual/Loose) |
| 3152 | `POST` | `/api/trainees/batch` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 3307 | `GET` | `/api/evidence` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 3339 | `GET` | `/api/evidence/:id` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 3362 | `GET` | `/api/evidence/:id/file` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 3392 | `GET` | `/api/evidence/:id/download` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |
| 3421 | `POST` | `/api/evidence` | Yes (Route guard) | TRAINEE,ADMIN | None | None (Manual/Loose) |
| 3463 | `PUT` | `/api/evidence/:id/verify` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3493 | `PUT` | `/api/evidence/:id/grade` | Yes (Route guard) | TRAINER,HOD,ADMIN | None | None (Manual/Loose) |
| 3591 | `DELETE` | `/api/evidence/:id` | Implicit (apiRouter.use(authenticateUser)) - Non-blocking | None (Public) | None | None (Manual/Loose) |

## Critical Observations on Route Matrix

1. **Non-Blocking Global Auth Middleware (`apiRouter.use(authenticateUser)` at line 798):**
   - The global middleware does not reject unauthenticated requests. It only populates `req.user` if a valid token or header is present. If absent, it calls `next()` with `req.user = undefined`.
   - Consequently, any endpoint without an explicit `requireRoles(...)` guard is **fully public to the open internet**, unless manually guarded inside the handler.

2. **Unauthenticated PII & Mark Exposure:**
   - `GET /api/trainees/lookup`: Line 1027 — No auth. Anyone can enumerate student identities and cohorts.
   - `GET /api/trainees`: Line 1124 — No auth. Returns entire institutional roster of students.
   - `GET /api/submissions`: Line 2060 — If `req.user` is undefined, explicitly returns ALL submissions: `if (!user) { res.json(allSubs); return; }`.
   - `POST /api/marks/batch` & `POST /api/assessment-marks/batch`: Lines 2663-2664 — No route guard middleware. Handler checks `if (!user) return 401`, but lacks Zod schema validation.
   - `GET /api/attendance`: Line 1506 — No auth. Returns all institutional attendance records.
   - `GET /api/evidence/:id/download`: Line 3392 — No auth. Allows direct unauthenticated download of candidate assessment evidence files.

3. **Missing Zod Validation on Mutations:**
   - Out of 50 routes, only `POST /api/trainees` (line 1227) uses `validateBody(TraineeCreateSchema)`. All other mutations (`POST /api/exams`, `POST /api/submissions`, `POST /api/attendance/bulk`, `POST /api/marks/batch`, `POST /api/evidence`) parse `req.body` manually without schema enforcement.
