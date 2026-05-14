import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { db } from "@/lib/db";

export interface GenerateRequestBody {
  role: string;
  experience: string;
  skills: string[];
  interviewTypes: string[];
  countPerType: number;
}

export interface GeneratedQuestion {
  id: string;
  dbId?: string;
  type: string;
  difficulty: string;
  text: string;
  hint: string;
  order: number;
}

export interface GenerateResponse {
  sessionId: string | null;
  role: string;
  experience: string;
  skills: string[];
  interviewTypes: string[];
  questions: GeneratedQuestion[];
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  hr: "HR",
  behavioral: "Behavioral",
  coding: "Coding",
};

function buildPrompt(body: GenerateRequestBody): string {
  const { role, experience, skills, interviewTypes, countPerType } = body;
  const total = interviewTypes.length * countPerType;
  const typeDescriptions = interviewTypes
    .map((t) => `${countPerType} ${TYPE_LABELS[t] ?? t} questions`)
    .join(", ");

  return `You are an expert technical interviewer and career coach with 15+ years of experience hiring for top tech companies.

Generate exactly ${total} interview questions for a ${experience} ${role} candidate.
Candidate's key skills: ${skills.join(", ") || "general software engineering"}.

Question distribution: ${typeDescriptions}.

Question type guidelines:
- technical: Deep conceptual questions about ${skills.slice(0, 3).join(", ")} and software engineering principles. Focus on "how", "why", and trade-offs.
- coding: Algorithmic or practical coding problems appropriate for ${experience} level. Be specific — describe the exact problem clearly.
- behavioral: STAR-method situation-based questions on real workplace scenarios (teamwork, conflict, leadership, failure, success).
- hr: Culture fit, career goals, salary expectations, motivation, work style, and company-specific questions.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "questions": [
    {
      "type": "technical" | "hr" | "behavioral" | "coding",
      "difficulty": "Easy" | "Medium" | "Hard",
      "text": "Full question text here",
      "hint": "2-3 key points or approach the interviewer expects in a strong answer"
    }
  ]
}

Rules:
- Group all questions of the same type together
- Tailor questions specifically to the ${role} role and ${experience} experience level
- Make questions realistic and representative of actual ${role} interviews
- Vary difficulty: roughly 20% Easy, 50% Medium, 30% Hard
- Each hint should be genuinely helpful, not generic`;
}

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // auth unavailable — proceed unauthenticated
    }

    const body: GenerateRequestBody = await req.json();
    const { role, experience, skills, interviewTypes } = body;

    if (!role?.trim()) {
      return NextResponse.json({ error: "Job role is required" }, { status: 400 });
    }
    if (!interviewTypes?.length) {
      return NextResponse.json({ error: "Select at least one interview type" }, { status: 400 });
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const prompt = buildPrompt(body);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical interviewer. Always respond with valid JSON only — no markdown fences, no explanations, just the raw JSON object.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let parsed: { questions: Array<{ type: string; difficulty: string; text: string; hint: string }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    if (!Array.isArray(parsed.questions)) {
      return NextResponse.json({ error: "Unexpected AI response structure" }, { status: 500 });
    }

    const questions: GeneratedQuestion[] = parsed.questions.map((q, i) => ({
      id: `q_${i}`,
      type: q.type,
      difficulty: q.difficulty,
      text: q.text,
      hint: q.hint,
      order: i,
    }));

    let sessionId: string | null = null;

    if (userId) {
      try {
        const session = await db.interviewSession.create({
          data: {
            userId,
            role,
            experience,
            skills: JSON.stringify(skills),
            interviewTypes: JSON.stringify(interviewTypes),
            totalCount: questions.length,
            questions: {
              create: questions.map((q) => ({
                type: q.type,
                difficulty: q.difficulty,
                text: q.text,
                hint: q.hint,
                order: q.order,
              })),
            },
          },
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        });
        sessionId = session.id;
        session.questions.forEach((dbQ, i) => {
          if (questions[i]) questions[i].dbId = dbQ.id;
        });
      } catch {
        // DB unavailable — return questions without persisting
      }
    }

    const response: GenerateResponse = {
      sessionId,
      role,
      experience,
      skills,
      interviewTypes,
      questions,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[generate-questions]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
