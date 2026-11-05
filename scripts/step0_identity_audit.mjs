import fs from "fs";
import path from "path";

function loadJson(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, "utf-8"));
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err.message);
  }
  return [];
}

const users = loadJson("server/data/users.json");
const traineesData = loadJson("server/data/trainees.json");
const traineesSeeds = loadJson("database/seeds/trainees.json");
const submissionsData = loadJson("server/data/submissions.json");
const submissionsSeeds = loadJson("database/seeds/submissions.json");
const attendanceData = loadJson("server/data/attendance_register.json");
const attendanceSeeds = loadJson("database/seeds/attendance_register.json");
const evidenceData = loadJson("server/data/assessment_evidence.json");
const evidenceSeeds = loadJson("database/seeds/assessment_evidence.json");
const marksData = loadJson("server/data/assessment_marks.json");
const marksSeeds = loadJson("database/seeds/assessment_marks.json");

// Institutional roster from routes.ts
const institutionalRoster = [
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admissionNumber: "14179/S2026", fullName: "Nthiga Gakii Doris" },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admissionNumber: "14255/S2026", fullName: "Kaumbuthu Belinda Mukiri" },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admissionNumber: "14022/S2026", fullName: "Ltumwa Lesoipa" },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admissionNumber: "14077/S2026", fullName: "Kitheka Emmanuel Kioko" },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admissionNumber: "14102/S2026", fullName: "Felix Mugendi" },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admissionNumber: "14119/S2026", fullName: "Mwangi Clinton Njiru" },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admissionNumber: "14149/S2026", fullName: "Abigael Mukiri" },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admissionNumber: "14172/S2026", fullName: "Fiona Kadogo Mwika" },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admissionNumber: "14207/S2026", fullName: "Ann Mary Makena" },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admissionNumber: "14254/S2026", fullName: "Brenda Ngugi" },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admissionNumber: "14267/S2026", fullName: "Ingashia Favour Wawira" },
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admissionNumber: "14076/S2026", fullName: "Wanjau Alvin Gatere" },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admissionNumber: "14107/S2026", fullName: "Ann Mukiri Matheta" },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admissionNumber: "14124/S2026", fullName: "Kimanthi Dennis Mwenda" },
  { id: "trainee-10525", regCode: "10525", admissionNumber: "10525", fullName: "Alex Kinoti" },
  { id: "trainee-001", regCode: "14179/S2026", admissionNumber: "14179/S2026", fullName: "Nthiga Gakii Doris" },
  { id: "trainee-002", regCode: "10526", admissionNumber: "10526", fullName: "Harriet Mwendwa" },
  { id: "trainee-003", regCode: "99999", admissionNumber: "99999", fullName: "Other Student" },
];

const trainers = [
  { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
  { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", assigned_units: ["ICT/OS/IT/CR/1/6"] },
];

const departments = [
  { id: "dept-ci", name: "Computing & Informatics", code: "CI", hod_id: "hod-001", hod_email: "hod.ci@mtti.ac.ke" },
  { id: "dept-ee", name: "Electrical & Electronics", code: "EE", hod_id: "hod-002", hod_email: "hod.ee@mtti.ac.ke" },
];

function norm(s) {
  if (!s || typeof s !== "string") return "";
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

console.log("================================================================================");
console.log("STEP 0: READ-ONLY IDENTITY AUDIT REPORT");
console.log("================================================================================");

// 1. All Known Trainee Profile IDs
const knownTraineeProfiles = new Map();
for (const t of [...traineesSeeds, ...traineesData, ...institutionalRoster]) {
  if (t && t.id) {
    if (!knownTraineeProfiles.has(t.id)) {
      knownTraineeProfiles.set(t.id, t);
    }
  }
}

// 2. People with multiple profile ids / Users without a unique profile
console.log("\n--- AUDIT SECTION 1: Users & Profile ID Linkages ---");
const usersByProfile = new Map();
const usersWithoutProfile = [];
const usersWithMultipleProfiles = [];

for (const u of users) {
  if (!u.profile_id) {
    usersWithoutProfile.push({ id: u.id, email: u.email, role: u.role, admission_number: u.admission_number });
  } else {
    if (!usersByProfile.has(u.profile_id)) {
      usersByProfile.set(u.profile_id, []);
    }
    usersByProfile.get(u.profile_id).push(u);
  }
}

console.log(`Total users in registry: ${users.length}`);
console.log(`Users without profile_id: ${usersWithoutProfile.length}`);
for (const u of usersWithoutProfile) {
  console.log(`  - [UNLINKED]: id=${u.id}, email=${u.email}, role=${u.role}, adm=${u.admission_number}`);
}

const sharedProfiles = [];
for (const [profId, list] of usersByProfile.entries()) {
  if (list.length > 1) {
    sharedProfiles.push({ profile_id: profId, users: list.map(x => x.id) });
  }
}
console.log(`Profiles mapped to multiple user accounts: ${sharedProfiles.length}`);
for (const sp of sharedProfiles) {
  console.log(`  - [SHARED PROFILE]: profile_id=${sp.profile_id} shared by users: ${sp.users.join(", ")}`);
}

// 3. Identifiers mapping to more than one profile
console.log("\n--- AUDIT SECTION 2: Identifier Ambiguity (Multiple Profiles for Same ID) ---");
const admToProfiles = new Map();
for (const [profId, t] of knownTraineeProfiles.entries()) {
  const adms = [t.admissionNumber, t.reg_number, t.adm_no, t.reg_code].filter(Boolean).map(norm);
  for (const a of adms) {
    if (!admToProfiles.has(a)) admToProfiles.set(a, new Set());
    admToProfiles.get(a).add(profId);
  }
}

let ambiguousAdmCount = 0;
for (const [a, set] of admToProfiles.entries()) {
  if (set.size > 1) {
    ambiguousAdmCount++;
    console.log(`  - [AMBIGUOUS IDENTIFIER]: "${a}" maps to multiple profiles: ${Array.from(set).join(", ")}`);
  }
}
console.log(`Total ambiguous admission identifiers in roster/seeds: ${ambiguousAdmCount}`);

// 4. Orphan / Unknown trainee_id values in Submissions, Attendance, Evidence, Marks
console.log("\n--- AUDIT SECTION 3: Orphan Trainee IDs in Domain Tables ---");

function auditDomainRecords(name, records, idField = "trainee_id") {
  const orphans = new Map();
  for (const r of records) {
    const tid = r[idField];
    if (tid && !knownTraineeProfiles.has(tid)) {
      if (!orphans.has(tid)) orphans.set(tid, 0);
      orphans.set(tid, orphans.get(tid) + 1);
    }
  }
  console.log(`Table '${name}' (${records.length} records): ${orphans.size} orphan trainee_ids found.`);
  for (const [tid, count] of orphans.entries()) {
    console.log(`  - [ORPHAN]: trainee_id='${tid}' (${count} occurrences)`);
  }
  return orphans;
}

auditDomainRecords("submissions (seeds)", submissionsSeeds, "trainee_id");
auditDomainRecords("submissions (data)", submissionsData, "trainee_id");
auditDomainRecords("attendance (seeds)", attendanceSeeds, "trainee_id");
auditDomainRecords("attendance (data)", attendanceData, "trainee_id");
auditDomainRecords("evidence (seeds)", evidenceSeeds, "trainee_id");
auditDomainRecords("evidence (data)", evidenceData, "trainee_id");
auditDomainRecords("assessment_marks (seeds)", marksSeeds, "trainee_id");
auditDomainRecords("assessment_marks (data)", marksData, "trainee_id");

// 5. Trainers / HODs missing from Trainers/Departments
console.log("\n--- AUDIT SECTION 4: Faculty / Department Directory Audit ---");
const staffUsers = users.filter(u => ["TRAINER", "trainer", "HOD", "hod"].includes(u.role));
for (const su of staffUsers) {
  const role = (su.role || "").toLowerCase();
  const sEmail = (su.email || "").toLowerCase().trim();
  if (role === "trainer") {
    const found = trainers.find(t => t.email.toLowerCase() === sEmail || (su.profile_id && t.id === su.profile_id));
    if (!found) {
      console.log(`  - [ORPHAN TRAINER]: User ${su.id} (${su.email}) not found in Trainers table`);
    } else {
      console.log(`  - [TRAINER OK]: User ${su.id} (${su.email}) -> Trainer ${found.id} (${found.name})`);
    }
  } else if (role === "hod") {
    const found = departments.find(d => d.hod_email.toLowerCase() === sEmail || (su.profile_id && d.hod_id === su.profile_id));
    if (!found) {
      console.log(`  - [ORPHAN HOD]: User ${su.id} (${su.email}) not found in Departments table`);
    } else {
      console.log(`  - [HOD OK]: User ${su.id} (${su.email}) -> Dept ${found.id} (${found.name}, HOD: ${found.hod_id})`);
    }
  }
}
console.log("================================================================================");
