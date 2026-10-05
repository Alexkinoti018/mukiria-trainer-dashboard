import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  ShieldAlert, 
  Sparkles, 
  MapPin, 
  Check, 
  ArrowLeft,
  GraduationCap,
  Users
} from "lucide-react";
import { 
  getStoredSessionPlans, 
  getStoredLearningPlans,
  SessionPlan 
} from "@/lib/mockSessionPlans";
import { toast } from "sonner";

export default function StudentSessionView() {
  const [, params] = useRoute("/session/:id");
  const sessionId = params?.id;

  const [session, setSession] = useState<SessionPlan | null>(null);
  const [completedOutcomes, setCompletedOutcomes] = useState<number[]>([]);
  const [traineeAdm, setTraineeAdm] = useState("");
  const [traineeName, setTraineeName] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    const plans = getStoredSessionPlans();
    if (sessionId) {
      const found = plans.find(p => p.id === sessionId || p.id.includes(sessionId));
      if (found) {
        setSession(found);
        return;
      }
    }
    // Fallback to first plan or mock
    if (plans.length > 0) {
      setSession(plans[0]);
    } else {
      // Default session
      setSession({
        id: "sp-default",
        document_code: "MTTI/F/CUR/05",
        unit_code: "HBS/OS/COS/BC/01/5/MA",
        unit_name: "Apply Digital Literacy",
        class_code: "EE6/M/S/24",
        week_number: 1,
        date: new Date().toLocaleDateString("en-GB"),
        time_duration: "10:30 - 12:30",
        trainer_name: "Alexander Kinoti",
        department: "Computing & Informatics",
        level: "Level 6",
        trainees_count: 28,
        session_title: "Spreadsheet Formulas & Data Analysis Procedures",
        learning_outcomes: [
          "Identify spreadsheet application interface components and ribbon configurations",
          "Input numerical datasets and apply arithmetic formulas with correct cell referencing",
          "Perform automated summary calculations using standard functions (SUM, AVERAGE, MIN, MAX)"
        ],
        resources: ["Laboratory workstations", "CDACC Learning Guides", "Projector display"],
        safety_requirements: "Strictly observe workstation ergonomics and electrical lab precautions.",
        introduction: "Review previous session on data entry and explore advanced formula syntax.",
        delivery_steps: [
          { time_minutes: 30, trainer_activity: "Introduce cell referencing and arithmetic operators.", learner_activity: "Note-taking and interface setup.", assessment: "Oral Questioning" },
          { time_minutes: 60, trainer_activity: "Supervise guided exercises on spreadsheet formulas.", learner_activity: "Implement formulas on sample financial datasets.", assessment: "Practical Observation" },
          { time_minutes: 30, trainer_activity: "Review common syntax errors and recap learning outcomes.", learner_activity: "Verify calculation outputs and save work.", assessment: "Practical Checklist" }
        ],
        session_review: "Summarized relative vs absolute cell referencing.",
        assignment: "Complete formula exercises in chapter 4.",
        reflection: "Class actively completed all laboratory exercises.",
        status: "delivered",
        signature: "Alexander Kinoti",
        signature_date: new Date().toLocaleDateString("en-GB")
      });
    }
  }, [sessionId]);

  const toggleOutcome = (idx: number) => {
    setCompletedOutcomes(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traineeAdm.trim() || !traineeName.trim()) {
      toast.error("Please enter your Admission Number and Name.");
      return;
    }

    // Save attendance locally
    const storageKey = `mtti_attendance_${session?.id || "default"}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    existing.push({
      adm: traineeAdm.trim().toUpperCase(),
      name: traineeName.trim(),
      time: new Date().toLocaleTimeString("en-GB"),
      date: new Date().toLocaleDateString("en-GB")
    });
    localStorage.setItem(storageKey, JSON.stringify(existing));

    setCheckedIn(true);
    toast.success(`Check-in confirmed for ${traineeName}!`);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <BookOpen className="w-10 h-10 text-[#000953] mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-slate-800">Loading Session Details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-100 text-slate-900 pb-16"
      style={{ fontFamily: 'Maiandra GD, sans-serif' }}
    >
      {/* Top Banner */}
      <header className="bg-[#000953] text-white border-b-4 border-[#c48820] shadow-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#c48820] uppercase tracking-wider block">
              ISO 9001:2015 CERTIFIED -- TVET CDACC
            </span>
            <h1 className="text-lg font-bold tracking-tight uppercase">
              MUKIRIA TECHNICAL TRAINING INSTITUTE
            </h1>
            <p className="text-xs text-white/80">
              Department of Computing & Informatics -- Workshop Door Portal
            </p>
          </div>
          <div className="text-right">
            <span className="bg-[#c48820] text-black text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
              MTTI/F/CUR/05
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Session Card Banner */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#000953]/20 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#000953]/10 text-[#000953] rounded-lg text-xs font-bold">
                Week {session.week_number}
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-lg text-xs font-bold">
                Class: {session.class_code}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#000953]" />
                {session.date || new Date().toLocaleDateString("en-GB")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#000953]" />
                {session.time_duration || "10:30 - 12:30"}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#000953] leading-snug">
            {session.session_title}
          </h2>

          <p className="text-sm font-semibold text-slate-600 mt-1">
            Unit: <strong className="text-slate-900">{session.unit_code}</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-[#000953]" />
              <span>Trainer: <strong className="text-slate-900">{session.trainer_name || "Mr. Alexander Kinoti"}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-[#c48820]" />
              <span>Venue: <strong className="text-slate-900">Computer Laboratory / Workshop</strong></span>
            </div>
          </div>
        </div>

        {/* Today's Learning Outcomes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#000953] text-[#c48820] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#000953]">Today's Learning Outcomes</h3>
                <p className="text-xs text-slate-500">By the end of today's session you will be able to:</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#c48820] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {completedOutcomes.length} of {session.learning_outcomes?.length || 0} Met
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {session.learning_outcomes?.map((outcome, idx) => {
              const isChecked = completedOutcomes.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleOutcome(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 hover:border-[#000953]/30 text-slate-800"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isChecked 
                      ? "bg-emerald-600 border-emerald-600 text-white" 
                      : "border-slate-400 bg-white"
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="text-xs leading-relaxed font-medium">
                    <span className="font-bold mr-1.5">{idx + 1}.</span>
                    {outcome}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Delivery Flow */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#000953] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#000953]">Planned Session Flow</h3>
              <p className="text-xs text-slate-500">Structured CDACC instructional delivery steps</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {session.delivery_steps?.map((step, idx) => (
              <div key={idx} className="py-3 flex items-start gap-4">
                <span className="px-2 py-1 bg-slate-100 font-mono font-bold text-slate-700 rounded text-[11px] shrink-0">
                  {step.time_minutes} min
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800">{step.trainer_activity}</p>
                  <p className="text-slate-500 text-[11px]">Trainees: {step.learner_activity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trainee Door Check-In Card */}
        <div className="bg-gradient-to-br from-[#000953] to-[#001373] text-white rounded-2xl p-6 shadow-lg border border-[#c48820]/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#c48820]/20 border border-[#c48820]/50 flex items-center justify-center text-[#c48820]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Workshop Door Trainee Check-In</h3>
              <p className="text-xs text-white/70">
                Confirm your physical presence at the workshop
              </p>
            </div>
          </div>

          {checkedIn ? (
            <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">Attendance Confirmed!</p>
                <p className="text-white/80">
                  {traineeName} ({traineeAdm.toUpperCase()}) recorded at {new Date().toLocaleTimeString("en-GB")}.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-white/70 font-semibold block mb-1">
                    Admission Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10609"
                    value={traineeAdm}
                    onChange={e => setTraineeAdm(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#c48820]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/70 font-semibold block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mutethia Brian"
                    value={traineeName}
                    onChange={e => setTraineeName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-[#c48820]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#c48820] hover:bg-[#c48820]/90 text-black font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Submit Attendance Check-In
              </button>
            </form>
          )}
        </div>

        {/* Safety Requirements Notice */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            WORKSHOP & LABORATORY SAFETY PROTOCOLS
          </div>
          <p className="text-xs leading-relaxed text-amber-800/90">
            {session.safety_requirements || "Strictly observe workstation ergonomics and electrical laboratory precautions. No food or beverages are permitted in the laboratory."}
          </p>
        </div>
      </main>
    </div>
  );
}
