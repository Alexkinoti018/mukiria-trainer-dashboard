import { describe, it, expect, beforeEach } from "vitest";
import {
  signDocumentPayload,
  verifyDocumentToken,
  canonicalizeDocMetadata,
  type DocumentMetadata,
} from "../server/documentSigner.ts";
import { getLabSafeRateLimitKey } from "../server/security.ts";
import { matchesDepartment, CANONICAL_DEPARTMENTS_MAP } from "../server/db.ts";

describe("Tamper-Evident Document Cryptographic Signing (HMAC-SHA256)", () => {
  const sampleDoc: DocumentMetadata = {
    doc_type: "broadsheet",
    unit_code: "ICT/CU/IT/CR/6/6",
    term: "NOV/DEC 2026",
    academic_year: "2026",
    total_candidates: 35,
    competent_count: 32,
    nyc_count: 3,
    average_mark: 74.5,
    hod_name: "Alexander Kinoti",
    hod_signoff: true,
    issued_at: "2026-11-13T00:00:00.000Z",
  };

  it("generates a compact URL-safe token, signature, and human-readable short hash", () => {
    const signed = signDocumentPayload(sampleDoc);

    expect(signed.token).toBeDefined();
    expect(signed.token.length).toBeGreaterThan(20);
    expect(signed.signature).toHaveLength(64); // 256-bit SHA-256 hex
    expect(signed.short_hash).toMatch(/^MTTI-[0-9A-F]{12}$/);
  });

  it("cryptographically verifies authentic, unmodified documents", () => {
    const signed = signDocumentPayload(sampleDoc);
    const verification = verifyDocumentToken(signed.token);

    expect(verification.valid).toBe(true);
    expect(verification.docMetadata).toBeDefined();
    expect(verification.docMetadata?.unit_code).toBe("ICT/CU/IT/CR/6/6");
    expect(verification.docMetadata?.average_mark).toBe(74.5);
    expect(verification.docMetadata?.hod_signoff).toBe(true);
    expect(verification.short_hash).toBe(signed.short_hash);
  });

  it("fails verification if total candidates or average mark is tampered with", () => {
    const signed = signDocumentPayload(sampleDoc);
    const raw = Buffer.from(signed.token, "base64url").toString("utf-8");
    const envelope = JSON.parse(raw);
    envelope.d.average_mark = 99.0; // Alter score from 74.5 to 99.0
    const tamperedToken = Buffer.from(JSON.stringify(envelope)).toString("base64url");

    const verification = verifyDocumentToken(tamperedToken);
    expect(verification.valid).toBe(false);
    expect(verification.error).toMatch(/tampered/i);
  });

  it("fails verification if HOD sign-off status is forged", () => {
    const unapprovedDoc: DocumentMetadata = {
      ...sampleDoc,
      hod_signoff: false,
    };
    const signed = signDocumentPayload(unapprovedDoc);
    const raw = Buffer.from(signed.token, "base64url").toString("utf-8");
    const envelope = JSON.parse(raw);
    envelope.d.hod_signoff = true; // Forge HOD approval
    const tamperedToken = Buffer.from(JSON.stringify(envelope)).toString("base64url");

    const verification = verifyDocumentToken(tamperedToken);
    expect(verification.valid).toBe(false);
    expect(verification.error).toMatch(/tampered/i);
  });

  it("produces deterministic canonical serialization regardless of field insertion order", () => {
    const objA = { doc_type: "broadsheet", unit_code: "EE101", average_mark: 60 };
    const objB = { average_mark: 60, unit_code: "EE101", doc_type: "broadsheet" };

    const canonA = canonicalizeDocMetadata(objA as any);
    const canonB = canonicalizeDocMetadata(objB as any);
    expect(canonA).toBe(canonB);
  });
});

describe("Lab-Safe Identity-Based Rate Limiting", () => {
  it("resolves authenticated user key by id or trainee admission number", () => {
    const reqTrainer = {
      user: { id: "user-trainer-101", role: "trainer" },
      headers: {},
    } as any;
    expect(getLabSafeRateLimitKey(reqTrainer)).toBe("user:user-trainer-101");

    const reqTrainee = {
      user: { reg_number: "14179/S2026", role: "trainee" },
      headers: {},
    } as any;
    expect(getLabSafeRateLimitKey(reqTrainee)).toBe("trainee:14179/S2026");
  });

  it("resolves request body reg_number for zero-email candidate login", () => {
    const reqBody = {
      body: { reg_number: "14200/S2026" },
      headers: {},
    } as any;
    expect(getLabSafeRateLimitKey(reqBody)).toBe("trainee-payload:14200/S2026");
  });

  it("resolves request body email for staff login", () => {
    const reqBody = {
      body: { email: "trainer@mtti.ac.ke" },
      headers: {},
    } as any;
    expect(getLabSafeRateLimitKey(reqBody)).toBe("email:trainer@mtti.ac.ke");
  });

  it("falls back to institutional client IP on unauthenticated requests", () => {
    const reqIp = {
      headers: { "x-forwarded-for": "197.237.100.22" },
      body: {},
    } as any;
    expect(getLabSafeRateLimitKey(reqIp)).toBe("ip:197.237.100.22");
  });

  it("guarantees 60 concurrent trainees behind the same public lab IP have unique isolated keys", () => {
    const sharedLabIp = "197.237.100.45";
    const keys = new Set<string>();

    for (let i = 1; i <= 60; i++) {
      const admNo = `141${String(i).padStart(2, "0")}/S2026`;
      const fakeReq = {
        headers: { "x-forwarded-for": sharedLabIp },
        body: { reg_number: admNo },
      } as any;

      const key = getLabSafeRateLimitKey(fakeReq);
      keys.add(key);
    }

    // Every trainee receives their own distinct bucket key; none are grouped under the shared IP
    expect(keys.size).toBe(60);
    for (const key of keys) {
      expect(key.startsWith("trainee-payload:")).toBe(true);
      expect(key.includes(sharedLabIp)).toBe(false);
    }
  });
});

describe("Department Resolution & UUID Hardening", () => {
  it("resolves canonical department codes, slugs, and alt codes cleanly", () => {
    expect(matchesDepartment({ id: "dept-ee", code: "EEE" }, "dept-ee")).toBe(true);
    expect(matchesDepartment({ id: "uuid-123", code: "EEE" }, "dept-ee")).toBe(true);
    expect(matchesDepartment({ id: "uuid-123", code: "EE" }, "dept-ee")).toBe(true);
    expect(matchesDepartment({ id: "uuid-123", code: "CI" }, "dept-ci")).toBe(true);
    expect(matchesDepartment({ id: "uuid-123", code: "ICT" }, "dept-ci")).toBe(true);
  });

  it("contains all 10 canonical TVET CDACC departments", () => {
    const slugs = Object.keys(CANONICAL_DEPARTMENTS_MAP);
    expect(slugs).toContain("dept-ci");
    expect(slugs).toContain("dept-ee");
    expect(slugs).toContain("dept-bce");
    expect(slugs).toContain("dept-mae");
    expect(slugs).toHaveLength(10);
  });
});
