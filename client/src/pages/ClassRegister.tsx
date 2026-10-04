import { useState, useEffect, useMemo } from "react";
import TrainerLayout from "@/components/TrainerLayout";
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
import { useTrainees, OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredRecordsOfWork, saveStoredRecordsOfWork } from "@/lib/mockSessionPlans";
import WorkshopDoorQRModal from "@/components/WorkshopDoorQRModal";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAttendanceScansFromOffline, enqueueSyncItem } from "@/lib/offlineStore";
import { syncEngine } from "@/lib/syncEngine";

// --- Types ---
type AttendanceStatus = "X" | "0" | "";

interface StudentAttendanceRecord {
  attendance: Record<string, AttendanceStatus>; // key: "W{week}_S{session}"
  signed?: boolean; // For MTTI/REG/CUR/03 Assessment Attendance
}

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
    code: "ITECH 6 MODULAR/S/2026",
    name: "ITECH 6 MODULAR/S/2026",
    subject: "Perform Computer Essentials",
    department: "Computing & Informatics",
    level: "Level 6",
    duration: "Term 3 2026",
    assessmentType: "Practical Assessment 1",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "ICT4 MOD/S/2026",
    name: "ICT4 MOD/S/2026",
    subject: "Perform Computer Essentials",
    department: "Computing & Informatics",
    level: "Level 4",
    duration: "Term 3 2026",
    assessmentType: "Practical Assessment 1",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "Admin 5/6/J/2026",
    name: "Admin 5/6/J/2026",
    subject: "Apply ICT Skills",
    department: "Business",
    level: "Level 6",
    duration: "Term 3 2026",
    assessmentType: "PRACTICAL ASSESSMENT 1",
    docCode: "MTTI/REG/CUR/03"
  },
  {
    code: "FBS 5 MOD/J/2026",
    name: "FBS 5 MOD/J/2026",
    subject: "Apply Digital Literacy",
    department: "FBS Hospitality",
    level: "Level 5",
    duration: "Term 3 2026",
    assessmentType: "General Class Register",
    docCode: "MTTI/REG/CUR/02"
  },
  {
    code: "FBS",
    name: "FBS Hospitality (Assessment)",
    subject: "Apply Digital Literacy",
    department: "FBS Hospitality",
    level: "Level 5",
    duration: "Term 3 2026",
    assessmentType: "Assessment 1",
    docCode: "MTTI/REG/CUR/03"
  }
];

export default function ClassRegister() {
  const { trainees, addTrainee, updateTrainee, deleteTrainee, resetToOfficialRoster } = useTrainees();
  const { user } = useAuth();
  const canEditRegister = user?.role === "trainer" || user?.role === "admin" || user?.role === "hod";

  // Mode: "CUR/02" (General Class Register) or "CUR/03" (Assessment Attendance Register)
  const [formMode, setFormMode] = useState<"CUR/02" | "CUR/03">("CUR/02");
  const [selectedClassCode, setSelectedClassCode] = useState<string>("ITECH 6 MODULAR/S/2026");

  // State: Mapping traineeId -> attendance record
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceRecord>>({});
  const [hoursPerSession, setHoursPerSession] = useState<number>(2);
  const [isSaving, setIsSaving] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Student Add / Edit Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    admNo: "",
    gender: "M" as "M" | "F",
    phone: "",
    remarks: "",
  });

  // Form Metadata
  const activeClassConfig = useMemo(() => {
    return MTTI_CLASSES.find(c => c.code === selectedClassCode) || MTTI_CLASSES[0];
  }, [selectedClassCode]);

  const [metadata, setMetadata] = useState({
    lecturer: "ALEXANDER KINOTI",
    className: activeClassConfig.name,
    subject: activeClassConfig.subject,
    department: activeClassConfig.department,
    duration: activeClassConfig.duration,
    level: activeClassConfig.level,
    assessmentType: activeClassConfig.assessmentType,
    assessmentDate: "01/10/26",
    lecturerComment: "",
    hodComment: "",
  });

  // When class selection changes, synchronize metadata
  useEffect(() => {
    setMetadata(prev => ({
      ...prev,
      className: activeClassConfig.name,
      subject: activeClassConfig.subject,
      department: activeClassConfig.department,
      duration: activeClassConfig.duration,
      level: activeClassConfig.level,
      assessmentType: activeClassConfig.assessmentType,
    }));
  }, [activeClassConfig]);

  // Filter trainees by selected class
  const classTrainees = useMemo(() => {
    const list = trainees.filter(t => 
      t.classCode === selectedClassCode ||
      (selectedClassCode === "FBS 5 MOD/J/2026" && (t.classCode === "FBS" || t.classCode === "FBS 5 MOD/J/2026")) ||
      (selectedClassCode === "FBS" && (t.classCode === "FBS" || t.classCode === "FBS 5 MOD/J/2026"))
    );
    return list.length > 0 ? list : trainees.slice(0, 11);
  }, [trainees, selectedClassCode]);

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
      phone: studentForm.phone.trim(),
      remarks: studentForm.remarks.trim(),
    });

    // Populate initial attendance
    const initAttendance: Record<string, AttendanceStatus> = {};
    for (let w = 1; w <= 3; w++) {
      for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
        initAttendance[`W${w}_S${s}`] = "X";
      }
    }
    setAttendanceData(prev => ({
      ...prev,
      [created.id]: { attendance: initAttendance, signed: true }
    }));
    setIsAddStudentOpen(false);
    toast.success(`Student ${created.name} added to roster.`);
  };

  const handleOpenEditStudent = (trainee: any) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can modify class registers.");
      return;
    }
    setEditingStudent(trainee);
    setStudentForm({
      name: trainee.name,
      admNo: trainee.admNo,
      gender: trainee.gender || "M",
      phone: trainee.phone || "",
      remarks: trainee.remarks || "",
    });
  };

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
      phone: studentForm.phone.trim(),
      remarks: studentForm.remarks.trim(),
    });
    setEditingStudent(null);
    toast.success(`Student ${studentForm.name} updated successfully.`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
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
  };

  // Initialize attendance tracking
  useEffect(() => {
    setAttendanceData(prev => {
      const updated = { ...prev };
      classTrainees.forEach((t, idx) => {
        if (!updated[t.id]) {
          // Pre-populate realistic initial present ticks for demonstration
          const initAttendance: Record<string, AttendanceStatus> = {};
          for (let w = 1; w <= 3; w++) {
            for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
              initAttendance[`W${w}_S${s}`] = (idx === 3 && w === 2 && s === 2) ? "0" : "X";
            }
          }
          updated[t.id] = { 
            attendance: initAttendance,
            signed: true // default signed for assessment register
          };
        }
      });
      return updated;
    });
  }, [classTrainees]);

  // Toggle Attendance Cell in CUR/02
  const toggleAttendance = (studentId: string, week: number, session: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    setAttendanceData((prev) => {
      const studentRecord = prev[studentId] || { attendance: {} };
      const key = `W${week}_S${session}`;
      const current = studentRecord.attendance[key];
      
      // Cycle: "" -> "X" -> "0" -> ""
      let nextStatus: AttendanceStatus = "";
      if (!current) nextStatus = "X";
      else if (current === "X") nextStatus = "0";
      else nextStatus = "";

      return {
        ...prev,
        [studentId]: {
          ...studentRecord,
          attendance: { ...studentRecord.attendance, [key]: nextStatus }
        }
      };
    });
  };

  // Mark entire session column present or toggle
  const markWholeSessionColumn = (week: number, session: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    setAttendanceData(prev => {
      const updated = { ...prev };
      const key = `W${week}_S${session}`;
      const allX = classTrainees.every(t => updated[t.id]?.attendance[key] === "X");
      const targetStatus: AttendanceStatus = allX ? "" : "X";
      
      classTrainees.forEach(t => {
        const studentRecord = updated[t.id] || { attendance: {} };
        updated[t.id] = {
          ...studentRecord,
          attendance: { ...studentRecord.attendance, [key]: targetStatus }
        };
      });
      return updated;
    });
    toast.success(`Week ${week}, Session ${session} updated for all trainees.`);
  };

  // Mark all 3 sessions of a week present
  const markWholeWeek = (week: number) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can mark attendance.");
      return;
    }
    setAttendanceData(prev => {
      const updated = { ...prev };
      classTrainees.forEach(t => {
        const studentRecord = updated[t.id] || { attendance: {} };
        const newAtt = { ...studentRecord.attendance };
        for (let s = 1; s <= SESSIONS_PER_WEEK; s++) {
          newAtt[`W${week}_S${s}`] = "X";
        }
        updated[t.id] = {
          ...studentRecord,
          attendance: newAtt
        };
      });
      return updated;
    });
    toast.success(`All 3 sessions of Week ${week} marked present (X)!`);
  };

  // Toggle Signature in CUR/03
  const toggleSignature = (studentId: string) => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can record attendance signatures.");
      return;
    }
    setAttendanceData(prev => {
      const rec = prev[studentId] || { attendance: {} };
      return {
        ...prev,
        [studentId]: {
          ...rec,
          signed: !rec.signed
        }
      };
    });
  };

  // Calculations for CUR/02
  const calculateStats = (attendance: Record<string, AttendanceStatus>) => {
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

    // Target current active session (e.g. Week 1 Session 1)
    const targetKey = "W1_S1";
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
      toast.success(`Synced ${totalSynced} trainee door check-ins into Session 1!`, {
        description: "Verified presence from mobile workshop door QR scans."
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
      localStorage.setItem(`mtti_class_register_${selectedClassCode}`, JSON.stringify(attendanceData));

      const rows = classTrainees.map(t => {
        const rec = attendanceData[t.id];
        const isPresent = rec ? Object.values(rec.attendance).some(v => v === "X") : false;
        return {
          trainee_id: t.id,
          status: isPresent ? "Present" : "Absent"
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

      toast.success("Class Register Saved", {
        description: isOnline
          ? `Attendance data for ${selectedClassCode} synced with MTTI cloud.`
          : `Attendance data for ${selectedClassCode} stored in offline database & queued for sync.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sync to Record of Work
  const handleSaveAndSyncRoW = () => {
    if (!canEditRegister) {
      toast.error("Forbidden: Only assigned trainers, HODs, and administrators can sync records of work.");
      return;
    }
    setIsSaving(true);
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
        session_plan_id: `sp-${selectedClassCode.replace(/[^a-zA-Z0-9]/g, "-")}-w3`,
        unit_code: metadata.subject,
        class_code: selectedClassCode,
        week_number: 3,
        date_delivered: new Date().toLocaleDateString("en-GB"),
        trainees_present: presentCount,
        hours_covered: hoursPerSession,
        work_actually_covered: `Delivered practical lecture on ${metadata.subject}. Verified competencies for all present trainees.`,
        reflection: "Trainees demonstrated consistent engagement. Attendance logged.",
        status: "delivered" as const,
        signature: "ALEXANDER KINOTI",
        signature_date: new Date().toLocaleDateString("en-GB")
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

  return (
    <TrainerLayout 
      title={formMode === "CUR/02" ? "General Class Register (MTTI/REG/CUR/02)" : "Assessment Attendance Register (MTTI/REG/CUR/03)"} 
      subtitle="Official MTTI institutional registers with multi-class roster auto-calculations"
    >
      <div className="space-y-6 pb-20">
        
        {/* Top Control Bar (Print:hidden) */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4 print:hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Form Mode Selector (CUR/02 vs CUR/03) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Template:</span>
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
              <button
                onClick={handleReset}
                className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground"
                title="Reset to official MTTI 58 trainees"
              >
                <RotateCcw className="w-4 h-4" />
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
              <button 
                onClick={() => window.print()} 
                className="h-9 px-3.5 flex items-center gap-2 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Form
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="h-9 px-3.5 flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={handleSaveAndSyncRoW} 
                disabled={isSaving} 
                className="h-9 px-3.5 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                title="Save attendance and immediately update Record of Work"
              >
                <Sparkles className="w-4 h-4" /> Save & Sync RoW
              </button>
            </div>
          </div>

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
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none max-w-md w-full truncate shadow-sm cursor-pointer"
                >
                  {MTTI_CLASSES.map(cls => (
                    <option key={cls.code} value={cls.code}>
                      {cls.subject} — {cls.code} ({cls.department}, {cls.level})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 hidden md:inline font-medium">
                  ({classTrainees.length} trainees enrolled)
                </span>
              </div>

              <button
                onClick={handleOpenAddStudent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Student
              </button>
            </div>

            {/* Quick Switch Pills with shrink-0 min-w-max */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0">
                Quick Switch:
              </span>
              {MTTI_CLASSES.map(cls => (
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
          </div>
        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: ${formMode === "CUR/02" ? "landscape" : "portrait"}; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; }
            thead { display: table-row-group; }
            table { font-size: 8px !important; }
            th, td { padding: 1px 2px !important; }
          }
        `}} />

        {/* ============================================================== */}
        {/* VIEW 1: MTTI/REG/CUR/02 (General Class Register) — Pages 1 & 2 */}
        {/* ============================================================== */}
        {formMode === "CUR/02" && (
          <div 
            className="bg-white text-black p-6 border-2 border-black rounded-lg shadow-lg mx-auto w-full print:border-none print:shadow-none print:p-0"
            style={{ fontFamily: 'Maiandra GD, sans-serif' }}
          >
            {/* Top Header */}
            <div className="flex justify-between items-start text-xs font-bold mb-2">
              <div>Thursday, September 24, 2026 : 09:50 AM</div>
              <div className="font-mono text-sm">MTTI/REG/CUR/02</div>
            </div>

            <div className="text-center mb-4">
              <h1 className="text-xl font-bold tracking-tight uppercase">MUKIRIA TECHNICAL TRAINING INSTITUTE</h1>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs mb-3 border-b-2 border-black pb-3">
              <div className="flex">
                <span className="font-bold w-40">NAME OF LECTURER:</span>
                <span className="font-bold underline uppercase">{metadata.lecturer}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28">DURATION:</span>
                <span className="font-bold">{metadata.duration}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40">CLASS:</span>
                <span className="font-bold">{selectedClassCode}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-28">LEVEL:</span>
                <span className="font-bold">{metadata.level}</span>
              </div>
              <div className="flex col-span-2">
                <span className="font-bold w-40">SUBJECT:</span>
                <span className="font-bold underline">{metadata.subject}</span>
              </div>
            </div>

            <div className="text-center my-3">
              <h2 className="text-sm font-bold uppercase tracking-wide">GENERAL CLASS REGISTER</h2>
              <p className="text-[11px] font-mono text-gray-700">FILTERED BY: &#123;Class: {selectedClassCode}&#125;</p>
            </div>

            {/* 10-Week Attendance Table (Every week has 3 sessions = 30 total sessions) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-[11px]">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th rowSpan={2} className="border border-black p-1 text-center w-7 text-xs">#</th>
                    <th rowSpan={2} className="border border-black p-1 text-left w-32 whitespace-nowrap text-xs">ADMISSION NO</th>
                    <th rowSpan={2} className="border border-black p-1 text-left w-44 whitespace-nowrap text-xs">NAMES</th>
                    {Array.from({ length: WEEKS }).map((_, w) => (
                      <th 
                        key={w} 
                        colSpan={SESSIONS_PER_WEEK}
                        onClick={() => markWholeWeek(w + 1)}
                        className="border border-black p-0.5 text-center text-[10px] font-bold bg-gray-200 border-r-2 border-r-black cursor-pointer hover:bg-gray-300 transition select-none"
                        title={`Week ${w + 1} (Click to mark all 3 sessions present)`}
                      >
                        WK_{w + 1}
                      </th>
                    ))}
                    <th rowSpan={2} className="border border-black p-1 text-center w-12 text-[10px] leading-tight">Possible<br/>Hrs</th>
                    <th rowSpan={2} className="border border-black p-1 text-center w-12 text-[10px] leading-tight">Actual<br/>Hrs</th>
                    <th rowSpan={2} className="border border-black p-1 text-center w-14 text-[10px] leading-tight">Actual<br/>Attendance %</th>
                    <th rowSpan={2} className="border border-black p-1 text-center w-16 text-xs print:hidden">Action</th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-black">
                    {Array.from({ length: WEEKS }).map((_, w) => (
                      Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => (
                        <th 
                          key={`w${w}_s${s}`} 
                          onClick={() => markWholeSessionColumn(w + 1, s + 1)}
                          className={`border border-black p-0.5 text-center w-5 min-w-[20px] text-[9px] font-mono text-gray-700 hover:bg-black/10 cursor-pointer select-none ${
                            s === SESSIONS_PER_WEEK - 1 ? "border-r-2 border-r-black" : ""
                          }`}
                          title={`Week ${w + 1}, Session ${s + 1} (Click to toggle entire column)`}
                        >
                          {s + 1}
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classTrainees.map((trainee, idx) => {
                    const record = attendanceData[trainee.id]?.attendance || {};
                    const stats = calculateStats(record);

                    return (
                      <tr key={trainee.id} className="border-b border-black hover:bg-gray-50 transition">
                        <td className="border border-black p-1 text-center font-bold text-xs">{idx + 1}</td>
                        <td className="border border-black p-1 font-mono font-medium whitespace-nowrap text-xs">{trainee.admNo}</td>
                        <td className="border border-black p-1 font-bold uppercase truncate max-w-[180px] text-xs" title={trainee.name}>
                          {trainee.name}
                        </td>
                        
                        {/* 10 Weeks, each with 3 Sessions */}
                        {Array.from({ length: WEEKS }).map((_, w) => (
                          Array.from({ length: SESSIONS_PER_WEEK }).map((_, s) => {
                            const key = `W${w + 1}_S${s + 1}`;
                            const status = record[key] || "";
                            const isEndOfWeek = s === SESSIONS_PER_WEEK - 1;
                            return (
                              <td 
                                key={key} 
                                onClick={() => toggleAttendance(trainee.id, w + 1, s + 1)}
                                className={`border border-black p-0.5 text-center font-bold cursor-pointer select-none text-[11px] ${
                                  isEndOfWeek ? "border-r-2 border-r-black" : ""
                                } hover:bg-black/10`}
                                title={`W${w + 1} S${s + 1}: ${status === 'X' ? 'Present' : status === '0' ? 'Absent' : 'Unmarked'} (Click to cycle)`}
                              >
                                {status === "X" ? (
                                  <span className="text-red-600 font-bold">X</span>
                                ) : status === "0" ? (
                                  <span className="text-red-600 font-mono font-bold">0</span>
                                ) : (
                                  <span className="text-gray-300 font-light">-</span>
                                )}
                              </td>
                            );
                          })
                        ))}

                        <td className="border border-black p-1 text-center font-mono text-xs">{stats.possibleHrs}</td>
                        <td className="border border-black p-1 text-center font-mono font-bold text-xs">{stats.actualHrs}</td>
                        <td className="border border-black p-1 text-center font-mono font-bold text-xs">
                          {stats.totalMarkedSessions > 0 ? `${stats.percentage}%` : "-"}
                        </td>
                        <td className="border border-black p-1 text-center print:hidden bg-white">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Comments Section */}
            <div className="mt-4 border border-black p-3 space-y-3 text-xs bg-gray-50">
              <div className="flex">
                <span className="font-bold w-40">Lecturer's Comment:</span>
                <input 
                  type="text" 
                  value={metadata.lecturerComment} 
                  onChange={e => setMetadata({ ...metadata, lecturerComment: e.target.value })} 
                  placeholder="e.g. Trainees actively participating in computer essentials practical sessions."
                  className="flex-1 bg-transparent border-b border-black outline-none px-2 font-medium"
                />
              </div>
              <div className="flex">
                <span className="font-bold w-40">HOD's Comment:</span>
                <input 
                  type="text" 
                  value={metadata.hodComment} 
                  onChange={e => setMetadata({ ...metadata, hodComment: e.target.value })} 
                  placeholder="e.g. Syllabus coverage and attendance registers verified."
                  className="flex-1 bg-transparent border-b border-black outline-none px-2 font-medium"
                />
              </div>
            </div>

            {/* Footer Page count */}
            <div className="text-center text-xs mt-3 text-gray-600 font-bold">
              Page 1 of 1
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: MTTI/REG/CUR/03 (Assessment Attendance) — Pages 3 & 4 */}
        {/* ============================================================== */}
        {formMode === "CUR/03" && (
          <div 
            className="bg-white text-black p-8 border-2 border-black rounded-lg shadow-lg mx-auto w-full max-w-4xl print:border-none print:shadow-none print:p-0"
            style={{ fontFamily: 'Maiandra GD, sans-serif' }}
          >
            {/* Header Block */}
            <div className="flex justify-between items-start text-xs font-bold mb-2">
              <div></div>
              <div className="text-right">
                <div className="font-mono text-sm">MTTI/REG/CUR/03</div>
                <div className="mt-1">DATE: <span className="underline">{metadata.assessmentDate}</span></div>
              </div>
            </div>

            <div className="text-center mb-4">
              <h1 className="text-xl font-bold uppercase tracking-tight">MUKIRIA TECHNICAL TRAINING INSTITUTE</h1>
              <h2 className="text-sm font-bold uppercase mt-1">ASSESSMENT OFFICE</h2>
              <h3 className="text-base font-bold underline mt-1">ASSESSMENT ATTENDANCE REGISTER</h3>
            </div>

            {/* Form Header Info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold mb-4 border-b-2 border-black pb-3">
              <div>
                <span>DEPARTMENT: </span>
                <span className="underline uppercase">{metadata.department}</span>
              </div>
              <div>
                <span>CLASS: </span>
                <span className="underline">{selectedClassCode}</span>
              </div>
              <div>
                <span>UNIT OF COMPETENCY: </span>
                <span className="underline uppercase">{metadata.subject}</span>
              </div>
              <div>
                <span>TYPE OF ASSESSMENT: </span>
                <span className="underline uppercase">{metadata.assessmentType}</span>
              </div>
            </div>

            {/* Trainee Attendance List */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b-2 border-black">
                    <th className="border border-black p-2 text-center w-12">S/NO</th>
                    <th className="border border-black p-2 text-left w-36">ADM NO</th>
                    <th className="border border-black p-2 text-left">TRAINEE NAME</th>
                    <th className="border border-black p-2 text-center w-36">STATUS / ATTENDANCE</th>
                    <th className="border border-black p-2 text-center w-20 print:hidden">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {classTrainees.map((trainee, idx) => {
                    const isSigned = attendanceData[trainee.id]?.signed ?? true;
                    return (
                      <tr key={trainee.id} className="border-b border-black hover:bg-gray-50 transition">
                        <td className="border border-black p-2 text-center font-bold">{idx + 1}.</td>
                        <td className="border border-black p-2 font-mono font-medium">{trainee.admNo}</td>
                        <td className="border border-black p-2 font-bold uppercase">{trainee.name}</td>
                        <td 
                          onClick={() => toggleSignature(trainee.id)}
                          className="border border-black p-2 text-center cursor-pointer select-none"
                          title="Click to toggle attendance status"
                        >
                          {isSigned ? (
                            <div className="flex items-center justify-center gap-1 font-mono text-[11px] font-bold text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Attended</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not Attended</span>
                          )}
                        </td>
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
                <p className="text-[10px] text-gray-500 mt-1">Date: {metadata.assessmentDate}</p>
              </div>
              <div>
                <p>Assessment Officer / Supervisor:</p>
                <div className="mt-3 border-b border-black w-60 pb-1">
                  Signature: ______________________
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Date: ____________________</p>
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

      </div>
    </TrainerLayout>
  );
}
