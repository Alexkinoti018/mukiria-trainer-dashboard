import TraineeLayout from "@/components/TraineeLayout";
import { Link } from "wouter";

export default function TraineeDashboard() {
  return (
    <TraineeLayout title="My Dashboard" subtitle="Welcome back, Alex Kinoti">
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Upcoming Online Exams</h3>
                <p className="text-sm text-muted-foreground">3 active examinations available for your class.</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                ACTIVE SERIES
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  code: "061155101A-WA1",
                  title: "Digital Literacy — Written Assessment 1",
                  subtitle: "Core Procedures & Office Productivity",
                  marks: 70,
                  mins: 120,
                  level: "Level 5/6",
                },
                {
                  code: "061155101A-WA2",
                  title: "Digital Literacy — Written Assessment 2",
                  subtitle: "Computer Systems, Architecture & OS",
                  marks: 70,
                  mins: 120,
                  level: "Level 5/6",
                },
                {
                  code: "061155101A-WA3",
                  title: "Digital Literacy — Written Assessment 3",
                  subtitle: "Networks, Collaboration & Digital Labor",
                  marks: 70,
                  mins: 120,
                  level: "Level 5/6",
                },
              ].map((ex) => (
                <div key={ex.code} className="p-4 bg-muted/40 hover:bg-muted/70 transition-all rounded-lg border border-border flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-500">{ex.code}</span>
                      <span className="text-[11px] text-muted-foreground">• {ex.level} • {ex.marks} Marks • {ex.mins} Mins</span>
                    </div>
                    <h4 className="font-semibold text-sm truncate mt-0.5">{ex.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{ex.subtitle}</p>
                  </div>
                  <Link href={`/trainee/exam?unitCode=${ex.code}`}>
                    <a className="btn-primary px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm">
                      Start Exam
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <h3 className="text-xl font-bold">Recent Results</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                <div>
                  <h4 className="font-medium text-sm">Database Systems</h4>
                  <p className="text-xs text-muted-foreground">Graded 2 days ago</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-500">85%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Pass</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                <div>
                  <h4 className="font-medium text-sm">Networking Basics</h4>
                  <p className="text-xs text-muted-foreground">Graded 1 week ago</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-500">92%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Distinction</div>
                </div>
              </div>
            </div>
            <Link href="/trainee/results">
              <a className="text-sm text-primary hover:underline font-medium inline-block mt-2">View All Results &rarr;</a>
            </Link>
          </div>

        </div>
      </div>
    </TraineeLayout>
  );
}
