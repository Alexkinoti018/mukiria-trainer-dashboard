import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExamBuilder from "./pages/ExamBuilder";
import Grading from "./pages/Grading";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import CandidatePortal from "./pages/CandidatePortal";
import StudentResults from "./pages/StudentResults";
import Setup from "./pages/Setup";
import Proctoring from "./pages/Proctoring";
import AutoGrading from "./pages/AutoGrading";
import PerformanceInsights from "./pages/PerformanceInsights";

function Router() {
  return (
    <Switch>
      {/* Trainer Dashboard routes */}
      <Route path={"/"} component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/exam-builder"} component={ExamBuilder} />
      <Route path={"/grading"} component={Grading} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/setup"} component={Setup} />
      <Route path={"/proctoring"} component={Proctoring} />
      <Route path={"/auto-grading"} component={AutoGrading} />
      <Route path={"/performance-insights"} component={PerformanceInsights} />

      {/* Candidate Portal */}
      <Route path={"/exam"} component={CandidatePortal} />
      <Route path={"/results"} component={StudentResults} />

      <Route path={"/404"} component={NotFound} />
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
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
