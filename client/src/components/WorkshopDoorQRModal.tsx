import { useState, useEffect } from "react";
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  DoorOpen, 
  ShieldAlert, 
  BookOpen,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface WorkshopDoorQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    id: string;
    unit_code: string;
    unit_name: string;
    class_code: string;
    session_title: string;
    learning_outcomes: string[];
    date?: string;
    time_duration?: string;
    trainer_name?: string;
    venue?: string;
    safety_requirements?: string;
  };
}

export default function WorkshopDoorQRModal({
  isOpen,
  onClose,
  sessionData
}: WorkshopDoorQRModalProps) {
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [posterPdfBase64, setPosterPdfBase64] = useState<string>("");
  const [posterFilename, setPosterFilename] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const studentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/session/${sessionData.id || "current"}`
    : `http://localhost:3000/session/${sessionData.id || "current"}`;

  useEffect(() => {
    if (isOpen) {
      generateQRAndPoster();
    }
  }, [isOpen, sessionData.id]);

  const generateQRAndPoster = async () => {
    setLoading(true);
    try {
      const payload = {
        session_plan_id: sessionData.id || `sp-${Date.now()}`,
        unit_code: sessionData.unit_code || "HBS/OS/COS/BC/01/5/MA",
        unit_name: sessionData.unit_name || "Apply Digital Literacy",
        class_code: sessionData.class_code || "EE6/M/S/24",
        session_title: sessionData.session_title || "Practical Workshop Session",
        date: sessionData.date || new Date().toLocaleDateString("en-GB"),
        time_duration: sessionData.time_duration || "10:30 - 12:30",
        venue: sessionData.venue || "Computer Lab 1 / Workshop",
        trainer_name: sessionData.trainer_name || "Alexander Kinoti",
        department: "Department of Computing and Informatics",
        learning_outcomes: sessionData.learning_outcomes?.length > 0
          ? sessionData.learning_outcomes
          : ["Engage actively in practical skills development according to CDACC curricula."],
        safety_requirements: sessionData.safety_requirements || "Adhere to laboratory electrical safety protocols and workstation ergonomics.",
        target_url: studentUrl
      };

      const resp = await fetch("http://localhost:8000/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (data.success) {
        setQrDataUrl(data.qr_data_url);
        setPosterPdfBase64(data.poster_pdf);
        setPosterFilename(data.filename || `MTTI_Door_Poster_${sessionData.id}.pdf`);
      } else {
        throw new Error(data.error || "Failed to generate QR poster.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`QR Generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPoster = () => {
    if (!posterPdfBase64) {
      toast.error("Poster not generated yet.");
      return;
    }

    try {
      const bytes = Uint8Array.from(atob(posterPdfBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = posterFilename || `MTTI_Workshop_Door_Notice.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Workshop Door Poster PDF downloaded!");
    } catch (err: any) {
      toast.error("Failed to download poster.");
    }
  };

  const handlePrintPoster = () => {
    if (!posterPdfBase64) {
      toast.error("Poster not ready to print.");
      return;
    }

    try {
      const bytes = Uint8Array.from(atob(posterPdfBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url);
      if (printWin) {
        printWin.focus();
      } else {
        toast.info("Pop-up blocked. Triggering direct download instead.");
        handleDownloadPoster();
      }
    } catch (err: any) {
      toast.error("Print preview failed.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopied(true);
    toast.success("Student access link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-card border-2 border-[#000953] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ fontFamily: 'Maiandra GD, sans-serif' }}
      >
        {/* Modal Header */}
        <div className="bg-[#000953] text-white px-6 py-4 flex items-center justify-between border-b border-[#c48820]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c48820]/20 border border-[#c48820]/50 flex items-center justify-center text-[#c48820]">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide">Workshop Door QR Code Poster</h3>
                <span className="bg-[#c48820] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  MTTI/F/CUR/05
                </span>
              </div>
              <p className="text-xs text-white/70">
                Print & stick on your lab door -- Trainees scan to see today's Learning Outcomes
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata Card */}
          <div className="bg-secondary/40 border border-border rounded-xl p-4 text-xs space-y-1">
            <div className="flex justify-between items-center text-muted-foreground font-mono">
              <span>Class: <strong>{sessionData.class_code || "EE6/M/S/24"}</strong></span>
              <span>Time: <strong>{sessionData.time_duration || "10:30 - 12:30"}</strong></span>
            </div>
            <h4 className="text-sm font-bold text-[#000953] dark:text-[#f8fafc]">
              {sessionData.session_title || "Practical Laboratory Session"}
            </h4>
            <p className="text-muted-foreground text-[11px]">
              Unit: <strong>{sessionData.unit_code}</strong> -- {sessionData.unit_name}
            </p>
          </div>

          {/* QR Code and Poster Preview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: QR Display Frame */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 border-[#000953] shadow-md text-black text-center">
              <span className="text-[10px] font-bold text-[#c48820] uppercase tracking-wider mb-2">
                Scan with Smartphone Camera
              </span>
              
              <div className="relative p-2 bg-white rounded-lg border-2 border-dashed border-[#000953]/30">
                {loading ? (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                    <QrCode className="w-12 h-12 text-[#000953] mb-2 animate-spin" />
                    <span className="text-xs font-semibold">Generating QR Code...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Workshop Door QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-muted-foreground text-xs">
                    No QR Generated
                  </div>
                )}
              </div>

              <p className="text-[11px] font-bold text-[#000953] mt-3">
                {sessionData.id || "Current Session"}
              </p>
              <p className="text-[10px] text-gray-500 max-w-[200px] truncate mt-0.5">
                {studentUrl}
              </p>
            </div>

            {/* Right: Outcomes & Feature Highlights */}
            <div className="space-y-4">
              <div className="border border-[#000953]/20 bg-[#000953]/5 dark:bg-[#000953]/20 rounded-xl p-4">
                <h5 className="text-xs font-bold text-[#000953] dark:text-[#f8fafc] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-[#c48820]" />
                  What Students See on Scan:
                </h5>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  {sessionData.learning_outcomes?.slice(0, 3).map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#c48820] font-bold">•</span>
                      <span className="text-foreground font-medium">{outcome}</span>
                    </li>
                  ))}
                  {(!sessionData.learning_outcomes || sessionData.learning_outcomes.length === 0) && (
                    <li className="italic text-muted-foreground">Master core unit practical objectives.</li>
                  )}
                </ul>
              </div>

              <div className="border border-amber-500/20 bg-amber-500/10 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-700 dark:text-amber-400">Workshop Door Poster Included</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    Generates a formal A4 MTTI notice poster complete with safety regulations, unit details, and high-resolution vector QR code.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPoster}
                    disabled={loading || !posterPdfBase64}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000953] hover:bg-[#000953]/90 text-white rounded-xl text-xs font-bold transition shadow-sm border border-[#c48820]/40 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-[#c48820]" />
                    Download Door Poster (PDF)
                  </button>
                  <button
                    onClick={handlePrintPoster}
                    disabled={loading || !posterPdfBase64}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-xs font-bold transition border border-border"
                    title="Print directly"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border hover:bg-secondary/30 rounded-lg text-xs font-semibold transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Link Copied!" : "Copy Student Link"}
                  </button>
                  <a
                    href={`/session/${sessionData.id || "sp-1"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground transition"
                    title="Preview student view in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
