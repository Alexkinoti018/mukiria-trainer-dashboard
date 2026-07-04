/**
 * Analytics Module
 * Design: Institutional Glassmorphism
 * Class averages, pass rates, performance trends using Recharts
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  BarChart3,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_EXAMS, MOCK_SUBMISSIONS } from "@/lib/mockData";
import type { Exam, Submission } from "@/lib/supabase";

const CHART_COLORS = {
  emerald: "oklch(0.72 0.18 160)",
  teal: "oklch(0.65 0.15 200)",
  amber: "oklch(0.75 0.14 80)",
  red: "oklch(0.65 0.22 25)",
  violet: "oklch(0.70 0.16 290)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: "oklch(0.16 0.012 240)",
          border: "1px solid oklch(1 0 0 / 0.15)",
          color: "oklch(0.94 0.005 240)",
        }}
      >
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {p.name.toLowerCase().includes("rate") || p.name.toLowerCase().includes("score") ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const [{ data: examsData }, { data: subsData }] = await Promise.all([
          supabase.from("exams").select("*"),
          supabase.from("submissions").select("*"),
        ]);
        setExams(examsData ?? []);
        setSubmissions(subsData ?? []);
      } else {
        setExams(MOCK_EXAMS);
        setSubmissions(MOCK_SUBMISSIONS);
      }
    } catch {
      setExams(MOCK_EXAMS);
      setSubmissions(MOCK_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  // ── Compute analytics ─────────────────────────────────────
  const gradedSubs = submissions.filter((s) => s.total_score !== null);

  // Per-unit averages
  const unitStats = exams.map((exam) => {
    const unitSubs = gradedSubs.filter((s) => s.unit_code === exam.unit_code);
    const avg =
      unitSubs.length > 0
        ? unitSubs.reduce((s, sub) => s + (sub.total_score ?? 0), 0) / unitSubs.length
        : 0;
    const passRate =
      unitSubs.length > 0
        ? (unitSubs.filter((s) => (s.total_score ?? 0) >= 50).length / unitSubs.length) * 100
        : 0;
    return {
      unit: exam.unit_code,
      course: exam.course_name,
      submissions: unitSubs.length,
      average: Math.round(avg * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
    };
  });

  // Score distribution
  const scoreDistribution = [
    { range: "0-49 (F)", count: gradedSubs.filter((s) => (s.total_score ?? 0) < 50).length, color: CHART_COLORS.red },
    { range: "50-59 (D)", count: gradedSubs.filter((s) => (s.total_score ?? 0) >= 50 && (s.total_score ?? 0) < 60).length, color: CHART_COLORS.amber },
    { range: "60-69 (C)", count: gradedSubs.filter((s) => (s.total_score ?? 0) >= 60 && (s.total_score ?? 0) < 70).length, color: CHART_COLORS.teal },
    { range: "70-79 (B)", count: gradedSubs.filter((s) => (s.total_score ?? 0) >= 70 && (s.total_score ?? 0) < 80).length, color: CHART_COLORS.violet },
    { range: "80-100 (A)", count: gradedSubs.filter((s) => (s.total_score ?? 0) >= 80).length, color: CHART_COLORS.emerald },
  ];

  // Status breakdown for pie
  const statusData = [
    { name: "Pending", value: submissions.filter((s) => s.status === "pending").length, color: CHART_COLORS.amber },
    { name: "Graded", value: submissions.filter((s) => s.status === "graded").length, color: CHART_COLORS.teal },
    { name: "Reviewed", value: submissions.filter((s) => s.status === "reviewed").length, color: CHART_COLORS.emerald },
  ].filter((d) => d.value > 0);

  // Overall stats
  const overallAvg =
    gradedSubs.length > 0
      ? Math.round(gradedSubs.reduce((s, sub) => s + (sub.total_score ?? 0), 0) / gradedSubs.length)
      : 0;
  const overallPassRate =
    gradedSubs.length > 0
      ? Math.round((gradedSubs.filter((s) => (s.total_score ?? 0) >= 50).length / gradedSubs.length) * 100)
      : 0;
  const topScore = gradedSubs.length > 0 ? Math.max(...gradedSubs.map((s) => s.total_score ?? 0)) : 0;

  return (
    <DashboardLayout title="Analytics" subtitle="Performance insights and trends">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Overall Average",
            value: `${overallAvg}%`,
            icon: BarChart3,
            color: CHART_COLORS.emerald,
            bg: "oklch(0.72 0.18 160 / 0.12)",
          },
          {
            label: "Pass Rate",
            value: `${overallPassRate}%`,
            icon: Target,
            color: CHART_COLORS.teal,
            bg: "oklch(0.65 0.15 200 / 0.12)",
          },
          {
            label: "Total Students",
            value: new Set(submissions.map((s) => s.reg_number)).size,
            icon: Users,
            color: CHART_COLORS.amber,
            bg: "oklch(0.75 0.14 80 / 0.12)",
          },
          {
            label: "Top Score",
            value: `${topScore}%`,
            icon: Award,
            color: CHART_COLORS.violet,
            bg: "oklch(0.70 0.16 290 / 0.12)",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono mb-0.5" style={{ color: kpi.color }}>
              {loading ? "—" : kpi.value}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.58 0.012 240)" }}>
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Unit Averages Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5"
        >
          <h3
            className="font-bold text-sm mb-4"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Average Score by Unit
          </h3>
          {loading || unitStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={unitStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis
                  dataKey="unit"
                  tick={{ fill: "oklch(0.58 0.012 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.58 0.012 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="average" name="Avg Score" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="passRate" name="Pass Rate" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5"
        >
          <h3
            className="font-bold text-sm mb-4"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Score Distribution
          </h3>
          {loading || gradedSubs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
              No graded submissions
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: "oklch(0.58 0.012 240)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.58 0.012 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submission Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-5"
        >
          <h3
            className="font-bold text-sm mb-4"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Submission Status
          </h3>
          {loading || statusData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "oklch(0.80 0.008 240)", fontSize: "11px" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Per-Unit Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h3
            className="font-bold text-sm mb-4"
            style={{ fontFamily: "Syne, sans-serif", color: "oklch(0.94 0.005 240)" }}
          >
            Unit Performance Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(1 0 0 / 0.08)" }}>
                  {["Unit Code", "Course", "Students", "Avg Score", "Pass Rate"].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-2 pr-4 text-xs font-semibold"
                      style={{ color: "oklch(0.50 0.010 240)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="py-2 pr-4">
                          <div className="h-4 rounded animate-pulse" style={{ background: "oklch(1 0 0 / 0.08)" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : unitStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  unitStats.map((unit) => (
                    <tr key={unit.unit} className="data-table-row">
                      <td className="py-2.5 pr-4">
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: "oklch(0.72 0.18 160)" }}
                        >
                          {unit.unit}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs truncate max-w-32 block" style={{ color: "oklch(0.80 0.008 240)" }}>
                          {unit.course}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs font-mono" style={{ color: "oklch(0.65 0.15 200)" }}>
                          {unit.submissions}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${unit.average}%`,
                              maxWidth: "60px",
                              background: unit.average >= 70 ? CHART_COLORS.emerald : unit.average >= 50 ? CHART_COLORS.amber : CHART_COLORS.red,
                            }}
                          />
                          <span
                            className="text-xs font-mono font-bold"
                            style={{
                              color: unit.average >= 70 ? CHART_COLORS.emerald : unit.average >= 50 ? CHART_COLORS.amber : CHART_COLORS.red,
                            }}
                          >
                            {unit.average}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span
                          className="text-xs font-mono font-bold"
                          style={{
                            color: unit.passRate >= 70 ? CHART_COLORS.emerald : unit.passRate >= 50 ? CHART_COLORS.amber : CHART_COLORS.red,
                          }}
                        >
                          {unit.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
