import { useMemo } from "react";
import { Link } from "wouter";
import TraineeLayout from "@/components/TraineeLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useExam } from "@/contexts/ExamContext";
import {
  BookOpen,
  FileCheck2,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  UploadCloud,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

export default function TraineeDashboard() {
  const { user } = useAuth();
  const { exams, submissions } = useExam();

  const traineeName = user?.name || "Alex Kinoti";
  const regNumber = user?.reg_number || "FBS 5 MOD/13254/12026";

  // Map of completed submissions keyed by unit_code or exam_id
  const completedSubMap = useMemo(() => {
    const map = new Map<string, typeof submissions[0]>();
    for (const sub of submissions) {
      if (sub.unit_code) map.set(sub.unit_code, sub);
      if (sub.exam_id) map.set(sub.exam_id, sub);
    }
    return map;
  }, [submissions]);

  // Dynamic metrics
  const totalExams = exams.length;
  const completedCount = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.total_score !== null && s.total_score !== undefined);
  const avgScore =
    gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / gradedSubmissions.length
        )
      : 82;

  return (
    <TraineeLayout
      title="Trainee Academic Portal"
      subtitle={`Welcome back, ${traineeName} • Registration No: ${regNumber}`}
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Trainee Identity & Term Status Banner */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{traineeName}</h2>
                <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                  {regNumber}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Active Enrolled
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>Food & Beverage / ICT Level 5</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  Term 3, 2026 (07 Sep – 13 Nov 2026)
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Pills */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <Link href="/trainee/exam">
              <a className="btn-primary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Take Exam</span>
              </a>
            </Link>
            <Link href="/trainee/assignments">
              <a className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors flex items-center gap-1.5 text-foreground">
                <UploadCloud className="w-3.5 h-3.5 text-primary" />
                <span>Submit Evidence</span>
              </a>
            </Link>
            <Link href="/trainee/results">
              <a className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors flex items-center gap-1.5 text-foreground">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Results Broadsheet</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Exams</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalExams}</div>
            <p className="text-[11px] text-muted-foreground">Term 3 Unit Assessments</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
              <FileCheck2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{completedCount}</div>
            <p className="text-[11px] text-emerald-600 font-medium">Logged & Recorded</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{avgScore}%</div>
            <p className="text-[11px] text-emerald-600 font-medium">Competent Grade</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">CDACC Series</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">Active</div>
            <p className="text-[11px] text-muted-foreground">KNQF Level 5 Alignment</p>
          </div>
        </div>

        {/* Dual Main Content Columns: Upcoming Exams & Recent Results */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1: Active & Upcoming Online Exams */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Active Online Examinations</h3>
                <p className="text-xs text-muted-foreground">
                  Official examinations scheduled for your current registered cohort.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                ACTIVE SERIES
              </span>
            </div>

            <div className="space-y-3">
              {exams.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                  No online examinations currently open for registration.
                </div>
              ) : (
                exams.map((ex) => {
                  const sub = completedSubMap.get(ex.unit_code) || completedSubMap.get(ex.id);
                  const isSubmitted = !!sub;
                  const totalMarks = ex.payload?.total_marks ?? 70;
                  const durationMins = ex.payload?.duration_minutes ?? 120;
                  const title = ex.payload?.title || ex.course_name || "Unit Assessment";

                  return (
                    <div
                      key={ex.id || ex.unit_code}
                      className="p-4 bg-muted/30 hover:bg-muted/60 transition-all rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-amber-600">
                            {ex.unit_code}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            • Level 5/6 • {totalMarks} Marks • {durationMins} Mins
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm truncate mt-1 text-foreground">
                          {title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {ex.payload?.instructions || "Mukiria Technical Training Institute CDACC Assessment"}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {sub.total_score !== null ? `${sub.total_score}% Graded` : "Submitted"}
                            </span>
                            <Link href="/trainee/results">
                              <a className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors text-foreground">
                                View
                              </a>
                            </Link>
                          </div>
                        ) : (
                          <Link href={`/trainee/exam?unitCode=${encodeURIComponent(ex.unit_code)}`}>
                            <a className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm">
                              <span>Start Exam</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Recent Results & Submitted Evidence */}
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Continuous Assessment Records</h3>
                <p className="text-xs text-muted-foreground">
                  Verified marks, CATs (Continuous Assessment Tests), and practical assignments.
                </p>
              </div>
              <Link href="/trainee/results">
                <a className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
                  <span>Full Broadsheet</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </Link>
            </div>

            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                  No submissions recorded yet this term. Take an exam or submit assessment evidence to view results.
                </div>
              ) : (
                submissions.slice(0, 5).map((sub, idx) => {
                  const score = sub.total_score;
                  const isGraded = score !== null && score !== undefined;
                  const isPass = (score ?? 0) >= 50;

                  return (
                    <div
                      key={sub.id || idx}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/40 rounded-xl transition-colors border border-border/60"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            {sub.unit_code}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {sub.task_code || "Written Exam"}
                          </span>
                        </div>
                        <h4 className="font-medium text-xs truncate mt-0.5 text-foreground">
                          {sub.task_code || sub.unit_code || "Assessment Submission"}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "Term 3, 2026"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {isGraded ? (
                          <>
                            <div className={`font-bold font-mono text-sm ${isPass ? "text-emerald-600" : "text-amber-600"}`}>
                              {score}%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              {isPass ? "Competent" : "Needs Review"}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending Grade</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2">
              <Link href="/trainee/assignments">
                <a className="w-full py-2.5 px-4 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/70 text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-primary" />
                  <span>Submit Additional Practical / Continuous Evidence</span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TraineeLayout>
  );
}
