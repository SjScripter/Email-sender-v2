import { ColumnMapping, SchoolRecord } from "@/types";
import { generateId, isValidEmail } from "./utils";

// Auto-detect likely column mapping from headers
export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  const fieldPatterns: Record<keyof ColumnMapping, RegExp[]> = {
    school_name: [/school.?name/i, /institution/i, /school/i, /name/i],
    email: [/e.?mail/i, /email.?address/i, /mail/i],
    principal_name: [/principal/i, /head/i, /headmaster/i, /principal.?name/i],
    director_name: [/director/i, /trustee/i, /chairman/i],
    city: [/city/i, /town/i, /location/i],
    area: [/area/i, /region/i, /locality/i, /zone/i, /sector/i],
    board: [/board/i, /curriculum/i, /affiliation/i],
    student_count: [/student.?count/i, /students/i, /enrollment/i, /strength/i, /total.?students/i],
    annual_fee: [/fee/i, /annual.?fee/i, /tuition/i, /fees/i],
    academic_performance: [/academic/i, /performance/i, /result/i, /grade/i],
    edtech_maturity: [/edtech/i, /technology/i, /tech.?maturity/i, /digital/i],
    primary_pain: [/pain/i, /challenge/i, /problem/i, /issue/i, /need/i],
    buying_signal: [/buying/i, /signal/i, /intent/i, /interest/i],
    target_score: [/score/i, /target/i, /rating/i, /priority.?score/i, /total.?score/i],
    priority: [/priority/i, /tier/i, /rank/i],
    website: [/website/i, /url/i, /web/i, /site/i],
  };

  const usedHeaders = new Set<string>();

  for (const [field, patterns] of Object.entries(fieldPatterns)) {
    for (const pattern of patterns) {
      const match = headers.find(
        (h) => pattern.test(h) && !usedHeaders.has(h)
      );
      if (match) {
        (mapping as Record<string, string>)[field] = match;
        usedHeaders.add(match);
        break;
      }
    }
  }

  return mapping;
}

// Apply column mapping to raw rows and produce SchoolRecord[]
export function applyMapping(
  rows: Record<string, string>[],
  mapping: Partial<ColumnMapping>
): SchoolRecord[] {
  const emailsSeen = new Set<string>();
  const records: SchoolRecord[] = [];

  for (const row of rows) {
    const get = (field: keyof ColumnMapping): string => {
      const col = mapping[field];
      if (!col) return "";
      const val = row[col];
      return val ? val.trim() : "";
    };

    const schoolName = get("school_name");
    const email = get("email");

    let status: SchoolRecord["status"] = "valid";
    let validationMessage = "";

    if (!email) {
      status = "missing_email";
      validationMessage = "No email address found";
    } else if (!isValidEmail(email)) {
      status = "invalid_email";
      validationMessage = `Invalid email format: ${email}`;
    } else if (emailsSeen.has(email.toLowerCase())) {
      status = "duplicate";
      validationMessage = `Duplicate email: ${email}`;
    } else {
      emailsSeen.add(email.toLowerCase());
    }

    if (!schoolName && status === "valid") {
      status = "missing_name" as SchoolRecord["status"];
      validationMessage = "Missing school name";
    }

    records.push({
      id: generateId(),
      raw: row,
      school_name: schoolName || "Unknown School",
      email: email || "",
      principal_name: get("principal_name") || undefined,
      director_name: get("director_name") || undefined,
      city: get("city") || undefined,
      area: get("area") || undefined,
      board: get("board") || undefined,
      student_count: get("student_count") || undefined,
      annual_fee: get("annual_fee") || undefined,
      academic_performance: get("academic_performance") || undefined,
      edtech_maturity: get("edtech_maturity") || undefined,
      primary_pain: get("primary_pain") || undefined,
      buying_signal: get("buying_signal") || undefined,
      target_score: get("target_score") || undefined,
      priority: get("priority") || undefined,
      website: get("website") || undefined,
      status,
      validationMessage: validationMessage || undefined,
    });
  }

  return records;
}
