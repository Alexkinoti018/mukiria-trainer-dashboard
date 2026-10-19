/**
 * Mukiria Technical Training Institute (MTTI)
 * Official Master Academic Timetable Module
 * Full synchronization with live academic calendar, current time, date, week, term, and year
 */

import { useState, useEffect, useMemo } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  Search, 
  Filter, 
  Printer, 
  Download,
  Loader2,
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Building2, 
  GraduationCap,
  DoorOpen,
  ArrowRight
} from "lucide-react";
import masterTimetable from "@/lib/timetableData.json";
import { 
  getAcademicContext, 
  getTrainerLiveStatus, 
  MTTI_PERIODS, 
  PeriodSlot,
  findTrainer
} from "@/lib/academicCalendar";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function TimetablePage() {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  
  // Real-time clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const academicContext = useMemo(() => getAcademicContext(currentTime), [currentTime]);

  // Selected trainer state (defaults to synchronized trainer or Alexander Kinoti)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mtti_selected_timetable_trainer");
      if (stored) return stored;
    }
    return "mr-alexander-kinoti";
  });
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState<"trainer" | "class" | "venue">("trainer");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ICT4/ITECH6/S/26 MOD 1");
  const [selectedVenueFilter, setSelectedVenueFilter] = useState("LAB1B");

  // All trainers list
  const trainers = useMemo(() => (masterTimetable as any).trainers || [], []);
  const allDepartments = useMemo(() => {
    return Array.from(new Set(trainers.map((t: any) => t.department))).filter(Boolean) as string[];
  }, [trainers]);

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t: any) => {
      const matchesSearch = t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) ||
                            t.classes.some((c: string) => c.toLowerCase().includes(trainerSearchQuery.toLowerCase())) ||
                            t.units.some((u: string) => u.toLowerCase().includes(trainerSearchQuery.toLowerCase()));
      const matchesDept = selectedDepartment === "all" || t.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [trainers, trainerSearchQuery, selectedDepartment]);

  // Currently viewed trainer object
  const activeTrainer = useMemo(() => {
    return trainers.find((t: any) => t.id === selectedTrainerId) || 
           trainers.find((t: any) => t.name.includes("ALEXANDER KINOTI")) || 
           trainers[0];
  }, [trainers, selectedTrainerId]);

  // Live status for active trainer
  const liveStatus = useMemo(() => {
    if (!activeTrainer) return null;
    return getTrainerLiveStatus(activeTrainer.name, currentTime);
  }, [activeTrainer, currentTime]);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Class view aggregation: find all sessions for selected class across all teachers
  const classSchedule = useMemo(() => {
    const schedule: Record<string, any[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    if (viewMode !== "class") return schedule;

    const targetClass = selectedClassFilter.toLowerCase();
    for (const tr of trainers) {
      for (const day of daysOfWeek) {
        const sessions = tr.schedule[day] || [];
        for (const s of sessions) {
          if (s.classCode.toLowerCase().includes(targetClass) || targetClass.includes(s.classCode.toLowerCase())) {
            schedule[day].push({ ...s, trainerName: tr.name });
          }
        }
      }
    }
    for (const day of daysOfWeek) {
      schedule[day].sort((a, b) => a.period - b.period);
    }
    return schedule;
  }, [viewMode, selectedClassFilter, trainers]);

  // Venue view aggregation: find all sessions for selected room
  const venueSchedule = useMemo(() => {
    const schedule: Record<string, any[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    if (viewMode !== "venue") return schedule;

    const targetVenue = selectedVenueFilter.toLowerCase();
    for (const tr of trainers) {
      for (const day of daysOfWeek) {
        const sessions = tr.schedule[day] || [];
        for (const s of sessions) {
          if (s.venue.toLowerCase() === targetVenue) {
            schedule[day].push({ ...s, trainerName: tr.name });
          }
        }
      }
    }
    for (const day of daysOfWeek) {
      schedule[day].sort((a, b) => a.period - b.period);
    }
    return schedule;
  }, [viewMode, selectedVenueFilter, trainers]);

  // Top featured trainers shortcut bar
  const quickTrainers = [
    { id: "mr-alexander-kinoti", name: "Alexander Kinoti", dept: "Computing" },
    { id: "mr-greenwood-maeria", name: "Greenwood Maeria", dept: "Computing" },
    { id: "mr-timothy-muthomi", name: "Timothy Muthomi", dept: "Computing" },
    { id: "md-lucy-kabura", name: "Lucy Kabura", dept: "Computing" },
    { id: "mr-eddy-njue", name: "Eddy Njue", dept: "Computing" },
    { id: "md-joy-kathure", name: "Joy Kathure", dept: "Electrical" },
    { id: "mr-isaiah-kirui", name: "Isaiah Kirui", dept: "Civil/Building" }
  ];

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const downloadBase64File = (base64Data: string, filename: string, mimeType: string) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCohort = (classCode?: string, unitTitle?: string) => {
    if (!classCode) return "";
    let clean = classCode.trim();
    if (unitTitle) {
      const escaped = unitTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      clean = clean.replace(new RegExp(`^${escaped}\\s*`, "i"), "");
    }
    clean = clean.replace(/^(?:ICT\s*SKIL[LS]\s*(?:1\s*)?)/i, "").trim();
    return clean;
  };

  const handleDownloadTimetablePdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = 297;
      const pageH = 210;
      const marginX = 10;
      const topY = 18;
      const tableW = pageW - marginX * 2; // 277mm
      const headerH = 16;
      const rowH = 32;
      const tableH = headerH + rowH * 5; // 176mm

      const headerTitle =
        viewMode === "trainer"
          ? `Teacher   ${activeTrainer?.name || "MR ALEXANDER KINOTI"}`
          : viewMode === "class"
          ? `Class   ${selectedClassFilter}`
          : `Room   ${selectedVenueFilter}`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0);
      doc.text(headerTitle, pageW / 2, 13, { align: "center" });

      // Column widths matching official aSc Timetables proportions (sum = 277mm)
      const colWidths = [27, 36, 35, 36, 35, 36, 36, 36];
      const colX: number[] = [];
      let accX = marginX;
      for (const w of colWidths) {
        colX.push(accX);
        accX += w;
      }

      // Outer border (thick 0.6mm)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.rect(marginX, topY, tableW, tableH);

      // Header bottom line (0.5mm)
      doc.setLineWidth(0.5);
      doc.line(marginX, topY + headerH, marginX + tableW, topY + headerH);

      // Vertical column lines (full height from topY to topY + tableH)
      doc.setLineWidth(0.3);
      for (let c = 1; c < colWidths.length; c++) {
        doc.line(colX[c], topY, colX[c], topY + tableH);
      }

      // Header labels
      const headers = [
        { title: "", time: "", size: 12 },
        { title: "1", time: "8:00 - 10:00", size: 14 },
        { title: "TEA BREAK", time: "10:00 - 10:30", size: 12 },
        { title: "2", time: "10:30 - 12:30", size: 14 },
        { title: "LUNCH HR", time: "12:30 - 13:30", size: 12 },
        { title: "3", time: "13:30 - 15:30", size: 14 },
        { title: "SHORT BREAK", time: "15:30 - 15:35", size: 10 },
        { title: "4", time: "15:35 - 17:35", size: 14 },
      ];

      headers.forEach((h, idx) => {
        if (!h.title) return;
        const cx = colX[idx] + colWidths[idx] / 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(h.size);
        doc.text(h.title, cx, topY + 8.5, { align: "center" });
        doc.setFontSize(7.5);
        doc.text(h.time, cx, topY + 14, { align: "center" });
      });

      // Body rows (Mo, Tu, We, Th, Fr)
      // Note: TEA BREAK (col 2), LUNCH HR (col 4), and SHORT BREAK (col 6) are vertically merged across all 5 days!
      const nonBreakCols = [0, 1, 3, 5, 7];
      daysOfWeek.forEach((day, dIdx) => {
        const ry = topY + headerH + dIdx * rowH;

        // Draw horizontal row divider ONLY across non-break columns (0, 1, 3, 5, 7)
        if (dIdx > 0) {
          doc.setLineWidth(0.25);
          for (const colIdx of nonBreakCols) {
            doc.line(colX[colIdx], ry, colX[colIdx] + colWidths[colIdx], ry);
          }
        }

        // Day label (Mo, Tu, We, Th, Fr)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(22);
        doc.text(day.slice(0, 2), colX[0] + colWidths[0] / 2, ry + rowH / 2 + 3, {
          align: "center",
        });

        let daySessions: any[] = [];
        if (viewMode === "trainer") {
          daySessions = activeTrainer?.schedule[day] || [];
        } else if (viewMode === "class") {
          daySessions = classSchedule[day] || [];
        } else {
          daySessions = venueSchedule[day] || [];
        }

        const periodToCol: Record<number, number> = { 1: 1, 2: 3, 3: 5, 4: 7 };
        for (const pNum of [1, 2, 3, 4]) {
          const cIdx = periodToCol[pNum];
          const cellX = colX[cIdx];
          const cellW = colWidths[cIdx];
          const slotSessions = daySessions.filter((s) => s.period === pNum);
          if (slotSessions.length === 0) continue;

          const subH = rowH / slotSessions.length;
          slotSessions.forEach((s, sIdx) => {
            const sy = ry + sIdx * subH;
            if (sIdx > 0) {
              doc.setLineWidth(0.25);
              doc.line(cellX, sy, cellX + cellW, sy);
            }
            // Top-left: Subject / Unit Title
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.5);
            const uLines = doc.splitTextToSize(String(s.unitTitle || "").toUpperCase(), cellW - 3);
            doc.text(uLines.slice(0, 2), cellX + 1.5, sy + 4);

            // Center: Class Cohort Code
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            const cohortText = formatCohort(s.classCode, s.unitTitle);
            const cLines = doc.splitTextToSize(cohortText, cellW - 3);
            doc.text(cLines.slice(0, 2), cellX + cellW / 2, sy + subH / 2 + 1, {
              align: "center",
            });

            // Bottom-right: Room / Venue
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.text(String(s.venue || ""), cellX + cellW - 1.5, sy + subH - 2, {
              align: "right",
            });
          });
        }
      });

      // Bottom footer line outside table border
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Timetable generated:9/27/2026", marginX, topY + tableH + 4.5);
      doc.text("aSc Timetables", marginX + tableW, topY + tableH + 4.5, { align: "right" });

      const safeName = (
        viewMode === "trainer"
          ? activeTrainer?.name || "Trainer"
          : viewMode === "class"
          ? selectedClassFilter
          : selectedVenueFilter
      ).replace(/[^a-zA-Z0-9_-]/g, "_");
      doc.save(`MTTI_Timetable_${safeName}.pdf`);
      toast.success("Official aSc Timetable PDF downloaded");
    } catch (err: any) {
      toast.info("Opening browser print dialog as fallback...");
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <TrainerLayout 
      title="Master Academic Timetable" 
      subtitle="Official institutional schedule synchronized with real-time class periods, venues, and academic calendar"
    >
      <div className="space-y-6">

        {/* ── Print Stylesheet for Flawless 1-Page A4 Landscape Output ── */}
        <style>{`
          @media print {
            @page {
              size: A4 landscape;
              margin: 8mm 10mm 8mm 10mm;
            }
            html, body {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #mtti-timetable-printable,
            #mtti-timetable-printable * {
              visibility: visible !important;
            }
            #mtti-timetable-printable {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #fff !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .timetable-table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
              border: 2px solid #000 !important;
            }
            .timetable-table th, 
            .timetable-table td {
              border: 1px solid #000 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            .timetable-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* ── Top Institutional Banner: Synchronized Calendar, Date, Week & Clock (Screen-Only) ── */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-[#000953] via-[#021575] to-[#042899] text-white p-6 shadow-xl print:hidden">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 print:bg-gray-200">
                  {academicContext.term}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-blue-100 border border-white/20 print:border-black print:text-black">
                  Academic Week {academicContext.currentWeek} of {masterTimetable.termTotalWeeks}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 print:text-black">
                  Year {academicContext.academicYear}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white print:text-black font-serif">
                MUKIRIA TECHNICAL TRAINING INSTITUTE
              </h2>
              <p className="text-xs text-blue-200 print:text-gray-700 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{academicContext.formattedDate}</span>
                <span>•</span>
                <span>Term Duration: {academicContext.termDuration}</span>
              </p>
            </div>

            {/* Live Clock & Period Status Box */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3.5 rounded-xl print:border-black print:bg-white">
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-amber-300 print:text-black tracking-wider">
                  {academicContext.timeFormatted}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-100 print:text-gray-800 flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${academicContext.isBreak ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                  {academicContext.statusText}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Live Trainer Status Card (What Alexander Kinoti / Selected Trainer Has NOW) ── */}
        {liveStatus && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{activeTrainer.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-semibold text-secondary-foreground">
                      {activeTrainer.department}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Teaching {activeTrainer.classes.length} distinct classes • {activeTrainer.units.length} units
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  liveStatus.status === "in_class" 
                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                    : liveStatus.status === "in_break"
                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                    : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {liveStatus.status === "in_class" ? "CLASS IN SESSION NOW" :
                     liveStatus.status === "in_break" ? "TEA / LUNCH BREAK" :
                     liveStatus.status === "free_now" ? "FREE PERIOD / OFFICE HOURS" :
                     "SESSIONS CONCLUDED TODAY"}
                  </span>
                </div>

                <button
                  onClick={handleDownloadTimetablePdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm print:hidden"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download Official PDF
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Timetable
                </button>
              </div>
            </div>

            {/* Current & Next Session Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Box 1: Current / Ongoing Session */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Current Active Period: {academicContext.activeSlot?.name || "None"}
                </span>
                {liveStatus.currentSession ? (
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-foreground">
                      {liveStatus.currentSession.unitTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        {liveStatus.currentSession.classCode}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-bold">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        Room: {liveStatus.currentSession.venue}
                      </span>
                      <span>({liveStatus.currentSession.timeRange})</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground italic">
                    {liveStatus.status === "in_break" 
                      ? `${academicContext.statusText} — No teaching scheduled during this break.`
                      : `No lecture assigned for ${activeTrainer.name} during this specific hour.`}
                  </p>
                )}
              </div>

              {/* Box 2: Next Upcoming Session Today */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Next Upcoming Class on {academicContext.dayName}
                </span>
                {liveStatus.nextSession ? (
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-foreground">
                      {liveStatus.nextSession.unitTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        {liveStatus.nextSession.classCode}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-bold">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        Room: {liveStatus.nextSession.venue}
                      </span>
                      <span className="text-amber-600 font-bold">Starts at {liveStatus.nextSession.startTime}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground italic">
                    No further classes scheduled for {activeTrainer.name} today.
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── Filter & Search Toolbar (Print:hidden) ── */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4 print:hidden">
          
          {/* Quick Trainer Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Quick Trainers:</span>
            {quickTrainers.map((qt) => (
              <button
                key={qt.id}
                onClick={() => {
                  setSelectedTrainerId(qt.id);
                  setViewMode("trainer");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedTrainerId === qt.id && viewMode === "trainer"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                }`}
              >
                {qt.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              <button
                onClick={() => setViewMode("trainer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "trainer" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                By Trainer ({trainers.length})
              </button>
              <button
                onClick={() => setViewMode("class")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "class" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                By Class / Cohort
              </button>
              <button
                onClick={() => setViewMode("venue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "venue" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                By Laboratory / Room
              </button>
            </div>

            {/* Context Filters */}
            {viewMode === "trainer" && (
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trainerSearchQuery}
                    onChange={(e) => setTrainerSearchQuery(e.target.value)}
                    placeholder="Search any of 117 trainers or subjects..."
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer max-w-[220px]"
                >
                  {filteredTrainers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "class" && (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="text-xs font-bold text-muted-foreground">Select Cohort:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer flex-1"
                >
                  {(masterTimetable as any).classes.map((cls: string) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {viewMode === "venue" && (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="text-xs font-bold text-muted-foreground">Select Room / Lab:</span>
                <select
                  value={selectedVenueFilter}
                  onChange={(e) => setSelectedVenueFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground outline-none cursor-pointer flex-1"
                >
                  {(masterTimetable as any).venues.map((v: string) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>

        {/* ── Official Weekly Timetable Grid (Screen & Print — Exact aSc Timetables Layout) ── */}
        <div
          id="mtti-timetable-printable"
          className="timetable-print-card bg-white text-black p-6 rounded-xl border border-gray-300 shadow-lg print:border-none print:shadow-none print:p-0"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
          {/* Top Action Bar (Screen Only) */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 print:hidden">
            <div className="flex items-center gap-2.5">
              <img
                src="/mtti-logo.jpg"
                alt="Mukiria Logo"
                className="w-9 h-9 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#000953]">
                  MUKIRIA TECHNICAL TRAINING INSTITUTE — OFFICIAL aSc TIMETABLE
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  {masterTimetable.term} • Week {academicContext.currentWeek} • Assessment Center: 01200004
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadTimetablePdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#000953] text-white hover:bg-[#000953]/90 transition shadow-sm"
                title="Download vector 1-page A4 landscape PDF"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition"
                title="Print single-sheet landscape"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Official Centered aSc Title: "Teacher  MR ALEXANDER KINOTI" */}
          <div className="text-center mb-3">
            <h2 className="text-2xl sm:text-3xl font-normal tracking-wide text-black">
              {viewMode === "trainer"
                ? `Teacher  ${activeTrainer?.name}`
                : viewMode === "class"
                ? `Class  ${selectedClassFilter}`
                : `Room  ${selectedVenueFilter}`}
            </h2>
          </div>

          {/* Main 8-Column aSc Timetable Grid with Vertically Merged Break Columns (rowSpan=5) */}
          <div className="overflow-x-auto print:overflow-visible">
            <table
              className="timetable-table w-full border-collapse border-2 border-black text-black"
              style={{ tableLayout: "fixed", fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              <colgroup>
                <col style={{ width: "9.5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12.5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12.5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13.5%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-black text-center bg-white">
                  <th className="border border-black p-2"></th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-lg leading-none mb-1">1</div>
                    <div className="text-[9.5px] font-normal">8:00 - 10:00</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-sm sm:text-base leading-none mb-1">TEA BREAK</div>
                    <div className="text-[9.5px] font-normal">10:00 - 10:30</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-lg leading-none mb-1">2</div>
                    <div className="text-[9.5px] font-normal">10:30 - 12:30</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-sm sm:text-base leading-none mb-1">LUNCH HR</div>
                    <div className="text-[9.5px] font-normal">12:30 - 13:30</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-lg leading-none mb-1">3</div>
                    <div className="text-[9.5px] font-normal">13:30 - 15:30</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-xs sm:text-sm leading-none mb-1">SHORT BREAK</div>
                    <div className="text-[9.5px] font-normal">15:30 - 15:35</div>
                  </th>
                  <th className="border border-black py-2 px-1 font-normal">
                    <div className="text-lg leading-none mb-1">4</div>
                    <div className="text-[9.5px] font-normal">15:35 - 17:35</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((day, dayIdx) => {
                  const isToday = academicContext.dayName === day;

                  let daySessions: any[] = [];
                  if (viewMode === "trainer") {
                    daySessions = activeTrainer?.schedule[day] || [];
                  } else if (viewMode === "class") {
                    daySessions = classSchedule[day] || [];
                  } else {
                    daySessions = venueSchedule[day] || [];
                  }

                  const renderPeriodCell = (periodNum: number) => {
                    const slotSessions = daySessions.filter((s) => s.period === periodNum);
                    return (
                      <td
                        key={`p-${periodNum}`}
                        className="border border-black p-0 align-top h-[108px] print:h-[96px] bg-white"
                      >
                        {slotSessions.length > 0 ? (
                          <div className="flex flex-col h-full divide-y divide-black">
                            {slotSessions.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex-1 flex flex-col justify-between p-1.5 min-h-[50px]"
                              >
                                <div className="text-[9px] uppercase leading-tight text-left font-normal text-black">
                                  {s.unitTitle}
                                </div>
                                <div className="text-[11px] font-bold uppercase text-center leading-tight my-1 text-black">
                                  {formatCohort(s.classCode, s.unitTitle)}
                                  {s.trainerName && (
                                    <div className="text-[8.5px] font-normal uppercase text-slate-700 mt-0.5">
                                      {s.trainerName}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] uppercase text-right font-normal leading-none text-black">
                                  {s.venue}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                    );
                  };

                  return (
                    <tr key={day} className="bg-white">
                      {/* Day Label (Mo, Tu, We, Th, Fr) */}
                      <td className="border border-black p-2 text-center align-middle h-[108px] print:h-[96px]">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-2xl sm:text-3xl font-normal text-black leading-none">
                            {day.slice(0, 2)}
                          </span>
                          {isToday && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-[#000953] text-white rounded font-bold uppercase tracking-tight mt-1 print:hidden">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Period 1 */}
                      {renderPeriodCell(1)}

                      {/* TEA BREAK — Vertically merged across all 5 days (rowSpan=5) */}
                      {dayIdx === 0 && (
                        <td
                          rowSpan={5}
                          className="border-x border-black bg-white"
                          aria-label="Tea Break"
                        />
                      )}

                      {/* Period 2 */}
                      {renderPeriodCell(2)}

                      {/* LUNCH HR — Vertically merged across all 5 days (rowSpan=5) */}
                      {dayIdx === 0 && (
                        <td
                          rowSpan={5}
                          className="border-x border-black bg-white"
                          aria-label="Lunch Hour"
                        />
                      )}

                      {/* Period 3 */}
                      {renderPeriodCell(3)}

                      {/* SHORT BREAK — Vertically merged across all 5 days (rowSpan=5) */}
                      {dayIdx === 0 && (
                        <td
                          rowSpan={5}
                          className="border-x border-black bg-white"
                          aria-label="Short Break"
                        />
                      )}

                      {/* Period 4 */}
                      {renderPeriodCell(4)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Bottom Line Outside Table Border */}
          <div className="flex justify-between items-center pt-1 text-[11px] font-normal text-black">
            <span>Timetable generated:9/27/2026</span>
            <span>aSc Timetables</span>
          </div>
        </div>

      </div>
    </TrainerLayout>
  );
}
