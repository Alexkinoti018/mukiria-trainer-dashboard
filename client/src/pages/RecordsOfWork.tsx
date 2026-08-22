import TrainerLayout from "@/components/TrainerLayout";

export default function RecordsOfWork() {
  return (
    <TrainerLayout title="Records of Work" subtitle="Log your completed session deliverables">
      <div className="p-8 bg-card border border-border rounded-xl shadow-sm text-center">
        <h2 className="text-xl font-bold text-muted-foreground">Records of Work Module</h2>
        <p className="mt-2 text-sm text-muted-foreground">This section is currently under construction. It will allow you to automatically sync completed Session Plans into your official Record of Work.</p>
      </div>
    </TrainerLayout>
  );
}
