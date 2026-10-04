import React, { useState, useRef } from "react";
import TraineeLayout from "@/components/TraineeLayout";
import { useTrainees, Upload } from "@/contexts/TraineeContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  uploadEvidenceFile, 
  downloadEvidenceFile, 
  getEvidenceViewUrl, 
  getMimeType 
} from "@/lib/evidenceStorage";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Download, 
  Eye, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  X,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function TraineeAssignments() {
  const { uploads, recordUpload, deleteUpload } = useTrainees();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authenticated trainee identifier resolution
  const currentTraineeId = user?.id || "tr_it6_01";
  const currentTraineeName = user?.name || "Nthiga Gakii Doris";

  const [selectedUploadType, setSelectedUploadType] = useState<string>("Practical 1");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewingUpload, setViewingUpload] = useState<Upload | null>(null);

  // Filter uploads belonging to this trainee (or default institutional demo trainee)
  const myUploads = uploads.filter(
    (up) =>
      up.traineeId === currentTraineeId ||
      up.student_name.toLowerCase() === currentTraineeName.toLowerCase() ||
      (!user && (up.traineeId === "tr_it6_01" || up.traineeId === "tr_1"))
  );

  const getTaskCode = (type: string): string => {
    switch (type) {
      case "Practical 1": return "CP1";
      case "Practical 2": return "CP2";
      case "Practical 3": return "CP3";
      case "Assignment": return "CT1";
      case "CAT": return "CT2";
      case "Exam 1": return "CT1";
      case "Exam 2": return "CT2";
      case "Exam 3": return "CT3";
      default: return "CP1";
    }
  };

  const handleProcessFile = async (file: File) => {
    setIsUploading(true);
    try {
      const taskCode = getTaskCode(selectedUploadType);
      const evidence = await uploadEvidenceFile(file, {
        traineeId: currentTraineeId,
        taskCode: taskCode,
        unitOfferingId: "uo_1",
      });

      recordUpload({
        traineeId: currentTraineeId,
        student_name: currentTraineeName,
        filename: evidence.filename,
        uploadType: selectedUploadType,
        task_code: taskCode,
        unit_offering_id: "uo_1",
        unit_code: "IT/CU/ICTA/CR/01/6/MA",
        file_url: evidence.fileUrl,
        file_data: evidence.fileData,
        mime_type: evidence.mimeType,
        file_size: evidence.fileSize,
      });

      toast.success(`"${file.name}" uploaded successfully as ${taskCode} evidence!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to process and store file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = (upload: Upload) => {
    if (upload.verified_by_trainer || upload.status === "graded") {
      toast.error("Verified or graded evidence cannot be deleted by candidates.");
      return;
    }
    if (confirm(`Remove your unverified submission "${upload.filename}"?`)) {
      deleteUpload(upload.id, "trainee");
      if (viewingUpload?.id === upload.id) setViewingUpload(null);
      toast.success("Submission removed.");
    }
  };

  return (
    <TraineeLayout 
      title="Assignments & Assessment Evidence" 
      subtitle="Submit, review, and track your practical observations, lab reports, and assignments."
    >
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        {/* Upload Form Card */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Submit Assessment Evidence
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              TVET CDACC
            </span>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-foreground mb-2">
              Select Assessment Task Type:
            </label>
            <select 
              value={selectedUploadType}
              onChange={(e) => setSelectedUploadType(e.target.value)}
              className="w-full p-2.5 border border-border rounded-xl bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="Practical 1">Practical 1 (CP1 — Laboratory Observation)</option>
              <option value="Practical 2">Practical 2 (CP2 — System Hardware Diagnostics)</option>
              <option value="Practical 3">Practical 3 (CP3 — Network Infrastructure Setup)</option>
              <option value="Assignment">Assignment (CT1 — Written Theory Assignment)</option>
              <option value="CAT">CAT (CT2 — Continuous Assessment Test)</option>
              <option value="Exam 1">Exam 1 (CT1 — Modular Exam Draft)</option>
              <option value="Other">Other Technical Evidence</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Mapped Assessment Code: <span className="font-bold text-primary">{getTaskCode(selectedUploadType)}</span>
            </p>
          </div>

          {/* Interactive Drag & Drop Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.doc,.zip" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <UploadCloud className={`w-6 h-6 ${isUploading ? "animate-bounce" : ""}`} />
            </div>

            <h3 className="text-sm font-bold text-foreground">
              {isUploading ? "Uploading & Storing Binary Evidence..." : `Drop your ${selectedUploadType} document here`}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, PNG, JPG, Word (.docx), or ZIP (Max 25MB)
            </p>

            <button
              type="button"
              disabled={isUploading}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition shadow-sm"
            >
              Browse Files from Computer
            </button>
          </div>

          <div className="p-3.5 bg-muted/20 rounded-xl border border-border text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground block mb-0.5">Integrity Notice:</span>
            Submissions are permanently logged in the institutional assessment register. Once verified by your trainer, files cannot be altered or deleted.
          </div>
        </div>

        {/* Recent Submissions List */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              My Submissions ({myUploads.length})
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              Candidate: <span className="font-semibold text-foreground">{currentTraineeName}</span>
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[580px] pr-1">
            {myUploads.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-sm font-semibold">No submissions recorded yet.</p>
                <p className="text-xs mt-1">Upload your practical reports or assignments to begin.</p>
              </div>
            ) : (
              myUploads.map((upload) => (
                <div 
                  key={upload.id} 
                  className="p-4 border border-border rounded-xl bg-background hover:bg-muted/10 transition space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          {upload.task_code || upload.uploadType}
                        </span>
                        <h4 className="font-bold text-sm text-foreground leading-tight">
                          {upload.filename}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(upload.submitted_at).toLocaleString()}
                        {upload.file_size && ` • ${(upload.file_size / 1024).toFixed(1)} KB`}
                      </p>
                    </div>

                    {/* Status & Grade Badges */}
                    <div className="flex flex-col items-end gap-1">
                      {upload.status === "graded" && upload.grade !== null ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs font-bold rounded-lg border border-green-200 dark:border-green-800">
                          Score: {upload.grade}%
                        </span>
                      ) : upload.verified_by_trainer ? (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs font-medium rounded-lg border border-yellow-200 dark:border-yellow-800">
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {upload.comments && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">Trainer Feedback:</span> {upload.comments}
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingUpload(upload)}
                        className="flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        onClick={() => downloadEvidenceFile(upload)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>

                    <div>
                      {upload.verified_by_trainer || upload.status === "graded" ? (
                        <span 
                          className="flex items-center gap-1 text-muted-foreground text-[11px] cursor-not-allowed opacity-75"
                          title="Verified submissions cannot be deleted by candidates"
                        >
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDelete(upload)}
                          className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trainee Document Preview Modal */}
      <AnimatePresence>
        {viewingUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{viewingUpload.filename}</h3>
                    <p className="text-xs text-muted-foreground">{viewingUpload.uploadType} • {viewingUpload.task_code || "CP1"}</p>
                  </div>
                </div>
                <button onClick={() => setViewingUpload(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {(() => {
                  const viewUrl = getEvidenceViewUrl(viewingUpload);
                  const mime = viewingUpload.mime_type || getMimeType(viewingUpload.filename);
                  const isPdf = mime === "application/pdf" || viewingUpload.filename.toLowerCase().endsWith(".pdf");
                  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif)$/i.test(viewingUpload.filename);

                  if (isPdf) {
                    return (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full h-[460px] rounded-xl overflow-hidden border border-border bg-slate-900/5">
                          <object data={viewUrl} type="application/pdf" className="w-full h-full">
                            <iframe src={viewUrl} title={viewingUpload.filename} className="w-full h-full border-none">
                              <p className="p-4 text-center text-xs text-muted-foreground">Unable to preview PDF directly.</p>
                            </iframe>
                          </object>
                        </div>
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Open PDF in new tab</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  }

                  if (isImage) {
                    return (
                      <div className="w-full h-[440px] overflow-auto rounded-xl border border-border bg-slate-950 flex items-center justify-center p-4">
                        <img src={viewUrl} alt={viewingUpload.filename} className="max-w-full max-h-full object-contain rounded" />
                      </div>
                    );
                  }

                  return (
                    <div className="p-8 border border-border rounded-xl bg-muted/10 text-center space-y-3">
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                      <h4 className="font-bold text-sm text-foreground">{viewingUpload.filename}</h4>
                      <p className="text-xs text-muted-foreground">Binary document file ready for inspection</p>
                      <button
                        onClick={() => downloadEvidenceFile(viewingUpload)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                      >
                        Download Original File
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/10">
                <button
                  onClick={() => downloadEvidenceFile(viewingUpload)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold border border-border"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </button>
                <button
                  onClick={() => setViewingUpload(null)}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </TraineeLayout>
  );
}
