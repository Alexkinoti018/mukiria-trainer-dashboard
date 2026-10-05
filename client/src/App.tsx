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
    <div className="min-h-screen bg-[#000953]/20 flex flex-col items-center justify-center gap-3 text-slate-300">
      <Loader2 className="w-8 h-8 animate-spin text-[#c48820]" />
      <span className="text-xs font-semibold tracking-wider text-slate-300">
        Loading MTTI Academic Module...
      </span>
    </div>
  );
}

const Login = lazy(() => import("./pages/Login"));

// Trainer pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExamBuilder = lazy(() => import("./pages/ExamBuilder"));
const Grading = lazy(() => import("./pages/Grading"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Setup = lazy(() => import("./pages/Setup"));
const Proctoring = lazy(() => import("./pages/Proctoring"));
const AutoGrading = lazy(() => import("./pages/AutoGrading"));
const PerformanceInsights = lazy(() => import("./pages/PerformanceInsights"));
const SessionPlans = lazy(() => import("./pages/SessionPlans"));
const AcademicWorkspaceShell = lazy(() => import("./pages/AcademicWorkspaceShell"));
const ClassRegister = lazy(() => import("./pages/ClassRegister"));
const LearningPlan = lazy(() => import("./pages/LearningPlan"));
const RecordsOfWork = lazy(() => import("./pages/RecordsOfWork"));
const AssessmentPlan = lazy(() => import("./pages/AssessmentPlan"));
const AssessmentMarks = lazy(() => import("./pages/AssessmentMarks"));
const CurriculumParsingHub = lazy(() => import("./pages/CurriculumParsingHub"));
const TraineeAssignments = lazy(() => import("./pages/TraineeAssignments"));
const UploadGrading = lazy(() => import("./pages/UploadGrading"));
const TimetablePage = lazy(() => import("./pages/TimetablePage"));

// HOD pages
const HODDashboard = lazy(() => import("./pages/HODDashboard"));
const HODCompliance = lazy(() => import("./pages/HODCompliance"));
const HODAnalytics = lazy(() => import("./pages/HODAnalytics"));
const HODReports = lazy(() => import("./pages/HODReports"));

// Trainee pages
const TraineeDashboard = lazy(() => import("./pages/TraineeDashboard"));
const CandidatePortal = lazy(() => import("./pages/CandidatePortal"));
const StudentResults = lazy(() => import("./pages/StudentResults"));
const StudentSessionView = lazy(() => import("./pages/StudentSessionView"));

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
        <ProtectedRoute allowedRoles={["trainee", "admin"]}><StudentResults /></ProtectedRoute>
      </Route>

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
      <ThemeProvider defaultTheme="dark">
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
