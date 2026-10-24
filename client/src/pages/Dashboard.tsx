/**
 * Dashboard Overview Page
 * Design: Institutional Glassmorphism
 * Shows key metrics, recent submissions, and quick actions
 */

import { useEffect, useState, useMemo } from "react";
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
  Calendar,
  MapPin,
  Radio,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { supabase, isSupabaseConfigured, verifyDatabaseState } from "@/lib/supabase";
import { useExam } from "@/contexts/ExamContext";
import type { Exam, Submission } from "@/lib/supabase";
import { format } from "date-fns";
import { getTrainerLiveStatus } from "@/lib/academicCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useTrainees } from "@/contexts/TraineeContext";
import { getCurrentTrainerProfile } from "@/lib/timetableSyncService";

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  path?: string;
  badge?: string;
  badgeColor?: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { exams, submissions } = useExam();
  const { trainees } = useTrainees();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // Scope mode: Trainers default to their assigned classes, Admins/HODs see all
  const [scopeMode, setScopeMode] = useState<"my_classes" | "institutional">(() => {
    return user?.role === "admin" || user?.role === "hod" ? "institutional" : "my_classes";
  });

  useEffect(() => {
    verifyDatabaseState();
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  const trainerProfile = useMemo(() => getCurrentTrainerProfile(user), [user]);
  const trainerName = trainerProfile.name || user?.name || "Alexander Kinoti";
  const liveStatus = useMemo(() => getTrainerLiveStatus(trainerName, now), [trainerName, now]);
  const { context } = liveStatus;

  // Normalized assigned classes and units for the active trainer
  const trainerClasses = useMemo(() => {
    return (trainerProfile.classes || []).map((c) => c.trim().toUpperCase());
  }, [trainerProfile]);

  const trainerUnits = useMemo(() => {
    const raw = [...(trainerProfile.units || []), ...(user?.assigned_units || [])];
    return Array.from(new Set(raw.map((u) => u.trim().toUpperCase()))).filter(Boolean);
  }, [trainerProfile, user]);

  // Scoped exams matching the trainer's assigned classes or units
  const scopedExams = useMemo(() => {
    if (scopeMode === "institutional" || user?.role === "admin" || user?.role === "hod") {
      return exams;
    }
    if (trainerClasses.length === 0 && trainerUnits.length === 0) return exams;

    const filtered = exams.filter((exam) => {
      const codeUpper = (exam.unit_code || "").toUpperCase();
      const titleUpper = ((exam.payload as any)?.title || exam.course_name || "").toUpperCase();
      const courseUpper = (exam.course_name || "").toUpperCase();
      const examClasses: string[] = (exam.payload as any)?.classes || [];

      // 1. Direct unit match
      const matchesUnit = trainerUnits.some(
        (tu) =>
          (tu.length >= 3 && codeUpper.includes(tu)) ||
          (codeUpper.length >= 3 && tu.includes(codeUpper)) ||
          titleUpper.includes(tu) ||
          courseUpper.includes(tu)
      );
      if (matchesUnit) return true;

      // 2. Class match
      const matchesClass = trainerClasses.some(
        (tc) =>
          examClasses.some((ec) => ec.toUpperCase().includes(tc) || tc.includes(ec.toUpperCase())) ||
          titleUpper.includes(tc) ||
          courseUpper.includes(tc)
      );
      if (matchesClass) return true;

      // 3. Subject-area keyword matching (Digital Literacy / Computer Operation / Discrete Math)
      if (trainerUnits.some((tu) => tu.includes("DIGITAL LITERACY")) && (codeUpper.includes("061155101A") || titleUpper.includes("DIGITAL LITERACY"))) {
        // Exclude foreign department-specific tags if trainer does not teach that department
        if (titleUpper.includes("FBS") && !trainerClasses.some((tc) => tc.includes("FBS"))) return false;
        return true;
      }
      if (trainerUnits.some((tu) => tu.includes("COMPUTER OPERATION") || tu.includes("ESSENTIALS")) && (codeUpper.includes("ICT") || titleUpper.includes("COMPUTER"))) {
        return true;
      }
      if (trainerUnits.some((tu) => tu.includes("DISCRETE")) && titleUpper.includes("DISCRETE")) {
        return true;
      }

      return false;
    });

    return filtered.length > 0 ? filtered : exams.slice(0, 5);
  }, [exams, scopeMode, user, trainerClasses, trainerUnits]);

  // Scoped submissions matching the trainer's assigned trainees and exams
  const scopedSubmissions = useMemo(() => {
    if (scopeMode === "institutional" || user?.role === "admin" || user?.role === "hod") {
      return submissions;
    }
    if (trainerClasses.length === 0 && trainerUnits.length === 0) return submissions;

    const scopedExamIds = new Set(scopedExams.map((e) => e.id));
    const scopedUnitCodes = new Set(scopedExams.map((e) => (e.unit_code || "").toUpperCase()));

    // Trainees belonging to this trainer's cohorts
    const myTrainees = trainees.filter((t) => {
      const tc = (t.classCode || "").toUpperCase();
      return trainerClasses.some((cls) => tc.includes(cls) || cls.includes(tc));
    });
    const allowedRegNos = new Set(myTrainees.map((t) => (t.admNo || t.regCode || "").trim().toUpperCase()).filter(Boolean));
    const allowedNames = new Set(myTrainees.map((t) => (t.name || "").trim().toLowerCase()).filter(Boolean));

    const filtered = submissions.filter((sub) => {
      const subAdm = (sub.reg_number || "").trim().toUpperCase();
      const subName = (sub.student_name || "").trim().toLowerCase();
      const subUnit = (sub.unit_code || "").trim().toUpperCase();

      // 1. Direct candidate match in trainer's assigned classes
      if (allowedRegNos.has(subAdm) || allowedNames.has(subName)) {
        return true;
      }

      // 2. Cross-check against known trainees roster
      const candidate = trainees.find((t) => {
        const tAdm = (t.admNo || t.regCode || "").trim().toUpperCase();
        return tAdm && tAdm === subAdm;
      });
      if (candidate) {
        const candClass = (candidate.classCode || "").toUpperCase();
        return trainerClasses.some((cls) => candClass.includes(cls) || cls.includes(candClass));
      }

      // 3. Fallback for subUnit matching scoped exams:
      // If candidate is in FBS (starts with 13 or FBS) and trainer does NOT teach FBS, exclude!
      if (scopedUnitCodes.has(subUnit) || (Boolean(sub.exam_id) && scopedExamIds.has(sub.exam_id!))) {
        if (subAdm.startsWith("13") && !trainerClasses.some((c) => c.includes("FBS"))) {
          return false;
        }
        return true;
      }

      return false;
    });

    return filtered;
  }, [submissions, scopeMode, user, trainerClasses, trainerUnits, scopedExams, trainees]);

  const totalSubs = scopedSubmissions.length;
  const gradedSubs = scopedSubmissions.filter((s) => s.status === "graded").length;
  const pendingSubs = scopedSubmissions.filter((s) => s.status === "pending").length;
  const avgScore =
    scopedSubmissions.filter((s) => s.total_score !== null).length > 0
      ? Math.round(
          scopedSubmissions
            .filter((s) => s.total_score !== null)
            .reduce((sum, s) => sum + (s.total_score ?? 0), 0) /
            scopedSubmissions.filter((s) => s.total_score !== null).length
        )
      : 0;

  const passRate =
    scopedSubmissions.filter((s) => s.total_score !== null).length > 0
      ? Math.round(
          (scopedSubmissions.filter((s) => (s.total_score ?? 0) >= 50).length /
            scopedSubmissions.filter((s) => s.total_score !== null).length) *
            100
        )
      : 0;

  const stats: StatCard[] = [
    {
      label: "Total Exams",
      value: scopedExams.length,
      icon: FileText,
      color: "#000953",
      bg: "rgba(0, 9, 83, 0.08)",
      path: "/trainer/exam-builder",
    },
    {
      label: "Submissions",
      value: totalSubs,
      change: `${pendingSubs} pending`,
      icon: Users,
      color: "#000953",
      bg: "rgba(0, 9, 83, 0.08)",
      path: "/trainer/grading",
    },
    {
      label: "Average Score",
      value: `${avgScore}%`,
      change: `${passRate}% pass rate`,
      icon: TrendingUp,
      color: "#c48820",
      bg: "rgba(196, 136, 32, 0.12)",
      path: "/trainer/analytics",
    },
    {
      label: "Pending Review",
      value: pendingSubs,
      change: pendingSubs > 0 ? "Requires grading" : "All up to date",
      badge: pendingSubs > 0 ? "Action Required" : undefined,
      badgeColor: pendingSubs > 0 ? "bg-amber-100 text-amber-800 border-amber-300" : undefined,
      icon: Clock,
      color: pendingSubs > 0 ? "#b45309" : "#c48820",
      bg: pendingSubs > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(196, 136, 32, 0.12)",
      path: "/trainer/grading",
    },
  ];

  const recentSubs = [...scopedSubmissions]
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
    <TrainerLayout
      title="Overview"
      subtitle="Mukiria Technical Training Institute — Institutional Operating System"
    >
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-slate-300 border-l-4 border-l-[#000953] rounded-xl shadow-sm p-5 mb-4 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#000953]/10 text-[#000953] border border-[#000953]/20">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Academic Year {context.academicYear} • {context.term} • Week {context.currentWeek}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-700 px-2.5 py-1 rounded bg-slate-100 border border-slate-300">
                {context.formattedDate} · {context.timeFormatted}
              </span>
              {/* Scope Switcher: My Classes vs Institutional */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-300 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setScopeMode("my_classes")}
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    scopeMode === "my_classes"
                      ? "bg-[#000953] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#000953]"
                  }`}
                >
                  My Classes ({trainerClasses.length || 4})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode("institutional")}
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    scopeMode === "institutional"
                      ? "bg-[#000953] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#000953]"
                  }`}
                >
                  All Institute
                </button>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1 text-[#000953]">
              Grade with Confidence.
            </h2>
            <p className="text-sm text-slate-600">
              {gradedSubs} assessments graded · {pendingSubs} awaiting review · Current Status: <strong className="text-emerald-700">{context.statusText}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/trainer/timetable")}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-white border border-slate-300 text-[#000953] hover:bg-slate-50 transition shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#c48820]" />
              Master Timetable
            </button>
            <button
              onClick={() => navigate("/trainer/exam-builder")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#000953] hover:bg-[#000e7a] text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#c48820]" />
              New Exam
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live Trainer Timetable Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white border border-slate-300 border-l-4 border-l-[#c48820] rounded-xl shadow-sm p-4 sm:p-5 mb-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-[#c48820]/30 text-[#c48820] flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#c48820]">
                  Live Class Schedule • {trainerName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-[#000953] border border-slate-300">
                  {context.dayName}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mt-0.5">
                {liveStatus.currentSession ? (
                  <span className="text-emerald-700">
                    In Session Now: {liveStatus.currentSession.unitTitle} ({liveStatus.currentSession.classCode})
                  </span>
                ) : liveStatus.nextSession ? (
                  <span className="text-[#000953]">
                    Next Class: {liveStatus.nextSession.unitTitle} ({liveStatus.nextSession.classCode}) at {liveStatus.nextSession.startTime}
                  </span>
                ) : (
                  <span className="text-[#0f172a]">{liveStatus.summary}</span>
                )}
              </h3>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                {(liveStatus.currentSession || liveStatus.nextSession) && (
                  <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    Venue: <strong>{(liveStatus.currentSession || liveStatus.nextSession)?.venue}</strong>
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-[#000953]" />
                  Time: {(liveStatus.currentSession || liveStatus.nextSession)?.timeRange || context.statusText}
                </span>
                <span className="text-slate-500">
                  · {liveStatus.todaySessions?.length || 0} session(s) on {context.dayName}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              onClick={() => navigate("/trainer/timetable")}
              className="text-xs font-bold px-3.5 py-2 rounded-lg bg-[#000953] hover:bg-[#000e7a] text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-[#c48820]" />
              View Timetable
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => stat.path && navigate(stat.path)}
            role={stat.path ? "button" : undefined}
            tabIndex={stat.path ? 0 : undefined}
            className={`bg-white border border-slate-300 rounded-xl shadow-sm p-4 sm:p-5 relative overflow-hidden transition-all duration-200 ${
              stat.path
                ? "cursor-pointer hover:border-[#000953] hover:shadow-md hover:-translate-y-0.5 group"
                : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: stat.bg }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              {stat.badge && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide animate-pulse ${stat.badgeColor}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  {stat.badge}
                </span>
              )}
              {stat.path && !stat.badge && (
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#000953] group-hover:translate-x-0.5 transition-all" />
              )}
            </div>
            <div
              className="text-2xl font-bold mb-0.5 font-mono"
              style={{ color: stat.color }}
            >
              {loading ? "—" : stat.value}
            </div>
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{stat.label}</span>
            </div>
            {stat.change && (
              <div className="text-xs mt-1 text-slate-500 font-medium">
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
          className="bg-white border border-slate-300 rounded-xl shadow-sm lg:col-span-2 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
            <h3 className="font-bold text-sm text-[#000953]">
              Recent Submissions
            </h3>
            <button
              onClick={() => navigate("/trainer/grading")}
              className="flex items-center gap-1 text-xs font-bold text-[#000953] hover:text-[#c48820] transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full animate-pulse bg-slate-200" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded animate-pulse w-1/3 bg-slate-200" />
                    <div className="h-2.5 rounded animate-pulse w-1/4 bg-slate-100" />
                  </div>
                </div>
              ))
            ) : recentSubs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                No submissions yet
              </div>
            ) : (
              recentSubs.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/trainer/grading?search=${encodeURIComponent(sub.reg_number || sub.student_name)}`)}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  title={`Open grading details for ${sub.student_name}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[#000953]/10 text-[#000953] group-hover:bg-[#000953] group-hover:text-white transition-colors">
                    {sub.student_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate text-[#0f172a] group-hover:text-[#000953] transition-colors">
                      {sub.student_name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
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
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider status-${sub.status}`}
                    >
                      {sub.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#000953] group-hover:translate-x-0.5 transition-all" />
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
          className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60">
            <h3 className="font-bold text-sm text-[#000953]">
              Active Exams
            </h3>
            <button
              onClick={() => navigate("/trainer/exam-builder")}
              className="flex items-center gap-1 text-xs font-bold text-[#000953] hover:text-[#c48820] transition-colors"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse bg-slate-100" />
              ))
            ) : exams.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No exams created yet
              </div>
            ) : (
              scopedExams.slice(0, 5).map((exam) => {
                const examSubs = scopedSubmissions.filter((s) => s.unit_code === exam.unit_code);
                return (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl cursor-pointer transition-all bg-slate-50 hover:bg-slate-100 border border-slate-200"
                    onClick={() => navigate("/trainer/grading")}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#000953]/10">
                        <BookOpen className="w-3.5 h-3.5 text-[#000953]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-[#000953]">
                          {exam.unit_code}
                        </div>
                        <div className="text-xs truncate text-slate-600">
                          {exam.course_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-[#c48820]">
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
        className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: "Master Timetable", icon: Calendar, path: "/trainer/timetable", color: "#000953", bg: "rgba(0, 9, 83, 0.08)" },
          { label: "Class Register", icon: ClipboardCheck, path: "/trainer/class-register", color: "#000953", bg: "rgba(0, 9, 83, 0.08)" },
          { label: "Build Exam", icon: FileText, path: "/trainer/exam-builder", color: "#c48820", bg: "rgba(196, 136, 32, 0.12)" },
          { label: "Grade Papers", icon: Award, path: "/trainer/grading", color: "#c48820", bg: "rgba(196, 136, 32, 0.12)" },
          { label: "View Analytics", icon: TrendingUp, path: "/trainer/analytics", color: "#000953", bg: "rgba(0, 9, 83, 0.08)" },
          { label: "Export Reports", icon: Download, path: "/trainer/reports", color: "#000953", bg: "rgba(0, 9, 83, 0.08)" },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="bg-white border border-slate-300 hover:border-[#000953] rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-[1.02]"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: action.bg }}
            >
              <action.icon className="w-5 h-5" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-bold text-[#0f172a]">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </TrainerLayout>
  );
}


