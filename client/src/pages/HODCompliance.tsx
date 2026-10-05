/**
 * Mukiria Technical Training Institute — HOD Portal
 * Section 2: Trainer Compliance & Faculty Syllabus Monitoring
 * Features: Faculty preparation ledger, RoW sign-off workflow, curriculum coverage tracking
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  CheckSquare,
  QrCode,
  ClipboardCheck,
  Send,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import HODLayout from "@/components/HODLayout";
import { toast } from "sonner";

interface TrainerComplianceRecord {
  id: string;
  name: string;
  staffId: string;
  department: string;
  unitCode: string;
  unitTitle: string;
  learningPlanStatus: "Approved" | "Under Review" | "Overdue";
  sessionPlansCount: number;
  sessionPlansTotal: number;
  qrCodesActive: boolean;
  classRegisterUpdated: boolean;
  rowStatus: "Signed & Verified" | "Ready for Sign-off" | "Incomplete";
  assessmentGradedRate: number;
  overallScore: number;
}

const INITIAL_TRAINERS: TrainerComplianceRecord[] = [
  {
    id: "tr-1",
    name: "Alexander Kinoti",
    staffId: "MTTI/EMP/042",
    department: "Computing & Informatics",
    unitCode: "061155101A",
    unitTitle: "Apply Digital Literacy (WA1-3)",
    learningPlanStatus: "Approved",
    sessionPlansCount: 12,
    sessionPlansTotal: 12,
    qrCodesActive: true,
    classRegisterUpdated: true,
    rowStatus: "Ready for Sign-off",
    assessmentGradedRate: 100,
    overallScore: 98,
  },
  {
    id: "tr-2",
    name: "Dr. J. Muriithi",
    staffId: "MTTI/EMP/018",
    department: "Computing & Informatics",
    unitCode: "COMP-204",
    unitTitle: "Software Engineering Principles",
    learningPlanStatus: "Approved",
    sessionPlansCount: 10,
    sessionPlansTotal: 12,
    qrCodesActive: true,
    classRegisterUpdated: true,
    rowStatus: "Ready for Sign-off",
    assessmentGradedRate: 95,
    overallScore: 92,
  },
  {
    id: "tr-3",
    name: "Mary Wambui",
    staffId: "MTTI/EMP/033",
    department: "Computing & Informatics",
    unitCode: "ICT/OS/CS/CR/04/6",
    unitTitle: "Database Management Systems",
    learningPlanStatus: "Approved",
    sessionPlansCount: 11,
    sessionPlansTotal: 12,
    qrCodesActive: true,
    classRegisterUpdated: true,
    rowStatus: "Signed & Verified",
    assessmentGradedRate: 100,
    overallScore: 96,
  },
  {
    id: "tr-4",
    name: "Peter Ochieng",
    staffId: "MTTI/EMP/055",
    department: "Electrical & Electronics",
    unitCode: "EE/OS/PE/CR/01/6",
    unitTitle: "Electrical Circuit Analysis",
    learningPlanStatus: "Approved",
    sessionPlansCount: 9,
    sessionPlansTotal: 12,
    qrCodesActive: false,
    classRegisterUpdated: false,
    rowStatus: "Ready for Sign-off",
    assessmentGradedRate: 85,
    overallScore: 82,
  },
  {
    id: "tr-5",
    name: "Sarah Chebet",
    staffId: "MTTI/EMP/061",
    department: "Business & Management",
    unitCode: "BM/OS/HR/CR/02/5",
    unitTitle: "Workplace Communication & Ethics",
    learningPlanStatus: "Approved",
    sessionPlansCount: 12,
    sessionPlansTotal: 12,
    qrCodesActive: true,
    classRegisterUpdated: true,
    rowStatus: "Signed & Verified",
    assessmentGradedRate: 100,
    overallScore: 99,
  },
  {
    id: "tr-6",
    name: "David Kiprono",
    staffId: "MTTI/EMP/074",
    department: "Mechanical & Automotive",
    unitCode: "ME/OS/WS/CR/03/5",
    unitTitle: "Engineering Drawing & CAD",
    learningPlanStatus: "Under Review",
    sessionPlansCount: 8,
    sessionPlansTotal: 12,
    qrCodesActive: false,
    classRegisterUpdated: true,
    rowStatus: "Incomplete",
    assessmentGradedRate: 70,
    overallScore: 74,
  },
];

export default function HODCompliance() {
  const [, navigate] = useLocation();
  const [trainers, setTrainers] = useState<TrainerComplianceRecord[]>(INITIAL_TRAINERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSignOff = (id: string, name: string) => {
    setTrainers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, rowStatus: "Signed & Verified", overallScore: Math.min(100, t.overallScore + 2) } : t))
    );
    toast.success("Record of Work Approved", {
      description: `Digitally endorsed and stamped RoW for ${name}.`,
    });
  };

  const handleSignOffAll = () => {
    setTrainers((prev) =>
      prev.map((t) =>
        t.rowStatus === "Ready for Sign-off"
          ? { ...t, rowStatus: "Signed & Verified", overallScore: Math.min(100, t.overallScore + 2) }
          : t
      )
    );
    toast.success("Batch Sign-off Complete", {
      description: "All pending Records of Work have been endorsed with the HOD digital seal.",
    });
  };

  const handleSendReminder = (name: string) => {
    toast.info("Compliance Reminder Dispatched", {
      description: `Sent official automated prompt to ${name} to update academic documents.`,
    });
  };

  const filteredTrainers = trainers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "all" || t.department === deptFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "verified" && t.rowStatus === "Signed & Verified") ||
      (statusFilter === "ready" && t.rowStatus === "Ready for Sign-off") ||
      (statusFilter === "attention" && t.rowStatus === "Incomplete");
    return matchesSearch && matchesDept && matchesStatus;
  });

  const readyForSignoffCount = trainers.filter((t) => t.rowStatus === "Ready for Sign-off").length;
  const verifiedCount = trainers.filter((t) => t.rowStatus === "Signed & Verified").length;
  const avgCompliance = Math.round(trainers.reduce((sum, t) => sum + t.overallScore, 0) / trainers.length);

  return (
    <HODLayout
      title="Trainer Compliance"
      subtitle="Faculty pedagogical records, daily session plans, and Record of Work (RoW) verification"
    >
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Compliance Header Banner */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Total Faculty Monitored</span>
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">{trainers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across monitored institute departments</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">RoW Books Ready for Sign-Off</span>
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">{readyForSignoffCount}</div>
            <p className="text-xs text-amber-500 font-medium mt-1">Awaiting HOD verification seal</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Verified & Stamped</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">{verifiedCount}</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">100% compliant with CDACC guidelines</p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase">Faculty Compliance Index</span>
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">{avgCompliance}%</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">Benchmark target: 85%</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty name, staff ID, or unit code..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs bg-muted/60 border border-border rounded-xl px-3 py-2 text-foreground font-medium outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Computing & Informatics">Computing & Informatics</option>
              <option value="Electrical & Electronics">Electrical & Electronics</option>
              <option value="Business & Management">Business & Management</option>
              <option value="Mechanical & Automotive">Mechanical & Automotive</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-muted/60 border border-border rounded-xl px-3 py-2 text-foreground font-medium outline-none"
            >
              <option value="all">All Verification Statuses</option>
              <option value="ready">Ready for Sign-off</option>
              <option value="verified">Signed & Verified</option>
              <option value="attention">Incomplete / Review</option>
            </select>

            {readyForSignoffCount > 0 && (
              <button
                onClick={handleSignOffAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Sign-off All ({readyForSignoffCount})
              </button>
            )}
          </div>
        </div>

        {/* Faculty Compliance Ledger Table */}
        <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Faculty Pedagogical Compliance Ledger</h2>
              <p className="text-xs text-muted-foreground">Detailed status of Learning Plans, QR Sessions, Attendance, and Records of Work</p>
            </div>
            <button
              onClick={() => navigate("/hod/reports")}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Merge RoW Book PDF <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Trainer / Staff</th>
                  <th className="px-4 py-3.5">Assigned Unit</th>
                  <th className="px-4 py-3.5 text-center">Learning Plan</th>
                  <th className="px-4 py-3.5 text-center">Session Plans & QR</th>
                  <th className="px-4 py-3.5 text-center">Registers</th>
                  <th className="px-4 py-3.5">Record of Work</th>
                  <th className="px-4 py-3.5 text-center">Score</th>
                  <th className="px-5 py-3.5 text-right">HOD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrainers.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-bold text-foreground text-sm block">{t.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-muted-foreground">{t.staffId}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {t.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="max-w-[200px]">
                        <span className="font-mono font-bold text-foreground block text-xs">{t.unitCode}</span>
                        <span className="text-[11px] text-muted-foreground truncate block">{t.unitTitle}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.learningPlanStatus === "Approved"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {t.learningPlanStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">
                          {t.sessionPlansCount}/{t.sessionPlansTotal}
                        </span>
                        {t.qrCodesActive ? (
                          <span title="Door QR Code active" className="text-emerald-500">
                            <QrCode className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span title="Door QR Code pending" className="text-muted-foreground">
                            <QrCode className="w-3.5 h-3.5 opacity-40" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {t.classRegisterUpdated ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Updated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          t.rowStatus === "Signed & Verified"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : t.rowStatus === "Ready for Sign-off"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {t.rowStatus}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-mono font-extrabold text-foreground">
                        {t.overallScore}%
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {t.rowStatus === "Ready for Sign-off" ? (
                        <button
                          onClick={() => handleSignOff(t.id, t.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm"
                        >
                          Endorse RoW
                        </button>
                      ) : t.rowStatus === "Signed & Verified" ? (
                        <span className="text-[11px] font-medium text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendReminder(t.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1 ml-auto"
                        >
                          <Send className="w-3 h-3" />
                          Prompt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </HODLayout>
  );
}
