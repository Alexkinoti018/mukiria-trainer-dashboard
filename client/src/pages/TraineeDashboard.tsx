import TraineeLayout from "@/components/TraineeLayout";
import { Link } from "wouter";

export default function TraineeDashboard() {
  return (
    <TraineeLayout title="My Dashboard" subtitle="Welcome back, Alex Kinoti">
      <div className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
            <h3 className="text-xl font-bold">Upcoming Exams</h3>
            <p className="text-sm text-muted-foreground">You have 1 pending exam to complete today.</p>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Software Engineering Practice</h4>
                  <p className="text-xs text-muted-foreground mt-1">Level 6 • 100 Marks</p>
                </div>
                <Link href="/trainee/exam">
                  <a className="btn-primary px-4 py-2 text-sm rounded-lg">Start Exam</a>
                </Link>
              </div>
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
