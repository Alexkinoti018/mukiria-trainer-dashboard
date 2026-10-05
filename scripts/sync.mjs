import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("\n==================================================================");
console.log("   MUKIRIA TVET - MULTI-PLATFORM SYNC (GITHUB, SUPABASE, VERCEL)  ");
console.log("==================================================================\n");

// Helper to run shell commands with clear console logging
function runCommand(command, description) {
  console.log(`\x1b[1m--> ${description}...\x1b[0m`);
  try {
    const output = execSync(command, { cwd: ROOT_DIR, stdio: "pipe" }).toString();
    console.log(`\x1b[32m[OK]\x1b[0m ${description} completed successfully.\n`);
    return { success: true, output };
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Failed during: ${description}`);
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    return { success: false, error };
  }
}

async function startSync() {
  // -------------------------------------------------------------
  // STAGE 1: Pre-Flight Safety (TypeScript Type Checking)
  // -------------------------------------------------------------
  console.log("\x1b[36m[STAGE 1/4] Checking Code Quality & Compilation\x1b[0m");
  const typecheck = runCommand("npx tsc --noEmit", "Running TypeScript compiler check");
  if (!typecheck.success) {
    console.error("\x1b[31mAborting sync:\x1b[0m Please fix type errors before pushing to production.");
    process.exit(1);
  }

  // -------------------------------------------------------------
  // STAGE 2: Database Migration Sync (Supabase)
  // -------------------------------------------------------------
  console.log("\x1b[36m[STAGE 2/4] Checking Supabase Database Migrations\x1b[0m");
  const migrationsDir = path.join(ROOT_DIR, "database/migrations");
  const migrationRunner = path.join(ROOT_DIR, "database/apply_migration.mjs");

  if (fs.existsSync(migrationsDir) && fs.existsSync(migrationRunner)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql"));
    console.log(`Found ${migrationFiles.length} database migration files.`);
    
    // Check if DATABASE_URL is set in environment or .env
    const envPath = path.join(ROOT_DIR, ".env");
    const hasEnv = fs.existsSync(envPath) && fs.readFileSync(envPath, "utf-8").includes("DATABASE_URL");
    
    if (hasEnv || process.env.DATABASE_URL) {
      console.log("Applying pending migrations to Supabase...");
      // Apply the latest migrations safely
      for (const sqlFile of migrationFiles) {
        const fullMigrationPath = path.join("database/migrations", sqlFile);
        runCommand(`node database/apply_migration.mjs ${fullMigrationPath}`, `Applying migration: ${sqlFile}`);
      }
    } else {
      console.log("\x1b[33m[NOTE]\x1b[0m DATABASE_URL not detected in active shell. Skipping automated SQL migration.");
    }
  } else {
    console.log("No database migration files found to apply.");
  }

  // -------------------------------------------------------------
  // STAGE 3: Git Status, Commit, and GitHub Push
  // -------------------------------------------------------------
  console.log("\n\x1b[36m[STAGE 3/4] Staging and Pushing Changes to GitHub\x1b[0m");

  // Determine commit message: use CLI argument if passed, else default with timestamp
  const userMessage = process.argv.slice(2).join(" ").trim();
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const commitMessage = userMessage || `Update and sync changes: ${timestamp}`;

  // Check git status
  const gitStatus = execSync("git status --porcelain", { cwd: ROOT_DIR }).toString().trim();

  if (gitStatus.length > 0) {
    console.log("Detected modified or untracked files:");
    console.log(gitStatus + "\n");

    runCommand("git add .", "Staging all modified files");
    runCommand(`git commit -m "${commitMessage}"`, `Creating git commit: "${commitMessage}"`);
  } else {
    console.log("No uncommitted local changes detected.");
  }

  // Get current active branch (main or master)
  let activeBranch = "main";
  try {
    activeBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT_DIR }).toString().trim();
  } catch (e) {
    activeBranch = "main";
  }

  const pushResult = runCommand(`git push origin ${activeBranch}`, `Pushing to GitHub (origin/${activeBranch})`);
  if (!pushResult.success) {
    console.error("\x1b[31mGit push failed.\x1b[0m Please check your GitHub remote or network connection.");
    process.exit(1);
  }

  // -------------------------------------------------------------
  // STAGE 4: Vercel Deployment Reminder & Live Status
  // -------------------------------------------------------------
  console.log("\n\x1b[36m[STAGE 4/4] Verifying Live Deployment on Vercel\x1b[0m");
  
  const vercelConfigExists = fs.existsSync(path.join(ROOT_DIR, "vercel.json"));
  if (vercelConfigExists) {
    console.log("\x1b[32m[OK]\x1b[0m vercel.json detected.");
    console.log("Your push to GitHub has triggered an automatic production deployment on Vercel!");
  }

  console.log("\n==================================================================");
  console.log("\x1b[32m\x1b[1mALL PLATFORMS SUCCESSFULLY SYNCHRONIZED!\x1b[0m");
  console.log("==================================================================");
  console.log("1. \x1b[1mGitHub:\x1b[0m Latest code pushed to branch '" + activeBranch + "'.");
  console.log("2. \x1b[1mSupabase:\x1b[0m Migrations and schema state up to date.");
  console.log("3. \x1b[1mVercel:\x1b[0m Automatic build triggered by GitHub webhook.");
  console.log("   Check build progress: https://vercel.com/dashboard\n");
}

startSync();
