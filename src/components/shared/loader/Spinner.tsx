"use client";

import { Loader2 } from "lucide-react";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Use "currentColor" so it inherits the parent's text color (e.g. inside a colored button) */
  className?: string;
  "aria-label"?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

/**
 * Minimal spinning-icon primitive. Used by PageLoader, but also drop-in
 * usable directly inside buttons: `<button disabled><Spinner size="sm" /> Saving…</button>`
 */
export default function Spinner({ size = "md", className = "", "aria-label": ariaLabel = "Loading" }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={ariaLabel}
      className={`animate-spin text-neutral-400 dark:text-neutral-500 ${sizeMap[size]} ${className}`}
    />
  );
}