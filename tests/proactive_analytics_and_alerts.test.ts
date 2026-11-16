import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  evaluateAttendanceHurdles,
  evaluatePedagogicalGaps,
  evaluateScoreDivergence,
  evaluateBroadsheetBacklogs,
  runGovernanceAudit,
  getGovernanceAlerts,
  resolveGovernanceAlert,
  clearGovernanceAlerts,
} from "../server/workers/proactiveAnalyticsWorker.ts";
import {
  loadPersistentAttendance,
  savePersistentAttendance,
  loadPersistentSessionPlans,
  savePersistentSessionPlans,
  loadPersistentRecordsOfWork,
  savePersistentRecordsOfWork,
  loadPersistentAssessmentMarks,
  savePersistentAssessmentMarks,
  loadPersistentTrainees,
  savePersistentTrainees,
  type AttendanceRecord,
} from "../server/db.ts";
import { apiRouter } from "../server/routes.ts";
import { createSignedJwt, getJwtSecret } from "../server/auth.ts";
import { synthesizeBlueprintFromUnit } from "../client/src/pages/ExamBuilder.tsx";

describe("Sprint 1 & 2: Proactive Governance, AI Assessment & IoT Hardware Ingestion", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  let hodToken: string;
  let adminToken: string;
  let traineeToken: string;

  // Use pre-seeded database accounts from DEFAULT_SYSTEM_USERS
  const testHod = {
    id: "usr-hod-001",
    name: "Head of Computing & Informatics",
    email: "hod.ci@mtti.ac.ke",
    role: "hod" as const,
    profile_id: "hod-ci",
    department_id: "dept-ci",
  };

  const testAdmin = {
    id: "usr-admin-001",
    name: "Mukiria System Administrator",
    email: "admin@mtti.ac.ke",
    role: "admin" as const,
    profile_id: "usr-admin-001",
    department_id: "dept-ia",
  };

  const testTrainee = {
    id: "usr-trainee-001",
    name: "Nthiga Gakii Doris",
    email: "trainee@mtti.ac.ke",
    role: "trainee" as const,
    profile_id: "trainee-001",
    reg_number: "14179/S2026",
    admission_number: "14179/S2026",
    class_code: "ICT4/ITECH6/S/26 MOD 1",
  };

  // Backups of persistent stores
  let origAttendance: any[];
  let origSessionPlans: any[];
  let origRecordsOfWork: any[];
  let origAssessmentMarks: any[];
  let origTrainees: any[];

  beforeAll(async () => {
    process.env.ALLOW_DEMO_AUTH = "true";
    origAttendance = loadPersistentAttendance();
    origSessionPlans = loadPersistentSessionPlans();
    origRecordsOfWork = loadPersistentRecordsOfWork();
    origAssessmentMarks = loadPersistentAssessmentMarks();
    origTrainees = loadPersistentTrainees();

    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    hodToken = "token-hod-ci";
    adminToken = "token-admin";
    traineeToken = "token-trainee-001";

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    savePersistentAttendance(origAttendance);
    savePersistentSessionPlans(origSessionPlans);
    savePersistentRecordsOfWork(origRecordsOfWork);
    savePersistentAssessmentMarks(origAssessmentMarks);
    savePersistentTrainees(origTrainees);

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(() => {
    clearGovernanceAlerts();
  });

  describe("1. Proactive Governance Rule Evaluators", () => {
    it("Rule 1: flags trainees with < 75% attendance with critical ATTENDANCE_HURDLE alert", () => {
      const lowAttendanceRecords: AttendanceRecord[] = [
        {
          id: "att-1",
          unit_offering_id: "uo-test-ci",
          trainee_id: "tr-low-att",
          week_number: 1,
          session_date: "2026-03-01",
          session_index: 1,
          status: "present",
          hours_attended: 2.0,
          marked_by: "TRAINER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "att-2",
          unit_offering_id: "uo-test-ci",
          trainee_id: "tr-low-att",
          week_number: 2,
          session_date: "2026-03-08",
          session_index: 1,
          status: "absent",
          hours_attended: 0.0,
          marked_by: "TRAINER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "att-3",
          unit_offering_id: "uo-test-ci",
          trainee_id: "tr-low-att",
          week_number: 3,
          session_date: "2026-03-15",
          session_index: 1,
          status: "absent",
          hours_attended: 0.0,
          marked_by: "TRAINER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "att-4",
          unit_offering_id: "uo-test-ci",
          trainee_id: "tr-low-att",
          week_number: 4,
          session_date: "2026-03-22",
          session_index: 1,
          status: "absent",
          hours_attended: 0.0,
          marked_by: "TRAINER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      savePersistentAttendance(lowAttendanceRecords);

      const alerts = evaluateAttendanceHurdles();
      expect(alerts.length).toBeGreaterThan(0);

      const alert = alerts.find((a) => a.metadata?.trainee_id === "tr-low-att");
      expect(alert).toBeDefined();
      expect(alert?.alert_type).toBe("ATTENDANCE_HURDLE");
      expect(alert?.severity).toBe("critical");
      expect(alert?.metadata?.rate_pct).toBe(25);
      expect(alert?.message).toContain("25.0%");
    });

    it("Rule 2: flags unit offerings with no Session Plans/RoWs in past 7 days as PEDAGOGICAL_GAP", () => {
      // Clear session plans & rows to simulate inactive offering
      savePersistentSessionPlans([]);
      savePersistentRecordsOfWork([]);

      const alerts = evaluatePedagogicalGaps();
      expect(alerts.length).toBeGreaterThan(0);

      const alert = alerts[0];
      expect(alert.alert_type).toBe("PEDAGOGICAL_GAP");
      expect(alert.severity).toBe("warning");
      expect(alert.title).toContain("Pedagogical Delivery Gap");
      expect(alert.action_url).toContain("/trainer/session-plan");
    });

    it("Rule 3: flags trainees with > 30% gap between Theory (CT) and Practical (CP) as SCORE_DIVERGENCE", () => {
      const divergentMarks = [
        {
          id: "mark-theory-1",
          trainee_id: "tr-div-1",
          unit_code: "ICT/CU/IT/CR/6/6",
          assessment_type: "theory",
          component: "CT",
          score: 85,
          unit_offering_id: "uo-1",
          created_at: new Date().toISOString(),
        },
        {
          id: "mark-practical-1",
          trainee_id: "tr-div-1",
          unit_code: "ICT/CU/IT/CR/6/6",
          assessment_type: "practical",
          component: "CP",
          score: 42,
          unit_offering_id: "uo-1",
          created_at: new Date().toISOString(),
        },
      ];

      savePersistentAssessmentMarks(divergentMarks);

      const alerts = evaluateScoreDivergence();
      expect(alerts.length).toBeGreaterThan(0);

      const alert = alerts.find((a) => a.metadata?.trainee_id === "tr-div-1");
      expect(alert).toBeDefined();
      expect(alert?.alert_type).toBe("SCORE_DIVERGENCE");
      expect(alert?.severity).toBe("warning");
      expect(alert?.metadata?.gap_percentage).toBe(43);
      expect(alert?.metadata?.is_asymmetric).toBe(true);
      expect(alert?.message).toContain("Continuous Theory = 85%");
      expect(alert?.message).toContain("Continuous Practical = 42%");
    });

    it("Rule 4: flags unit offerings with pending broadsheet approval as BROADSHEET_BACKLOG", () => {
      const finalizedMarks = [
        { id: "m1", unit_offering_id: "uo-1", unit_code: "ICT/CU/IT/CR/6/6", score: 70 },
        { id: "m2", unit_offering_id: "uo-1", unit_code: "ICT/CU/IT/CR/6/6", score: 80 },
        { id: "m3", unit_offering_id: "uo-1", unit_code: "ICT/CU/IT/CR/6/6", score: 65 },
      ];
      savePersistentAssessmentMarks(finalizedMarks);

      const alerts = evaluateBroadsheetBacklogs();
      const alert = alerts.find((a) => a.unit_offering_id === "uo-1");
      expect(alert).toBeDefined();
      expect(alert?.alert_type).toBe("BROADSHEET_BACKLOG");
      expect(alert?.severity).toBe("warning");
      expect(alert?.action_url).toContain("/hod/compliance");
    });

    it("runGovernanceAudit merges alerts and getGovernanceAlerts scopes by department", () => {
      const allAlerts = runGovernanceAudit();
      expect(allAlerts.length).toBeGreaterThan(0);

      const ciAlerts = getGovernanceAlerts("dept-ci");
      for (const a of ciAlerts) {
        expect(a.department_id).toBe("dept-ci");
      }

      const firstAlert = allAlerts[0];
      const resolved = resolveGovernanceAlert(firstAlert.id, "Dr. Catherine Wanjiku");
      expect(resolved).not.toBeNull();
      expect(resolved?.status).toBe("resolved");
      expect(resolved?.resolved_by).toBe("Dr. Catherine Wanjiku");
    });
  });

  describe("2. Governance API Endpoints & Role Access Scoping", () => {
    it("rejects trainees attempting to read governance alerts (HTTP 403)", async () => {
      const res = await fetch(`${baseUrl}/governance/alerts`, {
        headers: {
          Authorization: `Bearer ${traineeToken}`,
        },
      });
      expect(res.status).toBe(403);
    });

    it("allows HODs to view departmentally-scoped governance alerts (HTTP 200)", async () => {
      // Trigger audit to populate alerts
      runGovernanceAudit();

      const res = await fetch(`${baseUrl}/governance/alerts`, {
        headers: {
          Authorization: `Bearer ${hodToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.department_id).toBe("dept-ci");
      expect(Array.isArray(data.alerts)).toBe(true);
      for (const alert of data.alerts) {
        expect(alert.department_id).toBe("dept-ci");
      }
    });

    it("allows Admins to trigger on-demand governance compliance audit (HTTP 200)", async () => {
      const res = await fetch(`${baseUrl}/governance/alerts/run-audit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("executed successfully");
      expect(typeof data.total_alerts).toBe("number");
      expect(data.audited_at).toBeDefined();
    });

    it("allows HODs to resolve and archive an active governance alert (HTTP 200)", async () => {
      runGovernanceAudit();
      const alerts = getGovernanceAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      const targetAlert = alerts[0];

      const res = await fetch(`${baseUrl}/governance/alerts/${encodeURIComponent(targetAlert.id)}/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hodToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.alert.status).toBe("resolved");
    });
  });

  describe("3. IoT Hardware & Biometric Attendance Webhook", () => {
    it("rejects check-in requests with missing or invalid X-MTTI-Hardware-Key (HTTP 401)", async () => {
      const resWithoutKey = await fetch(`${baseUrl}/attendance/hardware-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admission_number: "14179/S2026" }),
      });
      expect(resWithoutKey.status).toBe(401);

      const resWithBadKey = await fetch(`${baseUrl}/attendance/hardware-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MTTI-Hardware-Key": "invalid-terminal-secret-key",
        },
        body: JSON.stringify({ admission_number: "14179/S2026" }),
      });
      expect(resWithBadKey.status).toBe(401);
    });

    it("rejects check-in requests with valid hardware key but missing admission_number (HTTP 400)", async () => {
      const res = await fetch(`${baseUrl}/attendance/hardware-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MTTI-Hardware-Key": "mtti-iot-hardware-key-2026",
        },
        body: JSON.stringify({ device_id: "reader-lab-01" }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Missing required 'admission_number'");
    });

    it("accepts valid hardware check-in and records attendance accurately (HTTP 201)", async () => {
      const payload = {
        device_id: "biometric-gate-workshop-02",
        admission_number: "14179/S2026",
        unit_offering_id: "uo-1",
        week_number: 5,
        session_index: 2,
        status: "present",
        hours_attended: 3.0,
      };

      const res = await fetch(`${baseUrl}/attendance/hardware-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MTTI-Hardware-Key": "mtti-iot-hardware-key-2026",
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("registered successfully");
      expect(data.record.marked_by).toBe("HARDWARE_biometric-gate-workshop-02");
      expect(data.record.hours_attended).toBe(3.0);
      expect(data.record.week_number).toBe(5);

      // Verify persistence in attendance store
      const allAtt = loadPersistentAttendance();
      const saved = allAtt.find((r) => r.id === data.record.id);
      expect(saved).toBeDefined();
      expect(saved?.status).toBe("present");
    });
  });

  describe("4. CDACC Blueprint Exam Synthesizer Invariant Verification", () => {
    it("Level 3 blueprint totals exactly 50m (Sec A: 20m, Sec B: 30m)", () => {
      const dummyL3Unit = {
        unit_code: "IT/CU/ICTA/CR/01/3/MA",
        unit_title: "Basic Hardware Maintenance",
        level: 3,
        learning_outcomes: [
          { title: "Identify basic computer hardware components", content: [] },
          { title: "Clean and service peripheral devices", content: [] },
          { title: "Perform simple component replacements", content: [] },
        ],
      };

      const blueprint = synthesizeBlueprintFromUnit(dummyL3Unit as any, false);
      expect(blueprint.total_marks).toBe(50);
      expect(blueprint.section_a?.total_marks).toBe(20);
      expect(blueprint.section_b?.total_marks).toBe(30);

      const secATotal = blueprint.section_a?.questions.reduce((sum, q) => sum + q.marks, 0);
      const secBTotal = blueprint.section_b?.questions.reduce((sum, q) => sum + q.marks, 0);
      expect(secATotal).toBe(20);
      expect(secBTotal).toBe(30);

      for (const q of [...(blueprint.section_a?.questions || []), ...(blueprint.section_b?.questions || [])]) {
        expect(q.critical_aspect).toBeDefined();
        expect(q.critical_aspect.length).toBeGreaterThan(5);
      }
    });

    it("Level 4 blueprint totals 50m (Sec A: 10m MCQs, Sec B: 40m) and contains ZERO True/False or Matching", () => {
      const dummyL4Unit = {
        unit_code: "IT/CU/ICTA/CR/01/4/MA",
        unit_title: "Computer Networks Essentials",
        level: 4,
        learning_outcomes: [
          { title: "Configure local area networks", content: [] },
          { title: "Terminate network cables", content: [] },
        ],
      };

      const blueprint = synthesizeBlueprintFromUnit(dummyL4Unit as any, false);
      expect(blueprint.total_marks).toBe(50);
      expect(blueprint.section_a?.total_marks).toBe(10);
      expect(blueprint.section_b?.total_marks).toBe(40);

      const secAQuestions = blueprint.section_a?.questions || [];
      const secBQuestions = blueprint.section_b?.questions || [];

      // Assert Section A is strictly MCQs
      for (const q of secAQuestions) {
        expect(q.type).toBe("mcq");
        expect(q.options && q.options.length).toBeGreaterThanOrEqual(4);
      }

      // Assert ZERO True/False or Matching across entire paper
      const allQuestions = [...secAQuestions, ...secBQuestions];
      const hasProhibited = allQuestions.some((q) => q.type === "true_false" || (q as any).type === "matching");
      expect(hasProhibited).toBe(false);
    });

    it("Level 5 & 6 blueprint totals 100m (Sec A: 40m short-answer, Sec B: 60m Choose 3 of 4)", () => {
      const dummyL6Unit = {
        unit_code: "ICT/CU/IT/CR/6/6",
        unit_title: "Network Systems Design & Management",
        level: 6,
        learning_outcomes: [
          { title: "Design enterprise campus architectures", content: [] },
          { title: "Implement multilayer switching and routing", content: [] },
          { title: "Manage perimeter network firewalls", content: [] },
          { title: "Perform network auditing and compliance verification", content: [] },
        ],
      };

      const blueprint = synthesizeBlueprintFromUnit(dummyL6Unit as any, false);
      expect(blueprint.total_marks).toBe(100);
      expect(blueprint.section_a?.total_marks).toBe(40);
      expect(blueprint.section_b?.total_marks).toBe(60);

      // Section A: 8 questions * 5 marks = 40 marks
      const secA = blueprint.section_a?.questions || [];
      expect(secA.length).toBe(8);
      for (const q of secA) {
        expect(q.type).toBe("short_answer");
        expect(q.marks).toBe(5);
      }

      // Section B: 4 essay questions of 20m each (answering 3 out of 4 = 60m)
      const secB = blueprint.section_b?.questions || [];
      expect(secB.length).toBe(4);
      for (const q of secB) {
        expect(q.type).toBe("essay");
        expect(q.marks).toBe(20);
      }
    });

    it("Practical blueprint generates 10 to 25 evaluation items mapped to CDACC Critical Aspects", () => {
      const dummyUnit = {
        unit_code: "061155101A",
        unit_title: "Apply Digital Literacy",
        level: 5,
        learning_outcomes: [
          { title: "Operate computer hardware securely", content: [] },
          { title: "Apply word processing packages", content: [] },
          { title: "Utilize spreadsheet applications", content: [] },
        ],
      };

      const blueprint = synthesizeBlueprintFromUnit(dummyUnit as any, true);
      expect(blueprint.type).toBe("practical");
      const checklist = (blueprint as any).checklist_items || [];

      expect(checklist.length).toBeGreaterThanOrEqual(10);
      expect(checklist.length).toBeLessThanOrEqual(25);

      for (const item of checklist) {
        expect(item.critical_aspect).toBeDefined();
        expect(item.critical_aspect.length).toBeGreaterThan(10);
        expect(item.max_score).toBeGreaterThan(0);
      }
    });
  });
});
