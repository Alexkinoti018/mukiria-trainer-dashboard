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
2. **Step 2: Apply Database Schema Migration**
   Execute `database/migrations/16_phase1_profile_link.sql` to add the `profile_id` column and indexes to `users` (contains zero automated data rewrites):
   ```bash
   npm run db:migrate
   ```
3. **Step 3: Dry-Run Profile Backfill Gate (Mandatory Inspection)**
   Run the profile backfill script with `--dry-run` to inspect all prospective user-to-profile links without modifying any database or persistent storage:
   ```bash
   npx tsx scripts/backfill_user_profiles.mjs --dry-run
   ```
   *Gate Requirement:* Review prospective links and confirm zero unresolved ambiguous collisions before proceeding.
4. **Step 4: Execute Live Profile Backfill**
   Execute the live backfill. All database updates run conditionally with `WHERE profile_id IS NULL` to prevent overwriting existing authoritative associations:
   ```bash
   npx tsx scripts/backfill_user_profiles.mjs
   ```
5. **Step 5: Vercel Preview Deployment & Verification**
   Push the branch to trigger a Vercel preview deployment. Run integration and verification suites against the preview environment.
6. **Step 6: Production Merge & Promotion**
   Only after the preview deployment passes all security and RBAC verification checks, merge the branch into `main`.

### 3. Local Development & Testing
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Test profile backfill dry run
npx tsx scripts/backfill_user_profiles.mjs --dry-run

# Run full test suite (all 43 files)
npm test

# Run TypeScript checks
npm run check
```
