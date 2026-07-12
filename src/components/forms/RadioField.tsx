"use client";

import * as React from "react";
import { cn } from "@/src/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Single Radio                                                             */
/* -------------------------------------------------------------------------- */

export interface RadioProps {
  label?: React.ReactNode;
  checked?: boolean;
  onChange?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: boolean;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      checked = false,
      onChange,
      onBlur,
      onFocus,
      error = false,
      size = "medium",
      disabled = false,
      required = false,
      id,
      name,
      value,
      className,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const radioId = id ?? generatedId;

    const boxSize = size === "small" ? "h-4 w-4" : "h-5 w-5";
    const dotSize = size === "small" ? "h-1.5 w-1.5" : "h-2 w-2";
    const textSize = size === "small" ? "text-sm" : "text-base";

    const ringColor = error
      ? "border-mui-error"
      : checked
        ? "border-primary"
        : "border-mui-border";

    return (
      <label
        htmlFor={radioId}
        className={cn(
          "inline-flex select-none items-center gap-2",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          className,
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            required={required}
            aria-invalid={error || undefined}
            onChange={() => onChange?.()}
            onBlur={onBlur}
            onFocus={onFocus}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex items-center justify-center rounded-full border-2 transition-colors duration-150",
              boxSize,
              ringColor,
              !disabled &&
                !checked &&
                !error &&
                "peer-hover:border-mui-borderHover",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-mui-primary peer-focus-visible:ring-offset-1",
            )}
          >
            {checked && (
              <span
                className={cn(
                  "rounded-full bg-primary ",
                  dotSize,
                )}
              />
            )}
          </span>
        </span>

        {label && (
          <span
            className={cn(
              textSize,
              error ? "text-error" : "",
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  },
);

Radio.displayName = "Radio";

/* -------------------------------------------------------------------------- */
/*  Radio Group (single value from a list of options)                        */
/* -------------------------------------------------------------------------- */

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
//   type: string;
  name?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  size?: "small" | "medium";
  /** "column" stacks options, "row" wraps them horizontally */
  direction?: "row" | "column";
  id?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      onBlur,
      name,
    //   type="radio",
      error = false,
      helperText,
      disabled = false,
      size = "medium",
      direction = "column",
      id,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const groupId = id ?? generatedId;
    const helperId = helperText ? `${groupId}-helper-text` : undefined;
    // Radios in a native <input type="radio"> group need a shared `name`
    // even without React Hook Form wiring, so fall back to a stable id.
    const groupName = name ?? groupId;

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-describedby={helperId}
      >
        {label && (
          <p
            id={`${groupId}-label`}
            className={cn(
              "mb-1.5 text-sm font-medium",
              error ? "text-error" : "text-mui-text-secondary",
            )}
          >
            {label}
          </p>
        )}

        <div
          className={cn(
            "flex gap-x-4 gap-y-2",
            direction === "row" ? "flex-row flex-wrap" : "flex-col",
          )}
          onBlur={onBlur}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              name={groupName}
              value={option.value}
              label={option.label}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              disabled={disabled || option.disabled}
              size={size}
              error={error}
            />
          ))}
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

RadioGroup.displayName = "RadioGroup";