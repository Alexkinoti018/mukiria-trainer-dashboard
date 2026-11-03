# Security Breach & Data Exposure Assessment

> **Generated:** 2026-10-29  
> **System:** Mukiria Technical Training Institute (MTTI) Academic ERP & Assessment Engine  
> **Standard:** ISO/IEC 27001 / OWASP Top 10 (2021) / Kenya Data Protection Act (KDPA 2019)  
> **Classification:** CONFIDENTIAL AUDIT REPORT  

---

## Executive Summary

A comprehensive integrity and security audit of the MTTI Trainer Dashboard codebase reveals **multiple active attack vectors** that allow complete system compromise, administrative account takeover, unauthorized access to candidate exam submissions, unauthenticated harvesting of trainee Personally Identifiable Information (PII), and exposure of committed plaintext credentials.

---

## 1. Threat & Exposure Breakdown

### BREACH-01: Unsigned JWT Signature Acceptance (Administrative Takeover)
- **Vulnerability:** In `server/auth.ts` (lines 143–166), cryptographic signature validation is enclosed in `if (secret) { ... }`. When the `SUPABASE_JWT_SECRET` environment variable is not explicitly supplied in production, signature verification is skipped completely.
- **Affected Parties:** All system users, administrators, trainers, and trainees.
- **Exposure Mechanism:** An external attacker sends an arbitrary HTTP request with:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.<base64-payload-claiming-admin>.unsigned
  ```
  The backend parses the claims without cryptographic verification, promoting the caller to `admin` role with global write permissions.
- **Confidence Level:** **High (Confirmed by source code inspection and unit tests).**
- **Severity:** **CRITICAL (CVSS 9.8)**

---

### BREACH-02: Hardcoded JWT Secret Fallback in Public Source
- **Vulnerability:** In `server/routes.ts` (line 756) and `server/middleware/auth.ts` (line 33), token signing and verification fall back to a static string: `"mtti-enterprise-jwt-secret-secure-key-2026"`.
- **Affected Parties:** Entire institutional infrastructure.
- **Exposure Mechanism:** Any party with read access to the source code repository or compiled client bundles can forge valid HMAC-SHA256 tokens for any role (ADMIN, HOD, TRAINER, TRAINEE).
- **Confidence Level:** **High (Verified in code).**
- **Severity:** **CRITICAL (CVSS 9.8)**

---

### BREACH-03: Committed Plaintext Staff Password in Migration 15
- **Vulnerability:** In `database/migrations/15_unified_user_management.sql` (lines 30–31), initial administrative, HOD, and trainer accounts are seeded with a shared bcrypt hash, and the **plaintext password is documented verbatim** in the SQL header comment.
- **Affected Parties:** System administrators, CI & EE Heads of Department, and lead trainers.
- **Exposure Mechanism:** Anyone with repository access or database seed access can authenticate as the default administrator or HOD using the committed credential.
- **Confidence Level:** **High (Verified at lines 30–31 of migration 15; plaintext withheld per safety rules).**
- **Severity:** **CRITICAL (CVSS 9.1)**

---

### BREACH-04: Full Exam Submissions Leak via Unauthenticated `/api/submissions`
- **Vulnerability:** In `server/routes.ts` (lines 2060–2095), `GET /api/submissions` handles unauthenticated requests via:
  ```typescript
  if (!user) {
    res.json(allSubs);
    return;
  }
  ```
- **Affected Parties:** 33+ examined trainees across computing and business cohorts.
- **Exposure Mechanism:** An unauthenticated visitor making `GET /api/submissions` receives an unrestricted JSON array containing:
  - Trainee full names, admission numbers, and class cohorts
  - Complete Section A and Section B CAT answers
  - Objective MCQ choices and essay submissions
  - Assigned grades, scores, rubric evaluations, and trainer feedback
- **Confidence Level:** **High (Confirmed by code inspection).**
- **Severity:** **CRITICAL (CVSS 9.1)**

---

### BREACH-05: Unauthenticated Trainee Identity Enumeration via `/api/trainees/lookup`
- **Vulnerability:** In `server/routes.ts` (lines 1027–1120), `GET /api/trainees/lookup?admission_no=` is mounted prior to the auth middleware and possesses no authorization guard or endpoint-specific rate limiting.
- **Affected Parties:** All registered trainees of Mukiria Technical Training Institute.
- **Exposure Mechanism:** An automated script querying incremental registration numbers (e.g., 10000 through 15000) extracts full student names, cohort codes, class codes, and enrolled departments. If an admission number exists, it returns HTTP 200 with full metadata; if absent, HTTP 404.
- **Confidence Level:** **High (Confirmed by code inspection).**
- **Severity:** **HIGH (CVSS 7.5)**

---

### BREACH-06: Hardcoded Personal Identifiable Information (PII) in Source & Data Files
- **Vulnerability:** Institutional student records, including personal phone numbers, are hardcoded into public repository files rather than loaded from secure encrypted storage:
  - `server/routes.ts`: 89 trainees in `OFFICIAL_INSTITUTIONAL_ROSTER` (lines 810–935) and 23 trainees in `DB.trainees` (lines 90–120).
  - `server/data/users.json`: 20 user records containing 12 real Kenyan phone numbers (`+254...`) and password hashes.
  - `server/data/trainees.json`: 3 trainee profiles with 2 real phone numbers.
  - `client/public/assessment-papers/`: 11 PDF files containing official institutional assessment papers and student checklists.
- **Affected Parties:** Over 110 institutional candidates, minors/young adults enrolled in vocational training.
- **Confidence Level:** **High (Confirmed by filesystem audit).**
- **Severity:** **HIGH (KDPA 2019 Non-Compliance)**

---

### BREACH-07: Unauthenticated Evidence Download & Deletion
- **Vulnerability:**
  - `GET /api/evidence/:id/download` (line 3392) allows unauthenticated downloads of student practical evidence.
  - `DELETE /api/evidence/:id` (line 3591) lacks authentication middleware; although it checks `req.user`, the route was missing route-level protection, exposing it to manipulation when demo authentication is active.
- **Affected Parties:** Candidates submitting practical portfolios and continuous assessment evidence.
- **Severity:** **HIGH (CVSS 7.5)**

---

### BREACH-08: Client-Side Header-Based Spoofing Path
- **Vulnerability:** Frontend components (`AuthContext.tsx`, `AdminDashboard.tsx`, `CandidatePortal.tsx`) transmit unverified identity headers (`x-user-role: admin`, `x-user-id`, `x-user-reg`).
- **Exposure Mechanism:** When `allowDemoAuth` is true (default in dev/test/staging environments without explicit `AUTH_MODE=supabase`), `server/auth.ts` lines 265–295 resolves any caller claiming `x-user-role: admin` into an active administrative user.
- **Confidence Level:** **High.**
- **Severity:** **HIGH (CVSS 8.5)**

---

### BREACH-09: Permanent Caching of Sensitive API Responses in Service Worker
- **Vulnerability:** In `client/public/sw.js` (lines 79–90), the service worker applies a network-first caching strategy to **all** successful same-origin `GET` requests without excluding `/api/*`.
- **Affected Parties:** Trainees and staff utilizing shared laboratory computers or mobile devices.
- **Exposure Mechanism:** Sensitive responses from `/api/trainees`, `/api/submissions`, and `/api/attendance` are stored permanently in the browser's `CacheStorage` (`mtti-pwa-v10`), allowing physical or local inspection after logout.
- **Confidence Level:** **High.**
- **Severity:** **MEDIUM (CVSS 5.3)**

---

## 2. Regulatory & Compliance Impact (KDPA 2019)

Under the **Kenya Data Protection Act, 2019**:
1. **Section 29 (Duty to Notify):** An unauthorized disclosure of candidate examination records, personal telephone numbers, and registration numbers constitutes a reportable breach.
2. **Section 41 (Principles of Data Protection):** Storing trainee PII in unencrypted repository code violates the principles of integrity, confidentiality, and data minimization.
3. **Sections 42 & 43 (Security Measures):** Retaining hardcoded cryptographic keys and unverified JWT authentication fails the statutory standard for appropriate technical and organizational safeguards.

---

## 3. Exposure Summary Table

| Breach ID | Threat Vector | Affected Data | Affected Count | Severity | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BREACH-01** | Unsigned JWT Acceptance | Full Backend / Database | All System Records | CRITICAL | High |
| **BREACH-02** | Hardcoded JWT Fallback Secret | All Authenticated Endpoints | All Roles | CRITICAL | High |
| **BREACH-03** | Committed Plaintext Staff Password | Admin/HOD/Trainer Accounts | All Staff | CRITICAL | High |
| **BREACH-04** | Unauthenticated Submissions Endpoint | CAT Answers, Grades, Feedback | 33+ Trainees | CRITICAL | High |
| **BREACH-05** | Unauthenticated Trainee Lookup | Full Names, Cohorts, Departments | 110+ Trainees | HIGH | High |
| **BREACH-06** | Hardcoded PII in Source Files | Names, Reg Numbers, Phones | 112 Trainees / Staff | HIGH | High |
| **BREACH-07** | Unauthenticated Evidence Access | Practical Exam Portfolios | All Examinees | HIGH | High |
| **BREACH-08** | Header-Trust Privilege Escalation | Admin / Staff Capabilities | Whole System | HIGH | High |
| **BREACH-09** | PWA Service Worker Cache Leakage | Local Disk Cache of API Data | Shared Devices | MEDIUM | High |
