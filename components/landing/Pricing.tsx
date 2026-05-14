"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Perfect for exploring PrepAI and light practice.",
    cta: "Get Started",
    ctaVariant: "outline" as const,
    features: [
      "10 AI-generated questions / month",
      "Basic answer feedback",
      "1 mock interview / month",
      "1 resume ATS scan",
      "Community access",
    ],
  },
  {
    name: "Pro",
    monthly: 19,
    annual: 15,
    description: "For serious candidates in active job search.",
    cta: "Get Started",
    ctaVariant: "primary" as const,
    popular: true,
    features: [
      "Unlimited AI questions",
      "Deep feedback & scoring",
      "Unlimited mock interviews",
      "Unlimited ATS scans",
      "Personalized study plan",
      "Progress analytics",
      "Priority email support",
    ],
  },
  {
    name: "Team",
    monthly: 49,
    annual: 39,
    description: "For bootcamps, universities, and recruiting firms.",
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    features: [
      "Everything in Pro",
      "Up to 25 seats",
      "Team analytics dashboard",
      "Custom question banks",
      "Admin controls & SSO",
      "Slack integration",
      "Dedicated account manager",
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-24 lg:py-32 scroll-mt-16">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-1/2 h-[600px] -translate-y-1/2 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Pricing
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple,{" "}
            <span className="gradient-text">transparent</span> pricing
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Start for free and upgrade when you&apos;re ready. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-muted/60 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-medium transition-all",
                !annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium transition-all",
                annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                −20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-shadow",
                plan.popular
                  ? "border-indigo-500/50 bg-card shadow-2xl shadow-indigo-500/15 ring-1 ring-indigo-500/20"
                  : "border-border/60 bg-card hover:shadow-lg hover:border-border"
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3" fill="white" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight text-foreground">
                  ${annual ? plan.annual : plan.monthly}
                </span>
                {plan.monthly > 0 && (
                  <span className="mb-1 text-sm text-muted-foreground">
                    / mo{annual ? ", billed annually" : ""}
                  </span>
                )}
              </div>

              {/* CTA */}
              <a
                href={plan.name === "Team" ? "mailto:hello@prepai.io" : "/sign-up"}
                className={cn(
                  "mb-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all",
                  plan.ctaVariant === "primary"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/35"
                    : "border border-border/80 text-foreground hover:bg-muted hover:border-border"
                )}
              >
                {plan.cta}
              </a>

              {/* Features */}
              <ul className="mt-auto space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          Questions?{" "}
          <a href="mailto:hello@prepai.io" className="text-indigo-500 hover:underline">
            Contact us
          </a>
        </motion.p>
      </div>
    </section>
  );
}
