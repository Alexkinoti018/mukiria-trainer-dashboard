/**
 * Automated Grading Engine
 * Design: Institutional Glassmorphism
 * AI-powered auto-grading with manual review queue for subjective answers
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { toast } from "sonner";

interface GradingItem {
  id: string;
  submissionId: string;
  section: "a" | "b";
  studentName: string;
  regNumber: string;
  questionId: string;
  questionText: string;
  questionType: "mcq" | "short_answer" | "essay";
  studentAnswer: string;
  correctAnswer?: string;
  marks: number;
  autoScore?: number;
  manualScore?: number;
  confidence: number;
  status: "pending" | "auto_graded" | "reviewed" | "flagged";
  aiReasoning?: string;
  reviewerComment?: string;
}
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";


/**
 * Active AI & Rubric Scoring Engine
 */
async function scoreSubjectiveAnswer(item: GradingItem): Promise<{ score: number; confidence: number; reasoning: string }> {
  // 1. Attempt call to FastAPI / backend auto-grade service
  try {
    const res = await fetch("/api/auto-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_answer: item.studentAnswer,
        correct_answer: item.correctAnswer || "",
        marks: item.marks,
        question_type: item.questionType,
        question_text: item.questionText,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        score: Math.min(item.marks, Math.max(0, Number(data.score) || 0)),
        confidence: Number(data.confidence) || 0.85,
        reasoning: data.reasoning || "Scored via automated NLP evaluation service.",
      };
    }
  } catch (err) {
    console.warn("FastAPI auto-grade service unreachable; applying rubric heuristic.", err);
  }

  // 2. Deterministic Fallback Rubric Evaluator
  const answer = (item.studentAnswer || "").trim().toLowerCase();
  const guide = (item.correctAnswer || "").trim().toLowerCase();

  if (!answer) {
    return { score: 0, confidence: 1.0, reasoning: "No answer was provided by the candidate." };
  }

  // Calculate semantic term overlap
  const guideTokens = guide.split(/\W+/).filter((w) => w.length > 3);
  let matches = 0;
  guideTokens.forEach((token) => {
    if (answer.includes(token)) matches++;
  });

  const overlapRatio = guideTokens.length > 0 ? matches / guideTokens.length : 0.5;
  const lengthScore = Math.min(1, answer.length / 80);
  const compositeRatio = Math.min(1, overlapRatio * 0.7 + lengthScore * 0.3);
  const calculatedScore = Math.round(item.marks * compositeRatio * 10) / 10;

  return {
    score: calculatedScore,
    confidence: Math.round((0.6 + compositeRatio * 0.3) * 100) / 100,
    reasoning: `Rubric evaluated: ${matches}/${guideTokens.length} key marking concepts identified (${Math.round(compositeRatio * 100)}% match).`,
  };
}

export default function AutoGrading() {
  const { exams, submissions: contextSubmissions, gradeSubmission } = useExam();
  const [items, setItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildItemsFromContext = () => {
      const loadedItems: GradingItem[] = [];
      contextSubmissions.forEach((sub) => {
        const exam =
          exams.find((e) => e.id === sub.exam_id) ||
          exams.find((e) => e.unit_code === sub.unit_code);
        const examPayload = exam?.payload;
        if (!examPayload) return;

        const processSection = (
          sectionAnswers: any[],
          sectionQuestions: any[],
          secKey: "a" | "b"
        ) => {
          if (!sectionAnswers || !sectionQuestions) return;
          sectionAnswers.forEach((ans: any) => {
            const q = sectionQuestions.find((sq: any) => sq.id === ans.question_id);
            if (!q) return;

            if (ans.marks_awarded === null || ans.marks_awarded === undefined || q.type !== "mcq") {
              loadedItems.push({
                id: `${sub.id}::${q.id}`,
                submissionId: sub.id,
                section: secKey,
                studentName: sub.student_name,
                regNumber: sub.reg_number,
                questionId: q.id,
                questionText: q.text,
                questionType: (q.type as any) || "short_answer",
                studentAnswer: String(ans.answer ?? ""),
                correctAnswer: q.correct_answer ? String(q.correct_answer) : undefined,
                marks: q.marks,
                autoScore: ans.marks_awarded ?? undefined,
                confidence: 0.88,
                status:
                  ans.marks_awarded === null || ans.marks_awarded === undefined
                    ? "pending"
                    : ans.flagged_for_review
                    ? "flagged"
                    : "auto_graded",
                aiReasoning: ans.ai_reasoning || ans.notes || "Evaluated against TVET CDACC marking guide",
              });
            }
          });
        };

        processSection(sub.section_a, examPayload.section_a?.questions || [], "a");
        processSection(sub.section_b, examPayload.section_b?.questions || [], "b");
      });
      setItems(loadedItems);
      setLoading(false);
    };

    buildItemsFromContext();
  }, [contextSubmissions, exams]);

  const [selectedItem, setSelectedItem] = useState<GradingItem | null>(null);
  const [manualScore, setManualScore] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "flagged">("all");

  const filteredItems = items.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const persistScoreToSubmission = (
    targetItem: GradingItem,
    awardedScore: number,
    reasoningText?: string
  ) => {
    const sub = contextSubmissions.find((s) => s.id === targetItem.submissionId);
    if (!sub) return;
    const updatedA = sub.section_a.map((ans) =>
      targetItem.section === "a" && ans.question_id === targetItem.questionId
        ? {
            ...ans,
            marks_awarded: Math.round(awardedScore),
            ai_reasoning: reasoningText || ans.ai_reasoning,
            flagged_for_review: false,
          }
        : ans
    );
    const updatedB = sub.section_b.map((ans) =>
      targetItem.section === "b" && ans.question_id === targetItem.questionId
        ? {
            ...ans,
            marks_awarded: Math.round(awardedScore),
            ai_reasoning: reasoningText || ans.ai_reasoning,
            flagged_for_review: false,
          }
        : ans
    );
    const totalScore =
      updatedA.reduce((s, a) => s + (a.marks_awarded ?? 0), 0) +
      updatedB.reduce((s, a) => s + (a.marks_awarded ?? 0), 0);

    gradeSubmission(sub.id, {
      section_a: updatedA,
      section_b: updatedB,
      total_score: totalScore,
      status: "graded",
    });
  };

  const autoGradeItem = async (itemId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const result = await scoreSubjectiveAnswer(targetItem);

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              autoScore: result.score,
              confidence: result.confidence,
              aiReasoning: result.reasoning,
              status: "auto_graded",
            }
          : item
      )
    );

    persistScoreToSubmission(targetItem, result.score, result.reasoning);

    toast.success("Auto-Grading Complete & Synced to Marksheet", {
      description: `Awarded ${result.score}/${targetItem.marks} (Confidence: ${Math.round(result.confidence * 100)}%)`,
    });
  };

  const autoGradeAllPending = async () => {
    const pending = items.filter((i) => i.status === "pending" || i.status === "flagged");
    if (pending.length === 0) {
      toast.info("No pending or flagged items to grade.");
      return;
    }

    for (const item of pending) {
      await autoGradeItem(item.id);
    }

    toast.success("Batch Auto-Grading Complete", {
      description: `Evaluated ${pending.length} items and synchronized marks to the Grading Sheet & Marksheet.`,
    });
  };

  const submitManualReview = () => {
    if (selectedItem && manualScore !== null) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                manualScore,
                reviewerComment: reviewComment,
                status: "reviewed",
              }
            : item
        )
      );
      persistScoreToSubmission(selectedItem, manualScore, reviewComment || selectedItem.aiReasoning);
      toast.success("Review Submitted & Synced to Marksheet", { description: "Manual grading recorded" });
      setSelectedItem(null);
      setManualScore(null);
      setReviewComment("");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "auto_graded":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "reviewed":
        return <ThumbsUp className="w-4 h-4 text-emerald-600" />;
      case "flagged":
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const flaggedCount = items.filter((i) => i.status === "flagged").length;
  const reviewedCount = items.filter((i) => i.status === "reviewed").length;

  return (
    <TrainerLayout title="Auto Grading" subtitle="AI-powered grading with manual review queue">
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Pending Review</div>
            <div className="text-2xl font-bold mt-2 font-mono text-[#c48820]">{pendingCount}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Flagged</div>
            <div className="text-2xl font-bold mt-2 font-mono text-rose-600">{flaggedCount}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Reviewed</div>
            <div className="text-2xl font-bold mt-2 font-mono text-emerald-700">{reviewedCount}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-600">Total Items</div>
              <div className="text-2xl font-bold mt-2 font-mono text-[#000953]">{items.length}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Batch Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            {(["all", "pending", "flagged"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  filterStatus === status
                    ? "bg-[#000953] border-[#000953] text-white shadow-sm"
                    : "bg-white border-slate-300 text-slate-600 hover:text-[#000953] hover:bg-slate-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {pendingCount > 0 && (
            <button
              onClick={autoGradeAllPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm bg-[#000953] hover:bg-[#000e7a] text-white active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 text-[#c48820]" />
              Auto-Grade All Pending ({pendingCount})
            </button>
          )}
        </div>

        {/* Grading Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-50 border shadow-sm ${
                  item.status === "flagged"
                    ? "bg-white border-rose-300 hover:border-rose-400"
                    : "bg-white border-slate-300 hover:border-slate-400"
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <div className="font-bold text-sm text-[#0f172a]">
                        {item.studentName}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      {item.regNumber} • Q{item.questionId.slice(1)}
                    </div>
                    {item.reviewerComment && (
                      <div className="text-xs mt-1 text-[#c48820] font-medium italic">
                        {item.reviewerComment}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {item.autoScore !== undefined && (
                      <div className="text-sm font-bold font-mono text-[#000953]">
                        {item.autoScore}/{item.marks}
                      </div>
                    )}
                    {item.manualScore !== undefined && (
                      <div className="text-xs font-mono text-emerald-700 font-bold">
                        Manual: {item.manualScore}/{item.marks}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-2 text-xs text-slate-700 font-medium">
                  {item.questionText}
                </div>

                <div className="mb-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-mono text-[#0f172a]">
                    {item.studentAnswer.substring(0, 100)}
                    {item.studentAnswer.length > 100 ? "..." : ""}
                  </div>
                </div>

                {item.confidence && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-slate-600 font-medium">AI Confidence</div>
                    <div className="px-2 py-0.5 rounded font-mono text-xs bg-slate-100 border border-slate-300 text-[#000953] font-bold">
                      {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Review Panel */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-white border border-slate-300 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#000953]">
                Review: {selectedItem.studentName}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <div className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">
                  Question
                </div>
                <div className="text-sm text-[#0f172a] font-medium">
                  {selectedItem.questionText}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">
                  Student Answer
                </div>
                <div className="p-3 rounded-lg text-sm bg-slate-50 border border-slate-300 text-[#0f172a] font-mono">
                  {selectedItem.studentAnswer}
                </div>
              </div>

              {selectedItem.aiReasoning && (
                <div>
                  <div className="text-xs text-slate-600 mb-1 font-bold uppercase tracking-wider">
                    AI Analysis
                  </div>
                  <div className="p-3 rounded-lg text-xs bg-[#000953]/5 border border-[#000953]/20 text-[#0f172a] leading-relaxed">
                    {selectedItem.aiReasoning}
                  </div>
                </div>
              )}

              {selectedItem.questionType !== "mcq" && (
                <>
                  <div>
                    <label className="text-xs block mb-1.5 text-slate-700 font-bold uppercase tracking-wider">
                      Manual Score (out of {selectedItem.marks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedItem.marks}
                      value={manualScore ?? ""}
                      onChange={(e) => setManualScore(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-1.5 text-slate-700 font-bold uppercase tracking-wider">
                      Reviewer Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add feedback for the student..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none bg-white border border-slate-300 text-[#0f172a] focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/15 placeholder-slate-400"
                    />
                  </div>

                  <button
                    onClick={submitManualReview}
                    disabled={manualScore === null}
                    className="w-full px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 bg-[#000953] hover:bg-[#000e7a] text-white active:scale-[0.98]"
                  >
                    Submit Review
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </TrainerLayout>
  );
}

