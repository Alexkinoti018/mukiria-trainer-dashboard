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
  const [items, setItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingSubmissions() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const { data: submissions, error } = await (supabase as any)
          .from("submissions")
          .select("*, exams(payload)")
          .eq("status", "pending");
          
        if (error) throw error;
        
        if (submissions) {
          const loadedItems: GradingItem[] = [];
          
          submissions.forEach((sub: any) => {
            const examPayload = sub.exams?.payload;
            if (!examPayload) return;
            
            const processSection = (sectionAnswers: any[], sectionQuestions: any[]) => {
              if (!sectionAnswers || !sectionQuestions) return;
              sectionAnswers.forEach((ans: any) => {
                const q = sectionQuestions.find((sq: any) => sq.id === ans.question_id);
                if (!q) return;
                
                // Only pull items that need manual review or are flagged
                if (ans.marks_awarded === null || q.type !== "mcq") {
                  loadedItems.push({
                    id: `${sub.id}-${q.id}`,
                    studentName: sub.student_name,
                    regNumber: sub.reg_number,
                    questionId: q.id,
                    questionText: q.text,
                    questionType: q.type,
                    studentAnswer: ans.answer,
                    correctAnswer: q.correct_answer,
                    marks: q.marks,
                    autoScore: ans.marks_awarded,
                    confidence: 0.8,
                    status: ans.marks_awarded === null ? "pending" : "flagged",
                    aiReasoning: ans.ai_reasoning || "Pending manual review",
                  });
                }
              });
            };
            
            processSection(sub.section_a, examPayload.section_a?.questions);
            processSection(sub.section_b, examPayload.section_b?.questions);
          });
          
          setItems(loadedItems);
        }
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPendingSubmissions();
  }, []);

  const [selectedItem, setSelectedItem] = useState<GradingItem | null>(null);
  const [manualScore, setManualScore] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "flagged">("pending");

  const filteredItems = items.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

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

    toast.success("Auto-Grading Complete", {
      description: `Awarded ${result.score}/${targetItem.marks} (Confidence: ${Math.round(result.confidence * 100)}%)`,
    });
  };

  const autoGradeAllPending = async () => {
    const pending = items.filter((i) => i.status === "pending");
    if (pending.length === 0) {
      toast.info("No pending items to grade.");
      return;
    }

    for (const item of pending) {
      await autoGradeItem(item.id);
    }

    toast.success("Batch Auto-Grading Complete", {
      description: `Evaluated ${pending.length} submissions against CDACC marking criteria.`,
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
      toast.success("Review Submitted", { description: "Manual grading recorded" });
      setSelectedItem(null);
      setManualScore(null);
      setReviewComment("");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "auto_graded":
        return <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.65 0.22 120)" }} />;
      case "reviewed":
        return <ThumbsUp className="w-4 h-4" style={{ color: "oklch(0.65 0.22 120)" }} />;
      case "flagged":
        return <AlertCircle className="w-4 h-4" style={{ color: "oklch(0.65 0.22 25)" }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: "oklch(0.72 0.18 160)" }} />;
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
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Pending Review
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.18 160)" }}>
              {pendingCount}
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Flagged
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.65 0.22 25)" }}>
              {flaggedCount}
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Reviewed
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.65 0.22 120)" }}>
              {reviewedCount}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}>
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Total Items
            </div>
            <div className="text-2xl font-bold" style={{ color: "oklch(0.58 0.012 240)" }}>
              {items.length}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Batch Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            {["all", "pending", "flagged"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filterStatus === status ? "oklch(0.72 0.18 160)" : "oklch(1 0 0 / 0.06)",
                  color: filterStatus === status ? "white" : "oklch(0.58 0.012 240)",
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {pendingCount > 0 && (
            <button
              onClick={autoGradeAllPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:opacity-90"
              style={{
                background: "#c48820",
                color: "#ffffff",
              }}
            >
              <Zap className="w-4 h-4" />
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
                className="glass-card p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: `1px solid ${item.status === "flagged" ? "oklch(0.65 0.22 25 / 0.3)" : "oklch(1 0 0 / 0.08)"}`,
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <div className="font-bold text-sm" style={{ color: "oklch(0.94 0.005 240)" }}>
                        {item.studentName}
                      </div>
                    </div>
                  <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                    {item.regNumber} • Q{item.questionId.slice(1)}
                  </div>
                  {item.reviewerComment && (
                    <div className="text-xs mt-1" style={{ color: "oklch(0.72 0.18 160)" }}>
                      {item.reviewerComment}
                    </div>
                  )}
                  </div>
                  <div className="text-right">
                    {item.autoScore !== undefined && (
                      <div className="text-sm font-bold" style={{ color: "oklch(0.72 0.18 160)" }}>
                        {item.autoScore}/{item.marks}
                      </div>
                    )}
                    {item.manualScore !== undefined && (
                      <div className="text-xs" style={{ color: "oklch(0.65 0.22 120)" }}>
                        Manual: {item.manualScore}/{item.marks}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-2 text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                  {item.questionText}
                </div>

                <div className="mb-2 p-2 rounded-lg" style={{ background: "oklch(1 0 0 / 0.05)" }}>
                  <div className="text-xs font-mono" style={{ color: "oklch(0.58 0.012 240)" }}>
                    {item.studentAnswer.substring(0, 100)}
                    {item.studentAnswer.length > 100 ? "..." : ""}
                  </div>
                </div>

                {item.confidence && (
                  <div className="flex items-center justify-between text-xs">
                    <div style={{ color: "oklch(0.50 0.010 240)" }}>AI Confidence</div>
                    <div
                      className="px-2 py-1 rounded-lg font-mono"
                      style={{
                        background: `oklch(0.72 0.18 160 / ${item.confidence * 0.2})`,
                        color: "oklch(0.72 0.18 160)",
                      }}
                    >
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
            className="glass-card p-6 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: "oklch(0.94 0.005 240)" }}>
                Review: {selectedItem.studentName}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.58 0.012 240)" }}
              >
                Close
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "oklch(0.50 0.010 240)" }}>
                  Question
                </div>
                <div className="text-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
                  {selectedItem.questionText}
                </div>
              </div>

              <div>
                <div className="text-xs mb-1" style={{ color: "oklch(0.50 0.010 240)" }}>
                  Student Answer
                </div>
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: "oklch(1 0 0 / 0.05)", color: "oklch(0.58 0.012 240)" }}
                >
                  {selectedItem.studentAnswer}
                </div>
              </div>

              {selectedItem.aiReasoning && (
                <div>
                  <div className="text-xs mb-1" style={{ color: "oklch(0.50 0.010 240)" }}>
                    AI Analysis
                  </div>
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{ background: "oklch(0.72 0.18 160 / 0.1)", color: "oklch(0.72 0.18 160)" }}
                  >
                    {selectedItem.aiReasoning}
                  </div>
                </div>
              )}

              {selectedItem.questionType !== "mcq" && (
                <>
                  <div>
                    <label className="text-xs block mb-2" style={{ color: "oklch(0.50 0.010 240)" }}>
                      Manual Score (out of {selectedItem.marks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedItem.marks}
                      value={manualScore ?? ""}
                      onChange={(e) => setManualScore(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: "oklch(1 0 0 / 0.05)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        color: "oklch(0.58 0.012 240)",
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-2" style={{ color: "oklch(0.50 0.010 240)" }}>
                      Reviewer Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add feedback for the student..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                      style={{
                        background: "oklch(1 0 0 / 0.05)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        color: "oklch(0.58 0.012 240)",
                      }}
                    />
                  </div>

                  <button
                    onClick={submitManualReview}
                    disabled={manualScore === null}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: "oklch(0.72 0.18 160)", color: "white" }}
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

