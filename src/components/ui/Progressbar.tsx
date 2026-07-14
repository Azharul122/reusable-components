"use client";

import * as React from "react";
import { cn } from "@/src/utils/cn";

type ProgressSize = "xs" | "sm" | "md" | "lg";
type ProgressColor =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";
type LabelPosition = "top" | "inline" | "none";

const sizeClasses: Record<ProgressSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorClasses: Record<ProgressColor, string> = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-gray-500",
};

const trackColorClasses: Record<ProgressColor, string> = {
  primary: "bg-primary/15",
  success: "bg-emerald-500/15",
  warning: "bg-amber-500/15",
  danger: "bg-red-500/15",
  info: "bg-sky-500/15",
  neutral: "bg-gray-500/15",
};

export interface ProgressBarProps {
  value?: number;
  max?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  labelPosition?: LabelPosition;
  label?: string;
  formatLabel?: (percent: number) => string;
  striped?: boolean;
  animatedStripes?: boolean;
  indeterminate?: boolean;
  rounded?: boolean;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  "aria-label"?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value = 0,
      max = 100,
      size = "md",
      color = "primary",
      labelPosition = "none",
      label,
      formatLabel,
      striped = false,
      animatedStripes = false,
      indeterminate = false,
      rounded = true,
      className,
      trackClassName,
      barClassName,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const clamped = Math.min(Math.max(value, 0), max);
    const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;
    const displayLabel = label ?? formatLabel?.(percent) ?? `${percent}%`;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {labelPosition === "top" && (
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{displayLabel}</span>
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clamped}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel ?? "Progress"}
          className={cn(
            "relative w-full overflow-hidden",
            rounded && "rounded-full",
            sizeClasses[size],
            trackColorClasses[color],
            trackClassName,
          )}
        >
          <div
            className={cn(
              "h-full transition-[width] duration-300 ease-out",
              rounded && "rounded-full",
              colorClasses[color],
              striped &&
                "bg-[length:1rem_1rem] bg-gradient-to-r from-transparent via-white/20 to-transparent bg-repeat-x",
              striped && animatedStripes && "animate-[progress-stripes_1s_linear_infinite]",
              indeterminate && "absolute inset-y-0 w-1/3 animate-[progress-indeterminate_1.2s_ease-in-out_infinite]",
              barClassName,
            )}
            style={indeterminate ? undefined : { width: `${percent}%` }}
          >
            {labelPosition === "inline" && !indeterminate && size === "lg" && (
              <span className="flex h-full items-center justify-center text-[11px] font-semibold text-white">
                {displayLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;


export interface StepProgressBarProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
  size?: ProgressSize;
  color?: ProgressColor;
  showStepLabel?: boolean;
  className?: string;
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  size = "sm",
  color = "primary",
  showStepLabel = true,
  className,
}: StepProgressBarProps) {
  const percent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      {showStepLabel && (
        <div className="mb-1.5 text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </div>
      )}
      <ProgressBar value={percent} size={size} color={color} rounded />
    </div>
  );
}