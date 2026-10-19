import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportSessionPlanWordClientSide, type SessionPlanPayload } from "../client/src/lib/exportSessionPlanWord";
import { exportLearningPlanWordClientSide, type LearningPlanWordExportData } from "../client/src/lib/exportLearningPlanWord";
import { exportCandidateSlipWord, exportBatchBroadsheetWord } from "../client/src/lib/exportHODReportsWord";
import type { Exam, Submission } from "../client/src/lib/supabase";

describe("Client-Side TVET CDACC Handlers & Export Engines Verification", () => {
  let createdLinks: any[] = [];
  let originalDocument: any;
  let originalURL: any;
  let originalBlob: any;
  let originalWindow: any;

  beforeEach(() => {
    createdLinks = [];
    originalDocument = (global as any).document;
    originalURL = (global as any).URL;
    originalBlob = (global as any).Blob;
    originalWindow = (global as any).window;

    const mockDoc = {
      createElement: (tag: string) => {
        const link = {
          tagName: tag.toUpperCase(),
          href: "",
          download: "",
          click: vi.fn(),
        };
        createdLinks.push(link);
        return link;
      },
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    const mockUrl = {
      createObjectURL: vi.fn(() => "blob:http://localhost/mock-blob-id"),
      revokeObjectURL: vi.fn(),
    };

    (global as any).document = mockDoc;
    (global as any).URL = mockUrl;
    (global as any).window = {
      URL: mockUrl,
      document: mockDoc,
    };

    (global as any).Blob = class MockBlob {
      content: any[];
      options: any;
      constructor(content: any[], options?: any) {
        this.content = content;
        this.options = options;
      }
    };
  });

  afterEach(() => {
    (global as any).document = originalDocument;
    (global as any).URL = originalURL;
    (global as any).Blob = originalBlob;
    (global as any).window = originalWindow;
  });

  it("generates compliant Form MTTI/F/CUR/05 Session Plan Word document", () => {
    const plan: SessionPlanPayload = {
      date: "18/10/2026",
      time_duration: "8:00 AM - 10:00 AM",
      week_number: 3,
      session_no: 1,
      trainer_name: "Alexander Kinoti",
      department: "Computing & Informatics",
      unit_name: "Computer Application II",
      unit_code: "ICT/CU/IT/CR/6/6",
      level: 6,
      class_code: "ITECH6/M/24",
      trainees_count: 24,
      session_title: "Database Normalization & 3NF Structures",
      learning_outcomes: [
        "Explain 1NF, 2NF, and 3NF database design principles",
        "Perform normalization transformations on sample institutional schemas",
      ],
      resources: ["Curriculum Guide", "PostgreSQL Engine Workstations"],
      safety_requirements: "Observe workshop electrical and ergonomic standards.",
      introduction: "Review ER diagrams and relational keys.",
      delivery_steps: [
        {
          time_minutes: 20,
          trainer_activity: "Explain normal forms with practical examples",
          learner_activity: "Take notes and analyze functional dependencies",
          assessment: "Oral questioning and Q&A check",
        },
        {
          time_minutes: 40,
          trainer_activity: "Guide hands-on schema conversion",
          learner_activity: "Execute SQL table definitions in lab",
          assessment: "Inspect workstation schema queries",
        },
      ],
      session_review: "Summarize 3NF criteria and transition to indexing.",
      assignment: "Complete Exercises 3.1 through 3.4 in manual.",
      total_time: "60 min",
      reflection: "All trainees successfully implemented 3NF schemas.",
      signature_date: "18/10/2026",
    };

    const res = exportSessionPlanWordClientSide(plan);
    expect(res.success).toBe(true);
    expect(res.filename).toContain("MTTI_CUR05_SessionPlan_W3");
    expect(createdLinks.length).toBe(1);
    expect(createdLinks[0].download).toBe(res.filename);
    expect(createdLinks[0].click).toHaveBeenCalled();
  });

  it("generates Form MTTI/F/CUR/02 Landscape 9-Column Learning Plan Word document", () => {
    const lp: LearningPlanWordExportData = {
      trainerName: "Alexander Kinoti",
      unitTitle: "Computer Networks",
      unitCode: "ICT/OS/IT/CR/1/6",
      classCode: "ITECH 6",
      level: 6,
      traineesCount: 20,
      weeks: [
        {
          week: 1,
          sessionNo: 1,
          title: "Network Fundamentals & Topologies",
          outcome: "Design IP addressing schema",
          trainerActivities: "Lecture on IPv4/IPv6",
          traineeActivities: "Subnetting calculations",
          resources: "Packet Tracer",
        },
      ],
    };

    const res = exportLearningPlanWordClientSide(lp);
    expect(res.success).toBe(true);
    expect(res.filename).toContain("MTTI_LearningPlan_");
    expect(createdLinks.length).toBe(1);
    expect(createdLinks[0].download).toBe(res.filename);
    expect(createdLinks[0].click).toHaveBeenCalled();
  });

  it("generates Form Candidate Assessment Slip Word document", () => {
    const sub: Submission = {
      id: "sub-test-01",
      exam_id: "exam-test",
      student_name: "Nthiga Gakii Doris",
      reg_number: "14179/S2026-SEED",
      unit_code: "061155101A",
      course_name: "Digital Literacy",
      class_code: "FBS 5 MOD/J/2026",
      total_score: 82,
      total_marks: 100,
      submitted_at: "2026-10-18T10:00:00Z",
      status: "graded",
      answers: {},
    };

    const res = exportCandidateSlipWord(sub, null);
    expect(res.success).toBe(true);
    expect(res.filename).toContain("MTTI_ResultSlip_061155101A_14179_S2026-SEED.doc");
    expect(createdLinks.length).toBe(1);
    expect(createdLinks[0].click).toHaveBeenCalled();
  });

  it("generates HOD CDACC Departmental Broadsheet Word document", () => {
    const exam: Exam = {
      id: "exam-test",
      unit_id: "u-1",
      unit_code: "061155101A",
      course_name: "Digital Literacy",
      created_by: "trainer-01",
      created_at: "2026-10-18T00:00:00Z",
      payload: {
        title: "Digital Literacy Assessment",
        duration_minutes: 120,
        total_marks: 100,
      },
    };

    const submissions: Submission[] = [
      {
        id: "sub-1",
        exam_id: "exam-test",
        student_name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026-SEED",
        unit_code: "061155101A",
        total_score: 82,
        total_marks: 100,
        submitted_at: "2026-10-18T10:00:00Z",
        status: "graded",
        answers: {},
      },
      {
        id: "sub-2",
        exam_id: "exam-test",
        student_name: "Alex Kinoti",
        reg_number: "10525",
        unit_code: "061155101A",
        total_score: 44,
        total_marks: 100,
        submitted_at: "2026-10-18T10:00:00Z",
        status: "graded",
        answers: {},
      },
    ];

    const res = exportBatchBroadsheetWord({
      submissions,
      exams: [exam],
      selectedUnit: "061155101A",
      passRate: 50,
      gradedCount: 2,
    });
    expect(res.success).toBe(true);
    expect(res.filename).toContain("MTTI_HOD_Institutional_Dossier_061155101A");
    expect(createdLinks.length).toBe(1);
    expect(createdLinks[0].click).toHaveBeenCalled();
  });
});
