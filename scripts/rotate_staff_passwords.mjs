/**
 * Mukiria Technical Training Institute (MTTI)
 * Phase 1 Staff Password Rotation Script
 * File: scripts/rotate_staff_passwords.mjs
 *
 * Usage:
 *   STAFF_PASSWORDS_JSON='{"staff-one@example.test":"UniquePasswordOne!","staff-two@example.test":"UniquePasswordTwo!"}' node scripts/rotate_staff_passwords.mjs
 *
 * Invariants:
 * - Reads credentials strictly from environment variables.
 * - NEVER prints, logs, or stores plaintext passwords in files or terminal output.
 * - Updates staff accounts (trainer, hod, admin) in the PostgreSQL users table.
 */

import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

function parsePasswordMap() {
  if (!process.env.STAFF_PASSWORDS_JSON) {
    throw new Error("Provide STAFF_PASSWORDS_JSON with a distinct password for each account.");
  }

  const parsed = JSON.parse(process.env.STAFF_PASSWORDS_JSON);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("STAFF_PASSWORDS_JSON must be a JSON object keyed by account email or ID.");
  }
  return parsed;
}

function resolvePasswordForAccount(account, passwordMap) {
  const email = (account.email || "").toLowerCase().trim();
  return passwordMap[email] || passwordMap[account.id] || null;
}

function preparePasswordAssignments(accounts, passwordMap) {
  const usedPasswords = new Set();
  const assignments = [];

  for (const account of accounts) {
    const password = resolvePasswordForAccount(account, passwordMap);
    if (!password) {
      console.warn(`⚠️ Skipping account ${account.email || account.id}: No per-account password configured.`);
      continue;
    }
    if (typeof password !== "string" || password.length < 12) {
      throw new Error(`Password for account ${account.email || account.id} must be a string of at least 12 characters.`);
    }
    if (usedPasswords.has(password)) {
      throw new Error("Each staff account must be assigned a unique password.");
    }
    usedPasswords.add(password);
    assignments.push({ account, password });
  }

  return assignments;
}

async function rotateStaffPasswords() {
  const passwordMap = parsePasswordMap();

  console.log("🔒 Initializing cryptographic bcrypt hash generation for staff accounts (salt rounds: 12)...");

  let updatedDbCount = 0;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required; repository JSON data is never modified.");
  }

  console.log("🔌 Connecting to PostgreSQL database...");
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    },
    connectionTimeoutMillis: 5000,
  });

  try {
    const fetchRes = await pool.query(
      `SELECT id, role, email FROM users WHERE LOWER(role) IN ('trainer', 'hod', 'admin')`
    );
    const assignments = preparePasswordAssignments(fetchRes.rows, passwordMap);

    for (const { account, password } of assignments) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [hash, account.id]
      );
      updatedDbCount++;
      console.log(`   - Rotated password for account: ${account.email || account.id} [Role: ${account.role}]`);
    }
    console.log(`✅ Successfully rotated passwords for ${updatedDbCount} staff account(s) in PostgreSQL.`);
    console.log("✨ Staff password rotation completed successfully. Zero plaintext passwords logged.");
  } finally {
    await pool.end();
  }
}

rotateStaffPasswords().catch((err) => {
  console.error("❌ Fatal rotation error:", err.message);
  process.exit(1);
});
