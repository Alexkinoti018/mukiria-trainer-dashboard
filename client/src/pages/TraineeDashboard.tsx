import { useMemo } from "react";
import TraineeLayout from "@/components/TraineeLayout";
import { Link } from "wouter";
import { useAuth, findRosterTraineeByIdentifier } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
import { useTrainees } from "@/contexts/TraineeContext";
import { GraduationCap, BookOpen, FileCheck2, UploadCloud, ArrowRight, ShieldCheck } from "lucide-react";

const ALL_SERIES_EXAMS = [
  {
    code: "061155101A-WA1",
    title: "Digital Literacy — Written Assessment 1 (CT1)",
    subtitle: "Core Procedures, ICT Safety & Office Productivity",
    marks: 100,
    mins: 120,
    level: "KNQF Level 5/6",
    cohorts: ["FBS", "LS", "DIGITAL"],
  },
  {
    code: "061155101A-WA2",
    title: "Digital Literacy — Written Assessment 2 (CT2)",
    subtitle: "Computer Systems, Architecture & Operating Systems",
    marks: 100,
    mins: 120,
    level: "KNQF Level 5/6",
    cohorts: ["FBS", "LS", "DIGITAL"],
  },
  {
    code: "061155101A-WA3",
    title: "Digital Literacy — Written Assessment 3 (CT3)",
    subtitle: "Networks, Collaboration & Digital Citizenship",
    marks: 100,
    mins: 120,
    level: "KNQF Level 5/6",
    cohorts: ["FBS", "LS", "DIGITAL"],
  },
  {
    code: "0415-451-21A-WA1",
    title: "Apply ICT Skills — Written Assessment 1 (CT1)",
    subtitle: "Computer Hardware, OS & Word Processing",
    marks: 100,
    mins: 120,
    level: "KNQF Level 5/6",
    cohorts: ["ADMIN"],
  },
  {
    code: "IT/CU/ICTA/CR/01/4/MA",
    title: "Perform Computer Essentials — Formative Practical & Oral",
    subtitle: "Hardware Identification, Device Manager & File Archiving",
    marks: 100,
    mins: 180,
    level: "KNQF Level 4/6",
    cohorts: ["ICT4", "ITECH"],
  },
];

export default function TraineeDashboard() {
  const { user } = useAuth();
  const { submissions } = useExam();
  const { uploads } = useTrainees();

  const rosterEntry = useMemo(() => {
    if (!user) return null;
    return findRosterTraineeByIdentifier(user.reg_number || user.name || "");
  }, [user]);

  const traineeName = user?.name || rosterEntry?.name || "Trainee Candidate";
  const traineeRegNo = user?.reg_number || rosterEntry?.regCode || rosterEntry?.admNo || "FBS 5 MOD/13254/12026";
  const cohortCode = user?.cohort_code || rosterEntry?.classCode || "FBS 5 MOD/J/2026";
  const department = rosterEntry?.department || "Academic Department";

  // Filter exams relevant to the logged-in trainee's cohort
  const cohortExams = useMemo(() => {
    const upperCohort = cohortCode.toUpperCase();
    const matched = ALL_SERIES_EXAMS.filter((ex) =>
      ex.cohorts.some((tag) => upperCohort.includes(tag))
    );
    return matched.length > 0 ? matched : ALL_SERIES_EXAMS.slice(0, 3);
  }, [cohortCode]);

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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Cohort Examinations */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Upcoming Online Exams
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cohortExams.length} active examination{cohortExams.length !== 1 ? "s" : ""} assigned to {cohortCode}.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                TERM 3 2026
              </span>
            </div>

            <div className="space-y-3">
              {cohortExams.map((ex) => (
                <div
                  key={ex.code}
                  className="p-4 bg-muted/40 hover:bg-muted/70 transition-all rounded-xl border border-border flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-600">{ex.code}</span>
                      <span className="text-[11px] text-muted-foreground">
                        • {ex.level} • {ex.marks}% • {ex.mins} Mins
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm truncate mt-0.5">{ex.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{ex.subtitle}</p>
                  </div>
                  <Link
                    href={`/trainee/exam?unitCode=${encodeURIComponent(ex.code)}&regNo=${encodeURIComponent(traineeRegNo)}`}
                  >
                    <a className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm">
                      Start Exam
                    </a>
                  </Link>
                </div>
              ))}
            </div>
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
