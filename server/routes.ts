import { Router, Request, Response, NextFunction } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "trainee" | "trainer" | "hod" | "admin";
  reg_number?: string;
  department_id?: string;
  assigned_units?: string[];
  enrolled_units?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const apiRouter = Router();

// ─── IN-MEMORY DEMO/SEED REPOSITORY WITH SERVICE-ROLE INTEGRITY ───────────────
// In production, queries traverse PostgreSQL with RLS. Here we mirror identical relational constraints.
export const DB = {
  departments: [
    { id: "dept-ci", name: "Computing & Informatics", code: "CI", hod_id: "hod-001" },
    { id: "dept-ee", name: "Electrical & Electronics", code: "EE", hod_id: "hod-002" },
  ],
  trainers: [
    { id: "trainer-001", name: "Dr. J. Muriithi", email: "trainer@mtti.ac.ke", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] },
    { id: "trainer-002", name: "Alexander Kinoti", email: "kinoti@mtti.ac.ke", assigned_units: ["ICT/OS/IT/CR/1/6"] },
  ],
  trainees: [
    { id: "trainee-001", name: "Alex Kinoti", reg_number: "10525", email: "student@mtti.ac.ke", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] },
    { id: "trainee-002", name: "Harriet Mwendwa", reg_number: "10526", email: "harriet@mtti.ac.ke", class_id: "class-itech-6", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] },
    { id: "trainee-003", name: "Other Student", reg_number: "99999", email: "other@mtti.ac.ke", class_id: "class-ee-4", enrolled_units: ["EE/CU/01/4"] },
  ],
  unit_offerings: [
    { id: "uo-1", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/CU/IT/CR/6/6", unit_id: "unit-cr-6", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-2", term_id: "term-2026", class_id: "class-itech-6", unit_code: "061155101A-WA1", unit_id: "unit-dl-1", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-3", term_id: "term-2026", class_id: "class-itech-6", unit_code: "ICT/OS/IT/CR/1/6", unit_id: "unit-net-1", trainer_id: "trainer-002", department_id: "dept-ci" },
    { id: "uo-it4-1", term_id: "term-2026", class_id: "ICT4 MOD/S/2026", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-1", term_id: "term-2026", class_id: "ICT4/ITECH6/S/26 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
    { id: "uo-mod1-2", term_id: "term-2026", class_id: "ICT4/ITECH6/S/2026 MOD 1", unit_code: "IT/CU/ICTA/CR/01/4/MA", unit_id: "unit-essentials-4", trainer_id: "trainer-001", department_id: "dept-ci" },
  ],
  exams: [
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
  submissions: [
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
  ],
  assessment_marks: [
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
  ],
  assessment_evidence: [
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
  ],
  session_plans: [
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
  ],
  record_of_work: [
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
  ]
};

// ─── AUTHENTICATION & CONTEXT EXTRACTION MIDDLEWARE ──────────────────────────
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] || "";
  const roleHeader = (req.headers["x-user-role"] as string) || "";
  const idHeader = (req.headers["x-user-id"] as string) || "";
  const regHeader = (req.headers["x-user-reg"] as string) || "";
  const deptHeader = (req.headers["x-user-dept"] as string) || "";
  const unitsHeader = (req.headers["x-user-enrolled-units"] as string) || (req.headers["x-user-units"] as string) || "";

  // Mock / Demo authentication extraction (with JWT simulation)
  let user: AuthenticatedUser | undefined;

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === "token-trainer-001") {
      user = { id: "trainer-001", email: "trainer@mtti.ac.ke", name: "Dr. J. Muriithi", role: "trainer", assigned_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"], department_id: "dept-ci" };
    } else if (token === "token-trainer-002") {
      user = { id: "trainer-002", email: "kinoti@mtti.ac.ke", name: "Alexander Kinoti", role: "trainer", assigned_units: ["ICT/OS/IT/CR/1/6"], department_id: "dept-ci" };
    } else if (token === "token-trainee-001") {
      user = { id: "trainee-001", email: "student@mtti.ac.ke", name: "Alex Kinoti", role: "trainee", reg_number: "10525", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] };
    } else if (token === "token-trainee-002") {
      user = { id: "trainee-002", email: "harriet@mtti.ac.ke", name: "Harriet Mwendwa", role: "trainee", reg_number: "10526", enrolled_units: ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] };
    } else if (token === "token-trainee-003") {
      user = { id: "trainee-003", email: "ee_trainee@mtti.ac.ke", name: "EE Trainee", role: "trainee", reg_number: "99999", department_id: "dept-ee", enrolled_units: ["EE/CU/PO/CR/1/6"] };
    } else if (token === "token-hod-ci") {
      user = { id: "hod-001", email: "hod.ci@mtti.ac.ke", name: "Prof. S. Njoroge", role: "hod", department_id: "dept-ci" };
    } else if (token === "token-hod-ee") {
      user = { id: "hod-002", email: "hod.ee@mtti.ac.ke", name: "Eng. D. Karanja", role: "hod", department_id: "dept-ee" };
    } else if (token === "token-admin") {
      user = { id: "admin-001", email: "admin@mtti.ac.ke", name: "System Administrator", role: "admin" };
    }
  }

  // Header-based resolution fallback for API callers
  if (!user && roleHeader) {
    const enrolledUnits = unitsHeader 
      ? unitsHeader.split(",").map(u => u.trim()) 
      : (deptHeader === "dept-ee" || idHeader === "trainee-003" ? ["EE/CU/PO/CR/1/6"] : ["ICT/CU/IT/CR/6/6", "061155101A-WA1"]);

    user = {
      id: idHeader || `user-${roleHeader}`,
      email: `${roleHeader}@mtti.ac.ke`,
      name: `Demo ${roleHeader.toUpperCase()}`,
      role: roleHeader as any,
      reg_number: regHeader,
      department_id: deptHeader,
      assigned_units: roleHeader === "trainer" ? (idHeader === "trainer-002" ? ["ICT/OS/IT/CR/1/6"] : ["ICT/CU/IT/CR/6/6", "061155101A-WA1"]) : undefined,
      enrolled_units: roleHeader === "trainee" ? enrolledUnits : undefined,
    };
  }

  req.user = user;
  next();
}

// ─── ROLE REQUIREMENT GUARD ──────────────────────────────────────────────────
export function requireRoles(...allowedRoles: Array<"trainee" | "trainer" | "hod" | "admin">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Access requires [${allowedRoles.join(", ")}], but user holds '${req.user.role}'` 
      });
      return;
    }
    next();
  };
}

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
export function verifyTrainerSubmissionsAssigned(trainerId: string, examId: string): boolean {
  const exam = DB.exams.find(e => e.id === examId);
  if (!exam) return false;

  // Traversal: Exam -> Unit_Offerings -> trainer_id
  const offering = DB.unit_offerings.find(uo => uo.unit_id === exam.unit_id && uo.trainer_id === trainerId);
  return !!offering;
}

// ─── 3. MANDATORY MODIFICATION 4: HOD DEPARTMENT SCOPE ────────────────────────
export function verifyHODDepartmentScope(hodDepartmentId: string | undefined, examId: string): boolean {
  if (!hodDepartmentId) return false;
  const exam = DB.exams.find(e => e.id === examId);
  if (!exam) return false;

  const offering = DB.unit_offerings.find(uo => uo.unit_id === exam.unit_id);
  return offering?.department_id === hodDepartmentId;
}

// ─── API ROUTES ──────────────────────────────────────────────────────────────

apiRouter.use(authenticateUser);

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mukiria-rbac-gateway" });
});

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
  // 1. ITECH 6 MODULAR/S/2026 (Perform Computer Essentials - Level 6 / Digital Literacy)
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admissionNumber: "14179/S2026", fullName: "Nthiga Gakii Doris", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admissionNumber: "14255/S2026", fullName: "Kaumbuthu Belinda Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admissionNumber: "14022/S2026", fullName: "Ltumwa Lesoipa", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admissionNumber: "14077/S2026", fullName: "Kitheka Emmanuel Kioko", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admissionNumber: "14102/S2026", fullName: "Felix Mugendi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admissionNumber: "14119/S2026", fullName: "Mwangi Clinton Njiru", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admissionNumber: "14149/S2026", fullName: "Abigael Mukiri", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admissionNumber: "14172/S2026", fullName: "Fiona Kadogo Mwika", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admissionNumber: "14207/S2026", fullName: "Ann Mary Makena", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admissionNumber: "14254/S2026", fullName: "Brenda Ngugi", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admissionNumber: "14267/S2026", fullName: "Ingashia Favour Wawira", cohortCode: "ITECH 6 MODULAR/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "trainee-001", regCode: "10525", admissionNumber: "10525", fullName: "Alex Kinoti", cohortCode: "class-itech-6", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "trainee-002", regCode: "10526", admissionNumber: "10526", fullName: "Harriet Mwendwa", cohortCode: "class-itech-6", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "ICT/CU/IT/CR/6/6", "IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },

  // 2. ICT4 MOD/S/2026 (Perform Computer Essentials - Level 4 ONLY, ZERO Digital Literacy)
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admissionNumber: "14076/S2026", fullName: "Wanjau Alvin Gatere", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admissionNumber: "14107/S2026", fullName: "Ann Mukiri Matheta", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admissionNumber: "14124/S2026", fullName: "Kimanthi Dennis Mwenda", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_04", regCode: "ICT4 MOD/14128/S2026", admissionNumber: "14128/S2026", fullName: "Kimanthi Dennis Mwenda (II)", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_05", regCode: "ICT4 MOD/14211/S2026", admissionNumber: "14211/S2026", fullName: "Guantai Brandon Mutua", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_06", regCode: "ICT4 MOD/14218/S2026", admissionNumber: "14218/S2026", fullName: "Mwithia Mutharimi Nathan", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_07", regCode: "ICT4 MOD/14248/S2026", admissionNumber: "14248/S2026", fullName: "Mbaabu Sarah Nkatha", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },
  { id: "tr_it4_08", regCode: "ICT4 MOD/14341/S2026", admissionNumber: "14341/S2026", fullName: "Mutiria Hesborn Muriuki", cohortCode: "ICT4 MOD/S/2026", enrolled_units: ["IT/CU/ICTA/CR/01/4/MA", "0611-651-21A"] },

  // 3. Admin 5/6/J/2026 (Apply ICT Skills - Business Department)
  { id: "tr_adm_01", regCode: "13410", admissionNumber: "13410", fullName: "RISPER MWENDE", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_02", regCode: "13527", admissionNumber: "13527", fullName: "Banta Micheni", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_03", regCode: "12218", admissionNumber: "12218", fullName: "Christine Gitonga", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_04", regCode: "13252", admissionNumber: "13252", fullName: "Cynthia Nkatha", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_05", regCode: "13284", admissionNumber: "13284", fullName: "Linet Ntinyari", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_06", regCode: "13424", admissionNumber: "13424", fullName: "Nanis Ngugi", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_07", regCode: "13276", admissionNumber: "13276", fullName: "Sharon Minoo", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_08", regCode: "10203", admissionNumber: "10203", fullName: "Frida Kianjira", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_09", regCode: "12254", admissionNumber: "12254", fullName: "Mercy Kiende", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_10", regCode: "12665", admissionNumber: "12665", fullName: "Ruth Kathure", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_adm_11", regCode: "13580", admissionNumber: "13580", fullName: "MERCY KATHUURE", cohortCode: "Admin 5/6/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },

  // 4. FBS 5 MOD/J/2026 (Apply Digital Literacy - Level 5)
  { id: "tr_fbs5_01", regCode: "FBS 5 MOD/13254/J2026", admissionNumber: "13254", fullName: "Yvonne Mwende", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_02", regCode: "FBS 5 MOD/13263/J2026", admissionNumber: "13263", fullName: "Muoki Muthoki", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_03", regCode: "FBS 5 MOD/13281/J2026", admissionNumber: "13281", fullName: "Kibaara Peninah Gaichuiri", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_04", regCode: "FBS 5 MOD/13297/J2026", admissionNumber: "13297", fullName: "Hilda Mwede Njagi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_05", regCode: "FBS 5 MOD/13304/J2026", admissionNumber: "13304", fullName: "Ndolo Shalom Mbithe", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_06", regCode: "FBS 5 MOD/13313/J2026", admissionNumber: "13313", fullName: "Mirriam Nzula", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_07", regCode: "FBS 5 MOD/13343/J2026", admissionNumber: "13343", fullName: "Waweru Hope Marion Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_08", regCode: "FBS 5 MOD/13355/J2026", admissionNumber: "13355", fullName: "Ann Joy Makena", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_09", regCode: "FBS 5 MOD/13378/J2026", admissionNumber: "13378", fullName: "Martha Mwende Kyalo", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_10", regCode: "FBS 5 MOD/13396/J2026", admissionNumber: "13396", fullName: "John Opiyo Omondi", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_11", regCode: "FBS 5 MOD/13445/J2026", admissionNumber: "13445", fullName: "Eunice Kendi Nyaga", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_12", regCode: "FBS 5 MOD/13446/J2026", admissionNumber: "13446", fullName: "Miriko Rita", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_13", regCode: "FBS 5 MOD/13463/J2026", admissionNumber: "13463", fullName: "Valentine Lesoito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_14", regCode: "FBS 5 MOD/13482/J2026", admissionNumber: "13482", fullName: "Kinyua Christine Mutito", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_15", regCode: "FBS 5 MOD/13488/J2026", admissionNumber: "13488", fullName: "Gichukia Bridgit Nyakio", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_16", regCode: "FBS 5 MOD/13546/J2026", admissionNumber: "13546", fullName: "Karwitha Silvia", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_17", regCode: "FBS 5 MOD/13551/J2026", admissionNumber: "13551", fullName: "Lavint Aliviza", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_18", regCode: "FBS 5 MOD/13559/12026", admissionNumber: "13559", fullName: "Kinya Weddy", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_19", regCode: "FBS 5 MOD/13571/12026", admissionNumber: "13571", fullName: "Gakuhi Jackline Nyambura", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs5_20", regCode: "FBS 5 MOD/13583/12026", admissionNumber: "13583", fullName: "Terry Mwendwa", cohortCode: "FBS 5 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },

  // 5. FBS6 MOD/J/2026 (6 Trainees)
  { id: "tr_fbs6_01", regCode: "FBP6 MOD/13251/12026", admissionNumber: "13251", fullName: "Mbithi Faith Wavinya", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs6_02", regCode: "FBS6 MOD/13314/12026", admissionNumber: "13314", fullName: "Emmanuel Njoroge", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs6_03", regCode: "FBS6 MOD/13403/12026", admissionNumber: "13403", fullName: "Brenda Ntinyari", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs6_04", regCode: "FBS6 MOD/13430/12026", admissionNumber: "13430", fullName: "Omedo Lilian Atieno", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs6_05", regCode: "FBS6 MOD/13487/12026", admissionNumber: "13487", fullName: "Waguama Donatus Wachira", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_fbs6_06", regCode: "FBS6 MOD/13495/12026", admissionNumber: "13495", fullName: "Nyamai Caroline Mutheu", cohortCode: "FBS6 MOD/J/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },

  // 6. LS5 MOD/S/2026 (9 Trainees)
  { id: "tr_ls5_01", regCode: "LS5 MOD/14009/52026", admissionNumber: "14009", fullName: "Vick Mutembei", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_02", regCode: "LS5 MOD/14024/52026", admissionNumber: "14024", fullName: "Kajuju Jackline Kathera", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_03", regCode: "LS5 MOD/14032/52026", admissionNumber: "14032", fullName: "Muthike Bredah Nyawira", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_04", regCode: "LS5 MOD/14092/S2026", admissionNumber: "14092", fullName: "Murithi Brian Munene", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_05", regCode: "LS5 MOD/14120/52026", admissionNumber: "14120", fullName: "Glory Makena", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_06", regCode: "LS5 MOD/14348/S2026", admissionNumber: "14348", fullName: "Okello Janet Auma", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_07", regCode: "LS5 MOD/14403/52026", admissionNumber: "14403", fullName: "Mutegi Kagendo Emma", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_08", regCode: "LS5 MOD/14428/52026", admissionNumber: "14428", fullName: "Risper Mwendwa", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls5_09", regCode: "LS5 MOD/14502/52026", admissionNumber: "14502", fullName: "Mutegi Hyprith Gatwiri", cohortCode: "LS5 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },

  // 7. LS6 MOD/S/2026 (10 Trainees)
  { id: "tr_ls6_01", regCode: "LS6 MOD/14001/S2026", admissionNumber: "14001", fullName: "Njeru Salim Mutemi", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_02", regCode: "LS6 MOD/14011/S2026", admissionNumber: "14011", fullName: "Jedida Karwitha", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_03", regCode: "LS6 MOD/14066/52026", admissionNumber: "14066", fullName: "Nyaga Caroline Mukami", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_04", regCode: "LS6 MOD/14183/S2026", admissionNumber: "14183", fullName: "Gideon Mucheria Kithendu", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_05", regCode: "LS6 MOD/14256/52026", admissionNumber: "14256", fullName: "Linus Murerwa", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_06", regCode: "LS6 MOD/14283/52026", admissionNumber: "14283", fullName: "Caroline Mwendwa", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_07", regCode: "LS6 MOD/14331/S2026", admissionNumber: "14331", fullName: "Brian Mutembei", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_08", regCode: "LS6 MOD/14332/52026", admissionNumber: "14332", fullName: "Kipngetich Cornelius", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_09", regCode: "LS6 MOD/14351/52026", admissionNumber: "14351", fullName: "Otieno Jecinter Trizer", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },
  { id: "tr_ls6_10", regCode: "LS6 MOD/14451/S2026", admissionNumber: "14451", fullName: "Caroline Kanana Mwirigi", cohortCode: "LS6 MOD/S/2026", enrolled_units: ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3"] },

  // 8. Electrical
  { id: "trainee-003", regCode: "99999", admissionNumber: "99999", fullName: "Other Student", cohortCode: "class-ee-4", enrolled_units: ["EE/CU/01/4", "EE/CU/PO/CR/1/6"] },
];

export function findTraineeInRoster(
  regNo: string,
  unitCode?: string
): { id: string; admissionNumber: string; fullName: string; cohortCode: string } | null {
  const rawReg = (regNo || "").trim();
  if (!rawReg) return null;

  const normReg = rawReg.toUpperCase();
  const noSpaceReg = normReg.replace(/\s+/g, "");
  
  // Extract pure 4-6 digit core registration number (e.g., "13254" from "FBS 5 MOD/13254/12026")
  const coreMatch = normReg.match(/\b\d{4,6}\b/);
  const coreReg = coreMatch ? coreMatch[0] : "";

  // Suffix/prefix stripped variants
  const cleanReg = normReg.replace(/^(ICT4\/ITECH\s*6[^\/]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
  const cleanNoSpaceReg = cleanReg.replace(/\s+/g, "");

  const normUnit = unitCode ? unitCode.trim().toUpperCase() : "";
  const baseUnit = normUnit ? normUnit.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "") : "";

  // Combine DB.trainees and OFFICIAL_INSTITUTIONAL_ROSTER
  const candidatePool: RosterEntry[] = [
    ...DB.trainees.map(t => ({
      id: t.id,
      admissionNumber: t.reg_number,
      regCode: t.reg_number,
      fullName: t.name,
      cohortCode: t.class_id,
      enrolled_units: t.enrolled_units,
    })),
    ...OFFICIAL_INSTITUTIONAL_ROSTER,
  ];

  // Match candidate by admission number or full registration code (supporting flexible matching)
  const candidate = candidatePool.find(c => {
    const cAdm = (c.admissionNumber || "").trim().toUpperCase();
    const cReg = (c.regCode || "").trim().toUpperCase();
    const cAdmNoSpace = cAdm.replace(/\s+/g, "");
    const cRegNoSpace = cReg.replace(/\s+/g, "");

    const cCleanAdm = cAdm.replace(/^(ICT4\/ITECH\s*6[^\/]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
    const cCleanReg = cReg.replace(/^(ICT4\/ITECH\s*6[^\/]*|ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
    const cCleanAdmNoSpace = cCleanAdm.replace(/\s+/g, "");
    const cCleanRegNoSpace = cCleanReg.replace(/\s+/g, "");

    const cCoreMatch = (cAdm + " " + cReg).match(/\b\d{4,6}\b/);
    const cCore = cCoreMatch ? cCoreMatch[0] : "";

    // Exact string match
    if (cAdm === normReg || cReg === normReg) return true;
    // Space-stripped match
    if (cAdmNoSpace === noSpaceReg || cRegNoSpace === noSpaceReg) return true;
    // Clean stripped match
    if (cCleanAdm === cleanReg || cCleanReg === cleanReg) return true;
    if (cCleanAdmNoSpace === cleanNoSpaceReg || cCleanRegNoSpace === cleanNoSpaceReg) return true;
    // Core number match
    if (coreReg && cCore && coreReg === cCore) return true;
    if (coreReg && (cAdm === coreReg || cReg.includes(coreReg))) return true;

    // Direct substring or slash-normalized match (e.g., 12026 vs J2026, 52026 vs S2026)
    const normRegSlash = normReg.replace(/\/12026/, "/J2026").replace(/\/52026/, "/S2026");
    const cRegSlash = cReg.replace(/\/12026/, "/J2026").replace(/\/52026/, "/S2026");
    if (normRegSlash === cRegSlash) return true;

    return false;
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
apiRouter.post("/submissions", requireRoles("trainee", "admin"), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { exam_id, section_a, section_b } = req.body;

  const exam = DB.exams.find(e => e.id === exam_id);
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }

  // 1. Mandatory Mod 5: Valid Exam Window Verification
  if (exam.payload.end_time) {
    const now = new Date();
    const endTime = new Date(exam.payload.end_time);
    if (now > endTime) {
      res.status(403).json({ error: "Forbidden: Exam submission window has expired" });
      return;
    }
  }

  // 2. Mandatory Mod 5: Submission Locking (Cannot re-submit once 'submitted')
  const existingSub = DB.submissions.find(s => s.exam_id === exam_id && (s.trainee_id === user.id || s.reg_number === user.reg_number));
  if (existingSub && existingSub.status !== "in_progress") {
    res.status(400).json({ error: "Locked: Submission has already been completed and cannot be modified" });
    return;
  }

  // 3. Server-side Objective Grading (Keeps answer key strictly on server!)
  let objectiveScore = 0;
  const gradedA = (section_a || []).map((ans: any) => {
    const question = exam.payload.section_a?.questions?.find(q => q.id === ans.question_id);
    const isCorrect = question && (question as any).correct_answer !== undefined && String((question as any).correct_answer) === String(ans.answer);
    const marks = isCorrect ? question.marks : 0;
    objectiveScore += marks;
    return { ...ans, marks_awarded: marks };
  });

  const newSub = {
    id: `sub-${Date.now()}`,
    exam_id,
    unit_code: exam.unit_code,
    trainee_id: user.id,
    reg_number: user.reg_number || "10525",
    student_name: user.name,
    status: "submitted",
    total_score: objectiveScore,
    section_a: gradedA,
    section_b: section_b || [],
    created_at: new Date().toISOString()
  };

  DB.submissions.push(newSub as any);
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
  const sub = DB.submissions.find(s => s.id === submissionId);
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
  sub.status = "submitted";
  (sub as any).submitted_at = submittedAt;
  (sub as any).payload = payload;

  if (payload?.section_a) sub.section_a = payload.section_a;
  if (payload?.section_b) sub.section_b = payload.section_b;

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
apiRouter.post("/submissions/:id/grade", requireRoles("trainer", "admin"), (req: AuthenticatedRequest, res: Response) => {
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
  res.json({ success: true, updated: sub });
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
const handleBatchMarks = (req: AuthenticatedRequest, res: Response) => {
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

  const offering = DB.unit_offerings.find(uo => uo.id === unitOfferingId);
  if (!offering) {
    res.status(404).json({ error: "Unit offering not found" });
    return;
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

  res.json({
    success: true,
    count: updatedMarks.length,
    unitOfferingId,
    marks: updatedMarks,
  });
};

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

// ─── ENDPOINT: POST /api/pedagogy/sign-off (HOD Digital Pedagogical Sign-Off) ──
apiRouter.post("/pedagogy/sign-off", (req: AuthenticatedRequest, res: Response) => {
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

  res.json({
    success: true,
    message: `Pedagogical record ${targetId} marked as ${status}`,
    record,
  });
});

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
  res.json({ success: true, record });
});

// ─── ENDPOINT: POST /api/admin/users (Vertical Privilege Escalation Guard) ─────
apiRouter.post("/admin/users", requireRoles("admin"), (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  res.status(201).json({ success: true, user: { id: `user-${Date.now()}`, name, email, role } });
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
apiRouter.post("/evidence", requireRoles("trainee", "admin"), (req: AuthenticatedRequest, res: Response) => {
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
  res.status(201).json({ success: true, evidence: newEvidence });
});

// PUT /api/evidence/:id/verify: Verify evidence
apiRouter.put("/evidence/:id/verify", requireRoles("trainer", "hod", "admin"), (req: AuthenticatedRequest, res: Response) => {
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

  res.json({ success: true, evidence: item });
});

// PUT /api/evidence/:id/grade: Award mark and synchronize with assessment_marks
apiRouter.put("/evidence/:id/grade", requireRoles("trainer", "hod", "admin"), (req: AuthenticatedRequest, res: Response) => {
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

  res.json({ success: true, evidence: item, marks: markEntry });
});

// DELETE /api/evidence/:id: Delete evidence (candidate cannot delete if verified or graded)
apiRouter.delete("/evidence/:id", (req: AuthenticatedRequest, res: Response) => {
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
  }

  res.json({ success: true, deleted_id: req.params.id });
});

