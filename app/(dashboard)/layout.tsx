import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Settings, Zap } from "lucide-react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { SidebarUserProfile } from "@/components/dashboard/SidebarUserProfile";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500 transition-opacity group-hover:opacity-80">
              <Zap className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold gradient-text">PrepAI</span>
          </Link>
        </div>

        <DashboardNav />

        {/* Bottom: Settings + User Profile */}
        <div className="shrink-0 space-y-0.5 border-t border-border p-3">
          <DashboardSettingsLink />
          <SidebarUserProfile />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebar />

            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500">
                <Zap className="h-3.5 w-3.5 text-white" fill="white" />
              </div>
              <span className="text-base font-bold gradient-text">PrepAI</span>
            </Link>

            <DashboardBreadcrumb />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="h-5 w-px bg-border" />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardSettingsLink() {
  return (
    <Link
      href="/dashboard/settings"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground"
    >
      <Settings className="h-4 w-4 shrink-0" />
      Settings
    </Link>
  );
}
