import { useState } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { Download, CheckCircle2, MessageSquare, AlertCircle, Eye, Trash2, X, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { useTrainees, Upload } from "@/contexts/TraineeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadGrading() {
  const { uploads, updateUploadGrade, deleteUpload } = useTrainees();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>("");
  const [tempComment, setTempComment] = useState<string>("");
  const [viewingUpload, setViewingUpload] = useState<Upload | null>(null);

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

  const handleDelete = (upload: Upload) => {
    if (confirm(`Are you sure you want to delete the submission "${upload.filename}" from ${upload.student_name}?`)) {
      deleteUpload(upload.id);
      if (viewingUpload?.id === upload.id) setViewingUpload(null);
      toast.success("Submission document deleted.");
    }
  };

  return (
    <TrainerLayout title="Uploaded Evidence Grading" subtitle="Review, inspect, grade, and manage trainee assignments and practical submissions.">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Trainee Submissions ({uploads.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Recipient view of candidate practical assignments and files</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {uploads.filter(u => u.status === "graded").length} Graded
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {uploads.filter(u => u.status !== "graded").length} Pending
            </span>
          </div>
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
                
                <div className="flex items-center gap-4 text-xs">
                  <button
                    onClick={() => setViewingUpload(upload)}
                    className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
                    title="View submission details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Submission ({upload.filename})</span>
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Submitted: {new Date(upload.submitted_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="md:w-1/3 flex flex-col items-end">
                {editingId === upload.id ? (
                  <div className="w-full space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Score (out of 100)</label>
                      <input 
                        type="number" 
                        value={tempGrade}
                        onChange={(e) => setTempGrade(e.target.value)}
                        className="w-24 px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground"
                        placeholder="e.g. 85"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Trainer Comments</label>
                      <textarea 
                        value={tempComment}
                        onChange={(e) => setTempComment(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm min-h-[60px] bg-background text-foreground"
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
                  <div className="flex items-center gap-3">
                    {upload.status === 'graded' && upload.grade !== null && (
                      <div className="text-right mr-2">
                        <div className="text-2xl font-bold text-green-600">{upload.grade}%</div>
                        {upload.comments && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 justify-end">
                            <MessageSquare className="w-3 h-3" /> 
                            <span className="truncate max-w-[140px]" title={upload.comments}>{upload.comments}</span>
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
                      className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors"
                    >
                      {upload.status === 'graded' ? 'Edit Grade' : 'Enter Grade'}
                    </button>
                    <button
                      onClick={() => handleDelete(upload)}
                      className="p-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors"
                      title="Delete this submission document"
                    >
                      <Trash2 className="w-4 h-4" />
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

      {/* Trainee Submission Document Viewer Modal */}
      <AnimatePresence>
        {viewingUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">{viewingUpload.filename}</h3>
                    <p className="text-xs text-muted-foreground">{viewingUpload.student_name} • {viewingUpload.uploadType}</p>
                  </div>
                </div>
                <button onClick={() => setViewingUpload(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Meta Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Trainee</span>
                    <span className="font-semibold text-foreground">{viewingUpload.student_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Category</span>
                    <span className="font-semibold text-foreground">{viewingUpload.uploadType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Submitted At</span>
                    <span className="font-semibold text-foreground">{new Date(viewingUpload.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current Status</span>
                    <span className={`font-bold ${viewingUpload.status === 'graded' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {viewingUpload.status === 'graded' ? `${viewingUpload.grade}% (Graded)` : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Simulated Document Preview */}
                <div className="border border-border rounded-xl p-5 bg-background font-mono text-[11px] leading-relaxed space-y-3">
                  <div className="border-b border-border pb-2 flex justify-between items-center text-muted-foreground">
                    <span>MUKIRIA TECHNICAL TRAINING INSTITUTE - PRACTICAL ASSIGNMENT SUBMISSION</span>
                    <span>CONFIRMED SECURE</span>
                  </div>
                  <p className="text-foreground">
                    <strong>Submission Title:</strong> {viewingUpload.filename}
                  </p>
                  <p className="text-muted-foreground">
                    Candidate: <strong>{viewingUpload.student_name}</strong> has submitted the required technical evidence and practical task execution files in accordance with the CDACC modular curriculum standards.
                  </p>
                  <div className="p-3 bg-muted/20 rounded border border-border/60">
                    <p className="text-foreground font-sans font-medium">
                      "I hereby certify that this practical assignment reflects my individual technical execution and adherence to institute laboratory safety standards."
                    </p>
                  </div>
                  {viewingUpload.comments && (
                    <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-800 dark:text-emerald-300 font-sans">
                      <strong>Trainer Feedback:</strong> {viewingUpload.comments}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/10">
                <button
                  onClick={() => handleDelete(viewingUpload)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-500/10 border border-red-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Document
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([`MTTI Candidate Evidence: ${viewingUpload.filename}\nCandidate: ${viewingUpload.student_name}\nScore: ${viewingUpload.grade || "Ungraded"}`], { type: 'text/plain' });
                      element.href = URL.createObjectURL(file);
                      element.download = viewingUpload.filename;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold hover:bg-secondary/80 transition border border-border"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => setViewingUpload(null)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TrainerLayout>
  );
}
