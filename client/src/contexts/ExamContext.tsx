import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Exam, Submission } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import { nanoid } from "nanoid";

interface ExamContextType {
  exams: Exam[];
  submissions: Submission[];
  addExam: (exam: Omit<Exam, "id" | "created_at">) => void;
  submitExam: (submission: Omit<Submission, "id" | "created_at" | "updated_at">) => void;
  gradeSubmission: (id: string, updates: Partial<Submission>) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedExams = localStorage.getItem("mukiria_exams");
    const storedSubmissions = localStorage.getItem("mukiria_submissions");

    if (storedExams) {
      setExams(JSON.parse(storedExams));
    } else {
      // Seed with mock data for demonstration
      setExams(MOCK_EXAMS);
      localStorage.setItem("mukiria_exams", JSON.stringify(MOCK_EXAMS));
    }

    if (storedSubmissions) {
      setSubmissions(JSON.parse(storedSubmissions));
    } else {
      setSubmissions(MOCK_SUBMISSIONS);
      localStorage.setItem("mukiria_submissions", JSON.stringify(MOCK_SUBMISSIONS));
    }
  }, []);

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
    const newSubmission: Submission = {
      ...submissionPayload,
      id: `sub-${nanoid(8)}`,
      created_at: new Date().toISOString(),
    };

    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
  };

  const gradeSubmission = (id: string, updates: Partial<Submission>) => {
    const updated = submissions.map((sub) => 
      sub.id === id ? { ...sub, ...updates, updated_at: new Date().toISOString() } : sub
    );
    setSubmissions(updated);
    localStorage.setItem("mukiria_submissions", JSON.stringify(updated));
  };

  return (
    <ExamContext.Provider value={{ exams, submissions, addExam, submitExam, gradeSubmission }}>
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
