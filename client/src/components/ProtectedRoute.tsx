import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<"trainer" | "admin" | "hod" | "trainee">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If authenticated but wrong role, redirect to their proper dashboard
    if (user.role === "hod") return <Redirect to="/hod/dashboard" />;
    if (user.role === "trainee") return <Redirect to="/trainee/dashboard" />;
    return <Redirect to="/trainer/dashboard" />;
  }

  return <>{children}</>;
}
