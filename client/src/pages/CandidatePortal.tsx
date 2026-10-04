/**
 * Candidate Portal — Student Exam Interface
 * Design: Institutional Glassmorphism (lighter variant for students)
 * Features: Dynamic exam loader, offline-resilient timer, secure submission
 * URL: /exam?unitCode=COMP-204
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  User,
  Loader2,
  Shield,
  Timer,
  AlertCircle,
  Award,
  Info,
} from "lucide-react";
import { useExam, sanitizeExamForStudent } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Exam } from "@/lib/supabase";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import {
  saveExamToOffline,
  getExamFromOffline,
  saveSubmissionToOffline,
  getDraftSubmissionFromOffline,
  enqueueSyncItem,
} from "@/lib/offlineStore";
import { syncEngine } from "@/lib/syncEngine";

type PortalState =
  | "loading"
  | "not_found"
  | "practical"
  | "registration"
  | "instructions"
  | "exam"
  | "submitted"
  | "error";

interface StudentInfo {
  name: string;
  regNumber: string;
  email: string;
}

// ─── Offline-resilient Timer Hook ────────────────────────────
function useExamTimer(unitCode: string, durationMinutes: number, onExpire: () => void) {
  const STORAGE_KEY = `mtti_timer_${unitCode || durationMinutes}`;
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { endTime } = JSON.parse(stored);
        const remaining = Math.floor((endTime - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      } catch {
        return durationMinutes * 60;
      }
    }
    return durationMinutes * 60;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  const startTimer = useCallback(() => {
    let targetEndTime: number;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.endTime && parsed.endTime > Date.now()) {
          targetEndTime = parsed.endTime;
        } else {
          targetEndTime = Date.now() + secondsLeft * 1000;
        }
      } catch {
        targetEndTime = Date.now() + secondsLeft * 1000;
      }
    } else {
      targetEndTime = Date.now() + secondsLeft * 1000;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime: targetEndTime }));

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const remaining = Math.floor((targetEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
        localStorage.removeItem(STORAGE_KEY);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire();
        }
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
  }, [secondsLeft, STORAGE_KEY, onExpire]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    localStorage.removeItem(STORAGE_KEY);
    setSecondsLeft(durationMinutes * 60);
    expiredRef.current = false;
  }, [durationMinutes, STORAGE_KEY]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft <= 300; // 5 min warning
  const isCritical = secondsLeft <= 60;

  return { secondsLeft, minutes, seconds, isWarning, isCritical, startTimer, resetTimer };
}



export default function CandidatePortal() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const unitCode = params.get("unitCode") ?? params.get("unit") ?? "";
  const { exams, submissions, submitExam } = useExam();
  const { user } = useAuth();

  const [state, setState] = useState<PortalState>("loading");
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<StudentInfo>({ name: "", regNumber: "", email: "" });
  const [sectionAAnswers, setSectionAAnswers] = useState<Record<string, number | string>>({});
  const [sectionBAnswers, setSectionBAnswers] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState<"a" | "b">("a");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleTimerExpire = useCallback(() => {
    toast.warning("Time's Up!", { description: "Your exam is being submitted automatically." });
    handleSubmit(true);
  }, []);

  const { secondsLeft, minutes, seconds, isWarning, isCritical, startTimer, resetTimer } = useExamTimer(
    exam?.unit_code || unitCode,
    exam?.payload.duration_minutes ?? 90,
    handleTimerExpire
  );

  // ── Load exam ─────────────────────────────────────────────
  useEffect(() => {
    if (!unitCode) {
      setState("not_found");
      return;
    }
    loadExam();
  }, [unitCode]);

  const loadExam = async () => {
    setState("loading");
    try {
      let foundExam = exams.find((e) => e.unit_code.toUpperCase() === unitCode.toUpperCase());
      
      // Fallback to IndexedDB offline cache if not in memory
      if (!foundExam) {
        const cached = await getExamFromOffline(unitCode);
        if (cached) {
          foundExam = {
            id: cached.id,
            unit_code: cached.unit_code,
            payload: cached.payload,
            created_at: new Date(cached.cached_at).toISOString(),
          } as Exam;
        }
      }
      
      if (!foundExam) {
        setState("not_found");
        return;
      }
      
      if (foundExam) {
        // Enforce Column Shielding: completely shield correct answers and rubrics from candidate state
        foundExam = sanitizeExamForStudent(foundExam);
      }
      
      // Cache loaded exam into IndexedDB for offline resilience
      await saveExamToOffline(foundExam);
      
      if (foundExam.payload.type === "practical") {
        setExam(foundExam);
        setState("practical");
        return;
      }
      
      setExam(foundExam);
      console.log("✅ [MTTI Portal] Exam loaded with Column Shielding:", foundExam.unit_code);
      setState("registration");
    } catch (err) {
      console.error("❌ [MTTI Portal] Load error:", err);
      setState("error");
    }
  };

  // ── Submit exam ───────────────────────────────────────────
  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!exam || submitting) return;
      setSubmitting(true);

      // 1. Mandatory Mod 5: Valid Exam Window Verification
      if (exam.payload?.end_time) {
        const now = new Date();
        const endTime = new Date(exam.payload.end_time);
        if (now > endTime) {
          toast.error("Submission Window Expired", {
            description: "403 Forbidden: Exam submission window has expired and submissions are locked.",
          });
          setSubmitting(false);
          return;
        }
      }

      // 2. Mandatory Mod 5: Submission Locking (Cannot re-submit once committed)
      const regNo = student.regNumber.trim().toUpperCase();
      const existingSub = (submissions || []).find(
        (s) =>
          (s.unit_code?.toUpperCase() === exam.unit_code?.toUpperCase() || s.exam_id === exam.id) &&
          (s.reg_number?.toUpperCase() === regNo ||
            s.student_email?.toLowerCase() === student.email.trim().toLowerCase())
      );
      if (existingSub && (existingSub.status === "submitted" || existingSub.status === "graded")) {
        toast.error("Submission Locked", {
          description: "400 Bad Request: Locked: Submission has already been completed and cannot be modified.",
        });
        setSubmitting(false);
        return;
      }

      // 3. Format Candidate Answers (Shielded from client-side answer key inspection)
      const sectionAPayload = (exam.payload?.section_a?.questions || []).map((q: any) => ({
        question_id: q.id,
        answer: String(sectionAAnswers[q.id] ?? ""),
        marks_awarded: undefined,
        ai_reasoning: "Answer committed for secure institutional evaluation.",
        flagged_for_review: false,
      }));

      const sectionBPayload = (exam.payload?.section_b?.questions || []).map((q: any) => ({
        question_id: q.id,
        answer: String(sectionBAnswers[q.id] ?? ""),
        marks_awarded: undefined,
        ai_reasoning: "Answer committed for secure institutional evaluation.",
        flagged_for_review: false,
      }));

      try {
        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
        let serverScore: number | null = null;

        // Secure Server-side Evaluation & Immutability Verification via API
        if (isOnline) {
          try {
            const apiRes = await fetch("/api/submissions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-role": "trainee",
                "x-user-id": user?.id || `trainee-${regNo.replace(/[^a-zA-Z0-9]/g, "")}`,
                "x-user-reg": regNo,
              },
              body: JSON.stringify({
                exam_id: exam.id,
                section_a: sectionAPayload,
                section_b: sectionBPayload,
              }),
            });

            if (!apiRes.ok) {
              const errData = await apiRes.json().catch(() => ({}));
              if (apiRes.status === 400) {
                throw new Error(errData.error || "400 Bad Request: Locked: Submission has already been completed and cannot be modified");
              } else if (apiRes.status === 403) {
                throw new Error(errData.error || "403 Forbidden: Exam submission window has expired");
              }
            } else {
              const apiData = await apiRes.json();
              if (typeof apiData.score === "number") {
                serverScore = apiData.score;
              }
            }
          } catch (apiErr: any) {
            if (apiErr.message?.includes("Locked") || apiErr.message?.includes("expired")) {
              throw apiErr;
            }
            console.warn("Express submission endpoint fallback:", apiErr);
          }
        }

        const payload = {
          exam_id: exam.id,
          unit_code: exam.unit_code,
          student_name: student.name.trim(),
          reg_number: regNo,
          student_email: student.email.trim().toLowerCase(),
          section_a: sectionAPayload,
          section_b: sectionBPayload,
          status: "submitted" as const,
          total_score: serverScore,
        };

        const id = nanoid();
        setSubmissionId(id);
        
        submitExam(payload);

        // 1. Buffer submission in IndexedDB offline store
        await saveSubmissionToOffline({
          id,
          unit_code: payload.unit_code,
          student_name: payload.student_name,
          reg_number: payload.reg_number,
          student_email: payload.student_email,
          section_a: payload.section_a,
          section_b: payload.section_b,
          status: payload.status,
          total_score: payload.total_score ?? undefined,
          created_at: Date.now(),
          updated_at: Date.now(),
          synced: isOnline,
        });

        // 2. Queue background sync action for Supabase upload
        await enqueueSyncItem("SUBMISSION_SUBMIT", {
          id,
          ...payload,
        });

        // 3. Trigger immediate queue flush if connected
        syncEngine.flushQueue();

        console.log("✅ [MTTI Portal] Submission buffered & queued:", id);

        resetTimer();
        localStorage.removeItem(`mtti_exam_answers_${exam.unit_code}`);
        setState("submitted");
        if (!autoSubmit) {
          if (isOnline) {
            toast.success("Exam Submitted!", { description: "Your answers have been uploaded to MTTI servers." });
          } else {
            toast.success("Exam Saved Locally!", {
              description: "Campus network disconnected. Your answers are buffered and will automatically upload when reconnected.",
            });
          }
        }
      } catch (err: any) {
        console.error("❌ [MTTI Portal] Submission error:", err);
        toast.error("Submission Failed", { description: err.message + " — Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [exam, student, sectionAAnswers, sectionBAnswers, submitting, resetTimer]
  );

  // ── Save answers to localStorage & IndexedDB (offline resilience) ────
  useEffect(() => {
    if (exam && state === "exam") {
      localStorage.setItem(
        `mtti_exam_answers_${exam.unit_code}`,
        JSON.stringify({ sectionAAnswers, sectionBAnswers })
      );

      // Auto-save draft into IndexedDB
      saveSubmissionToOffline({
        id: `draft_${exam.unit_code}_${student.regNumber.trim().toUpperCase() || "anon"}`,
        unit_code: exam.unit_code,
        student_name: student.name,
        reg_number: student.regNumber.trim().toUpperCase(),
        student_email: student.email,
        section_a: Object.entries(sectionAAnswers).map(([k, v]) => ({ question_id: k, answer: String(v) })),
        section_b: Object.entries(sectionBAnswers).map(([k, v]) => ({ question_id: k, answer: String(v) })),
        status: "draft",
        created_at: Date.now(),
        updated_at: Date.now(),
        synced: false,
      });
    }
  }, [sectionAAnswers, sectionBAnswers, exam, state, student]);

  // ── Restore answers from localStorage or IndexedDB ────────────────────
  useEffect(() => {
    if (exam && state === "exam") {
      const stored = localStorage.getItem(`mtti_exam_answers_${exam.unit_code}`);
      if (stored) {
        try {
          const { sectionAAnswers: a, sectionBAnswers: b } = JSON.parse(stored);
          if (a) setSectionAAnswers(a);
          if (b) setSectionBAnswers(b);
          return;
        } catch (e) {}
      }

      // Check IndexedDB draft store
      getDraftSubmissionFromOffline(exam.unit_code, student.regNumber).then((draft) => {
        if (draft) {
          const aMap: Record<string, any> = {};
          (draft.section_a || []).forEach((item: any) => {
            if (item.question_id) aMap[item.question_id] = item.answer;
          });
          const bMap: Record<string, string> = {};
          (draft.section_b || []).forEach((item: any) => {
            if (item.question_id) bMap[item.question_id] = item.answer;
          });
          if (Object.keys(aMap).length > 0) setSectionAAnswers(aMap);
          if (Object.keys(bMap).length > 0) setSectionBAnswers(bMap);
        }
      });
    }
  }, [exam, state, student.regNumber]);

  const answeredA = Object.keys(sectionAAnswers).filter(
    (k) => sectionAAnswers[k] !== "" && sectionAAnswers[k] !== undefined
  ).length;
  const answeredB = Object.keys(sectionBAnswers).filter(
    (k) => sectionBAnswers[k]?.trim()
  ).length;
  const totalQuestions =
    (exam?.payload?.section_a?.questions?.length ?? 0) +
    (exam?.payload?.section_b?.questions?.length ?? 0);
  const totalAnswered = answeredA + answeredB;
  const progress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

  // ─────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <PortalShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "oklch(0.72 0.18 160)" }} />
          <p className="text-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
            Loading exam for {unitCode}...
          </p>
        </div>
      </PortalShell>
    );
  }

  if (state === "not_found") {
    return (
      <PortalShell>
        <div className="max-w-4xl mx-auto py-8 space-y-6">
          <div className="text-center space-y-2 mb-6">
            <span className="px-3 py-1 text-xs font-bold font-mono rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              OFFICIAL EXAMINATION PORTAL
            </span>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
              Available Online Examinations
            </h2>
            <p className="text-xs" style={{ color: "oklch(0.58 0.012 240)" }}>
              Select your scheduled assessment paper below to register and launch the test runner.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((ex) => (
              <div
                key={ex.id || ex.unit_code}
                className="glass-card p-5 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {ex.unit_code}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {ex.payload?.duration_minutes ?? 120} Mins • {ex.payload?.total_marks ?? 70} Marks
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-1">
                    {ex.payload?.title || ex.course_name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {ex.payload?.instructions || "Section A (30 Marks compulsory) and Section B (40 Marks structured questions)."}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Class: {ex.payload?.class || "L5/6 Combined"}
                  </span>
                  <button
                    onClick={() => {
                      setExam(ex);
                      setState(ex.payload?.type === "practical" ? "practical" : "registration");
                    }}
                    className="btn-emerald px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    Select Exam
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PortalShell>
    );
  }

  if (state === "error") {
    return (
      <PortalShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="w-12 h-12" style={{ color: "oklch(0.65 0.22 25)" }} />
          <h2 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
            Connection Error
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
            Could not connect to the exam server. Please check your internet connection.
          </p>
          <button onClick={loadExam} className="btn-emerald px-6 py-2 rounded-xl text-sm">
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  if (state === "submitted") {
    return (
      <PortalShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-6 text-center"
        >
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(196, 136, 32, 0.15)", border: "2px solid #c48820" }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "#c48820" }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Exam Submitted!
            </h2>
            <p className="text-sm mb-1" style={{ color: "oklch(0.72 0.18 160)" }}>
              {student.name}
            </p>
            <p className="text-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
              Your answers for <strong>{exam?.unit_code}</strong> have been recorded.
            </p>
          </motion.div>
          {submissionId && (
            <div
              className="px-4 py-3 rounded-xl text-xs font-mono"
              style={{
                background: "oklch(1 0 0 / 0.05)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                color: "oklch(0.58 0.012 240)",
              }}
            >
              Reference: {submissionId}
            </div>
          )}
          <p className="text-xs max-w-sm" style={{ color: "oklch(0.45 0.010 240)" }}>
            Your trainer will grade your submission and results will be communicated through official channels.
          </p>
        </motion.div>
      </PortalShell>
    );
  }

    if (state === "practical" && exam) {
    const checklist = exam.payload.checklist_items || [];
    return (
      <PortalShell>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto py-8 space-y-6"
        >
          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full" style={{ background: "rgba(196, 136, 32, 0.15)", color: "#c48820" }}>
                  FORMATIVE PRACTICAL ASSESSMENT
                </span>
                <h2 className="text-xl font-bold mt-2" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
                  {exam.payload.title}
                </h2>
                <p className="text-xs mt-1" style={{ color: "oklch(0.58 0.012 240)" }}>
                  {exam.unit_code} — {exam.course_name} | Class: ADMIN5/6/J/26
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>Duration</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "oklch(0.94 0.005 240)" }}>{exam.payload.duration_minutes} Mins</div>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>Total Marks</div>
                  <div className="text-sm font-bold font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>{exam.payload.total_marks} Marks</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-6 text-sm leading-relaxed" style={{ background: "rgba(0, 9, 83, 0.5)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "oklch(0.80 0.008 240)" }}>
              <p className="font-bold mb-1" style={{ color: "#c48820" }}>Project Brief & Candidate Instructions:</p>
              {exam.payload.instructions}
            </div>

            {/* Observation Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: "oklch(0.94 0.005 240)" }}>
                  Observation Checklist ({checklist.length} Evaluation Items)
                </h3>
                <span className="text-xs font-mono" style={{ color: "oklch(0.50 0.010 240)" }}>
                  CDACC Compliant (10–25 Bounds)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid oklch(1 0 0 / 0.08)" }}>
                <table className="w-full text-xs text-left">
                  <thead style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.72 0.18 160)" }}>
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Task / Performance Criteria</th>
                      <th className="p-3">Critical Aspect Mapping</th>
                      <th className="p-3 text-right">Max Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {checklist.map((item: any, idx: number) => (
                      <tr key={item.id || idx} style={{ background: idx % 2 === 0 ? "transparent" : "oklch(1 0 0 / 0.02)" }}>
                        <td className="p-3 font-mono font-bold" style={{ color: "oklch(0.50 0.010 240)" }}>{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-semibold" style={{ color: "oklch(0.94 0.005 240)" }}>{item.task}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "oklch(0.70 0.008 240)" }}>{item.criteria}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]" style={{ color: "oklch(0.65 0.15 200)" }}>{item.critical_aspect}</td>
                        <td className="p-3 text-right font-mono font-bold" style={{ color: "oklch(0.72 0.18 160)" }}>{item.marks}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-4">
              <p className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                Practical evidence and printouts are collected and graded by the certified trainer.
              </p>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex items-center gap-2"
                style={{ background: "#c48820", color: "#ffffff" }}
              >
                Print Assessment Tool / Checklist
              </button>
            </div>
          </div>
        </motion.div>
      </PortalShell>
    );
  }

  if (state === "registration") {
    return (
      <PortalShell>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto py-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.72 0.18 160 / 0.15)" }}
              >
                <User className="w-5 h-5" style={{ color: "oklch(0.72 0.18 160)" }} />
              </div>
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
                >
                  Student Registration
                </h2>
                <p className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                  {exam?.unit_code} — {exam?.course_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                  Full Name *
                </label>
                <input
                  value={student.name}
                  onChange={(e) => setStudent((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Alice Wanjiku Kamau"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                  Registration Number *
                </label>
                <input
                  value={student.regNumber}
                  onChange={(e) => setStudent((s) => ({ ...s, regNumber: e.target.value }))}
                  placeholder="e.g. MTTI/2024/001"
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.58 0.012 240)" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={student.email}
                  onChange={(e) => setStudent((s) => ({ ...s, email: e.target.value }))}
                  placeholder="e.g. alice.kamau@example.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!student.name.trim() || !student.regNumber.trim() || !student.email.trim()) {
                  toast.error("Please fill in all fields");
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
                  toast.error("Please enter a valid email address");
                  return;
                }
                setState("instructions");
              }}
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#c48820", color: "#fff" }}
            >
              Continue to Instructions
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </PortalShell>
    );
  }

  if (state === "instructions") {
    return (
      <PortalShell>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto py-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6" style={{ color: "oklch(0.72 0.18 160)" }} />
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
              >
                {exam?.payload.title}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Duration", value: `${exam?.payload.duration_minutes} min`, icon: Clock },
                { label: "Total Marks", value: `${exam?.payload.total_marks}`, icon: Award },
                { label: "Sections", value: "A + B", icon: BookOpen },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)" }}
                >
                  <item.icon className="w-4 h-4 mx-auto mb-1" style={{ color: "oklch(0.72 0.18 160)" }} />
                  <div className="text-sm font-bold font-mono" style={{ color: "oklch(0.94 0.005 240)" }}>
                    {item.value}
                  </div>
                  <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div
              className="p-4 rounded-xl mb-4 text-sm leading-relaxed"
              style={{
                background: "oklch(0.72 0.18 160 / 0.08)",
                border: "1px solid oklch(0.72 0.18 160 / 0.2)",
                color: "oklch(0.80 0.008 240)",
              }}
            >
              <p className="font-bold mb-2" style={{ color: "oklch(0.72 0.18 160)" }}>
                General Instructions:
              </p>
              {exam?.payload.instructions}
            </div>

            <div className="space-y-2 mb-6 text-xs" style={{ color: "oklch(0.58 0.012 240)" }}>
              {exam?.payload.section_a && <p>• <strong>Section A:</strong> {exam?.payload.section_a.instructions}</p>}
              {exam?.payload.section_b && <p>• <strong>Section B:</strong> {exam?.payload.section_b.instructions}</p>}
              <p>• Your answers are saved automatically as you type.</p>
              <p>• The timer starts when you click "Start Exam" and cannot be paused.</p>
            </div>

            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-6 text-xs"
              style={{
                background: "oklch(0.75 0.14 80 / 0.1)",
                border: "1px solid oklch(0.75 0.14 80 / 0.25)",
                color: "oklch(0.75 0.14 80)",
              }}
            >
              <Shield className="w-4 h-4 shrink-0" />
              Attempting as: <strong>{student.name}</strong> ({student.regNumber})
            </div>

            <button
              onClick={() => {
                setState("exam");
                startTimer();
              }}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#c48820", color: "#fff" }}
            >
              <Timer className="w-4 h-4" />
              Start Exam — Timer Begins Now
            </button>
          </div>
        </motion.div>
      </PortalShell>
    );
  }

  // ── EXAM STATE ────────────────────────────────────────────
  if (state === "exam" && exam) {
    const isInSectionA = currentSection === "a";
    const questions = isInSectionA
      ? (exam.payload?.section_a?.questions || [])
      : (exam.payload?.section_b?.questions || []);
    const currentQ = questions[currentQIndex];

    return (
      <div
        className="min-h-screen"
        style={{ background: "#000953" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-4 py-3 flex items-center gap-4"
          style={{
            background: "#000953ee",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: "oklch(0.94 0.005 240)", fontFamily: "Syne, sans-serif" }}>
              {exam.unit_code} — {exam.course_name}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              {student.name} · {student.regNumber}
            </div>
          </div>

          {/* Timer */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold"
            style={{
              background: isCritical
                ? "oklch(0.65 0.22 25 / 0.2)"
                : isWarning
                ? "oklch(0.75 0.14 80 / 0.15)"
                : "oklch(0.72 0.18 160 / 0.12)",
              border: isCritical
                ? "1px solid oklch(0.65 0.22 25 / 0.4)"
                : isWarning
                ? "1px solid oklch(0.75 0.14 80 / 0.3)"
                : "1px solid oklch(0.72 0.18 160 / 0.25)",
              color: isCritical
                ? "oklch(0.65 0.22 25)"
                : isWarning
                ? "oklch(0.75 0.14 80)"
                : "oklch(0.72 0.18 160)",
            }}
          >
            <Clock className="w-4 h-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          {/* Progress */}
          <div className="text-xs font-mono" style={{ color: "oklch(0.58 0.012 240)" }}>
            {totalAnswered}/{totalQuestions}
          </div>
        </header>

        {/* Timer Progress bar */}
        <div className="h-1.5 w-full" style={{ background: "rgba(0, 0, 0, 0.3)" }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(secondsLeft / ((exam.payload?.duration_minutes ?? 90) * 60)) * 100}%`,
              background: isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#c48820",
            }}
          />
        </div>

        {/* Form Progress bar */}
        <div className="h-0.5" style={{ background: "oklch(1 0 0 / 0.06)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "#c48820",
            }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Section tabs */}
          <div className="flex gap-2 mb-4">
            {(["a", "b"] as const).map((sec) => {
              const secLabel = sec === "a" ? "Section A (Theory/Concepts)" : "Section B (Structured Practical)";
              const secQuestions = sec === "a" ? (exam.payload?.section_a?.questions || []) : (exam.payload?.section_b?.questions || []);
              const secAnswered = sec === "a"
                ? Object.keys(sectionAAnswers).filter((k) => sectionAAnswers[k] !== undefined && sectionAAnswers[k] !== "").length
                : Object.keys(sectionBAnswers).filter((k) => sectionBAnswers[k]?.trim()).length;
              return (
                <button
                  key={sec}
                  onClick={() => { setCurrentSection(sec); setCurrentQIndex(0); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: currentSection === sec ? "oklch(0.72 0.18 160 / 0.15)" : "oklch(1 0 0 / 0.05)",
                    border: currentSection === sec ? "1px solid oklch(0.72 0.18 160 / 0.4)" : "1px solid oklch(1 0 0 / 0.08)",
                    color: currentSection === sec ? "oklch(0.72 0.18 160)" : "oklch(0.58 0.012 240)",
                  }}
                >
                  {secLabel}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/20">
                    {secAnswered}/{secQuestions.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section B Notice Banner */}
          {currentSection === "b" && (
            <div className="mb-4 p-3 rounded-xl text-xs flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Section B Instructions:</strong> Answer <strong>ANY TWO</strong> questions (20 marks each). You can switch between questions below.
              </span>
            </div>
          )}

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSection}-${currentQIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="glass-card p-6 mb-4"
            >
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: "oklch(0.72 0.18 160 / 0.15)",
                    color: "oklch(0.72 0.18 160)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {currentSection.toUpperCase()}{currentQIndex + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "oklch(0.94 0.005 240)" }}>
                    {currentQ?.text}
                  </p>
                  <p className="text-xs mt-1 font-mono" style={{ color: "oklch(0.50 0.010 240)" }}>
                    {currentQ?.marks} mark{currentQ?.marks !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* MCQ Options */}
              {currentQ?.type === "mcq" && (
                <div className="space-y-2">
                  {currentQ.options?.map((opt, oi) => {
                    const isSelected = String(sectionAAnswers[currentQ.id]) === String(oi) || sectionAAnswers[currentQ.id] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setSectionAAnswers((prev) => ({ ...prev, [currentQ.id]: oi }))}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                        style={{
                          background: isSelected ? "oklch(0.72 0.18 160 / 0.12)" : "oklch(1 0 0 / 0.04)",
                          border: isSelected ? "1px solid oklch(0.72 0.18 160 / 0.5)" : "1px solid oklch(1 0 0 / 0.08)",
                          color: isSelected ? "oklch(0.94 0.005 240)" : "oklch(0.80 0.008 240)",
                        }}
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: isSelected ? "oklch(0.72 0.18 160)" : "oklch(1 0 0 / 0.08)",
                            color: isSelected ? "oklch(0.10 0.02 160)" : "oklch(0.58 0.012 240)",
                          }}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {currentQ?.type === "true_false" && (
                <div className="flex gap-3">
                  {["True", "False"].map((opt, oi) => {
                    const isSelected = sectionAAnswers[currentQ.id] === oi;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSectionAAnswers((prev) => ({ ...prev, [currentQ.id]: oi }))}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: isSelected ? "oklch(0.72 0.18 160 / 0.12)" : "oklch(1 0 0 / 0.04)",
                          border: isSelected ? "1px solid oklch(0.72 0.18 160 / 0.5)" : "1px solid oklch(1 0 0 / 0.08)",
                          color: isSelected ? "oklch(0.72 0.18 160)" : "oklch(0.80 0.008 240)",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Practical / Essay / Open-ended text */}
              {(currentQ?.type === "short_answer" || currentQ?.type === "practical" || currentQ?.type === "essay" || !currentQ?.type) && (
                <div className="space-y-2">
                  <textarea
                    value={
                      isInSectionA
                        ? (sectionAAnswers[currentQ?.id] as string ?? "")
                        : (sectionBAnswers[currentQ?.id] ?? "")
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (isInSectionA) {
                        setSectionAAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                      } else {
                        setSectionBAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                      }
                    }}
                    placeholder={
                      isInSectionA
                        ? "Write your concise answer, definition, formula, or shortcut key here..."
                        : "Type your structured response, steps, procedures, or practical explanation here (e.g. Part a, Part b...)..."
                    }
                    rows={isInSectionA ? 4 : 8}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-y"
                    style={{
                      background: "oklch(1 0 0 / 0.06)",
                      border: "1px solid oklch(1 0 0 / 0.10)",
                      color: "oklch(0.94 0.005 240)",
                      lineHeight: "1.7",
                    }}
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                    <span>{isInSectionA ? "Section A (Short Answer)" : "Section B (Practical & Structured)"}</span>
                    <span>
                      {(isInSectionA
                        ? String(sectionAAnswers[currentQ?.id] || "").length
                        : String(sectionBAnswers[currentQ?.id] || "").length)}{" "}
                      characters
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
                else if (currentSection === "b") { setCurrentSection("a"); setCurrentQIndex((exam.payload?.section_a?.questions?.length || 1) - 1); }
              }}
              disabled={currentSection === "a" && currentQIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30 transition-all"
              style={{
                background: "oklch(1 0 0 / 0.06)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                color: "oklch(0.80 0.008 240)",
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Question dots */}
            <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
              {questions.map((q, qi) => {
                const isAnswered = currentSection === "a"
                  ? sectionAAnswers[q.id] !== undefined && sectionAAnswers[q.id] !== ""
                  : sectionBAnswers[q.id]?.trim();
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(qi)}
                    className="w-6 h-6 rounded-md text-xs font-mono transition-all"
                    style={{
                      background: qi === currentQIndex
                        ? "oklch(0.72 0.18 160)"
                        : isAnswered
                        ? "oklch(0.72 0.18 160 / 0.25)"
                        : "oklch(1 0 0 / 0.08)",
                      color: qi === currentQIndex ? "oklch(0.10 0.02 160)" : "oklch(0.58 0.012 240)",
                    }}
                  >
                    {qi + 1}
                  </button>
                );
              })}
            </div>

            {currentSection === "b" && currentQIndex === questions.length - 1 ? (
              <button
                onClick={() => {
                  if (confirm("Submit your exam? This cannot be undone.")) handleSubmit();
                }}
                disabled={submitting}
                className="btn-emerald flex items-center gap-2 px-5 py-2 rounded-xl text-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (currentQIndex < questions.length - 1) setCurrentQIndex((i) => i + 1);
                  else if (currentSection === "a") { setCurrentSection("b"); setCurrentQIndex(0); }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "oklch(0.72 0.18 160 / 0.12)",
                  border: "1px solid oklch(0.72 0.18 160 / 0.3)",
                  color: "oklch(0.72 0.18 160)",
                }}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Shell wrapper for non-exam states ───────────────────────
function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#000953" }}
    >
      <header
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#c48820", border: "1px solid #d49830" }}
        >
          <img
            src="/manus-storage/mtti-logo-icon_31c70fcc.png"
            alt="MTTI"
            className="w-5 h-5 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div>
          <div className="text-sm font-bold" style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}>
            MTTI Candidate Portal
          </div>
          <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
            Mukiria Technical Training Institute
          </div>
        </div>
      </header>
      <div className="container py-4">{children}</div>
    </div>
  );
}



