/**
 * Mukiria Technical Training Institute (MTTI)
 * Cryptographic Document Authenticity & Verification Subsystem
 *
 * Implements HMAC-SHA256 tamper-evident digital signatures for TVET CDACC
 * official broadsheets, attendance registers, and continuous assessment documents.
 */

import crypto from "crypto";

export interface DocumentMetadata {
  doc_type: "broadsheet" | "attendance_register" | "assessment_marks" | "record_of_work";
  unit_code: string;
  term: string;
  academic_year?: string;
  cohort_id?: string;
  total_candidates: number;
  competent_count?: number;
  nyc_count?: number;
  average_mark?: number;
  content_digest?: string;
  hod_name?: string;
  hod_signoff: boolean;
  issued_at: string;
}

export function getSigningSecret(): string {
  const secret =
    process.env.DOCUMENT_SIGNING_KEY_CURRENT ||
    process.env.DOCUMENT_SIGNING_SECRET;

  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === "production" || process.env.STRICT_AUTH === "true") {
      throw new Error(
        "FATAL: DOCUMENT_SIGNING_KEY_CURRENT is not configured or is fewer than 32 characters in production mode."
      );
    }
    // High-entropy fallback strictly for non-production tests
    return "mtti-doc-auth-secret-key-knqf-cdacc-2026-minimum-32-chars-entropy";
  }
  return secret;
}

export function getPreviousSigningSecret(): string | null {
  return process.env.DOCUMENT_SIGNING_KEY_PREVIOUS || null;
}

/**
 * Deterministic canonical representation of document metadata to guarantee
 * that identical payloads yield identical HMAC signatures.
 */
export function canonicalizeDocMetadata(doc: DocumentMetadata): string {
  const docType = (doc.doc_type || "broadsheet").trim().toLowerCase();
  const unit = (doc.unit_code || "").trim().toUpperCase();
  const term = (doc.term || "").trim();
  const total = Number(doc.total_candidates || 0);
  const comp = Number(doc.competent_count || 0);
  const nyc = Number(doc.nyc_count || 0);
  const avg = Number((doc.average_mark || 0).toFixed(2));
  const signoff = Boolean(doc.hod_signoff);
  const issued = (doc.issued_at || "").trim();
  const digest = (doc.content_digest || "").trim();

  const parts = [
    `type=${docType}`,
    `unit=${unit}`,
    `term=${term}`,
    `candidates=${total}`,
    `competent=${comp}`,
    `nyc=${nyc}`,
    `avg=${avg}`,
    `hod_signoff=${signoff}`,
    `issued_at=${issued}`,
  ];

  if (digest) {
    parts.push(`digest=${digest}`);
  }

  return parts.join("|");
}

/**
 * Generate a tamper-evident HMAC-SHA256 digital signature and compact base64url verification token
 */
export function signDocumentPayload(docMetadata: DocumentMetadata): {
  token: string;
  signature: string;
  short_hash: string;
  canonical_string: string;
} {
  const secret = getSigningSecret();
  const canonical = canonicalizeDocMetadata(docMetadata);
  const signature = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
  const short_hash = `MTTI-${signature.slice(0, 12).toUpperCase()}`;

  const envelope = {
    d: docMetadata,
    sig: signature,
    h: short_hash,
  };

  const token = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  return {
    token,
    signature,
    short_hash,
    canonical_string: canonical,
  };
}

/**
 * Cryptographically verify an incoming document verification token.
 * Validates HMAC signature with constant-time equality check to prevent timing attacks.
 */
export function verifyDocumentToken(token: string): {
  valid: boolean;
  docMetadata?: DocumentMetadata;
  short_hash?: string;
  legacy_key?: boolean;
  warning?: string;
  error?: string;
} {
  try {
    if (!token || typeof token !== "string" || !token.trim()) {
      return { valid: false, error: "Missing or invalid token parameter" };
    }

    const raw = Buffer.from(token.trim(), "base64url").toString("utf8");
    const envelope = JSON.parse(raw);

    if (!envelope || !envelope.d || typeof envelope.sig !== "string") {
      return { valid: false, error: "Malformed document verification envelope structure" };
    }

    const secret = getSigningSecret();
    const canonical = canonicalizeDocMetadata(envelope.d);
    const expectedSig = crypto.createHmac("sha256", secret).update(canonical).digest("hex");

    const sigBuf = Buffer.from(envelope.sig, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");

    let isLegacyKey = false;
    let verified = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!verified) {
      const prevSecret = getPreviousSigningSecret();
      if (prevSecret) {
        const prevExpectedSig = crypto.createHmac("sha256", prevSecret).update(canonical).digest("hex");
        const prevExpBuf = Buffer.from(prevExpectedSig, "hex");
        if (sigBuf.length === prevExpBuf.length && crypto.timingSafeEqual(sigBuf, prevExpBuf)) {
          verified = true;
          isLegacyKey = true;
        }
      }
    }

    if (!verified) {
      return {
        valid: false,
        error: "Cryptographic signature mismatch: Document payload has been altered or tampered with.",
      };
    }

    return {
      valid: true,
      docMetadata: envelope.d,
      short_hash: envelope.h || `MTTI-${envelope.sig.slice(0, 12).toUpperCase()}`,
      legacy_key: isLegacyKey,
      warning: isLegacyKey
        ? "Document verified using previous institutional key (grace period active)."
        : undefined,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to decode verification token: ${err.message}`,
    };
  }
}
