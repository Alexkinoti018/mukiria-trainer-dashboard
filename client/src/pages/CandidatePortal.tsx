/**
 * Candidate Portal — Student Exam Interface
 * Design: Institutional Glassmorphism (lighter variant for students)
 * Features: Dynamic exam loader, offline-resilient timer, secure submission
 * URL: /exam?unitCode=061155101A
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  Lock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useExam, sanitizeExamForStudent, generateSubmissionHash } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";
import { MOCK_EXAMS } from "@/lib/mockData";
import { evaluateExamPortalAvailability, type Exam, type Submission } from "@/lib/supabase";
import { getCanonicalAssessmentTitle } from "@/lib/assessmentTaxonomy";
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
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { EXAM_THEME_TOKENS } from "@/lib/examThemeTokens";

type PortalState =
  | "loading"
  | "not_found"
  | "practical"
  | "registration"
  | "instructions"
  | "exam"
  | "submitted"
  | "locked"
  | "error";

interface StudentInfo {
  name: string;
  regNumber: string;
  cohortCode?: string;
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



interface ExamAnswersDraft {
  sectionAAnswers: Record<string, number | string>;
  sectionBAnswers: Record<string, string>;
}

export function formatSubPart(sp: any): string {
  if (!sp) return "";
  if (typeof sp === "string") return sp;
  if (typeof sp === "object") {
    const part = sp.part ? `${sp.part}) ` : "";
    const prompt = sp.prompt || sp.text || sp.title || "";
    const marks = sp.marks ? ` (${sp.marks} ${sp.marks === 1 ? "Mark" : "Marks"})` : "";
    return `${part}${prompt}${marks}`.trim();
  }
  return String(sp);
}

// ─── Unobtrusive Draft Status Badge Component ────────────────
function DraftStatusBadge({
  isSaving,
  lastSaved,
  isOnline,
}: {
  isSaving: boolean;
  lastSaved: Date | null;
  isOnline: boolean;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24",
        }}
        title="Offline Mode: Your answers are safely cached on this device"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>Offline - draft cached locally</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold animate-pulse"
        style={{
          background: "rgba(59, 130, 246, 0.15)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          color: "#93c5fd",
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
        <span>Saving draft...</span>
      </div>
    );
  }

  if (lastSaved) {
    const diffSec = Math.max(0, Math.floor((now - lastSaved.getTime()) / 1000));
    const timeLabel =
      diffSec < 3
        ? "just now"
        : diffSec < 60
        ? `${diffSec}s ago`
        : lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <div
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          color: "#6ee7b7",
        }}
        title={`Draft auto-saved at ${lastSaved.toLocaleTimeString()}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Draft saved ({timeLabel})</span>
      </div>
    );
  }

  return null;
}

export function doesSubMatchTargetExam(sub: Submission | null | undefined, targetExam: Exam | null | undefined): boolean {
  if (!sub || !targetExam) return false;
  // If exam_id is specified on both, strict match
  if (sub.exam_id && targetExam.id) {
    return sub.exam_id === targetExam.id;
  }
  // If task_code is specified on both, strict match
  const subTask = (sub.task_code || "").trim().toUpperCase();
  const examTask = (targetExam.payload?.task_code || "").trim().toUpperCase();
  if (subTask && examTask) {
    return subTask === examTask;
  }
  // If neither has distinct exam_id or task_code (legacy fallback), match unit_code
  if (!sub.exam_id && !targetExam.id && !subTask && !examTask) {
    return (sub.unit_code || "").trim().toUpperCase() === (targetExam.unit_code || "").trim().toUpperCase();
  }
  return false;
}

export default function CandidatePortal() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const unitCode = params.get("unitCode") ?? params.get("unit") ?? "";
  const examId = params.get("examId") ?? params.get("exam_id") ?? params.get("id") ?? "";
  const { exams, submissions, submitExam } = useExam();
  const { user } = useAuth();
  const allAvailableExams: Exam[] = (exams || []).filter((ex) => ex.payload?.portal_visible === true);

  const [state, setState] = useState<PortalState>("loading");
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<StudentInfo>({ name: "", regNumber: "" });
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedCohort, setVerifiedCohort] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<"a" | "b">("a");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [lockedSubmission, setLockedSubmission] = useState<Submission | null>(null);
  const [isExpandedTextarea, setIsExpandedTextarea] = useState(false);

  const getWordCount = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, []);

  // Strictly bind authenticated trainee identity so trainees cannot impersonate another candidate
  useEffect(() => {
    if (user && user.role === "trainee" && user.reg_number) {
      setStudent({
        name: user.name,
        regNumber: user.reg_number,
        cohortCode: user.cohort_code || "Active Cohort",
      });
      setIsVerified(true);
      setVerifiedCohort(user.cohort_code || "Active Cohort");
      setVerificationError(null);
    }
  }, [user]);

  // Scoped key format: mtti_exam_answers_${exam.id}_${traineeId || 'anonymous'}
  const traineeId = user?.id || student.regNumber.trim().toUpperCase() || "anonymous";
  const draftStorageKey = exam ? `mtti_exam_answers_${exam.id}_${traineeId}` : "";
  const isWindowExpired = Boolean(
    exam?.payload?.end_time && new Date() > new Date(exam.payload.end_time)
  );

  const {
    data: answersDraft,
    setData: setAnswersDraft,
    isSaving: isDraftSaving,
    lastSaved: draftLastSaved,
    clearDraft,
  } = useAutoDraft<ExamAnswersDraft>(
    draftStorageKey,
    { sectionAAnswers: {}, sectionBAnswers: {} },
    1000,
    {
      enabled: state === "exam" && !submitting && !isWindowExpired,
      onSave: (savedDraft) => {
        if (exam && state === "exam") {
          saveSubmissionToOffline({
            id: `draft_${exam.unit_code}_${student.regNumber.trim().toUpperCase() || "anon"}`,
            unit_code: exam.unit_code,
            student_name: student.name,
            reg_number: student.regNumber.trim().toUpperCase(),
            section_a: Object.entries(savedDraft.sectionAAnswers).map(([k, v]) => ({ question_id: k, answer: String(v) })),
            section_b: Object.entries(savedDraft.sectionBAnswers).map(([k, v]) => ({ question_id: k, answer: String(v) })),
            status: "draft",
            created_at: Date.now(),
            updated_at: Date.now(),
            synced: false,
          }).catch((err) => console.warn("Failed to buffer draft in IndexedDB:", err));
        }
      },
    }
  );

  const sectionAAnswers = answersDraft.sectionAAnswers;
  const sectionBAnswers = answersDraft.sectionBAnswers;

  const setSectionAAnswers = useCallback(
    (action: React.SetStateAction<Record<string, number | string>>) => {
      setAnswersDraft((prev) => {
        const nextA = typeof action === "function" ? action(prev.sectionAAnswers) : action;
        const nextDraft = {
          ...prev,
          sectionAAnswers: nextA,
        };
        // Immediate synchronous write to ensure zero answer loss on refresh or network interruption
        if (exam) {
          const traineeCandidateId = user?.id || student.regNumber.trim().toUpperCase() || "anonymous";
          try {
            const serialized = JSON.stringify(nextDraft);
            localStorage.setItem(`mtti_exam_answers_${exam.id}_${traineeCandidateId}`, serialized);
            localStorage.setItem(`mtti_exam_answers_${exam.unit_code}_${traineeCandidateId}`, serialized);
            localStorage.setItem(`mtti_exam_answers_${exam.unit_code}`, serialized);
            if (exam.id) localStorage.setItem(`mtti_exam_answers_${exam.id}`, serialized);
          } catch (e) {}
        }
        return nextDraft;
      });
    },
    [setAnswersDraft, exam, user, student.regNumber]
  );

  const setSectionBAnswers = useCallback(
    (action: React.SetStateAction<Record<string, string>>) => {
      setAnswersDraft((prev) => {
        const nextB = typeof action === "function" ? action(prev.sectionBAnswers) : action;
        const nextDraft = {
          ...prev,
          sectionBAnswers: nextB,
        };
        // Immediate synchronous write to ensure zero answer loss on refresh or network interruption
        if (exam) {
          const traineeCandidateId = user?.id || student.regNumber.trim().toUpperCase() || "anonymous";
          try {
            const serialized = JSON.stringify(nextDraft);
            localStorage.setItem(`mtti_exam_answers_${exam.id}_${traineeCandidateId}`, serialized);
            localStorage.setItem(`mtti_exam_answers_${exam.unit_code}_${traineeCandidateId}`, serialized);
            localStorage.setItem(`mtti_exam_answers_${exam.unit_code}`, serialized);
            if (exam.id) localStorage.setItem(`mtti_exam_answers_${exam.id}`, serialized);
          } catch (e) {}
        }
        return nextDraft;
      });
    },
    [setAnswersDraft, exam, user, student.regNumber]
  );

  // Synchronously persist ongoing exam session state so accidental refresh retains candidate & timer
  useEffect(() => {
    if (exam && state === "exam" && student.name && student.regNumber) {
      try {
        localStorage.setItem(
          `mtti_active_exam_session_${exam.unit_code}`,
          JSON.stringify({
            state: "exam",
            unitCode: exam.unit_code,
            examId: exam.id,
            student,
            currentSection,
            currentQIndex,
            timestamp: Date.now(),
          })
        );
      } catch (e) {}
    }
  }, [exam, state, student, currentSection, currentQIndex]);

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
    if (!unitCode && !examId) {
      setState("not_found");
      return;
    }
    loadExam();
  }, [unitCode, examId]);

  const loadExam = async () => {
    setState("loading");
    try {
      let foundExam: Exam | undefined;

      // 1. If explicit examId is provided, look up by exact ID first
      if (examId) {
        foundExam = allAvailableExams.find((e) => e.id === examId);
        if (!foundExam) {
          const cached = await getExamFromOffline(examId);
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
          foundExam = (MOCK_EXAMS as Exam[]).find((e) => e.id === examId);
        }
      }

      // 2. If no examId or exam not found by ID, fall back to unitCode
      if (!foundExam && unitCode) {
        foundExam = allAvailableExams.find((e) => e.unit_code.toUpperCase() === unitCode.toUpperCase());
        
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

        // Direct fallback to MOCK_EXAMS
        if (!foundExam) {
          foundExam = (MOCK_EXAMS as Exam[]).find((e) => e.unit_code.toUpperCase() === unitCode.toUpperCase());
        }
      }
      
      if (!foundExam) {
        setState("not_found");
        return;
      }

      const portalAvailability = evaluateExamPortalAvailability(foundExam.payload);
      if (!portalAvailability.canStart) {
        toast.warning("Assessment Portal Locked", {
          description: portalAvailability.statusLabel,
        });
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
      console.log("✅ [MTTI Portal] Exam loaded with Column Shielding:", foundExam.id || foundExam.unit_code);

      // Check if this trainee has an existing locked submission for this assessment
      const checkReg = (user?.reg_number || student.regNumber || "").trim().toUpperCase();
      if (checkReg) {
        const lockedSub = (submissions || []).find(
          (s) =>
            doesSubMatchTargetExam(s, foundExam) &&
            (s.reg_number?.toUpperCase() === checkReg || (user?.id && s.trainee_id === user.id)) &&
            s.is_locked &&
            s.status !== "reopened"
        );
        if (lockedSub) {
          setLockedSubmission(lockedSub);
          setStudent({
            name: lockedSub.student_name,
            regNumber: lockedSub.reg_number,
            cohortCode: user?.cohort_code || "Active Register",
          });
          setState("locked");
          return;
        }
      }

      // Check if candidate already has an active in-progress assessment session (refresh recovery)
      const ongoingSessionKey = `mtti_active_exam_session_${foundExam.id || foundExam.unit_code}`;
      const savedSessionRaw = localStorage.getItem(ongoingSessionKey);
      if (savedSessionRaw) {
        try {
          const savedSession = JSON.parse(savedSessionRaw);
          if (
            savedSession &&
            savedSession.state === "exam" &&
            (!savedSession.examId || savedSession.examId === foundExam.id) &&
            savedSession.student?.name &&
            savedSession.student?.regNumber
          ) {
            setStudent(savedSession.student);
            setIsVerified(true);
            setVerifiedCohort(savedSession.student.cohortCode || "Active Register");
            if (savedSession.currentSection) setCurrentSection(savedSession.currentSection);
            if (typeof savedSession.currentQIndex === "number") setCurrentQIndex(savedSession.currentQIndex);
            setState("exam");
            startTimer();
            return;
          }
        } catch (e) {}
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

      // 1. Mandatory Mod 5: Valid Exam Window & Due Date Verification
      const availability = evaluateExamPortalAvailability(exam.payload);
      if (!availability.canStart) {
        toast.error("Submission Window Closed", {
          description: `403 Forbidden: ${availability.statusLabel}. Submissions are locked.`,
        });
        setSubmitting(false);
        return;
      }
      if (exam.payload?.end_time) {
        const now = new Date();
        const endTime = new Date(exam.payload.end_time);
        if (now > endTime && exam.payload?.late_submission_policy !== "allow_flagged") {
          toast.error("Submission Window Expired", {
            description: "403 Forbidden: Exam submission window has expired and submissions are locked.",
          });
          setSubmitting(false);
          return;
        }
      }

      // 2. Mandatory Mod 5: Submission Locking & Max Attempts Verification
      const regNo = student.regNumber.trim().toUpperCase();
      const maxAttempts = availability.maxAttempts || 1;
      const priorSubs = (submissions || []).filter(
        (s) =>
          doesSubMatchTargetExam(s, exam) &&
          s.reg_number?.toUpperCase() === regNo &&
          (s.status === "submitted" || s.status === "graded")
      );
      if (state !== "exam" && priorSubs.length >= maxAttempts) {
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
            console.warn("Express submission endpoint fallback:", apiErr);
          }
        }

        const payload = {
          exam_id: exam.id,
          unit_code: exam.unit_code,
          student_name: student.name.trim(),
          reg_number: regNo,
          section_a: sectionAPayload,
          section_b: sectionBPayload,
          status: "submitted" as const,
          total_score: serverScore,
        };

        const id = nanoid();
        setSubmissionId(id);
        
        submitExam(payload);

        const nowIso = new Date().toISOString();
        const seal = generateSubmissionHash(regNo, exam.unit_code, nowIso, sectionAPayload.length + sectionBPayload.length);
        setLockedSubmission({
          ...payload,
          id,
          is_locked: true,
          attempt_count: 1,
          submission_hash: seal,
          locked_at: nowIso,
          submitted_at: nowIso,
          created_at: nowIso,
        });

        // 1. Buffer submission in IndexedDB offline store
        await saveSubmissionToOffline({
          id,
          unit_code: payload.unit_code,
          student_name: payload.student_name,
          reg_number: payload.reg_number,
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
        clearDraft();
        localStorage.removeItem(`mtti_exam_answers_${exam.unit_code}`);
        localStorage.removeItem(`mtti_active_exam_session_${exam.unit_code}`);
        if (draftStorageKey) {
          localStorage.removeItem(draftStorageKey);
        }
        if (exam.id) {
          localStorage.removeItem(`mtti_exam_answers_${exam.id}`);
        }
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
    [exam, student, sectionAAnswers, sectionBAnswers, submitting, resetTimer, clearDraft, draftStorageKey]
  );

  // ── Restore answers from multi-tier localStorage or IndexedDB if not already in draft ────
  useEffect(() => {
    if (exam && state === "exam") {
      const traineeCandidateId = user?.id || student.regNumber.trim().toUpperCase() || "anonymous";
      const keyCandidates = [
        draftStorageKey,
        `mtti_exam_answers_${exam.id}_${traineeCandidateId}`,
        `mtti_exam_answers_${exam.unit_code}_${traineeCandidateId}`,
        `mtti_exam_answers_${exam.unit_code}`,
        `mtti_exam_answers_${exam.id}`,
      ].filter(Boolean);

      let mergedA = { ...answersDraft.sectionAAnswers };
      let mergedB = { ...answersDraft.sectionBAnswers };
      let updated = false;

      for (const k of keyCandidates) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const a = parsed.sectionAAnswers || parsed.section_a;
            const b = parsed.sectionBAnswers || parsed.section_b;
            if (a && typeof a === "object") {
              if (Array.isArray(a)) {
                a.forEach((item: any) => {
                  if (item.question_id && (mergedA[item.question_id] === undefined || mergedA[item.question_id] === "")) {
                    mergedA[item.question_id] = item.answer;
                    updated = true;
                  }
                });
              } else {
                Object.entries(a).forEach(([qId, val]) => {
                  if (val !== undefined && val !== "" && (mergedA[qId] === undefined || mergedA[qId] === "")) {
                    mergedA[qId] = val as any;
                    updated = true;
                  }
                });
              }
            }
            if (b && typeof b === "object") {
              if (Array.isArray(b)) {
                b.forEach((item: any) => {
                  if (item.question_id && (mergedB[item.question_id] === undefined || mergedB[item.question_id] === "")) {
                    mergedB[item.question_id] = item.answer;
                    updated = true;
                  }
                });
              } else {
                Object.entries(b).forEach(([qId, val]) => {
                  if (val !== undefined && val !== "" && (mergedB[qId] === undefined || mergedB[qId] === "")) {
                    mergedB[qId] = val as any;
                    updated = true;
                  }
                });
              }
            }
          } catch (e) {}
        }
      }

      if (updated) {
        setAnswersDraft({
          sectionAAnswers: mergedA,
          sectionBAnswers: mergedB,
        });
      }

      // Check IndexedDB draft store
      getDraftSubmissionFromOffline(exam.unit_code, student.regNumber).then((draft) => {
        if (draft) {
          let idbUpdated = false;
          const aMap: Record<string, any> = { ...mergedA };
          (draft.section_a || []).forEach((item: any) => {
            if (item.question_id && (aMap[item.question_id] === undefined || aMap[item.question_id] === "")) {
              aMap[item.question_id] = item.answer;
              idbUpdated = true;
            }
          });
          const bMap: Record<string, string> = { ...mergedB };
          (draft.section_b || []).forEach((item: any) => {
            if (item.question_id && (bMap[item.question_id] === undefined || bMap[item.question_id] === "")) {
              bMap[item.question_id] = item.answer;
              idbUpdated = true;
            }
          });
          if (idbUpdated) {
            setAnswersDraft({
              sectionAAnswers: aMap,
              sectionBAnswers: bMap,
            });
          }
        }
      });
    }
  }, [exam, state, student.regNumber, user, draftStorageKey]);

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

  // ── Roster-Backed Trainee Verification (Dual-Phase: Offline Cache & Online API) ──
  const handleVerifyRegNo = useCallback(
    async (rawRegNo: string) => {
      const regNo = rawRegNo.trim();
      if (!regNo) {
        setVerificationError("Please enter a registration number.");
        setIsVerified(false);
        return;
      }

      setIsVerifying(true);
      setVerificationError(null);

      const normReg = regNo.toUpperCase();
      const cleanReg = normReg.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
      const coreMatch = normReg.match(/\b\d{4,6}\b/);
      const coreReg = coreMatch ? coreMatch[0] : "";
      const currentUnit = (exam?.unit_code || unitCode || "").trim().toUpperCase();
      const baseUnit = currentUnit.replace(/-(WA[1-9]|PRAC|PAPER[1-9]).*$/i, "");

      // ── PHASE A: Offline / Local Cache Resolution ──
      let offlineMatch: { name: string; classCode: string; id?: string } | null = null;

      try {
        const checkKeys = [
          `mtti_class_register_${baseUnit}`,
          `mtti_class_register_${currentUnit}`,
          "mtti_trainees",
        ];

        if (typeof localStorage !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("mtti_class_register_") && !checkKeys.includes(key)) {
              checkKeys.push(key);
            }
          }

          for (const key of checkKeys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const found = parsed.find((t: any) => {
                  const adm = (t.admNo || t.admissionNumber || t.reg_number || t.regCode || "").trim().toUpperCase();
                  const cleanAdm = adm.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
                  const admCore = (adm + " " + (t.regCode || "")).match(/\b\d{4,6}\b/)?.[0] || "";
                  const matchesCore = coreReg && admCore && coreReg === admCore;
                  return adm === normReg || cleanAdm === cleanReg || cleanAdm === normReg || adm === cleanReg || matchesCore;
                });
                if (found) {
                  offlineMatch = {
                    name: found.name || found.fullName,
                    classCode: found.classCode || found.cohortCode || "Active Register",
                    id: found.id,
                  };
                  break;
                }
              }
            } catch {
              // ignore json parse error
            }
          }
        }

        // Fallback to in-memory official roster
        if (!offlineMatch && OFFICIAL_MTTI_TRAINEES) {
          const found = OFFICIAL_MTTI_TRAINEES.find((t) => {
            const adm = (t.admNo || t.regCode || "").trim().toUpperCase();
            const cleanAdm = adm.replace(/^(ITECH\s*6\s*MOD|ICT4\s*MOD|FBS\s*[56]\s*MOD|FBP\s*6\s*MOD|LS\s*[56]\s*MOD|ADMIN\s*[56]\/?[56]?)\//i, "").trim();
            const admCore = (adm + " " + t.regCode).match(/\b\d{4,6}\b/)?.[0] || "";
            const matchesCore = coreReg && admCore && coreReg === admCore;
            return adm === normReg || cleanAdm === cleanReg || cleanAdm === normReg || adm === cleanReg || matchesCore;
          });
          if (found) {
            offlineMatch = {
              name: found.name,
              classCode: found.classCode,
              id: found.id,
            };
          }
        }
      } catch (err) {
        console.warn("Offline roster lookup error:", err);
      }

      // ── PHASE B: Online API Lookup ──
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

      if (isOnline) {
        try {
          const res = await fetch(
            `/api/trainees/lookup?regNo=${encodeURIComponent(regNo)}&unitCode=${encodeURIComponent(currentUnit)}`
          );

          const checkCandidateLock = (candidateReg: string, candidateName: string, candidateCohort: string): boolean => {
            const lockedSub = (submissions || []).find(
              (s) =>
                doesSubMatchTargetExam(s, exam) &&
                (s.reg_number?.toUpperCase() === candidateReg.toUpperCase() ||
                  s.reg_number?.toUpperCase() === normReg ||
                  s.reg_number?.toUpperCase() === cleanReg) &&
                s.is_locked &&
                s.status !== "reopened"
            );
            if (lockedSub) {
              setStudent({
                name: candidateName,
                regNumber: candidateReg,
                cohortCode: candidateCohort,
              });
              setLockedSubmission(lockedSub);
              setState("locked");
              toast.warning("Assessment Session Closed", {
                description: "This assessment has been submitted and is currently closed.",
              });
              return true;
            }
            return false;
          };

          if (res.ok) {
            const data = await res.json();
            setStudent((prev) => ({
              ...prev,
              name: data.fullName,
              regNumber: regNo,
              cohortCode: data.cohortCode,
            }));
            setIsVerified(true);
            setVerifiedCohort(data.cohortCode);
            setVerificationError(null);

            if (checkCandidateLock(regNo, data.fullName, data.cohortCode)) {
              setIsVerifying(false);
              return;
            }

            toast.success(`Verified: ${data.fullName}`, {
              description: `Verified in class register (${data.cohortCode})`,
            });
            setIsVerifying(false);
            return;
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg =
              errData.error ||
              "Registration number not found in this unit class register.";

            // If offline match exists for digital literacy or active unit, allow fallback
            if (offlineMatch) {
              setStudent((prev) => ({
                ...prev,
                name: offlineMatch!.name,
                regNumber: regNo,
                cohortCode: offlineMatch!.classCode,
              }));
              setIsVerified(true);
              setVerifiedCohort(offlineMatch.classCode);
              setVerificationError(null);

              if (checkCandidateLock(regNo, offlineMatch!.name, offlineMatch!.classCode)) {
                setIsVerifying(false);
                return;
              }

              toast.success(`Verified: ${offlineMatch.name}`, {
                description: `Verified in class register (${offlineMatch.classCode})`,
              });
              setIsVerifying(false);
              return;
            }

            setIsVerified(false);
            setVerificationError(errMsg);
            toast.error("Verification Failed", { description: errMsg });
            setIsVerifying(false);
            return;
          }
        } catch (apiErr) {
          console.warn("Online verification request error, falling back to offline match:", apiErr);
        }
      }

      // If offline or network request failed, use offlineMatch if available
      if (offlineMatch) {
        setStudent((prev) => ({
          ...prev,
          name: offlineMatch!.name,
          regNumber: regNo,
          cohortCode: offlineMatch!.classCode,
        }));
        setIsVerified(true);
        setVerifiedCohort(offlineMatch.classCode);
        setVerificationError(null);

        const lockedSub = (submissions || []).find(
          (s) =>
            doesSubMatchTargetExam(s, exam) &&
            (s.reg_number?.toUpperCase() === regNo.toUpperCase() ||
              s.reg_number?.toUpperCase() === normReg ||
              s.reg_number?.toUpperCase() === cleanReg) &&
            s.is_locked &&
            s.status !== "reopened"
        );
        if (lockedSub) {
          setLockedSubmission(lockedSub);
          setState("locked");
          toast.warning("Assessment Session Closed", {
            description: "This assessment has been submitted and is currently closed.",
          });
          setIsVerifying(false);
          return;
        }

        toast.success(`Verified (Offline): ${offlineMatch.name}`, {
          description: `Verified in class register (${offlineMatch.classCode})`,
        });
      } else {
        const errMsg = "Registration number not found in this class register. Please check with your trainer.";
        setIsVerified(false);
        setVerificationError(errMsg);
        toast.error("Verification Failed", { description: errMsg });
      }

      setIsVerifying(false);
    },
    [exam, unitCode, submissions]
  );

  const markCandidateAttendanceAttended = useCallback((traineeName: string, regNo: string) => {
    try {
      const cleanReg = regNo.trim().toUpperCase();
      const coreReg = cleanReg.match(/\b\d{4,6}\b/)?.[0] || "";
      const match = OFFICIAL_MTTI_TRAINEES.find((t) => {
        const adm = (t.admNo || t.regCode || "").trim().toUpperCase();
        const admCore = (adm + " " + (t.regCode || "")).match(/\b\d{4,6}\b/)?.[0] || "";
        return (
          adm === cleanReg ||
          (coreReg && admCore && coreReg === admCore) ||
          t.name.trim().toLowerCase() === traineeName.trim().toLowerCase()
        );
      });
      const studentId = match?.id || user?.id;
      const cohort = match?.classCode || user?.cohort_code || verifiedCohort || "FBS5/6/J/26";
      const keys = [
        `mtti_class_register_${cohort}`,
        `mtti_class_register_persisted_${cohort}`,
        "mtti_class_register_FBS5/6/J/26",
        "mtti_class_register_persisted_FBS5/6/J/26",
      ];
      if (studentId) {
        keys.forEach((k) => {
          const raw = localStorage.getItem(k);
          const parsed = raw ? JSON.parse(raw) : {};
          const rec = parsed[studentId] || { attendance: {} };
          parsed[studentId] = {
            ...rec,
            signed: true,
          };
          localStorage.setItem(k, JSON.stringify(parsed));
        });
      }
    } catch (e) {}
  }, [user, verifiedCohort]);

  const isAttendanceRecorded = useMemo(() => {
    const reg = (student.regNumber || user?.reg_number || "").trim().toUpperCase();
    if (!reg) return false;
    const coreReg = reg.match(/\b\d{4,6}\b/)?.[0] || "";
    const match = OFFICIAL_MTTI_TRAINEES.find((t) => {
      const adm = (t.admNo || t.regCode || "").trim().toUpperCase();
      const admCore = (adm + " " + (t.regCode || "")).match(/\b\d{4,6}\b/)?.[0] || "";
      return adm === reg || (coreReg && admCore && coreReg === admCore);
    });
    const studentId = match?.id || user?.id;
    const cohort = match?.classCode || user?.cohort_code || verifiedCohort || "FBS5/6/J/26";
    const keys = [
      `mtti_class_register_${cohort}`,
      `mtti_class_register_persisted_${cohort}`,
      "mtti_class_register_FBS5/6/J/26",
      "mtti_class_register_persisted_FBS5/6/J/26",
    ];
    try {
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw && studentId) {
          const parsed = JSON.parse(raw);
          if (parsed[studentId]?.signed === true) return true;
        }
      }
    } catch (e) {}
    return false;
  }, [student.regNumber, user, verifiedCohort]);

  // ─────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <PortalShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#000953]" />
          <p className="text-sm font-medium text-slate-600">
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
            <span className="px-3.5 py-1 text-xs font-bold font-mono rounded-full bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
              OFFICIAL EXAMINATION PORTAL
            </span>
            <h2 className="text-2xl font-bold text-[#000953]">
              Allocated Online Examinations & CATs
            </h2>
            <p className="text-xs text-slate-600">
              Only assessments explicitly allocated and scheduled for your cohort ({user?.cohort_code || "Official Roster"}) by your Trainer or Department appear here.
            </p>
          </div>

          {allAvailableExams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-300 p-8 text-center shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#000953]/10 border border-[#000953]/20 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#000953]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#000953]">
                  No Active Online Examination or CAT Allocated at This Time
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your Trainer or Head of Department has not published an open online examination or CAT for cohort{" "}
                  <span className="font-mono font-bold text-[#000953]">
                    {user?.cohort_code || "your class"}
                  </span>{" "}
                  yet. Unallocated assessment papers (such as CT1–CT3 and CP1–CP3) are strictly confidential and locked until scheduled.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <a
                  href="/trainee/dashboard"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Return to Trainee Dashboard
                </a>
                <a
                  href="/trainee/assignments"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition inline-flex items-center gap-1.5"
                >
                  View Portfolio & Evidence Uploads
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allAvailableExams
                .filter((ex) => ex.payload?.portal_visible === true)
                .map((ex) => {
                  const portalStatus = evaluateExamPortalAvailability(ex.payload);
                  return (
                    <div
                      key={ex.id || ex.unit_code}
                      className="bg-white rounded-2xl border border-slate-300 p-6 space-y-4 shadow-sm hover:border-[#000953] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                              {ex.unit_code}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-[#c48820] border border-amber-200">
                              {getCanonicalAssessmentTitle((ex.payload?.task_code || "CT1") as any)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono font-semibold">
                            {ex.payload?.duration_minutes ?? 120} Mins • {ex.payload?.total_marks ?? 70} Marks
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#000953] mb-1">
                          {ex.payload?.title || ex.course_name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {ex.payload?.instructions || (
                            ((ex.payload?.total_marks || 0) <= 30 || ex.payload?.assessment_category === "CAT" || (ex.payload?.task_code || "").toUpperCase().startsWith("CAT"))
                              ? `Continuous Assessment Test (${ex.payload?.total_marks || 15} Marks). Answer ALL questions in the spaces provided.`
                              : "Section A (30 Marks compulsory) and Section B (40 Marks structured questions)."
                          )}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold border ${
                              portalStatus.state === "open"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : portalStatus.state === "scheduled"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : portalStatus.state === "past_due_open"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {portalStatus.statusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          Class: {ex.payload?.class || "L5/6 Combined"}
                        </span>
                        {portalStatus.canStart ? (
                          <button
                            onClick={() => {
                              setExam(ex);
                              setState(ex.payload?.type === "practical" ? "practical" : "registration");
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition"
                          >
                            Start Assessment
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-300 cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5" />
                            {portalStatus.state === "scheduled" ? "Scheduled" : "Closed"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </PortalShell>
    );
  }

  if (state === "error") {
    return (
      <PortalShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center max-w-md mx-auto p-8 bg-white rounded-2xl border border-slate-300 shadow-md">
          <AlertCircle className="w-12 h-12 text-rose-600" />
          <h2 className="text-xl font-bold text-[#000953]">
            Connection Error
          </h2>
          <p className="text-sm text-slate-600">
            Could not connect to the exam server. Please check your internet connection.
          </p>
          <button onClick={loadExam} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition">
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
          className="flex flex-col items-center justify-center py-12 max-w-lg mx-auto p-8 bg-white rounded-2xl border border-slate-300 shadow-lg text-center"
        >
          <motion.div
            className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-emerald-600 mb-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-2 text-[#000953]">
              Examination Submitted!
            </h2>
            <p className="text-base font-semibold mb-1 text-slate-800">
              {student.name}
            </p>
            <p className="text-xs text-slate-500 font-mono mb-4">
              Reg No: {student.regNumber}
            </p>
            <p className="text-sm text-slate-600">
              Your answers for <strong className="text-[#000953]">{exam?.unit_code}</strong> have been securely recorded.
            </p>
          </motion.div>
          {submissionId && (
            <div className="mt-4 px-4 py-2.5 rounded-xl text-xs font-mono bg-slate-100 border border-slate-300 text-slate-700">
              Submission Reference: {submissionId}
            </div>
          )}
          <p className="mt-6 text-xs max-w-sm text-slate-500">
            Your certified trainer will grade your submission. Official results and marked scripts will be communicated through your student results portal.
          </p>
        </motion.div>
      </PortalShell>
    );
  }

  if (state === "locked") {
    return (
      <PortalShell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto py-10"
        >
          <div className="bg-white rounded-2xl border-2 border-[#000953] shadow-xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#000953] text-[#c48820] flex items-center justify-center shadow-lg border-2 border-[#c48820]">
              <Lock className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Assessment Session Closed
              </div>
              <h2 className="text-2xl font-black text-[#000953]">
                Submission Received & Session Closed
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {exam?.payload?.title || exam?.course_name || "Official Assessment"} ({exam?.unit_code})
              </p>
            </div>

            {/* Candidate & Verification Ledger */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Candidate Name:</span>
                <span className="font-bold text-[#000953]">{student.name || lockedSubmission?.student_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Admission / Reg Number:</span>
                <span className="font-mono font-bold text-slate-800">{student.regNumber || lockedSubmission?.reg_number}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Assessment Status:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  Submitted & Locked [Attempt #{lockedSubmission?.attempt_count || 1}]
                </span>
              </div>
              {(lockedSubmission?.locked_at || lockedSubmission?.submitted_at) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Sealed Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(lockedSubmission.locked_at || lockedSubmission.submitted_at!).toLocaleString()}
                  </span>
                </div>
              )}
              {lockedSubmission?.submission_hash && (
                <div className="flex flex-col py-1 gap-1">
                  <span className="text-slate-500 font-semibold">Institutional Digital Hash / Seal:</span>
                  <span className="font-mono text-[11px] bg-slate-200/80 px-2.5 py-1.5 rounded text-slate-800 break-all select-all border border-slate-300">
                    {lockedSubmission.submission_hash}
                  </span>
                </div>
              )}
            </div>

            {/* Core Instruction Alert */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-left text-xs text-amber-900 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#c48820] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-[#000953] mb-1">Notice to Candidate:</strong>
                This assessment has been submitted and is currently closed. If you require a retake or extension, please consult your trainer.
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/trainee/dashboard"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-md transition text-center"
              >
                Return to Trainee Dashboard
              </a>
              <a
                href="/trainee/assignments"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition text-center"
              >
                View Assignments & Evidence
              </a>
            </div>
          </div>
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
          <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 text-[#0f172a]">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                  FORMATIVE PRACTICAL ASSESSMENT
                </span>
                <h2 className="text-xl font-bold mt-2 text-[#000953]">
                  {exam.payload.title}
                </h2>
                <p className="text-xs mt-1 text-slate-600">
                  {exam.unit_code} — {exam.course_name} | Class: ADMIN5/6/J/26
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Duration</div>
                  <div className="text-sm font-bold font-mono text-[#000953]">{exam.payload.duration_minutes} Mins</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total Marks</div>
                  <div className="text-sm font-bold font-mono text-[#c48820]">{exam.payload.total_marks} Marks</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-6 text-sm leading-relaxed bg-slate-50 border border-slate-200 text-slate-800">
              <p className="font-bold mb-1 text-[#000953]">Project Brief & Candidate Instructions:</p>
              {exam.payload.instructions}
            </div>

            {/* Observation Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#000953]">
                  Observation Checklist ({checklist.length} Evaluation Items)
                </h3>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  CDACC Compliant (10–25 Bounds)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-300">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#000953] text-white">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Task / Performance Criteria</th>
                      <th className="p-3">Critical Aspect Mapping</th>
                      <th className="p-3 text-right">Max Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {checklist.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                        <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{item.task}</div>
                          <div className="text-[11px] mt-0.5 text-slate-600">{item.criteria}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#000953] font-medium">{item.critical_aspect}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#000953]">{item.marks}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-4">
              <p className="text-xs text-slate-600">
                Practical evidence and printouts are collected and graded by the certified trainer.
              </p>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm flex items-center gap-2"
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
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-lg text-slate-900">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#000953]/10 border border-[#000953]/20 text-[#000953]">
                <User className="w-5 h-5 text-[#000953]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#000953]">
                  Candidate Identification
                </h2>
                <p className="text-xs text-slate-500">
                  {exam?.unit_code} — {exam?.course_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">
                  Registration Number *
                </label>
                <div className="flex gap-2">
                  <input
                    value={student.regNumber}
                    readOnly={user?.role === "trainee"}
                    onChange={(e) => {
                      if (user?.role === "trainee") return;
                      const val = e.target.value;
                      setStudent((s) => ({ ...s, regNumber: val, name: isVerified ? "" : s.name }));
                      if (isVerified) setIsVerified(false);
                      if (verificationError) setVerificationError(null);
                    }}
                    onBlur={() => {
                      if (user?.role === "trainee") return;
                      if (student.regNumber.trim() && !isVerified) {
                        handleVerifyRegNo(student.regNumber);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (user?.role === "trainee") return;
                      if (e.key === "Enter" && student.regNumber.trim()) {
                        e.preventDefault();
                        handleVerifyRegNo(student.regNumber);
                      }
                    }}
                    placeholder="e.g. 14179/S2026 or 13254"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm font-mono bg-white border-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/20 ${
                      user?.role === "trainee" ? "bg-slate-50 cursor-not-allowed " : ""
                    }${
                      isVerified
                        ? "border-emerald-500"
                        : verificationError
                        ? "border-rose-500"
                        : "border-slate-300"
                    }`}
                  />
                  {user?.role !== "trainee" && (
                    <button
                      type="button"
                      disabled={isVerifying || !student.regNumber.trim()}
                      onClick={() => handleVerifyRegNo(student.regNumber)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 border shadow-sm ${
                        isVerified
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-[#000953] hover:bg-[#000e7a] border-[#000953] text-white"
                      }`}
                    >
                      {isVerifying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      {isVerified ? "Verified" : "Verify"}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Badge: Verified in Class Register */}
              {isVerified && (
                <div className="p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Verified in class register ({student.cohortCode || verifiedCohort || "Active Cohort"})</span>
                </div>
              )}

              {/* Status Alert: Not Found */}
              {verificationError && (
                <div className="p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold bg-rose-50 border border-rose-300 text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700">
                  Candidate Full Name *
                </label>
                <input
                  readOnly
                  value={student.name}
                  placeholder="Auto-filled upon verification"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 border border-slate-300 text-slate-800 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              disabled={!isVerified || !student.name.trim()}
              onClick={() => {
                if (!isVerified || !student.name.trim()) {
                  toast.error("Please verify your registration number first");
                  return;
                }
                setState("instructions");
              }}
              className="w-full mt-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#000953] hover:bg-[#000e7a] text-white active:scale-[0.98] shadow-md"
            >
              Continue to Instructions
              <ChevronRight className="w-4 h-4 text-[#c48820]" />
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
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-lg text-slate-900">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#000953]/10 text-[#000953]">
                <BookOpen className="w-5 h-5 text-[#000953]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#000953]">
                  {exam?.payload.title}
                </h2>
                <p className="text-xs text-slate-500">
                  Official Examination Guidelines & Rules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3.5 mb-6">
              {[
                { label: "Duration", value: `${exam?.payload.duration_minutes} min`, icon: Clock },
                { label: "Total Marks", value: `${exam?.payload.total_marks}`, icon: Award },
                {
                  label: "Structure",
                  value:
                    (exam?.payload?.total_marks ?? 100) <= 30 ||
                    exam?.payload?.assessment_category === "CAT" ||
                    (exam?.payload?.task_code || "").toUpperCase().startsWith("CAT") ||
                    !exam?.payload?.section_b?.questions?.length
                      ? "Continuous Test"
                      : "Section A + B",
                  icon: BookOpen,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3.5 rounded-xl text-center bg-slate-50 border border-slate-200"
                >
                  <item.icon className="w-5 h-5 mx-auto mb-1 text-[#c48820]" />
                  <div className="text-sm font-bold font-mono text-[#000953]">
                    {item.value}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl mb-4 text-xs leading-relaxed bg-slate-50 border border-slate-200 text-slate-700">
              <p className="font-bold mb-2 text-[#000953] text-sm">
                General Instructions:
              </p>
              {Array.isArray(exam?.payload.instructions) ? (
                <ol className="list-decimal list-inside space-y-1">
                  {(exam?.payload.instructions as string[]).map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
              ) : (
                exam?.payload.instructions
              )}
            </div>

            <div className="space-y-2 mb-6 text-xs text-slate-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              {(exam?.payload?.total_marks ?? 100) <= 30 ||
              exam?.payload?.assessment_category === "CAT" ||
              (exam?.payload?.task_code || "").toUpperCase().startsWith("CAT") ||
              !exam?.payload?.section_b?.questions?.length ? (
                <p>
                  • <strong className="text-[#000953]">Instructions:</strong>{" "}
                  {exam?.payload.section_a?.instructions ||
                    "Answer ALL questions in this continuous assessment test in the spaces provided."}
                </p>
              ) : (
                <>
                  {exam?.payload.section_a && (
                    <p>
                      • <strong className="text-[#000953]">Section A:</strong>{" "}
                      {exam?.payload.section_a.instructions}
                    </p>
                  )}
                  {exam?.payload.section_b && (
                    <p>
                      • <strong className="text-[#000953]">Section B:</strong>{" "}
                      {exam?.payload.section_b.instructions}
                    </p>
                  )}
                </>
              )}
              <p>• Your answers are automatically saved to local storage and sync safely.</p>
              <p>• The exam countdown begins immediately when you click the start button below.</p>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-4 text-xs bg-slate-100 border border-slate-200 text-slate-800">
              <Shield className="w-4 h-4 shrink-0 text-[#c48820]" />
              <span>Candidate: <strong className="text-[#000953]">{student.name}</strong> (Reg No: <span className="font-mono">{student.regNumber}</span>)</span>
            </div>

            {isAttendanceRecorded ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl mb-6 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Assessment Attendance (MTTI/REG/CUR/03): <strong className="font-serif italic font-bold text-emerald-900 text-sm">attended</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px] uppercase">
                  Recorded
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl mb-6 text-xs bg-amber-50 border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Assessment Attendance (MTTI/REG/CUR/03): <span className="font-semibold text-amber-950">Pending Confirmation</span>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold text-[10px] uppercase">
                  Not Yet Started
                </span>
              </div>
            )}

            <button
              onClick={() => {
                markCandidateAttendanceAttended(student.name, student.regNumber);
                setState("exam");
                startTimer();
              }}
              className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-lg active:scale-[0.98]"
            >
              <Timer className="w-4 h-4 text-[#c48820]" />
              Start Examination — Timer Begins Now
            </button>
          </div>
        </motion.div>
      </PortalShell>
    );
  }

  // ── EXAM STATE ────────────────────────────────────────────
  if (state === "exam" && exam) {
    const isSingleSectionTest =
      (exam.payload?.total_marks ?? 100) <= 30 ||
      exam.payload?.assessment_category === "CAT" ||
      (exam.payload?.task_code || "").toUpperCase().startsWith("CAT") ||
      !exam.payload?.section_b?.questions?.length;
    const isInSectionA = isSingleSectionTest || currentSection === "a";
    const questions = isInSectionA
      ? (exam.payload?.section_a?.questions || [])
      : (exam.payload?.section_b?.questions || []);
    const currentQ = questions[currentQIndex] as any;
    const qType = currentQ?.type || "short";

    return (
      <div className="min-h-screen bg-slate-100 text-[#0f172a]">
        {/* Official Institutional Exam Header */}
        <header className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 flex items-center gap-4 bg-[#000953] text-white shadow-md border-b-2 border-[#c48820]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white p-1 shrink-0 flex items-center justify-center shadow-sm">
              <img
                src="/mtti-logo.jpg"
                alt="Mukiria TTI"
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold truncate text-white tracking-wide">
                {exam.unit_code} — {exam.course_name}
              </div>
              <div className="text-xs text-slate-200 truncate">
                Candidate: <strong className="text-white font-semibold">{student.name}</strong> · Reg No: <span className="font-mono">{student.regNumber}</span>
              </div>
            </div>
          </div>

          {/* Draft Status Indicator */}
          <DraftStatusBadge
            isSaving={isDraftSaving}
            lastSaved={draftLastSaved}
            isOnline={typeof navigator !== "undefined" ? navigator.onLine : true}
          />

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
              isCritical
                ? "bg-rose-600/30 border-rose-400 text-rose-200 animate-pulse"
                : isWarning
                ? "bg-amber-500/20 border-amber-300 text-amber-200"
                : "bg-white/10 border-white/20 text-white"
            }`}
            title="Time Remaining"
          >
            <Clock className="w-4 h-4 text-[#c48820]" />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>

          {/* Progress Pill */}
          <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20">
            {totalAnswered}/{totalQuestions}
          </div>
        </header>

        {/* Subtle Institutional Progress Line */}
        <div className="h-1.5 w-full bg-slate-200">
          <div
            className="h-full transition-all duration-300 ease-out bg-[#c48820]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Official Exam Paper Cover Banner (Matches Graded Exam Paper Header) */}
          <div className="bg-white rounded-2xl border-2 border-[#000953]/20 shadow-sm p-4 sm:p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {(exam.payload as any)?.institution || "MUKIRIA TECHNICAL TRAINING INSTITUTE"} •{" "}
                  {((exam.payload as any)?.department || "DEPARTMENT OF COMPUTING & INFORMATICS").replace(/\n/g, " / ")}
                </p>
                <h1 className="text-base sm:text-lg font-extrabold text-[#000953] uppercase mt-0.5">
                  {(exam.payload as any)?.exam_header || "INTERNAL EXAMINATION"} — {exam.payload.title}
                </h1>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  Course: {exam.course_name} | Unit: {exam.unit_code} — {(exam.payload as any)?.unit_name || exam.course_name}
                </p>
              </div>
              <div className="text-right text-xs space-y-0.5">
                <div className="font-bold text-[#000953]">
                  Time Allowed: <span className="text-[#c48820]">{(exam.payload as any)?.time_allowed || `${exam.payload.duration_minutes} MINUTES`}</span> | Total Marks: <span className="text-[#c48820]">{exam.payload.total_marks}</span>
                </div>
                <div className="text-slate-600 font-medium">
                  Class: {(exam.payload as any)?.class || student.cohortCode || "Active Cohort"} • Series: {(exam.payload as any)?.series || "SEP - NOV 2026"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Candidate Name:</span>
                <span className="font-bold text-slate-900">{student.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Registration No:</span>
                <span className="font-mono font-bold text-slate-900">{student.regNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Unit Code:</span>
                <span className="font-mono font-bold text-slate-900">{exam.unit_code}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Questions Answered:</span>
                <span className="font-mono font-bold text-[#000953]">{totalAnswered} / {totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Section tabs / CAT Unified Header */}
          {isSingleSectionTest ? (
            <div className="flex items-center justify-between gap-3 mb-5 px-4 sm:px-5 py-3 rounded-xl bg-white border border-slate-300 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c48820]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#000953]">
                  Continuous Assessment Test ({exam.payload?.total_marks || 15} Marks — All Questions Compulsory)
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 text-[#000953] border border-slate-200">
                {Object.keys(sectionAAnswers).filter((k) => sectionAAnswers[k] !== undefined && sectionAAnswers[k] !== "").length} / {questions.length} Answered
              </span>
            </div>
          ) : (
            <div className="flex gap-2.5 mb-5">
              {(["a", "b"] as const).map((sec) => {
                const secLabel = sec === "a" ? "Section A (Theory / Concepts)" : "Section B (Structured Practical)";
                const secQuestions = sec === "a" ? (exam.payload?.section_a?.questions || []) : (exam.payload?.section_b?.questions || []);
                const secAnswered = sec === "a"
                  ? Object.keys(sectionAAnswers).filter((k) => sectionAAnswers[k] !== undefined && sectionAAnswers[k] !== "").length
                  : Object.keys(sectionBAnswers).filter((k) => sectionBAnswers[k]?.trim()).length;
                const isActive = currentSection === sec;

                return (
                  <button
                    key={sec}
                    onClick={() => { setCurrentSection(sec); setCurrentQIndex(0); }}
                    className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${
                      isActive
                        ? "bg-[#000953] border-[#000953] text-white shadow"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{secLabel}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {secAnswered}/{secQuestions.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Section Instructions Banner */}
          <div className="mb-5 p-3.5 rounded-xl text-xs flex items-center gap-3 bg-[#fef6e7] border border-[#c48820]/50 text-slate-900">
            <Info className="w-4 h-4 shrink-0 text-[#c48820]" />
            <span>
              <strong>{isSingleSectionTest ? "Instructions:" : `Section ${currentSection.toUpperCase()} Instructions:`}</strong>{" "}
              {isSingleSectionTest
                ? exam.payload?.section_a?.instructions || exam.payload?.instructions || "Answer ALL questions in the spaces provided."
                : currentSection === "a"
                ? exam.payload?.section_a?.instructions || "Answer ALL questions in this section."
                : exam.payload?.section_b?.instructions || "Answer ALL structured/practical questions in this section."}
            </span>
          </div>

          {/* Question Booklet Paper */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentSection}-${currentQIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-300 shadow-md mb-6"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3.5 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="px-2.5 py-1 rounded-lg flex items-center justify-center text-xs font-bold font-mono bg-[#000953] text-white shrink-0 shadow-sm">
                    Q{currentQ?.q_num || (isSingleSectionTest ? currentQIndex + 1 : isInSectionA ? currentQIndex + 1 : (exam.payload?.section_a?.questions?.length || 10) + currentQIndex + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold leading-relaxed whitespace-pre-line text-[#0f172a]">
                      {currentQ?.text}
                    </p>
                  </div>
                </div>
                <span className="exam-marks-badge shrink-0">
                  ({currentQ?.marks} {currentQ?.marks === 1 ? "Mark" : "Marks"})
                </span>
              </div>

              {/* Structured Sub-Parts (a, b, c, d) — Identical to Graded Exam Paper */}
              {Array.isArray(currentQ?.sub_parts) && currentQ.sub_parts.length > 0 && (
                <div className="mb-5 pl-4 border-l-2 border-[#000953]/30 space-y-2 bg-slate-50 py-3 pr-3 rounded-r">
                  {currentQ.sub_parts.map((sp: any, spIdx: number) => (
                    <p key={spIdx} className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      {formatSubPart(sp)}
                    </p>
                  ))}
                </div>
              )}

              {/* MCQ Options */}
              {qType === "mcq" && (
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt: string, oi: number) => {
                    const isSelected = String(sectionAAnswers[currentQ.id]) === String(oi) || sectionAAnswers[currentQ.id] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setSectionAAnswers((prev) => ({ ...prev, [currentQ.id]: oi }))}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-left transition-all border-2 ${
                          isSelected
                            ? "bg-blue-50/70 border-[#000953] text-[#000953] font-semibold shadow-sm"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#000953] text-white"
                              : "bg-slate-100 border border-slate-300 text-slate-700"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {(qType === "true_false" || qType === "tf") && (
                <div className="flex gap-4">
                  {["True", "False"].map((opt, oi) => {
                    const isSelected = sectionAAnswers[currentQ.id] === oi || String(sectionAAnswers[currentQ.id]).toLowerCase() === opt.toLowerCase();
                    return (
                      <button
                        key={opt}
                        onClick={() => setSectionAAnswers((prev) => ({ ...prev, [currentQ.id]: oi }))}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all border-2 ${
                          isSelected
                            ? "bg-blue-50/70 border-[#000953] text-[#000953] shadow-sm"
                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Practical / Essay / Structured / Open-ended text */}
              {(qType === "short" || qType === "short_answer" || qType === "practical" || qType === "essay" || qType === "structured" || !currentQ?.type) && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[11px] font-bold text-[#000953] uppercase tracking-wider flex items-center gap-1.5">
                      <span>
                        {isInSectionA
                          ? "Candidate Written Response (Short Answer):"
                          : "Candidate Written / Practical Procedure Response (Structured):"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExpandedTextarea((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-[#000953] border border-slate-300 transition shadow-xs cursor-pointer"
                      title={isExpandedTextarea ? "Restore standard size" : "Expand to extra large writing area"}
                    >
                      {isExpandedTextarea ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-[#000953]" />
                          <span>Standard View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-[#000953]" />
                          <span>Expand Writing Space</span>
                        </>
                      )}
                    </button>
                  </div>

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
                        : "Type your structured response, steps, procedures, or practical explanation here (e.g. a) ..., b) ..., c) ..., d) ...)..."
                    }
                    rows={isExpandedTextarea ? 22 : isInSectionA ? 8 : 16}
                    className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl text-base leading-relaxed resize-y bg-[#fffdfa] focus:bg-white border-2 border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-4 focus:ring-[#000953]/15 font-sans shadow-inner transition-[height,border-color,box-shadow] ${
                      isExpandedTextarea
                        ? "min-h-[560px] sm:min-h-[640px]"
                        : isInSectionA
                        ? "min-h-[220px] sm:min-h-[260px]"
                        : "min-h-[380px] sm:min-h-[460px]"
                    }`}
                  />

                  <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-0.5 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">
                        {isSingleSectionTest
                          ? "Continuous Assessment"
                          : isInSectionA
                          ? "Section A (Short Answer)"
                          : "Section B (Practical & Structured)"}
                      </span>
                      <span className="text-slate-400">• Drag bottom-right corner to expand further</span>
                    </span>
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {getWordCount(
                        String(
                          (isInSectionA
                            ? sectionAAnswers[currentQ?.id]
                            : sectionBAnswers[currentQ?.id]) || ""
                        )
                      )}{" "}
                      words •{" "}
                      {(isInSectionA
                        ? String(sectionAAnswers[currentQ?.id] || "").length
                        : String(sectionBAnswers[currentQ?.id] || "").length)}{" "}
                      chars
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
            <button
              onClick={() => {
                if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
                else if (!isSingleSectionTest && currentSection === "b") {
                  setCurrentSection("a");
                  setCurrentQIndex((exam.payload?.section_a?.questions?.length || 1) - 1);
                }
              }}
              disabled={(isSingleSectionTest || currentSection === "a") && currentQIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Question numbers grid */}
            <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
              {questions.map((q, qi) => {
                const isAnswered = isSingleSectionTest || currentSection === "a"
                  ? sectionAAnswers[q.id] !== undefined && sectionAAnswers[q.id] !== ""
                  : sectionBAnswers[q.id]?.trim();
                const isCurrent = qi === currentQIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(qi)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all border ${
                      isCurrent
                        ? "bg-[#000953] border-[#000953] text-white ring-2 ring-[#000953]/20 shadow"
                        : isAnswered
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={`Go to Question ${qi + 1}${isAnswered ? " (Answered)" : ""}`}
                  >
                    {qi + 1}
                  </button>
                );
              })}
            </div>

            {/* Next or Finish Section */}
            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((i) => i + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (!isSingleSectionTest && currentSection === "a") ? (
              <button
                onClick={() => { setCurrentSection("b"); setCurrentQIndex(0); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm"
              >
                Proceed to Section B
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm(isSingleSectionTest ? "Submit your continuous assessment test? This cannot be undone." : "Submit your final exam? This cannot be undone.")) handleSubmit();
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : isSingleSectionTest ? "Submit CAT" : "Submit Final Exam"}
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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="px-6 py-4 flex items-center gap-3 border-b-2 border-[#c48820] bg-[#000953] text-white shadow-md">
        <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
          <img
            src="/mtti-logo.jpg"
            alt="MTTI Logo"
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-wide">
            MTTI Examination & Assessment Portal
          </div>
          <div className="text-xs text-slate-200">
            Mukiria Technical Training Institute
          </div>
        </div>
      </header>
      <div className="container py-6">{children}</div>
    </div>
  );
}



