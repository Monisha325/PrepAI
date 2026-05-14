"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UserCircle2, BotMessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserCircle2,
    title: "Set up your profile",
    description:
      "Choose your target role, experience level, and companies you're interviewing at. PrepAI personalises every question to your specific goals.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-200/60 dark:border-indigo-800/40",
  },
  {
    number: "02",
    icon: BotMessageSquare,
    title: "Practice with AI daily",
    description:
      "Answer AI-generated questions, run timed mock interviews, and upload your resume for ATS analysis — all in one seamless workflow.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-200/60 dark:border-violet-800/40",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Land your dream job",
    description:
      "Review AI feedback, track your improvement with analytics, and walk into real interviews fully confident and well-prepared.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 scroll-mt-16 bg-muted/[0.03]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-500">
            How it works
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            From zero to{" "}
            <span className="gradient-text">interview-ready</span>
            <br />
            in three steps
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            A simple, proven workflow that thousands of engineers use to land
            their dream roles.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              {/* Number + icon row */}
              <div className="mb-6 flex items-center gap-4">
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border ${step.border} ${step.bg}`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-muted-foreground ring-1 ring-border">
                    {i + 1}
                  </span>
                </div>
                <span className="text-5xl font-black leading-none text-muted-foreground/10">
                  {step.number}
                </span>
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            Start Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
