import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Award, 
  PenTool, 
  Eye, 
  Save, 
  RotateCcw,
  Sparkles,
  FileCheck,
  User,
  Sliders,
  Check,
  Camera,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { useTrainees } from "@/contexts/TraineeContext";

export interface ObservationItem {
  id: number;
  task: string;
  scoringGuide: string;
  marksAvailable: number;
  marksObtained: number;
  comments: string;
}

export interface PracticalRubricPreset {
  id: string;
  name: string;
  qualificationCode: string;
  unitCode: string;
  unitTitle: string;
  series: string;
  classCode: string;
  venue: string;
  date: string;
  defaultCandidate: string;
  defaultRegNo: string;
  assessorName: string;
  assessorSignature: string;
  defaultFeedback: string;
  paperPages: number;
  items: ObservationItem[];
}

// ─────────────────────────────────────────────────────────────
// PRESET 1: Newly Attached 3-Page Practical Exam (Mukiria TTI / TVET CDACC)
// Unit: PERFORM COMPUTER REPAIR AND MAINTENANCE (ICT/CU/IT/CR/6/6)
// Candidate: LUCKYSUSAN KIANJIRU MUGO | Reg: 10525 | Venue: JITUME LAB | Date: 13/11/2024
// ─────────────────────────────────────────────────────────────
export const REPAIR_MAINTENANCE_PRESET: PracticalRubricPreset = {
  id: "repair_maintenance",
  name: "Computer Repair & Maintenance (3 Tasks, 50 Mks) [Jitume Lab]",
  qualificationCode: "061006T4ICT - ICT TECHNICIAN LEVEL 6",
  unitCode: "ICT/CU/IT/CR/6/6",
  unitTitle: "PERFORM COMPUTER REPAIR AND MAINTENANCE",
  series: "SEPTEMBER-DECEMBER 2024 SERIES",
  classCode: "ITECH6/S/24",
  venue: "JITUME LAB",
  date: "13/11/2024",
  defaultCandidate: "LUCKYSUSAN KIANJIRU MUGO",
  defaultRegNo: "10525",
  assessorName: "Trainer / Assessor",
  assessorSignature: "For pk",
  defaultFeedback: "V. Good.",
  paperPages: 3,
  items: [
    {
      id: 1,
      task: "Task 1: System Monitoring and Troubleshooting\n\ni. Award 10 marks for navigation to Processes and recording real-time resource usage analysis.\nii. Award 10 marks for navigation to Performance and identification of features of CPU, RAM Memory, Ethernet and GPU.",
      scoringGuide: "Award 25 marks: Processes analysis (10), Hardware performance specs (10), Resource troubleshooting (5)",
      marksAvailable: 25,
      marksObtained: 24,
      comments: "Navigated Task Manager processes and performance metrics accurately. Identified CPU & memory utilization levels."
    },
    {
      id: 2,
      task: "Task 2: Network Diagnostics and Optimization\n\ni. Award 5 marks for effective use of network diagnostic tools (Network Trouble-shooter).\nii. Award 5 marks for correct configuration of network adapter settings.",
      scoringGuide: "Award 10 marks: Network troubleshooter diagnosis (5), Adapter IPv4/IPv6 configuration (5)",
      marksAvailable: 10,
      marksObtained: 8,
      comments: "Ran Network Trouble-shooter tool and verified adapter IP configurations correctly."
    },
    {
      id: 3,
      task: "Task 3: System settings, Configuration and Maintenance\n\n• Defined the function of the commands:\n  Award 1 marks for correct identification of the function of the commands (5 commands)\n• Ran the commands:\n  Award 9 marks for running at least 5 commands successfully (e.g. sfc, chkdsk, ipconfig, netstat, dism).",
      scoringGuide: "Award 15 marks: Command functions defined (6), 5 system maintenance commands executed (9)",
      marksAvailable: 15,
      marksObtained: 14,
      comments: "Defined commands accurately and executed sfc /scannow, chkdsk, and ipconfig successfully."
    }
  ]
};

// ─────────────────────────────────────────────────────────────
// PRESET 2: Attached 4-Page Practical Exam (TVET CDACC)
// Unit: PERFORM COMPUTER NETWORKING (ICT/OS/IT/CR/1/6)
// Candidate: Harriet Mwendwa | Reg: 10525 | Venue: Computer Lab | Date: 20/6/2024
// ─────────────────────────────────────────────────────────────
export const NETWORKING_PRESET: PracticalRubricPreset = {
  id: "networking",
  name: "Computer Networking (12 Tasks, 50 Mks) [Network Lab]",
  qualificationCode: "061006T4ICT - ICT TECHNICIAN LEVEL 6",
  unitCode: "ICT/OS/IT/CR/1/6",
  unitTitle: "PERFORM COMPUTER NETWORKING",
  series: "NOV/DEC 2023 / 2026",
  classCode: "ITECH6/MOD/2026",
  venue: "Computer Lab",
  date: "20/6/2024",
  defaultCandidate: "Harriet Mwendwa",
  defaultRegNo: "10525",
  assessorName: "MR Muthomi",
  assessorSignature: "MR Muthomi",
  defaultFeedback: "Keep up",
  paperPages: 4,
  items: [
    {
      id: 1,
      task: "Prepared straight through cable termination",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 3,
      comments: "Terminated T568B accurately. Cable tester passed all 8 pins."
    },
    {
      id: 2,
      task: "Assembled end devices properly",
      scoringGuide: "(Award 6marks or zero=6)",
      marksAvailable: 6,
      marksObtained: 4,
      comments: "Connected workstation NIC and power cords properly."
    },
    {
      id: 3,
      task: "Connected devices via the switch",
      scoringGuide: "(Award 4 marks or zero 4)",
      marksAvailable: 4,
      marksObtained: 2,
      comments: "Linked patch cord to FastEthernet switch ports; port LEDs active."
    },
    {
      id: 4,
      task: "Assigned devices proper IP address",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 3,
      comments: "Configured static IPv4 address within assigned 192.168.66.0/24 subnet."
    },
    {
      id: 5,
      task: "Checked the physical connection from the router to the switch, port used eg gigabit Ethernet port",
      scoringGuide: "(Award 5 marks or zero)",
      marksAvailable: 5,
      marksObtained: 4,
      comments: "GigabitEthernet 0/0/0 uplink connected correctly."
    },
    {
      id: 6,
      task: "Checked the gateway IP address allocated",
      scoringGuide: "(Award 3 marks or zero)",
      marksAvailable: 3,
      marksObtained: 2,
      comments: "Verified default gateway 192.168.66.1 on host settings."
    },
    {
      id: 7,
      task: "Checked the network IP pool created. Assign a default gateway and DNS address provided etc.",
      scoringGuide: "(Award 5 marks or zero)",
      marksAvailable: 5,
      marksObtained: 4,
      comments: "DHCP pool correctly defined with gateway and DNS addresses."
    },
    {
      id: 8,
      task: "Ensured to have the end device IP allocation set to static and not dynamic as was previously",
      scoringGuide: "(Award 3 marks or zero)",
      marksAvailable: 3,
      marksObtained: 2,
      comments: "Switched configuration from DHCP to static without IP conflict."
    },
    {
      id: 9,
      task: "Checked devices to see that they have the default gateway 192.168.66.1 familiar to the one similar to the router",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 3,
      comments: "Verified routing reachability to gateway router."
    },
    {
      id: 10,
      task: "Tested connection between PC1 and PC2 using ping",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 3,
      comments: "0% packet loss on 4 consecutive ICMP packets."
    },
    {
      id: 11,
      task: "Set a password to the router to prevent unauthorized access",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 3,
      comments: "Configured enable secret and console password."
    },
    {
      id: 12,
      task: "Tested connectivity to the internet by pinging the gateway IP address from any of the device. The web browser installed on the computer can as well be used in the places of pinging",
      scoringGuide: "(Award 4 marks or zero)",
      marksAvailable: 4,
      marksObtained: 4,
      comments: "Successful external DNS resolution and web browser test."
    }
  ]
};

// ─────────────────────────────────────────────────────────────
// PRESET 3: Newly Attached 7-Page Practical Exam (Mukiria TTI / TVET CDACC)
// Unit: PERFORM COMPUTER ESSENTIALS (IT/CU/ICTA/CR/01/4/MA)
// Qualification: 06104ICTMA - ICT 4 / ICT TECHNICIAN LEVEL 5 & 6
// Cohort: ICT4/ITECH6/S/26 MOD 1 | Date: 15/10/2026 | Assessor: Alexander Kinoti
// ─────────────────────────────────────────────────────────────
export const COMPUTER_ESSENTIALS_PRESET: PracticalRubricPreset = {
  id: "computer_essentials",
  name: "Computer Essentials (3 Practical Sessions + Orals, 100 Mks) [ICT Lab]",
  qualificationCode: "06104ICTMA - ICT 4 / ICT TECHNICIAN LEVEL 5 & 6",
  unitCode: "IT/CU/ICTA/CR/01/4/MA",
  unitTitle: "PERFORM COMPUTER ESSENTIALS",
  series: "SEPTEMBER-DECEMBER 2026 SERIES",
  classCode: "ICT4/ITECH6/S/26 MOD 1",
  venue: "ICT LAB",
  date: "15/10/2026",
  defaultCandidate: "Wanjau Alvin Gatere",
  defaultRegNo: "14076/S2026",
  assessorName: "Alexander Kinoti",
  assessorSignature: "A. Kinoti",
  defaultFeedback: "Competent. Excellent hardware identification, desktop environment customization, and software installation.",
  paperPages: 7,
  items: [
    {
      id: 1,
      task: "Practical 1 (a-c): Manage Computer Devices — Correctly identified five external ports, opened system unit & located CMOS battery, verified driver installation.",
      scoringGuide: "Award 21 marks: 5 external ports (10), CMOS battery location (5), Driver verification (6)",
      marksAvailable: 21,
      marksObtained: 20,
      comments: "Accurately identified external ports, opened system chassis safely, and verified input drivers."
    },
    {
      id: 2,
      task: "Practical 1 (d-f): Device Management & Safety — Opened Device Manager & saved screenshot, safely disconnected/reconnected monitor, performed menu restart.",
      scoringGuide: "Award 14 marks: Device Manager screenshot (5), Monitor disconnect/reconnect (6), Start restart (3)",
      marksAvailable: 14,
      marksObtained: 13,
      comments: "Captured Device Manager hierarchy screenshot and demonstrated safe hotplug/restart."
    },
    {
      id: 3,
      task: "Oral Assessment 1: Computer Hardware & Diagnostics (POST, Motherboard, UPS, RAM vs ROM, SSD vs HDD, HDMI vs VGA).",
      scoringGuide: "Award 20 marks: 10 oral questions @ 2 marks each",
      marksAvailable: 20,
      marksObtained: 18,
      comments: "Articulated differences between volatile/non-volatile memory and modern SSD vs mechanical HDD architecture."
    },
    {
      id: 4,
      task: "Practical 2 (a-d): Manage Desktop Settings — Created/renamed desktop shortcut, customized Recycle Bin, launched Notepad via Run dialog, searched & opened file.",
      scoringGuide: "Award 16 marks: Shortcut (4), Recycle Bin settings (4), Run dialog (4), Search navigation (4)",
      marksAvailable: 16,
      marksObtained: 15,
      comments: "Navigated Windows shortcut creation and system utilities smoothly."
    },
    {
      id: 5,
      task: "Practical 2 (e-i): Perform File Management — Built correct folder structure, moved files & compressed using 7-Zip, enabled dark mode, activated Sticky Keys, saved properties screenshot.",
      scoringGuide: "Award 24 marks: Folder structure (8), 7-Zip compression (4), Dark mode (4), Sticky Keys (4), Properties screenshot (4)",
      marksAvailable: 24,
      marksObtained: 23,
      comments: "Demonstrated complete file hierarchy creation and archive encryption."
    },
    {
      id: 6,
      task: "Practical 3 (a-e): Manage Software — Uninstalled software via Control Panel, installed Foxit PDF Reader & set default, disabled Teams startup, restarted Explorer in Task Manager.",
      scoringGuide: "Award 22 marks: Control Panel uninstall (5), Foxit install (5), Default viewer (4), Startup disable (4), Explorer restart (4)",
      marksAvailable: 22,
      marksObtained: 21,
      comments: "Clean software lifecycle demonstration and Windows process recycling."
    },
    {
      id: 7,
      task: "Practical 3 (f-g): Perform Online Jobs & Communication — Sent email with attachment to assessor, simulated CV platform upload and updated profile photo.",
      scoringGuide: "Award 18 marks: Email composition & attachment (8), CV upload simulation (5), Profile update (5)",
      marksAvailable: 18,
      marksObtained: 17,
      comments: "Composed formal email, attached required assessment artifacts, and verified web upload."
    }
  ]
};

export const PRESET_OPTIONS: PracticalRubricPreset[] = [
  COMPUTER_ESSENTIALS_PRESET,
  REPAIR_MAINTENANCE_PRESET,
  NETWORKING_PRESET
];

interface ObservationChecklistMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  candidateRegCode?: string;
  assessorName?: string;
  unitCode?: string;
  unitTitle?: string;
  qualificationCode?: string;
  initialScores?: Record<number, number>;
  onSave?: (totalObtained: number, percentage: number, isCompetent: boolean, feedback: string) => void;
}

export default function ObservationChecklistMarkingModal({
  isOpen,
  onClose,
  candidateName,
  candidateRegCode,
  assessorName,
  unitCode,
  unitTitle,
  qualificationCode,
  initialScores,
  onSave
}: ObservationChecklistMarkingModalProps) {
  const { trainees } = useTrainees();

  // Active rubric preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>("repair_maintenance");
  const currentPreset = useMemo(() => {
    return PRESET_OPTIONS.find(p => p.id === selectedPresetId) || REPAIR_MAINTENANCE_PRESET;
  }, [selectedPresetId]);

  // Assessment Rubric Items
  const [items, setItems] = useState<ObservationItem[]>(() => {
    return currentPreset.items.map((item) => {
      const customObtained = initialScores?.[item.id];
      return customObtained !== undefined 
        ? { ...item, marksObtained: customObtained }
        : item;
    });
  });

  // Candidate and session metadata state
  const [candidate, setCandidate] = useState(candidateName || currentPreset.defaultCandidate);
  const [candidateReg, setCandidateReg] = useState(candidateRegCode || currentPreset.defaultRegNo);
  const [assessor, setAssessor] = useState(assessorName || currentPreset.assessorName);
  const [venue, setVenue] = useState(currentPreset.venue);
  const [assessmentDate, setAssessmentDate] = useState(currentPreset.date);
  const [feedback, setFeedback] = useState(currentPreset.defaultFeedback);
  const [penColor, setPenColor] = useState<"pen_blue" | "pen_red" | "pen_black">("pen_black");
  const [showPenOverlay, setShowPenOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<"live_observation" | "official_paper">("live_observation");
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&auto=format&fit=crop&q=80"
  ]);

  // When switching presets, reload the rubric
  const handleSwitchPreset = (presetId: string) => {
    const target = PRESET_OPTIONS.find(p => p.id === presetId);
    if (!target) return;
    setSelectedPresetId(presetId);
    setItems(target.items);
    if (!candidateName) setCandidate(target.defaultCandidate);
    if (!candidateRegCode) setCandidateReg(target.defaultRegNo);
    setVenue(target.venue);
    setAssessmentDate(target.date);
    setFeedback(target.defaultFeedback);
    setAssessor(target.assessorName);
    toast.info(`Switched to: ${target.unitTitle}`);
  };

  // Real-time Whole Number Calculations (Strict whole numbers, no decimals)
  const totalAvailable = useMemo(() => {
    return items.reduce((sum, item) => sum + item.marksAvailable, 0);
  }, [items]);

  const totalObtained = useMemo(() => {
    return Math.round(items.reduce((sum, item) => sum + (Number(item.marksObtained) || 0), 0));
  }, [items]);

  const percentage = useMemo(() => {
    return totalAvailable > 0 ? Math.round((totalObtained / totalAvailable) * 100) : 0;
  }, [totalObtained, totalAvailable]);

  // CDACC rule: Competent if ≥ 50%
  const isCompetent = percentage >= 50;

  if (!isOpen) return null;

  const handleScoreChange = (id: number, val: number) => {
    const rounded = Math.round(val);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const clamped = Math.max(0, Math.min(item.marksAvailable, rounded));
        return { ...item, marksObtained: clamped };
      })
    );
  };

  const handleCommentChange = (id: number, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comments: comment } : item))
    );
  };

  const handleSelectTrainee = (tId: string) => {
    const t = trainees.find(tr => tr.id === tId);
    if (t) {
      setCandidate(t.name);
      setCandidateReg(t.admNo || t.regCode);
      toast.success(`Selected candidate: ${t.name} (Reg: ${t.admNo || t.regCode})`);
    }
  };

  const handleSaveMarks = () => {
    if (onSave) {
      onSave(totalObtained, percentage, isCompetent, feedback);
    }
    toast.success("Practical Assessment Saved Online!", {
      description: `${candidate}: Scored ${totalObtained}/${totalAvailable} (${percentage}%) — ${isCompetent ? "COMPETENT [✓]" : "NOT YET COMPETENT"}`
    });
  };

  // Pen styling helper
  const getPenStyle = () => {
    if (penColor === "pen_red") return { color: "#dc2626", stroke: "#dc2626" };
    if (penColor === "pen_blue") return { color: "#1d4ed8", stroke: "#1d4ed8" };
    return { color: "#0f172a", stroke: "#0f172a" }; // black ballpoint
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-card w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 border-b border-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm tracking-wide text-white">
                  TVET CDACC Practical Observation & Marking Engine
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCompetent 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                    : "bg-red-500/20 text-red-300 border border-red-500/40"
                }`}>
                  {isCompetent ? "Competent [✓]" : "Not yet competent"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {venue}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Candidate: <strong className="text-white">{candidate}</strong> ({candidateReg}) — Total: <strong className="text-red-400">{totalObtained} / {totalAvailable} ({percentage}%)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode("live_observation")}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === "live_observation"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Live Lab Observation
              </button>
              <button
                onClick={() => setViewMode("official_paper")}
                className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === "official_paper"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Official CDACC Paper (Pen Overlay)
              </button>
            </div>

            {/* Pen Ink Color Switcher */}
            {viewMode === "official_paper" && (
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">Ink:</span>
                <button
                  onClick={() => setPenColor("pen_black")}
                  className={`w-4 h-4 rounded-full border ${penColor === "pen_black" ? "ring-2 ring-white scale-110" : "opacity-60"} bg-slate-900 border-slate-400`}
                  title="Black Ballpoint Pen"
                />
                <button
                  onClick={() => setPenColor("pen_blue")}
                  className={`w-4 h-4 rounded-full border ${penColor === "pen_blue" ? "ring-2 ring-white scale-110" : "opacity-60"} bg-blue-600 border-blue-400`}
                  title="Blue Ballpoint Pen"
                />
                <button
                  onClick={() => setPenColor("pen_red")}
                  className={`w-4 h-4 rounded-full border ${penColor === "pen_red" ? "ring-2 ring-white scale-110" : "opacity-60"} bg-red-600 border-red-400`}
                  title="Red Marking Pen"
                />
              </div>
            )}

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Print official marked assessment checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Save Marks Online */}
            <button
              onClick={handleSaveMarks}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Online</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Workspace */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-6 print:p-0 print:bg-white">
          
          {/* ========================================================================= */}
          {/* VIEW MODE 1: LIVE LAB / WORKSHOP OBSERVATION CONSOLE                      */}
          {/* Optimized for trainer live mobile/tablet observation in the lab           */}
          {/* ========================================================================= */}
          {viewMode === "live_observation" && (
            <div className="max-w-4xl mx-auto space-y-4">
              
              {/* Presets & Candidate Selector Header Bar */}
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Practical Assessment Rubric Preset:
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_OPTIONS.map((pr) => (
                      <button
                        key={pr.id}
                        onClick={() => handleSwitchPreset(pr.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          selectedPresetId === pr.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                        }`}
                      >
                        <span>{pr.id === "repair_maintenance" ? "🔧" : "🌐"}</span>
                        <span>{pr.unitTitle} ({pr.unitCode})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Candidate Selection & Lab Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Candidate Name:
                    </label>
                    <input
                      type="text"
                      value={candidate}
                      onChange={(e) => setCandidate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Registration Number:
                    </label>
                    <input
                      type="text"
                      value={candidateReg}
                      onChange={(e) => setCandidateReg(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Venue of Assessment:
                    </label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. JITUME LAB"
                      className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Switch Trainee:
                    </label>
                    <select
                      onChange={(e) => handleSelectTrainee(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose trainee...</option>
                      {trainees.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.admNo || t.regCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-time Tally & Instructions Alert */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
                      LIVE LAB OBSERVATION IN PROGRESS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Observe the trainee at the workbench. Award whole-number marks as they execute tasks in the workshop.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Marks</span>
                    <span className="text-2xl font-mono font-extrabold text-white">
                      {totalObtained} <span className="text-xs font-normal text-slate-400">/ {totalAvailable}</span>
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
                    <span className={`text-2xl font-mono font-extrabold ${isCompetent ? "text-emerald-400" : "text-amber-400"}`}>
                      {percentage}%
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Outcome</span>
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-black uppercase ${
                      isCompetent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}>
                      {isCompetent ? "Competent [✓]" : "Not yet competent"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks Scoring Grid */}
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const pct = Math.round((item.marksObtained / item.marksAvailable) * 100);
                  return (
                    <div 
                      key={item.id}
                      className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[280px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                              Task {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground font-mono">
                              Max: {item.marksAvailable} Marks
                            </span>
                          </div>
                          <div className="text-xs font-bold text-foreground whitespace-pre-line leading-relaxed">
                            {item.task}
                          </div>
                          <p className="text-[11px] text-muted-foreground italic mt-1 font-mono">
                            {item.scoringGuide}
                          </p>
                        </div>

                        {/* Interactive Score Steppers & Quick Buttons */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground">Awarded:</span>
                            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                              <button
                                onClick={() => handleScoreChange(item.id, item.marksObtained - 1)}
                                className="px-2.5 py-1 bg-secondary hover:bg-muted text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={item.marksAvailable}
                                value={item.marksObtained}
                                onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value) || 0)}
                                className="w-12 text-center text-xs font-mono font-extrabold bg-transparent outline-none text-red-600"
                              />
                              <button
                                onClick={() => handleScoreChange(item.id, item.marksObtained + 1)}
                                className="px-2.5 py-1 bg-secondary hover:bg-muted text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground font-mono">
                              / {item.marksAvailable}
                            </span>
                          </div>

                          {/* Quick Score Presets for Fast Tapping */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleScoreChange(item.id, 0)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary hover:bg-muted text-muted-foreground"
                            >
                              0
                            </button>
                            <button
                              onClick={() => handleScoreChange(item.id, Math.round(item.marksAvailable / 2))}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary hover:bg-muted text-muted-foreground"
                            >
                              Half ({Math.round(item.marksAvailable / 2)})
                            </button>
                            <button
                              onClick={() => handleScoreChange(item.id, item.marksAvailable)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 border border-emerald-500/20"
                            >
                              Full ({item.marksAvailable})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comment Box */}
                      <div className="pt-2 border-t border-border/60">
                        <input
                          type="text"
                          value={item.comments}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          placeholder="Assessor observation notes for this task..."
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Photo & Video Evidence Capture (CDACC Instruction ii: Take photos/videos at critical points) */}
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Lab & Workbench Observation Evidence (Photos / Video Clips)
                    </h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">
                    Instruction ii: Take photos/videos at critical points
                  </span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {evidencePhotos.map((url, i) => (
                    <div key={i} className="relative w-28 h-20 rounded-lg overflow-hidden border border-border shrink-0 group">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Evidence #{i + 1}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      toast.info("Photo evidence captured from device camera.");
                    }}
                    className="w-28 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground text-xs font-semibold shrink-0 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>+ Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Assessment Outcome & Sign-Off Section */}
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                  Assessment Outcome & Candidate Remarks
                </h4>

                <div className="flex flex-wrap items-center gap-6">
                  <span className="font-bold text-xs text-foreground">The candidate was found to be:</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      checked={isCompetent}
                      readOnly
                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className={isCompetent ? "text-emerald-600 font-extrabold" : "text-muted-foreground"}>
                      Competent (Tick if ≥ 50%) [✓]
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="radio"
                      checked={!isCompetent}
                      readOnly
                      className="text-red-600 focus:ring-red-500 h-4 w-4"
                    />
                    <span className={!isCompetent ? "text-red-600 font-extrabold" : "text-muted-foreground"}>
                      Not yet competent (&lt; 50%)
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-xs text-muted-foreground block">
                    Feedback to Candidate:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["V. Good.", "Keep up", "Competent and confident", "Requires more practice on commands"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeedback(f)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          feedback === f 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Enter constructive remarks for candidate..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW MODE 2: OFFICIAL CDACC PAPER WITH SIMULATED PEN MARKINGS             */}
          {/* Exact Replica of Mukiria TTI / TVET CDACC Assessor Tool (3 or 4 Pages)     */}
          {/* ========================================================================= */}
          {viewMode === "official_paper" && (
            <div 
              className="max-w-4xl mx-auto bg-white text-slate-900 border-2 border-slate-400 shadow-2xl p-6 sm:p-12 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white"
              style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}
            >
              
              {/* PAGE 1: COVER & INSTRUCTIONS */}
              <div className="relative border-b-4 border-slate-300 pb-12 mb-12 min-h-[520px]">
                {/* Header Information */}
                <div className="flex justify-between items-start text-xs font-bold font-mono">
                  <div className="space-y-0.5">
                    <p className="text-base font-extrabold text-slate-900">{currentPreset.qualificationCode.split(" - ")[0]}</p>
                    <p className="text-slate-800">{currentPreset.qualificationCode.split(" - ")[1] || "ICT TECHNICIAN LEVEL 6"}</p>
                    <p className="text-slate-700">{currentPreset.unitCode}</p>
                    <p className="text-slate-900 mt-1 uppercase font-black text-sm">{currentPreset.unitTitle}</p>
                    <p className="text-slate-600 font-semibold">{currentPreset.series}</p>
                    <p className="text-slate-700 font-semibold">{currentPreset.classCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 font-medium">©2024 TVET CDACC</p>
                    
                    {/* Simulated Pen Score on Cover */}
                    {showPenOverlay && (
                      <div 
                        className="mt-3 font-bold select-none text-right pr-2"
                        style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                      >
                        <span className="text-5xl leading-none inline-block border-b-2 pb-1 transform rotate-[-3deg]">
                          {percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Institute & Council Badges */}
                <div className="flex flex-col items-center justify-center my-10 text-center">
                  <div className="flex items-center gap-6 mb-3">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center p-2 bg-slate-50">
                      <Award className="w-10 h-10 text-slate-900" />
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center p-2 bg-slate-50">
                      <ShieldCheck className="w-10 h-10 text-slate-900" />
                    </div>
                  </div>

                  <h2 className="text-base font-black tracking-wide uppercase max-w-lg leading-snug">
                    MUKIRIA TECHNICAL TRAINING INSTITUTE
                  </h2>
                  <h3 className="text-xs font-extrabold uppercase text-slate-700 mt-1">
                    TVET CURRICULUM DEVELOPMENT, ASSESSMENT AND CERTIFICATION COUNCIL (TVET CDACC)
                  </h3>
                  <h4 className="text-sm font-black tracking-widest uppercase mt-4 underline">
                    PRACTICAL ASSESSMENT — ASSESSOR TOOL
                  </h4>
                  <p className="text-xs font-bold mt-1 text-slate-600">TIME: 3 Hours</p>
                </div>

                {/* Instructions to Assessor */}
                <div className="mt-8 border-t-2 border-slate-800 pt-4 text-xs space-y-2">
                  <h4 className="font-extrabold uppercase tracking-wide">INSTRUCTIONS TO THE ASSESSOR</h4>
                  <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-800">
                    <li>You are required to mark the practical as the candidate performs the tasks.</li>
                    <li>You are required to take photos and/or video clips at critical points.</li>
                    <li>Ensure the candidate has a name tag and registration code at the back and front.</li>
                  </ol>
                </div>

                <div className="mt-12 text-center text-xs font-semibold text-slate-700">
                  <p>This paper consists of {currentPreset.paperPages} printed pages.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Candidates should check the question paper to ascertain that all the pages are printed as indicated and that no questions are missing.
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-400 mt-12 font-mono">
                  Page 1 of {currentPreset.paperPages}
                </div>
              </div>

              {/* PAGE 2 & 3: OBSERVATION CHECKLIST DATA TABLE */}
              <div className="relative border-b-4 border-slate-300 pb-12 mb-12">
                
                {/* Header Information Box */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-4 text-xs font-bold">
                  <span className="text-sm tracking-wide uppercase">OBSERVATION CHECK LIST</span>
                  <span className="text-slate-500 font-mono">TVET CDACC</span>
                </div>

                <div className="border-2 border-black divide-y divide-black text-xs font-medium mb-6">
                  <div className="grid grid-cols-[180px_1fr] p-2">
                    <span className="font-bold">Candidate's Name</span>
                    <span className="font-extrabold uppercase text-slate-900 font-mono text-sm">{candidate}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] p-2 bg-slate-50/50">
                    <span className="font-bold">Registration number</span>
                    <span className="font-extrabold font-mono text-slate-900 text-sm">{candidateReg}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] p-2">
                    <span className="font-bold">Assessor name</span>
                    <span className="font-bold text-slate-900">{assessor}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] p-2 bg-slate-50/50">
                    <span className="font-bold">Registration code</span>
                    <span className="font-mono text-slate-600">{candidateReg}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] p-2">
                    <span className="font-bold">Venue of assessment</span>
                    <span className="font-bold font-mono uppercase text-slate-900">{venue}</span>
                  </div>
                  <div className="grid grid-cols-[180px_1fr] p-2 bg-slate-50/50">
                    <span className="font-bold">Date of assessment</span>
                    <span className="font-mono font-bold text-slate-900">{assessmentDate}</span>
                  </div>
                </div>

                <p className="text-[11px] italic mb-3 font-medium">
                  <strong>Items to be evaluated:</strong> Please award marks as appropriate. Give a brief comment on your observation.
                </p>

                {/* Practical Observation Tasks Table */}
                <table className="w-full border-collapse border-2 border-black text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-black font-extrabold">
                      <th className="border border-black p-2 w-12 text-center">
                        S/No
                      </th>
                      <th className="border border-black p-2">
                        Items to be evaluated
                      </th>
                      <th className="border border-black p-2 text-center w-20">
                        Marks<br/>allocated
                      </th>
                      <th className="border border-black p-2 text-center w-24">
                        Marks<br/>obtained
                      </th>
                      <th className="border border-black p-2 w-48">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border border-black p-2.5 text-center font-bold align-top">
                          {idx + 1}
                        </td>
                        <td className="border border-black p-2.5 align-top">
                          <p className="font-bold text-slate-900 whitespace-pre-line leading-relaxed">
                            {item.task}
                          </p>
                          <p className="text-[10px] text-slate-600 italic mt-1 font-mono">
                            {item.scoringGuide}
                          </p>
                        </td>
                        <td className="border border-black p-2.5 text-center font-mono font-bold align-middle text-sm">
                          {item.marksAvailable}
                        </td>
                        <td className="border border-black p-2.5 text-center align-middle relative">
                          {/* Authentic Pen Mark Display */}
                          {showPenOverlay ? (
                            <span 
                              className="font-bold text-3xl select-none"
                              style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                            >
                              {item.marksObtained}
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-slate-700">
                              {item.marksObtained}
                            </span>
                          )}
                        </td>
                        <td className="border border-black p-2.5 text-[11px] align-top text-slate-700">
                          {item.comments}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black font-extrabold bg-slate-100 text-xs">
                      <td colSpan={2} className="border border-black p-3 uppercase tracking-wider text-right font-black">
                        TOTAL
                      </td>
                      <td className="border border-black p-3 text-center font-mono text-sm font-black">
                        {totalAvailable} MARKS
                      </td>
                      <td className="border border-black p-3 text-center">
                        {showPenOverlay ? (
                          <span 
                            className="font-black text-4xl select-none"
                            style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                          >
                            {totalObtained}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-base">
                            {totalObtained}
                          </span>
                        )}
                      </td>
                      <td className="border border-black p-3 text-right">
                        <span className="font-bold font-mono text-sm" style={getPenStyle()}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-[10px] text-slate-400 mt-8 font-mono">
                  Page 2 of {currentPreset.paperPages}
                </div>
              </div>

              {/* PAGE 3: ASSESSMENT OUTCOME & SIGN-OFF */}
              <div className="relative pt-4">
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-6 text-xs font-bold">
                  <span className="text-sm tracking-wide uppercase">ASSESSMENT OUTCOME</span>
                  <span className="text-slate-500 font-mono">TVET CDACC</span>
                </div>

                <div className="border-2 border-black p-6 space-y-6 text-xs font-medium">
                  <div>
                    <div className="flex items-center gap-8 pl-2 flex-wrap">
                      <p className="font-extrabold text-sm">The candidate was found to be:</p>

                      {/* Competent Checkbox with Pen Tick */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">Competent</span>
                        <div className="w-8 h-8 border-2 border-black flex items-center justify-center relative bg-white">
                          {isCompetent && showPenOverlay && (
                            <span 
                              className="font-black text-3xl select-none absolute -top-1.5 -right-0.5"
                              style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Not yet competent Checkbox */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">Not yet competent</span>
                        <div className="w-8 h-8 border-2 border-black flex items-center justify-center relative bg-white">
                          {!isCompetent && showPenOverlay && (
                            <span 
                              className="font-black text-3xl select-none absolute -top-1.5 -right-0.5"
                              style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 italic font-semibold mt-3 pl-2">
                      (The candidate is competent if s/he gets 50% of the 50 marks of the observation checklist)
                    </p>
                  </div>

                  <div className="border-t border-black pt-4">
                    <p className="font-bold text-slate-800 mb-1">Feedback from the candidate:</p>
                    <div className="h-8 border-b border-dotted border-slate-400"></div>
                  </div>

                  <div className="border-t border-black pt-4">
                    <p className="font-bold text-slate-800 mb-2">Feedback to the candidate:</p>
                    {showPenOverlay ? (
                      <div 
                        className="font-bold text-3xl pl-4 py-1"
                        style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                      >
                        {feedback || "V. Good."}
                      </div>
                    ) : (
                      <div className="font-semibold text-slate-800 pl-4 py-1">
                        {feedback}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-t border-black pt-6">
                    <div>
                      <p className="font-bold mb-1">Candidate's signature</p>
                      <div className="border-b border-black h-8 flex items-end">
                        <span className="font-mono text-[11px] text-slate-600">{candidate}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold mb-1">Date:</p>
                      <div className="border-b border-black h-8 flex items-end font-mono">
                        {assessmentDate}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 border-t border-black pt-6">
                    <div>
                      <p className="font-bold mb-1">Assessor's signature</p>
                      <div className="border-b border-black h-8 flex items-end">
                        {showPenOverlay ? (
                          <span 
                            className="font-bold text-2xl select-none"
                            style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif" }}
                          >
                            {currentPreset.assessorSignature}
                          </span>
                        ) : (
                          <span className="font-mono text-xs">{assessor}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold mb-1">Date:</p>
                      <div 
                        className="border-b border-black h-8 flex items-end font-mono font-bold" 
                        style={{ ...getPenStyle(), fontFamily: "'Caveat', cursive, sans-serif", fontSize: "19px" }}
                      >
                        {assessmentDate}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="text-center font-bold text-xs tracking-wider uppercase text-slate-800 mt-10">
                  THIS IS THE LAST PRINTED PAGE.
                </div>
                <div className="text-center text-[10px] text-slate-400 mt-2 font-mono">
                  Page {currentPreset.paperPages} of {currentPreset.paperPages}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-border px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              Live Observation Engine: Instant touch scoring for workshop & computer laboratory practicals.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveMarks}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Practical Marks
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
