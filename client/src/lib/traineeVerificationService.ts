/**
 * Trainee Verification Service
 * Mukiria Technical Training Institute (MTTI)
 *
 * Provides a resilient, dual-layer candidate roster verification mechanism:
 * 1. Queries authoritative backend lookup (/api/trainees/lookup?admission_no=...)
 *    with safe non-JSON error handling (preventing SyntaxError crashes).
 * 2. Seamlessly falls back to institutional SSOT roster (OFFICIAL_MTTI_TRAINEES)
 *    if offline, on network latency, or if server gateway returns a temporary non-200.
 */

import { OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";
import { normalizeAdmissionNumber, matchAdmissionNumbers } from "@shared/const.ts";
import { getDepartmentForCohort } from "@shared/cohortRegistry.ts";

export interface VerifiedTraineeProfile {
  id: string;
  admissionNumber: string;
  fullName: string;
  department: string;
  classCode: string;
}

export async function verifyTraineeAdmission(admissionNo: string): Promise<VerifiedTraineeProfile> {
  const cleanAdm = (admissionNo || "").trim();
  if (!cleanAdm) {
    throw new Error("Admission / Registration number is required.");
  }

  // 1. Attempt authoritative backend lookup with safe non-JSON error handling
  try {
    const res = await fetch(`/api/trainees/lookup?admission_no=${encodeURIComponent(cleanAdm)}`);
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (res.ok && data && (data.fullName || data.full_name)) {
      const studentName = data.fullName || data.full_name || "";
      const classCode = data.classCode || data.class_code || data.cohortCode || "";
      const department = data.department || getDepartmentForCohort(classCode);
      return {
        id: data.id || "tr_verified",
        admissionNumber: data.admissionNumber || data.admission_no || cleanAdm,
        fullName: studentName,
        department,
        classCode,
      };
    }
  } catch (netErr) {
    console.warn("[TraineeVerification]: Remote lookup notice, checking institutional roster fallback:", netErr);
  }

  // 2. High-availability client-side Institutional SSOT Roster matching
  const normClean = normalizeAdmissionNumber(cleanAdm);
  const match = OFFICIAL_MTTI_TRAINEES.find((t) => {
    return (
      (normClean && normalizeAdmissionNumber(t.admNo) === normClean) ||
      (normClean && normalizeAdmissionNumber(t.regCode) === normClean) ||
      matchAdmissionNumbers(t.admNo, cleanAdm) ||
      matchAdmissionNumbers(t.regCode, cleanAdm)
    );
  });

  if (match) {
    const classCode = match.classCode || "UNKNOWN";
    const department = match.department || getDepartmentForCohort(classCode);
    return {
      id: match.id,
      admissionNumber: match.admNo || cleanAdm,
      fullName: match.name,
      department,
      classCode,
    };
  }

  throw new Error("Admission number not found in institutional roster. Please contact your department.");
}
