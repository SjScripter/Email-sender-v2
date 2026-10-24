"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  buildEmailHtml,
  buildGenericEmail,
  calculateConfidence,
} from "@/lib/templateEngine";
import { PersonalizedEmail, PersonalizeResponse } from "@/types";
import { ConfidenceBadge } from "@/components/Badges";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  RefreshCw,
  UserX,
  Send,
  Shuffle,
  Check,
  X,
  Loader2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PreviewStep() {
  const { state, dispatch, goToStep } = useApp();
  const {
    schools,
    selectedSchoolIds,
    emailConfig,
    promotionalMaterial,
    personalizedEmails,
    demoMode,
  } = state;

  const selectedSchools = useMemo(
    () => schools.filter((s) => selectedSchoolIds.has(s.id)),
    [schools, selectedSchoolIds]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ subject: "", body: "" });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showTestInput, setShowTestInput] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const school = selectedSchools[currentIndex];
  const email = school ? personalizedEmails.get(school.id) : undefined;

  const visibleEmail = email ||
    (school
      ? buildGenericEmail(
          school,
          emailConfig.subject,
          emailConfig.body,
          emailConfig.senderName
        )
      : null);

  const startEdit = () => {
    if (!visibleEmail) return;
    setEditValues({
      subject: visibleEmail.subject,
      body: [
        visibleEmail.greeting,
        visibleEmail.opening,
        visibleEmail.body,
        visibleEmail.cta,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!school || !visibleEmail) return;
    const lines = editValues.body.split("\n\n");
    const updated: PersonalizedEmail = {
      ...visibleEmail,
      subject: editValues.subject,
      greeting: lines[0] || visibleEmail.greeting,
      opening: "",
      body: lines.slice(1).join("\n\n") || editValues.body,
      cta: "",
      isManuallyEdited: true,
      fullHtml: "",
    };
    updated.fullHtml = buildEmailHtml(
      updated,
      emailConfig.senderName,
      promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
      promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
      promotionalMaterial.imageName,
      promotionalMaterial.imageDisplayMode
    );
    dispatch({ type: "SET_PERSONALIZED_EMAIL", schoolId: school.id, email: updated });
    setIsEditing(false);
    toast.success("Email saved.");
  };

  const regenerate = async () => {
    if (!school) return;
    setIsRegenerating(true);
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
      const data: PersonalizeResponse = await res.json();
      const confidence = data.confidence || calculateConfidence(school);
      const updated: PersonalizedEmail = {
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
        generatedAt: new Date().toISOString(),
      };
      updated.fullHtml = buildEmailHtml(
        updated,
        emailConfig.senderName,
        promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
        promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
        promotionalMaterial.imageName,
        promotionalMaterial.imageDisplayMode
      );
      dispatch({ type: "SET_PERSONALIZED_EMAIL", schoolId: school.id, email: updated });
      toast.success("Email regenerated.");
    } catch {
      toast.error("Regeneration failed.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const useGeneric = () => {
    if (!school) return;
    const generic = buildGenericEmail(
      school,
      emailConfig.subject,
      emailConfig.body,
      emailConfig.senderName,
      promotionalMaterial.type === "html" ? promotionalMaterial.html : undefined,
      promotionalMaterial.type === "image" ? promotionalMaterial.imageData : undefined,
      promotionalMaterial.imageName,
      promotionalMaterial.imageDisplayMode
    );
    dispatch({ type: "SET_PERSONALIZED_EMAIL", schoolId: school.id, email: generic });
    toast.success("Using generic version for this school.");
  };

  const excludeRecipient = () => {
    if (!school) return;
    setExcludedIds((prev) => new Set([...prev, school.id]));
    dispatch({ type: "TOGGLE_SCHOOL", id: school.id });
    if (currentIndex >= selectedSchools.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
    toast.success(`${school.school_name} excluded from campaign.`);
  };

  const sendTestEmail = async () => {
    if (!testEmailAddress || !visibleEmail || !school) return;
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailAddress,
          school,
          email: visibleEmail,
          emailConfig,
          promotionalMaterial,
          demoMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.demo
            ? "DEMO: Test email simulated (not actually sent)"
            : `Test email sent to ${testEmailAddress}`
        );
        setShowTestInput(false);
      } else {
        toast.error(data.error || "Test email failed");
      }
    } catch {
      toast.error("Network error sending test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const previewRandom = (count: number) => {
    const indices = Array.from({ length: selectedSchools.length }, (_, i) => i);
    const shuffled = indices.sort(() => Math.random() - 0.5).slice(0, count);
    setCurrentIndex(shuffled[0]);
    toast.info(`Jumped to random school ${shuffled[0] + 1}. Use arrows to navigate.`);
  };

  if (!school) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-white/40">No schools selected for preview.</p>
        <button onClick={() => goToStep("select")} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
          ← Go back to selection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => goToStep("personalize")}
          className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => previewRandom(5)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/70 text-xs transition-all"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Random 5
          </button>
          <button
            onClick={() => setShowTestInput(!showTestInput)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs font-medium transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test
          </button>
          <button
            onClick={() => goToStep("send")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
            Send Campaign →
          </button>
        </div>
      </div>

      {/* Test email input */}
      {showTestInput && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <input
            type="email"
            value={testEmailAddress}
            onChange={(e) => setTestEmailAddress(e.target.value)}
            placeholder="Enter test email address..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/40 focus:outline-none"
          />
          <button
            onClick={sendTestEmail}
            disabled={isSendingTest || !testEmailAddress}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium disabled:opacity-40 transition-all"
          >
            {isSendingTest ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isSendingTest ? "Sending..." : "Send Test"}
          </button>
          <button
            onClick={() => setShowTestInput(false)}
            className="text-white/40 hover:text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left panel — school list */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 bg-white/3 border-b border-white/10">
            <p className="text-xs font-medium text-white/60">
              {selectedSchools.length} recipients
            </p>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {selectedSchools.map((s, i) => {
              const e = personalizedEmails.get(s.id);
              const isExcluded = excludedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-white/5 last:border-0 transition-colors",
                    i === currentIndex ? "bg-blue-500/10" : "hover:bg-white/3",
                    isExcluded && "opacity-40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/90 truncate">
                        {s.school_name}
                      </p>
                      <p className="text-xs text-white/40 truncate">{s.email}</p>
                    </div>
                    {e && (
                      <ConfidenceBadge
                        confidence={e.confidence}
                        isPersonalized={e.isPersonalized}
                        aiError={e.aiError}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — email preview */}
        <div className="lg:col-span-2 space-y-3">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-white/60 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/60">
                {currentIndex + 1} / {selectedSchools.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIndex(
                    Math.min(selectedSchools.length - 1, currentIndex + 1)
                  )
                }
                disabled={currentIndex === selectedSchools.length - 1}
                className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 text-white/60 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={useGeneric}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-white/50 hover:text-white/70 text-xs transition-all"
              >
                Generic
              </button>
              <button
                onClick={regenerate}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs transition-all"
              >
                {isRegenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Regen
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={excludeRecipient}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs transition-all"
              >
                <UserX className="w-3.5 h-3.5" />
                Exclude
              </button>
            </div>
          </div>

          {/* School info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/10 flex-wrap">
            <div>
              <p className="text-xs text-white/40">School</p>
              <p className="text-sm font-medium text-white/90">{school.school_name}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Email</p>
              <p className="text-sm text-white/70">{school.email}</p>
            </div>
            {school.target_score && (
              <div>
                <p className="text-xs text-white/40">Score</p>
                <p className="text-sm font-semibold text-blue-400">{school.target_score}</p>
              </div>
            )}
            {school.priority && (
              <div>
                <p className="text-xs text-white/40">Priority</p>
                <p className="text-sm text-white/70">{school.priority}</p>
              </div>
            )}
            {visibleEmail && (
              <div className="ml-auto">
                <ConfidenceBadge
                  confidence={visibleEmail.confidence}
                  isPersonalized={visibleEmail.isPersonalized}
                  aiError={visibleEmail.aiError}
                />
              </div>
            )}
            {visibleEmail?.isManuallyEdited && (
              <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                Manually edited
              </span>
            )}
          </div>

          {/* Email header */}
          {visibleEmail && (
            <div className="space-y-1 p-3 rounded-xl bg-white/3 border border-white/10 text-xs">
              <div className="flex gap-2">
                <span className="text-white/40 w-12">FROM</span>
                <span className="text-white/70">
                  {emailConfig.senderName}{" "}
                  <span className="text-white/40">&lt;via Resend&gt;</span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/40 w-12">TO</span>
                <span className="text-white/70">{school.email}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white/40 w-12">SUBJECT</span>
                <span className="text-white font-medium">{visibleEmail.subject}</span>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {isEditing ? (
            <div className="space-y-3 p-4 rounded-xl bg-white/3 border border-blue-500/20">
              <p className="text-xs font-medium text-blue-300">Editing email</p>
              <div className="space-y-1">
                <label className="text-xs text-white/50">Subject</label>
                <input
                  value={editValues.subject}
                  onChange={(e) =>
                    setEditValues((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="input-field text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50">Body</label>
                <textarea
                  value={editValues.body}
                  onChange={(e) =>
                    setEditValues((p) => ({ ...p, body: e.target.value }))
                  }
                  rows={10}
                  className="input-field text-sm resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-medium transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white/80 text-xs transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden bg-white">
              {visibleEmail?.fullHtml ? (
                <iframe
                  srcDoc={visibleEmail.fullHtml}
                  className="w-full h-[480px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="p-6 text-gray-800 email-preview-content">
                  <p className="font-semibold">{visibleEmail?.greeting}</p>
                  {visibleEmail?.opening && (
                    <p className="mt-4">{visibleEmail.opening}</p>
                  )}
                  <p className="mt-4 whitespace-pre-wrap">{visibleEmail?.body}</p>
                  {visibleEmail?.cta && <p className="mt-4">{visibleEmail.cta}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
