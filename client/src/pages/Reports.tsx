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
import TrainerLayout from "@/components/TrainerLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";
import type { Exam, Submission } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";

function cleanEllipsis(text: string, maxLen: number): string {
  if (!text) return "—";
  const clean = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 1).trim() + "…";
}

function getCDACCGrade(percentage: number | null): string {
  if (percentage === null) return "—";
  if (percentage >= 80) return "DISTINCTION";
  if (percentage >= 65) return "CREDIT";
  if (percentage >= 50) return "PASS";
  return "REFER";
}

function getCDACCRemark(percentage: number | null): string {
  if (percentage === null) return "PENDING";
  if (percentage >= 80) return "COMPETENT (DISTINCTION)";
  if (percentage >= 65) return "COMPETENT (CREDIT)";
  if (percentage >= 50) return "COMPETENT (PASS)";
  return "NOT YET COMPETENT (REFER)";
}

function getGrade(percentage: number | null): string {
  return getCDACCGrade(percentage);
}

function getGradeRemark(percentage: number | null): string {
  return getCDACCRemark(percentage);
}

export default function Reports() {
  const { exams, submissions } = useExam();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Generate Individual Transcript ────────────────────────
  const generateTranscript = async (sub: Submission) => {
    const exam = exams.find((e) => e.unit_code === sub.unit_code);
    setGenerating(sub.id);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 14;
      const contentW = pageW - 2 * margin; // 182 mm
      let y = margin;

      // ── Header (Deep Institutional Navy) ──
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, pageW, 38, "F");

      // Emerald accent stripe
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 38, pageW, 1.5, "F");

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 12, { align: "center" });

      doc.setTextColor(200, 220, 240);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("P.O. Box 100 - 60200, Meru, Kenya  |  Tel: +254 700 000 000  |  Email: info@mukiriatti.ac.ke", pageW / 2, 18, { align: "center" });
      doc.text("DEPARTMENT OF COMPUTING & INFORMATICS  •  TVET CDACC CBET ACCREDITED", pageW / 2, 24, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL CANDIDATE ACADEMIC TRANSCRIPT", pageW / 2, 33, { align: "center" });

      y = 45;

      // ── Candidate & Assessment Info Box ──
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 36, 2, 2, "F");
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentW, 36, 2, 2, "S");

      // Header inside box
      doc.setFillColor(13, 27, 42);
      doc.roundedRect(margin, y, contentW, 7, 2, 2, "F");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE & EXAMINATION SPECIFICATIONS", margin + 4, y + 4.8);

      const col1X = margin + 4;
      const col1ValX = margin + 28;
      const col2X = margin + 96;
      const col2ValX = margin + 118;

      doc.setTextColor(70, 80, 95);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Row 1
      doc.text("Candidate:", col1X, y + 13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text(sub.student_name.toUpperCase(), col1ValX, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Course Unit:", col2X, y + 13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      const courseLines = doc.splitTextToSize(exam?.course_name ?? "Apply Digital Literacy", 58);
      doc.text(courseLines[0], col2ValX, y + 13);

      // Row 2
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Reg Number:", col1X, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text(sub.reg_number, col1ValX, y + 20);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Unit Code:", col2X, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text(sub.unit_code, col2ValX, y + 20);

      // Row 3
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Class / Cohort:", col1X, y + 27);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text(exam?.payload?.class ?? "FBS 5 MOD/J/2026", col1ValX, y + 27);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Assessment:", col2X, y + 27);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      const titleLines = doc.splitTextToSize(exam?.payload?.title ?? "Written Assessment 1", 58);
      doc.text(titleLines[0], col2ValX, y + 27);

      // Row 4
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Assessor:", col1X, y + 33);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text("Alexander Kinoti (Trainer)", col1ValX, y + 33);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Exam Date:", col2X, y + 33);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 27, 42);
      doc.text(format(new Date(sub.created_at), "dd MMMM yyyy"), col2ValX, y + 33);

      y += 42;

      // ── Section A Results ──
      if (sub.section_a && sub.section_a.length > 0 && exam) {
        doc.setFillColor(13, 27, 42);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const secATitle = (exam.payload?.section_a?.title ?? "SECTION A — CORE CONCEPTS & WORKPLACE PROCEDURES (30 MARKS)").toUpperCase();
        doc.text(secATitle, margin + 4, y + 4.8);
        y += 8.5;

        // Table Header
        doc.setFillColor(232, 245, 238);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setTextColor(13, 27, 42);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text("Q#", margin + 3, y + 4.5);
        doc.text("Assessment Task / Question", margin + 12, y + 4.5);
        doc.text("Candidate Response", margin + 66, y + 4.5);
        doc.text("Expected Key / Criteria", margin + 118, y + 4.5);
        doc.text("Marks", margin + 156, y + 4.5);
        doc.text("Verdict", margin + 168, y + 4.5);
        y += 7.5;

        sub.section_a.forEach((ans, idx) => {
          if (y > 265) {
            doc.addPage();
            y = margin + 5;
          }

          const question = exam.payload?.section_a?.questions?.find((q) => q.id === ans.question_id);
          const maxMarks = question?.marks ?? 2;
          const marksAwarded = ans.marks_awarded ?? 0;
          const isFull = marksAwarded === maxMarks;
          const isPartial = marksAwarded > 0 && marksAwarded < maxMarks;

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 1, contentW, 6.5, "F");
          }

          doc.setTextColor(13, 27, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);

          // Q#
          doc.setFont("helvetica", "bold");
          doc.text(`Q${idx + 1}`, margin + 3, y + 3.8);
          doc.setFont("helvetica", "normal");

          // Question Prompt / Task
          const qText = question?.text ?? question?.critical_aspect ?? `Item ${idx + 1}`;
          doc.text(cleanEllipsis(qText, 32), margin + 12, y + 3.8);

          // Student Answer
          let studentAns = "";
          if (question?.options && !isNaN(Number(ans.answer))) {
            const optIdx = Number(ans.answer);
            studentAns = `${String.fromCharCode(65 + optIdx)}: ${question.options[optIdx] ?? ans.answer}`;
          } else {
            studentAns = String(ans.answer || "No response");
          }
          doc.text(cleanEllipsis(studentAns, 32), margin + 66, y + 3.8);

          // Correct Answer / Expected Key
          let correctAns = "";
          if (question?.options && !isNaN(Number(question.correct_answer))) {
            const optIdx = Number(question.correct_answer);
            correctAns = `${String.fromCharCode(65 + optIdx)}: ${question.options[optIdx] ?? question.correct_answer}`;
          } else {
            correctAns = String(question?.correct_answer ?? question?.critical_aspect ?? "");
          }
          doc.text(cleanEllipsis(correctAns, 26), margin + 118, y + 3.8);

          // Marks
          doc.setFont("helvetica", "bold");
          doc.text(`${marksAwarded}/${maxMarks}`, margin + 156, y + 3.8);

          // Verdict (Pure ASCII verdict with no Unicode font artifacts)
          if (isFull) {
            doc.setTextColor(16, 140, 90);
            doc.text("CORRECT", margin + 168, y + 3.8);
          } else if (isPartial) {
            doc.setTextColor(180, 100, 10);
            doc.text("PARTIAL", margin + 168, y + 3.8);
          } else {
            doc.setTextColor(200, 30, 30);
            doc.text("WRONG", margin + 168, y + 3.8);
          }
          doc.setTextColor(13, 27, 42);
          y += 6.5;
        });

        const sectionAScore = sub.section_a.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
        const sectionAMax = exam.payload?.section_a?.total_marks ?? 30;
        const sectionAPct = Math.round((sectionAScore / sectionAMax) * 100);

        doc.setFillColor(232, 245, 238);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(13, 27, 42);
        doc.text(
          `Section A Total: ${sectionAScore} / ${sectionAMax} Marks (${sectionAPct}%) — Competency Level: ${sectionAPct >= 50 ? "COMPETENT" : "NOT YET COMPETENT"}`,
          margin + 4,
          y + 4.5
        );
        y += 11;
      }

      // ── Section B Results ──
      if (sub.section_b && sub.section_b.length > 0 && exam) {
        if (y > 230) {
          doc.addPage();
          y = margin + 5;
        }

        doc.setFillColor(13, 27, 42);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const secBTitle = (exam.payload?.section_b?.title ?? "SECTION B — STRUCTURED PRACTICAL & APPLICATION QUESTIONS (40 MARKS)").toUpperCase();
        doc.text(secBTitle, margin + 4, y + 4.8);
        y += 9;

        sub.section_b.forEach((ans, idx) => {
          if (y > 230) {
            doc.addPage();
            y = margin + 5;
          }

          const question = exam.payload?.section_b?.questions?.find((q) => q.id === ans.question_id);
          const qMaxMarks = question?.marks ?? 20;

          // Question header banner
          doc.setFillColor(242, 246, 250);
          doc.rect(margin, y, contentW, 6.5, "F");
          doc.setTextColor(13, 27, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(`Question ${idx + 1}${question?.critical_aspect ? ` — ${question.critical_aspect}` : ""}`, margin + 3, y + 4.5);
          doc.setTextColor(16, 140, 90);
          doc.text(`${ans.marks_awarded ?? 0} / ${qMaxMarks} Marks`, margin + contentW - 4, y + 4.5, { align: "right" });
          y += 7.5;

          // Question Prompt
          if (question?.text) {
            doc.setTextColor(70, 80, 95);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7.5);
            const qLines = doc.splitTextToSize(question.text, contentW - 6);
            for (let l = 0; l < qLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(qLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 2;
          }

          // Candidate Answer
          if (ans.answer) {
            if (y > 268) { doc.addPage(); y = margin + 5; }
            doc.setTextColor(13, 27, 42);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.text("Candidate Response:", margin + 3, y + 3);
            y += 4;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 40, 55);
            const ansLines = doc.splitTextToSize(String(ans.answer), contentW - 6);
            for (let l = 0; l < ansLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(ansLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 2;
          }

          // Assessor Feedback
          if (ans.ai_reasoning) {
            if (y > 268) { doc.addPage(); y = margin + 5; }
            doc.setTextColor(16, 140, 90);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.text("Assessor Evaluation Feedback:", margin + 3, y + 3);
            y += 4;

            doc.setFont("helvetica", "italic");
            doc.setTextColor(60, 70, 85);
            const reasonLines = doc.splitTextToSize(ans.ai_reasoning, contentW - 6);
            for (let l = 0; l < reasonLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(reasonLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 3;
          }

          y += 2;
        });

        // Section B Total calculation & capping
        const rawSecBScore = sub.section_b.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
        const sectionBMax = exam.payload?.section_b?.total_marks ?? 40;
        const sectionBScore = Math.min(sectionBMax, rawSecBScore);
        const sectionBPct = Math.round((sectionBScore / sectionBMax) * 100);

        if (y > 260) { doc.addPage(); y = margin + 5; }
        doc.setFillColor(232, 245, 238);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(13, 27, 42);
        const capNotice = sub.section_b.length > 2 ? ` (${sub.section_b.length} questions attempted — marks capped at ${sectionBMax} max)` : "";
        doc.text(
          `Section B Total: ${sectionBScore} / ${sectionBMax} Marks (${sectionBPct}%)${capNotice}`,
          margin + 4,
          y + 4.5
        );
        y += 11;
      }

      // ── Final Aggregate Score & CDACC Verdict Box ──
      if (y > 215) { doc.addPage(); y = margin + 5; }

      const secAScore = (sub.section_a || []).reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
      const secBScoreRaw = (sub.section_b || []).reduce((s, a) => s + (a.marks_awarded ?? 0), 0);
      const secBMax = exam?.payload?.section_b?.total_marks ?? 40;
      const secBScore = Math.min(secBMax, secBScoreRaw);

      const examTotalMarks = exam?.payload?.total_marks ?? 70;
      const totalScore = sub.total_score ?? (secAScore + secBScore);
      const percentage = examTotalMarks > 0 ? Math.round((totalScore / examTotalMarks) * 100) : totalScore;
      const isCompetent = percentage >= 50;
      const grade = getCDACCGrade(percentage);
      const remark = getCDACCRemark(percentage);

      const scoreBg = isCompetent ? [16, 140, 90] : [185, 28, 28];
      doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
      doc.roundedRect(margin, y, contentW, 22, 2.5, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(
        `AGGREGATE SCORE: ${totalScore} / ${examTotalMarks} MARKS (${percentage}%)`,
        pageW / 2,
        y + 9,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.setTextColor(245, 250, 255);
      doc.text(
        `CDACC CBET VERDICT: ${remark.toUpperCase()}  |  CLASSIFICATION: ${grade}`,
        pageW / 2,
        y + 16.5,
        { align: "center" }
      );
      y += 28;

      // ── Official Assessor Sign-Off & Verification Block ──
      if (y > 240) { doc.addPage(); y = margin + 5; }

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 28, 2, 2, "F");
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, 28, 2, 2, "S");

      doc.setTextColor(13, 27, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("INTERNAL ASSESSOR & INSTITUTIONAL VERIFICATION", margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 60, 75);

      const colHalf = contentW / 2;
      // Trainer Sign-off
      doc.text("Internal Assessor / Trainer: Alexander Kinoti", margin + 4, y + 11);
      doc.text("Signature: ______________________    Date: " + format(new Date(), "dd/MM/yyyy"), margin + 4, y + 17);

      // HOD / Exam Officer Sign-off
      doc.text("Head of Department / Verification Officer: ________________", margin + colHalf + 4, y + 11);
      doc.text("Signature: ______________________    Date: ________________", margin + colHalf + 4, y + 17);

      // Certification note
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(100, 115, 130);
      doc.text(
        "Certified under the TVET CDACC Competency-Based Education and Training (CBET) framework. Mukiria Technical Training Institute.",
        pageW / 2,
        y + 24,
        { align: "center" }
      );
      y += 32;

      // ── Running Footers on ALL Pages ──
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(13, 27, 42);
        doc.rect(0, 283, pageW, 14, "F");

        doc.setTextColor(180, 200, 220);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Mukiria Technical Training Institute  |  Unit: ${sub.unit_code}  |  Candidate: ${sub.reg_number}  |  Page ${p} of ${totalPages}`,
          pageW / 2,
          289,
          { align: "center" }
        );
        doc.text(
          `Official Academic Record  •  ISO 9001:2015 Certified  •  Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
          pageW / 2,
          293,
          { align: "center" }
        );
      }

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
      const margin = 14;
      const contentW = pageW - 2 * margin;
      let y = margin;

      // Header
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, pageW, 38, "F");
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 38, pageW, 1.5, "F");

      doc.setTextColor(16, 185, 129);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 12, { align: "center" });
      doc.setTextColor(180, 200, 220);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("DEPARTMENT OF COMPUTING & INFORMATICS  •  CLASS PERFORMANCE REPORT", pageW / 2, 20, { align: "center" });
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${unitCode} — ${exam?.course_name ?? ""}`, pageW / 2, 30, { align: "center" });

      y = 48;

      // Summary stats
      const examTotalMarks = exam?.payload?.total_marks ?? 70;
      const getPct = (score: number | null) => (score !== null && examTotalMarks > 0 ? Math.round((score / examTotalMarks) * 100) : score);

      const avgRaw = unitSubs.reduce((s, sub) => s + (sub.total_score ?? 0), 0) / unitSubs.length;
      const avgPct = examTotalMarks > 0 ? (avgRaw / examTotalMarks) * 100 : avgRaw;
      const passSubs = unitSubs.filter((s) => (getPct(s.total_score) ?? 0) >= 50);
      const passCount = passSubs.length;
      const passRate = (passCount / unitSubs.length) * 100;
      const highestPct = Math.max(...unitSubs.map((s) => getPct(s.total_score) ?? 0));
      const lowestPct = Math.min(...unitSubs.map((s) => getPct(s.total_score) ?? 0));

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "F");
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "S");

      doc.setTextColor(13, 27, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("CLASS SUMMARY STATISTICS", margin + 4, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 70, 85);
      doc.text(`Enrolled Evaluated: ${unitSubs.length} Candidates`, margin + 4, y + 14);
      doc.text(`Class Average: ${avgPct.toFixed(1)}% (${avgRaw.toFixed(1)} / ${examTotalMarks})`, margin + 55, y + 14);
      doc.text(`Competency Pass Rate: ${passRate.toFixed(1)}% (${passCount}/${unitSubs.length})`, margin + 120, y + 14);
      doc.text(`Highest Score: ${highestPct}%`, margin + 4, y + 21);
      doc.text(`Lowest Score: ${lowestPct}%`, margin + 55, y + 21);
      doc.text(`Generated: ${format(new Date(), "dd MMMM yyyy")}`, margin + 120, y + 21);

      y += 33;

      // Student results table
      doc.setFillColor(13, 27, 42);
      doc.rect(margin, y, contentW, 7, "F");
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE PERFORMANCE LIST", margin + 4, y + 4.8);
      y += 8.5;

      // Table headers
      doc.setFillColor(232, 245, 238);
      doc.rect(margin, y, contentW, 6.5, "F");
      doc.setTextColor(13, 27, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("#", margin + 3, y + 4.5);
      doc.text("Candidate Name", margin + 10, y + 4.5);
      doc.text("Registration Number", margin + 65, y + 4.5);
      doc.text("Score", margin + 110, y + 4.5);
      doc.text("Pct", margin + 130, y + 4.5);
      doc.text("Grade", margin + 145, y + 4.5);
      doc.text("CDACC Verdict", margin + 162, y + 4.5);
      y += 7.5;

      const sorted = [...unitSubs].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0));
      sorted.forEach((sub, idx) => {
        if (y > 265) { doc.addPage(); y = margin + 5; }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 1, contentW, 6.5, "F");
        }
        const pct = getPct(sub.total_score) ?? 0;
        const isComp = pct >= 50;

        doc.setTextColor(13, 27, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(`${idx + 1}`, margin + 3, y + 3.8);
        doc.text(cleanEllipsis(sub.student_name, 28), margin + 10, y + 3.8);
        doc.text(sub.reg_number, margin + 65, y + 3.8);

        doc.text(`${sub.total_score ?? "—"}/${examTotalMarks}`, margin + 110, y + 3.8);

        doc.setFont("helvetica", "bold");
        const scoreColor = isComp ? [16, 140, 90] : [200, 30, 30];
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.text(`${pct}%`, margin + 130, y + 3.8);
        doc.text(getCDACCGrade(pct), margin + 145, y + 3.8);

        doc.setFont("helvetica", "normal");
        doc.text(isComp ? "COMPETENT" : "NOT YET COMPETENT", margin + 162, y + 3.8);
        doc.setTextColor(13, 27, 42);
        y += 6.5;
      });

      // Running Footers on ALL Pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(13, 27, 42);
        doc.rect(0, 283, pageW, 14, "F");
        doc.setTextColor(180, 200, 220);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Mukiria Technical Training Institute  |  Class Report: ${unitCode}  |  Page ${p} of ${totalPages}`,
          pageW / 2, 289, { align: "center" }
        );
        doc.text(
          `Official Academic Record  •  ISO 9001:2015 Certified  •  Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
          pageW / 2, 293, { align: "center" }
        );
      }

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
    <TrainerLayout title="Reports" subtitle="Generate official transcripts and class performance reports">
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
                        {(() => {
                          const exam = exams.find((e) => e.unit_code === sub.unit_code);
                          const totalMarks = exam?.payload?.total_marks ?? 70;
                          const pct = sub.total_score !== null && totalMarks > 0 ? Math.round((sub.total_score / totalMarks) * 100) : null;
                          return (
                            <div className="flex flex-col">
                              <span
                                className="text-sm font-bold font-mono"
                                style={{
                                  color:
                                    sub.total_score === null
                                      ? "oklch(0.58 0.012 240)"
                                      : (pct ?? 0) >= 50
                                      ? "oklch(0.72 0.18 160)"
                                      : "oklch(0.65 0.22 25)",
                                }}
                              >
                                {sub.total_score !== null ? `${sub.total_score} / ${totalMarks}` : "—"}
                              </span>
                              {pct !== null && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {pct}%
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const exam = exams.find((e) => e.unit_code === sub.unit_code);
                          const totalMarks = exam?.payload?.total_marks ?? 70;
                          const pct = sub.total_score !== null && totalMarks > 0 ? Math.round((sub.total_score / totalMarks) * 100) : null;
                          return (
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  sub.total_score === null
                                    ? "oklch(1 0 0 / 0.05)"
                                    : (pct ?? 0) >= 50
                                    ? "oklch(0.72 0.18 160 / 0.15)"
                                    : "oklch(0.65 0.22 25 / 0.15)",
                                color:
                                  sub.total_score === null
                                    ? "oklch(0.58 0.012 240)"
                                    : (pct ?? 0) >= 50
                                    ? "oklch(0.72 0.18 160)"
                                    : "oklch(0.65 0.22 25)",
                              }}
                            >
                              {getGrade(pct)}
                            </span>
                          );
                        })()}
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
    </TrainerLayout>
  );
}
