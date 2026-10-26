/**
 * Institutional Portal Access Gateway
 * Mukiria Technical Training Institute (MTTI) — Academic Management System
 *
 * Design System: Modern Institutional Glassmorphism
 * Primary Color: #000953 (Institutional Navy)
 * Accent Color: #c48820 (Academic Gold)
 * Zero Trainee Email Invariant: Trainees authenticate strictly via Admission/Registration Number.
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
  Check,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  findFacultyInTimetable,
  getAllTimetableFaculty,
} from "@/lib/timetableSyncService";

type MainPortal = "trainee" | "staff";
type StaffRole = "trainer" | "hod" | "admin";

export default function Login() {
  const [mainPortal, setMainPortal] = useState<MainPortal>("trainee");
  const [staffRole, setStaffRole] = useState<StaffRole>("trainer");
  const [isTraineeRegisterMode, setIsTraineeRegisterMode] = useState(false);
  const [isTrainerRegMode, setIsTrainerRegMode] = useState(false);

  // Authentication Credentials
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Trainee Registration State
  const [regFullName, setRegFullName] = useState("");
  const [regAdmNo, setRegAdmNo] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Trainer Registration & Live Timetable Auto-fetch state
  const [trainerNameInput, setTrainerNameInput] = useState("");
  const [trainerEmailInput, setTrainerEmailInput] = useState("");
  const [trainerPhoneInput, setTrainerPhoneInput] = useState("");
  const [trainerPinInput, setTrainerPinInput] = useState("1234");
  const [matchedFaculty, setMatchedFaculty] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { login, registerTrainer, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const allFaculty = useMemo(() => getAllTimetableFaculty(), []);

  // Filtered institutional suggestions based on trainer name input (Registration Mode)
  const suggestedFaculty = useMemo(() => {
    if (!trainerNameInput.trim() || trainerNameInput.length < 2) return [];
    const q = trainerNameInput.toLowerCase();
    return allFaculty
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [allFaculty, trainerNameInput]);

  // Autocomplete suggestions for direct Staff Sign In
  const [showSignInSuggestions, setShowSignInSuggestions] = useState(false);
  const suggestedSignInFaculty = useMemo(() => {
    if (
      mainPortal !== "staff" ||
      staffRole !== "trainer" ||
      !identifier.trim() ||
      identifier.trim().length < 2 ||
      identifier.trim() === "1234"
    ) {
      return [];
    }
    const q = identifier.toLowerCase();
    return allFaculty
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [allFaculty, identifier, mainPortal, staffRole]);

  // Unified Role-Based Redirection:
  // Trainees -> /trainee/exam, Admins/HODs -> /admin/roster, Trainers -> /trainer/dashboard
  const handleRoleRedirection = (role?: string) => {
    const norm = (role || "").toLowerCase();
    if (norm === "trainee") {
      navigate("/trainee/exam");
    } else if (norm === "admin" || norm === "hod") {
      navigate("/admin/roster");
    } else {
      navigate("/trainer/dashboard");
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      handleRoleRedirection(user.role);
    }
  }, [isAuthenticated, user]);

  const handlePortalChange = (portal: MainPortal) => {
    setMainPortal(portal);
    setError("");
    setShowForgotNotice(false);
    setIsTraineeRegisterMode(false);
    setIsTrainerRegMode(false);
    setIdentifier("");
    setPassword("");
  };

  const handleStaffRoleChange = (role: StaffRole) => {
    setStaffRole(role);
    setError("");
    setShowForgotNotice(false);
    setIsTrainerRegMode(false);
    if (role === "admin") {
      setIdentifier("admin@mtti.ac.ke");
      setPassword("Mtti@2026!");
    } else if (role === "hod") {
      setIdentifier("hod.ci@mtti.ac.ke");
      setPassword("Mtti@2026!");
    } else {
      setIdentifier("trainer@mtti.ac.ke");
      setPassword("Mtti@2026!");
    }
  };

  const handleSelectSignInFaculty = (faculty: any) => {
    const cleanName = faculty.name.replace(/^(mr|md|ms|mrs)\.?\s+/i, (m: string) => m.toUpperCase());
    setIdentifier(cleanName);
    setPassword("1234");
    setShowSignInSuggestions(false);
    toast.info("Faculty Selected", {
      description: `${cleanName} (${faculty.department} • ${faculty.classesCount} classes)`,
    });
  };

  // Trainee Registration Handler (POST /api/auth/register-trainee)
  const handleTraineeRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regAdmNo.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Full Name, Admission Number, Email, and Password are all required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register-trainee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          admissionNumber: regAdmNo.trim(),
          phoneNumber: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Trainee registration failed.");
      }

      toast.success("Registration Successful!", {
        description: `Candidate account created for ${data.user.full_name}. You can now sign in using your Admission Number.`,
      });

      // Switch back to Sign In with the newly created Admission Number prefilled
      setIsTraineeRegisterMode(false);
      setIdentifier(regAdmNo.trim());
      setPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to register trainee account.");
      toast.error("Registration Error", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trainer Registration & Timetable Linking Handler
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

  // Main Authentication Handler (Trainee or Staff)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let cleanId = identifier.trim();
    const cleanPass = password.trim();

    // Frictionless Trainer Default: If identifier is empty and PIN is 1234 on Trainer tab, default to Alexander Kinoti
    if (!cleanId && mainPortal === "staff" && staffRole === "trainer" && (cleanPass === "1234" || cleanPass === "@Race5778")) {
      cleanId = "Alexander Kinoti";
      setIdentifier("Alexander Kinoti");
    }

    if (!cleanId) {
      setError(
        mainPortal === "trainee"
          ? "Please enter your Admission / Registration Number."
          : "Please enter your Institutional Email address or Staff ID."
      );
      return;
    }

    if (!cleanPass) {
      setError("Please enter your Security PIN or password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Direct API Authentication attempt (POST /api/auth/login)
      const requestedRole = mainPortal === "trainee" ? "trainee" : staffRole;
      const result = await login(cleanPass, cleanId, requestedRole);

      if (result.success) {
        const resolvedRole = result.role || requestedRole;
        toast.success("Authentication Successful", {
          description: `Welcome to MTTI Academic Gateway. Accessing portal...`,
        });

        // Store active token in localStorage if returned
        if (result.token) {
          localStorage.setItem("mtti_auth_token", result.token);
          localStorage.setItem("token", result.token);
        }

        // Role-Based Redirection: Trainee -> /trainee/exam, Admin/HOD -> /admin/roster, Trainer -> /trainer/dashboard
        handleRoleRedirection(resolvedRole);
      } else {
        const errorMsg = result.error ?? "Invalid credentials. Please verify your identifier and password.";
        setError(errorMsg);
        toast.error("Authentication Failed", { description: errorMsg });
      }
    } catch (err: any) {
      const fallbackErr = err?.message || "An unexpected error occurred during authentication.";
      setError(fallbackErr);
      toast.error("Sign In Error", { description: fallbackErr });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100/30 px-4 py-8">
      {/* Centered Elevated Material Card */}
      <div className="w-full max-w-[490px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6">
        {/* Institutional Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#000953]/15 shadow-md flex items-center justify-center p-2 ring-4 ring-[#c48820]/20 overflow-hidden">
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
            Institutional Access Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Mukiria Technical Training Institute — Academic Management System
          </p>
        </div>

        {/* ── REQUIREMENT 1: PRIMARY PORTAL SWITCHING TABS ── */}
        <div className="space-y-2">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handlePortalChange("trainee")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                mainPortal === "trainee"
                  ? "bg-[#000953] text-white shadow-md font-bold ring-2 ring-[#000953]/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
              }`}
            >
              <GraduationCap
                className={`w-4 h-4 ${
                  mainPortal === "trainee" ? "text-[#c48820]" : "text-slate-500"
                }`}
              />
              <span className="text-sm">Trainee Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalChange("staff")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                mainPortal === "staff"
                  ? "bg-[#000953] text-white shadow-md font-bold ring-2 ring-[#000953]/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 ${
                  mainPortal === "staff" ? "text-[#c48820]" : "text-slate-500"
                }`}
              />
              <span className="text-sm">Staff & Admin</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center italic min-h-[1.25rem] px-2 leading-relaxed">
            {mainPortal === "trainee"
              ? "Candidate examinations, continuous assessment tests & portfolio submissions."
              : "Faculty lesson delivery, departmental quality assurance & system administration."}
          </p>
        </div>

        {/* ── PORTAL VIEW 1: TRAINEE PORTAL (Zero-Email Admission Number Auth) ── */}
        {mainPortal === "trainee" && (
          <div className="space-y-4">
            {/* Trainee Mode Switcher: Sign In vs Sign Up */}
            <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsTraineeRegisterMode(false);
                  setError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isTraineeRegisterMode
                    ? "bg-white text-[#000953] shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Candidate Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTraineeRegisterMode(true);
                  setError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isTraineeRegisterMode
                    ? "bg-[#000953] text-white shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#c48820]" />
                <span>New Trainee? Register</span>
              </button>
            </div>

            {/* TRAINEE SIGN UP FORM (POST /api/auth/register-trainee) */}
            {isTraineeRegisterMode ? (
              <form onSubmit={handleTraineeRegisterSubmit} className="space-y-3.5">
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />
                    Candidate Self-Registration
                  </p>
                  <p className="mt-0.5 text-blue-800">
                    Register your candidate profile. Your password will be salted and hashed with bcrypt.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g., Brian Kiprono"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Admission / Registration Number
                  </label>
                  <input
                    type="text"
                    value={regAdmNo}
                    onChange={(e) => setRegAdmNo(e.target.value)}
                    placeholder="e.g., 14179/S2026 or D/UPNUT/25042/069"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@mtti.ac.ke"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    required
                  />
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering Candidate...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-[#c48820]" />
                      <span>Complete Candidate Registration</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* TRAINEE SIGN IN FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Zero-Email Invariant Assurance Tag */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-[#000953] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#c48820]" />
                    Zero-Email Invariant:
                  </span>
                  <span className="text-[11px] text-slate-500">Authenticate via Admission No.</span>
                </div>

                {/* 1. Admission Number Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Admission / Registration Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="trainee_admission_number"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g., 14179/S2026 or D/UPNUT/25042/069"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* 2. Password / Security PIN Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Security PIN / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotNotice((prev) => !prev)}
                      className="text-xs text-[#000953] hover:underline font-medium cursor-pointer"
                    >
                      Forgot PIN?
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
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Default Trainee PIN: <strong className="text-slate-800">9012</strong></span>
                    <span className="text-[10px] text-slate-400">Core Adm digits also supported</span>
                  </div>
                </div>

                {/* Fast Login Demo Pills for Trainees */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[#000953] font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />
                      Quick 1-Click Candidate Fill
                    </span>
                    <span className="text-[10px] text-slate-400">Demo Roster</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier("14179/S2026");
                        setPassword("9012");
                        setError("");
                      }}
                      className="text-xs bg-white hover:bg-blue-50 text-[#000953] font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      Dennis Mwiti (14179/S2026)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier("13254");
                        setPassword("9012");
                        setError("");
                      }}
                      className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      FBS Trainee (13254)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier("13258");
                        setPassword("9012");
                        setError("");
                      }}
                      className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      Faith Mwende (13258)
                    </button>
                  </div>
                </div>

                {showForgotNotice && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-1">
                    <p className="font-semibold text-blue-950">Credential Reset Notice</p>
                    <p>
                      Trainees should present their student ID to the Registrar or Academic Office for PIN verification.
                    </p>
                  </div>
                )}

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Candidate...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Trainee Examination Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── PORTAL VIEW 2: STAFF & ADMIN (Email & Password Auth) ── */}
        {mainPortal === "staff" && (
          <div className="space-y-4">
            {/* Staff Role Selector Pills (Trainer, HOD, Admin) */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleStaffRoleChange("trainer")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  staffRole === "trainer"
                    ? "bg-white text-[#000953] shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#c48820]" />
                <span>Trainer</span>
              </button>

              <button
                type="button"
                onClick={() => handleStaffRoleChange("hod")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  staffRole === "hod"
                    ? "bg-white text-[#000953] shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#c48820]" />
                <span>HOD</span>
              </button>

              <button
                type="button"
                onClick={() => handleStaffRoleChange("admin")}
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  staffRole === "admin"
                    ? "bg-white text-[#000953] shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#c48820]" />
                <span>Admin</span>
              </button>
            </div>

            {/* Segmented Mode Selector for Trainer Role: Sign In vs Register & Sync Timetable */}
            {staffRole === "trainer" && (
              <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsTrainerRegMode(false);
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isTrainerRegMode
                      ? "bg-white text-[#000953] shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Faculty Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTrainerRegMode(true);
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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

            {/* TRAINER SELF-REGISTRATION & TIMETABLE SYNC VIEW */}
            {staffRole === "trainer" && isTrainerRegMode ? (
              <form onSubmit={handleTrainerRegisterSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed">
                  <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#c48820]" />
                    Institutional Timetable Auto-Fetch
                  </p>
                  <p className="mt-0.5 text-blue-800">
                    Type your Full Name to automatically locate your institutional teaching schedule, classes, and units.
                  </p>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Full Name (Faculty / Trainer)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={trainerNameInput}
                      onChange={(e) => {
                        setTrainerNameInput(e.target.value);
                        setError("");
                        setShowSuggestions(true);
                        const matched = findFacultyInTimetable(e.target.value);
                        setMatchedFaculty(matched);
                        if (matched && !trainerEmailInput) {
                          const clean = matched.name.toLowerCase().replace(/^(mr|md|ms|mrs)\.?\s+/i, "").trim().replace(/\s+/g, ".");
                          setTrainerEmailInput(`${clean}@mtti.ac.ke`);
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="e.g., Alexander Kinoti"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                    />
                  </div>

                  {showSuggestions && suggestedFaculty.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Matching Timetable Faculty
                      </div>
                      {suggestedFaculty.map((fac) => (
                        <button
                          key={fac.id}
                          type="button"
                          onClick={() => {
                            const cleanName = fac.name.replace(/^(mr|md|ms|mrs)\.?\s+/i, (m: string) => m.toUpperCase());
                            setTrainerNameInput(cleanName);
                            setMatchedFaculty(fac);
                            setShowSuggestions(false);
                            if (!trainerEmailInput) {
                              const slug = fac.name.toLowerCase().replace(/^(mr|md|ms|mrs)\.?\s+/i, "").trim().replace(/\s+/g, ".");
                              setTrainerEmailInput(`${slug}@mtti.ac.ke`);
                            }
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{fac.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {fac.department} • {fac.classesCount} Classes • {fac.unitsCount} Units
                            </div>
                          </div>
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={trainerEmailInput}
                      onChange={(e) => setTrainerEmailInput(e.target.value)}
                      placeholder="e.g., alexander.kinoti@mtti.ac.ke"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={trainerPhoneInput}
                      onChange={(e) => setTrainerPhoneInput(e.target.value)}
                      placeholder="+254 722 000 000"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={trainerPinInput}
                      onChange={(e) => setTrainerPinInput(e.target.value)}
                      placeholder="Default PIN: 1234"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synchronizing & Registering...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-[#c48820]" />
                      <span>Complete Registration & Link Timetable</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STAFF SIGN IN FORM (Email & Password) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Quick 1-Click Fast Fill for Staff */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#000953] font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#c48820]" />
                      Quick 1-Click Demo Profiles
                    </span>
                    <span className="text-[10px] text-slate-400">Institutional Staff</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {staffRole === "trainer" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIdentifier("trainer@mtti.ac.ke");
                            setPassword("Mtti@2026!");
                            setError("");
                          }}
                          className="text-xs bg-white hover:bg-blue-50 text-[#000953] font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        >
                          Dr. J. Muriithi (trainer@mtti.ac.ke)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdentifier("Alexander Kinoti");
                            setPassword("1234");
                            setError("");
                          }}
                          className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        >
                          Alexander Kinoti (PIN: 1234)
                        </button>
                      </>
                    )}

                    {staffRole === "hod" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier("hod.ci@mtti.ac.ke");
                          setPassword("Mtti@2026!");
                          setError("");
                        }}
                        className="text-xs bg-white hover:bg-blue-50 text-[#000953] font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                      >
                        Prof. S. Njoroge (hod.ci@mtti.ac.ke)
                      </button>
                    )}

                    {staffRole === "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier("admin@mtti.ac.ke");
                          setPassword("Mtti@2026!");
                          setError("");
                        }}
                        className="text-xs bg-white hover:bg-blue-50 text-[#000953] font-medium px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                      >
                        System Admin (admin@mtti.ac.ke)
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. Dynamic Identifier Input: Institutional Email */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Institutional Email / Staff ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="staff_identifier"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError("");
                        setShowSignInSuggestions(true);
                      }}
                      onFocus={() => setShowSignInSuggestions(true)}
                      placeholder="e.g., admin@mtti.ac.ke or trainer@mtti.ac.ke"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                      autoComplete="username"
                    />
                  </div>

                  {/* Suggestions Dropdown for Faculty */}
                  {staffRole === "trainer" && showSignInSuggestions && suggestedSignInFaculty.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Master Timetable Faculty</span>
                        <span className="text-[10px] text-blue-600 font-normal">Click to autofill PIN 1234</span>
                      </div>
                      {suggestedSignInFaculty.map((fac) => (
                        <button
                          key={fac.id}
                          type="button"
                          onClick={() => handleSelectSignInFaculty(fac)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{fac.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {fac.department} • {fac.classesCount} Classes
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotNotice((prev) => !prev)}
                      className="text-xs text-[#000953] hover:underline font-medium cursor-pointer"
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
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Default Password: <strong className="text-slate-800">Mtti@2026!</strong></span>
                    <span className="text-[10px] text-slate-400">Master: @Race5778</span>
                  </div>
                </div>

                {showForgotNotice && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-1">
                    <p className="font-semibold text-blue-950">Credential Reset Notice</p>
                    <p>
                      Academic faculty and administrators may request a credential reset via the MTTI ICT Support Desk.
                    </p>
                  </div>
                )}

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Staff...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Staff Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
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
