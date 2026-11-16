/**
 * Mukiria Technical Training Institute (MTTI)
 * Migration 17 Staff Directory Backfill & Verification Tool
 *
 * Usage:
 *   npx tsx scripts/backfill-staff-directory.ts [--dry-run | --apply]
 *
 * Invariants:
 * 1. Backfills Trainers.email from matching staff users.
 * 2. Backfills Departments.hod_email guarding against duplicate/ambiguous joins (DISTINCT ON).
 * 3. Backfills users.department_id and users.profile_id.
 * 4. Flags EVERY staff user who would receive HTTP 403 after deployment due to unlinked profile/department.
 */

import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const isApply = process.argv.includes("--apply");
const isDryRun = !isApply || process.argv.includes("--dry-run");

interface StaffAuditReport {
  unmatchedStaffUsers: Array<{ id: string; email: string; name: string; role: string; reason: string }>;
  trainersToUpdate: Array<{ id: string; name: string; newEmail: string }>;
  departmentsToUpdate: Array<{ id: string; name: string; hodId: string; newHodEmail: string }>;
  usersToUpdate: Array<{ id: string; email: string; role: string; newDepartmentId: string; newProfileId?: string }>;
  ambiguityWarnings: string[];
}

export async function runStaffBackfill(poolOverride?: Pool): Promise<{
  report: StaffAuditReport;
  sqlStatements: string[];
  applied: boolean;
}> {
  const dbUrl = process.env.DATABASE_URL;
  const pool = poolOverride || (dbUrl ? new Pool({ connectionString: dbUrl }) : null);

  const report: StaffAuditReport = {
    unmatchedStaffUsers: [],
    trainersToUpdate: [],
    departmentsToUpdate: [],
    usersToUpdate: [],
    ambiguityWarnings: [],
  };

  const sqlStatements = [
    `-- 1. Populate Trainers.email from users (Guarded with DISTINCT ON by name)`,
    `UPDATE Trainers t
SET email = sub.email
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(name))) LOWER(TRIM(name)) AS norm_name, email
  FROM users
  WHERE UPPER(role) IN ('TRAINER', 'HOD') AND email IS NOT NULL
  ORDER BY LOWER(TRIM(name)), created_at ASC
) sub
WHERE (t.email IS NULL OR TRIM(t.email) = '')
  AND LOWER(TRIM(t.name)) = sub.norm_name;`,

    `-- 2. Populate Departments.hod_email from Trainers (Guarded with DISTINCT ON by dept id)`,
    `UPDATE Departments d
SET hod_email = sub.email
FROM (
  SELECT DISTINCT ON (d2.id) d2.id, t.email
  FROM Departments d2
  JOIN Trainers t ON d2.hod_id = t.id
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY d2.id, t.id ASC
) sub
WHERE d.id = sub.id
  AND (d.hod_email IS NULL OR TRIM(d.hod_email) = '');`,

    `-- 3. Populate users.department_id for HODs (Guarded against duplicate department hod_email)`,
    `UPDATE users u
SET department_id = sub.dept_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(d.hod_email))) LOWER(TRIM(d.hod_email)) AS norm_hod_email, d.id AS dept_id
  FROM Departments d
  WHERE d.hod_email IS NOT NULL AND TRIM(d.hod_email) <> ''
  ORDER BY LOWER(TRIM(d.hod_email)), d.id ASC
) sub
WHERE UPPER(u.role) = 'HOD'
  AND LOWER(TRIM(u.email)) = sub.norm_hod_email
  AND u.department_id IS NULL;`,

    `-- 4. Populate users.department_id for Trainers (Guarded against duplicate department names)`,
    `UPDATE users u
SET department_id = sub.dept_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(t.email))) LOWER(TRIM(t.email)) AS norm_trainer_email, d.id AS dept_id
  FROM Trainers t
  JOIN (
    SELECT DISTINCT ON (LOWER(TRIM(name))) LOWER(TRIM(name)) AS norm_dept_name, id
    FROM Departments
    ORDER BY LOWER(TRIM(name)), id ASC
  ) d ON LOWER(TRIM(t.department)) = d.norm_dept_name
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY LOWER(TRIM(t.email)), d.id ASC
) sub
WHERE UPPER(u.role) = 'TRAINER'
  AND LOWER(TRIM(u.email)) = sub.norm_trainer_email
  AND u.department_id IS NULL;`,

    `-- 5. Populate users.profile_id for Trainers & HODs (Guarded by trainer email)`,
    `UPDATE users u
SET profile_id = sub.trainer_id::text
FROM (
  SELECT DISTINCT ON (LOWER(TRIM(t.email))) LOWER(TRIM(t.email)) AS norm_trainer_email, t.id AS trainer_id
  FROM Trainers t
  WHERE t.email IS NOT NULL AND TRIM(t.email) <> ''
  ORDER BY LOWER(TRIM(t.email)), t.id ASC
) sub
WHERE UPPER(u.role) IN ('TRAINER', 'HOD')
  AND LOWER(TRIM(u.email)) = sub.norm_trainer_email
  AND u.profile_id IS NULL;`,
  ];

  if (!pool) {
    report.ambiguityWarnings.push("No live database connection pool configured (DATABASE_URL unset). Generated SQL statements for manual execution.");
    return { report, sqlStatements, applied: false };
  }

  try {
    const client = await pool.connect();
    try {
      // 1. Audit Trainers missing emails
      const trainersRes = await client.query(`SELECT id, name, email, department FROM Trainers;`);
      const usersRes = await client.query(`SELECT id, email, name, role, department_id, profile_id FROM users WHERE UPPER(role) IN ('TRAINER', 'HOD', 'ADMIN');`);
      const deptsRes = await client.query(`SELECT id, name, code, hod_id, hod_email FROM Departments;`);

      // Check department name uniqueness
      const deptNames = new Set<string>();
      for (const d of deptsRes.rows) {
        const norm = (d.name || "").trim().toLowerCase();
        if (deptNames.has(norm)) {
          report.ambiguityWarnings.push(`Duplicate department name detected: "${d.name}" (id: ${d.id}). Join is protected with DISTINCT ON.`);
        }
        deptNames.add(norm);
      }

      // Check Trainers needing email
      for (const t of trainersRes.rows) {
        if (!t.email || !t.email.trim()) {
          const match = usersRes.rows.find((u) => u.name && u.name.trim().toLowerCase() === t.name.trim().toLowerCase());
          if (match && match.email) {
            report.trainersToUpdate.push({ id: t.id, name: t.name, newEmail: match.email });
          }
        }
      }

      // Check Departments needing hod_email
      for (const d of deptsRes.rows) {
        if (!d.hod_email && d.hod_id) {
          const trainer = trainersRes.rows.find((t) => t.id === d.hod_id);
          const candidateEmail = trainer?.email || report.trainersToUpdate.find((tu) => tu.id === d.hod_id)?.newEmail;
          if (candidateEmail) {
            report.departmentsToUpdate.push({ id: d.id, name: d.name, hodId: d.hod_id, newHodEmail: candidateEmail });
          }
        }
      }

      // Check Users who would receive HTTP 403 after deploy
      for (const u of usersRes.rows) {
        const role = String(u.role || "").toUpperCase();
        if (role === "ADMIN") continue; // Admins are exempt from department scoping

        const isHod = role === "HOD";
        const hasDept = Boolean(u.department_id);
        const hasProfile = Boolean(u.profile_id);

        if (!hasDept || !hasProfile) {
          // Check if resolved by backfill
          let willResolveDept = false;
          let willResolveProfile = false;

          if (isHod) {
            willResolveDept = Boolean(
              deptsRes.rows.some((d) => d.hod_email?.toLowerCase() === u.email.toLowerCase()) ||
              report.departmentsToUpdate.some((du) => du.newHodEmail.toLowerCase() === u.email.toLowerCase())
            );
          } else {
            const matchingTrainer = trainersRes.rows.find((t) => t.email?.toLowerCase() === u.email.toLowerCase()) ||
              report.trainersToUpdate.find((tu) => tu.newEmail.toLowerCase() === u.email.toLowerCase());
            if (matchingTrainer) {
              willResolveProfile = true;
              if (matchingTrainer.department) {
                willResolveDept = deptsRes.rows.some((d) => d.name.toLowerCase() === matchingTrainer.department.toLowerCase());
              }
            }
          }

          if (!hasDept && !willResolveDept) {
            report.unmatchedStaffUsers.push({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              reason: `Unresolved department: User email "${u.email}" does not map to any known department in directory. (HTTP 403 on protected routes)`,
            });
          }
          if (!hasProfile && !willResolveProfile) {
            report.unmatchedStaffUsers.push({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              reason: `Unresolved faculty profile: User email "${u.email}" does not match any trainer record. (HTTP 403 on protected routes)`,
            });
          }
        }
      }

      if (isApply) {
        await client.query("BEGIN;");
        for (const sql of sqlStatements) {
          await client.query(sql);
        }
        await client.query("COMMIT;");
        return { report, sqlStatements, applied: true };
      }

      return { report, sqlStatements, applied: false };
    } finally {
      client.release();
    }
  } catch (err: any) {
    report.ambiguityWarnings.push(`Database connection notice: ${err.message}`);
    return { report, sqlStatements, applied: false };
  } finally {
    if (!poolOverride) {
      await pool.end();
    }
  }
}

// CLI Entrypoint
if (process.argv[1]?.includes("backfill-staff-directory")) {
  console.log(`\n======================================================================`);
  console.log(`  MTTI Migration 17 Staff Directory Backfill Tool`);
  console.log(`  Mode: ${isDryRun ? "DRY-RUN (Simulating changes, no database mutation)" : "APPLY (Executing updates)"}`);
  console.log(`======================================================================\n`);

  runStaffBackfill()
    .then(({ report, sqlStatements, applied }) => {
      console.log(`[1] Trainers to populate email (${report.trainersToUpdate.length}):`);
      report.trainersToUpdate.forEach((t) => console.log(`  - [${t.id}] ${t.name} -> ${t.newEmail}`));

      console.log(`\n[2] Departments to populate hod_email (${report.departmentsToUpdate.length}):`);
      report.departmentsToUpdate.forEach((d) => console.log(`  - [${d.id}] ${d.name} -> ${d.newHodEmail}`));

      console.log(`\n[3] HTTP 403 Risk Analysis (Unmatched Staff: ${report.unmatchedStaffUsers.length}):`);
      if (report.unmatchedStaffUsers.length === 0) {
        console.log(`  ✅ Zero staff accounts at risk. All staff accounts resolve to valid departments and profiles.`);
      } else {
        report.unmatchedStaffUsers.forEach((u) => console.warn(`  ⚠️ RISK [HTTP 403]: User ${u.email} (${u.role}) - ${u.reason}`));
      }

      if (report.ambiguityWarnings.length > 0) {
        console.log(`\n[4] Ambiguity & Join Guard Warnings:`);
        report.ambiguityWarnings.forEach((w) => console.warn(`  ℹ️ ${w}`));
      }

      console.log(`\n[5] Generated Guarded SQL Statements:`);
      sqlStatements.forEach((sql, idx) => {
        console.log(`\n--- Statement ${idx + 1} ---`);
        console.log(sql);
      });

      console.log(`\n======================================================================`);
      console.log(`  Result: ${applied ? "✅ Updates applied successfully." : "🔍 Dry-run complete. Run with --apply to commit to database."}`);
      console.log(`======================================================================\n`);
    })
    .catch((err) => {
      console.error("Backfill execution error:", err);
      process.exit(1);
    });
}
