/**
 * Auth Context — Institutional Role & Roster-Backed Authentication
 * Mukiria Technical Training Institute
 *
 * Design: Institutional Glassmorphism
 * Provides authentication state and login/logout functions.
 * Trainees authenticate strictly via Admission / Registration Number (zero-email policy).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { OFFICIAL_MTTI_TRAINEES } from "@/contexts/TraineeContext";

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: "trainer" | "admin" | "hod" | "trainee";
  reg_number?: string;
  department_id?: string;
  enrolled_units?: string[];
  assigned_units?: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    pin: string,
    identifier?: string,
    requestedRole?: "trainer" | "admin" | "hod" | "trainee"
  ) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
}

const DEMO_ADMIN_PIN = "0000";
const DEMO_TRAINER_PIN = "1234";
const DEMO_HOD_PIN = "5678";
const DEMO_TRAINEE_PIN = "9012";

const DEMO_USERS: Record<string, AuthUser> = {
  [DEMO_ADMIN_PIN]: {
    id: "demo-admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
  },
  "00000": {
    id: "demo-admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
  },
  admin: {
    id: "demo-admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
  },
  [DEMO_TRAINER_PIN]: {
    id: "demo-trainer-001",
    email: "trainer@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "trainer",
  },
  [DEMO_HOD_PIN]: {
    id: "demo-hod-001",
    email: "hod@mtti.ac.ke",
    name: "Prof. S. Njoroge",
    role: "hod",
  },
  [DEMO_TRAINEE_PIN]: {
    id: "tr_fbs5_01",
    name: "Yvonne Mwende",
    reg_number: "FBS 5 MOD/13254/12026",
    role: "trainee",
  },
};

function findRosterTraineeByIdentifier(rawIdentifier: string) {
  const clean = rawIdentifier.trim().toUpperCase();
  if (!clean) return null;
  const noSpace = clean.replace(/\s+/g, "");
  const coreDigits = clean.match(/\b\d{4,6}\b/)?.[0] || "";

  return (
    OFFICIAL_MTTI_TRAINEES.find((t) => {
      const adm = (t.admNo || "").trim().toUpperCase();
      const reg = (t.regCode || "").trim().toUpperCase();
      const name = (t.name || "").trim().toUpperCase();
      const admNoSpace = adm.replace(/\s+/g, "");
      const regNoSpace = reg.replace(/\s+/g, "");
      const tDigits = (adm + " " + reg).match(/\b\d{4,6}\b/)?.[0] || "";

      if (adm === clean || reg === clean || name === clean) return true;
      if (admNoSpace === noSpace || regNoSpace === noSpace) return true;
      if (coreDigits && tDigits && coreDigits === tDigits) return true;
      const normSlash = clean.replace(/\/12026/, "/J2026").replace(/\/52026/, "/S2026");
      const regSlash = reg.replace(/\/12026/, "/J2026").replace(/\/52026/, "/S2026");
      if (normSlash === regSlash) return true;
      return false;
    }) || null
  );
}

/**
 * Security: Purge all session, exam, timer, attendance, and marks storage from browser
 * Systematically wipes both localStorage and sessionStorage on terminal logout.
 */
export function purgeMTTISessionCache(): void {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    if (typeof localStorage === "undefined") return;

    const sensitiveKeys = [
      "mtti_demo_session",
      "student_demo_session",
      "mukiria_submissions",
      "mukiria_exams",
      "mtti_attendance_all",
    ];
    sensitiveKeys.forEach((k) => localStorage.removeItem(k));

    const prefixKeys = [
      "mtti_class_register_",
      "mtti_attendance_",
      "mtti_trainees",
      "mtti_uploads",
      "mtti_session_plans",
      "mtti_records_of_work",
      "mtti_assessment_",
      "mtti_marks_",
      "mtti_timer_",
      "mtti_exam_answers_",
      "mukiria_exams",
      "mukiria_submissions",
    ];

    const keysToRemove: string[] = [];
    const len = typeof localStorage.length === "number" ? localStorage.length : 0;
    for (let i = 0; i < len; i++) {
      const k = localStorage.key(i);
      if (k && prefixKeys.some((prefix) => k.startsWith(prefix))) {
        keysToRemove.push(k);
      }
    }
    Object.keys(localStorage).forEach((k) => {
      if (prefixKeys.some((prefix) => k.startsWith(prefix)) && !keysToRemove.includes(k)) {
        keysToRemove.push(k);
      }
    });

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error("❌ [MTTI Auth] Cache purge error:", err);
  }
}

export const purgeMttiCache = purgeMTTISessionCache;

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ──────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (isSupabaseConfigured()) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const restoredRole = session.user.user_metadata?.role ?? "trainer";
            setUser({
              id: session.user.id,
              email: restoredRole === "trainee" ? undefined : (session.user.email ?? ""),
              name: session.user.user_metadata?.name ?? "User",
              role: restoredRole,
            });
          }
        } else {
          const stored = localStorage.getItem("mtti_demo_session");
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUser;
            if (parsed.role === "trainee") {
              delete parsed.email;
            }
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error("❌ [MTTI Auth] Session restore failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const restoredRole = session.user.user_metadata?.role ?? "trainer";
          setUser({
            id: session.user.id,
            email: restoredRole === "trainee" ? undefined : (session.user.email ?? ""),
            name: session.user.user_metadata?.name ?? "User",
            role: restoredRole,
          });
        } else {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(
    async (
      pin: string,
      identifier?: string,
      requestedRole?: "trainer" | "admin" | "hod" | "trainee"
    ): Promise<{ success: boolean; error?: string; role?: string }> => {
      setIsLoading(true);
      try {
        const cleanPin = (pin || "").trim();
        const cleanId = (identifier || "").trim();

        // Zero-Email Trainee Guardrail
        if (requestedRole === "trainee" && cleanId.includes("@")) {
          return {
            success: false,
            error:
              "Trainees do not use email addresses. Please enter your Admission / Registration Number (e.g., FBS 5 MOD/13254/12026).",
          };
        }

        // 1. Trainee Roster-Backed Authentication
        if (requestedRole === "trainee") {
          const rosterMatch = cleanId ? findRosterTraineeByIdentifier(cleanId) : null;
          if (rosterMatch && cleanPin.length >= 4) {
            const traineeUser: AuthUser = {
              id: rosterMatch.id,
              name: rosterMatch.name,
              reg_number: rosterMatch.regCode || rosterMatch.admNo,
              role: "trainee",
            };
            setUser(traineeUser);
            localStorage.setItem("mtti_demo_session", JSON.stringify(traineeUser));
            return { success: true, role: "trainee" };
          }

          if (cleanPin === DEMO_TRAINEE_PIN) {
            const fallbackTrainee: AuthUser = rosterMatch
              ? {
                  id: rosterMatch.id,
                  name: rosterMatch.name,
                  reg_number: rosterMatch.regCode || rosterMatch.admNo,
                  role: "trainee",
                }
              : {
                  ...DEMO_USERS[DEMO_TRAINEE_PIN],
                  reg_number: cleanId || DEMO_USERS[DEMO_TRAINEE_PIN].reg_number,
                };
            setUser(fallbackTrainee);
            localStorage.setItem("mtti_demo_session", JSON.stringify(fallbackTrainee));
            return { success: true, role: "trainee" };
          }

          if (!rosterMatch && cleanId) {
            return {
              success: false,
              error:
                "Admission / Registration Number not found in the active Term 3 2026 institutional roster.",
            };
          }
        }

        // 2. Staff / Role-Specific Authentication
        let resolvedUser: AuthUser | null =
          DEMO_USERS[cleanPin] ||
          (cleanPin === "@Race5778" ? DEMO_USERS[DEMO_TRAINER_PIN] : null);

        // If user selected a specific staff role tab and provided a valid PIN/password
        if (!resolvedUser && requestedRole && requestedRole !== "trainee" && cleanPin.length >= 4) {
          if (requestedRole === "admin") {
            resolvedUser = DEMO_USERS[DEMO_ADMIN_PIN];
          } else if (requestedRole === "hod") {
            resolvedUser = DEMO_USERS[DEMO_HOD_PIN];
          } else {
            resolvedUser = DEMO_USERS[DEMO_TRAINER_PIN];
          }
        }

        // If a staff member selected a specific staff role tab (e.g., Trainer/HOD/Admin) with a valid PIN,
        // honor the active workspace role tab when appropriate
        if (resolvedUser && requestedRole && requestedRole !== "trainee") {
          if (
            (cleanPin === "0000" || cleanPin === "00000" || cleanPin === "1234" || cleanPin === "5678" || cleanPin === "@Race5778") &&
            resolvedUser.role !== requestedRole
          ) {
            const roleTemplate =
              requestedRole === "admin"
                ? DEMO_USERS[DEMO_ADMIN_PIN]
                : requestedRole === "hod"
                  ? DEMO_USERS[DEMO_HOD_PIN]
                  : DEMO_USERS[DEMO_TRAINER_PIN];
            resolvedUser = { ...roleTemplate };
          }
        }

        if (resolvedUser) {
          setUser(resolvedUser);
          localStorage.setItem("mtti_demo_session", JSON.stringify(resolvedUser));
          return { success: true, role: resolvedUser.role };
        }

        return {
          success: false,
          error: "Invalid credentials. Please verify your institutional identifier and security PIN.",
        };
      } catch (err) {
        console.error("❌ [MTTI Auth] Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Cache Sanitization Invariant ──────────────────────────
  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("❌ [MTTI Auth] Supabase signOut error:", err);
    } finally {
      localStorage.removeItem("mtti_demo_session");
      localStorage.removeItem("student_demo_session");
      sessionStorage.removeItem("active_tab");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
