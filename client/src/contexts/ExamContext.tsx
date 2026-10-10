import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Exam, Submission, isSupabaseConfigured, normalizeAssessmentTaskSlot } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { syncScoreToContinuousMarksheet } from "@/contexts/TraineeContext";
import { nanoid } from "nanoid";

interface ExamContextType {
  exams: Exam[];
  submissions: Submission[];
  addExam: (exam: Omit<Exam, "id" | "created_at">) => void;
  submitExam: (submission: Omit<Submission, "id" | "created_at" | "updated_at">) => void;
  gradeSubmission: (id: string, updates: Partial<Submission>) => void;
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

    let loadedExams: Exam[] = MOCK_EXAMS;
    if (storedExams) {
      try {
        const parsed: Exam[] = JSON.parse(storedExams);
        const mockExamById = new Map((MOCK_EXAMS as Exam[]).map((m) => [m.id, m]));
        const mockExamByUnit = new Map((MOCK_EXAMS as Exam[]).map((m) => [m.unit_code, m]));
        const refreshedParsed = parsed.map((e) => {
          const mockMatch = mockExamById.get(e.id) || mockExamByUnit.get(e.unit_code);
          if (mockMatch) {
            return {
              ...mockMatch,
              ...e,
              payload: {
                ...mockMatch.payload,
                ...e.payload,
                section_a: mockMatch.payload.section_a || e.payload?.section_a,
                section_b: mockMatch.payload.section_b || e.payload?.section_b,
              },
            };
          }
          return e;
        });
        const existingIds = new Set(refreshedParsed.map((e) => e.id));
        const existingUnits = new Set(refreshedParsed.map((e) => e.unit_code));
        const missingMocks = (MOCK_EXAMS as Exam[]).filter(
          (m) => !existingIds.has(m.id) && !existingUnits.has(m.unit_code)
        );
        loadedExams = [...refreshedParsed, ...missingMocks];
        setExams(loadedExams);
        localStorage.setItem("mukiria_exams", JSON.stringify(loadedExams));
      } catch {
        setExams(MOCK_EXAMS);
        localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
      }
    } else {
      setExams(MOCK_EXAMS);
      localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
    }

    if (storedSubmissions) {
      try {
        let parsed: Submission[] = JSON.parse(storedSubmissions);
        const mockSubById = new Map((MOCK_SUBMISSIONS as Submission[]).map((m) => [m.id, m]));

        parsed = parsed.map((s) => {
          const mockSub = mockSubById.get(s.id);
          const exam = loadedExams.find((e) => e.unit_code === s.unit_code || e.id === s.exam_id);
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

          return {
            ...baseSub,
            total_score: baseSub.total_score !== null ? Math.round(baseSub.total_score) : null,
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
        (s) => s.reg_number === user.reg_number || s.student_email === user.email || s.trainee_id === user.id
      );
    }
    return allSubmissions;
  }, [allSubmissions, user]);

  // Column Shielding: Trainees receive sanitized exams stripped of answer keys, rubrics, and critical aspects
  const scopedExams = useMemo(() => {
    if (!user) return exams;
    if (user.role === "trainee") {
      return exams
        .filter((e) => !user.enrolled_units || user.enrolled_units.includes(e.unit_code))
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

  const addExam = (examPayload: Omit<Exam, "id" | "created_at">) => {
    const newExam: Exam = {
      ...examPayload,
      id: `exam-${nanoid(6)}`,
      created_at: new Date().toISOString(),
    };
    
    const updated = [...exams, newExam];
    setExams(updated);
    localStorage.setItem("mukiria_exams", JSON.stringify(updated));
  };

  const submitExam = (submissionPayload: Omit<Submission, "id" | "created_at" | "updated_at">) => {
    // Enforce submission immutability (400 Bad Request: Locked)
    const existing = allSubmissions.find(
      (s) =>
        (s.unit_code === submissionPayload.unit_code || s.exam_id === (submissionPayload as any).exam_id) &&
        (s.reg_number === submissionPayload.reg_number ||
          (submissionPayload.trainee_id && s.trainee_id === submissionPayload.trainee_id))
    );
    if (existing && (existing.status === "submitted" || existing.status === "graded")) {
      throw new Error("400 Bad Request: Locked: Submission has already been completed and cannot be modified");
    }

    const newSubmission: Submission = {
      ...submissionPayload,
      id: `sub-${nanoid(8)}`,
      created_at: new Date().toISOString(),
    };

    const updated = [...allSubmissions, newSubmission];
    setAllSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
    syncSubmissionWithMarksheet(newSubmission, exams);
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
    <ExamContext.Provider value={{ exams: scopedExams, submissions: scopedSubmissions, addExam, submitExam, gradeSubmission }}>
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
