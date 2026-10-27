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
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

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
   * Triggers institutional roster lookup upon user blur or verify button click.
   * Leverages SSOT /api/trainees/lookup?admission_no=...
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
      const res = await fetch(`/api/trainees/lookup?admission_no=${encodeURIComponent(cleanAdm)}`);
      const data = await res.json();

      if (!res.ok) {
        setIsVerified(false);
        setVerifiedStudentName("");
        setDepartment("");
        setClassCode("");
        setError(data.error || "Admission number is not pre-loaded on the official institutional roster. Please contact your department.");
        toast.error("Roster Verification Failed", {
          description: data.error || "Candidate record not found in institutional roster.",
        });
        return;
      }

      // Auto-populate and lock retrieved institutional profile details
      const studentName = data.fullName || data.full_name || "";
      const deptName = data.department || "Computing & Informatics";
      const cohort = data.classCode || data.class_code || data.cohortCode || "";

      setFullName(studentName);
      setVerifiedStudentName(studentName);
      setDepartment(deptName);
      setClassCode(cohort);
      setIsVerified(true);
      setError("");

      toast.success("Roster Record Verified!", {
        description: `Found: ${studentName} (${cohort})`,
      });
    } catch (err: any) {
      setIsVerified(false);
      setError("Network error while verifying admission number with institutional database.");
      toast.error("Connection Error", { description: err?.message });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Fast 1-Click Roster Demo Fill for Rapid Testing & Verification
   */
  const handleQuickFill = (adm: string) => {
    setAdmissionNumber(adm);
    setError("");
    setIsVerified(false);
    // Trigger lookup directly
    setTimeout(() => {
      fetch(`/api/trainees/lookup?admission_no=${encodeURIComponent(adm)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.fullName) {
            setFullName(data.fullName);
            setVerifiedStudentName(data.fullName);
            setDepartment(data.department || "Computing & Informatics");
            setClassCode(data.classCode || data.cohortCode || "");
            setIsVerified(true);
            setEmail(`student.${adm.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}@mtti.ac.ke`);
            setPhoneNumber("+254 712 345 678");
            setPassword("Trainee@2026!");
            setConfirmPassword("Trainee@2026!");
            toast.success("Demo Profile Loaded & Verified", {
              description: `${data.fullName} (${data.classCode})`,
            });
          }
        })
        .catch(() => {});
    }, 50);
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

    if (!admissionNumber.trim() || !fullName.trim() || !email.trim() || !password) {
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

      // Transmit payload enforcing the TRAINEE role
      const res = await fetch("/api/auth/register-trainee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          admissionNumber: admissionNumber.trim(),
          phoneNumber: phoneNumber.trim() || null,
          email: email.trim().toLowerCase(),
          password: hashedPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate candidate account.");
      }

      toast.success("Trainee Account Activated!", {
        description: `Welcome, ${data.user.full_name}! Redirecting to Trainee Portal login...`,
      });

      // Save admission number for seamless autofill on Login page
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("mtti_last_candidate_adm", admissionNumber.trim());
      }

      setTimeout(() => {
        setLocation("/login");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during account activation.");
      toast.error("Activation Failed", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Decorative Top Accent Bar */}
      <div className="w-full max-w-xl h-1.5 bg-gradient-to-r from-[#000953] via-[#001999] to-[#c48820] rounded-t-2xl shadow-sm" />

      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-b-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
        {/* Institutional Header & Seal */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm mx-auto">
            <img
              src="/mtti-logo.jpg"
              alt="Mukiria Technical Training Institute Crest"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl"
              onError={(e) => {
                // Graceful fallback if image is missing in testing environment
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#000953] tracking-tight">
              Trainee Account Activation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Mukiria Technical Training Institute — Roster-Verified Candidate Onboarding
            </p>
          </div>
        </div>

        {/* Informational Guidance Badge */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
          <Sparkles className="w-4 h-4 text-[#c48820] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-950">Pre-Registered Roster Verification</p>
            <p className="text-blue-800/90 mt-0.5">
              Enter your official institutional Admission Number. The system will look up and lock your
              assigned Department and Cohort before activating your portal credentials.
            </p>
          </div>
        </div>

        {/* 1-Click Fast Verification Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#c48820]" />
              Quick Fill Sample Roster Candidates:
            </span>
            <span className="text-slate-400">Click to test</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Nthiga Gakii (ITECH 6)", adm: "14179/S2026" },
              { label: "Alvin Gatere (ICT 4)", adm: "14076/S2026" },
              { label: "Harriet Mwendwa (Land Survey)", adm: "D/UPNUT/25042/069" },
              { label: "Risper Mwende (Business)", adm: "13410" },
            ].map((chip) => (
              <button
                key={chip.adm}
                type="button"
                onClick={() => handleQuickFill(chip.adm)}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Admission Number Verification (Triggers Lookup on Blur) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Admission / Registration Number <span className="text-red-500">*</span>
              </label>
              {isVerifying ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verifying roster...
                </span>
              ) : isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Roster Verified
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Triggers verification on blur</span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={admissionNumber}
                onChange={(e) => {
                  setAdmissionNumber(e.target.value);
                  setIsVerified(false);
                  setError("");
                }}
                onBlur={handleAdmissionBlur}
                placeholder="e.g., 14179/S2026 or D/UPNUT/25042/069"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-[#000953]/10 transition-colors font-medium ${
                  isVerified
                    ? "border-emerald-400 bg-emerald-50/30"
                    : error
                    ? "border-red-300 bg-red-50/20"
                    : "border-slate-300 focus:border-[#000953]"
                }`}
                required
              />
              <button
                type="button"
                onClick={handleAdmissionBlur}
                disabled={isVerifying || !admissionNumber.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#000953] hover:bg-[#001066] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
              </button>
            </div>
            {verifiedStudentName && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                <UserCheck className="w-3.5 h-3.5" /> Identified Candidate:{" "}
                <strong className="text-emerald-900">{verifiedStudentName}</strong>
              </p>
            )}
          </div>

          {/* STEP 2: Locked Academic Placement (Auto-Populated from Institutional Roster) */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#c48820]" />
                2. Academic Placement (Roster-Locked)
              </span>
              <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3" /> Immutable SSOT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department - Locked */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Institutional Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={department}
                    readOnly
                    placeholder="Auto-populated upon verification"
                    className="w-full pl-8 pr-3 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium cursor-not-allowed select-none"
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Lock className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Class Code - Locked */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Assigned Cohort / Class
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={classCode}
                    readOnly
                    placeholder="Auto-populated upon verification"
                    className="w-full pl-8 pr-3 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium cursor-not-allowed select-none"
                  />
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Lock className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Official Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Official Registered Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#000953]/20"
                required
              />
            </div>
          </div>

          {/* STEP 3: Candidate Contact & Credential Creation */}
          <div className="space-y-3 pt-1">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Contact & Portal Password Creation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+254 712 345 678"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@mtti.ac.ke"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    required
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Password Creation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Portal Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-[#000953]/10 focus:border-[#000953]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Error Alert Display */}
          {error && (
            <div
              role="alert"
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
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#000953] to-[#001066] hover:from-[#000e7a] hover:to-[#001999] border-b-2 border-[#c48820] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
              className="text-[#000953] hover:underline font-semibold inline-flex items-center gap-1"
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
