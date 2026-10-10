/**
 * Exam Proctoring Dashboard
 * Design: Institutional Glassmorphism
 * Real-time monitoring of student exam sessions with behavior detection
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Flag,
  User,
  Zap,
} from "lucide-react";
import TrainerLayout from "@/components/TrainerLayout";
import { toast } from "sonner";

interface StudentSession {
  id: string;
  name: string;
  regNumber: string;
  examTitle: string;
  startTime: string;
  timeRemaining: number;
  progress: number;
  status: "active" | "paused" | "completed" | "flagged";
  suspiciousFlags: string[];
  tabSwitches: number;
  windowMinimizations: number;
  copyAttempts: number;
}

export default function Proctoring() {
  const [sessions, setSessions] = useState<StudentSession[]>([
    {
      id: "s1",
      name: "Alice Johnson",
      regNumber: "MT-2024-001",
      examTitle: "MECH-301 CAT 2",
      startTime: "2026-07-03 14:00",
      timeRemaining: 45,
      progress: 65,
      status: "active",
      suspiciousFlags: [],
      tabSwitches: 0,
      windowMinimizations: 0,
      copyAttempts: 0,
    },
    {
      id: "s2",
      name: "Bob Smith",
      regNumber: "MT-2024-002",
      examTitle: "MECH-301 CAT 2",
      startTime: "2026-07-03 14:00",
      timeRemaining: 30,
      progress: 85,
      status: "active",
      suspiciousFlags: ["Multiple tab switches"],
      tabSwitches: 3,
      windowMinimizations: 1,
      copyAttempts: 0,
    },
    {
      id: "s3",
      name: "Carol Davis",
      regNumber: "MT-2024-003",
      examTitle: "MECH-301 CAT 2",
      startTime: "2026-07-03 14:00",
      timeRemaining: 15,
      progress: 95,
      status: "active",
      suspiciousFlags: [],
      tabSwitches: 0,
      windowMinimizations: 0,
      copyAttempts: 0,
    },
  ]);

  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.status !== "active") return session;

          const newSession = { ...session };
          newSession.timeRemaining = Math.max(0, newSession.timeRemaining - 1);
          newSession.progress = Math.min(100, newSession.progress + Math.random() * 2);

          // Randomly flag suspicious behavior
          if (Math.random() < 0.05 && newSession.suspiciousFlags.length === 0) {
            const flags = [
              "Multiple tab switches",
              "Window minimized",
              "Copy attempt detected",
              "Unusual activity pattern",
            ];
            const randomFlag = flags[Math.floor(Math.random() * flags.length)];
            newSession.suspiciousFlags = [randomFlag];
            newSession.status = "flagged";

            if (randomFlag === "Multiple tab switches") newSession.tabSwitches++;
            if (randomFlag === "Window minimized") newSession.windowMinimizations++;
            if (randomFlag === "Copy attempt detected") newSession.copyAttempts++;
          }

          if (newSession.timeRemaining === 0) {
            newSession.status = "completed";
          }

          return newSession;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const flagSession = (sessionId: string, reason: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "flagged",
              suspiciousFlags: [...session.suspiciousFlags, reason],
            }
          : session
      )
    );
    toast.warning("Session Flagged", { description: `Marked for review: ${reason}` });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#047857";
      case "flagged":
        return "#be123c";
      case "completed":
        return "#000953";
      default:
        return "#475569";
    }
  };

  const activeCount = sessions.filter((s) => s.status === "active").length;
  const flaggedCount = sessions.filter((s) => s.status === "flagged").length;

  return (
    <TrainerLayout title="Exam Proctoring" subtitle="Real-time monitoring and behavior detection">
      <div className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">
              Active Sessions
            </div>
            <div className="text-2xl font-bold font-mono mt-2 text-emerald-700">
              {activeCount}
            </div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">
              Flagged
            </div>
            <div className="text-2xl font-bold font-mono mt-2 text-rose-600">
              {flaggedCount}
            </div>
          </div>
          <div className="bg-white border border-slate-300 shadow-sm p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-600">
              Total Sessions
            </div>
            <div className="text-2xl font-bold font-mono mt-2 text-[#000953]">
              {sessions.length}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-300 shadow-sm">
            <label className="text-xs font-bold text-slate-700">
              Auto-Refresh
            </label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                autoRefresh
                  ? "bg-[#000953] text-white"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}
            >
              {autoRefresh ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`bg-white p-4 rounded-xl cursor-pointer transition-all hover:shadow-md border ${
                  session.status === "flagged" ? "border-rose-300" : "border-slate-300"
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#0f172a]">
                      {session.name}
                    </div>
                    <div className="text-xs font-mono mt-0.5 text-slate-500">
                      {session.regNumber}
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                    style={{ background: `${getStatusColor(session.status)}15`, color: getStatusColor(session.status) }}
                  >
                    {session.status === "flagged" && <AlertTriangle className="w-3 h-3" />}
                    {session.status === "active" && <Zap className="w-3 h-3" />}
                    {session.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </div>

                <div className="text-xs mb-2 font-medium text-slate-600">
                  {session.examTitle}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-600">
                      Progress
                    </span>
                    <span className="text-xs font-mono font-bold text-[#000953]">
                      {Math.round(session.progress)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-slate-200">
                    <motion.div
                      className="h-full bg-[#000953]"
                      initial={{ width: 0 }}
                      animate={{ width: `${session.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center justify-between mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#c48820]" />
                    <span className="text-xs font-mono font-bold text-[#0f172a]">
                      {Math.floor(session.timeRemaining / 60)}:{String(session.timeRemaining % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    remaining
                  </span>
                </div>

                {/* Suspicious Flags */}
                {session.suspiciousFlags.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {session.suspiciousFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {flag}
                      </div>
                    ))}
                  </div>
                )}

                {/* Behavior Metrics */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-600 font-medium">Tab Switches</div>
                    <div className="font-bold font-mono mt-1 text-[#000953]">
                      {session.tabSwitches}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-600 font-medium">Window Min</div>
                    <div className="font-bold font-mono mt-1 text-[#000953]">
                      {session.windowMinimizations}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-600 font-medium">Copy Attempts</div>
                    <div className="font-bold font-mono mt-1 text-[#000953]">
                      {session.copyAttempts}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Selected Session Details */}
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-300 shadow-lg p-6 rounded-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#000953]">
                Session Details: {selectedSession.name}
              </h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Registration Number
                </div>
                <div className="font-mono text-sm font-bold text-[#000953]">
                  {selectedSession.regNumber}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Exam Title
                </div>
                <div className="text-sm font-semibold text-[#0f172a]">
                  {selectedSession.examTitle}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Start Time
                </div>
                <div className="text-sm font-semibold text-[#0f172a]">
                  {selectedSession.startTime}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: getStatusColor(selectedSession.status) }}
                >
                  {selectedSession.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedSession.status === "active" && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    flagSession(selectedSession.id, "Manual review requested");
                    setSelectedSession(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition"
                >
                  <Flag className="w-4 h-4" />
                  Flag for Review
                </button>
                <button
                  onClick={() => toast.success("Session ended", { description: "Student exam session terminated" })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition"
                >
                  End Session
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </TrainerLayout>
  );
}
