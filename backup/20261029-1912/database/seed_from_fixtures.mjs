/**
 * Supabase & PostgreSQL Idempotent Fixture Seeder
 * Mukiria Technical Training Institute (MTTI)
 *
 * Usage:
 *   node database/seed_from_fixtures.mjs [DATABASE_URL]
 * or with environment variable:
 *   $env:DATABASE_URL="postgresql://postgres:[PASSWORD]@host:5432/postgres"
 *   node database/seed_from_fixtures.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEEDS_DIR = path.resolve(__dirname, "seeds");

function loadSeed(filename) {
  const p = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch (e) {
    console.warn(`Could not parse ${filename}:`, e.message);
    return [];
  }
}

async function seed() {
  console.log("==================================================================");
  console.log(" MUKIRIA TECHNICAL TRAINING INSTITUTE — DATABASE FIXTURE SEEDER");
  console.log("==================================================================");

  let connectionString = process.env.DATABASE_URL || process.argv[2];
  if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
    const projectRef = process.env.SUPABASE_PROJECT_REF || "bzlnpywjyhhrqapsvczf";
    connectionString = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  // Load Fixtures
  const trainees = loadSeed("trainees.json");
  const attendance = loadSeed("attendance_register.json");
  const marks = loadSeed("assessment_marks.json");
  const evidence = loadSeed("assessment_evidence.json");
  const sessionPlans = loadSeed("session_plans.json");
  const recordsOfWork = loadSeed("records_of_work.json");
  const submissions = loadSeed("submissions.json");
  const classRegisters = loadSeed("class_registers.json");
  const learningPlans = loadSeed("learning_plans.json");

  console.log(`📦 Loaded Fixtures from ${SEEDS_DIR}:`);
  console.log(`   • Trainees: ${trainees.length}`);
  console.log(`   • Attendance Entries: ${attendance.length}`);
  console.log(`   • Assessment Marks: ${marks.length}`);
  console.log(`   • Assessment Evidence: ${evidence.length}`);
  console.log(`   • Session Plans: ${sessionPlans.length}`);
  console.log(`   • Records of Work: ${recordsOfWork.length}`);
  console.log(`   • Exam Submissions: ${submissions.length}`);
  console.log(`   • Class Registers: ${Object.keys(classRegisters).length}`);
  console.log(`   • Learning Plans: ${learningPlans.length}`);

  if (!connectionString) {
    console.log("\n⚠️ No live database connection string provided.");
    console.log("   Set $env:DATABASE_URL=\"...\" or pass connection string as CLI argument.");
    console.log("   Generating idempotent SQL script: database/seeds/seed_all_fixtures.sql ...");
    generateSqlSeedFile({
      trainees,
      attendance,
      marks,
      evidence,
      sessionPlans,
      recordsOfWork,
      submissions,
      classRegisters,
      learningPlans,
    });
    console.log("✅ Generated database/seeds/seed_all_fixtures.sql successfully.");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("\n✅ Connected successfully to PostgreSQL database.");

    await client.query("BEGIN;");

    // 1. Seed Trainees
    console.log("⏳ Seeding trainees...");
    for (const t of trainees) {
      await client.query(`
        INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_code, department, gender, phone, remarks, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          reg_number = EXCLUDED.reg_number,
          adm_no = EXCLUDED.adm_no,
          reg_code = EXCLUDED.reg_code,
          class_code = EXCLUDED.class_code,
          department = EXCLUDED.department,
          gender = EXCLUDED.gender,
          phone = EXCLUDED.phone,
          remarks = EXCLUDED.remarks,
          updated_at = CURRENT_TIMESTAMP;
      `, [t.id, t.name, t.reg_number, t.adm_no, t.reg_code, t.class_code, t.department, t.gender, t.phone, t.remarks]);
    }

    // 2. Seed Attendance Records
    console.log(`⏳ Seeding attendance records (${attendance.length} entries)...`);
    for (const a of attendance) {
      await client.query(`
        INSERT INTO attendance_records (
          id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          hours_attended = EXCLUDED.hours_attended,
          remarks = EXCLUDED.remarks,
          updated_at = CURRENT_TIMESTAMP;
      `, [a.id, a.unit_offering_id, a.trainee_id, a.week_number, a.session_date, a.session_index, a.status, a.hours_attended, a.remarks]);
    }

    // 3. Seed Assessment Marks
    console.log("⏳ Seeding assessment marks...");
    for (const m of marks) {
      await client.query(`
        INSERT INTO assessment_marks (
          id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores, project_score, weighted_mark, is_locked, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (unit_offering_id, trainee_id) DO UPDATE SET
          ct_avg = EXCLUDED.ct_avg,
          cp_avg = EXCLUDED.cp_avg,
          cp_scores = EXCLUDED.cp_scores,
          ct_scores = EXCLUDED.ct_scores,
          project_score = EXCLUDED.project_score,
          weighted_mark = EXCLUDED.weighted_mark,
          is_locked = EXCLUDED.is_locked,
          updated_at = CURRENT_TIMESTAMP;
      `, [
        m.id, m.unit_offering_id, m.trainee_id, m.ct_avg || 0, m.cp_avg || 0,
        JSON.stringify(m.cp_scores || []), JSON.stringify(m.ct_scores || []),
        m.project_score || 0, m.weighted_mark || 0, Boolean(m.is_locked)
      ]);
    }

    // 4. Seed Assessment Evidence
    console.log("⏳ Seeding assessment evidence...");
    for (const e of evidence) {
      await client.query(`
        INSERT INTO assessment_evidence (
          id, unit_offering_id, trainee_id, trainee_name, outcome_id, title, file_type, file_url, file_data, mark, assessor_feedback, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          mark = EXCLUDED.mark,
          assessor_feedback = EXCLUDED.assessor_feedback,
          status = EXCLUDED.status;
      `, [
        e.id, e.unit_offering_id, e.trainee_id, e.trainee_name || null, e.task_code || e.outcome_id || null,
        e.title, e.mime_type || e.file_type || "application/pdf", e.file_url, e.file_data || null,
        e.grade ?? e.mark ?? null, e.feedback || e.assessor_feedback || null,
        e.verified_by_trainer ? "verified" : (e.status || "pending")
      ]);
    }

    // 5. Seed Session Plans
    console.log("⏳ Seeding session plans...");
    for (const sp of sessionPlans) {
      await client.query(`
        INSERT INTO session_plans (
          id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          session_title = EXCLUDED.session_title,
          approval_status = EXCLUDED.approval_status,
          hod_reviewed_by = EXCLUDED.hod_reviewed_by,
          hod_reviewer_name = EXCLUDED.hod_reviewer_name,
          hod_review_date = EXCLUDED.hod_review_date,
          hod_remarks = EXCLUDED.hod_remarks,
          updated_at = CURRENT_TIMESTAMP;
      `, [
        sp.id, sp.unit_offering_id, sp.class_code, sp.trainer_id, sp.department_id,
        sp.date, sp.session_title, sp.approval_status || "pending",
        sp.hod_reviewed_by, sp.hod_reviewer_name, sp.hod_review_date, sp.hod_remarks
      ]);
    }

    // 6. Seed Records of Work
    console.log("⏳ Seeding records of work...");
    for (const row of recordsOfWork) {
      await client.query(`
        INSERT INTO records_of_work (
          id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          work_covered = EXCLUDED.work_covered,
          approval_status = EXCLUDED.approval_status,
          hod_reviewed_by = EXCLUDED.hod_reviewed_by,
          hod_reviewer_name = EXCLUDED.hod_reviewer_name,
          hod_review_date = EXCLUDED.hod_review_date,
          hod_remarks = EXCLUDED.hod_remarks,
          updated_at = CURRENT_TIMESTAMP;
      `, [
        row.id, row.session_plan_id, row.unit_offering_id, row.class_code, row.trainer_id, row.department_id,
        row.work_covered, row.date_covered, row.approval_status || "pending",
        row.hod_reviewed_by, row.hod_reviewer_name, row.hod_review_date, row.hod_remarks
      ]);
    }

    // 7. Seed Exam Submissions
    console.log("⏳ Seeding exam submissions...");
    for (const sub of submissions) {
      await client.query(`
        INSERT INTO exam_submissions (
          id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT (exam_id, trainee_id) DO UPDATE SET
          status = EXCLUDED.status,
          total_score = EXCLUDED.total_score,
          section_a = EXCLUDED.section_a,
          section_b = EXCLUDED.section_b,
          feedback = EXCLUDED.feedback,
          submitted_at = EXCLUDED.submitted_at;
      `, [
        sub.id, sub.exam_id || "exam-dl-01", sub.trainee_id || sub.reg_number || "trainee-001",
        sub.student_name, sub.reg_number, sub.status || "submitted", sub.total_score || 0,
        JSON.stringify(sub.section_a || []), JSON.stringify(sub.section_b || []), JSON.stringify(sub.answers || []),
        sub.trainer_comments || sub.feedback || null, sub.submitted_at || sub.created_at || new Date().toISOString()
      ]);
    }

    // 8. Seed Learning Plans
    console.log("⏳ Seeding learning plans...");
    for (const lp of learningPlans) {
      await client.query(`
        INSERT INTO learning_plans (id, unit_code, class_code, week_number, topic, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          topic = EXCLUDED.topic,
          updated_at = CURRENT_TIMESTAMP;
      `, [lp.id, lp.unit_code, lp.class_code, lp.week_number, lp.topic]);
    }

    // 9. Seed Class Registers
    console.log("⏳ Seeding class registers...");
    for (const [classCode, reg] of Object.entries(classRegisters)) {
      await client.query(`
        INSERT INTO class_registers (class_code, lecturer_name, subject, lecturer_comment, hod_comment, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (class_code) DO UPDATE SET
          lecturer_name = EXCLUDED.lecturer_name,
          subject = EXCLUDED.subject,
          lecturer_comment = EXCLUDED.lecturer_comment,
          hod_comment = EXCLUDED.hod_comment,
          updated_at = CURRENT_TIMESTAMP;
      `, [classCode, reg.lecturer || reg.lecturer_name, reg.subject, reg.lecturerComment || reg.lecturer_comment, reg.hodComment || reg.hod_comment]);
    }

    await client.query("COMMIT;");
    console.log("✅ All fixtures successfully committed to PostgreSQL database.");

    // Verification Counts
    console.log("\n📊 Verification Table Counts in Database:");
    const tables = [
      "trainees",
      "attendance_records",
      "assessment_marks",
      "assessment_evidence",
      "session_plans",
      "records_of_work",
      "exam_submissions",
      "learning_plans",
      "class_registers"
    ];

    for (const tbl of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) AS count FROM ${tbl};`);
        console.log(`   • ${tbl.padEnd(22)} : ${res.rows[0].count} records`);
      } catch (countErr) {
        console.warn(`   • ${tbl.padEnd(22)} : Query failed (${countErr.message})`);
      }
    }

  } catch (err) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("❌ Seeding transaction failed:", err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

function generateSqlSeedFile(data) {
  const sqlFile = path.join(SEEDS_DIR, "seed_all_fixtures.sql");
  let sql = "-- ============================================================\n";
  sql += "-- Mukiria Technical Training Institute (MTTI)\n";
  sql += "-- Idempotent Institutional Database Seed Script\n";
  sql += "-- Generated from database/seeds/*.json fixtures\n";
  sql += "-- ============================================================\n\n";
  sql += "BEGIN;\n\n";

  // Trainees
  sql += "-- 1. Trainees\n";
  for (const t of data.trainees) {
    sql += `INSERT INTO trainees (id, name, reg_number, adm_no, reg_code, class_code, department, gender, phone, remarks, updated_at)\n`;
    sql += `VALUES (${escapeSql(t.id)}, ${escapeSql(t.name)}, ${escapeSql(t.reg_number)}, ${escapeSql(t.adm_no)}, ${escapeSql(t.reg_code)}, ${escapeSql(t.class_code)}, ${escapeSql(t.department)}, ${escapeSql(t.gender)}, ${escapeSql(t.phone)}, ${escapeSql(t.remarks)}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, class_code = EXCLUDED.class_code, updated_at = CURRENT_TIMESTAMP;\n`;
  }
  sql += "\n";

  // Attendance
  sql += `-- 2. Attendance Records (${data.attendance.length} entries)\n`;
  for (const a of data.attendance) {
    sql += `INSERT INTO attendance_records (id, unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at)\n`;
    sql += `VALUES (${escapeSql(a.id)}, ${escapeSql(a.unit_offering_id)}, ${escapeSql(a.trainee_id)}, ${Number(a.week_number || 1)}, ${escapeSql(a.session_date)}, ${Number(a.session_index || 1)}, ${escapeSql(a.status)}, ${Number(a.hours_attended || 2)}, ${escapeSql(a.remarks)}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, hours_attended = EXCLUDED.hours_attended, updated_at = CURRENT_TIMESTAMP;\n`;
  }
  sql += "\n";

  // Assessment Marks
  sql += "-- 3. Assessment Marks\n";
  for (const m of data.marks) {
    sql += `INSERT INTO assessment_marks (id, unit_offering_id, trainee_id, ct_avg, cp_avg, cp_scores, ct_scores, project_score, weighted_mark, is_locked, updated_at)\n`;
    sql += `VALUES (${escapeSql(m.id)}, ${escapeSql(m.unit_offering_id)}, ${escapeSql(m.trainee_id)}, ${Number(m.ct_avg || 0)}, ${Number(m.cp_avg || 0)}, '${JSON.stringify(m.cp_scores || [])}'::jsonb, '${JSON.stringify(m.ct_scores || [])}'::jsonb, ${Number(m.project_score || 0)}, ${Number(m.weighted_mark || 0)}, ${Boolean(m.is_locked)}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (unit_offering_id, trainee_id) DO UPDATE SET weighted_mark = EXCLUDED.weighted_mark, is_locked = EXCLUDED.is_locked, updated_at = CURRENT_TIMESTAMP;\n`;
  }
  sql += "\n";

  // Submissions
  sql += "-- 4. Exam Submissions\n";
  for (const sub of data.submissions) {
    sql += `INSERT INTO exam_submissions (id, exam_id, trainee_id, student_name, trainee_admission, status, total_score, section_a, section_b, answers, feedback, submitted_at, created_at)\n`;
    sql += `VALUES (${escapeSql(sub.id)}, ${escapeSql(sub.exam_id || "exam-dl-01")}, ${escapeSql(sub.trainee_id || sub.reg_number || "trainee-001")}, ${escapeSql(sub.student_name)}, ${escapeSql(sub.reg_number)}, ${escapeSql(sub.status || "submitted")}, ${Number(sub.total_score || 0)}, '${JSON.stringify(sub.section_a || []).replace(/'/g, "''")}'::jsonb, '${JSON.stringify(sub.section_b || []).replace(/'/g, "''")}'::jsonb, '${JSON.stringify(sub.answers || []).replace(/'/g, "''")}'::jsonb, ${escapeSql(sub.trainer_comments || sub.feedback)}, ${escapeSql(sub.submitted_at || sub.created_at || new Date().toISOString())}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (exam_id, trainee_id) DO UPDATE SET total_score = EXCLUDED.total_score, status = EXCLUDED.status, submitted_at = EXCLUDED.submitted_at;\n`;
  }
  sql += "\n";

  // Session Plans & Records of Work
  sql += "-- 5. Session Plans & Records of Work\n";
  for (const sp of data.sessionPlans) {
    sql += `INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)\n`;
    sql += `VALUES (${escapeSql(sp.id)}, ${escapeSql(sp.unit_offering_id)}, ${escapeSql(sp.class_code)}, ${escapeSql(sp.trainer_id)}, ${escapeSql(sp.department_id)}, ${escapeSql(sp.date)}, ${escapeSql(sp.session_title)}, ${escapeSql(sp.approval_status || "pending")}, ${escapeSql(sp.hod_reviewed_by)}, ${escapeSql(sp.hod_reviewer_name)}, ${escapeSql(sp.hod_review_date)}, ${escapeSql(sp.hod_remarks)}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;\n`;
  }

  for (const row of data.recordsOfWork) {
    sql += `INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, hod_reviewed_by, hod_reviewer_name, hod_review_date, hod_remarks, updated_at)\n`;
    sql += `VALUES (${escapeSql(row.id)}, ${escapeSql(row.session_plan_id)}, ${escapeSql(row.unit_offering_id)}, ${escapeSql(row.class_code)}, ${escapeSql(row.trainer_id)}, ${escapeSql(row.department_id)}, ${escapeSql(row.work_covered)}, ${escapeSql(row.date_covered)}, ${escapeSql(row.approval_status || "pending")}, ${escapeSql(row.hod_reviewed_by)}, ${escapeSql(row.hod_reviewer_name)}, ${escapeSql(row.hod_review_date)}, ${escapeSql(row.hod_remarks)}, CURRENT_TIMESTAMP)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET approval_status = EXCLUDED.approval_status, updated_at = CURRENT_TIMESTAMP;\n`;
  }

  sql += "\nCOMMIT;\n";
  fs.writeFileSync(sqlFile, sql, "utf-8");
}

function escapeSql(val) {
  if (val === undefined || val === null) return "NULL";
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

seed().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
