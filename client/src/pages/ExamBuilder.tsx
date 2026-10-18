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
  Calendar,
  Clock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Users,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { AssessmentMarksSheet } from "@/components/AssessmentMarksSheet";
import { useExam } from "@/contexts/ExamContext";
import {
  evaluateExamPortalAvailability,
  type AssessmentCategory,
  type Exam,
  type ExamPayload,
  type ExamQuestion,
} from "@/lib/supabase";
import { getCurriculumUnits, CurriculumUnit } from "@/lib/curriculumDatabase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { EXAM_THEME_TOKENS } from "@/lib/examThemeTokens";
import { exportExamDocumentClientSide } from "@/lib/exportExamWord";

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

  if (payload.assessment_category === "CAT" || payload.task_code?.startsWith("CAT")) {
    if (sectionATotal < 15 || sectionATotal > 30) {
      errors.push(`Continuous Assessment Test (CAT) must total between 15 and 30 marks (currently: ${sectionATotal}).`);
    }
    if (sectionBQuestions.length > 0) {
      errors.push("Continuous Assessment Tests (CATs) must not have Section B questions.");
    }
    return errors;
  }

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
  portal_visible: false,
  assessment_category: "CAT",
  task_code: "CT1",
  available_from: "",
  due_at: "",
  late_submission_policy: "strict_lock",
  max_attempts: 1,
  release_results_mode: "after_trainer_grading",
  proctoring_required: true,
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
  const { exams, addExam, updateExamSchedule } = useExam();
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

  const synthesizeBlueprintFromUnit = (u: CurriculumUnit, isPractical: boolean = false): ExamPayload => {
    const outcomes = (u.learning_outcomes || []).map((o: any) => o.title || String(o));

    const secAQuestions: ExamQuestion[] = outcomes.slice(0, 5).map((outcome, idx) => ({
      id: `q-a-${idx + 1}`,
      q_num: idx + 1,
      type: "short_answer",
      text: `State and explain two key industrial requirements or principles related to ${outcome.toLowerCase().replace(/^(demonstrate|apply|perform|describe|explain)\s+/i, "")}.`,
      marks: 4,
      critical_aspect: "2 marks for clear identification; 2 marks for practical industrial application context.",
      correct_answer: `Identification of core requirements aligned with ${outcome}. Appropriate technical explanation in accordance with CDACC standards.`
    }));

    const secBQuestions: ExamQuestion[] = outcomes.slice(0, 3).map((outcome, idx) => ({
      id: `q-b-${idx + 1}`,
      q_num: idx + 6,
      type: "structured",
      text: isPractical
        ? `You are assigned to carry out an industrial task on "${outcome}". Detail the step-by-step procedure, required safety PPE, tools, and quality verification checklist.`
        : `Analyze the technical framework for "${outcome}". Explain the common failure modes or errors encountered in practice and outline systematic troubleshooting methodologies to resolve them.`,
      marks: 10,
      critical_aspect: "Step-by-step methodology (4 marks), tools and safety precautions (3 marks), verification and troubleshooting (3 marks).",
      correct_answer: `Comprehensive procedural plan for ${outcome}, including risk assessment, tool preparation, execution steps, and testing verification.`
    }));

    return {
      title: `${isPractical ? "PRACTICAL PERFORMANCE" : "COGNITIVE THEORY"} CONTINUOUS ASSESSMENT TEST`,
      instructions: "Answer ALL questions in Section A and Section B. Adhere to TVET CDACC standard occupational regulations.",
      duration_minutes: isPractical ? 180 : 120,
      total_marks: 50,
      task_code: isPractical ? "CP1" : "CT1",
      assessment_category: isPractical ? "Practical" : "Exam",
      type: isPractical ? "practical" : "written",
      section_a: {
        title: "Section A: Compulsory Short Answer Questions",
        instructions: "Answer ALL questions in this section (Compulsory - 20 Marks).",
        total_marks: 20,
        questions: secAQuestions.length > 0 ? secAQuestions : [
          {
            id: "q-a-1",
            q_num: 1,
            type: "short_answer",
            text: `Explain three fundamental workshop safety and operational rules applicable to ${u.unit_title}.`,
            marks: 6,
            critical_aspect: "2 marks for each correct rule with operational justification.",
            correct_answer: "PPE compliance, proper equipment isolation, and maintaining clear workspace."
          }
        ]
      },
      section_b: {
        title: "Section B: Structured Problem-Solving Questions",
        instructions: "Answer the following structured scenario-based questions (30 Marks).",
        total_marks: 30,
        questions: secBQuestions.length > 0 ? secBQuestions : [
          {
            id: "q-b-1",
            q_num: 2,
            type: "structured",
            text: `Describe the end-to-end execution workflow for standard tasks in ${u.unit_title}, specifying tools, equipment, and verification standards.`,
            marks: 15,
            critical_aspect: "Preparation (5 marks), Execution (6 marks), Testing/Handover (4 marks).",
            correct_answer: "Structured workflow covering planning, safety, implementation, and quality verification."
          }
        ]
      }
    };
  };

  const handleCompileFromUnit = async (u: CurriculumUnit, isPractical: boolean = false) => {
    setGeneratingAi(true);
    let blueprint: ExamPayload | null = null;
    let targetUnitCode = u.unit_code;
    let targetCourseName = u.course || u.unit_title;

    try {
      const topics: string[] = [];
      for (const lo of u.learning_outcomes || []) {
        topics.push(...(lo.content || []));
      }
      const outcomes = (u.learning_outcomes || []).map((o: any) => o.title);

      const genResp = await fetch("/api/generate-exam", {
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
      if (genResp.ok) {
        const genResult = await genResp.json();
        if (genResult.success && genResult.payload) {
          blueprint = genResult.payload;
          if (genResult.unit_code) targetUnitCode = genResult.unit_code;
          if (genResult.course_name) targetCourseName = genResult.course_name;
        }
      }
    } catch {
      // Backend unavailable; fallback to client blueprint synthesizer
    }

    if (!blueprint) {
      blueprint = synthesizeBlueprintFromUnit(u, isPractical);
    }

    setUnitCode(targetUnitCode);
    setCourseName(targetCourseName);
    setUnitName(u.unit_title || "");
    setClassCode(u.department?.includes("Civil") ? "CE6/S/26" : u.department?.includes("Survey") ? "LS6/M/24" : "ITECH6/M/24");
    setSeries("MAY-AUG 2026");
    setPayload(blueprint);
    setIsCreating(true);
    toast.success(`${isPractical ? "Practical Performance" : "Cognitive Theory"} Draft Compiled for ${u.unit_title}!`);
    setGeneratingAi(false);
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
          const parseResp = await fetch("/api/parse-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_data: base64Str }),
          });
          if (!parseResp.ok) {
            throw new Error(`AI parser service unavailable (${parseResp.status}).`);
          }
          const parseResult = await parseResp.json();
          if (!parseResult.success) {
            throw new Error(parseResult.error || "Failed to parse document");
          }

          const parsedCourseName = parseResult.course_name || (parseResult.class_code + " - " + (parseResult.topics[0] || "Course"));

          const genResp = await fetch("/api/generate-exam", {
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
          if (!genResp.ok) {
            throw new Error(`AI blueprint generator unavailable (${genResp.status}).`);
          }
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
      let exported = false;

      // 1. Try server endpoint if available
      try {
        const resp = await fetch("/api/export-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit_code: unitCode || "061155101A",
            course_name: courseName || "ICT Technician Level 5",
            unit_name: unitName,
            class_code: classCode,
            series,
            payload,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.file_data) {
            const binaryString = window.atob(data.file_data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = data.filename || `MTTI_Exam_${(unitCode || "EXAM").replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
            exported = true;
            toast.success("Word Document Exported", { description: data.filename });
          }
        }
      } catch {
        // Fall back to client-side generator seamlessly
      }

      // 2. Client-side TVET CDACC Word Document generator
      if (!exported) {
        const result = exportExamDocumentClientSide({
          unitCode: unitCode || "061155101A",
          courseName: courseName || "ICT Technician Level 5",
          unitName: unitName || payload.title || "Continuous Assessment Examination",
          classCode: classCode || "ALL COHORTS",
          series: series || "MAY-AUG 2026",
          payload,
        });
        toast.success("Word Document Exported", { description: result.filename });
      }
    } catch (err: any) {
      toast.error("Export Failed", { description: err.message || "Failed to generate Word document" });
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
    setUnitName("");
    setClassCode("");
    setSeries("");
    setPayload(EMPTY_PAYLOAD());
    setIsCreating(true);
    setExpandedSection("a");
  };

  const editExam = (exam: Exam) => {
    setActiveExam(exam);
    setUnitCode(exam.unit_code);
    setCourseName(exam.course_name);
    setUnitName(exam.payload?.unit_name || "");
    setClassCode(exam.payload?.class || "");
    setSeries(exam.payload?.series || "");
    setPayload(exam.payload);
    setIsCreating(true);
    setExpandedSection("a");
  };

  const saveExam = async () => {
    if (!unitCode.trim() || !courseName.trim() || !payload.title.trim()) {
      toast.error("Validation Error", { description: "Unit code, course name, and exam title are required." });
      return;
    }

    const assignedClass = classCode.trim() || payload.class || "";
    const derivedTargetCohorts =
      payload.target_cohorts && payload.target_cohorts.length > 0
        ? payload.target_cohorts
        : assignedClass
        ? [assignedClass]
        : undefined;

    let updatedPayload = {
      ...payload,
      class: assignedClass,
      unit_name: unitName.trim() || payload.unit_name || "",
      series: series.trim() || payload.series || "",
      target_cohorts: derivedTargetCohorts,
    };

    if (payload.type !== "practical") {
      const sectionATotal = payload.section_a?.questions.reduce((s, q) => s + q.marks, 0) || 0;
      const sectionBTotal = payload.section_b?.questions.reduce((s, q) => s + q.marks, 0) || 0;
      updatedPayload = {
        ...updatedPayload,
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
        id: activeExam?.id,
        unit_code: unitCode.toUpperCase(),
        course_name: courseName,
        payload: updatedPayload,
      });

      toast.success(activeExam ? "Assessment & Schedule Updated" : "Assessment Created", {
        description: `${unitCode} published settings and payload saved.`,
      });

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
      <div className="flex gap-2 border-b border-slate-300 mb-6 px-1 print:hidden">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "builder"
              ? "border-[#000953] text-[#000953]"
              : "border-transparent text-slate-500 hover:text-[#000953]"
          }`}
        >
          Exam Builder
        </button>
        <button
          onClick={() => setActiveTab("marks")}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "marks"
              ? "border-[#000953] text-[#000953]"
              : "border-transparent text-slate-500 hover:text-[#000953]"
          }`}
        >
          Assessment Marks
        </button>
      </div>

      {activeTab === "builder" ? (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-4rem)]">
        {/* Left: Exam List */}
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#000953] hover:bg-[#000e7a] text-white transition active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#c48820]" />
            New Exam Paper
          </button>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200 border border-slate-300" />
            ))
          ) : (
            <div className="space-y-2.5">
              {exams.map((exam) => {
                const portalStatus = evaluateExamPortalAvailability(exam.payload);
                const stateBadgeClass =
                  portalStatus.state === "open"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : portalStatus.state === "scheduled"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : portalStatus.state === "past_due_open"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-300";

                return (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      activeExam?.id === exam.id
                        ? "bg-blue-50/80 border-2 border-[#000953] shadow-sm"
                        : "bg-white border-slate-300 hover:border-[#000953] hover:shadow-sm"
                    }`}
                    onClick={() => editExam(exam)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold truncate text-[#000953]">
                            {exam.unit_code}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#000953]/10 text-[#000953]">
                            {portalStatus.categoryLabel}
                            {exam.payload.task_code ? ` • ${exam.payload.task_code}` : ""}
                          </span>
                        </div>
                        <div className="text-xs truncate mt-0.5 text-slate-600 font-medium">
                          {exam.payload.title || exam.course_name}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-[#c48820] border border-amber-200">
                            {exam.payload.total_marks} marks
                          </span>
                          <span className="text-xs font-mono text-slate-500 font-medium">
                            {exam.payload.duration_minutes} min
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border truncate ${stateBadgeClass}`}>
                            {portalStatus.statusLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextVisible = exam.payload.portal_visible !== true;
                              updateExamSchedule(exam.id, { portal_visible: nextVisible });
                              if (activeExam?.id === exam.id) {
                                setPayload((p) => ({ ...p, portal_visible: nextVisible }));
                              }
                              toast.success(
                                nextVisible
                                  ? `${exam.unit_code} allocated & published to Trainee Portal`
                                  : `${exam.unit_code} unallocated (hidden) from Trainee Portal`
                              );
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 transition ${
                              portalStatus.isVisible
                                ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                : "bg-[#000953] text-white border-[#000953] hover:bg-[#000e7a]"
                            }`}
                            title={portalStatus.isVisible ? "Unallocate from Trainee Portal" : "Allocate & Publish to Trainee Portal"}
                          >
                            {portalStatus.isVisible ? (
                              <>
                                <EyeOff className="w-3 h-3" /> Unallocate
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 text-[#c48820]" /> Allocate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteExam(exam); }}
                        className="text-slate-400 hover:text-rose-600 transition-colors shrink-0 p-1"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div className="flex-1 min-w-0">
          {!isCreating ? (
            <div className="h-72 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white border border-slate-300 shadow-sm p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#000953]/10 flex items-center justify-center text-[#000953]">
                <BookOpen className="w-6 h-6 text-[#000953]" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Select an examination paper from the left list to edit or allocate, or create a new assessment paper
              </p>
              <button onClick={startNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition">
                <Plus className="w-4 h-4 text-[#c48820]" /> Create First Exam
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center justify-center space-y-2 mb-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-sm">
                <img src="/mtti-logo.jpg" alt="Mukiria TTI Logo" className="w-16 h-16 object-contain" />
                <h2 className="font-bold text-center tracking-wide text-[#000953] text-lg">
                  MUKIRIA TECHNICAL TRAINING INSTITUTE
                </h2>
                <p className="text-xs text-slate-500 font-medium">Official TVET CDACC Examination Blueprint & Paper Editor</p>
              </div>
              
              {/* CDACC Compliance Status Banner */}
              <div
                className={`p-4 rounded-xl flex flex-col gap-2 transition-all duration-300 border ${
                  liveComplianceErrors.length === 0
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-rose-50 border-rose-300 text-rose-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {liveComplianceErrors.length === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-bold text-sm text-[#0f172a]">
                      CDACC Compliance Monitor (KNQF Level {unitLevel})
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      liveComplianceErrors.length === 0
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-rose-100 text-rose-800 border-rose-300"
                    }`}
                  >
                    {liveComplianceErrors.length === 0 ? "Compliant" : "Non-Compliant"}
                  </span>
                </div>
                
                {liveComplianceErrors.length > 0 && (
                  <ul className="text-xs space-y-1 mt-1 text-rose-900 font-medium">
                    {liveComplianceErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* AI-Assisted Ingestion Panel */}
              {!activeExam && (
                <div className="bg-white border border-slate-300 shadow-sm p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Library className="w-4 h-4 text-[#c48820]" />
                    <span className="font-bold text-sm text-[#000953]">
                      AI Exam Creator (Upload Curriculum / Session Plan)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Upload a Word document (.docx) containing your curriculum mapping, topics, or outcomes. The AI engine will parse the document, enforce CDACC compliance criteria, and auto-build your exam blueprint.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept=".docx"
                      onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                      className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-[#000953]"
                    />
                    <button
                      onClick={() => handleAiGenerate(false)}
                      disabled={generatingAi || !aiFile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm active:scale-[0.98]"
                    >
                      {generatingAi ? "Parsing..." : "Compile Exam Draft"}
                    </button>
                    <button
                      onClick={() => handleAiGenerate(true)}
                      disabled={generatingAi || !aiFile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 bg-white hover:bg-slate-50 border border-slate-300 text-[#000953]"
                    >
                      {generatingAi ? "Parsing..." : "Compile Practical Draft"}
                    </button>
                  </div>

                  {/* Institutional CDACC Repository */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#000953]">
                      <Library className="w-3.5 h-3.5 text-[#c48820]" />
                      <span>Institutional CDACC Repository:</span>
                    </div>
                    <select
                      value={selectedRepoCode}
                      onChange={(e) => setSelectedRepoCode(e.target.value)}
                      className="text-xs text-[#0f172a] bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#000953] max-w-sm"
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
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#000953] rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Draft Theory (CT)
                    </button>
                    <button
                      onClick={() => {
                        const target = repoUnits.find(u => u.unit_code === selectedRepoCode);
                        if (target) handleCompileFromUnit(target, true);
                      }}
                      disabled={generatingAi || !selectedRepoCode}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-[#000953] rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Draft Practical (CP)
                    </button>
                  </div>
                </div>
              )}

              {/* Header fields */}
              {generatingAi ? (
                <div className="space-y-4 animate-pulse">
                  <div className="bg-white border border-slate-300 rounded-2xl p-5 space-y-4">
                    <div className="h-6 w-1/3 rounded bg-slate-200"></div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="h-10 rounded bg-slate-200"></div>
                      <div className="h-10 rounded bg-slate-200"></div>
                      <div className="h-10 rounded bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-300 rounded-2xl p-5 h-48"></div>
                  <div className="bg-white border border-slate-300 rounded-2xl p-5 h-48"></div>
                </div>
              ) : (
                <>
              <div className="bg-white border border-slate-300 rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-base text-[#000953] flex items-center gap-2">
                    {activeExam ? "Edit Examination Paper" : "New Examination Paper"}
                    {isSavingDraft ? (
                      <span className="text-[11px] text-slate-500 font-normal animate-pulse flex items-center gap-1">☁️ Saving draft...</span>
                    ) : lastSaved ? (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">✓ Saved {lastSaved.toLocaleTimeString()}</span>
                    ) : null}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tools Group */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200">
                      <button
                        onClick={() => setShowJson(!showJson)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#000953] transition shadow-xs"
                      >
                        <Code className="w-3.5 h-3.5 text-slate-500" />
                        {showJson ? "Hide" : "View"} JSON
                      </button>
                      <button
                        onClick={copyJson}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#000953] transition shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Copy
                      </button>
                      <button
                        onClick={() => setShowQuestionBank(!showQuestionBank)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#000953] transition shadow-xs"
                        title="Open question bank"
                      >
                        <Library className="w-3.5 h-3.5 text-[#000953]" />
                        Bank ({questionBank.length})
                      </button>
                    </div>

                    {/* Export & Clones Group */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200">
                      {activeExam && (
                        <>
                          <button
                            onClick={() => duplicateExam(activeExam)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#000953] transition shadow-xs"
                            title="Clone this exam"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => exportExamAsJSON(activeExam)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#000953] transition shadow-xs"
                            title="Export as JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                            JSON
                          </button>
                        </>
                      )}
                      <button
                        onClick={exportExamAsDocx}
                        disabled={exportingDocx}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-[#000953] hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
                        title="Export official TVET CDACC Word Exam (Form MTTI/F/CUR/08)"
                      >
                        <Download className="w-3.5 h-3.5 text-[#c48820]" />
                        {exportingDocx ? "Exporting..." : "Export Word (.doc)"}
                      </button>
                    </div>

                    {/* Primary Action */}
                    <button
                      onClick={saveExam}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#000953] hover:bg-[#000e7a] text-white transition active:scale-[0.98] shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5 text-[#c48820]" />
                      {saving ? "Saving..." : "Save Exam"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Course Name (Optional)
                    </label>
                    <input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. ICT TECHNICIAN LEVEL 6"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Course Code (Unit Code) *
                    </label>
                    <input
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 061006T91CT"
                      disabled={!!activeExam}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Unit Name (Optional)
                    </label>
                    <input
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="e.g. ENVIRONMENTAL STUDIES"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Class (Optional)
                    </label>
                    <input
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="e.g. ITECH6/M/24"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Series (Optional)
                    </label>
                    <input
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="e.g. Jan./April 2026"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Exam Title *
                    </label>
                    <input
                      value={payload.title}
                      onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Computer Science — CAT 1"
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={payload.duration_minutes}
                      onChange={(e) => setPayload((p) => ({ ...p, duration_minutes: +e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold mb-1.5 text-slate-700">
                      General Instructions
                    </label>
                    <textarea
                      value={payload.instructions}
                      onChange={(e) => setPayload((p) => ({ ...p, instructions: e.target.value }))}
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm resize-y min-h-[100px] leading-relaxed bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                    />
                  </div>
                </div>

                {/* Trainee Portal Availability, Scheduling & Assessment Rules */}
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#c48820]" />
                      <h4 className="text-sm font-bold text-[#000953]">
                        Trainee Portal Availability, Schedule & Submission Rules
                      </h4>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50">
                      <input
                        type="checkbox"
                        checked={payload.portal_visible === true}
                        onChange={(e) =>
                          setPayload((p) => ({ ...p, portal_visible: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#000953] focus:ring-[#000953]"
                      />
                      <span className="text-xs font-bold text-[#000953]">
                        {payload.portal_visible === true
                          ? "Allocated & Published on Trainee Portal"
                          : "Unallocated (Hidden in Trainer Bank)"}
                      </span>
                    </label>
                  </div>

                  {/* Target Cohort Allocation Pills */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-[#000953] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#c48820]" />
                        Target Cohort / Permitted Classes:
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Click cohort buttons below to allocate access to this assessment
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: "FBS5/6/J/26", label: "FBS5/6/J/26 (Food & Beverage L5/L6)" },
                        { code: "ITECH 6 MOD", label: "ITECH 6 MOD (ICT L6)" },
                        { code: "ICT4 MOD", label: "ICT4 MOD (ICT L4)" },
                        { code: "ADMIN5/6/J/26", label: "ADMIN5/6/J/26 (Business L5/L6)" },
                        { code: "LS5/6/S/26", label: "LS5/6/S/26 (Land Survey L5/L6)" },
                        { code: "ALL", label: "All Enrolled Cohorts" },
                      ].map((item) => {
                        const activeCohorts = payload.target_cohorts || [];
                        const isSelected =
                          activeCohorts.includes(item.code) ||
                          (activeCohorts.length === 0 && (classCode === item.code || payload.class === item.code));

                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => {
                              let next: string[];
                              if (isSelected) {
                                next = activeCohorts.filter((c) => c !== item.code);
                              } else {
                                next = item.code === "ALL" ? ["ALL"] : [...activeCohorts.filter((c) => c !== "ALL"), item.code];
                                if (!classCode.trim()) {
                                  setClassCode(item.code);
                                }
                              }
                              setPayload((p) => ({
                                ...p,
                                target_cohorts: next,
                                class: next[0] || p.class,
                              }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                              isSelected
                                ? "bg-[#000953] text-white border-[#000953] shadow-xs"
                                : "bg-white text-slate-700 border-slate-300 hover:border-[#000953]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-[#c48820]" />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {(payload.target_cohorts?.length ?? 0) > 0 && (
                      <p className="text-[11px] font-mono font-semibold text-emerald-700 pt-1">
                        ✓ Allocated strictly to: {payload.target_cohorts?.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700">
                        Canonical Assessment Type
                      </label>
                      <select
                        value={payload.task_code || "CT1"}
                        onChange={(e) => {
                          const val = e.target.value;
                          const mappedCategory: AssessmentCategory =
                            val === "CP1" || val === "CP2" || val === "CP3"
                              ? "Practical"
                              : val === "PROJECT"
                              ? "Project"
                              : val === "CAT"
                              ? "CAT"
                              : "Exam";
                          const defaultMarks =
                            val === "CAT"
                              ? (payload.total_marks && payload.total_marks <= 30 && payload.total_marks >= 15 ? payload.total_marks : 30)
                              : (payload.total_marks || 100);

                          setPayload((p) => ({
                            ...p,
                            task_code: val,
                            assessment_category: mappedCategory,
                            type: mappedCategory === "Practical" ? "practical" : "written",
                            total_marks: defaultMarks,
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      >
                        <option value="CT1">TYPE 1: Written Assessment I (CT1 • Theory 100%)</option>
                        <option value="CT2">TYPE 2: Written Assessment II (CT2 • Theory 100%)</option>
                        <option value="CT3">TYPE 3: Written Assessment III (CT3 • Theory 100%)</option>
                        <option value="CP1">TYPE 4a: Practical Assessment I (CP1 • Checklist 100%)</option>
                        <option value="CP2">TYPE 4b: Practical Assessment II (CP2 • Checklist 100%)</option>
                        <option value="CP3">TYPE 4c: Practical Assessment III (CP3 • Checklist 100%)</option>
                        <option value="CAT">TYPE 5: Continuous Assessment Test (CAT • Flexible 15–30 Marks)</option>
                        <option value="PROJECT">TYPE 6: Course Project (Discretionary Portfolio / Rubric)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700">
                        Marksheet Slot Mapping
                      </label>
                      <select
                        value={payload.task_code || "CT1"}
                        onChange={(e) =>
                          setPayload((p) => ({
                            ...p,
                            task_code: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono font-bold bg-white border border-slate-300 text-[#000953] focus:outline-none focus:border-[#000953]"
                      >
                        <option value="CT1">CT1 — Written Assessment I (Theory 100%)</option>
                        <option value="CT2">CT2 — Written Assessment II (Theory 100%)</option>
                        <option value="CT3">CT3 — Written Assessment III (Theory 100%)</option>
                        <option value="CP1">CP1 — Practical Assessment I (Checklist 100%)</option>
                        <option value="CP2">CP2 — Practical Assessment II (Checklist 100%)</option>
                        <option value="CP3">CP3 — Practical Assessment III (Checklist 100%)</option>
                        <option value="CAT">CAT — Discretionary (Normalizes to CT1/CT2/CT3)</option>
                        <option value="PROJECT">PROJECT — Course Project (Feeds into CP1/CP2/CP3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Available From (Start Date/Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={payload.available_from || ""}
                        onChange={(e) =>
                          setPayload((p) => ({ ...p, available_from: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-600" />
                        Due On (Closing Date/Time)
                      </label>
                      <input
                        type="datetime-local"
                        value={payload.due_at || ""}
                        onChange={(e) =>
                          setPayload((p) => ({ ...p, due_at: e.target.value }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700">
                        After Due Date Policy
                      </label>
                      <select
                        value={payload.late_submission_policy || "strict_lock"}
                        onChange={(e) =>
                          setPayload((p) => ({
                            ...p,
                            late_submission_policy: e.target.value as "strict_lock" | "allow_flagged",
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      >
                        <option value="strict_lock">Strict Lock (Close Portal at Due Time)</option>
                        <option value="allow_flagged">Allow Late Submission (Flag as Late)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700">
                        Max Candidate Attempts
                      </label>
                      <select
                        value={payload.max_attempts || 1}
                        onChange={(e) =>
                          setPayload((p) => ({
                            ...p,
                            max_attempts: Number(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      >
                        <option value={1}>1 Attempt (Standard Exam/CAT)</option>
                        <option value={2}>2 Attempts (1 Retake Allowed)</option>
                        <option value={3}>3 Attempts (Practice / Revision)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-700">
                        Result Release Policy
                      </label>
                      <select
                        value={payload.release_results_mode || "after_trainer_grading"}
                        onChange={(e) =>
                          setPayload((p) => ({
                            ...p,
                            release_results_mode: e.target.value as
                              | "immediate_objective"
                              | "after_trainer_grading",
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953]"
                      >
                        <option value="after_trainer_grading">After Trainer Review & Approval</option>
                        <option value="immediate_objective">Show Objective Score Immediately</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={payload.proctoring_required !== false}
                          onChange={(e) =>
                            setPayload((p) => ({
                              ...p,
                              proctoring_required: e.target.checked,
                            }))
                          }
                          className="rounded border-slate-300 text-[#000953] focus:ring-[#000953]"
                        />
                        <ShieldCheck className="w-3.5 h-3.5 text-[#000953] shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          Enforce Live Proctoring
                        </span>
                      </label>
                    </div>
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
                    className="p-4 rounded-xl bg-slate-900 border border-slate-700 overflow-auto max-h-64"
                  >
                    <pre className="text-xs font-mono text-slate-100">
                      {JSON.stringify({ unit_code: unitCode, course_name: courseName, payload }, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Practical Assessment Layout */}
              {payload.type === "practical" ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Library className="w-4 h-4 text-[#c48820]" />
                    <span className="font-bold text-sm text-[#000953]">
                      Practical Assessment Layout (Read-Only Preview)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    This practical assessment has been generated and configured by the AI. The exported Word document will contain the Project Brief, Tasks, and Tabular Grading Rubrics.
                  </p>
                  
                  <div className="mt-4 p-4 rounded-xl space-y-3 bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-[#000953]">Project Brief: </span>
                      <span className="text-xs text-slate-800">{payload.project_brief}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#000953]">Elements Covered: </span>
                      <span className="text-xs text-slate-800">{payload.elements_covered?.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#000953]">Tasks: </span>
                      <span className="text-xs text-slate-800">{payload.tasks?.length} Generated</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#000953]">Rubric Categories: </span>
                      <span className="text-xs text-slate-800">{payload.rubric?.length} Generated</span>
                    </div>
                  </div>
                </div>
              ) : (
                payload.assessment_category === "CAT" ? (
                  <SectionEditor
                    section="a"
                    badgeText="CAT"
                    title="Continuous Assessment Test Questions (15–30 Marks)"
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
                ) : (
                  <>
                    {/* Section A */}
                    <SectionEditor
                      section="a"
                      title="Section A — Multiple Choice / Short Answer"
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
                )
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
  badgeText?: string;
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
  badgeText,
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
    <div className="rounded-2xl bg-white border border-slate-300 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left sticky top-0 z-10 bg-slate-50 border-b border-slate-200 hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-7 px-2 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono bg-[#000953] text-white shadow-sm">
            {badgeText || section.toUpperCase()}
          </div>
          <span className="font-bold text-sm text-[#000953]">
            {title}
          </span>
          <span className="text-xs font-mono font-semibold text-[#c48820] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {questions.length} questions · {totalMarks} marks
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
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
                <label className="block text-xs font-bold mb-1.5 text-slate-700">
                  Section Instructions
                </label>
                <textarea
                  value={sectionInstructions}
                  onChange={(e) => onInstructionsChange(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm resize-y min-h-[85px] leading-relaxed bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
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
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/50 hover:border-[#000953] text-xs font-bold uppercase tracking-wider text-[#000953] flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 text-[#c48820]" />
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
    <div className="p-4 rounded-xl space-y-3 bg-slate-50/80 border border-slate-300 hover:border-[#000953]/50 transition">
      <div className="flex items-center justify-between">
        <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-[#000953] text-white shadow-sm">
          Q{index + 1}
        </span>
        <div className="flex items-center gap-2">
          {unitLevel >= 4 && question.type === "true_false" && (
            <span className="text-[10px] text-rose-600 font-bold">⚠️ Level {unitLevel} CDACC prohibits True/False</span>
          )}
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as ExamQuestion["type"] })}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#0f172a] font-medium focus:outline-none focus:border-[#000953]"
          >
            {unitLevel < 5 && <option value="mcq">MCQ</option>}
            <option value="short_answer">Short Answer</option>
            {unitLevel < 4 && <option value="true_false">True/False</option>}
          </select>
          <input
            type="number"
            value={question.marks}
            onChange={(e) => onUpdate({ marks: +e.target.value })}
            className="w-16 text-xs px-2 py-1.5 rounded-lg font-mono font-bold text-center bg-white border border-slate-300 text-[#000953] focus:outline-none focus:border-[#000953]"
            min={1}
          />
          <span className="text-xs font-semibold text-slate-600">marks</span>
          {canRemove && (
            <button
              onClick={onRemove}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
              title="Remove Question"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <textarea
        value={question.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder={`Question ${index + 1} text...`}
        rows={4}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm resize-y min-h-[110px] leading-relaxed bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
      />

      <div className="flex gap-2 items-center">
        <label className="text-[10px] uppercase font-bold tracking-wider shrink-0 text-[#000953]">
          CDACC Critical Aspect:
        </label>
        <input
          type="text"
          value={question.critical_aspect ?? ""}
          onChange={(e) => onUpdate({ critical_aspect: e.target.value })}
          placeholder="e.g. Map to performance criterion 2.1..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953]"
        />
      </div>

      {question.type === "mcq" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            Options (click radio to set correct answer):
          </p>
          {(question.options ?? ["", "", "", ""]).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.correct_answer === oi}
                onChange={() => onUpdate({ correct_answer: oi })}
                className="accent-[#000953]"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const opts = [...(question.options ?? [])];
                  opts[oi] = e.target.value;
                  onUpdate({ options: opts });
                }}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className={`flex-1 px-2.5 py-1.5 rounded-lg text-sm bg-white border transition ${
                  question.correct_answer === oi
                    ? "border-[#000953] bg-blue-50/60 text-[#000953] font-semibold"
                    : "border-slate-300 text-[#0f172a] placeholder-slate-400 focus:border-[#000953]"
                }`}
              />
              {question.correct_answer === oi && (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
            </div>
          ))}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="flex gap-3">
          {["True", "False"].map((opt, oi) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[#0f172a] font-medium">
              <input
                type="radio"
                name={`tf-${question.id}`}
                checked={question.correct_answer === oi}
                onChange={() => onUpdate({ correct_answer: oi })}
                className="accent-[#000953]"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "short_answer" && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Model Answer / Marking Guide (for trainer reference):
          </label>
          <textarea
            value={question.correct_answer as string}
            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
            placeholder="Key points to award marks..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm resize-y min-h-[110px] leading-relaxed bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
          />
        </div>
      )}
    </div>
  );
}

