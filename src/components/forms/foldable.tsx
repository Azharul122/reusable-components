"use client";

import { cn } from "@/src/utils/cn";
import * as React from "react";


export interface FoldableProps {
  /** Always-visible heading shown in the trigger row. */
  title: React.ReactNode;
  /** Optional small helper text under the title. */
  subtitle?: React.ReactNode;
  /** Optional element rendered at the end of the trigger row (e.g. a status badge). */
  badge?: React.ReactNode;
  /** Uncontrolled initial state. Ignored if `open` is provided. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Controlled open-state change handler. */
  onOpenChange?: (open: boolean) => void;
  /** Panel content, only rendered visibly when open. */
  children: React.ReactNode;
  className?: string;
  /** Disables the trigger (panel state is frozen, no pointer/keyboard toggling). */
  disabled?: boolean;
}

/**
 * Foldable
 * ---------------------------------------------------------------------------
 * A dependency-free, accessible, CSS-only expand/collapse container.
 *
 * Why this shape:
 * - No JS height measurement (no ResizeObserver, no flash on mount) — uses the
 *   CSS grid-rows animation trick (0fr -> 1fr) which animates to "auto" height.
 * - Fully controllable OR uncontrollable, so it can back a single accordion
 *   item or be driven externally (e.g. auto-open on validation error).
 * - Knows nothing about forms/react-hook-form/zod — it only folds content.
 *   Form-specific behavior lives in <FoldableFormField> below, which composes
 *   this primitive. Keeping this layer generic is what makes it reusable for
 *   FAQs, settings sections, nav groups, etc.
 */
export function Foldable({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
  disabled = false,
}: FoldableProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const reactId = React.useId();
  const panelId = `foldable-panel-${reactId}`;

  const toggle = () => {
    if (disabled) return;
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white transition-colors",
        open && "border-slate-300 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-slate-900">
            {title}
          </span>
          {subtitle ? (
            <span className="truncate text-xs text-slate-500">
              {subtitle}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {badge}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={cn(
              "h-4 w-4 text-slate-500 transition-transform duration-200 ease-out",
              open && "rotate-180"
            )}
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* grid-rows trick: animates between 0fr and 1fr, which behaves like
          animating to an unknown "auto" height without measuring anything. */}
      <div
        id={panelId}
        role="region"
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}