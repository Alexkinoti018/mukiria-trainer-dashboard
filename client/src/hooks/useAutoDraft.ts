import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useAutoDraft Hook
 *
 * Provides a debounced, type-safe local storage auto-save mechanism for candidate exam answers
 * and assessment forms. Protects candidates from unsubmitted answer loss during accidental refreshes,
 * connection drops, or power fluctuations.
 *
 * @param storageKey Scoped localStorage key (e.g. `mtti_exam_answers_${examId}_${traineeId}`)
 * @param initialData Fallback data if no draft exists
 * @param debounceMs Delay before writing to storage (default: 1000ms)
 * @param options Configuration options (`enabled`, `onSave` callback)
 */
export function useAutoDraft<T>(
  storageKey: string,
  initialData: T,
  debounceMs: number = 1000,
  options?: {
    enabled?: boolean;
    onSave?: (savedData: T) => void;
  }
): {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  isSaving: boolean;
  lastSaved: Date | null;
  clearDraft: () => void;
  forceSave: () => void;
} {
  // Rehydrate initial state on mount if storageKey is available
  const [data, setData] = useState<T>(() => {
    if (typeof window === "undefined" || !storageKey) {
      return initialData;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null && stored !== "") {
        return JSON.parse(stored) as T;
      }
    } catch (err) {
      console.warn(`[useAutoDraft] Failed to parse draft for key "${storageKey}":`, err);
    }
    return initialData;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        if (localStorage.getItem(storageKey) !== null) {
          return new Date();
        }
      } catch {}
    }
    return null;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getInitialSerialized = (): string => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) return stored;
      } catch {}
    }
    return JSON.stringify(initialData);
  };
  const lastSavedDataRef = useRef<string>(getInitialSerialized());
  const dataRef = useRef<T>(data);
  const optionsRef = useRef(options);
  const isHydratedForKeyRef = useRef<string>(storageKey);

  // Keep refs synchronized
  dataRef.current = data;
  optionsRef.current = options;

  // Handle dynamic changes to storageKey (e.g. when exam finishes loading)
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (isHydratedForKeyRef.current === storageKey) return;

    isHydratedForKeyRef.current = storageKey;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null && stored !== "") {
        const parsed = JSON.parse(stored) as T;
        setData(parsed);
        lastSavedDataRef.current = stored;
        setLastSaved(new Date());
      } else {
        lastSavedDataRef.current = JSON.stringify(dataRef.current);
      }
    } catch (err) {
      console.warn(`[useAutoDraft] Hydration error for key "${storageKey}":`, err);
    }
  }, [storageKey]);

  // Debounced save effect
  useEffect(() => {
    const isEnabled = options?.enabled !== false;
    if (!isEnabled || !storageKey || typeof window === "undefined") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsSaving(false);
      return;
    }

    let serialized: string;
    try {
      serialized = JSON.stringify(data);
    } catch (err) {
      console.warn(`[useAutoDraft] Serialization error for key "${storageKey}":`, err);
      return;
    }

    // If data hasn't changed compared to last saved snapshot, skip
    if (serialized === lastSavedDataRef.current) {
      return;
    }

    setIsSaving(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, serialized);
        lastSavedDataRef.current = serialized;
        setLastSaved(new Date());
        setIsSaving(false);
        optionsRef.current?.onSave?.(data);
      } catch (err) {
        console.warn(`[useAutoDraft] Save failed for key "${storageKey}":`, err);
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, storageKey, debounceMs, options?.enabled]);

  // Force immediate synchronous save without waiting for debounce timer
  const forceSave = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      const serialized = JSON.stringify(dataRef.current);
      localStorage.setItem(storageKey, serialized);
      lastSavedDataRef.current = serialized;
      setLastSaved(new Date());
      setIsSaving(false);
      optionsRef.current?.onSave?.(dataRef.current);
    } catch (err) {
      console.warn(`[useAutoDraft] Force save failed for key "${storageKey}":`, err);
      setIsSaving(false);
    }
  }, [storageKey]);

  // Clear draft from storage and reset tracking state
  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (storageKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.warn(`[useAutoDraft] Clear draft failed for key "${storageKey}":`, err);
      }
    }
    lastSavedDataRef.current = "";
    setIsSaving(false);
    setLastSaved(null);
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    isSaving,
    lastSaved,
    clearDraft,
    forceSave,
  };
}
