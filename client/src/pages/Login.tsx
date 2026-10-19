/**
 * Institutional Portal Access Gateway
 * Mukiria Technical Training Institute (MTTI) — Academic Management System
 *
 * Design System: Modern Institutional Glassmorphism
 * Primary Color: #000953 (Institutional Navy)
 * Accent Color: #c48820 (Academic Gold)
 * Zero Trainee Email Invariant: Trainees authenticate via Admission/Registration Number strictly.
 */

import React, { useEffect, useState, useMemo } from "react";
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
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  findFacultyInTimetable,
  getAllTimetableFaculty,
} from "@/lib/timetableSyncService";

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
    identifierLabel: "Admission No. or Institutional Email",
    identifierPlaceholder: "e.g., FBS 5 MOD/13254/12026 or email",
    targetPath: "/trainee/dashboard",
  },
  {
    id: "trainer",
    label: "Trainer",
    icon: BookOpen,
    description: "Learning plans, daily session plans, class register & assessment grading.",
    identifierLabel: "Name, Staff ID, Email or Phone",
    identifierPlaceholder: "e.g., Alexander Kinoti or MTTI-EMP-042",
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

  // Trainer Registration & Live Auto-fetch state
  const [isTrainerRegMode, setIsTrainerRegMode] = useState(false);
  const [trainerNameInput, setTrainerNameInput] = useState("");
  const [trainerEmailInput, setTrainerEmailInput] = useState("");
  const [trainerPhoneInput, setTrainerPhoneInput] = useState("");
  const [trainerPinInput, setTrainerPinInput] = useState("1234");
  const [matchedFaculty, setMatchedFaculty] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { login, registerTrainer, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // All faculty indexed from master timetable
  const allFaculty = useMemo(() => getAllTimetableFaculty(), []);

  // Filtered institutional suggestions based on trainer name input
  const suggestedFaculty = useMemo(() => {
    if (!trainerNameInput.trim() || trainerNameInput.length < 2) return [];
    const q = trainerNameInput.toLowerCase();
    return allFaculty.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [allFaculty, trainerNameInput]);

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
    if (roleId !== "trainer") {
      setIsTrainerRegMode(false);
    }
  };

  // Instant trainer lookup the moment name is entered
  const handleTrainerNameChange = (val: string) => {
    setTrainerNameInput(val);
    setError("");
    setShowSuggestions(true);
    const matched = findFacultyInTimetable(val);
    setMatchedFaculty(matched);
    if (matched && !trainerEmailInput) {
      const cleanName = matched.name
        .toLowerCase()
        .replace(/^(mr|md|ms|mrs)\.?\s+/i, "")
        .trim()
        .replace(/\s+/g, ".");
      setTrainerEmailInput(`${cleanName}@mtti.ac.ke`);
    }
  };

  const handleSelectFaculty = (faculty: any) => {
    const cleanName = faculty.name.replace(/^(mr|md|ms|mrs)\.?\s+/i, (m: string) => m.toUpperCase());
    setTrainerNameInput(cleanName);
    const matched = findFacultyInTimetable(faculty.name);
    setMatchedFaculty(matched);
    setShowSuggestions(false);
    if (!trainerEmailInput) {
      const slug = faculty.name
        .toLowerCase()
        .replace(/^(mr|md|ms|mrs)\.?\s+/i, "")
        .trim()
        .replace(/\s+/g, ".");
      setTrainerEmailInput(`${slug}@mtti.ac.ke`);
    }
    toast.info("Institutional Timetable Found", {
      description: `Matched ${faculty.department} (${faculty.classesCount} classes, ${faculty.unitsCount} units)`,
    });
  };

  // Submission handler for Trainer Self-Registration and Timetable Linking
  const handleTrainerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerNameInput.trim()) {
      setError("Please enter your Full Name to locate your timetable profile.");
      return;
    }
    if (!trainerEmailInput.trim()) {
      setError("Please enter your Institutional Email Address.");
      return;
    }
    if (!trainerPhoneInput.trim()) {
      setError("Please enter your Phone Number.");
      return;
    }
    if (!trainerPinInput.trim()) {
      setError("Please assign a Security PIN (e.g. 1234).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const canonicalName = matchedFaculty?.name
        ? matchedFaculty.name.replace(/^(mr|md|ms|mrs)\.?\s+/i, (m: string) => m.toUpperCase())
        : trainerNameInput.trim();

      const result = await registerTrainer({
        name: canonicalName,
        email: trainerEmailInput.trim(),
        phone: trainerPhoneInput.trim(),
        department: matchedFaculty?.department || "Computing & Informatics",
        pin: trainerPinInput.trim(),
        timetableTrainerId: matchedFaculty?.id,
      });

      if (result.success) {
        toast.success("Trainer Profile Registered & Synchronized!", {
          description: `All professional documents aligned with ${canonicalName}'s timetable.`,
        });
        navigate("/trainer/dashboard");
      } else {
        const err = result.error || "Failed to register trainer.";
        setError(err);
        toast.error("Registration Failed", { description: err });
      }
    } catch (err: any) {
      const msg = err?.message || "An unexpected error occurred during registration.";
      setError(msg);
      toast.error("Registration Error", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError(
        `Please enter your ${
          activeRole === "trainee"
            ? "Admission No. or Institutional Email"
            : "Staff ID / Employee Code"
        }.`
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

        {/* Segmented Mode Selector for Trainer Role: Sign In vs Register & Sync Timetable */}
        {activeRole === "trainer" && (
          <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsTrainerRegMode(false);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !isTrainerRegMode
                  ? "bg-white text-[#000953] shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Staff Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTrainerRegMode(true);
                setError("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isTrainerRegMode
                  ? "bg-[#000953] text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />
              <span>Register & Link Timetable</span>
            </button>
          </div>
        )}

        {/* ── CONDITIONAL VIEW A: TRAINER SELF-REGISTRATION & TIMETABLE SYNC ── */}
        {activeRole === "trainer" && isTrainerRegMode ? (
          <form onSubmit={handleTrainerRegisterSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed">
              <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c48820]" />
                Institutional Timetable Auto-Fetch
              </p>
              <p className="mt-0.5 text-blue-800">
                Type your Full Name to automatically locate your institutional teaching schedule, classes, and units from the master timetable.
              </p>
            </div>

            {/* 1. Full Name with Instant Timetable Auto-Fetch */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Full Name (Faculty / Trainer)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={trainerNameInput}
                  onChange={(e) => handleTrainerNameChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g., Alexander Kinoti"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestedFaculty.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                  <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Matching Timetable Faculty
                  </div>
                  {suggestedFaculty.map((fac) => (
                    <button
                      key={fac.id}
                      type="button"
                      onClick={() => handleSelectFaculty(fac)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{fac.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {fac.department} • {fac.classesCount} Classes • {fac.unitsCount} Units
                        </div>
                      </div>
                      <Check className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Matched Institutional Profile Summary Card */}
            {matchedFaculty && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Timetable Profile Matched: {matchedFaculty.name}</span>
                </div>
                <div className="text-emerald-800 text-[11px] space-y-0.5">
                  <p>
                    <strong>Department:</strong> {matchedFaculty.department || "Computing & Informatics"}
                  </p>
                  <p>
                    <strong>Classes ({matchedFaculty.classes?.length || 0}):</strong>{" "}
                    {(matchedFaculty.classes || []).join(", ") || "General"}
                  </p>
                  <p>
                    <strong>Units ({matchedFaculty.units?.length || 0}):</strong>{" "}
                    {(matchedFaculty.units || []).join(", ") || "General"}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Institutional Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={trainerEmailInput}
                  onChange={(e) => {
                    setTrainerEmailInput(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., alexander.kinoti@mtti.ac.ke"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* 3. Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={trainerPhoneInput}
                  onChange={(e) => {
                    setTrainerPhoneInput(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., +254 722 000 000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* 4. Security PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Security PIN / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={trainerPinInput}
                  onChange={(e) => {
                    setTrainerPinInput(e.target.value);
                    setError("");
                  }}
                  placeholder="Default PIN: 1234"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Validation / Error Banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Register & Synchronize Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing Timetable & Registering...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-[#c48820]" />
                  <span>Complete Registration & Sync Timetable</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── CONDITIONAL VIEW B: DUAL-FIELD AUTHENTICATION FORM ── */
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
              {activeRole === "trainer" && identifier.trim() === "1234" && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Quick Access: Logging in as Lead Trainer Alexander Kinoti
                </p>
              )}
              {activeRole === "trainer" && identifier.trim().length >= 3 && identifier.trim() !== "1234" && (
                <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#c48820] shrink-0" />
                  Timetable Sync: Linking faculty schedule for &quot;{identifier.trim()}&quot; (PIN: 1234)
                </p>
              )}
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

            {/* Quick helper to switch to Trainer Registration */}
            {activeRole === "trainer" && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsTrainerRegMode(true);
                    setError("");
                  }}
                  className="text-xs text-[#000953] hover:underline font-semibold cursor-pointer"
                >
                  New trainer? Click here to register & link your timetable schedule.
                </button>
              </div>
            )}
          </form>
        )}

        {/* Minimal Institutional Footer & Metadata */}
        <div className="pt-4 border-t border-slate-200/70 text-center space-y-1.5">
          <p className="text-xs text-slate-500 font-medium">
            Institutional Period: <strong>Term 3, 2026 (31/08/2026 – 13/11/2026)</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} Mukiria Technical Training Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
