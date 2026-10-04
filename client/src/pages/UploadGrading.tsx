import { useState } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { 
  Download, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Eye, 
  Trash2, 
  X, 
  FileText, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  ExternalLink, 
  Award, 
  ShieldCheck, 
  FileArchive,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useTrainees, Upload } from "@/contexts/TraineeContext";
import { 
  getEvidenceViewUrl, 
  downloadEvidenceFile, 
  getMimeType 
} from "@/lib/evidenceStorage";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadGrading() {
  const { uploads, updateUploadGrade, verifyUpload, awardUploadMark, deleteUpload } = useTrainees();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempGrade, setTempGrade] = useState<string>("");
  const [tempComment, setTempComment] = useState<string>("");

  // In-modal viewing and grading state
  const [viewingUploadId, setViewingUploadId] = useState<string | null>(null);
  const [modalScore, setModalScore] = useState<string>("");
  const [modalComments, setModalComments] = useState<string>("");
  const [modalTaskCode, setModalTaskCode] = useState<string>("CP1");
  const [imageZoom, setImageZoom] = useState<number>(1);

  // Active upload resolved from latest state
  const viewingUpload = viewingUploadId 
    ? uploads.find(u => u.id === viewingUploadId) || null 
    : null;

  const handleOpenModal = (upload: Upload) => {
    setViewingUploadId(upload.id);
    setModalScore(upload.grade !== null ? String(upload.grade) : "");
    setModalComments(upload.comments || "");
    const derivedTaskCode = upload.task_code || (() => {
      const type = upload.uploadType || "";
      if (type.includes("Practical 2")) return "CP2";
      if (type.includes("Practical 3")) return "CP3";
      if (type.includes("Practical")) return "CP1";
      if (type.includes("Exam 2") || type.includes("CAT 2") || type.includes("Assignment 2")) return "CT2";
      if (type.includes("Exam 3")) return "CT3";
      if (type.includes("Exam") || type.includes("CAT") || type.includes("Assignment")) return "CT1";
      return "CP1";
    })();
    setModalTaskCode(derivedTaskCode);
    setImageZoom(1);
  };

  const handleInlineSaveGrade = (id: string) => {
    const numGrade = parseInt(tempGrade, 10);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Please enter a valid grade between 0 and 100.");
      return;
    }

    updateUploadGrade(id, numGrade, tempComment);
    setEditingId(null);
  };

  const handleModalSaveGrade = (upload: Upload) => {
    const numGrade = parseInt(modalScore, 10);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Please enter a valid score between 0 and 100.");
      return;
    }

    awardUploadMark(upload.id, {
      grade: numGrade,
      comments: modalComments,
      taskCode: modalTaskCode,
      unitOfferingId: upload.unit_offering_id || "uo_1",
      trainerName: "Alexander Kinoti"
    });
  };

  const handleVerifyOnly = (upload: Upload) => {
    verifyUpload(upload.id, "Alexander Kinoti");
  };

  const handleDelete = (upload: Upload) => {
    if (confirm(`Are you sure you want to delete the submission "${upload.filename}" from ${upload.student_name}?`)) {
      const deleted = deleteUpload(upload.id, "trainer");
      if (deleted) {
        if (viewingUploadId === upload.id) setViewingUploadId(null);
        toast.success("Submission document deleted.");
      }
    }
  };

  return (
    <TrainerLayout 
      title="Uploaded Evidence Grading" 
      subtitle="Review, inspect, verify, grade, and synchronize trainee practical and theory submissions."
    >
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Trainee Assessment Evidence ({uploads.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              TVET CDACC continuous assessment practical observations and project files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {uploads.filter(u => u.status === "graded").length} Graded
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
              {uploads.filter(u => u.verified_by_trainer).length} Verified
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {uploads.filter(u => u.status !== "graded").length} Pending
            </span>
          </div>
        </div>
        
        <div className="divide-y divide-border">
          {uploads.map(upload => (
            <div 
              key={upload.id} 
              className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/5 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-foreground">{upload.student_name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {upload.task_code || upload.uploadType}
                  </span>
                  {upload.verified_by_trainer ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                      Pending Verification
                    </span>
                  )}
                  {upload.status === "graded" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                      Graded ({upload.grade}%)
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs flex-wrap">
                  <button
                    onClick={() => handleOpenModal(upload)}
                    className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
                    title="View, verify, and grade document in viewer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Document ({upload.filename})</span>
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    Submitted: {new Date(upload.submitted_at).toLocaleString()}
                  </span>
                  {upload.file_size && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Size: {(upload.file_size / 1024).toFixed(1)} KB
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="md:w-1/3 flex flex-col items-end">
                {editingId === upload.id ? (
                  <div className="w-full space-y-3 bg-muted/20 p-4 rounded-lg border border-border">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Score (out of 100)
                      </label>
                      <input 
                        type="number" 
                        value={tempGrade}
                        onChange={(e) => setTempGrade(e.target.value)}
                        className="w-24 px-3 py-1.5 border border-border rounded-md text-sm bg-background text-foreground"
                        placeholder="e.g. 85"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Trainer Comments
                      </label>
                      <textarea 
                        value={tempComment}
                        onChange={(e) => setTempComment(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md text-sm min-h-[60px] bg-background text-foreground"
                        placeholder="Feedback..."
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button 
                        onClick={() => handleInlineSaveGrade(upload.id)}
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
                    {upload.status === "graded" && upload.grade !== null && (
                      <div className="text-right mr-2">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {upload.grade}%
                        </div>
                        {upload.comments && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 justify-end">
                            <MessageSquare className="w-3 h-3" /> 
                            <span className="truncate max-w-[140px]" title={upload.comments}>
                              {upload.comments}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => handleOpenModal(upload)}
                      className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review & Grade
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

      {/* Trainee Submission Real Document Viewer & In-Modal Grading Modal */}
      <AnimatePresence>
        {viewingUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {viewingUpload.filename}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                        {viewingUpload.task_code || viewingUpload.uploadType}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Candidate: <span className="font-semibold text-foreground">{viewingUpload.student_name}</span> • Submitted: {new Date(viewingUpload.submitted_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingUploadId(null)} 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Split-pane side-by-side layout */}
              <div className="p-6 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Real Document Viewer (Span 7/12) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        Live Document Evidence Viewer
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {viewingUpload.mime_type || getMimeType(viewingUpload.filename)}
                      </span>
                    </div>

                    {(() => {
                      const viewUrl = getEvidenceViewUrl(viewingUpload) || `/api/evidence/${viewingUpload.id}/file`;
                      const mime = viewingUpload.mime_type || getMimeType(viewingUpload.filename);
                      const isPdf = mime === "application/pdf" || viewingUpload.filename.toLowerCase().endsWith(".pdf");
                      const isImage = mime.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif)$/i.test(viewingUpload.filename);

                      if (isPdf) {
                        return (
                          <div className="w-full flex flex-col items-center">
                            <div className="w-full h-[550px] rounded-xl overflow-hidden border border-border bg-slate-900/5 shadow-inner relative">
                              <object
                                data={viewUrl}
                                type="application/pdf"
                                className="w-full h-full rounded-xl"
                              >
                                <iframe
                                  src={viewUrl}
                                  title={viewingUpload.filename}
                                  className="w-full h-full border-none"
                                >
                                  <p className="p-6 text-center text-sm text-muted-foreground">
                                    Your browser does not support inline PDF preview. Please click below to open.
                                  </p>
                                </iframe>
                              </object>
                            </div>
                            <div className="mt-2.5 text-xs text-muted-foreground flex items-center justify-between w-full">
                              <span>TVET CDACC Verified Document Stream</span>
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <span>Open in New Tab</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      }

                      if (isImage) {
                        return (
                          <div className="w-full flex flex-col items-center">
                            <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-muted/40 rounded-lg border border-border text-xs">
                              <span className="font-semibold text-muted-foreground">Practical Observation Image</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setImageZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                                  className="p-1 hover:bg-muted rounded text-foreground transition"
                                  title="Zoom Out"
                                >
                                  <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="font-mono font-bold w-12 text-center text-foreground">{Math.round(imageZoom * 100)}%</span>
                                <button
                                  type="button"
                                  onClick={() => setImageZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
                                  className="p-1 hover:bg-muted rounded text-foreground transition"
                                  title="Zoom In"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setImageZoom(1)}
                                  className="px-2 py-0.5 text-[11px] font-semibold hover:bg-muted rounded border border-border text-foreground transition"
                                >
                                  Fit / 100%
                                </button>
                              </div>
                            </div>
                            <div className="w-full h-[510px] overflow-auto rounded-xl border border-border bg-slate-950 flex items-center justify-center p-4">
                              <img
                                src={viewUrl}
                                alt={viewingUpload.filename}
                                style={{ transform: `scale(${imageZoom})`, transformOrigin: "center center", transition: "transform 0.15s ease-out" }}
                                className="max-w-full max-h-full object-contain rounded shadow-lg"
                              />
                            </div>
                          </div>
                        );
                      }

                      // Fallback for docx / archives / unsupported formats
                      return (
                        <div className="p-8 border border-border rounded-xl bg-muted/15 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            {viewingUpload.filename.endsWith(".zip") ? (
                              <FileArchive className="w-8 h-8" />
                            ) : (
                              <FileText className="w-8 h-8" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-base text-foreground">{viewingUpload.filename}</h4>
                            <p className="text-xs text-muted-foreground">
                              Binary Document Archive • {viewingUpload.file_size ? `${(viewingUpload.file_size / 1024).toFixed(1)} KB` : "Document File"}
                            </p>
                          </div>
                          <div className="w-full max-w-sm p-3 rounded-lg bg-background border border-border text-xs text-left text-muted-foreground space-y-1.5">
                            <div className="flex justify-between">
                              <span className="font-medium text-foreground">File Format:</span>
                              <span className="font-mono text-[11px]">{mime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-foreground">Candidate:</span>
                              <span className="font-semibold text-foreground">{viewingUpload.student_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium text-foreground">Uploaded At:</span>
                              <span>{new Date(viewingUpload.submitted_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadEvidenceFile(viewingUpload)}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:opacity-90 transition flex items-center gap-2 shadow"
                          >
                            <Download className="w-4 h-4" />
                            Download & Inspect Original File
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right Column: In-Modal Grading Panel (Span 5/12) */}
                  <div className="lg:col-span-5 space-y-4 bg-muted/20 p-5 rounded-2xl border border-border">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-primary" />
                          Continuous Assessment Grading Panel
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Direct synchronization into TVET Marksheet
                        </p>
                      </div>

                      {/* Evidence Status Badge */}
                      <div>
                        {viewingUpload.verified_by_trainer ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Summary Pill */}
                    <div className="p-3 bg-background rounded-xl border border-border space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Candidate:</span>
                        <span className="font-bold text-foreground">{viewingUpload.student_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Task Category:</span>
                        <span className="font-semibold text-primary">{viewingUpload.uploadType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Recorded Mark:</span>
                        <span className="font-bold text-foreground">
                          {viewingUpload.grade !== null ? `${viewingUpload.grade}% (Graded)` : "Ungraded"}
                        </span>
                      </div>
                    </div>

                    {/* Verification Toggle Button */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Verification Status:
                      </label>
                      <button
                        type="button"
                        onClick={() => handleVerifyOnly(viewingUpload)}
                        className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                          viewingUpload.verified_by_trainer 
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20" 
                            : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {viewingUpload.verified_by_trainer ? "Evidence Confirmed Verified (Click to Re-verify)" : "Verify Evidence"}
                      </button>
                    </div>

                    {/* Task Code Selection */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Continuous Assessment Task Code:
                      </label>
                      <select
                        value={modalTaskCode}
                        onChange={(e) => setModalTaskCode(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="CP1">CP1 — Continuous Practical Task 1</option>
                        <option value="CP2">CP2 — Continuous Practical Task 2</option>
                        <option value="CP3">CP3 — Continuous Practical Task 3</option>
                        <option value="CT1">CT1 — Continuous Theory Assessment 1</option>
                        <option value="CT2">CT2 — Continuous Theory Assessment 2</option>
                        <option value="CT3">CT3 — Continuous Theory Assessment 3</option>
                      </select>
                    </div>

                    {/* Mark Input Field */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Score for {viewingUpload.uploadType} / {modalTaskCode} (0–100):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={modalScore}
                          onChange={(e) => setModalScore(e.target.value)}
                          placeholder="e.g. 88"
                          min="0"
                          max="100"
                          className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                        />
                        <span className="text-base font-bold text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Trainer Feedback / Remarks */}
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Trainer Feedback / Remarks:
                      </label>
                      <textarea
                        value={modalComments}
                        onChange={(e) => setModalComments(e.target.value)}
                        placeholder="Provide formative feedback for the candidate..."
                        className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-foreground text-xs min-h-[85px] focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    {/* Action Button: Verify & Save Marks */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleModalSaveGrade(viewingUpload)}
                        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md"
                      >
                        <Award className="w-4 h-4" />
                        Verify & Save Marks
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/10">
                <button
                  type="button"
                  onClick={() => handleDelete(viewingUpload)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-500/10 border border-red-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Document
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadEvidenceFile(viewingUpload)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-bold hover:bg-secondary/80 transition border border-border shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingUploadId(null)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition"
                  >
                    Done
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
