"use client";

import { cn } from "@/lib/utils";
import { WorkflowStep } from "@/types";
import {
  Upload,
  GitBranch,
  Users,
  Mail,
  Sparkles,
  Eye,
  Send,
  BarChart3,
  Check,
} from "lucide-react";

const steps: { id: WorkflowStep; label: string; icon: React.ReactNode }[] = [
  { id: "upload", label: "Upload", icon: <Upload className="w-4 h-4" /> },
  { id: "map", label: "Map", icon: <GitBranch className="w-4 h-4" /> },
  { id: "select", label: "Select", icon: <Users className="w-4 h-4" /> },
  { id: "compose", label: "Compose", icon: <Mail className="w-4 h-4" /> },
  {
    id: "personalize",
    label: "Personalize",
    icon: <Sparkles className="w-4 h-4" />,
  },
  { id: "preview", label: "Preview", icon: <Eye className="w-4 h-4" /> },
  { id: "send", label: "Send", icon: <Send className="w-4 h-4" /> },
  { id: "results", label: "Results", icon: <BarChart3 className="w-4 h-4" /> },
];

const stepOrder: WorkflowStep[] = steps.map((s) => s.id);

interface StepperProps {
  currentStep: WorkflowStep;
  onStepClick?: (step: WorkflowStep) => void;
  completedSteps?: Set<WorkflowStep>;
}

export function Stepper({
  currentStep,
  onStepClick,
  completedSteps = new Set(),
}: StepperProps) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max mx-auto px-4 py-2">
        {steps.map((step, index) => {
          const isDone = completedSteps.has(step.id) || index < currentIndex;
          const isActive = step.id === currentStep;
          const isClickable =
            onStepClick && (isDone || index <= currentIndex);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1.5 group transition-all",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    isActive &&
                      "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110",
                    isDone &&
                      !isActive &&
                      "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                    !isActive &&
                      !isDone &&
                      "bg-white/5 text-white/40 border border-white/10"
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive && "text-blue-400",
                    isDone && !isActive && "text-blue-400/70",
                    !isActive && !isDone && "text-white/30"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 mx-1 mt-[-18px] transition-all duration-500",
                    index < currentIndex
                      ? "bg-blue-500/50"
                      : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
