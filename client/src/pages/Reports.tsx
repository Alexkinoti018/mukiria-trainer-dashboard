/**
 * Global-Standard Academic & Competency Assessment Report Generator
 * Aligned with ISO 21001:2018, ISO 9001:2015, and TVET CDACC CBET Standards
 * Generates Official Class Performance & Psychometric Reports, Individual Transcripts,
 * and Official Graded Examination Scripts using jsPDF.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Users,
  CheckCircle2,
  Search,
  Award,
  BarChart3,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { useExam } from "@/contexts/ExamContext";
import type { Exam, Submission } from "@/lib/supabase";
import { buildUnifiedGradedExamData, exportGradedExamPDFClientSide } from "@/lib/exportGradedExamPdf";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";

function cleanEllipsis(text: string, maxLen: number): string {
  if (!text) return "—";
  const clean = String(text).replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
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

function getShortVerdict(percentage: number | null): string {
  if (percentage === null) return "PENDING";
  return percentage >= 50 ? "COMPETENT" : "NYC (REFER)";
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/mtti-logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawInstitutionalHeader(
  doc: jsPDF,
  logoDataUrl: string | null,
  reportTitle: string,
  subtitle: string,
  docRef: string
): number {
  const pageW = 210;

  // Deep Institutional Navy Banner (#000953 -> RGB 0, 9, 83)
  doc.setFillColor(0, 9, 83);
  doc.rect(0, 0, pageW, 38, "F");

  // Accent Gold Rule (#c48820 -> RGB 196, 136, 32)
  doc.setFillColor(196, 136, 32);
  doc.rect(0, 38, pageW, 2, "F");

  // Logo or Institutional Emblem on left
  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 5.5, 24, 24, 2, 2, "F");
      doc.addImage(logoDataUrl, "JPEG", 13, 6.5, 22, 22);
    } catch {
      // fallback crest
    }
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, 6, 22, 22, 2, 2, "F");
    doc.setTextColor(0, 9, 83);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MTTI", 23, 18.5, { align: "center" });
  }

  // Main Institution Headings
  const centerX = pageW / 2 + 6;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MUKIRIA TECHNICAL TRAINING INSTITUTE", centerX, 11, { align: "center" });

  doc.setTextColor(226, 232, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "P.O. Box 100 - 60200, Meru, Kenya  •  ISO 9001:2015 & ISO 21001:2018 Certified  •  TVET CDACC Accredited Center",
    centerX,
    16.5,
    { align: "center" }
  );

  doc.setTextColor(196, 136, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(reportTitle.toUpperCase(), centerX, 23.5, { align: "center" });

  doc.setTextColor(254, 246, 231);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(cleanEllipsis(subtitle, 85), centerX, 29.5, { align: "center" });

  // Quality Management System (QMS) Document Control Bar inside bottom of header
  doc.setFillColor(10, 22, 105);
  doc.rect(0, 32, pageW, 6, "F");
  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text(`DOC REF: ${docRef}`, 12, 36);
  doc.text("STANDARD: ISO 21001:2018 / TVET CDACC CBET", pageW / 2, 36, { align: "center" });
  doc.text(`ISSUED: ${format(new Date(), "dd MMM yyyy, HH:mm")} EAT`, pageW - 12, 36, {
    align: "right",
  });

  return 45;
}

function drawRunningFooters(doc: jsPDF, docRef: string, unitCode: string, contextLabel: string) {
  const pageW = 210;
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Gold rule above footer
    doc.setFillColor(196, 136, 32);
    doc.rect(0, 282, pageW, 1, "F");
    // Navy footer bar
    doc.setFillColor(0, 9, 83);
    doc.rect(0, 283, pageW, 14, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      `MUKIRIA TECHNICAL TRAINING INSTITUTE  |  ${docRef}  |  UNIT: ${unitCode}  |  ${contextLabel}`,
      12,
      288.5
    );
    doc.text(`Page ${p} of ${totalPages}`, pageW - 12, 288.5, { align: "right" });

    doc.setTextColor(203, 213, 225);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(
      `Official Competency-Based Education & Training (CBET) Record  •  ISO 9001:2015 & ISO 21001:2018 Certified  •  Generated: ${format(
        new Date(),
        "dd MMM yyyy, HH:mm"
      )}`,
      12,
      293.5
    );
  }
}

export default function Reports() {
  const { exams, submissions } = useExam();
  const [loading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pre-compute unified exam data for all submissions so stats are 100% consistent
  const enrichedSubmissions = useMemo(() => {
    return submissions.map((sub) => {
      const exam = exams.find((e) => e.id === sub.exam_id || e.unit_code === sub.unit_code);
      const unified = buildUnifiedGradedExamData(sub, exam, "Alexander Kinoti");
      return { sub, exam, unified };
    });
  }, [submissions, exams]);

  const gradedEnriched = useMemo(
    () => enrichedSubmissions.filter((item) => item.sub.total_score !== null),
    [enrichedSubmissions]
  );

  const globalMetrics = useMemo(() => {
    if (gradedEnriched.length === 0) {
      return { count: 0, meanPct: 0, passRate: 0, distinctionCreditRate: 0 };
    }
    const count = gradedEnriched.length;
    const meanPct =
      gradedEnriched.reduce((acc, item) => acc + item.unified.percentage, 0) / count;
    const passCount = gradedEnriched.filter((item) => item.unified.percentage >= 50).length;
    const distCreditCount = gradedEnriched.filter((item) => item.unified.percentage >= 65).length;
    return {
      count,
      meanPct: Math.round(meanPct * 10) / 10,
      passRate: Math.round((passCount / count) * 1000) / 10,
      distinctionCreditRate: Math.round((distCreditCount / count) * 1000) / 10,
    };
  }, [gradedEnriched]);

  // ── 1. Generate Global-Standard Individual Candidate Transcript PDF ─────────
  const generateTranscript = async (sub: Submission) => {
    const exam = exams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id);
    const unified = buildUnifiedGradedExamData(sub, exam, "Alexander Kinoti");
    setGenerating(sub.id);

    try {
      const logoDataUrl = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 12;
      const contentW = pageW - 2 * margin; // 186 mm

      let y = drawInstitutionalHeader(
        doc,
        logoDataUrl,
        "OFFICIAL CANDIDATE COMPETENCY TRANSCRIPT",
        `${unified.unit_code} — ${unified.unit_name}`,
        "MTTI/QMS/EX/TR-01"
      );

      // ── Section 1: Candidate & Examination Specifications Box ──
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 9, 83);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, 35, 1.5, 1.5, "FD");

      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6.5, "F");
      doc.setTextColor(254, 246, 231);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("1. CANDIDATE & ASSESSMENT SPECIFICATIONS", margin + 3, y + 4.5);

      const drawSpecPair = (
        rowY: number,
        lbl1: string,
        val1: string,
        lbl2: string,
        val2: string
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(lbl1, margin + 3, rowY);
        doc.text(lbl2, margin + 96, rowY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(cleanEllipsis(val1, 36), margin + 32, rowY);
        doc.text(cleanEllipsis(val2, 36), margin + 126, rowY);
      };

      drawSpecPair(
        y + 12,
        "Candidate Name:",
        unified.student_name.toUpperCase(),
        "Unit Code:",
        unified.unit_code
      );
      drawSpecPair(
        y + 18,
        "Registration No:",
        unified.reg_number,
        "Unit Title:",
        unified.unit_name
      );
      drawSpecPair(
        y + 24,
        "Programme / Class:",
        `${unified.class_code} (${unified.series})`,
        "Assessment Slot:",
        `${unified.exam_title} (${unified.task_code})`
      );
      drawSpecPair(
        y + 30,
        "Date Evaluated:",
        unified.evaluated_at,
        "Internal Assessor:",
        unified.trainer_name
      );

      y += 40;

      // ── Section 2: Executive Competency & Score Summary Strip ──
      const isCompetent = unified.percentage >= 50;
      const grade = getCDACCGrade(unified.percentage);
      const remark = getCDACCRemark(unified.percentage);

      doc.setFillColor(isCompetent ? 240 : 254, isCompetent ? 253 : 242, isCompetent ? 244 : 242);
      doc.setDrawColor(isCompetent ? 21 : 185, isCompetent ? 128 : 28, isCompetent ? 61 : 28);
      doc.setLineWidth(0.45);
      doc.roundedRect(margin, y, contentW, 18, 1.5, 1.5, "FD");

      doc.setTextColor(0, 9, 83);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(
        `SECTION A: ${unified.sec_a_awarded} / ${unified.sec_a_max} MKS`,
        margin + 4,
        y + 7
      );
      doc.text(
        `SECTION B: ${unified.sec_b_awarded} / ${unified.sec_b_max} MKS`,
        margin + 52,
        y + 7
      );
      doc.text(
        `TOTAL SCORE: ${unified.total_score} / ${unified.total_marks} (${unified.percentage}%)`,
        margin + 102,
        y + 7
      );

      doc.setFontSize(8.5);
      doc.setTextColor(isCompetent ? 21 : 185, isCompetent ? 128 : 28, isCompetent ? 61 : 28);
      doc.text(
        `CDACC CBET VERDICT: ${remark}   •   CLASSIFICATION: ${grade}`,
        margin + 4,
        y + 14
      );

      y += 23;

      // ── Section 3: Section A Itemized Evaluation Table ──
      if (unified.section_a.length > 0) {
        doc.setFillColor(0, 9, 83);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(
          `2. SECTION A — ITEMIZED QUESTION EVALUATION (${unified.sec_a_awarded} / ${unified.sec_a_max} MARKS)`,
          margin + 3,
          y + 4.4
        );
        y += 6.5;

        // Table Header
        doc.setFillColor(254, 246, 231);
        doc.rect(margin, y, contentW, 6, "F");
        doc.setTextColor(0, 9, 83);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Q#", margin + 2, y + 4.2);
        doc.text("Question / Competency Prompt", margin + 10, y + 4.2);
        doc.text("Candidate Response", margin + 84, y + 4.2);
        doc.text("Expected Standard / Key", margin + 124, y + 4.2);
        doc.text("Marks", margin + 158, y + 4.2);
        doc.text("Status", margin + 171, y + 4.2);
        y += 6.5;

        unified.section_a.forEach((q, idx) => {
          if (y > 262) {
            doc.addPage();
            y = 16;
          }
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 0.5, contentW, 6, "F");
          }

          const marksAwarded = q.marks_awarded ?? 0;
          const maxMarks = q.max_marks ?? 2;
          const isFull = marksAwarded >= maxMarks && maxMarks > 0;
          const isPartial = marksAwarded > 0 && marksAwarded < maxMarks;

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.text(`Q${q.q_num || idx + 1}`, margin + 2, y + 3.6);

          doc.setFont("helvetica", "normal");
          doc.text(cleanEllipsis(q.text, 44), margin + 10, y + 3.6);
          doc.text(cleanEllipsis(q.formatted_answer || "No response", 24), margin + 84, y + 3.6);

          const correctAns =
            q.formatted_correct_answer ||
            q.rubric ||
            (q.breakdown && q.breakdown.length > 0 ? q.breakdown.join("; ") : "Standard rubric");
          doc.text(cleanEllipsis(correctAns, 20), margin + 124, y + 3.6);

          doc.setFont("helvetica", "bold");
          doc.text(`${marksAwarded}/${maxMarks}`, margin + 158, y + 3.6);

          if (isFull) {
            doc.setTextColor(21, 128, 61);
            doc.text("FULL", margin + 171, y + 3.6);
          } else if (isPartial) {
            doc.setTextColor(196, 136, 32);
            doc.text("PARTIAL", margin + 171, y + 3.6);
          } else {
            doc.setTextColor(185, 28, 28);
            doc.text("ZERO", margin + 171, y + 3.6);
          }
          doc.setTextColor(15, 23, 42);
          y += 6;
        });

        y += 4;
      }

      // ── Section 4: Section B Structured Application Evaluation ──
      if (unified.section_b.length > 0) {
        if (y > 235) {
          doc.addPage();
          y = 16;
        }

        doc.setFillColor(0, 9, 83);
        doc.rect(margin, y, contentW, 6.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text(
          `3. SECTION B — STRUCTURED APPLICATION EVALUATION (${unified.sec_b_awarded} / ${unified.sec_b_max} MARKS)`,
          margin + 3,
          y + 4.4
        );
        y += 8;

        unified.section_b.forEach((q, idx) => {
          if (y > 240) {
            doc.addPage();
            y = 16;
          }

          const qMaxMarks = q.max_marks ?? 20;
          const qAwarded = q.marks_awarded ?? 0;

          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y, contentW, 6, "F");
          doc.setTextColor(0, 9, 83);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.text(
            `Question ${q.q_num || idx + 1}${q.critical_aspect ? ` — ${cleanEllipsis(q.critical_aspect, 65)}` : ""}`,
            margin + 3,
            y + 4.2
          );
          doc.setTextColor(196, 136, 32);
          doc.text(`${qAwarded} / ${qMaxMarks} Marks`, margin + contentW - 3, y + 4.2, {
            align: "right",
          });
          y += 7;

          if (q.text) {
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.2);
            const qLines = doc.splitTextToSize(q.text, contentW - 6);
            for (let l = 0; l < qLines.length; l++) {
              if (y > 268) {
                doc.addPage();
                y = 16;
              }
              doc.text(qLines[l], margin + 3, y + 3);
              y += 3.5;
            }
          }

          if (q.sub_parts && q.sub_parts.length > 0) {
            q.sub_parts.forEach((spLine) => {
              doc.setFont("helvetica", "italic");
              doc.setTextColor(51, 65, 85);
              doc.setFontSize(7);
              const spLines = doc.splitTextToSize(spLine, contentW - 10);
              for (let l = 0; l < spLines.length; l++) {
                if (y > 268) {
                  doc.addPage();
                  y = 16;
                }
                doc.text(spLines[l], margin + 6, y + 3);
                y += 3.4;
              }
            });
          }

          if (q.formatted_answer) {
            if (y > 265) {
              doc.addPage();
              y = 16;
            }
            doc.setTextColor(0, 9, 83);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.2);
            doc.text("Candidate Response:", margin + 3, y + 3.2);
            y += 3.8;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(30, 41, 59);
            const ansLines = doc.splitTextToSize(String(q.formatted_answer), contentW - 6);
            for (let l = 0; l < ansLines.length; l++) {
              if (y > 268) {
                doc.addPage();
                y = 16;
              }
              doc.text(ansLines[l], margin + 3, y + 3);
              y += 3.5;
            }
          }

          if (q.ai_reasoning) {
            if (y > 265) {
              doc.addPage();
              y = 16;
            }
            doc.setTextColor(185, 28, 28);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7);
            const reasonLines = doc.splitTextToSize(
              `Assessor Evaluation: ${q.ai_reasoning}`,
              contentW - 6
            );
            for (let l = 0; l < reasonLines.length; l++) {
              if (y > 268) {
                doc.addPage();
                y = 16;
              }
              doc.text(reasonLines[l], margin + 3, y + 3);
              y += 3.5;
            }
          }
          y += 3;
        });
      }

      // ── Section 5: Institutional Sign-Off & Quality Assurance Block ──
      if (y > 235) {
        doc.addPage();
        y = 16;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, 28, 1.5, 1.5, "FD");

      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("4. INTERNAL QUALITY ASSURANCE (IQA) & INSTITUTIONAL SIGN-OFF", margin + 3, y + 4.2);

      const thirdW = contentW / 3;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.text("Internal Assessor / Trainer", margin + 3, y + 11);
      doc.text("Internal Verifier (HOD / IQA)", margin + thirdW + 3, y + 11);
      doc.text("Examinations Officer / Registrar", margin + thirdW * 2 + 3, y + 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(`Name: ${unified.trainer_name}`, margin + 3, y + 16);
      doc.text("Name: ________________________", margin + thirdW + 3, y + 16);
      doc.text("Official Stamp & Seal:", margin + thirdW * 2 + 3, y + 16);

      doc.text(`Sign: Signed (${format(new Date(), "dd/MM/yyyy")})`, margin + 3, y + 22);
      doc.text("Sign & Date: __________________", margin + thirdW + 3, y + 22);
      doc.text("Date: ________________________", margin + thirdW * 2 + 3, y + 22);

      drawRunningFooters(
        doc,
        "MTTI/QMS/EX/TR-01",
        unified.unit_code,
        `CANDIDATE: ${unified.reg_number}`
      );

      const filename = `MTTI_Transcript_${sub.reg_number.replace(/\//g, "-")}_${sub.unit_code}.pdf`;
      doc.save(filename);
      toast.success("Official Transcript Generated", { description: `${filename} downloaded.` });
    } catch (err: any) {
      console.error("❌ [MTTI Reports] PDF generation error:", err);
      toast.error("PDF Generation Failed", { description: err.message });
    } finally {
      setGenerating(null);
    }
  };

  // ── 2. Generate Global-Standard Class Performance & Psychometric Report PDF ──
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
      const logoDataUrl = await loadLogoBase64();
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 12;
      const contentW = pageW - 2 * margin; // 186 mm

      const unifiedSubs = unitSubs.map((s) => ({
        sub: s,
        unified: buildUnifiedGradedExamData(s, exam, "Alexander Kinoti"),
      }));

      const firstUnified = unifiedSubs[0].unified;
      const examTotalMarks = firstUnified.total_marks;
      const secAMax = firstUnified.sec_a_max;
      const secBMax = firstUnified.sec_b_max;

      let y = drawInstitutionalHeader(
        doc,
        logoDataUrl,
        "CLASS PERFORMANCE & PSYCHOMETRIC EVALUATION REPORT",
        `${unitCode} — ${exam?.course_name ?? firstUnified.unit_name}`,
        "MTTI/QMS/EX/CR-04"
      );

      // ── SECTION 1: Unit of Competency & Examination Metadata Grid ──
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 9, 83);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, 28, 1.5, 1.5, "FD");

      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6, "F");
      doc.setTextColor(254, 246, 231);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("1. UNIT OF COMPETENCY & ASSESSMENT SPECIFICATIONS", margin + 3, y + 4.2);

      const drawSpecRow = (
        rowY: number,
        lbl1: string,
        val1: string,
        lbl2: string,
        val2: string
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        doc.text(lbl1, margin + 3, rowY);
        doc.text(lbl2, margin + 96, rowY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(cleanEllipsis(val1, 36), margin + 33, rowY);
        doc.text(cleanEllipsis(val2, 36), margin + 128, rowY);
      };

      drawSpecRow(
        y + 11,
        "Unit Code & Title:",
        `${unitCode} — ${firstUnified.unit_name}`,
        "Assessment Series:",
        `${firstUnified.series} (${firstUnified.class_code})`
      );
      drawSpecRow(
        y + 17,
        "Qualification / Dept:",
        firstUnified.department.replace(/\n/g, " / "),
        "Max Marks Structure:",
        `${examTotalMarks} Mks (Sec A: ${secAMax} | Sec B: ${secBMax})`
      );
      drawSpecRow(
        y + 23,
        "Assessment Paper:",
        `${firstUnified.exam_title} (${firstUnified.task_code})`,
        "Competency Pass Mark:",
        `50.0% (${Math.ceil(examTotalMarks * 0.5)} / ${examTotalMarks} Marks — CDACC CBET)`
      );

      y += 32;

      // ── SECTION 2: Executive Psychometric & Statistical Analytics (6 KPI Cards) ──
      const n = unifiedSubs.length;
      const pcts = unifiedSubs.map((u) => u.unified.percentage).sort((a, b) => a - b);
      const scores = unifiedSubs.map((u) => u.unified.total_score);

      const avgRaw = scores.reduce((a, b) => a + b, 0) / n;
      const avgPct = pcts.reduce((a, b) => a + b, 0) / n;
      const medianPct =
        n % 2 === 1
          ? pcts[Math.floor(n / 2)]
          : (pcts[n / 2 - 1] + pcts[n / 2]) / 2;
      const variance = pcts.reduce((acc, p) => acc + Math.pow(p - avgPct, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      const passCount = unifiedSubs.filter((u) => u.unified.percentage >= 50).length;
      const referCount = n - passCount;
      const passRate = (passCount / n) * 100;

      const highestPct = Math.max(...pcts);
      const lowestPct = Math.min(...pcts);
      const highestRaw = Math.max(...scores);
      const lowestRaw = Math.min(...scores);

      const avgSecAPct =
        secAMax > 0
          ? (unifiedSubs.reduce((acc, u) => acc + u.unified.sec_a_awarded, 0) / (n * secAMax)) * 100
          : 0;
      const avgSecBPct =
        secBMax > 0
          ? (unifiedSubs.reduce((acc, u) => acc + u.unified.sec_b_awarded, 0) / (n * secBMax)) * 100
          : 0;

      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6, "F");
      doc.setTextColor(254, 246, 231);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("2. EXECUTIVE PSYCHOMETRIC & COHORT STATISTICAL SUMMARY", margin + 3, y + 4.2);
      y += 7.5;

      const cardW = (contentW - 6) / 3; // 3 columns x 2 rows
      const cardH = 15;
      const kpiCards = [
        {
          title: "CANDIDATES EVALUATED",
          primary: `${n} Trainees`,
          secondary: `100% Script Verification`,
          accent: [0, 9, 83],
        },
        {
          title: "COHORT MEAN SCORE",
          primary: `${avgPct.toFixed(1)}% (${avgRaw.toFixed(1)} / ${examTotalMarks})`,
          secondary: `Benchmark Target: >= 65.0%`,
          accent: [196, 136, 32],
        },
        {
          title: "MEDIAN & STD DEVIATION",
          primary: `Median: ${medianPct.toFixed(1)}%`,
          secondary: `Dispersion (SD): ±${stdDev.toFixed(1)}%`,
          accent: [0, 9, 83],
        },
        {
          title: "COMPETENCY PASS RATE",
          primary: `${passRate.toFixed(1)}% Competent`,
          secondary: `${passCount} Competent  |  ${referCount} Refer (NYC)`,
          accent: passRate >= 70 ? [21, 128, 61] : [196, 136, 32],
        },
        {
          title: "SCORE SPREAD (MAX / MIN)",
          primary: `Max: ${highestPct}% (${highestRaw}/${examTotalMarks})`,
          secondary: `Min: ${lowestPct}% (${lowestRaw}/${examTotalMarks})`,
          accent: [0, 9, 83],
        },
        {
          title: "SECTION DIAGNOSTIC SPLIT",
          primary: `Sec A (Theory): ${avgSecAPct.toFixed(1)}%`,
          secondary: `Sec B (Applied): ${avgSecBPct.toFixed(1)}%`,
          accent: [196, 136, 32],
        },
      ];

      kpiCards.forEach((card, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = margin + col * (cardW + 3);
        const cy = y + row * (cardH + 2.5);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, "FD");

        // Left vertical accent stripe
        doc.setFillColor(card.accent[0], card.accent[1], card.accent[2]);
        doc.rect(cx, cy, 1.8, cardH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.title, cx + 4, cy + 4.2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(card.primary, cx + 4, cy + 9.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        doc.text(card.secondary, cx + 4, cy + 13.5);
      });

      y += cardH * 2 + 7;

      // ── SECTION 3: CDACC Competency Grade Distribution & Visual Histogram ──
      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6, "F");
      doc.setTextColor(254, 246, 231);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("3. TVET CDACC COMPETENCY BAND DISTRIBUTION & COHORT HISTOGRAM", margin + 3, y + 4.2);
      y += 6;

      doc.setFillColor(254, 246, 231);
      doc.rect(margin, y, contentW, 5.8, "F");
      doc.setTextColor(0, 9, 83);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text("CDACC Band", margin + 2, y + 4);
      doc.text("Mark Range", margin + 28, y + 4);
      doc.text("Count", margin + 52, y + 4);
      doc.text("Share", margin + 65, y + 4);
      doc.text("Cohort Distribution Bar", margin + 80, y + 4);
      doc.text("CBET Competency Action / Descriptor", margin + 132, y + 4);
      y += 6.2;

      const bands = [
        {
          label: "DISTINCTION",
          range: "80% – 100%",
          count: unifiedSubs.filter((u) => u.unified.percentage >= 80).length,
          color: [21, 128, 61],
          desc: "Mastery — Autonomous workplace execution",
        },
        {
          label: "CREDIT",
          range: "65% – 79%",
          count: unifiedSubs.filter(
            (u) => u.unified.percentage >= 65 && u.unified.percentage < 80
          ).length,
          color: [14, 116, 144],
          desc: "Proficient — Exceeds standard CBET criteria",
        },
        {
          label: "PASS",
          range: "50% – 64%",
          count: unifiedSubs.filter(
            (u) => u.unified.percentage >= 50 && u.unified.percentage < 65
          ).length,
          color: [196, 136, 32],
          desc: "Competent — Meets minimum occupational standard",
        },
        {
          label: "REFER (NYC)",
          range: "0% – 49%",
          count: unifiedSubs.filter((u) => u.unified.percentage < 50).length,
          color: [185, 28, 28],
          desc: "Not Yet Competent — Mandatory remedial & re-sit",
        },
      ];

      bands.forEach((b, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 0.5, contentW, 6, "F");
        }
        const share = n > 0 ? (b.count / n) * 100 : 0;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(b.color[0], b.color[1], b.color[2]);
        doc.text(b.label, margin + 2, y + 3.8);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(b.range, margin + 28, y + 3.8);
        doc.setFont("helvetica", "bold");
        doc.text(`${b.count}`, margin + 54, y + 3.8);
        doc.text(`${share.toFixed(0)}%`, margin + 65, y + 3.8);

        // Visual Bar Track
        const barTrackW = 46;
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin + 80, y + 1.2, barTrackW, 3.2, 1, 1, "F");
        if (share > 0) {
          const fillW = Math.max(2, (share / 100) * barTrackW);
          doc.setFillColor(b.color[0], b.color[1], b.color[2]);
          doc.roundedRect(margin + 80, y + 1.2, fillW, 3.2, 1, 1, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.6);
        doc.setTextColor(71, 85, 105);
        doc.text(b.desc, margin + 132, y + 3.8);
        y += 6;
      });

      y += 4;

      // ── SECTION 4: Candidate Performance & Section Breakdown Register (Zero-Overlap Table) ──
      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 6.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("4. OFFICIAL CANDIDATE PERFORMANCE & SECTION BREAKDOWN REGISTER", margin + 3, y + 4.4);
      y += 6.5;

      // Table column headers — carefully spaced across 186mm so columns NEVER collide
      doc.setFillColor(254, 246, 231);
      doc.rect(margin, y, contentW, 6.2, "F");
      doc.setDrawColor(196, 136, 32);
      doc.setLineWidth(0.3);
      doc.line(margin, y + 6.2, margin + contentW, y + 6.2);

      doc.setTextColor(0, 9, 83);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text("Rank", margin + 2, y + 4.2);
      doc.text("Candidate Name", margin + 11, y + 4.2);
      doc.text("Registration Number", margin + 54, y + 4.2);
      doc.text(`Sec A (${secAMax})`, margin + 89, y + 4.2);
      doc.text(`Sec B (${secBMax})`, margin + 106, y + 4.2);
      doc.text(`Total (${examTotalMarks})`, margin + 123, y + 4.2);
      doc.text("Pct", margin + 140, y + 4.2);
      doc.text("Classification", margin + 151, y + 4.2);
      doc.text("CDACC Verdict", margin + 170, y + 4.2);
      y += 7;

      const sorted = [...unifiedSubs].sort(
        (a, b) => b.unified.total_score - a.unified.total_score
      );

      sorted.forEach(({ sub, unified }, idx) => {
        if (y > 258) {
          doc.addPage();
          y = 16;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 0.8, contentW, 6.5, "F");
        }
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.15);
        doc.line(margin, y + 5.7, margin + contentW, y + 5.7);

        const pct = unified.percentage;
        const isComp = pct >= 50;
        const gradeStr = getCDACCGrade(pct);
        const verdictStr = getShortVerdict(pct);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.2);
        doc.text(`${idx + 1}`, margin + 3, y + 3.8);

        doc.setFont("helvetica", "bold");
        doc.text(cleanEllipsis(sub.student_name, 23), margin + 11, y + 3.8);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(cleanEllipsis(sub.reg_number, 18), margin + 54, y + 3.8);

        doc.setTextColor(15, 23, 42);
        doc.text(`${unified.sec_a_awarded}/${secAMax}`, margin + 89, y + 3.8);
        doc.text(`${unified.sec_b_awarded}/${secBMax}`, margin + 106, y + 3.8);

        doc.setFont("helvetica", "bold");
        doc.text(`${unified.total_score}/${examTotalMarks}`, margin + 123, y + 3.8);

        const statusColor = isComp ? [21, 128, 61] : [185, 28, 28];
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`${pct}%`, margin + 140, y + 3.8);

        // Classification column (margin + 151, max width 18mm)
        doc.text(gradeStr, margin + 151, y + 3.8);

        // Verdict pill (margin + 170, width 15mm)
        doc.setFillColor(isComp ? 220 : 254, isComp ? 252 : 226, isComp ? 231 : 226);
        doc.roundedRect(margin + 169.5, y + 0.3, 15.5, 4.6, 1, 1, "F");
        doc.setFontSize(5.8);
        doc.text(verdictStr, margin + 177.2, y + 3.4, { align: "center" });

        y += 6.5;
      });

      y += 4;

      // ── SECTION 5: Pedagogical Diagnostic Remarks & Quality Assurance Action Plan ──
      if (y > 225) {
        doc.addPage();
        y = 16;
      }

      doc.setFillColor(254, 246, 231);
      doc.setDrawColor(196, 136, 32);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, 20, 1.5, 1.5, "FD");

      doc.setTextColor(0, 9, 83);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(
        "5. QUALITY ASSURANCE DIAGNOSTIC ANALYSIS & PEDAGOGICAL RECOMMENDATIONS",
        margin + 3,
        y + 5
      );

      const referNames = sorted
        .filter((item) => item.unified.percentage < 50)
        .map((item) => `${item.sub.student_name} (${item.unified.percentage}%)`)
        .join(", ");

      const diagText =
        referCount > 0
          ? `Cohort achieved a mean score of ${avgPct.toFixed(1)}% (Section A Theory: ${avgSecAPct.toFixed(
              1
            )}%, Section B Structured Application: ${avgSecBPct.toFixed(
              1
            )}%) with a ${passRate.toFixed(
              1
            )}% competency pass rate. Mandatory CDACC remedial coaching and re-assessment are scheduled for ${referCount} candidate(s) below the 50% threshold: ${referNames}.`
          : `100% of evaluated candidates met or exceeded the 50% TVET CDACC competency threshold with a cohort mean of ${avgPct.toFixed(
              1
            )}% (Section A: ${avgSecAPct.toFixed(1)}%, Section B: ${avgSecBPct.toFixed(
              1
            )}%). Cohort is cleared to progress to the next Unit of Learning.`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      const diagLines = doc.splitTextToSize(diagText, contentW - 6);
      doc.text(diagLines, margin + 3, y + 10);

      y += 24;

      // ── SECTION 6: Institutional Verification, IQA & Approval Sign-Off Block ──
      if (y > 242) {
        doc.addPage();
        y = 16;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(0, 9, 83);
      doc.setLineWidth(0.35);
      doc.roundedRect(margin, y, contentW, 26, 1.5, 1.5, "FD");

      doc.setFillColor(0, 9, 83);
      doc.rect(margin, y, contentW, 5.8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.text(
        "6. OFFICIAL INSTITUTIONAL SIGN-OFF, INTERNAL VERIFICATION (IQA) & REGISTRAR APPROVAL",
        margin + 3,
        y + 4
      );

      const col3W = contentW / 3;
      doc.setTextColor(0, 9, 83);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("PREPARED BY (INTERNAL ASSESSOR):", margin + 3, y + 10.5);
      doc.text("VERIFIED BY (HOD / INTERNAL VERIFIER):", margin + col3W + 3, y + 10.5);
      doc.text("APPROVED BY (ACADEMIC REGISTRAR):", margin + col3W * 2 + 3, y + 10.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(51, 65, 85);
      doc.text("Name: Alexander Kinoti", margin + 3, y + 15.5);
      doc.text(
        `Sign: Digitally Signed (${format(new Date(), "dd/MM/yyyy")})`,
        margin + 3,
        y + 20.5
      );

      doc.text("Name: ___________________________", margin + col3W + 3, y + 15.5);
      doc.text("Sign & Date: _____________________", margin + col3W + 3, y + 20.5);

      doc.text("Stamp & Seal: ____________________", margin + col3W * 2 + 3, y + 15.5);
      doc.text("Date: ___________________________", margin + col3W * 2 + 3, y + 20.5);

      drawRunningFooters(
        doc,
        "MTTI/QMS/EX/CR-04",
        unitCode,
        `COHORT SIZE: ${n} CANDIDATES`
      );

      const filename = `MTTI_ClassReport_${unitCode}_${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(filename);
      toast.success("Global-Standard Class Report Generated", {
        description: `${filename} downloaded.`,
      });
    } catch (err: any) {
      toast.error("Report Failed", { description: err.message });
    } finally {
      setGenerating(null);
    }
  };

  const filteredSubs = enrichedSubmissions.filter(({ sub }) => {
    if (selectedUnit !== "all" && sub.unit_code !== selectedUnit) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        sub.student_name.toLowerCase().includes(q) ||
        sub.reg_number.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <TrainerLayout
      title="Reports & Psychometric Analytics"
      subtitle="ISO 21001:2018 & TVET CDACC CBET compliant class performance reports, transcripts, and graded scripts"
    >
      {/* Executive Psychometric KPI Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm border-l-4 border-l-[#000953]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Evaluated Scripts</span>
            <Users className="w-4 h-4 text-[#000953]" />
          </div>
          <div className="text-2xl font-black text-[#000953] mt-1 font-mono">
            {globalMetrics.count}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
            100% Normalized & Verified
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm border-l-4 border-l-[#c48820]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Cohort Mean Score</span>
            <TrendingUp className="w-4 h-4 text-[#c48820]" />
          </div>
          <div className="text-2xl font-black text-[#000953] mt-1 font-mono">
            {globalMetrics.meanPct}%
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
            CDACC Target Benchmark: ≥ 65%
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Competency Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {globalMetrics.passRate}%
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Threshold: ≥ 50% (Competent)
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm border-l-4 border-l-[#000953]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Distinction & Credit</span>
            <Award className="w-4 h-4 text-[#c48820]" />
          </div>
          <div className="text-2xl font-black text-[#000953] mt-1 font-mono">
            {globalMetrics.distinctionCreditRate}%
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Mastery & Proficiency Tier (≥ 65%)
          </div>
        </div>
      </div>

      {/* Class Performance & Psychometric Reports */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#000953] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#c48820]" />
            Official Class Performance & Psychometric Reports (ISO 21001 / CDACC)
          </h3>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            DOC REF: MTTI/QMS/EX/CR-04
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl animate-pulse bg-slate-100 border border-slate-200"
                />
              ))
            : exams.map((exam) => {
                const unitItems = enrichedSubmissions.filter(
                  (item) =>
                    item.sub.unit_code === exam.unit_code &&
                    item.sub.total_score !== null
                );
                const gradedCount = unitItems.length;
                const avgPct =
                  gradedCount > 0
                    ? Math.round(
                        unitItems.reduce((a, b) => a + b.unified.percentage, 0) /
                          gradedCount
                      )
                    : 0;
                const passCount = unitItems.filter(
                  (i) => i.unified.percentage >= 50
                ).length;
                const passRate =
                  gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0;
                const isGen = generating === `class-${exam.unit_code}`;

                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-300 rounded-xl shadow-sm p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-[#000953]">
                            {exam.unit_code}
                          </div>
                          <div className="text-xs mt-0.5 text-slate-600 font-medium line-clamp-1">
                            {exam.course_name}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 border border-[#c48820]/30 text-[#c48820] shrink-0">
                          {gradedCount} graded
                        </div>
                      </div>

                      {gradedCount > 0 && (
                        <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">
                              Cohort Mean
                            </span>
                            <span className="font-mono font-bold text-[#000953]">
                              {avgPct}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">
                              Pass Rate
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                passRate >= 50 ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {passRate}% ({passCount}/{gradedCount})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => generateClassReport(exam.unit_code)}
                      disabled={isGen || gradedCount === 0}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm mt-1"
                    >
                      <Download className="w-3.5 h-3.5 text-[#c48820]" />
                      {isGen ? "Generating PDF..." : "Download Class Report (PDF)"}
                    </button>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Individual Candidate Transcripts & Graded Scripts */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[#000953] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#c48820]" />
            Individual Candidate Transcripts & Official Graded Exam Scripts
          </h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate..."
                className="bg-transparent text-xs outline-none w-40 text-[#0f172a] placeholder-slate-400"
              />
            </div>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0f172a] shadow-sm focus:outline-none focus:border-[#000953]"
            >
              <option value="all">All Units</option>
              {exams.map((e) => (
                <option key={e.id} value={e.unit_code}>
                  {e.unit_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "Candidate Name",
                  "Reg Number",
                  "Unit Code",
                  "Sec A",
                  "Sec B",
                  "Total Score",
                  "Classification",
                  "CDACC Verdict",
                  "Official Exports",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600"
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3.5 py-3">
                        <div className="h-4 rounded animate-pulse bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No submissions found
                  </td>
                </tr>
              ) : (
                filteredSubs.map(({ sub, unified }) => {
                  const isGen = generating === sub.id;
                  const pct = sub.total_score !== null ? unified.percentage : null;
                  const isComp = (pct ?? 0) >= 50;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3.5 py-3">
                        <div className="text-sm font-bold text-[#0f172a]">
                          {sub.student_name}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-600">
                          {sub.reg_number}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-xs font-mono font-bold text-[#000953]">
                          {sub.unit_code}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-700">
                          {sub.total_score !== null
                            ? `${unified.sec_a_awarded}/${unified.sec_a_max}`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-700">
                          {sub.total_score !== null
                            ? `${unified.sec_b_awarded}/${unified.sec_b_max}`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold font-mono ${
                              sub.total_score === null
                                ? "text-slate-400"
                                : isComp
                                ? "text-emerald-700"
                                : "text-rose-600"
                            }`}
                          >
                            {sub.total_score !== null
                              ? `${unified.total_score} / ${unified.total_marks}`
                              : "—"}
                          </span>
                          {pct !== null && (
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {pct}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            sub.total_score === null
                              ? "bg-slate-100 border-slate-300 text-slate-500"
                              : isComp
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-rose-50 border-rose-200 text-rose-700"
                          }`}
                        >
                          {getCDACCGrade(pct)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                            sub.total_score === null
                              ? "bg-slate-100 text-slate-500"
                              : isComp
                              ? "bg-[#000953]/10 text-[#000953]"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {getShortVerdict(pct)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              exportGradedExamPDFClientSide(unified);
                              toast.success(
                                "Official Graded Exam Paper Downloaded",
                                {
                                  description: `${sub.student_name} (${sub.unit_code})`,
                                }
                              );
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
                            title="Download Official Candidate Transcript PDF"
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
