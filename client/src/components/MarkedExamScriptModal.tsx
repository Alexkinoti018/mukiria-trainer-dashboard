import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  PenTool, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Award, 
  Edit3, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  Loader2
} from "lucide-react";
import type { Submission, Exam } from "@/lib/supabase";
import { toast } from "sonner";
import { EXAM_THEME_TOKENS } from "@/lib/examThemeTokens";

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
  onUpdateScore,
  trainerName = "Alexander Kinoti"
}: MarkedExamScriptModalProps) {
  const [showRedPen, setShowRedPen] = useState(true);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"all" | "section_a" | "section_b">("all");
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    document.body.classList.add("printing-marked-exam");
    const cleanup = () => {
      document.body.classList.remove("printing-marked-exam");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  if (!isOpen || !submission) return null;

  const totalMarks = exam?.payload?.total_marks ?? 70;
  const currentTotal = submission.total_score !== null 
    ? Math.round(submission.total_score) 
    : 0;
  const percentage = Math.round((currentTotal / totalMarks) * 100);
  const isPass = percentage >= 50;

  // Custom feedback notes state
  const handleNoteChange = (qId: string, note: string) => {
    setEditingNotes(prev => ({ ...prev, [qId]: note }));
  };

  const handleExport = async (formatType: "docx" | "pdf") => {
    const endpoint = formatType === "docx"
      ? "http://localhost:8000/api/export-exam-results-docx"
      : "http://localhost:8000/api/export-exam-results-pdf";
    
    setIsExporting(true);
    try {
      const secA = (submission.section_a || []).map((ans, idx) => {
        const q = exam?.payload?.section_a?.questions?.find((item) => item.id === ans.question_id);
        let ansDisplay = String(ans.answer ?? "No response");
        if (q?.type === "mcq" && q?.options && !isNaN(Number(ansDisplay))) {
          const optIdx = Number(ansDisplay);
          ansDisplay = `${String.fromCharCode(65 + optIdx)}: ${q.options[optIdx] ?? ansDisplay}`;
        }
        return {
          q_num: q?.q_num || idx + 1,
          text: q?.text || `Question ${idx + 1}`,
          answer: ansDisplay,
          marks_awarded: ans.marks_awarded ?? 0,
          max_marks: q?.marks ?? 2,
          breakdown: q?.breakdown,
          ai_reasoning: editingNotes[ans.question_id] || ans.ai_reasoning || "",
        };
      });

      const secB = (submission.section_b || []).map((ans, idx) => {
        const q = exam?.payload?.section_b?.questions?.find((item) => item.id === ans.question_id);
        return {
          q_num: q?.q_num || (idx + (submission.section_a?.length || 10) + 1),
          text: q?.text || `Task ${idx + 1}`,
          answer: String(ans.answer ?? "No response"),
          marks_awarded: ans.marks_awarded ?? 0,
          max_marks: q?.marks ?? 20,
          breakdown: q?.breakdown,
          sub_parts: q?.sub_parts,
          ai_reasoning: editingNotes[ans.question_id] || ans.ai_reasoning || "",
        };
      });

      const payload = {
        student_name: submission.student_name,
        reg_number: submission.reg_number,
        department: exam?.payload?.department || "HOSPITALITY DEPARTMENT\nBUILDING DEPARTMENT",
        course_name: exam?.course_name || "OFFICE ADMINISTRATION LEVEL 5 & 6, LAND SURVEY LEVEL 5 & 6",
        course_code: exam?.payload?.course_code || submission.unit_code,
        unit_name: exam?.payload?.unit_name || exam?.course_name || "APPLY DIGITAL LITERACY",
        unit_code: submission.unit_code,
        class_code: exam?.payload?.class || "FBS5/6/J/25, LS5/6/S/25",
        series: exam?.payload?.series || "SEP - NOV 2026",
        time_allowed: exam?.payload?.time_allowed || "2 HOURS",
        exam_title: exam?.payload?.title || "WRITTEN ASSESSMENT 1",
        evaluated_at: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        total_score: currentTotal,
        total_marks: totalMarks,
        percentage: percentage,
        grade: isPass ? "Pass" : "Referral",
        status: isPass ? "COMPETENT (PASS)" : "NOT YET COMPETENT (REFER)",
        trainer_comments: submission.trainer_comments || "The candidate demonstrates exceptional competence in digital literacy principles, practical workplace computer procedures, and software applications.",
        trainer_name: trainerName,
        section_a: secA,
        section_b: secB,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Export service error (${res.status})`);
      const resData = await res.json();
      const fileData = resData.data || resData.file_data;

      if (fileData) {
        const mime = formatType === "docx"
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
        link.download = resData.filename || `MTTI_MarkedScript_${submission.reg_number.replace(/\//g, "_")}.${formatType}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Marked script exported to ${formatType.toUpperCase()}!`);
      }
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Control Bar (Screen only) */}
        <div className="bg-slate-900 border-b border-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white">
                  Visual Marked Script — Simulated "Red Pen" Teacher Annotations
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-semibold">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Candidate: <strong className="text-white">{submission.student_name}</strong> ({submission.reg_number}) — {submission.unit_code}
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
              <span>Red Pen Overlay: {showRedPen ? "ON" : "OFF"}</span>
            </button>

            {/* Print Marked Script */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Print official marked paper"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Script</span>
            </button>

            {/* Export DOCX */}
            <button
              onClick={() => handleExport("docx")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export DOCX</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 transition disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Script Paper Workspace (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-[#e5e5e5] p-3 sm:p-6 print:p-0 print:bg-white">
          <div 
            id="printable-marked-exam"
            className="max-w-4xl mx-auto bg-white text-slate-900 border-2 border-slate-300 shadow-xl rounded-sm p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white"
            style={{ 
              fontFamily: EXAM_THEME_TOKENS.typography.fontFamilies.screen,
              backgroundImage: "linear-gradient(to bottom, transparent 96%, rgba(0, 0, 0, 0.02) 100%)"
            }}
          >
            {/* Watermark / Background Texture */}
            <div className="absolute top-24 right-10 pointer-events-none opacity-[0.03] select-none text-9xl font-black rotate-[-25deg] text-black">
              MTTI
            </div>

            {/* Institution Header Block */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/mtti-logo.jpg" 
                    alt="Mukiria TTI Logo" 
                    className="w-16 h-16 object-contain rounded-full border border-slate-300 p-0.5 bg-white shadow-sm"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                  <div>
                    <h1 className="exam-inst-header tracking-tight">
                      MUKIRIA TECHNICAL TRAINING INSTITUTE
                    </h1>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      DEPARTMENT OF COMPUTING & INFORMATICS
                    </p>
                    <p className="exam-paper-title text-[#c48820]">
                      OFFICIAL CANDIDATE EXAMINATION SCRIPT & EVALUATION
                    </p>
                  </div>
                </div>

                {/* Simulated Red Pen Assessor Score Box Stamp */}
                {showRedPen && (
                  <motion.div 
                    initial={{ scale: 0.9, rotate: -2 }}
                    animate={{ scale: 1, rotate: -2 }}
                    className="relative px-4 py-3 rounded-2xl border-4 border-red-600 bg-red-50/70 shadow-md text-center shrink-0"
                    style={{
                      transform: "rotate(-3deg)",
                      borderColor: "#dc2626"
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
                      {currentTotal} / {totalMarks}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span 
                        className="text-sm font-bold text-red-700"
                        style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "18px" }}
                      >
                        {percentage}%
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        isPass 
                          ? "bg-emerald-100 text-emerald-800 border-emerald-400" 
                          : "bg-red-200 text-red-800 border-red-400"
                      }`}>
                        {isPass ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <div 
                      className="text-[12px] font-bold text-red-600 mt-1 border-t border-red-300 pt-0.5 italic"
                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                    >
                      Signed: {trainerName}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 text-xs bg-slate-50 border border-slate-300 p-3 rounded-lg">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Candidate Name:</span>
                  <span className="font-bold text-slate-900">{submission.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Registration No:</span>
                  <span className="font-mono font-bold text-slate-900">{submission.reg_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Unit Code:</span>
                  <span className="font-mono font-bold text-slate-900">{submission.unit_code}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px] uppercase">Class & Series:</span>
                  <span className="font-bold text-slate-900">{exam?.payload?.class || "FBS5/6/J/25"}, {exam?.payload?.series || "SEP-NOV 2026"}</span>
                </div>
              </div>
            </div>

            {/* SECTION A: Core Concepts & Short Answers */}
            <div className="mb-8">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1 mb-4">
                <h3 className="exam-section-heading uppercase tracking-wide">
                  SECTION A: CORE CONCEPTS & SHORT ANSWERS (Compulsory — 30 Marks)
                </h3>
                {showRedPen && (
                  <span 
                    className="text-red-600 font-bold text-base"
                    style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                  >
                    Section A Subtotal: {Math.round((submission.section_a || []).reduce((acc, a) => acc + (a.marks_awarded ?? 0), 0))} / 30
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {(submission.section_a || []).map((ans, idx) => {
                  const q = exam?.payload?.section_a?.questions?.find((item) => item.id === ans.question_id);
                  const maxMarks = Math.round(q?.marks ?? 2);
                  const awarded = Math.round(ans.marks_awarded ?? 0);
                  const isFull = awarded >= maxMarks;
                  const isZero = awarded === 0;
                  const isPartial = awarded > 0 && awarded < maxMarks;

                  let ansText = String(ans.answer ?? "").trim();
                  if (q?.type === "mcq" && q?.options && !isNaN(Number(ansText))) {
                    const optIdx = Number(ansText);
                    ansText = `Option ${String.fromCharCode(65 + optIdx)}: ${q.options[optIdx] ?? ""}`;
                  }

                  return (
                    <div 
                      key={ans.question_id || idx}
                      className="relative p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Question header */}
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="exam-question-prompt font-bold">
                              Q{idx + 1}.
                            </span>
                            <span className="exam-question-prompt leading-snug">
                              {q?.text || `Question ${idx + 1}`}
                            </span>
                            <span className="exam-marks-badge shrink-0">
                              ({maxMarks} Marks)
                            </span>
                          </div>

                          {/* Student Written Response */}
                          <div 
                            className="mt-2 text-xs p-2.5 rounded bg-[#fffdfa] border border-amber-200/60 font-medium text-slate-800 relative"
                            style={{ minHeight: "36px" }}
                          >
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                              Candidate Response:
                            </span>
                            
                            {ansText ? (
                              <span className="relative inline">
                                {ansText}
                                {/* Red pen wavy underline or strikethrough for incomplete/incorrect parts */}
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
                              <span className="italic text-slate-400">[No candidate response entered]</span>
                            )}

                            {/* Simulated Red Pen Annotations overlay */}
                            {showRedPen && (
                              <div className="mt-2 pt-1 border-t border-red-100 flex items-center justify-between text-red-600">
                                <div className="flex items-center gap-2">
                                  {/* Red Tick or Cross */}
                                  {isFull ? (
                                    <span 
                                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                                    >
                                      <svg className="w-5 h-5 text-red-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      <span>Correct! Full marks awarded</span>
                                    </span>
                                  ) : isPartial ? (
                                    <span 
                                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                                    >
                                      <svg className="w-4 h-4 text-red-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      <span>Partial credit — {ans.ai_reasoning || "Omitted essential workplace points"}</span>
                                    </span>
                                  ) : (
                                    <span 
                                      className="inline-flex items-center gap-1 font-bold text-red-600 text-sm"
                                      style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                                    >
                                      <svg className="w-4 h-4 text-red-600 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                      <span>Incorrect / Missing definition</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Circled Margin Score Oval */}
                        {showRedPen && (
                          <div className="shrink-0 flex flex-col items-center justify-center pt-2">
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="w-14 h-12 rounded-[50%] border-2 border-red-600 flex items-center justify-center text-red-600 font-bold bg-red-50/50 shadow-sm"
                              style={{
                                fontFamily: "'Caveat', cursive, sans-serif",
                                transform: `rotate(${((idx % 3) - 1) * 3}deg)`
                              }}
                              title="Teacher score stamp"
                            >
                              <span className="text-lg leading-none">
                                {awarded} / {maxMarks}
                              </span>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION B: Structured Practical Tasks */}
            <div className="mb-8">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1 mb-4">
                <h3 className="exam-section-heading uppercase tracking-wide">
                  SECTION B: STRUCTURED PRACTICAL TASKS (40 Marks)
                </h3>
                {showRedPen && (
                  <span 
                    className="text-red-600 font-bold text-base"
                    style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                  >
                    Section B Subtotal: {Math.round((submission.section_b || []).reduce((acc, b) => acc + (b.marks_awarded ?? 0), 0))} / 40
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {(submission.section_b || []).map((ans, idx) => {
                  const q = exam?.payload?.section_b?.questions?.find((item) => item.id === ans.question_id);
                  const maxMarks = Math.round(q?.marks ?? 20);
                  const awarded = Math.round(ans.marks_awarded ?? 0);

                  return (
                    <div 
                      key={ans.question_id || idx}
                      className="p-4 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="exam-question-prompt font-bold">
                              Task {idx + 1}.
                            </span>
                            <span className="exam-question-prompt leading-snug whitespace-pre-line">
                              {q?.text || `Task ${idx + 1}`}
                            </span>
                            <span className="exam-marks-badge shrink-0">
                              ({maxMarks} Marks)
                            </span>
                          </div>

                          {/* Student Answer */}
                          <div className="mt-2 text-xs p-3 rounded bg-[#fffdfa] border border-amber-200/60 font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                              Candidate Work / Practical Procedure:
                            </span>
                            {String(ans.answer || "").trim() || (
                              <em className="text-slate-400">[No candidate practical work entered]</em>
                            )}

                            {/* Red Pen Teacher Markup Notes */}
                            {showRedPen && (
                              <div className="mt-3 pt-2 border-t border-red-200 space-y-1.5">
                                <div 
                                  className="text-red-600 font-bold text-sm flex items-center gap-1.5"
                                  style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-red-600" />
                                  <span>Assessor Evaluation: {ans.ai_reasoning || "Satisfactory initial steps, but lacks full formula cell reference precision and advanced safety breakdown."}</span>
                                </div>
                                <div 
                                  className="text-red-700 text-xs italic pl-5"
                                  style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "14px" }}
                                >
                                  ✎ Marking Rubric Alignment: Awarded {awarded} out of {maxMarks} marks.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Circled Margin Score Oval */}
                        {showRedPen && (
                          <div className="shrink-0 flex flex-col items-center justify-center pt-2">
                            <motion.div
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="w-16 h-14 rounded-[50%] border-2 border-red-600 flex items-center justify-center text-red-600 font-bold bg-red-50/50 shadow-sm"
                              style={{
                                fontFamily: "'Caveat', cursive, sans-serif",
                                transform: "rotate(-4deg)"
                              }}
                            >
                              <span className="text-xl leading-none">
                                {awarded} / {maxMarks}
                              </span>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall Assessor Remarks & Official Verification */}
            <div className="border-t-2 border-slate-900 pt-5 mt-8 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 mb-1">
                  Overall Assessor / Trainer Examination Feedback Remarks:
                </h4>
                <div 
                  className="p-3 rounded-lg border-2 border-red-300 bg-red-50/40 text-red-900 text-sm font-semibold"
                  style={{ fontFamily: "'Caveat', cursive, sans-serif", fontSize: "17px" }}
                >
                  "{submission.trainer_comments || "The candidate demonstrates competent foundational digital skills with solid adherence to workplace ICT standards. Needs further practice on OS management and shutdown procedures."}"
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 text-xs font-bold text-slate-800">
                <div className="border-t border-slate-400 pt-2">
                  <p>Internal Assessor: <span className="font-semibold text-red-700">{trainerName}</span></p>
                  <p className="exam-footer-timestamp mt-1">Signature: Alexander Kinoti (Digitally Signed via MTTI Portal)</p>
                  <p className="exam-footer-timestamp">Date: 4 October 2026</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p>Head of Department: <span className="font-semibold">Computing & Informatics</span></p>
                  <p className="exam-footer-timestamp mt-1">Signature: __________________________</p>
                  <p className="exam-footer-timestamp">Official Stamp: Mukiria TTI Academic Verifier</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-border px-5 py-3 flex items-center justify-between text-xs text-slate-400 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulated Red Pen Marking Engine active — Real-time SVG checkmarks, red ovals & tally coordinates.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
