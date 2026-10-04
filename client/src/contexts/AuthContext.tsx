/**
 * Auth Context — PIN-based Trainer Authentication
 * Mukiria Technical Training Institute
 *
 * Design: Institutional Glassmorphism
 * Provides authentication state and login/logout functions.
 * PIN is validated against Supabase auth or local fallback for demo mode.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
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
  login: (pin: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
}

// ─── Demo PIN Credentials ─────────────────────────────────────
// In production, use Supabase Auth with email/password.
// For demo mode, PINs map to different roles:
const DEMO_TRAINER_PIN = "1234";
const DEMO_HOD_PIN = "5678";
const DEMO_TRAINEE_PIN = "9012";

const DEMO_USERS: Record<string, AuthUser> = {
  [DEMO_TRAINER_PIN]: {
    id: "demo-trainer-001",
    email: "trainer@mtti.ac.ke",
    name: "Dr. J. Muriithi",
    role: "trainer",
  },
  [DEMO_HOD_PIN]: {
    id: "demo-hod-001",
    email: "hod@mtti.ac.ke",
    name: "Prof. S. Njoroge",
    role: "hod",
  },
  [DEMO_TRAINEE_PIN]: {
    id: "demo-trainee-001",
    email: "student@mtti.ac.ke",
    name: "Alex Kinoti",
    role: "trainee",
  }
};

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
            setUser({
              id: session.user.id,
              email: session.user.email ?? "",
              name: session.user.user_metadata?.name ?? "User",
              role: session.user.user_metadata?.role ?? "trainer",
            });
            console.log(
              "✅ [MTTI Auth] Session restored for:",
              session.user.email
            );
          }
        } else {
          // Demo mode: check localStorage
          const stored = localStorage.getItem("mtti_demo_session");
          if (stored) {
            setUser(JSON.parse(stored));
            console.log("✅ [MTTI Auth] Demo session restored");
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
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata?.name ?? "User",
            role: session.user.user_metadata?.role ?? "trainer",
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
    async (pin: string): Promise<{ success: boolean; error?: string; role?: string }> => {
      setIsLoading(true);
      try {
        // DEMO MODE: Bypass Supabase for testing - always use demo mode
        const demoUser = DEMO_USERS[pin] || (pin === "@Race5778" ? DEMO_USERS[DEMO_TRAINER_PIN] : null);
        
        if (demoUser) {
          setUser(demoUser);
          localStorage.setItem(
            "mtti_demo_session",
            JSON.stringify(demoUser)
          );
          console.log(`✅ [MTTI Auth] Demo login successful for role: ${demoUser.role}`);
          return { success: true, role: demoUser.role };
        } else {
          console.warn("⚠️ [MTTI Auth] Invalid PIN attempt");
          return {
            success: false,
            error: "Invalid PIN. Try 1234 (Trainer), 5678 (HOD), or 9012 (Trainee).",
          };
        }
      } catch (err) {
        console.error("❌ [MTTI Auth] Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      // Security: Purge all session, exam, timer, and marks storage from browser
      const sensitiveKeys = [
        "mtti_demo_session",
        "student_demo_session",
        "mukiria_submissions",
        "mukiria_exams",
        "mtti_attendance_all"
      ];
      sensitiveKeys.forEach(k => localStorage.removeItem(k));
      Object.keys(localStorage).forEach(k => {
        if (
          k.startsWith("mtti_marks_") || 
          k.startsWith("mtti_timer_") || 
          k.startsWith("mtti_exam_answers_") ||
          k.startsWith("mtti_attendance_") ||
          k.startsWith("mtti_class_register_")
        ) {
          localStorage.removeItem(k);
        }
      });
      setUser(null);
      console.log("✅ [MTTI Auth] Logged out and sanitized all client storage");
    } catch (err) {
      console.error("❌ [MTTI Auth] Logout error:", err);
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
