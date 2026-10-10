/**
 * Student Results Portal
 * Design: Institutional Glassmorphism — dark background, frosted glass cards, emerald accents
 * Authenticated access for students to view their exam grades
 */

import { useEffect, useState } from "react";
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
  Eye,
  EyeOff,
  PenTool,
  FileCheck,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";
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
  const [session, setSession] = useState<StudentSession | null>(null);
  const { submissions: allSubmissions, exams } = useExam();
  const [selectedSubForScript, setSelectedSubForScript] = useState<Submission | null>(null);
  const [isPracticalChecklistOpen, setIsPracticalChecklistOpen] = useState(false);
  const submissions = session ? allSubmissions.filter(s => s.reg_number === session.reg_number) : [];
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchReg, setSearchReg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      if (isSupabaseConfigured()) {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        if (authSession?.user) {
          setSession({
            email: authSession.user.email ?? "",
            name: authSession.user.user_metadata?.name ?? "Student",
            reg_number: authSession.user.user_metadata?.reg_number ?? "",
          });

        }
      } else {
        const stored = localStorage.getItem("student_demo_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSession(parsed);
          console.log("✅ [Student Results] Demo session restored");
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setLoading(false);
    }
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      if (!isSupabaseConfigured()) {
        const email = loginEmail.trim().toLowerCase();
        const pin = loginPassword.trim();
        
        const demoStudents: Record<string, { name: string; reg_number: string }> = {
          "doris@mtti.ac.ke": { name: "Nthiga Gakii Doris", reg_number: "14179/S2026" },
          "belinda@mtti.ac.ke": { name: "Kaumbuthu Belinda Mukiri", reg_number: "14255/S2026" },
          "alvin@mtti.ac.ke": { name: "Wanjau Alvin Gatere", reg_number: "14076/S2026" },
          "risper@mtti.ac.ke": { name: "RISPER MWENDE", reg_number: "13410" },
          "harriet@mtti.ac.ke": { name: "Harriet Mwendwa", reg_number: "D/UPNUT/25042/069" },
          "student@mtti.ac.ke": { name: "Nthiga Gakii Doris", reg_number: "14179/S2026" },
        };
        
        if (demoStudents[email] && (pin === "1234" || pin === "student")) {
          const studentSession = {
            email,
            name: demoStudents[email].name,
            reg_number: demoStudents[email].reg_number,
          };
          setSession(studentSession);
          localStorage.setItem("student_demo_session", JSON.stringify(studentSession));
          toast.success("Welcome!", { description: `Logged in as ${email} (Demo Mode)` });
        } else {
          toast.error("Login Failed", { description: "Invalid email or PIN. Try student@mtti.ac.ke with PIN 1234." });
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        toast.error("Login Failed", { description: error.message });
        return;
      }

      if (data.user) {
        setSession({
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name ?? "Student",
          reg_number: data.user.user_metadata?.reg_number ?? "",
        });
        toast.success("Welcome!", { description: `Logged in as ${data.user.email}` });
      }
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem("student_demo_session");
      }
      setSession(null);
      setLoginEmail("");
      setLoginPassword("");
      toast.success("Logged out successfully");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#000953]" />
          <p className="text-slate-600 font-medium text-sm">Loading Student Results...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-slate-100 p-4">
        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md mx-auto"
        >
          <div className="p-8 rounded-2xl bg-white border border-slate-300 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-[#000953] flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src="/mtti-logo.jpg"
                    alt="Mukiria TTI Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-bold font-mono rounded-full bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                TRAINEE PORTAL
              </span>
              <h1 className="text-2xl font-bold mt-2 text-[#000953]">
                Student Results Portal
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Mukiria Technical Training Institute
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                  Student Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. doris@mtti.ac.ke"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-4 focus:ring-[#000953]/10 transition-all font-sans text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                  Password / PIN
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter student password / PIN"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#000953] focus:ring-4 focus:ring-[#000953]/10 transition-all font-sans text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all bg-[#000953] hover:bg-[#000e7a] text-white shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "View My Official Results"
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-600">
              Demo Access: <span className="font-mono font-semibold text-[#000953]">doris@mtti.ac.ke</span> / PIN: <span className="font-mono">14179</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Results view
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / submissions.length)
    : 0;

  const passCount = submissions.filter((s) => (s.total_score ?? 0) >= 50).length;

  return (
    <div className="min-h-screen bg-slate-100 text-[#0f172a]">
      {/* Institutional Header */}
      <header className="border-b-2 border-[#c48820] bg-[#000953] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img src="/mtti-logo.jpg" alt="Mukiria TTI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">
                Student Examination Results Portal
              </h1>
              <p className="text-xs text-slate-200">
                {session.name} · <span className="font-mono">{session.reg_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
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
                  Total Exams
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-[#000953]">
                  {submissions.length}
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
                  Average Score
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-[#000953]">
                  {avgScore}%
                </p>
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
                  Passed Papers
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-emerald-700">
                  {passCount}/{submissions.length}
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
                  Pass Rate
                </p>
                <p className="text-3xl font-bold font-mono mt-2 text-emerald-700">
                  {submissions.length > 0 ? Math.round((passCount / submissions.length) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Results list */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-[#000953]">
            Official Examination Scripts & Performance Records
          </h2>

          {submissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 rounded-2xl text-center bg-white border border-slate-300 shadow-sm"
            >
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-base font-semibold text-slate-700">No examination results recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">When your trainer finishes grading, marked scripts will appear here.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {submissions.map((sub, idx) => {
                  const matchedExam =
                    exams.find((e) => e.unit_code === sub.unit_code || e.id === sub.exam_id) ||
                    null;
                  const unified = buildUnifiedGradedExamData(sub, matchedExam, "Alexander Kinoti");
                  return (
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
                            {unified.percentage}% Score
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

                      {/* View Marked Script Button */}
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
                  );
                })}
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
}
