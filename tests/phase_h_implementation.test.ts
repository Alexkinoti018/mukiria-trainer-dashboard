import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import type { Server } from "http";
import type { AddressInfo } from "net";
import fs from "fs";
import path from "path";
import { DEFAULT_COMPLIANCE_RULESETS, getActiveRuleset } from "../shared/complianceRulesets";
import { signDocumentPayload, verifyDocumentToken } from "../server/documentSigner";
import { apiRouter, getJwtSecret } from "../server/routes";
import { setCachedUserProfile } from "../server/auth";

describe("Phase H: Regulatory, Module, and Integrity Hardening Tests", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long-phase-h!";
    process.env.DOCUMENT_SIGNING_KEY = "test-secret-key-32-chars-long-security!";

    app = express();
    app.use(express.json());
    app.use("/api", apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  function createRoleToken(role: string, sub: string, extra: any = {}) {
    const userObj = {
      id: sub,
      profile_id: extra.profile_id || `${role}-h0`,
      email: `${role}@mtti.ac.ke`,
      name: `Test ${role}`,
      role: role.toLowerCase(),
      department_id: "dept-ci",
      admission_number: role === "trainee" ? "14179/S2026" : undefined,
      reg_number: role === "trainee" ? "14179/S2026" : undefined,
      ...extra,
    };
    setCachedUserProfile(sub, userObj as any);

    return jwt.sign(
      { sub, role: role.toLowerCase(), iss: "mtti-api", aud: "mtti-web", exp: Math.floor(Date.now() / 1000) + 3600 },
      getJwtSecret(),
      { algorithm: "HS256" }
    );
  }

  describe("1. Regulatory Citations & Rulesets (Phase C & AGENTS.md Harmonization)", () => {
    it("should include regulatory citations across all default levels", () => {
      for (const level of [3, 4, 5, 6] as const) {
        const ruleset = getActiveRuleset(level);
        expect(ruleset).toBeDefined();
        expect(ruleset.regulatory_metadata).toBeDefined();
        expect(ruleset.regulatory_metadata?.authority).toBe("TVET CDACC");
        expect(ruleset.regulatory_metadata?.standard_title).toBeDefined();
        expect(ruleset.regulatory_metadata?.section).toBeDefined();
      }
    });

    it("should enforce correct TVET CDACC CT/CP weightings per level", () => {
      const l3 = getActiveRuleset(3);
      expect(l3.ct_weight).toBe(0.20);
      expect(l3.cp_weight).toBe(0.80);

      const l4 = getActiveRuleset(4);
      expect(l4.ct_weight).toBe(0.30);
      expect(l4.cp_weight).toBe(0.70);

      const l5 = getActiveRuleset(5);
      expect(l5.ct_weight).toBe(0.40);
      expect(l5.cp_weight).toBe(0.60);

      const l6 = getActiveRuleset(6);
      expect(l6.ct_weight).toBe(0.50);
      expect(l6.cp_weight).toBe(0.50);
    });

    it("should allow True/False for Level 3 written assessment while strictly prohibiting for Level 4+", () => {
      const l3 = getActiveRuleset(3);
      expect(l3.exam_structure_rules.total_marks).toBe(50);
      expect(l3.exam_structure_rules.allow_true_false).toBe(true);
      expect(l3.exam_structure_rules.prohibit_true_false).toBe(false);

      const l4 = getActiveRuleset(4);
      expect(l4.exam_structure_rules.total_marks).toBe(50);
      expect(l4.exam_structure_rules.allow_true_false).toBe(false);
      expect(l4.exam_structure_rules.prohibit_true_false).toBe(true);

      const l5 = getActiveRuleset(5);
      expect(l5.exam_structure_rules.total_marks).toBe(100);
      expect(l5.exam_structure_rules.allow_true_false).toBe(false);
      expect(l5.exam_structure_rules.prohibit_true_false).toBe(true);

      const l6 = getActiveRuleset(6);
      expect(l6.exam_structure_rules.total_marks).toBe(100);
      expect(l6.exam_structure_rules.allow_true_false).toBe(false);
      expect(l6.exam_structure_rules.prohibit_true_false).toBe(true);
    });

    it("should enforce practical observation checklist limits between 10 and 25 items", () => {
      for (const level of [3, 4, 5, 6] as const) {
        const ruleset = getActiveRuleset(level);
        expect(ruleset.exam_structure_rules.min_checklist_items).toBe(10);
        expect(ruleset.exam_structure_rules.max_checklist_items).toBe(25);
      }
    });
  });

  describe("2. Document HMAC Signing with Content Digest (Phase E Tamper Detection)", () => {
    it("should bind content_digest into the HMAC signature to invalidate modified marks", () => {
      const docMeta1 = {
        document_id: "doc-broadsheet-2026-t3",
        document_type: "broadsheet",
        academic_year: "2026",
        term: "Term 3",
        department_id: "dept-ict",
        content_digest: "sha256-originalmarks123456",
      };

      const docMeta2 = {
        ...docMeta1,
        content_digest: "sha256-tamperedmarks789012",
      };

      const sig1 = signDocumentPayload(docMeta1);
      const sig2 = signDocumentPayload(docMeta2);

      // Different content digests MUST yield distinct signatures
      expect(sig1.signature).not.toEqual(sig2.signature);

      // Verifying docMeta1 with sig1 succeeds
      const verification1 = verifyDocumentToken(sig1.token);
      expect(verification1.valid).toBe(true);
      expect(verification1.docMetadata?.document_id).toBe("doc-broadsheet-2026-t3");
      expect(verification1.docMetadata?.content_digest).toBe("sha256-originalmarks123456");

      // Verifying docMeta2 with sig2 succeeds
      const verification2 = verifyDocumentToken(sig2.token);
      expect(verification2.valid).toBe(true);
      expect(verification2.docMetadata?.content_digest).toBe("sha256-tamperedmarks789012");
    });
  });

  describe("3. Database Cascade Protection (DEF-E04 / Migration 19)", () => {
    it("should define Migration 19 altering foreign keys to ON DELETE RESTRICT", () => {
      const migPath = path.resolve(__dirname, "../database/migrations/19_protect_relational_cascades.sql");
      expect(fs.existsSync(migPath)).toBe(true);
      const sql = fs.readFileSync(migPath, "utf-8");

      expect(sql).toContain("ALTER TABLE classes");
      expect(sql).toContain("ON DELETE RESTRICT");
      expect(sql).toContain("ALTER TABLE unit_offerings");
      expect(sql).toContain("REFERENCES terms(id)");
    });

    it("should define Migration 19 Rollback script restoring ON DELETE CASCADE", () => {
      const rollbackPath = path.resolve(__dirname, "../database/migrations/19_protect_relational_cascades_rollback.sql");
      expect(fs.existsSync(rollbackPath)).toBe(true);
      const sql = fs.readFileSync(rollbackPath, "utf-8");

      expect(sql).toContain("ALTER TABLE classes");
      expect(sql).toContain("ON DELETE CASCADE");
      expect(sql).toContain("ALTER TABLE unit_offerings");
      expect(sql).toContain("ON DELETE CASCADE");
    });
  });

  describe("4. Native Backend Replacement Endpoints (DEF-D01 & DEF-D02)", () => {
    it("should auto-grade objective MCQ questions correctly via POST /api/auto-grade", async () => {
      const trainerToken = createRoleToken("trainer", "trainer-001");
      const res = await fetch(`${baseUrl}/auto-grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          student_answer: "B",
          correct_answer: "B",
          marks: 2,
          question_type: "mcq",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.score).toBe(2);
      expect(data.confidence).toBe(1.0);
      expect(data.rule_applied).toBe("exact_match");
    });

    it("should auto-grade short answer questions with keyword matching via POST /api/auto-grade", async () => {
      const trainerToken = createRoleToken("trainer", "trainer-001");
      const res = await fetch(`${baseUrl}/auto-grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          student_answer: "Central Processing Unit handles arithmetic calculations and program instructions",
          correct_answer: "Central Processing Unit",
          marks: 4,
          question_type: "short_answer",
          keywords: ["central", "processing", "instructions"],
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.score).toBeGreaterThan(0);
      expect(data.reasoning).toBeDefined();
    });

    it("should parse text/curriculum payload via native POST /api/parse-doc without python microservice", async () => {
      const trainerToken = createRoleToken("trainer", "trainer-001");
      const sampleText = "UNIT CODE: IT/CU/ICT/CR/01/6\nUnit Title: Applied Digital Literacy\nLEVEL: 6\nSUMMARY: Essential computing skills";
      const base64Data = Buffer.from(sampleText).toString("base64");

      const res = await fetch(`${baseUrl}/parse-doc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({
          filename: "curriculum.txt",
          file_data: base64Data,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.unit_code).toBe("IT/CU/ICT/CR/01/6");
      expect(data.unit_name).toBe("Applied Digital Literacy");
    });
  });
});
