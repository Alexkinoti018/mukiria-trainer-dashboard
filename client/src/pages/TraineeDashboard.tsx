import { useMemo, useState } from "react";
import TraineeLayout from "@/components/TraineeLayout";
import { Link } from "wouter";
import { useAuth, findRosterTraineeByIdentifier } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
import { useTrainees } from "@/contexts/TraineeContext";
import { evaluateExamPortalAvailability, doesExamMatchTraineeCohort } from "@/lib/supabase";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  FileCheck2,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  Clock,
  Lock,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function TraineeDashboard() {
  const { user } = useAuth();
  const { exams, submissions } = useExam();
  const { uploads } = useTrainees();

  const rosterEntry = useMemo(() => {
    if (!user) return null;
    return findRosterTraineeByIdentifier(user.reg_number || user.name || "");
  }, [user]);

  const traineeName = user?.name || rosterEntry?.name || "Trainee Candidate";
  const traineeRegNo = user?.reg_number || rosterEntry?.regCode || rosterEntry?.admNo || "FBS 5 MOD/13254/12026";
  const cohortCode = user?.cohort_code || rosterEntry?.classCode || "FBS 5 MOD/J/2026";
  const department = rosterEntry?.department || "Academic Department";

  // Check Assessment Attendance Status for this Trainee (CUR/03)
  const [attendanceSigned, setAttendanceSigned] = useState<boolean>(() => {
    try {
      const keys = [
        `mtti_class_register_${cohortCode}`,
        `mtti_class_register_persisted_${cohortCode}`,
        "mtti_class_register_FBS5/6/J/26",
        "mtti_class_register_persisted_FBS5/6/J/26",
      ];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const studentId = rosterEntry?.id || user?.id;
          if (studentId && parsed[studentId]?.signed !== undefined) {
            return !!parsed[studentId].signed;
          }
        }
      }
    } catch (e) {}
    return true; // default true for registered candidates
  });

  const handleConfirmAttendance = () => {
    const studentId = rosterEntry?.id || user?.id || "trainee-fbs";
    const keys = [
      `mtti_class_register_${cohortCode}`,
      `mtti_class_register_persisted_${cohortCode}`,
      "mtti_class_register_FBS5/6/J/26",
      "mtti_class_register_persisted_FBS5/6/J/26",
    ];
    keys.forEach((k) => {
      try {
        const raw = localStorage.getItem(k);
        const parsed = raw ? JSON.parse(raw) : {};
        const rec = parsed[studentId] || { attendance: {} };
        parsed[studentId] = {
          ...rec,
          signed: true,
        };
        localStorage.setItem(k, JSON.stringify(parsed));
      } catch (e) {}
    });
    setAttendanceSigned(true);
    toast.success("Assessment Attendance Confirmed: 'attended'", {
      description: "Your official signature has been recorded as 'attended' in MTTI/REG/CUR/03.",
    });
  };

  // Strictly filter ONLY assessments explicitly allocated (portal_visible === true) to this trainee's cohort
  const cohortExams = useMemo(() => {
    const allocatedExams = (exams || []).filter(
      (ex) =>
        ex.payload?.portal_visible === true &&
        doesExamMatchTraineeCohort(ex, cohortCode, user?.enrolled_units)
    );

    return allocatedExams.map((ex) => {
      const portalStatus = evaluateExamPortalAvailability(ex.payload);
      return {
        id: ex.id,
        code: ex.unit_code,
        title: ex.payload?.title || ex.course_name,
        subtitle: ex.payload?.unit_name || ex.course_name,
        marks: ex.payload?.total_marks ?? 100,
        mins: ex.payload?.duration_minutes ?? 120,
        taskSlot: ex.payload?.task_code || "",
        portalStatus,
      };
    });
  }, [exams, cohortCode, user?.enrolled_units]);

  // Filter graded exam submissions belonging strictly to this trainee
  const mySubmissions = useMemo(() => {
    const cleanReg = traineeRegNo.trim().toUpperCase();
    const coreDigits = cleanReg.match(/\b\d{4,6}\b/)?.[0] || "";
    const cleanName = traineeName.trim().toUpperCase();

    return submissions.filter((s) => {
      const sReg = (s.reg_number || "").trim().toUpperCase();
      const sName = (s.student_name || "").trim().toUpperCase();
      return (
        sReg === cleanReg ||
        (coreDigits && sReg.includes(coreDigits)) ||
        sName === cleanName
      );
    });
  }, [submissions, traineeRegNo, traineeName]);

  // Filter continuous assessment uploads belonging strictly to this trainee
  const myUploads = useMemo(() => {
    const cleanName = traineeName.trim().toLowerCase();
    return uploads.filter(
      (u) =>
        u.traineeId === user?.id ||
        u.traineeId === rosterEntry?.id ||
        u.student_name.trim().toLowerCase() === cleanName
    );
  }, [uploads, user?.id, rosterEntry?.id, traineeName]);

  return (
    <TraineeLayout
      title="Trainee Academic Workspace"
      subtitle={`Welcome back, ${traineeName} • ${traineeRegNo}`}
    >
      <div className="p-6 space-y-6">
        {/* Institutional Identity & Cohort Summary Banner */}
        <div className="p-5 rounded-2xl bg-[#000953] text-white border-2 border-[#c48820] shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-[#c48820]/50 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-[#c48820]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-white">{traineeName}</h2>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-[#c48820] text-[#000953]">
                  {traineeRegNo}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Cohort: <strong className="text-white">{cohortCode}</strong> • {department} • Term 3 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <ShieldCheck className="w-4 h-4 text-[#c48820]" />
            <span>Zero-Email Roster Verified</span>
          </div>
        </div>

        {/* Assessment Attendance Register Quick Action & Status (MTTI/REG/CUR/03) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border-2 border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-foreground">
                  Assessment Attendance Register (MTTI/REG/CUR/03)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary">
                  Official CDACC Register
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Attendance signature confirms your presence for continuous and summative assessments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {attendanceSigned ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Signature: <strong className="font-serif italic font-bold text-emerald-900 text-sm">attended</strong>
                </span>
              </div>
            ) : (
              <button
                onClick={handleConfirmAttendance}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition animate-pulse flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Click to Sign ('attended')
              </button>
            )}

            <Link href="/trainee/attendance">
              <a className="px-3.5 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 border border-border transition flex items-center gap-1.5">
                View Cohort Register
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Cohort Examinations, CATs & Online Assessments */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Allocated Online Exams & CATs
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cohortExams.length} allocated assessment{cohortExams.length !== 1 ? "s" : ""} for {cohortCode}.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                TERM 3 2026
              </span>
            </div>

            {cohortExams.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-2.5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  No Online Exam or CAT Currently Allocated
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Your Trainer or Department has not opened an active Continuous Assessment Test (<strong>CT1–CT3</strong>) or Practical (<strong>CP1–CP3</strong>) for <strong>{cohortCode}</strong> at this time. Scheduled papers appear here automatically when released.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cohortExams.map((ex) => {
                  const { portalStatus } = ex;
                  const existingSub = mySubmissions.find(
                    (s) =>
                      (s.unit_code && s.unit_code.trim().toUpperCase() === ex.code.trim().toUpperCase()) ||
                      (s.exam_id && s.exam_id === ex.id)
                  );
                  const statusBadgeStyle =
                    portalStatus.state === "open"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
                      : portalStatus.state === "scheduled"
                      ? "bg-blue-500/10 text-blue-700 border-blue-500/25"
                      : portalStatus.state === "past_due_open"
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/25"
                      : "bg-rose-500/10 text-rose-700 border-rose-500/25";

                  return (
                    <div
                      key={ex.id || ex.code}
                      className="p-4 bg-muted/40 hover:bg-muted/70 transition-all rounded-xl border border-border flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-amber-600">{ex.code}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary">
                              {portalStatus.categoryLabel}
                              {ex.taskSlot ? ` • ${ex.taskSlot}` : ""}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              • {ex.marks} Marks • {ex.mins} Mins
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm truncate mt-1">{ex.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{ex.subtitle}</p>
                        </div>

                        {existingSub ? (
                          existingSub.status === "graded" ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Graded ({existingSub.total_score ?? "—"}/{ex.marks})
                              </span>
                              <Link href="/trainee/results">
                                <a className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1 shadow-xs">
                                  View Script
                                </a>
                              </Link>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-700 border border-blue-500/25 flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                Submitted
                              </span>
                              <Link href="/trainee/results">
                                <a className="px-2.5 py-1 text-xs font-bold rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border transition flex items-center gap-1">
                                  View Status
                                </a>
                              </Link>
                            </div>
                          )
                        ) : portalStatus.canStart ? (
                          <Link
                            href={`/trainee/exam?unitCode=${encodeURIComponent(ex.code)}&regNo=${encodeURIComponent(traineeRegNo)}`}
                          >
                            <a className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm">
                              Start {portalStatus.categoryLabel}
                            </a>
                          </Link>
                        ) : (
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 bg-muted text-muted-foreground border border-border cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5" />
                            {portalStatus.state === "scheduled" ? "Scheduled" : "Closed"}
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold border ${
                            existingSub ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25" : statusBadgeStyle
                          }`}
                        >
                          {existingSub
                            ? existingSub.status === "graded"
                              ? "Completed • Official Script Graded"
                              : "Submitted • Under Trainer Review"
                            : portalStatus.statusLabel}
                        </span>
                        <div className="flex items-center gap-3 text-muted-foreground font-mono">
                          {portalStatus.availableFromFormatted && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-emerald-600" />
                              Opens: {portalStatus.availableFromFormatted}
                            </span>
                          )}
                          {portalStatus.dueAtFormatted && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rose-600" />
                              Due: {portalStatus.dueAtFormatted}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trainee Scoped Results & Evidence Portfolio */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-primary" />
                    My Results & Evidence Status
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Personal examination scripts and CP1–CP3 / CT1–CT3 portfolio tasks.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-primary/10 text-primary">
                  {mySubmissions.length + myUploads.length} Records
                </span>
              </div>

              <div className="space-y-2.5">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/60 rounded-xl transition-colors border border-border"
                  >
                    <div>
                      <h4 className="font-semibold text-sm">{sub.unit_code} Written Exam</h4>
                      <p className="text-xs text-muted-foreground">
                        Reg No: {sub.reg_number} • Status: {sub.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">{sub.total_score ?? 0}%</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        {(sub.total_score ?? 0) >= 50 ? "Competent" : "Recorded"}
                      </div>
                    </div>
                  </div>
                ))}

                {myUploads.slice(0, 3).map((up) => (
                  <div
                    key={up.id}
                    className="flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/60 rounded-xl transition-colors border border-border"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="font-semibold text-sm truncate">
                        {up.task_code || up.uploadType}: {up.filename}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {up.verified_by_trainer ? "Verified by Trainer" : "Pending Trainer Verification"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary">
                        {up.grade !== null ? `${up.grade}%` : "Submitted"}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">
                        {up.status}
                      </div>
                    </div>
                  </div>
                ))}

                {mySubmissions.length === 0 && myUploads.length === 0 && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      No graded scripts or evidence uploads recorded yet for {traineeRegNo}.
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Complete an online exam or upload your practical observation evidence to view scores here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
              <Link href="/trainee/assignments">
                <a className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Practical Evidence
                </a>
              </Link>
              <Link href="/trainee/results">
                <a className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                  View Official Results Slip
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TraineeLayout>
  );
}
