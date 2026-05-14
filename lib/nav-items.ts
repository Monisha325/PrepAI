import { BarChart3, Briefcase, FileText, LayoutDashboard, Sparkles, Target, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLink {
  type: "link";
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavDivider {
  type: "divider";
  label: string;
}

export type NavEntry = NavLink | NavDivider;

export const navItems: NavEntry[] = [
  { type: "link",    label: "Overview",        href: "/dashboard",           icon: LayoutDashboard, exact: true },
  { type: "divider", label: "Prepare" },
  { type: "link",    label: "Practice",        href: "/dashboard/practice",  icon: Sparkles },
  { type: "link",    label: "Evaluate",        href: "/dashboard/evaluate",  icon: Target },
  { type: "link",    label: "Mock Interview",  href: "/dashboard/mock",      icon: Video },
  { type: "divider", label: "Tools" },
  { type: "link",    label: "Resume Analyzer", href: "/dashboard/resume",    icon: FileText },
  { type: "link",    label: "Job Tracker",     href: "/dashboard/jobs",      icon: Briefcase },
  { type: "divider", label: "Reports" },
  { type: "link",    label: "Analytics",       href: "/dashboard/analytics", icon: BarChart3 },
];
