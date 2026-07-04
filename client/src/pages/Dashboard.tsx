/**
 * Dashboard Overview Page
 * Design: Institutional Glassmorphism
 * Shows key metrics, recent submissions, and quick actions
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ChevronRight,
  Award,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Download,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured, verifyDatabaseState } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import type { Exam, Submission } from "@/lib/supabase";
import { format } from "date-fns";

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    verifyDatabaseState();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [{ data: examsData }, { data: subsData }] = await Promise.all([
          supabase.from("exams").select("*").order("created_at", { ascending: false }),
          supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(20),
        ]);
        setExams(examsData ?? []);
        setSubmissions(subsData ?? []);
        console.log("✅ [MTTI Dashboard] Loaded", examsData?.length, "exams,", subsData?.length, "submissions");
      } else {
        setExams(MOCK_EXAMS);
        setSubmissions(MOCK_SUBMISSIONS);
        console.log("ℹ️ [MTTI Dashboard] Using mock data (Supabase not configured)");
      }
    } catch (err) {
      console.error("❌ [MTTI Dashboard] Load error:", err);
      setExams(MOCK_EXAMS);
      setSubmissions(MOCK_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  const totalSubs = submissions.length;
  const gradedSubs = submissions.filter((s) => s.status === "graded").length;
  const pendingSubs = submissions.filter((s) => s.status === "pending").length;
  const avgScore =
    submissions.filter((s) => s.total_score !== null).length > 0
      ? Math.round(
          submissions
            .filter((s) => s.total_score !== null)
            .reduce((sum, s) => sum + (s.total_score ?? 0), 0) /
            submissions.filter((s) => s.total_score !== null).length
        )
      : 0;

  const passRate =
    submissions.filter((s) => s.total_score !== null).length > 0
      ? Math.round(
          (submissions.filter((s) => (s.total_score ?? 0) >= 50).length /
            submissions.filter((s) => s.total_score !== null).length) *
            100
        )
      : 0;

  const stats: StatCard[] = [
    {
      label: "Total Exams",
      value: exams.length,
      icon: FileText,
      color: "oklch(0.72 0.18 160)",
      bg: "oklch(0.72 0.18 160 / 0.12)",
    },
    {
      label: "Submissions",
      value: totalSubs,
      change: `${pendingSubs} pending`,
      icon: Users,
      color: "oklch(0.65 0.15 200)",
      bg: "oklch(0.65 0.15 200 / 0.12)",
    },
    {
      label: "Average Score",
      value: `${avgScore}%`,
      change: `${passRate}% pass rate`,
      icon: TrendingUp,
      color: "oklch(0.75 0.14 80)",
      bg: "oklch(0.75 0.14 80 / 0.12)",
    },
    {
      label: "Pending Review",
      value: pendingSubs,
      icon: Clock,
      color: "oklch(0.65 0.22 25)",
      bg: "oklch(0.65 0.22 25 / 0.12)",
    },
  ];

  const recentSubs = [...submissions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const getScoreClass = (score: number | null) => {
    if (score === null) return "score-average";
    if (score >= 80) return "score-excellent";
    if (score >= 65) return "score-good";
    if (score >= 50) return "score-average";
    return "score-poor";
  };

  return (
    <DashboardLayout
      title="Overview"
      subtitle="Mukiria Technical Training Institute — Institutional Operating System"
    >
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 mb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.18 160 / 0.12) 0%, oklch(0.18 0.012 240 / 0.6) 100%)",
          border: "1px solid oklch(0.72 0.18 160 / 0.2)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url('/manus-storage/mtti-hero-bg_c9ac616d.jpg')`,
            backgroundSize: "cover",
          }}
        />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5" style={{ color: "oklch(0.72 0.18 160)" }} />
              <span className="text-sm font-medium" style={{ color: "oklch(0.72 0.18 160)" }}>
                Academic Year 2024
              </span>
            </div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Grade with Confidence.
            </h2>
            <p className="text-sm" style={{ color: "oklch(0.58 0.012 240)" }}>
              {gradedSubs} assessments graded · {pendingSubs} awaiting review
            </p>
          </div>
          <button
            onClick={() => navigate("/exam-builder")}
            className="btn-emerald flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Exam
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: stat.bg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
            </div>
            <div
              className="text-2xl font-bold mb-0.5"
              style={{ fontFamily: "JetBrains Mono, monospace", color: stat.color }}
            >
              {loading ? "—" : stat.value}
            </div>
            <div className="text-xs font-medium" style={{ color: "oklch(0.58 0.012 240)" }}>
              {stat.label}
            </div>
            {stat.change && (
              <div className="text-xs mt-1" style={{ color: "oklch(0.50 0.010 240)" }}>
                {stat.change}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="glass-card lg:col-span-2"
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
          >
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Recent Submissions
            </h3>
            <button
              onClick={() => navigate("/grading")}
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: "oklch(0.72 0.18 160)" }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "oklch(1 0 0 / 0.08)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded animate-pulse w-1/3" style={{ background: "oklch(1 0 0 / 0.08)" }} />
                    <div className="h-2.5 rounded animate-pulse w-1/4" style={{ background: "oklch(1 0 0 / 0.06)" }} />
                  </div>
                </div>
              ))
            ) : recentSubs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
                No submissions yet
              </div>
            ) : (
              recentSubs.map((sub) => (
                <div key={sub.id} className="data-table-row px-5 py-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "oklch(0.65 0.15 200 / 0.15)",
                      color: "oklch(0.65 0.15 200)",
                      fontFamily: "Syne, sans-serif",
                    }}
                  >
                    {sub.student_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "oklch(0.94 0.005 240)" }}>
                      {sub.student_name}
                    </div>
                    <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                      {sub.reg_number} · {sub.unit_code}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {sub.total_score !== null && (
                      <span
                        className={`font-mono text-sm font-bold ${getScoreClass(sub.total_score)}`}
                      >
                        {sub.total_score}%
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium status-${sub.status}`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Active Exams */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="glass-card"
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
          >
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
            >
              Active Exams
            </h3>
            <button
              onClick={() => navigate("/exam-builder")}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "oklch(0.72 0.18 160)" }}
            >
              Manage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "oklch(1 0 0 / 0.05)" }} />
              ))
            ) : exams.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
                No exams created yet
              </div>
            ) : (
              exams.slice(0, 5).map((exam) => {
                const examSubs = submissions.filter((s) => s.unit_code === exam.unit_code);
                return (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: "oklch(1 0 0 / 0.04)",
                      border: "1px solid oklch(1 0 0 / 0.06)",
                    }}
                    onClick={() => navigate("/grading")}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "oklch(0.72 0.18 160 / 0.15)" }}
                      >
                        <BookOpen className="w-3.5 h-3.5" style={{ color: "oklch(0.72 0.18 160)" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-xs font-bold truncate"
                          style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
                        >
                          {exam.unit_code}
                        </div>
                        <div className="text-xs truncate" style={{ color: "oklch(0.50 0.010 240)" }}>
                          {exam.course_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono" style={{ color: "oklch(0.72 0.18 160)" }}>
                            {examSubs.length} submissions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Build Exam", icon: FileText, path: "/exam-builder", color: "oklch(0.72 0.18 160)" },
          { label: "Grade Papers", icon: ClipboardCheck, path: "/grading", color: "oklch(0.65 0.15 200)" },
          { label: "View Analytics", icon: Award, path: "/analytics", color: "oklch(0.75 0.14 80)" },
          { label: "Export Reports", icon: Download, path: "/reports", color: "oklch(0.70 0.16 250)" },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="glass-card p-4 flex flex-col items-center gap-2 text-center transition-all"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${action.color.replace(")", " / 0.15)")}` }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: "oklch(0.80 0.008 240)" }}>
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </DashboardLayout>
  );
}


