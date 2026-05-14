import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/groq";

export interface InsightsRequest {
  avgScore: number;
  totalEvaluations: number;
  activeDays: number;
  streak: number;
  dimensions: {
    technicalAccuracy: number;
    communication: number;
    relevance: number;
    confidence: number;
  };
  scoreTrend: "improving" | "declining" | "stable";
  weakestDimension: string;
  strongestDimension: string;
}

export interface AIInsight {
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  action: string;
}

export interface InsightsResponse {
  insights: AIInsight[];
}

function buildPrompt(s: InsightsRequest): string {
  const dimMap: Record<string, string> = {
    technicalAccuracy: "Technical Accuracy",
    communication: "Communication",
    relevance: "Relevance",
    confidence: "Confidence",
  };
  return `You are a professional technical interview coach reviewing a candidate's practice analytics.

Candidate Stats:
- Average Score: ${s.avgScore}%
- Total Answers Evaluated: ${s.totalEvaluations}
- Active Practice Days: ${s.activeDays}
- Current Streak: ${s.streak} day${s.streak !== 1 ? "s" : ""}
- Score Trend: ${s.scoreTrend}
- Technical Accuracy avg: ${s.dimensions.technicalAccuracy}%
- Communication avg: ${s.dimensions.communication}%
- Relevance avg: ${s.dimensions.relevance}%
- Confidence avg: ${s.dimensions.confidence}%
- Weakest Area: ${dimMap[s.weakestDimension] ?? s.weakestDimension}
- Strongest Area: ${dimMap[s.strongestDimension] ?? s.strongestDimension}

Generate 4 specific, actionable coaching insights to help this candidate improve.

Return ONLY valid JSON:
{
  "insights": [
    {
      "priority": "high" | "medium" | "low",
      "title": "<6 words max>",
      "body": "<2 sentences of specific, personalized advice based on the stats>",
      "action": "<one concrete immediate step they can take today>"
    }
  ]
}

Rules:
- Focus on the weakest dimension (${dimMap[s.weakestDimension] ?? s.weakestDimension}) first
- Mention actual numbers where relevant (e.g., "your ${dimMap[s.weakestDimension] ?? s.weakestDimension} score of ${Math.min(s.dimensions.technicalAccuracy, s.dimensions.communication, s.dimensions.relevance, s.dimensions.confidence)}%")
- Be direct and specific, not generic
- Order high → medium → low priority
- If trend is declining, address that urgently`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const stats: InsightsRequest = await req.json();

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional interview coach. Respond with valid JSON only — no markdown, no extra text.",
        },
        { role: "user", content: buildPrompt(stats) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 900,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const result = JSON.parse(content) as InsightsResponse;
    return NextResponse.json(result);
  } catch (error) {
    console.error("[analytics-insights]", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
