/**
 * PDF Report Generator
 * Design: Institutional Glassmorphism
 * Generate official transcripts and class reports using jsPDF
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Users,
  Printer,
  CheckCircle2,
  Search,
  Award,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import type { Exam, Submission } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";

function getGrade(score: number | null): string {
  if (score === null) return "—";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getGradeRemark(score: number | null): string {
  if (score === null) return "Pending";
  if (score >= 80) return "Distinction";
  if (score >= 70) return "Credit";
  if (score >= 60) return "Pass";
  if (score >= 50) return "Pass";
  return "Fail";
}

export default function Reports() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [{ data: examsData }, { data: subsData }] = await Promise.all([
          supabase.from("exams").select("*"),
          supabase.from("submissions").select("*").order("student_name"),
        ]);
        setExams(examsData ?? []);
        setSubmissions(subsData ?? []);
      } else {
        setExams(MOCK_EXAMS);
        setSubmissions(MOCK_SUBMISSIONS);
      }
    } catch {
      setExams(MOCK_EXAMS);
      setSubmissions(MOCK_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  // ── Generate Individual Transcript ────────────────────────
  const generateTranscript = async (sub: Submission) => {
    const exam = exams.find((e) => e.unit_code === sub.unit_code);
    setGenerating(sub.id);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 20;
      let y = margin;

      // ── Header ──
      doc.setFillColor(13, 27, 42); // deep navy
      doc.rect(0, 0, pageW, 40, "F");

      doc.setTextColor(16, 185, 129); // emerald
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 14, { align: "center" });

      doc.setTextColor(180, 200, 220);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("P.O. Box 100, Mukiria, Meru County, Kenya", pageW / 2, 21, { align: "center" });
      doc.text("Tel: +254 700 000 000  |  Email: info@mtti.ac.ke", pageW / 2, 27, { align: "center" });

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL ACADEMIC TRANSCRIPT", pageW / 2, 35, { align: "center" });

      y = 50;

      // ── Student Info Box ──
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margin, y, pageW - 2 * margin, 35, 3, 3, "F");
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, pageW - 2 * margin, 35, 3, 3, "S");

      doc.setTextColor(13, 27, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT INFORMATION", margin + 5, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Name:`, margin + 5, y + 16);
      doc.setFont("helvetica", "bold");
      doc.text(sub.student_name.toUpperCase(), margin + 30, y + 16);

      doc.setFont("helvetica", "normal");
      doc.text(`Reg No:`, margin + 5, y + 23);
      doc.setFont("helvetica", "bold");
      doc.text(sub.reg_number, margin + 30, y + 23);

      doc.setFont("helvetica", "normal");
      doc.text(`Unit Code:`, margin + 5, y + 30);
      doc.setFont("helvetica", "bold");
      doc.text(sub.unit_code, margin + 30, y + 30);

      if (exam) {
        doc.setFont("helvetica", "normal");
        doc.text(`Course:`, margin + 90, y + 16);
        doc.setFont("helvetica", "bold");
        doc.text(exam.course_name, margin + 110, y + 16);

        doc.setFont("helvetica", "normal");
        doc.text(`Exam:`, margin + 90, y + 23);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(exam.payload.title, 60);
        doc.text(titleLines[0], margin + 110, y + 23);

        doc.setFont("helvetica", "normal");
        doc.text(`Date:`, margin + 90, y + 30);
        doc.setFont("helvetica", "bold");
        doc.text(format(new Date(sub.created_at), "dd MMMM yyyy"), margin + 110, y + 30);
      }

      y += 42;

      // ── Section A Results ──
      if (sub.section_a.length > 0 && exam) {
        doc.setFillColor(13, 27, 42);
        doc.rect(margin, y, pageW - 2 * margin, 8, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION A — MULTIPLE CHOICE QUESTIONS", margin + 3, y + 5.5);
        y += 10;

        // Table header
        doc.setFillColor(230, 245, 240);
        doc.rect(margin, y, pageW - 2 * margin, 7, "F");
        doc.setTextColor(13, 27, 42);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Q#", margin + 3, y + 5);
        doc.text("Student Answer", margin + 20, y + 5);
        doc.text("Correct Answer", margin + 70, y + 5);
        doc.text("Marks", margin + 120, y + 5);
        doc.text("Result", margin + 145, y + 5);
        y += 8;

        sub.section_a.forEach((ans, idx) => {
          const question = exam.payload.section_a.questions.find((q) => q.id === ans.question_id);
          const isCorrect = (ans.marks_awarded ?? 0) > 0;

          if (idx % 2 === 0) {
            doc.setFillColor(248, 252, 250);
            doc.rect(margin, y - 1, pageW - 2 * margin, 7, "F");
          }

          doc.setTextColor(13, 27, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(`Q${idx + 1}`, margin + 3, y + 4);

          const studentAns = question?.options
            ? question.options[ans.answer as number] ?? String(ans.answer)
            : String(ans.answer);
          doc.text(studentAns.substring(0, 30), margin + 20, y + 4);

          const correctAns = question?.options
            ? question.options[question.correct_answer as number] ?? String(question.correct_answer)
            : String(question?.correct_answer ?? "");
          doc.text(correctAns.substring(0, 30), margin + 70, y + 4);

          doc.text(`${ans.marks_awarded ?? 0}/${question?.marks ?? 2}`, margin + 120, y + 4);

          if (isCorrect) {
            doc.setTextColor(16, 185, 129);
            doc.text("✓ Correct", margin + 145, y + 4);
          } else {
            doc.setTextColor(220, 50, 50);
            doc.text("✗ Wrong", margin + 145, y + 4);
          }
          doc.setTextColor(13, 27, 42);
          y += 7;
        });

        const sectionAScore = sub.section_a.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
        doc.setFillColor(230, 245, 240);
        doc.rect(margin, y, pageW - 2 * margin, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(13, 27, 42);
        doc.text(`Section A Total: ${sectionAScore} / ${exam.payload.section_a.total_marks} marks`, margin + 3, y + 5);
        y += 12;
      }

      // ── Section B Results ──
      if (sub.section_b.length > 0 && exam) {
        doc.setFillColor(13, 27, 42);
        doc.rect(margin, y, pageW - 2 * margin, 8, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION B — STRUCTURED QUESTIONS", margin + 3, y + 5.5);
        y += 10;

        sub.section_b.forEach((ans, idx) => {
          const question = exam.payload.section_b.questions.find((q) => q.id === ans.question_id);

          doc.setFillColor(248, 252, 250);
          doc.rect(margin, y, pageW - 2 * margin, 7, "F");
          doc.setTextColor(13, 27, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.text(`Question ${idx + 1}`, margin + 3, y + 5);
          doc.setTextColor(16, 185, 129);
          doc.text(`${ans.marks_awarded ?? 0} / ${question?.marks ?? 30} marks`, pageW - margin - 3, y + 5, { align: "right" });
          y += 8;

          if (question?.text) {
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            const qLines = doc.splitTextToSize(question.text.substring(0, 200), pageW - 2 * margin - 6);
            doc.text(qLines, margin + 3, y + 3);
            y += qLines.length * 4 + 4;
          }

          if (typeof ans.answer === "string" && ans.answer) {
            doc.setTextColor(13, 27, 42);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            const ansLines = doc.splitTextToSize(ans.answer.substring(0, 300), pageW - 2 * margin - 6);
            doc.text(ansLines, margin + 3, y + 3);
            y += ansLines.length * 4 + 6;
          }

          if (y > 260) {
            doc.addPage();
            y = margin;
          }
        });

        const sectionBScore = sub.section_b.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
        doc.setFillColor(230, 245, 240);
        doc.rect(margin, y, pageW - 2 * margin, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(13, 27, 42);
        doc.text(`Section B Total: ${sectionBScore} / ${exam.payload.section_b.total_marks} marks`, margin + 3, y + 5);
        y += 12;
      }

      // ── Final Score Box ──
      if (y > 240) { doc.addPage(); y = margin; }

      const scoreColor = (sub.total_score ?? 0) >= 50 ? [16, 185, 129] : [220, 50, 50];
      doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.roundedRect(margin, y, pageW - 2 * margin, 22, 3, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        `FINAL SCORE: ${sub.total_score ?? "—"} / 100  |  GRADE: ${getGrade(sub.total_score)}  |  ${getGradeRemark(sub.total_score).toUpperCase()}`,
        pageW / 2,
        y + 14,
        { align: "center" }
      );
      y += 28;

      // ── Footer ──
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 280, pageW, 17, "F");
      doc.setTextColor(100, 130, 150);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}  |  Mukiria Technical Training Institute  |  This is an official document`,
        pageW / 2,
        288,
        { align: "center" }
      );

      const filename = `MTTI_Transcript_${sub.reg_number.replace(/\//g, "-")}_${sub.unit_code}.pdf`;
      doc.save(filename);
      toast.success("Transcript Generated", { description: `${filename} downloaded.` });
      console.log("✅ [MTTI Reports] Transcript generated for:", sub.student_name);
    } catch (err: any) {
      console.error("❌ [MTTI Reports] PDF generation error:", err);
      toast.error("PDF Generation Failed", { description: err.message });
    } finally {
      setGenerating(null);
    }
  };

  // ── Generate Class Report ─────────────────────────────────
  const generateClassReport = async (unitCode: string) => {
    const exam = exams.find((e) => e.unit_code === unitCode);
    const unitSubs = submissions.filter(
      (s) => s.unit_code === unitCode && s.total_score !== null
    );

    if (unitSubs.length === 0) {
      toast.error("No graded submissions", { description: "Grade submissions first." });
      return;
    }

    setGenerating(`class-${unitCode}`);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 20;
      let y = margin;

      // Header
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, pageW, 40, "F");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 13, { align: "center" });
      doc.setTextColor(180, 200, 220);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("CLASS PERFORMANCE REPORT", pageW / 2, 22, { align: "center" });
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${unitCode} — ${exam?.course_name ?? ""}`, pageW / 2, 33, { align: "center" });

      y = 50;

      // Summary stats
      const avg = unitSubs.reduce((s, sub) => s + (sub.total_score ?? 0), 0) / unitSubs.length;
      const passCount = unitSubs.filter((s) => (s.total_score ?? 0) >= 50).length;
      const passRate = (passCount / unitSubs.length) * 100;
      const highest = Math.max(...unitSubs.map((s) => s.total_score ?? 0));
      const lowest = Math.min(...unitSubs.map((s) => s.total_score ?? 0));

      doc.setFillColor(240, 248, 255);
      doc.roundedRect(margin, y, pageW - 2 * margin, 25, 3, 3, "F");
      doc.setTextColor(13, 27, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("SUMMARY STATISTICS", margin + 5, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Total Students: ${unitSubs.length}`, margin + 5, y + 15);
      doc.text(`Class Average: ${avg.toFixed(1)}%`, margin + 50, y + 15);
      doc.text(`Pass Rate: ${passRate.toFixed(1)}%`, margin + 100, y + 15);
      doc.text(`Highest: ${highest}%`, margin + 145, y + 15);
      doc.text(`Lowest: ${lowest}%`, margin + 5, y + 22);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, margin + 50, y + 22);

      y += 32;

      // Student results table
      doc.setFillColor(13, 27, 42);
      doc.rect(margin, y, pageW - 2 * margin, 8, "F");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("STUDENT RESULTS", margin + 3, y + 5.5);
      y += 10;

      // Table headers
      doc.setFillColor(230, 245, 240);
      doc.rect(margin, y, pageW - 2 * margin, 7, "F");
      doc.setTextColor(13, 27, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("#", margin + 3, y + 5);
      doc.text("Student Name", margin + 12, y + 5);
      doc.text("Reg Number", margin + 80, y + 5);
      doc.text("Score", margin + 130, y + 5);
      doc.text("Grade", margin + 150, y + 5);
      doc.text("Remark", margin + 165, y + 5);
      y += 8;

      const sorted = [...unitSubs].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
      sorted.forEach((sub, idx) => {
        if (y > 270) { doc.addPage(); y = margin; }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 252, 250);
          doc.rect(margin, y - 1, pageW - 2 * margin, 7, "F");
        }
        doc.setTextColor(13, 27, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`${idx + 1}`, margin + 3, y + 4);
        doc.text(sub.student_name.substring(0, 30), margin + 12, y + 4);
        doc.text(sub.reg_number, margin + 80, y + 4);

        const scoreColor = (sub.total_score ?? 0) >= 50 ? [16, 185, 129] : [220, 50, 50];
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`${sub.total_score ?? "—"}%`, margin + 130, y + 4);
        doc.text(getGrade(sub.total_score), margin + 150, y + 4);
        doc.setFont("helvetica", "normal");
        doc.text(getGradeRemark(sub.total_score), margin + 165, y + 4);
        doc.setTextColor(13, 27, 42);
        y += 7;
      });

      // Footer
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 280, pageW, 17, "F");
      doc.setTextColor(100, 130, 150);
      doc.setFontSize(7);
      doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}  |  Mukiria Technical Training Institute  |  Confidential`,
        pageW / 2, 288, { align: "center" }
      );

      const filename = `MTTI_ClassReport_${unitCode}_${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(filename);
      toast.success("Class Report Generated", { description: `${filename} downloaded.` });
      console.log("✅ [MTTI Reports] Class report generated for:", unitCode);
    } catch (err: any) {
      toast.error("Report Failed", { description: err.message });
    } finally {
      setGenerating(null);
    }
  };

  const filteredSubs = submissions.filter((s) => {
    if (selectedUnit !== "all" && s.unit_code !== selectedUnit) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.student_name.toLowerCase().includes(q) || s.reg_number.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout title="Reports" subtitle="Generate official transcripts and class performance reports">
      {/* Class Reports */}
      <div className="mb-6">
        <h3
          className="text-sm font-bold mb-3"
          style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
        >
          Class Reports
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "oklch(1 0 0 / 0.05)" }} />
              ))
            : exams.map((exam) => {
                const unitSubs = submissions.filter((s) => s.unit_code === exam.unit_code);
                const gradedCount = unitSubs.filter((s) => s.total_score !== null).length;
                const isGen = generating === `class-${exam.unit_code}`;
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div
                          className="text-sm font-bold"
                          style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
                        >
                          {exam.unit_code}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.010 240)" }}>
                          {exam.course_name}
                        </div>
                      </div>
                      <div
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          background: "oklch(0.72 0.18 160 / 0.12)",
                          color: "oklch(0.72 0.18 160)",
                        }}
                      >
                        {gradedCount} graded
                      </div>
                    </div>
                    <button
                      onClick={() => generateClassReport(exam.unit_code)}
                      disabled={isGen || gradedCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                      style={{
                        background: "oklch(0.72 0.18 160 / 0.12)",
                        border: "1px solid oklch(0.72 0.18 160 / 0.3)",
                        color: "oklch(0.72 0.18 160)",
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isGen ? "Generating..." : "Download Class Report"}
                    </button>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Individual Transcripts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-bold"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Individual Transcripts
          </h3>
          <div className="flex gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.010 240)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="bg-transparent text-xs outline-none w-36"
                style={{ color: "oklch(0.94 0.005 240)" }}
              />
            </div>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: "oklch(1 0 0 / 0.05)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                color: "oklch(0.80 0.008 240)",
              }}
            >
              <option value="all">All Units</option>
              {exams.map((e) => (
                <option key={e.id} value={e.unit_code}>{e.unit_code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}>
                {["Student", "Reg Number", "Unit", "Score", "Grade", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold"
                    style={{ color: "oklch(0.50 0.010 240)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: "oklch(1 0 0 / 0.08)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
                    No submissions found
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub, i) => {
                  const isGen = generating === sub.id;
                  return (
                    <tr key={sub.id} className="data-table-row">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: "oklch(0.94 0.005 240)" }}>
                          {sub.student_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: "oklch(0.65 0.15 200)" }}>
                          {sub.reg_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>
                          {sub.unit_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-bold font-mono"
                          style={{
                            color:
                              sub.total_score === null
                                ? "oklch(0.58 0.012 240)"
                                : (sub.total_score ?? 0) >= 50
                                ? "oklch(0.72 0.18 160)"
                                : "oklch(0.65 0.22 25)",
                          }}
                        >
                          {sub.total_score ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              sub.total_score === null
                                ? "oklch(0.58 0.012 240)"
                                : (sub.total_score ?? 0) >= 50
                                ? "oklch(0.72 0.18 160)"
                                : "oklch(0.65 0.22 25)",
                          }}
                        >
                          {getGrade(sub.total_score)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${sub.status}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => generateTranscript(sub)}
                          disabled={isGen || sub.total_score === null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                          style={{
                            background: "oklch(0.72 0.18 160 / 0.12)",
                            border: "1px solid oklch(0.72 0.18 160 / 0.3)",
                            color: "oklch(0.72 0.18 160)",
                          }}
                        >
                          <Download className="w-3 h-3" />
                          {isGen ? "..." : "PDF"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
