"use client";

import { type ReactNode } from "react";
import { Check, X } from "lucide-react";

export interface Step {
  label: string;
  description?: string;
  icon?: ReactNode;
  error?: boolean;
  optional?: boolean;
}

type StepsSize = "sm" | "md" | "lg";
type StepsOrientation = "horizontal" | "vertical";

export interface StepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  allowClickForward?: boolean;
  orientation?: StepsOrientation;
  responsive?: boolean;
  size?: StepsSize;
  className?: string;
  "aria-label"?: string;
}

const sizeMap: Record<
  StepsSize,
  { circle: string; text: string; desc: string; connectorPt: string; gap: string }
> = {
  sm: { circle: "h-6 w-6 text-xs", text: "text-xs", desc: "text-[11px]", connectorPt: "pt-3", gap: "gap-2" },
  md: { circle: "h-8 w-8 text-sm", text: "text-sm", desc: "text-xs", connectorPt: "pt-4", gap: "gap-3" },
  lg: { circle: "h-10 w-10 text-base", text: "text-base", desc: "text-sm", connectorPt: "pt-5", gap: "gap-3" },
};

type StepStatus = "complete" | "current" | "upcoming" | "error";

function getStatus(step: Step, index: number, currentStep: number): StepStatus {
  if (step.error) return "error";
  if (index < currentStep) return "complete";
  if (index === currentStep) return "current";
  return "upcoming";
}

const circleStyles: Record<StepStatus, string> = {
  complete: "border-secondary bg-primary  text-white ",
  current:
    "border-primary bg-white text-neutral-900 ring-4 ring-neutral-900/10 ",
  upcoming: "border-neutral-200 bg-white text-neutral-400 ",
  error: "border-red-500 bg-white text-red-600 ",
};

const labelStyles: Record<StepStatus, string> = {
  complete: "text-neutral-900 ",
  current: "text-neutral-900 font-semibold ",
  upcoming: "text-neutral-400 dark:text-neutral-500",
  error: "text-red-600",
};

export default function Steps({
  steps,
  currentStep,
  onStepClick,
  allowClickForward = false,
  orientation = "horizontal",
  responsive = true,
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Progress",
}: StepsProps) {
  const s = sizeMap[size];
  const clamped = Math.min(Math.max(currentStep, 0), steps.length - 1);
  const progressPercent = steps.length > 1 ? (clamped / (steps.length - 1)) * 100 : 100;

  const isClickable = (index: number, status: StepStatus) => {
    if (!onStepClick) return false;
    if (status === "complete" || status === "current") return true;
    return allowClickForward;
  };

  const renderCircle = (step: Step, status: StepStatus, index: number) => (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors ${s.circle} ${circleStyles[status]}`}
    >
      {status === "complete" ? (
        <Check className="h-1/2 w-1/2" aria-hidden="true" />
      ) : status === "error" ? (
        <X className="h-1/2 w-1/2" aria-hidden="true" />
      ) : step.icon ? (
        step.icon
      ) : (
        index + 1
      )}
    </span>
  );

  // ---------- Vertical ----------
  if (orientation === "vertical") {
    return (
      <ol aria-label={ariaLabel} className={`flex flex-col ${className}`}>
        {steps.map((step, index) => {
          const status = getStatus(step, index, clamped);
          const isLast = index === steps.length - 1;
          const clickable = isClickable(index, status);
          const Wrapper = clickable ? "button" : "div";

          return (
            <li key={index} className="relative flex gap-3 pb-8 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-0 h-full w-0.5 ${
                    status === "complete" ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                  style={{
                    left: size === "sm" ? "11px" : size === "md" ? "15px" : "19px",
                  }}
                />
              )}
              <Wrapper
                type={clickable ? "button" : undefined}
                onClick={clickable ? () => onStepClick!(index) : undefined}
                aria-current={status === "current" ? "step" : undefined}
                className={`relative z-10 flex flex-shrink-0 items-start ${
                  clickable
                    ? "cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                    : ""
                }`}
              >
                {renderCircle(step, status, index)}
              </Wrapper>
              <div className={`pt-0.5 ${s.gap === "gap-2" ? "pb-1" : "pb-2"}`}>
                <p className={`${s.text} ${labelStyles[status]}`}>
                  {step.label}
                  {step.optional && <span className="ml-1 font-normal text-neutral-400">(Optional)</span>}
                </p>
                {step.description && (
                  <p className={`mt-0.5 ${s.desc} text-neutral-500 dark:text-neutral-400`}>{step.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // ---------- Horizontal ----------
  return (
    <div aria-label={ariaLabel} className={className}>
      {/* Mobile: compact progress bar */}
      {responsive && (
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className={`font-medium text-neutral-900 dark:text-neutral-100 ${s.text}`}>
              Step {clamped + 1} of {steps.length}
            </span>
            <span className={`text-neutral-500 dark:text-neutral-400 ${s.desc}`}>{steps[clamped]?.label}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-neutral-900 transition-all duration-300 dark:bg-neutral-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* sm and up: full step row */}
      <ol className={`${responsive ? "hidden sm:flex" : "flex"} w-full items-start`}>
        {steps.flatMap((step, index) => {
          const status = getStatus(step, index, clamped);
          const isLast = index === steps.length - 1;
          const clickable = isClickable(index, status);
          const Wrapper = clickable ? "button" : "div";

          const stepBlock = (
            <li key={`step-${index}`} className="flex flex-shrink-0 flex-col items-center text-center">
              <Wrapper
                type={clickable ? "button" : undefined}
                onClick={clickable ? () => onStepClick!(index) : undefined}
                aria-current={status === "current" ? "step" : undefined}
                className={
                  clickable
                    ? "cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100"
                    : ""
                }
              >
                {renderCircle(step, status, index)}
              </Wrapper>
              <p className={`mt-2 max-w-[6.5rem] font-medium leading-tight ${s.text} ${labelStyles[status]}`}>
                {step.label}
                {step.optional && (
                  <span className="mt-0.5 block font-normal text-neutral-400">(Optional)</span>
                )}
              </p>
              {step.description && (
                <p className={`mt-0.5 max-w-[7.5rem] leading-tight text-neutral-500 dark:text-neutral-400 ${s.desc}`}>
                  {step.description}
                </p>
              )}
            </li>
          );

          if (isLast) return [stepBlock];

          const connector = (
            <li key={`conn-${index}`} aria-hidden="true" className={`flex flex-1 items-center ${s.connectorPt}`}>
              <div
                className={`h-0.5 w-full rounded-full transition-colors ${
                  status === "complete" ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            </li>
          );

          return [stepBlock, connector];
        })}
      </ol>
    </div>
  );
}