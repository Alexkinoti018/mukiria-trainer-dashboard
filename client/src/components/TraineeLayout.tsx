/*
 * Dashboard Layout — Clean Sidebar Navigation
 * Design: Modern & Minimalist — minimal borders, clean spacing, professional colors
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  BarChart3,
  Download,
  LogOut,
  Menu,
  X,
  Settings,
  Eye,
  Zap,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "My Dashboard", path: "/trainee/dashboard" },
  { icon: FileText, label: "Upcoming Exams", path: "/trainee/exam" },
  { icon: ClipboardCheck, label: "Assignments & Evidence", path: "/trainee/assignments" },
  { icon: BarChart3, label: "My Results", path: "/trainee/results" },
];

interface TraineeLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function TraineeLayout({
  children,
  title,
  subtitle,
}: TraineeLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden shrink-0 bg-white flex items-center justify-center rounded-md shadow-sm">
            <img
              src="/mtti-logo.jpg"
              alt="Mukiria TTI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-primary">Mukiria TTI</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trainee Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="px-4 py-2">
          <p className="text-xs text-sidebar-foreground/60">Logged in as</p>
          <p className="text-sm font-medium truncate">{user?.email || "Admin"}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 shadow-sm border border-transparent hover:border-sidebar-border"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex-1">
            {title && (
              <>
                <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto w-full">{children}</div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
