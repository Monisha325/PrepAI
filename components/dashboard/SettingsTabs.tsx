"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageSquare, Palette, Star, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Preferences storage ───────────────────────────────────────────────────────

const PREFS_KEY = "prepai_preferences";

interface Prefs {
  defaultExperience: string;
  defaultInterviewType: string;
}

const DEFAULT_PREFS: Prefs = {
  defaultExperience: "Mid-Level (3-5 yrs)",
  defaultInterviewType: "technical",
};

// ── Tab definitions ───────────────────────────────────────────────────────────

const tabs = [
  { id: "profile",      label: "Profile",      icon: User },
  { id: "preferences",  label: "Preferences",  icon: Palette },
  { id: "feedback",     label: "Feedback",     icon: MessageSquare },
];

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted/40" />;
  }

  const initials = (
    user?.firstName?.[0] ?? user?.username?.[0] ?? "?"
  ).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Profile</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your account information from Clerk.
        </p>
      </div>
      <Separator />

      <div className="flex items-center gap-4">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt={user.fullName ?? "Avatar"}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-bold text-white">
            {initials}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-foreground">
            {user?.fullName ?? user?.username ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? "—"}
          </p>
          {user?.createdAt && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        To update your name, email, or profile picture, use the Clerk account portal accessible from the avatar menu in the sidebar.
      </div>
    </div>
  );
}

// ── Preferences tab ───────────────────────────────────────────────────────────

const EXPERIENCE_OPTIONS = [
  "Entry Level (0-1 yr)",
  "Junior (1-3 yrs)",
  "Mid-Level (3-5 yrs)",
  "Senior (5-8 yrs)",
  "Staff/Principal (8+ yrs)",
];

const TYPE_OPTIONS = [
  { value: "technical",  label: "Technical" },
  { value: "coding",     label: "Coding" },
  { value: "behavioral", label: "Behavioral" },
  { value: "hr",         label: "HR" },
];

function PreferencesTab() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  const selectCls =
    "flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:bg-muted/30";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Saved defaults used when starting new practice sessions.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Default Experience Level</Label>
          <select
            value={prefs.defaultExperience}
            onChange={(e) => setPrefs({ ...prefs, defaultExperience: e.target.value })}
            className={selectCls}
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Default Interview Type</Label>
          <select
            value={prefs.defaultInterviewType}
            onChange={(e) => setPrefs({ ...prefs, defaultInterviewType: e.target.value })}
            className={selectCls}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Theme (dark / light) is controlled by the toggle in the top navigation bar.
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          size="sm"
          className="bg-indigo-600 text-xs font-semibold hover:bg-indigo-500"
        >
          {saved ? "Saved!" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

// ── Feedback tab ──────────────────────────────────────────────────────────────

const REVIEWS_KEY = "prepai_reviews";

function FeedbackTab() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim() || rating === 0) return;
    const review = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      rating,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem(REVIEWS_KEY, JSON.stringify([review, ...existing]));
    } catch {}
    setSubmitted(true);
  }

  const inputCls =
    "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15";

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
          <Star className="h-7 w-7 fill-emerald-500 text-emerald-500" />
        </div>
        <p className="text-base font-semibold text-foreground">Thanks for your feedback!</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your review helps other engineers discover PrepAI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Share Your Experience</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Help the community with an honest review.
        </p>
      </div>
      <Separator />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">
            Rating <span className="text-red-400">*</span>
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    n <= (hovered || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30 hover:text-amber-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Name <span className="text-red-400">*</span>
            </Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Role <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputCls}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">
            Your experience <span className="text-red-400">*</span>
          </Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How has PrepAI helped your interview preparation?"
            rows={4}
            required
            className="min-h-[100px] resize-none text-sm placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!name.trim() || !text.trim() || rating === 0}
            className="bg-indigo-600 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50"
          >
            Submit Review
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SettingsTabs() {
  const [active, setActive] = useState("profile");

  const content: Record<string, React.ReactNode> = {
    profile:     <ProfileTab />,
    preferences: <PreferencesTab />,
    feedback:    <FeedbackTab />,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
        <nav className="space-y-0.5" role="tablist" aria-label="Settings sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                active === t.id
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t.label}
              {active === t.id && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 lg:col-span-3">
        {content[active]}
      </div>
    </div>
  );
}
