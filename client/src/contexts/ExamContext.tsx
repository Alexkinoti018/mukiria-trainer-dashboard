import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Exam, Submission, isSupabaseConfigured, normalizeAssessmentTaskSlot, doesExamMatchTraineeCohort } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { syncScoreToContinuousMarksheet } from "@/contexts/TraineeContext";
import { syncExamSubmissionToAssessmentRegister } from "@/lib/attendanceStorage";
import { nanoid } from "nanoid";

interface ExamContextType {
  exams: Exam[];
  submissions: Submission[];
  addExam: (exam: Omit<Exam, "id" | "created_at"> & { id?: string }) => void;
  updateExamSchedule: (unitCodeOrId: string, scheduleUpdates: Partial<Exam["payload"]>) => void;
  submitExam: (submission: Omit<Submission, "id" | "created_at" | "updated_at">) => void;
  gradeSubmission: (id: string, updates: Partial<Submission>) => void;
  reopenSubmissionForRetake: (id: string, reason?: string, trainerName?: string) => void;
}

export function generateSubmissionHash(
  regNumber: string,
  unitCode: string,
  timestamp: string,
  answersCount: number
): string {
  const raw = `${(regNumber || "").trim().toUpperCase()}:${(unitCode || "").trim().toUpperCase()}:${timestamp}:${answersCount}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();
  return `MTTI-SEAL-${hex}-${timestamp.slice(0, 10).replace(/-/g, "")}`;
}

export function sanitizeExamForStudent(exam: Exam): Exam {
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
  delete (payload as any).answer_key;
  delete (payload as any).rubric;

  return {
    ...exam,
    payload,
  };
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  // Load from database / localStorage
  useEffect(() => {
    const storedExams = localStorage.getItem("mukiria_exams");
    const storedSubmissions = localStorage.getItem("mukiria_submissions");

    const EXAM_CONSENT_VERSION = "2026-10-16-trainer-consent-v2";
    const storedVersion = localStorage.getItem("mtti_exam_consent_version");
    const isConsentVersionOutdated = storedVersion !== EXAM_CONSENT_VERSION;

    let loadedExams: Exam[] = MOCK_EXAMS;
    if (storedExams) {
      try {
        const parsed: Exam[] = JSON.parse(storedExams);
        const mockExamById = new Map((MOCK_EXAMS as Exam[]).map((m) => [m.id, m]));
        const mockExamByUnit = new Map((MOCK_EXAMS as Exam[]).map((m) => [m.unit_code, m]));
        const refreshedParsed = parsed.map((e) => {
          const mockMatch = mockExamById.get(e.id) || mockExamByUnit.get(e.unit_code);
          if (mockMatch) {
            const effectivePortalVisible = isConsentVersionOutdated
              ? (mockMatch.payload?.portal_visible === true)
              : (e.payload?.portal_visible ?? mockMatch.payload?.portal_visible);

            return {
              ...mockMatch,
              ...e,
              payload: {
                ...mockMatch.payload,
                ...e.payload,
                portal_visible: effectivePortalVisible,
                section_a: mockMatch.payload.section_a || e.payload?.section_a,
                section_b: mockMatch.payload.section_b || e.payload?.section_b,
              },
            };
          }
          return e;
        });
        const existingIds = new Set(refreshedParsed.map((e) => e.id));
        const missingMocks = (MOCK_EXAMS as Exam[]).filter(
          (m) => !existingIds.has(m.id)
        );
        loadedExams = [...refreshedParsed, ...missingMocks];
        setExams(loadedExams);
        localStorage.setItem("mukiria_exams", JSON.stringify(loadedExams));
        localStorage.setItem("mtti_exam_consent_version", EXAM_CONSENT_VERSION);
      } catch {
        setExams(MOCK_EXAMS);
        localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
        localStorage.setItem("mtti_exam_consent_version", EXAM_CONSENT_VERSION);
      }
    } else {
      setExams(MOCK_EXAMS);
      localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
      localStorage.setItem("mtti_exam_consent_version", EXAM_CONSENT_VERSION);
    }

    if (storedSubmissions) {
      try {
        let parsed: Submission[] = JSON.parse(storedSubmissions);
        const mockSubById = new Map((MOCK_SUBMISSIONS as Submission[]).map((m) => [m.id, m]));

        parsed = parsed.map((s) => {
          const mockSub = mockSubById.get(s.id);
          const exam =
            loadedExams.find((e) => s.exam_id && e.id === s.exam_id) ||
            loadedExams.find((e) => s.task_code && e.payload?.task_code === s.task_code) ||
            loadedExams.find((e) => e.unit_code === s.unit_code);
          const validQIds = new Set([
            ...(exam?.payload?.section_a?.questions || []).map((q: any) => String(q.id)),
            ...(exam?.payload?.section_b?.questions || []).map((q: any) => String(q.id)),
          ]);
          const hasMismatchedQIds =
            validQIds.size > 0 &&
            (s.section_a || []).some((a) => !validQIds.has(String(a.question_id)));
          const maxMarks = exam?.payload?.total_marks ?? 100;
          const hasOverflowScore = s.total_score !== null && s.total_score > maxMarks;

          const baseSub =
            mockSub && (hasMismatchedQIds || hasOverflowScore)
              ? {
                  ...mockSub,
                  task_code: s.task_code || mockSub.task_code,
                  trainer_comments: s.trainer_comments || mockSub.trainer_comments,
                }
              : s;

          let normalizedScore =
            baseSub.total_score !== null && baseSub.total_score !== undefined
              ? Math.round(baseSub.total_score)
              : null;

          if (normalizedScore !== null && normalizedScore > maxMarks && maxMarks > 0) {
            const secBMax = exam?.payload?.section_b?.total_marks ?? 40;
            const secASum = (baseSub.section_a || []).reduce((acc, a) => acc + (a.marks_awarded ?? 0), 0);
            const secBSum = Math.min(
              secBMax,
              (baseSub.section_b || []).reduce((acc, b) => acc + (b.marks_awarded ?? 0), 0)
            );
            if (secASum + secBSum > 0 && secASum + secBSum <= maxMarks) {
              normalizedScore = Math.round(secASum + secBSum);
            } else if (normalizedScore <= 100) {
              normalizedScore = Math.round((normalizedScore / 100) * maxMarks);
            } else {
              normalizedScore = maxMarks;
            }
          }

          return {
            ...baseSub,
            total_score: normalizedScore,
            section_a: (baseSub.section_a || []).map((a) => ({
              ...a,
              marks_awarded: a.marks_awarded !== undefined ? Math.round(a.marks_awarded) : undefined,
            })),
            section_b: (baseSub.section_b || []).map((b) => ({
              ...b,
              marks_awarded: b.marks_awarded !== undefined ? Math.round(b.marks_awarded) : undefined,
            })),
          };
        });

        const existingIds = new Set(parsed.map((s) => s.id));
        const missingMocks = (MOCK_SUBMISSIONS as Submission[]).filter((m) => !existingIds.has(m.id));
        const combined = [...missingMocks, ...parsed];
        setAllSubmissions(combined);
        localStorage.setItem("mukiria_submissions", JSON.stringify(combined));
        combined.forEach((sub) => syncSubmissionWithMarksheet(sub, loadedExams));
      } catch {
        setAllSubmissions(MOCK_SUBMISSIONS);
        localStorage.setItem("mukiria_submissions", JSON.stringify(MOCK_SUBMISSIONS));
        MOCK_SUBMISSIONS.forEach((sub) => syncSubmissionWithMarksheet(sub, loadedExams));
      }
    } else {
      setAllSubmissions(MOCK_SUBMISSIONS);
      localStorage.setItem("mukiria_submissions", JSON.stringify(MOCK_SUBMISSIONS));
      MOCK_SUBMISSIONS.forEach((sub) => syncSubmissionWithMarksheet(sub, loadedExams));
    }
  }, []);

  // Strict Scoping: Trainees only receive their own submissions in memory
  const scopedSubmissions = useMemo(() => {
    if (!user) return [];
    if (user.role === "trainee") {
      return allSubmissions.filter(
        (s) => s.reg_number === user.reg_number || s.trainee_id === user.id
      );
    }
    return allSubmissions;
  }, [allSubmissions, user]);

  // Column Shielding & Strict Allocation Policy: Trainees only receive exams explicitly allocated (portal_visible === true) to their cohort
  const scopedExams = useMemo(() => {
    if (!user) return [];
    if (user.role === "trainee") {
      return exams
        .filter((e) => e.payload?.portal_visible === true)
        .filter((e) => doesExamMatchTraineeCohort(e, user.cohort_code, user.enrolled_units))
        .map((e) => sanitizeExamForStudent(e));
    }
    return exams;
  }, [exams, user]);

  const syncSubmissionWithMarksheet = (sub: Submission, currentExams: Exam[]) => {
    if (sub.total_score === null || sub.total_score === undefined) return;
    const exam = currentExams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id);
    const maxMarks = exam?.payload?.total_marks ?? 100;
    const pct =
      maxMarks !== 100 && maxMarks > 0 && sub.total_score <= maxMarks
        ? Math.round((sub.total_score / maxMarks) * 100)
        : Math.round(sub.total_score);
    const slot = normalizeAssessmentTaskSlot(
      sub.task_code || exam?.payload?.task_code,
      sub.unit_code,
      exam?.payload?.title,
      exam?.payload?.type
    );
    syncScoreToContinuousMarksheet({
      traineeId: sub.trainee_id,
      regNumber: sub.reg_number,
      studentName: sub.student_name,
      taskCode: slot,
      percentageScore: pct,
      unitOfferingId: "uo_1",
    });
  };

  const addExam = (examPayload: Omit<Exam, "id" | "created_at"> & { id?: string }) => {
    const existingIdx = exams.findIndex(
      (e) =>
        (examPayload.id && e.id === examPayload.id) ||
        e.unit_code.trim().toUpperCase() === examPayload.unit_code.trim().toUpperCase()
    );

    let updated: Exam[];
    if (existingIdx >= 0) {
      const existing = exams[existingIdx];
      const mergedExam: Exam = {
        ...existing,
        ...examPayload,
        id: existing.id,
        created_at: existing.created_at,
      };
      updated = exams.map((e, idx) => (idx === existingIdx ? mergedExam : e));
    } else {
      const newExam: Exam = {
        ...examPayload,
        id: examPayload.id || `exam-${nanoid(6)}`,
        created_at: new Date().toISOString(),
      };
      updated = [...exams, newExam];
    }

    setExams(updated);
    localStorage.setItem("mukiria_exams", JSON.stringify(updated));
  };

  const updateExamSchedule = (unitCodeOrId: string, scheduleUpdates: Partial<Exam["payload"]>) => {
    const updated = exams.map((e) => {
      if (e.id === unitCodeOrId || e.unit_code.trim().toUpperCase() === unitCodeOrId.trim().toUpperCase()) {
        return {
          ...e,
          payload: {
            ...e.payload,
            ...scheduleUpdates,
          },
        };
      }
      return e;
    });
    setExams(updated);
    localStorage.setItem("mukiria_exams", JSON.stringify(updated));
  };

  const submitExam = (submissionPayload: Omit<Submission, "id" | "created_at" | "updated_at">) => {
    const existingIdx = allSubmissions.findIndex(
      (s) =>
        (s.unit_code === submissionPayload.unit_code || s.exam_id === (submissionPayload as any).exam_id) &&
        (s.reg_number === submissionPayload.reg_number ||
          (submissionPayload.trainee_id && s.trainee_id === submissionPayload.trainee_id))
    );

    const nowIso = new Date().toISOString();
    const existing = existingIdx >= 0 ? allSubmissions[existingIdx] : null;

    // Strict Submission Lock: Once submitted and locked, reject any subsequent attempt unless reopened by trainer
    if (existing && existing.is_locked && existing.status !== "reopened") {
      throw new Error("Locked: This assessment has already been submitted and sealed. Retakes must be unlocked by the certified trainer.");
    }

    const currentAttempt = (existing?.attempt_count || 0) + 1;
    const totalAns = (submissionPayload.section_a?.length || 0) + (submissionPayload.section_b?.length || 0);
    const subHash = generateSubmissionHash(submissionPayload.reg_number, submissionPayload.unit_code, nowIso, totalAns);

    let updated: Submission[];
    let targetSub: Submission;

    if (existingIdx >= 0) {
      targetSub = {
        ...allSubmissions[existingIdx],
        ...submissionPayload,
        status: "submitted",
        is_locked: true,
        attempt_count: currentAttempt,
        submission_hash: subHash,
        locked_at: nowIso,
        submitted_at: nowIso,
        updated_at: nowIso,
      };
      updated = allSubmissions.map((s, idx) => (idx === existingIdx ? targetSub : s));
    } else {
      targetSub = {
        ...submissionPayload,
        id: `sub-${nanoid(8)}`,
        status: "submitted",
        is_locked: true,
        attempt_count: currentAttempt,
        submission_hash: subHash,
        locked_at: nowIso,
        submitted_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      };
      updated = [...allSubmissions, targetSub];
    }

    setAllSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
    syncSubmissionWithMarksheet(targetSub, exams);

    // Link exam submission with CUR/03 Assessment Attendance Register
    try {
      const matchingExam = exams.find((e) => e.id === targetSub.exam_id || e.unit_code === targetSub.unit_code);
      const cleanTitle = (matchingExam?.payload as any)?.title || matchingExam?.course_name || "Written Assessment 1";
      syncExamSubmissionToAssessmentRegister({
        studentName: targetSub.student_name,
        regNumber: targetSub.reg_number,
        unitCode: targetSub.unit_code,
        examId: targetSub.exam_id,
        examTitle: cleanTitle,
        assessmentType: cleanTitle,
        submittedAt: targetSub.submitted_at || nowIso,
      });
    } catch (err) {
      console.warn("Failed to sync exam submission to assessment register:", err);
    }
  };

  const reopenSubmissionForRetake = (id: string, reason?: string, trainerName?: string) => {
    const target = allSubmissions.find((s) => s.id === id);
    if (!target) return;

    const nowIso = new Date().toISOString();
    const reopenedSub: Submission = {
      ...target,
      is_locked: false,
      status: "reopened" as const,
      reopened_at: nowIso,
      reopened_by: trainerName || "Alexander Kinoti",
      reopen_reason: reason || "Trainer-authorized retake / second attempt",
      updated_at: nowIso,
    };

    const updated = allSubmissions.map((sub: Submission) => (sub.id === id ? reopenedSub : sub));
    setAllSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));

    try {
      localStorage.removeItem(`mtti_active_exam_session_${target.unit_code}`);
      localStorage.removeItem(`mtti_exam_answers_${target.unit_code}`);
      localStorage.removeItem(`mtti_exam_answers_${target.unit_code}_${target.reg_number}`);
    } catch (e) {}
  };

  const gradeSubmission = (id: string, updates: Partial<Submission>) => {
    let targetUpdated: Submission | null = null;
    const updated = allSubmissions.map((sub: Submission) => {
      if (sub.id === id) {
        targetUpdated = { ...sub, ...updates, updated_at: new Date().toISOString() };
        return targetUpdated;
      }
      return sub;
    });
    setAllSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
    if (targetUpdated) {
      syncSubmissionWithMarksheet(targetUpdated, exams);
    }
  };

  return (
    <ExamContext.Provider
      value={{
        exams: scopedExams,
        submissions: scopedSubmissions,
        addExam,
        updateExamSchedule,
        submitExam,
        gradeSubmission,
        reopenSubmissionForRetake,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
}
