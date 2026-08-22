import { useState } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { Download, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTrainees } from "@/contexts/TraineeContext";

export default function UploadGrading() {
  const { uploads, updateUploadGrade } = useTrainees();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>("");
  const [tempComment, setTempComment] = useState<string>("");

  const handleSaveGrade = (id: string) => {
    const numGrade = parseInt(tempGrade, 10);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Please enter a valid grade between 0 and 100.");
      return;
    }

    updateUploadGrade(id, numGrade, tempComment);
    setEditingId(null);
    toast.success("Grade saved successfully.");
  };

  return (
    <TrainerLayout title="Uploaded Evidence Grading" subtitle="Review and grade trainee assignments and practical evidence uploads.">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Trainee Submissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Assignments waiting for review</p>
        </div>
        
        <div className="divide-y divide-border">
          {uploads.map(upload => (
            <div key={upload.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/5 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-foreground">{upload.student_name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {upload.uploadType}
                  </span>
                  {upload.status === 'graded' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Graded</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">Pending Review</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
                  <Download className="w-4 h-4" />
                  {upload.filename}
                </div>
                <p className="text-xs text-muted-foreground">Submitted: {new Date(upload.submitted_at).toLocaleString()}</p>
              </div>

              <div className="md:w-1/3">
                {editingId === upload.id ? (
                  <div className="space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Score (out of 100)</label>
                      <input 
                        type="number" 
                        value={tempGrade}
                        onChange={(e) => setTempGrade(e.target.value)}
                        className="w-24 px-3 py-1.5 border border-border rounded-md text-sm"
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Trainer Comments</label>
                      <textarea 
                        value={tempComment}
                        onChange={(e) => setTempComment(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm min-h-[60px]"
                        placeholder="Feedback..."
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => handleSaveGrade(upload.id)}
                        className="flex-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90"
                      >
                        Save Grade
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted/80 border border-border"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-4">
                    {upload.status === 'graded' && upload.grade !== null && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{upload.grade}%</div>
                        {upload.comments && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                            <MessageSquare className="w-3 h-3" /> 
                            <span className="truncate max-w-[150px]">{upload.comments}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setEditingId(upload.id);
                        setTempGrade(upload.grade !== null ? upload.grade.toString() : "");
                        setTempComment(upload.comments || "");
                      }}
                      className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted text-foreground transition-colors"
                    >
                      {upload.status === 'graded' ? 'Edit Grade' : 'Enter Grade'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {uploads.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No trainee submissions found.</p>
            </div>
          )}
        </div>
      </div>
    </TrainerLayout>
  );
}
