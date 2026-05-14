import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface StreakData {
  current: number;
  longest: number;
  lastActivity: string | null;
}

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      userId = (await auth()).userId;
    } catch {}
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const streak = await db.userStreak.findUnique({ where: { userId } });

    if (!streak) {
      return NextResponse.json({ current: 0, longest: 0, lastActivity: null } satisfies StreakData);
    }

    return NextResponse.json({
      current: streak.currentStreak,
      longest: streak.longestStreak,
      lastActivity: streak.lastActivityDate ?? null,
    } satisfies StreakData);
  } catch (error) {
    console.error("[streak GET]", error);
    return NextResponse.json({ current: 0, longest: 0, lastActivity: null } satisfies StreakData);
  }
}
