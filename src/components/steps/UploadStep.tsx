"use client";

import { useCallback, useState } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { autoDetectMapping } from "@/lib/columnMapper";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  X,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export function UploadStep() {
  const { state, dispatch, goToStep } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: Record<string, string>[];
    fileName: string;
    rowCount: number;
  } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    const allowed = [".csv", ".xlsx", ".xls"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError("Please upload a .csv, .xlsx, or .xls file.");
      setIsUploading(false);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        setIsUploading(false);
        return;
      }

      setPreview(data);
      dispatch({
        type: "SET_FILE_DATA",
        headers: data.headers,
        rows: data.rows,
        fileName: data.fileName,
      });

      // Auto-detect column mapping
      const mapping = autoDetectMapping(data.headers);
      dispatch({ type: "SET_COLUMN_MAPPING", mapping });

      toast.success(`Loaded ${data.rowCount} rows from ${data.fileName}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [dispatch]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const loadSampleData = useCallback(async () => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch("/sample-schools.csv");
      const text = await res.text();
      const file = new File([text], "sample-schools.csv", { type: "text/csv" });
      await processFile(file);
      dispatch({ type: "SET_DEMO_MODE", value: true });
      toast.success("Demo data loaded! Demo Mode is now ON.");
    } catch {
      setError("Failed to load sample data.");
    } finally {
      setIsUploading(false);
    }
  }, [processFile, dispatch]);

  const clear = useCallback(() => {
    setPreview(null);
    setError(null);
    dispatch({ type: "SET_FILE_DATA", headers: [], rows: [], fileName: "" });
  }, [dispatch]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Demo mode banner */}
      {state.demoMode && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Demo Mode Active</p>
            <p className="text-xs text-blue-400/70">
              AI personalization is simulated. Emails will NOT be sent.
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_DEMO_MODE", value: false })}
            className="ml-auto text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Disable
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!preview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
            isDragging
              ? "border-blue-400 bg-blue-500/10 scale-[1.01]"
              : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              <p className="text-white/60">Parsing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  Drop your school file here
                </p>
                <p className="text-sm text-white/50 mt-1">
                  or click to browse — supports .csv, .xlsx, .xls (max 10MB)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/30">
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV</span>
                <span>•</span>
                <span>Excel (.xlsx)</span>
                <span>•</span>
                <span>Excel (.xls)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* File preview */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">
                  {preview.fileName}
                </p>
                <p className="text-xs text-green-400/70">
                  {preview.rowCount} rows · {preview.headers.length} columns
                </p>
              </div>
            </div>
            <button
              onClick={clear}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview table */}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 bg-white/3 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs font-medium text-white/60">
                Preview (first 5 rows)
              </p>
              <p className="text-xs text-white/40">
                {preview.headers.length} columns detected
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/3">
                    {preview.headers.slice(0, 8).map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-white/50 font-medium whitespace-nowrap border-b border-white/10"
                      >
                        {h}
                      </th>
                    ))}
                    {preview.headers.length > 8 && (
                      <th className="px-3 py-2 text-white/30 border-b border-white/10">
                        +{preview.headers.length - 8} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="table-row-hover border-b border-white/5 last:border-0">
                      {preview.headers.slice(0, 8).map((h) => (
                        <td
                          key={h}
                          className="px-3 py-2 text-white/70 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis"
                        >
                          {row[h] || "—"}
                        </td>
                      ))}
                      {preview.headers.length > 8 && (
                        <td className="px-3 py-2 text-white/30">…</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => goToStep("map")}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
          >
            Continue to Column Mapping →
          </button>
        </div>
      )}

      {/* Or use sample data */}
      {!preview && (
        <div className="text-center">
          <p className="text-sm text-white/40 mb-3">— or try it out with —</p>
          <button
            onClick={loadSampleData}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 text-white/70 hover:text-blue-300 text-sm font-medium transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Load Sample School Data (Demo Mode)
          </button>
        </div>
      )}
    </div>
  );
}
