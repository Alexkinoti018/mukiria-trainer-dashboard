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
  Users,
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
import {
  supabase,
  isSupabaseConfigured,
  normalizeAssessmentTaskSlot,
  type AssessmentTaskSlot,
} from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";
import {
  useTrainees,
  findMatchingTrainee,
  syncScoreToContinuousMarksheet,
} from "@/contexts/TraineeContext";
import type { Exam, Submission, StudentAnswer, ExamQuestion } from "@/lib/supabase";
import { buildUnifiedGradedExamData, exportGradedExamPDFClientSide } from "@/lib/exportGradedExamPdf";
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

const TASK_SLOT_LABELS: Record<AssessmentTaskSlot, string> = {
  CT1: "CT1 (CAT 1)",
  CT2: "CT2 (CAT 2)",
  CT3: "CT3 (CAT 3)",
  CP1: "CP1 (Prac 1)",
  CP2: "CP2 (Prac 2)",
  CP3: "CP3 (Prac 3)",
  Assignment: "Assignment",
  Project: "Project (40%)",
};

export default function Grading() {
  const { exams, submissions, gradeSubmission } = useExam();
  const { trainees, uploads, awardUploadMark } = useTrainees();
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
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
  const [uploadQuickScore, setUploadQuickScore] = useState<Record<string, string>>({});
  const [uploadQuickTask, setUploadQuickTask] = useState<Record<string, AssessmentTaskSlot>>({});

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
    exams.find((e) => e.id === sub.exam_id) ||
    exams.find((e) => e.unit_code === sub.unit_code);

  const getSubmissionTaskSlot = (sub: Submission): AssessmentTaskSlot => {
    const exam = getExamForSub(sub);
    return (
      normalizeAssessmentTaskSlot(
        sub.task_code || exam?.payload?.task_code,
        sub.unit_code,
        exam?.payload?.title || exam?.course_name,
        sub.assessment_type || exam?.payload?.assessment_type
      ) || "CT1"
    );
  };

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
    const endpoint =
      formatType === "docx"
        ? "http://localhost:8000/api/export-exam-results-docx"
        : "http://localhost:8000/api/export-exam-results-pdf";

    setExporting(true);
    try {
      const subWithComments = {
        ...sub,
        trainer_comments: trainerComments[sub.id] ?? sub.trainer_comments,
      };
      const unified = buildUnifiedGradedExamData(subWithComments, exam, "Alexander Kinoti");

      const secA = unified.section_a.map((q) => ({
        q_num: q.q_num,
        type: q.type,
        text: q.text,
        options: q.options,
        selected_option_index: q.selected_option_index,
        correct_option_index: q.correct_option_index,
        answer: q.formatted_answer || "No response",
        correct_answer: q.formatted_correct_answer,
        marks_awarded: q.marks_awarded,
        max_marks: q.max_marks,
        sub_parts: q.sub_parts,
        breakdown: q.breakdown,
        ai_reasoning: q.ai_reasoning,
      }));

      const secB = unified.section_b.map((q) => ({
        q_num: q.q_num,
        type: q.type,
        text: q.text,
        options: q.options,
        answer: q.formatted_answer || "No response",
        correct_answer: q.formatted_correct_answer,
        marks_awarded: q.marks_awarded,
        max_marks: q.max_marks,
        sub_parts: q.sub_parts,
        breakdown: q.breakdown,
        ai_reasoning: q.ai_reasoning,
      }));

      const payload = {
        student_name: unified.student_name,
        reg_number: unified.reg_number,
        department: unified.department,
        course_name: unified.course_name,
        course_code: unified.course_code,
        unit_name: unified.unit_name,
        unit_code: unified.unit_code,
        class_code: unified.class_code,
        series: unified.series,
        time_allowed: unified.time_allowed,
        exam_title: unified.exam_title,
        instructions: unified.instructions,
        section_a_instructions: unified.section_a_instructions,
        section_b_instructions: unified.section_b_instructions,
        evaluated_at: unified.evaluated_at,
        total_score: unified.total_score,
        total_marks: unified.total_marks,
        percentage: unified.percentage,
        grade:
          unified.percentage >= 80
            ? "DISTINCTION"
            : unified.percentage >= 65
            ? "CREDIT"
            : unified.percentage >= 50
            ? "PASS"
            : "REFER",
        status: unified.status_label,
        trainer_comments: unified.trainer_comments,
        trainer_name: unified.trainer_name,
        section_a: secA,
        section_b: secB,
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Export service error (${res.status})`);
        }

        const resData = await res.json();
        const fileData = resData.data || resData.file_data;
        if ((resData.status === "success" || resData.success) && fileData) {
          const mime =
            formatType === "docx"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/pdf";
          downloadBase64File(fileData, resData.filename, mime);
          toast.success(`Exported as ${formatType.toUpperCase()}`, {
            description: `Downloaded ${resData.filename}`,
          });
          return;
        }
        throw new Error(resData.detail || "Server failed to produce document data");
      } catch (backendErr) {
        if (formatType === "pdf") {
          exportGradedExamPDFClientSide(unified);
          toast.success("Exported as PDF", {
            description: `Downloaded official graded exam script for ${unified.student_name}`,
          });
          return;
        }
        throw backendErr;
      }
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Export Failed", {
        description: err.message || "Failed to contact export service",
      });
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

  // ── Filtered submissions & uploaded assessments ───────────
  const filtered = submissions.filter((s) => {
    const slot = getSubmissionTaskSlot(s);
    if (selectedUnit !== "all" && s.unit_code !== selectedUnit) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (taskFilter !== "all" && slot !== taskFilter) return false;
    if (showUngradedOnly && s.status !== "pending") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.student_name.toLowerCase().includes(q) ||
        s.reg_number.toLowerCase().includes(q) ||
        s.unit_code.toLowerCase().includes(q) ||
        slot.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredUploads = uploads.filter((u) => {
    const slot =
      normalizeAssessmentTaskSlot(u.task_code, u.unit_code, u.filename, u.uploadType) || "CP1";
    const mappedStatus = u.verified_by_trainer ? "reviewed" : u.status;
    if (selectedUnit !== "all" && !(u.unit_code || "").includes(selectedUnit.split(" ")[0])) return false;
    if (statusFilter !== "all" && mappedStatus !== statusFilter && u.status !== statusFilter) return false;
    if (taskFilter !== "all" && slot !== taskFilter) return false;
    if (showUngradedOnly && u.status !== "pending") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const regNo = u.reg_number || trainees.find(t => t.id === u.traineeId)?.admNo || u.traineeId;
      return (
        u.student_name.toLowerCase().includes(q) ||
        regNo.toLowerCase().includes(q) ||
        (u.unit_code || "").toLowerCase().includes(q) ||
        u.filename.toLowerCase().includes(q) ||
        slot.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getScoreColor = (score: number | null) => {
    if (score === null) return "#a1a1aa";
    if (score >= 80) return "#34d399";
    if (score >= 65) return "#6ee7b7";
    if (score >= 50) return "#fbbf24";
    return "#f87171";
  };

  const getGrade = (score: number | null) => {
    if (score === null) return "—";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  // Calculate grade distribution across both online submissions and graded assessment tasks
  const calculateDistribution = () => {
    const gradedSubs = filtered.filter(s => s.total_score !== null);
    const gradedUps = filteredUploads.filter(u => typeof u.grade === "number");
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    gradedSubs.forEach(s => {
      const exam = getExamForSub(s);
      const maxM = exam?.payload?.total_marks ?? 100;
      const pct = maxM > 0 && maxM !== 100 ? Math.round(((s.total_score ?? 0) / maxM) * 100) : (s.total_score ?? 0);
      const grade = getGrade(pct);
      if (grade in distribution) distribution[grade as keyof typeof distribution]++;
    });
    gradedUps.forEach(u => {
      const grade = getGrade(u.grade);
      if (grade in distribution) distribution[grade as keyof typeof distribution]++;
    });
    return { distribution, total: gradedSubs.length + gradedUps.length };
  };

  // Export grades to CSV
  const handleExportGrades = async () => {
    setExporting(true);
    try {
      const gradedSubs = filtered.filter(s => s.total_score !== null);
      const gradedUps = filteredUploads.filter(u => typeof u.grade === "number");
      const csvRows = [
        ['Student Name', 'Registration Number', 'Unit Code', 'Assessment Slot', 'Total Score (%)', 'Grade', 'Status', 'Submitted', 'Section A Score', 'Section B Score', 'Trainer Comments'].join(','),
      ];

      gradedSubs.forEach(sub => {
        const exam = getExamForSub(sub);
        const maxM = exam?.payload?.total_marks ?? 100;
        const pct = maxM > 0 && maxM !== 100 ? Math.round(((sub.total_score ?? 0) / maxM) * 100) : (sub.total_score ?? 0);
        const slot = getSubmissionTaskSlot(sub);
        const sectionAScore = sub.section_a.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
        const sectionBScore = sub.section_b.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0);
        const comments = trainerComments[sub.id] || sub.trainer_comments || '';
        const row = [
          `"${sub.student_name}"`,
          `"${sub.reg_number}"`,
          `"${sub.unit_code}"`,
          `"${slot}"`,
          pct,
          getGrade(pct),
          sub.status,
          format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm'),
          sectionAScore,
          sectionBScore,
          `"${comments.replace(/"/g, '""')}"`,
        ].join(',');
        csvRows.push(row);
      });

      gradedUps.forEach(up => {
        const slot = normalizeAssessmentTaskSlot(up.task_code, up.unit_code, up.filename, up.uploadType) || 'CP1';
        const regNo = up.reg_number || trainees.find(t => t.id === up.traineeId)?.admNo || up.traineeId;
        const row = [
          `"${up.student_name}"`,
          `"${regNo}"`,
          `"${up.unit_code || ''}"`,
          `"${slot}"`,
          up.grade ?? 0,
          getGrade(up.grade),
          up.status,
          `"${up.submitted_at}"`,
          0,
          up.grade ?? 0,
          `"${(up.comments || up.filename).replace(/"/g, '""')}"`,
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
      toast.success('Grades Exported', { description: `${gradedSubs.length + gradedUps.length} graded assessments exported to CSV` });
    } catch (err: any) {
      toast.error('Export Failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const totalItemsCount = submissions.length + uploads.length;
  const pendingItemsCount =
    submissions.filter((s) => s.status === "pending").length +
    uploads.filter((u) => u.status === "pending").length;
  const gradedItemsCount =
    submissions.filter((s) => s.status !== "pending").length +
    uploads.filter((u) => u.status !== "pending").length;

  return (
    <TrainerLayout title="Grading Interface" subtitle="Review and grade CATs (CT1–CT3), Practicals (CP1–CP3), Assignments & Projects">
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
          Grading Sheet (CATs, CT1–3, CP1–3, Project, Assignment)
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
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl flex-1 min-w-48 bg-white border border-slate-300 shadow-sm">
          <Search className="w-4 h-4 shrink-0 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, reg number, CT1, CP1, Project..."
            className="bg-transparent text-sm flex-1 outline-none text-[#0f172a] placeholder-slate-400"
          />
        </div>

        <button
          onClick={() => setShowUngradedOnly(!showUngradedOnly)}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
            showUngradedOnly
              ? "bg-amber-50 border-[#c48820] text-[#c48820]"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-4 h-4" />
          Ungraded Only
        </button>

        <select
          value={taskFilter}
          onChange={(e) => setTaskFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0f172a] shadow-sm focus:outline-none focus:border-[#000953]"
        >
          <option value="all">All Assessment Slots</option>
          <option value="CT1">CT1 (CAT 1)</option>
          <option value="CT2">CT2 (CAT 2)</option>
          <option value="CT3">CT3 (CAT 3)</option>
          <option value="CP1">CP1 (Practical 1)</option>
          <option value="CP2">CP2 (Practical 2)</option>
          <option value="CP3">CP3 (Practical 3)</option>
          <option value="Assignment">Assignment</option>
          <option value="Project">Project (40%)</option>
        </select>

        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0f172a] shadow-sm focus:outline-none focus:border-[#000953]"
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
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0f172a] shadow-sm focus:outline-none focus:border-[#000953]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="graded">Graded</option>
          <option value="reviewed">Reviewed / Verified</option>
        </select>

        <button
          onClick={() => setShowDistribution(!showDistribution)}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
            showDistribution
              ? "bg-[#000953] text-white border-[#000953]"
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Distribution
        </button>

        <button
          onClick={handleExportGrades}
          disabled={exporting || (filtered.filter(s => s.total_score !== null).length + filteredUploads.filter(u => typeof u.grade === "number").length) === 0}
          className="px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#000953]" />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>

        <button
          onClick={() => {
            setSelectedPracticalCandidate(null);
            setIsObservationModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm"
          title="Open TVET CDACC Practical Observation Checklist (Simulated Red Pen Marking)"
        >
          <PenTool className="w-4 h-4 text-[#c48820]" />
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
            className="bg-white border border-slate-300 rounded-2xl shadow-sm p-5 mb-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#000953]">
                Grade Distribution ({total} graded assessments)
              </h3>
              <button
                onClick={() => setShowDistribution(false)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>
            <div className="flex items-end gap-3 h-32">
              {(['A', 'B', 'C', 'D', 'F'] as const).map((grade) => {
                const count = distribution[grade];
                const height = total > 0 ? (count / maxCount) * 100 : 0;
                const gradeColor = {
                  A: "#059669",
                  B: "#000953",
                  C: "#c48820",
                  D: "#d97706",
                  F: "#e11d48",
                }[grade];
                return (
                  <div key={grade} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                        background: gradeColor,
                        opacity: 0.85,
                      }}
                    />
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: gradeColor }}>
                        {grade}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Assessments (CATs, CP, Project, Assign.)", value: totalItemsCount, color: "text-[#000953]" },
          { label: "Pending Review", value: pendingItemsCount, color: "text-[#c48820]" },
          { label: "Graded & Reflected in Marksheet", value: gradedItemsCount, color: "text-emerald-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-300 shadow-sm p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">{stat.label}</span>
              <span className={`text-2xl font-bold font-mono ${stat.color}`}>
                {stat.value}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#000953]">
              <Users className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Submissions list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-slate-200 border border-slate-300" />
          ))
        ) : filtered.length === 0 && filteredUploads.length === 0 ? (
          <div className="bg-white border border-slate-300 rounded-2xl shadow-sm py-16 flex flex-col items-center gap-3">
            <BookOpen className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              No assessments match your filters
            </p>
          </div>
        ) : (
          filtered.map((sub, i) => {
            const exam = getExamForSub(sub);
            const isExpanded = expandedSub === sub.id;
            const isSaving = saving === sub.id;
            const subEdits = editedScores[sub.id] ?? {};
            const slot = getSubmissionTaskSlot(sub);
            const unified = buildUnifiedGradedExamData(sub, exam, "Alexander Kinoti");
            const maxMarks = unified.total_marks;
            const pctScore = sub.total_score !== null ? unified.percentage : null;

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden hover:border-[#000953]/60 transition-colors"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#000953] text-white shadow-sm">
                    {sub.student_name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#0f172a]">
                        {sub.student_name}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {sub.reg_number}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#000953] text-white border border-[#000953]">
                        {TASK_SLOT_LABELS[slot]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#000953]">
                        {sub.unit_code}
                      </span>
                      {exam?.payload?.title && (
                        <span className="text-xs font-semibold text-slate-600">
                          • {exam.payload.title}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {sub.total_score !== null && pctScore !== null && (
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-[#000953]">
                          {unified.total_score}
                          <span className="text-xs font-normal text-slate-500">/{maxMarks}</span>
                          <span className="ml-1.5 text-xs font-bold text-[#c48820]">({pctScore}%)</span>
                        </div>
                        <div className="text-xs font-bold flex items-center justify-end gap-1.5 mt-1 text-slate-700">
                          Grade {getGrade(pctScore)}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                            pctScore >= 50
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : "bg-rose-50 text-rose-700 border-rose-300"
                          }`}>
                            {pctScore >= 50 ? "PASS" : "FAIL"}
                          </span>
                        </div>
                      </div>
                    )}

                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      sub.status === "graded" || sub.status === "reviewed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-[#c48820] border-amber-200"
                    }`}>
                      {sub.status}
                    </span>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
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
                      <div className="px-5 pb-5 pt-3 space-y-5 border-t border-slate-200 bg-slate-50/40">
                        {/* Action buttons + Marksheet Slot Mapping */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {sub.status === "pending" && exam && (
                              <button
                                onClick={() => handleAutoGrade(sub)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {isSaving ? "Grading..." : "Auto-Grade MCQ"}
                              </button>
                            )}
                            {Object.keys(subEdits).length > 0 && (
                              <button
                                onClick={() => handleSaveAllScores(sub)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#000953] hover:bg-[#000e7a] text-white transition shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5 text-[#c48820]" />
                                {isSaving ? "Saving..." : "Save All Modified Marks"}
                              </button>
                            )}
                            <button
                              onClick={() => setMarkedScriptSub(sub)}
                              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition"
                              title="Open simulated red pen marked exam paper"
                            >
                              <PenTool className="w-3.5 h-3.5 text-[#c48820]" />
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
                              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#000953] border border-[#000953] shadow-sm transition"
                              title="Open CDACC Practical Observation Checklist for this trainee"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-[#000953]" />
                              Mark Practical Checklist
                            </button>
                            {sub.status === "graded" && (
                              <button
                                onClick={() => handleMarkReviewed(sub)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition"
                              >
                                <Award className="w-3.5 h-3.5 text-[#c48820]" />
                                Mark as Reviewed
                              </button>
                            )}
                          </div>

                          {/* Marksheet Assessment Slot Selector */}
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
                            <span className="text-[11px] font-bold uppercase text-slate-600">
                              Marksheet Column:
                            </span>
                            <select
                              value={slot}
                              onChange={(e) => {
                                const newSlot = e.target.value as AssessmentTaskSlot;
                                gradeSubmission(sub.id, { task_code: newSlot });
                                toast.success(`Mapped ${sub.student_name} to ${TASK_SLOT_LABELS[newSlot]} in Continuous Assessment Marksheet`);
                              }}
                              className="text-xs font-bold text-[#000953] bg-transparent outline-none cursor-pointer"
                            >
                              {(Object.keys(TASK_SLOT_LABELS) as AssessmentTaskSlot[]).map((k) => (
                                <option key={k} value={k}>
                                  {TASK_SLOT_LABELS[k]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Official Exam Paper Header & Instructions Banner (Matches Trainee Exam Format) */}
                        <div className="p-4 rounded-xl bg-white border-2 border-[#000953]/20 shadow-sm space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {unified.institution} • {unified.department.replace(/\n/g, " / ")}
                              </p>
                              <h4 className="text-sm font-extrabold text-[#000953] uppercase mt-0.5">
                                {unified.exam_header} — {unified.exam_title}
                              </h4>
                              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                                {unified.course_name} ({unified.unit_code} — {unified.unit_name})
                              </p>
                            </div>
                            <div className="text-right text-xs space-y-0.5">
                              <div className="font-bold text-[#000953]">
                                Time Allowed: <span className="text-[#c48820]">{unified.time_allowed}</span> | Total Marks: <span className="text-[#c48820]">{unified.total_marks}</span>
                              </div>
                              <div className="text-slate-600 font-medium">
                                Class: {unified.class_code} • Series: {unified.series}
                              </div>
                            </div>
                          </div>

                          {unified.instructions && unified.instructions.length > 0 && (
                            <div className="text-xs bg-[#fef6e7] border border-[#c48820]/40 rounded-lg p-2.5 text-slate-800">
                              <span className="font-bold uppercase text-[#000953] block mb-1 text-[11px]">
                                Instructions to Candidate (As Shown on Trainee Exam):
                              </span>
                              <ol className="list-decimal list-inside space-y-0.5 text-[11px] font-medium">
                                {unified.instructions.map((inst, idx) => (
                                  <li key={idx}>{inst}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>

                        {/* Section A — Compulsory Objective & Short Answer Questions */}
                        {unified.section_a.length > 0 && (
                          <div>
                            <div className="flex flex-wrap items-center justify-between mb-3 pb-2 border-b-2 border-[#000953]">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-4 bg-[#c48820] rounded-full" />
                                  <h4 className="text-xs font-bold text-[#000953] uppercase tracking-wide">
                                    SECTION A ({unified.sec_a_max} MARKS)
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5 pl-3.5">
                                  {unified.section_a_instructions}
                                </p>
                              </div>
                              <span className="font-mono text-xs font-bold text-[#000953]">
                                Section A Subtotal: {unified.sec_a_awarded} / {unified.sec_a_max} marks
                              </span>
                            </div>
                            <div className="space-y-3">
                              {unified.section_a.map((q, qi) => {
                                const origAns = sub.section_a.find(
                                  (a) => String(a.question_id) === String(q.question_id)
                                ) || sub.section_a[qi];
                                const qIdKey = origAns?.question_id || q.question_id;
                                const currentMarks = subEdits[qIdKey] ?? q.marks_awarded;

                                return (
                                  <div
                                    key={q.question_id || qi}
                                    className="p-4 rounded-xl space-y-2.5 bg-white border border-slate-300 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#000953] text-white">
                                            Q{q.q_num || qi + 1}
                                          </span>
                                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {q.type === "mcq" ? "Multiple Choice" : q.type === "tf" ? "True / False" : "Short Answer"} ({q.max_marks} Marks)
                                          </span>
                                          {origAns?.flagged_for_review && (
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-[#c48820] border border-amber-300 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Needs Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm font-semibold leading-snug mb-2 text-[#0f172a]">
                                          {q.text}
                                        </p>

                                        {/* Sub-parts if any */}
                                        {q.sub_parts && q.sub_parts.length > 0 && (
                                          <div className="mb-2.5 pl-3 border-l-2 border-[#000953]/30 space-y-1 bg-slate-50 py-1.5 pr-2 rounded-r">
                                            {q.sub_parts.map((sp, spIdx) => (
                                              <p key={spIdx} className="text-xs text-slate-800 font-medium">
                                                {sp}
                                              </p>
                                            ))}
                                          </div>
                                        )}

                                        {/* Multiple Choice Options (A, B, C, D) — Identical to Trainee Exam */}
                                        {q.type === "mcq" && q.options && q.options.length > 0 ? (
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {q.options.map((opt, oIdx) => {
                                              const isSelected = q.selected_option_index === oIdx;
                                              const isCorrect = q.correct_option_index === oIdx;
                                              const letter = String.fromCharCode(65 + oIdx);
                                              return (
                                                <div
                                                  key={oIdx}
                                                  className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border text-xs ${
                                                    isSelected && isCorrect
                                                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold"
                                                      : isSelected && !isCorrect
                                                      ? "border-red-600 bg-red-50 text-red-950 font-semibold"
                                                      : isCorrect
                                                      ? "border-[#000953] bg-blue-50/70 text-[#000953] font-semibold"
                                                      : "border-slate-200 bg-slate-50/70 text-slate-700"
                                                  }`}
                                                >
                                                  <div className="flex items-start gap-2 min-w-0">
                                                    <span
                                                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${
                                                        isSelected
                                                          ? isCorrect
                                                            ? "bg-emerald-600 text-white border-emerald-600"
                                                            : "bg-red-600 text-white border-red-600"
                                                          : isCorrect
                                                          ? "bg-[#000953] text-white border-[#000953]"
                                                          : "bg-white text-slate-700 border-slate-300"
                                                      }`}
                                                    >
                                                      {letter}
                                                    </span>
                                                    <span className="leading-snug pt-0.5">{opt}</span>
                                                  </div>
                                                  {isSelected && (
                                                    <span
                                                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                                                        isCorrect
                                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                          : "bg-red-100 text-red-800 border-red-300"
                                                      }`}
                                                    >
                                                      {isCorrect ? "Candidate ✓" : "Candidate ✗"}
                                                    </span>
                                                  )}
                                                  {!isSelected && isCorrect && (
                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[#000953] border border-blue-300 shrink-0">
                                                      Correct Key ✓
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-xs p-3 rounded-lg bg-[#fffdfa] text-[#0f172a] border border-amber-200">
                                            <span className="text-[10px] text-[#000953] block mb-0.5 font-bold uppercase tracking-wider">
                                              Candidate Written Response:
                                            </span>
                                            {q.formatted_answer || (
                                              <em className="text-slate-400">No response provided</em>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <input
                                          type="number"
                                          step="1"
                                          value={Math.round(currentMarks)}
                                          min={0}
                                          max={q.max_marks}
                                          onChange={(e) => {
                                            const val = Math.round(
                                              Math.min(Math.max(0, +e.target.value), q.max_marks)
                                            );
                                            setEditedScores((prev) => ({
                                              ...prev,
                                              [sub.id]: { ...prev[sub.id], [qIdKey]: val },
                                            }));
                                            clearTimeout((window as any)[`debounce_${qIdKey}`]);
                                            (window as any)[`debounce_${qIdKey}`] = setTimeout(() => {
                                              autoSaveOverride(sub, qIdKey, val, "a");
                                            }, 1000);
                                          }}
                                          onBlur={() => handleScoreBlur(sub, qIdKey, currentMarks, "a")}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                              handleScoreBlur(sub, qIdKey, currentMarks, "a");
                                          }}
                                          className={`w-16 text-center px-2 py-1.5 rounded-lg text-sm font-mono font-bold transition-all bg-white text-[#000953] border ${
                                            autoSaveStatus[qIdKey] === "saved"
                                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                                              : autoSaveStatus[qIdKey] === "saving"
                                              ? "border-[#c48820] ring-2 ring-[#c48820]/20"
                                              : "border-slate-300 focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/20"
                                          }`}
                                        />
                                        <span className="text-xs font-mono font-bold text-slate-600">
                                          / {q.max_marks}
                                        </span>
                                      </div>
                                    </div>

                                    {q.ai_reasoning && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-[#000953] bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 font-medium">
                                        <Sparkles className="w-3 h-3 shrink-0 text-[#c48820]" />
                                        <span>Assessor / Auto-Grader Evaluation: {q.ai_reasoning}</span>
                                      </div>
                                    )}

                                    {((q.breakdown && q.breakdown.length > 0) ||
                                      (q.formatted_correct_answer && q.type !== "mcq")) && (
                                      <div className="text-[11px] px-3 py-2 rounded-md bg-amber-50/70 text-slate-800 border border-amber-200">
                                        <span className="font-bold text-[#000953]">
                                          Official Marking Scheme:{" "}
                                        </span>
                                        {q.breakdown && q.breakdown.length > 0 ? (
                                          <span>{q.breakdown.join(" • ")}</span>
                                        ) : (
                                          <span>{q.formatted_correct_answer}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Section B — Structured Practical & Application */}
                        {unified.section_b.length > 0 && (
                          <div>
                            <div className="flex flex-wrap items-center justify-between mb-3 pb-2 border-b-2 border-[#000953]">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-4 bg-[#c48820] rounded-full" />
                                  <h4 className="text-xs font-bold text-[#000953] uppercase tracking-wide">
                                    SECTION B ({unified.sec_b_max} MARKS)
                                  </h4>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5 pl-3.5">
                                  {unified.section_b_instructions}
                                </p>
                              </div>
                              <span className="font-mono text-xs font-bold text-[#000953]">
                                Section B Subtotal: {unified.sec_b_awarded} / {unified.sec_b_max} marks
                              </span>
                            </div>
                            <div className="space-y-3">
                              {unified.section_b.map((q, qi) => {
                                const origAns = sub.section_b.find(
                                  (b) => String(b.question_id) === String(q.question_id)
                                ) || sub.section_b[qi];
                                const qIdKey = origAns?.question_id || q.question_id;
                                const currentMarks = subEdits[qIdKey] ?? q.marks_awarded;

                                return (
                                  <div
                                    key={q.question_id || qi}
                                    className="p-4 rounded-xl space-y-3 bg-white border border-slate-300 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-[#000953] text-white">
                                            Q{q.q_num || qi + 1}
                                          </span>
                                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            Structured / Practical ({q.max_marks} Marks)
                                          </span>
                                          {origAns?.flagged_for_review && (
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 text-[#c48820] border border-amber-300 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Needs Review
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm font-semibold whitespace-pre-line mb-2 text-[#0f172a]">
                                          {q.text}
                                        </p>

                                        {/* Structured Sub-parts (a, b, c, d) — Identical to Trainee Exam Paper */}
                                        {q.sub_parts && q.sub_parts.length > 0 && (
                                          <div className="mb-3 pl-3.5 border-l-2 border-[#000953]/30 space-y-1 bg-slate-50 py-2 pr-3 rounded-r">
                                            {q.sub_parts.map((sp, spIdx) => (
                                              <p
                                                key={spIdx}
                                                className="text-xs font-medium text-slate-800 leading-relaxed"
                                              >
                                                {sp}
                                              </p>
                                            ))}
                                          </div>
                                        )}

                                        <div className="text-xs p-3 rounded-lg bg-[#fffdfa] text-[#0f172a] border border-amber-200 whitespace-pre-line leading-relaxed">
                                          <span className="text-[10px] text-[#000953] block mb-1 font-bold uppercase tracking-wider">
                                            Candidate Written / Practical Submission:
                                          </span>
                                          {q.formatted_answer ? (
                                            q.formatted_answer
                                          ) : (
                                            <em className="text-slate-400">No response provided</em>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <input
                                          type="number"
                                          step="1"
                                          value={Math.round(currentMarks)}
                                          min={0}
                                          max={q.max_marks}
                                          onChange={(e) => {
                                            const val = Math.round(
                                              Math.min(Math.max(0, +e.target.value), q.max_marks)
                                            );
                                            setEditedScores((prev) => ({
                                              ...prev,
                                              [sub.id]: { ...prev[sub.id], [qIdKey]: val },
                                            }));

                                            clearTimeout((window as any)[`debounce_${qIdKey}`]);
                                            (window as any)[`debounce_${qIdKey}`] = setTimeout(() => {
                                              autoSaveOverride(sub, qIdKey, val, "b");
                                            }, 1000);
                                          }}
                                          onBlur={() => handleScoreBlur(sub, qIdKey, currentMarks, "b")}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              handleScoreBlur(sub, qIdKey, currentMarks, "b");
                                            }
                                          }}
                                          className={`w-16 text-center px-2 py-1.5 rounded-lg text-sm font-mono font-bold transition-all bg-white text-[#000953] border ${
                                            autoSaveStatus[qIdKey] === "saved"
                                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                                              : autoSaveStatus[qIdKey] === "saving"
                                              ? "border-[#c48820] ring-2 ring-[#c48820]/20"
                                              : "border-slate-300 focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/20"
                                          }`}
                                        />
                                        <span className="text-xs font-mono font-bold text-slate-600">
                                          / {q.max_marks}
                                        </span>
                                      </div>
                                    </div>

                                    {q.ai_reasoning && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-[#000953] bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 font-medium">
                                        <Sparkles className="w-3 h-3 shrink-0 text-[#c48820]" />
                                        <span>Assessor / Auto-Grader Evaluation: {q.ai_reasoning}</span>
                                      </div>
                                    )}

                                    {((q.breakdown && q.breakdown.length > 0) ||
                                      q.formatted_correct_answer) && (
                                      <div className="text-[11px] px-3 py-2 rounded-lg bg-amber-50/70 text-slate-800 border border-amber-200">
                                        <span className="font-bold text-[#000953] block mb-0.5">
                                          Official Marking Scheme / Rubric Breakdown:
                                        </span>
                                        {q.breakdown && q.breakdown.length > 0 ? (
                                          <ul className="list-disc list-inside space-y-0.5">
                                            {q.breakdown.map((bItem, bIdx) => (
                                              <li key={bIdx}>{bItem}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span>{q.formatted_correct_answer}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Trainer Feedback Remarks */}
                        <div className="p-4 rounded-xl space-y-2.5 bg-white border border-slate-300 shadow-sm">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-bold text-[#000953]">
                              <MessageSquare className="w-3.5 h-3.5 text-[#c48820]" />
                              Assessor / Trainer Examination Feedback & Remarks
                            </label>
                            <button
                              onClick={() => {
                                const val = trainerComments[sub.id] ?? sub.trainer_comments ?? "";
                                gradeSubmission(sub.id, { trainer_comments: val });
                                toast.success("Feedback remarks saved");
                              }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-[#000953] hover:bg-[#000e7a] text-white font-bold transition-colors shadow-sm"
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
                            className="w-full text-xs p-3 rounded-lg resize-y bg-white border border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15"
                          />
                        </div>

                        {/* Export Official Documents */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                          <div className="text-xs font-medium text-slate-600">
                            Generate and download official assessment report document for this candidate:
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => setMarkedScriptSub(sub)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition"
                              title="View visual marked exam sheet with red pen annotations"
                            >
                              <PenTool className="w-3.5 h-3.5 text-[#c48820]" />
                              View Marked Script
                            </button>
                            <button
                              onClick={() => handleExportDocument(sub, "docx")}
                              disabled={exporting}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#000953] border border-slate-300 shadow-sm transition"
                            >
                              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 text-[#000953]" />}
                              Export DOCX
                            </button>
                            <button
                              onClick={() => handleExportDocument(sub, "pdf")}
                              disabled={exporting}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-[#000953] border border-slate-300 shadow-sm transition"
                            >
                              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#000953]" />}
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

        {/* Graded & Pending Continuous Assessment Tasks (CATs/CT1-3, Practicals/CP1-3, Assignments, Projects) */}
        {!loading && filteredUploads.length > 0 && (
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#c48820] rounded-full" />
                <h3 className="text-sm font-bold text-[#000953] uppercase tracking-wider">
                  Continuous Assessment Tasks — CATs (CT1–CT3), Practicals (CP1–CP3), Assignments &amp; Projects ({filteredUploads.length})
                </h3>
              </div>
              <button
                onClick={() => setViewMode("batch_marksheet")}
                className="text-xs font-bold text-[#000953] hover:underline flex items-center gap-1"
              >
                <Award className="w-3.5 h-3.5 text-[#c48820]" />
                View in Continuous Assessment Mark Sheet →
              </button>
            </div>

            {filteredUploads.map((up, idx) => {
              const resolvedSlot =
                uploadQuickTask[up.id] ||
                normalizeAssessmentTaskSlot(up.task_code, up.unit_code, up.filename, up.uploadType) ||
                "CP1";
              const currentScoreStr =
                uploadQuickScore[up.id] !== undefined
                  ? uploadQuickScore[up.id]
                  : up.grade !== null && up.grade !== undefined
                  ? String(up.grade)
                  : "";
              const numericScore = currentScoreStr !== "" ? Number(currentScoreStr) : null;

              return (
                <motion.div
                  key={up.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white border border-slate-300 rounded-2xl shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-4 hover:border-[#000953]/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#000953] text-white shadow-sm">
                      {up.student_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#0f172a]">
                          {up.student_name}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {up.reg_number || trainees.find(t => t.id === up.traineeId)?.admNo || up.traineeId}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#000953] text-white border border-[#000953]">
                          {TASK_SLOT_LABELS[resolvedSlot]}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-[#c48820] border border-amber-200">
                          {up.uploadType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        <span className="text-xs font-semibold text-[#0f172a]">
                          {up.filename}
                        </span>
                        {up.unit_code && (
                          <span className="text-xs font-mono text-slate-600">
                            • {up.unit_code}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          • {format(new Date(up.submitted_at), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                      {up.comments && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                          <span className="font-bold text-[#000953]">Assessor Remarks:</span> {up.comments}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Slot & Score Controls synced with Continuous Assessment Marksheet */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <select
                      value={resolvedSlot}
                      onChange={(e) => {
                        const nextSlot = e.target.value as AssessmentTaskSlot;
                        setUploadQuickTask((prev) => ({ ...prev, [up.id]: nextSlot }));
                        if (typeof up.grade === "number") {
                          awardUploadMark(up.id, {
                            grade: up.grade,
                            comments: up.comments || "",
                            taskCode: nextSlot,
                            unitOfferingId: up.unit_offering_id || "uo_1",
                            trainerName: "Alexander Kinoti",
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-50 border border-slate-300 text-[#000953] outline-none focus:border-[#000953] cursor-pointer"
                      title="Assessment Marksheet Slot"
                    >
                      {(Object.keys(TASK_SLOT_LABELS) as AssessmentTaskSlot[]).map((slotKey) => (
                        <option key={slotKey} value={slotKey}>
                          {TASK_SLOT_LABELS[slotKey]}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Score %"
                        value={currentScoreStr}
                        onChange={(e) =>
                          setUploadQuickScore((prev) => ({ ...prev, [up.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentScoreStr !== "") {
                            const val = Math.min(100, Math.max(0, Math.round(Number(currentScoreStr))));
                            awardUploadMark(up.id, {
                              grade: val,
                              comments: up.comments || "Verified and graded in Grading Sheet.",
                              taskCode: resolvedSlot,
                              unitOfferingId: up.unit_offering_id || "uo_1",
                              trainerName: "Alexander Kinoti",
                            });
                          }
                        }}
                        className="w-20 text-center px-2 py-1.5 rounded-lg text-sm font-mono font-bold bg-white text-[#000953] border border-slate-300 focus:border-[#000953] outline-none"
                      />
                      <span className="text-xs font-mono font-bold text-slate-600">%</span>
                    </div>

                    <button
                      onClick={() => {
                        const val =
                          currentScoreStr !== ""
                            ? Math.min(100, Math.max(0, Math.round(Number(currentScoreStr))))
                            : 75;
                        setUploadQuickScore((prev) => ({ ...prev, [up.id]: String(val) }));
                        awardUploadMark(up.id, {
                          grade: val,
                          comments: up.comments || "Verified and graded in Grading Sheet.",
                          taskCode: resolvedSlot,
                          unitOfferingId: up.unit_offering_id || "uo_1",
                          trainerName: "Alexander Kinoti",
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-[#c48820]" />
                      {up.status === "pending" ? "Grade & Sync" : "Update Mark"}
                    </button>

                    {numericScore !== null && !isNaN(numericScore) && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                          numericScore >= 50
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}
                      >
                        {numericScore >= 50 ? "COMPETENT" : "NYC"} ({getGrade(numericScore)})
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                        up.status === "graded" || up.verified_by_trainer
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-[#c48820] border-amber-200"
                      }`}
                    >
                      {up.verified_by_trainer && up.status === "graded" ? "verified" : up.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
          const candName = selectedPracticalCandidate?.name || "Nthiga Gakii Doris";
          const candReg = selectedPracticalCandidate?.regCode || "14179/S2026";
          const matched = findMatchingTrainee(trainees, {
            regNumber: candReg,
            studentName: candName,
          });
          if (matched) {
            syncScoreToContinuousMarksheet({
              traineeId: matched.id,
              taskCode: "CP1",
              percentageScore: pct,
              unitOfferingId: "uo_1",
            });
          }
          toast.success("Practical Assessment Saved & Synced to Marksheet", {
            description: `${candName}: ${total}/50 (${pct}%) on CP1 — ${comp ? "COMPETENT [✓]" : "NOT YET COMPETENT"}`
          });
        }}
      />
    </TrainerLayout>
  );
}

