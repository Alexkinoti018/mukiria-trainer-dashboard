/**
 * Mukiria Technical Training Institute (MTTI)
 * Phase 1 Staff Password Rotation Script
 * File: scripts/rotate_staff_passwords.mjs
 *
 * Usage:
 *   # Option A: Rotate using role-specific or per-account passwords
 *   ADMIN_NEW_PASSWORD="strong-admin-pass" HOD_NEW_PASSWORD="strong-hod-pass" TRAINER_NEW_PASSWORD="strong-trainer-pass" node scripts/rotate_staff_passwords.mjs
 *
 *   # Option B: Rotate using specific per-account JSON mapping
 *   STAFF_PASSWORDS_JSON='{"admin@mtti.ac.ke":"pass1...","trainer@mtti.ac.ke":"pass2..."}' node scripts/rotate_staff_passwords.mjs
 *
 *   # Option C: Rotate all staff accounts to a new shared password
 *   STAFF_NEW_PASSWORD="your-strong-production-password" node scripts/rotate_staff_passwords.mjs
 *
 * Invariants:
 * - Reads credentials strictly from environment variables.
 * - NEVER prints, logs, or stores plaintext passwords in files or terminal output.
 * - Updates staff accounts (trainer, hod, admin) in PostgreSQL users table and local store.
 */

import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

function resolvePasswordForAccount(account) {
  const email = (account.email || "").toLowerCase().trim();
  const role = (account.role || "").toLowerCase().trim();

  // 1. Check per-account JSON map if provided
  if (process.env.STAFF_PASSWORDS_JSON) {
    try {
      const map = JSON.parse(process.env.STAFF_PASSWORDS_JSON);
      if (map[email]) return map[email];
      if (map[account.id]) return map[account.id];
    } catch (e) {
      console.warn("⚠️ Warning: Failed to parse STAFF_PASSWORDS_JSON environment variable.");
    }
  }

  // 2. Check role-specific environment variables
  if (role === "admin" && process.env.ADMIN_NEW_PASSWORD) {
    return process.env.ADMIN_NEW_PASSWORD;
  }
  if (role === "hod" && process.env.HOD_NEW_PASSWORD) {
    return process.env.HOD_NEW_PASSWORD;
  }
  if (role === "trainer" && process.env.TRAINER_NEW_PASSWORD) {
    return process.env.TRAINER_NEW_PASSWORD;
  }

  // 3. Fallback to global STAFF_NEW_PASSWORD
  if (process.env.STAFF_NEW_PASSWORD) {
    return process.env.STAFF_NEW_PASSWORD;
  }

  return null;
}

async function rotateStaffPasswords() {
  const hasConfig =
    process.env.STAFF_PASSWORDS_JSON ||
    process.env.ADMIN_NEW_PASSWORD ||
    process.env.HOD_NEW_PASSWORD ||
    process.env.TRAINER_NEW_PASSWORD ||
    process.env.STAFF_NEW_PASSWORD;

  if (!hasConfig) {
    console.error("❌ Error: No rotation passwords provided.");
    console.error("   Provide either STAFF_NEW_PASSWORD, role variables (ADMIN_NEW_PASSWORD, HOD_NEW_PASSWORD, TRAINER_NEW_PASSWORD), or STAFF_PASSWORDS_JSON.");
    process.exit(1);
  }

  console.log("🔒 Initializing cryptographic bcrypt hash generation for staff accounts (salt rounds: 10)...");

  let updatedDbCount = 0;
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
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

      for (const user of fetchRes.rows) {
        const pass = resolvePasswordForAccount(user);
        if (!pass) {
          console.warn(`⚠️ Skipping account ${user.email || user.id}: No password configured.`);
          continue;
        }
        if (pass.length < 12) {
          console.error(`❌ Error: Password for ${user.email || user.id} is shorter than 12 characters.`);
          process.exit(1);
        }

        const hash = await bcrypt.hash(pass, 10);
        await pool.query(
          `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
          [hash, user.id]
        );
        updatedDbCount++;
        console.log(`   - Rotated password for account: ${user.email || user.id} [Role: ${user.role}]`);
      }
      console.log(`✅ Successfully rotated passwords for ${updatedDbCount} staff account(s) in PostgreSQL.`);
    } catch (dbErr) {
      console.error("❌ Database password update failed:", dbErr.message);
      await pool.end();
      process.exit(1);
    } finally {
      await pool.end();
    }
  } else {
    console.warn("⚠️ DATABASE_URL not set; skipping direct PostgreSQL update.");
  }

  // Update local persistent store if present
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const usersFilePath = path.resolve(__dirname, "../server/data/users.json");

  if (fs.existsSync(usersFilePath)) {
    try {
      const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
      let updatedLocalCount = 0;
      for (const u of usersData) {
        const role = (u.role || "").toLowerCase();
        if (role === "trainer" || role === "hod" || role === "admin") {
          const pass = resolvePasswordForAccount(u);
          if (pass && pass.length >= 12) {
            u.password_hash = await bcrypt.hash(pass, 10);
            u.updated_at = new Date().toISOString();
            updatedLocalCount++;
          }
        }
      }
      fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2), "utf8");
      console.log(`✅ Successfully updated ${updatedLocalCount} staff account(s) in server/data/users.json.`);
    } catch (fsErr) {
      console.warn("⚠️ Warning: Could not update server/data/users.json:", fsErr.message);
    }
  }

  console.log("✨ Staff password rotation completed successfully. Zero plaintext passwords logged.");
}

rotateStaffPasswords().catch((err) => {
  console.error("❌ Fatal rotation error:", err.message);
  process.exit(1);
});
