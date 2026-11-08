import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("ordered Phase 1 database migrations", () => {
  const departmentMigration = fs.readFileSync(
    path.join(root, "database", "migrations", "16_staff_department_assignment.sql"),
    "utf8"
  );
  const profileMigration = fs.readFileSync(
    path.join(root, "database", "migrations", "17_phase1_profile_link.sql"),
    "utf8"
  );
  const runner = fs.readFileSync(path.join(root, "database", "apply_migration.mjs"), "utf8");

  it("applies main migration 16 before the profile migration 17", () => {
    const mainMigrationIndex = runner.indexOf('"16_staff_department_assignment.sql"');
    const profileMigrationIndex = runner.indexOf('"17_phase1_profile_link.sql"');
    expect(mainMigrationIndex).toBeGreaterThanOrEqual(0);
    expect(profileMigrationIndex).toBeGreaterThan(mainMigrationIndex);
  });

  it("is safe after migration 16 has already added the department field", () => {
    expect(departmentMigration).toContain("ADD COLUMN IF NOT EXISTS department_id");
    expect(profileMigration).toContain("ADD COLUMN IF NOT EXISTS department_id");
    expect(profileMigration).toContain("ADD COLUMN IF NOT EXISTS profile_id");
    expect(profileMigration).toContain("ADD COLUMN IF NOT EXISTS must_change_password");
    expect(profileMigration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_profile_id");
  });
});
