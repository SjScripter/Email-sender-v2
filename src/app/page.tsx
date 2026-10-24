"use client";

import { AppProvider, useApp } from "@/context/AppContext";
import { Stepper } from "@/components/Stepper";
import { UploadStep } from "@/components/steps/UploadStep";
import { MapStep } from "@/components/steps/MapStep";
import { SelectStep } from "@/components/steps/SelectStep";
import { ComposeStep } from "@/components/steps/ComposeStep";
import { PersonalizeStep } from "@/components/steps/PersonalizeStep";
import { PreviewStep } from "@/components/steps/PreviewStep";
import { SendStep } from "@/components/steps/SendStep";
import { ResultsStep } from "@/components/steps/ResultsStep";
import { WorkflowStep } from "@/types";
import {
  Zap,
  Upload,
  ArrowRight,
  Sparkles,
  Mail,
  BarChart3,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<WorkflowStep, string> = {
  upload: "Upload Schools",
  map: "Map Columns",
  select: "Select Recipients",
  compose: "Compose Email",
  personalize: "AI Personalization",
  preview: "Preview Emails",
  send: "Send Campaign",
  results: "View Results",
};

function Dashboard() {
  const { state, dispatch, goToStep } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">SchoolReach AI</h1>
          <p className="text-xs text-white/40">AI-Powered School Outreach</p>
        </div>
      </div>

      <p className="text-white/60 text-center max-w-lg mb-10 leading-relaxed">
        Upload your school list, personalize outreach using AI, preview every message, and send your campaign — all in one place.
      </p>

      {/* Workflow steps */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10 w-full max-w-2xl">
        {[
          { icon: <Upload className="w-5 h-5" />, label: "Upload Schools", color: "blue" },
          { icon: <Mail className="w-5 h-5" />, label: "Create Message", color: "purple" },
          { icon: <Sparkles className="w-5 h-5" />, label: "AI Personalize", color: "indigo" },
          { icon: <ArrowRight className="w-5 h-5" />, label: "Review", color: "cyan" },
          { icon: <BarChart3 className="w-5 h-5" />, label: "Send & Track", color: "green" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/3 border border-white/8 text-center"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                item.color === "blue" && "bg-blue-500/20 text-blue-400",
                item.color === "purple" && "bg-purple-500/20 text-purple-400",
                item.color === "indigo" && "bg-indigo-500/20 text-indigo-400",
                item.color === "cyan" && "bg-cyan-500/20 text-cyan-400",
                item.color === "green" && "bg-green-500/20 text-green-400"
              )}
            >
              {item.icon}
            </div>
            <span className="text-xs text-white/60 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => goToStep("upload")}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold text-lg shadow-2xl shadow-blue-500/30 transition-all duration-300 hover:scale-105"
        >
          <Zap className="w-5 h-5" />
          START NEW OUTREACH
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={async () => {
            dispatch({ type: "SET_DEMO_MODE", value: true });
            goToStep("upload");
          }}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 hover:border-blue-500/30 text-white/60 hover:text-blue-300 font-medium transition-all"
        >
          <FlaskConical className="w-5 h-5" />
          Try Demo Mode
        </button>
      </div>

      <p className="mt-8 text-xs text-white/25 text-center max-w-sm">
        No database — campaign data exists only for this session. Download results after sending.
      </p>
    </div>
  );
}

function AppContent() {
  const { state, goToStep } = useApp();
  const { step } = state;

  if (step === "upload" && !state.fileName && state.rawRows.length === 0) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => goToStep("upload")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white/90 group-hover:text-white transition-colors">
              SchoolReach AI
            </span>
          </button>

          {state.demoMode && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              DEMO MODE
            </span>
          )}

          <div className="ml-4 flex-1">
            <Stepper
              currentStep={step}
              onStepClick={goToStep}
            />
          </div>

          <div className="text-xs text-white/30 hidden md:block">
            {state.selectedSchoolIds.size > 0 && (
              <span>{state.selectedSchoolIds.size} selected</span>
            )}
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            {STEP_LABELS[step]}
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {state.fileName && `File: ${state.fileName}`}
            {state.emailConfig.campaignName &&
              step !== "upload" &&
              ` · ${state.emailConfig.campaignName}`}
          </p>
        </div>

        {step === "upload" && <UploadStep />}
        {step === "map" && <MapStep />}
        {step === "select" && <SelectStep />}
        {step === "compose" && <ComposeStep />}
        {step === "personalize" && <PersonalizeStep />}
        {step === "preview" && <PreviewStep />}
        {step === "send" && <SendStep />}
        {step === "results" && <ResultsStep />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
