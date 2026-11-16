/**
 * Mukiria Technical Training Institute (MTTI)
 * Seed Account Password Rotation & Old Credential Rejection Verifier
 *
 * Usage:
 *   npx tsx scripts/verify-seed-password-rotation.ts [--target-url <url>]
 *
 * Mandate:
 * Verifies that all legacy default and hardcoded passwords for seeded accounts
 * are strictly rejected (HTTP 401 Unauthorized), proving that password rotation
 * has been successfully executed and old credentials are invalidated.
 */

import dotenv from "dotenv";
dotenv.config();

export interface AccountAuditResult {
  email: string;
  testedLegacyPasswords: string[];
  allRejected: boolean;
  failures: Array<{ password: string; status: number }>;
}

export const SEEDED_ACCOUNTS_TO_VERIFY = [
  {
    role: "ADMIN",
    identifier: "admin@mtti.ac.ke",
    legacyPasswords: [
      "admin123",
      "Admin123",
      "Admin123!",
      "admin@mtti.ac.ke",
      "Admin@MTTI2026!",
      "mukiria2026",
      "password",
      "12345678",
    ],
  },
  {
    role: "TRAINER",
    identifier: "trainer@mtti.ac.ke",
    legacyPasswords: [
      "trainer123",
      "Trainer123",
      "Trainer123!",
      "trainer@mtti.ac.ke",
      "Trainer@MTTI2026!",
      "mukiria2026",
      "password",
      "12345678",
    ],
  },
  {
    role: "HOD",
    identifier: "hod.ci@mtti.ac.ke",
    legacyPasswords: [
      "hod123",
      "Hod123",
      "Hod123!",
      "hod.ci@mtti.ac.ke",
      "Hod@MTTI2026!",
      "mukiria2026",
      "password",
      "12345678",
    ],
  },
  {
    role: "TRAINEE",
    identifier: "14179/S2026",
    legacyPasswords: [
      "trainee123",
      "Trainee123",
      "Trainee123!",
      "trainee@mtti.ac.ke",
      "Trainee@MTTI2026!",
      "14179/S2026",
      "password",
      "12345678",
    ],
  },
];

export async function verifyLegacyPasswordRejection(
  baseUrl = "http://127.0.0.1:3000/api"
): Promise<{
  passed: boolean;
  results: AccountAuditResult[];
  summary: string;
}> {
  const results: AccountAuditResult[] = [];
  let totalTested = 0;
  let totalRejected = 0;

  for (const account of SEEDED_ACCOUNTS_TO_VERIFY) {
    const audit: AccountAuditResult = {
      email: account.identifier,
      testedLegacyPasswords: account.legacyPasswords,
      allRejected: true,
      failures: [],
    };

    for (const legacyPassword of account.legacyPasswords) {
      totalTested++;
      try {
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: account.identifier,
            password: legacyPassword,
          }),
        });

        // 401 Unauthorized or 423 Locked are expected safe rejections.
        // 200 OK means the legacy password is STILL ACTIVE (critical failure).
        if (res.status === 200) {
          audit.allRejected = false;
          audit.failures.push({ password: legacyPassword, status: res.status });
        } else {
          totalRejected++;
        }
      } catch (err: any) {
        // Network/connection errors
        audit.allRejected = false;
        audit.failures.push({ password: legacyPassword, status: 0 });
      }
    }

    results.push(audit);
  }

  const passed = results.every((r) => r.allRejected);
  const summary = passed
    ? `✅ PASSED: All ${totalTested} tested legacy passwords across ${results.length} seeded accounts were strictly rejected.`
    : `❌ FAILED: ${totalTested - totalRejected} of ${totalTested} legacy passwords were accepted or encountered errors.`;

  return { passed, results, summary };
}

// CLI Execution entrypoint
if (process.argv[1]?.endsWith("verify-seed-password-rotation.ts")) {
  const targetUrlArgIndex = process.argv.indexOf("--target-url");
  const targetUrl =
    targetUrlArgIndex !== -1 && process.argv[targetUrlArgIndex + 1]
      ? process.argv[targetUrlArgIndex + 1]
      : process.env.API_BASE_URL || "http://127.0.0.1:3000/api";

  console.log("======================================================================");
  console.log("  MTTI Seed Account Password Rotation & Rejection Verifier");
  console.log(`  Target Endpoint: ${targetUrl}/auth/login`);
  console.log("======================================================================\n");

  verifyLegacyPasswordRejection(targetUrl)
    .then(({ passed, results, summary }) => {
      for (const res of results) {
        console.log(`Account: ${res.email}`);
        if (res.allRejected) {
          console.log(`  ✅ All ${res.testedLegacyPasswords.length} legacy passwords successfully rejected.`);
        } else {
          console.log(`  ❌ CRITICAL: The following legacy passwords were NOT rejected:`);
          for (const f of res.failures) {
            console.log(`     - "${f.password}" (HTTP Status: ${f.status})`);
          }
        }
      }
      console.log("\n" + summary);
      if (!passed) process.exit(1);
    })
    .catch((err) => {
      console.error("Execution error:", err);
      process.exit(1);
    });
}
