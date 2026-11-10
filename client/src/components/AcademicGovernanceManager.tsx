/**
 * Academic Governance & Institutional Authority Manager
 * Mukiria Technical Training Institute (MTTI)
 *
 * Provides HODs and Administrators with full operational authority over:
 * 1. Staff Account Provisioning (Trainers & HODs)
 * 2. Trainee Provisioning (Zero-Email, Admission-Number Driven)
 * 3. Cohort / Class Management
 * 4. Unit of Competence Allocation & Revocation
 * 5. Credential Lifecycle & Administrative Password Resets
 */

import { useState, useEffect, type FormEvent } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  Layers,
  KeyRound,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const INSTITUTIONAL_DEPARTMENTS = [
  { id: "dept-ci", name: "Computing & Informatics", code: "CI" },
  { id: "dept-ee", name: "Electrical & Electronics Engineering", code: "EEE" },
  { id: "dept-bce", name: "Building & Civil Engineering", code: "BCE" },
  { id: "dept-him", name: "Hospitality & Institutional Management", code: "HIM" },
  { id: "dept-ia", name: "Institutional Academics", code: "IA" },
  { id: "dept-aes", name: "Agriculture & Environmental Studies", code: "AES" },
  { id: "dept-ch", name: "Cosmetology & Hairdressing", code: "CH" },
  { id: "dept-sg", name: "Surveying & Geomatics", code: "SG" },
  { id: "dept-mae", name: "Mechanical & Automotive Engineering", code: "MAE" },
  { id: "dept-business", name: "Business Studies", code: "BUS" },
];

interface StaffMember {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  department: string;
  department_id: string;
  role: string;
  assigned_units?: string[];
}

interface Cohort {
  code: string;
  name: string;
  department_id: string;
  level?: string;
  term?: string;
}

interface UnitOffering {
  id: string;
  term_id: string;
  class_id: string;
  unit_code: string;
  unit_id: string;
  trainer_id: string;
  department_id: string;
}

interface CreatedAccountInfo {
  type: "staff" | "trainee";
  name: string;
  identifier: string;
  role: string;
  department: string;
  temporaryPassword: string;
  cohort?: string;
}

export function AcademicGovernanceManager() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isHOD = user?.role === "hod";

  const callerDeptId = user?.department_id || "dept-ci";
  const callerDeptObj = INSTITUTIONAL_DEPARTMENTS.find((d) => d.id === callerDeptId);
  const departmentName = callerDeptObj?.name || "Computing & Informatics";

  // Data lists
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [cohortList, setCohortList] = useState<Cohort[]>([]);
  const [offeringsList, setOfferingsList] = useState<UnitOffering[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Credential Display
  const [createdAccount, setCreatedAccount] = useState<CreatedAccountInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<{ id: string; name: string } | null>(null);

  // Forms State: Staff
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState<"trainer" | "hod">("trainer");
  const [staffDept, setStaffDept] = useState(isAdmin ? "dept-ci" : callerDeptId);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Forms State: Trainee
  const [traineeName, setTraineeName] = useState("");
  const [traineeAdm, setTraineeAdm] = useState("");
  const [traineeCohort, setTraineeCohort] = useState("");
  const [traineePhone, setTraineePhone] = useState("");
  const [traineeDept, setTraineeDept] = useState(isAdmin ? "dept-ci" : callerDeptId);
  const [submittingTrainee, setSubmittingTrainee] = useState(false);

  // Forms State: Cohort
  const [cohortCode, setCohortCode] = useState("");
  const [cohortTitle, setCohortTitle] = useState("");
  const [cohortLevel, setCohortLevel] = useState("Level 6");
  const [cohortTerm, setCohortTerm] = useState("Term 3 2026");
  const [cohortDept, setCohortDept] = useState(isAdmin ? "dept-ci" : callerDeptId);
  const [submittingCohort, setSubmittingCohort] = useState(false);

  // Forms State: Unit Allocation
  const [allocTrainerId, setAllocTrainerId] = useState("");
  const [allocUnitCode, setAllocUnitCode] = useState("");
  const [allocUnitName, setAllocUnitName] = useState("");
  const [allocCohort, setAllocCohort] = useState("");
  const [allocDept, setAllocDept] = useState(isAdmin ? "dept-ci" : callerDeptId);
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, cohortsRes, offeringsRes] = await Promise.all([
        fetch("/api/academic/staff"),
        fetch("/api/academic/cohorts"),
        fetch("/api/academic/offerings"),
      ]);

      if (staffRes.ok) {
        const sData = await staffRes.json();
        setStaffList(sData.staff || []);
      }
      if (cohortsRes.ok) {
        const cData = await cohortsRes.json();
        setCohortList(cData.cohorts || []);
      }
      if (offeringsRes.ok) {
        const oData = await offeringsRes.json();
        setOfferingsList(oData.offerings || []);
      }
    } catch (err) {
      console.error("Governance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // ── 1. Create Staff ────────────────────────────────────────────────────────
  const handleCreateStaff = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingStaff(true);
    try {
      const targetDept = isAdmin ? staffDept : callerDeptId;
      const targetRole = isHOD ? "trainer" : staffRole;

      const res = await fetch("/api/academic/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          role: targetRole,
          department_id: targetDept,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff account");

      const deptName =
        INSTITUTIONAL_DEPARTMENTS.find((d) => d.id === targetDept)?.name || targetDept;

      setCreatedAccount({
        type: "staff",
        name: data.user.name,
        identifier: data.user.email,
        role: data.user.role.toUpperCase(),
        department: deptName,
        temporaryPassword: data.temporaryPassword,
      });

      toast.success("Staff Account Created", {
        description: `Login created for ${data.user.name} (${data.user.role.toUpperCase()})`,
      });

      // Reset form & reload
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      fetchData();
    } catch (err: any) {
      toast.error("Staff Creation Failed", { description: err.message });
    } finally {
      setSubmittingStaff(false);
    }
  };

  // ── 2. Create Trainee ──────────────────────────────────────────────────────
  const handleCreateTrainee = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingTrainee(true);
    try {
      const targetDept = isAdmin ? traineeDept : callerDeptId;
      const res = await fetch("/api/academic/trainees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: traineeName,
          adm_no: traineeAdm,
          class_code: traineeCohort,
          department_id: targetDept,
          phone: traineePhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision trainee account");

      const deptName =
        INSTITUTIONAL_DEPARTMENTS.find((d) => d.id === targetDept)?.name || targetDept;

      setCreatedAccount({
        type: "trainee",
        name: data.user.name,
        identifier: data.user.admission_number,
        role: "TRAINEE",
        department: deptName,
        cohort: traineeCohort,
        temporaryPassword: data.temporaryPassword,
      });

      toast.success("Trainee Account Provisioned", {
        description: `Admission: ${data.user.admission_number} for cohort ${traineeCohort}`,
      });

      // Reset form
      setTraineeName("");
      setTraineeAdm("");
      setTraineePhone("");
      fetchData();
    } catch (err: any) {
      toast.error("Trainee Provisioning Failed", { description: err.message });
    } finally {
      setSubmittingTrainee(false);
    }
  };

  // ── 3. Create Cohort ───────────────────────────────────────────────────────
  const handleCreateCohort = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingCohort(true);
    try {
      const targetDept = isAdmin ? cohortDept : callerDeptId;
      const res = await fetch("/api/academic/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cohortCode,
          name: cohortTitle || cohortCode,
          department_id: targetDept,
          level: cohortLevel,
          term: cohortTerm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cohort");

      toast.success("Cohort Created", {
        description: `Cohort ${data.cohort.code} added to academic registry`,
      });

      setCohortCode("");
      setCohortTitle("");
      fetchData();
    } catch (err: any) {
      toast.error("Cohort Creation Failed", { description: err.message });
    } finally {
      setSubmittingCohort(false);
    }
  };

  // ── 4. Assign Unit of Competence ───────────────────────────────────────────
  const handleAssignUnit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittingAlloc(true);
    try {
      const targetDept = isAdmin ? allocDept : callerDeptId;
      const res = await fetch("/api/academic/assign-unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainer_id: allocTrainerId,
          unit_code: allocUnitCode,
          unit_name: allocUnitName,
          class_id: allocCohort,
          department_id: targetDept,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign unit of competence");

      toast.success("Unit of Competence Assigned", {
        description: `${allocUnitCode} assigned to trainer for ${allocCohort}`,
      });

      setAllocUnitCode("");
      setAllocUnitName("");
      fetchData();
    } catch (err: any) {
      toast.error("Allocation Failed", { description: err.message });
    } finally {
      setSubmittingAlloc(false);
    }
  };

  // ── 5. Revoke Unit Assignment ──────────────────────────────────────────────
  const handleRevokeUnit = async (offeringId: string) => {
    try {
      const res = await fetch(`/api/academic/assign-unit/${offeringId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke assignment");

      toast.success("Assignment Revoked", {
        description: "The unit allocation has been removed from active teaching schedule.",
      });
      setOfferingsList((prev) => prev.filter((o) => o.id !== offeringId));
    } catch (err: any) {
      toast.error("Revocation Failed", { description: err.message });
    }
  };

  // ── 6. Reset Password ──────────────────────────────────────────────────────
  const handleExecutePasswordReset = async () => {
    if (!resetModalUser) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/academic/users/${resetModalUser.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setCreatedAccount({
        type: "staff",
        name: resetModalUser.name,
        identifier: resetModalUser.name,
        role: "CREDENTIAL RESET",
        department: departmentName,
        temporaryPassword: data.temporaryPassword,
      });

      toast.success("Password Reset Successfully", {
        description: `New temporary password generated for ${resetModalUser.name}.`,
      });
      setResetModalUser(null);
    } catch (err: any) {
      toast.error("Password Reset Failed", { description: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdAccount) return;
    const text =
      createdAccount.type === "trainee"
        ? `Mukiria TTI Candidate Login\nName: ${createdAccount.name}\nAdmission No: ${createdAccount.identifier}\nCohort: ${createdAccount.cohort || "Assigned"}\nTemporary Password: ${createdAccount.temporaryPassword}\nLogin Portal: /login`
        : `Mukiria TTI Faculty Staff Login\nName: ${createdAccount.name}\nRole: ${createdAccount.role}\nEmail: ${createdAccount.identifier}\nTemporary Password: ${createdAccount.temporaryPassword}\nLogin Portal: /login`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Login details copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy automatically. Please copy manually.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Institutional Academic Governance & Authority
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                  {isAdmin ? "Institute-Wide Admin Authority" : `HOD Authority (${callerDeptObj?.code || "CI"})`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin
                  ? "Direct authority to provision faculty staff, register candidates, establish cohorts, and allocate curriculum competencies across all departments."
                  : `Departmental governance for ${departmentName}. Full authority over departmental staff, cohorts, trainees, and unit assignments.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-background border border-border hover:bg-muted text-foreground flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Directory
            </button>
          </div>
        </div>
      </div>

      {/* Main Governance Tabs */}
      <div className="p-6">
        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-muted/60 p-1 rounded-xl mb-6">
            <TabsTrigger value="staff" className="text-xs font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Staff Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="trainees" className="text-xs font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>Trainee Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="text-xs font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Cohorts & Classes</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="text-xs font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Unit Allocation</span>
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: STAFF ACCOUNTS                                              */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="staff" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-1 p-5 rounded-xl border border-border bg-card/60 shadow-xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Provision Staff Member
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Creates operational faculty credentials with temporary access password.
                </p>

                <form onSubmit={handleCreateStaff} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eng. Peter Kimani"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Institutional Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. p.kimani@mtti.ac.ke"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. +254 712 345 678"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Department</label>
                      <select
                        value={staffDept}
                        onChange={(e) => setStaffDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isAdmin && (
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Role Assignment</label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as "trainer" | "hod")}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="trainer">Trainer (Teaching Faculty)</option>
                        <option value="hod">Head of Department (HOD)</option>
                      </select>
                    </div>
                  )}

                  {isHOD && (
                    <div className="p-2.5 rounded-lg bg-muted text-[11px] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Scoped to <strong>{departmentName}</strong> as Trainer.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingStaff}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
                  >
                    {submittingStaff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Create Staff Login
                  </button>
                </form>
              </div>

              {/* Staff Directory Table */}
              <div className="lg:col-span-2 border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Faculty Directory ({staffList.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Authority: {isAdmin ? "Institute-wide" : departmentName}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[420px]">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Staff Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No faculty members found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        staffList.map((staff) => (
                          <TableRow key={staff.id || staff.email}>
                            <TableCell className="font-semibold text-foreground">
                              {staff.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {staff.email || "—"}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary uppercase">
                                {staff.role}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {staff.department}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() =>
                                  setResetModalUser({
                                    id: staff.userId || staff.id,
                                    name: staff.name,
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-border hover:bg-muted text-foreground inline-flex items-center gap-1 transition-all"
                              >
                                <KeyRound className="w-3 h-3" />
                                Reset Password
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: TRAINEE ACCOUNTS                                            */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="trainees" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-1 p-5 rounded-xl border border-border bg-card/60 shadow-xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Provision Trainee Account
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Zero-email rule: Candidate logs in directly using Admission Number & temporary password.
                </p>

                <form onSubmit={handleCreateTrainee} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Doris Gakii Nthiga"
                      value={traineeName}
                      onChange={(e) => setTraineeName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14179/S2026 or 10525"
                      value={traineeAdm}
                      onChange={(e) => setTraineeAdm(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Cohort / Class Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. class-itech-6 or ICT4 MOD/S/2026"
                      value={traineeCohort}
                      onChange={(e) => setTraineeCohort(e.target.value)}
                      list="cohort-options"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <datalist id="cohort-options">
                      {cohortList.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. +254 700 123 456"
                      value={traineePhone}
                      onChange={(e) => setTraineePhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Department</label>
                      <select
                        value={traineeDept}
                        onChange={(e) => setTraineeDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isHOD && (
                    <div className="p-2.5 rounded-lg bg-muted text-[11px] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Assigned to department: <strong>{departmentName}</strong></span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingTrainee}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
                  >
                    {submittingTrainee ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    Provision Trainee Account
                  </button>
                </form>
              </div>

              {/* Trainee Guidance & Verification Ledger */}
              <div className="lg:col-span-2 border border-border rounded-xl bg-card p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Zero-Email Institutional Security Model
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Under TVET compliance standards, candidates are subordinated to HOD and Administrative oversight. Trainees log in using their <strong>Admission Number</strong> as their primary identifier. No personal email disclosure is necessary.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                      <div className="text-xs font-bold text-foreground mb-1">Authentication Handshake</div>
                      <p className="text-[11px] text-muted-foreground">
                        The candidate enters their Admission Number (e.g. <code>14179/S2026</code>) and temporary password. Upon first authentication, credentials can be updated safely.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                      <div className="text-xs font-bold text-foreground mb-1">Governance & Reset Authority</div>
                      <p className="text-[11px] text-muted-foreground">
                        If a candidate misplaces their password, the HOD or Administrator can execute an instant credential reset without third-party email dependencies.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Institutional Note:</span> Only authorized HODs and Administrators possess the authority to enroll or alter candidate accounts. Trainers cannot self-register candidates.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: COHORTS & CLASSES                                           */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="cohorts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-1 p-5 rounded-xl border border-border bg-card/60 shadow-xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-primary" />
                  Create Academic Cohort
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Define a new class/cohort offering for curriculum delivery.
                </p>

                <form onSubmit={handleCreateCohort} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Cohort Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ICT6/S26 or EE5/J26"
                      value={cohortCode}
                      onChange={(e) => setCohortCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Cohort Title / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. ICT Technician Level 6 Modular"
                      value={cohortTitle}
                      onChange={(e) => setCohortTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Qualification Level</label>
                    <select
                      value={cohortLevel}
                      onChange={(e) => setCohortLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Level 6">Level 6 (Diploma)</option>
                      <option value="Level 5">Level 5 (Craft Certificate)</option>
                      <option value="Level 4">Level 4 (Artisan)</option>
                      <option value="Level 4 & 6">Level 4 & 6 (Combined Modular)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Academic Term</label>
                    <input
                      type="text"
                      value={cohortTerm}
                      onChange={(e) => setCohortTerm(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Department</label>
                      <select
                        value={cohortDept}
                        onChange={(e) => setCohortDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isHOD && (
                    <div className="p-2.5 rounded-lg bg-muted text-[11px] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Registered under <strong>{departmentName}</strong></span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingCohort}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
                  >
                    {submittingCohort ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    Establish Cohort
                  </button>
                </form>
              </div>

              {/* Cohorts Table */}
              <div className="lg:col-span-2 border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Registered Cohorts ({cohortList.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Scope: {isAdmin ? "Institute-wide" : departmentName}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[420px]">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Cohort Code</TableHead>
                        <TableHead>Name / Title</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohortList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No cohorts registered yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        cohortList.map((cohort) => {
                          const deptObj = INSTITUTIONAL_DEPARTMENTS.find(
                            (d) => d.id === cohort.department_id
                          );
                          return (
                            <TableRow key={cohort.code}>
                              <TableCell className="font-bold text-foreground">
                                {cohort.code}
                              </TableCell>
                              <TableCell className="text-foreground">
                                {cohort.name}
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-muted text-foreground">
                                  {cohort.level || "Level 6"}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {cohort.term || "Term 3 2026"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {deptObj?.code || cohort.department_id}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 4: UNIT ALLOCATION                                             */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <TabsContent value="units" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="lg:col-span-1 p-5 rounded-xl border border-border bg-card/60 shadow-xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Assign Unit of Competence
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Allocate teaching responsibility to a faculty trainer for a cohort.
                </p>

                <form onSubmit={handleAssignUnit} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Assigned Trainer</label>
                    <select
                      required
                      value={allocTrainerId}
                      onChange={(e) => setAllocTrainerId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Faculty Trainer...</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Unit Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ICT/CU/IT/CR/6/6 or 061155101A"
                      value={allocUnitCode}
                      onChange={(e) => setAllocUnitCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Unit Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Networks & Maintenance"
                      value={allocUnitName}
                      onChange={(e) => setAllocUnitName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Cohort / Class</label>
                    <select
                      required
                      value={allocCohort}
                      onChange={(e) => setAllocCohort(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Cohort...</option>
                      {cohortList.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">Department</label>
                      <select
                        value={allocDept}
                        onChange={(e) => setAllocDept(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {INSTITUTIONAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isHOD && (
                    <div className="p-2.5 rounded-lg bg-muted text-[11px] text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Scoped to <strong>{departmentName}</strong></span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingAlloc}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-xs mt-2"
                  >
                    {submittingAlloc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                    Assign Unit of Competence
                  </button>
                </form>
              </div>

              {/* Offerings Table */}
              <div className="lg:col-span-2 border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Active Unit Allocations ({offeringsList.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Scope: {isAdmin ? "Institute-wide" : departmentName}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[420px]">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Unit Code</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Trainer</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offeringsList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No unit offerings assigned yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        offeringsList.map((offering) => {
                          const trainer = staffList.find((s) => s.id === offering.trainer_id);
                          const deptObj = INSTITUTIONAL_DEPARTMENTS.find(
                            (d) => d.id === offering.department_id
                          );
                          return (
                            <TableRow key={offering.id}>
                              <TableCell className="font-bold text-foreground">
                                {offering.unit_code}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">
                                {offering.class_id}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {trainer?.name || offering.trainer_id}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {deptObj?.code || offering.department_id}
                              </TableCell>
                              <TableCell className="text-right">
                                <button
                                  onClick={() => handleRevokeUnit(offering.id)}
                                  className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Revoke
                                </button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Credential Issuance Dialog ──────────────────────────────────────── */}
      <Dialog open={!!createdAccount} onOpenChange={(open) => !open && setCreatedAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold">
              {createdAccount?.type === "trainee" ? "Trainee Credentials Provisioned" : "Staff Credentials Created"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Save or distribute these temporary access credentials securely. The user will be required to change their password upon initial sign in.
            </DialogDescription>
          </DialogHeader>

          {createdAccount && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border border-border bg-muted/40 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-semibold text-foreground">{createdAccount.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {createdAccount.type === "trainee" ? "Admission Number:" : "Login Email:"}
                  </span>
                  <span className="font-mono font-semibold text-foreground">{createdAccount.identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <span className="font-semibold text-primary">{createdAccount.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-semibold text-foreground">{createdAccount.department}</span>
                </div>
                {createdAccount.cohort && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cohort / Class:</span>
                    <span className="font-semibold text-foreground">{createdAccount.cohort}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Temporary Access Password
                </label>
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-2">
                  <code className="font-mono font-bold text-sm text-foreground select-all">
                    {createdAccount.temporaryPassword}
                  </code>
                  <button
                    onClick={handleCopyCredentials}
                    className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                    title="Copy details"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center gap-2">
            <button
              onClick={handleCopyCredentials}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied to Clipboard" : "Copy Credentials"}
            </button>
            <button
              onClick={() => setCreatedAccount(null)}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Password Reset Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={!!resetModalUser} onOpenChange={(open) => !open && setResetModalUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold">Reset User Password</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to reset credentials for <strong>{resetModalUser?.name}</strong>? A new cryptographically secure temporary password will be generated.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setResetModalUser(null)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExecutePasswordReset}
              disabled={isResetting}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              Confirm Reset
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
