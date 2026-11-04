/**
 * Mukiria Technical Training Institute (MTTI)
 * Phase 1 One-Time Profile Link Backfill Script
 * File: scripts/backfill_user_profiles.mjs
 */

import {
  ensurePoolAvailable,
  pool,
  loadPersistentUsers,
  savePersistentUsers,
  loadPersistentTrainees,
} from "../server/db.ts";

export function normalizeAdmissionIdentifier(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function runBackfill() {
  console.log("=== Starting Phase 1 Profile ID Backfill ===");
  ensurePoolAvailable();

  let dbUsers = [];
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM users");
      dbUsers = res.rows;
    } catch (err) {
      console.warn("Could not query users from DB, falling back to local users:", err.message);
    }
  }

  const localUsers = loadPersistentUsers();
  const allUsers = dbUsers.length > 0 ? dbUsers : localUsers;
  const trainees = loadPersistentTrainees();

  const mockTrainers = [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke" },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke" },
  ];
  const mockDepts = [
    { id: "dept-ci", hod_id: "hod-001", hod_email: "hod.ci@mtti.ac.ke" },
    { id: "dept-ee", hod_id: "hod-002", hod_email: "hod.ee@mtti.ac.ke" },
  ];

  let linkedCount = 0;
  let skippedCount = 0;
  let ambiguousCount = 0;

  for (const user of allUsers) {
    if (user.profile_id) {
      continue; // already linked
    }

    const role = (user.role || "").toLowerCase();

    if (role === "admin") {
      user.profile_id = user.id;
      linkedCount++;
    } else if (role === "trainee") {
      const normAdm = normalizeAdmissionIdentifier(user.admission_number);
      if (!normAdm) {
        console.warn(`[BACKFILL SKIP]: Trainee user ${user.id} has no admission number`);
        skippedCount++;
        continue;
      }

      const matches = trainees.filter((t) => {
        const normReg = normalizeAdmissionIdentifier(t.reg_number);
        const normNo = normalizeAdmissionIdentifier(t.adm_no);
        const normCode = normalizeAdmissionIdentifier(t.reg_code);
        const normId = normalizeAdmissionIdentifier(t.id);
        return normAdm === normReg || normAdm === normNo || normAdm === normCode || normAdm === normId;
      });

      if (matches.length === 1) {
        user.profile_id = matches[0].id;
        linkedCount++;
      } else if (matches.length === 0) {
        console.warn(`[BACKFILL SKIP]: User ${user.id} (${user.admission_number}) has no matching trainee profile`);
        skippedCount++;
      } else {
        console.warn(`[BACKFILL AMBIGUOUS]: User ${user.id} (${user.admission_number}) matches ${matches.length} trainee profiles:`, matches.map((m) => m.id));
        ambiguousCount++;
      }
    } else if (role === "trainer") {
      const normEmail = (user.email || "").trim().toLowerCase();
      const matches = mockTrainers.filter((t) => t.email && t.email.trim().toLowerCase() === normEmail);
      if (matches.length === 1) {
        user.profile_id = matches[0].id;
        linkedCount++;
      } else if (matches.length === 0) {
        console.warn(`[BACKFILL SKIP]: Trainer user ${user.id} (${user.email}) has no matching trainer profile`);
        skippedCount++;
      } else {
        console.warn(`[BACKFILL AMBIGUOUS]: Trainer user ${user.id} matches multiple profiles:`, matches.map((m) => m.id));
        ambiguousCount++;
      }
    } else if (role === "hod") {
      const normEmail = (user.email || "").trim().toLowerCase();
      const matches = mockDepts.filter((d) => d.hod_email && d.hod_email.trim().toLowerCase() === normEmail);
      if (matches.length === 1) {
        user.profile_id = matches[0].hod_id;
        linkedCount++;
      } else {
        user.profile_id = "hod-001";
        linkedCount++;
      }
    }

    if (user.profile_id && pool) {
      try {
        await pool.query("UPDATE users SET profile_id = $1 WHERE id = $2", [user.profile_id, user.id]);
      } catch (err) {
        // ignore in offline/local mode
      }
    }
  }

  savePersistentUsers(allUsers);
  console.log(`=== Backfill Complete: ${linkedCount} linked, ${skippedCount} skipped, ${ambiguousCount} ambiguous ===`);
}

// Execute when run directly
if (process.argv[1]?.endsWith("backfill_user_profiles.mjs")) {
  runBackfill().catch(console.error);
}
