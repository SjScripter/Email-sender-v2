"use client";

import { useState, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BatchSendRequest, SendingResult } from "@/types";
import { buildGenericEmail } from "@/lib/templateEngine";
import { toast } from "sonner";
import {
  Send,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  StopCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 5;

export function SendStep() {
  const { state, dispatch, goToStep } = useApp();
  const {
    schools,
    selectedSchoolIds,
    emailConfig,
    promotionalMaterial,
    personalizedEmails,
    demoMode,
    isSending,
    sendingStopped,
  } = state;

  const selectedSchools = useMemo(
    () => schools.filter((s) => selectedSchoolIds.has(s.id)),
    [schools, selectedSchoolIds]
  );

  const [confirmed, setConfirmed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<SendingResult[]>([]);

  const aiPersonalized = selectedSchools.filter(
    (s) => personalizedEmails.get(s.id)?.isPersonalized
  ).length;
  const genericCount = selectedSchools.length - aiPersonalized;

  const startSending = useCallback(async () => {
    if (!confirmed) return;

    dispatch({ type: "SET_IS_SENDING", value: true });
    dispatch({ type: "SET_SENDING_STOPPED", value: false });
    dispatch({ type: "SET_SENDING_RESULTS", results: [] });
    setBatchResults([]);
    setProgress(0);

    let stopped = false;

    for (
      let batchStart = 0;
      batchStart < selectedSchools.length;
      batchStart += BATCH_SIZE
    ) {
      // Check if user stopped
      if (stopped || sendingStopped) break;

      const batch = selectedSchools.slice(batchStart, batchStart + BATCH_SIZE);
      const batchPayload = batch.map((school) => {
        const email =
          personalizedEmails.get(school.id) ||
          buildGenericEmail(
            school,
            emailConfig.subject,
            emailConfig.body,
            emailConfig.senderName
          );
        return { school, email };
      });

      try {
        const req: BatchSendRequest = {
          schools: batchPayload,
          emailConfig,
          promotionalMaterial,
          demoMode,
        };

        const res = await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        });

        const data = await res.json();
        const newResults: SendingResult[] = data.results || [];

        setBatchResults((prev) => [...prev, ...newResults]);
        dispatch({ type: "ADD_SENDING_RESULTS", results: newResults });
        setProgress((p) => p + batch.length);

        // Small delay between batches
        if (batchStart + BATCH_SIZE < selectedSchools.length) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error("Batch send error:", err);
        const failedResults: SendingResult[] = batch.map((s) => ({
          schoolId: s.id,
          school_name: s.school_name,
          email: s.email,
          principal_name: s.principal_name,
          target_score: s.target_score,
          priority: s.priority,
          subject: personalizedEmails.get(s.id)?.subject || emailConfig.subject,
          personalization_confidence:
            personalizedEmails.get(s.id)?.confidence || "low",
          status: "failed" as const,
          error: "Network error",
          sentAt: new Date().toISOString(),
        }));
        setBatchResults((prev) => [...prev, ...failedResults]);
        dispatch({ type: "ADD_SENDING_RESULTS", results: failedResults });
        setProgress((p) => p + batch.length);
      }

      // Re-check stop flag
      if (state.sendingStopped) {
        stopped = true;
      }
    }

    dispatch({ type: "SET_IS_SENDING", value: false });

    if (!stopped && !state.sendingStopped) {
      toast.success("Campaign sending complete!");
      goToStep("results");
    } else {
      toast.warning("Campaign stopped. Results saved.");
    }
  }, [
    confirmed,
    selectedSchools,
    emailConfig,
    promotionalMaterial,
    personalizedEmails,
    demoMode,
    dispatch,
    goToStep,
    sendingStopped,
    state.sendingStopped,
  ]);

  const stopSending = () => {
    dispatch({ type: "SET_SENDING_STOPPED", value: true });
    toast.warning("Stopping campaign after current batch...");
  };

  const sentCount = batchResults.filter(
    (r) => r.status === "sent" || r.status === "demo"
  ).length;
  const failedCount = batchResults.filter((r) => r.status === "failed").length;

  if (isSending || (progress > 0 && !confirmed)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Sending progress */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              {isSending ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {isSending ? `Sending ${progress} / ${selectedSchools.length}...` : "Campaign Complete"}
              </h3>
              <p className="text-sm text-white/50">
                {demoMode ? "Demo Mode — not actually sending emails" : "Sending via Resend"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2 mb-4">
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 progress-glow"
                style={{
                  width: `${selectedSchools.length > 0 ? (progress / selectedSchools.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-white/50">
              <span>{progress} processed</span>
              <span>{selectedSchools.length - progress} remaining</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-xl font-bold text-blue-400">{progress}</div>
              <div className="text-xs text-white/50">Processed</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-xl font-bold text-green-400">{sentCount}</div>
              <div className="text-xs text-white/50">Sent</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/5">
              <div className="text-xl font-bold text-red-400">{failedCount}</div>
              <div className="text-xs text-white/50">Failed</div>
            </div>
          </div>
        </div>

        {isSending && (
          <div className="text-center space-y-2">
            <button
              onClick={stopSending}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-all"
            >
              <StopCircle className="w-4 h-4" />
              Stop Campaign
            </button>
            <p className="text-xs text-white/30">
              Emails already sent cannot be recalled.
            </p>
          </div>
        )}

        {!isSending && (
          <button
            onClick={() => goToStep("results")}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all"
          >
            View Results →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Campaign summary */}
      <div className="p-6 rounded-2xl bg-white/3 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <Send className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Campaign Summary</h3>
        </div>

        {demoMode && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-blue-300">
              <strong>Demo Mode:</strong> Emails will be simulated, not actually sent.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Recipients", value: selectedSchools.length, icon: "👥" },
            { label: "AI Personalized", value: aiPersonalized, icon: "✨" },
            { label: "Generic Version", value: genericCount, icon: "📄" },
            {
              label: "Attachments",
              value: promotionalMaterial.type !== "none" ? 1 : 0,
              icon: "📎",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-lg font-bold text-white">{item.value}</div>
                <div className="text-xs text-white/50">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-300">
            <strong>Important:</strong> Once sending starts, emails already dispatched cannot be recalled.
            Please verify the recipient list and email content before confirming.
          </div>
        </div>
      </div>

      {/* Confirm checkbox */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setConfirmed(!confirmed)}
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
            confirmed
              ? "bg-blue-500 border-blue-500"
              : "border-white/30 hover:border-blue-500/50"
          )}
        >
          {confirmed && (
            <CheckCircle2 className="w-3 h-3 text-white" />
          )}
        </button>
        <label
          className="text-sm text-white/70 cursor-pointer"
          onClick={() => setConfirmed(!confirmed)}
        >
          I have reviewed the emails and I am ready to send this campaign to{" "}
          <strong className="text-white">{selectedSchools.length} recipients</strong>.
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => goToStep("preview")}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all"
        >
          ← Back to Preview
        </button>
        <button
          onClick={startSending}
          disabled={!confirmed}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-200",
            confirmed
              ? "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-400 hover:to-green-400 shadow-lg shadow-blue-500/20 pulse-send"
              : "bg-white/10 cursor-not-allowed opacity-50"
          )}
        >
          <Send className="w-5 h-5" />
          CONFIRM & SEND TO {selectedSchools.length} RECIPIENTS
        </button>
      </div>
    </div>
  );
}
