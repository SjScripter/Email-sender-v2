import { PersonalizedEmail, SchoolRecord } from "@/types";

// Replace template variables like {{school_name}} with actual values
export function applyTemplateVariables(
  template: string,
  school: SchoolRecord
): string {
  const fallback = (val: string | undefined, fb: string) =>
    val && val.trim() ? val.trim() : fb;

  const replacements: Record<string, string> = {
    school_name: fallback(school.school_name, "Your School"),
    principal_name: fallback(school.principal_name, ""),
    director_name: fallback(school.director_name, ""),
    city: fallback(school.city, ""),
    area: fallback(school.area, ""),
    board: fallback(school.board, ""),
    student_count: fallback(school.student_count, ""),
    annual_fee: fallback(school.annual_fee, ""),
    academic_performance: fallback(school.academic_performance, ""),
    edtech_maturity: fallback(school.edtech_maturity, ""),
    primary_pain: fallback(school.primary_pain, ""),
    buying_signal: fallback(school.buying_signal, ""),
    target_score: fallback(school.target_score, ""),
    priority: fallback(school.priority, ""),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return replacements[key] !== undefined ? replacements[key] : `{{${key}}}`;
  });
}

// Build the smart greeting fallback
export function buildGreeting(school: SchoolRecord): string {
  if (school.principal_name && school.principal_name.trim()) {
    const name = school.principal_name.trim();
    // Extract last name for formal greeting
    const parts = name.split(" ");
    const lastName = parts[parts.length - 1];
    return `Dear ${lastName},`;
  }
  if (school.director_name && school.director_name.trim()) {
    const name = school.director_name.trim();
    const parts = name.split(" ");
    const lastName = parts[parts.length - 1];
    return `Dear ${lastName},`;
  }
  return `Dear Team at ${school.school_name},`;
}

// Build the full HTML email from a PersonalizedEmail object
export function buildEmailHtml(
  email: PersonalizedEmail,
  senderName: string,
  promotionalHtml?: string,
  imageData?: string,
  imageName?: string,
  imageDisplayMode?: "inline" | "attachment"
): string {
  const promoSection =
    promotionalHtml
      ? `<div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">${promotionalHtml}</div>`
      : "";

  const inlineImage =
    imageData && imageDisplayMode === "inline"
      ? `<div style="margin-top:24px;text-align:center;"><img src="cid:promo-image" alt="${imageName || "Promotional Image"}" style="max-width:100%;border-radius:8px;" /></div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${email.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#4f46e5);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.3px;">SchoolReach AI</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Personalized Educational Outreach</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#111827;">${email.greeting}</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">${email.opening}</p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">${email.body.replace(/\n/g, "<br>")}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">${email.cta}</p>
            ${inlineImage}
            ${promoSection}
            <!-- Footer -->
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:14px;color:#6b7280;">Best regards,<br><strong style="color:#374151;">${senderName}</strong></p>
            </div>
          </td>
        </tr>
        <!-- Bottom bar -->
        <tr>
          <td style="background:#f9fafb;padding:16px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent via SchoolReach AI. If you believe you received this in error, please reply to let us know.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// Calculate personalization confidence based on available data
export function calculateConfidence(
  school: SchoolRecord
): "high" | "medium" | "low" {
  const fields = [
    school.principal_name,
    school.area,
    school.board,
    school.edtech_maturity,
    school.primary_pain,
    school.buying_signal,
    school.academic_performance,
    school.student_count,
  ].filter((f) => f && f.trim());

  if (fields.length >= 4) return "high";
  if (fields.length >= 2) return "medium";
  return "low";
}

// Build a generic (non-AI) email from template
export function buildGenericEmail(
  school: SchoolRecord,
  subject: string,
  body: string,
  senderName: string,
  promotionalHtml?: string,
  imageData?: string,
  imageName?: string,
  imageDisplayMode?: "inline" | "attachment"
): PersonalizedEmail {
  const processedSubject = applyTemplateVariables(subject, school);
  const processedBody = applyTemplateVariables(body, school);
  const greeting = buildGreeting(school);
  const confidence = calculateConfidence(school);

  const email: PersonalizedEmail = {
    schoolId: school.id,
    subject: processedSubject,
    greeting,
    opening: "",
    body: processedBody,
    cta: "",
    fullHtml: "",
    confidence,
    isPersonalized: false,
    isManuallyEdited: false,
    generatedAt: new Date().toISOString(),
  };

  email.fullHtml = buildEmailHtml(
    email,
    senderName,
    promotionalHtml,
    imageData,
    imageName,
    imageDisplayMode
  );

  return email;
}
