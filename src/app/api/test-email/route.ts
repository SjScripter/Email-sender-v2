import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { TestEmailRequest } from "@/types";
import { buildEmailHtml } from "@/lib/templateEngine";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const body: TestEmailRequest = await req.json();
    const { to, school, email, emailConfig, promotionalMaterial, demoMode } = body;

    if (!to || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Invalid test email address" },
        { status: 400 }
      );
    }

    const html = buildEmailHtml(
      email,
      emailConfig.senderName,
      promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
      promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
      promotionalMaterial.imageName,
      promotionalMaterial.imageDisplayMode
    );

    // Demo mode
    if (demoMode || !resend || !process.env.RESEND_API_KEY) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({
        success: true,
        demo: true,
        message: `DEMO: Test email simulated (not actually sent) to ${to}`,
      });
    }

    const fromAddress =
      process.env.EMAIL_FROM ||
      `${emailConfig.senderName} <outreach@example.com>`;

    const testSubject = `[TEST] ${email.subject}`;

    const result = await resend.emails.send({
      from: fromAddress,
      to: [to],
      replyTo: emailConfig.replyTo || process.env.EMAIL_REPLY_TO || undefined,
      subject: testSubject,
      html: `<div style="background:#fef3c7;border:2px solid #f59e0b;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-family:sans-serif;"><strong>⚠️ TEST EMAIL</strong> — This is a test send for school: <strong>${school?.school_name || "Preview"}</strong></div>${html}`,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: `Test email sent to ${to}`,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
