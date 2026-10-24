"use client";

import { cn } from "@/lib/utils";
import { PersonalizationConfidence } from "@/types";
import { Sparkles, AlertCircle } from "lucide-react";

interface ConfidenceBadgeProps {
  confidence: PersonalizationConfidence;
  isPersonalized?: boolean;
  aiError?: string;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  isPersonalized = false,
  aiError,
  className,
}: ConfidenceBadgeProps) {
  if (aiError) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
          "bg-orange-500/15 text-orange-400 border-orange-500/30",
          className
        )}
        title={aiError}
      >
        <AlertCircle className="w-3 h-3" />
        Fallback
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        confidence === "high" && "badge-high",
        confidence === "medium" && "badge-medium",
        confidence === "low" && "badge-low",
        className
      )}
    >
      {isPersonalized && <Sparkles className="w-3 h-3" />}
      {confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low"}
    </span>
  );
}

interface StatusBadgeProps {
  status: "sent" | "failed" | "skipped" | "demo" | "valid" | "invalid_email" | "missing_email" | "duplicate" | "missing_name";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const map: Record<string, { label: string; cls: string }> = {
    sent: { label: "Sent", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    demo: { label: "Demo", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    failed: { label: "Failed", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    skipped: { label: "Skipped", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
    valid: { label: "Valid", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    invalid_email: { label: "Invalid Email", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
    missing_email: { label: "Missing Email", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    missing_name: { label: "Missing Name", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    duplicate: { label: "Duplicate", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  };

  const config = map[status] || { label: status, cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        config.cls,
        className
      )}
    >
      {config.label}
    </span>
  );
}
