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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-slate-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.15 160)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-8 blur-3xl pointer-events-none"
          style={{ background: "oklch(0.65 0.15 200)" }}
        />

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "oklch(0.16 0.012 240 / 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              boxShadow:
                "0 24px 64px oklch(0 0 0 / 0.5), 0 0 0 1px oklch(0.72 0.18 160 / 0.08)",
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border bg-white flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(196, 136, 32, 0.1)",
                    borderColor: "var(--accent)",
                  }}
                >
                  <img
                    src="/mtti-logo.jpg"
                    alt="Mukiria TTI Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "Maiandra GD, sans-serif",
                  color: "var(--accent)",
                }}
              >
                Student Results
              </h1>
              <p style={{ color: "var(--primary-foreground)", opacity: 0.8 }}>
                Mukiria Technical Training Institute
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border transition-colors"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-slate-900/50 border transition-colors"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.1)",
                      color: "oklch(0.94 0.005 240)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" style={{ color: "oklch(0.58 0.012 240)" }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: "oklch(0.58 0.012 240)" }} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3 rounded-lg font-semibold transition-all duration-150 disabled:opacity-50 hover:brightness-110"
                style={{
                  background: "var(--accent)",
                  color: "#ffffff",
                }}
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "View My Results"
                )}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: "oklch(0.45 0.010 240)" }}>
              Your exam results will appear here after login
            </p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div
        className="border-b"
        style={{
          borderColor: "rgba(255, 255, 255, 0.1)",
          background: "rgba(0, 9, 83, 0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border bg-white flex items-center justify-center shrink-0">
              <img src="/mtti-logo.jpg" alt="Mukiria TTI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "Maiandra GD, sans-serif", color: "var(--accent)" }}>
                My Results Portal
              </h1>
              <p className="text-xs text-slate-400">{session.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-xs font-semibold"
            style={{
              background: "rgba(196, 136, 32, 0.15)",
              color: "var(--accent)",
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl"
            style={{
              background: "oklch(0.16 0.012 240 / 0.6)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                  Total Exams
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "oklch(0.94 0.005 240)" }}>
                  {submissions.length}
                </p>
              </div>
              <BookOpen className="w-8 h-8" style={{ color: "oklch(0.72 0.18 160)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl"
            style={{
              background: "oklch(0.16 0.012 240 / 0.6)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                  Average Score
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "oklch(0.94 0.005 240)" }}>
                  {avgScore}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "oklch(0.72 0.18 160)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl"
            style={{
              background: "oklch(0.16 0.012 240 / 0.6)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                  Passed
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "oklch(0.72 0.18 160)" }}>
                  {passCount}/{submissions.length}
                </p>
              </div>
              <Award className="w-8 h-8" style={{ color: "oklch(0.72 0.18 160)" }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl"
            style={{
              background: "oklch(0.16 0.012 240 / 0.6)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                  Pass Rate
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "oklch(0.94 0.005 240)" }}>
                  {submissions.length > 0 ? Math.round((passCount / submissions.length) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: "oklch(0.72 0.18 160)" }} />
            </div>
          </motion.div>
        </div>

        {/* Results list */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: "oklch(0.94 0.005 240)" }}>
            Exam Results
          </h2>

          {submissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-xl text-center"
              style={{
                background: "oklch(0.16 0.012 240 / 0.6)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: "oklch(0.58 0.012 240)" }} />
              <p style={{ color: "oklch(0.58 0.012 240)" }}>No exam results yet</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {submissions.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-xl"
                    style={{
                      background: "oklch(0.16 0.012 240 / 0.6)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: "oklch(0.94 0.005 240)" }}>
                          {sub.unit_code}
                        </h3>
                        <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm mt-1">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold" style={{ color: "oklch(0.72 0.18 160)" }}>
                          {sub.total_score !== null ? Math.round(sub.total_score) : 0}
                        </p>
                        <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                          marks scored
                        </p>
                        {(sub.total_score ?? 0) >= 35 ? (
                          <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.18 160)" }}>
                            ✓ Passed
                          </p>
                        ) : (
                          <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.22 25)" }}>
                            ✗ Failed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* View Marked Script Button */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        Official Simulated Red Pen Examination Script & Checklists
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubForScript(sub)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 transition shadow-sm"
                        >
                          <PenTool className="w-3.5 h-3.5 text-red-400" />
                          <span>Theory Paper (Red Pen)</span>
                        </button>
                        <button
                          onClick={() => setIsPracticalChecklistOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 transition shadow-sm"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-amber-400" />
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
        exam={selectedSubForScript ? (exams.find(e => e.unit_code === selectedSubForScript.unit_code) || null) : null}
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
