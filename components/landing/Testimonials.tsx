"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star } from "lucide-react";
import Link from "next/link";

type Review = {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = "prepai_reviews";

const GRADIENTS = [
  "from-indigo-400 to-violet-400",
  "from-violet-400 to-purple-400",
  "from-emerald-400 to-teal-400",
  "from-indigo-400 to-emerald-400",
  "from-amber-400 to-orange-400",
  "from-rose-400 to-pink-400",
];

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= value ? "fill-amber-400 text-amber-400" : "fill-muted/30 text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const initials = review.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
    >
      <StarDisplay value={review.rating} />
      <blockquote className="text-sm leading-relaxed text-muted-foreground">
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[11px] font-bold text-white`}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{review.name}</p>
          {review.role && (
            <p className="text-xs text-muted-foreground">{review.role}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReviews(JSON.parse(stored));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const col1 = reviews.slice(0, Math.ceil(reviews.length / 3));
  const col2 = reviews.slice(
    Math.ceil(reviews.length / 3),
    Math.ceil((reviews.length * 2) / 3)
  );
  const col3 = reviews.slice(Math.ceil((reviews.length * 2) / 3));

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-muted/[0.03]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
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
            Community
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            What engineers{" "}
            <span className="gradient-text">say about PrepAI</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Real feedback from engineers practicing with PrepAI.
          </p>
        </motion.div>

        {/* Reviews */}
        {loaded && reviews.length > 0 ? (
          <>
            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 mb-12">
              {[col1, col2, col3].map((col, ci) => (
                <div key={ci} className="flex flex-col gap-5">
                  {col.map((review, ti) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      index={ci * 3 + ti}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:hidden mb-10">
              {reviews.slice(0, 3).map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i} />
              ))}
            </div>
          </>
        ) : loaded ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reviews from users will appear here once submitted.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Get Started Free
            </Link>
          </motion.div>
        ) : null}

        {loaded && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center text-sm text-muted-foreground"
          >
            Already using PrepAI?{" "}
            <Link
              href="/dashboard/settings"
              className="font-medium text-indigo-500 hover:underline"
            >
              Share your feedback →
            </Link>
          </motion.p>
        )}
      </div>
    </section>
  );
}
