"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { applyMapping } from "@/lib/columnMapper";
import { ColumnMapping } from "@/types";
import { toast } from "sonner";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  school_name: "School Name *",
  email: "Email *",
  principal_name: "Principal Name",
  director_name: "Director Name",
  city: "City",
  area: "Area / Region",
  board: "Board / Curriculum",
  student_count: "Student Count",
  annual_fee: "Annual Fee",
  academic_performance: "Academic Performance",
  edtech_maturity: "EdTech Maturity",
  primary_pain: "Primary Pain Point",
  buying_signal: "Buying Signal",
  target_score: "Target Score",
  priority: "Priority",
  website: "Website",
};

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ["school_name", "email"];

export function MapStep() {
  const { state, dispatch, goToStep } = useApp();
  const { rawHeaders, rawRows, columnMapping } = state;
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>(columnMapping);

  useEffect(() => {
    setMapping(state.columnMapping);
  }, [state.columnMapping]);

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Validate required fields are mapped
    if (!mapping.school_name || !mapping.email) {
      toast.error("Please map School Name and Email columns before continuing.");
      return;
    }

    dispatch({ type: "SET_COLUMN_MAPPING", mapping });

    // Apply mapping and create school records
    const schools = applyMapping(rawRows, mapping);
    dispatch({ type: "SET_SCHOOLS", schools });

    const valid = schools.filter((s) => s.status === "valid").length;
    const invalid = schools.length - valid;

    toast.success(`${valid} valid schools found${invalid > 0 ? `, ${invalid} with issues` : ""}.`);
    goToStep("select");
  };

  const fields = Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[];

  // Preview first 3 mapped values
  const previewRows = rawRows.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300">Column Mapping</p>
          <p className="text-xs text-blue-400/70 mt-0.5">
            We auto-detected likely columns. Please verify and adjust the mapping.
            Only <strong>School Name</strong> and <strong>Email</strong> are mandatory.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((field) => {
          const isRequired = REQUIRED_FIELDS.includes(field);
          const currentValue = mapping[field] || "";
          const isMapped = !!currentValue;

          return (
            <div
              key={field}
              className={cn(
                "p-4 rounded-xl border transition-all",
                isMapped
                  ? "bg-white/3 border-white/10"
                  : isRequired
                  ? "bg-red-500/5 border-red-500/20"
                  : "bg-white/2 border-white/5"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">
                  {FIELD_LABELS[field]}
                  {isRequired && !isMapped && (
                    <span className="ml-1 text-red-400 text-xs">(required)</span>
                  )}
                </label>
                {isMapped && currentValue && (
                  <span className="text-xs text-green-400/70 bg-green-500/10 px-2 py-0.5 rounded-full">
                    Mapped
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  value={currentValue}
                  onChange={(e) => updateMapping(field, e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all"
                >
                  <option value="">— Not mapped —</option>
                  {rawHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>

              {/* Preview values */}
              {currentValue && previewRows.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {previewRows.map((row, i) => (
                    <span
                      key={i}
                      className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
                    >
                      {row[currentValue] || "—"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => goToStep("upload")}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
        >
          Apply Mapping & Validate Schools →
        </button>
      </div>
    </div>
  );
}
