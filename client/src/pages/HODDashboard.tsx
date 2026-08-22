import HODLayout from "@/components/HODLayout";

export default function HODDashboard() {
  return (
    <HODLayout title="Institution Overview" subtitle="High-level compliance and analytics tracking">
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Overall Compliance</h3>
            <div className="mt-2 text-3xl font-bold">92%</div>
            <p className="text-xs text-green-500 mt-1">+2.1% from last month</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Active Trainers</h3>
            <div className="mt-2 text-3xl font-bold">45</div>
            <p className="text-xs text-muted-foreground mt-1">Across 6 departments</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Reviews</h3>
            <div className="mt-2 text-3xl font-bold">12</div>
            <p className="text-xs text-yellow-500 mt-1">Require attention</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground">Pass Rate</h3>
            <div className="mt-2 text-3xl font-bold">78%</div>
            <p className="text-xs text-green-500 mt-1">+4% from last semester</p>
          </div>
        </div>
      </div>
    </HODLayout>
  );
}
