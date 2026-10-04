/**
 * Inactivity Timer Hook — MTTI Shared Terminal Security
 * Mukiria Technical Training Institute
 *
 * Automatically tracks user inactivity across shared TVET workstations,
 * triggers an advance warning modal, and executes automatic session termination
 * and cache sanitization to prevent unauthorized access and privilege leakage.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface IdleTimerOptions {
  /**
   * Total inactive duration before timeout in milliseconds.
   * Default: 15 minutes (900,000ms)
   */
  timeoutMs?: number;

  /**
   * Threshold before timeoutMs when the warning prompt should appear in milliseconds.
   * Default: 60 seconds (60,000ms)
   */
  promptBeforeMs?: number;

  /**
   * Callback invoked when the inactivity enters the warning window.
   */
  onPrompt?: () => void;

  /**
   * Callback invoked when inactivity reaches timeoutMs (e.g. forced logout).
   */
  onIdle?: () => void;

  /**
   * Callback invoked when user becomes active or resets the idle state.
   */
  onActive?: () => void;

  /**
   * Whether idle tracking is enabled (typically true only when authenticated).
   * Default: true
   */
  enabled?: boolean;

  /**
   * Throttle duration for DOM activity events in milliseconds.
   * Default: 500ms
   */
  throttleMs?: number;
}

export interface UseIdleTimerReturn {
  /**
   * Whether the warning prompt dialog should currently be displayed.
   */
  isPrompted: boolean;

  /**
   * Remaining seconds before total session termination.
   */
  remainingSeconds: number;

  /**
   * Remaining milliseconds before total session termination.
   */
  remainingMs: number;

  /**
   * Resets the inactivity timer to full duration and dismisses warning prompt.
   */
  reset: () => void;

  /**
   * Pauses idle tracking (e.g., during active uploads or modal operations).
   */
  pause: () => void;

  /**
   * Resumes idle tracking from current moment.
   */
  resume: () => void;

  /**
   * Returns current remaining milliseconds until idle timeout.
   */
  getRemainingTime: () => number;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_PROMPT_BEFORE_MS = 60 * 1000;  // 60 seconds
const DEFAULT_THROTTLE_MS = 500;

export function useIdleTimer({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  promptBeforeMs = DEFAULT_PROMPT_BEFORE_MS,
  onPrompt,
  onIdle,
  onActive,
  enabled = true,
  throttleMs = DEFAULT_THROTTLE_MS,
}: IdleTimerOptions = {}): UseIdleTimerReturn {
  const [isPrompted, setIsPrompted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(timeoutMs / 1000));
  const [remainingMs, setRemainingMs] = useState(timeoutMs);

  const lastActiveRef = useRef<number>(Date.now());
  const lastEventThrottleRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isPromptedRef = useRef<boolean>(false);

  // Keep callback refs fresh without resetting effect listeners
  const onPromptRef = useRef(onPrompt);
  const onIdleRef = useRef(onIdle);
  const onActiveRef = useRef(onActive);

  useEffect(() => {
    onPromptRef.current = onPrompt;
    onIdleRef.current = onIdle;
    onActiveRef.current = onActive;
  }, [onPrompt, onIdle, onActive]);

  const getRemainingTime = useCallback(() => {
    if (!enabled || isPausedRef.current) return timeoutMs;
    const elapsed = Date.now() - lastActiveRef.current;
    return Math.max(0, timeoutMs - elapsed);
  }, [enabled, timeoutMs]);

  const reset = useCallback(() => {
    lastActiveRef.current = Date.now();
    setRemainingMs(timeoutMs);
    setRemainingSeconds(Math.ceil(timeoutMs / 1000));

    if (isPromptedRef.current) {
      isPromptedRef.current = false;
      setIsPrompted(false);
      onActiveRef.current?.();
    }
  }, [timeoutMs]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    lastActiveRef.current = Date.now();
  }, []);

  // ─── Activity Event Listener ───────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      setIsPrompted(false);
      isPromptedRef.current = false;
      return;
    }

    // Initialize timer on enable
    lastActiveRef.current = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastEventThrottleRef.current < throttleMs) {
        return;
      }
      lastEventThrottleRef.current = now;

      if (isPausedRef.current) {
        return;
      }

      // If user interacts while warning prompt is open, reset and dismiss warning
      if (isPromptedRef.current) {
        isPromptedRef.current = false;
        setIsPrompted(false);
        lastActiveRef.current = now;
        onActiveRef.current?.();
        return;
      }

      lastActiveRef.current = now;
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleUserActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, throttleMs]);

  // ─── Ticking Interval ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const elapsed = now - lastActiveRef.current;
      const leftMs = Math.max(0, timeoutMs - elapsed);
      const leftSec = Math.ceil(leftMs / 1000);

      setRemainingMs(leftMs);
      setRemainingSeconds(leftSec);

      // Timeout condition
      if (leftMs <= 0) {
        if (isPromptedRef.current) {
          isPromptedRef.current = false;
          setIsPrompted(false);
        }
        onIdleRef.current?.();
      } else if (leftMs <= promptBeforeMs) {
        // Warning threshold condition
        if (!isPromptedRef.current) {
          isPromptedRef.current = true;
          setIsPrompted(true);
          onPromptRef.current?.();
        }
      }
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, timeoutMs, promptBeforeMs]);

  return {
    isPrompted,
    remainingSeconds,
    remainingMs,
    reset,
    pause,
    resume,
    getRemainingTime,
  };
}
