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
  - `ALLOW_DEMO_AUTH`: Strictly forbidden in production. If set to `true` when `NODE_ENV=production`, the application will abort startup immediately.

### 2. Preview Deployment Verification Gating
- Nothing merges to `main` until Phase 1 changes (and all subsequent security audit phases) have been successfully deployed and verified on a Vercel preview deployment.

### 3. Local Development
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Backfill user profile links (Phase 1)
node scripts/backfill_user_profiles.mjs

# Run test suites
npm test

# Run TypeScript checks
npm run check
```
