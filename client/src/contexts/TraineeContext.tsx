import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Trainee {
  id: string;
  regCode: string;
  admNo: string;
  name: string;
  classCode: string;
  department?: string;
  gender?: "M" | "F";
  phone?: string;
  remarks?: string;
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
  addTrainee: (trainee: Omit<Trainee, "id">) => Trainee;
  updateTrainee: (id: string, updates: Partial<Trainee>) => void;
  deleteTrainee: (id: string) => void;
  recordUpload: (upload: Omit<Upload, "id" | "submitted_at" | "status" | "grade" | "comments">) => void;
  updateUploadGrade: (uploadId: string, grade: number, comments: string) => void;
  deleteUpload: (uploadId: string) => void;
  resetToOfficialRoster: () => void;
}

// Official Trainees Transcribed from MTTI Institutional Registers (MTTI/REG/CUR/02 & CUR/03)
export const OFFICIAL_MTTI_TRAINEES: Trainee[] = [
  // 1. ITECH 6 MODULAR/S/2026 (Perform Computer Essentials - Level 6)
  { id: "tr_it6_01", regCode: "ITECH 6 MOD/14179/S2026", admNo: "14179/S2026", name: "Nthiga Gakii Doris", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_02", regCode: "ITECH 6 MOD/14255/S2026", admNo: "14255/S2026", name: "Kaumbuthu Belinda Mukiri", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_03", regCode: "ITECH 6 MOD/14022/S2026", admNo: "14022/S2026", name: "Ltumwa Lesoipa", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_04", regCode: "ITECH 6 MOD/14077/S2026", admNo: "14077/S2026", name: "Kitheka Emmanuel Kioko", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_05", regCode: "ITECH 6 MOD/14102/S2026", admNo: "14102/S2026", name: "Felix Mugendi", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_06", regCode: "ITECH 6 MOD/14119/S2026", admNo: "14119/S2026", name: "Mwangi Clinton Njiru", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_07", regCode: "ITECH 6 MOD/14149/S2026", admNo: "14149/S2026", name: "Abigael Mukiri", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_08", regCode: "ITECH 6 MOD/14172/S2026", admNo: "14172/S2026", name: "Fiona Kadogo Mwika", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_09", regCode: "ITECH 6 MOD/14207/S2026", admNo: "14207/S2026", name: "Ann Mary Makena", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_10", regCode: "ITECH 6 MOD/14254/S2026", admNo: "14254/S2026", name: "Brenda Ngugi", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_11", regCode: "ITECH 6 MOD/14267/S2026", admNo: "14267/S2026", name: "Ingashia Favour Wawira", classCode: "ITECH 6 MODULAR/S/2026", department: "Computing & Informatics" },
  { id: "tr_it6_12", regCode: "10525", admNo: "10525", name: "LUCKYSUSAN KIANJIRU MUGO", classCode: "ITECH6/S/24", department: "Computing & Informatics" },
  { id: "tr_it6_13", regCode: "10525-H", admNo: "10525", name: "Harriet Mwendwa", classCode: "ITECH6/S/24", department: "Computing & Informatics" },

  // 2. ICT4 MOD/S/2026 (Perform Computer Essentials - Level 4)
  { id: "tr_it4_01", regCode: "ICT4 MOD/14076/S2026", admNo: "14076/S2026", name: "Wanjau Alvin Gatere", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_02", regCode: "ICT4 MOD/14107/S2026", admNo: "14107/S2026", name: "Ann Mukiri Matheta", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_03", regCode: "ICT4 MOD/14124/S2026", admNo: "14124/S2026", name: "Kimanthi Dennis Mwenda", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_04", regCode: "ICT4 MOD/14128/S2026", admNo: "14128/S2026", name: "Kimanthi Dennis Mwenda (II)", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_05", regCode: "ICT4 MOD/14211/S2026", admNo: "14211/S2026", name: "Guantai Brandon Mutua", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_06", regCode: "ICT4 MOD/14218/S2026", admNo: "14218/S2026", name: "Mwithia Mutharimi Nathan", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_07", regCode: "ICT4 MOD/14248/S2026", admNo: "14248/S2026", name: "Mbaabu Sarah Nkatha", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },
  { id: "tr_it4_08", regCode: "ICT4 MOD/14341/S2026", admNo: "14341/S2026", name: "Mutiria Hesborn Muriuki", classCode: "ICT4 MOD/S/2026", department: "Computing & Informatics" },

  // 3. Admin 5/6/J/2026 (Apply ICT Skills - Business Department)
  { id: "tr_adm_01", regCode: "13410", admNo: "13410", name: "RISPER MWENDE", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_02", regCode: "13527", admNo: "13527", name: "Banta Micheni", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_03", regCode: "12218", admNo: "12218", name: "Christine Gitonga", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_04", regCode: "13252", admNo: "13252", name: "Cynthia Nkatha", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_05", regCode: "13284", admNo: "13284", name: "Linet Ntinyari", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_06", regCode: "13424", admNo: "13424", name: "Nanis Ngugi", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_07", regCode: "13276", admNo: "13276", name: "Sharon Minoo", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_08", regCode: "10203", admNo: "10203", name: "Frida Kianjira", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_09", regCode: "12254", admNo: "12254", name: "Mercy Kiende", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_10", regCode: "12665", admNo: "12665", name: "Ruth Kathure", classCode: "Admin 5/6/J/2026", department: "Business" },
  { id: "tr_adm_11", regCode: "13580", admNo: "13580", name: "MERCY KATHUURE", classCode: "Admin 5/6/J/2026", department: "Business" },

  // 4. FBS 5 MOD/J/2026 (Apply Digital Literacy - Level 5, MTTI/REG/CUR/02)
  { id: "tr_fbs5_01", regCode: "FBS 5 MOD/13254/J2026", admNo: "13254", name: "Yvonne Mwende", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_02", regCode: "FBS 5 MOD/13263/J2026", admNo: "13263", name: "Muoki Muthoki", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_03", regCode: "FBS 5 MOD/13281/J2026", admNo: "13281", name: "Kibaara Peninah Gaichuiri", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_04", regCode: "FBS 5 MOD/13297/J2026", admNo: "13297", name: "Hilda Mwede Njagi", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_05", regCode: "FBS 5 MOD/13304/J2026", admNo: "13304", name: "Ndolo Shalom Mbithe", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_06", regCode: "FBS 5 MOD/13313/J2026", admNo: "13313", name: "Mirriam Nzula", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_07", regCode: "FBS 5 MOD/13343/J2026", admNo: "13343", name: "Waweru Hope Marion Makena", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_08", regCode: "FBS 5 MOD/13355/J2026", admNo: "13355", name: "Ann Joy Makena", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_09", regCode: "FBS 5 MOD/13378/J2026", admNo: "13378", name: "Martha Mwende Kyalo", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_10", regCode: "FBS 5 MOD/13396/J2026", admNo: "13396", name: "John Opiyo Omondi", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "M" },
  { id: "tr_fbs5_11", regCode: "FBS 5 MOD/13445/J2026", admNo: "13445", name: "Eunice Kendi Nyaga", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_12", regCode: "FBS 5 MOD/13446/J2026", admNo: "13446", name: "Miriko Rita", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_13", regCode: "FBS 5 MOD/13463/J2026", admNo: "13463", name: "Valentine Lesoito", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_14", regCode: "FBS 5 MOD/13482/J2026", admNo: "13482", name: "Kinyua Christine Mutito", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_15", regCode: "FBS 5 MOD/13488/J2026", admNo: "13488", name: "Gichukia Bridgit Nyakio", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_16", regCode: "FBS 5 MOD/13546/J2026", admNo: "13546", name: "Karwitha Silvia", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_17", regCode: "FBS 5 MOD/13551/J2026", admNo: "13551", name: "Lavint Aliviza", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_18", regCode: "FBS 5 MOD/13559/J2026", admNo: "13559", name: "Kinya Weddy", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_19", regCode: "FBS 5 MOD/13571/J2026", admNo: "13571", name: "Gakuhi Jackline Nyambura", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
  { id: "tr_fbs5_20", regCode: "FBS 5 MOD/13583/J2026", admNo: "13583", name: "Terry Mwendwa", classCode: "FBS 5 MOD/J/2026", department: "FBS Hospitality", gender: "F" },
];

const INITIAL_UPLOADS: Upload[] = [
  {
    id: "up_1",
    traineeId: "tr_it6_01",
    student_name: "Nthiga Gakii Doris",
    filename: "Computer_Essentials_Practical_1.pdf",
    uploadType: "Practical 1",
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
    grade: null,
    comments: "",
  },
  {
    id: "up_2",
    traineeId: "tr_it4_01",
    student_name: "Wanjau Alvin Gatere",
    filename: "Computer_Hardware_Assignment.docx",
    uploadType: "Assignment",
    submitted_at: new Date(Date.now() - 172800000).toISOString(),
    status: "graded",
    grade: 85,
    comments: "Excellent hardware identification.",
  },
];

const TraineeContext = createContext<TraineeContextType | undefined>(undefined);

export function TraineeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or fallback to official roster
  const [trainees, setTrainees] = useState<Trainee[]>(() => {
    const saved = localStorage.getItem("mtti_trainees");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 10) {
          return parsed.map((t: Trainee) => ({
            ...t,
            admNo: t.admNo?.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD)\//i, "") || t.admNo
          }));
        }
      } catch {}
    }
    return OFFICIAL_MTTI_TRAINEES;
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

  const resetToOfficialRoster = () => {
    setTrainees(OFFICIAL_MTTI_TRAINEES);
    localStorage.setItem("mtti_trainees", JSON.stringify(OFFICIAL_MTTI_TRAINEES));
  };

  const registerTrainee = (newTrainee: Omit<Trainee, "id">) => {
    const existing = trainees.find(t => t.regCode === newTrainee.regCode);
    if (existing) return existing;

    const trainee: Trainee = {
      ...newTrainee,
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrainees(prev => [...prev, trainee]);
    return trainee;
  };

  const addTrainee = (newTrainee: Omit<Trainee, "id">) => {
    const trainee: Trainee = {
      ...newTrainee,
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrainees(prev => [trainee, ...prev]);
    return trainee;
  };

  const updateTrainee = (id: string, updates: Partial<Trainee>) => {
    setTrainees(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTrainee = (id: string) => {
    setTrainees(prev => prev.filter(t => t.id !== id));
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

  const deleteUpload = (uploadId: string) => {
    setUploads(prev => prev.filter(up => up.id !== uploadId));
  };

  return (
    <TraineeContext.Provider value={{ 
      trainees, 
      uploads, 
      registerTrainee, 
      addTrainee, 
      updateTrainee, 
      deleteTrainee, 
      recordUpload, 
      updateUploadGrade, 
      deleteUpload,
      resetToOfficialRoster 
    }}>
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
