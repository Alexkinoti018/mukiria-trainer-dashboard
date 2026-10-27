/**
 * Institutional Portal Access Gateway
 * Mukiria Technical Training Institute (MTTI) — Academic Management System
 *
 * Design System: Modern Institutional Glassmorphism
 * Primary Color: #000953 (Institutional Navy)
 * Accent Color: #c48820 (Academic Gold)
 * Principles: Confidentiality, Integrity, and Accessibility (WCAG 2.1 AA)
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Phone,
  CheckCircle2,
  Building2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import bcrypt from "bcryptjs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { verifyTraineeAdmission } from "@/lib/traineeVerificationService";

type MainPortal = "trainee" | "staff";

export default function Login() {
  const [mainPortal, setMainPortal] = useState<MainPortal>("trainee");
  const [isTraineeRegisterMode, setIsTraineeRegisterMode] = useState(false);

  // Authentication Credentials
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Trainee Account Activation & Roster Verification State
  const [regAdmNo, setRegAdmNo] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regClassCode, setRegClassCode] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regIsVerified, setRegIsVerified] = useState(false);
  const [regIsVerifying, setRegIsVerifying] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const [location, navigate] = useLocation();

  // Role-Based Redirection Helper
  const handleRoleRedirection = (role: string) => {
    const normRole = (role || "").toUpperCase();
    if (normRole === "TRAINEE") {
      navigate("/trainee/exam");
    } else if (normRole === "ADMIN") {
      navigate("/admin/roster");
    } else if (normRole === "HOD") {
      navigate("/hod/dashboard");
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

  // Check query params (e.g. ?activated=true&adm=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adm = params.get("adm");
    const activated = params.get("activated");
    if (adm) {
      setIdentifier(adm);
    }
    if (activated === "true") {
      toast.success("Account Ready", {
        description: "Your trainee account is activated. Please sign in with your credentials.",
      });
    }
  }, []);

  const handlePortalChange = (portal: MainPortal) => {
    setMainPortal(portal);
    setError("");
    setShowForgotNotice(false);
    setIsTraineeRegisterMode(false);
    setIdentifier("");
    setPassword("");
  };

  
  /**
   * Institutional Roster Verification for Candidate Activation
   * Leverages resilient dual-layer traineeVerificationService.
   */
  const handleRegAdmissionBlur = async (overrideAdm?: string) => {
    const cleanAdm = (overrideAdm !== undefined ? overrideAdm : regAdmNo).trim();
    if (!cleanAdm) {
      setRegIsVerified(false);
      return;
    }

    setRegIsVerifying(true);
    setError("");

    try {
      const profile = await verifyTraineeAdmission(cleanAdm);
      setRegFullName(profile.fullName);
      setRegDepartment(profile.department);
      setRegClassCode(profile.classCode);
      setRegIsVerified(true);
      setError("");

      toast.success("Roster Record Verified", {
        description: `Verified: ${profile.fullName} (${profile.classCode})`,
      });
    } catch (err: any) {
      setRegIsVerified(false);
      setRegFullName("");
      setRegDepartment("");
      setRegClassCode("");
      const msg = err?.message || "Admission number not found in institutional roster.";
      setError(msg);
      toast.error("Roster Verification Notice", { description: msg });
    } finally {
      setRegIsVerifying(false);
    }
  };

  /**
   * Trainee Account Activation Form Submission
   * Enforces client bcrypt hashing and TRAINEE role assignment.
   */
  const handleTraineeRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAdm = regAdmNo.trim();
    if (!cleanAdm) {
      setError("Please enter your Admission / Registration Number.");
      return;
    }

    if (!regIsVerified) {
      setError("Please verify your Admission Number against the institutional roster first.");
      toast.error("Verification Required", {
        description: "Your admission number must be verified against the official roster before activation.",
      });
      return;
    }

    if (!regPassword.trim()) {
      setError("Please create a password for your account.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (regConfirmPassword && regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Securely hash password via bcrypt on client
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(regPassword, salt);
      const internalEmail = `student.${cleanAdm.toLowerCase().replace(/[^a-z0-9]/g, "")}@mtti.ac.ke`;

      const res = await fetch("/api/auth/register-trainee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          admissionNumber: cleanAdm,
          phoneNumber: regPhone.trim() || null,
          email: internalEmail,
          password: hashedPassword,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error((data && data.error) || "Trainee account activation failed.");
      }

      const verifiedName = (data && data.user && data.user.full_name) || regFullName;
      toast.success("Account Activated Successfully!", {
        description: `Welcome, ${verifiedName}! Your profile is activated. Please sign in below.`,
      });

      // Switch back to Candidate Sign In with prefilled admission number
      setIsTraineeRegisterMode(false);
      setIdentifier(cleanAdm);
      setPassword("");
    } catch (err: any) {
      setError(err?.message || "Failed to activate trainee account.");
      toast.error("Activation Notice", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Main Sign In Handler (POST /api/auth/login)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError(
        mainPortal === "trainee"
          ? "Please enter your Admission / Registration Number."
          : "Please enter your Institutional Email."
      );
      return;
    }

    if (!cleanPass) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const requestedRole = mainPortal === "trainee" ? "trainee" : undefined;
      const result = await login(cleanPass, cleanId, requestedRole);

      if (result.success) {
        const resolvedRole = result.role || (mainPortal === "trainee" ? "trainee" : "trainer");
        toast.success("Authentication Successful", {
          description: "Access granted. Entering academic portal...",
        });

        if (result.token) {
          localStorage.setItem("mtti_auth_token", result.token);
          localStorage.setItem("token", result.token);
        }

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
      {/* Accessible, Elevated Container Card */}
      <main
        className="w-full max-w-[490px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6"
        aria-labelledby="gateway-title"
      >
        {/* Institutional Branding Header */}
        <header className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#000953]/15 shadow-md flex items-center justify-center p-2 ring-4 ring-[#c48820]/20 overflow-hidden">
              <img
                src="/mtti-logo.jpg"
                alt="Mukiria Technical Training Institute Crest"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <h1 id="gateway-title" className="text-2xl font-bold text-[#000953] tracking-tight">
            Institutional Access Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Mukiria Technical Training Institute — Academic Management System
          </p>
        </header>

        {/* Primary Portal Navigation Tabs */}
        <nav aria-label="Portal Mode Selection" className="space-y-2">
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handlePortalChange("trainee")}
              aria-selected={mainPortal === "trainee"}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] ${
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
              aria-selected={mainPortal === "staff"}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] ${
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
        </nav>

        {/* ── PORTAL VIEW 1: TRAINEE PORTAL ── */}
        {mainPortal === "trainee" && (
          <section className="space-y-4" aria-label="Trainee Authentication Area">
            {/* Trainee Mode Switcher */}
            <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsTraineeRegisterMode(false);
                  setError("");
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] ${
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
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] ${
                  isTraineeRegisterMode
                    ? "bg-[#000953] text-white shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-[#c48820]" />
                <span>Activate Account</span>
              </button>
            </div>

            {/* TRAINEE ACTIVATION FORM (ROSTER-VERIFIED) */}
            {isTraineeRegisterMode ? (
              <form onSubmit={handleTraineeRegisterSubmit} className="space-y-3.5" aria-label="Candidate Account Activation">
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
                  <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#000953]" />
                    Official Account Activation
                  </p>
                  <p className="mt-0.5 text-blue-800 text-[11px]">
                    Enter your official Admission Number. Your details will be verified against the institutional roster and locked automatically.
                  </p>
                </div>

                {/* Admission Number Input with Roster Verification */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reg_admission_no" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Admission / Registration Number <span className="text-red-500">*</span>
                    </label>
                    {regIsVerifying && (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1" aria-live="polite">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying roster...
                      </span>
                    )}
                    {regIsVerified && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" aria-live="polite">
                        <CheckCircle2 className="w-3 h-3" /> Roster Verified
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="reg_admission_no"
                      name="reg_admission_no"
                      type="text"
                      value={regAdmNo}
                      onChange={(e) => {
                        setRegAdmNo(e.target.value);
                        setRegIsVerified(false);
                      }}
                      onBlur={() => handleRegAdmissionBlur()}
                      placeholder="e.g., 14179/S2026 or 13254"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRegAdmissionBlur()}
                      disabled={regIsVerifying || !regAdmNo.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#000953] hover:bg-[#001066] text-white text-[11px] font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#000953]"
                      aria-label="Verify candidate admission number"
                    >
                      {regIsVerifying ? "Checking..." : "Verify"}
                    </button>
                  </div>
                </div>

                {/* Verified Candidate Profile Card */}
                {regIsVerified && (
                  <div className="space-y-2.5 p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label htmlFor="reg_verified_fullname" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                        <span>Official Trainee Name</span>
                        <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Institutional Record Locked
                        </span>
                      </label>
                      <input
                        id="reg_verified_fullname"
                        type="text"
                        value={regFullName}
                        readOnly
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold cursor-not-allowed select-none"
                        aria-readonly="true"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="reg_verified_dept" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" /> Department
                        </label>
                        <input
                          id="reg_verified_dept"
                          type="text"
                          value={regDepartment}
                          readOnly
                          className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-xs cursor-not-allowed select-none"
                          aria-readonly="true"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="reg_verified_cohort" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-slate-400" /> Class / Cohort
                        </label>
                        <input
                          id="reg_verified_cohort"
                          type="text"
                          value={regClassCode}
                          readOnly
                          className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium cursor-not-allowed select-none"
                          aria-readonly="true"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact & Password Creation */}
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label htmlFor="reg_phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg_phone"
                        name="reg_phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+254 712 345 678"
                        autoComplete="tel"
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label htmlFor="reg_password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Create Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg_password"
                        name="reg_password"
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="reg_confirm_password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reg_confirm_password"
                        name="reg_confirm_password"
                        type={showRegPassword ? "text" : "password"}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 cursor-pointer focus:outline-hidden"
                      aria-label={showRegPassword ? "Hide passwords" : "Show passwords"}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRegPassword ? "Hide Passwords" : "Show Passwords"}</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" aria-live="assertive" className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !regIsVerified}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Trainee Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#c48820]" />
                      <span>Activate Trainee Account</span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-500 pt-1">
                  Already activated?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsTraineeRegisterMode(false);
                      setError("");
                    }}
                    className="font-semibold text-[#000953] hover:underline cursor-pointer focus:outline-hidden"
                  >
                    Back to Candidate Sign In
                  </button>
                </p>
              </form>
            ) : (
              /* TRAINEE SIGN IN FORM */
              <form onSubmit={handleSubmit} className="space-y-4" aria-label="Candidate Sign In">
                {/* Clean Institutional Identification Info Card */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-[#000953] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#c48820]" />
                    Candidate Authentication:
                  </span>
                  <span className="text-[11px] text-slate-500">Official Admission No. Required</span>
                </div>

                {/* First-Time Activation Action Card */}
                <div className="p-3 bg-gradient-to-r from-blue-50/70 via-slate-50 to-amber-50/40 border border-blue-200/70 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#000953]/10 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-[#000953]" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">First time here?</p>
                      <p className="text-[11px] text-slate-500">Activate your trainee account with your Admission No.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTraineeRegisterMode(true);
                      setError("");
                    }}
                    className="px-3 py-1.5 bg-[#000953] hover:bg-[#001066] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#000953]"
                  >
                    <span>Activate</span>
                    <ArrowRight className="w-3 h-3 text-[#c48820]" />
                  </button>
                </div>

                {/* 1. Admission Number Input */}
                <div className="space-y-1.5">
                  <label htmlFor="trainee_adm_no" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Admission / Registration Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="trainee_adm_no"
                      name="admission_number"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g., 14179/S2026 or 13254"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                      disabled={isSubmitting}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* 2. Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="trainee_pwd" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Security Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotNotice(!showForgotNotice)}
                      className="text-xs font-medium text-[#000953] hover:underline focus:outline-hidden cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="trainee_pwd"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your account password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {showForgotNotice && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed space-y-1">
                    <p className="font-semibold text-blue-950">Credential Reset Support</p>
                    <p>
                      If you have forgotten your password, please contact your Head of Department or visit the Academic Office with your Student ID card.
                    </p>
                  </div>
                )}

                {error && (
                  <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Access Trainee Examination Portal</span>
                      <ArrowRight className="w-4 h-4 text-[#c48820]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        )}

        {/* ── PORTAL VIEW 2: STAFF & ADMIN PORTAL ── */}
        {mainPortal === "staff" && (
          <section className="space-y-4" aria-label="Staff & Administrator Sign In Area">
            {/* Staff Access Notice */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs flex items-center justify-between text-slate-700">
              <span className="font-semibold text-[#000953] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c48820]" />
                Staff & Faculty Gateway:
              </span>
              <span className="text-[11px] text-slate-500">Automated Role Resolution</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-label="Staff Sign In">
              {/* Institutional Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="staff_email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Institutional Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="staff_email"
                    name="email"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g., trainer@mtti.ac.ke or admin@mtti.ac.ke"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                    disabled={isSubmitting}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Staff Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="staff_pwd" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="staff_pwd"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter staff password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-70 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Staff...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Staff Portal</span>
                    <ArrowRight className="w-4 h-4 text-[#c48820]" />
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* Institutional Footer */}
        <footer className="text-center pt-2 border-t border-slate-200/80 space-y-1">
          <p className="text-xs text-slate-500 font-medium">
            Institutional Period: <span className="font-semibold text-slate-700">Term 3, 2026 (31/08/2026 – 13/11/2026)</span>
          </p>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Mukiria Technical Training Institute. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
