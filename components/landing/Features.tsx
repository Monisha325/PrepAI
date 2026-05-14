"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Sparkles,
  Video,
  Brain,
  FileText,
  Lightbulb,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Question Generator",
    description:
      "Get unlimited role-specific interview questions tailored to your target company, position, and experience level.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Video,
    title: "Mock Interview Room",
    description:
      "Practice in realistic, timed mock interviews with an AI interviewer that adapts to your skill level.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Brain,
    title: "AI Answer Evaluation",
    description:
      "Receive instant, detailed feedback on your answers with scores, strengths, and improvement suggestions.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: FileText,
    title: "Resume ATS Analyzer",
    description:
      "Upload your resume and get actionable insights to beat ATS filters and stand out to recruiters.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description:
      "Get a personalized study plan based on your performance patterns, weak areas, and target role.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Track improvement over time with rich dashboards showing scores, trends, and milestone achievements.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 scroll-mt-16 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-500/6 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Everything you need
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Your complete{" "}
            <span className="gradient-text">interview toolkit</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From question generation to answer evaluation — PrepAI covers every
            stage of your interview preparation journey.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/8 dark:bg-card/80"
            >
              {/* Icon */}
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}
              >
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>

              <h3 className="mb-2 text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>

              {/* Hover shimmer */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
