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
import TrainerLayout from "@/components/TrainerLayout";
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
        return { bg: "rgba(16, 185, 129, 0.1)", text: "#047857", border: "rgba(16, 185, 129, 0.35)" };
      case "medium":
        return { bg: "rgba(196, 136, 32, 0.12)", text: "#92400e", border: "rgba(196, 136, 32, 0.4)" };
      case "high":
        return { bg: "rgba(225, 29, 72, 0.1)", text: "#be123c", border: "rgba(225, 29, 72, 0.35)" };
      default:
        return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" };
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
    <TrainerLayout
      title="Performance Insights"
      subtitle="Predictive analytics and at-risk student detection"
    >
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Class Average</div>
            <div className="text-2xl font-bold font-mono mt-2 text-[#000953]">{stats.avgOverall}%</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Low Risk</div>
            <div className="text-2xl font-bold font-mono mt-2 text-emerald-700">{stats.lowRisk}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Medium Risk</div>
            <div className="text-2xl font-bold font-mono mt-2 text-[#c48820]">{stats.mediumRisk}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">High Risk</div>
            <div className="text-2xl font-bold font-mono mt-2 text-rose-600">{stats.highRisk}</div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">Total Students</div>
            <div className="text-2xl font-bold font-mono mt-2 text-[#000953]">{students.length}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["all", "low", "medium", "high"] as const).map((risk) => (
            <button
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                filterRisk === risk
                  ? "bg-[#000953] border-[#000953] text-white shadow-sm"
                  : "bg-white border-slate-300 text-slate-600 hover:text-[#000953] hover:bg-slate-50"
              }`}
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
                  className="p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-50 bg-white border border-slate-300 hover:border-slate-400 shadow-sm"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-sm text-[#0f172a]">
                          {student.name}
                        </div>
                        <div
                          className="px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border"
                          style={{ background: riskColor.bg, color: riskColor.text, borderColor: riskColor.border }}
                        >
                          {getRiskIcon(student.riskLevel)}
                          {student.riskLevel.charAt(0).toUpperCase() + student.riskLevel.slice(1)}
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        {student.regNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-[#000953]">
                        {student.avgScore}%
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs mt-1 font-mono font-bold">
                        {student.trend > 0 ? (
                          <ArrowUp className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-rose-600" />
                        )}
                        <span className={student.trend > 0 ? "text-emerald-700" : "text-rose-600"}>
                          {Math.abs(student.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Bars */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 mb-1">
                        Last Exam
                      </div>
                      <div className="h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-slate-100 border border-slate-300 text-[#0f172a] w-full">
                        {student.lastExamScore}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 mb-1">
                        Predicted
                      </div>
                      <div className="h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 w-full">
                        {student.predictedScore}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 mb-1">
                        Potential
                      </div>
                      <div className="h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-[#c48820] w-full">
                        +{student.improvementPotential}%
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-slate-600 font-medium">
                      {student.examsAttempted} exams • {student.strengths.length} strengths
                    </div>
                    {student.riskLevel === "high" && (
                      <div className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
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
            className="p-6 rounded-xl bg-white border border-slate-300 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#000953]">
                {selectedStudent.name} - Performance Analysis
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-600">
                  Strengths
                </div>
                <div className="space-y-2">
                  {selectedStudent.strengths.map((strength, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800"
                    >
                      <Award className="w-4 h-4 text-emerald-600" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-600">
                  Areas for Improvement
                </div>
                <div className="space-y-2">
                  {selectedStudent.weaknesses.length > 0 ? (
                    selectedStudent.weaknesses.map((weakness, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900"
                      >
                        <Target className="w-4 h-4 text-[#c48820]" />
                        {weakness}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">
                      No significant weaknesses identified
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-600">
                Personalized Recommendations
              </div>
              <div className="space-y-2">
                {selectedStudent.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-300 text-[#0f172a]"
                  >
                    <Lightbulb className="w-4 h-4 mt-0.5 text-[#c48820] shrink-0" />
                    <span className="text-xs leading-relaxed font-medium">
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
                className="w-full mt-4 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition active:scale-[0.98]"
              >
                Schedule Intervention
              </button>
            )}
          </motion.div>
        )}
      </div>
    </TrainerLayout>
  );
}
