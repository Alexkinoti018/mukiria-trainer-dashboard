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
  Eye,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Code,
  BookOpen,
  Edit3,
  Download,
  Upload,
  Library,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS } from "@/lib/mockData";
import type { Exam, ExamPayload, ExamQuestion } from "@/lib/supabase";
import { toast } from "sonner";
import { nanoid } from "nanoid";

const EMPTY_QUESTION = (): ExamQuestion => ({
  id: nanoid(8),
  text: "",
  type: "mcq",
  options: ["", "", "", ""],
  correct_answer: 0,
  marks: 2,
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
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Form state
  const [unitCode, setUnitCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [payload, setPayload] = useState<ExamPayload>(EMPTY_PAYLOAD());
  const [expandedSection, setExpandedSection] = useState<"a" | "b" | null>("a");
  const [questionBank, setQuestionBank] = useState<ExamQuestion[]>([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setExams(data ?? []);
        console.log("✅ [MTTI Exams] Loaded", data?.length, "exams");
      } else {
        setExams(MOCK_EXAMS);
        console.log("ℹ️ [MTTI Exams] Using mock data");
      }
    } catch (err) {
      console.error("❌ [MTTI Exams] Load error:", err);
      setExams(MOCK_EXAMS);
    } finally {
      setLoading(false);
    }
  };

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

    // Recalculate totals
    const sectionATotal = payload.section_a.questions.reduce((s, q) => s + q.marks, 0);
    const sectionBTotal = payload.section_b.questions.reduce((s, q) => s + q.marks, 0);
    const updatedPayload = {
      ...payload,
      section_a: { ...payload.section_a, total_marks: sectionATotal },
      section_b: { ...payload.section_b, total_marks: sectionBTotal },
      total_marks: sectionATotal + sectionBTotal,
    };

    setSaving(true);
    try {
      let savedSuccessfully = false;
      
      // Try Supabase first if configured
      if (isSupabaseConfigured()) {
        try {
          if (activeExam) {
            const { error } = await (supabase as any)
              .from("exams")
              .update({ course_name: courseName, payload: updatedPayload as any })
              .eq("id", activeExam.id);
            if (error) throw error;
            toast.success("Exam Updated", { description: `${unitCode} has been updated.` });
          } else {
            const { error } = await (supabase as any).from("exams").insert({
              unit_code: unitCode.toUpperCase(),
              course_name: courseName,
              payload: updatedPayload as any,
            });
            if (error) throw error;
            toast.success("Exam Created", { description: `${unitCode} exam payload saved to database.` });
          }
          await loadExams();
          savedSuccessfully = true;
        } catch (supabaseErr: any) {
          console.warn("⚠️ [MTTI Exam Builder] Supabase save failed, falling back to demo mode:", supabaseErr.message);
          // Fall through to demo mode fallback
        }
      }
      
      // Use demo mode if Supabase not configured or failed
      if (!savedSuccessfully) {
        const newExam: Exam = {
          id: activeExam?.id || nanoid(),
          unit_code: unitCode.toUpperCase(),
          course_name: courseName,
          payload: updatedPayload,
          created_at: activeExam?.created_at || new Date().toISOString(),
        };
        if (activeExam) {
          setExams((prev) => prev.map((e) => (e.id === activeExam.id ? newExam : e)));
          const msg = isSupabaseConfigured() ? "(Demo Fallback)" : "(Demo)";
          toast.success(`Exam Updated ${msg}`, { description: isSupabaseConfigured() ? "Supabase unavailable. Changes saved locally." : "Changes saved in demo mode." });
        } else {
          setExams((prev) => [newExam, ...prev]);
          const msg = isSupabaseConfigured() ? "(Demo Fallback)" : "(Demo)";
          toast.success(`Exam Created ${msg}`, { description: isSupabaseConfigured() ? "Supabase unavailable. Exam saved locally." : "Exam saved in demo mode." });
        }
      }
      
      setIsCreating(false);
      console.log("✅ [MTTI Exam Builder] Exam saved:", unitCode);
    } catch (err: any) {
      console.error("❌ [MTTI Exam Builder] Save error:", err);
      toast.error("Save Failed", { description: err.message ?? "Could not save exam." });
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (exam: Exam) => {
    if (!confirm(`Delete exam ${exam.unit_code}? This cannot be undone.`)) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from("exams").delete().eq("id", exam.id);
        if (error) throw error;
        await loadExams();
      } else {
        setExams((prev) => prev.filter((e) => e.id !== exam.id));
      }
      toast.success("Exam Deleted");
      if (activeExam?.id === exam.id) setIsCreating(false);
    } catch (err: any) {
      toast.error("Delete Failed", { description: err.message });
    }
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
    link.download = `${exam.unit_code}-exam-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exam Exported", { description: `${exam.unit_code} exported as JSON` });
  };

  const exportAllExams = () => {
    const dataStr = JSON.stringify(exams, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `exam-bank-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exam Bank Exported", { description: `${exams.length} exams exported` });
  };

  const handleImportExams = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const examsToImport = Array.isArray(data) ? data : [data];
      const validExams = examsToImport.filter((e: any) => e.unit_code && e.course_name && e.payload);
      if (validExams.length === 0) {
        toast.error("Import Failed", { description: "No valid exams found in file" });
        return;
      }
      const newExams = validExams.map((e: any) => ({
        ...e,
        id: nanoid(),
        created_at: new Date().toISOString(),
      }));
      setExams((prev) => [...newExams, ...prev]);
      toast.success("Exams Imported", { description: `${newExams.length} exams imported successfully` });
      console.log("✅ [MTTI Exam Builder] Imported", newExams.length, "exams");
    } catch (err: any) {
      toast.error("Import Failed", { description: err.message });
    }
  };

  const addToQuestionBank = (question: ExamQuestion) => {
    if (!questionBank.find((q) => q.id === question.id)) {
      setQuestionBank((prev) => [...prev, { ...question, id: nanoid(8) }]);
      toast.success("Added to Bank", { description: "Question saved to reusable bank" });
    }
  };

  const useFromQuestionBank = (question: ExamQuestion, section: "a" | "b") => {
    const key = section === "a" ? "section_a" : "section_b";
    setPayload((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        questions: [...prev[key].questions, { ...question, id: nanoid(8) }],
      },
    }));
    toast.success("Question Added", { description: "Question from bank added to exam" });
  };

  const exportQuestionBank = () => {
    const dataStr = JSON.stringify(questionBank, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `question-bank-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Question Bank Exported", { description: `${questionBank.length} questions exported` });
  };

  const handleImportQuestions = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const questionsToImport = Array.isArray(data) ? data : [data];
      const validQuestions = questionsToImport.filter((q: any) => q.text && q.type && q.marks);
      if (validQuestions.length === 0) {
        toast.error("Import Failed", { description: "No valid questions found in file" });
        return;
      }
      const newQuestions = validQuestions.map((q: any) => ({
        ...q,
        id: nanoid(8),
      }));
      setQuestionBank((prev) => [...newQuestions, ...prev]);
      toast.success("Questions Imported", { description: `${newQuestions.length} questions imported` });
    } catch (err: any) {
      toast.error("Import Failed", { description: err.message });
    }
  };


  const updateQuestion = (section: "a" | "b", idx: number, updates: Partial<ExamQuestion>) => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const questions = [...prev[key].questions];
      questions[idx] = { ...questions[idx], ...updates };
      return { ...prev, [key]: { ...prev[key], questions } };
    });
  };

  const addQuestion = (section: "a" | "b") => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const newQ: ExamQuestion =
        section === "a"
          ? EMPTY_QUESTION()
          : { id: nanoid(8), text: "", type: "short_answer", correct_answer: "", marks: 30 };
      return { ...prev, [key]: { ...prev[key], questions: [...prev[key].questions, newQ] } };
    });
  };

  const removeQuestion = (section: "a" | "b", idx: number) => {
    setPayload((prev) => {
      const key = section === "a" ? "section_a" : "section_b";
      const questions = prev[key].questions.filter((_, i) => i !== idx);
      return { ...prev, [key]: { ...prev[key], questions } };
    });
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify({ unit_code: unitCode, course_name: courseName, payload }, null, 2));
    toast.success("JSON Copied to Clipboard");
  };

  return (
    <DashboardLayout title="Exam Builder" subtitle="Create and manage standardized assessment payloads">
      <div className="flex gap-6 h-full">
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
              {/* Header fields */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
                    {activeExam ? "Edit Exam" : "New Exam"}
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
                      onClick={saveExam}
                      disabled={saving}
                      className="btn-emerald flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "Saving..." : "Save Exam"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                      Unit Code *
                    </label>
                    <input
                      value={unitCode}
                      onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                      placeholder="e.g. COMP-204"
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
                      Course Name *
                    </label>
                    <input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="e.g. Computer Science Fundamentals"
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

              {/* Section A */}
              <SectionEditor
                section="a"
                title="Section A — Multiple Choice"
                questions={payload.section_a.questions}
                sectionInstructions={payload.section_a.instructions}
                expanded={expandedSection === "a"}
                onToggle={() => setExpandedSection(expandedSection === "a" ? null : "a")}
                onUpdateQuestion={(idx, updates) => updateQuestion("a", idx, updates)}
                onAddQuestion={() => addQuestion("a")}
                onRemoveQuestion={(idx) => removeQuestion("a", idx)}
                onInstructionsChange={(v) =>
                  setPayload((p) => ({ ...p, section_a: { ...p.section_a, instructions: v } }))
                }
              />

              {/* Section B */}
              <SectionEditor
                section="b"
                title="Section B — Structured Questions"
                questions={payload.section_b.questions}
                sectionInstructions={payload.section_b.instructions}
                expanded={expandedSection === "b"}
                onToggle={() => setExpandedSection(expandedSection === "b" ? null : "b")}
                onUpdateQuestion={(idx, updates) => updateQuestion("b", idx, updates)}
                onAddQuestion={() => addQuestion("b")}
                onRemoveQuestion={(idx) => removeQuestion("b", idx)}
                onInstructionsChange={(v) =>
                  setPayload((p) => ({ ...p, section_b: { ...p.section_b, instructions: v } }))
                }
              />
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
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
}: SectionEditorProps) {
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: expanded ? "1px solid oklch(1 0 0 / 0.08)" : undefined }}
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
}

function QuestionEditor({ question, index, section, onUpdate, onRemove, canRemove }: QuestionEditorProps) {
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
            <option value="mcq">MCQ</option>
            <option value="short_answer">Short Answer</option>
            <option value="true_false">True/False</option>
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
