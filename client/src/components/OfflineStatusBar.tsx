/**
 * MTTI Institutional Offline Status Bar & Sync Control
 * Displays live network connectivity, pending buffer count, conflict alerts,
 * and provides manual sync triggers.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Database,
  ShieldCheck,
} from "lucide-react";
import { useSyncStatus } from "@/lib/syncEngine";
import { toast } from "sonner";

export default function OfflineStatusBar() {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, conflicts, syncNow } = useSyncStatus();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleManualSync = async () => {
    toast.info("Checking connectivity & syncing buffered queue...");
    const res = await syncNow();
    if (res.processed > 0) {
      toast.success(`Synchronized ${res.succeeded} queued actions with MTTI cloud.`, {
        description: res.conflicts > 0 ? `${res.conflicts} conflict(s) safely resolved.` : undefined,
      });
    } else if (!isOnline) {
      toast.warning("Still offline. Actions will automatically sync when network reconnects.");
    } else {
      toast.info("Queue is clean — everything is up to date.");
    }
  };

  return (
    <div
      role="region"
      aria-label="Network and Offline Synchronization Status"
      className="fixed bottom-4 right-4 z-50 print:hidden select-none"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="status"
            aria-live="polite"
            className="mb-2 w-80 p-4 rounded-xl border border-slate-700/60 bg-[#000953]/95 backdrop-blur-md text-white shadow-2xl text-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#c48820]" aria-hidden="true" />
                <span className="font-bold text-sm tracking-wide text-white">
                  MTTI Offline Resilience
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                aria-label="Close offline status panel"
                className="text-white/60 hover:text-white transition focus-visible:ring-2 focus-visible:ring-[#c48820] rounded p-1"
              >
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Network Reachability:</span>
                <span className={isOnline ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {isOnline ? "Connected to Cloud" : "Campus Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Buffered Actions:</span>
                <span className="font-semibold text-white">
                  {pendingCount} action{pendingCount !== 1 ? "s" : ""}
                </span>
              </div>
              {lastSyncTime && (
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Last Flushed:</span>
                  <span>{new Date(lastSyncTime).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {conflicts.length > 0 && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] space-y-1">
                <div className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Conflict Defense Active</span>
                </div>
                <p className="line-clamp-2">{conflicts[0].reason}</p>
              </div>
            )}

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              aria-label="Flush sync queue to Supabase now"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#c48820] hover:bg-[#b0781a] text-white font-semibold text-xs transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
              {isSyncing ? "Flushing Queue..." : "Sync Now to Supabase"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Status Pill */}
      <motion.button
        layout
        role="button"
        aria-expanded={isExpanded}
        aria-label={`Connection status: ${isOnline ? "Online" : "Offline"}. ${pendingCount} buffered actions. Click to toggle details.`}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg backdrop-blur-md border cursor-pointer transition focus-visible:ring-2 focus-visible:ring-[#c48820] ${
          isOnline
            ? pendingCount > 0
              ? "bg-[#000953]/90 border-[#c48820]/60 text-white"
              : "bg-[#000953]/80 border-emerald-500/40 text-white"
            : "bg-amber-950/90 border-amber-500/60 text-amber-100 animate-pulse"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {isOnline ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          )}

          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
        </div>

        <span className="text-xs font-semibold tracking-wide">
          {isOnline
            ? pendingCount > 0
              ? `${pendingCount} Buffered`
              : "Online"
            : "Offline (Buffered)"}
        </span>

        {pendingCount > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleManualSync();
            }}
            role="button"
            tabIndex={0}
            aria-label="Flush buffered actions immediately"
            className="p-1 rounded-full hover:bg-white/10 transition"
          >
            <RefreshCw className={`w-3 h-3 text-[#c48820] ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
          </span>
        )}

        <div className="text-white/50 pl-0.5" aria-hidden="true">
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </div>
      </motion.button>
    </div>
  );
}
