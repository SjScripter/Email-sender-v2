"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { PromotionalMaterial } from "@/types";
import { toast } from "sonner";
import {
  Mail,
  Sparkles,
  Image,
  FileText,
  Code,
  X,
  Upload,
  Info,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATE_VARIABLES = [
  "{{school_name}}",
  "{{principal_name}}",
  "{{director_name}}",
  "{{city}}",
  "{{area}}",
  "{{board}}",
  "{{student_count}}",
  "{{annual_fee}}",
  "{{academic_performance}}",
  "{{edtech_maturity}}",
  "{{primary_pain}}",
  "{{buying_signal}}",
  "{{target_score}}",
  "{{priority}}",
];

export function ComposeStep() {
  const { state, dispatch, goToStep } = useApp();
  const { emailConfig, promotionalMaterial, demoMode } = state;
  const [promoType, setPromoType] = useState<PromotionalMaterial["type"]>(
    promotionalMaterial.type
  );
  const [promoHtml, setPromoHtml] = useState(promotionalMaterial.html || "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    promotionalMaterial.imageData || null
  );
  const [pdfName, setPdfName] = useState<string | null>(
    promotionalMaterial.pdfName || null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum 5MB for attachments.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      if (promoType === "image") {
        setImagePreview(data);
        dispatch({
          type: "SET_PROMOTIONAL_MATERIAL",
          material: {
            type: "image",
            imageData: data,
            imageName: file.name,
            imageDisplayMode:
              promotionalMaterial.imageDisplayMode || "attachment",
          },
        });
      } else if (promoType === "pdf") {
        setPdfName(file.name);
        dispatch({
          type: "SET_PROMOTIONAL_MATERIAL",
          material: {
            type: "pdf",
            pdfData: data,
            pdfName: file.name,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (!emailConfig.senderName.trim()) {
      toast.error("Please enter a sender name.");
      return;
    }
    if (!emailConfig.subject.trim()) {
      toast.error("Please enter an email subject.");
      return;
    }
    if (!emailConfig.body.trim()) {
      toast.error("Please enter an email body.");
      return;
    }

    // Save promo material
    if (promoType === "html") {
      dispatch({
        type: "SET_PROMOTIONAL_MATERIAL",
        material: { type: "html", html: promoHtml },
      });
    } else if (promoType === "none") {
      dispatch({
        type: "SET_PROMOTIONAL_MATERIAL",
        material: { type: "none" },
      });
    }

    goToStep("personalize");
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody =
      emailConfig.body.substring(0, start) +
      variable +
      emailConfig.body.substring(end);
    dispatch({
      type: "SET_EMAIL_CONFIG",
      config: { body: newBody },
    });
    setTimeout(() => {
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length
      );
      textarea.focus();
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Campaign info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Campaign Name">
          <input
            value={emailConfig.campaignName}
            onChange={(e) =>
              dispatch({
                type: "SET_EMAIL_CONFIG",
                config: { campaignName: e.target.value },
              })
            }
            placeholder="School Outreach Campaign"
            className="input-field"
          />
        </FormField>
        <FormField label="Sender Name *">
          <input
            value={emailConfig.senderName}
            onChange={(e) =>
              dispatch({
                type: "SET_EMAIL_CONFIG",
                config: { senderName: e.target.value },
              })
            }
            placeholder="Your Name or Organization"
            className="input-field"
          />
        </FormField>
        <FormField label="Reply-To Email">
          <input
            value={emailConfig.replyTo}
            onChange={(e) =>
              dispatch({
                type: "SET_EMAIL_CONFIG",
                config: { replyTo: e.target.value },
              })
            }
            placeholder="replies@yourdomain.com"
            type="email"
            className="input-field"
          />
        </FormField>
        <FormField label="AI Personalization">
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() =>
                dispatch({
                  type: "SET_EMAIL_CONFIG",
                  config: { aiPersonalization: !emailConfig.aiPersonalization },
                })
              }
              className={cn(
                "relative inline-flex w-11 h-6 rounded-full transition-colors duration-200",
                emailConfig.aiPersonalization ? "bg-blue-500" : "bg-white/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  emailConfig.aiPersonalization
                    ? "translate-x-6"
                    : "translate-x-1"
                )}
              />
            </button>
            <span className="flex items-center gap-2 text-sm text-white/70">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {emailConfig.aiPersonalization ? "ON — Groq + LangChain" : "OFF — Generic template"}
              {demoMode && (
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  Demo
                </span>
              )}
            </span>
          </div>
        </FormField>
      </div>

      {/* Subject */}
      <FormField label="Email Subject *">
        <input
          value={emailConfig.subject}
          onChange={(e) =>
            dispatch({
              type: "SET_EMAIL_CONFIG",
              config: { subject: e.target.value },
            })
          }
          placeholder="Supporting Student Learning at {{school_name}}"
          className="input-field"
        />
      </FormField>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/70">
            Email Body *
          </label>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Info className="w-3.5 h-3.5" />
            Click a variable to insert at cursor
          </div>
        </div>

        {/* Template variable chips */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v}
              onClick={() => insertVariable(v)}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-all font-mono"
            >
              {v}
            </button>
          ))}
        </div>

        <textarea
          id="email-body"
          value={emailConfig.body}
          onChange={(e) =>
            dispatch({
              type: "SET_EMAIL_CONFIG",
              config: { body: e.target.value },
            })
          }
          rows={12}
          className="input-field resize-y font-mono text-sm leading-relaxed"
          placeholder="Write your generic email body here..."
        />
      </div>

      {/* Promotional material */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Promotional Material (Optional)
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: "none", label: "None", icon: <X className="w-4 h-4" /> },
            { value: "image", label: "Upload Image", icon: <Image className="w-4 h-4" /> },
            { value: "pdf", label: "Upload PDF", icon: <FileText className="w-4 h-4" /> },
            { value: "html", label: "Add HTML", icon: <Code className="w-4 h-4" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPromoType(opt.value as PromotionalMaterial["type"])}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                promoType === opt.value
                  ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                  : "bg-white/3 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* Image upload */}
        {promoType === "image" && (
          <div className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Change image
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      dispatch({
                        type: "SET_PROMOTIONAL_MATERIAL",
                        material: { type: "none" },
                      });
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 border border-dashed border-white/20 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
              >
                <Upload className="w-6 h-6 text-white/40" />
                <span className="text-sm text-white/50">
                  Click to upload PNG / JPG / JPEG (max 5MB)
                </span>
              </button>
            )}
            <div className="flex gap-2">
              <label className="text-xs text-white/60">Display mode:</label>
              {["attachment", "inline"].map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    dispatch({
                      type: "SET_PROMOTIONAL_MATERIAL",
                      material: {
                        ...promotionalMaterial,
                        type: "image",
                        imageDisplayMode: mode as "inline" | "attachment",
                      },
                    })
                  }
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg border transition-all capitalize",
                    promotionalMaterial.imageDisplayMode === mode
                      ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                      : "border-white/10 text-white/50"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDF upload */}
        {promoType === "pdf" && (
          <div className="p-4 rounded-xl bg-white/3 border border-white/10">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            {pdfName ? (
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-red-400" />
                <span className="text-sm text-white/70">{pdfName}</span>
                <button
                  onClick={() => {
                    setPdfName(null);
                    dispatch({
                      type: "SET_PROMOTIONAL_MATERIAL",
                      material: { type: "none" },
                    });
                  }}
                  className="ml-auto text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 border border-dashed border-white/20 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
              >
                <Upload className="w-6 h-6 text-white/40" />
                <span className="text-sm text-white/50">
                  Click to upload PDF (max 5MB) — will be attached to email
                </span>
              </button>
            )}
          </div>
        )}

        {/* HTML editor */}
        {promoType === "html" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-orange-400">
              <AlertCircle className="w-3.5 h-3.5" />
              HTML will be sanitized before sending
            </div>
            <textarea
              value={promoHtml}
              onChange={(e) => setPromoHtml(e.target.value)}
              rows={8}
              className="input-field resize-y font-mono text-sm"
              placeholder="<div style='...'>Your HTML promotional content here...</div>"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => goToStep("select")}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 text-sm font-medium transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
        >
          {emailConfig.aiPersonalization
            ? "Continue to AI Personalization →"
            : "Continue to Preview →"}
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/70">{label}</label>
      {children}
    </div>
  );
}
