import { describe, it, expect, beforeEach, beforeAll } from "vitest";

// Provide Storage mock for Node test runner environment
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

beforeAll(() => {
  if (typeof globalThis.localStorage === "undefined") {
    (globalThis as any).localStorage = new MockStorage();
  }
  if (typeof globalThis.sessionStorage === "undefined") {
    (globalThis as any).sessionStorage = new MockStorage();
  }
});

import { purgeMTTISessionCache } from "../client/src/contexts/AuthContext";

describe("MTTI Terminal Security: purgeMTTISessionCache()", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("purges all scoped and explicit MTTI session keys from localStorage and sessionStorage", () => {
    // Seed storage with typical session data
    localStorage.setItem("mtti_demo_session", JSON.stringify({ role: "trainer" }));
    localStorage.setItem("student_demo_session", JSON.stringify({ role: "trainee" }));
    localStorage.setItem("mukiria_exams", JSON.stringify([{ id: "ex-1" }]));
    localStorage.setItem("mukiria_submissions", JSON.stringify([{ id: "sub-1" }]));
    localStorage.setItem("mtti_attendance_all", JSON.stringify([{ id: "att-1" }]));
    localStorage.setItem("mtti_marks_uo_1", JSON.stringify([{ score: 85 }]));
    localStorage.setItem("mtti_timer_IT101", "1800");
    localStorage.setItem("mtti_exam_answers_ex_1_trainee_1", JSON.stringify({ q1: "A" }));
    localStorage.setItem("mtti_attendance_2026_09", JSON.stringify({ present: true }));
    localStorage.setItem("mtti_class_register_groupA", JSON.stringify({ count: 25 }));
    localStorage.setItem("theme_preference", "dark"); // Unrelated app preference

    sessionStorage.setItem("active_tab", "grading");
    sessionStorage.setItem("draft_backup", "xyz");

    // Execute cache sanitization
    purgeMTTISessionCache();

    // Sensitive keys must be completely removed
    expect(localStorage.getItem("mtti_demo_session")).toBeNull();
    expect(localStorage.getItem("student_demo_session")).toBeNull();
    expect(localStorage.getItem("mukiria_exams")).toBeNull();
    expect(localStorage.getItem("mukiria_submissions")).toBeNull();
    expect(localStorage.getItem("mtti_attendance_all")).toBeNull();
    expect(localStorage.getItem("mtti_marks_uo_1")).toBeNull();
    expect(localStorage.getItem("mtti_timer_IT101")).toBeNull();
    expect(localStorage.getItem("mtti_exam_answers_ex_1_trainee_1")).toBeNull();
    expect(localStorage.getItem("mtti_attendance_2026_09")).toBeNull();
    expect(localStorage.getItem("mtti_class_register_groupA")).toBeNull();

    // Session storage must be completely cleared
    expect(sessionStorage.getItem("active_tab")).toBeNull();
    expect(sessionStorage.getItem("draft_backup")).toBeNull();

    // Non-mtti settings remain intact
    expect(localStorage.getItem("theme_preference")).toBe("dark");
  });

  it("handles empty storage gracefully without throwing", () => {
    expect(() => purgeMTTISessionCache()).not.toThrow();
  });
});

describe("Inactivity Idle Calculation & Threshold Logic", () => {
  it("calculates remaining time correctly", () => {
    const timeoutMs = 15 * 60 * 1000; // 900,000ms
    const promptBeforeMs = 60 * 1000;  // 60,000ms
    const warningThresholdMs = timeoutMs - promptBeforeMs; // 840,000ms (14 min)

    expect(warningThresholdMs).toBe(840000);

    const checkState = (elapsedMs: number) => {
      const remainingMs = Math.max(0, timeoutMs - elapsedMs);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const shouldPrompt = remainingMs <= promptBeforeMs && remainingMs > 0;
      const isIdle = remainingMs <= 0;
      return { remainingMs, remainingSeconds, shouldPrompt, isIdle };
    };

    // 5 minutes in: Not prompted, not idle
    const state5Min = checkState(5 * 60 * 1000);
    expect(state5Min.shouldPrompt).toBe(false);
    expect(state5Min.isIdle).toBe(false);
    expect(state5Min.remainingSeconds).toBe(600); // 10 minutes left

    // 14 minutes in (exactly 60 seconds left): Should prompt warning
    const state14Min = checkState(14 * 60 * 1000);
    expect(state14Min.shouldPrompt).toBe(true);
    expect(state14Min.isIdle).toBe(false);
    expect(state14Min.remainingSeconds).toBe(60);

    // 14 minutes 45 seconds in (15 seconds left): Prompt active
    const state14Min45s = checkState(14 * 60 * 1000 + 45 * 1000);
    expect(state14Min45s.shouldPrompt).toBe(true);
    expect(state14Min45s.isIdle).toBe(false);
    expect(state14Min45s.remainingSeconds).toBe(15);

    // 15 minutes in (0 seconds left): Idle triggered
    const state15Min = checkState(15 * 60 * 1000);
    expect(state15Min.isIdle).toBe(true);
    expect(state15Min.remainingSeconds).toBe(0);
  });
});
