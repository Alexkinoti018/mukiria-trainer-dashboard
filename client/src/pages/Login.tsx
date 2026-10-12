/**
 * Institutional Portal Access Gateway
 * Mukiria Technical Training Institute (MTTI) — Academic Management System
 *
 * Design System: Modern Institutional Glassmorphism
 * Primary Color: #000953 (Institutional Navy)
 * Accent Color: #c48820 (Academic Gold)
 * Zero Trainee Email Invariant: Trainees authenticate via Admission/Registration Number strictly.
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap,
  BookOpen,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type RoleType = "trainee" | "trainer" | "hod" | "admin";

interface RoleConfig {
  id: RoleType;
  label: string;
  icon: React.ElementType;
  description: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  targetPath: string;
}

const ROLES: RoleConfig[] = [
  {
    id: "trainee",
    label: "Trainee",
    icon: GraduationCap,
    description: "Online examinations, continuous evidence portfolios & results broadsheets.",
    identifierLabel: "Admission / Registration Number",
    identifierPlaceholder: "e.g., FBS 5 MOD/13254/12026",
    targetPath: "/trainee/dashboard",
  },
  {
    id: "trainer",
    label: "Trainer",
    icon: BookOpen,
    description: "Learning plans, daily session plans, class register & assessment grading.",
    identifierLabel: "Staff ID / Employee Code",
    identifierPlaceholder: "e.g., MTTI-EMP-042",
    targetPath: "/trainer/dashboard",
  },
  {
    id: "hod",
    label: "HOD",
    icon: Building2,
    description: "Departmental quality assurance, curriculum audits & faculty compliance.",
    identifierLabel: "Staff ID / Employee Code",
    identifierPlaceholder: "e.g., MTTI-EMP-018",
    targetPath: "/hod/dashboard",
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    description: "System administration, roster batch processing & database diagnostics.",
    identifierLabel: "Staff ID / Employee Code",
    identifierPlaceholder: "e.g., MTTI-SYS-001",
    targetPath: "/admin",
  },
];

export default function Login() {
  const [activeRole, setActiveRole] = useState<RoleType>("trainer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "hod") {
        navigate("/hod/dashboard");
      } else if (user.role === "trainee") {
        navigate("/trainee/dashboard");
      } else {
        navigate("/trainer/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const currentRole = ROLES.find((r) => r.id === activeRole) || ROLES[1];

  const handleRoleChange = (roleId: RoleType) => {
    setActiveRole(roleId);
    setError("");
    setShowForgotNotice(false);
    if (roleId === "trainee" && identifier.includes("@")) {
      setIdentifier("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError(
        `Please enter your ${
          activeRole === "trainee"
            ? "Admission / Registration Number"
            : "Staff ID / Employee Code"
        }.`
      );
      return;
    }

    if (activeRole === "trainee" && identifier.includes("@")) {
      setError(
        "Trainees do not use email addresses. Please enter your Admission / Registration Number (e.g., FBS 5 MOD/13254/12026)."
      );
      return;
    }

    if (!password.trim()) {
      setError("Please enter your Security PIN or password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await login(password, identifier, activeRole);

      if (result.success) {
        toast.success("Authentication successful", {
          description: `Accessing ${currentRole.label} Portal...`,
        });

        // Determine destination route
        if (result.role === "admin" || (!result.role && activeRole === "admin")) {
          navigate("/admin");
        } else if (result.role === "hod" || (!result.role && activeRole === "hod")) {
          navigate("/hod/dashboard");
        } else if (result.role === "trainee" || (!result.role && activeRole === "trainee")) {
          navigate("/trainee/dashboard");
        } else {
          navigate("/trainer/dashboard");
        }
      } else {
        const errorMsg =
          result.error ?? "Invalid credentials. Please verify your ID and PIN.";
        setError(errorMsg);
        toast.error("Authentication Failed", { description: errorMsg });
      }
    } catch (err: any) {
      const fallbackErr =
        err?.message || "An unexpected error occurred during authentication.";
      setError(fallbackErr);
      toast.error("Sign In Error", { description: fallbackErr });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100/30 px-4 py-8">
      {/* Centered Elevated Material Card */}
      <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6">
        {/* Institutional Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-[#000953]/10 border border-[#000953]/20 flex items-center justify-center p-2.5 shadow-sm overflow-hidden">
              <img
                src="/mtti-logo.jpg"
                alt="Mukiria TTI Crest"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#000953] tracking-tight">
            Institutional Portal Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Mukiria Technical Training Institute — Academic Management System
          </p>
        </div>

        {/* Segmented Role Control (4-column grid inside pill wrapper) */}
        <div className="space-y-2">
          <div className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200 grid grid-cols-4 gap-1">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 text-center gap-1 cursor-pointer ${
                    isActive
                      ? "bg-[#000953] text-white shadow-sm ring-2 ring-[#000953]/20 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#c48820]" : "text-slate-500"
                    }`}
                  />
                  <span className="text-xs leading-none">{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Contextual Subtext for Active Role */}
          <p className="text-xs text-slate-500 text-center italic min-h-[1.25rem] px-2 leading-relaxed">
            {currentRole.description}
          </p>
        </div>

        {/* Dual-Field Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Dynamic Identifier Input (Admission No vs Staff ID) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {currentRole.identifierLabel}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name={activeRole === "trainee" ? "trainee_admission_number" : "staff_identifier"}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                placeholder={currentRole.identifierPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                disabled={isSubmitting}
                autoComplete={activeRole === "trainee" ? "off" : "username"}
              />
            </div>
          </div>

          {/* 2. Security PIN / Password Input with Visibility Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Security PIN / Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotNotice((prev) => !prev)}
                className="text-xs text-[#000953] hover:underline font-medium focus:outline-none cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your security PIN or password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Accessible Password Recovery Notice */}
          {showForgotNotice && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-blue-950">Credential Reset Notice</p>
              <p>
                {activeRole === "trainee"
                  ? "Trainees should present their student ID to the Registrar or Academic Office for PIN verification."
                  : "Academic faculty and administrators may request a credential reset via the MTTI ICT Support Desk."}
              </p>
            </div>
          )}

          {/* Validation / Authentication Error Banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Full-Width Navy Gradient Call-to-Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter {currentRole.label} Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Minimal Institutional Footer & Metadata */}
        <div className="pt-4 border-t border-slate-200/70 text-center space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">
            Institutional Period: <strong>Term 3, 2026 (31/09/2026 – 13/11/2026)</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} Mukiria Technical Training Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
