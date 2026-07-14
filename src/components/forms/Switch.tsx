"use client";

import * as React from "react";

import { cn } from "@/src/utils/cn";

export interface SwitchOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BaseSwitchProps {
  label?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export interface SwitchProps extends BaseSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  name?: string;
}


export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      label,
      checked,
      onChange,
      onBlur,
      name,
      error,
      helperText,
      disabled,
      fullWidth = true,
      className,
    },
    ref,
  ) => {
    return (
      <div className={cn(fullWidth && "w-full", className)}>
        <label
          className={cn(
            "inline-flex select-none items-center gap-3",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-invalid={error || undefined}
            name={name}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            onBlur={onBlur}
            className={cn(
              "relative  inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors duration-200 ease-in-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              checked
                ? "border-primary bg-primary"
                : "border-gray-300 bg-gray-200",
              error && "border-red-500",
              disabled && "pointer-events-none",
            )}
          >
            <span
              className={cn(
                "inline-block  h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                checked ? "translate-x-5.75" : "translate-x-0.5",
              )}
            />
          </button>

          {label && (
            <span className="text-sm font-medium ">
              {label}
            </span>
          )}
        </label>

        {helperText && (
          <p
            className={cn(
              "mt-1 text-xs",
              error ? "text-red-500" : "text-mui-text-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Switch.displayName = "Switch";

export interface SwitchGroupProps extends BaseSwitchProps {
  options: SwitchOption[];
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  direction?: "row" | "column";
}


export const SwitchGroup = React.forwardRef<HTMLDivElement, SwitchGroupProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      onBlur,
      direction = "column",
      error,
      helperText,
      disabled,
      fullWidth = true,
      className,
    },
    ref,
  ) => {
    const toggle = (optionValue: string, optionDisabled?: boolean) => {
      if (disabled || optionDisabled) return;
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(next);
    };

    return (
      <div ref={ref} className={cn(fullWidth && "w-full", className)}>
        {label && (
          <p className="mb-2 text-sm font-medium ">
            {label}
          </p>
        )}

        <div
          className={cn(
            "flex gap-4",
            direction === "row" ? "flex-row flex-wrap" : "flex-col",
          )}
        >
          {options.map((option) => (
            <Switch
              key={option.value}
              label={option.label}
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value, option.disabled)}
              onBlur={onBlur}
              disabled={disabled || option.disabled}
              fullWidth={false}
            />
          ))}
        </div>

        {helperText && (
          <p
            className={cn(
              "mt-1 text-xs",
              error ? "text-red-500" : "text-mui-text-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
SwitchGroup.displayName = "SwitchGroup";