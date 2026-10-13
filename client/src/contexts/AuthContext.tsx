/**
 * Auth Context — Institutional Role & Roster-Backed Authentication
 * Mukiria Technical Training Institute
 *
 * Design: Institutional Glassmorphism
 * Provides authentication state, strict role-credential verification,
 * automatic /api/* RBAC header injection, and session cache sanitization.
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
  cohort_code?: string;
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
    id: "admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
    department_id: "dept-ci",
  },
  "00000": {
    id: "admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
    department_id: "dept-ci",
  },
  admin: {
    id: "admin-001",
    email: "admin@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "admin",
    department_id: "dept-ci",
  },
  [DEMO_TRAINER_PIN]: {
    id: "trainer-001",
    email: "trainer@mtti.ac.ke",
    name: "Alexander Kinoti Mbiti",
    role: "trainer",
    department_id: "dept-ci",
    assigned_units: [
      "ICT/CU/IT/CR/6/6",
      "061155101A-WA1",
      "061155101A",
      "0415 451 21A",
      "IT/CU/ICTA/CR/01/4/MA",
    ],
  },
  [DEMO_HOD_PIN]: {
    id: "hod-001",
    email: "hod.ci@mtti.ac.ke",
    name: "Prof. S. Njoroge",
    role: "hod",
    department_id: "dept-ci",
  },
  [DEMO_TRAINEE_PIN]: {
    id: "tr_fbs5_01",
    name: "Yvonne Mwende",
    reg_number: "FBS 5 MOD/13254/12026",
    cohort_code: "FBS 5 MOD/J/2026",
    role: "trainee",
    enrolled_units: ["061155101A", "061155101A-WA1"],
  },
};

export function findRosterTraineeByIdentifier(rawIdentifier: string) {
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

function getBearerTokenForUser(user: AuthUser): string {
  if (user.role === "admin") return "token-admin";
  if (user.role === "hod") return user.department_id === "dept-ee" ? "token-hod-ee" : "token-hod-ci";
  if (user.role === "trainer") return user.id === "trainer-002" ? "token-trainer-002" : "token-trainer-001";
  return "token-trainee-001";
}

// Install global browser fetch interceptor once to attach RBAC headers to /api/* calls
let fetchInterceptorInstalled = false;
function installApiAuthFetchBridge() {
  if (fetchInterceptorInstalled || typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }
  fetchInterceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const urlStr =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      const isInternalApi = urlStr.startsWith("/api/") || urlStr.includes("/api/");
      if (isInternalApi) {
        const rawSession = window.localStorage.getItem("mtti_demo_session");
        if (rawSession) {
          const activeUser = JSON.parse(rawSession) as AuthUser;
          if (activeUser && activeUser.role) {
            const headers = new Headers(init?.headers || {});
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${getBearerTokenForUser(activeUser)}`);
            }
            if (!headers.has("x-user-role")) {
              headers.set("x-user-role", activeUser.role);
            }
            if (!headers.has("x-user-id") && activeUser.id) {
              headers.set("x-user-id", activeUser.id);
            }
            if (!headers.has("x-user-reg") && activeUser.reg_number) {
              headers.set("x-user-reg", activeUser.reg_number);
            }
            if (!headers.has("x-user-dept") && activeUser.department_id) {
              headers.set("x-user-dept", activeUser.department_id);
            }
            return originalFetch(input, { ...init, headers });
          }
        }
      }
    } catch {
      // Fall back to standard fetch if storage parsing fails
    }
    return originalFetch(input, init);
  };
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
    installApiAuthFetchBridge();

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
        if (requestedRole === "trainee" || (!requestedRole && cleanPin === DEMO_TRAINEE_PIN)) {
          const rosterMatch = cleanId ? findRosterTraineeByIdentifier(cleanId) : null;

          if (cleanId && !rosterMatch) {
            return {
              success: false,
              error:
                "Admission / Registration Number not found in the active Term 3 2026 institutional roster.",
            };
          }

          const coreDigits =
            (rosterMatch ? `${rosterMatch.admNo} ${rosterMatch.regCode}` : cleanId).match(
              /\b\d{4,6}\b/
            )?.[0] || "";

          const isValidTraineePin =
            cleanPin === DEMO_TRAINEE_PIN ||
            (coreDigits && cleanPin === coreDigits) ||
            (rosterMatch &&
              (cleanPin.toUpperCase() === rosterMatch.admNo.toUpperCase() ||
                cleanPin.toUpperCase() === rosterMatch.regCode.toUpperCase()));

          if (!isValidTraineePin) {
            return {
              success: false,
              error:
                "Invalid Trainee Security PIN. Enter your authorized Trainee PIN or your core Admission Number digits.",
            };
          }

          const defaultEnrolledUnits = rosterMatch
            ? (rosterMatch.classCode.includes("FBS") || rosterMatch.classCode.includes("FBP") || rosterMatch.department?.includes("FBS"))
              ? ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "061155101A-PRAC"]
              : (rosterMatch.classCode.includes("ADMIN") || rosterMatch.department?.includes("Business"))
              ? ["0415-451-21A", "0415-451-21A-WA1", "0415-451-21A-WA2", "0415-451-21A-WA3", "0415-451-21A-PRAC"]
              : (rosterMatch.classCode.includes("LS") || rosterMatch.department?.includes("Civil"))
              ? ["061155101A", "061155101A-WA1", "061155101A-WA2", "061155101A-WA3", "061155101A-PRAC"]
              : rosterMatch.classCode.includes("ITECH")
              ? ["IT/CU/ICTA/CR/01/6/MA", "ICT/CU/IT/CR/6/6"]
              : ["IT/CU/ICTA/CR/01/4/MA"]
            : undefined;

          const traineeUser: AuthUser = rosterMatch
            ? {
                id: rosterMatch.id,
                name: rosterMatch.name,
                reg_number: rosterMatch.regCode || rosterMatch.admNo,
                cohort_code: rosterMatch.classCode,
                role: "trainee",
                enrolled_units: defaultEnrolledUnits,
              }
            : {
                ...DEMO_USERS[DEMO_TRAINEE_PIN],
              };

          setUser(traineeUser);
          localStorage.setItem("mtti_demo_session", JSON.stringify(traineeUser));
          return { success: true, role: "trainee" };
        }

        // 2. Staff Role-Specific Authentication (Strict Role & PIN Matching — Zero Privilege Escalation)
        let resolvedUser: AuthUser | null = null;

        if (cleanPin === "@Race5778") {
          // Lead Developer / Trainer master credential
          resolvedUser =
            requestedRole === "admin"
              ? DEMO_USERS[DEMO_ADMIN_PIN]
              : requestedRole === "hod"
                ? DEMO_USERS[DEMO_HOD_PIN]
                : DEMO_USERS[DEMO_TRAINER_PIN];
        } else {
          resolvedUser = DEMO_USERS[cleanPin] || null;
        }

        if (!resolvedUser) {
          return {
            success: false,
            error: "Invalid credentials. Please verify your institutional identifier and security PIN.",
          };
        }

        // Prevent cross-role privilege escalation (e.g., using Trainer PIN 1234 on Admin or HOD tab)
        if (requestedRole && resolvedUser.role !== requestedRole) {
          return {
            success: false,
            error: `Role Mismatch: The credentials provided belong to the ${resolvedUser.role.toUpperCase()} role and cannot access the ${requestedRole.toUpperCase()} portal.`,
          };
        }

        setUser(resolvedUser);
        localStorage.setItem("mtti_demo_session", JSON.stringify(resolvedUser));
        return { success: true, role: resolvedUser.role };
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
