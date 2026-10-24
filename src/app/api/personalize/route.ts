import { NextRequest, NextResponse } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { PersonalizeRequest, PersonalizeResponse, SchoolRecord } from "@/types";
import { calculateConfidence } from "@/lib/templateEngine";

const SYSTEM_PROMPT = `You are an AI assistant for legitimate B2B educational outreach.

You will receive:
1. A generic email written by the sender.
2. Structured information about one school.

Your job is to personalize the email so it feels individually written for that school.

Use ONLY facts provided in the structured school information.

Never invent:
- academic achievements
- student numbers
- technology usage
- partnerships
- problems
- principal names
- school initiatives
- fees
- results

Never claim that a school has a problem unless the supplied data explicitly supports that statement.

If Primary Pain is an inference rather than a confirmed fact, phrase the message carefully rather than presenting it as fact.

Do not use aggressive, manipulative, deceptive, spam-like or exaggerated sales language.

Keep the email concise and professional.

Preserve the sender's core proposition.

Personalize primarily:
- subject
- greeting
- opening/context
- one value proposition sentence
- CTA when appropriate

If little information exists about the school, use the generic message rather than inventing personalization.

Return ONLY valid JSON (no markdown, no explanation) with exactly these fields:
{
  "subject": "string",
  "greeting": "string",
  "opening": "string",
  "body": "string",
  "cta": "string"
}`;

// Demo mode mock responses
function generateDemoResponse(school: SchoolRecord): PersonalizeResponse {
  const confidence = calculateConfidence(school);
  const name = school.principal_name
    ? school.principal_name.split(" ").pop()
    : null;

  return {
    subject: `Enhancing learning outcomes at ${school.school_name}`,
    greeting: name
      ? `Dear ${name},`
      : `Dear Team at ${school.school_name},`,
    opening: school.area
      ? `I wanted to reach out to ${school.school_name} in ${school.area}${school.board ? `, a ${school.board} school` : ""}, regarding a personalized academic support platform designed specifically for forward-thinking institutions like yours.`
      : `I wanted to reach out to ${school.school_name} regarding a platform designed to help schools deliver more personalized academic support to every student.`,
    body: school.primary_pain
      ? `Given your focus on ${school.primary_pain.toLowerCase()}, our platform's adaptive learning engine may be especially relevant. We work with schools across India to help teachers identify learning gaps early and provide targeted support at scale.`
      : `Our platform works with schools across India to help teachers identify learning gaps early and deliver personalized support to every student, regardless of class size.`,
    cta: `Would you be open to a 20-minute discovery call to explore whether this could be valuable for ${school.school_name}?`,
    confidence,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: PersonalizeRequest = await req.json();
    const { school, genericSubject, genericBody, demoMode } = body;

    if (!school || !genericSubject || !genericBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Demo mode - skip AI
    if (demoMode || !process.env.GROQ_API_KEY) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
      return NextResponse.json(generateDemoResponse(school));
    }

    const confidence = calculateConfidence(school);

    // Build school context string
    const schoolContext = [
      `School Name: ${school.school_name}`,
      school.principal_name ? `Principal: ${school.principal_name}` : null,
      school.director_name ? `Director: ${school.director_name}` : null,
      school.city ? `City: ${school.city}` : null,
      school.area ? `Area: ${school.area}` : null,
      school.board ? `Board/Curriculum: ${school.board}` : null,
      school.student_count ? `Student Count: ${school.student_count}` : null,
      school.annual_fee ? `Annual Fee (INR): ${school.annual_fee}` : null,
      school.academic_performance
        ? `Academic Performance: ${school.academic_performance}`
        : null,
      school.edtech_maturity
        ? `EdTech Maturity: ${school.edtech_maturity}`
        : null,
      school.primary_pain ? `Primary Pain Point: ${school.primary_pain}` : null,
      school.buying_signal
        ? `Buying Signal: ${school.buying_signal}`
        : null,
      school.target_score ? `Target Score: ${school.target_score}` : null,
      school.priority ? `Priority Tier: ${school.priority}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = `GENERIC EMAIL SUBJECT: ${genericSubject}

GENERIC EMAIL BODY:
${genericBody}

SCHOOL INFORMATION:
${schoolContext}

Please personalize this email for the school above. Return only valid JSON with fields: subject, greeting, opening, body, cta.`;

    const llm = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      maxTokens: 1024,
    });

    const response = await llm.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ]);

    const rawContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Extract JSON from response (handle any extra text)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", rawContent);
      return NextResponse.json({
        ...generateDemoResponse(school),
        error: "AI returned invalid format — using fallback",
      });
    }

    let parsed: {
      subject?: string;
      greeting?: string;
      opening?: string;
      body?: string;
      cta?: string;
    };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({
        ...generateDemoResponse(school),
        error: "AI JSON parse failed — using fallback",
      });
    }

    // Validate required fields
    if (!parsed.subject || !parsed.body) {
      return NextResponse.json({
        ...generateDemoResponse(school),
        error: "AI response missing required fields — using fallback",
      });
    }

    const result: PersonalizeResponse = {
      subject: parsed.subject || genericSubject,
      greeting: parsed.greeting || `Dear Team at ${school.school_name},`,
      opening: parsed.opening || "",
      body: parsed.body || genericBody,
      cta: parsed.cta || "",
      confidence,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    console.error("Personalization error:", error);

    // Rate limit handling
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Groq rate limit reached. Please wait a moment and retry." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "AI personalization failed", details: error?.message },
      { status: 500 }
    );
  }
}
