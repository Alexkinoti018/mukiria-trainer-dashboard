# Mukiria Technical Training Institute (MTTI) Trainer Dashboard

Enterprise training management, pedagogical planning, attendance tracking, and CDACC continuous assessment system.

---

## Security & Deployment Protocol

### 1. Mandatory Environment Variables
- `JWT_SECRET`: A cryptographically strong secret ($\ge 32$ characters) used for signing and verifying HS256 tokens.
  - Generate using:
    ```bash
    openssl rand -base64 48
    ```
  - **CRITICAL DEPLOYMENT INVARIANT:** `JWT_SECRET` must be configured in Vercel for **BOTH Production and Preview environments** prior to pushing code. The API module load check in `server/auth.ts` will immediately fail fast and throw a fatal error if `JWT_SECRET` is missing, shorter than 32 characters, or configured with a known test/placeholder key.
- `ALLOW_DEMO_AUTH`: Strictly forbidden in production. If set to `true` when `NODE_ENV=production` or `NODE_ENV=staging`, the application will abort startup immediately.
- `NODE_ENV`: Secure-by-default. When unset (`""` or undefined) or set to `"staging"`, runtime strictly enforces production security invariants (zero demo tokens, zero header-based auth, mandatory cryptographically verified JWTs).

### 2. Gated Deployment Protocol (Phase 1 & Onwards)

To maintain absolute database and session integrity, all production and preview rollouts must strictly follow this 6-step gated sequence:

1. **Step 1: Configure Secrets in Vercel**
   Set `JWT_SECRET` ($\ge 32$ characters, cryptographically random) in Vercel environment variables for **BOTH Production and Preview environments**. Module boot check in `server/auth.ts` will immediately reject startups if missing or using test/placeholder keys.
2. **Step 2: Apply Staff Department and Phase 1 Profile Migrations**
   On a fresh database, first apply the baseline migrations through 15. Then run the ordered Phase 1 migrations below. This applies `16_staff_department_assignment.sql` before `17_phase1_profile_link.sql`; both are idempotent, so it is safe if migration 16 has already been applied:
   ```bash
   npm run db:phase1
   ```
3. **Step 3: Rotate Seeded Staff Account Passwords in Production**
   Prior to production rollout, all default and seeded staff passwords (trainers, HODs, administrators) must be rotated using a cryptographically strong credential ($\ge 12$ chars) read strictly from the execution environment without logging or persistent plaintext storage:
   ```bash
   STAFF_NEW_PASSWORD="your-strong-production-password" node scripts/rotate_staff_passwords.mjs
   ```
4. **Step 4: Dry-Run Profile Backfill Gate (Mandatory Inspection)**
   Run the profile backfill script with `--dry-run` to inspect all prospective user-to-profile links without modifying any database or persistent storage:
   ```bash
   npx tsx scripts/backfill_user_profiles.mjs --dry-run
   ```
   *Gate Requirement:* Review prospective links and confirm zero unresolved ambiguous collisions before proceeding.
5. **Step 5: Execute Live Profile Backfill**
   Execute the live backfill. All database updates run conditionally with `WHERE profile_id IS NULL` to prevent overwriting existing authoritative associations:
   ```bash
   npx tsx scripts/backfill_user_profiles.mjs
   ```
6. **Step 6: Vercel Preview Deployment & Verification**
   Push the branch to trigger a Vercel preview deployment. Run integration and verification suites against the preview environment.
7. **Step 7: Production Merge & Promotion**
   Only after the preview deployment passes all security and RBAC verification checks, merge the branch into `main`.

New Trainer and HOD accounts receive a one-time temporary password. They must change it at first sign-in before accessing protected features; the password-change endpoint verifies the temporary password and clears `must_change_password`.

### 3. Local Development & Testing
```bash
# Install dependencies
npm install

# Apply department/profile migrations in order (after baseline migrations 01-15)
npm run db:phase1

# Test profile backfill dry run
npx tsx scripts/backfill_user_profiles.mjs --dry-run

# Run full test suite (all 43 files)
npm test

# Run TypeScript checks
npm run check
```
