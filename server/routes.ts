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
  ]
};

// ─── AUTHENTICATION & CONTEXT EXTRACTION MIDDLEWARE ──────────────────────────
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] || "";
  const roleHeader = (req.headers["x-user-role"] as string) || "";
  const idHeader = (req.headers["x-user-id"] as string) || "";
  const regHeader = (req.headers["x-user-reg"] as string) || "";
  const deptHeader = (req.headers["x-user-dept"] as string) || "";

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
    user = {
      id: idHeader || `user-${roleHeader}`,
      email: `${roleHeader}@mtti.ac.ke`,
      name: `Demo ${roleHeader.toUpperCase()}`,
      role: roleHeader as any,
      reg_number: regHeader,
      department_id: deptHeader,
      assigned_units: roleHeader === "trainer" ? (idHeader === "trainer-002" ? ["ICT/OS/IT/CR/1/6"] : ["ICT/CU/IT/CR/6/6", "061155101A-WA1"]) : undefined,
      enrolled_units: roleHeader === "trainee" ? ["ICT/CU/IT/CR/6/6", "061155101A-WA1"] : undefined,
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
    const isCorrect = question && String(question.correct_answer) === String(ans.answer);
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
      const isCorrect = question && String(question.correct_answer) === String(ans.answer);
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
  let markEntry = existingMark;

  if (!markEntry) {
    markEntry = {
      id: `mark-${Date.now()}`,
      unit_offering_id: item.unit_offering_id,
      trainee_id: item.trainee_id,
      ct_avg: 0,
      cp_avg: 0,
      cp_scores: [],
      ct_scores: [],
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

