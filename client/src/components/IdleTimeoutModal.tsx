/**
 * Idle Timeout Warning Modal — TVET Terminal Security
 * Mukiria Technical Training Institute
 *
 * Appears when inactivity is detected on a shared laboratory or faculty workstation.
 * Displays an active countdown and gives the user the choice to extend the session
 * or log out immediately to safeguard institutional grading, exams, and pedagogical records.
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";

export interface IdleTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function IdleTimeoutModal({
  isOpen,
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
}: IdleTimeoutModalProps) {
  if (!isOpen) return null;

  // Format MM:SS for clear presentation
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-card/95 border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden text-center backdrop-blur-xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="idle-modal-title"
          aria-describedby="idle-modal-description"
        >
          {/* Subtle Institutional Gold / Amber Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#c48820] to-amber-600" />

          {/* Warning Icon with Pulsing Halo */}
          <div className="relative mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>

          {/* Heading */}
          <h2
            id="idle-modal-title"
            className="text-lg font-bold text-foreground mb-1 tracking-tight"
          >
            Institutional Session Expiring
          </h2>

          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-4">
            Mukiria Technical Training Institute
          </p>

          {/* Countdown Display Pill */}
          <div className="my-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5 animate-pulse" />
            <div className="text-left">
              <div className="text-[11px] font-medium leading-none text-muted-foreground">
                Automatic Logout In
              </div>
              <div className="text-xl font-mono font-extrabold tracking-wider leading-tight">
                {formattedTime}
              </div>
            </div>
          </div>

          {/* Explanatory Message */}
          <p
            id="idle-modal-description"
            className="text-xs text-muted-foreground leading-relaxed mb-6 px-2"
          >
            Due to inactivity on this shared TVET terminal, your session will automatically terminate in{" "}
            <span className="font-bold text-foreground">{remainingSeconds} seconds</span> to
            safeguard academic records and assessment data.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              autoFocus
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Keep Me Logged In
            </button>

            <button
              type="button"
              onClick={onLogoutNow}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-border hover:border-destructive/30 transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out Now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default IdleTimeoutModal;
