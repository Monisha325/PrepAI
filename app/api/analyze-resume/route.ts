import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { db } from "@/lib/db";

export interface SectionScore {
  label: string;
  score: number;
  feedback: string;
}

export interface Suggestion {
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
}

export interface ResumeAnalysisResult {
  atsScore: number;
  grade: string;
  extractedName: string;
  extractedRole: string;
  skills: string[];
  sectionScores: SectionScore[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Suggestion[];
  summary: string;
}

function buildPrompt(resumeText: string, jobTitle: string): string {
  return `You are an expert ATS (Applicant Tracking System) analyst and resume coach. Analyze the following resume for ATS compatibility${jobTitle ? ` targeting a "${jobTitle}" role` : ""}.

RESUME TEXT:
---
${resumeText.slice(0, 6000)}
---

Return ONLY valid JSON with this exact structure:
{
  "atsScore": <overall ATS compatibility score 0-100>,
  "grade": "Excellent" | "Good" | "Fair" | "Needs Work",
  "extractedName": "<candidate's full name, or 'Unknown' if not found>",
  "extractedRole": "<current or target job title from resume>",
  "skills": ["<skill1>", "<skill2>", ...],
  "sectionScores": [
    { "label": "Contact Info",       "score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Professional Summary","score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Work Experience",    "score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Skills",             "score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Education",          "score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Projects",           "score": <0-100>, "feedback": "<1 sentence>" },
    { "label": "Certifications",     "score": <0-100>, "feedback": "<1 sentence>" }
  ],
  "matchedKeywords": ["<keyword found in resume>", ...],
  "missingKeywords": ["<important keyword NOT in resume>", ...],
  "suggestions": [
    { "severity": "high" | "medium" | "low", "title": "<short title>", "body": "<2-3 sentence actionable advice>" },
    ...
  ],
  "summary": "<3-4 sentence overall ATS assessment>"
}

Rules:
- matchedKeywords: 10-20 industry-relevant keywords actually present in the resume
- missingKeywords: 5-10 high-value keywords for this role that are absent
- suggestions: 4-6 items, ordered high → medium → low severity
- Be direct and specific — name actual sections, bullet points, or phrases
- Score sections that are absent as 0-20
- Grade: Excellent ≥85, Good ≥70, Fair ≥55, else Needs Work`;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobTitle = (formData.get("jobTitle") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    // Parse PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText = "";
    try {
      // pdf-parse v2 uses a class-based API; dynamic import handles the ESM package
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PDFParse } = (await import("pdf-parse")) as any;
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText({ pageJoiner: "\n" });
      await parser.destroy();
      resumeText = (textResult.text ?? "").trim();
    } catch (err) {
      console.error("[analyze-resume] pdf-parse error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isPasswordErr = /password/i.test(msg);
      return NextResponse.json(
        {
          error: isPasswordErr
            ? "This PDF is password-protected. Remove the password and try again."
            : "Failed to parse PDF. Make sure it is not a scanned/image-only PDF.",
        },
        { status: 422 }
      );
    }

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: "Could not extract text from this PDF. Try a text-based PDF." }, { status: 422 });
    }

    // Groq analysis
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional ATS resume analyst. Always respond with valid JSON only — no markdown fences, no extra text.",
        },
        { role: "user", content: buildPrompt(resumeText, jobTitle) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let result: ResumeAnalysisResult;
    try {
      result = JSON.parse(content) as ResumeAnalysisResult;
    } catch {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    // Persist to DB (best-effort)
    let userId: string | null = null;
    try { userId = (await auth()).userId; } catch {}

    if (userId) {
      try {
        await db.resumeAnalysis.create({
          data: {
            userId,
            filename: file.name,
            atsScore: result.atsScore,
            sectionScores: JSON.stringify(result.sectionScores),
            matchedKeywords: JSON.stringify(result.matchedKeywords),
            missingKeywords: JSON.stringify(result.missingKeywords),
            suggestions: JSON.stringify(result.suggestions),
            extractedName: result.extractedName,
            extractedRole: result.extractedRole,
            skills: JSON.stringify(result.skills),
          },
        });
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ...result, filename: file.name });
  } catch (error) {
    console.error("[analyze-resume]", error);
    const msg = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Allow large form data for PDF uploads
export const config = { api: { bodyParser: false } };
