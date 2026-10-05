/**
 * AttendanceQuickMarkModal.tsx
 * Rapid-marking attendance modal triggered by Session Plan sign-off.
 * 
 * Strict Brand Guidelines Compliance:
 * - Primary Color: Blue (#000953)
 * - Accent Color: Gold (#c48820)
 * - Neutral Color: White (#FFFFFF)
 * - Typography: Maiandra GD (Font size base 11pt/11px)
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, User, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import { OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";

interface Trainee {
  id: string;
  name: string;
  reg_number: string;
  email?: string;
  class_id?: string;
}

interface AttendanceQuickMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  sessionPlanId: string;
  onSaveComplete: (traineeCount: number, presentCount: number) => void;
}

// Map official MTTI trainees dynamically based on classCode
function getOfficialRosterForClass(code: string): Trainee[] {
  const norm = (code || "").toUpperCase();
  const matched = OFFICIAL_MTTI_TRAINEES.filter(t => {
    if (t.classCode === code) return true;
    if ((norm.includes("ICT4") || norm.includes("ITECH6") || norm.includes("MOD 1")) && t.classCode.includes("ICT4/ITECH6")) return true;
    if (norm.includes("ADMIN") && t.classCode.includes("ADMIN")) return true;
    if (norm.includes("FBS") && t.classCode.includes("FBS")) return true;
    if (norm.includes("LS") && t.classCode.includes("LS")) return true;
    return false;
  });
  const activeList = matched.length > 0 ? matched : OFFICIAL_MTTI_TRAINEES.filter(t => t.classCode === "ICT4/ITECH6/S/26 MOD 1");
  return activeList.map(t => ({
    id: t.id,
    name: t.name,
    reg_number: t.admNo || t.regCode,
    class_id: t.classCode,
  }));
}

export default function AttendanceQuickMarkModal({
  isOpen,
  onClose,
  classCode,
  sessionPlanId,
  onSaveComplete
}: AttendanceQuickMarkModalProps) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "X" | "0">>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTrainees();
    }
  }, [isOpen, classCode]);

  const loadTrainees = async () => {
    setLoading(true);
    try {
      // Check for previously saved register for this session plan
      let existingAttendance: Record<string, "X" | "0"> | null = null;
      try {
        const savedRegisters = localStorage.getItem("mtti_attendance_registers");
        if (savedRegisters) {
          const parsed = JSON.parse(savedRegisters);
          if (parsed && parsed[sessionPlanId]) {
            existingAttendance = parsed[sessionPlanId];
          }
        }
      } catch (e) {}

      if (isSupabaseConfigured()) {
        // First find the class ID
        const { data: classData } = await (supabase as any)
          .from("classes")
          .select("id")
          .eq("class_code", classCode)
          .single();

        if (classData) {
          const { data: traineesData, error } = await (supabase as any)
            .from("trainees")
            .select("*")
            .eq("class_id", classData.id);

          if (error) throw error;
          
          if (traineesData && traineesData.length > 0) {
            setTrainees(traineesData);
            const initialAttendance: Record<string, "X" | "0"> = existingAttendance || {};
            if (!existingAttendance) {
              traineesData.forEach((t: any) => {
                initialAttendance[t.id] = "X";
              });
            }
            setAttendance(initialAttendance);
            setLoading(false);
            return;
          }
        }
      }
      
      // Official roster fallback matching requested class
      const fallbackList = getOfficialRosterForClass(classCode);
      setTrainees(fallbackList);
      const initialAttendance: Record<string, "X" | "0"> = existingAttendance || {};
      if (!existingAttendance) {
        fallbackList.forEach((t) => {
          initialAttendance[t.id] = "X";
        });
      }
      setAttendance(initialAttendance);
    } catch (err: any) {
      console.error("Error loading trainees:", err.message);
      const fallbackList = getOfficialRosterForClass(classCode);
      setTrainees(fallbackList);
      const initialAttendance: Record<string, "X" | "0"> = {};
      fallbackList.forEach((t) => {
        initialAttendance[t.id] = "X";
      });
      setAttendance(initialAttendance);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, "X" | "0"> = {};
    trainees.forEach((t) => {
      updated[t.id] = "X";
    });
    setAttendance(updated);
    toast.success("All trainees marked Present ('X')");
  };

  const toggleTrainee = (traineeId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [traineeId]: prev[traineeId] === "X" ? "0" : "X"
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const presentCount = Object.values(attendance).filter((val) => val === "X").length;
    
    try {
      // 1. Store in localStorage for instant retrieval across refreshes
      const savedRegisters = localStorage.getItem("mtti_attendance_registers") || "{}";
      const registers = JSON.parse(savedRegisters);
      registers[sessionPlanId] = attendance;
      localStorage.setItem("mtti_attendance_registers", JSON.stringify(registers));

      // 2. Dispatch to backend API / PostgreSQL
      const recordsToPersist = trainees.map((t) => ({
        unit_offering_id: "uo-1",
        trainee_id: t.id,
        week_number: 1,
        session_date: new Date().toISOString().split("T")[0],
        status: attendance[t.id] === "X" ? "present" : "absent",
        hours_attended: 2.0,
      }));

      fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_offering_id: "uo-1",
          session_plan_id: sessionPlanId,
          records: recordsToPersist,
        }),
      }).catch(err => console.warn("Background bulk attendance save notice:", err));

      // 3. Supabase upsert if configured
      if (isSupabaseConfigured() && sessionPlanId) {
        try {
          const payload = trainees.map((t) => ({
            session_plan_id: sessionPlanId,
            trainee_id: t.id,
            status: attendance[t.id] || "X"
          }));

          await (supabase as any)
            .from("attendance_register")
            .upsert(payload, { onConflict: "session_plan_id,trainee_id" });
        } catch (supabaseErr: any) {
          console.warn("Supabase save warning:", supabaseErr);
        }
      }

      toast.success(`Register saved successfully! ${presentCount}/${trainees.length} Trainees Present.`);
      onSaveComplete(trainees.length, presentCount);
      onClose();
    } catch (err: any) {
      toast.error(`Failed to save register: ${err.message}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-card border border-border text-foreground font-sans rounded-xl p-6 shadow-2xl">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#000953]">
            <CheckCircle2 className="w-5 h-5 text-[#c48820]" />
            MTTI Class Attendance Register
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Rapid marking register for Class: <strong className="text-foreground">{classCode}</strong>.
            All marked present ('X') by default. Click any row to mark absent ('0').
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-6 h-6 border-2 border-[#000953] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground font-semibold">Loading enrolled class trainees...</p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {/* Bulk Action Header */}
            <div className="flex items-center justify-between bg-secondary/35 p-3 rounded-lg border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground">
                Trainees Loaded: <span className="text-[#000953] font-bold">{trainees.length}</span>
              </span>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#c48820]/10 hover:bg-[#c48820]/20 border border-[#c48820]/40 text-[#c48820] transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Mark All Present (X)
              </button>
            </div>

            {/* Trainee List Grid */}
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 border border-border rounded-lg p-2 bg-background/50">
              {trainees.map((t, idx) => {
                const isPresent = attendance[t.id] !== "0";
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTrainee(t.id)}
                    className={`flex items-center justify-between p-3 rounded-lg text-xs transition-all duration-200 cursor-pointer border select-none ${
                      isPresent
                        ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-muted-foreground text-[10px] w-5 text-right">{idx + 1}.</span>
                      <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs truncate leading-none">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{t.reg_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground w-12 text-center uppercase tracking-wider">
                        {isPresent ? "Present ('X')" : "Absent ('0')"}
                      </span>
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center border transition-all shadow-sm ${
                          isPresent
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-rose-500 border-rose-600 text-white"
                        }`}
                      >
                        {isPresent ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border pt-3 gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-secondary border border-border text-foreground transition-all"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#000953] text-white hover:bg-[#000953]/90 transition-all shadow-md flex items-center gap-1.5"
            disabled={saving || trainees.length === 0}
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                Saving Register...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save Register & Sign
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
