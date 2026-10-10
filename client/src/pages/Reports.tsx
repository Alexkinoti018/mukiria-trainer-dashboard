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
import { buildUnifiedGradedExamData, exportGradedExamPDFClientSide } from "@/lib/exportGradedExamPdf";
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
    const exam = exams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id);
    const unified = buildUnifiedGradedExamData(sub, exam, "Alexander Kinoti");
    setGenerating(sub.id);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 14;
      const contentW = pageW - 2 * margin; // 182 mm
      let y = margin;

      // ── Header (Deep Institutional Navy #000953 -> 0, 9, 83) ──
      doc.setFillColor(0, 9, 83);
      doc.rect(0, 0, pageW, 38, "F");

      // Gold accent stripe (#c48820 -> 196, 136, 32)
      doc.setFillColor(196, 136, 32);
      doc.rect(0, 38, pageW, 1.8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 12, { align: "center" });

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("P.O. Box 100 - 60200, Meru, Kenya  |  Tel: +254 700 000 000  |  Email: info@mukiriatti.ac.ke", pageW / 2, 18, { align: "center" });
      doc.text("DEPARTMENT OF COMPUTING & INFORMATICS  •  TVET CDACC CBET ACCREDITED", pageW / 2, 24, { align: "center" });

      doc.setTextColor(254, 246, 231);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL CANDIDATE ACADEMIC TRANSCRIPT", pageW / 2, 33, { align: "center" });

      y = 45;

      // ── Candidate & Assessment Info Box ──
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 36, 2, 2, "F");
      doc.setDrawColor(0, 9, 83);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, contentW, 36, 2, 2, "S");

      // Header inside box
      doc.setFillColor(0, 9, 83);
      doc.roundedRect(margin, y, contentW, 7, 2, 2, "F");
      doc.setTextColor(254, 246, 231);
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
      doc.setTextColor(15, 23, 42);
      doc.text(unified.student_name.toUpperCase(), col1ValX, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Course Unit:", col2X, y + 13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const courseLines = doc.splitTextToSize(unified.unit_name, 58);
      doc.text(courseLines[0], col2ValX, y + 13);

      // Row 2
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Reg Number:", col1X, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(unified.reg_number, col1ValX, y + 20);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Unit Code:", col2X, y + 20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(unified.unit_code, col2ValX, y + 20);

      // Row 3
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Class / Cohort:", col1X, y + 27);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(unified.class_code, col1ValX, y + 27);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Assessment:", col2X, y + 27);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(unified.exam_title, 58);
      doc.text(titleLines[0], col2ValX, y + 27);

      // Row 4
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Assessor:", col1X, y + 33);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Alexander Kinoti (Trainer)", col1ValX, y + 33);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 80, 95);
      doc.text("Exam Date:", col2X, y + 33);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(format(new Date(sub.created_at), "dd MMMM yyyy"), col2ValX, y + 33);

      y += 42;

      // ── Section A Results ──
      if (unified.section_a.length > 0) {
        doc.setFillColor(0, 9, 83);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(254, 246, 231);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const secATitle = `SECTION A — CORE CONCEPTS & WORKPLACE PROCEDURES (${unified.sec_a_max} MARKS)`;
        doc.text(secATitle, margin + 4, y + 4.8);
        y += 8.5;

        // Table Header
        doc.setFillColor(254, 246, 231);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setTextColor(0, 9, 83);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text("Q#", margin + 3, y + 4.5);
        doc.text("Assessment Task / Question", margin + 12, y + 4.5);
        doc.text("Candidate Response", margin + 66, y + 4.5);
        doc.text("Expected Key / Criteria", margin + 118, y + 4.5);
        doc.text("Marks", margin + 156, y + 4.5);
        doc.text("Verdict", margin + 168, y + 4.5);
        y += 7.5;

        unified.section_a.forEach((q, idx) => {
          if (y > 265) {
            doc.addPage();
            y = margin + 5;
          }

          const maxMarks = q.max_marks;
          const marksAwarded = q.marks_awarded;
          const isFull = marksAwarded >= maxMarks;
          const isPartial = marksAwarded > 0 && marksAwarded < maxMarks;

          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 1, contentW, 6.5, "F");
          }

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);

          // Q#
          doc.setFont("helvetica", "bold");
          doc.text(`Q${q.q_num || idx + 1}`, margin + 3, y + 3.8);
          doc.setFont("helvetica", "normal");

          // Question Prompt / Task
          doc.text(cleanEllipsis(q.text, 32), margin + 12, y + 3.8);

          // Student Answer
          doc.text(cleanEllipsis(q.formatted_answer || "No response", 32), margin + 66, y + 3.8);

          // Correct Answer / Expected Key
          const correctAns =
            q.formatted_correct_answer ||
            (q.breakdown && q.breakdown.length > 0 ? q.breakdown.join("; ") : "");
          doc.text(cleanEllipsis(correctAns, 26), margin + 118, y + 3.8);

          // Marks
          doc.setFont("helvetica", "bold");
          doc.text(`${marksAwarded}/${maxMarks}`, margin + 156, y + 3.8);

          // Verdict
          if (isFull) {
            doc.setTextColor(21, 128, 61);
            doc.text("CORRECT", margin + 168, y + 3.8);
          } else if (isPartial) {
            doc.setTextColor(196, 136, 32);
            doc.text("PARTIAL", margin + 168, y + 3.8);
          } else {
            doc.setTextColor(200, 30, 30);
            doc.text("WRONG", margin + 168, y + 3.8);
          }
          doc.setTextColor(15, 23, 42);
          y += 6.5;
        });

        const sectionAPct = unified.sec_a_max > 0 ? Math.round((unified.sec_a_awarded / unified.sec_a_max) * 100) : 0;

        doc.setFillColor(254, 246, 231);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 9, 83);
        doc.text(
          `Section A Total: ${unified.sec_a_awarded} / ${unified.sec_a_max} Marks (${sectionAPct}%) — Competency Level: ${sectionAPct >= 50 ? "COMPETENT" : "NOT YET COMPETENT"}`,
          margin + 4,
          y + 4.5
        );
        y += 11;
      }

      // ── Section B Results ──
      if (unified.section_b.length > 0) {
        if (y > 230) {
          doc.addPage();
          y = margin + 5;
        }

        doc.setFillColor(0, 9, 83);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const secBTitle = (unified.section_b_instructions || "SECTION B — STRUCTURED PRACTICAL & APPLICATION QUESTIONS").toUpperCase();
        doc.text(secBTitle, margin + 4, y + 4.8);
        y += 9;

        unified.section_b.forEach((q, idx) => {
          if (y > 230) {
            doc.addPage();
            y = margin + 5;
          }

          const qMaxMarks = q.max_marks ?? 20;
          const qAwarded = q.marks_awarded ?? 0;

          // Question header banner
          doc.setFillColor(242, 246, 250);
          doc.rect(margin, y, contentW, 6.5, "F");
          doc.setTextColor(0, 9, 83);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(`Question ${q.q_num || idx + 1}${q.critical_aspect ? ` — ${q.critical_aspect}` : ""}`, margin + 3, y + 4.5);
          doc.setTextColor(196, 136, 32);
          doc.text(`${qAwarded} / ${qMaxMarks} Marks`, margin + contentW - 4, y + 4.5, { align: "right" });
          y += 7.5;

          // Question Prompt
          if (q.text) {
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            const qLines = doc.splitTextToSize(q.text, contentW - 6);
            for (let l = 0; l < qLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(qLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 1.5;
          }

          // Structured Sub-parts (a, b, c, d)
          if (q.sub_parts && q.sub_parts.length > 0) {
            q.sub_parts.forEach((spLine) => {
              doc.setFont("helvetica", "italic");
              doc.setTextColor(51, 65, 85);
              doc.setFontSize(7.2);
              const spLines = doc.splitTextToSize(spLine, contentW - 10);
              for (let l = 0; l < spLines.length; l++) {
                if (y > 268) { doc.addPage(); y = margin + 5; }
                doc.text(spLines[l], margin + 6, y + 3);
                y += 3.5;
              }
            });
            y += 1.5;
          }

          // Candidate Answer
          if (q.formatted_answer) {
            if (y > 268) { doc.addPage(); y = margin + 5; }
            doc.setTextColor(0, 9, 83);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.text("Candidate Response:", margin + 3, y + 3);
            y += 4;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 40, 55);
            const ansLines = doc.splitTextToSize(String(q.formatted_answer), contentW - 6);
            for (let l = 0; l < ansLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(ansLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 2;
          }

          // Assessor Feedback
          if (q.ai_reasoning) {
            if (y > 268) { doc.addPage(); y = margin + 5; }
            doc.setTextColor(185, 28, 28);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.text("Assessor Evaluation Feedback:", margin + 3, y + 3);
            y += 4;

            doc.setFont("helvetica", "italic");
            doc.setTextColor(60, 70, 85);
            const reasonLines = doc.splitTextToSize(q.ai_reasoning, contentW - 6);
            for (let l = 0; l < reasonLines.length; l++) {
              if (y > 268) { doc.addPage(); y = margin + 5; }
              doc.text(reasonLines[l], margin + 3, y + 3);
              y += 3.6;
            }
            y += 3;
          }

          y += 2;
        });

        const sectionBPct = unified.sec_b_max > 0 ? Math.round((unified.sec_b_awarded / unified.sec_b_max) * 100) : 0;

        if (y > 260) { doc.addPage(); y = margin + 5; }
        doc.setFillColor(254, 246, 231);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(0, 9, 83);
        doc.text(
          `Section B Total: ${unified.sec_b_awarded} / ${unified.sec_b_max} Marks (${sectionBPct}%)`,
          margin + 4,
          y + 4.5
        );
        y += 11;
      }

      // ── Final Aggregate Score & CDACC Verdict Box ──
      if (y > 215) { doc.addPage(); y = margin + 5; }

      const examTotalMarks = unified.total_marks;
      const totalScore = unified.total_score;
      const percentage = unified.percentage;
      const isCompetent = percentage >= 50;
      const grade = getCDACCGrade(percentage);
      const remark = getCDACCRemark(percentage);

      const scoreBg = isCompetent ? [0, 9, 83] : [185, 28, 28];
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
      doc.setTextColor(196, 136, 32);
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

      doc.setTextColor(0, 9, 83);
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
        doc.setFillColor(0, 9, 83);
        doc.rect(0, 283, pageW, 14, "F");

        doc.setTextColor(226, 232, 240);
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
      doc.setFillColor(0, 9, 83);
      doc.rect(0, 0, pageW, 38, "F");
      doc.setFillColor(196, 136, 32);
      doc.rect(0, 38, pageW, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", pageW / 2, 12, { align: "center" });
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("DEPARTMENT OF COMPUTING & INFORMATICS  •  CLASS PERFORMANCE REPORT", pageW / 2, 20, { align: "center" });
      doc.setTextColor(196, 136, 32);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${unitCode} — ${exam?.course_name ?? ""}`, pageW / 2, 30, { align: "center" });

      y = 48;

      // Summary stats using unified clamped scores
      const unifiedSubs = unitSubs.map((s) => ({
        sub: s,
        unified: buildUnifiedGradedExamData(s, exam),
      }));
      const examTotalMarks = unifiedSubs[0]?.unified.total_marks ?? (exam?.payload?.total_marks ?? 70);

      const avgRaw = unifiedSubs.reduce((s, item) => s + item.unified.total_score, 0) / unifiedSubs.length;
      const avgPct = examTotalMarks > 0 ? (avgRaw / examTotalMarks) * 100 : avgRaw;
      const passSubs = unifiedSubs.filter((item) => item.unified.percentage >= 50);
      const passCount = passSubs.length;
      const passRate = (passCount / unifiedSubs.length) * 100;
      const highestPct = Math.max(...unifiedSubs.map((item) => item.unified.percentage));
      const lowestPct = Math.min(...unifiedSubs.map((item) => item.unified.percentage));

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "F");
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, 26, 2, 2, "S");

      doc.setTextColor(0, 9, 83);
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
      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE PERFORMANCE LIST", margin + 4, y + 4.8);
      y += 8.5;

      // Table headers
      doc.setFillColor(254, 246, 231);
      doc.rect(margin, y, contentW, 6.5, "F");
      doc.setTextColor(0, 9, 83);
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

      const sorted = [...unifiedSubs].sort((a, b) => b.unified.total_score - a.unified.total_score);
      sorted.forEach(({ sub, unified }, idx) => {
        if (y > 265) { doc.addPage(); y = margin + 5; }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 1, contentW, 6.5, "F");
        }
        const pct = unified.percentage;
        const isComp = pct >= 50;

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(`${idx + 1}`, margin + 3, y + 3.8);
        doc.text(cleanEllipsis(sub.student_name, 28), margin + 10, y + 3.8);
        doc.text(sub.reg_number, margin + 65, y + 3.8);

        doc.text(`${unified.total_score}/${unified.total_marks}`, margin + 110, y + 3.8);

        doc.setFont("helvetica", "bold");
        const scoreColor = isComp ? [21, 128, 61] : [200, 30, 30];
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        doc.text(`${pct}%`, margin + 130, y + 3.8);
        doc.text(getCDACCGrade(pct), margin + 145, y + 3.8);

        doc.setFont("helvetica", "normal");
        doc.text(isComp ? "COMPETENT" : "NOT YET COMPETENT", margin + 162, y + 3.8);
        doc.setTextColor(15, 23, 42);
        y += 6.5;
      });

      // Running Footers on ALL Pages
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(0, 9, 83);
        doc.rect(0, 283, pageW, 14, "F");
        doc.setTextColor(226, 232, 240);
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
        <h3 className="text-sm font-bold mb-3 text-[#000953]">
          Class Reports
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse bg-slate-100 border border-slate-200" />
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
                    className="bg-white border border-slate-300 rounded-xl shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-[#000953]">
                          {exam.unit_code}
                        </div>
                        <div className="text-xs mt-0.5 text-slate-600 font-medium">
                          {exam.course_name}
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-[#c48820]/30 text-[#c48820]">
                        {gradedCount} graded
                      </div>
                    </div>
                    <button
                      onClick={() => generateClassReport(exam.unit_code)}
                      disabled={isGen || gradedCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c48820]" />
                      {isGen ? "Generating..." : "Download Class Report"}
                    </button>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Individual Transcripts */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#000953]">
            Individual Transcripts & Graded Exam Papers
          </h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="bg-transparent text-xs outline-none w-36 text-[#0f172a] placeholder-slate-400"
              />
            </div>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0f172a] shadow-sm focus:outline-none focus:border-[#000953]"
            >
              <option value="all">All Units</option>
              {exams.map((e) => (
                <option key={e.id} value={e.unit_code}>{e.unit_code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Student", "Reg Number", "Unit", "Score", "Grade", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No submissions found
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const isGen = generating === sub.id;
                  const exam = exams.find((e) => e.id === sub.exam_id || e.unit_code === sub.unit_code);
                  const unified = buildUnifiedGradedExamData(sub, exam);
                  const pct = sub.total_score !== null ? unified.percentage : null;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-[#0f172a]">
                          {sub.student_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-600">
                          {sub.reg_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold text-[#000953]">
                          {sub.unit_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold font-mono ${
                              sub.total_score === null
                                ? "text-slate-400"
                                : (pct ?? 0) >= 50
                                ? "text-emerald-700"
                                : "text-rose-600"
                            }`}
                          >
                            {sub.total_score !== null ? `${unified.total_score} / ${unified.total_marks}` : "—"}
                          </span>
                          {pct !== null && (
                            <span className="text-[10px] font-mono font-semibold text-slate-500">
                              {pct}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            sub.total_score === null
                              ? "bg-slate-100 border-slate-300 text-slate-500"
                              : (pct ?? 0) >= 50
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}
                        >
                          {getGrade(pct)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider status-${sub.status}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              exportGradedExamPDFClientSide(unified);
                              toast.success("Official Graded Exam Paper Downloaded", {
                                description: `${sub.student_name} (${sub.unit_code})`,
                              });
                            }}
                            disabled={sub.total_score === null}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm"
                            title="Download Official Graded Exam Paper PDF (Matches Trainee Exam Format)"
                          >
                            <Download className="w-3 h-3 text-[#c48820]" />
                            Graded Paper
                          </button>
                          <button
                            onClick={() => generateTranscript(sub)}
                            disabled={isGen || sub.total_score === null}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 bg-white border border-slate-300 hover:bg-slate-100 text-[#000953] shadow-sm"
                            title="Download Summary Transcript PDF"
                          >
                            <Download className="w-3 h-3 text-slate-600" />
                            {isGen ? "..." : "Transcript"}
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
      </div>
    </TrainerLayout>
  );
}
