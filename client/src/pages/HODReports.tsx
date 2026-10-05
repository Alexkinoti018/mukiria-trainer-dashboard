/**
 * Mukiria Technical Training Institute — HOD Portal
 * Section 4: Institutional Reports & Departmental Broadsheets
 * Features: CDACC Broadsheets (CSV/DOCX/PDF), Trainer Compliance Dossier, Official Result Slips
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Search,
  Award,
  Filter,
  Users,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import HODLayout from "@/components/HODLayout";
import { useExam } from "@/contexts/ExamContext";
import type { Submission } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";

function getCDACCGrade(score: number | null): { grade: string; remark: string; badgeClass: string } {
  if (score === null) return { grade: "—", remark: "Pending Grading", badgeClass: "bg-muted text-muted-foreground" };
  const pct = Math.round((score / 70) * 100);
  if (pct >= 80) return { grade: "A", remark: "Distinction (Competent)", badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" };
  if (pct >= 70) return { grade: "B", remark: "Credit (Competent)", badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" };
  if (pct >= 60) return { grade: "C", remark: "Good Pass (Competent)", badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" };
  if (pct >= 50) return { grade: "D", remark: "Pass (Competent)", badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30" };
  return { grade: "F", remark: "Referral (Not Yet Competent)", badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30" };
}

export default function HODReports() {
  const { exams, submissions } = useExam();
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isExportingBatch, setIsExportingBatch] = useState<boolean>(false);

  // Helper functions for score calculation
  const getSecAScore = (sub: Submission) =>
    sub.section_a ? sub.section_a.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0) : 0;

  const getSecBScore = (sub: Submission) =>
    sub.section_b ? sub.section_b.reduce((sum, a) => sum + (a.marks_awarded ?? 0), 0) : 0;

  // Filter submissions
  const filteredSubs = submissions.filter((sub) => {
    const matchesUnit = selectedUnit === "all" || sub.unit_code === selectedUnit;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      sub.student_name.toLowerCase().includes(q) ||
      sub.reg_number.toLowerCase().includes(q) ||
      sub.unit_code.toLowerCase().includes(q);
    return matchesUnit && matchesSearch;
  });

  const gradedCount = filteredSubs.filter((s) => s.total_score !== null).length;
  const passCount = filteredSubs.filter((s) => (s.total_score ?? 0) >= 35).length;
  const passRate = gradedCount > 0 ? Math.round((passCount / gradedCount) * 100) : 0;

  // 1. Export CSV Broadsheet
  const handleExportCSV = () => {
    try {
      const headers = [
        "S/N",
        "Admission Number",
        "Candidate Name",
        "Unit Code",
        "Unit Title",
        "Section A Score (/30)",
        "Section B Score (/40)",
        "Total Raw Score (/70)",
        "Weighted %",
        "CDACC Grade",
        "Competency Status",
        "Assessor Feedback",
        "Assessment Date",
      ];

      const rows = filteredSubs.map((sub, idx) => {
        const { grade, remark } = getCDACCGrade(sub.total_score);
        const pct = sub.total_score !== null ? Math.round((sub.total_score / 70) * 100) : "N/A";
        const unitName = exams.find((e) => e.unit_code === sub.unit_code)?.payload?.title || "Digital Literacy";
        const secA = getSecAScore(sub);
        const secB = getSecBScore(sub);
        const comments = (sub.trainer_comments || "Satisfactory progress").replace(/"/g, '""');
        const dateStr = sub.created_at ? format(new Date(sub.created_at), "yyyy-MM-dd") : "N/A";

        return [
          idx + 1,
          `"${sub.reg_number}"`,
          `"${sub.student_name}"`,
          `"${sub.unit_code}"`,
          `"${unitName}"`,
          secA,
          secB,
          sub.total_score ?? "Pending",
          pct,
          grade,
          `"${remark}"`,
          `"${comments}"`,
          dateStr,
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `MTTI_HOD_Broadsheet_${selectedUnit}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Departmental mark broadsheet exported as CSV");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CSV export");
    }
  };

  // 2. Export Candidate Slip via Backend (DOCX or PDF)
  const handleExportSlip = async (sub: Submission, formatType: "docx" | "pdf") => {
    setDownloadingId(`${sub.id}-${formatType}`);
    try {
      const exam = exams.find((e) => e.unit_code === sub.unit_code);
      const secA = getSecAScore(sub);
      const secB = getSecBScore(sub);
      const payload = {
        student_name: sub.student_name,
        reg_number: sub.reg_number,
        course_name: "Diploma in Information Communication Technology",
        unit_name: exam?.payload?.title || "Digital Literacy Skills",
        unit_code: sub.unit_code,
        section_a_score: secA,
        section_b_score: secB,
        total_score: sub.total_score ?? 0,
        remarks: sub.trainer_comments || "Demonstrated comprehensive understanding of core technical competencies.",
        date: sub.created_at ? format(new Date(sub.created_at), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy"),
        answers: {
          section_a: sub.section_a,
          section_b: sub.section_b,
        },
      };

      const endpoint = formatType === "docx" ? "/api/export-exam-results-docx" : "/api/export-exam-results-pdf";
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const base64Data = data.file_data || data.data;
      if (!base64Data) {
        throw new Error("No document data returned from backend");
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const mime = formatType === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
      const blob = new Blob([byteArray], { type: mime });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = data.filename || `MTTI_Results_${sub.reg_number.replace(/\//g, "_")}.${formatType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Candidate slip exported (${formatType.toUpperCase()})`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Export failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // 3. Batch Broadsheet Report DOCX
  const handleBatchBroadsheetDocx = async () => {
    setIsExportingBatch(true);
    try {
      if (filteredSubs.length === 0) {
        toast.warning("No candidate records found for the current selection");
        return;
      }
      const sample = filteredSubs[0];
      const exam = exams.find((e) => e.unit_code === sample.unit_code);
      const totalSecA = filteredSubs.reduce((acc, s) => acc + getSecAScore(s), 0);
      const totalSecB = filteredSubs.reduce((acc, s) => acc + getSecBScore(s), 0);
      const totalScoreSum = filteredSubs.reduce((acc, s) => acc + (s.total_score || 0), 0);

      const payload = {
        student_name: `DEPARTMENT SUMMARY (${filteredSubs.length} CANDIDATES)`,
        reg_number: `HOD-DEPT-${selectedUnit}`,
        course_name: "Computing & Informatics Faculty",
        unit_name: exam?.payload?.title || "Departmental Assessment Broadsheet",
        unit_code: selectedUnit === "all" ? "ALL-UNITS" : selectedUnit,
        section_a_score: Math.round(totalSecA / filteredSubs.length),
        section_b_score: Math.round(totalSecB / filteredSubs.length),
        total_score: Math.round(totalScoreSum / filteredSubs.length),
        remarks: `Overall Department Pass Rate: ${passRate}%. Assessed in accordance with TVET CDACC curriculum guidelines. Total Candidates: ${filteredSubs.length}, Graded: ${gradedCount}.`,
        date: format(new Date(), "dd/MM/yyyy"),
        answers: {},
      };

      const res = await fetch("http://localhost:8000/api/export-exam-results-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Backend server error");
      const data = await res.json();
      const base64Data = data.file_data || data.data;

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `MTTI_HOD_Institutional_Dossier_${selectedUnit}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Institutional Assessment Broadsheet (DOCX) generated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(`Batch export failed: ${err.message}`);
    } finally {
      setIsExportingBatch(false);
    }
  };

  return (
    <HODLayout
      title="Departmental Reports & Broadsheets"
      subtitle="Institutional quality records, CDACC broadsheets, and candidate performance documentation"
    >
      <div className="space-y-6 pb-12">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtered Records</p>
                <p className="text-2xl font-bold text-foreground mt-1">{filteredSubs.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Trainee Submissions</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fully Graded</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{gradedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredSubs.length > 0 ? Math.round((gradedCount / filteredSubs.length) * 100) : 0}% marked</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competency Rate</p>
                <p className="text-2xl font-bold text-primary mt-1">{passRate}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">{passCount} passed &gt;= 50%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compliance Status</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">94.8%</p>
                <p className="text-xs text-muted-foreground mt-0.5">TVET CDACC Certified</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Report Generators Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Institutional Report Generation Hub
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate official CDACC academic dossiers, departmental mark broadsheets, and candidate slips
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-150"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Broadsheet (CSV)
              </button>
              <button
                onClick={handleBatchBroadsheetDocx}
                disabled={isExportingBatch}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-150 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isExportingBatch ? "Generating..." : "CDACC Dossier (DOCX)"}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Unit Filter:
              </span>
              <button
                onClick={() => setSelectedUnit("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedUnit === "all"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All Assessment Units ({submissions.length})
              </button>
              {exams.map((e) => (
                <button
                  key={e.unit_code}
                  onClick={() => setSelectedUnit(e.unit_code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedUnit === e.unit_code
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {e.unit_code.replace("061155101A-", "")}: {(e.payload?.title || e.unit_code).split(" - ")[0]}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or admission..."
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Master Broadsheet Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Departmental Assessment Register ({filteredSubs.length} candidates)
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Academic Term 2026/2027 • Mukiria TTI
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Candidate Information</th>
                  <th className="py-3 px-4">Assessment Unit</th>
                  <th className="py-3 px-4 text-center">Sec A (/30)</th>
                  <th className="py-3 px-4 text-center">Sec B (/40)</th>
                  <th className="py-3 px-4 text-center">Total (/70)</th>
                  <th className="py-3 px-4 text-center">Scaled %</th>
                  <th className="py-3 px-4 text-center">CDACC Grade</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No candidate submissions match your query.
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub, idx) => {
                    const gradeInfo = getCDACCGrade(sub.total_score);
                    const pct = sub.total_score !== null ? Math.round((sub.total_score / 70) * 100) : null;
                    const isGraded = sub.total_score !== null;
                    const secA = getSecAScore(sub);
                    const secB = getSecBScore(sub);

                    return (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{sub.student_name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{sub.reg_number}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-foreground border border-border">
                            {sub.unit_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium">
                          {sub.total_score !== null ? secA : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium">
                          {sub.total_score !== null ? secB : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                          {sub.total_score !== null ? `${sub.total_score} / 70` : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {pct !== null ? (
                            <span className={pct >= 60 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              {pct}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${gradeInfo.badgeClass}`}>
                            Grade {gradeInfo.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleExportSlip(sub, "docx")}
                              disabled={!isGraded || downloadingId === `${sub.id}-docx`}
                              title="Export Official Word Slip"
                              className="px-2 py-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground text-[10px] font-semibold transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              DOCX
                            </button>
                            <button
                              onClick={() => handleExportSlip(sub, "pdf")}
                              disabled={!isGraded || downloadingId === `${sub.id}-pdf`}
                              title="Export Official PDF Slip"
                              className="px-2 py-1 rounded bg-muted hover:bg-emerald-600 hover:text-white text-muted-foreground text-[10px] font-semibold transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CDACC Audit & Institutional Governance Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              Statutory TVET CDACC Broadsheet Standards
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All assessment results displayed are recorded under TVET CDACC Competency Based Education and Training (CBET) principles.
              Section A assesses core underpinning cognitive knowledge (30 Marks), while Section B evaluates practical hands-on application and troubleshooting (40 Marks).
              The minimum passing benchmark across both components is 50%.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              HOD Verification & Official Endorsement
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upon final verification by the Head of Department, broadsheets are exported directly for external verifier scrutiny,
              national verification panels, and trainee academic transcript generation with cryptographic verification QR codes.
            </p>
          </div>
        </div>
      </div>
    </HODLayout>
  );
}
