"use client";

import * as React from "react";

import { cn } from "@/src/utils/cn";

type BaseSliderProps = {
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  /** e.g. (v) => `$${v}` for pricing */
  formatValue?: (value: number) => string;
  showValue?: boolean;
  name?: string;
  onBlur?: () => void;
};

type SliderSingleProps = BaseSliderProps & {
  range?: false;
  value: number;
  onChange: (value: number) => void;
};

type SliderRangeProps = BaseSliderProps & {
  range: true;
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export type SliderProps = SliderSingleProps | SliderRangeProps;

const defaultFormat = (v: number) => String(v);

/**
 * Single-thumb slider (`range` omitted/false, value: number) or
 * dual-thumb range slider (`range: true`, value: [number, number]).
 * Built on two native <input type="range"> stacked over one track,
 * so keyboard/a11y behavior comes for free.
 */
export function Slider(props: SliderProps) {
  const {
    label,
    helperText,
    error,
    disabled,
    fullWidth = true,
    className,
    min = 0,
    max = 100,
    step = 1,
    formatValue = defaultFormat,
    showValue = true,
    name,
    onBlur,
  } = props;

  const isRange = props.range === true;
  const [lowVal, highVal] = isRange
    ? (props.value as [number, number])
    : [min, props.value as number];

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleLowChange = (raw: number) => {
    if (!isRange) return;
    const clamped = Math.min(raw, highVal - step);
    (props.onChange as (v: [number, number]) => void)([
      Math.max(min, clamped),
      highVal,
    ]);
  };

  const handleHighOrSingleChange = (raw: number) => {
    if (isRange) {
      const clamped = Math.max(raw, lowVal + step);
      (props.onChange as (v: [number, number]) => void)([
        lowVal,
        Math.min(max, clamped),
      ]);
    } else {
      (props.onChange as (v: number) => void)(raw);
    }
  };

  return (
    <div className={cn(fullWidth && "w-full", className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium ">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-mui-text-secondary">
              {isRange
                ? `${formatValue(lowVal)} – ${formatValue(highVal)}`
                : formatValue(highVal)}
            </span>
          )}
        </div>
      )}

      <div className="relative flex h-6 items-center">
        <div
          className={cn(
            "absolute h-1.5 w-full rounded-full",
            error ? "bg-red-200" : "bg-gray-300",
          )}
        />
        <div
          className={cn(
            "absolute h-1.5 rounded-full",
            error ? "bg-red-500" : "bg-primary",
            disabled && "opacity-60",
          )}
          style={{
            left: `${isRange ? pct(lowVal) : 0}%`,
            right: `${100 - pct(highVal)}%`,
          }}
        />

        {isRange && (
          <input
            type="range"
            aria-label={label ? `${label} minimum` : "Minimum value"}
            min={min}
            max={max}
            step={step}
            value={lowVal}
            disabled={disabled}
            name={name ? `${name}-min` : undefined}
            onChange={(e) => handleLowChange(Number(e.target.value))}
            onBlur={onBlur}
            className="slider-thumb absolute w-full appearance-none bg-transparent"
          />
        )}

        <input
          type="range"
          aria-label={label ? (isRange ? `${label} maximum` : label) : "Value"}
          min={min}
          max={max}
          step={step}
          value={highVal}
          disabled={disabled}
          name={isRange && name ? `${name}-max` : name}
          onChange={(e) => handleHighOrSingleChange(Number(e.target.value))}
          onBlur={onBlur}
          className="slider-thumb absolute w-full appearance-none bg-transparent"
        />
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

      {/* Scoped to this component instance by styled-jsx (built into Next.js) */}
      <style jsx>{`
        .slider-thumb {
          pointer-events: none;
          height: 1.5rem;
        }
        .slider-thumb::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          background: transparent;
        }
        .slider-thumb::-moz-range-track {
          background: transparent;
        }
        .slider-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          margin-top: 0;
          border-radius: 9999px;
          background: white;
          border: 2px solid ${error ? "#ef4444" : "var(--slider-accent, #2563eb)"};
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
        .slider-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border: 2px solid ${error ? "#ef4444" : "var(--slider-accent, #2563eb)"};
          border-radius: 9999px;
          background: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
      `}</style>
    </div>
  );
}