import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface StreakData {
  current: number;
  longest: number;
  lastActivity: string | null;
}

function computeStreakFromDays(sortedDays: string[]): { current: number; longest: number } {
  if (!sortedDays.length) return { current: 0, longest: 0 };

  const daySet = new Set(sortedDays);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Current streak: walk backward from today; if today has no activity, start from yesterday.
  // This means a streak isn't broken until two consecutive days with no activity.
  let current = 0;
  const startDay = daySet.has(today) ? today : daySet.has(yesterday) ? yesterday : null;
  if (startDay) {
    const d = new Date(startDay + "T12:00:00Z");
    while (daySet.has(d.toISOString().slice(0, 10))) {
      current++;
      d.setUTCDate(d.getUTCDate() - 1);
    }
  }

  // Longest streak: max consecutive run across all history
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = Math.round(
      (new Date(sortedDays[i] + "T12:00:00Z").getTime() -
        new Date(sortedDays[i - 1] + "T12:00:00Z").getTime()) /
        86400000,
    );
    if (diff === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  return { current, longest };
}

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      userId = (await auth()).userId;
    } catch {}
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await db.interviewSession.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const uniqueDays = [
      ...new Set(sessions.map((s) => s.createdAt.toISOString().slice(0, 10))),
    ].sort();

    const { current, longest } = computeStreakFromDays(uniqueDays);
    const lastActivity = uniqueDays.length ? uniqueDays[uniqueDays.length - 1] : null;

    return NextResponse.json({ current, longest, lastActivity } satisfies StreakData);
  } catch (error) {
    console.error("[streak GET]", error);
    return NextResponse.json({ current: 0, longest: 0, lastActivity: null } satisfies StreakData);
  }
}
