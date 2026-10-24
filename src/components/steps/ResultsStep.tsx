"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { SendingResult } from "@/types";
import { StatusBadge, ConfidenceBadge } from "@/components/Badges";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Download,
  Filter,
  BarChart3,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ResultsStep() {
  const { state, dispatch } = useApp();
  const { sendingResults, demoMode } = state;
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const total = sendingResults.length;
    const sent = sendingResults.filter(
      (r) => r.status === "sent" || r.status === "demo"
    ).length;
    const failed = sendingResults.filter((r) => r.status === "failed").length;
    const skipped = sendingResults.filter((r) => r.status === "skipped").length;
    return { total, sent, failed, skipped };
  }, [sendingResults]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sendingResults;
    if (statusFilter === "sent")
      return sendingResults.filter(
        (r) => r.status === "sent" || r.status === "demo"
      );
    return sendingResults.filter((r) => r.status === statusFilter);
  }, [sendingResults, statusFilter]);

  const downloadCSV = () => {
    const rows = sendingResults.map((r) => ({
      "School Name": r.school_name,
      Email: r.email,
      "Principal Name": r.principal_name || "",
      "Target Score": r.target_score || "",
      Priority: r.priority || "",
      "Personalized Subject": r.subject,
      "Personalization Confidence": r.personalization_confidence,
      Status: r.status,
      "Message ID": r.messageId || "",
      Error: r.error || "",
      "Sent At": r.sentAt || "",
    }));

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  };

  const downloadExcel = () => {
    const rows = sendingResults.map((r) => ({
      "School Name": r.school_name,
      Email: r.email,
      "Principal Name": r.principal_name || "",
      "Target Score": r.target_score || "",
      Priority: r.priority || "",
      "Personalized Subject": r.subject,
      "Personalization Confidence": r.personalization_confidence,
      Status: r.status,
      "Message ID": r.messageId || "",
      Error: r.error || "",
      "Sent At": r.sentAt || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `campaign-results-${Date.now()}.xlsx`);
    toast.success("Excel downloaded.");
  };

  const startNew = () => {
    dispatch({ type: "RESET" });
  };

  if (sendingResults.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-white/30" />
        </div>
        <p className="text-white/40">No sending results yet.</p>
        <p className="text-sm text-white/30">
          Complete the Send step to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Demo mode banner */}
      {demoMode && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 text-center">
          ⚠️ DEMO MODE — These results are simulated. No actual emails were sent.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "blue", icon: "📬" },
          { label: "Sent", value: stats.sent, color: "green", icon: "✅" },
          { label: "Failed", value: stats.failed, color: "red", icon: "❌" },
          { label: "Skipped", value: stats.skipped, color: "gray", icon: "⏭" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-5 rounded-2xl bg-white/3 border border-white/10 text-center"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div
              className={cn(
                "text-3xl font-bold",
                s.color === "blue" && "text-blue-400",
                s.color === "green" && "text-green-400",
                s.color === "red" && "text-red-400",
                s.color === "gray" && "text-gray-400"
              )}
            >
              {s.value}
            </div>
            <div className="text-xs text-white/50 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Success rate bar */}
      {stats.total > 0 && (
        <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Success Rate</span>
            <span className="font-semibold text-white">
              {Math.round((stats.sent / stats.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
              style={{ width: `${(stats.sent / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          {["all", "sent", "failed", "skipped"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                statusFilter === f
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-white/50 hover:text-white/70 border border-white/10 hover:border-white/20"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel (.xlsx)
          </button>
          <button
            onClick={startNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f172a] z-10">
              <tr>
                {[
                  "School Name",
                  "Email",
                  "Score",
                  "Priority",
                  "Confidence",
                  "Status",
                  "Message ID",
                  "Error",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-white/50 font-medium text-xs border-b border-white/10 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-white/40 text-sm"
                  >
                    No results match this filter
                  </td>
                </tr>
              ) : (
                filtered.map((result, i) => (
                  <tr
                    key={i}
                    className="table-row-hover border-b border-white/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-white/90 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {result.status === "sent" || result.status === "demo" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : result.status === "failed" ? (
                          <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        ) : null}
                        {result.school_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                      {result.email}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {result.target_score || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {result.priority || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge
                        confidence={result.personalization_confidence}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-white/30 font-mono max-w-[120px] truncate">
                      {result.messageId || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-red-400/70 max-w-[160px] truncate">
                      {result.error || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder */}
      <div className="p-3 rounded-xl bg-white/3 border border-white/10 flex items-start gap-2">
        <Download className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/50">
          <strong className="text-white/70">Remember:</strong> There is no permanent database.
          Download the CSV or Excel file now to keep a record of this campaign.
          Campaign data will be lost when you close this browser tab.
        </p>
      </div>
    </div>
  );
}
