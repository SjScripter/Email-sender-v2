import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { BatchSendRequest, SendingResult } from "@/types";
import { buildEmailHtml } from "@/lib/templateEngine";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const body: BatchSendRequest = await req.json();
    const { schools, emailConfig, promotionalMaterial, demoMode } = body;

    if (!schools || schools.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results: SendingResult[] = [];

    for (const { school, email } of schools) {
      // Build the full HTML for this email
      const html = buildEmailHtml(
        email,
        emailConfig.senderName,
        promotionalMaterial.type === "html"
          ? promotionalMaterial.html
          : undefined,
        promotionalMaterial.type === "image"
          ? promotionalMaterial.imageData
          : undefined,
        promotionalMaterial.imageName,
        promotionalMaterial.imageDisplayMode
      );

      // Demo mode — simulate sending
      if (demoMode || !resend || !process.env.RESEND_API_KEY) {
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
        const succeed = Math.random() > 0.05; // 95% success in demo
        results.push({
          schoolId: school.id,
          school_name: school.school_name,
          email: school.email,
          principal_name: school.principal_name,
          target_score: school.target_score,
          priority: school.priority,
          subject: email.subject,
          personalization_confidence: email.confidence,
          status: succeed ? "demo" : "failed",
          messageId: succeed ? `demo_${Date.now()}_${school.id}` : undefined,
          error: succeed ? undefined : "Demo simulated failure",
          sentAt: new Date().toISOString(),
        });
        continue;
      }

      // Real sending via Resend
      try {
        // Build attachments
        const attachments: Array<{
          filename: string;
          content: Buffer;
        }> = [];

        if (
          promotionalMaterial.type === "pdf" &&
          promotionalMaterial.pdfData
        ) {
          const base64 = promotionalMaterial.pdfData.split(",")[1] || promotionalMaterial.pdfData;
          attachments.push({
            filename: promotionalMaterial.pdfName || "brochure.pdf",
            content: Buffer.from(base64, "base64"),
          });
        }

        if (
          promotionalMaterial.type === "image" &&
          promotionalMaterial.imageData &&
          promotionalMaterial.imageDisplayMode === "attachment"
        ) {
          const base64 = promotionalMaterial.imageData.split(",")[1] || promotionalMaterial.imageData;
          const ext = (promotionalMaterial.imageName || "image.jpg")
            .split(".")
            .pop();
          attachments.push({
            filename: promotionalMaterial.imageName || `image.${ext}`,
            content: Buffer.from(base64, "base64"),
          });
        }

        const fromAddress =
          process.env.EMAIL_FROM ||
          `${emailConfig.senderName} <outreach@example.com>`;
        const replyTo = emailConfig.replyTo || process.env.EMAIL_REPLY_TO;

        const sendResult = await resend.emails.send({
          from: fromAddress,
          to: [school.email],
          replyTo: replyTo || undefined,
          subject: email.subject,
          html,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (sendResult.error) {
          results.push({
            schoolId: school.id,
            school_name: school.school_name,
            email: school.email,
            principal_name: school.principal_name,
            target_score: school.target_score,
            priority: school.priority,
            subject: email.subject,
            personalization_confidence: email.confidence,
            status: "failed",
            error: sendResult.error.message || "Resend error",
            sentAt: new Date().toISOString(),
          });
        } else {
          results.push({
            schoolId: school.id,
            school_name: school.school_name,
            email: school.email,
            principal_name: school.principal_name,
            target_score: school.target_score,
            priority: school.priority,
            subject: email.subject,
            personalization_confidence: email.confidence,
            status: "sent",
            messageId: sendResult.data?.id,
            sentAt: new Date().toISOString(),
          });
        }
      } catch (sendErr: unknown) {
        const error = sendErr as { message?: string; statusCode?: number };
        console.error("Send error for", school.email, error);

        results.push({
          schoolId: school.id,
          school_name: school.school_name,
          email: school.email,
          principal_name: school.principal_name,
          target_score: school.target_score,
          priority: school.priority,
          subject: email.subject,
          personalization_confidence: email.confidence,
          status: "failed",
          error: error?.message || "Unknown send error",
          sentAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Batch send error:", error);
    return NextResponse.json(
      { error: "Batch send failed", details: error?.message },
      { status: 500 }
    );
  }
}
