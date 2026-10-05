/**
 * Grading Interface
 * Design: Institutional Glassmorphism
 * Real-time grading with automated score calculations for MCQ and manual scoring for Section B
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  Filter,
  User,
  BookOpen,
  Award,
  RefreshCw,
  Edit3,
  AlertCircle,
  Download,
  MessageSquare,
  BarChart3,
  FileText,
  Sparkles,
  Loader2,
  PenTool,
  FileCheck,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import MarkedExamScriptModal from "@/components/MarkedExamScriptModal";
import ObservationChecklistMarkingModal from "@/components/ObservationChecklistMarkingModal";
import { AssessmentMarksSheet } from "@/components/AssessmentMarksSheet";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";
import type { Exam, Submission, StudentAnswer, ExamQuestion } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

const getLevelFromUnitCode = (code: string): number => {
  const match = code.match(/\/(\d)\//);
  if (match) return parseInt(match[1], 10);
  const parts = code.split("/");
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num) && num >= 3 && num <= 8) return num;
  }
  return 6; // default Level 6
};

export default function Grading() {
  const { exams, submissions, gradeSubmission } = useExam();
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedScores, setEditedScores] = useState<Record<string, Record<string, number>>>({});
  const [overrideMode, setOverrideMode] = useState<string | null>(null);
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [showUngradedOnly, setShowUngradedOnly] = useState(false);
  const [trainerComments, setTrainerComments] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [markedScriptSub, setMarkedScriptSub] = useState<Submission | null>(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedPracticalCandidate, setSelectedPracticalCandidate] = useState<{
    name: string;
    regCode: string;
    unitCode?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"submissions" | "batch_marksheet">("submissions");

  // Set loading to false once context submissions are ready
  useEffect(() => {
    if (submissions !== undefined) {
      setLoading(false);
    }
  }, [submissions]);
  // ── Auto-grade MCQ answers ────────────────────────────────
  const autoGradeMCQ = useCallback(
    (sub: Submission, exam: Exam): StudentAnswer[] => {
      return sub.section_a.map((ans) => {
        const question = exam.payload?.section_a?.questions?.find((q) => q.id === ans.question_id);
        if (!question) return ans;
        const isCorrect = ans.answer === question.correct_answer;
        return { ...ans, marks_awarded: isCorrect ? question.marks : 0 };
      });
    },
    []
  );

  const getExamForSub = (sub: Submission) =>
    exams.find((e) => e.unit_code === sub.unit_code);

  function downloadBase64File(base64Data: string, filename: string, mimeType: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const calculateTotal = (sub: Submission, gradedA?: StudentAnswer[], gradedB?: StudentAnswer[]): number => {
    const aAnswers = gradedA ?? sub.section_a;
    const bAnswers = gradedB ?? sub.section_b;
    const aScore = aAnswers.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
    const exam = getExamForSub(sub);

    // If total marks explicitly configured (e.g. Digital Literacy 70-mark paper), calculate exact mark sum
    if (exam?.payload?.total_marks) {
      const bScore = bAnswers.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
      return aScore + bScore;
    }
    
    const level = getLevelFromUnitCode(sub.unit_code);
    
    // Section B Scoring: Handle Level 5 & 6 "Choose 3 of 4"
    let bScore = 0;
    if ((level === 5 || level === 6) && bAnswers.length > 3) {
      const awardedMarks = bAnswers
        .map((a) => a.marks_awarded ?? 0)
        .sort((x, y) => y - x);
      bScore = awardedMarks.slice(0, 3).reduce((sum, mark) => sum + mark, 0);
    } else {
      bScore = bAnswers.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
    }

    // KNQF Level-specific continuous theory (CT) and practical (CP) weights
    const weights: Record<number, { ct: number; cp: number }> = {
      6: { ct: 50, cp: 50 },
      5: { ct: 40, cp: 60 },
      4: { ct: 30, cp: 70 },
      3: { ct: 20, cp: 80 },
    };

    const weight = weights[level];
    if (weight) {
      const sectionAMax = exam?.payload?.section_a?.total_marks ?? (level <= 4 ? (level === 4 ? 10 : 20) : 40);
      const sectionBMax = 60; // Standardized Section B contribution

      const ctPercentage = sectionAMax > 0 ? (aScore / sectionAMax) * weight.ct : 0;
      const cpPercentage = sectionBMax > 0 ? (bScore / sectionBMax) * weight.cp : 0;

      return Math.min(100, Math.round(ctPercentage + cpPercentage));
    }

    return aScore + bScore;
  };

  const handleAutoGrade = async (sub: Submission) => {
    const exam = getExamForSub(sub);
    if (!exam) {
      toast.error("Exam not found for this submission");
      return;
    }

    const gradedA = autoGradeMCQ(sub, exam);
    const gradedB = sub.section_b.map((ans) => ({
      ...ans,
      marks_awarded: ans.marks_awarded ?? 0,
    }));

    const total = calculateTotal({ ...sub, section_a: gradedA, section_b: gradedB });

    setSaving(sub.id);
    try {
      gradeSubmission(sub.id, {
        section_a: gradedA,
        section_b: gradedB,
        total_score: total,
        status: "graded"
      });

      toast.success("Auto-graded!", {
        description: `${sub.student_name}: ${total} Marks (${Math.round((total / (exam.payload?.total_marks ?? 100)) * 100)}%)`,
      });
      console.log("✅ [MTTI Grading] Auto-graded:", sub.student_name, "Score:", total);
    } catch (err: any) {
      toast.error("Grading Failed", { description: err.message });
    } finally {
      setSaving(null);
    }
  };

  // ── Auto-save score overrides (Section A & Section B) ─────
  const autoSaveOverride = useCallback(
    async (sub: Submission, questionId: string, newScore: number, section: "a" | "b" = "b") => {
      const targetList = section === "a" ? sub.section_a : sub.section_b;
      const oldScore = targetList.find((a) => a.question_id === questionId)?.marks_awarded ?? 0;
      if (newScore === oldScore) return;

      setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "saving" }));
      try {
        const updatedList = targetList.map((ans) =>
          ans.question_id === questionId
            ? { ...ans, marks_awarded: newScore, flagged_for_review: false }
            : ans
        );
        const updatedA = section === "a" ? updatedList : sub.section_a;
        const updatedB = section === "b" ? updatedList : sub.section_b;
        const total = calculateTotal({ ...sub, section_a: updatedA, section_b: updatedB });

        gradeSubmission(sub.id, {
          section_a: updatedA,
          section_b: updatedB,
          total_score: total,
          status: "graded"
        });

        setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));
        setTimeout(
          () => setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "idle" })),
          1500
        );
      } catch (err: any) {
        console.error("❌ [MTTI Grading] Auto-save failed:", err);
        setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "idle" }));
      }
    },
    [gradeSubmission, exams]
  );

  const handleScoreBlur = (sub: Submission, questionId: string, value: number, section: "a" | "b" = "b") => {
    const targetList = section === "a" ? sub.section_a : sub.section_b;
    const oldScore = targetList.find((a) => a.question_id === questionId)?.marks_awarded ?? 0;
    if (value !== oldScore) {
      autoSaveOverride(sub, questionId, value, section);
    }
  };

  const handleSaveAllScores = async (sub: Submission) => {
    const subEdits = editedScores[sub.id] ?? {};
    const updatedA = sub.section_a.map((ans) => ({
      ...ans,
      marks_awarded: subEdits[ans.question_id] !== undefined ? subEdits[ans.question_id] : (ans.marks_awarded ?? 0),
      flagged_for_review: subEdits[ans.question_id] !== undefined ? false : ans.flagged_for_review,
    }));
    const updatedB = sub.section_b.map((ans) => ({
      ...ans,
      marks_awarded: subEdits[ans.question_id] !== undefined ? subEdits[ans.question_id] : (ans.marks_awarded ?? 0),
      flagged_for_review: subEdits[ans.question_id] !== undefined ? false : ans.flagged_for_review,
    }));
    const total = calculateTotal({ ...sub, section_a: updatedA, section_b: updatedB });

    setSaving(sub.id);
    try {
      const updates: any = {
        section_a: updatedA,
        section_b: updatedB,
        total_score: total,
        status: "graded"
      };
      if (trainerComments[sub.id] !== undefined) {
        updates.trainer_comments = trainerComments[sub.id];
      }

      gradeSubmission(sub.id, updates);

      setEditedScores((prev) => {
        const next = { ...prev };
        delete next[sub.id];
        return next;
      });
      setOverrideReasons({});
      setOverrideMode(null);
      toast.success("Marks Saved with Audit Trail", { description: `Total Score: ${total}` });
      console.log("✅ [MTTI Grading] Scores saved with audit trail for:", sub.student_name);
    } catch (err: any) {
      toast.error("Save Failed", { description: err.message });
    } finally {
      setSaving(null);
    }
  };

  const handleExportDocument = async (sub: Submission, formatType: "docx" | "pdf") => {
    const exam = getExamForSub(sub);
    const endpoint = formatType === "docx"
      ? "http://localhost:8000/api/export-exam-results-docx"
      : "http://localhost:8000/api/export-exam-results-pdf";
    
    setExporting(true);
    try {
      const totalMarks = exam?.payload?.total_marks ?? 70;
      const currentTotal = sub.total_score ?? calculateTotal(sub);
      const percentage = Math.round((currentTotal / totalMarks) * 100);

      const secA = (sub.section_a || []).map((ans, idx) => {
        const q = exam?.payload?.section_a?.questions?.find((item) => item.id === ans.question_id);
        let ansDisplay = String(ans.answer ?? "No response");
        if (q?.type === "mcq" && q?.options && !isNaN(Number(ansDisplay))) {
          const optIdx = Number(ansDisplay);
          ansDisplay = `${String.fromCharCode(65 + optIdx)}: ${q.options[optIdx] ?? ansDisplay}`;
        }
        return {
          q_num: idx + 1,
          text: q?.text || `Question ${idx + 1}`,
          answer: ansDisplay,
          marks_awarded: ans.marks_awarded ?? 0,
          max_marks: q?.marks ?? 2,
        };
      });

      const secB = (sub.section_b || []).map((ans, idx) => {
        const q = exam?.payload?.section_b?.questions?.find((item) => item.id === ans.question_id);
        return {
          q_num: idx + 1,
          text: q?.text || `Task ${idx + 1}`,
          answer: String(ans.answer ?? "No response"),
          marks_awarded: ans.marks_awarded ?? 0,
          max_marks: q?.marks ?? 20,
        };
      });

      const payload = {
        student_name: sub.student_name,
        reg_number: sub.reg_number,
        unit_name: exam?.course_name || "Apply Digital Literacy",
        unit_code: sub.unit_code,
        class_code: exam?.payload?.class || "FBS5/6/J/25, LS5/6/S/25",
        series: "SEP - NOV 2026",
        exam_title: exam?.payload?.title || "Digital Literacy Assessment",
        evaluated_at: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        total_score: currentTotal,
        total_marks: totalMarks,
        percentage: percentage,
        grade: percentage >= 80 ? "DISTINCTION" : percentage >= 65 ? "CREDIT" : percentage >= 50 ? "PASS" : "REFER",
        status: percentage >= 50 ? "COMPETENT (PASS)" : "NOT YET COMPETENT (REFER)",
        trainer_comments: trainerComments[sub.id] || sub.trainer_comments || "The candidate demonstrates competent foundational digital skills with solid adherence to workplace ICT standards.",
        trainer_name: "Alexander Kinoti",
        section_a: secA,
        section_b: secB,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Export service error (${res.status})`);
      }

      const resData = await res.json();
      const fileData = resData.data || resData.file_data;
      if ((resData.status === "success" || resData.success) && fileData) {
        const mime = formatType === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf";
        downloadBase64File(fileData, resData.filename, mime);
        toast.success(`Exported as ${formatType.toUpperCase()}`, {
          description: `Downloaded ${resData.filename}`,
        });
      } else {
        throw new Error(resData.detail || "Server failed to produce document data");
      }
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Export Failed", { description: err.message || "Failed to contact export service" });
    } finally {
      setExporting(false);
    }
  };

  const handleMarkReviewed = async (sub: Submission) => {
    setSaving(sub.id);
    try {
      gradeSubmission(sub.id, { status: "reviewed" });
      toast.success("Marked as Reviewed");
    } catch (err: any) {
      toast.error("Update Failed", { description: err.message });
    } finally {
      setSaving(null);
    }
  };

  // ── Filtered submissions ──────────────────────────────────
  const filtered = submissions.filter((s) => {
    if (selectedUnit !== "all" && s.unit_code !== selectedUnit) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (showUngradedOnly && s.status !== "pending") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.student_name.toLowerCase().includes(q) ||
        s.reg_number.toLowerCase().includes(q) ||
        s.unit_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getScoreColor = (score: number | null) => {
    if (score === null) return "oklch(0.58 0.012 240)";
    if (score >= 80) return "oklch(0.72 0.18 160)";
    if (score >= 65) return "oklch(0.65 0.15 200)";
    if (score >= 50) return "oklch(0.75 0.14 80)";
    return "oklch(0.65 0.22 25)";
  };

  const getGrade = (score: number | null) => {
    if (score === null) return "—";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  // Calculate grade distribution
  const calculateDistribution = () => {
    const gradedSubs = filtered.filter(s => s.total_score !== null);
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradedSubs.forEach(s => {
      const grade = getGrade(s.total_score);
      if (grade in distribution) distribution[grade as keyof typeof distribution]++;
    });
    return { distribution, total: gradedSubs.length };
  };

  // Export grades to CSV
  const handleExportGrades = async () => {
    setExporting(true);
    try {
      const gradedSubs = filtered.filter(s => s.total_score !== null);
      const csvRows = [
        ['Student Name', 'Registration Number', 'Unit Code', 'Total Score', 'Grade', 'Status', 'Submitted', 'Section A Score', 'Section B Score', 'Trainer Comments'].join(','),
      ];

      gradedSubs.forEach(sub => {
        const sectionAScore = sub.section_a.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
        const sectionBScore = sub.section_b.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
        const comments = trainerComments[sub.id] || '';
        const row = [
          `"${sub.student_name}"`,
          `"${sub.reg_number}"`,
          `"${sub.unit_code}"`,
          sub.total_score ?? 0,
          getGrade(sub.total_score),
          sub.status,
          format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm'),
          sectionAScore,
          sectionBScore,
          `"${comments.replace(/"/g, '""')}"`,
        ].join(',');
        csvRows.push(row);
      });

      const csv = csvRows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `grades-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Grades Exported', { description: `${gradedSubs.length} submissions exported to CSV` });
      console.log('✅ [MTTI Grading] Exported', gradedSubs.length, 'graded submissions');
    } catch (err: any) {
      toast.error('Export Failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <TrainerLayout title="Grading Interface" subtitle="Review and grade student submissions">
      {/* Top View Mode Switcher */}
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-3 print:hidden">
        <button
          onClick={() => setViewMode("submissions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            viewMode === "submissions"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          Exam Submissions
        </button>
        <button
          onClick={() => setViewMode("batch_marksheet")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            viewMode === "batch_marksheet"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" />
          Continuous Assessment Marks Sheet (Batch Matrix)
        </button>
      </div>

      {viewMode === "batch_marksheet" ? (
        <AssessmentMarksSheet />
      ) : (
        <>
          {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "oklch(0.50 0.010 240)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, reg number..."
            className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: "oklch(0.94 0.005 240)" }}
          />
        </div>

        <button
          onClick={() => setShowUngradedOnly(!showUngradedOnly)}
          className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all"
          style={{
            background: showUngradedOnly ? "oklch(0.75 0.14 80 / 0.2)" : "oklch(1 0 0 / 0.05)",
            border: showUngradedOnly ? "1px solid oklch(0.75 0.14 80 / 0.4)" : "1px solid oklch(1 0 0 / 0.08)",
            color: showUngradedOnly ? "oklch(0.75 0.14 80)" : "oklch(0.58 0.012 240)",
          }}
        >
          <Clock className="w-4 h-4" />
          Ungraded Only
        </button>

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            background: "oklch(1 0 0 / 0.05)",
            border: "1px solid oklch(1 0 0 / 0.08)",
            color: "oklch(0.80 0.008 240)",
          }}
        >
          <option value="all">All Units</option>
          {exams.map((e) => (
            <option key={e.id} value={e.unit_code}>
              {e.unit_code}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            background: "oklch(1 0 0 / 0.05)",
            border: "1px solid oklch(1 0 0 / 0.08)",
            color: "oklch(0.80 0.008 240)",
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="graded">Graded</option>
          <option value="reviewed">Reviewed</option>
        </select>

        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
          style={{
            background: "oklch(1 0 0 / 0.05)",
            border: "1px solid oklch(1 0 0 / 0.08)",
            color: "oklch(0.58 0.012 240)",
          }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowDistribution(!showDistribution)}
          className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all"
          style={{
            background: showDistribution ? "oklch(0.65 0.15 200 / 0.2)" : "oklch(1 0 0 / 0.05)",
            border: showDistribution ? "1px solid oklch(0.65 0.15 200 / 0.4)" : "1px solid oklch(1 0 0 / 0.08)",
            color: showDistribution ? "oklch(0.65 0.15 200)" : "oklch(0.58 0.012 240)",
          }}
        >
          <BarChart3 className="w-4 h-4" />
          Distribution
        </button>

        <button
          onClick={handleExportGrades}
          disabled={exporting || filtered.filter(s => s.total_score !== null).length === 0}
          className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
          style={{
            background: "oklch(0.72 0.18 160 / 0.15)",
            border: "1px solid oklch(0.72 0.18 160 / 0.3)",
            color: "oklch(0.72 0.18 160)",
          }}
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>

        <button
          onClick={() => {
            setSelectedPracticalCandidate(null);
            setIsObservationModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-sm bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40"
          title="Open TVET CDACC Practical Observation Checklist (Simulated Red Pen Marking)"
        >
          <PenTool className="w-4 h-4 text-red-400" />
          <span>Mark Practical (Observation Checklist)</span>
        </button>
      </div>

      {/* Grade Distribution Chart */}
      {showDistribution && (() => {
        const { distribution, total } = calculateDistribution();
        const maxCount = Math.max(...Object.values(distribution), 1);
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4 mb-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.65 0.15 200)" }}>
                Grade Distribution ({total} graded)
              </h3>
              <button
                onClick={() => setShowDistribution(false)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: "oklch(1 0 0 / 0.1)",
                  color: "oklch(0.50 0.010 240)",
                }}
              >
                Close
              </button>
            </div>
            <div className="flex items-end gap-3 h-32">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
                const count = distribution[grade];
                const height = total > 0 ? (count / maxCount) * 100 : 0;
                const gradeColor = {
                  A: "oklch(0.72 0.18 160)",
                  B: "oklch(0.65 0.15 200)",
                  C: "oklch(0.75 0.14 80)",
                  D: "oklch(0.65 0.22 25)",
                  F: "oklch(0.50 0.010 240)",
                }[grade];
                return (
                  <div key={grade} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                        background: gradeColor,
                        opacity: 0.8,
                      }}
                    />
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: gradeColor }}>
                        {grade}
                      </div>
                      <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                        {count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total", value: submissions.length, color: "oklch(0.65 0.15 200)" },
          { label: "Pending", value: submissions.filter((s) => s.status === "pending").length, color: "oklch(0.75 0.14 80)" },
          { label: "Graded", value: submissions.filter((s) => s.status !== "pending").length, color: "oklch(0.72 0.18 160)" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 flex items-center gap-3">
            <span
              className="text-xl font-bold font-mono"
              style={{ color: stat.color }}
            >
              {stat.value}
            </span>
            <span className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Submissions list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "oklch(1 0 0 / 0.05)" }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="glass-card py-16 flex flex-col items-center gap-3">
            <BookOpen className="w-10 h-10 opacity-20" style={{ color: "oklch(0.72 0.18 160)" }} />
            <p className="text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
              No submissions match your filters
            </p>
          </div>
        ) : (
          filtered.map((sub, i) => {
            const exam = getExamForSub(sub);
            const isExpanded = expandedSub === sub.id;
            const isSaving = saving === sub.id;
            const subEdits = editedScores[sub.id] ?? {};

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: "oklch(0.65 0.15 200 / 0.15)",
                      color: "oklch(0.65 0.15 200)",
                      fontFamily: "Syne, sans-serif",
                    }}
                  >
                    {sub.student_name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.94 0.005 240)" }}>
                        {sub.student_name}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "oklch(0.50 0.010 240)" }}>
                        {sub.reg_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                        {sub.unit_code}
                      </span>
                      <span className="text-xs" style={{ color: "oklch(0.45 0.010 240)" }}>
                        {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {sub.total_score !== null && (
                      <div className="text-right">
                        <div
                          className="text-lg font-bold font-mono"
                          style={{ color: getScoreColor(sub.total_score) }}
                        >
                          {Math.round(sub.total_score)}
                          <span className="text-xs font-normal opacity-60">/{exam?.payload?.total_marks ?? 100}</span>
                        </div>
                        <div
                          className="text-xs font-bold flex items-center justify-end gap-1.5 mt-1"
                          style={{ color: getScoreColor(sub.total_score) }}
                        >
                          Grade {getGrade(sub.total_score)}
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider" style={{ background: sub.total_score >= 50 ? "oklch(0.65 0.15 160 / 0.15)" : "oklch(0.65 0.22 25 / 0.15)", color: sub.total_score >= 50 ? "oklch(0.65 0.15 160)" : "oklch(0.65 0.22 25)" }}>
                            {sub.total_score >= 50 ? "PASS" : "FAIL"}
                          </span>
                        </div>
                      </div>
                    )}

                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium status-${sub.status}`}>
                      {sub.status}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: "oklch(0.50 0.010 240)" }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: "oklch(0.50 0.010 240)" }} />
                    )}
                  </div>
                </div>

                {/* Expanded grading panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-5 pt-2 space-y-5"
                        style={{ borderTop: "1px solid oklch(1 0 0 / 0.08)" }}
                      >
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {sub.status === "pending" && exam && (
                            <button
                              onClick={() => handleAutoGrade(sub)}
                              disabled={isSaving}
                              className="btn-emerald flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isSaving ? "Grading..." : "Auto-Grade MCQ"}
                            </button>
                          )}
                          {sub.status === "graded" && (
                            <button
                              onClick={() => handleMarkReviewed(sub)}
                              disabled={isSaving}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{
                                background: "oklch(0.65 0.15 200 / 0.15)",
                                border: "1px solid oklch(0.65 0.15 200 / 0.3)",
                                color: "oklch(0.65 0.15 200)",
                              }}
                            >
                              <Award className="w-3.5 h-3.5" />
                              Mark as Reviewed
                            </button>
                          )}
                          {Object.keys(subEdits).length > 0 && (
                            <button
                              onClick={() => handleSaveAllScores(sub)}
                              disabled={isSaving}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{
                                background: "oklch(0.75 0.14 80 / 0.15)",
                                border: "1px solid oklch(0.75 0.14 80 / 0.3)",
                                color: "oklch(0.75 0.14 80)",
                              }}
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save All Modified Marks
                            </button>
                          )}
                          <button
                            onClick={() => setMarkedScriptSub(sub)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 transition shadow-sm"
                            title="Open simulated red pen marked exam paper"
                          >
                            <PenTool className="w-3.5 h-3.5 text-red-400" />
                            View Marked Script (Red Pen)
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPracticalCandidate({
                                name: sub.student_name,
                                regCode: sub.reg_number,
                                unitCode: sub.unit_code,
                              });
                              setIsObservationModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition shadow-sm"
                            title="Open CDACC Practical Observation Checklist for this trainee"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                            Mark Practical Checklist
                          </button>
                        </div>

                        {/* Section A — Core Concepts & Short Answers */}
                        {exam && sub.section_a.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4
                                className="text-xs font-bold"
                                style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.72 0.18 160)" }}
                              >
                                Section A — Core Concepts & Objective/Short Answer
                                <span className="font-mono ml-2 font-normal" style={{ color: "oklch(0.50 0.010 240)" }}>
                                  {sub.section_a.reduce((s, a) => s + (a.marks_awarded ?? 0), 0)} /{" "}
                                  {exam.payload?.section_a?.total_marks ?? 30} marks
                                </span>
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {sub.section_a.map((ans, qi) => {
                                const question = exam.payload?.section_a?.questions?.find(
                                  (q) => q.id === ans.question_id
                                );
                                const currentMarks = subEdits[ans.question_id] ?? ans.marks_awarded ?? 0;
                                let ansDisplay = String(ans.answer ?? "");
                                if (question?.type === "mcq" && question.options && !isNaN(Number(ansDisplay))) {
                                  const optIdx = Number(ansDisplay);
                                  ansDisplay = `Option ${String.fromCharCode(65 + optIdx)}: ${question.options[optIdx] ?? ""}`;
                                } else if (question?.type === "true_false") {
                                  ansDisplay = ansDisplay === "0" ? "True" : ansDisplay === "1" ? "False" : ansDisplay;
                                }

                                return (
                                  <div
                                    key={ans.question_id}
                                    className="p-3.5 rounded-xl space-y-2.5"
                                    style={{
                                      background: "oklch(1 0 0 / 0.04)",
                                      border: ans.flagged_for_review
                                        ? "1px solid rgba(245, 158, 11, 0.4)"
                                        : "1px solid oklch(1 0 0 / 0.08)",
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="text-xs font-bold" style={{ color: "oklch(0.72 0.18 160)" }}>
                                            Q{qi + 1}
                                          </span>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-mono bg-white/5 text-slate-300">
                                            {question?.type || "objective"}
                                          </span>
                                          {ans.flagged_for_review && (
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Needs Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs font-medium leading-snug mb-1.5 text-slate-200">
                                          {question?.text}
                                        </p>
                                        <div className="text-xs p-2 rounded-lg bg-black/20 text-slate-300 border border-white/5">
                                          <span className="text-[11px] text-slate-400 block mb-0.5">Candidate Response:</span>
                                          {ansDisplay || <em className="text-slate-500">No response provided</em>}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <input
                                          type="number"
                                          step="1"
                                          value={Math.round(currentMarks)}
                                          min={0}
                                          max={question?.marks ?? 10}
                                          onChange={(e) => {
                                            const val = Math.round(Math.min(
                                              Math.max(0, +e.target.value),
                                              question?.marks ?? 10
                                            ));
                                            setEditedScores((prev) => ({
                                              ...prev,
                                              [sub.id]: { ...prev[sub.id], [ans.question_id]: val },
                                            }));
                                            clearTimeout((window as any)[`debounce_${ans.question_id}`]);
                                            (window as any)[`debounce_${ans.question_id}`] = setTimeout(() => {
                                              autoSaveOverride(sub, ans.question_id, val, "a");
                                            }, 1000);
                                          }}
                                          onBlur={() => handleScoreBlur(sub, ans.question_id, currentMarks, "a")}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleScoreBlur(sub, ans.question_id, currentMarks, "a");
                                          }}
                                          className="w-16 text-center px-2 py-1.5 rounded-lg text-sm font-mono transition-all font-bold"
                                          style={{
                                            background: "oklch(0.72 0.18 160 / 0.1)",
                                            border: autoSaveStatus[ans.question_id] === "saved"
                                              ? "1px solid oklch(0.72 0.18 160 / 0.5)"
                                              : autoSaveStatus[ans.question_id] === "saving"
                                              ? "1px solid oklch(0.75 0.14 80 / 0.5)"
                                              : "1px solid oklch(0.72 0.18 160 / 0.3)",
                                            color: "oklch(0.72 0.18 160)",
                                          }}
                                        />
                                        <span className="text-xs font-mono" style={{ color: "oklch(0.50 0.010 240)" }}>
                                          / {question?.marks ?? 2}
                                        </span>
                                      </div>
                                    </div>

                                    {ans.ai_reasoning && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                        <Sparkles className="w-3 h-3 shrink-0 text-blue-400" />
                                        <span>Auto-Grader: {ans.ai_reasoning}</span>
                                      </div>
                                    )}

                                    {question?.correct_answer && (
                                      <div className="text-[11px] px-2.5 py-1.5 rounded-md bg-emerald-500/5 text-emerald-300/90 border border-emerald-500/15">
                                        <span className="font-semibold text-emerald-400">Marking Guide: </span>
                                        {String(question.correct_answer)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Section B — Structured Practical & Application */}
                        {exam && sub.section_b.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4
                                className="text-xs font-bold"
                                style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.65 0.15 200)" }}
                              >
                                Section B — Structured Practical Tasks
                                <span className="font-mono ml-2 font-normal" style={{ color: "oklch(0.50 0.010 240)" }}>
                                  {sub.section_b.reduce((s, a) => s + (a.marks_awarded ?? 0), 0)} /{exam.payload?.section_b?.total_marks ?? 40} marks
                                </span>
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {sub.section_b.map((ans, qi) => {
                                const question = exam.payload?.section_b?.questions?.find(
                                  (q) => q.id === ans.question_id
                                );
                                const currentMarks = subEdits[ans.question_id] ?? ans.marks_awarded ?? 0;
                                return (
                                  <div
                                    key={ans.question_id}
                                    className="p-4 rounded-xl space-y-3"
                                    style={{
                                      background: "oklch(1 0 0 / 0.04)",
                                      border: ans.flagged_for_review
                                        ? "1px solid rgba(245, 158, 11, 0.4)"
                                        : "1px solid oklch(1 0 0 / 0.08)",
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="text-xs font-bold" style={{ color: "oklch(0.65 0.15 200)" }}>
                                            Task {qi + 1}
                                          </span>
                                          {ans.flagged_for_review && (
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Needs Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs font-semibold whitespace-pre-line mb-2 text-slate-200">
                                          {question?.text}
                                        </p>
                                        <div className="text-xs p-3 rounded-lg bg-black/25 text-slate-200 border border-white/5 whitespace-pre-line">
                                          <span className="text-[11px] text-slate-400 block mb-1 font-mono">Candidate Work / Written Submission:</span>
                                          {typeof ans.answer === "string" && ans.answer.trim()
                                            ? ans.answer
                                            : <em className="text-slate-500">No response provided</em>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <input
                                          type="number"
                                          step="1"
                                          value={Math.round(currentMarks)}
                                          min={0}
                                          max={question?.marks ?? 30}
                                          onChange={(e) => {
                                            const val = Math.round(Math.min(
                                              Math.max(0, +e.target.value),
                                              question?.marks ?? 30
                                            ));
                                            setEditedScores((prev) => ({
                                              ...prev,
                                              [sub.id]: { ...prev[sub.id], [ans.question_id]: val },
                                            }));
                                            
                                            clearTimeout((window as any)[`debounce_${ans.question_id}`]);
                                            (window as any)[`debounce_${ans.question_id}`] = setTimeout(() => {
                                              autoSaveOverride(sub, ans.question_id, val, "b");
                                            }, 1000);
                                          }}
                                          onBlur={() => handleScoreBlur(sub, ans.question_id, currentMarks, "b")}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleScoreBlur(sub, ans.question_id, currentMarks, "b");
                                            }
                                          }}
                                          className="w-16 text-center px-2 py-1.5 rounded-lg text-sm font-mono transition-all font-bold"
                                          style={{
                                            background: "oklch(0.65 0.15 200 / 0.1)",
                                            border: autoSaveStatus[ans.question_id] === "saved" 
                                              ? "1px solid oklch(0.72 0.18 160 / 0.5)"
                                              : autoSaveStatus[ans.question_id] === "saving"
                                              ? "1px solid oklch(0.75 0.14 80 / 0.5)"
                                              : "1px solid oklch(0.65 0.15 200 / 0.3)",
                                            color: "oklch(0.65 0.15 200)",
                                          }}
                                        />
                                        <span className="text-xs font-mono" style={{ color: "oklch(0.50 0.010 240)" }}>
                                          / {question?.marks ?? 20}
                                        </span>
                                      </div>
                                    </div>

                                    {ans.ai_reasoning && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                        <Sparkles className="w-3 h-3 shrink-0 text-blue-400" />
                                        <span>Auto-Grader: {ans.ai_reasoning}</span>
                                      </div>
                                    )}

                                    {question?.correct_answer && (
                                      <div className="text-[11px] px-3 py-2 rounded-lg bg-emerald-500/5 text-emerald-300/90 border border-emerald-500/15">
                                        <span className="font-semibold text-emerald-400">Marking Rubric: </span>
                                        {String(question.correct_answer)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Trainer Feedback Remarks */}
                        <div className="p-4 rounded-xl space-y-2 bg-white/[0.02] border border-white/10">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-bold text-amber-400">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Assessor / Trainer Examination Feedback & Remarks
                            </label>
                            <button
                              onClick={() => {
                                const val = trainerComments[sub.id] ?? sub.trainer_comments ?? "";
                                gradeSubmission(sub.id, { trainer_comments: val });
                                toast.success("Feedback remarks saved");
                              }}
                              className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-medium transition-colors"
                            >
                              Save Feedback
                            </button>
                          </div>
                          <textarea
                            value={trainerComments[sub.id] ?? sub.trainer_comments ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTrainerComments((prev) => ({ ...prev, [sub.id]: val }));
                            }}
                            placeholder="Enter overall competency remarks, constructive feedback, or recommendations for trainee..."
                            rows={3}
                            className="w-full text-xs p-3 rounded-lg resize-y bg-black/20 border border-white/10 text-slate-100"
                          />
                        </div>

                        {/* Export Official Documents */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-slate-400">
                            Generate and download official assessment report document for this candidate:
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setMarkedScriptSub(sub)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all"
                              title="View visual marked exam sheet with red pen annotations"
                            >
                              <PenTool className="w-3.5 h-3.5 text-red-400" />
                              View Marked Script (Red Pen)
                            </button>
                            <button
                              onClick={() => handleExportDocument(sub, "docx")}
                              disabled={exporting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                            >
                              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                              Export DOCX
                            </button>
                            <button
                              onClick={() => handleExportDocument(sub, "pdf")}
                              disabled={exporting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition-all"
                            >
                              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              Export PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* Visual Marked Script Modal (Simulated Red Pen Annotations) */}
      <MarkedExamScriptModal
        isOpen={!!markedScriptSub}
        onClose={() => setMarkedScriptSub(null)}
        submission={markedScriptSub}
        exam={markedScriptSub ? (getExamForSub(markedScriptSub) ?? null) : null}
        trainerName="Alexander Kinoti"
      />

      {/* Practical Observation Checklist Modal (TVET CDACC Red Pen Marking Engine) */}
      <ObservationChecklistMarkingModal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        candidateName={selectedPracticalCandidate?.name || "Nthiga Gakii Doris"}
        candidateRegCode={selectedPracticalCandidate?.regCode || "14179/S2026"}
        unitCode={selectedPracticalCandidate?.unitCode || "ICT/OS/IT/CR/1/6"}
        unitTitle="PERFORM COMPUTER NETWORKING"
        qualificationCode="061006T4ICT - ICT TECHNICIAN LEVEL 6"
        assessorName="MR Muthomi"
        onSave={(total, pct, comp, feed) => {
          toast.success("Practical Assessment Saved Online", {
            description: `${selectedPracticalCandidate?.name || "Candidate"}: ${total}/50 (${pct}%) — ${comp ? "COMPETENT [✓]" : "NOT YET COMPETENT"}`
          });
        }}
      />
    </TrainerLayout>
  );
}

