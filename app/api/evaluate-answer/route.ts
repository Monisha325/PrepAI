import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { db } from "@/lib/db";

export interface EvaluateRequestBody {
  question: string;
  answer: string;
  questionType: string;
  difficulty: string;
  role: string;
  experience: string;
  /** DB question id — if present, evaluation will be persisted */
  dbQuestionId?: string;
}

export interface EvaluationDimension {
  label: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  overallScore: number;
  dimensions: {
    technicalAccuracy: EvaluationDimension;
    communication: EvaluationDimension;
    relevance: EvaluationDimension;
    confidence: EvaluationDimension;
  };
  strengths: string[];
  improvements: string[];
  summary: string;
}

function buildEvalPrompt(body: EvaluateRequestBody): string {
  const { question, answer, questionType, difficulty, role, experience } = body;
  return `You are an expert ${role} interviewer evaluating a candidate's interview answer.

Context:
- Role: ${role}
- Experience Level: ${experience}
- Question Type: ${questionType}
- Difficulty: ${difficulty}

Question:
"${question}"

Candidate's Answer:
"${answer}"

Evaluate across 4 dimensions (score each 0-100):

1. **Technical Accuracy** — Factually correct? Concepts used properly? Appropriate depth for ${difficulty} difficulty?
2. **Communication** — Clear, well-structured, easy to follow? No rambling or filler?
3. **Relevance** — Directly addresses what was asked? Stays on topic?
4. **Confidence** — Conveys conviction? Avoids excessive hedging?

Return ONLY valid JSON:
{
  "overallScore": <weighted average 0-100>,
  "dimensions": {
    "technicalAccuracy": { "label": "Technical Accuracy", "score": <0-100>, "feedback": "<1-2 specific sentences>" },
    "communication":     { "label": "Communication",      "score": <0-100>, "feedback": "<1-2 specific sentences>" },
    "relevance":         { "label": "Relevance",          "score": <0-100>, "feedback": "<1-2 specific sentences>" },
    "confidence":        { "label": "Confidence",         "score": <0-100>, "feedback": "<1-2 specific sentences>" }
  },
  "strengths":    ["<concrete strength>", "<concrete strength>"],
  "improvements": ["<actionable improvement>", "<actionable improvement>", "<actionable improvement>"],
  "summary": "<2-3 sentence honest, constructive assessment>"
}

Be direct and honest. Low scores are fine if the answer is weak — pair them with specific guidance.`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const body: EvaluateRequestBody = await req.json();
    const { question, answer, dbQuestionId } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (!answer?.trim()) {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional interview evaluator. Always respond with valid JSON only — no markdown fences, no explanations, just the raw JSON object.",
        },
        { role: "user", content: buildEvalPrompt(body) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let result: EvaluationResult;
    try {
      result = JSON.parse(content) as EvaluationResult;
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    // Persist to DB if we have a real question id and auth context
    if (dbQuestionId) {
      try {
        let userId: string | null = null;
        try {
          userId = (await auth()).userId;
        } catch {}

        if (userId) {
          await db.answerEvaluation.create({
            data: {
              questionId: dbQuestionId,
              answer: answer.trim(),
              overallScore: result.overallScore,
              technicalScore: result.dimensions.technicalAccuracy.score,
              communicationScore: result.dimensions.communication.score,
              relevanceScore: result.dimensions.relevance.score,
              confidenceScore: result.dimensions.confidence.score,
              strengths: JSON.stringify(result.strengths),
              improvements: JSON.stringify(result.improvements),
              summary: result.summary,
            },
          });
        }
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[evaluate-answer]", error);
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
