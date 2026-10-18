import jsPDF from "jspdf";
import type { Exam, Submission } from "@/lib/supabase";

export function formatMarkingSchemeItem(item: unknown): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    const record = item as Record<string, unknown>;
    return String(
      record.point ||
      record.criterion ||
      record.text ||
      record.description ||
      record.expectedAnswer ||
      JSON.stringify(item)
    );
  }
  return String(item);
}

export function formatMarkingSchemeList(items: unknown[]): string {
  if (!Array.isArray(items) || items.length === 0) return "Not specified";
  return items.map(formatMarkingSchemeItem).filter(Boolean).join(" | ");
}

export interface UnifiedGradedQuestion {
  question_id: string;
  q_num: number | string;
  type: "mcq" | "tf" | "short" | "essay" | "practical" | string;
  text: string;
  options?: string[];
  selected_option_index?: number;
  correct_option_index?: number;
  raw_answer: string | number;
  formatted_answer: string;
  formatted_correct_answer?: string;
  sub_parts?: any[];
  breakdown?: any[];
  rubric?: string;
  critical_aspect?: string;
  max_marks: number;
  marks_awarded: number;
  ai_reasoning: string;
}

export interface UnifiedGradedExamData {
  student_name: string;
  reg_number: string;
  institution: string;
  department: string;
  exam_header: string;
  exam_title: string;
  course_name: string;
  course_code: string;
  unit_name: string;
  unit_code: string;
  class_code: string;
  series: string;
  time_allowed: string;
  task_code: string;
  evaluated_at: string;
  is_cat?: boolean;
  instructions: string[];
  section_a_instructions: string;
  section_b_instructions: string;
  section_a: UnifiedGradedQuestion[];
  section_b: UnifiedGradedQuestion[];
  sec_a_awarded: number;
  sec_a_max: number;
  sec_b_awarded: number;
  sec_b_max: number;
  total_score: number;
  total_marks: number;
  percentage: number;
  is_pass: boolean;
  grade: string;
  status_label: string;
  trainer_comments: string;
  trainer_name: string;
}

export function buildUnifiedGradedExamData(
  submission: Submission,
  exam?: Exam | null,
  trainerName: string = "Alexander Kinoti",
  editingNotes: Record<string, string> = {}
): UnifiedGradedExamData {
  const examSecA: any[] = exam?.payload?.section_a?.questions || [];
  const examSecB: any[] = exam?.payload?.section_b?.questions || [];
  const subSecA = submission.section_a || [];
  const subSecB = submission.section_b || [];

  const usedSubAIndices = new Set<number>();
  const unifiedSecA: UnifiedGradedQuestion[] = [];

  const buildQuestionItem = (
    q: any,
    ans: any,
    idx: number,
    defaultMaxMarks: number,
    defaultQNum: number | string
  ): UnifiedGradedQuestion => {
    const qId = String(q?.id ?? ans?.question_id ?? `q_${idx + 1}`);
    const qType = q?.type || (Array.isArray(q?.options) ? "mcq" : "short");
    const options: string[] | undefined = Array.isArray(q?.options) ? q.options : undefined;
    const rawAns = ans?.answer ?? "";
    const rawStr = String(rawAns).trim();

    let selectedOptIdx: number | undefined = undefined;
    if (qType === "mcq" && options) {
      if (rawStr !== "" && !isNaN(Number(rawStr))) {
        const parsed = Number(rawStr);
        if (parsed >= 0 && parsed < options.length) {
          selectedOptIdx = parsed;
        }
      } else if (rawStr !== "") {
        const byLetter = rawStr.match(/^(?:Option\s*)?([A-D])(?:\s*[:.)]|$)/i);
        if (byLetter) {
          selectedOptIdx = byLetter[1].toUpperCase().charCodeAt(0) - 65;
        } else {
          const matchIdx = options.findIndex(
            (o) => o.trim().toLowerCase() === rawStr.toLowerCase()
          );
          if (matchIdx >= 0) selectedOptIdx = matchIdx;
        }
      }
    }

    let correctOptIdx: number | undefined = undefined;
    if (qType === "mcq" && options && q?.correct_answer !== undefined) {
      const caStr = String(q.correct_answer).trim();
      if (caStr !== "" && !isNaN(Number(caStr))) {
        const parsed = Number(caStr);
        if (parsed >= 0 && parsed < options.length) {
          correctOptIdx = parsed;
        }
      } else {
        const matchIdx = options.findIndex(
          (o) => o.trim().toLowerCase() === caStr.toLowerCase()
        );
        if (matchIdx >= 0) correctOptIdx = matchIdx;
      }
    }

    let formattedAnswer = rawStr;
    if (qType === "mcq" && options && selectedOptIdx !== undefined && options[selectedOptIdx] !== undefined) {
      formattedAnswer = `Option ${String.fromCharCode(65 + selectedOptIdx)}: ${options[selectedOptIdx]}`;
    }

    let formattedCorrectAnswer: string | undefined = undefined;
    if (qType === "mcq" && options && correctOptIdx !== undefined && options[correctOptIdx] !== undefined) {
      formattedCorrectAnswer = `Option ${String.fromCharCode(65 + correctOptIdx)}: ${options[correctOptIdx]}`;
    } else if (q?.correct_answer !== undefined && String(q.correct_answer).trim() !== "") {
      formattedCorrectAnswer = String(q.correct_answer).trim();
    }

    const maxMarks = Math.max(1, Math.round(Number(q?.marks ?? defaultMaxMarks)));
    const rawAwarded = ans?.marks_awarded !== undefined ? Math.round(Number(ans.marks_awarded)) : 0;
    const marksAwarded = Math.min(maxMarks, Math.max(0, rawAwarded));

    const qNum = q?.q_num ?? defaultQNum;
    let cleanText = (q?.text || `Question ${qNum}`).trim();

    // Prevent double numbering: strip leading "11.", "Q11.", "11)", "Task 11."
    const numPrefixRegex = new RegExp(`^(?:Q(?:uestion)?\\s*|Task\\s*)?${qNum}[\\.:\\)\\-\\s]+`, "i");
    cleanText = cleanText.replace(numPrefixRegex, "").trim();

    // Prevent duplicate printing of sub-questions in Section B
    const subParts = Array.isArray(q?.sub_parts) ? q.sub_parts : undefined;
    if (subParts && subParts.length > 0) {
      const subPartMatch = cleanText.search(/(?:^|\n)\s*(?:\([a-dA-D]\)|[a-dA-D]\))/i);
      if (subPartMatch !== -1) {
        const preamble = cleanText.slice(0, subPartMatch).trim();
        if (preamble) {
          cleanText = preamble;
        } else if (q?.critical_aspect) {
          cleanText = `Structured Assessment Task: ${q.critical_aspect}`;
        } else {
          cleanText = "Answer all structured sub-questions below:";
        }
      }
    }

    // Format sub-parts cleanly
    let formattedSubParts: any[] | undefined = undefined;
    if (subParts && subParts.length > 0) {
      formattedSubParts = subParts.map((sp: any) => {
        if (typeof sp === "string") return sp;
        const partLabel = sp?.part ? `${sp.part}) ` : sp?.label ? `${sp.label}) ` : "";
        const promptText = sp?.prompt || sp?.text || "";
        const marksText = sp?.marks ? ` (${sp.marks} ${sp.marks === 1 ? "Mark" : "Marks"})` : "";
        return `${partLabel}${promptText}${marksText}`.trim();
      });
    }

    // Format breakdown cleanly using formatMarkingSchemeItem
    let formattedBreakdown: string[] | undefined = undefined;
    if (Array.isArray(q?.breakdown) && q.breakdown.length > 0) {
      formattedBreakdown = q.breakdown.map(formatMarkingSchemeItem).filter(Boolean);
    } else if (subParts && subParts.length > 0) {
      const collected: string[] = [];
      subParts.forEach((sp: any) => {
        if (Array.isArray(sp?.breakdown)) {
          sp.breakdown.forEach((b: any) => {
            const formatted = formatMarkingSchemeItem(b);
            if (formatted) {
              const partPrefix = sp?.part ? `${sp.part}) ` : "";
              collected.push(`${partPrefix}${formatted}`);
            }
          });
        }
      });
      if (collected.length > 0) {
        formattedBreakdown = collected;
      }
    }

    return {
      question_id: qId,
      q_num: qNum,
      type: qType,
      text: cleanText,
      options,
      selected_option_index: selectedOptIdx,
      correct_option_index: correctOptIdx,
      raw_answer: rawAns,
      formatted_answer: formattedAnswer,
      formatted_correct_answer: formattedCorrectAnswer,
      sub_parts: formattedSubParts,
      breakdown: formattedBreakdown,
      rubric: q?.rubric,
      critical_aspect: q?.critical_aspect,
      max_marks: maxMarks,
      marks_awarded: marksAwarded,
      ai_reasoning: editingNotes[qId] || ans?.ai_reasoning || "",
    };
  };

  if (examSecA.length > 0) {
    examSecA.forEach((q, idx) => {
      let matchIdx = subSecA.findIndex(
        (a, sIdx) => !usedSubAIndices.has(sIdx) && String(a.question_id) === String(q.id)
      );
      if (matchIdx === -1 && idx < subSecA.length && !usedSubAIndices.has(idx)) {
        matchIdx = idx;
      }
      if (matchIdx !== -1) usedSubAIndices.add(matchIdx);
      const ans = matchIdx !== -1 ? subSecA[matchIdx] : undefined;
      unifiedSecA.push(buildQuestionItem(q, ans, idx, q?.marks ?? 2, q?.q_num ?? idx + 1));
    });
  } else {
    subSecA.forEach((ans, idx) => {
      unifiedSecA.push(buildQuestionItem(null, ans, idx, 2, idx + 1));
    });
  }

  const usedSubBIndices = new Set<number>();
  const unifiedSecB: UnifiedGradedQuestion[] = [];

  if (examSecB.length > 0) {
    examSecB.forEach((q, idx) => {
      let matchIdx = subSecB.findIndex(
        (b, sIdx) => !usedSubBIndices.has(sIdx) && String(b.question_id) === String(q.id)
      );
      if (matchIdx === -1 && idx < subSecB.length && !usedSubBIndices.has(idx)) {
        matchIdx = idx;
      }
      if (matchIdx !== -1) usedSubBIndices.add(matchIdx);
      const ans = matchIdx !== -1 ? subSecB[matchIdx] : undefined;
      const defaultQNum = q?.q_num ?? unifiedSecA.length + idx + 1;
      unifiedSecB.push(buildQuestionItem(q, ans, idx, q?.marks ?? 20, defaultQNum));
    });
  } else {
    subSecB.forEach((ans, idx) => {
      unifiedSecB.push(buildQuestionItem(null, ans, idx, 20, unifiedSecA.length + idx + 1));
    });
  }

  const rawSecAMax = unifiedSecA.reduce((acc, q) => acc + q.max_marks, 0);
  const secAMax = exam?.payload?.section_a?.total_marks ?? (rawSecAMax > 0 ? rawSecAMax : 30);
  let secAAwarded = Math.min(
    secAMax,
    Math.round(unifiedSecA.reduce((acc, q) => acc + q.marks_awarded, 0))
  );

  const rawSecBMax = unifiedSecB.reduce((acc, q) => acc + q.max_marks, 0);
  const secBMax = exam?.payload?.section_b?.total_marks ?? (rawSecBMax > 0 ? rawSecBMax : 40);
  let secBAwarded = Math.min(
    secBMax,
    Math.round(unifiedSecB.reduce((acc, q) => acc + q.marks_awarded, 0))
  );

  const computedMaxMarks = secAMax + secBMax;
  const totalMarks = exam?.payload?.total_marks ?? (computedMaxMarks > 0 ? computedMaxMarks : 70);
  const rawTotal =
    submission.total_score !== null && submission.total_score !== undefined
      ? Math.round(submission.total_score)
      : secAAwarded + secBAwarded;

  let totalScore = rawTotal;
  if (totalScore > totalMarks && totalMarks > 0) {
    if (secAAwarded + secBAwarded > 0 && secAAwarded + secBAwarded <= totalMarks) {
      totalScore = secAAwarded + secBAwarded;
    } else if (totalScore <= 100) {
      totalScore = Math.round((totalScore / 100) * totalMarks);
    } else {
      totalScore = totalMarks;
    }
  }
  totalScore = Math.min(totalMarks, Math.max(0, totalScore));

  // Reconcile secAAwarded + secBAwarded so they always sum to totalScore
  if (totalScore > 0 && secAAwarded + secBAwarded !== totalScore && totalMarks > 0) {
    const targetSecA = Math.min(secAMax, Math.round((secAMax / totalMarks) * totalScore));
    const targetSecB = Math.min(secBMax, Math.max(0, totalScore - targetSecA));
    secAAwarded = totalScore - targetSecB;
    secBAwarded = targetSecB;
  }

  const percentage = totalMarks > 0 ? Math.min(100, Math.round((totalScore / totalMarks) * 100)) : 0;
  const isPass = percentage >= 50;

  // Resolve cohort-specific institutional metadata
  const regUpper = (submission.reg_number || "").toUpperCase();
  const nameUpper = (submission.student_name || "").toUpperCase();
  const isFBS =
    submission.id?.includes("fbs") ||
    regUpper.includes("FBS") ||
    regUpper.includes("FBP") ||
    exam?.payload?.class?.includes("FBS") ||
    [
      "13254", "13263", "13281", "13297", "13304", "13313", "13343", "13355", "13378", "13396",
      "13445", "13446", "13463", "13482", "13488", "13546", "13551", "13559", "13571", "13583",
      "13258", "12265", "13231", "13251", "13314", "13403", "13430", "13487", "13495"
    ].includes(submission.reg_number?.trim());

  const isLS =
    submission.id?.includes("ls") ||
    regUpper.includes("LS") ||
    [
      "14009", "14024", "14032", "14092", "14120", "14348", "14403", "14428", "14502",
      "14001", "14011", "14066", "14183", "14256", "14283", "14331", "14332", "14351", "14451"
    ].includes(submission.reg_number?.trim());

  let resolvedDept = (exam?.payload as any)?.department || "DEPARTMENT OF COMPUTING & INFORMATICS";
  let resolvedCourse = exam?.course_name || "PERFORM COMPUTER ESSENTIALS";
  let resolvedClass = (exam?.payload as any)?.class || "ICT4/ITECH6/S/26 MOD 1";
  let resolvedUnitName = (exam?.payload as any)?.unit_name || exam?.course_name || submission.unit_code;

  if (isFBS) {
    resolvedDept = "HOSPITALITY & INSTITUTIONAL MANAGEMENT DEPARTMENT";
    resolvedCourse = "FOOD AND BEVERAGE SALES AND SERVICE MANAGEMENT LEVEL 5 & 6";
    resolvedClass = "FBS5/6/J/26";
    resolvedUnitName = "APPLY DIGITAL LITERACY";
  } else if (isLS) {
    resolvedDept = "BUILDING & CIVIL ENGINEERING DEPARTMENT";
    resolvedCourse = "LAND SURVEY LEVEL 5 & 6";
    resolvedClass = "LS5/6/S/26";
    resolvedUnitName = "APPLY DIGITAL LITERACY";
  }

  return {
    student_name: submission.student_name,
    reg_number: submission.reg_number,
    institution: (exam?.payload as any)?.institution || "MUKIRIA TECHNICAL TRAINING INSTITUTE",
    department: resolvedDept,
    exam_header: (exam?.payload as any)?.exam_header || "INTERNAL EXAMINATION",
    exam_title: exam?.payload?.title || "WRITTEN ASSESSMENT 1",
    course_name: resolvedCourse,
    course_code: (exam?.payload as any)?.course_code || submission.unit_code,
    unit_name: resolvedUnitName,
    unit_code: submission.unit_code,
    class_code: resolvedClass,
    series: (exam?.payload as any)?.series || "SEP - NOV 2026",
    time_allowed:
      (exam?.payload as any)?.time_allowed ||
      `${exam?.payload?.duration_minutes || 120} MINUTES`,
    task_code: submission.task_code || (exam?.payload as any)?.task_code || "CT1",
    evaluated_at: new Date(submission.updated_at || submission.submitted_at || Date.now()).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "long", year: "numeric" }
    ),
    is_cat:
      totalMarks <= 30 ||
      (exam?.payload as any)?.assessment_category === "CAT" ||
      (submission.task_code || (exam?.payload as any)?.task_code || "").toUpperCase().startsWith("CAT") ||
      (secBMax === 0 && unifiedSecB.length === 0),
    instructions: Array.isArray((exam?.payload as any)?.instructions)
      ? (exam?.payload as any).instructions
      : totalMarks <= 30 ||
        (exam?.payload as any)?.assessment_category === "CAT" ||
        (submission.task_code || (exam?.payload as any)?.task_code || "").toUpperCase().startsWith("CAT") ||
        (secBMax === 0 && unifiedSecB.length === 0)
      ? [
          "Confirm that this continuous assessment test contains the correct unit title and code before beginning.",
          "Answer ALL questions in the spaces provided.",
          "Marks for each question or sub-question are indicated in brackets ( ).",
        ]
      : [
          "Confirm that this paper contains the correct unit title and code before beginning.",
          "Answer ALL questions in Section A and Section B in the spaces provided.",
          "Marks for each question or sub-question are indicated in brackets ( ).",
        ],
    section_a_instructions:
      exam?.payload?.section_a?.instructions ||
      (totalMarks <= 30 ||
      (exam?.payload as any)?.assessment_category === "CAT" ||
      (submission.task_code || (exam?.payload as any)?.task_code || "").toUpperCase().startsWith("CAT") ||
      (secBMax === 0 && unifiedSecB.length === 0)
        ? `Answer ALL questions in this continuous assessment test (${totalMarks} Marks).`
        : `Answer ALL questions in this section (${secAMax} Marks).`),
    section_b_instructions:
      exam?.payload?.section_b?.instructions ||
      `Answer ALL structured/practical questions in this section (${secBMax} Marks).`,
    section_a: unifiedSecA,
    section_b: unifiedSecB,
    sec_a_awarded: secAAwarded,
    sec_a_max: secAMax,
    sec_b_awarded: secBAwarded,
    sec_b_max: secBMax,
    total_score: totalScore,
    total_marks: totalMarks,
    percentage,
    is_pass: isPass,
    grade: isPass ? "Pass" : "Referral",
    status_label: isPass ? "COMPETENT (PASS)" : "NOT YET COMPETENT (REFER)",
    trainer_comments:
      submission.trainer_comments ||
      "The candidate demonstrates solid competency across the assessed learning outcomes and practical workplace procedures.",
    trainer_name: trainerName,
  };
}

export const exportGradedExamPdf = exportGradedExamPDFClientSide;

export function exportGradedExamPDFClientSide(
  data: UnifiedGradedExamData,
  customDoc?: jsPDF
): jsPDF {
  const doc = customDoc || new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 16;
    }
  };

  // 1. Official MTTI Institutional Navy Header Banner (#000953 -> RGB 0, 9, 83)
  doc.setFillColor(0, 9, 83);
  doc.rect(0, 0, pageWidth, 36, "F");
  // Accent Gold Bar (#c48820 -> RGB 196, 136, 32)
  doc.setFillColor(196, 136, 32);
  doc.rect(0, 36, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.institution.toUpperCase(), margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const deptClean = data.department.replace(/\n/g, " / ").toUpperCase();
  doc.text(deptClean, margin, 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(254, 246, 231);
  doc.text(
    `${data.exam_header.toUpperCase()} — ${data.exam_title.toUpperCase()} (GRADED SCRIPT)`,
    margin,
    25
  );

  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `TIME ALLOWED: ${data.time_allowed}   |   TOTAL MARKS: ${data.total_marks}   |   TASK SLOT: ${data.task_code}`,
    margin,
    31.5
  );

  // Red Pen Score Stamp on Header Right
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.7);
  doc.roundedRect(pageWidth - margin - 46, 6, 46, 25, 2, 2, "FD");
  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("OFFICIAL EXAMINATION SCORE", pageWidth - margin - 23, 11, { align: "center" });
  doc.setFontSize(14);
  doc.text(`${data.total_score} / ${data.total_marks}`, pageWidth - margin - 23, 18.5, { align: "center" });
  doc.setFontSize(8.5);
  doc.text(`${data.percentage}% — ${data.is_pass ? "PASS" : "REFER"}`, pageWidth - margin - 23, 24, {
    align: "center",
  });
  doc.setFontSize(6.5);
  doc.text("VERIFIED EVALUATION RECORD", pageWidth - margin - 23, 28.5, { align: "center" });

  y = 43;

  // 2. Official Exam & Candidate Metadata Grid (Same structure as Trainee Exam Cover)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, "FD");

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const leftColX = margin + 3;
  const rightColX = margin + contentWidth / 2 + 2;

  const drawMetaRow = (x: number, rowY: number, label: string, val: string, maxW: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const labelW = doc.getTextWidth(label) + 2;
    const availW = Math.max(20, maxW - labelW);
    const splitLines = doc.splitTextToSize(val || "—", availW);
    doc.text(splitLines[0] || "—", x + labelW, rowY);
  };

  const colW = contentWidth / 2 - 5;
  drawMetaRow(leftColX, y + 6, "CANDIDATE NAME:", data.student_name, colW);
  drawMetaRow(rightColX, y + 6, "REGISTRATION NO:", data.reg_number, colW);
  drawMetaRow(leftColX, y + 12, "COURSE NAME:", data.course_name, colW);
  drawMetaRow(rightColX, y + 12, "UNIT CODE:", data.unit_code, colW);
  drawMetaRow(leftColX, y + 18, "UNIT NAME:", data.unit_name, colW);
  drawMetaRow(rightColX, y + 18, "CLASS & SERIES:", `${data.class_code} (${data.series})`, colW);
  const hasSectionB = Array.isArray(data.section_b) && data.section_b.length > 0;
  const isSingleSection = !hasSectionB;

  if (isSingleSection) {
    drawMetaRow(
      leftColX,
      y + 24,
      "TOTAL SCORE:",
      `${data.total_score} / ${data.total_marks}  (${data.percentage}%)`,
      colW
    );
  } else {
    drawMetaRow(
      leftColX,
      y + 24,
      "SECTION A & B:",
      `Sec A: ${data.sec_a_awarded}/${data.sec_a_max}  |  Sec B: ${data.sec_b_awarded}/${data.sec_b_max}`,
      colW
    );
  }
  drawMetaRow(rightColX, y + 24, "COMPETENCY STATUS:", data.status_label, colW);

  y += 34;

  // 3. Instructions to Candidate Box (Matches Trainee Exam Paper)
  const instLines: string[] = [];
  data.instructions.forEach((inst, idx) => {
    const wrapped = doc.splitTextToSize(`${idx + 1}. ${inst}`, contentWidth - 8);
    instLines.push(...wrapped);
  });
  const instBoxH = 8 + instLines.length * 4;
  ensureSpace(instBoxH + 4);
  doc.setFillColor(254, 246, 231);
  doc.setDrawColor(196, 136, 32);
  doc.roundedRect(margin, y, contentWidth, instBoxH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 9, 83);
  doc.text("INSTRUCTIONS TO CANDIDATE (OFFICIAL EXAM PAPER FORMAT):", margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  instLines.forEach((line, i) => {
    doc.text(line, margin + 4, y + 9.5 + i * 4);
  });
  y += instBoxH + 5;

  // Helper to render a section of questions
  const renderSection = (
    sectionTitle: string,
    sectionInstructions: string,
    subtotalText: string,
    questions: UnifiedGradedQuestion[],
    isSectionB: boolean
  ) => {
    if (questions.length === 0) return;
    ensureSpace(42);

    // Section Banner
    doc.setFillColor(0, 9, 83);
    doc.rect(margin, y, contentWidth, 7.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(sectionTitle, margin + 3, y + 5.2);
    doc.setTextColor(254, 246, 231);
    doc.text(subtotalText, pageWidth - margin - 3, y + 5.2, { align: "right" });
    y += 9.5;

    if (sectionInstructions) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const secInstWrapped = doc.splitTextToSize(sectionInstructions, contentWidth);
      secInstWrapped.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 4;
      });
      y += 1.5;
    }

    questions.forEach((q, idx) => {
      const qPrefix = isSectionB && String(q.q_num).toLowerCase().startsWith("task")
        ? `${q.q_num}.`
        : `Q${q.q_num || idx + 1}.`;

      let promptTitle = (q.text || "").trim();
      const numPrefixRegex = new RegExp(`^(?:Q(?:uestion)?\\s*|Task\\s*)?${q.q_num}[\\.:\\)\\-\\s]+`, "i");
      promptTitle = promptTitle.replace(numPrefixRegex, "").trim();

      // 1. Question Prompt (Set font before splitTextToSize for exact line calculation)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const marksSuffix = `(${q.max_marks}\u00A0${q.max_marks === 1 ? "Mark" : "Marks"})`;
      const promptLines = doc.splitTextToSize(
        `${qPrefix} ${promptTitle} ${marksSuffix}`,
        contentWidth - 28
      );

      // 2. Sub-parts (Render once cleanly without duplicating question prompt)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const subPartLines: string[] = [];
      if (q.sub_parts && q.sub_parts.length > 0) {
        q.sub_parts.forEach((sp: any) => {
          const spText = typeof sp === "string" ? sp : `${sp?.part ? `${sp.part}) ` : sp?.label ? `${sp.label}) ` : ""}${sp?.prompt || sp?.text || ""}${sp?.marks ? ` (${sp.marks} Marks)` : ""}`;
          const wrappedSp = doc.splitTextToSize(`   ${spText}`, contentWidth - 12);
          subPartLines.push(...wrappedSp);
        });
      }

      // 3. MCQ Options
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const optionLines: { text: string; isSelected: boolean; isCorrect: boolean }[] = [];
      if (q.type === "mcq" && q.options && q.options.length > 0) {
        q.options.forEach((opt, oIdx) => {
          const isSelected = q.selected_option_index === oIdx;
          const isCorrect = q.correct_option_index === oIdx;
          const letter = String.fromCharCode(65 + oIdx);
          let suffix = "";
          if (isSelected && isCorrect) suffix = "  [CANDIDATE CHOICE — CORRECT]";
          else if (isSelected && !isCorrect) suffix = "  [CANDIDATE CHOICE — INCORRECT]";
          else if (!isSelected && isCorrect) suffix = "  [CORRECT ANSWER KEY]";
          const wrappedOpt = doc.splitTextToSize(`(${letter}) ${opt}${suffix}`, contentWidth - 14);
          wrappedOpt.forEach((l: string) => {
            optionLines.push({ text: l, isSelected, isCorrect });
          });
        });
      }

      // 4. Candidate Response
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const isUnattempted =
        !q.formatted_answer ||
        q.formatted_answer.trim() === "" ||
        q.formatted_answer === "[No candidate response entered]";

      const ansLines =
        q.type === "mcq" && optionLines.length > 0
          ? []
          : doc.splitTextToSize(
              `Candidate Response: ${isUnattempted && isSectionB ? "[Not attempted — Optional Question]" : q.formatted_answer || "[No candidate response entered]"}`,
              contentWidth - 12
            );

      // 5. Official Marking Scheme / Breakdown (Normalized using formatMarkingSchemeList)
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      const breakdownLines: string[] = [];
      if (q.breakdown && q.breakdown.length > 0) {
        const bdJoined = `Marking Scheme: ${formatMarkingSchemeList(q.breakdown)}`;
        breakdownLines.push(...doc.splitTextToSize(bdJoined, contentWidth - 12));
      } else if (q.formatted_correct_answer && q.type !== "mcq") {
        breakdownLines.push(
          ...doc.splitTextToSize(`Expected Key: ${q.formatted_correct_answer}`, contentWidth - 12)
        );
      }

      // 6. Assessor Feedback & Marks Evaluation
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(8);

      let evalStatus = "";
      if (q.marks_awarded >= q.max_marks) {
        evalStatus = "Full Marks Awarded";
      } else if (q.marks_awarded > 0) {
        evalStatus = `Partial Credit (${q.marks_awarded}/${q.max_marks})`;
      } else if (isUnattempted && isSectionB) {
        evalStatus = "Optional Question — Not Attempted";
      } else {
        evalStatus = "Incorrect / Incomplete Response";
      }

      const evalDetail = q.ai_reasoning ? `${evalStatus} — ${q.ai_reasoning}` : evalStatus;
      const evalLines = doc.splitTextToSize(`Assessor Feedback: ${evalDetail}`, contentWidth - 12);

      // Dynamic card height calculation with generous padding to prevent cramped vertical flow
      const cardHeight =
        6 +
        promptLines.length * 4.4 +
        (subPartLines.length > 0 ? 2 + subPartLines.length * 4.0 : 0) +
        (optionLines.length > 0 ? 2 + optionLines.length * 4.2 : 0) +
        (ansLines.length > 0 ? 2 + ansLines.length * 4.2 : 0) +
        (breakdownLines.length > 0 ? 2 + breakdownLines.length * 3.8 : 0) +
        (evalLines.length > 0 ? 2 + evalLines.length * 4.0 : 0) +
        6;

      if (cardHeight <= (pageHeight - 34)) {
        ensureSpace(cardHeight);
      } else {
        ensureSpace(Math.min(cardHeight, 40));
      }

      // Question Prompt + Margin Score Badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      promptLines.forEach((line: string, lIdx: number) => {
        ensureSpace(5);
        doc.text(line, margin + 2, y + 4);
        if (lIdx === 0) {
          // Red Pen Margin Score Pill
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.4);
          doc.roundedRect(pageWidth - margin - 24, y + 0.5, 23, 5.5, 1.5, 1.5, "FD");
          const pillText = isUnattempted && isSectionB && q.marks_awarded === 0
            ? `— / ${q.max_marks}`
            : `${q.marks_awarded} / ${q.max_marks}`;
          doc.text(pillText, pageWidth - margin - 12.5, y + 4.3, {
            align: "center",
          });
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
        }
        y += 4.4;
      });

      // Sub-parts (a, b, c, d)
      if (subPartLines.length > 0) {
        y += 1.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        subPartLines.forEach((spLine) => {
          ensureSpace(4.5);
          doc.text(spLine, margin + 4, y + 3.5);
          y += 4.0;
        });
      }

      // MCQ Options (A, B, C, D)
      if (optionLines.length > 0) {
        y += 1.5;
        optionLines.forEach((optItem) => {
          ensureSpace(4.5);
          if (optItem.isSelected && optItem.isCorrect) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(21, 128, 61);
          } else if (optItem.isSelected && !optItem.isCorrect) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(220, 38, 38);
          } else if (optItem.isCorrect) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 9, 83);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
          }
          doc.setFontSize(8);
          doc.text(optItem.text, margin + 5, y + 3.5);
          y += 4.2;
        });
      }

      // Written Candidate Response Box
      if (ansLines.length > 0) {
        y += 1.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        ansLines.forEach((aLine: string) => {
          ensureSpace(4.5);
          doc.text(aLine, margin + 4, y + 3.5);
          y += 4.2;
        });
      }

      // Official Marking Scheme / Breakdown
      if (breakdownLines.length > 0) {
        y += 1.5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        breakdownLines.forEach((bLine: string) => {
          ensureSpace(4.2);
          doc.text(bLine, margin + 4, y + 3.2);
          y += 3.8;
        });
      }

      // Assessor Feedback Line (Semantically colored)
      y += 1.5;
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(8);
      if (q.marks_awarded >= q.max_marks && q.max_marks > 0) {
        doc.setTextColor(0, 9, 83); // MTTI Institutional Navy for full marks
      } else if (q.marks_awarded > 0) {
        doc.setTextColor(180, 83, 9); // Amber for partial credit
      } else {
        doc.setTextColor(220, 38, 38); // Red pen for zero marks
      }
      evalLines.forEach((eLine: string) => {
        ensureSpace(4.5);
        doc.text(eLine, margin + 4, y + 3.5);
        y += 4.0;
      });

      y += 2.5;
      // Subtle divider line below question
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;
    });

    y += 3;
  };

  if (!hasSectionB) {
    renderSection(
      `CONTINUOUS ASSESSMENT TEST (${data.total_marks} MARKS)`,
      data.section_a_instructions || "Answer ALL questions in the spaces provided.",
      `Total Score: ${data.total_score} / ${data.total_marks}`,
      data.section_a,
      false
    );
  } else {
    renderSection(
      `SECTION A: CORE CONCEPTS & SHORT ANSWERS (${data.sec_a_max} MARKS)`,
      data.section_a_instructions || "Answer ALL questions in this section (Compulsory).",
      `Section A Subtotal: ${data.sec_a_awarded} / ${data.sec_a_max}`,
      data.section_a,
      false
    );

    renderSection(
      `SECTION B: STRUCTURED & PRACTICAL TASKS (${data.sec_b_max} MARKS)`,
      data.section_b_instructions || "Answer the following structured scenario-based questions.",
      `Section B Subtotal: ${data.sec_b_awarded} / ${data.sec_b_max}`,
      data.section_b,
      true
    );
  }

  // 4. Overall Examination Feedback Remarks
  if (data.trainer_comments && data.trainer_comments.trim() !== "") {
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    const commentLines = doc.splitTextToSize(`"${data.trainer_comments}"`, contentWidth - 8);
    const commentBoxH = Math.max(12, 8 + commentLines.length * 4.2);
    ensureSpace(commentBoxH + 4);

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, commentBoxH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text("OVERALL EXAMINATION FEEDBACK & REMARKS:", margin + 3, y + 4.8);
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    commentLines.forEach((cLine: string, idx: number) => {
      doc.text(cLine, margin + 3, y + 9.2 + idx * 4.2);
    });

    y += commentBoxH + 4;
  }

  // 5. Official TVET CDACC Institutional Evaluation Sign-off Block
  ensureSpace(26);
  const sigBoxW = (contentWidth - 6) / 2;
  const sigBoxH = 21;

  // Assessor Sign-Off Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, sigBoxW, sigBoxH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 9, 83);
  doc.text("TRAINER / INTERNAL ASSESSOR SIGN-OFF:", margin + 3, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Assessor Name: ${data.trainer_name || "Alexander Kinoti Mbiti"}`, margin + 3, y + 9.2);
  doc.text(`Assessor Signature: _______________________`, margin + 3, y + 13.8);
  doc.text(`Evaluation Date: ${data.evaluated_at || new Date().toLocaleDateString("en-GB")}`, margin + 3, y + 17.8);

  // Internal Verifier / HOD Sign-Off Box (Right)
  const rightSigX = margin + sigBoxW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightSigX, y, sigBoxW, sigBoxH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 9, 83);
  doc.text("INTERNAL VERIFIER / HOD ENDORSEMENT:", rightSigX + 3, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`HOD / QA Verifier: Computing & Institutional QA`, rightSigX + 3, y + 9.2);
  doc.text(`Endorsement: [✓] Verified & Confirmed Competent`, rightSigX + 3, y + 13.8);
  doc.text(`Verification Date: ${data.evaluated_at || new Date().toLocaleDateString("en-GB")}`, rightSigX + 3, y + 17.8);

  y += sigBoxH + 4;

  // Page numbers and running headers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    if (p > 1) {
      // Running top header on pages 2+
      doc.setFillColor(0, 9, 83);
      doc.rect(margin, 10, contentWidth, 0.4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(0, 9, 83);
      doc.text(
        `${data.institution} — ${data.exam_title} (${data.unit_code})`,
        margin,
        8.5
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Candidate: ${data.student_name} (${data.reg_number})`,
        pageWidth - margin,
        8.5,
        { align: "right" }
      );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${data.institution} — ${data.unit_code} Graded Examination Script (${data.student_name}) | Page ${p} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );
  }

  const safeReg = data.reg_number.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeUnit = data.unit_code.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`MTTI_GradedExam_${safeUnit}_${safeReg}.pdf`);
  return doc;
}
