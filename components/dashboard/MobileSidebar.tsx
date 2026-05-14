"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-sidebar"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.aside
              id="mobile-sidebar"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card shadow-xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500">
                    <Zap className="h-4 w-4 text-white" fill="white" />
                  </div>
                  <span className="text-lg font-bold gradient-text">PrepAI</span>
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

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
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <entry.icon
                          className={cn("h-4 w-4 shrink-0", active ? "text-indigo-400" : "")}
                          aria-hidden="true"
                        />
                        {entry.label}
                        {active && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="shrink-0 border-t border-border p-3">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setOpen(false)}
                  aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    pathname === "/dashboard/settings"
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Settings
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
