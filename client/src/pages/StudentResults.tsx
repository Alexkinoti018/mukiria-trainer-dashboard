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
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import type { Submission } from "@/lib/supabase";

interface StudentSession {
  email: string;
  name: string;
  reg_number: string;
}

export default function StudentResults() {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
          await loadSubmissions(authSession.user.email ?? "");
        }
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (email: string) => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .eq("student_email", email)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSubmissions(data ?? []);
        console.log("✅ [Student Results] Loaded", data?.length, "submissions");
      }
    } catch (err) {
      console.error("❌ [Student Results] Load error:", err);
      toast.error("Failed to load results");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      if (!isSupabaseConfigured()) {
        toast.error("System not configured");
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
        await loadSubmissions(data.user.email ?? "");
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
      await supabase.auth.signOut();
      setSession(null);
      setSubmissions([]);
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "oklch(0.72 0.18 160 / 0.15)",
                    border: "1px solid oklch(0.72 0.18 160 / 0.4)",
                  }}
                >
                  <Award className="w-8 h-8" style={{ color: "oklch(0.72 0.18 160)" }} />
                </div>
              </div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "Syne, sans-serif",
                  color: "oklch(0.94 0.005 240)",
                }}
              >
                Student Results
              </h1>
              <p style={{ color: "oklch(0.58 0.012 240)" }}>
                Mukiria Technical Training Institute
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "oklch(0.72 0.18 160)" }}
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
                    borderColor: "oklch(1 0 0 / 0.1)",
                    color: "oklch(0.94 0.005 240)",
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "oklch(0.72 0.18 160)" }}
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
                      borderColor: "oklch(1 0 0 / 0.1)",
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
                className="w-full py-3 rounded-lg font-semibold transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "oklch(0.72 0.18 160)",
                  color: "oklch(0.94 0.005 240)",
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
          borderColor: "oklch(1 0 0 / 0.1)",
          background: "oklch(0.16 0.012 240 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "oklch(0.94 0.005 240)" }}>
              My Results
            </h1>
            <p style={{ color: "oklch(0.58 0.012 240)" }}>{session.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "oklch(0.65 0.22 25 / 0.15)",
              color: "oklch(0.75 0.18 25)",
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
                          {sub.total_score ?? 0}
                        </p>
                        <p style={{ color: "oklch(0.58 0.012 240)" }} className="text-sm">
                          out of 100
                        </p>
                        {(sub.total_score ?? 0) >= 50 ? (
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
