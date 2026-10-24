"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { PersonalizedEmail, PersonalizeResponse } from "@/types";
import {
  buildEmailHtml,
  buildGenericEmail,
  calculateConfidence,
} from "@/lib/templateEngine";
import { ConfidenceBadge } from "@/components/Badges";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Shuffle,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PersonalizeStep() {
  const { state, dispatch, goToStep } = useApp();
  const {
    schools,
    selectedSchoolIds,
    emailConfig,
    promotionalMaterial,
    personalizedEmails,
    demoMode,
  } = state;

  const selectedSchools = schools.filter((s) =>
    selectedSchoolIds.has(s.id)
  );

  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
  }>({ success: 0, failed: 0, skipped: 0 });

  const personalizeAll = useCallback(async () => {
    if (!emailConfig.aiPersonalization) {
      // Build generic emails for all
      for (const school of selectedSchools) {
        const email = buildGenericEmail(
          school,
          emailConfig.subject,
          emailConfig.body,
          emailConfig.senderName,
          promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
          promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
          promotionalMaterial.imageName,
          promotionalMaterial.imageDisplayMode
        );
        dispatch({ type: "SET_PERSONALIZED_EMAIL", schoolId: school.id, email });
      }
      toast.success("Generic template applied to all schools.");
      goToStep("preview");
      return;
    }

    setIsRunning(true);
    setDone(false);
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < selectedSchools.length; i++) {
      const school = selectedSchools[i];

      // Skip already personalized (not manually edited)
      if (
        personalizedEmails.get(school.id)?.isPersonalized &&
        !personalizedEmails.get(school.id)?.isManuallyEdited
      ) {
        setProgress(i + 1);
        setResults((p) => ({ ...p, skipped: p.skipped + 1 }));
        continue;
      }

      try {
        const res = await fetch("/api/personalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school,
            genericSubject: emailConfig.subject,
            genericBody: emailConfig.body,
            demoMode,
          }),
        });

        const data: PersonalizeResponse & { error?: string } = await res.json();

        if (!res.ok || (data.error && !data.subject)) {
          // Full failure — use generic
          const genericEmail = buildGenericEmail(
            school,
            emailConfig.subject,
            emailConfig.body,
            emailConfig.senderName
          );
          const failedEmail: PersonalizedEmail = {
            ...genericEmail,
            aiError: data.error || "AI failed",
          };
          dispatch({
            type: "SET_PERSONALIZED_EMAIL",
            schoolId: school.id,
            email: failedEmail,
          });
          failedCount++;
        } else {
          const confidence = data.confidence || calculateConfidence(school);
          const email: PersonalizedEmail = {
            schoolId: school.id,
            subject: data.subject,
            greeting: data.greeting,
            opening: data.opening,
            body: data.body,
            cta: data.cta,
            fullHtml: "",
            confidence,
            isPersonalized: true,
            isManuallyEdited: false,
            aiError: data.error, // may contain fallback warning
            generatedAt: new Date().toISOString(),
          };
          email.fullHtml = buildEmailHtml(
            email,
            emailConfig.senderName,
            promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
            promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
            promotionalMaterial.imageName,
            promotionalMaterial.imageDisplayMode
          );
          dispatch({
            type: "SET_PERSONALIZED_EMAIL",
            schoolId: school.id,
            email,
          });
          successCount++;
        }
      } catch (err) {
        console.error("Personalization error for", school.school_name, err);
        const genericEmail = buildGenericEmail(
          school,
          emailConfig.subject,
          emailConfig.body,
          emailConfig.senderName
        );
        dispatch({
          type: "SET_PERSONALIZED_EMAIL",
          schoolId: school.id,
          email: {
            ...genericEmail,
            aiError: "Network error",
          },
        });
        failedCount++;
      }

      setProgress(i + 1);
      setResults({ success: successCount, failed: failedCount, skipped: 0 });

      // Small delay to avoid rate limits
      if (i < selectedSchools.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setIsRunning(false);
    setDone(true);
    toast.success(
      `Personalization complete: ${successCount} personalized, ${failedCount} fallback.`
    );
  }, [
    selectedSchools,
    emailConfig,
    promotionalMaterial,
    personalizedEmails,
    demoMode,
    dispatch,
    goToStep,
  ]);

  const progressPct =
    selectedSchools.length > 0
      ? Math.round((progress / selectedSchools.length) * 100)
      : 0;

  const alreadyPersonalized = selectedSchools.filter(
    (s) => personalizedEmails.get(s.id)?.isPersonalized
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Personalization</h3>
            <p className="text-xs text-white/50">
              {emailConfig.aiPersonalization
                ? `Groq + LangChain — ${demoMode ? "Demo Mode (simulated)" : "Live"}`
                : "Disabled — using generic template"}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold text-white">
              {selectedSchools.length}
            </div>
            <div className="text-xs text-white/50">recipients</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total" value={selectedSchools.length} />
          <Stat label="Personalized" value={alreadyPersonalized} color="green" />
          <Stat
            label="Remaining"
            value={selectedSchools.length - alreadyPersonalized}
            color="orange"
          />
        </div>
      </div>

      {/* Progress */}
      {(isRunning || done) && (
        <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">
              {isRunning ? `Processing ${progress} / ${selectedSchools.length}...` : "Complete"}
            </span>
            <span className="text-white font-semibold">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 progress-glow"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">✓ {results.success} personalized</span>
            {results.failed > 0 && (
              <span className="text-orange-400">⚠ {results.failed} fallback</span>
            )}
            {results.skipped > 0 && (
              <span className="text-white/40">↩ {results.skipped} skipped</span>
            )}
          </div>
        </div>
      )}

      {/* School list preview */}
      <div className="rounded-xl border border-white/10 overflow-hidden max-h-[360px] overflow-y-auto">
        <div className="p-3 bg-white/3 border-b border-white/10 flex items-center justify-between sticky top-0">
          <span className="text-xs font-medium text-white/60">Schools to personalize</span>
          <span className="text-xs text-white/40">Confidence based on available data</span>
        </div>
        {selectedSchools.map((school, i) => {
          const email = personalizedEmails.get(school.id);
          const confidence = calculateConfidence(school);
          return (
            <div
              key={school.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0",
                i < progress && "opacity-70"
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs text-blue-400 font-mono font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">
                  {school.school_name}
                </p>
                <p className="text-xs text-white/40 truncate">{school.email}</p>
              </div>
              <ConfidenceBadge
                confidence={email?.confidence || confidence}
                isPersonalized={email?.isPersonalized}
                aiError={email?.aiError}
              />
              <div className="w-6 flex justify-center">
                {email?.isPersonalized && !email?.aiError ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : email?.aiError ? (
                  <XCircle className="w-4 h-4 text-orange-400" />
                ) : i < progress ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : isRunning && i === progress ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => goToStep("compose")}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all disabled:opacity-40"
        >
          ← Back
        </button>

        {emailConfig.aiPersonalization && !done && (
          <button
            onClick={personalizeAll}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold transition-all disabled:opacity-40 shadow-lg shadow-blue-500/20"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Personalizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start AI Personalization
              </>
            )}
          </button>
        )}

        {alreadyPersonalized > 0 && !isRunning && (
          <button
            onClick={() => goToStep("preview")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all"
          >
            Preview Emails →
          </button>
        )}

        {!emailConfig.aiPersonalization && (
          <button
            onClick={personalizeAll}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all"
          >
            <SkipForward className="w-4 h-4" />
            Apply Generic Template & Preview →
          </button>
        )}

        {alreadyPersonalized > 0 && emailConfig.aiPersonalization && (
          <button
            onClick={personalizeAll}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-blue-500/30 text-white/60 hover:text-blue-300 text-sm font-medium transition-all disabled:opacity-40"
          >
            <Shuffle className="w-4 h-4" />
            Re-run All
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "blue",
}: {
  label: string;
  value: number;
  color?: "blue" | "green" | "orange";
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-white/5">
      <div
        className={cn(
          "text-xl font-bold",
          color === "blue" && "text-blue-400",
          color === "green" && "text-green-400",
          color === "orange" && "text-orange-400"
        )}
      >
        {value}
      </div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
