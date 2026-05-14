"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        {navItems.map((entry, i) => {
          if (entry.type === "divider") {
            return (
              <div key={`divider-${i}`} className="px-3 pb-1 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  {entry.label}
                </p>
              </div>
            );
          }

          const active = isActive(entry.href, entry.exact);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                active
                  ? "text-indigo-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-xl bg-indigo-500/10"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <entry.icon
                className={cn(
                  "relative h-4 w-4 shrink-0 transition-colors",
                  active ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              <span className="relative">{entry.label}</span>
              {active && (
                <div className="relative ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
