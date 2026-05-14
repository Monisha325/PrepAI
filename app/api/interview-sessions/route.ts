import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // auth unavailable
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        questions: {
          select: { id: true, type: true, difficulty: true },
        },
      },
    });

    const result = sessions.map((s) => ({
      id: s.id,
      role: s.role,
      experience: s.experience,
      skills: JSON.parse(s.skills) as string[],
      interviewTypes: JSON.parse(s.interviewTypes) as string[],
      totalCount: s.totalCount,
      createdAt: s.createdAt.toISOString(),
      typeCounts: s.questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.type] = (acc[q.type] ?? 0) + 1;
        return acc;
      }, {}),
    }));

    return NextResponse.json({ sessions: result });
  } catch (error) {
    console.error("[interview-sessions GET]", error);
    return NextResponse.json({ sessions: [] });
  }
}
