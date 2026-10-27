import React, { useState } from "react";
import { useLocation, Link } from "wouter";
import bcrypt from "bcryptjs";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Building2,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  UserCheck,
} from "lucide-react";
import { verifyTraineeAdmission } from "@/lib/traineeVerificationService";

export default function RegisterTrainee() {
  const [, setLocation] = useLocation();

  // Form Fields
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [classCode, setClassCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verifiedStudentName, setVerifiedStudentName] = useState("");

  /**
   * Triggers institutional roster verification upon user blur or verify button click.
   * Leverages resilient dual-layer traineeVerificationService.
   */
  const handleAdmissionBlur = async () => {
    const cleanAdm = admissionNumber.trim();
    if (!cleanAdm) {
      setIsVerified(false);
      setVerifiedStudentName("");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const profile = await verifyTraineeAdmission(cleanAdm);
      setFullName(profile.fullName);
      setVerifiedStudentName(profile.fullName);
      setDepartment(profile.department);
      setClassCode(profile.classCode);
      if (!email.trim()) {
        setEmail(`student.${cleanAdm.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@mtti.ac.ke`);
      }
      setIsVerified(true);
      setError("");

      toast.success("Roster Record Verified!", {
        description: `Verified candidate: ${profile.fullName} (${profile.classCode})`,
      });
    } catch (err: any) {
      setIsVerified(false);
      setVerifiedStudentName("");
      setDepartment("");
      setClassCode("");
      const msg = err?.message || "Admission number not found in institutional roster.";
      setError(msg);
      toast.error("Roster Verification Notice", { description: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Account Activation Form Submission:
   * 1. Validates roster verification
   * 2. Hashes password via bcrypt on the client
   * 3. Transmits payload to POST /api/auth/register-trainee enforcing the TRAINEE role
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isVerified) {
      setError("Please enter a valid, roster-verified Admission Number first.");
      toast.error("Verification Required", {
        description: "Your admission number must be verified against the institutional roster.",
      });
      return;
    }

    if (!admissionNumber.trim() || !fullName.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Securely hash password via bcrypt on submission
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const cleanAdm = admissionNumber.trim();
      const internalEmail = (email.trim() || `student.${cleanAdm.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@mtti.ac.ke`).toLowerCase();

      // Transmit payload enforcing the TRAINEE role
      const res = await fetch("/api/auth/register-trainee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          admissionNumber: cleanAdm,
          phoneNumber: phoneNumber.trim() || null,
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
        throw new Error((data && data.error) || "Failed to activate candidate account.");
      }

      const verifiedName = (data && data.user && data.user.full_name) || fullName;
      toast.success("Trainee Account Activated!", {
        description: `Welcome, ${verifiedName}! Redirecting to Trainee Portal login...`,
      });

      // Redirect back to login with pre-populated admission number
      setTimeout(() => {
        setLocation(`/login?activated=true&adm=${encodeURIComponent(cleanAdm)}`);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while activating your account.");
      toast.error("Activation Error", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100/30 px-4 py-8">
      <div className="w-full max-w-[520px] bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6">
        {/* Institutional Branding Header */}
        <div className="text-center space-y-2">
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
          <h1 className="text-2xl font-bold text-[#000953] tracking-tight">
            Candidate Account Activation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Mukiria Technical Training Institute — Academic Management System
          </p>
        </div>

        {/* Security & Confidentiality Tag */}
        <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs flex items-center gap-2.5 text-slate-700">
          <ShieldCheck className="w-5 h-5 text-[#000953] shrink-0" />
          <p className="leading-relaxed">
            Enter your official <strong>Admission / Registration Number</strong>. Your academic profile will be verified against the institutional roster and locked automatically.
          </p>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Trainee Account Activation Form">
          {/* STEP 1: Admission Number Verification (Triggers Lookup on Blur) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="activation_admission_no" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Admission / Registration Number <span className="text-red-500">*</span>
              </label>
              {isVerifying && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1" aria-live="polite">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying roster...
                </span>
              )}
              {isVerified && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" aria-live="polite">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Roster Verified
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="activation_admission_no"
                name="admission_number"
                type="text"
                value={admissionNumber}
                onChange={(e) => {
                  setAdmissionNumber(e.target.value);
                  setIsVerified(false);
                  setVerifiedStudentName("");
                }}
                onBlur={handleAdmissionBlur}
                placeholder="e.g., 14179/S2026 or 13254"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953] transition-all"
                required
                autoComplete="off"
                aria-required="true"
                aria-invalid={!isVerified && !!error}
              />
              <button
                type="button"
                onClick={handleAdmissionBlur}
                disabled={isVerifying || !admissionNumber.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#000953] hover:bg-[#001066] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-[#000953]"
                aria-label="Verify admission number against institutional roster"
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Matches your official institutional enrollment registration number.
            </p>
          </div>

          {/* STEP 2: Pre-populated & Locked Official Details */}
          {isVerified && (
            <div className="space-y-3 p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Candidate Profile</span>
              </div>

              {/* Full Name (Read-Only) */}
              <div className="space-y-1">
                <label htmlFor="verified_fullname" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Official Trainee Name</span>
                  <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Institutional Record Locked
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="verified_fullname"
                    type="text"
                    value={fullName}
                    readOnly
                    className="w-full pl-3 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold cursor-not-allowed select-none"
                    aria-readonly="true"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Department & Cohort (Read-Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="verified_dept" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" /> Department
                  </label>
                  <input
                    id="verified_dept"
                    type="text"
                    value={department}
                    readOnly
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium cursor-not-allowed select-none"
                    aria-readonly="true"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="verified_cohort" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-slate-400" /> Class / Cohort
                  </label>
                  <input
                    id="verified_cohort"
                    type="text"
                    value={classCode}
                    readOnly
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium cursor-not-allowed select-none"
                    aria-readonly="true"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Candidate Contact Details & Password Setup */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="activation_phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="activation_phone"
                  name="phone_number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254 712 345 678"
                  autoComplete="tel"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="activation_password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="activation_password"
                    name="new_password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="activation_confirm_password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="activation_confirm_password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:border-[#000953]"
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Activation Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isVerified}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#000953] focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hashing Credentials & Activating Account...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#c48820]" />
                <span>Activate Trainee Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Back to Sign In */}
        <div className="pt-4 border-t border-slate-200/80 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Already activated your candidate account?{" "}
            <Link
              href="/login"
              className="text-[#000953] hover:underline font-semibold inline-flex items-center gap-1 focus:outline-hidden focus:ring-1 focus:ring-[#000953]"
            >
              Sign In to Trainee Portal <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Mukiria Technical Training Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
