"use client";

import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" } as Transition,
});

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid-pattern absolute inset-0 opacity-60" />
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/6 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          {/* ── Left: copy ── */}
          <div className="text-center lg:text-left">
            {/* Eyebrow */}
            <motion.p
              {...fadeUp(0.05)}
              className="mb-5 text-sm font-semibold uppercase tracking-widest text-indigo-500"
            >
              AI-Powered Interview Prep
            </motion.p>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.12)}
              className="mb-6 text-5xl font-bold tracking-tighter text-foreground sm:text-6xl lg:text-7xl"
            >
              Ace Every{" "}
              <span className="gradient-text">Interview</span>
              <br />
              <span className="text-muted-foreground/70">with AI</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              {...fadeUp(0.2)}
              className="mb-8 mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0"
            >
              Generate role-specific questions, evaluate your answers instantly,
              and walk into every interview prepared and confident.
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.28)}
              className="flex flex-col gap-3 sm:flex-row sm:items-center justify-center lg:justify-start"
            >
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/30"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                See How It Works
              </a>
            </motion.div>

            {/* Minimal trust line */}
            <motion.p
              {...fadeUp(0.36)}
              className="mt-6 text-sm text-muted-foreground/70 text-center lg:text-left"
            >
              No credit card required
            </motion.p>
          </div>

          {/* ── Right: mock interview card ── */}
          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Glow ring */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 blur-2xl" />

            {/* Card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-2xl border border-border bg-card shadow-2xl"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-emerald-500">
                  <Zap className="h-4 w-4 text-white" fill="white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Mock Interview</p>
                  <p className="text-xs text-muted-foreground">
                    Senior Software Engineer · FAANG
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {/* Progress */}
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        n <= 3 ? "bg-indigo-500" : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="shrink-0 text-xs text-muted-foreground">3/5</span>
                </div>

                {/* Question */}
                <div className="rounded-xl bg-muted/60 p-4">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Question
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    &ldquo;Describe how you&apos;d design a distributed rate-limiter that
                    works across multiple data centers with minimal latency.&rdquo;
                  </p>
                </div>

                {/* Answer */}
                <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4 dark:border-indigo-800/30 dark:bg-indigo-950/20">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Your Answer
                  </p>
                  <p className="line-clamp-2 text-sm leading-relaxed text-foreground">
                    &ldquo;I&apos;d use a token-bucket algorithm with Redis for distributed
                    state, leveraging Lua scripts for atomic operations...&rdquo;
                  </p>
                </div>

                {/* AI Score */}
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      AI Evaluation Score
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      94 / 100
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "94%" }}
                      transition={{ delay: 0.9, duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Strong depth", "Scalability focus", "Clear tradeoffs"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating badge — top right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="absolute -right-5 -top-4 flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg"
            >
              🏆 +25 XP
            </motion.div>

            {/* Floating badge — bottom left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="absolute -bottom-5 -left-5 flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium shadow-lg"
            >
              <span className="text-base">🎯</span>
              <div>
                <p className="font-semibold text-foreground">STAR Format</p>
                <p className="text-muted-foreground">Excellent structure</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
