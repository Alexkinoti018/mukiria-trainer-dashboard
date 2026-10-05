import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { TraineeProvider } from "./contexts/TraineeContext";
import { ExamProvider } from "./contexts/ExamContext";
import ProtectedRoute from "./components/ProtectedRoute";


import Login from "./pages/Login";

// Trainer pages
import Dashboard from "./pages/Dashboard";
import ExamBuilder from "./pages/ExamBuilder";
import Grading from "./pages/Grading";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Setup from "./pages/Setup";
import Proctoring from "./pages/Proctoring";
import AutoGrading from "./pages/AutoGrading";
import PerformanceInsights from "./pages/PerformanceInsights";
import SessionPlans from "./pages/SessionPlans";
import AcademicWorkspaceShell from "./pages/AcademicWorkspaceShell";
import ClassRegister from "./pages/ClassRegister";
import LearningPlan from "./pages/LearningPlan";
import RecordsOfWork from "./pages/RecordsOfWork";
import AssessmentPlan from "./pages/AssessmentPlan";
import AssessmentMarks from "./pages/AssessmentMarks";
import CurriculumParsingHub from "./pages/CurriculumParsingHub";
import TraineeAssignments from "./pages/TraineeAssignments";
import UploadGrading from "./pages/UploadGrading";

// HOD pages
import HODDashboard from "./pages/HODDashboard";
import HODCompliance from "./pages/HODCompliance";
import HODAnalytics from "./pages/HODAnalytics";
import HODReports from "./pages/HODReports";

// Trainee pages
import TraineeDashboard from "./pages/TraineeDashboard";
import CandidatePortal from "./pages/CandidatePortal";
import StudentResults from "./pages/StudentResults";
import StudentSessionView from "./pages/StudentSessionView";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Login} />
      <Route path="/exam" component={CandidatePortal} />
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
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><UploadGrading /></ProtectedRoute>
      </Route>
      <Route path="/trainer/session-plans">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><SessionPlans /></ProtectedRoute>
      </Route>
      <Route path="/trainer/class-register">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><ClassRegister /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/learning-plan">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><LearningPlan /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/records-of-work">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><RecordsOfWork /></ProtectedRoute>
      </Route>
      <Route path="/trainer/documents/assessment-plan">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><AssessmentPlan /></ProtectedRoute>
      </Route>
      <Route path="/trainer/workspace">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><AcademicWorkspaceShell /></ProtectedRoute>
      </Route>
      <Route path="/trainer/curriculum-parsing">
        <ProtectedRoute allowedRoles={["trainer", "admin", "hod"]}><CurriculumParsingHub /></ProtectedRoute>
      </Route>
      <Route path="/trainer/assessment-marks">
        <ProtectedRoute allowedRoles={["trainer", "admin"]}><AssessmentMarks /></ProtectedRoute>
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

      {/* Trainee / Candidate Routes */}
      <Route path="/trainee/dashboard">
        <ProtectedRoute allowedRoles={["trainee"]}><TraineeDashboard /></ProtectedRoute>
      </Route>
      <Route path="/trainee/exam">
        <ProtectedRoute allowedRoles={["trainee", "admin"]}><CandidatePortal /></ProtectedRoute>
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
