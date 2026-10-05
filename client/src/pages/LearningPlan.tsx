import React, { useState, useEffect, useMemo } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import IntelligentDropzone from "@/components/IntelligentDropzone";
import { 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Edit2, 
  Plus, 
  Trash2, 
  UploadCloud, 
  RotateCcw, 
  FileText, 
  Check, 
  X, 
  Save, 
  Sparkles,
  BookOpen,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import curriculumDatabaseRaw from "@/lib/curriculum_database.json";
import parsedTemplatesRaw from "@/lib/parsed_templates.json";

// --- Types ---
export interface ElementCriteria {
  title: string;
  performanceCriteria: string[];
}

export interface WeekSession {
  week: number;
  sessionNo: number;
  title: string;
  outcome: string;
  trainerActivities: string;
  traineeActivities: string;
  resources: string;
  assessments: string;
  reflections: string;
}

export interface LearningPlanDocument {
  id: string;
  unitCode: string;
  unitTitle: string;
  trainerName: string;
  department: string;
  duration: string;
  level: number;
  traineesCount: number;
  classCode: string;
  datePrepared: string;
  skillOrJobTask: string;
  elements: ElementCriteria[];
  weeks: WeekSession[];
}

export const cleanUnitTitle = (title: string): string => {
  if (!title) return "";
  return title
    .replace(/Mathema\s+tical/gi, "Mathematical")
    .replace(/Applicati\s+on/gi, "Application")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractUnitLevel = (code: string, fallbackLevel?: number): number => {
  if (!code) return fallbackLevel || 6;
  const parts = code.split("/");
  for (let i = parts.length - 1; i >= 0; i--) {
    const num = parseInt(parts[i], 10);
    if (!isNaN(num) && num >= 3 && num <= 8) {
      return num;
    }
  }
  if (fallbackLevel && fallbackLevel >= 3 && fallbackLevel <= 8) return fallbackLevel;
  return 6;
};

// Convert curriculum_database.json into official LearningPlanDocument objects
const generateInitialPlans = (): LearningPlanDocument[] => {
  return (curriculumDatabaseRaw as any[]).map((u: any, idx: number) => {
    const weeks: WeekSession[] = (u.weeks_breakdown || []).map((w: any, wIdx: number) => {
      const isWeek1 = (w.week || wIdx + 1) === 1;
      return {
        week: w.week || wIdx + 1,
        sessionNo: 1,
        title: isWeek1 ? "ADMISSION AND ORIENTATION" : cleanUnitTitle(w.title || `Session ${wIdx + 1}`),
        outcome: isWeek1 
          ? "REPORTING, ADMISSION AND ORIENTATION OF TRAINEES" 
          : (Array.isArray(w.outcomes) ? w.outcomes.map(cleanUnitTitle).join("\n") : cleanUnitTitle(w.outcomes || `Demonstrate skills in ${w.title}`)),
        trainerActivities: isWeek1
          ? "• Conducts trainees admission verification\n• Presents institute rules, safety protocols & course overview\n• Guides registration and orientation tour"
          : "• Poses guiding questions\n• Demonstrates operational concepts\n• Observes practical execution",
        traineeActivities: isWeek1
          ? "• Registration & documentation submission\n• Familiarization with institute regulations\n• Tour of computer laboratories & workshops"
          : "• Active listening & note taking\n• Hands-on practical lab exercise\n• Asks clarifying questions",
        resources: isWeek1
          ? "Admission registers, Institute Rules & Regulations handbook, Laboratory safety manuals"
          : (Array.isArray(w.resources) ? w.resources.join(", ") : (w.resources || "CDACC Curriculum, Lab workstations, Reference manuals")),
        assessments: isWeek1
          ? "Attendance verification & Orientation compliance checklist"
          : "Knowledge: Oral questions\nSkills: Observation checklist & practical tasks",
        reflections: isWeek1
          ? "All trainees reported, verified, and briefed on safety protocols."
          : "Trainees achieved expected CDACC competency standards."
      };
    });

    const elements: ElementCriteria[] = (u.elements && u.elements.length > 0)
      ? u.elements.map((el: any) => ({
          title: cleanUnitTitle(el.element_title),
          performanceCriteria: el.performance_criteria || []
        }))
      : (u.learning_outcomes || []).slice(0, 4).map((lo: any, eIdx: number) => ({
          title: `${eIdx + 1}. Demonstrate proficiency in ${cleanUnitTitle(lo.title)}`,
          performanceCriteria: [
            "Tools, equipment and materials are prepared according to task requirements.",
            "Tasks are executed in compliance with CDACC occupational standards and safety procedures."
          ]
        }));

    const unitTitle = cleanUnitTitle(u.unit_title);
    const unitLevel = extractUnitLevel(u.unit_code, u.level);

    return {
      id: `lp-${u.unit_code.replace(/[^a-zA-Z0-9]/g, "-")}-${idx}`,
      unitCode: u.unit_code,
      unitTitle: unitTitle,
      trainerName: "Alexander Kinoti",
      department: u.department || "Computing and Informatics",
      duration: "MAY-AUG 2026",
      level: unitLevel,
      traineesCount: 25,
      classCode: u.department?.includes("Civil") ? "CE6/M/S/24" : u.department?.includes("Survey") ? "LS6/M/24" : u.department?.includes("Business") ? "BUS/L5/25" : "ITECH6/M/24",
      datePrepared: new Date().toLocaleDateString("en-GB"),
      skillOrJobTask: u.description || `Operate computer hardware and software, manage data systems, and utilize productivity applications according to CDACC occupational guidelines.`,
      elements: elements.length > 0 ? elements : [
        {
          title: "1. Apply foundational concepts",
          performanceCriteria: ["Identify essential tools and procedures", "Execute standard operations safely"]
        }
      ],
      weeks: weeks
    };
  });
};

export default function LearningPlan() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<LearningPlanDocument[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("");
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  
  // UI Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditMetaModalOpen, setIsEditMetaModalOpen] = useState(false);
  const [isEditSessionModalOpen, setIsEditSessionModalOpen] = useState(false);
  const [editingSessionIdx, setEditingSessionIdx] = useState<number | null>(null);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Load from localStorage or defaults on mount
  useEffect(() => {
    let allPlans: LearningPlanDocument[] = [];
    const saved = localStorage.getItem("mtti_custom_learning_plans");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          allPlans = parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved learning plans", e);
      }
    }
    
    if (allPlans.length === 0) {
      allPlans = generateInitialPlans();
      localStorage.setItem("mtti_custom_learning_plans", JSON.stringify(allPlans));
    } else {
      // Ensure Week 1 is Admission/Orientation and update clean titles & levels across all existing plans
      let updated = false;
      allPlans = allPlans.map(p => {
        const cleanedTitle = cleanUnitTitle(p.unitTitle);
        const parsedLevel = extractUnitLevel(p.unitCode, p.level);
        let planUpdated = false;
        let newTitle = p.unitTitle;
        let newLevel = p.level;

        if (cleanedTitle !== p.unitTitle) {
          newTitle = cleanedTitle;
          planUpdated = true;
        }
        if (parsedLevel !== p.level) {
          newLevel = parsedLevel;
          planUpdated = true;
        }

        let updatedWeeks = p.weeks;
        if (p.weeks && p.weeks.length > 0 && p.weeks[0].week === 1) {
          const w0 = p.weeks[0];
          if (!w0.title.toUpperCase().includes("ADMISSION") && !w0.title.toUpperCase().includes("ORIENTATION")) {
            planUpdated = true;
            updatedWeeks = [...p.weeks];
            updatedWeeks[0] = {
              ...w0,
              sessionNo: 1,
              title: "ADMISSION AND ORIENTATION",
              outcome: "REPORTING, ADMISSION AND ORIENTATION OF TRAINEES",
              trainerActivities: "• Conducts trainees admission verification\n• Presents institute rules, safety protocols & course overview\n• Guides registration and orientation tour",
              traineeActivities: "• Registration & documentation submission\n• Familiarization with institute regulations\n• Tour of computer laboratories & workshops",
              resources: "Admission registers, Institute Rules & Regulations handbook, Laboratory safety manuals",
              assessments: "Attendance verification & Orientation compliance checklist",
              reflections: "All trainees reported, verified, and briefed on safety protocols."
            };
          }
        }

        if (planUpdated) {
          updated = true;
          return { ...p, unitTitle: newTitle, level: newLevel, weeks: updatedWeeks };
        }
        return p;
      });
      if (updated) {
        localStorage.setItem("mtti_custom_learning_plans", JSON.stringify(allPlans));
      }
    }
    
    setPlans(allPlans);

    // Check if navigated from CurriculumParsingHub with selected unit
    const savedSelected = localStorage.getItem("selected_curriculum_unit");
    if (savedSelected) {
      try {
        const u = JSON.parse(savedSelected);
        const match = allPlans.find(p => p.unitCode === u.unit_code || p.unitTitle.toLowerCase() === u.unit_title.toLowerCase());
        if (match) {
          setActivePlanId(match.id);
          localStorage.removeItem("selected_curriculum_unit");
          return;
        }
      } catch (e) {}
    }

    if (allPlans.length > 0) {
      setActivePlanId(allPlans[0].id);
    }
  }, []);

  const savePlansToStorage = (updatedPlans: LearningPlanDocument[]) => {
    setPlans(updatedPlans);
    localStorage.setItem("mtti_custom_learning_plans", JSON.stringify(updatedPlans));
  };

  // Currently active Learning Plan
  const activePlan = useMemo(() => {
    return plans.find(p => p.id === activePlanId) || plans[0] || null;
  }, [plans, activePlanId]);

  // Filtered available plans for selector/tabs
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = 
        p.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unitTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.classCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = selectedLevel === "all" || p.level.toString() === selectedLevel;
      return matchSearch && matchLevel;
    });
  }, [plans, searchTerm, selectedLevel]);

  // Filtered weeks within current active plan (for live schedule search)
  const filteredWeeks = useMemo(() => {
    if (!activePlan) return [];
    if (!searchTerm.trim()) return activePlan.weeks;
    
    return activePlan.weeks.filter(w => 
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.outcome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.resources.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.assessments.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `week ${w.week}`.includes(searchTerm.toLowerCase())
    );
  }, [activePlan, searchTerm]);

  // --- Handlers ---
  const handleUploadSuccess = (responses: any[]) => {
    if (!responses || responses.length === 0) return;

    const newPlans: LearningPlanDocument[] = responses.map((res, i) => {
      const weeks: WeekSession[] = (res.topics && res.topics.length > 0)
        ? res.topics.map((topic: string, wIdx: number) => ({
            week: wIdx + 1,
            sessionNo: wIdx + 1,
            title: topic,
            outcome: (res.outcomes && res.outcomes[wIdx]) ? res.outcomes[wIdx] : `Apply core concepts of ${topic}`,
            trainerActivities: "• Poses questions\n• Demonstrates concepts\n• Observes execution",
            traineeActivities: "• Active participation\n• Practical workstation exercise\n• Takes notes",
            resources: "CDACC Curriculum, Lab Workstations, Textbooks",
            assessments: "Knowledge: Oral questions\nSkills: Practical checklist",
            reflections: "Session successfully delivered."
          }))
        : [
            {
              week: 1,
              sessionNo: 1,
              title: "Orientation & Core Overview",
              outcome: "Identify key occupational standards and safety procedures.",
              trainerActivities: "Lecture & presentation",
              traineeActivities: "Active listening and discussion",
              resources: "Course syllabus, standard manuals",
              assessments: "Oral questioning",
              reflections: "Satisfactory engagement."
            }
          ];

      const elements: ElementCriteria[] = weeks.slice(0, 3).map((w, eIdx) => ({
        title: `${eIdx + 1}. Demonstrate proficiency in ${w.title}`,
        performanceCriteria: [
          "Operating parameters conform to occupational guidelines.",
          "Work tasks are organized methodically."
        ]
      }));

      return {
        id: `lp-upload-${Date.now()}-${i}`,
        unitCode: res.unit_code || "HBS/OS/COS/BC/01/5/MA",
        unitTitle: res.unit_name || res.course_name || "Newly Imported Unit",
        trainerName: user?.email ? user.email.split("@")[0].toUpperCase() : "ALEXANDER KINOTI",
        department: "Computing & Informatics",
        duration: "MAY-AUG 2026",
        level: res.level || 6,
        traineesCount: 25,
        classCode: "EE6/M/S/24",
        datePrepared: new Date().toLocaleDateString("en-GB"),
        skillOrJobTask: "Demonstrate practical competency and theoretical understanding per CDACC standards.",
        elements: elements,
        weeks: weeks
      };
    });

    const updated = [...newPlans, ...plans];
    savePlansToStorage(updated);
    setActivePlanId(newPlans[0].id);
    setIsUploadModalOpen(false);
    toast.success(`Imported and generated ${newPlans.length} Learning Plan(s)!`);
  };

  // Session Edit / Add Form State
  const [sessionFormData, setSessionFormData] = useState<WeekSession>({
    week: 1,
    sessionNo: 1,
    title: "",
    outcome: "",
    trainerActivities: "",
    traineeActivities: "",
    resources: "",
    assessments: "",
    reflections: ""
  });

  const handleOpenEditSession = (session: WeekSession, index: number) => {
    setEditingSessionIdx(index);
    setSessionFormData({ ...session });
    setIsEditSessionModalOpen(true);
  };

  const handleOpenAddSession = (targetWeek?: number) => {
    if (!activePlan) return;
    let weekToUse = 2;
    if (typeof targetWeek === "number") {
      weekToUse = targetWeek;
    } else if (activePlan.weeks.length > 0) {
      const maxW = Math.max(...activePlan.weeks.map(w => w.week));
      weekToUse = maxW;
    }

    const existingInWeek = activePlan.weeks.filter(w => w.week === weekToUse).length;
    const nextSessionNo = existingInWeek + 1;

    setEditingSessionIdx(null);
    setSessionFormData({
      week: weekToUse,
      sessionNo: nextSessionNo,
      title: "",
      outcome: `By the end of the session trainee should be able to: `,
      trainerActivities: "• Poses guiding questions\n• Demonstrates operational concepts\n• Observes practical execution",
      traineeActivities: "• Active listening & note-taking\n• Hands-on practical lab exercise",
      resources: "CDACC Curriculum, Lab workstations, Reference manuals",
      assessments: "Knowledge: Oral questions\nSkills: Observation checklist & practical tasks",
      reflections: "Competency criteria achieved successfully."
    });
    setIsEditSessionModalOpen(true);
  };

  const handleWeekChange = (newWeek: number) => {
    if (!activePlan) {
      setSessionFormData(prev => ({ ...prev, week: newWeek }));
      return;
    }
    if (editingSessionIdx === null) {
      const existingInWeek = activePlan.weeks.filter(w => w.week === newWeek).length;
      setSessionFormData(prev => ({ ...prev, week: newWeek, sessionNo: existingInWeek + 1 }));
    } else {
      setSessionFormData(prev => ({ ...prev, week: newWeek }));
    }
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;

    let updatedWeeks = [...activePlan.weeks];
    if (editingSessionIdx !== null) {
      updatedWeeks[editingSessionIdx] = { ...sessionFormData };
      toast.success(`Week ${sessionFormData.week} Session ${sessionFormData.sessionNo} updated.`);
    } else {
      updatedWeeks.push({ ...sessionFormData });
      toast.success(`Week ${sessionFormData.week} Session ${sessionFormData.sessionNo} added.`);
    }

    // Sort weeks strictly by week ASC, then sessionNo ASC
    updatedWeeks.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.sessionNo - b.sessionNo;
    });

    const updatedPlan = { ...activePlan, weeks: updatedWeeks };
    const updatedPlans = plans.map(p => p.id === activePlan.id ? updatedPlan : p);
    savePlansToStorage(updatedPlans);
    setIsEditSessionModalOpen(false);
  };

  const handleDeleteSession = (index: number) => {
    if (!activePlan) return;
    const updatedWeeks = activePlan.weeks.filter((_, idx) => idx !== index);
    const updatedPlan = { ...activePlan, weeks: updatedWeeks };
    const updatedPlans = plans.map(p => p.id === activePlan.id ? updatedPlan : p);
    savePlansToStorage(updatedPlans);
    toast.success("Session removed from Learning Plan.");
  };

  // Metadata Edit Form State
  const [metaFormData, setMetaFormData] = useState({
    unitTitle: "",
    unitCode: "",
    trainerName: "",
    department: "",
    duration: "",
    level: 6,
    traineesCount: 25,
    classCode: "",
    skillOrJobTask: ""
  });

  const handleOpenEditMeta = () => {
    if (!activePlan) return;
    setMetaFormData({
      unitTitle: activePlan.unitTitle,
      unitCode: activePlan.unitCode,
      trainerName: activePlan.trainerName,
      department: activePlan.department,
      duration: activePlan.duration,
      level: activePlan.level,
      traineesCount: activePlan.traineesCount,
      classCode: activePlan.classCode,
      skillOrJobTask: activePlan.skillOrJobTask
    });
    setIsEditMetaModalOpen(true);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;

    const updatedPlan: LearningPlanDocument = {
      ...activePlan,
      ...metaFormData
    };
    const updatedPlans = plans.map(p => p.id === activePlan.id ? updatedPlan : p);
    savePlansToStorage(updatedPlans);
    setIsEditMetaModalOpen(false);
    toast.success("Learning Plan header metadata updated.");
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all Learning Plans to initial default CDACC templates?")) {
      const initial = generateInitialPlans();
      savePlansToStorage(initial);
      setActivePlanId(initial[0].id);
      toast.info("Learning Plans reset to default standards.");
    }
  };

  // Helper to clean duplicate bullet numbers (e.g. "a. 1.1 Tools..." -> "Tools...")
  const cleanCriterionText = (text: string) => {
    if (!text) return "";
    return text.replace(/^(\d+(\.\d+)*\s*|[a-z][\.\)]\s*|[\-\•\*]\s*)/i, "").trim();
  };

  // --- Table & Border Customization State ---
  const [tableStyle, setTableStyle] = useState<{
    borderWidth: string;
    borderColor: string;
    borderStyle: "solid" | "dashed" | "double";
    paddingDensity: "compact" | "normal" | "spacious";
    headerBg: "gray" | "navy" | "amber" | "white";
  }>(() => {
    const saved = localStorage.getItem("mtti_lp_table_style");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      borderWidth: "1px",
      borderColor: "#000000",
      borderStyle: "solid",
      paddingDensity: "normal",
      headerBg: "gray",
    };
  });
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);

  const handleUpdateTableStyle = (updates: any) => {
    setTableStyle(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("mtti_lp_table_style", JSON.stringify(next));
      return next;
    });
  };

  const cellPaddingClass = useMemo(() => {
    switch (tableStyle.paddingDensity) {
      case "compact": return "px-2 py-1";
      case "spacious": return "px-4 py-3";
      default: return "px-2.5 py-2";
    }
  }, [tableStyle.paddingDensity]);

  const headerBgClass = useMemo(() => {
    switch (tableStyle.headerBg) {
      case "navy": return "bg-[#000953] text-white";
      case "amber": return "bg-amber-100 text-black";
      case "white": return "bg-white text-black";
      default: return "bg-gray-100 text-black";
    }
  }, [tableStyle.headerBg]);

  // --- Criteria & Benchmark Editing State ---
  const [isEditCriteriaModalOpen, setIsEditCriteriaModalOpen] = useState(false);
  const [criteriaFormSkill, setCriteriaFormSkill] = useState("");
  const [criteriaFormElements, setCriteriaFormElements] = useState<ElementCriteria[]>([]);

  const handleOpenEditCriteria = () => {
    if (!activePlan) return;
    setCriteriaFormSkill(activePlan.skillOrJobTask);
    setCriteriaFormElements(JSON.parse(JSON.stringify(activePlan.elements || [])));
    setIsEditCriteriaModalOpen(true);
  };

  const handleSaveCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;
    const updatedPlan: LearningPlanDocument = {
      ...activePlan,
      skillOrJobTask: criteriaFormSkill,
      elements: criteriaFormElements,
    };
    const updatedPlans = plans.map(p => p.id === activePlan.id ? updatedPlan : p);
    savePlansToStorage(updatedPlans);
    setIsEditCriteriaModalOpen(false);
    toast.success("Skill & Benchmark Criteria updated successfully.");
  };

  const handleAddElement = () => {
    setCriteriaFormElements(prev => [
      ...prev,
      {
        title: `${prev.length + 1}. Demonstrate proficiency in technical operations`,
        performanceCriteria: [
          "Prepare necessary tools and equipment safely according to requirements.",
          "Execute procedure in compliance with occupational standards."
        ]
      }
    ]);
  };

  const handleDeleteElement = (index: number) => {
    setCriteriaFormElements(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCriterion = (elIndex: number) => {
    setCriteriaFormElements(prev => {
      const copy = [...prev];
      copy[elIndex].performanceCriteria.push("Perform task according to safety guidelines.");
      return copy;
    });
  };

  const handleDeleteCriterion = (elIndex: number, crIndex: number) => {
    setCriteriaFormElements(prev => {
      const copy = [...prev];
      copy[elIndex].performanceCriteria = copy[elIndex].performanceCriteria.filter((_, i) => i !== crIndex);
      return copy;
    });
  };

  // Export to Word via Backend
  const handleExportWord = async () => {
    if (!activePlan) return;
    setIsExportingWord(true);
    try {
      const response = await fetch("http://localhost:8000/api/export-learning-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            unit_name: activePlan.unitTitle,
            unit_code: activePlan.unitCode,
            trainer_name: activePlan.trainerName,
            level: activePlan.level,
            class_code: activePlan.classCode,
            trainees_count: activePlan.traineesCount,
            weeks: activePlan.weeks.map(w => ({
              week: w.week,
              session_no: w.sessionNo,
              title: w.title,
              outcome: w.outcome,
              trainer_activities: w.trainerActivities,
              trainee_activities: w.traineeActivities
            }))
          }
        })
      });

      if (!response.ok) throw new Error("Failed to export Word document");
      const data = await response.json();

      if (data.file_data) {
        const byteCharacters = atob(data.file_data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `MTTI_LearningPlan_${activePlan.unitCode.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Learning Plan exported to Word (.docx)!");
      }
    } catch (err: any) {
      toast.error("Failed to export Word document", { description: err.message });
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <TrainerLayout 
      title="Learning Plan (MTTI/F/CUR/01)" 
      subtitle="Comprehensive 9-Column CDACC Scheme of Work — Search, Edit, Print & Export"
    >
      <div className="space-y-6">
        
        {/* Top Action & Search Bar (Print:hidden) */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3.5 print:hidden">
          {/* Row 1: Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                Plan Actions & Exports
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold transition shadow-sm shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                Upload New Standard
              </button>

              <button
                onClick={handleOpenEditMeta}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition border border-border shrink-0"
              >
                <Edit2 className="w-4 h-4" />
                Edit Details
              </button>

              <button
                onClick={() => setIsTableSettingsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition border border-border text-foreground shrink-0"
                title="Adjust table borders, density, and colors"
              >
                <Sliders className="w-4 h-4 text-primary" />
                Table & Borders
              </button>

              <button
                onClick={() => handleOpenAddSession()}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>

              <button
                onClick={handleExportWord}
                disabled={isExportingWord}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 shrink-0"
              >
                <Download className="w-4 h-4" />
                {isExportingWord ? "Exporting..." : "Export Word"}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-black text-white hover:bg-black/80 rounded-lg text-xs font-bold transition shadow-sm shrink-0"
              >
                <Printer className="w-4 h-4" />
                Print Plan
              </button>

              <button
                onClick={handleResetDefaults}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border shrink-0"
                title="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Search, Level Filter & Unit Selector Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 pt-3 border-t border-border/70">
            {/* Active Learning Plan Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                Active Plan:
              </span>
              <select
                value={activePlan?.id || ""}
                onChange={(e) => setActivePlanId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none w-full truncate shadow-sm cursor-pointer"
              >
                {(filteredPlans.length > 0 ? filteredPlans : plans).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.unitTitle} ({p.unitCode}) — Level {p.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search unit by name, code, keyword, or session..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="4">Level 4 (Cert)</option>
                <option value="5">Level 5 (Craft)</option>
                <option value="6">Level 6 (Diploma)</option>
              </select>
            </div>

            {activePlan?.id.startsWith("lp-upload-") && (
              <button
                onClick={() => {
                  if (confirm(`Remove custom imported plan for ${activePlan.unitCode}?`)) {
                    const updated = plans.filter((p) => p.id !== activePlan.id);
                    savePlansToStorage(updated);
                    if (updated.length > 0) setActivePlanId(updated[0].id);
                    toast.info("Imported plan removed.");
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
                title="Remove this imported plan"
              >
                ✕ Remove Unit
              </button>
            )}
          </div>

          {/* Row 3: Quick-Switch Horizontal Scrollable Pills */}
          <div className="border-t border-border pt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0">
                Quick Switch ({filteredPlans.length}):
              </span>
              {filteredPlans.length === 0 ? (
                <span className="text-xs text-muted-foreground italic shrink-0">No plans match your search query.</span>
              ) : (
                filteredPlans.map((p) => {
                  const isActive = activePlan?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePlanId(p.id)}
                      className={`shrink-0 min-w-max px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-[#000953] text-white font-bold ring-2 ring-primary/40 shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold max-w-[200px] truncate">{p.unitTitle}</span>
                      <span className="opacity-75 font-mono text-[10px]">({p.unitCode})</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                        L{p.level}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        {/* Live Search Notice */}
        {searchTerm && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-2 rounded-lg text-xs font-medium text-foreground print:hidden">
            <span>
              Search results for <strong>"{searchTerm}"</strong>: Showing {filteredWeeks.length} of {activePlan?.weeks.length || 0} scheduled sessions.
            </span>
            <button onClick={() => setSearchTerm("")} className="underline text-primary hover:opacity-80">
              Clear search
            </button>
          </div>
        )}

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; }
            thead { display: table-row-group; }
          }
        `}} />

        {/* Official MTTI/F/CUR/01 Printable Document */}
        {activePlan && (
          <div 
            className="bg-white text-black p-6 border-2 border-black shadow-lg mx-auto w-full print:border-none print:shadow-none print:p-0" 
            style={{ fontFamily: 'Maiandra GD, sans-serif', pageBreakAfter: 'always' }}
          >
            {/* Header Section */}
            <div className="text-right font-bold text-sm mb-2">MTTI/F/CUR/01</div>
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold uppercase mb-1">Mukiria Technical Training Institute</h1>
              <h2 className="text-lg font-bold uppercase">Learning Plan</h2>
            </div>
            
            {/* Header Grid (5 Rows x 2 Cols) */}
            <table 
              className="w-full border-collapse text-sm mb-4"
              style={{
                border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}`
              }}
            >
              <tbody>
                <tr>
                  <td 
                    className={`${cellPaddingClass} w-1/2`}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Unit of Competence:</span> {activePlan.unitTitle}
                  </td>
                  <td 
                    className={`${cellPaddingClass} w-1/2`}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Unit Code:</span> {activePlan.unitCode}
                  </td>
                </tr>
                <tr>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Name of Trainer:</span> {activePlan.trainerName}
                  </td>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Department:</span> {activePlan.department}
                  </td>
                </tr>
                <tr>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Duration:</span> {activePlan.duration}
                  </td>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Level:</span> Level {activePlan.level}
                  </td>
                </tr>
                <tr>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Date of Preparation:</span> {activePlan.datePrepared}
                  </td>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Date of Revision:</span> ........................
                  </td>
                </tr>
                <tr>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Number of Trainees:</span> {activePlan.traineesCount}
                  </td>
                  <td 
                    className={cellPaddingClass}
                    style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                  >
                    <span className="font-bold">Class:</span> {activePlan.classCode}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Preamble / Criteria */}
            <div className="text-sm mb-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="flex-1">
                  <span className="font-bold">Skill or Job Task: </span> 
                  {activePlan.skillOrJobTask}
                </p>
                <button
                  onClick={handleOpenEditCriteria}
                  className="print:hidden text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shrink-0"
                  title="Edit Skill, Elements & Benchmark Criteria"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Task & Benchmarks
                </button>
              </div>
              
              <p className="font-bold mb-2">Benchmark or Criteria to be used:</p>
              <div className="ml-4 space-y-3">
                {activePlan.elements.map((el, i) => (
                  <div key={i}>
                    <p className="font-bold">{el.title}</p>
                    <div className="ml-6 space-y-1 mt-1">
                      {el.performanceCriteria.map((pc, j) => (
                        <p key={j}>{String.fromCharCode(97 + j)}. {cleanCriterionText(pc)}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 9-Column Weekly Schedule */}
            <div className="overflow-x-auto">
              <table 
                className="w-full border-collapse text-xs md:text-sm"
                style={{
                  border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}`
                }}
              >
                <thead>
                  <tr className={headerBgClass}>
                    <th 
                      className={`${cellPaddingClass} font-bold w-12 text-center`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Week
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-16 text-center`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Session<br/>No.
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-48 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Session<br/>Title
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-48 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Learning<br/>Outcome
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-32 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Trainer<br/>Activities
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-32 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Trainee(s)<br/>Activities
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-32 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Resources<br/>& Refs
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-32 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Learning Checks/<br/>Assessments
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-24 text-left`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Reflections<br/>& Date
                    </th>
                    <th 
                      className={`${cellPaddingClass} font-bold w-16 text-center print:hidden`}
                      style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeeks.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={10} 
                        className="p-6 text-center text-gray-500 italic"
                        style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                      >
                        No sessions match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredWeeks.map((w, i) => {
                      const isWeek1Merged = w.week === 1 && w.sessionNo === 1;

                      if (isWeek1Merged) {
                        return (
                          <tr key={i} className="bg-gray-100/90 hover:bg-gray-200/60 transition">
                            <td 
                              colSpan={9} 
                              className={`${cellPaddingClass} text-center font-bold tracking-wider text-xs md:text-sm uppercase bg-gray-100 text-black select-none`}
                              style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                            >
                              WEEK 1: ADMISSION AND ORIENTATION
                            </td>
                            <td 
                              className={`${cellPaddingClass} text-center align-middle print:hidden bg-white`}
                              style={{ border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` }}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenAddSession(1)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                                  title="Add another session to Week 1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditSession(w, i)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Edit Week 1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(i)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Delete this session"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Check whether to show the Week number cell and calculate rowSpan for multiple sessions in this week
                      let showWeekCell = true;
                      let weekRowSpan = 1;
                      const prevSession = i > 0 ? filteredWeeks[i - 1] : null;
                      const prevWasMergedW1 = prevSession && prevSession.week === 1 && prevSession.sessionNo === 1;

                      if (prevSession && prevSession.week === w.week && !prevWasMergedW1) {
                        showWeekCell = false;
                      } else {
                        let span = 1;
                        while (i + span < filteredWeeks.length && filteredWeeks[i + span].week === w.week) {
                          span++;
                        }
                        weekRowSpan = span;
                      }

                      const cellStyle = { border: `${tableStyle.borderWidth} ${tableStyle.borderStyle} ${tableStyle.borderColor}` };

                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          {showWeekCell && (
                            <td 
                              rowSpan={weekRowSpan} 
                              className={`${cellPaddingClass} text-center align-top font-bold bg-gray-50/40`}
                              style={cellStyle}
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span>{w.week}</span>
                                {weekRowSpan > 1 && (
                                  <span className="text-[10px] text-muted-foreground font-semibold px-1 py-0.5 rounded bg-muted/60 print:hidden whitespace-nowrap">
                                    {weekRowSpan} sess.
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className={`${cellPaddingClass} text-center align-top font-semibold`} style={cellStyle}>{w.sessionNo}</td>
                          <td className={`${cellPaddingClass} align-top font-medium`} style={cellStyle}>{w.title}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.outcome}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.trainerActivities}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.traineeActivities}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.resources}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.assessments}</td>
                          <td className={`${cellPaddingClass} align-top whitespace-pre-wrap`} style={cellStyle}>{w.reflections}</td>
                          <td className={`${cellPaddingClass} text-center align-top print:hidden`} style={cellStyle}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenAddSession(w.week)}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                                title={`Add another session to Week ${w.week}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditSession(w, i)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Edit this session"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(i)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete this session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Section */}
            <div className="mt-12 flex justify-between text-sm font-bold">
              <div className="flex gap-4">
                <span>Prepared by: {activePlan.trainerName}</span>
                <span>Date: {activePlan.datePrepared}</span>
                <span>Sign: ........................</span>
              </div>
            </div>
            <div className="mt-8 flex justify-between text-sm font-bold">
              <div className="flex gap-4">
                <span>Approved by: .................................................</span>
                <span>Date: ........................</span>
                <span>Sign: ........................</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* --- Modal: Upload New CDACC Document --- */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-primary" />
                  Upload CDACC Occupational Standard
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Drag and drop your CDACC Syllabus or Occupational Standard (.docx or .pdf). The system extracts competencies, weekly outlines, and criteria to automatically generate your Learning Plan.
              </p>
              <IntelligentDropzone
                context="learning_plan"
                role="trainer"
                onSuccess={handleUploadSuccess}
                label="Drop CDACC Occupational Standard document here"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Modal: Edit Learning Plan Header Metadata --- */}
      <AnimatePresence>
        {isEditMetaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-base">Edit Learning Plan Details</h3>
                <button onClick={() => setIsEditMetaModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMeta} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Unit of Competence</label>
                    <input
                      type="text"
                      value={metaFormData.unitTitle}
                      onChange={e => setMetaFormData({ ...metaFormData, unitTitle: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Unit Code</label>
                    <input
                      type="text"
                      value={metaFormData.unitCode}
                      onChange={e => setMetaFormData({ ...metaFormData, unitCode: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Trainer Name</label>
                    <input
                      type="text"
                      value={metaFormData.trainerName}
                      onChange={e => setMetaFormData({ ...metaFormData, trainerName: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Department</label>
                    <input
                      type="text"
                      value={metaFormData.department}
                      onChange={e => setMetaFormData({ ...metaFormData, department: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Duration / Term</label>
                    <input
                      type="text"
                      value={metaFormData.duration}
                      onChange={e => setMetaFormData({ ...metaFormData, duration: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">KNQF Level</label>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      value={metaFormData.level}
                      onChange={e => setMetaFormData({ ...metaFormData, level: parseInt(e.target.value) || 6 })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Class Code</label>
                    <input
                      type="text"
                      value={metaFormData.classCode}
                      onChange={e => setMetaFormData({ ...metaFormData, classCode: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Skill or Job Task Description</label>
                  <textarea
                    rows={3}
                    value={metaFormData.skillOrJobTask}
                    onChange={e => setMetaFormData({ ...metaFormData, skillOrJobTask: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsEditMetaModalOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Modal: Edit / Add Session Row --- */}
      <AnimatePresence>
        {isEditSessionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h3 className="font-bold text-base">
                  {editingSessionIdx !== null ? `Edit Week ${sessionFormData.week} Session` : "Add New Session"}
                </h3>
                <button onClick={() => setIsEditSessionModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSession} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Week Number</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={sessionFormData.week}
                      onChange={e => handleWeekChange(parseInt(e.target.value) || 1)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-muted-foreground">Session Number</label>
                      {activePlan && (
                        <span className="text-[10px] text-muted-foreground">
                          {activePlan.weeks.filter(w => w.week === sessionFormData.week).length} existing in W{sessionFormData.week}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={sessionFormData.sessionNo}
                      onChange={e => setSessionFormData({ ...sessionFormData, sessionNo: parseInt(e.target.value) || 1 })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>💡 <strong>Multiple Sessions:</strong> You can schedule multiple sessions in any week (e.g. Week {sessionFormData.week} Session 1, Session 2, Session 3).</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Session Title / Topic</label>
                  <input
                    type="text"
                    value={sessionFormData.title}
                    onChange={e => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Learning Outcome</label>
                  <textarea
                    rows={3}
                    value={sessionFormData.outcome}
                    onChange={e => setSessionFormData({ ...sessionFormData, outcome: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Trainer Activities</label>
                    <textarea
                      rows={3}
                      value={sessionFormData.trainerActivities}
                      onChange={e => setSessionFormData({ ...sessionFormData, trainerActivities: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Trainee Activities</label>
                    <textarea
                      rows={3}
                      value={sessionFormData.traineeActivities}
                      onChange={e => setSessionFormData({ ...sessionFormData, traineeActivities: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Resources & References</label>
                    <textarea
                      rows={2}
                      value={sessionFormData.resources}
                      onChange={e => setSessionFormData({ ...sessionFormData, resources: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">Learning Checks / Assessment</label>
                    <textarea
                      rows={2}
                      value={sessionFormData.assessments}
                      onChange={e => setSessionFormData({ ...sessionFormData, assessments: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Reflections & Remarks</label>
                  <input
                    type="text"
                    value={sessionFormData.reflections}
                    onChange={e => setSessionFormData({ ...sessionFormData, reflections: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsEditSessionModalOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90"
                  >
                    Save Session
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Modal: Table & Border Customization --- */}
        <AnimatePresence>
          {isTableSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base text-foreground">Adjust Table & Borders</h3>
                  </div>
                  <button onClick={() => setIsTableSettingsOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Border Thickness */}
                  <div>
                    <label className="font-bold text-muted-foreground block mb-2">Border Line Thickness & Style</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "Thin (1px)", val: "1px", style: "solid" },
                        { label: "Medium (1.5px)", val: "1.5px", style: "solid" },
                        { label: "Bold (2px)", val: "2px", style: "solid" },
                        { label: "Heavy (3px)", val: "3px", style: "solid" },
                        { label: "Double (3px)", val: "3px", style: "double" },
                      ].map(b => (
                        <button
                          key={b.label}
                          type="button"
                          onClick={() => handleUpdateTableStyle({ borderWidth: b.val, borderStyle: b.style as any })}
                          className={`p-2 rounded-lg border text-center transition font-semibold ${
                            tableStyle.borderWidth === b.val && tableStyle.borderStyle === b.style
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
                          }`}
                        >
                          <div 
                            className="w-full h-1 mb-1.5 mx-auto rounded"
                            style={{ 
                              borderTop: `${b.val} ${b.style} currentColor` 
                            }} 
                          />
                          <span className="text-[10px]">{b.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Color */}
                  <div>
                    <label className="font-bold text-muted-foreground block mb-2">Border Line Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "Black", color: "#000000" },
                        { label: "MTTI Navy", color: "#000953" },
                        { label: "Gold Accent", color: "#c48820" },
                        { label: "Dark Slate", color: "#475569" },
                        { label: "Light Slate", color: "#94a3b8" },
                      ].map(c => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => handleUpdateTableStyle({ borderColor: c.color })}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 transition ${
                            tableStyle.borderColor === c.color
                              ? "ring-2 ring-primary border-transparent bg-primary/10"
                              : "border-border hover:bg-secondary"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-black/20 shadow-xs" style={{ backgroundColor: c.color }} />
                          <span className="text-[10px] font-medium text-foreground">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cell Padding Density */}
                  <div>
                    <label className="font-bold text-muted-foreground block mb-2">Cell Density / Spacing</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Compact", val: "compact", desc: "Minimal padding for maximum view" },
                        { label: "Normal (Standard)", val: "normal", desc: "Official TVET formatting" },
                        { label: "Spacious", val: "spacious", desc: "Relaxed breathing room" },
                      ].map(d => (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => handleUpdateTableStyle({ paddingDensity: d.val as any })}
                          className={`p-2.5 rounded-lg border text-left transition ${
                            tableStyle.paddingDensity === d.val
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
                          }`}
                        >
                          <p className="font-bold text-xs">{d.label}</p>
                          <p className={`text-[10px] opacity-80 mt-0.5 ${tableStyle.paddingDensity === d.val ? "text-primary-foreground/90" : "text-muted-foreground"}`}>{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Background */}
                  <div>
                    <label className="font-bold text-muted-foreground block mb-2">Table Header Style</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Classic Gray", val: "gray" },
                        { label: "MTTI Navy", val: "navy" },
                        { label: "Gold Accent", val: "amber" },
                        { label: "Clean White", val: "white" },
                      ].map(h => (
                        <button
                          key={h.val}
                          type="button"
                          onClick={() => handleUpdateTableStyle({ headerBg: h.val as any })}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition ${
                            tableStyle.headerBg === h.val
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateTableStyle({
                        borderWidth: "1px",
                        borderColor: "#000000",
                        borderStyle: "solid",
                        paddingDensity: "normal",
                        headerBg: "gray",
                      });
                      toast.info("Reset to MTTI default 1px black borders.");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Reset to Default 1px Black
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTableSettingsOpen(false);
                      toast.success("Table formatting applied.");
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 shadow-sm"
                  >
                    Apply & Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- Modal: Edit Skill & Benchmark Criteria --- */}
        <AnimatePresence>
          {isEditCriteriaModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Edit Skill, Elements & Benchmark Criteria</h3>
                    <p className="text-xs text-muted-foreground">{activePlan?.unitTitle} ({activePlan?.unitCode})</p>
                  </div>
                  <button onClick={() => setIsEditCriteriaModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveCriteria} className="p-6 space-y-6 flex-1 overflow-y-auto">
                  {/* Skill or Job Task */}
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1">
                      Skill or Job Task Description
                    </label>
                    <textarea
                      rows={3}
                      value={criteriaFormSkill}
                      onChange={e => setCriteriaFormSkill(e.target.value)}
                      placeholder="State the core occupational task or competence required..."
                      className="w-full bg-background border border-border rounded-lg p-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                      required
                    />
                  </div>

                  {/* Elements of Competence & Criteria */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Elements of Competence & Benchmark Criteria ({criteriaFormElements.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddElement}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Element
                      </button>
                    </div>

                    {criteriaFormElements.map((el, elIdx) => (
                      <div key={elIdx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                              Element {elIdx + 1} Title
                            </label>
                            <input
                              type="text"
                              value={el.title}
                              onChange={e => {
                                const copy = [...criteriaFormElements];
                                copy[elIdx].title = e.target.value;
                                setCriteriaFormElements(copy);
                              }}
                              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteElement(elIdx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition mt-5"
                            title="Delete Element"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Performance Criteria lines */}
                        <div className="pl-4 space-y-2 border-l-2 border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Performance Criteria:</span>
                            <button
                              type="button"
                              onClick={() => handleAddCriterion(elIdx)}
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Plus className="w-3 h-3" /> Add Criterion
                            </button>
                          </div>

                          {el.performanceCriteria.map((pc, pcIdx) => (
                            <div key={pcIdx} className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-muted-foreground w-6 text-right">
                                {String.fromCharCode(97 + pcIdx)}.
                              </span>
                              <input
                                type="text"
                                value={cleanCriterionText(pc)}
                                onChange={e => {
                                  const copy = [...criteriaFormElements];
                                  copy[elIdx].performanceCriteria[pcIdx] = e.target.value;
                                  setCriteriaFormElements(copy);
                                }}
                                className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Describe performance criterion..."
                                required
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteCriterion(elIdx, pcIdx)}
                                className="p-1 text-muted-foreground hover:text-red-500 rounded"
                                title="Remove Criterion"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border sticky bottom-0 bg-card py-2">
                    <button
                      type="button"
                      onClick={() => setIsEditCriteriaModalOpen(false)}
                      className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 shadow-sm"
                    >
                      Save Task & Criteria
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </TrainerLayout>
  );
}
