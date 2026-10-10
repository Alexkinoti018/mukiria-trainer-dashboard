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

  // Selected trainer state (defaults to Alexander Kinoti)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("mr-alexander-kinoti");
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
      let currentSchedule: any = {};
      let title = "";
      if (viewMode === "trainer") {
        title = `TEACHER SCHEDULE: ${activeTrainer?.name}`;
        currentSchedule = activeTrainer?.schedule || {};
      } else if (viewMode === "class") {
        title = `CLASS TIMETABLE: ${selectedClassFilter}`;
        currentSchedule = classSchedule;
      } else {
        title = `LABORATORY / VENUE OCCUPANCY: ${selectedVenueFilter}`;
        currentSchedule = venueSchedule;
      }

      const payload = {
        schedule_title: title,
        term: masterTimetable.term,
        week: academicContext.currentWeek,
        schedule: currentSchedule,
      };

      const res = await fetch("http://localhost:8000/api/export-timetable-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const data = await res.json();
      if (data.file_data) {
        downloadBase64File(data.file_data, data.filename || "MTTI_Timetable.pdf", "application/pdf");
        toast.success("Official Timetable PDF downloaded", { description: data.filename });
      }
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
              margin: 6mm 8mm 6mm 8mm;
            }
            html, body {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
              height: 0 !important;
              width: 0 !important;
            }
            * {
              scrollbar-width: none !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .timetable-print-card {
              border: 1.5px solid #000 !important;
              box-shadow: none !important;
              padding: 4px !important;
              margin: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 100% !important;
            }
            .timetable-table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            .timetable-table th, 
            .timetable-table td {
              border: 1px solid #000 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              padding: 4px 6px !important;
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

        {/* ── Official Weekly Timetable Grid (Screen & Print) ── */}
        <div className="timetable-print-card bg-white text-black p-6 rounded-2xl border-2 border-black shadow-lg print:border-none print:shadow-none print:p-0">
          
          {/* Official Schedule Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img src="/mtti-logo.jpg" alt="Mukiria Logo" className="w-14 h-14 object-contain" onError={e => e.currentTarget.style.display = 'none'} />
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide font-serif">MUKIRIA TECHNICAL TRAINING INSTITUTE</h3>
                <p className="text-xs font-bold text-slate-700">
                  {viewMode === "trainer" ? `TEACHER SCHEDULE: ${activeTrainer?.name}` :
                   viewMode === "class" ? `CLASS TIMETABLE: ${selectedClassFilter}` :
                   `LABORATORY / VENUE OCCUPANCY: ${selectedVenueFilter}`}
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  {masterTimetable.term} • Week {academicContext.currentWeek} • Assessment Center: 01200004
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs space-y-0.5 hidden sm:block">
                <div className="font-bold">TVET CDACC Certified</div>
                <div className="text-[11px] text-slate-700">All lectures strictly 2-hour duration</div>
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Official Academic Timetable</div>
              </div>
              <div className="flex items-center gap-1.5 print:hidden">
                <button
                  onClick={handleDownloadTimetablePdf}
                  disabled={isDownloadingPdf}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                  title="Download vector 1-page A4 landscape PDF"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition"
                  title="Print single-sheet landscape"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto print:overflow-visible">
            <table 
              className="timetable-table w-full text-left border-collapse text-[10.5px] text-black border border-black" 
              style={{ fontFamily: 'Maiandra GD, Calibri, sans-serif', tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "21.5%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "21.5%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "21.5%" }} />
                <col style={{ width: "3.5%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="p-2 border border-black">Day</th>
                  <th className="p-2 border border-black">
                    Period 1<br/><span className="text-[10px] font-normal font-mono">8:00 - 10:00</span>
                  </th>
                  <th className="p-1 border border-black bg-amber-50 text-[10px]">
                    TEA<br/><span className="font-mono text-[9px]">10:00</span>
                  </th>
                  <th className="p-2 border border-black">
                    Period 2<br/><span className="text-[10px] font-normal font-mono">10:30 - 12:30</span>
                  </th>
                  <th className="p-1 border border-black bg-amber-50 text-[10px]">
                    LUNCH<br/><span className="font-mono text-[9px]">12:30</span>
                  </th>
                  <th className="p-2 border border-black">
                    Period 3<br/><span className="text-[10px] font-normal font-mono">13:30 - 15:30</span>
                  </th>
                  <th className="p-1 border border-black bg-amber-50 text-[9px]">
                    BRK<br/><span className="font-mono text-[8px]">15:30</span>
                  </th>
                  <th className="p-2 border border-black">
                    Period 4<br/><span className="text-[10px] font-normal font-mono">15:35 - 17:35</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((day) => {
                  const isToday = academicContext.dayName === day;
                  
                  // Get day sessions based on view mode
                  let daySessions: any[] = [];
                  if (viewMode === "trainer") {
                    daySessions = activeTrainer?.schedule[day] || [];
                  } else if (viewMode === "class") {
                    daySessions = classSchedule[day] || [];
                  } else {
                    daySessions = venueSchedule[day] || [];
                  }

                  const p1 = daySessions.find(s => s.period === 1);
                  const p2 = daySessions.find(s => s.period === 2);
                  const p3 = daySessions.find(s => s.period === 3);
                  const p4 = daySessions.find(s => s.period === 4);

                  return (
                    <tr 
                      key={day} 
                      className={`hover:bg-slate-50 transition ${isToday ? 'bg-blue-50/60 font-semibold' : ''}`}
                    >
                      {/* Day Label */}
                      <td className="p-2.5 border border-black text-center font-bold">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{day.slice(0, 2)}</span>
                          {isToday && (
                            <span className="text-[9px] px-1 py-0.2 bg-primary text-primary-foreground rounded font-bold uppercase tracking-tight mt-0.5">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Period 1 */}
                      <td className="p-2 border border-black align-top min-h-[58px]">
                        {p1 ? (
                          <div className="space-y-1">
                            <div className="font-bold text-xs leading-snug">{p1.unitTitle}</div>
                            <div className="text-[10px] font-mono font-bold text-slate-800">{formatCohort(p1.classCode, p1.unitTitle)}</div>
                            {p1.trainerName && <div className="text-[10px] text-blue-700 italic">{p1.trainerName}</div>}
                            <div className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                              <MapPin className="w-3 h-3 text-red-600" />
                              {p1.venue}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">-</div>
                        )}
                      </td>

                      {/* Tea Break */}
                      <td className="p-1 border border-black bg-amber-50/50 text-center text-[10px] text-slate-500 font-semibold align-middle">
                        Tea
                      </td>

                      {/* Period 2 */}
                      <td className="p-2 border border-black align-top min-h-[58px]">
                        {p2 ? (
                          <div className="space-y-1">
                            <div className="font-bold text-xs leading-snug">{p2.unitTitle}</div>
                            <div className="text-[10px] font-mono font-bold text-slate-800">{formatCohort(p2.classCode, p2.unitTitle)}</div>
                            {p2.trainerName && <div className="text-[10px] text-blue-700 italic">{p2.trainerName}</div>}
                            <div className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                              <MapPin className="w-3 h-3 text-red-600" />
                              {p2.venue}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">-</div>
                        )}
                      </td>

                      {/* Lunch Hour */}
                      <td className="p-1 border border-black bg-amber-50/50 text-center text-[10px] text-slate-500 font-semibold align-middle">
                        Lunch
                      </td>

                      {/* Period 3 */}
                      <td className="p-2 border border-black align-top min-h-[58px]">
                        {p3 ? (
                          <div className="space-y-1">
                            <div className="font-bold text-xs leading-snug">{p3.unitTitle}</div>
                            <div className="text-[10px] font-mono font-bold text-slate-800">{formatCohort(p3.classCode, p3.unitTitle)}</div>
                            {p3.trainerName && <div className="text-[10px] text-blue-700 italic">{p3.trainerName}</div>}
                            <div className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                              <MapPin className="w-3 h-3 text-red-600" />
                              {p3.venue}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">-</div>
                        )}
                      </td>

                      {/* Short Break */}
                      <td className="p-1 border border-black bg-amber-50/50 text-center text-[9px] text-slate-400 align-middle">
                        -
                      </td>

                      {/* Period 4 */}
                      <td className="p-2 border border-black align-top min-h-[58px]">
                        {p4 ? (
                          <div className="space-y-1">
                            <div className="font-bold text-xs leading-snug">{p4.unitTitle}</div>
                            <div className="text-[10px] font-mono font-bold text-slate-800">{formatCohort(p4.classCode, p4.unitTitle)}</div>
                            {p4.trainerName && <div className="text-[10px] text-blue-700 italic">{p4.trainerName}</div>}
                            <div className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">
                              <MapPin className="w-3 h-3 text-red-600" />
                              {p4.venue}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">-</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Endorsement for Timetable */}
          <div className="flex justify-between items-end pt-4 mt-6 border-t border-black text-xs font-bold">
            <div>
              <p>Prepared by: Timetable Committee & Deputy Principal Academics</p>
              <p className="text-[10px] text-slate-600 font-mono mt-0.5">Software: aSc Timetables Institutional Edition 2026</p>
            </div>
            <div className="text-right">
              <p>Official Institutional Stamp</p>
              <div className="w-48 border-b border-black mt-3"></div>
            </div>
          </div>

        </div>

      </div>
    </TrainerLayout>
  );
}
