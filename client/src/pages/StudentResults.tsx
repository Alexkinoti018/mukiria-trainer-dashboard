/**
 * Student Examination Results Portal
 * High-contrast Mukiria TTI Institutional Design (#000953 Navy / #c48820 Gold / #ffffff White)
 * Strictly isolates Trainee view to their own official transcript while allowing Staff
 * (Trainer / HOD / Admin) to inspect individual candidate scripts.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Search,
  Award,
  TrendingUp,
  Calendar,
  BookOpen,
  AlertCircle,
  Loader2,
  PenTool,
  FileCheck,
  Users,
  ArrowLeft,
  Download,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  UploadCloud,
  Clock,
} from "lucide-react";
import { useExam } from "@/contexts/ExamContext";
import { useAuth, findRosterTraineeByIdentifier } from "@/contexts/AuthContext";
import { useTrainees } from "@/contexts/TraineeContext";
import { getCurrentTrainerProfile } from "@/lib/timetableSyncService";
import TraineeLayout from "@/components/TraineeLayout";
import MarkedExamScriptModal from "@/components/MarkedExamScriptModal";
import ObservationChecklistMarkingModal from "@/components/ObservationChecklistMarkingModal";
import { buildUnifiedGradedExamData, exportGradedExamPDFClientSide } from "@/lib/exportGradedExamPdf";
import { toast } from "sonner";
import type { Submission } from "@/lib/supabase";

interface StudentSession {
  name: string;
  reg_number: string;
  cohort_code?: string;
  department?: string;
}

/**
 * Checks whether two registration/admission numbers refer to the same trainee
 * (e.g., "ITECH 6 MOD/14179/S2026" vs "14179/S2026" vs "14179").
 */
function doesRegistrationMatch(regA: string, regB: string): boolean {
  const cleanA = (regA || "").trim().toUpperCase();
  const cleanB = (regB || "").trim().toUpperCase();
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  // Extract numeric admission core (4-6 digits)
  const digitsA = cleanA.match(/\b(\d{4,6})\b/)?.[1];
  const digitsB = cleanB.match(/\b(\d{4,6})\b/)?.[1];
  if (digitsA && digitsB && digitsA === digitsB) {
    return true;
  }
  return false;
}

export default function StudentResults() {
  const { user } = useAuth();
  const { trainees, uploads } = useTrainees();
  const { submissions: allSubmissions, exams } = useExam();
  const [, navigate] = useLocation();

  const isTraineeViewer = user?.role === "trainee";
  const isStaffViewer =
    Boolean(user && (user.role === "trainer" || user.role === "hod" || user.role === "admin"));

  const [session, setSession] = useState<StudentSession | null>(null);
  const [selectedSubForScript, setSelectedSubForScript] = useState<Submission | null>(null);
  const [selectedSubForChecklist, setSelectedSubForChecklist] = useState<{
    sub: Submission;
    unitCode: string;
    unitTitle: string;
    courseName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");

  // Build unique candidate roster from submissions + trainees (used ONLY by Staff viewers, scoped by trainer role)
  const availableCandidates = useMemo(() => {
    if (isTraineeViewer) return [];

    const isPrivileged = user?.role === "admin" || user?.role === "hod";
    const profile = getCurrentTrainerProfile(user);
    const trainerClasses = new Set((profile?.classes || []).map((c) => c.toUpperCase().trim()));

    // Filter trainees scoped strictly to trainer's assigned classes (unless privileged admin/hod)
    const scopedTrainees = isPrivileged
      ? trainees
      : trainees.filter((t) => {
          if (!t.classCode) return false;
          const tc = t.classCode.toUpperCase().trim();
          return (
            trainerClasses.has(tc) ||
            Array.from(trainerClasses).some((cls) => tc.includes(cls) || cls.includes(tc))
          );
        });

    const map = new Map<string, StudentSession & { submissionCount: number }>();

    for (const t of scopedTrainees) {
      const reg = (t.regCode || t.admNo || "").trim();
      if (!reg) continue;
      const key = t.id || reg.toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          reg_number: reg,
          name: t.name,
          cohort_code: t.classCode,
          department: t.department,
          submissionCount: 0,
        });
      }
    }

    // Filter submissions scoped to trainer's teaching cohorts (unless privileged admin/hod)
    const scopedSubmissions = isPrivileged
      ? allSubmissions
      : allSubmissions.filter((sub) => {
          return scopedTrainees.some((t) => {
            const subReg = (sub.reg_number || "").toUpperCase().trim();
            const subName = (sub.student_name || "").toLowerCase().trim();
            return (
              (t.admNo && subReg.includes(t.admNo.toUpperCase())) ||
              (t.regCode && subReg === t.regCode.toUpperCase()) ||
              (t.name && subName === t.name.toLowerCase())
            );
          });
        });

    for (const sub of scopedSubmissions) {
      const reg = (sub.reg_number || "").trim();
      if (!reg) continue;
      const matchedEntry = Array.from(map.values()).find(
        (entry) => doesRegistrationMatch(entry.reg_number, reg)
      );
      if (matchedEntry) {
        matchedEntry.submissionCount += 1;
      } else if (isPrivileged) {
        map.set(reg.toUpperCase(), {
          reg_number: reg,
          name: sub.student_name || "Candidate",
          submissionCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.submissionCount - a.submissionCount);
  }, [allSubmissions, trainees, isTraineeViewer, user]);

  useEffect(() => {
    // 1. STRICT TRAINEE ISOLATION: Always bind to the authenticated trainee's own identity
    if (user && user.role === "trainee") {
      try {
        localStorage.removeItem("student_demo_session");
      } catch {
        // ignore storage errors
      }
      const rosterMatch = findRosterTraineeByIdentifier(user.reg_number || user.name || "");
      const traineeCandidate: StudentSession = {
        name: user.name || rosterMatch?.name || "Trainee Candidate",
        reg_number: user.reg_number || rosterMatch?.regCode || rosterMatch?.admNo || "",
        cohort_code: user.cohort_code || rosterMatch?.classCode || "Official Cohort",
        department: rosterMatch?.department || "Academic Department",
      };
      setSession(traineeCandidate);
      setLoading(false);
      return;
    }

    // 2. Staff Viewer (Trainer / HOD / Admin): allow inspecting candidate transcripts
    if (user && (user.role === "trainer" || user.role === "hod" || user.role === "admin")) {
      const storedSession = localStorage.getItem("student_demo_session");
      if (storedSession) {
        try {
          setSession(JSON.parse(storedSession));
          setLoading(false);
          return;
        } catch {
          // ignore
        }
      }
      const firstWithSubs = availableCandidates[0] || {
        name: "Nthiga Gakii Doris",
        reg_number: "ITECH 6 MOD/14179/S2026",
        cohort_code: "ITECH 6 MOD",
        department: "Computing & Informatics",
      };
      setSession(firstWithSubs);
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [user, availableCandidates]);

  // Filter online exam/CAT submissions strictly for the active session candidate
  const submissions = useMemo(() => {
    if (!session) return [];
    const targetReg = session.reg_number.trim();
    const targetName = session.name.trim().toUpperCase();
    return allSubmissions.filter(
      (s) =>
        doesRegistrationMatch(s.reg_number || "", targetReg) ||
        (s.student_name || "").trim().toUpperCase() === targetName
    );
  }, [allSubmissions, session]);

  // Filter Continuous Assessment & Practical Portfolio Evidence uploads strictly for the active candidate
  const candidateUploads = useMemo(() => {
    if (!session) return [];
    const targetName = session.name.trim().toLowerCase();
    const rosterMatch = findRosterTraineeByIdentifier(session.reg_number || session.name || "");
    return uploads.filter(
      (u) =>
        (isTraineeViewer && u.traineeId === user?.id) ||
        (rosterMatch && u.traineeId === rosterMatch.id) ||
        u.student_name.trim().toLowerCase() === targetName
    );
  }, [uploads, session, isTraineeViewer, user?.id]);

  // Precompute unified graded exam data for accurate percentages
  const unifiedSubmissions = useMemo(() => {
    return submissions.map((sub) => {
      const matchedExam =
        exams.find((e) => sub.exam_id && e.id === sub.exam_id) ||
        exams.find((e) => sub.task_code && e.payload?.task_code === sub.task_code) ||
        exams.find((e) => e.unit_code === sub.unit_code) ||
        null;
      const unified = buildUnifiedGradedExamData(sub, matchedExam, "Alexander Kinoti");
      return { sub, matchedExam, unified };
    });
  }, [submissions, exams]);

  // Also include verified portfolio evidence grades in overall summary metrics when present
  const gradedUploads = useMemo(
    () => candidateUploads.filter((u) => u.grade !== null && u.grade !== undefined),
    [candidateUploads]
  );

  const totalGradedCount = unifiedSubmissions.length + gradedUploads.length;

  const avgScore = useMemo(() => {
    if (totalGradedCount === 0) return 0;
    const examSum = unifiedSubmissions.reduce((sum, item) => sum + item.unified.percentage, 0);
    const uploadSum = gradedUploads.reduce((sum, u) => sum + Number(u.grade || 0), 0);
    return Math.round((examSum + uploadSum) / totalGradedCount);
  }, [unifiedSubmissions, gradedUploads, totalGradedCount]);

  const passCount = useMemo(() => {
    const examPasses = unifiedSubmissions.filter((item) => item.unified.is_pass).length;
    const uploadPasses = gradedUploads.filter((u) => Number(u.grade || 0) >= 50).length;
    return examPasses + uploadPasses;
  }, [unifiedSubmissions, gradedUploads]);

  const handleCandidateLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTraineeViewer) return;
    setSearching(true);
    try {
      const query = lookupInput.trim().toLowerCase();
      if (!query) {
        toast.error("Please enter a Registration Number or Candidate Name.");
        return;
      }

      const matched = availableCandidates.find(
        (c) =>
          c.reg_number.toLowerCase() === query ||
          c.reg_number.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query)
      );

      if (matched) {
        setSession(matched);
        localStorage.setItem("student_demo_session", JSON.stringify(matched));
        toast.success(`Loaded Official Results for ${matched.name} (${matched.reg_number})`);
      } else {
        toast.error("Candidate Not Found", {
          description: "Enter a valid Admission/Registration Number or select from the roster.",
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCandidate = (cand: StudentSession) => {
    if (isTraineeViewer) return;
    setSession(cand);
    localStorage.setItem("student_demo_session", JSON.stringify(cand));
    toast.success(`Inspecting Candidate Transcript: ${cand.name} (${cand.reg_number})`);
  };

  const handleSwitchCandidate = () => {
    if (isTraineeViewer) return;
    localStorage.removeItem("student_demo_session");
    setSession(null);
    setLookupInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#000953]" />
          <p className="text-slate-600 font-medium text-sm">Loading Official Transcript...</p>
        </motion.div>
      </div>
    );
  }

  // Staff Candidate Lookup Card (ONLY for Staff when no candidate session is selected)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 w-full max-w-lg mx-auto"
        >
          <div className="p-8 rounded-2xl bg-white border-2 border-[#000953] shadow-xl">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-[#000953] flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/mtti-logo.jpg"
                    alt="Mukiria TTI Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold font-mono rounded-full bg-[#fef6e7] text-[#000953] border border-[#c48820]">
                STAFF CANDIDATE TRANSCRIPT INSPECTOR
              </span>
              <h1 className="text-2xl font-bold mt-2 text-[#000953]">
                Candidate Results & Marked Scripts
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Mukiria Technical Training Institute • Select Candidate to Inspect
              </p>
            </div>

            <form onSubmit={handleCandidateLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                  Registration / Admission Number or Candidate Name
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    placeholder="e.g. 14179/S2026 or Nthiga Gakii Doris"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-4 focus:ring-[#000953]/10 transition-all font-sans text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Inspect Candidate Transcript"
                )}
              </button>
            </form>

            {isStaffViewer && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Graded Candidates ({availableCandidates.filter((c) => c.submissionCount > 0).length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {availableCandidates
                    .filter((c) => c.submissionCount > 0)
                    .slice(0, 8)
                    .map((cand) => (
                      <button
                        key={cand.reg_number}
                        type="button"
                        onClick={() => handleSelectCandidate(cand)}
                        className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-[#000953] hover:bg-slate-50 transition flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#000953] truncate">{cand.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{cand.reg_number}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {cand.submissionCount} {cand.submissionCount === 1 ? "Exam" : "Exams"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredCandidates = isStaffViewer
    ? availableCandidates.filter(
        (c) =>
          !candidateFilter.trim() ||
          c.name.toLowerCase().includes(candidateFilter.toLowerCase()) ||
          c.reg_number.toLowerCase().includes(candidateFilter.toLowerCase())
      )
    : [];

  const mainContent = (
    <div className={isTraineeViewer ? "space-y-6" : "min-h-screen bg-slate-100 text-[#0f172a]"}>
      {/* Standalone Institutional Header when viewed by Staff outside TraineeLayout */}
      {!isTraineeViewer && (
        <header className="border-b-2 border-[#c48820] bg-[#000953] text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src="/mtti-logo.jpg"
                  alt="Mukiria TTI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Official Examination Results & Marked Scripts Inspector
                </h1>
                <p className="text-xs text-slate-200">
                  Candidate: <span className="font-bold text-white">{session.name}</span> ·{" "}
                  <span className="font-mono text-[#fef6e7]">{session.reg_number}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStaffViewer && (
                <button
                  onClick={() => navigate("/grading")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#c48820] hover:bg-amber-600 text-white transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Trainer Portal
                </button>
              )}
              {isStaffViewer && (
                <button
                  onClick={handleSwitchCandidate}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <LogOut className="w-4 h-4" />
                  Switch Candidate
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <div className={isTraineeViewer ? "" : "max-w-6xl mx-auto px-4 sm:px-6 py-8"}>
        {/* Top Identity / Transcript Banner */}
        <div className="mb-6 p-5 rounded-2xl bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#000953] text-white flex items-center justify-center shrink-0">
              {isTraineeViewer ? (
                <GraduationCap className="w-5 h-5 text-[#c48820]" />
              ) : (
                <Users className="w-5 h-5 text-[#c48820]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-[#000953]">{session.name}</span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-[#000953] border border-slate-300">
                  {session.reg_number}
                </span>
                {session.cohort_code && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                    Cohort: {session.cohort_code}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Official Transcript Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isTraineeViewer
                  ? "Confidential personal academic transcript showing your graded online examination scripts, CAT scores, and verified practical portfolio evidence."
                  : "Staff Inspector: View graded examination papers (with Section A/B red-pen annotations) and TVET CDACC practical checklists."}
              </p>
            </div>
          </div>

          {/* STRICT PRIVACY: Trainees NEVER see the candidate filter or dropdown */}
          {isTraineeViewer ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#000953] shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#c48820]" />
              <span>Personal Candidate Record Locked</span>
            </div>
          ) : (
            isStaffViewer && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candidateFilter}
                    onChange={(e) => setCandidateFilter(e.target.value)}
                    placeholder="Filter candidate..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#000953] w-40"
                  />
                </div>
                <select
                  value={session.reg_number}
                  onChange={(e) => {
                    const found = availableCandidates.find((c) => c.reg_number === e.target.value);
                    if (found) handleSelectCandidate(found);
                  }}
                  aria-label="Select Candidate"
                  className="px-3 py-1.5 rounded-lg border-2 border-[#000953] bg-white text-xs font-bold text-[#000953] focus:outline-none"
                >
                  {filteredCandidates.map((c) => (
                    <option key={c.reg_number} value={c.reg_number}>
                      {c.name} ({c.reg_number}) — {c.submissionCount} Graded
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Graded Assessments
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-[#000953]">
                  {totalGradedCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#000953]">
                <BookOpen className="w-6 h-6 text-[#000953]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mean Percentage
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-[#000953]">{avgScore}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#c48820]">
                <TrendingUp className="w-6 h-6 text-[#c48820]" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Competent Tasks
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-emerald-700">
                  {passCount}/{totalGradedCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Award className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mastery Rate
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-emerald-700">
                  {totalGradedCount > 0 ? Math.round((passCount / totalGradedCount) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section 1: Official Online Examination & CAT Scripts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#000953]">
                Official Examination Scripts & Performance Records
              </h2>
              <p className="text-xs text-slate-500">
                Marked theory and CAT scripts with Section A/B score breakdowns and assessor annotations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#000953]/10 text-[#000953]">
              {unifiedSubmissions.length} Graded {unifiedSubmissions.length === 1 ? "Script" : "Scripts"}
            </span>
          </div>

          {unifiedSubmissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-10 rounded-2xl text-center bg-white border border-slate-300 shadow-sm space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#000953]/10 text-[#000953] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-[#000953]">
                  No Graded Online Examination Scripts Recorded Yet for {session.name} ({session.reg_number})
                </p>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                  {isTraineeViewer
                    ? "Your official examination scripts and Continuous Assessment Test (CAT) scores will appear here automatically once an allocated assessment for your cohort is completed and graded by your Trainer."
                    : "This candidate has not completed an online examination yet, or their script is awaiting grading and release."}
                </p>
              </div>
              {isTraineeViewer && (
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate("/trainee/exam")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition inline-flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#c48820]" />
                    View Allocated Exams & CATs
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/trainee/assignments")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition inline-flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Portfolio & Evidence Uploads
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {unifiedSubmissions.map(({ sub, unified }, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm hover:border-[#000953] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#000953] text-white">
                            {unified.unit_code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fef6e7] text-[#c48820] border border-[#c48820]/40 uppercase">
                            {unified.exam_title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                            {unified.grade}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-[#000953] mt-1.5">
                          {unified.course_name} — {unified.unit_name}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          Class: {unified.class_code} • Series: {unified.series} • Time Allowed:{" "}
                          {unified.time_allowed}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Submitted on {new Date(sub.created_at).toLocaleDateString()} • Sec A:{" "}
                          {unified.sec_a_awarded}/{unified.sec_a_max} | Sec B:{" "}
                          {unified.sec_b_awarded}/{unified.sec_b_max}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold font-mono text-[#000953]">
                          {unified.total_score}
                          <span className="text-sm font-normal text-slate-500">
                            /{unified.total_marks}
                          </span>
                        </p>
                        <p className="text-xs text-[#c48820] font-bold">
                          {unified.percentage}% Official Score
                        </p>
                        {unified.is_pass ? (
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                            ✓ Competent / Passed
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
                            ✗ NYC / Referral
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-slate-600 font-medium">
                        Official Graded Examination Paper & Practical Observation Record
                      </span>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          onClick={() => setSelectedSubForScript(sub)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#000953] hover:bg-[#000e7a] text-white shadow-sm transition"
                        >
                          <PenTool className="w-3.5 h-3.5 text-[#c48820]" />
                          <span>View Graded Exam Paper (Red Pen)</span>
                        </button>
                        <button
                          onClick={() => {
                            exportGradedExamPDFClientSide(unified);
                            toast.success("Downloaded Official Graded Exam Paper PDF!");
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#fef6e7] hover:bg-amber-100 text-[#000953] border border-[#c48820] shadow-sm transition"
                        >
                          <Download className="w-3.5 h-3.5 text-[#000953]" />
                          <span>Download Graded PDF</span>
                        </button>
                        <button
                          onClick={() =>
                            setSelectedSubForChecklist({
                              sub,
                              unitCode: unified.unit_code,
                              unitTitle: unified.unit_name,
                              courseName: unified.course_name,
                            })
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#000953] border-2 border-[#000953] shadow-sm transition"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#000953]" />
                          <span>Practical Checklist (Red Pen)</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Section 2: Continuous Assessment & Portfolio Evidence Verification Records */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#000953]">
                Continuous Assessment & Portfolio Evidence Records
              </h2>
              <p className="text-xs text-slate-500">
                Uploaded practical evidence, assignments, and projects verified by your Trainer.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-[#c48820] border border-amber-200">
              {candidateUploads.length} Evidence {candidateUploads.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          {candidateUploads.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-300 text-center space-y-2 shadow-sm">
              <p className="text-sm font-bold text-slate-700">
                No Continuous Assessment or Portfolio Evidence Uploaded Yet
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When you submit practical work, assignments, or projects under{" "}
                <strong>Assignments & Evidence</strong>, trainer verification and marks appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {candidateUploads.map((up) => {
                const isGraded = up.grade !== null && up.grade !== undefined;
                const isCompetent = isGraded && Number(up.grade) >= 50;
                return (
                  <div
                    key={up.id}
                    className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#000953] text-white">
                            {up.task_code || up.uploadType}
                          </span>
                          {up.unit_code && (
                            <span className="text-xs font-mono font-semibold text-slate-600">
                              {up.unit_code}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#000953] mt-1.5 truncate">
                          {up.filename}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Uploaded {new Date(up.submitted_at).toLocaleDateString("en-GB")}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {isGraded ? (
                          <>
                            <p className="text-2xl font-bold font-mono text-[#000953]">
                              {up.grade}%
                            </p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isCompetent
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {isCompetent ? "✓ Competent" : "NYC / Revision"}
                            </span>
                          </>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Trainer Review
                          </span>
                        )}
                      </div>
                    </div>

                    {up.comments && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-[#000953]">Trainer Feedback: </span>
                        {up.comments}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visual Marked Script Modal (Theory) */}
      <MarkedExamScriptModal
        isOpen={!!selectedSubForScript}
        onClose={() => setSelectedSubForScript(null)}
        submission={selectedSubForScript}
        exam={
          selectedSubForScript
            ? exams.find(
                (e) =>
                  e.unit_code === selectedSubForScript.unit_code ||
                  e.id === selectedSubForScript.exam_id
              ) || null
            : null
        }
      />

      {/* Visual Marked Practical Checklist Modal (TVET CDACC Red Pen) */}
      <ObservationChecklistMarkingModal
        isOpen={!!selectedSubForChecklist}
        onClose={() => setSelectedSubForChecklist(null)}
        candidateName={session?.name || "Candidate"}
        candidateRegCode={session?.reg_number || ""}
        unitCode={selectedSubForChecklist?.unitCode || "ICT/OS/IT/CR/1/6"}
        unitTitle={selectedSubForChecklist?.unitTitle || "PRACTICAL COMPETENCY ASSESSMENT"}
        qualificationCode={selectedSubForChecklist?.courseName || session?.cohort_code || "TVET CDACC"}
        assessorName="Department Assessor"
      />
    </div>
  );

  if (isTraineeViewer) {
    return (
      <TraineeLayout
        title="My Official Examination Results & Transcript"
        subtitle={`${session.name} • ${session.reg_number}`}
      >
        {mainContent}
      </TraineeLayout>
    );
  }

  return mainContent;
}
