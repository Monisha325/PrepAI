"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

export function SidebarUserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const name = user?.fullName ?? user?.username ?? "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href="/dashboard/settings"
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-muted/60"
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user?.imageUrl} alt={name} />
        <AvatarFallback className="bg-indigo-500/10 text-xs font-semibold text-indigo-400">
          {initials || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{name}</p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">{email}</p>
      </div>
      <ChevronRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}
