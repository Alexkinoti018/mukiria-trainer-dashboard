/**
 * Mukiria Technical Training Institute — HOD Portal
 * Section 1: Institution Overview & Quality Assurance Dashboard
 * Features: Live departmental metrics, exam audit feed, regulatory compliance trackers
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  FileText,
  BarChart3,
  Download,
  Calendar,
  Building,
  GraduationCap,
  Plus,
  X,
  RefreshCw,
} from "lucide-react";
import HODLayout from "@/components/HODLayout";
import { useExam } from "@/contexts/ExamContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface DepartmentRecord {
  name: string;
  code: string;
  hod: string;
  trainers: number;
  activeUnits: number;
  complianceRate: number;
  passRate: number;
  status: "Exemplary" | "Compliant" | "Review Due";
}

const DEFAULT_DEPARTMENTS: DepartmentRecord[] = [
  {
    name: "Computing & Informatics",
    code: "CI",
    hod: "Prof. S. Njoroge",
    trainers: 8,
    activeUnits: 14,
    complianceRate: 98,
    passRate: 84,
    status: "Exemplary",
  },
  {
    name: "Electrical & Electronics",
    code: "EE",
    hod: "Eng. D. Karanja",
    trainers: 7,
    activeUnits: 12,
    complianceRate: 94,
    passRate: 79,
    status: "Compliant",
  },
  {
    name: "Mechanical & Automotive",
    code: "ME",
    hod: "Eng. P. Mutua",
    trainers: 6,
    activeUnits: 10,
    complianceRate: 91,
    passRate: 76,
    status: "Compliant",
  },
  {
    name: "Building & Civil Engineering",
    code: "BC",
    hod: "Arch. F. Gitau",
    trainers: 5,
    activeUnits: 9,
    complianceRate: 88,
    passRate: 72,
    status: "Review Due",
  },
  {
    name: "Business & Management",
    code: "BM",
    hod: "Dr. E. Wangari",
    trainers: 6,
    activeUnits: 11,
    complianceRate: 95,
    passRate: 81,
    status: "Compliant",
  },
  {
    name: "Hospitality & Institutional Mgmt",
    code: "HM",
    hod: "Chef M. Achieng",
    trainers: 4,
    activeUnits: 8,
    complianceRate: 92,
    passRate: 85,
    status: "Compliant",
  },
];

export default function HODDashboard() {
  const [, navigate] = useLocation();
  const { exams, submissions } = useExam();
  const [selectedTerm, setSelectedTerm] = useState("Term 3, 2026");
  const [departments, setDepartments] = useState<DepartmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem("mtti_departments");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_DEPARTMENTS;
  });

  // Modal State for Adding/Editing Institutional Departments
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentRecord | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    hod: "",
    trainers: 5,
    activeUnits: 8,
    complianceRate: 90,
    status: "Compliant" as "Exemplary" | "Compliant" | "Review Due",
  });

  // Dynamic live Supabase/REST synchronization
  useEffect(() => {
    const fetchLiveDepts = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await (supabase as any).from("departments").select("*");
          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped: DepartmentRecord[] = data.map((d: any) => ({
              name: d.name,
              code: d.code,
              hod: d.hod || d.hod_name || "Head of Department",
              trainers: d.trainers || 6,
              activeUnits: d.active_units || 10,
              complianceRate: d.compliance_rate || 92,
              passRate: d.pass_rate || 80,
              status: (d.status as any) || "Compliant",
            }));
            setDepartments(mapped);
            localStorage.setItem("mtti_departments", JSON.stringify(mapped));
            return;
          }
        }
        const res = await fetch("/api/departments").catch(() => null);
        if (res && res.ok) {
          const live = await res.json();
          if (Array.isArray(live) && live.length > 0) {
            const mapped: DepartmentRecord[] = live.map((d: any) => ({
              name: d.name,
              code: d.code,
              hod: d.hod || d.hod_name || "Head of Department",
              trainers: d.trainers || 6,
              activeUnits: d.active_units || 10,
              complianceRate: d.compliance_rate || 92,
              passRate: d.pass_rate || 80,
              status: (d.status as any) || "Compliant",
            }));
            setDepartments(mapped);
            localStorage.setItem("mtti_departments", JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn("Could not sync live departments:", err);
      }
    };
    fetchLiveDepts();
  }, []);

  // Dynamic calculations across live submissions
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.status !== "pending");
  const pendingReviews = submissions.filter(
    (s) =>
      s.status === "pending" ||
      s.section_a.some((a) => a.flagged_for_review) ||
      s.section_b.some((b) => b.flagged_for_review)
  );

  const totalScores = gradedSubmissions.map((s) => s.total_score ?? 0);
  const avgScore =
    totalScores.length > 0 ? Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length) : 0;
  const passCount = gradedSubmissions.filter((s) => (s.total_score ?? 0) >= 35).length; // >= 50%
  const passRate =
    gradedSubmissions.length > 0 ? Math.round((passCount / gradedSubmissions.length) * 100) : 0;

  // Dynamically compute Department Statistics
  const dynamicDepartments = useMemo(() => {
    return departments.map((dept) => {
      const codeUpper = dept.code.toUpperCase();
      // Match exams belonging to this department
      const deptExams = exams.filter((e) => {
        const u = (e.unit_code || "").toUpperCase();
        const c = (e.course_name || "").toUpperCase();
        return u.includes(codeUpper) || c.includes(codeUpper) || (codeUpper === "CI" && (u.includes("ICT") || u.includes("061155101A")));
      });

      const deptSubs = submissions.filter((s) => {
        const u = (s.unit_code || "").toUpperCase();
        return u.includes(codeUpper) || (codeUpper === "CI" && (u.includes("ICT") || u.includes("061155101A")));
      });

      const gradedDeptSubs = deptSubs.filter((s) => s.total_score !== null);
      const deptPassCount = gradedDeptSubs.filter((s) => (s.total_score ?? 0) >= 35).length;
      const calculatedPassRate =
        gradedDeptSubs.length > 0 ? Math.round((deptPassCount / gradedDeptSubs.length) * 100) : dept.passRate;

      return {
        ...dept,
        activeUnits: deptExams.length > 0 ? deptExams.length : dept.activeUnits,
        passRate: calculatedPassRate,
      };
    });
  }, [departments, exams, submissions]);

  const overallCompliance = useMemo(() => {
    if (dynamicDepartments.length === 0) return "0.0";
    const sum = dynamicDepartments.reduce((acc, d) => acc + (d.complianceRate || 0), 0);
    return (sum / dynamicDepartments.length).toFixed(1);
  }, [dynamicDepartments]);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      toast.error("Please fill in department name and code");
      return;
    }

    const newRecord: DepartmentRecord = {
      name: deptForm.name,
      code: deptForm.code.toUpperCase(),
      hod: deptForm.hod || "Head of Department",
      trainers: Number(deptForm.trainers) || 1,
      activeUnits: Number(deptForm.activeUnits) || 1,
      complianceRate: Number(deptForm.complianceRate) || 90,
      passRate: 80,
      status: deptForm.status,
    };

    let updated: DepartmentRecord[];
    if (editingDept) {
      updated = departments.map((d) => (d.code === editingDept.code ? newRecord : d));
      toast.success(`Department ${newRecord.name} updated`);
    } else {
      updated = [...departments, newRecord];
      toast.success(`Department ${newRecord.name} created`);
    }

    setDepartments(updated);
    localStorage.setItem("mtti_departments", JSON.stringify(updated));

    // Dynamic database persistence
    if (isSupabaseConfigured()) {
      Promise.resolve(
        (supabase as any).from("departments").upsert({
          name: newRecord.name,
          code: newRecord.code,
          hod_name: newRecord.hod,
          trainers: newRecord.trainers,
          active_units: newRecord.activeUnits,
          compliance_rate: newRecord.complianceRate,
          status: newRecord.status,
        })
      ).catch((err: any) => {
        console.warn("Notice: Supabase department upsert error:", err);
      });
    }

    fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord),
    }).catch(() => {});

    setShowAddDeptModal(false);
    setEditingDept(null);
  };

  return (
    <HODLayout
      title="Institution Overview"
      subtitle="Executive TVET oversight, CDACC competency audit, and departmental quality assurance"
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Control Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Mukiria Technical Training Institute</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  CDACC Accredited
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Internal Verification & Academic Monitoring Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{selectedTerm} (Sep – Nov 2026)</span>
            </div>
            <button
              onClick={() => navigate("/hod/reports")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Audit Broadsheet
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Overall Compliance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">{overallCompliance}%</div>
            <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dynamic Institutional QA Index
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Assessments</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">{exams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {exams.filter(e => e.unit_code.includes("061155101A")).length} Digital Literacy Standard Papers (CT1-CT3)
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Quality Reviews</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">{pendingReviews.length}</div>
            <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Assessments requiring assessor confirmation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Institutional Pass Rate</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">{passRate}%</div>
            <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Avg score: {avgScore} / 70 marks (CDACC Benchmark)
            </p>
          </motion.div>
        </div>

        {/* Quick HOD Navigation Row */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            {
              title: "Trainer Compliance",
              subtitle: "Audit session plans, RoW books & registers",
              icon: FileText,
              path: "/hod/compliance",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              title: "Competency Analytics",
              subtitle: "Class averages, distributions & grade curves",
              icon: BarChart3,
              path: "/hod/analytics",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              title: "Institutional Reports",
              subtitle: "Broadsheets, PDF RoW Book & CDACC package",
              icon: Download,
              path: "/hod/reports",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              title: "Trainer Workspace",
              subtitle: "Open full grading & academic workbench",
              icon: GraduationCap,
              path: "/trainer/dashboard",
              color: "text-violet-500",
              bg: "bg-violet-500/10",
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left flex items-start gap-3 group"
            >
              <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Departmental Compliance Matrix */}
        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Departmental Quality & Compliance Matrix</h2>
              <p className="text-xs text-muted-foreground">Term 3 internal verification status across all academic faculties</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingDept(null);
                  setDeptForm({
                    name: "",
                    code: "",
                    hod: "",
                    trainers: 5,
                    activeUnits: 8,
                    complianceRate: 90,
                    status: "Compliant",
                  });
                  setShowAddDeptModal(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Department
              </button>
              <button
                onClick={() => navigate("/hod/compliance")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View Full Compliance Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-4 py-3">Lead / HOD</th>
                  <th className="px-4 py-3 text-center">Faculty</th>
                  <th className="px-4 py-3 text-center">Units</th>
                  <th className="px-4 py-3">Curriculum Compliance</th>
                  <th className="px-4 py-3 text-center">Pass Rate</th>
                  <th className="px-4 py-3 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dynamicDepartments.map((dept, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => {
                      setEditingDept(dept);
                      setDeptForm({
                        name: dept.name,
                        code: dept.code,
                        hod: dept.hod,
                        trainers: dept.trainers,
                        activeUnits: dept.activeUnits,
                        complianceRate: dept.complianceRate,
                        status: dept.status,
                      });
                      setShowAddDeptModal(true);
                    }}
                  >
                    <td className="px-5 py-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded font-mono text-[10px] bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {dept.code}
                        </span>
                        <span>{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{dept.hod}</td>
                    <td className="px-4 py-3.5 text-center font-mono">{dept.trainers}</td>
                    <td className="px-4 py-3.5 text-center font-mono">{dept.activeUnits}</td>
                    <td className="px-4 py-3.5">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-semibold text-foreground">{dept.complianceRate}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${dept.complianceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-foreground">
                      {dept.passRate}%
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          dept.status === "Exemplary"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : dept.status === "Compliant"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {dept.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Examination Feed & Regulatory QA Checklist */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Submissions Feed */}
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Live Assessment Submissions</h3>
                  <p className="text-xs text-muted-foreground">Real-time candidate submissions and auto-graded results</p>
                </div>
                <button
                  onClick={() => navigate("/trainer/grading")}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  Gradebook <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-border">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No submissions recorded yet for this session.
                  </div>
                ) : (
                  submissions.slice(0, 5).map((sub, sIdx) => {
                    const hasFlags = sub.section_a.some(a => a.flagged_for_review) || sub.section_b.some(b => b.flagged_for_review);
                    return (
                      <div key={sub.id || sIdx} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate">{sub.student_name}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">{sub.reg_number}</span>
                            {hasFlags && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Review Required
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{sub.unit_code}</span>
                            <span>•</span>
                            <span>{format(new Date(sub.created_at), "dd MMM yyyy, HH:mm")}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-foreground">
                            {sub.total_score !== null ? `${sub.total_score} / 70` : "Pending"}
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              sub.status === "graded" || sub.status === "reviewed"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground px-5">
              <span>Showing latest candidate assessments</span>
              <button
                onClick={() => navigate("/trainer/grading")}
                className="text-primary font-semibold hover:underline"
              >
                Inspect All in Assessor Gradebook →
              </button>
            </div>
          </div>

          {/* CDACC Quality Assurance Checklist */}
          <div className="rounded-2xl bg-card border border-border shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                CDACC Verification Checklist
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">National TVET regulatory compliance criteria</p>
            </div>

            <div className="space-y-3">
              {[
                { title: "Standard Written Assessments (CT1-3)", status: "Active & Ingested", icon: CheckCircle2, ok: true },
                { title: "Formative Practical Rubrics (Section B)", status: "40 Marks Configured", icon: CheckCircle2, ok: true },
                { title: "Auto-Grader Deterministic & NLP Engine", status: "Active on Port 8000", icon: CheckCircle2, ok: true },
                { title: "Departmental Records of Work (RoW)", status: "Ready for HOD Stamp", icon: CheckCircle2, ok: true },
                { title: "Workshop QR Code Access Posters", status: "Enabled on Session Plans", icon: CheckCircle2, ok: true },
                { title: "Internal Verification (IV) Sampling", status: "Sampling Scheduled", icon: Clock, ok: false },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground block">{item.title}</span>
                    <span className="text-[11px] text-muted-foreground">{item.status}</span>
                  </div>
                  <item.icon className={`w-4 h-4 shrink-0 ${item.ok ? "text-emerald-500" : "text-amber-500"}`} />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate("/hod/reports")}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download TVET Audit Dossier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Add / Edit Department Modal */}
      <AnimatePresence>
        {showAddDeptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">
                    {editingDept ? "Edit Institutional Department" : "Add New Department"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDepartment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    placeholder="e.g. Surveying & Geomatics"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Dept Code</label>
                    <input
                      type="text"
                      required
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SURV"
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono font-bold outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Status</label>
                    <select
                      value={deptForm.status}
                      onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Exemplary">Exemplary</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Review Due">Review Due</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Lead / HOD Name</label>
                  <input
                    type="text"
                    value={deptForm.hod}
                    onChange={(e) => setDeptForm({ ...deptForm, hod: e.target.value })}
                    placeholder="e.g. Eng. K. Mwiti"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Faculty Count</label>
                    <input
                      type="number"
                      min={1}
                      value={deptForm.trainers}
                      onChange={(e) => setDeptForm({ ...deptForm, trainers: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Active Units</label>
                    <input
                      type="number"
                      min={1}
                      value={deptForm.activeUnits}
                      onChange={(e) => setDeptForm({ ...deptForm, activeUnits: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Target QA %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={deptForm.complianceRate}
                      onChange={(e) => setDeptForm({ ...deptForm, complianceRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddDeptModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    {editingDept ? "Save Changes" : "Create Department"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HODLayout>
  );
}
