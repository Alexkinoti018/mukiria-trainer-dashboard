import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X,
  Printer,
  Download,
  FileText,
  PenTool,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Loader2,
  BookOpen,
} from "lucide-react";
import type { Submission, Exam } from "@/lib/supabase";
import { toast } from "sonner";
import { EXAM_THEME_TOKENS } from "@/lib/examThemeTokens";
import {
  buildUnifiedGradedExamData,
  exportGradedExamPDFClientSide,
  type UnifiedGradedQuestion,
} from "@/lib/exportGradedExamPdf";

interface MarkedExamScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  exam: Exam | null;
  onUpdateScore?: (subId: string, questionId: string, marks: number, section: "a" | "b") => void;
  trainerName?: string;
}

export default function MarkedExamScriptModal({
  isOpen,
  onClose,
  submission,
  exam,
  trainerName = "Alexander Kinoti",
}: MarkedExamScriptModalProps) {
  const [showRedPen, setShowRedPen] = useState(true);
  const [editingNotes] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Keep printing-marked-exam class on body whenever modal is open so both Ctrl+P and "Print Script" button print cleanly
  useEffect(() => {
    if (isOpen && submission) {
      document.body.classList.add("printing-marked-exam");
    } else {
      document.body.classList.remove("printing-marked-exam");
    }
    return () => {
      document.body.classList.remove("printing-marked-exam");
    };
  }, [isOpen, submission]);

  const handlePrint = () => {
    document.body.classList.add("printing-marked-exam");
    window.print();
  };

  if (!isOpen || !submission) return null;

  const unified = buildUnifiedGradedExamData(submission, exam, trainerName, editingNotes);

  const handleExport = async (formatType: "docx" | "pdf") => {
    setIsExporting(true);
    try {
      const endpoint =
        formatType === "docx"
          ? "http://localhost:8000/api/export-exam-results-docx"
          : "http://localhost:8000/api/export-exam-results-pdf";

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
        grade: unified.grade,
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

        if (!res.ok) throw new Error(`Export service error (${res.status})`);
        const resData = await res.json();
        const fileData = resData.data || resData.file_data;

        if (fileData) {
          const mime =
            formatType === "docx"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "application/pdf";
          const byteCharacters = atob(fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mime });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download =
            resData.filename ||
            `MTTI_MarkedScript_${unified.reg_number.replace(/\//g, "_")}.${formatType}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Official graded exam exported to ${formatType.toUpperCase()}!`);
          return;
        }
      } catch (backendErr) {
        if (formatType === "pdf") {
          exportGradedExamPDFClientSide(unified);
          toast.success("Official graded exam exported to PDF!");
          return;
        }
        throw backendErr;
      }
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const renderQuestionBlock = (
    q: UnifiedGradedQuestion,
    idx: number,
    isSectionB: boolean
  ) => {
    const isFull = q.marks_awarded >= q.max_marks;
    const isZero = q.marks_awarded === 0;
    const isPartial = q.marks_awarded > 0 && q.marks_awarded < q.max_marks;

    const qLabel =
      isSectionB && String(q.q_num).toLowerCase().startsWith("task")
        ? `${q.q_num}.`
        : `${q.q_num || idx + 1}.`;

    return (
      <div
        key={q.question_id || idx}
        className="question-block relative p-4 rounded-lg border border-slate-300 bg-white hover:border-slate-400 transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Question Prompt Header — Identical to Trainee Exam Paper */}
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex items-baseline gap-2">
                <span className="exam-question-prompt font-bold text-[#000953]">
                  {qLabel}
                </span>
                <span className="exam-question-prompt leading-snug whitespace-pre-line font-semibold text-slate-900">
                  {q.text}
                </span>
              </div>
              <span className="exam-marks-badge shrink-0">
                ({q.max_marks} {q.max_marks === 1 ? "Mark" : "Marks"})
              </span>
            </div>

            {/* Structured Sub-Parts (a, b, c, d) — Identical to Trainee Exam Paper */}
            {q.sub_parts && q.sub_parts.length > 0 && (
              <div className="mt-2 mb-3 pl-4 border-l-2 border-[#000953]/30 space-y-1.5 bg-slate-50/70 py-2 pr-3 rounded-r">
                {q.sub_parts.map((sp, spIdx) => (
                  <p
                    key={spIdx}
                    className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed"
                  >
                    {sp}
                  </p>
                ))}
              </div>
            )}

            {/* Multiple Choice Options (A, B, C, D) — Same Option Cards as Trainee Exam */}
            {q.type === "mcq" && q.options && q.options.length > 0 ? (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = q.selected_option_index === oIdx;
                    const isCorrect = q.correct_option_index === oIdx;
                    const letter = String.fromCharCode(65 + oIdx);

                    let cardStyle =
                      "border-slate-200 bg-slate-50/60 text-slate-700";
                    if (isSelected && isCorrect) {
                      cardStyle =
                        "border-emerald-600 bg-emerald-50/90 text-emerald-950 font-semibold ring-1 ring-emerald-500/40";
                    } else if (isSelected && !isCorrect) {
                      cardStyle =
                        "border-red-600 bg-red-50/90 text-red-950 font-semibold ring-1 ring-red-500/40";
                    } else if (!isSelected && isCorrect && showRedPen) {
                      cardStyle =
                        "border-[#000953] bg-blue-50/70 text-[#000953] font-semibold";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border text-xs transition ${cardStyle}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border ${
                              isSelected
                                ? isCorrect
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-red-600 text-white border-red-600"
                                : isCorrect && showRedPen
                                ? "bg-[#000953] text-white border-[#000953]"
                                : "bg-white text-slate-700 border-slate-300"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug break-words pt-0.5">
                            {opt}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                isCorrect
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-red-100 text-red-800 border-red-300"
                              }`}
                            >
                              {isCorrect ? "Candidate ✓" : "Candidate ✗"}
                            </span>
                          )}
                          {!isSelected && isCorrect && showRedPen && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[#000953] border border-blue-300">
                              Correct Key ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* If candidate answer wasn't mapped to an option index, show raw text */}
                {q.selected_option_index === undefined && (
                  <div className="text-xs p-2 rounded bg-[#fffdfa] border border-amber-200/80 text-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mr-1.5">
                      Candidate Recorded Answer:
                    </span>
                    <span className="font-semibold">
                      {q.formatted_answer || "[No option selected]"}
                    </span>
                  </div>
                )}
              </div>
            ) : q.type === "tf" ? (
              /* True / False Options — Same Layout as Trainee Exam */
              <div className="mt-2.5 flex items-center gap-3">
                {["True", "False"].map((tfOpt) => {
                  const isSelected =
                    String(q.raw_answer).trim().toLowerCase() === tfOpt.toLowerCase();
                  const isCorrect =
                    q.formatted_correct_answer?.toLowerCase() === tfOpt.toLowerCase();
                  return (
                    <div
                      key={tfOpt}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                        isSelected
                          ? isFull
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                            : "border-red-600 bg-red-50 text-red-900"
                          : isCorrect && showRedPen
                          ? "border-[#000953] bg-blue-50 text-[#000953]"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>{tfOpt}</span>
                      {isSelected && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/80 border">
                          Candidate Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Written / Structured / Practical Response Box */
              <div
                className="mt-2.5 text-xs sm:text-sm p-3 rounded-lg bg-[#fffdfa] border border-amber-300/80 text-slate-900 relative whitespace-pre-line leading-relaxed"
                style={{ minHeight: isSectionB ? "64px" : "42px" }}
              >
                <span className="text-[10px] uppercase font-bold text-[#000953] block mb-1 tracking-wide">
                  {isSectionB
                    ? "Candidate Written / Practical Procedure Response:"
                    : "Candidate Written Response:"}
                </span>

                {q.formatted_answer ? (
                  <span className="relative inline font-medium text-slate-900">
                    {q.formatted_answer}
                    {showRedPen && isPartial && (
                      <span
                        className="absolute left-0 bottom-0 w-full h-[2px] bg-red-500/80 rounded"
                        style={{ textDecoration: "underline wavy #dc2626" }}
                      />
                    )}
                    {showRedPen && isZero && (
                      <span className="ml-2 text-red-600 line-through decoration-red-600 font-bold">
                        [Incorrect / Incomplete]
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="italic text-slate-400">
                    [No candidate response entered]
                  </span>
                )}
              </div>
            )}

            {/* Official Marking Scheme / Rubric Breakdown */}
            {showRedPen && ((q.breakdown && q.breakdown.length > 0) || (q.formatted_correct_answer && q.type !== "mcq")) && (
              <div className="mt-2 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-[10px] font-bold uppercase text-[#000953] block mb-1">
                  Official Marking Scheme / Expected Key Points:
                </span>
                {q.breakdown && q.breakdown.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                    {q.breakdown.map((item, bIdx) => (
                      <li key={bIdx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-700">{q.formatted_correct_answer}</p>
                )}
              </div>
            )}

            {/* Simulated Red Pen Teacher Annotations */}
            {showRedPen && (
              <div className="mt-2 pt-1.5 border-t border-red-200/80 flex flex-wrap items-center justify-between gap-2 text-red-600">
                <div className="flex items-center gap-2">
                  {isFull ? (
                    <span
                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        ✓ Correct — Full marks awarded ({q.marks_awarded}/{q.max_marks})
                        {q.ai_reasoning ? ` • ${q.ai_reasoning}` : ""}
                      </span>
                    </span>
                  ) : isPartial ? (
                    <span
                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        ✓ Partial credit ({q.marks_awarded}/{q.max_marks}) —{" "}
                        {q.ai_reasoning || "Awarded marks for valid workplace points"}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      <X className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        ✗ Incorrect / Missing key concept (0/{q.max_marks})
                        {q.ai_reasoning ? ` — ${q.ai_reasoning}` : ""}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Circled Margin Score Oval */}
          {showRedPen && (
            <div className="shrink-0 flex flex-col items-center justify-center pt-1">
              <div
                className="w-14 h-12 rounded-[50%] border-2 border-red-600 flex items-center justify-center text-red-600 font-bold bg-red-50/60 shadow-sm"
                style={{
                  fontFamily: "'Caveat', cursive, sans-serif",
                  transform: `rotate(${((idx % 3) - 1) * 3}deg)`,
                }}
                title="Assessor Margin Score Stamp"
              >
                <span className="text-lg leading-none">
                  {q.marks_awarded} / {q.max_marks}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      id="marked-exam-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible"
    >
      <motion.div
        id="marked-exam-modal-dialog"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-card w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-w-none print:max-h-none print:rounded-none print:border-none print:shadow-none print:overflow-visible"
      >
        {/* Top Control Bar (Screen only) */}
        <div className="bg-[#000953] border-b-2 border-[#c48820] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c48820]/20 border border-[#c48820]/50 flex items-center justify-center text-[#fef6e7]">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white">
                  Official Graded Examination Paper — Trainee Exam Format
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-400/40 uppercase font-semibold">
                  Marked Script
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Candidate: <strong className="text-white">{unified.student_name}</strong> (
                {unified.reg_number}) — {unified.unit_code} ({unified.total_score}/
                {unified.total_marks} • {unified.percentage}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Red Pen Overlay */}
            <button
              onClick={() => setShowRedPen(!showRedPen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm border ${
                showRedPen
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-500"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title="Toggle Red Pen Annotations on and off"
            >
              {showRedPen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Red Pen: {showRedPen ? "ON" : "OFF"}</span>
            </button>

            {/* Print Marked Script */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 transition"
              title="Print official graded exam paper"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Script</span>
            </button>

            {/* Export DOCX */}
            <button
              onClick={() => handleExport("docx")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/30 hover:bg-blue-600/40 text-blue-100 border border-blue-400/40 transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export DOCX</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#c48820] hover:bg-[#b07818] text-white border border-amber-300/40 transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Script Paper Workspace (Scrollable on screen, full flow on print) */}
        <div
          id="marked-exam-modal-scroll"
          className="flex-1 overflow-y-auto bg-[#e5e5e5] p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible"
        >
          <div
            id="printable-marked-exam"
            className="max-w-4xl mx-auto bg-white text-slate-900 border-2 border-slate-300 shadow-xl rounded-sm p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white print:max-w-none print:overflow-visible"
            style={{
              fontFamily: EXAM_THEME_TOKENS.typography.fontFamilies.screen,
            }}
          >
            {/* Official Exam Cover Header Block (Matches Trainee Exam Paper Format) */}
            <div className="border-b-2 border-[#000953] pb-5 mb-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/mtti-logo.jpg"
                    alt="Mukiria TTI Logo"
                    className="w-16 h-16 object-contain rounded-full border-2 border-[#000953] p-0.5 bg-white shadow-sm shrink-0"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                  <div>
                    <h1 className="exam-inst-header tracking-tight text-[#000953]">
                      {unified.institution}
                    </h1>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-pre-line">
                      {unified.department}
                    </p>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#000953] mt-0.5">
                      {unified.exam_header} — {unified.exam_title}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold text-[#c48820]">
                      <span>TIME ALLOWED: {unified.time_allowed}</span>
                      <span>•</span>
                      <span>TOTAL MARKS: {unified.total_marks}</span>
                      <span>•</span>
                      <span>ASSESSMENT SLOT: {unified.task_code}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Red Pen Assessor Score Box Stamp */}
                {showRedPen && (
                  <div
                    className="relative px-4 py-3 rounded-2xl border-4 border-red-600 bg-red-50/80 shadow-md text-center shrink-0"
                    style={{
                      transform: "rotate(-2deg)",
                      borderColor: "#dc2626",
                    }}
                  >
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest text-red-700 block"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "14px" }}
                    >
                      Assessor Score Tally
                    </span>
                    <div
                      className="text-3xl font-black text-red-600 my-0.5 leading-none"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      {unified.total_score} / {unified.total_marks}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span
                        className="text-sm font-bold text-red-700"
                        style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "18px" }}
                      >
                        {unified.percentage}%
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                          unified.is_pass
                            ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                            : "bg-red-200 text-red-800 border-red-400"
                        }`}
                      >
                        {unified.is_pass ? "PASS" : "REFER"}
                      </span>
                    </div>
                    <div
                      className="text-[12px] font-bold text-red-600 mt-1 border-t border-red-300 pt-0.5 italic"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      Signed: {unified.trainer_name}
                    </div>
                  </div>
                )}
              </div>

              {/* Official Exam Paper & Candidate Metadata Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 text-xs bg-slate-50 border border-slate-300 p-3.5 rounded-lg">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Candidate Name:
                  </span>
                  <span className="font-bold text-slate-900">{unified.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Registration / Adm No:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{unified.reg_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Course Name:
                  </span>
                  <span className="font-bold text-slate-900">{unified.course_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Unit Code & Name:
                  </span>
                  <span className="font-bold text-slate-900">
                    {unified.unit_code} — {unified.unit_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Class & Series:
                  </span>
                  <span className="font-bold text-slate-900">
                    {unified.class_code} ({unified.series})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">
                    Evaluation Summary:
                  </span>
                  <span className="font-bold text-[#000953]">
                    Sec A: {unified.sec_a_awarded}/{unified.sec_a_max} | Sec B:{" "}
                    {unified.sec_b_awarded}/{unified.sec_b_max}
                  </span>
                </div>
              </div>

              {/* INSTRUCTIONS TO CANDIDATE Block — Exact Match with Trainee Exam Paper */}
              {unified.instructions && unified.instructions.length > 0 && (
                <div className="mt-4 p-3.5 rounded-lg bg-[#fef6e7] border border-[#c48820]/50 text-xs text-slate-800">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[#000953] mb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#c48820]" />
                    <span>INSTRUCTIONS TO CANDIDATE</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium">
                    {unified.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* SECTION A: Compulsory Objective / Short Answer Questions */}
            {unified.section_a.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between border-b-2 border-[#000953] pb-1.5 mb-2">
                  <div>
                    <h3 className="exam-section-heading uppercase tracking-wide text-[#000953]">
                      SECTION A ({unified.sec_a_max} MARKS)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {unified.section_a_instructions}
                    </p>
                  </div>
                  {showRedPen && (
                    <span
                      className="text-red-600 font-bold text-base"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      Section A Subtotal: {unified.sec_a_awarded} / {unified.sec_a_max}
                    </span>
                  )}
                </div>

                <div className="space-y-4 mt-3">
                  {unified.section_a.map((q, idx) => renderQuestionBlock(q, idx, false))}
                </div>
              </div>
            )}

            {/* SECTION B: Structured & Practical Tasks */}
            {unified.section_b.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between border-b-2 border-[#000953] pb-1.5 mb-2">
                  <div>
                    <h3 className="exam-section-heading uppercase tracking-wide text-[#000953]">
                      SECTION B ({unified.sec_b_max} MARKS)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {unified.section_b_instructions}
                    </p>
                  </div>
                  {showRedPen && (
                    <span
                      className="text-red-600 font-bold text-base"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      Section B Subtotal: {unified.sec_b_awarded} / {unified.sec_b_max}
                    </span>
                  )}
                </div>

                <div className="space-y-5 mt-3">
                  {unified.section_b.map((q, idx) => renderQuestionBlock(q, idx, true))}
                </div>
              </div>
            )}

            {/* Overall Assessor Remarks & Official Verification */}
            <div className="question-block border-t-2 border-[#000953] pt-5 mt-8 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-[#000953] mb-1">
                  Overall Assessor / Trainer Examination Feedback Remarks:
                </h4>
                <div
                  className="p-3.5 rounded-lg border-2 border-red-300 bg-red-50/40 text-red-900 text-sm font-semibold"
                  style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "17px" }}
                >
                  "{unified.trainer_comments}"
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 text-xs font-bold text-slate-800">
                <div className="border-t border-slate-400 pt-2">
                  <p>
                    Internal Assessor:{" "}
                    <span className="font-semibold text-red-700">{unified.trainer_name}</span>
                  </p>
                  <p className="exam-footer-timestamp mt-1">
                    Signature: {unified.trainer_name} (Digitally Signed via MTTI Portal)
                  </p>
                  <p className="exam-footer-timestamp">Date Evaluated: {unified.evaluated_at}</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p>
                    Head of Department:{" "}
                    <span className="font-semibold">{unified.department.split("\n")[0]}</span>
                  </p>
                  <p className="exam-footer-timestamp mt-1">
                    Signature: __________________________
                  </p>
                  <p className="exam-footer-timestamp">
                    Official Stamp: Mukiria TTI Academic Verifier
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#000953] border-t border-[#c48820]/40 px-5 py-3 flex items-center justify-between text-xs text-slate-300 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c48820]" />
            <span>
              Unified Trainee & Graded Exam Paper Format — All questions, MCQ options, structured
              sub-parts, and marking schemes aligned.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
