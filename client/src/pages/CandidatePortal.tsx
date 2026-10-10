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
  Search,
} from "lucide-react";
import { useExam, sanitizeExamForStudent } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";
import { MOCK_EXAMS } from "@/lib/mockData";
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

export default function CandidatePortal() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const unitCode = params.get("unitCode") ?? params.get("unit") ?? "";
  const { exams, submissions, submitExam } = useExam();
  const { user } = useAuth();
  const allAvailableExams: Exam[] = (exams && exams.length > 0) ? exams : (MOCK_EXAMS as Exam[]);

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
        return {
          ...prev,
          sectionAAnswers: nextA,
        };
      });
    },
    [setAnswersDraft]
  );

  const setSectionBAnswers = useCallback(
    (action: React.SetStateAction<Record<string, string>>) => {
      setAnswersDraft((prev) => {
        const nextB = typeof action === "function" ? action(prev.sectionBAnswers) : action;
        return {
          ...prev,
          sectionBAnswers: nextB,
        };
      });
    },
    [setAnswersDraft]
  );

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
      let foundExam = allAvailableExams.find((e) => e.unit_code.toUpperCase() === unitCode.toUpperCase());
      
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
          s.reg_number?.toUpperCase() === regNo
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
        if (draftStorageKey) {
          localStorage.removeItem(draftStorageKey);
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

  // ── Restore answers from legacy localStorage or IndexedDB if not already in draft ────
  useEffect(() => {
    if (exam && state === "exam") {
      // If answersDraft is already populated from useAutoDraft, skip legacy restore
      if (
        Object.keys(answersDraft.sectionAAnswers).length > 0 ||
        Object.keys(answersDraft.sectionBAnswers).length > 0
      ) {
        return;
      }

      // Check legacy localStorage key for seamless backward compatibility
      const legacyStored = localStorage.getItem(`mtti_exam_answers_${exam.unit_code}`);
      if (legacyStored) {
        try {
          const { sectionAAnswers: a, sectionBAnswers: b } = JSON.parse(legacyStored);
          if (a || b) {
            setAnswersDraft({
              sectionAAnswers: a || {},
              sectionBAnswers: b || {},
            });
            return;
          }
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
          if (Object.keys(aMap).length > 0 || Object.keys(bMap).length > 0) {
            setAnswersDraft({
              sectionAAnswers: aMap,
              sectionBAnswers: bMap,
            });
          }
        }
      });
    }
  }, [exam, state, student.regNumber, answersDraft.sectionAAnswers, answersDraft.sectionBAnswers, setAnswersDraft]);

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
    [exam, unitCode]
  );

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
              Available Online Examinations
            </h2>
            <p className="text-xs text-slate-600">
              Select your scheduled assessment paper below to register and launch the test runner.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {allAvailableExams.map((ex) => (
              <div
                key={ex.id || ex.unit_code}
                className="bg-white rounded-2xl border border-slate-300 p-6 space-y-4 shadow-sm hover:border-[#000953] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                      {ex.unit_code}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-semibold">
                      {ex.payload?.duration_minutes ?? 120} Mins • {ex.payload?.total_marks ?? 70} Marks
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#000953] mb-1">
                    {ex.payload?.title || ex.course_name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {ex.payload?.instructions || "Section A (30 Marks compulsory) and Section B (40 Marks structured questions)."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Class: {ex.payload?.class || "L5/6 Combined"}
                  </span>
                  <button
                    onClick={() => {
                      setExam(ex);
                      setState(ex.payload?.type === "practical" ? "practical" : "registration");
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition"
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setStudent((s) => ({ ...s, regNumber: val, name: isVerified ? "" : s.name }));
                      if (isVerified) setIsVerified(false);
                      if (verificationError) setVerificationError(null);
                    }}
                    onBlur={() => {
                      if (student.regNumber.trim() && !isVerified) {
                        handleVerifyRegNo(student.regNumber);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && student.regNumber.trim()) {
                        e.preventDefault();
                        handleVerifyRegNo(student.regNumber);
                      }
                    }}
                    placeholder="e.g. 14179/S2026 or 13254"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm font-mono bg-white border-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-2 focus:ring-[#000953]/20 ${
                      isVerified
                        ? "border-emerald-500"
                        : verificationError
                        ? "border-rose-500"
                        : "border-slate-300"
                    }`}
                  />
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
                { label: "Structure", value: "Section A + B", icon: BookOpen },
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
              {exam?.payload.section_a && <p>• <strong className="text-[#000953]">Section A:</strong> {exam?.payload.section_a.instructions}</p>}
              {exam?.payload.section_b && <p>• <strong className="text-[#000953]">Section B:</strong> {exam?.payload.section_b.instructions}</p>}
              <p>• Your answers are automatically saved to local storage and sync safely.</p>
              <p>• The exam countdown begins immediately when you click the start button below.</p>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 rounded-xl mb-6 text-xs bg-slate-100 border border-slate-200 text-slate-800">
              <Shield className="w-4 h-4 shrink-0 text-[#c48820]" />
              <span>Candidate: <strong className="text-[#000953]">{student.name}</strong> (Reg No: <span className="font-mono">{student.regNumber}</span>)</span>
            </div>

            <button
              onClick={() => {
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
    const isInSectionA = currentSection === "a";
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

          {/* Section tabs */}
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

          {/* Section Instructions Banner */}
          <div className="mb-5 p-3.5 rounded-xl text-xs flex items-center gap-3 bg-[#fef6e7] border border-[#c48820]/50 text-slate-900">
            <Info className="w-4 h-4 shrink-0 text-[#c48820]" />
            <span>
              <strong>Section {currentSection.toUpperCase()} Instructions:</strong>{" "}
              {currentSection === "a"
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
                    Q{currentQ?.q_num || (isInSectionA ? currentQIndex + 1 : (exam.payload?.section_a?.questions?.length || 10) + currentQIndex + 1)}
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
                <div className="mb-5 pl-4 border-l-2 border-[#000953]/30 space-y-1.5 bg-slate-50 py-2.5 pr-3 rounded-r">
                  {currentQ.sub_parts.map((sp: string, spIdx: number) => (
                    <p key={spIdx} className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                      {sp}
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

              {/* Short Answer / Practical / Essay / Open-ended text */}
              {(qType === "short" || qType === "short_answer" || qType === "practical" || qType === "essay" || !currentQ?.type) && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#000953] uppercase tracking-wider mb-1">
                    {isInSectionA
                      ? "Candidate Written Response:"
                      : "Candidate Written / Practical Procedure Response:"}
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
                    rows={isInSectionA ? 5 : 9}
                    className="w-full px-4 py-3.5 rounded-xl text-sm resize-y bg-[#fffdfa] border-2 border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-4 focus:ring-[#000953]/10 leading-relaxed font-sans shadow-inner"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
                    <span>{isInSectionA ? "Section A (Short Answer)" : "Section B (Practical & Structured)"}</span>
                    <span className="font-mono">
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

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
            <button
              onClick={() => {
                if (currentQIndex > 0) setCurrentQIndex((i) => i - 1);
                else if (currentSection === "b") { setCurrentSection("a"); setCurrentQIndex((exam.payload?.section_a?.questions?.length || 1) - 1); }
              }}
              disabled={currentSection === "a" && currentQIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Question numbers grid */}
            <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
              {questions.map((q, qi) => {
                const isAnswered = currentSection === "a"
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
            ) : currentSection === "a" ? (
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
                  if (confirm("Submit your final exam? This cannot be undone.")) handleSubmit();
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Submit Final Exam"}
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



