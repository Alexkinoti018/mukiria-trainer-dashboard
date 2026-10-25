/**
 * Institutional Trainee Directory & Roster Management Component
 * Mukiria Technical Training Institute (MTTI)
 *
 * Provides full dynamic roster management (CRUD, filtering, search, and diagnostics)
 * using the TraineeService repository abstraction layer.
 *
 * Branding:
 * - Primary Navy: #000953
 * - Gold Accent:  #c48820
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTrainees, type Trainee } from "@/contexts/TraineeContext";
import {
  TraineeService,
  DatabaseUnavailableError,
} from "@/services/TraineeService";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { normalizeAdmissionNumber, matchAdmissionNumbers } from "@/lib/utils";

export interface AdminRosterManagementProps {
  className?: string;
}

export function AdminRosterManagement({ className = "" }: AdminRosterManagementProps) {
  const { trainees, updateTrainee, deleteTrainee } = useTrainees();

  // ── Remote Trainee Roster State ───────────────────────────────────────────
  const [rosterData, setRosterData] = useState<Trainee[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Search & Filter State
  const [traineeSearch, setTraineeSearch] = useState("");
  const [traineeCohortFilter, setTraineeCohortFilter] = useState("all");

  // Trainee Edit Modal State
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    admNo: "",
    classCode: "",
    department: "",
    phone: "",
    email: "",
    remarks: "",
  });

  // Trainee Delete Alert State
  const [traineeToDelete, setTraineeToDelete] = useState<Trainee | null>(null);
  const [isDeletingTrainee, setIsDeletingTrainee] = useState(false);

  // Fetch roster via TraineeService repository abstraction
  const fetchRoster = async () => {
    setIsLoadingRoster(true);
    setRosterError(null);
    try {
      const traineesList = await TraineeService.fetchRoster();
      setRosterData(traineesList);
    } catch (err: any) {
      console.warn("Notice: Trainee fetch via TraineeService:", err.message);
      if (err instanceof DatabaseUnavailableError || err.status === 503) {
        setRosterError(
          "Database Service Unavailable (HTTP 503): PostgreSQL is offline. Operating in fallback mode with cached roster."
        );
      } else {
        setRosterError(err.message || "Failed to load remote roster");
      }
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  // Authoritative active roster (remote DB with local fallback)
  const activeRoster = useMemo(() => {
    if (rosterData.length > 0) return rosterData;
    return trainees;
  }, [rosterData, trainees]);

  // Trainee Cohort Breakdown
  const cohortStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeRoster.forEach((t) => {
      const code = t.classCode || "Other";
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [activeRoster]);

  // Filtered Trainees for Admin Roster Directory
  const filteredTrainees = useMemo(() => {
    const q = traineeSearch.trim();
    const normQ = normalizeAdmissionNumber(q);

    return activeRoster.filter((t) => {
      const matchesCohort =
        traineeCohortFilter === "all" ||
        (t.classCode && t.classCode.toLowerCase().includes(traineeCohortFilter.toLowerCase()));
      if (!matchesCohort) return false;

      if (!q) return true;

      // Case-insensitive name match
      if (t.name && t.name.toLowerCase().includes(q.toLowerCase())) return true;

      // Contact details match (case-insensitive)
      if (t.email && t.email.toLowerCase().includes(q.toLowerCase())) return true;
      if (t.phone && t.phone.toLowerCase().includes(q.toLowerCase())) return true;

      // Admission Number matching with prefix / whitespace tolerance
      const rawAdm = t.admNo || t.regCode || "";
      if (rawAdm.toLowerCase().includes(q.toLowerCase())) return true;

      if (normQ) {
        const normAdm = normalizeAdmissionNumber(rawAdm);
        if (normAdm.includes(normQ) || matchAdmissionNumbers(rawAdm, q)) return true;
      }

      return false;
    });
  }, [activeRoster, traineeSearch, traineeCohortFilter]);

  const handleOpenEdit = (t: Trainee) => {
    setEditingTrainee(t);
    setEditFormData({
      name: t.name || "",
      admNo: t.admNo || t.regCode || "",
      classCode: t.classCode || "",
      department: t.department || "Computing & Informatics",
      phone: t.phone || "",
      email: t.email || "",
      remarks: t.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTrainee) return;
    setIsSavingEdit(true);
    try {
      const updates = {
        name: editFormData.name.trim(),
        admNo: editFormData.admNo.trim(),
        regNumber: editFormData.admNo.trim(),
        regCode: editFormData.admNo.trim(),
        classCode: editFormData.classCode.trim(),
        department: editFormData.department.trim(),
        phone: editFormData.phone.trim() || undefined,
        email: editFormData.email.trim() || undefined,
        remarks: editFormData.remarks.trim() || undefined,
      };

      // Call TraineeService abstraction layer
      await TraineeService.updateTrainee(editingTrainee.id, updates);

      updateTrainee(editingTrainee.id, updates);
      setRosterData((prev) =>
        prev.map((t) => (t.id === editingTrainee.id ? { ...t, ...updates } : t))
      );

      toast.success("Trainee Record Updated", {
        description: `Successfully updated ${updates.name} (${updates.admNo}).`,
      });
      setIsEditModalOpen(false);
      setEditingTrainee(null);
    } catch (err: any) {
      if (err instanceof DatabaseUnavailableError || err.status === 503) {
        toast.error("Database Unavailable (503)", {
          description: "Cannot sync update to PostgreSQL. Database is currently unreachable.",
        });
      } else {
        toast.error("Update Failed", {
          description: err.message || "Failed to update trainee record",
        });
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!traineeToDelete) return;
    setIsDeletingTrainee(true);
    try {
      // Call TraineeService abstraction layer
      await TraineeService.deleteTrainee(traineeToDelete.id);

      deleteTrainee(traineeToDelete.id);
      setRosterData((prev) => prev.filter((t) => t.id !== traineeToDelete.id));

      toast.success("Trainee Record Removed", {
        description: `Candidate ${traineeToDelete.name} (${traineeToDelete.admNo}) has been removed.`,
      });
      setTraineeToDelete(null);
    } catch (err: any) {
      if (err instanceof DatabaseUnavailableError || err.status === 503) {
        toast.error("Database Unavailable (503)", {
          description: "Cannot remove trainee from PostgreSQL. Database is currently unreachable.",
        });
      } else {
        toast.error("Delete Failed", {
          description: err.message || "Failed to delete trainee record",
        });
      }
    } finally {
      setIsDeletingTrainee(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── HEADER & LIVE METRICS ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#c48820]" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Institutional Trainee Directory & Roster Management
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Total registered trainees: <strong className="text-white">{activeRoster.length}</strong>
          </span>
          <button
            type="button"
            onClick={fetchRoster}
            disabled={isLoadingRoster}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#000953] border border-[#c48820]/40 text-[#c48820] text-xs font-semibold hover:bg-[#c48820]/20 hover:text-white transition-all disabled:opacity-50"
            title="Refresh roster from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRoster ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(cohortStats).slice(0, 4).map(([cohort, count]) => (
          <div
            key={cohort}
            className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1 hover:border-white/15 transition-all"
          >
            <p className="text-xs text-slate-400 truncate font-medium">{cohort}</p>
            <p className="text-2xl font-black text-white">{count}</p>
            <p className="text-[10px] text-emerald-400 font-semibold">Active Institutional Roster</p>
          </div>
        ))}
      </div>

      {/* ── DIRECTORY TABLE CONTAINER ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-4 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Enrolled Trainees Directory</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c48820]/20 text-amber-300 border border-[#c48820]/30">
                Administrator Protected View
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Trainee email addresses and contact phone numbers are securely displayed exclusively on this Administrator portal.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, adm no, email, phone..."
                value={traineeSearch}
                onChange={(e) => setTraineeSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#c48820] w-full"
              />
            </div>
            <select
              value={traineeCohortFilter}
              onChange={(e) => setTraineeCohortFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-[#c48820]"
            >
              <option value="all">All Cohorts ({activeRoster.length})</option>
              {Object.keys(cohortStats).map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({cohortStats[cls]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {rosterError && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{rosterError}</span>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden">
          <Table className="w-full text-left text-xs">
            <TableHeader className="bg-[#000953]/90 border-b border-white/10">
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="p-3 w-12 text-center text-slate-400 font-bold">#</TableHead>
                <TableHead className="p-3 text-[#c48820] font-bold">Admission Number</TableHead>
                <TableHead className="p-3 text-slate-200 font-bold">Full Trainee Name</TableHead>
                <TableHead className="p-3 text-slate-200 font-bold">Class / Cohort</TableHead>
                <TableHead className="p-3 text-amber-300 font-bold">Email (Admin Only)</TableHead>
                <TableHead className="p-3 text-amber-300 font-bold">Phone (Admin Only)</TableHead>
                <TableHead className="p-3 text-center text-slate-200 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5 font-mono text-[11px]">
              {filteredTrainees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-6 text-center text-slate-500 font-sans">
                    No trainees match the search filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrainees.map((t, idx) => (
                  <TableRow key={t.id || idx} className="hover:bg-white/[0.03] transition-colors border-b border-white/5">
                    <TableCell className="p-3 text-center text-slate-500 font-mono">{idx + 1}</TableCell>
                    <TableCell className="p-3 font-bold text-white tracking-wide">{t.admNo || t.regCode}</TableCell>
                    <TableCell className="p-3 font-sans font-semibold text-slate-200">{t.name}</TableCell>
                    <TableCell className="p-3 text-slate-400 font-sans text-xs">{t.classCode}</TableCell>
                    <TableCell className="p-3 text-slate-300 font-sans">
                      {t.email ? (
                        <span className="text-amber-200/90">{t.email}</span>
                      ) : (
                        <span className="text-slate-600 italic">Not entered</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-slate-300">
                      {t.phone ? (
                        <span className="text-amber-200/90">{t.phone}</span>
                      ) : (
                        <span className="text-slate-600 italic">Not entered</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-[#000953] border border-[#c48820]/40 text-[#c48820] hover:bg-[#c48820]/20 hover:text-white transition-colors"
                          title="Edit trainee record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTraineeToDelete(t)}
                          className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60 hover:text-red-200 transition-colors"
                          title="Delete trainee record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Showing {filteredTrainees.length} of {activeRoster.length} trainees</span>
          <span className="text-[11px] text-slate-500">
            Contact information is strictly withheld from student-facing views and attendance registers.
          </span>
        </div>
      </div>

      {/* ── EDIT TRAINEE MODAL (SHADCN DIALOG) ─────────────────────────────── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-900 border border-white/20 text-white max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#000953] border border-[#c48820]/40 flex items-center justify-center text-[#c48820]">
                <Edit2 className="w-4 h-4" />
              </div>
              <span>Edit Trainee Record</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Update institutional registration, cohort assignment, and contact details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Trainee Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#c48820]"
                placeholder="e.g. Nthiga Gakii Doris"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admission Number</label>
                <input
                  type="text"
                  value={editFormData.admNo}
                  onChange={(e) => setEditFormData({ ...editFormData, admNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white font-mono focus:outline-none focus:border-[#c48820]"
                  placeholder="e.g. 14179/S2026 or D/UPNUT/..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Class / Cohort</label>
                <input
                  type="text"
                  value={editFormData.classCode}
                  onChange={(e) => setEditFormData({ ...editFormData, classCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#c48820]"
                  placeholder="e.g. ITECH 6 MODULAR/S/2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number (Admin Only)</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#c48820]"
                  placeholder="+254 700 000000"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address (Admin Only)</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#c48820]"
                  placeholder="student@institution.ac.ke"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-[#c48820]"
                placeholder="Computing & Informatics"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editFormData.name.trim() || !editFormData.admNo.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#c48820] hover:bg-[#b07718] text-[#000953] font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingEdit ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE TRAINEE CONFIRMATION ALERT (SHADCN ALERT-DIALOG) ───────── */}
      <AlertDialog open={Boolean(traineeToDelete)} onOpenChange={(open) => !open && setTraineeToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border border-white/20 text-white max-w-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <span>Confirm Trainee Removal</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-300 leading-relaxed pt-2">
              Are you sure you want to remove candidate <strong className="text-white">{traineeToDelete?.name}</strong> (<span className="text-[#c48820] font-mono">{traineeToDelete?.admNo || traineeToDelete?.regCode}</span>)?
              <br /><br />
              This operation securely updates the institutional database and class registers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2 pt-3 border-t border-white/10">
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeletingTrainee}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-50"
            >
              {isDeletingTrainee ? "Removing..." : "Delete Trainee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminRosterManagement;
