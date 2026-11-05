/**
 * Mukiria Technical Training Institute (MTTI)
 * Phase 1 One-Time Profile Link Backfill Script
 * File: scripts/backfill_user_profiles.mjs
 *
 * Usage:
 *   node scripts/backfill_user_profiles.mjs --dry-run
 *   node scripts/backfill_user_profiles.mjs
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
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`=== Starting Phase 1 Profile ID Backfill ${isDryRun ? "[DRY-RUN]" : "[LIVE]"} ===`);
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
  const plannedUpdates = [];

  for (const user of allUsers) {
    if (user.profile_id) {
      continue; // already linked
    }

    const role = (user.role || "").toLowerCase();
    let targetProfileId = null;

    if (role === "admin") {
      targetProfileId = user.id;
    } else if (role === "trainee") {
      const normAdm = normalizeAdmissionIdentifier(user.admission_number);
      if (!normAdm) {
        console.warn(`[BACKFILL SKIP]: Trainee user ${user.id} has no admission number`);
        skippedCount++;
        continue;
      }

      // Exact match on admission number, adm_no, or reg_code ONLY (t.id strictly excluded)
      const matches = trainees.filter((t) => {
        const normReg = normalizeAdmissionIdentifier(t.reg_number);
        const normNo = normalizeAdmissionIdentifier(t.adm_no);
        const normCode = normalizeAdmissionIdentifier(t.reg_code);
        return normAdm === normReg || normAdm === normNo || normAdm === normCode;
      });

      if (matches.length === 1) {
        targetProfileId = matches[0].id;
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
        targetProfileId = matches[0].id;
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
        targetProfileId = matches[0].hod_id;
      } else {
        targetProfileId = "hod-001";
      }
    }

    if (targetProfileId) {
      plannedUpdates.push({ userId: user.id, profileId: targetProfileId, role, identifier: user.admission_number || user.email });
      linkedCount++;
    }
  }

  if (isDryRun) {
    console.log(`\n--- Prospective Updates (${plannedUpdates.length}) ---`);
    for (const update of plannedUpdates) {
      console.log(`[DRY-RUN PLAN]: User ${update.userId} (${update.role}: ${update.identifier}) -> profile_id: ${update.profileId}`);
    }
    console.log(`\n=== Dry Run Complete: ${linkedCount} prospective links, ${skippedCount} skipped, ${ambiguousCount} ambiguous. No changes written. ===`);
    return { linkedCount, skippedCount, ambiguousCount, plannedUpdates };
  }

  // Live execution: update DB conditionally and update local file
  for (const update of plannedUpdates) {
    if (pool) {
      try {
        await pool.query("UPDATE users SET profile_id = $1 WHERE id = $2 AND profile_id IS NULL", [
          update.profileId,
          update.userId,
        ]);
      } catch (err) {
        console.warn(`[DB UPDATE WARNING]: Could not update user ${update.userId}:`, err.message);
      }
    }

    const localTarget = localUsers.find((u) => u.id === update.userId);
    if (localTarget && !localTarget.profile_id) {
      localTarget.profile_id = update.profileId;
    }
  }

  savePersistentUsers(localUsers);
  console.log(`=== Backfill Complete: ${linkedCount} linked, ${skippedCount} skipped, ${ambiguousCount} ambiguous ===`);
  return { linkedCount, skippedCount, ambiguousCount, plannedUpdates };
}

// Execute when run directly
if (process.argv[1]?.endsWith("backfill_user_profiles.mjs")) {
  runBackfill().catch(console.error);
}
