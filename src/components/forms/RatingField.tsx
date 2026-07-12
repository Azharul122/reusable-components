"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/src/utils/cn";

export interface RatingFieldProps {
  /** Static label rendered above the stars */
  label?: string;
  /** Current rating value, e.g. 1.8. Supports any float, not just halves. */
  value?: number | null;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  name?: string;
  /** Number of stars. Defaults to 5. */
  max?: number;
  /**
   * "view" — pure display, renders the exact fractional fill you pass in
   * (e.g. 1.8 → 1 full star + a star 80% filled), no interaction.
   * "edit" — interactive input. Clicking a star selects that whole star
   * count (click the 2nd star → rating becomes 2), no fractional clicks,
   * unless you override with `precision`. Defaults to "view".
   */
  mode?: "view" | "edit";
  /**
   * Smallest increment selectable by pointer/keyboard in edit mode, e.g.
   * 0.5 for half-star clicks, 0.1 for near-continuous. Defaults to 1
   * (whole stars only — clicking anywhere on a star selects that full
   * star, regardless of x-position). Ignored in view mode.
   */
  precision?: number;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  /** Show the numeric value next to the stars, e.g. "1.8 / 5". */
  showValue?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  id?: string;
  /** Tailwind-independent fill color for active stars. */
  color?: string;
  /** Color for the unfilled portion of a star. */
  emptyColor?: string;
  /** Clicking the currently-set value again resets to 0. Defaults to true. */
  allowClear?: boolean;
}

const SIZE_PX: Record<NonNullable<RatingFieldProps["size"]>, number> = {
  small: 20,
  medium: 28,
  large: 36,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** How much of the star at `starIndex` (0-based) should be filled, 0–100. */
function fillPercentFor(starIndex: number, rating: number): number {
  return clamp(rating - starIndex, 0, 1) * 100;
}

/** Snap a 0..1 fraction within a single star to the nearest precision step. */
function snapFraction(fraction: number, precision: number): number {
  const steps = 1 / precision;
  return clamp(Math.round(fraction * steps) / steps, 0, 1);
}

const RatingField = React.forwardRef<HTMLDivElement, RatingFieldProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      name,
      max = 5,
      mode = "view",
      precision,
      disabled = false,
      size = "medium",
      showValue = false,
      error = false,
      helperText,
      fullWidth = false,
      id,
      color = "#f5b400",
      emptyColor = "#d1d5db",
      allowClear = true,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const helperId = helperText ? `${fieldId}-helper-text` : undefined;

    const rating = clamp(value ?? 0, 0, max);
    const [hoverRating, setHoverRating] = React.useState<number | null>(null);
    const groupRef = React.useRef<HTMLDivElement>(null);
    const starRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const interactive = mode === "edit" && !disabled && Boolean(onChange);
    // Edit mode defaults to whole-star clicks; view mode's exact fill never
    // depends on this since it always renders the raw float `rating`.
    const effectivePrecision = precision ?? 1;
    const displayRating = hoverRating ?? rating;
    const sizePx = SIZE_PX[size];

    const commit = (next: number) => {
      if (!interactive) return;
      const clamped = clamp(next, 0, max);
      if (allowClear && clamped === rating) {
        onChange?.(0);
      } else {
        onChange?.(clamped);
      }
    };

    const ratingFromPointer = (starIndex: number, clientX: number): number => {
      // Whole-star mode (the default for edit): clicking/hovering anywhere
      // on a star selects that full star count — position within the star
      // doesn't matter. e.g. clicking the 2nd star always yields 2.
      if (effectivePrecision >= 1) return starIndex + 1;

      const el = starRefs.current[starIndex];
      if (!el) return starIndex + 1;
      const rect = el.getBoundingClientRect();
      const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
      const snapped = snapFraction(fraction, effectivePrecision);
      return starIndex + snapped;
    };

    const handlePointerMove = (starIndex: number, e: React.PointerEvent) => {
      if (!interactive) return;
      setHoverRating(ratingFromPointer(starIndex, e.clientX));
    };

    const handlePointerLeave = () => {
      if (!interactive) return;
      setHoverRating(null);
    };

    const handleClick = (starIndex: number, e: React.MouseEvent) => {
      if (!interactive) return;
      commit(ratingFromPointer(starIndex, e.clientX));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!interactive) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          commit(clamp(rating + effectivePrecision, 0, max));
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          commit(clamp(rating - effectivePrecision, 0, max));
          break;
        case "Home":
          e.preventDefault();
          commit(0);
          break;
        case "End":
          e.preventDefault();
          commit(max);
          break;
      }
    };

    React.useImperativeHandle(ref, () => groupRef.current as HTMLDivElement);

    const labelColor = error ? "text-error" : "text-mui-text-secondary";

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", "font-roboto")}>
        {label && (
          <label
            htmlFor={fieldId}
            className={cn("mb-1.5 block text-sm font-medium", labelColor)}
          >
            {label}
          </label>
        )}

        <input type="hidden" name={name} value={rating} readOnly />

        <div className="flex items-center gap-2">
          <div
            ref={groupRef}
            id={fieldId}
            role="slider"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={rating}
            aria-disabled={disabled || undefined}
            aria-readonly={mode === "view" || undefined}
            aria-invalid={error || undefined}
            aria-describedby={helperId}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "inline-flex items-center gap-0.5 outline-none",
              interactive && "cursor-pointer",
              disabled && "cursor-not-allowed opacity-40",
              interactive && "focus-visible:ring-2 focus-visible:ring-mui-primary focus-visible:ring-offset-2 rounded",
            )}
          >
            {Array.from({ length: max }).map((_, starIndex) => {
              const percent = fillPercentFor(starIndex, displayRating);

              return (
                <div
                  key={starIndex}
                  ref={(el) => {
                    starRefs.current[starIndex] = el;
                  }}
                  className="relative shrink-0"
                  style={{ width: sizePx, height: sizePx }}
                  onPointerMove={(e) => handlePointerMove(starIndex, e)}
                  onClick={(e) => handleClick(starIndex, e)}
                >
                  {/* empty (background) star */}
                  <Star
                    style={{ width: sizePx, height: sizePx }}
                    strokeWidth={1.5}
                    color={emptyColor}
                    fill="none"
                    className="absolute inset-0"
                  />
                  {/* filled star, clipped to the fractional percentage */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${percent}%` }}
                  >
                    <Star
                      style={{ width: sizePx, height: sizePx }}
                      strokeWidth={1.5}
                      color={color}
                      fill={color}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {showValue && (
            <span className="text-sm font-medium text-primary-text">
              {rating.toFixed(1)}
              <span className="text-mui-text-secondary"> / {max}</span>
            </span>
          )}
        </div>

        {helperText && (
          <p
            id={helperId}
            className={cn(
              "mt-1 text-xs leading-tight",
              error ? "text-error" : "text-mui-text-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

RatingField.displayName = "RatingField";

export default RatingField;