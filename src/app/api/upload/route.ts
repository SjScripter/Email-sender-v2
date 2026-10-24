import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let headers: string[] = [];
    let rows: Record<string, string>[] = [];

    if (fileName.endsWith(".csv")) {
      // Parse CSV server-side using basic logic (papaparse is client-side friendly)
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV file appears to be empty or has only headers." },
          { status: 400 }
        );
      }

      // Parse headers (handle quoted fields)
      headers = parseCSVLine(lines[0]);
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.every((v) => !v.trim())) continue; // skip blank rows
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json(
          { error: "Excel file has no sheets." },
          { status: 400 }
        );
      }
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });

      if (jsonData.length === 0) {
        return NextResponse.json(
          { error: "Excel sheet appears to be empty." },
          { status: 400 }
        );
      }

      headers = Object.keys(jsonData[0]);
      rows = jsonData.map((row) => {
        const strRow: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          strRow[k] = v != null ? String(v) : "";
        }
        return strRow;
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload .csv, .xlsx, or .xls" },
        { status: 400 }
      );
    }

    if (headers.length === 0) {
      return NextResponse.json(
        { error: "Could not read column headers from file." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      headers,
      rows,
      fileName: file.name,
      rowCount: rows.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to parse file. Please check the format." },
      { status: 500 }
    );
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
