import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect, useLocation } from "wouter";
import { Loader2, ShieldAlert, AlertCircle, X } from "lucide-react";

export type InstitutionalRole = "trainer" | "admin" | "hod" | "trainee";

export const ACCESS_ALERT_STORAGE_KEY = "mtti_access_alert";

export const ACCESS_RESTRICTED_MESSAGE =
  "Access Restricted: You do not have permission to view that section. You have been redirected to your authorized workspace.";

export const ROLE_DASHBOARD_DESTINATIONS: Record<InstitutionalRole, string> = {
  trainee: "/trainee/dashboard",
  trainer: "/dashboard",
  hod: "/hod/dashboard",
  admin: "/admin",
};

/**
 * Resolves the canonical authorized workspace route for a given institutional role.
 */
export function getAuthorizedDashboard(role: InstitutionalRole): string {
  return ROLE_DASHBOARD_DESTINATIONS[role] || "/dashboard";
}

/**
 * Pure helper to evaluate RBAC route access and persist the institutional alert banner
 * in sessionStorage when an authenticated user attempts to visit an unauthorized route.
 */
export function evaluateProtectedRouteAccess(params: {
  isAuthenticated: boolean;
  user: { role: InstitutionalRole } | null;
  allowedRoles: InstitutionalRole[];
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}): {
  allowed: boolean;
  redirectTo: string | null;
  alertMessage: string | null;
} {
  const { isAuthenticated, user, allowedRoles, storage } = params;
  const targetStorage =
    storage ?? (typeof window !== "undefined" ? window.sessionStorage : undefined);

  if (!isAuthenticated || !user) {
    return {
      allowed: false,
      redirectTo: "/login",
      alertMessage: null,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    const destination = getAuthorizedDashboard(user.role);
    try {
      targetStorage?.setItem(ACCESS_ALERT_STORAGE_KEY, ACCESS_RESTRICTED_MESSAGE);
    } catch {
      // Ignore storage quota errors in restricted environments
    }
    return {
      allowed: false,
      redirectTo: destination,
      alertMessage: ACCESS_RESTRICTED_MESSAGE,
    };
  }

  let existingAlert: string | null = null;
  try {
    existingAlert = targetStorage?.getItem(ACCESS_ALERT_STORAGE_KEY) ?? null;
  } catch {
    existingAlert = null;
  }

  return {
    allowed: true,
    redirectTo: null,
    alertMessage: existingAlert,
  };
}

/**
 * High-visibility dismissible institutional RBAC Alert Banner displayed at the top
 * of a user's workspace after an unauthorized route redirection.
 */
export function AccessAlertBanner() {
  const [location] = useLocation();
  const [alertMessage, setAlertMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(ACCESS_ALERT_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(ACCESS_ALERT_STORAGE_KEY);
      setAlertMessage(stored);
    } catch {
      // Ignore storage read errors
    }
  }, [location]);

  if (!alertMessage) return null;

  const handleDismiss = () => {
    try {
      window.sessionStorage.removeItem(ACCESS_ALERT_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors
    }
    setAlertMessage(null);
  };

  return (
    <div
      role="alert"
      data-testid="rbac-access-alert-banner"
      className="w-full bg-amber-50 border-b-2 border-[#c48820] px-4 py-3 text-[#000953] shadow-sm z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c48820]/15 border border-[#c48820]/40 text-[#9a6812] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#000953]">
            <AlertCircle className="w-4 h-4 text-[#c48820] shrink-0 hidden sm:inline" />
            <span>{alertMessage}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss access alert"
          data-testid="dismiss-rbac-alert-btn"
          className="inline-flex items-center justify-center p-1.5 rounded-lg text-[#000953]/70 hover:text-[#000953] hover:bg-amber-100/80 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: InstitutionalRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const evaluation = evaluateProtectedRouteAccess({
    isAuthenticated,
    user: user ? { role: user.role } : null,
    allowedRoles,
  });

  if (!evaluation.allowed && evaluation.redirectTo) {
    return <Redirect to={evaluation.redirectTo} />;
  }

  return (
    <>
      <AccessAlertBanner />
      {children}
    </>
  );
}
