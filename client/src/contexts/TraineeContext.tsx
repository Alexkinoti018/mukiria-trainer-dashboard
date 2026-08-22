import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Trainee {
  id: string;
  regCode: string;
  admNo: string;
  name: string;
}

export interface Upload {
  id: string;
  traineeId: string;
  student_name: string;
  filename: string;
  uploadType: string;
  submitted_at: string;
  status: "pending" | "graded";
  grade: number | null;
  comments: string;
}

interface TraineeContextType {
  trainees: Trainee[];
  uploads: Upload[];
  registerTrainee: (trainee: Omit<Trainee, "id">) => Trainee;
  recordUpload: (upload: Omit<Upload, "id" | "submitted_at" | "status" | "grade" | "comments">) => void;
  updateUploadGrade: (uploadId: string, grade: number, comments: string) => void;
}

const INITIAL_TRAINEES: Trainee[] = [
  { id: "tr_1", regCode: "ICT/2026/001", admNo: "ADM001", name: "Alex Kinoti" },
  { id: "tr_2", regCode: "ICT/2026/002", admNo: "ADM002", name: "Jane Doe" },
  { id: "tr_3", regCode: "ICT/2026/003", admNo: "ADM003", name: "Alice Johnson" },
];

const INITIAL_UPLOADS: Upload[] = [
  {
    id: "up_1",
    traineeId: "tr_1",
    student_name: "Alex Kinoti",
    filename: "ICT_Practical_1_Evidence.pdf",
    uploadType: "Practical 1",
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
    grade: null,
    comments: "",
  },
  {
    id: "up_2",
    traineeId: "tr_2",
    student_name: "Jane Doe",
    filename: "Database_Design_Assignment.docx",
    uploadType: "Assignment",
    submitted_at: new Date(Date.now() - 172800000).toISOString(),
    status: "graded",
    grade: 85,
    comments: "Excellent ERD design.",
  },
];

const TraineeContext = createContext<TraineeContextType | undefined>(undefined);

export function TraineeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or fallback to defaults
  const [trainees, setTrainees] = useState<Trainee[]>(() => {
    const saved = localStorage.getItem("mtti_trainees");
    return saved ? JSON.parse(saved) : INITIAL_TRAINEES;
  });

  const [uploads, setUploads] = useState<Upload[]>(() => {
    const saved = localStorage.getItem("mtti_uploads");
    return saved ? JSON.parse(saved) : INITIAL_UPLOADS;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("mtti_trainees", JSON.stringify(trainees));
  }, [trainees]);

  useEffect(() => {
    localStorage.setItem("mtti_uploads", JSON.stringify(uploads));
  }, [uploads]);

  const registerTrainee = (newTrainee: Omit<Trainee, "id">) => {
    // Check if exists
    const existing = trainees.find(t => t.regCode === newTrainee.regCode);
    if (existing) return existing;

    const trainee: Trainee = {
      ...newTrainee,
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrainees(prev => [...prev, trainee]);
    return trainee;
  };

  const recordUpload = (upload: Omit<Upload, "id" | "submitted_at" | "status" | "grade" | "comments">) => {
    const newUpload: Upload = {
      ...upload,
      id: `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submitted_at: new Date().toISOString(),
      status: "pending",
      grade: null,
      comments: "",
    };
    setUploads(prev => [newUpload, ...prev]);
  };

  const updateUploadGrade = (uploadId: string, grade: number, comments: string) => {
    setUploads(prev =>
      prev.map(up =>
        up.id === uploadId ? { ...up, status: "graded", grade, comments } : up
      )
    );
  };

  return (
    <TraineeContext.Provider value={{ trainees, uploads, registerTrainee, recordUpload, updateUploadGrade }}>
      {children}
    </TraineeContext.Provider>
  );
}

export function useTrainees() {
  const context = useContext(TraineeContext);
  if (!context) {
    throw new Error("useTrainees must be used within a TraineeProvider");
  }
  return context;
}
