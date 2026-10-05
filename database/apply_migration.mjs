/**
 * Supabase Remote Database Migration Runner
 * Mukiria Technical Training Institute
 *
 * Usage:
 *   node database/apply_migration.mjs [DATABASE_URL]
 * or with environment variable:
 *   $env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.bzlnpywjyhhrqapsvczf.supabase.co:5432/postgres"
 *   node database/apply_migration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const PROJECT_REF = "bzlnpywjyhhrqapsvczf";
const DEFAULT_HOST = `db.${PROJECT_REF}.supabase.co`;
const DEFAULT_PORT = 5432;
const DEFAULT_USER = "postgres";
const DEFAULT_DATABASE = "postgres";

async function run() {
  console.log("==================================================================");
  console.log(" MUKIRIA TECHNICAL TRAINING INSTITUTE — SUPABASE MIGRATION RUNNER");
  console.log("==================================================================");

  let connectionString = process.env.DATABASE_URL || process.argv[2];

  if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
    connectionString = `postgresql://${DEFAULT_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${DEFAULT_HOST}:${DEFAULT_PORT}/${DEFAULT_DATABASE}`;
  }

  if (!connectionString) {
    console.error("\n❌ Missing Database Connection Details.\n");
    console.log("To apply migrations directly to your Supabase instance, either:");
    console.log("1. Provide DATABASE_URL as an environment variable or argument:");
    console.log("   node database/apply_migration.mjs \"postgresql://postgres:[PASSWORD]@db.bzlnpywjyhhrqapsvczf.supabase.co:5432/postgres\"\n");
    console.log("2. Or set the password environment variable:");
    console.log("   $env:SUPABASE_DB_PASSWORD=\"[YOUR_DB_PASSWORD]\"");
    console.log("   node database/apply_migration.mjs\n");
    console.log("3. Or copy the SQL directly into your Supabase Dashboard SQL Editor:");
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log("   File: database/migrations/02_rbac_and_authorization.sql\n");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("\nConnecting to remote Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected successfully to Supabase PostgreSQL.");

    // Determine migration file to run
    let targetFileName = "01_master_supabase_migration.sql";
    const fileArg = process.argv.find(arg => arg.endsWith(".sql"));
    if (fileArg) {
      targetFileName = path.basename(fileArg);
    } else if (process.argv.includes("--seed")) {
      targetFileName = "03_seed_institutional_data.sql";
    }

    const migrationPath = path.resolve("database", "migrations", targetFileName);
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, "utf-8");
    console.log(`\nExecuting migration: database/migrations/${targetFileName} (${migrationSql.length} bytes)...`);

    await client.query("BEGIN;");
    await client.query(migrationSql);
    await client.query("COMMIT;");

    console.log(`\n✅ Migration [${targetFileName}] applied successfully!`);
  } catch (err) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("\n❌ Migration failed:");
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
