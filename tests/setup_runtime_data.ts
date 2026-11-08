import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";

process.env.MTTI_DATA_DIR = path.join(os.tmpdir(), `mukiria-trainer-dashboard-test-${process.pid}`);

const { savePersistentUsers } = await import("../server/db.ts");
const testAccounts = [
  {
    id: "usr-admin-01",
    email: "admin@mtti.ac.ke",
    password: "AdminTestPassword@2026!",
    full_name: "System Administrator",
    role: "ADMIN",
    profile_id: "usr-admin-01",
  },
  {
    id: "usr-hod-ci",
    email: "hod.ci@mtti.ac.ke",
    password: "HodTestPassword@2026!",
    full_name: "Test Department Head",
    role: "HOD",
    profile_id: "hod-001",
    department_id: "dept-ci",
  },
  {
    id: "usr-trainer-01",
    email: "trainer@mtti.ac.ke",
    password: "TrainerTestPassword@2026!",
    full_name: "Test Trainer",
    role: "TRAINER",
    profile_id: "trainer-001",
    department_id: "dept-ci",
  },
  {
    id: "usr-trainee-01",
    email: "trainee@mtti.ac.ke",
    admission_number: "14179/S2026",
    password: "TraineePassword@2026!",
    full_name: "Test Trainee",
    role: "TRAINEE",
    profile_id: "trainee-001",
  },
];

savePersistentUsers(
  await Promise.all(
    testAccounts.map(async ({ password, ...user }) => ({
      ...user,
      password_hash: await bcrypt.hash(password, 12),
    }))
  )
);
