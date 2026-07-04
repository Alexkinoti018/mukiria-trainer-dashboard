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

// ─── Types ───────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "trainer" | "admin";
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ─── Demo PIN Credentials ─────────────────────────────────────
// In production, use Supabase Auth with email/password.
// For demo mode, PIN "1234" maps to trainer@mtti.ac.ke
const DEMO_PIN = "1234";
const DEMO_USER: AuthUser = {
  id: "demo-trainer-001",
  email: "trainer@mtti.ac.ke",
  name: "Dr. J. Muriithi",
  role: "trainer",
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
              name: session.user.user_metadata?.name ?? "Trainer",
              role: "trainer",
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
            name: session.user.user_metadata?.name ?? "Trainer",
            role: "trainer",
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
    async (pin: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        // DEMO MODE: Bypass Supabase for testing - always use demo mode
        // Demo mode: validate against hardcoded PIN or full password
        if (pin === DEMO_PIN || pin === "@Race5778") {
          setUser(DEMO_USER);
          localStorage.setItem(
            "mtti_demo_session",
            JSON.stringify(DEMO_USER)
          );
          console.log("✅ [MTTI Auth] Demo login successful");
          return { success: true };
        } else {
          console.warn("⚠️ [MTTI Auth] Invalid PIN attempt");
          return {
            success: false,
            error: "Invalid PIN. Try 1234 or @Race5778.",
          };
        }

        return { success: false, error: "Authentication failed." };
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
      localStorage.removeItem("mtti_demo_session");
      setUser(null);
      console.log("✅ [MTTI Auth] Logged out successfully");
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
