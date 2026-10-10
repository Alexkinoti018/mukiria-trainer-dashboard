import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import OfflineStatusBar from "@/components/OfflineStatusBar";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TraineeProvider } from "./contexts/TraineeContext";
import { ExamProvider } from "./contexts/ExamContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useIdleTimer } from "./hooks/useIdleTimer";
import { IdleTimeoutModal } from "./components/IdleTimeoutModal";
import { toast } from "sonner";

import { lazy, Suspense, useCallback } from "react";
import { Loader2 } from "lucide-react";

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-[#000953]">
      <Loader2 className="w-8 h-8 animate-spin text-[#000953]" />
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        Loading MTTI Academic Module...
      </span>
    </div>
  );
}

/**
 * Resilient dynamic module loader that recovers automatically from network interruptions,
 * server restarts, or bundle version mismatches.
 */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      const isDynamicImportError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.name === "ChunkLoadError";

      if (isDynamicImportError && typeof window !== "undefined") {
        const key = `retry_import_${window.location.pathname}`;
        const count = Number(sessionStorage.getItem(key) || "0");
        if (count < 2) {
          sessionStorage.setItem(key, String(count + 1));
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}

const Login = lazyWithRetry(() => import("./pages/Login"));

// Trainer pages
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const ExamBuilder = lazyWithRetry(() => import("./pages/ExamBuilder"));
const Grading = lazyWithRetry(() => import("./pages/Grading"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const Setup = lazyWithRetry(() => import("./pages/Setup"));
const Proctoring = lazyWithRetry(() => import("./pages/Proctoring"));
const AutoGrading = lazyWithRetry(() => import("./pages/AutoGrading"));
const PerformanceInsights = lazyWithRetry(() => import("./pages/PerformanceInsights"));
const SessionPlans = lazyWithRetry(() => import("./pages/SessionPlans"));
const AcademicWorkspaceShell = lazyWithRetry(() => import("./pages/AcademicWorkspaceShell"));
const ClassRegister = lazyWithRetry(() => import("./pages/ClassRegister"));
const LearningPlan = lazyWithRetry(() => import("./pages/LearningPlan"));
const RecordsOfWork = lazyWithRetry(() => import("./pages/RecordsOfWork"));
const AssessmentPlan = lazyWithRetry(() => import("./pages/AssessmentPlan"));
const AssessmentMarks = lazyWithRetry(() => import("./pages/AssessmentMarks"));
const CurriculumParsingHub = lazyWithRetry(() => import("./pages/CurriculumParsingHub"));
const TraineeAssignments = lazyWithRetry(() => import("./pages/TraineeAssignments"));
const UploadGrading = lazyWithRetry(() => import("./pages/UploadGrading"));
const TimetablePage = lazyWithRetry(() => import("./pages/TimetablePage"));

// HOD pages
const HODDashboard = lazyWithRetry(() => import("./pages/HODDashboard"));
const HODCompliance = lazyWithRetry(() => import("./pages/HODCompliance"));
const HODAnalytics = lazyWithRetry(() => import("./pages/HODAnalytics"));
const HODReports = lazyWithRetry(() => import("./pages/HODReports"));

// Trainee pages
const TraineeDashboard = lazyWithRetry(() => import("./pages/TraineeDashboard"));
const CandidatePortal = lazyWithRetry(() => import("./pages/CandidatePortal"));
const StudentResults = lazyWithRetry(() => import("./pages/StudentResults"));
const StudentSessionView = lazyWithRetry(() => import("./pages/StudentSessionView"));

// Admin & Developer Command Center
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Login} />
      <Route path="/exam" component={CandidatePortal} />
      <Route path="/trainee/exam" component={CandidatePortal} />
      <Route path="/session/:id" component={StudentSessionView} />

      {/* Trainer Routes */}
      <Route path="/trainer/dashboard">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/trainer/exam-builder">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><ExamBuilder /></ProtectedRoute>
      </Route>
      <Route path="/trainer/grading">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><Grading /></ProtectedRoute>
      </Route>
      <Route path="/trainer/grading/uploads">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><UploadGrading /></ProtectedRoute>
      </Route>
      <Route path="/trainer/session-plans">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><SessionPlans /></ProtectedRoute>
      </Route>
      <Route path="/trainer/class-register">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><ClassRegister /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/learning-plan">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><LearningPlan /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/records-of-work">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><RecordsOfWork /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/assessment-plan">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><AssessmentPlan /></ProtectedRoute>
      </Route>
      <Route path="/trainer/workspace">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><AcademicWorkspaceShell /></ProtectedRoute>
      </Route>
      <Route path="/trainer/curriculum-parsing">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><CurriculumParsingHub /></ProtectedRoute>
      </Route>
      <Route path="/trainer/assessment-marks">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><AssessmentMarks /></ProtectedRoute>
      </Route>
      <Route path="/trainer/analytics">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Analytics /></ProtectedRoute>
      </Route>
      <Route path="/trainer/reports">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Reports /></ProtectedRoute>
      </Route>
      <Route path="/trainer/setup">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><Setup /></ProtectedRoute>
      </Route>
      <Route path="/trainer/proctoring">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><Proctoring /></ProtectedRoute>
      </Route>
      <Route path="/trainer/auto-grading">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><AutoGrading /></ProtectedRoute>
      </Route>
      <Route path="/trainer/performance-insights">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><PerformanceInsights /></ProtectedRoute>
      </Route>
      <Route path="/trainer/timetable">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><TimetablePage /></ProtectedRoute>
      </Route>
      <Route path="/timetable">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><TimetablePage /></ProtectedRoute>
      </Route>

      {/* Trainee / Candidate Routes */}
      <Route path="/trainee/dashboard">
        <ProtectedRoute allowedRoles={["trainee"]}><TraineeDashboard /></ProtectedRoute>
      </Route>
      <Route path="/trainee/assignments">
        <ProtectedRoute allowedRoles={["trainee", "admin"]}><TraineeAssignments /></ProtectedRoute>
      </Route>
      <Route path="/trainee/results">
        <ProtectedRoute allowedRoles={["trainee", "trainer", "hod", "admin"]}><StudentResults /></ProtectedRoute>
      </Route>
      <Route path="/results" component={StudentResults} />

      {/* HOD Routes */}
      <Route path="/hod">
        <ProtectedRoute allowedRoles={["hod", "admin", "trainer"]}><HODDashboard /></ProtectedRoute>
      </Route>
      <Route path="/hod/dashboard">
        <ProtectedRoute allowedRoles={["hod", "admin", "trainer"]}><HODDashboard /></ProtectedRoute>
      </Route>
      <Route path="/hod/compliance">
        <ProtectedRoute allowedRoles={["hod", "admin", "trainer"]}><HODCompliance /></ProtectedRoute>
      </Route>
      <Route path="/hod/analytics">
        <ProtectedRoute allowedRoles={["hod", "admin", "trainer"]}><HODAnalytics /></ProtectedRoute>
      </Route>
      <Route path="/hod/reports">
        <ProtectedRoute allowedRoles={["hod", "admin", "trainer"]}><HODReports /></ProtectedRoute>
      </Route>

      {/* Route Aliases for direct un-prefixed URLs */}
      <Route path="/exam-builder">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><ExamBuilder /></ProtectedRoute>
      </Route>
      <Route path="/grading">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><Grading /></ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Analytics /></ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Reports /></ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin", "trainer", "hod"]}><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/class-register">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><ClassRegister /></ProtectedRoute>
      </Route>
      <Route path="/assessment-marks">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><AssessmentMarks /></ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function IdleSessionWatcher() {
  const { isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleIdle = useCallback(async () => {
    await logout();
    toast.warning("Institutional Session Expired", {
      description: "You were logged out due to inactivity on this shared terminal.",
    });
    setLocation("/");
  }, [logout, setLocation]);

  const { isPrompted, remainingSeconds, reset } = useIdleTimer({
    timeoutMs: 15 * 60 * 1000, // 15 minutes total inactivity
    promptBeforeMs: 60 * 1000,  // 60-second advance warning dialog
    enabled: isAuthenticated,
    onIdle: handleIdle,
  });

  const handleLogoutNow = useCallback(async () => {
    await logout();
    toast.info("Logged Out", {
      description: "Session securely terminated.",
    });
    setLocation("/");
  }, [logout, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <IdleTimeoutModal
      isOpen={isPrompted}
      remainingSeconds={remainingSeconds}
      onStayLoggedIn={reset}
      onLogoutNow={handleLogoutNow}
    />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TraineeProvider>
            <ExamProvider>
              <TooltipProvider>
                <Toaster richColors position="top-right" />
                <OfflineStatusBar />
                <IdleSessionWatcher />
                <Router />
              </TooltipProvider>
            </ExamProvider>
          </TraineeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
