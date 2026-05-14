import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background decorations — matches landing page Hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid-pattern absolute inset-0 opacity-50" />
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/6 blur-3xl" />
      </div>

      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20">
          <Zap className="h-5 w-5 text-white" fill="white" />
        </div>
        <span className="text-2xl font-bold gradient-text">PrepAI</span>
      </Link>

      {children}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Free to start · No credit card required
      </p>
    </div>
  );
}
