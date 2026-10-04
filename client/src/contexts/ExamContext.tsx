import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Exam, Submission, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
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
    const isProd = import.meta.env.PROD;
    const storedExams = localStorage.getItem("mukiria_exams");
    const storedSubmissions = localStorage.getItem("mukiria_submissions");

    // Mandatory Modification 6: Disable mock fallback in authenticated production builds
    if (isProd && isSupabaseConfigured()) {
      // In production with Supabase, never seed hardcoded mocks
      if (storedExams) setExams(JSON.parse(storedExams));
      if (storedSubmissions) setAllSubmissions(JSON.parse(storedSubmissions));
      return;
    }

    if (storedExams) {
      const parsed: Exam[] = JSON.parse(storedExams);
      const existingIds = new Set(parsed.map((e) => e.id || e.unit_code));
      const missingMocks = (MOCK_EXAMS as Exam[]).filter(
        (m) => !existingIds.has(m.id) && !existingIds.has(m.unit_code)
      );
      const combined = [...parsed, ...missingMocks];
      setExams(combined);
      if (missingMocks.length > 0) {
        localStorage.setItem("mukiria_exams", JSON.stringify(combined));
      }
    } else {
      setExams(MOCK_EXAMS);
      localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
    }

    if (storedSubmissions) {
      let parsed: Submission[] = JSON.parse(storedSubmissions);
      parsed = parsed.map((s) => ({
        ...s,
        total_score: s.total_score !== null ? Math.round(s.total_score) : null,
        section_a: (s.section_a || []).map((a) => ({
          ...a,
          marks_awarded: a.marks_awarded !== undefined ? Math.round(a.marks_awarded) : undefined,
        })),
        section_b: (s.section_b || []).map((b) => ({
          ...b,
          marks_awarded: b.marks_awarded !== undefined ? Math.round(b.marks_awarded) : undefined,
        })),
      }));

      const existingIds = new Set(parsed.map((s) => s.id));
      const missingMocks = (MOCK_SUBMISSIONS as Submission[]).filter((m) => !existingIds.has(m.id));
      const combined = [...missingMocks, ...parsed];
      setAllSubmissions(combined);
      localStorage.setItem("mukiria_submissions", JSON.stringify(combined));
    } else {
      setAllSubmissions(MOCK_SUBMISSIONS);
      localStorage.setItem("mukiria_submissions", JSON.stringify(MOCK_SUBMISSIONS));
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
  };

  const gradeSubmission = (id: string, updates: Partial<Submission>) => {
    const updated = allSubmissions.map((sub: Submission) => 
      sub.id === id ? { ...sub, ...updates, updated_at: new Date().toISOString() } : sub
    );
    setAllSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
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
