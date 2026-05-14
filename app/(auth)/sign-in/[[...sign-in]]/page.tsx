"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const darkVars = {
  colorPrimary: "#6366f1",
  colorBackground: "#1a1a1a",
  colorText: "#fafafa",
  colorTextSecondary: "#a1a1aa",
  colorInputBackground: "#27272a",
  colorInputText: "#fafafa",
  colorNeutral: "#52525b",
  borderRadius: "0.75rem",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
} as const;

const lightVars = {
  colorPrimary: "#6366f1",
  borderRadius: "0.75rem",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
} as const;

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <SignIn
      appearance={{
        variables: resolvedTheme === "dark" ? darkVars : lightVars,
        elements: {
          card: "shadow-2xl shadow-indigo-500/10",
          formButtonPrimary:
            "bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold",
          footerActionLink: "text-indigo-500 hover:text-indigo-400 font-medium",
          identityPreviewEditButtonIcon: "text-indigo-500",
        },
      }}
    />
  );
}
