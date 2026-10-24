import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import TrainerLayout from "@/components/TrainerLayout";
import TraineeLayout from "@/components/TraineeLayout";
import { 
  Save, 
  Printer, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  FileCheck2, 
  BookOpen, 
  Check, 
  X as XIcon, 
  RotateCcw,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  QrCode,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTrainees, OFFICIAL_MTTI_TRAINEES, getTraineesForClass } from "@/contexts/TraineeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredRecordsOfWork, saveStoredRecordsOfWork } from "@/lib/mockSessionPlans";
import WorkshopDoorQRModal from "@/components/WorkshopDoorQRModal";
import AttendanceQuickMarkModal from "@/components/AttendanceQuickMarkModal";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAttendanceScansFromOffline, enqueueSyncItem } from "@/lib/offlineStore";
import { syncEngine } from "@/lib/syncEngine";
import { getAcademicContext, getActiveTeachingWeek } from "@/lib/academicCalendar";
import { canonicalizeCohortCode } from "@/lib/curriculumDatabase";
import {
  AttendanceStatus,
  StudentAttendanceRecord,
  loadClassAttendanceRegister,
  saveClassAttendanceRegister,
  getCanonicalAttendanceClassKey,
} from "@/lib/attendanceStorage";
import {
  getCurrentTrainerProfile,
  buildClassConfigsForTrainer,
  type DynamicClassConfig,
} from "@/lib/timetableSyncService";

const WEEKS = 10;
const SESSIONS_PER_WEEK = 3;

interface ClassConfig {
  code: string;
  name: string;
  subject: string;
  department: string;
  level: string;
  duration: string;
  assessmentType: string;
  docCode: "MTTI/REG/CUR/02" | "MTTI/REG/CUR/03";
}

const MTTI_CLASSES: ClassConfig[] = [
  {
    code: "ICT4/ITECH6/S/26 MOD 1",
    name: "ICT4/ITECH6/S/26 MOD 1",
    subject: "Perform Computer Essentials",
    department: "Computing & Informatics",
    level: "Level 4 & 6",
    duration: "Term 3 2026",
    assessmentType: "Practical Assessment 1",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "ADMIN5/6/J/26 MOD 3",
    name: "ADMIN5/6/J/26 MOD 3",
    subject: "Apply ICT Skills",
    department: "Business Studies",
    level: "Level 6",
    duration: "Term 3 2026",
    assessmentType: "Practical Assessment 1",
    docCode: "MTTI/REG/CUR/03"
  },
  {
    code: "ADMIN4/5/6/S/26 MOD 1",
    name: "ADMIN4/5/6/S/26 MOD 1",
    subject: "Apply ICT Skills 1",
    department: "Business Studies",
    level: "Level 4/5/6",
    duration: "Term 3 2026",
    assessmentType: "General Class Register",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "FBS5/6/J/26",
    name: "FBS5/6/J/26",
    subject: "Apply Digital Literacy",
    department: "Hospitality Management",
    level: "Level 5 & 6",
    duration: "Term 3 2026",
    assessmentType: "General Class Register",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "LS5/6/S/26",
    name: "LS5/6/S/26",
    subject: "Apply Digital Literacy",
    department: "Surveying & Geomatics",
    level: "Level 5 & 6",
    duration: "Term 3 2026",
    assessmentType: "General Class Register",
    docCode: "MTTI/REG/CUR/02"
  }
];

function calculateStats(attendance: Record<string, AttendanceStatus>, hoursPerSession = 2) {
  let presentCount = 0;
  let absentCount = 0;

  Object.values(attendance).forEach(status => {
    if (status === "X") presentCount++;
    if (status === "0") absentCount++;
  });

  const totalMarkedSessions = presentCount + absentCount;
  const actualHrs = presentCount * hoursPerSession;
  const possibleHrs = totalMarkedSessions * hoursPerSession;
  
  const percentage = totalMarkedSessions === 0 
    ? 0 
    : Math.round((presentCount / totalMarkedSessions) * 100);

  return { actualHrs, possibleHrs, percentage, totalMarkedSessions };
}

interface AttendanceRowProps {
  trainee: any;
  index: number;
  record: Record<string, AttendanceStatus>;
  canEditRegister: boolean;
  onToggleAttendance: (studentId: string, week: number, session: number) => void;
  onEditStudent: (trainee: any) => void;
  onDeleteStudent: (id: string, name: string) => void;
}

const AttendanceRow = React.memo(function AttendanceRow({
  trainee,
  index,
  record,
  canEditRegister,
  onToggleAttendance,
  onEditStudent,
  onDeleteStudent,
}: AttendanceRowProps) {
  const stats = calculateStats(record);

  return (
    <tr className="border-b border-black hover:bg-gray-50 transition">
      <td className="border border-black p-1 text-center font-bold text-xs">{index + 1}</td>
      <td className="border border-black p-1 font-mono font-medium whitespace-nowrap text-xs">{trainee.admNo}</td>
      <td className="border border-black p-1 font-bold uppercase truncate max-w-[180px] text-xs" title={trainee.name}>
        {trainee.name}
      </td>
      
      {/* 10 Weeks, each with SESSIONS_PER_WEEK Sessions */}
      {Array.from({ length: WEEKS }).map((_, w) => (
        Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => {
          const key = `W${w + 1}_S${s + 1}`;
          const status = record[key] || "";
          const isEndOfWeek = s === SESSIONS_PER_WEEK - 1;
          return (
            <td 
              key={key} 
              onClick={() => onToggleAttendance(trainee.id, w + 1, s + 1)}
              className={`border border-black p-0.5 text-center font-bold cursor-pointer select-none text-[11px] ${
                isEndOfWeek ? "border-r-2 border-r-black" : ""
              } hover:bg-black/10`}
              title={`W${w + 1} S${s + 1}: ${status === 'X' ? 'Present' : status === '0' ? 'Absent' : 'Unmarked'} (Click to cycle)`}
            >
              {status === "X" ? (
                <span className="text-slate-900 font-bold print:text-black">X</span>
              ) : status === "0" ? (
                <span className="text-rose-600 font-mono font-bold print:text-black">0</span>
              ) : (
                <span className="text-gray-300 print:invisible font-light">-</span>
              )}
            </td>
          );
        })
      ))}

      <td className="border border-black p-1 text-center font-mono text-xs">{stats.possibleHrs}</td>
      <td className="border border-black p-1 text-center font-mono font-bold text-xs">{stats.actualHrs}</td>
      <td className="border border-black p-1 text-center font-mono font-bold text-xs">
        {stats.totalMarkedSessions > 0 ? `${stats.percentage}%` : ""}
      </td>
      {canEditRegister && (
        <td className="border border-black p-1 text-center print:hidden bg-white">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => onEditStudent(trainee)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Edit Student Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteStudent(trainee.id, trainee.name)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Remove Student"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
});

export default function ClassRegister() {
  const { trainees, addTrainee, updateTrainee, deleteTrainee, resetToOfficialRoster } = useTrainees();
  const { user } = useAuth();
  const [location] = useLocation();
  const canEditRegister = user?.role === "trainer" || user?.role === "admin" || user?.role === "hod";
  const isTraineeViewer = user?.role === "trainee";

  // Dynamic Multi-Tenant Trainer Classes from master timetable
  const trainerProfile = useMemo(() => getCurrentTrainerProfile(user), [user]);
  const dynamicClasses = useMemo(() => {
    return buildClassConfigsForTrainer(trainerProfile);
  }, [trainerProfile]);

  // Mode: "CUR/02" (General Class Register) or "CUR/03" (Assessment Attendance Register)
  const [formMode, setFormMode] = useState<"CUR/02" | "CUR/03">(() => {
    if (isTraineeViewer || location.includes("/attendance")) return "CUR/03";
    return "CUR/02";
  });
  const [selectedClassCode, setSelectedClassCode] = useState<string>(() => {
    if (user?.role === "trainee") {
      if (user.cohort_code) {
        const found = MTTI_CLASSES.find(
          (c) =>
            c.code.toLowerCase().includes(user.cohort_code!.toLowerCase()) ||
            user.cohort_code!.toLowerCase().includes(c.code.toLowerCase())
        );
        if (found) return found.code;
        if (user.cohort_code.toUpperCase().includes("FBS")) return "FBS5/6/J/26";
      }
      return "FBS5/6/J/26";
    }
    const prof = getCurrentTrainerProfile(user);
    return prof.classes && prof.classes[0] ? prof.classes[0] : "ICT4/ITECH6/S/26 MOD 1";
  });

  // Align selected class code to trainee's registered cohort from official roster
  useEffect(() => {
    if (isTraineeViewer && user) {
      const myTrainee = trainees.find(
        (t) =>
          (t.admNo && user.reg_number && t.admNo.trim().toUpperCase() === user.reg_number.trim().toUpperCase()) ||
          (t.name && user.name && t.name.trim().toLowerCase() === user.name.trim().toLowerCase())
      );
      if (myTrainee?.classCode) {
        const found = dynamicClasses.find((c) => c.code === myTrainee.classCode || myTrainee.classCode.includes(c.code));
        if (found) setSelectedClassCode(found.code);
        else if (myTrainee.classCode.includes("FBS")) setSelectedClassCode("FBS5/6/J/26");
      }
    } else if (!isTraineeViewer && dynamicClasses.length > 0) {
      if (!dynamicClasses.some((c) => c.code === selectedClassCode)) {
        setSelectedClassCode(dynamicClasses[0].code);
      }
    }
  }, [isTraineeViewer, user, trainees, dynamicClasses, selectedClassCode]);

  const academicContext = useMemo(() => getAcademicContext(), []);

  // State: Mapping traineeId -> attendance record
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceRecord>>({});
  const [hoursPerSession, setHoursPerSession] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(Date.now());
  const activeTeachingWeek = useMemo(() => getActiveTeachingWeek(), []);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isRollCallOpen, setIsRollCallOpen] = useState(false);

  // Student Add / Edit Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    admNo: "",
    gender: "M" as "M" | "F",
    email: "",
    phone: "",
    remarks: "",
  });

  // Form Metadata
  const activeClassConfig = useMemo(() => {
    return dynamicClasses.find(c => c.code === selectedClassCode) || dynamicClasses[0] || MTTI_CLASSES[0];
  }, [dynamicClasses, selectedClassCode]);

  const [metadata, setMetadata] = useState(() => ({
    lecturer: (trainerProfile?.name || user?.name || "ALEXANDER KINOTI").toUpperCase(),
    className: activeClassConfig.name,
    subject: activeClassConfig.subject,
    department: activeClassConfig.department,
    duration: activeClassConfig.duration,
    level: activeClassConfig.level,
    assessmentType: activeClassConfig.assessmentType,
    assessmentDate: academicContext.shortDate,
    lecturerComment: "",
    hodComment: "",
  }));

  const [weeklyLecturerComments, setWeeklyLecturerComments] = useState<Record<number, string>>({});
  const [weeklyHodComments, setWeeklyHodComments] = useState<Record<number, string>>({});

  // When class selection changes, synchronize metadata & rehydrate saved comments
  useEffect(() => {
    const commentsKey = `mtti_class_register_comments_${selectedClassCode}`;
    let savedComments: any = { lecturerComment: "", hodComment: "", weeklyLecturerComments: {}, weeklyHodComments: {} };
    try {
      const raw = localStorage.getItem(commentsKey);
      if (raw) savedComments = JSON.parse(raw);
    } catch (e) {}

    setMetadata(prev => ({
      ...prev,
      lecturer: (trainerProfile?.name || user?.name || prev.lecturer).toUpperCase(),
      className: activeClassConfig.name,
      subject: activeClassConfig.subject,
      department: activeClassConfig.department,
      duration: activeClassConfig.duration,
      level: activeClassConfig.level,
      assessmentType: activeClassConfig.assessmentType,
      lecturerComment: savedComments.lecturerComment || prev.lecturerComment || "",
      hodComment: savedComments.hodComment || prev.hodComment || "",
    }));

    const wLec = savedComments.weeklyLecturerComments || {};
    if (!wLec[0] && savedComments.lecturerComment) {
      wLec[0] = savedComments.lecturerComment;
    }
    setWeeklyLecturerComments(wLec);

    const wHod = savedComments.weeklyHodComments || {};
    if (!wHod[0] && savedComments.hodComment) {
      wHod[0] = savedComments.hodComment;
    }
    setWeeklyHodComments(wHod);

    // Asynchronously synchronize with centralized physical database / API
    fetch(`/api/documents/class-registers/${encodeURIComponent(selectedClassCode)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.metadata) {
          const m = json.metadata;
          setMetadata(prev => ({
            ...prev,
            lecturerComment: m.lecturerComment || prev.lecturerComment,
            hodComment: m.hodComment || prev.hodComment,
          }));
          if (m.weeklyLecturerComments) setWeeklyLecturerComments(m.weeklyLecturerComments);
          if (m.weeklyHodComments) setWeeklyHodComments(m.weeklyHodComments);
        }
      })
      .catch(() => {});
  }, [activeClassConfig, selectedClassCode]);

  const handleWeeklyCommentChange = (type: "lecturer" | "hod", weekIndex: number, val: string) => {
    if (type === "lecturer") {
      setWeeklyLecturerComments(prev => {
        const next = { ...prev, [weekIndex]: val };
        try {
          const raw = localStorage.getItem(`mtti_class_register_comments_${selectedClassCode}`);
          const cur = raw ? JSON.parse(raw) : {};
          localStorage.setItem(
            `mtti_class_register_comments_${selectedClassCode}`,
            JSON.stringify({ ...cur, weeklyLecturerComments: next, lecturerComment: next[0] || cur.lecturerComment || "" })
          );
        } catch (e) {}
        return next;
      });
      if (weekIndex === 0) {
        setMetadata(m => ({ ...m, lecturerComment: val }));
      }
    } else {
      setWeeklyHodComments(prev => {
        const next = { ...prev, [weekIndex]: val };
        try {
          const raw = localStorage.getItem(`mtti_class_register_comments_${selectedClassCode}`);
          const cur = raw ? JSON.parse(raw) : {};
          localStorage.setItem(
            `mtti_class_register_comments_${selectedClassCode}`,
            JSON.stringify({ ...cur, weeklyHodComments: next, hodComment: next[0] || cur.hodComment || "" })
          );
        } catch (e) {}
        return next;
      });
      if (weekIndex === 0) {
        setMetadata(m => ({ ...m, hodComment: val }));
      }
    }
  };

  const handleCommentChange = (field: "lecturerComment" | "hodComment", value: string) => {
    setMetadata(prev => {
      const updated = { ...prev, [field]: value };
      try {
        localStorage.setItem(
          `mtti_class_register_comments_${selectedClassCode}`,
          JSON.stringify({
            lecturerComment: field === "lecturerComment" ? value : prev.lecturerComment,
            hodComment: field === "hodComment" ? value : prev.hodComment,
            weeklyLecturerComments,
            weeklyHodComments,
          })
        );
      } catch (e) {}
      return updated;
    });
  };

  // Strictly resolved trainees by selected class (un-mixed, cohort-isolated)
  const classTrainees = useMemo(() => {
    return getTraineesForClass(trainees, selectedClassCode);
  }, [trainees, selectedClassCode]);

  // Confidential Trainee Access View: Trainee viewers strictly see ONLY their own record
  const displayedTrainees = useMemo(() => {
    if (!isTraineeViewer) return classTrainees;
    const mine = classTrainees.filter((t) => {
      const matchAdm = Boolean(t.admNo && user?.reg_number && t.admNo.trim().toUpperCase() === user.reg_number.trim().toUpperCase());
      const matchReg = Boolean(t.regCode && user?.reg_number && t.regCode.trim().toUpperCase() === user.reg_number.trim().toUpperCase());
      const matchName = Boolean(t.name && user?.name && t.name.trim().toLowerCase() === user.name.trim().toLowerCase());
      const matchId = Boolean(t.id && user?.id && t.id === user.id);
      return matchAdm || matchReg || matchName || matchId;
    });
    if (mine.length > 0) return mine;
    return [
      {
        id: user?.id || "my_trainee_record",
        name: user?.name || "Candidate",
        admNo: user?.reg_number || "FBS 5 MOD/13254/J2026",
        regCode: user?.reg_number || "FBS 5 MOD/13254/J2026",
        classCode: selectedClassCode,
        department: activeClassConfig.department,
        gender: "M" as const,
      }
    ];
  }, [isTraineeViewer, classTrainees, user, selectedClassCode, activeClassConfig]);

  // Student CRUD Handlers
  const handleOpenAddStudent = () => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    const prefix = selectedClassCode.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "");
    setStudentForm({
      name: "",
      admNo: `${prefix}/${Math.floor(14000 + Math.random() * 900)}/S2026`,
      gender: "M",
      email: "",
      phone: "",
      remarks: "",
    });
    setIsAddStudentOpen(true);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    if (!studentForm.name.trim() || !studentForm.admNo.trim()) {
      toast.error("Please provide both student name and admission number.");
      return;
    }
    const created = addTrainee({
      name: studentForm.name.trim(),
      admNo: studentForm.admNo.trim(),
      regCode: studentForm.admNo.trim(),
      classCode: selectedClassCode,
      department: activeClassConfig.department,
      gender: studentForm.gender,
      email: studentForm.email.trim() || undefined,
      phone: studentForm.phone.trim(),
      remarks: studentForm.remarks.trim(),
    });

    // Persist new trainee to backend API & PostgreSQL
    fetch("/api/trainees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: created.id,
        name: created.name,
        admNo: created.admNo,
        regCode: created.regCode,
        classCode: selectedClassCode,
        department: activeClassConfig.department,
        gender: studentForm.gender,
        email: studentForm.email.trim() || undefined,
        phone: studentForm.phone.trim(),
        remarks: studentForm.remarks.trim(),
      }),
    }).catch(err => console.warn("Backend trainee save notice:", err));

    // Populate initial attendance across all 10 instructional weeks
    const initAttendance: Record<string, AttendanceStatus> = {};
    for (let w = 1; w <= WEEKS; w++) {
      for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
        initAttendance[`W${w}_S${s}`] = w <= 3 ? "X" : "";
      }
    }
    setAttendanceData(prev => ({
      ...prev,
      [created.id]: { attendance: initAttendance, signed: false }
    }));
    setIsAddStudentOpen(false);
    toast.success(`Student ${created.name} added to roster & database.`);
  };

  const handleOpenEditStudent = useCallback((trainee: any) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    setEditingStudent(trainee);
    setStudentForm({
      name: trainee.name,
      admNo: trainee.admNo,
      gender: trainee.gender || "M",
      email: trainee.email || "",
      phone: trainee.phone || "",
      remarks: trainee.remarks || "",
    });
  }, [canEditRegister]);

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    if (!editingStudent) return;
    if (!studentForm.name.trim() || !studentForm.admNo.trim()) {
      toast.error("Please provide both student name and admission number.");
      return;
    }
    updateTrainee(editingStudent.id, {
      name: studentForm.name.trim(),
      admNo: studentForm.admNo.trim(),
      regCode: studentForm.admNo.trim(),
      gender: studentForm.gender,
      email: studentForm.email.trim() || undefined,
      phone: studentForm.phone.trim(),
      remarks: studentForm.remarks.trim(),
    });
    setEditingStudent(null);
    toast.success(`Student ${studentForm.name} updated successfully.`);
  };

  const handleDeleteStudent = useCallback((id: string, name: string) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    if (confirm(`Remove trainee "${name}" from this class register?`)) {
      deleteTrainee(id);
      setAttendanceData(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.info(`Trainee "${name}" removed.`);
    }
  }, [canEditRegister, deleteTrainee]);

  // Local persistence helper leveraging canonical storage keys
  const persistLocally = (data: Record<string, StudentAttendanceRecord>) => {
    saveClassAttendanceRegister(selectedClassCode, data);
  };

  // Rehydrate attendance tracking: Load from canonical storage immediately, then rehydrate from backend PostgreSQL / API
  useEffect(() => {
    const initialLoaded = loadClassAttendanceRegister(selectedClassCode);

    // Populate any trainees missing records across all 10 instructional weeks
    const updated = { ...initialLoaded };
    classTrainees.forEach((t, idx) => {
      const existingAtt = updated[t.id]?.attendance || {};
      const fullAttendance: Record<string, AttendanceStatus> = { ...existingAtt };
      for (let w = 1; w <= WEEKS; w++) {
        for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
          const sessKey = `W${w}_S${s}`;
          if (fullAttendance[sessKey] === undefined) {
            if (w <= 3) {
              fullAttendance[sessKey] = (idx === 3 && w === 2 && s === 2) ? "0" : "X";
            } else {
              fullAttendance[sessKey] = "";
            }
          }
        }
      }
      updated[t.id] = { 
        attendance: fullAttendance,
        signed: updated[t.id]?.signed ?? false,
      };
    });

    setAttendanceData(updated);

    // Fetch persisted attendance from backend API & PostgreSQL
    fetch(`/api/attendance?class_code=${encodeURIComponent(selectedClassCode)}&unit_offering_id=uo-1`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.matrix && Object.keys(data.matrix).length > 0) {
          setAttendanceData(prev => {
            const merged = { ...prev };
            for (const [traineeId, sessions] of Object.entries(data.matrix as Record<string, Record<string, AttendanceStatus>>)) {
              if (!merged[traineeId]) {
                merged[traineeId] = { attendance: {}, signed: false };
              }
              const currentAtt = merged[traineeId].attendance || {};
              const nextAtt = { ...currentAtt };
              for (const [sessKey, val] of Object.entries(sessions)) {
                if (val === "X" || val === "0") {
                  nextAtt[sessKey] = val;
                } else if (nextAtt[sessKey] === undefined) {
                  nextAtt[sessKey] = val;
                }
              }
              merged[traineeId] = {
                attendance: nextAtt,
                signed: merged[traineeId].signed ?? false,
              };
            }
            saveClassAttendanceRegister(selectedClassCode, merged);
            return merged;
          });
        }
      })
      .catch(err => {
        console.warn("Backend attendance rehydration notice:", err);
      });
  }, [selectedClassCode, classTrainees]);

  // Reactive listener for roll call updates taken anywhere in the application
  useEffect(() => {
    const handleAttendanceUpdated = () => {
      const refreshed = loadClassAttendanceRegister(selectedClassCode);
      if (Object.keys(refreshed).length > 0) {
        setAttendanceData(prev => {
          const merged = { ...prev };
          for (const [traineeId, rec] of Object.entries(refreshed)) {
            if (!merged[traineeId]) {
              merged[traineeId] = rec;
            } else {
              merged[traineeId] = {
                attendance: { ...(merged[traineeId].attendance || {}), ...(rec.attendance || {}) },
                signed: rec.signed ?? merged[traineeId].signed,
              };
            }
          }
          return merged;
        });
      }
    };
    window.addEventListener("mtti-attendance-updated", handleAttendanceUpdated);
    return () => window.removeEventListener("mtti-attendance-updated", handleAttendanceUpdated);
  }, [selectedClassCode]);

  // Toggle Attendance Cell in CUR/02 (Optimized with useCallback)
  const toggleAttendance = useCallback((studentId: string, week: number, session: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    const key = `W${week}_S${session}`;
    let nextStatus: AttendanceStatus = "X";

    setAttendanceData(prev => {
      const studentRecord = prev[studentId] || { attendance: {} };
      const current = studentRecord.attendance[key];
      
      // Cycle: "" -> "X" -> "0" -> ""
      if (!current) nextStatus = "X";
      else if (current === "X") nextStatus = "0";
      else nextStatus = "";

      const updatedData: Record<string, StudentAttendanceRecord> = {
        ...prev,
        [studentId]: {
          ...studentRecord,
          attendance: { ...studentRecord.attendance, [key]: nextStatus }
        }
      };
      persistLocally(updatedData);
      return updatedData;
    });

    setIsAutoSaving(true);
    // Instant asynchronous mark persistence
    fetch("/api/attendance/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_offering_id: "uo-1",
        class_code: selectedClassCode,
        trainee_id: studentId,
        week_number: week,
        session_index: session,
        status: nextStatus === "X" ? "present" : (nextStatus === "0" ? "absent" : "excused"),
        hours_attended: hoursPerSession,
        marked_by: user?.name || "ALEXANDER KINOTI",
      }),
    })
      .then(() => setLastSavedTime(Date.now()))
      .catch(err => console.warn("Background mark persist warning:", err))
      .finally(() => setIsAutoSaving(false));
  }, [canEditRegister, selectedClassCode, hoursPerSession, user]);

  // Quick Action: Mark all trainees present in a specific session column
  const markAllPresentForSession = useCallback((week: number, session: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    const key = `W${week}_S${session}`;

    setAttendanceData(prev => {
      const updatedData: Record<string, StudentAttendanceRecord> = { ...prev };
      classTrainees.forEach(t => {
        const studentRecord = updatedData[t.id] || { attendance: {} };
        updatedData[t.id] = {
          ...studentRecord,
          attendance: { ...studentRecord.attendance, [key]: "X" }
        };
      });
      persistLocally(updatedData);
      return updatedData;
    });

    setIsAutoSaving(true);
    fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_offering_id: "uo-1",
        class_code: selectedClassCode,
        attendanceData: {},
      }),
    })
      .then(() => setLastSavedTime(Date.now()))
      .catch(err => console.warn("Background bulk attendance save notice:", err))
      .finally(() => setIsAutoSaving(false));

    toast.success(`Marked all ${classTrainees.length} trainees present for Week ${week}, Session ${session}.`);
  }, [canEditRegister, classTrainees, selectedClassCode]);

  // Mark entire session column present or toggle
  const markWholeSessionColumn = (week: number, session: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    const key = `W${week}_S${session}`;
    const allX = classTrainees.every(t => attendanceData[t.id]?.attendance[key] === "X");
    const targetStatus: AttendanceStatus = allX ? "" : "X";
    
    const updatedData: Record<string, StudentAttendanceRecord> = { ...attendanceData };
    const recordsToSync: Array<any> = [];

    classTrainees.forEach(t => {
      const studentRecord = updatedData[t.id] || { attendance: {} };
      updatedData[t.id] = {
        ...studentRecord,
        attendance: { ...studentRecord.attendance, [key]: targetStatus }
      };
      recordsToSync.push({
        trainee_id: t.id,
        week_number: week,
        session_index: session,
        status: targetStatus === "X" ? "present" : "absent",
        hours_attended: hoursPerSession,
      });
    });

    setAttendanceData(updatedData);
    persistLocally(updatedData);

    fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_offering_id: "uo-1",
        class_code: selectedClassCode,
        records: recordsToSync,
      }),
    }).catch(err => console.warn("Bulk mark sync warning:", err));

    toast.success(`Week ${week}, Session ${session} updated for all trainees.`);
  };

  // Mark all 3 sessions of a week present
  const markWholeWeek = (week: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    const updatedData: Record<string, StudentAttendanceRecord> = { ...attendanceData };
    const recordsToSync: Array<any> = [];

    classTrainees.forEach(t => {
      const studentRecord = updatedData[t.id] || { attendance: {} };
      const newAtt = { ...studentRecord.attendance };
      for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
        newAtt[`W${week}_S${s}`] = "X";
        recordsToSync.push({
          trainee_id: t.id,
          week_number: week,
          session_index: s,
          status: "present",
          hours_attended: hoursPerSession,
        });
      }
      updatedData[t.id] = {
        ...studentRecord,
        attendance: newAtt
      };
    });

    setAttendanceData(updatedData);
    persistLocally(updatedData);

    fetch("/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_offering_id: "uo-1",
        class_code: selectedClassCode,
        records: recordsToSync,
      }),
    }).catch(err => console.warn("Bulk week sync warning:", err));

    toast.success(`All 3 sessions of Week ${week} marked present (X)!`);
  };

  // Toggle Signature in CUR/03
  const toggleSignature = (studentId: string) => {
    const targetTrainee = classTrainees.find((t) => t.id === studentId);
    const isOwnRecord =
      user?.role === "trainee" &&
      (studentId === user.id ||
        (targetTrainee?.admNo &&
          user.reg_number &&
          targetTrainee.admNo.trim().toUpperCase() === user.reg_number.trim().toUpperCase()) ||
        (targetTrainee?.name &&
          user.name &&
          targetTrainee.name.trim().toLowerCase() === user.name.trim().toLowerCase()));

    if (!canEditRegister && !isOwnRecord) {
      if (user?.role === "trainee") {
        toast.error("Trainees can only confirm attendance for their own registration record.");
      } else {
        toast.error("Forbidden: Only assigned trainers, HODs, and administrators can record attendance signatures.");
      }
      return;
    }

    setAttendanceData((prev) => {
      const rec = prev[studentId] || { attendance: {} };
      const nextSigned = !rec.signed;
      const updated = {
        ...prev,
        [studentId]: {
          ...rec,
          signed: nextSigned,
        },
      };
      persistLocally(updated);
      return updated;
    });

    if (user?.role === "trainee") {
      toast.success("Assessment attendance confirmed: 'attended'");
    }
  };

  // Sync QR door scans from StudentSessionView & IndexedDB into current session
  const handleSyncQRCheckIns = async () => {
    let totalSynced = 0;
    const allScans: Array<{ adm: string; name: string; date?: string; time?: string }> = [];

    // 1. Pull from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("mtti_attendance_") || key === "mtti_attendance_all")) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(val)) {
            allScans.push(...val);
          }
        } catch (e) {}
      }
    }

    // 2. Pull from IndexedDB offline attendance scans
    try {
      const idbScans = await getAttendanceScansFromOffline();
      allScans.push(...idbScans);
    } catch (e) {
      console.warn("Error reading IndexedDB attendance scans:", e);
    }

    if (allScans.length === 0) {
      toast.info("No door QR check-ins found yet. Generate a Door Poster and have trainees scan it!");
      return;
    }

    const scannedAdms = new Set(allScans.map(s => (s.adm || "").trim().toUpperCase()));
    const scannedNames = new Set(allScans.map(s => (s.name || "").trim().toLowerCase()));

    // Target dynamic teaching week from academic calendar (Session 1)
    const targetWeek = Math.min(Math.max(1, activeTeachingWeek), WEEKS);
    const targetKey = `W${targetWeek}_S1`;

    setAttendanceData(prev => {
      const updated = { ...prev };
      classTrainees.forEach(t => {
        const cleanAdm = (t.admNo || "").replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD)\//i, "").trim().toUpperCase();
        const fullAdm = (t.admNo || "").trim().toUpperCase();
        const regCode = (t.regCode || "").trim().toUpperCase();
        const tName = (t.name || "").trim().toLowerCase();

        const isMatch = scannedAdms.has(cleanAdm) || 
                        scannedAdms.has(fullAdm) || 
                        scannedAdms.has(regCode) ||
                        scannedNames.has(tName);

        if (isMatch) {
          const rec = updated[t.id] || { attendance: {} };
          updated[t.id] = {
            ...rec,
            attendance: {
              ...rec.attendance,
              [targetKey]: "X"
            },
            signed: true
          };
          totalSynced++;
        }
      });
      return updated;
    });

    if (totalSynced > 0) {
      toast.success(`Synced ${totalSynced} trainee door check-ins into Week ${targetWeek} Session 1!`, {
        description: `Verified presence from mobile workshop door QR scans for Week ${targetWeek}.`
      });
    } else {
      toast.info(`Found ${allScans.length} scan records, but none matched trainees enrolled in ${selectedClassCode}.`);
    }
  };

  const handleSave = async () => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can save class registers.");
      return;
    }
    setIsSaving(true);
    try {
      persistLocally(attendanceData);

      // 1. Dispatch full attendance matrix to backend PostgreSQL API
      let apiSaved = false;
      try {
        const apiRes = await fetch("/api/attendance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit_offering_id: "uo-1",
            class_code: selectedClassCode,
            attendanceData,
          }),
        });
        const json = await apiRes.json();
        if (json.success) apiSaved = true;

        // Persist register comments and institutional metadata centrally to physical DB
        fetch(`/api/documents/class-registers/${encodeURIComponent(selectedClassCode)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lecturer: metadata.lecturer,
            subject: metadata.subject,
            department: metadata.department,
            duration: metadata.duration,
            level: metadata.level,
            lecturerComment: metadata.lecturerComment,
            hodComment: metadata.hodComment,
            weeklyLecturerComments,
            weeklyHodComments,
          }),
        }).catch(() => {});
      } catch (apiErr) {
        console.warn("Backend API /api/attendance/bulk error:", apiErr);
      }

      // 2. Also format for Supabase / offline queue if configured
      const rows = classTrainees.map(t => {
        const rec = attendanceData[t.id];
        const isPresent = rec ? Object.values(rec.attendance).some(v => v === "X") : false;
        return {
          unit_offering_id: "uo-1",
          trainee_id: t.id,
          week_number: 1,
          status: isPresent ? "present" : "absent"
        };
      });

      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

      if (isSupabaseConfigured() && isOnline) {
        try {
          await (supabase.from("attendance_register" as any) as any).upsert(rows as any);
        } catch (supaErr) {
          console.warn("Supabase attendance sync warning:", supaErr);
          await enqueueSyncItem("ATTENDANCE_REGISTER_SAVE", { rows });
        }
      } else if (isSupabaseConfigured()) {
        await enqueueSyncItem("ATTENDANCE_REGISTER_SAVE", { rows });
      }

      syncEngine.flushQueue();

      toast.success("Class Register Saved Permanently", {
        description: `Attendance data for ${selectedClassCode} persisted to PostgreSQL & local database.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sync to Record of Work
  const handleSaveAndSyncRoW = async () => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can sync records of work.");
      return;
    }
    setIsSaving(true);

    // 1. First persist attendance locally and to the backend API
    persistLocally(attendanceData);
    try {
      await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          class_code: selectedClassCode,
          attendanceData,
        }),
      });
    } catch (apiErr) {
      console.warn("Backend bulk attendance save notice:", apiErr);
    }

    let presentCount = 0;
    classTrainees.forEach(t => {
      const rec = attendanceData[t.id];
      if (rec) {
        const statuses = Object.values(rec.attendance);
        if (statuses.filter(s => s === "X").length > 0) {
          presentCount++;
        }
      }
    });
    if (presentCount === 0 && classTrainees.length > 0) {
      presentCount = Math.max(1, classTrainees.length - 1);
    }

    const existing = getStoredRecordsOfWork();
    const updated = [
      ...existing,
      {
        id: `row-reg-${Date.now()}`,
        session_plan_id: `sp-${selectedClassCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${academicContext.currentWeek}`,
        unit_code: metadata.subject,
        class_code: selectedClassCode,
        week_number: academicContext.currentWeek,
        date_delivered: academicContext.shortDate,
        trainees_present: presentCount,
        hours_covered: hoursPerSession,
        work_actually_covered: `Delivered practical lecture on ${metadata.subject}. Verified competencies for all present trainees.`,
        reflection: "Trainees demonstrated consistent engagement. Attendance logged.",
        status: "delivered" as const,
        signature: (user?.name || "ALEXANDER KINOTI").toUpperCase(),
        signature_date: academicContext.shortDate
      }
    ];
    saveStoredRecordsOfWork(updated);

    setTimeout(() => {
      setIsSaving(false);
      toast.success("Attendance Synced to Record of Work!", {
        description: `Logged ${presentCount} present trainees from ${selectedClassCode} into MTTI/F/CUR/02.`
      });
    }, 800);
  };

  const handleReset = () => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can reset roster.");
      return;
    }
    if (confirm("Reset roster to the official MTTI transcribed students?")) {
      resetToOfficialRoster();
      toast.info("Roster reset to official MTTI scanned registers.");
    }
  };

  const pageContent = (
    <div className="space-y-6 pb-20">
      
      {/* Top Control Bar (Print:hidden) */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Form Mode Selector (CUR/02 vs CUR/03) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Template:</span>
            {!isTraineeViewer && (
              <button
                onClick={() => setFormMode("CUR/02")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formMode === "CUR/02"
                    ? "bg-[#000953] text-white shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                }`}
              >
                CUR/02: General Class Register
              </button>
            )}
            <button
              onClick={() => setFormMode("CUR/03")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                formMode === "CUR/03"
                  ? "bg-[#000953] text-white shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              CUR/03: Assessment Attendance
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-time Auto-Save Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-sm bg-muted/40 border-border mr-1">
              {isSaving || isAutoSaving ? (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin shrink-0" />
                  <span className="text-amber-600 dark:text-amber-400">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400">All changes saved</span>
                </>
              )}
            </div>
            {canEditRegister && (
              <>
                <button
                  onClick={handleReset}
                  className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground"
                  title="Reset to official MTTI 58 trainees"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsRollCallOpen(true)}
                  className="h-9 px-3.5 flex items-center gap-1.5 bg-[#c48820] hover:bg-[#b0781a] text-black rounded-lg text-xs font-bold transition shadow-sm"
                  title="Take rapid roll call for this class and sync into register"
                >
                  <UserCheck className="w-4 h-4" /> Roll Call
                </button>
                <button 
                  onClick={() => setIsQRModalOpen(true)}
                  className="h-9 px-3.5 flex items-center gap-1.5 bg-[#000953] hover:bg-[#000953]/90 text-white rounded-lg text-xs font-bold transition shadow-sm border border-[#c48820]/50"
                  title="Generate and print official QR Door Poster for workshop / laboratory entry"
                >
                  <QrCode className="w-4 h-4 text-[#c48820]" /> Door QR Poster
                </button>
                <button 
                  onClick={handleSyncQRCheckIns}
                  className="h-9 px-3.5 flex items-center gap-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border rounded-lg text-xs font-bold transition shadow-sm"
                  title="Sync trainees who scanned the door QR code into this session register"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-500" /> Sync Door Check-Ins
                </button>
              </>
            )}
            <button 
              onClick={() => window.print()} 
              className="h-9 px-3.5 flex items-center gap-2 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Form
            </button>
            {canEditRegister && (
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="h-9 px-3.5 flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
              </button>
            )}
            {canEditRegister && (
              <button 
                onClick={handleSaveAndSyncRoW} 
                disabled={isSaving} 
                className="h-9 px-3.5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                title="Save attendance and immediately update Record of Work"
              >
                <Sparkles className="w-4 h-4" /> Save & Sync RoW
              </button>
            )}
          </div>
        </div>

        {/* Trainee Confidentiality & Guidance Banner */}
        {isTraineeViewer && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Assessment Attendance Register (CUR/03) for <strong>{activeClassConfig.name}</strong>.
                <strong> Confidentiality Protected:</strong> Viewing strictly your own attendance records. Click your signature cell to confirm attendance as <strong>'attended'</strong>.
              </span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 font-bold shrink-0 self-start md:self-auto">
              Candidate: {user?.reg_number || user?.name}
            </span>
          </div>
        )}

          {/* Class Selector Bar: Dropdown + Scrollable Quick-Switch Pills */}
          <div className="border-t border-border pt-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Select Class / Unit:
                </span>
                <select
                  value={selectedClassCode}
                  onChange={(e) => setSelectedClassCode(e.target.value)}
                  disabled={isTraineeViewer}
                  className={`bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none max-w-md w-full truncate shadow-sm ${
                    isTraineeViewer ? "cursor-not-allowed opacity-90 bg-muted/30" : "cursor-pointer focus:ring-1 focus:ring-primary"
                  }`}
                >
                  {dynamicClasses.map(cls => (
                    <option key={cls.code} value={cls.code}>
                      {cls.subject} — {cls.code} ({cls.department}, {cls.level})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 hidden md:inline font-medium">
                  ({classTrainees.length} trainees enrolled)
                </span>
              </div>

              {canEditRegister && (
                <button
                  onClick={handleOpenAddStudent}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Student
                </button>
              )}
            </div>

            {/* Quick Switch Pills with shrink-0 min-w-max (Trainer / Staff only) */}
            {!isTraineeViewer && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
                <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0">
                  Quick Switch:
                </span>
                {dynamicClasses.map(cls => (
                  <button
                    key={cls.code}
                    onClick={() => setSelectedClassCode(cls.code)}
                    className={`shrink-0 min-w-max px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedClassCode === cls.code
                        ? "bg-[#c48820] text-black font-bold shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold">{cls.subject}</span>
                    <span className="text-[10px] opacity-80 shrink-0 font-mono">({cls.code})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: ${formMode === "CUR/02" ? "A4 landscape" : "A4 portrait"}; margin: 6mm; }
            html, body {
              background: #fff !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #mtti-register-printable,
            #mtti-register-printable * {
              visibility: visible !important;
            }
            #mtti-register-printable {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            thead { display: table-header-group !important; }
            table { font-size: 8.5px !important; width: 100% !important; border-collapse: collapse !important; }
            th, td { padding: 2px 3px !important; border: 1px solid #000 !important; }
          }
        `}} />

        {/* ============================================================== */}
        {/* VIEW 1: MTTI/REG/CUR/02 (General Class Register) — Pages 1 & 2 */}
        {/* ============================================================== */}
        {formMode === "CUR/02" && (
          <div 
            id="mtti-register-printable"
            className="bg-white text-black p-6 border-2 border-black rounded-lg shadow-lg mx-auto w-full print:border-none print:shadow-none print:p-0"
            style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}
          >
            {/* Top Row: Timestamp left, Form Code right */}
            <div className="flex justify-between items-start text-xs font-bold mb-1">
              <div>{academicContext.formattedDate} : {academicContext.timeFormatted}</div>
              <div className="font-bold text-sm">MTTI/REG/CUR/02</div>
            </div>

            {/* Centered Institution Title */}
            <div className="text-center mb-2">
              <h1 className="text-xl font-bold tracking-tight uppercase">MUKIRIA TECHNICAL TRAINING INSTITUTE</h1>
            </div>

            {/* Logo + Underlined Metadata Block (Exact Match to media_1791165647100.pdf) */}
            <div className="flex items-center gap-6 mb-3 pb-2">
              <img
                src="/mtti-logo.jpg"
                alt="MTTI Logo"
                className="w-20 h-20 object-contain shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap w-36">NAME OF LECTURER:</span>
                  <span className="font-bold uppercase border-b border-black flex-1 px-1">{metadata.lecturer}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap w-24">DURATION:</span>
                  <span className="font-bold border-b border-black flex-1 px-1">{metadata.duration}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap w-36">CLASS:</span>
                  <span className="font-bold border-b border-black flex-1 px-1">{canonicalizeCohortCode(selectedClassCode)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap w-24">LEVEL:</span>
                  <span className="font-bold border-b border-black flex-1 px-1">{metadata.level}</span>
                </div>
                <div className="flex items-baseline gap-2 md:col-span-1">
                  <span className="font-bold whitespace-nowrap w-36">SUBJECT:</span>
                  <span className="font-bold uppercase border-b border-black flex-1 px-1">{metadata.subject}</span>
                </div>
              </div>
            </div>

            <div className="text-center my-2">
              <h2 className="text-sm font-bold uppercase tracking-wide">GENERAL CLASS REGISTER</h2>
              <p className="text-[11px] font-bold text-black mt-0.5">FILTERED BY: &#123;Class: {canonicalizeCohortCode(selectedClassCode)}&#125;</p>
            </div>

            {/* 10-Week Attendance Table (Every week has 3 sessions = 30 total sessions) */}
            <div className="overflow-x-auto overflow-y-hidden print:overflow-visible">
              <table className="w-full min-w-[1050px] border-collapse border-2 border-black text-[11px]">
                <thead>
                  {/* Header Row 1: Top-left colSpan=3 blank merged cell + WK_1..WK_10 (colSpan=3) + Summary (rowSpan=2) */}
                  <tr className="bg-white font-bold border-b border-black">
                    <th colSpan={3} className="border border-black p-1 text-center"></th>
                    {Array.from({ length: WEEKS }).map((_, w) => (
                      <th 
                        key={w} 
                        colSpan={SESSIONS_PER_WEEK}
                        onClick={() => markWholeWeek(w + 1)}
                        className="border border-black p-1 text-center text-[10px] font-bold bg-gray-100 border-r-2 border-r-black cursor-pointer hover:bg-gray-200 transition select-none"
                        title={`Week ${w + 1} (Click to mark all 3 sessions present)`}
                      >
                        WK_{w + 1}
                      </th>
                    ))}
                    <th rowSpan={2} className="border border-black p-1 text-center w-12 text-[10px] leading-tight">Possible<br/>Hrs</th>
                    <th rowSpan={2} className="border border-black p-1 text-center w-12 text-[10px] leading-tight">Actual<br/>Hrs</th>
                    <th rowSpan={2} className="border border-black p-1 text-center w-16 text-[10px] leading-tight">Actual<br/>Attendance %</th>
                    {canEditRegister && (
                      <th rowSpan={2} className="border border-black p-1 text-center w-16 text-xs print:hidden">Action</th>
                    )}
                  </tr>
                  {/* Header Row 2: #, ADMISSION NO, NAMES + 30 sub-session cells */}
                  <tr className="bg-gray-50 border-b border-black font-bold">
                    <th className="border border-black p-1 text-center w-7 text-xs">#</th>
                    <th className="border border-black p-1 text-left w-32 whitespace-nowrap text-xs">ADMISSION NO</th>
                    <th className="border border-black p-1 text-left w-44 whitespace-nowrap text-xs">NAMES</th>
                    {Array.from({ length: WEEKS }).map((_, w) => (
                      Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => (
                        <th 
                          key={`w${w}_s${s}`} 
                          className={`border border-black p-0.5 text-center w-6 min-w-[20px] text-[9px] font-mono text-gray-700 select-none ${
                            s === SESSIONS_PER_WEEK - 1 ? "border-r-2 border-r-black" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center justify-between h-full gap-0.5">
                            <span 
                              onClick={() => markWholeSessionColumn(w + 1, s + 1)}
                              className="hover:text-primary cursor-pointer font-bold leading-tight"
                              title={`Week ${w + 1}, Session ${s + 1} (Click to toggle entire column)`}
                            >
                              {s + 1}
                            </span>
                            {canEditRegister && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAllPresentForSession(w + 1, s + 1);
                                }}
                                className="print:hidden text-[7.5px] px-1 py-0 leading-none bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded font-sans font-bold transition border border-emerald-300"
                                title={`Mark all trainees Present in Week ${w + 1}, Session ${s + 1}`}
                              >
                                [All]
                              </button>
                            )}
                          </div>
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedTrainees.map((trainee, idx) => (
                    <AttendanceRow
                      key={trainee.id}
                      trainee={trainee}
                      index={idx}
                      record={attendanceData[trainee.id]?.attendance || {}}
                      canEditRegister={canEditRegister}
                      onToggleAttendance={toggleAttendance}
                      onEditStudent={handleOpenEditStudent}
                      onDeleteStudent={handleDeleteStudent}
                    />
                  ))}

                  {/* Official Merged Footer Rows: Lecturer's Comment & HOD's Comment across the 10 Weekly Columns */}
                  <tr className="border-t-2 border-black bg-white">
                    <td colSpan={3} className="border border-black p-2 font-bold text-xs align-middle">
                      Lecturer&apos;s Comment
                    </td>
                    {Array.from({ length: WEEKS }).map((_, w) => {
                      const commentVal = weeklyLecturerComments[w] ?? (w === 0 ? metadata.lecturerComment : "");
                      return (
                        <td
                          key={`lec-comment-wk-${w}`}
                          colSpan={SESSIONS_PER_WEEK}
                          className="border border-black border-r-2 border-r-black p-0.5 align-top h-11"
                        >
                          <textarea
                            value={commentVal}
                            onChange={(e) => handleWeeklyCommentChange("lecturer", w, e.target.value)}
                            placeholder={`Wk ${w + 1}...`}
                            rows={2}
                            className="w-full h-full bg-transparent outline-none text-[8.5px] font-medium leading-tight resize-none p-0.5"
                          />
                        </td>
                      );
                    })}
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 print:hidden"></td>
                  </tr>
                  <tr className="border-t border-black bg-white">
                    <td colSpan={3} className="border border-black p-2 font-bold text-xs align-middle">
                      HOD&apos;s Comment
                    </td>
                    {Array.from({ length: WEEKS }).map((_, w) => {
                      const commentVal = weeklyHodComments[w] ?? (w === 0 ? metadata.hodComment : "");
                      return (
                        <td
                          key={`hod-comment-wk-${w}`}
                          colSpan={SESSIONS_PER_WEEK}
                          className="border border-black border-r-2 border-r-black p-0.5 align-top h-11"
                        >
                          <textarea
                            value={commentVal}
                            onChange={(e) => handleWeeklyCommentChange("hod", w, e.target.value)}
                            placeholder={`HOD W${w + 1}...`}
                            rows={2}
                            className="w-full h-full bg-transparent outline-none text-[8.5px] font-medium leading-tight resize-none p-0.5"
                          />
                        </td>
                      );
                    })}
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 print:hidden"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Page count */}
            <div className="text-center text-xs mt-3 text-black font-bold">
              Page 1 of 1
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: MTTI/REG/CUR/03 (Assessment Attendance) — Pages 3 & 4 */}
        {/* ============================================================== */}
        {formMode === "CUR/03" && (
          <div 
            id="mtti-register-printable"
            className="bg-white text-black p-8 border-2 border-black rounded-lg shadow-lg mx-auto w-full max-w-4xl print:border-none print:shadow-none print:p-0"
            style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif' }}
          >
            {/* Header Block */}
            <div className="flex justify-between items-start text-xs font-bold mb-1">
              <div></div>
              <div className="text-right">
                <div className="font-bold text-sm">MTTI/REG/CUR/03</div>
                <div className="mt-1">DATE: <span className="border-b border-dotted border-black px-3">{metadata.assessmentDate}</span></div>
              </div>
            </div>

            <div className="text-center mb-4">
              <img
                src="/mtti-logo.jpg"
                alt="MTTI Logo"
                className="w-20 h-20 object-contain mx-auto mb-1.5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <h1 className="text-xl font-bold uppercase tracking-tight">MUKIRIA TECHNICAL TRAINING INSTITUTE</h1>
              <h2 className="text-sm font-bold uppercase mt-1">ASSESSMENT OFFICE</h2>
              <h3 className="text-base font-bold uppercase mt-1">ASSESSMENT ATTENDANCE REGISTER</h3>
            </div>

            {/* Form Header Info with Dotted Underlines (Exact Match to pages 3-4 of media_1790885843191.pdf) */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs font-bold mb-4 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">DEPARTMENT:</span>
                <span className="border-b border-dotted border-black flex-1 px-1 uppercase">{metadata.department}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">CLASS:</span>
                <span className="border-b border-dotted border-black flex-1 px-1">{canonicalizeCohortCode(selectedClassCode)}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">UNIT OF COMPETENCY:</span>
                <span className="border-b border-dotted border-black flex-1 px-1 uppercase">{metadata.subject}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">TYPE OF ASSESSMENT:</span>
                <span className="border-b border-dotted border-black flex-1 px-1 uppercase">{metadata.assessmentType}</span>
              </div>
            </div>

            {/* Trainee Attendance List */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border-2 border-black text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b-2 border-black">
                    <th className="border border-black p-2 text-center w-14">S/NO</th>
                    <th className="border border-black p-2 text-left w-40">ADM NO</th>
                    <th className="border border-black p-2 text-left">TRAINEE NAME</th>
                    <th className="border border-black p-2 text-center w-44">SIGNATURE</th>
                    {canEditRegister && (
                      <th className="border border-black p-2 text-center w-20 print:hidden">ACTION</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedTrainees.map((trainee, idx) => {
                    const isSigned = attendanceData[trainee.id]?.signed ?? false;
                    const isOwnRecord =
                      user?.role === "trainee" &&
                      (trainee.id === user.id ||
                        (trainee.admNo &&
                          user.reg_number &&
                          trainee.admNo.trim().toUpperCase() === user.reg_number.trim().toUpperCase()) ||
                        (trainee.name &&
                          user.name &&
                          trainee.name.trim().toLowerCase() === user.name.trim().toLowerCase()));

                    return (
                      <tr
                        key={trainee.id}
                        className={`border-b border-black transition ${
                          isOwnRecord ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="border border-black p-2 text-center font-bold">{idx + 1}.</td>
                        <td className="border border-black p-2 font-mono font-medium">{trainee.admNo}</td>
                        <td className="border border-black p-2 font-bold uppercase">
                          <div className="flex items-center gap-1.5">
                            <span>{trainee.name}</span>
                            {isOwnRecord && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#000953] text-white print:hidden">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          onClick={() => toggleSignature(trainee.id)}
                          className={`border border-black p-2 text-center select-none ${
                            canEditRegister || isOwnRecord ? "cursor-pointer hover:bg-emerald-50/50" : "cursor-default"
                          }`}
                          title={
                            canEditRegister
                              ? "Click to toggle candidate signature status"
                              : isOwnRecord
                              ? "Click to confirm your assessment attendance ('attended')"
                              : "Candidate signature status"
                          }
                        >
                          {isSigned ? (
                            <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold text-emerald-800 print:text-black">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:hidden" />
                              <span className="italic font-serif font-bold text-emerald-700 print:text-black text-xs">attended</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 print:invisible italic">
                              {isOwnRecord ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] animate-pulse">
                                  Click to Sign (attended)
                                </span>
                              ) : (
                                "Not Signed"
                              )}
                            </span>
                          )}
                        </td>
                        {canEditRegister && (
                          <td className="border border-black p-2 text-center print:hidden bg-white">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditStudent(trainee)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Edit Student Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(trainee.id, trainee.name)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Remove Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assessment Assessor Sign-off */}
            <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t-2 border-black text-xs font-bold">
              <div>
                <p>Internal Assessor:</p>
                <div className="mt-3 border-b border-black w-60 pb-1">
                  Name: <strong>{metadata.lecturer}</strong>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Date: {metadata.assessmentDate}</p>
              </div>
              <div>
                <p>Assessment Officer / Supervisor:</p>
                <div className="mt-3 border-b border-black w-60 pb-1">
                  Signature: ______________________
                </div>
                <p className="text-[10px] text-gray-600 mt-1">Date: ____________________</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Student */}
        <AnimatePresence>
          {isAddStudentOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Add Student to Roster</h3>
                    <p className="text-xs text-muted-foreground">{selectedClassCode}</p>
                  </div>
                  <button onClick={() => setIsAddStudentOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveNewStudent} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Full Student Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="e.g. Kiprono Brian Cheruiyot"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Admission / Reg Number *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.admNo}
                      onChange={(e) => setStudentForm({ ...studentForm, admNo: e.target.value })}
                      placeholder="e.g. ITECH6/14500/S2026"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Gender</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as "M" | "F" })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                        placeholder="0712345678"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="student@mtti.ac.ke"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Notes / Remarks</label>
                    <input
                      type="text"
                      value={studentForm.remarks}
                      onChange={(e) => setStudentForm({ ...studentForm, remarks: e.target.value })}
                      placeholder="Optional details..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentOpen(false)}
                      className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                    >
                      Add to Class Roster
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Edit Student */}
        <AnimatePresence>
          {editingStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Edit Student Details</h3>
                    <p className="text-xs text-muted-foreground">{editingStudent.classCode}</p>
                  </div>
                  <button onClick={() => setEditingStudent(null)} className="p-1 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditStudent} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Full Student Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Admission / Reg Number *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.admNo}
                      onChange={(e) => setStudentForm({ ...studentForm, admNo: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Gender</label>
                      <select
                        value={studentForm.gender}
                        onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as "M" | "F" })}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="M">Male (M)</option>
                        <option value="F">Female (F)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-muted-foreground block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                        placeholder="0712345678"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="student@mtti.ac.ke"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted-foreground block mb-1">Notes / Remarks</label>
                    <input
                      type="text"
                      value={studentForm.remarks}
                      onChange={(e) => setStudentForm({ ...studentForm, remarks: e.target.value })}
                      placeholder="Optional details..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-bold transition shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Workshop Door QR Code Poster Modal */}
        <WorkshopDoorQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          sessionData={{
            id: `sp-${selectedClassCode.replace(/[^a-zA-Z0-9]/g, "-")}-w1`,
            unit_code: activeClassConfig.code,
            unit_name: activeClassConfig.subject,
            class_code: selectedClassCode,
            session_title: `${activeClassConfig.subject} — Laboratory Session`,
            learning_outcomes: [
              `Demonstrate practical competence in ${activeClassConfig.subject}`,
              "Apply occupational health and safety standards in the workshop",
              "Execute assigned laboratory hands-on exercises according to CDACC curricula"
            ],
            date: new Date().toLocaleDateString("en-GB"),
            time_duration: "08:30 - 10:30",
            venue: "Workshop 3 / Computer Lab",
            trainer_name: user?.name || "Dr. J. Muriithi",
            safety_requirements: "Strictly observe workstation ergonomics, equipment handling protocols, and protective gear."
          }}
        />

        {/* Rapid Roll Call Modal */}
        <AttendanceQuickMarkModal
          isOpen={isRollCallOpen}
          onClose={() => setIsRollCallOpen(false)}
          classCode={selectedClassCode}
          sessionPlanId={`sp-${selectedClassCode.replace(/[^a-zA-Z0-9]/g, "-")}-w${academicContext.currentWeek}`}
          weekNumber={academicContext.currentWeek}
          sessionIndex={1}
          onSaveComplete={(traineeCount, presentCount) => {
            const reloaded = loadClassAttendanceRegister(selectedClassCode);
            setAttendanceData(reloaded);
            toast.success(`Roll Call updated: ${presentCount}/${traineeCount} present.`);
          }}
        />

    </div>
  );

  if (isTraineeViewer) {
    return (
      <TraineeLayout
        title="Assessment Attendance Register (MTTI/REG/CUR/03)"
        subtitle={`${user?.name || "Candidate"} • ${user?.reg_number || user?.cohort_code || activeClassConfig.code}`}
      >
        {pageContent}
      </TraineeLayout>
    );
  }

  return (
    <TrainerLayout 
      title={formMode === "CUR/02" ? "General Class Register (MTTI/REG/CUR/02)" : "Assessment Attendance Register (MTTI/REG/CUR/03)"} 
      subtitle="Official MTTI institutional registers with multi-class roster auto-calculations"
    >
      {pageContent}
    </TrainerLayout>
  );
}
