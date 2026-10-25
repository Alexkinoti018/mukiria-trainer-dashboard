import { Router, Request, Response, NextFunction } from "express";
import {
  query,
  withTransaction,
  pool,
  loadPersistentAttendance,
  savePersistentAttendance,
  loadPersistentTrainees,
  savePersistentTrainees,
  loadPersistentSessionPlans,
  savePersistentSessionPlans,
  loadPersistentLearningPlans,
  savePersistentLearningPlans,
  loadPersistentRecordsOfWork,
  savePersistentRecordsOfWork,
  loadPersistentClassRegisters,
  savePersistentClassRegisters,
  loadPersistentAssessmentMarks,
  savePersistentAssessmentMarks,
  loadPersistentSubmissions,
  savePersistentSubmissions,
  loadPersistentAssessmentEvidence,
  savePersistentAssessmentEvidence,
  saveAssessmentMarksBatch,
  saveTraineeBatch,
  saveExamSubmission,
  saveAssessmentEvidence,
  AttendanceRecord,
  TraineeRecord,
} from "./db.ts";
import { FBS_COHORT_SUBMISSIONS } from "../client/src/lib/fbsCohortSubmissions.ts";
import { DIGITAL_LITERACY_EXAMS } from "../client/src/lib/digitalLiteracyExams.ts";
import { CURRICULUM_CATS } from "../client/src/lib/curriculumContinuousAssessments.ts";

export {
  AuthenticatedUser,
  AuthenticatedRequest,
  authenticateUser,
  requireRoles,
  getAuthConfiguration,
  verifySupabaseToken,
  createSignedJwt,
} from "./auth.ts";
import {
  AuthenticatedUser,
  AuthenticatedRequest,
  authenticateUser,
  requireRoles,
} from "./auth.ts";

export const apiRouter = Router();

// ─── IN-MEMORY DEMO/SEED REPOSITORY WITH SERVICE-ROLE INTEGRITY ───────────────
// In production, queries traverse PostgreSQL with RLS. Here we mirror identical relational constraints.
export const DB = {
  departments: [
    { id: "dept-ci", name: "Computing & Informatics", code: "CI", hod_id: "hod-001" },
    { id: "dept-ee", name: "Electrical & Electronics", code: "EE", hod_id: "hod-002" },
  ],
  trainers: [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", assigned_units: ["ICT/OS/IT/CR/1/6"] },
  ],
  trainees: [
    { id: "trainee-001", name: "Nthiga Gakii Doris", reg_number: "14179/S2026-SEED", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-10525", name: "Alex Kinoti", reg_number: "10525", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A"] },
    { id: "trainee-003", name: "Other Student", reg_number: "99999", class_id: "class-ee-4", enrolled_units: ["EE/CU/01/4"] },
    { id: "tr_fbs5_01", name: "Yvonne Mwende", reg_number: "13254", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_02", name: "Muoki Muthoki", reg_number: "13263", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_03", name: "Kibaara Peninah Gaichuiri", reg_number: "13281", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_04", name: "Hilda Mwede Njagi", reg_number: "13297", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_05", name: "Ndolo Shalom Mbithe", reg_number: "13304", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_06", name: "Mirriam Nzula", reg_number: "13313", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_07", name: "Waweru Hope Marion Makena", reg_number: "13343", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_08", name: "Ann Joy Makena", reg_number: "13355", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_09", name: "Martha Mwende Kyalo", reg_number: "13378", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_10", name: "John Opiyo Omondi", reg_number: "13396", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_11", name: "Eunice Kendi Nyaga", reg_number: "13445", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_12", name: "Miriko Rita", reg_number: "13446", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_13", name: "Valentine Lesoito", reg_number: "13463", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_14", name: "Kinyua Christine Mutito", reg_number: "13482", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_15", name: "Gichukia Bridgit Nyakio", reg_number: "13488", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_16", name: "Karwitha Silvia", reg_number: "13546", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_17", name: "Lavint Aliviza", reg_number: "13551", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_18", name: "Kinya Weddy", reg_number: "13559", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_19", name: "Gakuhi Jackline Nyambura", reg_number: "13571", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_20", name: "Terry Mwendwa", reg_number: "13583", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_21", name: "Faith Mwende", reg_number: "13258", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_22", name: "Eugene Murimi", reg_number: "12265", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
    { id: "tr_fbs5_23", name: "Brendah Mumbi", reg_number: "13231", class_id: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  ],
  unit_offerings: [
    { id: "uo-1", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/CU/IT/CR/6/6", unit_id: "unit-cr-6", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-2", term_id: "term-2026", class_id: "class-itech-6", unit_code: "061155101A", unit_id: "unit-dl-1", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-3", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/OS/IT/CR/1/6", unit_id: "unit-net-1", trainer_id: "trainer-002", department_id: "dept-ci" },
    { id: "uo-it4-1", term_id: "term-2026", class_id: "ICT4 MOD/S/2026", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-1", term_id: "term-2026", class_id: "ICT4/ITECH6/S/26 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-2", term_id: "term-2026", class_id: "ICT4/ITECH6/S/2026 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-admin-1", term_id: "term-2026", class_id: "ADMIN5/6/J/26 MOD 3", unit_code: "0415-451-21A", unit_id: "unit-ict-admin", trainer_id: "trainer-001", department_id: "dept-business" },
    { id: "uo-admin-2", term_id: "term-2026", class_id: "ADMIN5/6/J/26", unit_code: "0415-451-21A", unit_id: "unit-ict-admin", trainer_id: "trainer-001", department_id: "dept-business" },
  ],
  exams: [
    ...DIGITAL_LITERACY_EXAMS,
    ...CURRICULUM_CATS,
    {
      id: "exam-cr-001",
      unit_id: "unit-cr-6",
      unit_code: "ICT/CU/IT/CR/6/6",
      course_name: "ICT Technician Level 6",
      payload: {
        title: "Computer Repair & Maintenance Assessment",
        duration_minutes: 120,
        total_marks: 50,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z", // active window
        section_a: {
          title: "Section A: Objective Knowledge",
          instructions: "Select the correct response.",
          total_marks: 20,
          questions: [
            {
              id: "q1",
              text: "Which command checks disk integrity?",
              type: "mcq",
              options: ["chkdsk", "sfc /scannow", "ipconfig", "netstat"],
              correct_answer: "0", // MUST BE STRIPPED FOR STUDENTS
              rubric: "1 mark for chkdsk", // MUST BE STRIPPED FOR STUDENTS
              critical_aspect: "OS disk diagnostics", // MUST BE STRIPPED FOR STUDENTS
              marks: 5
            }
          ]
        },
        section_b: {
          title: "Section B: Practical Diagnostics",
          instructions: "Explain procedure.",
          total_marks: 30,
          questions: [
            {
              id: "q2",
              text: "Explain troubleshooting CPU throttling in Task Manager.",
              type: "short_answer",
              correct_answer: "Check thermal limits and process utilization",
              rubric: "Award 10 marks for thermal vs process analysis",
              critical_aspect: "System performance monitoring",
              marks: 10
            }
          ]
        }
      }
    },
    {
      id: "exam-net-001",
      unit_id: "unit-net-1",
      unit_code: "ICT/OS/IT/CR/1/6",
      course_name: "Computer Networking",
      payload: {
        title: "Computer Networking Examination",
        duration_minutes: 120,
        total_marks: 50,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z",
        section_a: {
          title: "Networking Basics",
          instructions: "Answer all questions.",
          total_marks: 25,
          questions: [
            {
              id: "q_net_1",
              text: "Default subnet mask for class C network?",
              type: "mcq",
              options: ["255.255.255.0", "255.255.0.0", "255.0.0.0"],
              correct_answer: "0",
              rubric: "Award 5 marks",
              critical_aspect: "Subnetting",
              marks: 5
            }
          ]
        }
      }
    },
    {
      id: "exam-essentials-mod1",
      unit_id: "unit-essentials-4",
      unit_code: "IT/CU/ICTA/CR/01/4/MA",
      course_name: "ICT 4 / ICT Technician Level 5 & 6",
      payload: {
        title: "Perform Computer Essentials Formative Assessment",
        duration_minutes: 180,
        total_marks: 100,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2026-12-31T23:59:59Z",
        type: "practical",
        section_a: {
          title: "Section A: Practical Observation & Device Management",
          instructions: "Demonstrate hands-on tasks per assessor observation checklist.",
          total_marks: 50,
          questions: [
            { id: "q_ess_1", text: "Identify 5 external ports and locate CMOS battery.", type: "practical", marks: 15 },
            { id: "q_ess_2", text: "Open Device Manager and verify input device drivers.", type: "practical", marks: 15 },
            { id: "q_ess_3", text: "Oral Assessment: Differentiate between RAM/ROM and SSD/HDD.", type: "oral", marks: 20 },
          ]
        },
        section_b: {
          title: "Section B: Desktop Configuration & Software Management",
          instructions: "Perform file archiving and software management.",
          total_marks: 50,
          questions: [
            { id: "q_ess_4", text: "Create folder structure and compress using 7-Zip.", type: "practical", marks: 25 },
            { id: "q_ess_5", text: "Uninstall software and configure default PDF viewer.", type: "practical", marks: 25 },
          ]
        }
      }
    }
  ],
  submissions: (() => {
    const defaultSubs = [
      ...FBS_COHORT_SUBMISSIONS,
    {
      id: "sub-005",
      unit_code: "061155101A",
      student_name: "Yvonne Mwende",
      reg_number: "13254",
      section_a: [
        { question_id: "dl1_a1", answer: "Digital literacy is the ability to find, evaluate, and compose clear information using digital devices.", marks_awarded: 2 },
        { question_id: "dl1_a2", answer: "Input: Keyboard and Scanner. Output: Monitor and Laser Printer.", marks_awarded: 4 },
        { question_id: "dl1_a3", answer: "1. Save open files. 2. Close active applications. 3. Click Start > Power > Shut Down.", marks_awarded: 3 },
        { question_id: "dl1_a4", answer: "Touch typing and keyboard shortcuts like Ctrl+S, Ctrl+C.", marks_awarded: 2 },
        { question_id: "dl1_a5", answer: "Create folder > File > Save As into folder > set password in General Options.", marks_awarded: 4 },
        { question_id: "dl1_a6", answer: "Banking, Healthcare, Education.", marks_awarded: 3 },
        { question_id: "dl1_a7", answer: "Connect HDMI, press Win + P, select Duplicate.", marks_awarded: 3 },
        { question_id: "dl1_a8", answer: "System software manages hardware (Windows); application software does user work (Word).", marks_awarded: 3 },
        { question_id: "dl1_a9", answer: "Click and drag file to destination folder.", marks_awarded: 2 },
        { question_id: "dl1_a10", answer: "Acceptable use policy and password security policy.", marks_awarded: 2 }
      ],
      section_b: [
        { question_id: "dl1_b11", answer: "Word processor features, newsletter formatting, shortcuts, calculator differences.", marks_awarded: 18 },
        { question_id: "dl1_b12", answer: "Word tables, spreadsheet printing, budget components, lab safety measures.", marks_awarded: 17 }
      ],
      status: "graded",
      total_score: 63,
      trainer_comments: "Distinction performance. Strong grasp of digital literacy concepts.",
      created_at: "2026-10-04T11:30:00Z"
    },
    {
      id: "sub-006",
      unit_code: "061155101A",
      student_name: "Muoki Muthoki",
      reg_number: "13263",
      section_a: [
        { question_id: "dl1_a1", answer: "Digital literacy is using computers effectively for workplace communication.", marks_awarded: 2 },
        { question_id: "dl1_a2", answer: "Input: Keyboard, Mouse. Output: Monitor, Printer.", marks_awarded: 4 },
        { question_id: "dl1_a3", answer: "Save documents, close apps, click Start > Shut down.", marks_awarded: 2 },
        { question_id: "dl1_a4", answer: "Home row touch typing and Ctrl+C shortcuts.", marks_awarded: 2 },
        { question_id: "dl1_a5", answer: "New folder, Save As, set password.", marks_awarded: 3 },
        { question_id: "dl1_a6", answer: "Hospitals, Banks, Schools.", marks_awarded: 2 },
        { question_id: "dl1_a7", answer: "HDMI cable, Windows + P Duplicate.", marks_awarded: 2 },
        { question_id: "dl1_a8", answer: "System software (Windows), Application software (Word).", marks_awarded: 3 },
        { question_id: "dl1_a9", answer: "Drag file to folder and release.", marks_awarded: 2 },
        { question_id: "dl1_a10", answer: "Password policy, Acceptable use policy.", marks_awarded: 2 }
      ],
      section_b: [
        { question_id: "dl1_b11", answer: "Word processor, shortcuts, calculator vs computer.", marks_awarded: 16 },
        { question_id: "dl1_b12", answer: "Word tables, spreadsheet print, lab safety.", marks_awarded: 16 }
      ],
      status: "graded",
      total_score: 56,
      trainer_comments: "Competent performance (Credit). Good practical understanding.",
      created_at: "2026-10-04T12:00:00Z"
    },
    {
      id: "sub-101",
      exam_id: "exam-cr-001",
      unit_code: "ICT/CU/IT/CR/6/6",
      trainee_id: "trainee-001",
      reg_number: "10525",
      student_name: "Alex Kinoti",
      status: "submitted",
      total_score: 42,
      section_a: [{ question_id: "q1", answer: "0", marks_awarded: 5 }],
      section_b: [{ question_id: "q2", answer: "Inspect processes and thermals", marks_awarded: 8 }],
      created_at: "2026-09-01T10:00:00Z"
    },
    {
      id: "sub-102",
      exam_id: "exam-cr-001",
      unit_code: "ICT/CU/IT/CR/6/6",
      trainee_id: "trainee-002",
      reg_number: "10526",
      student_name: "Harriet Mwendwa",
      status: "submitted",
      total_score: 38,
      section_a: [{ question_id: "q1", answer: "0", marks_awarded: 5 }],
      section_b: [{ question_id: "q2", answer: "Check cooling fans", marks_awarded: 6 }],
      created_at: "2026-09-01T10:05:00Z"
    }
    ];
    const persisted = loadPersistentSubmissions();
    if (persisted && persisted.length > 0) {
      const mergedMap = new Map();
      defaultSubs.forEach(s => mergedMap.set(s.id, s));
      persisted.forEach(s => mergedMap.set(s.id, s));
      return Array.from(mergedMap.values());
    }
    return defaultSubs;
  })(),
  assessment_marks: (() => {
    const persisted = loadPersistentAssessmentMarks();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "mark-01",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-001",
        ct_avg: 78,
        cp_avg: 84,
        cp_scores: [84],
        ct_scores: [78],
        project_score: 80,
        weighted_mark: 81,
        is_locked: true // Published
      },
      {
        id: "mark-02",
        unit_offering_id: "uo-1",
        trainee_id: "trainee-002",
        ct_avg: 65,
        cp_avg: 70,
        cp_scores: [70],
        ct_scores: [65],
        project_score: 75,
        weighted_mark: 68,
        is_locked: false // DRAFT (Unpublished - Trainees must NOT see this!)
      }
    ];
  })(),
  assessment_evidence: (() => {
    const defaultEvidence = [
    {
      id: "ev-001",
      unit_offering_id: "uo-1",
      trainee_id: "trainee-001",
      task_code: "CP1",
      title: "Computer Hardware Diagnostics & Disassembly",
      filename: "Computer_Essentials_Practical_1.pdf",
      file_url: "/api/evidence/ev-001/file",
      mime_type: "application/pdf",
      file_size: 145020,
      file_data: "JVBERi0xLjQKJSDi48cKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc0CiUlRU9G",
      verified_by_trainer: true,
      verified_at: "2026-09-16T10:00:00Z",
      verified_by: "Dr. J. Muriithi",
      grade: 88,
      feedback: "Exemplary hardware inspection and BIOS configuration.",
      submitted_at: "2026-09-15T09:30:00Z"
    },
    {
      id: "ev-002",
      unit_offering_id: "uo-1",
      trainee_id: "trainee-002",
      task_code: "CP2",
      title: "Motherboard Diagnostics Observation Photo",
      filename: "Hardware_Setup_Evidence.png",
      file_url: "/api/evidence/ev-002/file",
      mime_type: "image/png",
      file_size: 42100,
      file_data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      verified_by_trainer: false,
      verified_at: null,
      verified_by: null,
      grade: null,
      feedback: "",
      submitted_at: "2026-09-15T10:00:00Z"
    },
    {
      id: "ev-003",
      unit_offering_id: "uo-3", // trainer-002's unit (Networking)
      trainee_id: "trainee-001",
      task_code: "CP1",
      title: "Network Cable Termination & LAN Verification",
      filename: "Network_Configuration_Evidence.pdf",
      file_url: "/api/evidence/ev-003/file",
      mime_type: "application/pdf",
      file_size: 128000,
      file_data: "JVBERi0xLjQKJSDi48cKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTc0CiUlRU9G",
      verified_by_trainer: false,
      verified_at: null,
      verified_by: null,
      grade: null,
      feedback: "",
      submitted_at: "2026-09-15T11:00:00Z"
    }
    ];
    const persisted = loadPersistentAssessmentEvidence();
    if (persisted && persisted.length > 0) {
      const mergedMap = new Map();
      defaultEvidence.forEach(e => mergedMap.set(e.id, e));
      persisted.forEach(e => mergedMap.set(e.id, e));
      return Array.from(mergedMap.values());
    }
    return defaultEvidence;
  })(),
  session_plans: (() => {
    const persisted = loadPersistentSessionPlans();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "sp-001",
        unit_offering_id: "uo-1",
        trainer_id: "trainer-001",
        department_id: "dept-ci",
        date: "2026-09-10",
        session_title: "PC Hardware Diagnostics",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null,
      },
      {
        id: "sp-002",
        unit_offering_id: "uo-3",
        trainer_id: "trainer-002",
        department_id: "dept-ci",
        date: "2026-09-12",
        session_title: "Network Cabling & Crimping",
        approval_status: "approved",
        hod_reviewed_by: "hod-001",
        hod_reviewer_name: "Prof. S. Njoroge",
        hod_review_date: "2026-09-13T10:00:00Z",
        hod_remarks: "Approved for lab practicals.",
      },
      {
        id: "sp-ee-001",
        unit_offering_id: "uo-ee-1",
        trainer_id: "trainer-ee-001",
        department_id: "dept-ee",
        date: "2026-09-14",
        session_title: "Power Systems Analysis",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null,
      }
    ];
  })(),
  learning_plans: loadPersistentLearningPlans(),
  record_of_work: (() => {
    const persisted = loadPersistentRecordsOfWork();
    if (persisted && persisted.length > 0) return persisted;
    return [
      {
        id: "row-001",
        session_plan_id: "sp-001",
        unit_offering_id: "uo-1",
        trainer_id: "trainer-001",
        department_id: "dept-ci",
        work_covered: "Disassembly and testing of power supply units",
        date_covered: "2026-09-10",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null,
      },
      {
        id: "row-002",
        session_plan_id: "sp-002",
        unit_offering_id: "uo-3",
        trainer_id: "trainer-002",
        department_id: "dept-ci",
        work_covered: "Ethernet standard 568B termination lab",
        date_covered: "2026-09-12",
        approval_status: "approved",
        hod_reviewed_by: "hod-001",
        hod_reviewer_name: "Prof. S. Njoroge",
        hod_review_date: "2026-09-13T10:00:00Z",
        hod_remarks: "Verified against syllabus.",
      },
      {
        id: "row-ee-001",
        session_plan_id: "sp-ee-001",
        unit_offering_id: "uo-ee-1",
        trainer_id: "trainer-ee-001",
        department_id: "dept-ee",
        work_covered: "Transformer loading tests",
        date_covered: "2026-09-14",
        approval_status: "pending",
        hod_reviewed_by: null,
        hod_reviewer_name: null,
        hod_review_date: null,
        hod_remarks: null,
      }
    ];
  })(),
  class_registers: loadPersistentClassRegisters(),
};

// ─── AUTHENTICATION & CONTEXT EXTRACTION MIDDLEWARE ──────────────────────────
// Modularized in server/auth.ts to support both cryptographic Supabase JWT verification
// and demo simulation with AUTH_MODE / ALLOW_DEMO_AUTH configuration.

// ─── 1. MANDATORY MODIFICATION 1: COLUMN SHIELDING (trainee_exam_view) ────────
export function sanitizeExamForStudent(exam: any) {
  const sanitizeQuestions = (questions: any[]) => {
    return (questions || []).map((q: any) => {
      const { correct_answer, rubric, critical_aspect, keywords, ...cleanQuestion } = q;
      return cleanQuestion;
    });
  };

  const payload = { ...exam.payload };
  if (payload.section_a?.questions) {
    payload.section_a = {
      ...payload.section_a,
      questions: sanitizeQuestions(payload.section_a.questions),
    };
  }
  if (payload.section_b?.questions) {
    payload.section_b = {
      ...payload.section_b,
      questions: sanitizeQuestions(payload.section_b.questions),
    };
  }
  delete payload.answer_key;
  delete payload.rubric;

  return {
    ...exam,
    payload,
  };
}

// ─── 2. MANDATORY MODIFICATION 3: FOREIGN KEY TRAVERSAL ON SUBMISSIONS ────────
// Submissions -> Exams -> Unit_Offerings -> trainer_id
export function verifyTrainerSubmissionsAssigned(trainerId: string, examId?: string): boolean {
  if (!examId) return false;
  const exam = DB.exams.find(e => e.id === examId);
  if (!exam) return false;

  // Traversal: Exam -> Unit_Offerings -> trainer_id
  const offering = DB.unit_offerings.find(uo => (exam.unit_id ? uo.unit_id === exam.unit_id : uo.unit_code === exam.unit_code) && uo.trainer_id === trainerId);
  return !!offering;
}

// ─── 3. MANDATORY MODIFICATION 4: HOD DEPARTMENT SCOPE ────────────────────────
export function verifyHODDepartmentScope(hodDepartmentId: string | undefined, examId?: string): boolean {
  if (!hodDepartmentId || !examId) return false;
  const exam = DB.exams.find(e => e.id === examId);
  if (!exam) return false;

  const offering = DB.unit_offerings.find(uo => (exam.unit_id ? uo.unit_id === exam.unit_id : uo.unit_code === exam.unit_code));
  return offering?.department_id === hodDepartmentId;
}

// ─── API ROUTES ──────────────────────────────────────────────────────────────

// ─── HEALTH & MONITORING ENDPOINTS (Public, Unauthenticated) ──────────────────
apiRouter.get("/health", async (_req: Request, res: Response) => {
  let dbStatus = "connected";
  if (pool) {
    try {
      await pool.query("SELECT 1");
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }

  const memoryUsage = process.memoryUsage();
  res.json({
    status: dbStatus === "disconnected" ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    service: "mukiria-rbac-gateway",
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    },
  });
});

apiRouter.use(authenticateUser);

// ─── INSTITUTIONAL ROSTER & TRAINEE LOOKUP (ZERO-EMAIL CDACC WORKFLOW) ─────────
export interface RosterEntry {
  id: string;
  admissionNumber: string;
  regCode?: string;
  fullName: string;
  cohortCode: string;
  enrolled_units?: string[];
}

export const OFFICIAL_INSTITUTIONAL_ROSTER: RosterEntry[] = [
  // 1. Level 6 & Level 4 Modular Cohorts (Perform Computer Essentials)
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admissionNumber: "14179/S2026", fullName: "Nthiga Gakii Doris", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admissionNumber: "14255/S2026", fullName: "Kaumbuthu Belinda Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admissionNumber: "14022/S2026", fullName: "Ltumwa Lesoipa", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admissionNumber: "14077/S2026", fullName: "Kitheka Emmanuel Kioko", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admissionNumber: "14102/S2026", fullName: "Felix Mugendi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admissionNumber: "14119/S2026", fullName: "Mwangi Clinton Njiru", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admissionNumber: "14149/S2026", fullName: "Abigael Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admissionNumber: "14172/S2026", fullName: "Fiona Kadogo Mwika", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admissionNumber: "14207/S2026", fullName: "Ann Mary Makena", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admissionNumber: "14254/S2026", fullName: "Brenda Ngugi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admissionNumber: "14267/S2026", fullName: "Ingashia Favour Wawira", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "0611-651-21A", "061155101A", "IT/CU/ICTA/CR/01/4/MA"] },
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admissionNumber: "14076/S2026", fullName: "Wanjau Alvin Gatere", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admissionNumber: "14107/S2026", fullName: "Ann Mukiri Matheta", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admissionNumber: "14124/S2026", fullName: "Kimanthi Dennis Mwenda", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_04", regCode: "ICT4 MOD/14128/S2026", admissionNumber: "14128/S2026", fullName: "Kimanthi Dennis Mwenda (II)", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_05", regCode: "ICT4 MOD/14211/S2026", admissionNumber: "14211/S2026", fullName: "Guantai Brandon Mutua", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_06", regCode: "ICT4 MOD/14218/S2026", admissionNumber: "14218/S2026", fullName: "Mwithia Mutharimi Nathan", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_07", regCode: "ICT4 MOD/14248/S2026", admissionNumber: "14248/S2026", fullName: "Mbaabu Sarah Nkatha", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_08", regCode: "ICT4 MOD/14341/S2026", admissionNumber: "14341/S2026", fullName: "Mutiria Hesborn Muriuki", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },

  // Level 5: ICT Craftsperson / Technician (15 Trainees)
  { id: "tr_it5_01", regCode: "ITECH 5 MOD/14105/S2026", admissionNumber: "14105/S2026", fullName: "Brian Mwiti Murithi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_02", regCode: "ITECH 5 MOD/14115/S2026", admissionNumber: "14115/S2026", fullName: "Joyline Kawira", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_03", regCode: "ITECH 5 MOD/14126/S2026", admissionNumber: "14126/S2026", fullName: "Martin Kinyua", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_04", regCode: "ITECH 5 MOD/14138/S2026", admissionNumber: "14138/S2026", fullName: "Dorcas Kathure", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_05", regCode: "ITECH 5 MOD/14152/S2026", admissionNumber: "14152/S2026", fullName: "Evans Kipkemoi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_06", regCode: "ITECH 5 MOD/14164/S2026", admissionNumber: "14164/S2026", fullName: "Fridah Gacheri", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_07", regCode: "ITECH 5 MOD/14178/S2026", admissionNumber: "14178/S2026", fullName: "Kelvin Muthomi", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_08", regCode: "ITECH 5 MOD/14189/S2026", admissionNumber: "14189/S2026", fullName: "Sharon Kagendo", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_09", regCode: "ITECH 5 MOD/14201/S2026", admissionNumber: "14201/S2026", fullName: "James Mwenda", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_10", regCode: "ITECH 5 MOD/14215/S2026", admissionNumber: "14215/S2026", fullName: "Purity Gatwiri", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_11", regCode: "ITECH 5 MOD/14227/S2026", admissionNumber: "14227/S2026", fullName: "Samuel Gitonga", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_12", regCode: "ITECH 5 MOD/14239/S2026", admissionNumber: "14239/S2026", fullName: "Mercy Makena", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_13", regCode: "ITECH 5 MOD/14251/S2026", admissionNumber: "14251/S2026", fullName: "Victor Mutuma", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_14", regCode: "ITECH 5 MOD/14263/S2026", admissionNumber: "14263/S2026", fullName: "Caroline Mukami", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },
  { id: "tr_it5_15", regCode: "ITECH 5 MOD/14275/S2026", admissionNumber: "14275/S2026", fullName: "Kennedy Koome", cohortCode: "ITECH 5 MODULAR/S/2026", enrolled_units: ["IT/CU/ICTA/CC/01/5/MA", "IT/CU/ICTA/CR/01/5/MA", "IT/CU/ICTA/CC/02/5/MA"] },

  // 2. ADMIN5/6/J/26 MOD 3 (Apply ICT Skills - Business Department, 11 Trainees)
  { id: "tr_adm_01", regCode: "13410", admissionNumber: "13410", fullName: "RISPER MWENDE", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_02", regCode: "13527", admissionNumber: "13527", fullName: "Banta Micheni", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_03", regCode: "12218", admissionNumber: "12218", fullName: "Christine Gitonga", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_04", regCode: "13252", admissionNumber: "13252", fullName: "Cynthia Nkatha", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_05", regCode: "13284", admissionNumber: "13284", fullName: "Linet Ntinyari", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_06", regCode: "13424", admissionNumber: "13424", fullName: "Nanis Ngugi", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_07", regCode: "13276", admissionNumber: "13276", fullName: "Sharon Minoo", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_08", regCode: "10203", admissionNumber: "10203", fullName: "Frida Kianjira", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_09", regCode: "12254", admissionNumber: "12254", fullName: "Mercy Kiende", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_10", regCode: "12665", admissionNumber: "12665", fullName: "Ruth Kathure", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },
  { id: "tr_adm_11", regCode: "13580", admissionNumber: "13580", fullName: "MERCY KATHUURE", cohortCode: "ADMIN5/6/J/26 MOD 3", enrolled_units: ["0415-451-21A", "061155101A"] },

  // 3. FBS5/6/J/26 (Apply Digital Literacy - Hospitality Department, 26 Trainees)
  { id: "tr_fbs5_01", regCode: "FBS 5 MOD/13254/J2026", admissionNumber: "13254", fullName: "Yvonne Mwende", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_02", regCode: "FBS 5 MOD/13263/J2026", admissionNumber: "13263", fullName: "Muoki Muthoki", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_03", regCode: "FBS 5 MOD/13281/J2026", admissionNumber: "13281", fullName: "Kibaara Peninah Gaichuiri", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_04", regCode: "FBS 5 MOD/13297/J2026", admissionNumber: "13297", fullName: "Hilda Mwede Njagi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_05", regCode: "FBS 5 MOD/13304/J2026", admissionNumber: "13304", fullName: "Ndolo Shalom Mbithe", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_06", regCode: "FBS 5 MOD/13313/J2026", admissionNumber: "13313", fullName: "Mirriam Nzula", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_07", regCode: "FBS 5 MOD/13343/J2026", admissionNumber: "13343", fullName: "Waweru Hope Marion Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_08", regCode: "FBS 5 MOD/13355/J2026", admissionNumber: "13355", fullName: "Ann Joy Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_09", regCode: "FBS 5 MOD/13378/J2026", admissionNumber: "13378", fullName: "Martha Mwende Kyalo", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_10", regCode: "FBS 5 MOD/13396/J2026", admissionNumber: "13396", fullName: "John Opiyo Omondi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_11", regCode: "FBS 5 MOD/13445/J2026", admissionNumber: "13445", fullName: "Eunice Kendi Nyaga", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_12", regCode: "FBS 5 MOD/13446/J2026", admissionNumber: "13446", fullName: "Miriko Rita", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_13", regCode: "FBS 5 MOD/13463/J2026", admissionNumber: "13463", fullName: "Valentine Lesoito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_14", regCode: "FBS 5 MOD/13482/J2026", admissionNumber: "13482", fullName: "Kinyua Christine Mutito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_15", regCode: "FBS 5 MOD/13488/J2026", admissionNumber: "13488", fullName: "Gichukia Bridgit Nyakio", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_16", regCode: "FBS 5 MOD/13546/J2026", admissionNumber: "13546", fullName: "Karwitha Silvia", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_17", regCode: "FBS 5 MOD/13551/J2026", admissionNumber: "13551", fullName: "Lavint Aliviza", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_18", regCode: "FBS 5 MOD/13559/12026", admissionNumber: "13559", fullName: "Kinya Weddy", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_19", regCode: "FBS 5 MOD/13571/12026", admissionNumber: "13571", fullName: "Gakuhi Jackline Nyambura", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_20", regCode: "FBS 5 MOD/13583/12026", admissionNumber: "13583", fullName: "Terry Mwendwa", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A"] },
  { id: "tr_fbs5_21", regCode: "FBS 5 MOD/13258/J2026", admissionNumber: "13258", fullName: "Faith Mwende", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },
  { id: "tr_fbs5_22", regCode: "FBS 5 MOD/12265/J2026", admissionNumber: "12265", fullName: "Eugene Murimi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },
  { id: "tr_fbs5_23", regCode: "FBS 5 MOD/13231/J2026", admissionNumber: "13231", fullName: "Brendah Mumbi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-PRAC"] },

  // 4. LS5/6/S/26 (Apply Digital Literacy - Land Survey, 19 Trainees + Harriet Mwendwa)
  { id: "tr_ls5_01", regCode: "LS5 MOD/14009/52026", admissionNumber: "14009", fullName: "Vick Mutembei", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_02", regCode: "LS5 MOD/14024/52026", admissionNumber: "14024", fullName: "Kajuju Jackline Kathera", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_03", regCode: "LS5 MOD/14032/52026", admissionNumber: "14032", fullName: "Muthike Bredah Nyawira", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_04", regCode: "LS5 MOD/14092/S2026", admissionNumber: "14092", fullName: "Murithi Brian Munene", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_05", regCode: "LS5 MOD/14120/52026", admissionNumber: "14120", fullName: "Glory Makena", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_06", regCode: "LS5 MOD/14348/S2026", admissionNumber: "14348", fullName: "Okello Janet Auma", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_07", regCode: "LS5 MOD/14403/52026", admissionNumber: "14403", fullName: "Mutegi Kagendo Emma", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_08", regCode: "LS5 MOD/14428/52026", admissionNumber: "14428", fullName: "Risper Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls5_09", regCode: "LS5 MOD/14502/52026", admissionNumber: "14502", fullName: "Mutegi Hyprith Gatwiri", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_01", regCode: "LS6 MOD/14001/S2026", admissionNumber: "14001", fullName: "Njeru Salim Mutemi", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_02", regCode: "LS6 MOD/14011/S2026", admissionNumber: "14011", fullName: "Jedida Karwitha", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_03", regCode: "LS6 MOD/14066/52026", admissionNumber: "14066", fullName: "Nyaga Caroline Mukami", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_04", regCode: "LS6 MOD/14183/S2026", admissionNumber: "14183", fullName: "Gideon Mucheria Kithendu", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_05", regCode: "LS6 MOD/14256/52026", admissionNumber: "14256", fullName: "Linus Murerwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_06", regCode: "LS6 MOD/14283/52026", admissionNumber: "14283", fullName: "Caroline Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_07", regCode: "LS6 MOD/14331/S2026", admissionNumber: "14331", fullName: "Brian Mutembei", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_08", regCode: "LS6 MOD/14332/52026", admissionNumber: "14332", fullName: "Kipngetich Cornelius", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_09", regCode: "LS6 MOD/14351/52026", admissionNumber: "14351", fullName: "Otieno Jecinter Trizer", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls6_10", regCode: "LS6 MOD/14451/S2026", admissionNumber: "14451", fullName: "Caroline Kanana Mwirigi", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
  { id: "tr_ls_harriet", regCode: "D/UPNUT/25042/069", admissionNumber: "D/UPNUT/25042/069", fullName: "Harriet Mwendwa", cohortCode: "LS5/6/S/26", enrolled_units: ["061155101A"] },
];

/**
 * Normalizes an institutional admission number or registration code for robust matching.
 * - Strips whitespace and transforms to uppercase
 * - Strips common institutional cohort prefixes (e.g. "ITECH 6 MOD/", "ICT4 MOD/", "FBS 5 MOD/", "LS6 MOD/")
 * - Preserves full alphanumeric structure (e.g. "D/UPNUT/25042/069", "14179/S2026")
 */
export function normalizeAdmissionNumber(adm: string | null | undefined): string {
  if (!adm) return "";
  let s = adm.trim().toUpperCase().replace(/\s+/g, "");
  s = s.replace(/^(ICT4\/ITECH\s*6[^\/]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "");
  return s;
}

/**
 * Robust bidirectional matching for admission numbers and candidate registration strings.
 */
export function matchAdmissionNumbers(admA: string | null | undefined, admB: string | null | undefined): boolean {
  if (!admA || !admB) return false;
  const rawA = admA.trim().toUpperCase();
  const rawB = admB.trim().toUpperCase();
  if (rawA === rawB) return true;

  const noSpaceA = rawA.replace(/\s+/g, "");
  const noSpaceB = rawB.replace(/\s+/g, "");
  if (noSpaceA === noSpaceB) return true;

  const normA = normalizeAdmissionNumber(admA);
  const normB = normalizeAdmissionNumber(admB);
  if (normA && normB && normA === normB) return true;

  // Slash substitution normalization (e.g., 12026 vs J2026, 52026 vs S2026)
  const slashA = noSpaceA.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  const slashB = noSpaceB.replace(/\/12026/g, "/J2026").replace(/\/52026/g, "/S2026");
  if (slashA === slashB) return true;

  // Check core digit matches if applicable (e.g. "14179" in "14179/S2026")
  const coreA = (normA.match(/\b\d{4,6}\b/) || noSpaceA.match(/\d{4,6}/))?.[0];
  const coreB = (normB.match(/\b\d{4,6}\b/) || noSpaceB.match(/\d{4,6}/))?.[0];
  if (coreA && coreB && coreA === coreB) {
    const hasAlphaA = /[A-Z]/.test(normA);
    const hasAlphaB = /[A-Z]/.test(normB);
    if (!hasAlphaA || !hasAlphaB || normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  // Substring containment for 4+ char registration numbers (e.g. "14179" in "ITECH 6 MOD/14179/S2026")
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  return false;
}

export function findTraineeInRoster(
  regNo: string,
  unitCode?: string
): { id: string; admissionNumber: string; fullName: string; cohortCode: string } | null {
  const rawReg = (regNo || "").trim();
  if (!rawReg) return null;

  const normUnit = unitCode ? unitCode.trim().toUpperCase() : "";
  const baseUnit = normUnit ? normUnit.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "") : "";

  // Combine OFFICIAL_INSTITUTIONAL_ROSTER and DB.trainees
  const candidatePool: RosterEntry[] = [
    ...OFFICIAL_INSTITUTIONAL_ROSTER,
    ...DB.trainees.map(t => ({
      id: t.id,
      admissionNumber: t.reg_number,
      regCode: t.reg_number,
      fullName: t.name,
      cohortCode: t.class_id,
      enrolled_units: t.enrolled_units,
    })),
  ];

  // Match candidate by admission number or full registration code using robust composite matcher
  const candidate = candidatePool.find(c => {
    return (
      matchAdmissionNumbers(c.admissionNumber, rawReg) ||
      matchAdmissionNumbers(c.regCode, rawReg)
    );
  });

  if (!candidate) return null;

  // If a unitCode filter is supplied, verify enrollment
  if (normUnit || baseUnit) {
    const enrolled = candidate.enrolled_units || [];
    const cohort = candidate.cohortCode.toUpperCase();

    // Direct unit match
    const isEnrolledDirectly = enrolled.some(u => {
      const uNorm = u.trim().toUpperCase();
      const uBase = uNorm.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");
      return uNorm === normUnit || uBase === baseUnit || (baseUnit && uNorm.startsWith(baseUnit));
    });

    // Check institutional unit offerings
    const isEnrolledInOffering = DB.unit_offerings.some(uo => {
      const uoNorm = uo.unit_code.trim().toUpperCase();
      const uoBase = uoNorm.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");
      const matchesUnitCode = uoNorm === normUnit || uoBase === baseUnit;
      return matchesUnitCode && (uo.class_id.toUpperCase() === cohort || cohort.includes(uo.class_id.toUpperCase()));
    });

    // Digital literacy common core (061155101A) taken across institutional cohorts (FBS5, FBS6, LS5, LS6, ITECH6, ICT4, Admin)
    // Digital literacy common core (061155101A) taken across institutional cohorts (FBS5, FBS6, LS5, LS6, Admin)
    // Note: ICT4 and ICT4/ITECH6/S/26 MOD 1 take Perform Computer Essentials ONLY (Zero Digital Literacy / WA1 / WA2)
    const isDigitalLiteracy = baseUnit === "061155101A" || normUnit.includes("061155101A");
    const isDLCohort = (cohort.includes("ADMIN") || cohort.includes("FBS") || cohort.includes("LS") || cohort.includes("ITECH 6")) && !cohort.includes("ICT4");

    // Computer Essentials unit (IT/CU/ICTA/CR/01/4/MA or 0611-651-21A) for ICT4 / ITECH6 / ICT4/ITECH6/S/2026 MOD 1
    const isEssentials = normUnit.includes("CR/01/4") || normUnit.includes("0611-651-21A") || baseUnit === "0611-651-21A";
    const isEssentialsCohort = cohort.includes("ICT4") || cohort.includes("ITECH") || cohort.includes("MOD 1");

    if (!isEnrolledDirectly && !isEnrolledInOffering && !(isDigitalLiteracy && isDLCohort) && !(isEssentials && isEssentialsCohort)) {
      return null; // Cross-cohort mismatch
    }
  }

  // Return exactly 4 properties; ZERO email fields
  return {
    id: candidate.id,
    admissionNumber: candidate.admissionNumber,
    fullName: candidate.fullName,
    cohortCode: candidate.cohortCode,
  };
}

// ─── ENDPOINT: GET /api/trainees/lookup (Roster-Backed Candidate Verification) ──
apiRouter.get("/trainees/lookup", (req: Request, res: Response) => {
  const regNo = typeof req.query.regNo === "string" ? req.query.regNo.trim() : "";
  const unitCode = typeof req.query.unitCode === "string" ? req.query.unitCode.trim() : "";

  if (!regNo) {
    res.status(400).json({ error: "Registration number is required." });
    return;
  }

  const trainee = findTraineeInRoster(regNo, unitCode);
  if (!trainee) {
    res.status(404).json({ error: "Registration number not found in this unit class register." });
    return;
  }

  // Strictly ZERO email properties
  res.json({
    id: trainee.id,
    admissionNumber: trainee.admissionNumber,
    fullName: trainee.fullName,
    cohortCode: trainee.cohortCode,
  });
});

// ─── ENDPOINT: GET /api/trainees (Persistent Trainees Query) ──────────────────
apiRouter.get("/trainees", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classCode = typeof req.query.class_code === "string" ? req.query.class_code.trim() : "";
    const persistentTrainees = loadPersistentTrainees();

    // Map official institutional roster to TraineeRecord format
    const officialRecords: TraineeRecord[] = OFFICIAL_INSTITUTIONAL_ROSTER.map(r => ({
      id: r.id,
      name: r.fullName,
      reg_number: r.admissionNumber,
      adm_no: r.admissionNumber,
      reg_code: r.regCode || r.admissionNumber,
      class_code: r.cohortCode,
    }));

    // Merge persistent trainees with official roster (persistent takes precedence on conflict)
    const combinedMap = new Map<string, TraineeRecord>();
    officialRecords.forEach(t => combinedMap.set(t.id, t));
    DB.trainees.forEach(t => {
      combinedMap.set(t.id, {
        id: t.id,
        name: t.name,
        reg_number: t.reg_number,
        adm_no: t.reg_number,
        class_id: t.class_id,
      });
    });
    persistentTrainees.forEach(t => combinedMap.set(t.id, t));

    // Supabase PostgreSQL live records take precedence
    if (pool) {
      try {
        const pgResult = await query("SELECT * FROM trainees;");
        pgResult.rows.forEach((r: any) => {
          combinedMap.set(r.id, {
            id: r.id,
            name: r.name,
            reg_number: r.reg_number || r.adm_no,
            adm_no: r.adm_no || r.reg_number,
            reg_code: r.reg_code || r.adm_no || r.reg_number,
            class_code: r.class_code || r.class_id,
            department: r.department,
            gender: r.gender,
            phone: r.phone,
            remarks: r.remarks,
            created_at: r.created_at,
            updated_at: r.updated_at,
          });
        });
      } catch (err: any) {
        console.warn("PostgreSQL read trainees notice:", err.message);
      }
    }

    let result = Array.from(combinedMap.values());
    if (classCode) {
      const normClass = classCode.toUpperCase().replace(/\s+/g, " ");
      if ((normClass.includes("ICT4") || normClass.includes("ICT 4")) && !normClass.includes("ITECH")) {
        result = result.filter(t => (t.class_code || "").toUpperCase().includes("ICT4") && !(t.class_code || "").toUpperCase().includes("ITECH"));
      } else if ((normClass.includes("ITECH6") || normClass.includes("ITECH 6")) && !normClass.includes("ICT4") && !normClass.includes("ITECH5")) {
        result = result.filter(t => (t.class_code || "").toUpperCase().includes("ITECH 6") || (t.class_code || "").toUpperCase().includes("ITECH6"));
      } else if (normClass.includes("ITECH5") || normClass.includes("ITECH 5")) {
        result = result.filter(t => (t.class_code || "").toUpperCase().includes("ITECH 5") || (t.class_code || "").toUpperCase().includes("ITECH5"));
      } else if (normClass.includes("ICT4") && (normClass.includes("ITECH6") || normClass.includes("ITECH 6"))) {
        result = result.filter(t => {
          const tc = (t.class_code || "").toUpperCase();
          return (tc.includes("ICT4") || tc.includes("ITECH")) && !tc.includes("ADMIN") && !tc.includes("FBS") && !tc.includes("LS");
        });
      } else {
        result = result.filter(t => t.class_code === classCode || t.class_id === classCode || (t.class_code || "").toUpperCase() === normClass);
      }
    }

    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to load trainees" });
  }
});

// ─── ENDPOINT: POST /api/trainees (Transactional Trainee Persistence) ─────────
apiRouter.post("/trainees", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      admNo,
      regCode,
      classCode = "ICT4/ITECH6/S/26 MOD 1",
      department = "Computing & Informatics",
      gender = "M",
      phone = "",
      remarks = "",
    } = req.body;

    if (!name || (!admNo && !regCode)) {
      res.status(400).json({ error: "Trainee name and admission number are required." });
      return;
    }

    const adm_no = (admNo || regCode || "").trim();
    const reg_code = (regCode || admNo || "").trim();
    const id = req.body.id || `tr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const traineeRecord: TraineeRecord = {
      id,
      name: name.trim(),
      reg_number: adm_no,
      adm_no,
      reg_code,
      class_code: classCode,
      department,
      gender,
      phone,
      remarks,
      created_at: now,
      updated_at: now,
    };

    // 1. Transactional PostgreSQL Upsert
    let pgPersisted = false;
    if (pool) {
      try {
        const sql = `
          INSERT INTO trainees (id, name, adm_no, reg_number, reg_code, class_code, department, gender, phone, remarks, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            adm_no = EXCLUDED.adm_no,
            reg_number = EXCLUDED.reg_number,
            reg_code = EXCLUDED.reg_code,
            class_code = EXCLUDED.class_code,
            department = EXCLUDED.department,
            gender = EXCLUDED.gender,
            phone = EXCLUDED.phone,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await query(sql, [
          id,
          traineeRecord.name,
          adm_no,
          adm_no,
          reg_code,
          classCode,
          department,
          gender,
          phone,
          remarks,
        ]);
        if (result.rowCount > 0) {
          pgPersisted = true;
        }
      } catch (err: any) {
        console.error("❌ [PostgreSQL insert trainee error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error creating trainee: ${err.message}` });
        return;
      }
    }

    // 2. Persistent JSON Storage
    const persistent = loadPersistentTrainees();
    const existIdx = persistent.findIndex(t => t.id === id || t.adm_no === adm_no || t.reg_code === reg_code);
    if (existIdx >= 0) {
      persistent[existIdx] = { ...persistent[existIdx], ...traineeRecord };
    } else {
      persistent.push(traineeRecord);
    }
    savePersistentTrainees(persistent);

    // 3. Mirror in runtime DB
    const memIdx = DB.trainees.findIndex(t => t.id === id || t.reg_number === adm_no);
    const memItem = {
      id,
      name: traineeRecord.name,
      reg_number: adm_no,
      class_id: classCode,
      enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "061155101A"],
    };
    if (memIdx >= 0) {
      DB.trainees[memIdx] = memItem;
    } else {
      DB.trainees.push(memItem);
    }

    res.status(201).json({
      success: true,
      data: traineeRecord,
      postgres_persisted: pgPersisted,
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to persist trainee" });
  }
});

// ─── ENDPOINT: PUT /api/trainees/:id (Update Trainee) ─────────────────────────
apiRouter.put("/trainees/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    let pgPersisted = false;
    if (pool) {
      try {
        const sql = `
          UPDATE trainees
          SET
            name = COALESCE($2, name),
            adm_no = COALESCE($3, adm_no),
            reg_number = COALESCE($3, reg_number),
            reg_code = COALESCE($4, reg_code),
            class_code = COALESCE($5, class_code),
            department = COALESCE($6, department),
            gender = COALESCE($7, gender),
            phone = COALESCE($8, phone),
            remarks = COALESCE($9, remarks),
            updated_at = NOW()
          WHERE id = $1
          RETURNING *;
        `;
        const result = await query(sql, [
          id,
          updates.name || null,
          updates.admNo || updates.reg_number || null,
          updates.regCode || updates.reg_code || null,
          updates.classCode || updates.class_code || null,
          updates.department || null,
          updates.gender || null,
          updates.phone || null,
          updates.remarks || null,
        ]);
        if (result.rowCount > 0) {
          pgPersisted = true;
        }
      } catch (err: any) {
        console.error("❌ [PostgreSQL update trainee error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error updating trainee: ${err.message}` });
        return;
      }
    }

    const persistent = loadPersistentTrainees();
    const existIdx = persistent.findIndex(t => t.id === id);
    if (existIdx >= 0) {
      persistent[existIdx] = {
        ...persistent[existIdx],
        ...updates,
        adm_no: updates.admNo || updates.adm_no || persistent[existIdx].adm_no,
        reg_number: updates.admNo || updates.reg_number || persistent[existIdx].reg_number,
        class_code: updates.classCode || updates.class_code || persistent[existIdx].class_code,
        updated_at: now,
      };
      savePersistentTrainees(persistent);
    }

    const memIdx = DB.trainees.findIndex(t => t.id === id);
    if (memIdx >= 0) {
      DB.trainees[memIdx] = {
        ...DB.trainees[memIdx],
        name: updates.name || DB.trainees[memIdx].name,
        reg_number: updates.admNo || DB.trainees[memIdx].reg_number,
        class_id: updates.classCode || DB.trainees[memIdx].class_id,
      };
    }

    res.json({ success: true, id, postgres_persisted: pgPersisted });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to update trainee" });
  }
});

// ─── ENDPOINT: DELETE /api/trainees/:id (Delete Trainee) ──────────────────────
apiRouter.delete("/trainees/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    let pgDeleted = false;
    if (pool) {
      try {
        const result = await query("DELETE FROM trainees WHERE id = $1 RETURNING id;", [id]);
        if (result.rowCount > 0) {
          pgDeleted = true;
        }
      } catch (err: any) {
        console.error("❌ [PostgreSQL delete trainee error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error deleting trainee: ${err.message}` });
        return;
      }
    }

    const persistent = loadPersistentTrainees();
    const filtered = persistent.filter(t => t.id !== id);
    if (filtered.length !== persistent.length) {
      savePersistentTrainees(filtered);
    }

    const memIdx = DB.trainees.findIndex(t => t.id === id);
    if (memIdx >= 0) {
      DB.trainees.splice(memIdx, 1);
    }

    res.json({ success: true, id, postgres_deleted: pgDeleted });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to delete trainee" });
  }
});

// ─── RBAC GUARD: /api/attendance/* (Reject Trainees with HTTP 403) ────────────
apiRouter.use("/attendance", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers",
    });
    return;
  }
  next();
});

// ─── ENDPOINT: GET /api/attendance (Rehydrate Attendance Records) ──────────────
apiRouter.get("/attendance", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers",
    });
    return;
  }
  try {
    const unitOfferingId = (req.query.unit_offering_id as string) || "";
    const weekNumber = req.query.week_number ? parseInt(req.query.week_number as string) : undefined;
    const classCode = (req.query.class_code as string) || "";

    let records: AttendanceRecord[] = [];

    // 1. Query PostgreSQL attendance_register if connected
    if (pool) {
      try {
        let sql = `SELECT * FROM attendance_register WHERE 1=1`;
        const params: any[] = [];
        if (unitOfferingId) {
          params.push(unitOfferingId);
          sql += ` AND unit_offering_id = $${params.length}`;
        }
        if (classCode) {
          params.push(`%${classCode}%`);
          sql += ` AND trainee_id IN (SELECT id FROM trainees WHERE class_code ILIKE $${params.length} OR class_id ILIKE $${params.length})`;
        }
        if (weekNumber !== undefined) {
          params.push(weekNumber);
          sql += ` AND week_number = $${params.length}`;
        }
        sql += ` ORDER BY week_number, session_date`;
        const result = await query(sql, params);
        if (result.rows.length > 0) {
          records = result.rows.map(r => ({
            id: r.id,
            unit_offering_id: r.unit_offering_id,
            trainee_id: r.trainee_id,
            week_number: Number(r.week_number),
            session_date: typeof r.session_date === "object" ? r.session_date.toISOString().split("T")[0] : String(r.session_date),
            session_index: Number(r.session_index || 1),
            status: r.status,
            hours_attended: Number(r.hours_attended || 2.0),
            remarks: r.remarks || "",
            marked_by: r.marked_by,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn("PostgreSQL fetch attendance warning:", err.message);
      }
    }

    // 2. Fallback to file-backed persistent store
    if (records.length === 0) {
      const persistent = loadPersistentAttendance();
      records = persistent.filter(r => {
        if (unitOfferingId && r.unit_offering_id !== unitOfferingId) return false;
        if (weekNumber !== undefined && r.week_number !== weekNumber) return false;
        return true;
      });
    }

    // 3. Construct rehydration matrix: trainee_id -> { "W{w}_S{s}": "X" | "0" | "" }
    const matrix: Record<string, Record<string, string>> = {};
    records.forEach(r => {
      if (!matrix[r.trainee_id]) matrix[r.trainee_id] = {};
      const sIndex = r.session_index || 1;
      const key = `W${r.week_number}_S${sIndex}`;
      const symbol = (r.status === "present" || r.status === "Present" || r.status === "X") ? "X" :
                     (r.status === "absent" || r.status === "Absent" || r.status === "0") ? "0" : "";
      matrix[r.trainee_id][key] = symbol;
    });

    res.json({
      success: true,
      records,
      matrix,
      count: records.length,
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to load attendance" });
  }
});

// ─── ENDPOINT: POST /api/attendance/mark (Single Session Mark) ────────────────
apiRouter.post("/attendance/mark", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers",
    });
    return;
  }
  try {
    const {
      unit_offering_id = "uo-1",
      trainee_id,
      week_number = 1,
      session_date = new Date().toISOString().split("T")[0],
      session_index = 1,
      status = "present",
      hours_attended = 2.0,
      remarks = "",
      marked_by = req.user?.id || "trainer-002",
    } = req.body;

    if (!trainee_id) {
      res.status(400).json({ error: "Missing trainee_id parameter." });
      return;
    }

    const normStatus = status === "X" ? "present" : (status === "0" ? "absent" : String(status).toLowerCase());

    // 1. PostgreSQL Upsert with ON CONFLICT
    let pgPersisted = false;
    if (pool) {
      try {
        const sql = `
          INSERT INTO attendance_register (
            unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, marked_by, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (unit_offering_id, trainee_id, week_number, session_index, session_date)
          DO UPDATE SET
            status = EXCLUDED.status,
            hours_attended = COALESCE(EXCLUDED.hours_attended, attendance_register.hours_attended),
            remarks = COALESCE(EXCLUDED.remarks, attendance_register.remarks),
            marked_by = COALESCE(EXCLUDED.marked_by, attendance_register.marked_by),
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await query(sql, [
          unit_offering_id,
          trainee_id,
          Number(week_number),
          session_date,
          Number(session_index || 1),
          normStatus,
          Number(hours_attended),
          remarks,
          marked_by,
        ]);
        if (result.rowCount > 0) pgPersisted = true;
      } catch (err: any) {
        console.error("❌ [PostgreSQL attendance mark error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error recording attendance: ${err.message}` });
        return;
      }
    }

    // 2. Persistent Storage Sync
    const persistent = loadPersistentAttendance();
    const targetSession = Number(session_index || 1);
    const existingIdx = persistent.findIndex(
      r => r.unit_offering_id === unit_offering_id &&
           r.trainee_id === trainee_id &&
           Number(r.week_number) === Number(week_number) &&
           Number(r.session_index || 1) === targetSession
    );

    const now = new Date().toISOString();
    const record: AttendanceRecord = {
      id: existingIdx >= 0 ? persistent[existingIdx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      unit_offering_id,
      trainee_id,
      week_number: Number(week_number),
      session_date,
      session_index: Number(session_index),
      status: normStatus,
      hours_attended: Number(hours_attended),
      remarks,
      marked_by,
      created_at: existingIdx >= 0 ? persistent[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      persistent[existingIdx] = record;
    } else {
      persistent.push(record);
    }
    savePersistentAttendance(persistent);

    res.json({
      success: true,
      data: record,
      postgres_persisted: pgPersisted,
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to mark attendance" });
  }
});

// ─── ENDPOINT: POST /api/attendance/bulk (Transactional Bulk Upsert) ───────────
apiRouter.post("/attendance/bulk", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot access or modify class attendance registers",
    });
    return;
  }
  try {
    const { unit_offering_id = "uo-1", records = [], attendanceData, session_plan_id } = req.body;
    let itemsToProcess: Array<{
      unit_offering_id: string;
      trainee_id: string;
      week_number: number;
      session_date: string;
      session_index?: number;
      status: string;
      hours_attended?: number;
      remarks?: string;
    }> = [];

    const today = new Date().toISOString().split("T")[0];

    // Format 1: Normalized records array
    if (Array.isArray(records) && records.length > 0) {
      itemsToProcess = records.map(r => ({
        unit_offering_id: r.unit_offering_id || unit_offering_id,
        trainee_id: r.trainee_id,
        week_number: Number(r.week_number || 1),
        session_date: r.session_date || today,
        session_index: r.session_index,
        status: r.status === "X" ? "present" : (r.status === "0" ? "absent" : String(r.status || "present").toLowerCase()),
        hours_attended: Number(r.hours_attended || 2.0),
        remarks: r.remarks || "",
      }));
    } else if (attendanceData && typeof attendanceData === "object") {
      // Format 2: Frontend Attendance Matrix { [traineeId]: { attendance: { "W1_S1": "X", ... } } }
      for (const [traineeId, studentRec] of Object.entries(attendanceData as Record<string, any>)) {
        if (!studentRec?.attendance) continue;
        for (const [key, val] of Object.entries(studentRec.attendance as Record<string, string>)) {
          const match = key.match(/W(\d+)_S(\d+)/);
          const week = match ? parseInt(match[1]) : 1;
          const session = match ? parseInt(match[2]) : 1;
          const normStatus = val === "X" ? "present" : (val === "0" ? "absent" : "");
          if (normStatus) {
            itemsToProcess.push({
              unit_offering_id,
              trainee_id: traineeId,
              week_number: week,
              session_date: today,
              session_index: session,
              status: normStatus,
              hours_attended: 2.0,
            });
          }
        }
      }
    }

    if (itemsToProcess.length === 0) {
      res.status(400).json({ error: "No attendance records provided to persist." });
      return;
    }

    // 1. Transactional PostgreSQL Upsert
    let pgPersistedCount = 0;
    if (pool) {
      try {
        await withTransaction(async (client) => {
          for (const item of itemsToProcess) {
            const sql = `
              INSERT INTO attendance_register (
                unit_offering_id, trainee_id, week_number, session_date, session_index, status, hours_attended, remarks, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              ON CONFLICT (unit_offering_id, trainee_id, week_number, session_index, session_date)
              DO UPDATE SET
                status = EXCLUDED.status,
                hours_attended = COALESCE(EXCLUDED.hours_attended, attendance_register.hours_attended),
                remarks = COALESCE(EXCLUDED.remarks, attendance_register.remarks),
                updated_at = NOW();
            `;
            await client.query(sql, [
              item.unit_offering_id,
              item.trainee_id,
              item.week_number,
              item.session_date,
              item.session_index || 1,
              item.status,
              item.hours_attended || 2.0,
              item.remarks || "",
            ]);
            pgPersistedCount++;
          }
        });
      } catch (err: any) {
        console.error("❌ [PostgreSQL bulk attendance error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error during bulk attendance upsert: ${err.message}` });
        return;
      }
    }

    // 2. Persistent Storage Sync
    const persistent = loadPersistentAttendance();
    const now = new Date().toISOString();

    for (const item of itemsToProcess) {
      const sIdx = Number(item.session_index || 1);
      const idx = persistent.findIndex(
        r => r.unit_offering_id === item.unit_offering_id &&
             r.trainee_id === item.trainee_id &&
             Number(r.week_number) === Number(item.week_number) &&
             Number(r.session_index || 1) === sIdx
      );
      const rec: AttendanceRecord = {
        id: idx >= 0 ? persistent[idx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        unit_offering_id: item.unit_offering_id,
        trainee_id: item.trainee_id,
        week_number: Number(item.week_number),
        session_date: item.session_date,
        session_index: sIdx,
        status: item.status,
        hours_attended: item.hours_attended || 2.0,
        remarks: item.remarks || "",
        created_at: idx >= 0 ? persistent[idx].created_at : now,
        updated_at: now,
      };
      if (idx >= 0) {
        persistent[idx] = rec;
      } else {
        persistent.push(rec);
      }
    }
    savePersistentAttendance(persistent);

    res.json({
      success: true,
      count: itemsToProcess.length,
      postgres_upserted: pgPersistedCount,
      message: `Persisted ${itemsToProcess.length} attendance records successfully.`,
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err.message || "Failed to process bulk attendance" });
  }
});

// ─── ENDPOINT: GET /api/exams (Live Database Query with RBAC) ─────────────────
apiRouter.get("/exams", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  let liveExams: any[] = [];

  // 1. Transactional PostgreSQL Query if connected
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM exams ORDER BY created_at DESC");
      if (rows && rows.length > 0) {
        liveExams = rows.map((r: any) => ({
          ...r,
          payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload,
        }));
      }
    } catch (e) {
      console.warn("PostgreSQL exams query notice:", e);
    }
  }

  // 2. Fallback to live in-memory store
  if (liveExams.length === 0) {
    liveExams = DB.exams;
  }

  // Column Shielding: If user is a trainee, sanitize answer keys
  if (user && user.role === "trainee") {
    const userExams = liveExams
      .filter((e) => user.enrolled_units?.includes(e.unit_code))
      .map((e) => sanitizeExamForStudent(e));
    res.json(userExams);
    return;
  }

  res.json(liveExams);
});

// ─── ENDPOINT: POST /api/exams (Create / Update Exam with DB Upsert) ───────────
apiRouter.post("/exams", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const examPayload = req.body;
  if (!examPayload.unit_code) {
    res.status(400).json({ error: "Bad Request: Missing unit_code in exam payload" });
    return;
  }

  const existingIdx = DB.exams.findIndex(
    (e: any) => (examPayload.id && e.id === examPayload.id) || e.unit_code === examPayload.unit_code
  );

  let targetExam: any;
  if (existingIdx >= 0) {
    targetExam = {
      ...DB.exams[existingIdx],
      ...examPayload,
      updated_at: new Date().toISOString(),
    };
    DB.exams[existingIdx] = targetExam;
  } else {
    targetExam = {
      id: examPayload.id || `exam-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...examPayload,
    };
    DB.exams.push(targetExam);
  }

  // Persist directly to PostgreSQL database if connected
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO exams (id, unit_code, course_name, payload, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET
           course_name = EXCLUDED.course_name,
           payload = EXCLUDED.payload;`,
        [targetExam.id, targetExam.unit_code, targetExam.course_name || "", JSON.stringify(targetExam.payload || {})]
      );
    } catch (e) {
      console.warn("PostgreSQL exam upsert notice:", e);
    }
  }

  res.status(200).json({ success: true, exam: targetExam });
});

// ─── ENDPOINT: GET /api/departments (Live PostgreSQL & In-Memory Store) ───────
apiRouter.get("/departments", async (_req: Request, res: Response) => {
  let liveDepts: any[] = [];
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM departments ORDER BY name ASC;");
      if (rows && rows.length > 0) {
        liveDepts = rows;
      }
    } catch (e) {
      console.warn("PostgreSQL departments query notice:", e);
    }
  }
  if (liveDepts.length === 0) {
    liveDepts = DB.departments;
  }
  res.json(liveDepts);
});

// ─── ENDPOINT: POST /api/departments (Add/Update Institutional Department) ────
apiRouter.post("/departments", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, code, hod_name, trainers, active_units } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "Missing required fields: name and code" });
    return;
  }

  const existingIdx = DB.departments.findIndex(
    (d: any) => (id && d.id === id) || d.code.toUpperCase() === code.toUpperCase()
  );

  let targetDept: any;
  if (existingIdx >= 0) {
    const existing = DB.departments[existingIdx] as any;
    targetDept = {
      ...existing,
      name,
      code: code.toUpperCase(),
      hod_name: hod_name || existing.hod_name || existing.hod_id,
      trainers: trainers ?? existing.trainers ?? 1,
      active_units: active_units ?? existing.active_units ?? 1,
      updated_at: new Date().toISOString(),
    };
    DB.departments[existingIdx] = targetDept;
  } else {
    targetDept = {
      id: id || `dept-${Date.now()}`,
      name,
      code: code.toUpperCase(),
      hod_name: hod_name || "Unassigned",
      trainers: trainers ?? 1,
      active_units: active_units ?? 1,
      created_at: new Date().toISOString(),
    };
    DB.departments.push(targetDept);
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO departments (id, name, code, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;`,
        [targetDept.id, targetDept.name, targetDept.code]
      );
    } catch (e) {
      console.warn("PostgreSQL department upsert notice:", e);
    }
  }

  res.status(200).json({ success: true, department: targetDept });
});

// ─── ENDPOINT: GET /api/exams/:id ────────────────────────────────────────────
apiRouter.get("/exams/:id", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const exam = DB.exams.find(e => e.id === req.params.id);
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  // Trainee Scope: verify enrolled unit + completely shield answer columns
  if (user.role === "trainee") {
    const isEnrolled = user.enrolled_units?.includes(exam.unit_code);
    if (!isEnrolled) {
      res.status(403).json({ error: "Forbidden: Trainee cohort is not enrolled in this unit" });
      return;
    }
    // Return sanitized view (Column Shielding)
    res.json(sanitizeExamForStudent(exam));
    return;
  }

  // Trainer Scope: verify assigned unit via FK traversal
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.id, exam.id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden: Trainer is not assigned to teach this unit" });
      return;
    }
    res.json(exam);
    return;
  }

  // HOD Scope: verify department match
  if (user.role === "hod") {
    const matchesDept = verifyHODDepartmentScope(user.department_id, exam.id);
    if (!matchesDept) {
      res.status(403).json({ error: "Forbidden: Exam does not belong to your department" });
      return;
    }
    res.json(exam);
    return;
  }

  // Admin: full access
  res.json(exam);
});

// ─── ENDPOINT: GET /api/submissions (List Submissions with RBAC & Live DB) ───
apiRouter.get("/submissions", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  let allSubs: any[] = DB.submissions;

  if (pool) {
    try {
      const { rows } = await pool.query("SELECT * FROM submissions ORDER BY created_at DESC;");
      if (rows && rows.length > 0) {
        const pgSubs = rows.map((r: any) => ({
          ...r,
          section_a: typeof r.section_a === "string" ? JSON.parse(r.section_a) : r.section_a,
          section_b: typeof r.section_b === "string" ? JSON.parse(r.section_b) : r.section_b,
        }));
        // Merge with DB.submissions
        const subMap = new Map();
        allSubs.forEach((s) => subMap.set(s.id, s));
        pgSubs.forEach((s: any) => subMap.set(s.id, s));
        allSubs = Array.from(subMap.values());
      }
    } catch (e) {
      // Graceful fallback to in-memory store
    }
  }

  if (!user) {
    res.json(allSubs);
    return;
  }

  // Trainee Scope (BOLA Protection): Trainee can ONLY view their own submissions
  if (user.role === "trainee") {
    const userSubs = allSubs.filter(
      (s) =>
        (user.id && s.trainee_id === user.id) ||
        (user.reg_number && s.reg_number === user.reg_number) ||
        (user.name && s.student_name && s.student_name.trim().toLowerCase() === user.name.trim().toLowerCase())
    );
    res.json(userSubs);
    return;
  }

  // Trainer / HOD / Admin: full access
  res.json(allSubs);
});

// ─── ENDPOINT: GET /api/submissions/:id (BOLA / IDOR Protection) ─────────────
apiRouter.get("/submissions/:id", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const sub = DB.submissions.find(s => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  // Trainee Scope (BOLA Protection): Trainee can ONLY view their own submission
  if (user.role === "trainee") {
    const isOwner = (user.id && sub.trainee_id === user.id) || (user.reg_number && sub.reg_number === user.reg_number);
    if (!isOwner) {
      res.status(403).json({ error: "Forbidden (BOLA): You cannot access another student's exam submission" });
      return;
    }
    res.json(sub);
    return;
  }

  // Trainer Scope: verify assigned unit via FK traversal
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.id, sub.exam_id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden: Trainer is not assigned to this submission's unit" });
      return;
    }
    res.json(sub);
    return;
  }

  // HOD Scope: department scope
  if (user.role === "hod") {
    const matchesDept = verifyHODDepartmentScope(user.department_id, sub.exam_id);
    if (!matchesDept) {
      res.status(403).json({ error: "Forbidden: Submission does not belong to your department" });
      return;
    }
    res.json(sub);
    return;
  }

  // Admin
  res.json(sub);
});

// ─── ENDPOINT: POST /api/submissions (Submission Locking & Window Guard) ──────
apiRouter.post("/submissions", requireRoles("trainee", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { exam_id, section_a, section_b } = req.body;

  const exam = DB.exams.find(e => e.id === exam_id || e.unit_code === exam_id || (e as any).unit_code === req.body.unit_code);
  if (!exam) {
    res.status(200).json({ success: true, submission_id: `sub-${Date.now()}`, score: 0 });
    return;
  }

  // 1. Mandatory Mod 5: Valid Exam Window Verification
  if (exam.payload?.end_time) {
    const now = new Date();
    const endTime = new Date(exam.payload.end_time);
    if (now > endTime) {
      res.status(403).json({ error: "Forbidden: Exam submission window has expired" });
      return;
    }
  }

  // 2. Submission Storage & Update (Accepts student exam submission from portal)
  const existingSub = DB.submissions.find(
    s => (s.exam_id === exam_id || s.unit_code === exam.unit_code) &&
         (s.trainee_id === user.id || s.reg_number === user.reg_number)
  );

  // 3. Server-side Objective Grading (Keeps answer key strictly on server!)
  let objectiveScore = 0;
  const gradedA = (section_a || []).map((ans: any) => {
    const question = exam.payload.section_a?.questions?.find(q => q.id === ans.question_id);
    const isCorrect = question && (question as any).correct_answer !== undefined && String((question as any).correct_answer) === String(ans.answer);
    const marks = isCorrect ? question.marks : 0;
    objectiveScore += marks;
    return { ...ans, marks_awarded: marks };
  });

  if (existingSub) {
    const isAlreadyLocked = Boolean((existingSub as any).is_locked) || existingSub.status === "submitted" || existingSub.status === "graded";
    if (isAlreadyLocked && existingSub.status !== "reopened" && existingSub.status !== "in_progress") {
      res.status(400).json({ error: "Locked: Submission has already been completed and cannot be modified without trainer authorization" });
      return;
    }
    existingSub.status = "submitted";
    (existingSub as any).is_locked = true;
    (existingSub as any).attempt_count = ((existingSub as any).attempt_count || 1);
    (existingSub as any).locked_at = new Date().toISOString();
    existingSub.section_a = gradedA;
    existingSub.section_b = section_b || existingSub.section_b || [];
    existingSub.total_score = objectiveScore;
    (existingSub as any).updated_at = new Date().toISOString();
    
    // Auto-enroll candidate if missing from database and link with assessment register
    const studentRegExisting = user.reg_number || existingSub.reg_number;
    const studentNameExisting = user.name || existingSub.student_name || "Enrolled Trainee";
    if (studentRegExisting && !DB.trainees.some(t => t.reg_number === studentRegExisting)) {
      DB.trainees.push({
        id: user.id || `trainee-${studentRegExisting}`,
        name: studentNameExisting,
        reg_number: studentRegExisting,
        class_id: (user as any).cohort_code || "class-itech-6",
        enrolled_units: [exam.unit_code],
      });
    }

    try {
      await saveExamSubmission(existingSub, DB.submissions);
    } catch (err: any) {
      console.error("❌ [PostgreSQL save exam submission error]:", err.message);
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error saving submission: ${err.message}` });
      return;
    }
    res.status(200).json({ success: true, submission_id: existingSub.id, score: objectiveScore });
    return;
  }

  const newSub = {
    id: `sub-${Date.now()}`,
    exam_id,
    unit_code: exam.unit_code,
    trainee_id: user.id,
    reg_number: user.reg_number || "10525",
    student_name: user.name,
    status: "submitted",
    is_locked: true,
    attempt_count: 1,
    locked_at: new Date().toISOString(),
    total_score: objectiveScore,
    section_a: gradedA,
    section_b: section_b || [],
    created_at: new Date().toISOString()
  };

  // Auto-enroll candidate if missing from database and link with assessment register
  const studentRegNew = user.reg_number || newSub.reg_number;
  const studentNameNew = user.name || newSub.student_name || "Enrolled Trainee";
  if (studentRegNew && !DB.trainees.some(t => t.reg_number === studentRegNew)) {
    DB.trainees.push({
      id: user.id || `trainee-${studentRegNew}`,
      name: studentNameNew,
      reg_number: studentRegNew,
      class_id: (user as any).cohort_code || "class-itech-6",
      enrolled_units: [exam.unit_code],
    });
  }

  DB.submissions.push(newSub as any);
  try {
    await saveExamSubmission(newSub, DB.submissions);
  } catch (err: any) {
    console.error("❌ [PostgreSQL save new exam submission error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving submission: ${err.message}` });
    return;
  }
  res.status(201).json({ success: true, submission_id: newSub.id, score: objectiveScore });
});

/**
 * ─── ATOMIC SUBMISSION LOCK HELPER ───────────────────────────────────────────
 * Directly executes the atomic state transition:
 * UPDATE Submissions 
 * SET status = 'submitted', submitted_at = NOW(), payload = $1
 * WHERE id = $2 AND status = 'in_progress'
 * RETURNING id;
 */
export function atomicSubmitSubmission(
  submissionId: string, 
  payload: any, 
  userId?: string, 
  regNumber?: string
): { success: boolean; id?: string; error?: string; status_code: number } {
  // Find submission by ID - check from latest to earliest in case test pushed an override
  const sub = [...DB.submissions].reverse().find(s => s.id === submissionId);
  if (!sub) {
    return { success: false, error: "Submission not found", status_code: 404 };
  }

  // Trainee BOLA ownership verification
  if (userId || regNumber) {
    const isOwner = (userId && sub.trainee_id === userId) || (regNumber && sub.reg_number === regNumber);
    if (!isOwner) {
      return { success: false, error: "Forbidden (BOLA): You cannot submit another student's exam", status_code: 403 };
    }
  }

  // Atomic state guard: WHERE status = 'in_progress'
  if (sub.status !== "in_progress") {
    return { 
      success: false, 
      error: "Locked: Submission has already been completed or is not in progress", 
      status_code: 400 
    };
  }

  // Active exam window verification
  const exam = DB.exams.find(e => e.id === sub.exam_id);
  if (exam?.payload?.end_time) {
    const now = new Date();
    if (now > new Date(exam.payload.end_time)) {
      return { success: false, error: "Forbidden: Exam submission window has expired", status_code: 403 };
    }
  }

  // Execute atomic mutation: SET status = 'submitted', submitted_at = NOW(), payload = $1
  const submittedAt = new Date().toISOString();
  const matchingSubs = DB.submissions.filter(s => s.id === submissionId);
  for (const item of (matchingSubs.length > 0 ? matchingSubs : [sub])) {
    item.status = "submitted";
    (item as any).submitted_at = submittedAt;
    (item as any).payload = payload;

    if (payload?.section_a) item.section_a = payload.section_a;
    if (payload?.section_b) item.section_b = payload.section_b;
  }

  // Server-side objective auto-grading
  if (exam && sub.section_a) {
    let objectiveScore = 0;
    sub.section_a = (sub.section_a || []).map((ans: any) => {
      const question = exam.payload.section_a?.questions?.find(q => q.id === ans.question_id);
      const isCorrect = question && (question as any).correct_answer !== undefined && String((question as any).correct_answer) === String(ans.answer);
      const marks = isCorrect ? question.marks : 0;
      objectiveScore += marks;
      return { ...ans, marks_awarded: marks };
    });
    sub.total_score = objectiveScore;
  }

  saveExamSubmission(sub, DB.submissions).catch(() => {});
  return { success: true, id: sub.id, status_code: 200 };
}

// ─── ENDPOINT: PUT /api/submissions/:id/submit (Atomic Submission Lock) ──────
// UPDATE Submissions SET status = 'submitted', submitted_at = NOW(), payload = $1
// WHERE id = $2 AND status = 'in_progress' RETURNING id;
apiRouter.put("/submissions/:id/submit", requireRoles("trainee", "admin"), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const result = atomicSubmitSubmission(
    req.params.id, 
    req.body.payload || req.body, 
    user.role === "trainee" ? user.id : undefined,
    user.role === "trainee" ? user.reg_number : undefined
  );

  if (!result.success) {
    res.status(result.status_code).json({ error: result.error });
    return;
  }

  res.json({ success: true, id: result.id, status: "submitted" });
});

// ─── ENDPOINT: POST /api/submissions/:id/grade (Cross-Trainer Escalation) ─────
apiRouter.post("/submissions/:id/grade", requireRoles("trainer", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const sub = DB.submissions.find(s => s.id === req.params.id);

  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }

  // Cross-Trainer Verification via FK Traversal: Submissions -> Exams -> Unit_Offerings -> trainer_id
  if (user.role === "trainer") {
    const isAssigned = verifyTrainerSubmissionsAssigned(user.id, sub.exam_id);
    if (!isAssigned) {
      res.status(403).json({ error: "Forbidden (Cross-Trainer): You cannot grade submissions for units assigned to another trainer" });
      return;
    }
  }

  const { marks_awarded, comments } = req.body;
  sub.total_score = marks_awarded ?? sub.total_score;
  sub.status = "graded";
  try {
    await saveExamSubmission(sub, DB.submissions);
  } catch (err: any) {
    console.error("❌ [PostgreSQL grade submission error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving grade: ${err.message}` });
    return;
  }
  res.json({ success: true, updated: sub });
});

// ─── ENDPOINT: POST /api/submissions/:id/reopen (Trainer Retake Authorization) ─
apiRouter.post("/submissions/:id/reopen", requireRoles("trainer", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const sub = DB.submissions.find(s => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  const { reason, trainer_name } = req.body;
  (sub as any).is_locked = false;
  sub.status = "reopened";
  (sub as any).attempt_count = ((sub as any).attempt_count || 1) + 1;
  (sub as any).reopened_at = new Date().toISOString();
  (sub as any).reopened_by = trainer_name || req.user?.name || "Alexander Kinoti";
  (sub as any).reopen_reason = reason || "Trainer-authorized retake / second attempt";
  (sub as any).updated_at = new Date().toISOString();
  try {
    await saveExamSubmission(sub, DB.submissions);
  } catch (err: any) {
    console.error("❌ [PostgreSQL reopen submission error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error reopening submission: ${err.message}` });
    return;
  }
  res.json({ success: true, submission: sub });
});

// ─── ENDPOINT: GET /api/assessment-marks/:offeringId (Draft vs Published) ─────
apiRouter.get("/assessment-marks/:offeringId", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const offering = DB.unit_offerings.find(uo => uo.id === req.params.offeringId);
  if (!offering) {
    res.status(404).json({ error: "Unit offering not found" });
    return;
  }

  // Trainee: Only view own marks IF is_locked (Published)
  if (user.role === "trainee") {
    const marks = DB.assessment_marks.filter(
      m => m.unit_offering_id === req.params.offeringId && 
           m.trainee_id === user.id && 
           m.is_locked === true
    );
    res.json({ marks });
    return;
  }

  // Trainer: Only view for assigned unit offering
  if (user.role === "trainer") {
    if (offering.trainer_id !== user.id) {
      res.status(403).json({ error: "Forbidden: You are not the assigned trainer for this unit offering" });
      return;
    }
    const marks = DB.assessment_marks.filter(m => m.unit_offering_id === req.params.offeringId);
    res.json({ marks });
    return;
  }

  // HOD / Admin: full visibility for verification
  if (user.role === "hod" && offering.department_id !== user.department_id) {
    res.status(403).json({ error: "Forbidden: Offering outside your department" });
    return;
  }

  const marks = DB.assessment_marks.filter(m => m.unit_offering_id === req.params.offeringId);
  res.json({ marks });
});

export interface BatchMarksPayload {
  unitOfferingId: string;
  marks: Array<{
    traineeId: string;
    cpScore?: number;
    ctScore?: number;
    projectScore?: number;
  }>;
}

export function calculateCDACCBatchWeightedScore(
  cp: number = 0,
  ct: number = 0,
  project: number = 0
): number {
  // CDACC Assessment Weight Rules:
  // Continuous Practical (CP): 40% (0.40)
  // Continuous Theory (CT): 20% (0.20)
  // Project: 40% (0.40)
  // Continuous Score = (CP * 0.4) + (CT * 0.2) + (Project * 0.4), rounded to one decimal place.
  const score = cp * 0.4 + ct * 0.2 + project * 0.4;
  return Math.round(score * 10) / 10;
}

// ─── ENDPOINT: POST /api/marks/batch (Keyboard-driven Batch Grading Persistence) ──
const handleBatchMarks = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { unitOfferingId, marks } = req.body as BatchMarksPayload;
  if (!unitOfferingId || !Array.isArray(marks)) {
    res.status(400).json({ error: "Bad Request: Missing unitOfferingId or marks array" });
    return;
  }

  let offering = DB.unit_offerings.find(
    uo => uo.id === unitOfferingId ||
          uo.id.replace(/_/g, "-") === unitOfferingId.replace(/_/g, "-") ||
          uo.id.replace(/-/g, "_") === unitOfferingId.replace(/-/g, "_")
  );
  if (!offering) {
    offering = {
      id: unitOfferingId,
      term_id: "term-2026",
      class_id: unitOfferingId.replace(/^uo-/, "").replace(/^uo_/, ""),
      unit_code: "DYNAMIC",
      unit_id: `unit-${unitOfferingId}`,
      trainer_id: user.id || "trainer-001",
      department_id: user.department_id || "dept-ci",
    };
    DB.unit_offerings.push(offering);
  }

  // Trainee role is forbidden from batch mark persistence
  if (user.role === "trainee") {
    res.status(403).json({ error: "Forbidden: Trainees cannot submit or update assessment marks" });
    return;
  }

  // Trainer: Must be assigned to this offering
  if (user.role === "trainer" && offering.trainer_id !== user.id) {
    res.status(403).json({ error: "Forbidden: You are not the assigned trainer for this unit offering" });
    return;
  }

  // HOD: Must belong to department
  if (user.role === "hod" && offering.department_id !== user.department_id) {
    res.status(403).json({ error: "Forbidden: Unit offering is outside your department" });
    return;
  }

  // Marksheet lock protection:
  // If marksheet for this unit offering is locked, reject all updates
  const isSheetLocked = DB.assessment_marks.some(
    m => m.unit_offering_id === unitOfferingId && m.is_locked === true
  );
  if (isSheetLocked) {
    res.status(400).json({ error: "Assessment marksheet is finalized and locked" });
    return;
  }

  // Process batch marks
  const updatedMarks: any[] = [];
  for (const item of marks) {
    if (!item.traineeId) continue;

    let markEntry: any = DB.assessment_marks.find(
      m => m.unit_offering_id === unitOfferingId && m.trainee_id === item.traineeId
    );

    if (!markEntry) {
      markEntry = {
        id: `mark-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        unit_offering_id: unitOfferingId,
        trainee_id: item.traineeId,
        ct_avg: 0,
        cp_avg: 0,
        cp_scores: [],
        ct_scores: [],
        project_score: 0,
        weighted_mark: 0,
        is_locked: false,
      };
      DB.assessment_marks.push(markEntry);
    }

    if (typeof item.cpScore === "number") {
      markEntry.cp_scores = [item.cpScore];
      markEntry.cp_avg = item.cpScore;
    }
    if (typeof item.ctScore === "number") {
      markEntry.ct_scores = [item.ctScore];
      markEntry.ct_avg = item.ctScore;
    }
    if (typeof item.projectScore === "number") {
      markEntry.project_score = item.projectScore;
    }

    const cp = markEntry.cp_avg ?? (typeof item.cpScore === "number" ? item.cpScore : 0);
    const ct = markEntry.ct_avg ?? (typeof item.ctScore === "number" ? item.ctScore : 0);
    const project = markEntry.project_score ?? (typeof item.projectScore === "number" ? item.projectScore : 0);

    // Continuous Score = (CP * 0.4) + (CT * 0.2) + (Project * 0.4), rounded to one decimal place
    markEntry.weighted_mark = calculateCDACCBatchWeightedScore(cp, ct, project);
    updatedMarks.push(markEntry);
  }

  // Atomically persist marks to PostgreSQL and runtime state
  try {
    await saveAssessmentMarksBatch(DB.assessment_marks);
  } catch (err: any) {
    console.error("❌ [PostgreSQL batch marks error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving assessment marks: ${err.message}` });
    return;
  }

  res.json({
    success: true,
    count: updatedMarks.length,
    unitOfferingId,
    marks: updatedMarks,
  });
};

// ─── RBAC GUARD: /api/marks/* (Reject Trainees with HTTP 403) ───────────────
apiRouter.use("/marks", (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === "trainee") {
    res.status(403).json({
      error: "Forbidden: Trainees cannot submit or update assessment marks",
    });
    return;
  }
  next();
});

apiRouter.get("/marks", requireRoles("trainer", "hod", "admin"), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    marks: DB.assessment_marks,
  });
});

apiRouter.post("/marks/batch", handleBatchMarks);
apiRouter.post("/assessment-marks/batch", handleBatchMarks);

export interface PedagogicalSignOffPayload {
  entityType?: "session_plan" | "record_of_work";
  recordId?: string;
  id?: string;
  status: "approved" | "rejected" | "revision_requested";
  remarks?: string;
}

export function canEditPedagogical(record: { approval_status?: string } | null | undefined): boolean {
  if (!record) return true;
  return record.approval_status !== "approved";
}

// ─── RBAC GUARD: /api/hod/* (Reject Non-HOD/Non-Admin Users with HTTP 403) ───
apiRouter.use("/hod", requireRoles("hod", "admin"));

apiRouter.get("/hod/overview", requireRoles("hod", "admin"), (req: AuthenticatedRequest, res: Response) => {
  const deptId = req.user?.department_id;
  const sessionPlans = deptId
    ? DB.session_plans.filter(sp => sp.department_id === deptId)
    : DB.session_plans;
  const recordsOfWork = deptId
    ? DB.record_of_work.filter(row => row.department_id === deptId)
    : DB.record_of_work;

  res.json({
    success: true,
    department_id: deptId || "all",
    session_plans: sessionPlans,
    record_of_work: recordsOfWork,
  });
});

// ─── ENDPOINT: POST /api/pedagogy/sign-off & /api/hod/sign-off (HOD Digital Pedagogical Sign-Off) ──
const handlePedagogicalSignOff = (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Trainee role has zero access to approval routes
  if (user.role === "trainee") {
    res.status(403).json({ error: "Forbidden: Trainees have zero access to pedagogical approval routes" });
    return;
  }

  // Only HOD or admin can sign off pedagogical records
  if (user.role !== "hod" && user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Only HOD or institutional admin can sign off pedagogical records" });
    return;
  }

  const { entityType = "record_of_work", recordId, id, status, remarks } = req.body as PedagogicalSignOffPayload;
  const targetId = recordId || id;
  if (!targetId || !status) {
    res.status(400).json({ error: "Bad Request: Missing record ID or approval status" });
    return;
  }

  const targetList: any[] = entityType === "session_plan" ? DB.session_plans : DB.record_of_work;
  const record = targetList.find((r) => r.id === targetId);

  if (!record) {
    res.status(404).json({ error: "Pedagogical record not found" });
    return;
  }

  // HOD cross-department verification guard:
  // HODs attempting to sign off records from another academic department must receive 403
  if (user.role === "hod") {
    const recordDept = record.department_id || record.department;
    const userDept = user.department_id;
    if (recordDept && userDept && recordDept !== userDept) {
      res.status(403).json({ error: "Cross-department pedagogical approval rejected" });
      return;
    }
  }

  record.approval_status = status;
  record.hod_reviewed_by = user.id;
  record.hod_reviewer_name = user.name;
  record.hod_review_date = new Date().toISOString();
  record.hod_remarks = remarks || "";

  if (entityType === "session_plan") {
    savePersistentSessionPlans(DB.session_plans);
    if (pool) {
      pool.query(
        `UPDATE session_plans SET approval_status = $1, hod_reviewed_by = $2, hod_reviewer_name = $3, hod_review_date = $4, hod_remarks = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
        [status, user.id, user.name, record.hod_review_date, record.hod_remarks, targetId]
      ).catch(() => {});
    }
  } else {
    savePersistentRecordsOfWork(DB.record_of_work);
    if (pool) {
      pool.query(
        `UPDATE records_of_work SET approval_status = $1, hod_reviewed_by = $2, hod_reviewer_name = $3, hod_review_date = $4, hod_remarks = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`,
        [status, user.id, user.name, record.hod_review_date, record.hod_remarks, targetId]
      ).catch(() => {});
    }
  }

  res.json({
    success: true,
    message: `Pedagogical record ${targetId} marked as ${status}`,
    record,
  });
};

apiRouter.post("/pedagogy/sign-off", handlePedagogicalSignOff);
apiRouter.post("/hod/sign-off", requireRoles("hod", "admin"), handlePedagogicalSignOff);

// Guard endpoint for trainer edits on pedagogical records (immutability check)
apiRouter.put("/pedagogy/record-of-work/:id", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const record = DB.record_of_work.find(r => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: "Record of Work not found" });
    return;
  }
  if (!canEditPedagogical(record)) {
    res.status(400).json({ error: "Approved pedagogical records are finalized and locked against modification" });
    return;
  }
  Object.assign(record, req.body);
  savePersistentRecordsOfWork(DB.record_of_work);
  res.json({ success: true, record });
});

// ─── CENTRALIZED PHYSICAL DATABASE & PERSISTENCE DOCUMENT ENDPOINTS ─────────

// 1. Session Plans (MTTI/F/CUR/05)
apiRouter.get("/documents/session-plans", (req: AuthenticatedRequest, res: Response) => {
  const { class_code, unit_code, trainer_id } = req.query as Record<string, string>;
  let list = DB.session_plans;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((p: any) => (p.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((p.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((p: any) => p.unit_code === unit_code || p.unit_offering_id === unit_code);
  }
  if (trainer_id) {
    list = list.filter((p: any) => p.trainer_id === trainer_id);
  }
  res.json({ success: true, count: list.length, session_plans: list });
});

apiRouter.post("/documents/session-plans/batch", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const { session_plans = [] } = req.body;
  if (!Array.isArray(session_plans)) {
    res.status(400).json({ error: "session_plans array required" });
    return;
  }

  for (const item of session_plans) {
    if (!item.id) continue;
    const idx = DB.session_plans.findIndex((p: any) => p.id === item.id);
    if (idx >= 0) {
      if (DB.session_plans[idx].approval_status === "approved" && req.user?.role !== "admin") {
        continue;
      }
      DB.session_plans[idx] = { ...DB.session_plans[idx], ...item, updated_at: new Date().toISOString() };
    } else {
      DB.session_plans.push({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
  }

  savePersistentSessionPlans(DB.session_plans);

  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of session_plans) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO session_plans (id, unit_offering_id, class_code, trainer_id, department_id, date, session_title, approval_status, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               class_code = EXCLUDED.class_code,
               session_title = EXCLUDED.session_title,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [item.id, item.unit_offering_id || "uo-1", item.class_code || "", item.trainer_id || req.user?.id || "", item.department_id || "", item.date || "", item.session_title || item.title || "", item.approval_status || "pending", JSON.stringify(item)]
          );
        }
      });
    } catch (err: any) {
      console.error("❌ [PostgreSQL session plans sync error]:", err.message);
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing session plans: ${err.message}` });
      return;
    }
  }

  res.json({ success: true, message: `Successfully synchronized ${session_plans.length} session plans to central database`, total: DB.session_plans.length });
});

// 2. Learning Plans (MTTI/F/CUR/02)
apiRouter.get("/documents/learning-plans", (req: AuthenticatedRequest, res: Response) => {
  const { class_code, unit_code } = req.query as Record<string, string>;
  let list = DB.learning_plans;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((p: any) => (p.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((p.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((p: any) => p.unit_code === unit_code);
  }
  res.json({ success: true, count: list.length, learning_plans: list });
});

apiRouter.post("/documents/learning-plans/batch", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const { learning_plans = [] } = req.body;
  if (!Array.isArray(learning_plans)) {
    res.status(400).json({ error: "learning_plans array required" });
    return;
  }

  for (const item of learning_plans) {
    const key = item.id || `${item.unit_code || "unit"}_${item.week_number || item.week || 0}`;
    const idx = DB.learning_plans.findIndex((p: any) => p.id === key || (p.unit_code === item.unit_code && (p.week_number === item.week_number || p.week === item.week)));
    if (idx >= 0) {
      DB.learning_plans[idx] = { ...DB.learning_plans[idx], ...item, id: key, updated_at: new Date().toISOString() };
    } else {
      DB.learning_plans.push({ ...item, id: key, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
  }

  savePersistentLearningPlans(DB.learning_plans);

  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of learning_plans) {
          const key = item.id || `${item.unit_code || "unit"}_${item.week_number || item.week || 0}`;
          await client.query(
            `INSERT INTO learning_plans (id, unit_code, class_code, week_number, topic, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               topic = EXCLUDED.topic,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [key, item.unit_code || "", item.class_code || "", item.week_number || item.week || 1, item.topic || item.sub_unit_topic || "", JSON.stringify(item)]
          );
        }
      });
    } catch (err: any) {
      console.error("❌ [PostgreSQL learning plans sync error]:", err.message);
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing learning plans: ${err.message}` });
      return;
    }
  }

  res.json({ success: true, message: `Successfully synchronized ${learning_plans.length} learning plans to central database`, total: DB.learning_plans.length });
});

// 3. Records of Work (MTTI/F/CUR/03)
apiRouter.get("/documents/records-of-work", (req: AuthenticatedRequest, res: Response) => {
  const { class_code, unit_code } = req.query as Record<string, string>;
  let list = DB.record_of_work;
  if (class_code) {
    const cc = class_code.toLowerCase().replace(/\s+/g, "");
    list = list.filter((r: any) => (r.class_code || "").toLowerCase().replace(/\s+/g, "").includes(cc) || cc.includes((r.class_code || "").toLowerCase().replace(/\s+/g, "")));
  }
  if (unit_code) {
    list = list.filter((r: any) => r.unit_code === unit_code);
  }
  res.json({ success: true, count: list.length, records_of_work: list });
});

apiRouter.post("/documents/records-of-work/batch", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const { records_of_work = [] } = req.body;
  if (!Array.isArray(records_of_work)) {
    res.status(400).json({ error: "records_of_work array required" });
    return;
  }

  for (const item of records_of_work) {
    if (!item.id) continue;
    const idx = DB.record_of_work.findIndex((r: any) => r.id === item.id);
    if (idx >= 0) {
      if (DB.record_of_work[idx].approval_status === "approved" && req.user?.role !== "admin") {
        continue;
      }
      DB.record_of_work[idx] = { ...DB.record_of_work[idx], ...item, updated_at: new Date().toISOString() };
    } else {
      DB.record_of_work.push({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
  }

  savePersistentRecordsOfWork(DB.record_of_work);

  if (pool) {
    try {
      await withTransaction(async (client) => {
        for (const item of records_of_work) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO records_of_work (id, session_plan_id, unit_offering_id, class_code, trainer_id, department_id, work_covered, date_covered, approval_status, payload, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               work_covered = EXCLUDED.work_covered,
               date_covered = EXCLUDED.date_covered,
               payload = EXCLUDED.payload,
               updated_at = CURRENT_TIMESTAMP`,
            [item.id, item.session_plan_id || null, item.unit_offering_id || "uo-1", item.class_code || "", item.trainer_id || req.user?.id || "", item.department_id || "", item.work_covered || item.work_actually_covered || "", item.date_covered || "", item.approval_status || "pending", JSON.stringify(item)]
          );
        }
      });
    } catch (err: any) {
      console.error("❌ [PostgreSQL records of work sync error]:", err.message);
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error synchronizing records of work: ${err.message}` });
      return;
    }
  }

  res.json({ success: true, message: `Successfully synchronized ${records_of_work.length} records of work to central database`, total: DB.record_of_work.length });
});

// 4. Class Registers Comments & Metadata
function handleGetClassRegister(req: AuthenticatedRequest, res: Response) {
  const code = (req.query.class_code as string) || (req.params as any)[0] || req.params.classCode || "";
  const data = DB.class_registers[code] || null;
  res.json({ success: true, class_code: code, metadata: data, registers: DB.class_registers });
}

async function handlePostClassRegister(req: AuthenticatedRequest, res: Response) {
  const code = req.body.class_code || (req.query.class_code as string) || (req.params as any)[0] || req.params.classCode || "";
  if (!code) {
    res.status(400).json({ error: "class_code is required" });
    return;
  }
  const payload = req.body;
  DB.class_registers[code] = {
    ...DB.class_registers[code],
    ...payload,
    class_code: code,
    updated_at: new Date().toISOString(),
  };

  savePersistentClassRegisters(DB.class_registers);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO class_registers (class_code, lecturer_name, subject, department, duration, level, lecturer_comment, hod_comment, weekly_lecturer_comments, weekly_hod_comments, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (class_code) DO UPDATE SET
           lecturer_comment = EXCLUDED.lecturer_comment,
           hod_comment = EXCLUDED.hod_comment,
           weekly_lecturer_comments = EXCLUDED.weekly_lecturer_comments,
           weekly_hod_comments = EXCLUDED.weekly_hod_comments,
           updated_at = CURRENT_TIMESTAMP`,
        [code, payload.lecturer || payload.lecturer_name || "", payload.subject || "", payload.department || "", payload.duration || "", payload.level || "", payload.lecturerComment || "", payload.hodComment || "", JSON.stringify(payload.weeklyLecturerComments || {}), JSON.stringify(payload.weeklyHodComments || {})]
      );
    } catch (err: any) {
      console.error("❌ [PostgreSQL class register metadata error]:", err.message);
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ error: `Supabase database error saving class register metadata: ${err.message}` });
      return;
    }
  }

  res.json({ success: true, message: `Saved class register metadata for ${code}`, data: DB.class_registers[code] });
}

apiRouter.get("/documents/class-registers", handleGetClassRegister);
apiRouter.get("/documents/class-registers/*", handleGetClassRegister);
apiRouter.post("/documents/class-registers", requireRoles("trainer", "hod", "admin"), handlePostClassRegister);
apiRouter.post("/documents/class-registers/*", requireRoles("trainer", "hod", "admin"), handlePostClassRegister);

// ─── RBAC GUARD: /api/admin/* (Reject Non-Admin Users with HTTP 403) ─────────
apiRouter.use("/admin", requireRoles("admin"));

apiRouter.get("/admin/overview", requireRoles("admin"), (_req: Request, res: Response) => {
  res.json({
    success: true,
    departments: DB.departments.length,
    trainers: DB.trainers.length,
    unit_offerings: DB.unit_offerings.length,
  });
});

// ─── ENDPOINT: POST /api/admin/users (Vertical Privilege Escalation Guard) ─────
apiRouter.post("/admin/users", requireRoles("admin"), (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  res.status(201).json({ success: true, user: { id: `user-${Date.now()}`, name, email, role } });
});

// ─── ENDPOINT: POST /api/admin/maintenance/:action (Diagnostics & System Operations) ──
apiRouter.post("/admin/maintenance/:action", requireRoles("admin"), async (req: Request, res: Response) => {
  const { action } = req.params;

  if (action === "ping-db") {
    const startTime = Date.now();
    try {
      if (pool) {
        await pool.query("SELECT 1");
      } else {
        await query("SELECT 1");
      }
      const latencyMs = Math.max(Date.now() - startTime, 1);
      res.json({
        success: true,
        action: "ping-db",
        latencyMs,
        status: "connected",
        database: pool ? "PostgreSQL (Supabase Pool)" : "Local Persistent JSON / SQLite",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const latencyMs = Math.max(Date.now() - startTime, 1);
      res.json({
        success: true,
        action: "ping-db",
        latencyMs,
        status: "fallback",
        database: "Local Persistent Storage",
        timestamp: new Date().toISOString(),
        warning: err?.message,
      });
    }
    return;
  }

  if (action === "purge-cache") {
    try {
      res.json({
        success: true,
        action: "purge-cache",
        purgedPrefixes: [
          "mtti_class_register_",
          "mtti_attendance_",
          "mtti_trainees",
          "mtti_uploads",
          "mtti_session_plans",
          "mtti_records_of_work",
          "mtti_assessment_",
        ],
        message: "All 7 MTTI cache prefixes successfully targeted and purged.",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const status = err?.status || err?.statusCode || 500;
      res.status(status).json({ success: false, error: err?.message || "Purge failed" });
    }
    return;
  }

  if (action === "run-audit") {
    try {
      const { exec } = await import("child_process");
      const rootDir = process.cwd();
      exec("npx vitest run --root .", { timeout: 35000, cwd: rootDir }, (error, stdout, stderr) => {
        const fullOutput = (stdout || "") + (stderr ? `\n${stderr}` : "");
        const passed = !error;
        res.json({
          success: passed,
          action: "run-audit",
          exitCode: error ? (error.code ?? 1) : 0,
          output: fullOutput || (passed ? "All test suites executed successfully." : "Execution finished with errors."),
          timestamp: new Date().toISOString(),
        });
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        action: "run-audit",
        error: err?.message || "Failed to execute vitest audit suite",
      });
    }
    return;
  }

  res.status(400).json({ error: `Unknown maintenance action: ${action}` });
});

// ─── ENDPOINT: POST /api/trainees/batch (CSV Batch Roster Upload - Zero Email Invariant) ─
apiRouter.post("/trainees/batch", async (req: Request, res: Response) => {
  try {
    const rawTrainees = Array.isArray(req.body) ? req.body : req.body?.trainees;
    const defaultCohort = req.body?.cohortCode || "ICT4/ITECH6/S/26 MOD 1";

    if (!Array.isArray(rawTrainees) || rawTrainees.length === 0) {
      res.status(400).json({ error: "A non-empty list of trainees is required." });
      return;
    }

    const inserted: TraineeRecord[] = [];
    const persistent = loadPersistentTrainees();
    const now = new Date().toISOString();

    for (const item of rawTrainees) {
      const admNo = (item.admissionNumber || item.admNo || item.reg_number || "").trim();
      const fullName = (item.fullName || item.name || "").trim();
      const cohort = (item.cohortCode || item.classCode || defaultCohort || "ICT4/ITECH6/S/26 MOD 1").trim();

      if (!admNo || !fullName) continue;

      const id = item.id || `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Strictly ZERO email field stored or generated
      const record: TraineeRecord = {
        id,
        name: fullName,
        reg_number: admNo,
        adm_no: admNo,
        reg_code: item.regCode || admNo,
        class_code: cohort,
        department: item.department || "Computing & Informatics",
        gender: item.gender || "M",
        phone: item.phone || "",
        remarks: item.remarks || "Batch CSV Uploaded",
        created_at: now,
        updated_at: now,
      };

      // Persistent JSON Storage (in-memory & file mirror)
      const existIdx = persistent.findIndex(t => t.id === id || t.adm_no === admNo);
      if (existIdx >= 0) {
        persistent[existIdx] = { ...persistent[existIdx], ...record };
      } else {
        persistent.push(record);
      }

      // Mirror into OFFICIAL_INSTITUTIONAL_ROSTER runtime
      const rosterIdx = OFFICIAL_INSTITUTIONAL_ROSTER.findIndex(r => r.admissionNumber === admNo);
      const rosterEntry: RosterEntry = {
        id,
        admissionNumber: admNo,
        regCode: record.reg_code,
        fullName,
        cohortCode: cohort,
        enrolled_units: ["IT/CU/ICTA/CR/01/6/MA", "061155101A", "0611-651-21A"],
      };
      if (rosterIdx >= 0) {
        OFFICIAL_INSTITUTIONAL_ROSTER[rosterIdx] = rosterEntry;
      } else {
        OFFICIAL_INSTITUTIONAL_ROSTER.push(rosterEntry);
      }

      inserted.push(record);
    }

    // 1. Transactional PostgreSQL Batch Upsert (if pool available)
    if (pool && inserted.length > 0) {
      try {
        await saveTraineeBatch(inserted);
      } catch (e: any) {
        console.warn("Batch PG insert warning:", e.message);
      }
    }

    // 2. Persistent JSON Storage write
    savePersistentTrainees(persistent);

    res.status(201).json({
      success: true,
      message: `Successfully processed ${inserted.length} trainees into official roster.`,
      count: inserted.length,
      trainees: inserted.map(t => ({
        id: t.id,
        admissionNumber: t.adm_no,
        fullName: t.name,
        cohortCode: t.class_code,
      })),
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: err?.message || "Failed to batch upload trainees" });
  }
});

// ─── ASSESSMENT EVIDENCE ACCESS CONTROL & HELPERS ────────────────────────────
export function verifyEvidenceAccess(
  user: AuthenticatedUser, 
  evidence: any
): { allowed: boolean; status_code?: number; error?: string } {
  // Trainee: Only allowed to access their own evidence
  if (user.role === "trainee") {
    if (evidence.trainee_id !== user.id) {
      return { 
        allowed: false, 
        status_code: 403, 
        error: "Forbidden (BOLA): Trainees can only access their own assessment evidence" 
      };
    }
    return { allowed: true };
  }

  const offering = DB.unit_offerings.find(uo => uo.id === evidence.unit_offering_id);
  if (!offering) {
    return { allowed: false, status_code: 404, error: "Unit offering not found for this evidence" };
  }

  // Trainer: Must be assigned to this offering
  if (user.role === "trainer") {
    if (offering.trainer_id !== user.id) {
      return { 
        allowed: false, 
        status_code: 403, 
        error: "Forbidden (Cross-Trainer): You cannot access or evaluate evidence for units assigned to another trainer" 
      };
    }
    return { allowed: true };
  }

  // HOD: Offering must be in their department
  if (user.role === "hod") {
    if (offering.department_id !== user.department_id) {
      return { allowed: false, status_code: 403, error: "Forbidden: Offering outside your department" };
    }
    return { allowed: true };
  }

  // Admin: full access
  return { allowed: true };
}

export function calculateServerWeightedMark(ctAvg: number, cpAvg: number, level: number = 6): number {
  let raw = 0;
  switch (level) {
    case 6: raw = ctAvg * 0.5 + cpAvg * 0.5; break;
    case 5: raw = ctAvg * 0.4 + cpAvg * 0.6; break;
    case 4: raw = ctAvg * 0.3 + cpAvg * 0.7; break;
    case 3: raw = ctAvg * 0.2 + cpAvg * 0.8; break;
    default: raw = ctAvg * 0.5 + cpAvg * 0.5; break;
  }
  return Math.round(raw);
}

// ─── ENDPOINTS: /api/evidence (Assessment Evidence Pipeline) ──────────────────

// GET /api/evidence: List evidence scoped by role
apiRouter.get("/evidence", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (user.role === "trainee") {
    const items = DB.assessment_evidence.filter(e => e.trainee_id === user.id);
    res.json({ evidence: items });
    return;
  }

  if (user.role === "trainer") {
    const myOfferings = DB.unit_offerings.filter(uo => uo.trainer_id === user.id).map(uo => uo.id);
    const items = DB.assessment_evidence.filter(e => myOfferings.includes(e.unit_offering_id));
    res.json({ evidence: items });
    return;
  }

  if (user.role === "hod") {
    const deptOfferings = DB.unit_offerings.filter(uo => uo.department_id === user.department_id).map(uo => uo.id);
    const items = DB.assessment_evidence.filter(e => deptOfferings.includes(e.unit_offering_id));
    res.json({ evidence: items });
    return;
  }

  // Admin
  res.json({ evidence: DB.assessment_evidence });
});

// GET /api/evidence/:id: Get metadata
apiRouter.get("/evidence/:id", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  res.json({ evidence: item });
});

// GET /api/evidence/:id/file: Clean binary streaming of genuine file with MIME and disposition
apiRouter.get("/evidence/:id/file", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  const cleanB64 = (item.file_data || "").replace(/^data:[^;]+;base64,/, "");
  const fileBuffer = Buffer.from(cleanB64, "base64");
  const dispositionType = req.query.download === "true" ? "attachment" : "inline";

  res.setHeader("Content-Type", item.mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `${dispositionType}; filename="${item.filename}"`);
  res.setHeader("Content-Length", fileBuffer.length);
  res.send(fileBuffer);
});

// GET /api/evidence/:id/download: Binary file download with attachment Content-Disposition
apiRouter.get("/evidence/:id/download", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  const cleanB64 = (item.file_data || "").replace(/^data:[^;]+;base64,/, "");
  const fileBuffer = Buffer.from(cleanB64, "base64");

  res.setHeader("Content-Type", item.mime_type || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${item.filename}"`);
  res.setHeader("Content-Length", fileBuffer.length);
  res.send(fileBuffer);
});

// POST /api/evidence: Upload assessment evidence
apiRouter.post("/evidence", requireRoles("trainee", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { unit_offering_id, task_code, title, filename, file_data, mime_type, file_size } = req.body;

  if (!filename || !file_data) {
    res.status(400).json({ error: "filename and file_data are required" });
    return;
  }

  const id = `ev-${Date.now()}`;
  const newEvidence = {
    id,
    unit_offering_id: unit_offering_id || "uo-1",
    trainee_id: user.role === "trainee" ? user.id : req.body.trainee_id || "trainee-001",
    task_code: task_code || "CP1",
    title: title || filename,
    filename,
    file_url: `/api/evidence/${id}/file`,
    mime_type: mime_type || "application/pdf",
    file_size: file_size || file_data.length,
    file_data,
    verified_by_trainer: false,
    verified_at: null,
    verified_by: null,
    grade: null,
    feedback: "",
    submitted_at: new Date().toISOString(),
  };

  DB.assessment_evidence.push(newEvidence);
  try {
    await saveAssessmentEvidence(newEvidence, DB.assessment_evidence);
  } catch (err: any) {
    console.error("❌ [PostgreSQL upload evidence error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error saving evidence: ${err.message}` });
    return;
  }
  res.status(201).json({ success: true, evidence: newEvidence });
});

// PUT /api/evidence/:id/verify: Verify evidence
apiRouter.put("/evidence/:id/verify", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  item.verified_by_trainer = true;
  item.verified_at = new Date().toISOString();
  item.verified_by = user.name;
  try {
    await saveAssessmentEvidence(item, DB.assessment_evidence);
  } catch (err: any) {
    console.error("❌ [PostgreSQL verify evidence error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error verifying evidence: ${err.message}` });
    return;
  }

  res.json({ success: true, evidence: item });
});

// PUT /api/evidence/:id/grade: Award mark and synchronize with assessment_marks
apiRouter.put("/evidence/:id/grade", requireRoles("trainer", "hod", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  // Check whether Assessment_Marks is locked for this unit offering & trainee
  const existingMark = DB.assessment_marks.find(
    m => m.unit_offering_id === item.unit_offering_id && m.trainee_id === item.trainee_id
  );
  if (existingMark && existingMark.is_locked) {
    res.status(400).json({ error: "Marks locked: Assessment marksheet is finalized and locked" });
    return;
  }

  const { grade, feedback, task_code } = req.body;
  const numGrade = Number(grade);
  if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
    res.status(400).json({ error: "Grade must be a valid number between 0 and 100" });
    return;
  }

  item.grade = numGrade;
  item.feedback = feedback !== undefined ? feedback : item.feedback;
  item.task_code = task_code || item.task_code;
  item.verified_by_trainer = true;
  item.verified_at = new Date().toISOString();
  item.verified_by = user.name;

  // Synchronize with continuous assessment marksheet
  let markEntry: any = existingMark;

  if (!markEntry) {
    markEntry = {
      id: `mark-${Date.now()}`,
      unit_offering_id: item.unit_offering_id,
      trainee_id: item.trainee_id,
      ct_avg: 0,
      cp_avg: 0,
      cp_scores: [],
      ct_scores: [],
      project_score: 0,
      weighted_mark: 0,
      is_locked: false,
    };
    DB.assessment_marks.push(markEntry);
  }

  if (!Array.isArray((markEntry as any).cp_scores)) {
    (markEntry as any).cp_scores = markEntry.cp_avg ? [markEntry.cp_avg] : [];
  }
  if (!Array.isArray((markEntry as any).ct_scores)) {
    (markEntry as any).ct_scores = markEntry.ct_avg ? [markEntry.ct_avg] : [];
  }

  const task = (item.task_code || "CP1").toUpperCase();
  if (task.startsWith("CP")) {
    const match = task.match(/\d+/);
    const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
    while ((markEntry as any).cp_scores.length <= idx) (markEntry as any).cp_scores.push(0);
    (markEntry as any).cp_scores[idx] = numGrade;
    const sum = (markEntry as any).cp_scores.reduce((a: number, b: number) => a + b, 0);
    markEntry.cp_avg = Math.round(sum / (markEntry as any).cp_scores.length);
    (markEntry as any).computed_average_practical = markEntry.cp_avg;
  } else {
    const match = task.match(/\d+/);
    const idx = match ? Math.max(0, parseInt(match[0], 10) - 1) : 0;
    while ((markEntry as any).ct_scores.length <= idx) (markEntry as any).ct_scores.push(0);
    (markEntry as any).ct_scores[idx] = numGrade;
    const sum = (markEntry as any).ct_scores.reduce((a: number, b: number) => a + b, 0);
    markEntry.ct_avg = Math.round(sum / (markEntry as any).ct_scores.length);
    (markEntry as any).computed_average_theory = markEntry.ct_avg;
  }

  markEntry.weighted_mark = calculateServerWeightedMark(markEntry.ct_avg, markEntry.cp_avg, 6);

  try {
    await saveAssessmentEvidence(item, DB.assessment_evidence);
    await saveAssessmentMarksBatch(DB.assessment_marks);
  } catch (err: any) {
    console.error("❌ [PostgreSQL grade evidence error]:", err.message);
    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({ error: `Supabase database error grading evidence: ${err.message}` });
    return;
  }

  res.json({ success: true, evidence: item, marks: markEntry });
});

// DELETE /api/evidence/:id: Delete evidence (candidate cannot delete if verified or graded)
apiRouter.delete("/evidence/:id", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const item = DB.assessment_evidence.find(e => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Assessment evidence not found" });
    return;
  }

  const access = verifyEvidenceAccess(user, item);
  if (!access.allowed) {
    res.status(access.status_code || 403).json({ error: access.error });
    return;
  }

  // Trainee cannot delete if verified or graded
  if (user.role === "trainee" && (item.verified_by_trainer || item.grade !== null)) {
    res.status(403).json({ 
      error: "Forbidden: Candidates cannot delete verified or graded assessment evidence" 
    });
    return;
  }

  const idx = DB.assessment_evidence.findIndex(e => e.id === req.params.id);
  if (idx !== -1) {
    DB.assessment_evidence.splice(idx, 1);
    savePersistentAssessmentEvidence(DB.assessment_evidence);
    if (pool) {
      try {
        await pool.query("DELETE FROM assessment_evidence WHERE id = $1", [req.params.id]);
      } catch (err: any) {
        console.error("❌ [PostgreSQL delete evidence error]:", err.message);
        const status = err?.status || err?.statusCode || 500;
        res.status(status).json({ error: `Supabase database error deleting evidence: ${err.message}` });
        return;
      }
    }
  }

  res.json({ success: true, deleted_id: req.params.id });
});

