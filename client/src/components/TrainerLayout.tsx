/*
 * Dashboard Layout — Clean Sidebar Navigation
 * Design: Modern & Minimalist — minimal borders, clean spacing, professional colors
 */

import { useState, useEffect } from "react";
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
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Wrench
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/trainer/dashboard" },
  {
    icon: FolderOpen,
    label: "Professional Documents",
    children: [
      { icon: FileText, label: "Learning Plan", path: "/trainer/documents/learning-plan" },
      { icon: BookOpen, label: "Daily Session Plan", path: "/trainer/session-plans" },
      { icon: CheckSquare, label: "Class Register", path: "/trainer/class-register" },
      { icon: ClipboardCheck, label: "Record of Work (RoW)", path: "/trainer/documents/records-of-work" },
      { icon: FileText, label: "Curriculum Ingest", path: "/trainer/curriculum-parsing" },
    ]
  },
  {
    icon: FileText,
    label: "Exams & Testing",
    children: [
      { icon: FileText, label: "Exam Builder", path: "/trainer/exam-builder" },
      { icon: Eye, label: "Live Proctoring", path: "/trainer/proctoring" },
    ]
  },
  {
    icon: ClipboardCheck,
    label: "Marks & Grading",
    children: [
      { icon: CheckSquare, label: "Exam Grading", path: "/trainer/grading" },
      { icon: FileText, label: "Assessment Marksheet", path: "/trainer/assessment-marks" },
      { icon: Zap, label: "Auto Grading Queue", path: "/trainer/auto-grading" },
      { icon: FolderOpen, label: "Uploaded Evidence", path: "/trainer/grading/uploads" },
    ]
  },
  {
    icon: BarChart3,
    label: "Analytics & Reports",
    children: [
      { icon: BarChart3, label: "Class Analytics", path: "/trainer/analytics" },
      { icon: TrendingUp, label: "Performance Insights", path: "/trainer/performance-insights" },
      { icon: Download, label: "Official Reports", path: "/trainer/reports" },
      { icon: Settings, label: "System Setup", path: "/trainer/setup" },
    ]
  }
];

interface TrainerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const SidebarItem = ({ 
  item, 
  location, 
  navigate, 
  setMobileOpen, 
  depth = 0 
}: { 
  item: NavItem, 
  location: string, 
  navigate: (path: string) => void, 
  setMobileOpen: (open: boolean) => void,
  depth?: number 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  
  // Auto-expand if a child is active
  useEffect(() => {
    if (hasChildren && item.children?.some(child => child.path === location || (child.path && location.startsWith(child.path.split('?')[0])))) {
      setIsOpen(true);
    }
  }, [location, hasChildren, item.children]);

  const Icon = item.icon;
  // If no path is provided but it has children, clicking the row toggles accordion.
  // Otherwise, it navigates.
  const isActive = item.path ? (location === item.path || (item.path.includes('?') && location === item.path.split('?')[0])) : false;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (item.path) {
      navigate(item.path);
      setMobileOpen(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </div>
        {hasChildren && (
          isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />
        )}
      </button>

      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="py-1 space-y-1">
              {item.children!.map((child, idx) => (
                <SidebarItem 
                  key={idx} 
                  item={child} 
                  location={location} 
                  navigate={navigate} 
                  setMobileOpen={setMobileOpen} 
                  depth={depth + 1} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function TrainerLayout({
  children,
  title,
  subtitle,
}: TrainerLayoutProps) {
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
            <div className="text-[10px] text-primary/70 uppercase font-bold tracking-wider">Trainer Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item, index) => (
          <SidebarItem 
            key={index} 
            item={item} 
            location={location} 
            navigate={navigate} 
            setMobileOpen={setMobileOpen} 
          />
        ))}
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
    <div className="flex h-screen bg-background print:h-auto print:bg-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 print:hidden">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] print:hidden">
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
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors print:hidden"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto print:overflow-visible">
          <div className="p-6 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">{children}</div>
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
