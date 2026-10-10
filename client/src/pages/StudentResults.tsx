/**
 * Student Examination Results Portal
 * High-contrast Mukiria TTI Institutional Design (#000953 Navy / #c48820 Gold / #ffffff White)
 * Integrates seamlessly with AuthContext, TraineeLayout, and Trainer/HOD Candidate Inspection
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
} from "lucide-react";
import { useExam } from "@/contexts/ExamContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainees } from "@/contexts/TraineeContext";
import TraineeLayout from "@/components/TraineeLayout";
import MarkedExamScriptModal from "@/components/MarkedExamScriptModal";
import ObservationChecklistMarkingModal from "@/components/ObservationChecklistMarkingModal";
import { buildUnifiedGradedExamData, exportGradedExamPDFClientSide } from "@/lib/exportGradedExamPdf";
import { toast } from "sonner";
import type { Submission } from "@/lib/supabase";

interface StudentSession {
  email: string;
  name: string;
  reg_number: string;
}

export default function StudentResults() {
  const { user } = useAuth();
  const { trainees } = useTrainees();
  const { submissions: allSubmissions, exams } = useExam();
  const [, navigate] = useLocation();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [selectedSubForScript, setSelectedSubForScript] = useState<Submission | null>(null);
  const [isPracticalChecklistOpen, setIsPracticalChecklistOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");

  // Build unique candidate roster from submissions + trainees
  const availableCandidates = useMemo(() => {
    const map = new Map<string, StudentSession & { submissionCount: number }>();

    for (const sub of allSubmissions) {
      const reg = (sub.reg_number || "").trim();
      if (!reg) continue;
      const key = reg.toUpperCase();
      const existing = map.get(key);
      if (existing) {
        existing.submissionCount += 1;
      } else {
        map.set(key, {
          reg_number: reg,
          name: sub.student_name || "Candidate",
          email: `${reg.split("/")[0].toLowerCase()}@mtti.ac.ke`,
          submissionCount: 1,
        });
      }
    }

    for (const t of trainees) {
      const reg = (t.admNo || t.regCode || "").trim();
      if (!reg) continue;
      const key = reg.toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          reg_number: reg,
          name: t.name,
          email: `${reg.split("/")[0].toLowerCase()}@mtti.ac.ke`,
          submissionCount: 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.submissionCount - a.submissionCount);
  }, [allSubmissions, trainees]);

  useEffect(() => {
    // 1. If authenticated as a trainee in AuthContext, use their identity immediately
    if (user && user.role === "trainee") {
      const traineeCandidate: StudentSession = {
        email: user.email || "trainee@mtti.ac.ke",
        name: user.name || "Nthiga Gakii Doris",
        reg_number: user.reg_number || "14179/S2026",
      };
      setSession(traineeCandidate);
      setLoading(false);
      return;
    }

    // 2. If authenticated as Trainer / HOD / Admin, default to the first candidate with graded submissions
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
        email: "doris@mtti.ac.ke",
        name: "Nthiga Gakii Doris",
        reg_number: "14179/S2026",
      };
      setSession(firstWithSubs);
      setLoading(false);
      return;
    }

    // 3. Check localStorage for existing candidate session
    try {
      const storedDemo = localStorage.getItem("student_demo_session");
      if (storedDemo) {
        setSession(JSON.parse(storedDemo));
        setLoading(false);
        return;
      }
      const storedPortal = localStorage.getItem("candidate_portal_student");
      if (storedPortal) {
        const parsed = JSON.parse(storedPortal);
        if (parsed?.reg_number) {
          setSession({
            email: parsed.email || `${parsed.reg_number}@mtti.ac.ke`,
            name: parsed.name || "Candidate",
            reg_number: parsed.reg_number,
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    setLoading(false);
  }, [user, availableCandidates]);

  // Filter submissions for current active candidate
  const submissions = useMemo(() => {
    if (!session) return [];
    const targetReg = session.reg_number.trim().toUpperCase();
    const targetName = session.name.trim().toUpperCase();
    return allSubmissions.filter(
      (s) =>
        (s.reg_number || "").trim().toUpperCase() === targetReg ||
        (s.student_name || "").trim().toUpperCase() === targetName
    );
  }, [allSubmissions, session]);

  // Precompute unified graded exam data for accurate percentages
  const unifiedSubmissions = useMemo(() => {
    return submissions.map((sub) => {
      const matchedExam =
        exams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id) || null;
      const unified = buildUnifiedGradedExamData(sub, matchedExam, "Alexander Kinoti");
      return { sub, matchedExam, unified };
    });
  }, [submissions, exams]);

  const avgScore =
    unifiedSubmissions.length > 0
      ? Math.round(
          unifiedSubmissions.reduce((sum, item) => sum + item.unified.percentage, 0) /
            unifiedSubmissions.length
        )
      : 0;

  const passCount = unifiedSubmissions.filter((item) => item.unified.is_pass).length;

  const handleCandidateLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const query = lookupInput.trim().toLowerCase();
      if (!query) {
        toast.error("Please enter your Registration Number, Name, or Email.");
        return;
      }

      const matched = availableCandidates.find(
        (c) =>
          c.reg_number.toLowerCase() === query ||
          c.reg_number.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase() === query
      );

      if (matched) {
        setSession(matched);
        localStorage.setItem("student_demo_session", JSON.stringify(matched));
        toast.success(`Loaded Official Results for ${matched.name} (${matched.reg_number})`);
      } else {
        toast.error("Candidate Not Found", {
          description:
            "Enter a valid Admission/Registration Number (e.g. 14179/S2026, 13410, 13634) or select from the candidate list below.",
        });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCandidate = (cand: StudentSession) => {
    setSession(cand);
    localStorage.setItem("student_demo_session", JSON.stringify(cand));
    toast.success(`Viewing Results: ${cand.name} (${cand.reg_number})`);
  };

  const handleSwitchCandidate = () => {
    localStorage.removeItem("student_demo_session");
    setSession(null);
    setLookupInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#000953]" />
          <p className="text-slate-600 font-medium text-sm">Loading Examination Results...</p>
        </motion.div>
      </div>
    );
  }

  // Candidate Lookup Card (when no candidate session is selected)
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
                OFFICIAL EXAMINATION RESULTS PORTAL
              </span>
              <h1 className="text-2xl font-bold mt-2 text-[#000953]">
                Candidate Results & Marked Scripts
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Mukiria Technical Training Institute • Enter Registration Number or Select Candidate
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
                    placeholder="e.g. 14179/S2026, 13410, or Nthiga Gakii Doris"
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
                  "View Official Graded Results"
                )}
              </button>
            </form>

            {/* Quick-Select Graded Candidates */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Quick-Access Graded Candidates ({availableCandidates.filter((c) => c.submissionCount > 0).length})
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
          </div>
        </motion.div>
      </div>
    );
  }

  const isStaffViewer =
    user && (user.role === "trainer" || user.role === "hod" || user.role === "admin");

  const filteredCandidates = availableCandidates.filter(
    (c) =>
      !candidateFilter.trim() ||
      c.name.toLowerCase().includes(candidateFilter.toLowerCase()) ||
      c.reg_number.toLowerCase().includes(candidateFilter.toLowerCase())
  );

  const mainContent = (
    <div className={user?.role === "trainee" ? "space-y-6" : "min-h-screen bg-slate-100 text-[#0f172a]"}>
      {/* Standalone Institutional Header when not already wrapped in TraineeLayout */}
      {user?.role !== "trainee" && (
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
                  Official Examination Results & Marked Scripts Portal
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
              <button
                onClick={handleSwitchCandidate}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <LogOut className="w-4 h-4" />
                Switch Candidate
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={user?.role === "trainee" ? "" : "max-w-6xl mx-auto px-4 sm:px-6 py-8"}>
        {/* Staff / Demo Candidate Switcher Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#000953] text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#c48820]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#000953]">{session.name}</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-[#000953] border border-slate-300">
                  {session.reg_number}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Official Transcript Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect full graded examination papers (with Section A/B red-pen annotations) and TVET CDACC practical checklists.
              </p>
            </div>
          </div>

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
                  Graded Papers
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-[#000953]">
                  {unifiedSubmissions.length}
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
                  Competent Papers
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-emerald-700">
                  {passCount}/{unifiedSubmissions.length}
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
                  {unifiedSubmissions.length > 0
                    ? Math.round((passCount / unifiedSubmissions.length) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Results List */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#000953]">
            Official Examination Scripts & Performance Records
          </h2>

          {unifiedSubmissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 rounded-2xl text-center bg-white border border-slate-300 shadow-sm"
            >
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-base font-semibold text-slate-700">
                No examination results recorded for {session.name} ({session.reg_number})
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Select another graded candidate from the selector above or complete an active assessment.
              </p>
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
                        Official Graded Examination Paper (Same Format as Trainee Exam) &
                        Observation Checklist
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
                          onClick={() => setIsPracticalChecklistOpen(true)}
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
        isOpen={isPracticalChecklistOpen}
        onClose={() => setIsPracticalChecklistOpen(false)}
        candidateName={session?.name || "Nthiga Gakii Doris"}
        candidateRegCode={session?.reg_number || "14179/S2026"}
        unitCode="ICT/OS/IT/CR/1/6"
        unitTitle="PERFORM COMPUTER NETWORKING"
        qualificationCode="061006T4ICT - ICT TECHNICIAN LEVEL 6"
        assessorName="MR Muthomi"
      />
    </div>
  );

  if (user?.role === "trainee") {
    return (
      <TraineeLayout
        title="Official Examination Results & Marked Scripts"
        subtitle={`${session.name} • ${session.reg_number}`}
      >
        {mainContent}
      </TraineeLayout>
    );
  }

  return mainContent;
}
