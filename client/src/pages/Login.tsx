/*
 * Login Page — Institutional Portal Access
 * Mukiria Technical Training Institute
 * Design: Modern & Minimalist Institutional Glassmorphism
 * Serves Trainee, Trainer, HOD, and Administrator access points.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  GraduationCap, 
  BookOpen, 
  Building2, 
  ShieldCheck, 
  ArrowRight 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RoleOption {
  id: "trainee" | "trainer" | "hod" | "admin";
  label: string;
  pin: string;
  icon: React.ElementType;
  description: string;
  targetPath: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "trainee",
    label: "Trainee",
    pin: "9012",
    icon: GraduationCap,
    description: "Online Exams, Results & Continuous Evidence Submission",
    targetPath: "/trainee/dashboard",
  },
  {
    id: "trainer",
    label: "Trainer",
    pin: "1234",
    icon: BookOpen,
    description: "Learning Plans, Session Plans, Class Register & Assessment Grading",
    targetPath: "/trainer/dashboard",
  },
  {
    id: "hod",
    label: "HOD",
    pin: "5678",
    icon: Building2,
    description: "Departmental Quality Assurance, Compliance & Regulatory Audits",
    targetPath: "/hod/dashboard",
  },
  {
    id: "admin",
    label: "Admin",
    pin: "0000",
    icon: ShieldCheck,
    description: "System Command Center, Roster Ingestion & Database Diagnostics",
    targetPath: "/admin",
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleOption["id"]>("trainer");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

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

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id);
    setPassword(role.pin);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your PIN");
      return;
    }

    setIsSubmitting(true);
    setError("");
    const result = await login(password);
    if (result.success) {
      toast.success("Welcome back!", {
        description: "Redirecting to your institutional portal...",
      });
      
      // Route based on role
      if (result.role === "admin") {
        navigate("/admin");
      } else if (result.role === "hod") {
        navigate("/hod/dashboard");
      } else if (result.role === "trainee") {
        navigate("/trainee/dashboard");
      } else {
        navigate("/trainer/dashboard");
      }
    } else {
      setError(result.error ?? "Authentication failed");
      toast.error("Authentication Failed", { description: result.error });
    }
    setIsSubmitting(false);
  };

  const activeRoleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[1];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Card */}
        <div className="card-minimal p-6 sm:p-8 space-y-6 shadow-xl border border-border/60 backdrop-blur-md">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center p-2.5 shadow-sm">
                <img
                  src="/mtti-logo.jpg"
                  alt="Mukiria TTI Crest"
                  className="w-full h-full object-contain rounded"
                  onError={(e) => {
                    // Fallback to SVG shield if logo image fails to load
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Institutional Portal Access
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Mukiria Technical Training Institute — Academic Management System
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
              Select Portal Destination
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold scale-[1.02]"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/80 border-border/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                    <span className="text-xs">{role.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {role.pin}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground text-center italic mt-1.5 px-2">
              {activeRoleConfig.description}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PIN field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Security PIN / Password
                </label>
                <span className="text-[11px] text-primary font-medium">
                  {activeRoleConfig.label} Access ({activeRoleConfig.pin})
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="input-field pr-10 text-center tracking-widest font-mono text-base font-semibold"
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Enter {activeRoleConfig.label} Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info & Reference */}
          <div className="pt-2 border-t border-border/50 text-center space-y-1">
            <p className="text-[11px] text-muted-foreground">
              Institutional Term: <strong>Term 3, 2026</strong> (07/09/2026 – 13/11/2026)
            </p>
            <p className="text-[10px] text-muted-foreground/80 font-mono">
              Admin: 0000 | Trainer: 1234 | HOD: 5678 | Trainee: 9012
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
