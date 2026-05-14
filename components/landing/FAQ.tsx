"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does the AI evaluation actually work?",
    a: "PrepAI uses advanced AI to analyse your answers across multiple dimensions: structure (STAR format for behavioral questions), technical depth, clarity, and relevance. It then scores your response and provides specific, actionable suggestions — not generic tips.",
  },
  {
    q: "What types of interviews does PrepAI support?",
    a: "We cover coding / DSA, system design, behavioral / STAR, product management, and role-specific technical interviews for SWE, Data Science, DevOps, Frontend, Backend, and more. You can filter by company culture and interview style too.",
  },
  {
    q: "Can I use PrepAI for non-technical roles?",
    a: "Yes. While PrepAI has deep coverage for engineering roles, it also supports Product Management, Data Analysis, UX Design, and General Management tracks with tailored question banks and evaluation rubrics.",
  },
  {
    q: "How accurate is the AI feedback compared to a real interviewer?",
    a: "Our feedback aligns closely with what seasoned interviewers look for. We calibrated the model against hundreds of real interview rubrics from FAANG and top startups. That said, AI feedback is a supplement — not a replacement — for mock interviews with real people.",
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. Your answers and resume data are encrypted in transit and at rest. We never share your data with third parties. You can delete your account and all associated data at any time from your settings page.",
  },
  {
    q: "Does PrepAI integrate with my calendar or job tracker?",
    a: "We're working on a native job tracker. For now, you can export your practice sessions and AI reports as PDFs. Calendar integration for scheduling mock interviews is on our public roadmap.",
  },
  {
    q: "How is PrepAI different from LeetCode or InterviewBit?",
    a: "LeetCode focuses on coding challenges. PrepAI is a full-spectrum prep platform — we handle behavioral, system design, domain-specific technical, and resume prep with AI-driven feedback at every step, not just a problem bank.",
  },
];

function FAQItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span
          className={cn(
            "text-base font-medium transition-colors",
            isOpen ? "text-indigo-500" : "text-foreground"
          )}
        >
          {q}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
          {a}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const mid = Math.ceil(faqs.length / 2);
  const left = faqs.slice(0, mid);
  const right = faqs.slice(mid);

  return (
    <section id="faq" className="relative py-24 lg:py-32 scroll-mt-16">
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
            FAQ
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Frequently asked{" "}
            <span className="gradient-text">questions</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? Reach out to our team.
          </p>
        </motion.div>

        {/* Two-column FAQ on desktop, single on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-5xl"
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 lg:items-start">
            <div className="rounded-2xl border border-border bg-card px-6">
              {left.map((item, i) => (
                <FAQItem
                  key={i}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card px-6">
              {right.map((item, i) => (
                <FAQItem
                  key={i + mid}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === i + mid}
                  onToggle={() =>
                    setOpenIndex(openIndex === i + mid ? null : i + mid)
                  }
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Still have questions?{" "}
            <a
              href="mailto:hello@prepai.io"
              className="font-medium text-indigo-500 hover:underline"
            >
              Chat with us →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
