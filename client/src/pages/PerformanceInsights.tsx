/**
 * Student Performance Insights
 * Design: Institutional Glassmorphism
 * Predictive analytics with at-risk student detection and learning recommendations
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  Users,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

interface StudentPerformance {
  id: string;
  name: string;
  regNumber: string;
  avgScore: number;
  trend: number;
  riskLevel: "low" | "medium" | "high";
  examsAttempted: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastExamScore: number;
  predictedScore: number;
  improvementPotential: number;
}

export default function PerformanceInsights() {
  const [students, setStudents] = useState<StudentPerformance[]>([
    {
      id: "s1",
      name: "Alice Johnson",
      regNumber: "MT-2024-001",
      avgScore: 82,
      trend: 5,
      riskLevel: "low",
      examsAttempted: 4,
      strengths: ["Problem Solving", "Time Management", "Conceptual Understanding"],
      weaknesses: ["Calculation Accuracy"],
      recommendations: ["Continue current study pattern", "Practice more calculation problems"],
      lastExamScore: 85,
      predictedScore: 87,
      improvementPotential: 12,
    },
    {
      id: "s2",
      name: "Bob Smith",
      regNumber: "MT-2024-002",
      avgScore: 58,
      trend: -3,
      riskLevel: "high",
      examsAttempted: 4,
      strengths: ["Attendance", "Participation"],
      weaknesses: ["Conceptual Understanding", "Problem Solving", "Time Management"],
      recommendations: [
        "Schedule tutoring sessions",
        "Review fundamental concepts",
        "Practice previous exam papers",
      ],
      lastExamScore: 52,
      predictedScore: 55,
      improvementPotential: 35,
    },
    {
      id: "s3",
      name: "Carol Davis",
      regNumber: "MT-2024-003",
      avgScore: 75,
      trend: 2,
      riskLevel: "medium",
      examsAttempted: 4,
      strengths: ["Conceptual Understanding", "Attendance"],
      weaknesses: ["Exam Technique", "Time Management"],
      recommendations: [
        "Practice timed mock exams",
        "Work on exam strategy",
        "Review time allocation per question",
      ],
      lastExamScore: 73,
      predictedScore: 78,
      improvementPotential: 22,
    },
    {
      id: "s4",
      name: "David Lee",
      regNumber: "MT-2024-004",
      avgScore: 90,
      trend: 8,
      riskLevel: "low",
      examsAttempted: 4,
      strengths: ["Problem Solving", "Conceptual Understanding", "Calculation Accuracy"],
      weaknesses: [],
      recommendations: ["Consider advanced topics", "Mentor other students"],
      lastExamScore: 92,
      predictedScore: 94,
      improvementPotential: 8,
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high">("all");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => (filterRisk === "all" ? true : s.riskLevel === filterRisk));
  }, [students, filterRisk]);

  const stats = useMemo(() => {
    const lowRisk = students.filter((s) => s.riskLevel === "low").length;
    const mediumRisk = students.filter((s) => s.riskLevel === "medium").length;
    const highRisk = students.filter((s) => s.riskLevel === "high").length;
    const avgOverall = (students.reduce((sum, s) => sum + s.avgScore, 0) / students.length).toFixed(1);

    return { lowRisk, mediumRisk, highRisk, avgOverall };
  }, [students]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return { bg: "oklch(0.65 0.22 120 / 0.1)", text: "oklch(0.65 0.22 120)" };
      case "medium":
        return { bg: "oklch(0.72 0.18 50 / 0.1)", text: "oklch(0.72 0.18 50)" };
      case "high":
        return { bg: "oklch(0.65 0.22 25 / 0.1)", text: "oklch(0.65 0.22 25)" };
      default:
        return { bg: "oklch(1 0 0 / 0.05)", text: "oklch(0.58 0.012 240)" };
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <Award className="w-4 h-4" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const sendIntervention = (studentId: string) => {
    toast.success("Intervention Scheduled", {
      description: "Tutoring session scheduled for this student",
    });
  };

  return (
    <DashboardLayout
      title="Performance Insights"
      subtitle="Predictive analytics and at-risk student detection"
    >
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3">
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Class Average
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.18 160)" }}>
              {stats.avgOverall}%
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Low Risk
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.65 0.22 120)" }}>
              {stats.lowRisk}
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Medium Risk
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.18 50)" }}>
              {stats.mediumRisk}
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              High Risk
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.65 0.22 25)" }}>
              {stats.highRisk}
            </div>
          </div>
          <div
            className="glass-card p-4 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
              Total Students
            </div>
            <div className="text-2xl font-bold mt-2" style={{ color: "oklch(0.58 0.012 240)" }}>
              {students.length}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["all", "low", "medium", "high"].map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filterRisk === risk ? "oklch(0.72 0.18 160)" : "oklch(1 0 0 / 0.06)",
                color: filterRisk === risk ? "white" : "oklch(0.58 0.012 240)",
              }}
            >
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </button>
          ))}
        </div>

        {/* Students List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredStudents.map((student) => {
              const riskColor = getRiskColor(student.riskLevel);
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="glass-card p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    background: "oklch(1 0 0 / 0.04)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                  }}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-sm" style={{ color: "oklch(0.94 0.005 240)" }}>
                          {student.name}
                        </div>
                        <div
                          className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                          style={{ background: riskColor.bg, color: riskColor.text }}
                        >
                          {getRiskIcon(student.riskLevel)}
                          {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)}
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: "oklch(0.50 0.010 240)" }}>
                        {student.regNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: "oklch(0.72 0.18 160)" }}>
                        {student.avgScore}%
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        {student.trend > 0 ? (
                          <ArrowUp className="w-3 h-3" style={{ color: "oklch(0.65 0.22 120)" }} />
                        ) : (
                          <ArrowDown className="w-3 h-3" style={{ color: "oklch(0.65 0.22 25)" }} />
                        )}
                        <span
                          style={{
                            color: student.trend > 0 ? "oklch(0.65 0.22 120)" : "oklch(0.65 0.22 25)",
                          }}
                        >
                          {Math.abs(student.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Bars */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div style={{ color: "oklch(0.50 0.010 240)" }} className="mb-1">
                        Last Exam
                      </div>
                      <div
                        className="h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "oklch(0.72 0.18 160 / 0.2)",
                          color: "oklch(0.72 0.18 160)",
                          width: "100%",
                        }}
                      >
                        {student.lastExamScore}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "oklch(0.50 0.010 240)" }} className="mb-1">
                        Predicted
                      </div>
                      <div
                        className="h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "oklch(0.65 0.22 120 / 0.2)",
                          color: "oklch(0.65 0.22 120)",
                          width: "100%",
                        }}
                      >
                        {student.predictedScore}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "oklch(0.50 0.010 240)" }} className="mb-1">
                        Potential
                      </div>
                      <div
                        className="h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "oklch(0.72 0.18 50 / 0.2)",
                          color: "oklch(0.72 0.18 50)",
                          width: "100%",
                        }}
                      >
                        +{student.improvementPotential}%
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div style={{ color: "oklch(0.50 0.010 240)" }}>
                      {student.examsAttempted} exams • {student.strengths.length} strengths
                    </div>
                    {student.riskLevel === "high" && (
                      <div
                        className="px-2 py-1 rounded-lg font-medium"
                        style={{ background: "oklch(0.65 0.22 25 / 0.2)", color: "oklch(0.65 0.22 25)" }}
                      >
                        Needs Support
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Student Details Panel */}
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl"
            style={{ background: "oklch(1 0 0 / 0.04)", border: "1px solid oklch(1 0 0 / 0.08)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: "oklch(0.94 0.005 240)" }}>
                {selectedStudent.name} - Performance Analysis
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "oklch(1 0 0 / 0.06)", color: "oklch(0.58 0.012 240)" }}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.010 240)" }}>
                  Strengths
                </div>
                <div className="space-y-2">
                  {selectedStudent.strengths.map((strength, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg text-sm"
                      style={{ background: "oklch(0.65 0.22 120 / 0.1)", color: "oklch(0.65 0.22 120)" }}
                    >
                      <Award className="w-4 h-4" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.010 240)" }}>
                  Areas for Improvement
                </div>
                <div className="space-y-2">
                  {selectedStudent.weaknesses.length > 0 ? (
                    selectedStudent.weaknesses.map((weakness, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg text-sm"
                        style={{ background: "oklch(0.72 0.18 50 / 0.1)", color: "oklch(0.72 0.18 50)" }}
                      >
                        <Target className="w-4 h-4" />
                        {weakness}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm" style={{ color: "oklch(0.50 0.010 240)" }}>
                      No significant weaknesses identified
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs mb-3" style={{ color: "oklch(0.50 0.010 240)" }}>
                Personalized Recommendations
              </div>
              <div className="space-y-2">
                {selectedStudent.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "oklch(0.72 0.18 160 / 0.1)" }}
                  >
                    <Lightbulb className="w-4 h-4 mt-0.5" style={{ color: "oklch(0.72 0.18 160)" }} />
                    <span className="text-sm" style={{ color: "oklch(0.72 0.18 160)" }}>
                      {rec}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedStudent.riskLevel === "high" && (
              <button
                onClick={() => {
                  sendIntervention(selectedStudent.id);
                  setSelectedStudent(null);
                }}
                className="w-full mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "oklch(0.65 0.22 25)", color: "white" }}
              >
                Schedule Intervention
              </button>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
