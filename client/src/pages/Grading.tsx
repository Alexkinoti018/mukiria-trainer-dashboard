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
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import type { Exam, Submission, StudentAnswer, ExamQuestion } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Grading() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [{ data: examsData }, { data: subsData }] = await Promise.all([
          supabase.from("exams").select("*"),
          supabase.from("submissions").select("*").order("created_at", { ascending: false }),
        ]);
        setExams(examsData ?? []);
        setSubmissions(subsData ?? []);
        console.log("✅ [MTTI Grading] Loaded", subsData?.length, "submissions");
      } else {
        setExams(MOCK_EXAMS);
        setSubmissions(MOCK_SUBMISSIONS);
      }
    } catch (err) {
      console.error("❌ [MTTI Grading] Load error:", err);
      setExams(MOCK_EXAMS);
      setSubmissions(MOCK_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-grade MCQ answers ────────────────────────────────
  const autoGradeMCQ = useCallback(
    (sub: Submission, exam: Exam): StudentAnswer[] => {
      return sub.section_a.map((ans) => {
        const question = exam.payload.section_a.questions.find((q) => q.id === ans.question_id);
        if (!question) return ans;
        const isCorrect = ans.answer === question.correct_answer;
        return { ...ans, marks_awarded: isCorrect ? question.marks : 0 };
      });
    },
    []
  );

  const getExamForSub = (sub: Submission) =>
    exams.find((e) => e.unit_code === sub.unit_code);

  const calculateTotal = (sub: Submission, gradedA?: StudentAnswer[]): number => {
    const aAnswers = gradedA ?? sub.section_a;
    const aScore = aAnswers.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
    const bScore = sub.section_b.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
    return aScore + bScore;
  };

  const handleAutoGrade = async (sub: Submission) => {
    const exam = getExamForSub(sub);
    if (!exam) {
      toast.error("Exam not found for this submission");
      return;
    }

    const gradedA = autoGradeMCQ(sub, exam);

    // For section B, keep existing marks or set to 0
    const gradedB = sub.section_b.map((ans) => ({
      ...ans,
      marks_awarded: ans.marks_awarded ?? 0,
    }));

    const total = calculateTotal({ ...sub, section_a: gradedA, section_b: gradedB });

    setSaving(sub.id);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await (supabase as any)
          .from("submissions")
          .update({
            section_a: gradedA,
            section_b: gradedB,
            total_score: total,
            status: "graded",
          })
          .eq("id", sub.id);
        if (error) throw error;
        await loadData();
      } else {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? { ...s, section_a: gradedA, section_b: gradedB, total_score: total, status: "graded" }
              : s
          )
        );
      }
      toast.success("Auto-graded!", {
        description: `${sub.student_name}: ${total}/100 (${Math.round(total)}%)`,
      });
      console.log("✅ [MTTI Grading] Auto-graded:", sub.student_name, "Score:", total);
    } catch (err: any) {
      toast.error("Grading Failed", { description: err.message });
    } finally {
      setSaving(null);
    }
  };

  // ── Auto-save score overrides ────────────────────────────
  const autoSaveOverride = useCallback(
    async (sub: Submission, questionId: string, newScore: number) => {
      const oldScore = sub.section_b.find((a) => a.question_id === questionId)?.marks_awarded ?? 0;
      if (newScore === oldScore) return; // No change, skip

      setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "saving" }));
      try {
        if (isSupabaseConfigured()) {
          // Update the specific answer in section_b
          const updatedB = sub.section_b.map((ans) =>
            ans.question_id === questionId ? { ...ans, marks_awarded: newScore } : ans
          );
          const total = calculateTotal({ ...sub, section_b: updatedB });

          // Save submission
          const { error: updateError } = await (supabase as any)
            .from("submissions")
            .update({
              section_b: updatedB,
              total_score: total,
              status: "graded",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);
          if (updateError) throw updateError;

          // Log audit trail
          const reason = overrideReasons[`${sub.id}-${questionId}`] || "Auto-saved score override";
          const { error: auditError } = await (supabase as any)
            .from("score_audit_trail")
            .insert([
              {
                submission_id: sub.id,
                question_id: questionId,
                section: "B",
                original_score: oldScore,
                new_score: newScore,
                override_reason: reason,
                changed_by: "System Administrator",
                changed_at: new Date().toISOString(),
              },
            ]);
          if (auditError) console.warn("Audit logging warning:", auditError);

          setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));
          setTimeout(
            () => setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "idle" })),
            2000
          );
          console.log("✅ [MTTI Grading] Auto-saved score override for:", sub.student_name);
        } else {
          // Demo mode: just update local state
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === sub.id
                ? {
                    ...s,
                    section_b: s.section_b.map((ans) =>
                      ans.question_id === questionId ? { ...ans, marks_awarded: newScore } : ans
                    ),
                    total_score: calculateTotal({
                      ...s,
                      section_b: s.section_b.map((ans) =>
                        ans.question_id === questionId ? { ...ans, marks_awarded: newScore } : ans
                      ),
                    }),
                    status: "graded",
                  }
                : s
            )
          );
          setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "saved" }));
          setTimeout(
            () => setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "idle" })),
            1500
          );
        }
      } catch (err: any) {
        console.error("❌ [MTTI Grading] Auto-save failed:", err);
        setAutoSaveStatus((prev) => ({ ...prev, [questionId]: "idle" }));
      }
    },
    [overrideReasons]
  );

  const handleSaveSectionB = async (sub: Submission) => {
    const subEdits = editedScores[sub.id] ?? {};
    const updatedB = sub.section_b.map((ans) => ({
      ...ans,
      marks_awarded: subEdits[ans.question_id] ?? ans.marks_awarded ?? 0,
    }));
    const total = calculateTotal({ ...sub, section_b: updatedB });

    setSaving(sub.id);
    try {
      if (isSupabaseConfigured()) {
        // Save submission
        const { error: updateError } = await (supabase as any)
          .from("submissions")
          .update({
            section_b: updatedB,
            total_score: total,
            status: "graded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
        if (updateError) throw updateError;

        // Log audit trail for each changed score
        const auditEntries = [];
        for (const ans of sub.section_b) {
          const newScore = subEdits[ans.question_id];
          if (newScore !== undefined && newScore !== (ans.marks_awarded ?? 0)) {
            auditEntries.push({
              submission_id: sub.id,
              question_id: ans.question_id,
              section: "B",
              original_score: ans.marks_awarded ?? 0,
              new_score: newScore,
              override_reason: overrideReasons[`${sub.id}-${ans.question_id}`] || "Manual adjustment",
              changed_by: "System Administrator",
              changed_at: new Date().toISOString(),
            });
          }
        }

        if (auditEntries.length > 0) {
          const { error: auditError } = await (supabase as any)
            .from("score_audit_trail")
            .insert(auditEntries);
          if (auditError) console.warn("Audit logging warning:", auditError);
        }

        await loadData();
      } else {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? { ...s, section_b: updatedB, total_score: total, status: "graded" }
              : s
          )
        );
      }
      setEditedScores((prev) => {
        const next = { ...prev };
        delete next[sub.id];
        return next;
      });
      setOverrideReasons({});
      setOverrideMode(null);
      toast.success("Marks Saved with Audit Trail", { description: `Total: ${total}/100` });
      console.log("✅ [MTTI Grading] Scores saved with audit trail for:", sub.student_name);
    } catch (err: any) {
      toast.error("Save Failed", { description: err.message });
    } finally {
      setSaving(null);
    }
  };

  const handleMarkReviewed = async (sub: Submission) => {
    setSaving(sub.id);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await (supabase as any)
          .from("submissions")
          .update({ status: "reviewed" })
          .eq("id", sub.id);
        if (error) throw error;
        await loadData();
      } else {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: "reviewed" } : s))
        );
      }
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
    <DashboardLayout title="Grading Interface" subtitle="Review and grade student submissions">
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
          onClick={loadData}
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
                          {sub.total_score}
                          <span className="text-xs font-normal opacity-60">/100</span>
                        </div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: getScoreColor(sub.total_score) }}
                        >
                          Grade {getGrade(sub.total_score)}
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
                              onClick={() => handleSaveSectionB(sub)}
                              disabled={isSaving}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                              style={{
                                background: "oklch(0.75 0.14 80 / 0.15)",
                                border: "1px solid oklch(0.75 0.14 80 / 0.3)",
                                color: "oklch(0.75 0.14 80)",
                              }}
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Marks
                            </button>
                          )}
                        </div>

                        {/* Section A — MCQ Results */}
                        {exam && sub.section_a.length > 0 && (
                          <div>
                            <h4
                              className="text-xs font-bold mb-3"
                              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.72 0.18 160)" }}
                            >
                              Section A — Multiple Choice
                              <span className="font-mono ml-2 font-normal" style={{ color: "oklch(0.50 0.010 240)" }}>
                                {sub.section_a.reduce((s, a) => s + (a.marks_awarded ?? 0), 0)} /{" "}
                                {exam.payload.section_a.total_marks} marks
                              </span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {sub.section_a.map((ans, qi) => {
                                const question = exam.payload.section_a.questions.find(
                                  (q) => q.id === ans.question_id
                                );
                                const isCorrect = ans.marks_awarded === question?.marks;
                                return (
                                  <div
                                    key={ans.question_id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                                    style={{
                                      background: isCorrect
                                        ? "oklch(0.72 0.18 160 / 0.08)"
                                        : "oklch(0.65 0.22 25 / 0.08)",
                                      border: isCorrect
                                        ? "1px solid oklch(0.72 0.18 160 / 0.2)"
                                        : "1px solid oklch(0.65 0.22 25 / 0.2)",
                                    }}
                                  >
                                    {isCorrect ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.72 0.18 160)" }} />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.65 0.22 25)" }} />
                                    )}
                                    <span style={{ color: "oklch(0.80 0.008 240)" }}>Q{qi + 1}</span>
                                    <span
                                      className="font-mono ml-auto"
                                      style={{ color: isCorrect ? "oklch(0.72 0.18 160)" : "oklch(0.65 0.22 25)" }}
                                    >
                                      {ans.marks_awarded ?? "?"}/{question?.marks ?? 2}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Section B — Manual Scoring */}
                        {exam && sub.section_b.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4
                                className="text-xs font-bold"
                                style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.65 0.15 200)" }}
                              >
                                Section B — Structured Questions
                                <span className="font-mono ml-2 font-normal" style={{ color: "oklch(0.50 0.010 240)" }}>
                                  {sub.section_b.reduce((s, a) => s + (a.marks_awarded ?? 0), 0)} /{exam.payload.section_b.total_marks} marks
                                </span>
                              </h4>
                              {Object.keys(editedScores[sub.id] ?? {}).length > 0 && (
                                <button
                                  onClick={() => setOverrideMode(overrideMode === sub.id ? null : sub.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                                  style={{
                                    background: "oklch(0.75 0.14 80 / 0.15)",
                                    border: "1px solid oklch(0.75 0.14 80 / 0.3)",
                                    color: "oklch(0.75 0.14 80)",
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  {overrideMode === sub.id ? "Done" : "Add Reasons"}
                                </button>
                              )}
                            </div>
                            <div className="space-y-3">
                              {sub.section_b.map((ans, qi) => {
                                const question = exam.payload.section_b.questions.find(
                                  (q) => q.id === ans.question_id
                                );
                                const currentMarks = subEdits[ans.question_id] ?? ans.marks_awarded ?? 0;
                                return (
                                  <div
                                    key={ans.question_id}
                                    className="p-4 rounded-xl space-y-3"
                                    style={{
                                      background: "oklch(1 0 0 / 0.04)",
                                      border: "1px solid oklch(1 0 0 / 0.08)",
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold mb-1" style={{ color: "oklch(0.65 0.15 200)" }}>
                                          Q{qi + 1} — {question?.text?.substring(0, 80)}
                                          {(question?.text?.length ?? 0) > 80 ? "..." : ""}
                                        </p>
                                        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.80 0.008 240)" }}>
                                          {typeof ans.answer === "string"
                                            ? ans.answer.substring(0, 200) + (ans.answer.length > 200 ? "..." : "")
                                            : String(ans.answer)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <input
                                          type="number"
                                          value={currentMarks}
                                          min={0}
                                          max={question?.marks ?? 30}
                                          onChange={(e) => {
                                            const val = Math.min(
                                              Math.max(0, +e.target.value),
                                              question?.marks ?? 30
                                            );
                                            setEditedScores((prev) => ({
                                              ...prev,
                                              [sub.id]: { ...prev[sub.id], [ans.question_id]: val },
                                            }));
                                            // Trigger auto-save after a short delay
                                            setTimeout(() => {
                                              autoSaveOverride(sub, ans.question_id, val);
                                            }, 800);
                                          }}
                                          className="w-16 text-center px-2 py-1.5 rounded-lg text-sm font-mono transition-all"
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
                                        <span className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                                          / {question?.marks ?? 30}
                                        </span>
                                        {autoSaveStatus[ans.question_id] === "saving" && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-xs px-2 py-1 rounded-lg font-medium"
                                            style={{
                                              background: "oklch(0.75 0.14 80 / 0.15)",
                                              color: "oklch(0.75 0.14 80)",
                                            }}
                                          >
                                            Saving...
                                          </motion.div>
                                        )}
                                        {autoSaveStatus[ans.question_id] === "saved" && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="text-xs px-2 py-1 rounded-lg font-medium flex items-center gap-1"
                                            style={{
                                              background: "oklch(0.72 0.18 160 / 0.15)",
                                              color: "oklch(0.72 0.18 160)",
                                            }}
                                          >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Saved
                                          </motion.div>
                                        )}
                                      </div>
                                    </div>
                                    {overrideMode === sub.id && subEdits[ans.question_id] !== undefined && subEdits[ans.question_id] !== (ans.marks_awarded ?? 0) && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.75 0.14 80)" }}>
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          <span className="font-medium">
                                            Score changed from {ans.marks_awarded ?? 0} to {subEdits[ans.question_id]}
                                          </span>
                                        </div>
                                        <textarea
                                          placeholder="Reason for score override (e.g., Partial credit for methodology)"
                                          value={overrideReasons[`${sub.id}-${ans.question_id}`] || ""}
                                          onChange={(e) => {
                                            setOverrideReasons((prev) => ({
                                              ...prev,
                                              [`${sub.id}-${ans.question_id}`]: e.target.value,
                                            }));
                                          }}
                                          className="w-full text-xs p-2 rounded-lg resize-none"
                                          rows={2}
                                          style={{
                                            background: "oklch(0.75 0.14 80 / 0.08)",
                                            border: "1px solid oklch(0.75 0.14 80 / 0.2)",
                                            color: "oklch(0.94 0.005 240)",
                                          }}
                                        />
                                      </div>
                                    )}
                                    {question?.correct_answer && (
                                      <div
                                        className="text-xs px-3 py-2 rounded-lg"
                                        style={{
                                          background: "oklch(0.72 0.18 160 / 0.06)",
                                          border: "1px solid oklch(0.72 0.18 160 / 0.15)",
                                          color: "oklch(0.72 0.18 160 / 0.8)",
                                        }}
                                      >
                                        <span className="font-bold">Marking Guide: </span>
                                        {String(question.correct_answer).substring(0, 150)}
                                      </div>
                                    )}
                                    {/* Trainer Comments */}
                                    <div className="space-y-2">
                                      <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "oklch(0.65 0.15 200)" }}>
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Feedback for Student
                                      </label>
                                      <textarea
                                        placeholder="Add constructive feedback for this answer (visible to student)..."
                                        value={trainerComments[`${sub.id}-${ans.question_id}`] || ""}
                                        onChange={(e) => {
                                          setTrainerComments((prev) => ({
                                            ...prev,
                                            [`${sub.id}-${ans.question_id}`]: e.target.value,
                                          }));
                                        }}
                                        className="w-full text-xs p-2.5 rounded-lg resize-none"
                                        rows={2}
                                        style={{
                                          background: "oklch(0.65 0.15 200 / 0.08)",
                                          border: "1px solid oklch(0.65 0.15 200 / 0.2)",
                                          color: "oklch(0.94 0.005 240)",
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
