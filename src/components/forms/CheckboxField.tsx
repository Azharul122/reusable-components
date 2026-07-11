"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/src/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Single Checkbox                                                          */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      checked = false,
      indeterminate = false,
      onChange,
      onBlur,
      onFocus,
      error = false,
      helperText,
      size = "medium",
      disabled = false,
      required = false,
      id,
      name,
      className,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;
    const helperId = helperText ? `${checkboxId}-helper-text` : undefined;
    const innerRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const boxSize = size === "small" ? "h-4 w-4" : "h-5 w-5";
    const iconSize = size === "small" ? "h-3 w-3" : "h-3.5 w-3.5";
    const textSize = size === "small" ? "text-sm" : "text-base";

    const boxColor = error
      ? "border-mui-error"
      : checked || indeterminate
        ? "border-mui-primary bg-primary"
        : "border-mui-border";

    return (
      <div className={cn("inline-flex flex-col", className)}>
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex select-none items-center gap-2",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          )}
        >
          <span className="relative inline-flex shrink-0">
            <input
              ref={innerRef}
              id={checkboxId}
              type="checkbox"
              name={name}
              checked={checked}
              disabled={disabled}
              required={required}
              aria-invalid={error || undefined}
              aria-describedby={helperId}
              onChange={(e) => onChange?.(e.target.checked)}
              onBlur={onBlur}
              onFocus={onFocus}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex items-center justify-center rounded-sm border-2 transition-colors duration-150",
                boxSize,
                boxColor,
                !disabled &&
                  !checked &&
                  !indeterminate &&
                  !error &&
                  "peer-hover:border-mui-borderHover",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-mui-primary peer-focus-visible:ring-offset-1",
              )}
            >
              {indeterminate ? (
                <Minus className={cn(iconSize, "text-white")} />
              ) : checked ? (
                <Check className={cn(iconSize, "text-white")} />
              ) : null}
            </span>
          </span>

          {label && (
            <span
              className={cn(
                textSize,
                error ? "text-error" : "text-mui-text-primary",
              )}
            >
              {label}
            </span>
          )}
        </label>

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

Checkbox.displayName = "Checkbox";

/* -------------------------------------------------------------------------- */
/*  Checkbox Group (multiple values, like a multi-select rendered as boxes)  */
/* -------------------------------------------------------------------------- */

export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  label?: string;
  options: CheckboxOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  onBlur?: () => void;
  name?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  size?: "small" | "medium";
  /** "column" stacks options, "row" wraps them horizontally */
  direction?: "row" | "column";
  /** Show a "Select all" toggle above the options */
  selectAll?: boolean;
  selectAllLabel?: string;
  id?: string;
}

export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      label,
      options,
      value = [],
      onChange,
      onBlur,
      name,
      error = false,
      helperText,
      disabled = false,
      size = "medium",
      direction = "column",
      selectAll = false,
      selectAllLabel = "Select all",
      id,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const groupId = id ?? generatedId;
    const helperId = helperText ? `${groupId}-helper-text` : undefined;

    const enabledValues: string[] = options
      .filter((o) => !o.disabled)
      .map((o) => o.value);

    const allSelected: boolean =
      enabledValues.length > 0 &&
      enabledValues.every((v) => value.includes(v));
    const someSelected: boolean =
      enabledValues.some((v) => value.includes(v)) && !allSelected;

    const toggleOption = (optValue: string) => {
      const next = value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue];
      onChange?.(next);
    };

    const toggleAll = () => {
      onChange?.(allSelected ? [] : enabledValues);
    };

    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={label ? `${groupId}-label` : undefined}
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

        {selectAll && (
          <Checkbox
            label={selectAllLabel}
            checked={allSelected}
            indeterminate={someSelected}
            onChange={toggleAll}
            disabled={disabled}
            size={size}
            className="mb-1.5"
          />
        )}

        <div
          className={cn(
            "flex gap-x-4 gap-y-2",
            direction === "row" ? "flex-row flex-wrap" : "flex-col",
          )}
          onBlur={onBlur}
        >
          {options.map((option) => (
            <Checkbox
              key={option.value}
              name={name}
              label={option.label}
              checked={value.includes(option.value)}
              onChange={() => toggleOption(option.value)}
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

CheckboxGroup.displayName = "CheckboxGroup";