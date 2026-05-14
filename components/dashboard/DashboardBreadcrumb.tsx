"use client";

import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  Video,
} from "lucide-react";

const routes: Record<string, { label: string; icon: React.ElementType }> = {
  "/dashboard":           { label: "Overview",        icon: LayoutDashboard },
  "/dashboard/practice":  { label: "Practice",        icon: Sparkles },
  "/dashboard/evaluate":  { label: "Evaluate",        icon: Target },
  "/dashboard/mock":      { label: "Mock Interview",  icon: Video },
  "/dashboard/resume":    { label: "Resume Analyzer", icon: FileText },
  "/dashboard/jobs":      { label: "Job Tracker",     icon: Briefcase },
  "/dashboard/analytics": { label: "Analytics",       icon: BarChart3 },
  "/dashboard/settings":  { label: "Settings",        icon: Settings },
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const route = routes[pathname] ?? { label: "Dashboard", icon: LayoutDashboard };
  const Icon = route.icon;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-semibold text-foreground">{route.label}</span>
    </div>
  );
}
