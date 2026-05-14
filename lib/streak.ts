import { db } from "@/lib/db";

/**
 * Returns today's date as "YYYY-MM-DD" in UTC.
 * UTC is used consistently so the comparison is timezone-safe across all users.
 */
function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function utcYesterday(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

/**
 * Called once per session creation. Implements the streak rules:
 *   - Same day as lastActivityDate → no-op (prevents double-counting)
 *   - Consecutive day (yesterday) → currentStreak + 1
 *   - Any gap ≥ 1 day            → reset to 1
 *   - longestStreak updated when currentStreak exceeds it
 */
export async function updateUserStreak(userId: string): Promise<void> {
  const today = utcToday();
  const yesterday = utcYesterday();

  const existing = await db.userStreak.findUnique({ where: { userId } });

  if (!existing) {
    await db.userStreak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
    });
    return;
  }

  // Same day — already counted, nothing to do
  if (existing.lastActivityDate === today) return;

  const newCurrent =
    existing.lastActivityDate === yesterday
      ? existing.currentStreak + 1  // consecutive day
      : 1;                          // gap ≥ 1 day — reset

  await db.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrent,
      longestStreak: Math.max(existing.longestStreak, newCurrent),
      lastActivityDate: today,
    },
  });
}
