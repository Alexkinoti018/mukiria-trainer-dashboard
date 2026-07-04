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
  Hash,
  Loader2,
  Shield,
  Timer,
  AlertCircle,
  Award,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS } from "@/lib/mockData";
import type { Exam, StudentAnswer } from "@/lib/supabase";
import { toast } from "sonner";
import { nanoid } from "nanoid";

type PortalState =
  | "loading"
  | "not_found"
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
function useExamTimer(durationMinutes: number, onExpire: () => void) {
  const STORAGE_KEY = `mtti_timer_${durationMinutes}`;
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { endTime } = JSON.parse(stored);
      const remaining = Math.floor((endTime - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return durationMinutes * 60;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  const startTimer = useCallback(() => {
    const endTime = Date.now() + secondsLeft * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime }));

    intervalRef.current = setInterval(() => {
      const remaining = Math.floor((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        clearInterval(intervalRef.current!);
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

  const { minutes, seconds, isWarning, isCritical, startTimer, resetTimer } = useExamTimer(
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
      if (isSupabaseConfigured()) {
        const { data, error } = await (supabase as any)
          .from("exams")
          .select("*")
          .eq("unit_code", unitCode.toUpperCase())
          .single();

        if (error || !data) {
          console.warn("⚠️ [MTTI Portal] Exam not found:", unitCode);
          setState("not_found");
          return;
        }
        setExam(data as Exam);
        console.log("✅ [MTTI Portal] Exam loaded:", data.unit_code, data.course_name);
      } else {
        // Demo mode
        const mockExam = MOCK_EXAMS.find(
          (e) => e.unit_code.toUpperCase() === unitCode.toUpperCase()
        );
        if (!mockExam) {
          setState("not_found");
          return;
        }
        setExam(mockExam);
        console.log("ℹ️ [MTTI Portal] Demo exam loaded:", mockExam.unit_code);
      }
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

      const sectionAPayload: StudentAnswer[] = exam.payload.section_a.questions.map((q) => ({
        question_id: q.id,
        answer: sectionAAnswers[q.id] ?? "",
        marks_awarded: undefined,
      }));

      const sectionBPayload: StudentAnswer[] = exam.payload.section_b.questions.map((q) => ({
        question_id: q.id,
        answer: sectionBAnswers[q.id] ?? "",
        marks_awarded: undefined,
      }));

      const payload = {
        unit_code: exam.unit_code,
        student_name: student.name.trim(),
        reg_number: student.regNumber.trim().toUpperCase(),
        student_email: student.email.trim().toLowerCase(),
        section_a: sectionAPayload,
        section_b: sectionBPayload,
        status: "pending" as const,
        total_score: null,
      };

      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await (supabase as any)
            .from("submissions")
            .insert(payload)
            .select("id")
            .single();

          if (error) throw error;
          setSubmissionId(data?.id ?? nanoid());
          console.log("✅ [MTTI Portal] Submission saved:", data?.id);
        } else {
          const id = nanoid();
          setSubmissionId(id);
          console.log("ℹ️ [MTTI Portal] Demo submission (not saved to DB):", id);
        }

        resetTimer();
        localStorage.removeItem(`mtti_exam_answers_${exam.unit_code}`);
        setState("submitted");
        if (!autoSubmit) {
          toast.success("Exam Submitted!", { description: "Your answers have been recorded." });
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

  // ── Save answers to localStorage (offline resilience) ────
  useEffect(() => {
    if (exam && state === "exam") {
      localStorage.setItem(
        `mtti_exam_answers_${exam.unit_code}`,
        JSON.stringify({ sectionAAnswers, sectionBAnswers })
      );
    }
  }, [sectionAAnswers, sectionBAnswers, exam, state]);

  // ── Restore answers from localStorage ────────────────────
  useEffect(() => {
    if (exam && state === "exam") {
      const stored = localStorage.getItem(`mtti_exam_answers_${exam.unit_code}`);
      if (stored) {
        const { sectionAAnswers: a, sectionBAnswers: b } = JSON.parse(stored);
        if (a) setSectionAAnswers(a);
        if (b) setSectionBAnswers(b);
      }
    }
  }, [exam, state]);

  const answeredA = Object.keys(sectionAAnswers).filter(
    (k) => sectionAAnswers[k] !== "" && sectionAAnswers[k] !== undefined
  ).length;
  const answeredB = Object.keys(sectionBAnswers).filter(
    (k) => sectionBAnswers[k]?.trim()
  ).length;
  const totalQuestions =
    (exam?.payload.section_a.questions.length ?? 0) +
    (exam?.payload.section_b.questions.length ?? 0);
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
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertTriangle className="w-12 h-12" style={{ color: "oklch(0.75 0.14 80)" }} />
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Exam Not Found
          </h2>
          <p className="text-sm max-w-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
            No exam found for unit code <strong className="font-mono">{unitCode || "(none)"}</strong>.
            Please check the URL or contact your trainer.
          </p>
          <p className="text-xs" style={{ color: "oklch(0.45 0.010 240)" }}>
            Try: <span className="font-mono">/exam?unitCode=COMP-204</span>
          </p>
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
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center emerald-pulse"
            style={{ background: "oklch(0.72 0.18 160 / 0.15)", border: "2px solid oklch(0.72 0.18 160 / 0.5)" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "oklch(0.72 0.18 160)" }} />
          </div>
          <div>
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
          </div>
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
              className="btn-emerald w-full mt-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
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
              <p>• <strong>Section A:</strong> {exam?.payload.section_a.instructions}</p>
              <p>• <strong>Section B:</strong> {exam?.payload.section_b.instructions}</p>
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
              className="btn-emerald w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
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
      ? exam.payload.section_a.questions
      : exam.payload.section_b.questions;
    const currentQ = questions[currentQIndex];

    return (
      <div
        className="min-h-screen"
        style={{ background: "oklch(0.13 0.015 240)" }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-4 py-3 flex items-center gap-4"
          style={{
            background: "oklch(0.11 0.015 240 / 0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid oklch(1 0 0 / 0.08)",
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

        {/* Progress bar */}
        <div className="h-1" style={{ background: "oklch(1 0 0 / 0.06)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "oklch(0.72 0.18 160)",
            }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Section tabs */}
          <div className="flex gap-2 mb-5">
            {(["a", "b"] as const).map((sec) => {
              const secLabel = sec === "a" ? "Section A" : "Section B";
              const secQuestions = sec === "a" ? exam.payload.section_a.questions : exam.payload.section_b.questions;
              const secAnswered = sec === "a"
                ? Object.keys(sectionAAnswers).filter((k) => sectionAAnswers[k] !== "").length
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
                  <span className="text-xs font-mono">
                    {secAnswered}/{secQuestions.length}
                  </span>
                </button>
              );
            })}
          </div>

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
                  <p className="text-sm leading-relaxed" style={{ color: "oklch(0.94 0.005 240)" }}>
                    {currentQ?.text}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.50 0.010 240)" }}>
                    {currentQ?.marks} mark{currentQ?.marks !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* MCQ Options */}
              {currentQ?.type === "mcq" && (
                <div className="space-y-2">
                  {currentQ.options?.map((opt, oi) => {
                    const isSelected = sectionAAnswers[currentQ.id] === oi;
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

              {/* Short Answer */}
              {currentQ?.type === "short_answer" && (
                <textarea
                  value={sectionBAnswers[currentQ.id] ?? ""}
                  onChange={(e) =>
                    setSectionBAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                  }
                  placeholder="Write your answer here..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    color: "oklch(0.94 0.005 240)",
                    lineHeight: "1.7",
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
                else if (currentSection === "b") { setCurrentSection("a"); setCurrentQIndex(exam.payload.section_a.questions.length - 1); }
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
      style={{ background: "oklch(0.13 0.015 240)" }}
    >
      <header
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.72 0.18 160 / 0.15)", border: "1px solid oklch(0.72 0.18 160 / 0.4)" }}
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


