/**
 * Mukiria Technical Training Institute (MTTI)
 * Phase 1 Staff Password Rotation Script
 * File: scripts/rotate_staff_passwords.mjs
 *
 * Usage:
 *   STAFF_NEW_PASSWORD="your-strong-production-password" node scripts/rotate_staff_passwords.mjs
 *
 * Invariants:
 * - Reads STAFF_NEW_PASSWORD strictly from environment variable.
 * - NEVER prints, logs, or writes the plaintext password to files/terminal.
 * - Updates staff accounts (trainer, hod, admin) in PostgreSQL users table and local store.
 */

import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;

async function rotateStaffPasswords() {
  const newPassword = (process.env.STAFF_NEW_PASSWORD || "").trim();

  if (!newPassword) {
    console.error("❌ Error: STAFF_NEW_PASSWORD environment variable is required and cannot be empty.");
    process.exit(1);
  }

  if (newPassword.length < 12) {
    console.error("❌ Error: STAFF_NEW_PASSWORD must be at least 12 characters long for production security.");
    process.exit(1);
  }

  console.log("🔒 Generating cryptographic bcrypt hash for new staff credentials (salt rounds: 10)...");
  const newHash = await bcrypt.hash(newPassword, 10);

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
      const res = await pool.query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE LOWER(role) IN ('trainer', 'hod', 'admin')
         RETURNING id, role, email`,
        [newHash]
      );
      updatedDbCount = res.rowCount;
      console.log(`✅ Successfully rotated passwords for ${updatedDbCount} staff account(s) in PostgreSQL.`);
      for (const row of res.rows) {
        console.log(`   - Account: ${row.email || row.id} [Role: ${row.role}]`);
      }
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
          u.password_hash = newHash;
          u.updated_at = new Date().toISOString();
          updatedLocalCount++;
        }
      }
      fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2), "utf8");
      console.log(`✅ Successfully updated ${updatedLocalCount} staff account(s) in server/data/users.json.`);
    } catch (fsErr) {
      console.warn("⚠️ Warning: Could not update server/data/users.json:", fsErr.message);
    }
  }

  console.log("✨ Staff password rotation completed successfully.");
}

rotateStaffPasswords().catch((err) => {
  console.error("❌ Fatal rotation error:", err.message);
  process.exit(1);
});
