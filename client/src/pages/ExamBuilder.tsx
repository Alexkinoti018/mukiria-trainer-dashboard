/**
 * Exam Builder Engine
 * Design: Institutional Glassmorphism
 * Create, edit, and manage standardized JSON assessment payloads
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Code,
  BookOpen,
  Download,
  Library,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { AssessmentMarksSheet } from "@/components/AssessmentMarksSheet";
import { useExam } from "@/contexts/ExamContext";
import type { Exam, ExamPayload, ExamQuestion } from "@/lib/supabase";
import { getCurriculumUnits, CurriculumUnit } from "@/lib/curriculumDatabase";
import { toast } from "sonner";
import { nanoid } from "nanoid";

const getLevelFromUnitCode = (code: string): number => {
  const match = code.match(/\/(\d)\//);
  if (match) return parseInt(match[1], 10);
  const parts = code.split("/");
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num) && num >= 3 && num <= 8) return num;
  }
  return 6;
};

const validateExamCompliance = (level: number, payload: ExamPayload): string[] => {
  const errors: string[] = [];

  if (payload.type === "practical") {
    const checklistCount = (payload as any).checklist_items?.length || 0;
    if (checklistCount < 10 || checklistCount > 25) {
      errors.push(`Practical Observation Checklist must contain between 10 and 25 items (currently: ${checklistCount}).`);
    }
    return errors;
  }

  const sectionAQuestions = payload.section_a?.questions || [];
  const sectionBQuestions = payload.section_b?.questions || [];
  const sectionATotal = sectionAQuestions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const sectionBTotal = sectionBQuestions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const overallTotal = sectionATotal + sectionBTotal;

  if (level === 3) {
    if (sectionATotal !== 20) errors.push(`Level 3 Section A must total exactly 20 marks (currently: ${sectionATotal}).`);
    if (sectionBTotal !== 30) errors.push(`Level 3 Section B must total exactly 30 marks (currently: ${sectionBTotal}).`);
    if (overallTotal !== 50) errors.push(`Level 3 Total marks must be exactly 50 (currently: ${overallTotal}).`);

    const invalidSectionB = sectionBQuestions.filter((q: ExamQuestion) => (q as any).type !== "short_answer");
    if (invalidSectionB.length > 0) {
      errors.push("Level 3 Section B must contain only Short Answer questions.");
    }
  } else if (level === 4) {
    if (sectionATotal !== 10) errors.push(`Level 4 Section A must total exactly 10 marks (currently: ${sectionATotal}).`);
    if (sectionBTotal !== 40) errors.push(`Level 4 Section B must total exactly 40 marks (currently: ${sectionBTotal}).`);
    if (overallTotal !== 50) errors.push(`Level 4 Total marks must be exactly 50 (currently: ${overallTotal}).`);

    const nonMCQInA = sectionAQuestions.filter((q: ExamQuestion) => (q as any).type !== "mcq");
    if (nonMCQInA.length > 0) {
      errors.push("Level 4 Section A must contain strictly Multiple Choice Questions (MCQs).");
    }

    const hasProhibitedTypes = [...sectionAQuestions, ...sectionBQuestions].some(
      (q: ExamQuestion) => (q as any).type === "true_false" || (q as any).type === "matching"
    );
    if (hasProhibitedTypes) {
      errors.push("CRITICAL: True/False and Matching questions are strictly prohibited for Level 4 written assessments.");
    }
  } else if (level === 5 || level === 6) {
    if (sectionATotal !== 40) errors.push(`Level ${level} Section A must total exactly 40 marks (currently: ${sectionATotal}).`);
    if (sectionBTotal !== 60 && sectionBTotal !== 80) {
      errors.push(`Level ${level} Section B must total 60 marks (3 questions of 20m) or 80 marks (4 questions of 20m for 'Choose 3 of 4'). Currently: ${sectionBTotal}.`);
    }

    const nonShortAnswerInA = sectionAQuestions.filter((q: ExamQuestion) => (q as any).type !== "short_answer");
    if (nonShortAnswerInA.length > 0) {
      errors.push(`Level ${level} Section A must contain ONLY Short Answer questions.`);
    }

    const nonEssayInB = sectionBQuestions.filter(
      (q: ExamQuestion) => (q as any).type !== "essay" && (q as any).type !== "short_answer"
    );
    if (nonEssayInB.length > 0) {
      errors.push(`Level ${level} Section B must contain only Extended Essay / Structured questions.`);
    }
  }

  const unmappedQuestions = [
    ...sectionAQuestions.map((q, idx) => ({ q, label: `Section A Q${idx + 1}` })),
    ...sectionBQuestions.map((q, idx) => ({ q, label: `Section B Q${idx + 1}` })),
  ].filter((item) => !item.q.critical_aspect || !item.q.critical_aspect.trim());

  if (unmappedQuestions.length > 0) {
    errors.push(`Missing CDACC "Critical Aspect" mapping for: ${unmappedQuestions.map((i) => i.label).join(", ")}.`);
  }

  return errors;
};

const EMPTY_QUESTION = (): ExamQuestion => ({
  id: nanoid(8),
  text: "",
  type: "mcq",
  options: ["", "", "", ""],
  correct_answer: 0,
  marks: 2,
  critical_aspect: "",
});

const EMPTY_PAYLOAD = (): ExamPayload => ({
  title: "",
  duration_minutes: 90,
  total_marks: 100,
  instructions: "Answer ALL questions in Section A and ANY TWO questions in Section B.",
  section_a: {
    title: "Section A — Multiple Choice Questions",
    instructions: "Each question carries 2 marks. Circle the correct answer.",
    total_marks: 40,
    questions: [EMPTY_QUESTION()],
  },
  section_b: {
    title: "Section B — Structured Questions",
    instructions: "Answer ANY TWO questions. Each question carries 30 marks.",
    total_marks: 60,
    questions: [
      {
        id: nanoid(8),
        text: "",
        type: "short_answer",
        correct_answer: "",
        marks: 30,
      },
    ],
  },
});

export default function ExamBuilder() {
  const [activeTab, setActiveTab] = useState<"builder" | "marks">("builder");
  const { exams, addExam } = useExam();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [unitCode, setUnitCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [series, setSeries] = useState("");
  const [payload, setPayload] = useState<ExamPayload>(EMPTY_PAYLOAD());
  const [expandedSection, setExpandedSection] = useState<"a" | "b" | null>("a");
  const [questionBank, setQuestionBank] = useState<ExamQuestion[]>([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [repoUnits, setRepoUnits] = useState<CurriculumUnit[]>([]);
  const [selectedRepoCode, setSelectedRepoCode] = useState("");

  useEffect(() => {
    getCurriculumUnits().then(units => {
      setRepoUnits(units);
      if (units.length > 0 && !selectedRepoCode) {
        setSelectedRepoCode(units[0].unit_code);
      }
    });

    const saved = localStorage.getItem("selected_curriculum_unit");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.unit_code || u.unit_title)) {
          setSelectedRepoCode(u.unit_code);
          handleCompileFromUnit(u, false);
          localStorage.removeItem("selected_curriculum_unit");
        }
      } catch (e) {}
    }
  }, []);

  const handleCompileFromUnit = async (u: CurriculumUnit, isPractical: boolean = false) => {
    setGeneratingAi(true);
    try {
      const topics: string[] = [];
      for (const lo of u.learning_outcomes || []) {
        topics.push(...(lo.content || []));
      }
      const outcomes = (u.learning_outcomes || []).map((o: any) => o.title);

      const genResp = await fetch("http://localhost:8000/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: u.unit_code,
          course_name: u.course || u.unit_title,
          level: u.level || 6,
          topics: topics.slice(0, 8),
          outcomes: outcomes,
          is_practical: isPractical,
        }),
      });
      const genResult = await genResp.json();
      if (!genResult.success) {
        throw new Error(genResult.error || "Failed to generate exam blueprint");
      }

      setUnitCode(genResult.unit_code);
      setCourseName(genResult.course_name);
      setUnitName(u.unit_title || "");
      setClassCode(u.department?.includes("Civil") ? "CE6/M/S/24" : u.department?.includes("Survey") ? "LS6/M/24" : "ITECH6/M/24");
      setSeries("MAY-AUG 2026");
      setPayload(genResult.payload);
      setIsCreating(true);
      toast.success(`${isPractical ? "Practical Performance" : "Cognitive Theory"} Draft Compiled for ${u.unit_title}!`);
    } catch (err: any) {
      toast.error("Compilation Failed", { description: err.message });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAiGenerate = async (isPractical: boolean = false) => {
    if (!aiFile) {
      toast.error("Please select a Word document first");
      return;
    }
    setGeneratingAi(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(aiFile);
      reader.onload = async () => {
        try {
          const base64Str = (reader.result as string).split(",")[1];
          const parseResp = await fetch("http://localhost:8000/api/parse-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_data: base64Str }),
          });
          const parseResult = await parseResp.json();
          if (!parseResult.success) {
            throw new Error(parseResult.error || "Failed to parse document");
          }

          const parsedCourseName = parseResult.course_name || (parseResult.class_code + " - " + (parseResult.topics[0] || "Course"));

          const genResp = await fetch("http://localhost:8000/api/generate-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unit_code: parseResult.unit_code,
              course_name: parsedCourseName,
              level: parseResult.level,
              topics: parseResult.topics,
              outcomes: parseResult.outcomes,
              is_practical: isPractical,
            }),
          });
          const genResult = await genResp.json();
          if (!genResult.success) {
            throw new Error(genResult.error || "Failed to generate exam");
          }

          setUnitCode(genResult.unit_code);
          setCourseName(genResult.course_name);
          setUnitName(parseResult.unit_name || "");
          setClassCode(parseResult.class_code || "");
          setSeries(parseResult.series || "");
          setPayload(genResult.payload);

          if (parseResult.warnings && parseResult.warnings.length > 0) {
            toast.warning("Draft Compiled with Warnings", {
              description: parseResult.warnings.join(" "),
            });
          } else {
            toast.success("AI Exam Draft Compiled Successfully!");
          }
        } catch (err: any) {
          toast.error("AI Generation Failed", { description: err.message });
        } finally {
          setGeneratingAi(false);
        }
      };
    } catch (err: any) {
      toast.error("File Read Failed", { description: err.message });
      setGeneratingAi(false);
    }
  };

  const [exportingDocx, setExportingDocx] = useState(false);

  const exportExamAsDocx = async () => {
    setExportingDocx(true);
    try {
      const resp = await fetch("http://localhost:8000/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_code: unitCode || "COMP-204",
          course_name: courseName || "Software Engineering",
          unit_name: unitName,
          class_code: classCode,
          series,
          payload,
        }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate Word document");
      }

      const binaryString = window.atob(data.file_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Word Document Exported", { description: data.filename });
    } catch (err: any) {
      toast.error("Export Failed", { description: err.message });
    } finally {
      setExportingDocx(false);
    }
  };

  const unitLevel = getLevelFromUnitCode(unitCode);
  const liveComplianceErrors = validateExamCompliance(unitLevel, payload);

  useEffect(() => {
    if (!isCreating || !payload.title) return;
    setIsSavingDraft(true);
    const timer = setTimeout(() => {
      setIsSavingDraft(false);
      setLastSaved(new Date());
    }, 1500);
    return () => clearTimeout(timer);
  }, [payload, unitCode, courseName, unitName, classCode, series, isCreating]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isCreating) saveExam();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (isCreating) exportExamAsDocx();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [payload, unitCode, courseName, unitName, classCode, series, isCreating]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const startNew = () => {
    setActiveExam(null);
    setUnitCode("");
    setCourseName("");
    setPayload(EMPTY_PAYLOAD());
    setIsCreating(true);
    setExpandedSection("a");
  };

  const editExam = (exam: Exam) => {
    setActiveExam(exam);
    setUnitCode(exam.unit_code);
    setCourseName(exam.course_name);
    setPayload(exam.payload);
    setIsCreating(true);
    setExpandedSection("a");
  };

  const saveExam = async () => {
    if (!unitCode.trim() || !courseName.trim() || !payload.title.trim()) {
      toast.error("Validation Error", { description: "Unit code, course name, and exam title are required." });
      return;
    }

    let updatedPayload = { ...payload };

    if (payload.type !== "practical") {
      const sectionATotal = payload.section_a?.questions.reduce((s, q) => s + q.marks, 0) || 0;
      const sectionBTotal = payload.section_b?.questions.reduce((s, q) => s + q.marks, 0) || 0;
      updatedPayload = {
        ...payload,
        section_a: { ...payload.section_a!, total_marks: sectionATotal },
        section_b: { ...payload.section_b!, total_marks: sectionBTotal },
        total_marks: sectionATotal + sectionBTotal,
      };
    }

    const level = getLevelFromUnitCode(unitCode);
    const complianceErrors = validateExamCompliance(level, updatedPayload);
    if (complianceErrors.length > 0) {
      toast.error("CDACC Compliance Blocked", {
        description: `Saving blocked. Fix compliance issues:\n${complianceErrors.map((e) => `• ${e}`).join("\n")}`,
        duration: 8000,
      });
      return;
    }

    setSaving(true);
    try {
      addExam({
        unit_code: unitCode.toUpperCase(),
        course_name: courseName,
        payload: updatedPayload,
      });

      toast.success(activeExam ? "Exam Updated" : "Exam Created", { description: `${unitCode} exam payload saved to global state.` });

      setIsCreating(false);
      console.log("✅ [MTTI Exam Builder] Exam saved:", unitCode);
    } catch (err: any) {
      console.error("❌ [MTTI Exam Builder] Save error:", err);
      toast.error("Save Failed", { description: err.message ?? "Could not save exam." });
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (_exam: Exam) => {
    toast.info("Exam deletion disabled in demo mode.");
  };

  const duplicateExam = (exam: Exam) => {
    setActiveExam(null);
    setUnitCode(`${exam.unit_code}-COPY`);
    setCourseName(exam.course_name);
    setPayload(exam.payload);
    setIsCreating(true);
    setExpandedSection("a");
    toast.success("Exam Duplicated", { description: "Edit and save as a new exam" });
    console.log("✅ [MTTI Exam Builder] Duplicated exam:", exam.unit_code);
  };

  const exportExamAsJSON = (exam: Exam) => {
    const dataStr = JSON.stringify(exam, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exam.unit_code}-exam-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exam Exported", { description: `${exam.unit_code} exported as JSON` });
  };

  const updateQuestion = (section: "a" | "b", idx: number, updates: Partial<ExamQuestion>) => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const prevAny = prev as any;
      const sec = prevAny[key] || { questions: [] };
      const questions = [...(sec.questions || [])];
      questions[idx] = { ...questions[idx], ...updates };
      return { ...prev, [key]: { ...sec, questions } };
    });
  };

  const addQuestion = (section: "a" | "b") => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const prevAny = prev as any;
      const sec = prevAny[key] || { questions: [] };
      const newQ: ExamQuestion =
        section === "a"
          ? EMPTY_QUESTION()
          : { id: nanoid(8), text: "", type: "short_answer", correct_answer: "", marks: 30, critical_aspect: "" };
      return { ...prev, [key]: { ...sec, questions: [...(sec.questions || []), newQ] } };
    });
  };

  const removeQuestion = (section: "a" | "b", idx: number) => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const prevAny = prev as any;
      const sec = prevAny[key] || { questions: [] };
      const questions = (sec.questions || []).filter((_: any, i: number) => i !== idx);
      return { ...prev, [key]: { ...sec, questions } };
    });
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify({ unit_code: unitCode, course_name: courseName, payload }, null, 2));
    toast.success("JSON Copied to Clipboard");
  };

  return (
    <TrainerLayout title="Exam Builder & Assessment" subtitle="Create and manage standardized assessment payloads and marks">
      
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border mb-6 px-1">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "builder"
              ? "border-[#c48820] text-[#000953] dark:text-[#f8fafc]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Exam Builder
        </button>
        <button
          onClick={() => setActiveTab("marks")}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === "marks"
              ? "border-[#c48820] text-[#000953] dark:text-[#f8fafc]"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Assessment Marks
        </button>
      </div>

      {activeTab === "builder" ? (
        <div className="flex gap-6 h-[calc(100%-4rem)]">
        {/* Left: Exam List */}
        <div className="w-72 shrink-0 space-y-3">
          <button
            onClick={startNew}
            className="btn-emerald w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            New Exam
          </button>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "oklch(1 0 0 / 0.05)" }} />
            ))
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="glass-card p-4 cursor-pointer"
                  style={{
                    border: activeExam?.id === exam.id
                      ? "1px solid oklch(0.72 0.18 160 / 0.5)"
                      : undefined,
                  }}
                  onClick={() => editExam(exam)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className="text-sm font-bold truncate"
                        style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
                      >
                        {exam.unit_code}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: "oklch(0.50 0.010 240)" }}>
                        {exam.course_name}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>
                          {exam.payload.total_marks} marks
                        </span>
                        <span className="text-xs" style={{ color: "oklch(0.45 0.010 240)" }}>
                          {exam.payload.duration_minutes}min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteExam(exam); }}
                      className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: "oklch(0.65 0.22 25)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="flex-1 min-w-0">
          {!isCreating ? (
            <div className="glass-card h-64 flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-10 h-10 opacity-20" style={{ color: "oklch(0.72 0.18 160)" }} />
              <p className="text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
                Select an exam to edit or create a new one
              </p>
              <button onClick={startNew} className="btn-emerald flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
                <Plus className="w-4 h-4" /> Create First Exam
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center justify-center space-y-3 mb-6 mt-2">
                <img src="/mtti-logo.jpg" alt="Mukiria TTI Logo" className="w-20 h-20 object-contain" />
                <h2 className="font-bold text-center" style={{ fontFamily: "Maiandra GD, sans-serif", color: "oklch(0.95 0.005 240)" }}>
                  MUKIRIA TECHNICAL TRAINING INSTITUTE
                </h2>
              </div>
              
              {/* CDACC Compliance Status Banner */}
              <div
                className="p-4 rounded-xl backdrop-blur-xl flex flex-col gap-2 transition-all duration-300 animate-fade-in"
                style={{
                  background: liveComplianceErrors.length === 0 
                    ? "oklch(0.72 0.18 160 / 0.08)" 
                    : "oklch(0.65 0.22 25 / 0.08)",
                  border: liveComplianceErrors.length === 0 
                    ? "1px solid oklch(0.72 0.18 160 / 0.2)" 
                    : "1px solid oklch(0.65 0.22 25 / 0.2)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {liveComplianceErrors.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5 animate-pulse" style={{ color: "oklch(0.72 0.18 160)" }} />
                    ) : (
                      <AlertCircle className="w-5 h-5" style={{ color: "oklch(0.65 0.22 25)" }} />
                    )}
                    <span className="font-sans font-bold text-sm" style={{ color: "oklch(0.95 0.005 240)" }}>
                      CDACC Compliance Monitor (KNQF Level {unitLevel})
                    </span>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      background: liveComplianceErrors.length === 0 
                        ? "oklch(0.72 0.18 160 / 0.2)" 
                        : "oklch(0.65 0.22 25 / 0.2)",
                      color: liveComplianceErrors.length === 0 
                        ? "oklch(0.72 0.18 160)" 
                        : "oklch(0.65 0.22 25)",
                    }}
                  >
                    {liveComplianceErrors.length === 0 ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>
                
                {liveComplianceErrors.length > 0 && (
                  <ul className="text-xs space-y-1 mt-1 font-sans" style={{ color: "oklch(0.85 0.01 240)" }}>
                    {liveComplianceErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span style={{ color: "oklch(0.65 0.22 25)" }}>•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* AI-Assisted Ingestion Panel */}
              {!activeExam && (
                <div className="glass-card p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Library className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    <span className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                      AI Exam Creator (Upload Curriculum / Session Plan)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Upload a Word document (.docx) containing your curriculum mapping, topics, or outcomes. The AI engine will parse the document, enforce CDACC compliance criteria, and auto-build your exam blueprint.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".docx"
                      onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-850"
                    />
                    <button
                      onClick={() => handleAiGenerate(false)}
                      disabled={generatingAi || !aiFile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 hover:brightness-110"
                      style={{
                        background: "var(--accent)",
                        color: "#ffffff"
                      }}
                    >
                      {generatingAi ? "Parsing..." : "Compile Exam Draft"}
                    </button>
                    <button
                      onClick={() => handleAiGenerate(true)}
                      disabled={generatingAi || !aiFile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 hover:brightness-110"
                      style={{
                        background: "oklch(0.65 0.15 200)",
                        color: "#ffffff"
                      }}
                    >
                      {generatingAi ? "Parsing..." : "Compile Practical Draft"}
                    </button>
                  </div>

                  {/* Institutional CDACC Repository (D:\Curriculum and OS) */}
                  <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Library className="w-3.5 h-3.5 text-[#c48820]" />
                      <span>Institutional CDACC Repository:</span>
                    </div>
                    <select
                      value={selectedRepoCode}
                      onChange={(e) => setSelectedRepoCode(e.target.value)}
                      className="text-xs text-slate-200 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none max-w-sm"
                    >
                      {repoUnits.map((u) => (
                        <option key={u.unit_code} value={u.unit_code}>
                          {u.unit_title} (L{u.level} - {u.unit_code})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const target = repoUnits.find(u => u.unit_code === selectedRepoCode);
                        if (target) handleCompileFromUnit(target, false);
                      }}
                      disabled={generatingAi || !selectedRepoCode}
                      className="px-3 py-1.5 bg-[#000953] hover:bg-[#000953]/80 border border-blue-400/40 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      Draft Theory (CT)
                    </button>
                    <button
                      onClick={() => {
                        const target = repoUnits.find(u => u.unit_code === selectedRepoCode);
                        if (target) handleCompileFromUnit(target, true);
                      }}
                      disabled={generatingAi || !selectedRepoCode}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      Draft Practical (CP)
                    </button>
                  </div>
                </div>
              )}

              {/* Header fields */}
              {generatingAi ? (
                <div className="space-y-4 animate-pulse">
                  <div className="glass-card p-5 space-y-4">
                    <div className="h-6 w-1/3 rounded bg-slate-800/50"></div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="h-10 rounded bg-slate-800/50"></div>
                      <div className="h-10 rounded bg-slate-800/50"></div>
                      <div className="h-10 rounded bg-slate-800/50"></div>
                    </div>
                  </div>
                  <div className="glass-card p-5 h-48 bg-slate-800/20"></div>
                  <div className="glass-card p-5 h-48 bg-slate-800/20"></div>
                </div>
              ) : (
                <>
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
                    {activeExam ? "Edit Exam" : "New Exam"}
                    {isSavingDraft ? (
                      <span className="text-[10px] text-slate-400 font-normal animate-pulse flex items-center gap-1">☁️ Saving draft...</span>
                    ) : lastSaved ? (
                      <span className="text-[10px] text-emerald-500 font-normal flex items-center gap-1">✅ Saved {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowJson(!showJson)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.65 0.15 200)" }}
                    >
                      <Code className="w-3.5 h-3.5" />
                      {showJson ? "Hide" : "View"} JSON
                    </button>
                    <button
                      onClick={copyJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.58 0.012 240)" }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={() => setShowQuestionBank(!showQuestionBank)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.65 0.15 200)" }}
                      title="Open question bank"
                    >
                      <Library className="w-3.5 h-3.5" />
                      Bank ({questionBank.length})
                    </button>
                    {activeExam && (
                      <>
                        <button
                          onClick={() => duplicateExam(activeExam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.65 0.15 200)" }}
                          title="Clone this exam"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => exportExamAsJSON(activeExam)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.72 0.18 160)" }}
                          title="Export as JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export
                        </button>
                      </>
                    )}
                    <button
                      onClick={exportExamAsDocx}
                      disabled={exportingDocx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:brightness-110"
                      style={{ background: "var(--accent)", color: "#ffffff" }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {exportingDocx ? "Exporting..." : "Export Word"}
                    </button>
                    <button
                      onClick={saveExam}
                      disabled={saving}
                      className="btn-emerald flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "Saving..." : "Save Exam"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Course Name (Optional)
                    </label>
                    <input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. ICT TECHNICIAN LEVEL 6"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Course Code (Unit Code) *
                    </label>
                    <input
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 061006T91CT"
                      disabled={!!activeExam}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Unit Name (Optional)
                    </label>
                    <input
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="e.g. ENVIRONMENTAL STUDIES"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Class (Optional)
                    </label>
                    <input
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="e.g. ITECH6/M/24"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Series (Optional)
                    </label>
                    <input
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="e.g. Jan./April 2026"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Exam Title *
                    </label>
                    <input
                      value={payload.title}
                      onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Computer Science — CAT 1"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={payload.duration_minutes}
                      onChange={(e) => setPayload((p) => ({ ...p, duration_minutes: +e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      General Instructions
                    </label>
                    <textarea
                      value={payload.instructions}
                      onChange={(e) => setPayload((p) => ({ ...p, instructions: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.10)",
                        color: "oklch(0.94 0.005 240)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* JSON Preview */}
              <AnimatePresence>
                {showJson && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-4 overflow-auto max-h-64"
                  >
                    <pre className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>
                      {JSON.stringify({ unit_code: unitCode, course_name: courseName, payload }, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Practical Assessment Layout */}
              {payload.type === "practical" ? (
                <div className="glass-card p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Library className="w-5 h-5" style={{ color: "var(--accent)" }} />
                    <span className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                      Practical Assessment Layout (Read-Only Preview)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    This practical assessment has been generated and configured by the AI. The exported Word document will contain the Project Brief, Tasks, and Tabular Grading Rubrics.
                  </p>
                  
                  <div className="mt-4 p-4 rounded-xl space-y-3" style={{ background: "oklch(1 0 0 / 0.04)" }}>
                    <div>
                      <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.15 200)" }}>Project Brief: </span>
                      <span className="text-xs" style={{ color: "oklch(0.94 0.005 240)" }}>{payload.project_brief}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.15 200)" }}>Elements Covered: </span>
                      <span className="text-xs" style={{ color: "oklch(0.94 0.005 240)" }}>{payload.elements_covered?.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.15 200)" }}>Tasks: </span>
                      <span className="text-xs" style={{ color: "oklch(0.94 0.005 240)" }}>{payload.tasks?.length} Generated</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.15 200)" }}>Rubric Categories: </span>
                      <span className="text-xs" style={{ color: "oklch(0.94 0.005 240)" }}>{payload.rubric?.length} Generated</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Section A */}
                  <SectionEditor
                    section="a"
                    title="Section A — Multiple Choice"
                    questions={payload.section_a?.questions || []}
                    sectionInstructions={payload.section_a?.instructions || ""}
                    expanded={expandedSection === "a"}
                    onToggle={() => setExpandedSection(expandedSection === "a" ? null : "a")}
                    onUpdateQuestion={(idx, updates) => updateQuestion("a", idx, updates)}
                    onAddQuestion={() => addQuestion("a")}
                    onRemoveQuestion={(idx) => removeQuestion("a", idx)}
                    onInstructionsChange={(v) =>
                      setPayload((p) => ({ ...p, section_a: { ...p.section_a!, instructions: v } }))
                    }
                    unitLevel={getLevelFromUnitCode(unitCode)}
                  />

                  {/* Section B */}
                  <SectionEditor
                    section="b"
                    title="Section B — Structured Questions"
                    questions={payload.section_b?.questions || []}
                    sectionInstructions={payload.section_b?.instructions || ""}
                    expanded={expandedSection === "b"}
                    onToggle={() => setExpandedSection(expandedSection === "b" ? null : "b")}
                    onUpdateQuestion={(idx, updates) => updateQuestion("b", idx, updates)}
                    onAddQuestion={() => addQuestion("b")}
                    onRemoveQuestion={(idx) => removeQuestion("b", idx)}
                    onInstructionsChange={(v) =>
                      setPayload((p) => ({ ...p, section_b: { ...p.section_b!, instructions: v } }))
                    }
                    unitLevel={getLevelFromUnitCode(unitCode)}
                  />
                </>
              )}
            </>
            )}
            </motion.div>
          )}
        </div>
      </div>
      ) : (
        <div className="w-full h-[calc(100%-4rem)] overflow-y-auto">
          <AssessmentMarksSheet />
        </div>
      )}
    </TrainerLayout>
  );
}

// ─── Section Editor Component ─────────────────────────────────

interface SectionEditorProps {
  section: "a" | "b";
  title: string;
  questions: ExamQuestion[];
  sectionInstructions: string;
  expanded: boolean;
  onToggle: () => void;
  onUpdateQuestion: (idx: number, updates: Partial<ExamQuestion>) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (idx: number) => void;
  onInstructionsChange: (v: string) => void;
  unitLevel: number;
}

function SectionEditor({
  section,
  title,
  questions,
  sectionInstructions,
  expanded,
  onToggle,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onInstructionsChange,
  unitLevel,
}: SectionEditorProps) {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left sticky top-0 z-10 backdrop-blur-xl"
        style={{ borderBottom: expanded ? "1px solid oklch(1 0 0 / 0.08)" : undefined, background: "rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: "oklch(0.72 0.18 160 / 0.15)",
              color: "oklch(0.72 0.18 160)",
              fontFamily: "Syne, sans-serif",
            }}
          >
            {section.toUpperCase()}
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
            {title}
          </span>
          <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>
            {questions.length} questions · {totalMarks} marks
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: "oklch(0.58 0.012 240)" }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.58 0.012 240)" }} />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                  Section Instructions
                </label>
                <textarea
                  value={sectionInstructions}
                  onChange={(e) => onInstructionsChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>

              {questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  index={idx}
                  section={section}
                  onUpdate={(updates) => onUpdateQuestion(idx, updates)}
                  onRemove={() => onRemoveQuestion(idx)}
                  canRemove={questions.length > 1}
                  unitLevel={unitLevel}
                />
              ))}

              <button
                onClick={onAddQuestion}
                className="w-full py-2.5 rounded-xl border-dashed border text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
                style={{
                  borderColor: "oklch(0.72 0.18 160 / 0.4)",
                  color: "oklch(0.72 0.18 160)",
                  background: "oklch(0.72 0.18 160 / 0.05)",
                }}
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Question Editor Component ────────────────────────────────

interface QuestionEditorProps {
  question: ExamQuestion;
  index: number;
  section: "a" | "b";
  onUpdate: (updates: Partial<ExamQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
  unitLevel: number;
}

function QuestionEditor({ question, index, section, onUpdate, onRemove, canRemove, unitLevel }: QuestionEditorProps) {
  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{
        background: "oklch(1 0 0 / 0.04)",
        border: "1px solid oklch(1 0 0 / 0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "oklch(0.72 0.18 160)" }}
        >
          Q{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {unitLevel >= 4 && question.type === "true_false" && (
            <span className="text-[10px] text-red-500 font-bold">⚠️ Level {unitLevel} CDACC prohibits True/False</span>
          )}
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as ExamQuestion["type"] })}
            className="text-xs px-2 py-1 rounded-lg"
            style={{
              background: "oklch(1 0 0 / 0.08)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              color: "oklch(0.80 0.008 240)",
            }}
          >
            {unitLevel < 5 && <option value="mcq">MCQ</option>}
            <option value="short_answer">Short Answer</option>
            {unitLevel < 4 && <option value="true_false">True/False</option>}
          </select>
          <input
            type="number"
            value={question.marks}
            onChange={(e) => onUpdate({ marks: +e.target.value })}
            className="w-16 text-xs px-2 py-1 rounded-lg font-mono text-center"
            style={{
              background: "oklch(1 0 0 / 0.08)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              color: "oklch(0.72 0.18 160)",
            }}
            min={1}
          />
          <span className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>marks</span>
          {canRemove && (
            <button onClick={onRemove} style={{ color: "oklch(0.65 0.22 25 / 0.7)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder={`Question ${index + 1} text...`}
        rows={2}
        className="w-full px-3 py-2 rounded-lg text-sm resize-none"
        style={{
          background: "oklch(1 0 0 / 0.06)",
          border: "1px solid oklch(1 0 0 / 0.10)",
          color: "oklch(0.94 0.005 240)",
        }}
      />

      <div className="flex gap-2 items-center">
        <label className="text-[10px] uppercase font-bold tracking-wider shrink-0" style={{ color: "oklch(0.50 0.010 240)" }}>
          CDACC Critical Aspect:
        </label>
        <input
          type="text"
          value={question.critical_aspect ?? ""}
          onChange={(e) => onUpdate({ critical_aspect: e.target.value })}
          placeholder="e.g. Map to performance criterion 2.1..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg"
          style={{
            background: "oklch(1 0 0 / 0.05)",
            border: "1px solid oklch(1 0 0 / 0.08)",
            color: "oklch(0.94 0.005 240)",
          }}
        />
      </div>

      {question.type === "mcq" && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
            Options (click radio to set correct answer):
          </p>
          {(question.options ?? ["", "", "", ""]).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correct_answer === oi}
                onChange={() => onUpdate({ correct_answer: oi })}
                className="accent-emerald-500"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const opts = [...(question.options ?? [])];
                  opts[oi] = e.target.value;
                  onUpdate({ options: opts });
                }}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className="flex-1 px-2 py-1.5 rounded-lg text-sm"
                style={{
                  background: question.correct_answer === oi ? "oklch(0.72 0.18 160 / 0.1)" : "oklch(1 0 0 / 0.05)",
                  border: question.correct_answer === oi
                    ? "1px solid oklch(0.72 0.18 160 / 0.4)"
                    : "1px solid oklch(1 0 0 / 0.08)",
                  color: "oklch(0.94 0.005 240)",
                }}
              />
              {question.correct_answer === oi && (
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "oklch(0.72 0.18 160)" }} />
              )}
            </div>
          ))}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="flex gap-3">
          {["True", "False"].map((opt, oi) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tf-${question.id}`}
                checked={question.correct_answer === oi}
                onChange={() => onUpdate({ correct_answer: oi })}
              />
              <span className="text-sm" style={{ color: "oklch(0.80 0.008 240)" }}>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "short_answer" && (
        <div>
          <label className="block text-xs mb-1" style={{ color: "oklch(0.50 0.010 240)" }}>
            Model Answer / Marking Guide (for trainer reference):
          </label>
          <textarea
            value={question.correct_answer as string}
            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
            placeholder="Key points to award marks..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              background: "oklch(0.72 0.18 160 / 0.05)",
              border: "1px solid oklch(0.72 0.18 160 / 0.2)",
              color: "oklch(0.80 0.008 240)",
            }}
          />
        </div>
      )}
    </div>
  );
}

