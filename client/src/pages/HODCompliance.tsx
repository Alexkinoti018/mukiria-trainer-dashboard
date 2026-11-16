/**
 * Mukiria Technical Training Institute — HOD Portal
 * Section 2: Trainer Compliance & Faculty Syllabus Monitoring
 * Features: Faculty preparation ledger, RoW sign-off workflow, curriculum coverage tracking
 */

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  X,
  RefreshCw,
  Bell,
} from "lucide-react";
import HODLayout from "@/components/HODLayout";
import { toast } from "sonner";
import { getAllTimetableFaculty } from "@/lib/timetableSyncService";

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

const buildInitialComplianceTrainers = (): TrainerComplianceRecord[] => {
  const faculty = getAllTimetableFaculty();
  return faculty.map((f, idx) => {
    const primaryUnit = f.units && f.units.length > 0 ? f.units[0] : "General Competency";
    const primaryClass = f.classes && f.classes.length > 0 ? f.classes[0] : "Cohort 1";
    const unitCode = `CU/${(primaryClass.split("/")[0] || "MTTI").trim().replace(/[^a-zA-Z0-9]/g, "")}/01`;
    const isApproved = idx % 5 !== 0;
    const isReady = idx % 3 !== 0;

    return {
      id: `tr-${f.id || idx + 1}`,
      name: f.name,
      staffId: `MTTI/EMP/${String(idx + 101).padStart(3, "0")}`,
      department: f.department || "Institutional Academics",
      unitCode: unitCode,
      unitTitle: primaryUnit,
      learningPlanStatus: isApproved ? ("Approved" as const) : ("Under Review" as const),
      sessionPlansCount: isApproved ? 12 : 9,
      sessionPlansTotal: 12,
      qrCodesActive: idx % 4 !== 0,
      classRegisterUpdated: idx % 6 !== 0,
      rowStatus: isReady ? ("Ready for Sign-off" as const) : ("Signed & Verified" as const),
      assessmentGradedRate: Math.max(75, 100 - (idx % 20)),
      overallScore: Math.min(100, Math.max(80, 95 - (idx % 12) + (isApproved ? 3 : 0))),
    };
  });
};

const INITIAL_TRAINERS: TrainerComplianceRecord[] = buildInitialComplianceTrainers();

export default function HODCompliance() {
  const [, navigate] = useLocation();
  const [trainers, setTrainers] = useState<TrainerComplianceRecord[]>(() => {
    try {
      const saved = localStorage.getItem("mtti_hod_compliance_trainers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          !parsed.some((t: any) => t.name === "Mary Wambui" || t.name === "Peter Ochieng" || t.name === "Sarah Chebet" || t.name === "David Kiprono")
        ) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_TRAINERS;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Proactive Decision Support Alerts State
  interface GovernanceAlertItem {
    id: string;
    alert_type: string;
    severity: "critical" | "warning" | "info";
    title: string;
    message: string;
    action_url: string;
    created_at: string;
    status: "active" | "resolved";
  }

  const [alerts, setAlerts] = useState<GovernanceAlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const token = localStorage.getItem("mtti_auth_token") || localStorage.getItem("token") || "token-hod";
      const res = await fetch("/api/governance/alerts?status=active", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": "hod",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      // Non-blocking
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRunAudit = async () => {
    setRunningAudit(true);
    try {
      const token = localStorage.getItem("mtti_auth_token") || localStorage.getItem("token") || "token-hod";
      const res = await fetch("/api/governance/alerts/run-audit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": "hod",
        },
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Governance Audit Completed: ${data.total_alerts || 0} active alert(s) evaluated.`);
        fetchAlerts();
      } else {
        toast.error("Failed to execute on-demand audit.");
      }
    } catch (e) {
      toast.error("Error executing governance audit.");
    } finally {
      setRunningAudit(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const token = localStorage.getItem("mtti_auth_token") || localStorage.getItem("token") || "token-hod";
      const res = await fetch(`/api/governance/alerts/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": "hod",
        },
      });
      if (res.ok) {
        toast.success("Alert marked as resolved.");
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      toast.error("Failed to resolve alert.");
    }
  };

  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    trainers.forEach((t) => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts).sort();
  }, [trainers]);

  // Dynamic Add / Edit Trainer Modal State
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    name: "",
    staffId: "",
    department: "Computing & Informatics",
    unitCode: "",
    unitTitle: "",
    learningPlanStatus: "Approved" as "Approved" | "Under Review" | "Overdue",
    sessionPlansCount: 12,
    sessionPlansTotal: 12,
    qrCodesActive: true,
    classRegisterUpdated: true,
    rowStatus: "Ready for Sign-off" as "Signed & Verified" | "Ready for Sign-off" | "Incomplete",
    assessmentGradedRate: 100,
    overallScore: 95,
  });

  const saveTrainersToStorage = (updated: TrainerComplianceRecord[]) => {
    setTrainers(updated);
    try {
      localStorage.setItem("mtti_hod_compliance_trainers", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSignOff = (id: string, name: string) => {
    const updated = trainers.map((t) =>
      t.id === id ? { ...t, rowStatus: "Signed & Verified" as const, overallScore: Math.min(100, t.overallScore + 2) } : t
    );
    saveTrainersToStorage(updated);
    toast.success("Record of Work Approved", {
      description: `Digitally endorsed and stamped RoW for ${name}.`,
    });
  };

  const handleSignOffAll = () => {
    const updated = trainers.map((t) =>
      t.rowStatus === "Ready for Sign-off"
        ? { ...t, rowStatus: "Signed & Verified" as const, overallScore: Math.min(100, t.overallScore + 2) }
        : t
    );
    saveTrainersToStorage(updated);
    toast.success("Batch Sign-off Complete", {
      description: "All pending Records of Work have been endorsed with the HOD digital seal.",
    });
  };

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerForm.name || !trainerForm.unitCode) {
      toast.error("Please enter trainer name and unit code");
      return;
    }
    const newRecord: TrainerComplianceRecord = {
      id: `tr-${Date.now()}`,
      name: trainerForm.name,
      staffId: trainerForm.staffId || `MTTI/EMP/0${Math.floor(Math.random() * 80) + 10}`,
      department: trainerForm.department,
      unitCode: trainerForm.unitCode.toUpperCase(),
      unitTitle: trainerForm.unitTitle || trainerForm.unitCode,
      learningPlanStatus: trainerForm.learningPlanStatus,
      sessionPlansCount: Number(trainerForm.sessionPlansCount) || 12,
      sessionPlansTotal: Number(trainerForm.sessionPlansTotal) || 12,
      qrCodesActive: Boolean(trainerForm.qrCodesActive),
      classRegisterUpdated: Boolean(trainerForm.classRegisterUpdated),
      rowStatus: trainerForm.rowStatus,
      assessmentGradedRate: Number(trainerForm.assessmentGradedRate) || 100,
      overallScore: Number(trainerForm.overallScore) || 90,
    };
    const updated = [newRecord, ...trainers];
    saveTrainersToStorage(updated);
    toast.success("Faculty Compliance Profile Added", {
      description: `Ingested ${newRecord.name} for unit ${newRecord.unitCode}`,
    });
    setShowAddTrainerModal(false);
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
        {/* Proactive Decision Support Alerts Banner */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  Proactive Governance & Decision Support
                  {alerts.length > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700">
                      {alerts.length} Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automated background evaluations enforcing KNQF 75% attendance, pedagogical delivery, and score hurdles
                </p>
              </div>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={runningAudit}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#000953] text-white hover:bg-[#000953]/90 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${runningAudit ? "animate-spin" : ""}`} />
              {runningAudit ? "Running Audit..." : "Run Governance Audit"}
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 text-xs font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                All CDACC compliance indicators, faculty registers, and double-hurdle criteria are within normal thresholds.
              </span>
              <span className="text-[11px] text-muted-foreground">Zero active alerts</span>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                    alert.severity === "critical"
                      ? "border-red-500/30 bg-red-500/5 text-red-900"
                      : "border-amber-500/30 bg-amber-500/5 text-amber-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          alert.severity === "critical"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{alert.title}</h4>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mb-3">{alert.message}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <button
                      onClick={() => navigate(alert.action_url)}
                      className="text-[#000953] font-semibold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Resolve Issue <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
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

            <button
              onClick={() => setShowAddTrainerModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Faculty Record
            </button>

            {readyForSignoffCount > 0 && (
              <button
                onClick={handleSignOffAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1.5 border border-border shadow-sm"
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

      {/* Dynamic Add Faculty Compliance Record Modal */}
      <AnimatePresence>
        {showAddTrainerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">Add Faculty Compliance Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTrainer} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Trainer Full Name</label>
                  <input
                    type="text"
                    required
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                    placeholder="e.g. Alexander Kinoti"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Staff ID</label>
                    <input
                      type="text"
                      value={trainerForm.staffId}
                      onChange={(e) => setTrainerForm({ ...trainerForm, staffId: e.target.value })}
                      placeholder="e.g. MTTI/EMP/042"
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Department</label>
                    <select
                      value={trainerForm.department}
                      onChange={(e) => setTrainerForm({ ...trainerForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Unit Code</label>
                    <input
                      type="text"
                      required
                      value={trainerForm.unitCode}
                      onChange={(e) => setTrainerForm({ ...trainerForm, unitCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. 061155101A"
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-mono font-bold outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Unit Title</label>
                    <input
                      type="text"
                      value={trainerForm.unitTitle}
                      onChange={(e) => setTrainerForm({ ...trainerForm, unitTitle: e.target.value })}
                      placeholder="e.g. Digital Literacy"
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Learning Plan</label>
                    <select
                      value={trainerForm.learningPlanStatus}
                      onChange={(e) => setTrainerForm({ ...trainerForm, learningPlanStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-1">RoW Status</label>
                    <select
                      value={trainerForm.rowStatus}
                      onChange={(e) => setTrainerForm({ ...trainerForm, rowStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Ready for Sign-off">Ready for Sign-off</option>
                      <option value="Signed & Verified">Signed & Verified</option>
                      <option value="Incomplete">Incomplete</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddTrainerModal(false)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Save Profile
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
