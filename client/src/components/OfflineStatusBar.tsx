/**
 * MTTI Institutional Offline Status Bar & Sync Control
 * Displays live network connectivity, pending buffer count, conflict alerts,
 * and provides manual sync triggers alongside the Dead-Letter Queue (DLQ) Inspector.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronUp,
  ChevronDown,
  Database,
  ShieldCheck,
  Trash2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useSyncStatus } from "@/lib/syncEngine";
import type { FailedSyncItem } from "@/lib/offlineStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function OfflineStatusBar() {
  const [location] = useLocation();
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedDlqCount,
    lastSyncTime,
    conflicts,
    syncNow,
    retryFailedItem,
    retryAllFailed,
    clearFailedItem,
    clearAllFailed,
    getFailedItems,
  } = useSyncStatus();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDlqOpen, setIsDlqOpen] = useState(false);
  const [failedItems, setFailedItems] = useState<FailedSyncItem[]>([]);
  const [isLoadingDlq, setIsLoadingDlq] = useState(false);

  // Load DLQ items whenever drawer opens or failed count changes
  const refreshDlqItems = async () => {
    setIsLoadingDlq(true);
    try {
      const items = await getFailedItems();
      setFailedItems(items);
    } catch {
      setFailedItems([]);
    } finally {
      setIsLoadingDlq(false);
    }
  };

  useEffect(() => {
    if (isDlqOpen) {
      refreshDlqItems();
    }
  }, [isDlqOpen, failedDlqCount]);

  if (location === "/" || location === "/login") {
    return null;
  }

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

  const handleRetrySingle = async (id: string, entityId: string) => {
    toast.loading(`Re-enqueuing ${entityId}...`, { id: "retry-dlq" });
    await retryFailedItem(id);
    await refreshDlqItems();
    toast.success(`Re-enqueued ${entityId} into sync buffer.`, { id: "retry-dlq" });
  };

  const handleClearSingle = async (id: string, entityId: string) => {
    await clearFailedItem(id);
    await refreshDlqItems();
    toast.info(`Dismissed ${entityId} from Dead-Letter Queue.`);
  };

  const handleRetryAll = async () => {
    toast.loading("Re-enqueuing all failed items...", { id: "retry-all-dlq" });
    const count = await retryAllFailed();
    await refreshDlqItems();
    setIsDlqOpen(false);
    toast.success(`Re-enqueued ${count} failed items into sync queue.`, { id: "retry-all-dlq" });
  };

  const handleClearAll = async () => {
    await clearAllFailed();
    await refreshDlqItems();
    toast.info("Cleared all items from Dead-Letter Queue.");
  };

  return (
    <>
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
              className="mb-2 w-84 p-4 rounded-xl border border-slate-300 bg-white text-[#0f172a] shadow-xl text-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#c48820]" aria-hidden="true" />
                  <span className="font-bold text-sm tracking-wide text-[#000953]">
                    MTTI Offline Resilience
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  aria-label="Close offline status panel"
                  className="text-slate-500 hover:text-[#0f172a] transition focus-visible:ring-2 focus-visible:ring-[#000953] rounded p-1"
                >
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Network Reachability:</span>
                  <span className={isOnline ? "text-emerald-700 font-bold" : "text-[#c48820] font-bold"}>
                    {isOnline ? "Connected to Cloud" : "Campus Disconnected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buffered Actions:</span>
                  <span className="font-bold text-[#0f172a]">
                    {pendingCount} action{pendingCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {lastSyncTime && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Last Flushed:</span>
                    <span>{new Date(lastSyncTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Dead-Letter Queue Diagnostic Alert */}
              {failedDlqCount > 0 && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <div className="flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                      <span>{failedDlqCount} Failed Sync{failedDlqCount !== 1 ? "s" : ""}</span>
                    </div>
                    <button
                      onClick={() => setIsDlqOpen(true)}
                      className="text-[11px] font-bold text-rose-700 hover:underline hover:text-rose-900"
                    >
                      Inspect
                    </button>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    Permanently rejected or exceeded retries. Subsequent queue items were isolated and processed.
                  </p>
                  <button
                    onClick={() => setIsDlqOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] transition shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Inspect / Retry Failed Syncs</span>
                  </button>
                </div>
              )}

              {conflicts.length > 0 && (
                <div className="p-2 rounded bg-amber-50 border border-[#c48820]/40 text-[#0f172a] text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold text-[#000953]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c48820]" aria-hidden="true" />
                    <span>Conflict Defense Active</span>
                  </div>
                  <p className="line-clamp-2 text-slate-700">{conflicts[0].reason}</p>
                </div>
              )}

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                aria-label="Flush sync queue to Supabase now"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#000953] hover:bg-[#000e7a] text-white font-bold text-xs transition disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#c48820]"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#c48820] ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
                {isSyncing ? "Flushing Queue..." : "Sync Now to Supabase"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Status Pill */}
        <motion.div layout className="flex items-center gap-1.5">
          {/* Failed DLQ Diagnostic Pill */}
          {failedDlqCount > 0 && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => setIsDlqOpen(true)}
              aria-label={`${failedDlqCount} sync items in dead letter queue. Click to inspect.`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
              <span>{failedDlqCount} Failed</span>
            </motion.button>
          )}

          <button
            role="button"
            aria-expanded={isExpanded}
            aria-label={`Connection status: ${isOnline ? "Online" : "Offline"}. ${pendingCount} buffered actions. Click to toggle details.`}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-md border cursor-pointer transition focus-visible:ring-2 focus-visible:ring-[#000953] ${
              isOnline
                ? pendingCount > 0
                  ? "bg-amber-50 border-[#c48820] text-[#000953]"
                  : "bg-white border-slate-300 text-[#0f172a] hover:border-[#000953]"
                : "bg-amber-50 border-[#c48820] text-[#000953]"
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {isOnline ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-[#c48820]" />
              )}

              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#c48820]" />
              )}
            </div>

            <span className="text-xs font-bold tracking-wide">
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
                className="p-1 rounded-full hover:bg-slate-200/60 transition"
              >
                <RefreshCw className={`w-3 h-3 text-[#c48820] ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
              </span>
            )}

            <div className="text-slate-500 pl-0.5" aria-hidden="true">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </div>
          </button>
        </motion.div>
      </div>

      {/* Dead-Letter Queue (DLQ) Drawer */}
      <Sheet open={isDlqOpen} onOpenChange={setIsDlqOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0">
          <SheetHeader className="p-4 border-b bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertOctagon className="w-5 h-5" />
                <SheetTitle className="text-base font-bold text-[#000953]">
                  Failed Syncs (DLQ)
                </SheetTitle>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {failedItems.length} Rejected
              </span>
            </div>
            <SheetDescription className="text-xs text-slate-600 mt-1">
              Actions moved to the Dead-Letter Queue after permanent rejection (HTTP 4xx or max attempts). Subsequent valid queue items were not blocked.
            </SheetDescription>
          </SheetHeader>

          {/* Drawer Action Toolbar */}
          {failedItems.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b text-xs">
              <span className="text-slate-500 font-medium">Batch Controls:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-600 px-2 py-1 rounded border hover:border-rose-300 transition text-[11px] font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
                <button
                  onClick={handleRetryAll}
                  className="flex items-center gap-1 bg-[#000953] hover:bg-[#000e7a] text-white px-2.5 py-1 rounded transition text-[11px] font-semibold shadow-xs"
                >
                  <RotateCcw className="w-3 h-3 text-[#c48820]" />
                  <span>Retry All ({failedItems.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Failed Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingDlq ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#000953] mb-2" />
                Loading rejected items...
              </div>
            ) : failedItems.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-[#000953]">Dead-Letter Queue is Empty</h4>
                <p className="text-xs max-w-xs mx-auto text-slate-500">
                  No permanently failing sync items. All offline lab buffers and background updates are cleanly reconciled.
                </p>
              </div>
            ) : (
              failedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#000953]">
                          {item.entity_id || item.id}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.action_type}
                        </span>
                        {item.status_code && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            HTTP {item.status_code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Failed at {new Date(item.failed_at).toLocaleTimeString()} ({item.attempts} attempt{item.attempts !== 1 ? "s" : ""})
                      </div>
                    </div>
                  </div>

                  {/* Server Error Reason */}
                  <div className="p-2 rounded bg-rose-50 border border-rose-200/70 text-rose-900 text-[11px] font-mono break-words leading-relaxed">
                    <span className="font-bold">Error: </span>
                    {item.error_reason || item.error || "Server rejected synchronization"}
                  </div>

                  {/* Per-Item Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleClearSingle(item.id, item.entity_id || item.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 rounded hover:bg-slate-50 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => handleRetrySingle(item.id, item.entity_id || item.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-[#000953] hover:bg-[#000e7a] text-white text-[11px] font-semibold rounded transition shadow-xs"
                    >
                      <RotateCcw className="w-3 h-3 text-[#c48820]" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <SheetFooter className="p-4 border-t bg-slate-50">
            <button
              onClick={() => setIsDlqOpen(false)}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
            >
              Close Inspector
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
