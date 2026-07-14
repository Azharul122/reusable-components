"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/src/utils/cn";

/** Always stored/communicated as 24-hour "HH:mm:ss", zero-padded. */
export type TimeValue = string;

export interface TimeFieldProps {
  /** Floating label text, mirrors Select / DateField */
  label?: string;
  value?: TimeValue | null;
  onChange?: (value: TimeValue | null) => void;
  onBlur?: () => void;
  name?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  disabled?: boolean;
  placeholder?: string;
  id?: string;

  labelBackgroundClassName?: string;
  use12Hours?: boolean;
  /** Show the seconds column. Defaults to true. */
  showSecond?: boolean;
  /** Only show every Nth hour in the column. Defaults to 1. */
  hourStep?: number;
  /** Only show every Nth minute in the column. Defaults to 1. */
  minuteStep?: number;
  /** Only show every Nth second in the column. Defaults to 1. */
  secondStep?: number;
  /** Same signature as antd: return the (24-hour) hours that can't be picked. */
  disabledHours?: () => number[];
  /** Same signature as antd: return the minutes disabled for a given hour. */
  disabledMinutes?: (selectedHour: number) => number[];
  /** Same signature as antd: return the seconds disabled for a given hour/minute. */
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
  /** Show the "Now" shortcut button. Defaults to true. */
  showNow?: boolean;
  /** Show the clear (X) icon once a value is set. Defaults to true. */
  allowClear?: boolean;
  /**
   * Display format tokens: HH/H (24h), hh/h (12h), mm/m, ss/s, A (AM/PM),
   * a (am/pm). Defaults based on `use12Hours` / `showSecond`.
   */
  format?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(value?: TimeValue | null) {
  if (!value)
    return {
      hour: null as number | null,
      minute: null as number | null,
      second: null as number | null,
    };
  const [h, m, s] = value.split(":").map((p) => Number(p));
  return { hour: h ?? null, minute: m ?? null, second: s ?? 0 };
}

function assemble(hour: number, minute: number, second: number): TimeValue {
  return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

function formatTime(value: TimeValue, format: string): string {
  const [h, m, s] = value.split(":").map((p) => Number(p));
  const hour24 = h;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 < 12 ? "AM" : "PM";

  return format.replace(/HH|hh|mm|ss|H|h|m|s|A|a/g, (token) => {
    switch (token) {
      case "HH":
        return pad2(hour24);
      case "H":
        return String(hour24);
      case "hh":
        return pad2(hour12);
      case "h":
        return String(hour12);
      case "mm":
        return pad2(m);
      case "m":
        return String(m);
      case "ss":
        return pad2(s ?? 0);
      case "s":
        return String(s ?? 0);
      case "A":
        return period;
      case "a":
        return period.toLowerCase();
      default:
        return token;
    }
  });
}

function range(start: number, end: number, step: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += step) out.push(i);
  return out;
}

interface ColumnProps {
  values: number[];
  selected: number | null;
  disabledValues: Set<number>;
  onSelect: (v: number) => void;
  formatLabel: (v: number) => string;
  columnKey: string;
}

const Column = React.forwardRef<HTMLDivElement, ColumnProps>(
  (
    { values, selected, disabledValues, onSelect, formatLabel, columnKey },
    ref,
  ) => (
    <div
      ref={ref}
      data-column={columnKey}
      className="h-56 w-16 overflow-y-auto scroll-smooth border-l border-mui-border first:border-l-0 py-1"
    >
      {values.map((v) => {
        const isSelected = selected === v;
        const isDisabled = disabledValues.has(v);
        return (
          <div
            key={v}
            data-value={v}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(v)}
            className={cn(
              "mx-1 flex h-8 cursor-pointer items-center justify-center rounded text-sm transition-colors",
              isSelected
                ? "bg-mui-selectedBg font-medium text-primary"
                : "hover:bg-mui-hoverBg",
              isDisabled &&
                "cursor-not-allowed text-mui-text-secondary opacity-40 hover:bg-transparent",
            )}
          >
            {formatLabel(v)}
          </div>
        );
      })}
    </div>
  ),
);
Column.displayName = "TimeFieldColumn";

const TimeField = React.forwardRef<HTMLButtonElement, TimeFieldProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      name,
      error = false,
      helperText,
      fullWidth = false,
      size = "medium",
      disabled = false,
      placeholder,
      id,
      labelBackgroundClassName = "bg-white",
      use12Hours = false,
      showSecond = true,
      hourStep = 1,
      minuteStep = 1,
      secondStep = 1,
      disabledHours,
      disabledMinutes,
      disabledSeconds,
      showNow = true,
      allowClear = true,
      format,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const helperId = helperText ? `${fieldId}-helper-text` : undefined;
    const panelId = `${fieldId}-panel`;

    const [open, setOpen] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const hourColRef = React.useRef<HTMLDivElement>(null);
    const minuteColRef = React.useRef<HTMLDivElement>(null);
    const secondColRef = React.useRef<HTMLDivElement>(null);
    const periodColRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(
      ref,
      () => buttonRef.current as HTMLButtonElement,
    );

    const { hour, minute, second } = parseValue(value);
    const hasValue = hour !== null;

    const resolvedFormat =
      format ??
      (use12Hours
        ? showSecond
          ? "hh:mm:ss A"
          : "hh:mm A"
        : showSecond
          ? "HH:mm:ss"
          : "HH:mm");

    React.useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
          setFocused(false);
        }
      }
      if (open) document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Scroll each column so the selected (or a sensible default) item is centered
    React.useEffect(() => {
      if (!open) return;
      const scrollToValue = (
        col: React.RefObject<HTMLDivElement | null>,
        v: number | null,
      ) => {
        if (!col.current || v === null) return;
        const el = col.current.querySelector<HTMLElement>(
          `[data-value="${v}"]`,
        );
        el?.scrollIntoView({ block: "center" });
      };
      const hour12 = hour === null ? null : hour % 12 === 0 ? 12 : hour % 12;
      const period = hour === null ? null : hour < 12 ? 0 : 1; // 0=AM,1=PM sentinel for scroll
      scrollToValue(hourColRef, use12Hours ? hour12 : hour);
      scrollToValue(minuteColRef, minute);
      if (showSecond) scrollToValue(secondColRef, second);
      if (use12Hours && periodColRef.current && period !== null) {
        const el = periodColRef.current.querySelector<HTMLElement>(
          `[data-value="${period}"]`,
        );
        el?.scrollIntoView({ block: "center" });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, hour, minute, second, use12Hours, showSecond]);

    const openPanel = () => {
      if (disabled) return;
      setOpen(true);
    };

    const closePanel = (refocus = true) => {
      setOpen(false);
      if (refocus) buttonRef.current?.focus();
      onBlur?.();
    };

    const commit = (
      nextHour: number,
      nextMinute: number,
      nextSecond: number,
    ) => {
      onChange?.(assemble(nextHour, nextMinute, nextSecond));
    };

    const currentHour = hour ?? 0;
    const currentMinute = minute ?? 0;
    const currentSecond = second ?? 0;

    const handleSelectHour24 = (h: number) =>
      commit(h, currentMinute, currentSecond);

    const handleSelectHour12 = (h12: number) => {
      const isPM = currentHour >= 12;
      const h24 = h12 === 12 ? (isPM ? 12 : 0) : isPM ? h12 + 12 : h12;
      commit(h24, currentMinute, currentSecond);
    };

    const handleSelectPeriod = (periodIndex: number) => {
      const isPM = periodIndex === 1;
      const h12 = currentHour % 12 === 0 ? 12 : currentHour % 12;
      const h24 = h12 === 12 ? (isPM ? 12 : 0) : isPM ? h12 + 12 : h12;
      commit(h24, currentMinute, currentSecond);
    };

    const handleSelectMinute = (m: number) =>
      commit(currentHour, m, currentSecond);
    const handleSelectSecond = (s: number) =>
      commit(currentHour, currentMinute, s);

    const handleNow = () => {
      const now = new Date();
      commit(now.getHours(), now.getMinutes(), now.getSeconds());
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
    };

    const hourValues = use12Hours
      ? range(1, 12, hourStep)
      : range(0, 23, hourStep);
    const minuteValues = range(0, 59, minuteStep);
    const secondValues = range(0, 59, secondStep);

    const disabledHourSet = React.useMemo(() => {
      const raw = new Set(disabledHours?.() ?? []);
      if (!use12Hours) return raw;
      // translate 24h-disabled hours into the 12h values shown, only fully
      // disabling a 12h slot when both its AM and PM counterpart are disabled
      const disabled12 = new Set<number>();
      for (const h12 of hourValues) {
        const am = h12 === 12 ? 0 : h12;
        const pm = h12 === 12 ? 12 : h12 + 12;
        if (raw.has(am) && raw.has(pm)) disabled12.add(h12);
      }
      return disabled12;
    }, [disabledHours, use12Hours, hourValues]);

    const disabledMinuteSet = React.useMemo(
      () => new Set(disabledMinutes?.(currentHour) ?? []),
      [disabledMinutes, currentHour],
    );
    const disabledSecondSet = React.useMemo(
      () => new Set(disabledSeconds?.(currentHour, currentMinute) ?? []),
      [disabledSeconds, currentHour, currentMinute],
    );

    const shrink = focused || open || hasValue;
    const displayText =
      hasValue && value
        ? formatTime(value, resolvedFormat)
        : placeholder || "\u00A0";

    const heightClass = size === "small" ? "h-10" : "h-14";
    const textSize = size === "small" ? "text-sm" : "text-base";

    const borderColor = error
      ? "border-mui-error"
      : focused || open
        ? "border-primary"
        : "border-mui-border";
    const borderWidth = focused || open || error ? "border-2" : "border";
    const labelColor = error
      ? "text-error"
      : focused || open
        ? "text-primary"
        : "text-mui-text-secondary";

    const hour12Selected =
      hour === null ? null : hour % 12 === 0 ? 12 : hour % 12;
    const periodSelected = hour === null ? null : hour < 12 ? 0 : 1;

    return (
      <div
        ref={containerRef}
        className={cn(
          fullWidth ? "w-full" : "inline-block",
          "font-roboto relative",
        )}
      >
        <input type="hidden" name={name} value={value ?? ""} readOnly />

        <button
          ref={buttonRef}
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          aria-invalid={error || undefined}
          aria-describedby={helperId}
          onClick={() => (open ? closePanel() : openPanel())}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!open) {
              setFocused(false);
              onBlur?.();
            }
          }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
              e.preventDefault();
              if (!open) openPanel();
            } else if (e.key === "Escape") {
              closePanel();
            }
          }}
          className={cn(
            "relative flex w-full min-w-0 items-center justify-between gap-2 rounded transition-colors duration-150",
            "px-3.5 text-left",
            heightClass,
            textSize,
            borderWidth,
            borderColor,
            !focused &&
              !open &&
              !error &&
              !disabled &&
              "hover:border-mui-borderHover",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "cursor-pointer bg-transparent",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              hasValue ? "" : "text-transparent",
            )}
          >
            {displayText}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            {allowClear && hasValue && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 text-mui-text-secondary hover:bg-mui-hoverBg"
                aria-label="Clear selected time"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <Clock className="h-5 w-5 shrink-0 text-mui-text-secondary" />
          </div>
        </button>

        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              "pointer-events-none select-none absolute left-3.5 origin-top-left",
              "transition-all duration-150 ease-out",
              labelColor,
              shrink
                ? cn("-top-2 scale-75 px-1 -ml-1", labelBackgroundClassName)
                : cn("top-1/2 -translate-y-1/2 scale-100", textSize),
            )}
          >
            {label}
          </label>
        )}

        {open && (
          <div
            id={panelId}
            role="dialog"
            aria-label={label ? `${label} time picker` : "Choose a time"}
            className={cn(
              "absolute z-9999 mt-1 w-fit rounded  bg-white",
              "shadow-mui outline-none",
            )}
          >
            <div className="flex">
              <Column
                ref={hourColRef}
                columnKey="hour"
                values={hourValues}
                selected={use12Hours ? hour12Selected : hour}
                disabledValues={disabledHourSet}
                onSelect={use12Hours ? handleSelectHour12 : handleSelectHour24}
                formatLabel={pad2}
              />
              <Column
                ref={minuteColRef}
                columnKey="minute"
                values={minuteValues}
                selected={minute}
                disabledValues={disabledMinuteSet}
                onSelect={handleSelectMinute}
                formatLabel={pad2}
              />
              {showSecond && (
                <Column
                  ref={secondColRef}
                  columnKey="second"
                  values={secondValues}
                  selected={second}
                  disabledValues={disabledSecondSet}
                  onSelect={handleSelectSecond}
                  formatLabel={pad2}
                />
              )}
              {use12Hours && (
                <Column
                  ref={periodColRef}
                  columnKey="period"
                  values={[0, 1]}
                  selected={periodSelected}
                  disabledValues={new Set()}
                  onSelect={handleSelectPeriod}
                  formatLabel={(v) => (v === 0 ? "AM" : "PM")}
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-mui-border px-3 py-2">
              {showNow ? (
                <button
                  type="button"
                  onClick={handleNow}
                  className="text-sm font-medium text-mui-primary hover:underline"
                >
                  Now
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => closePanel()}
                className="rounded px-3 py-1 text-sm font-medium uppercase tracking-wide text-mui-primary hover:bg-mui-hoverBg"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {helperText && (
          <p
            id={helperId}
            className={cn(
              "mt-1 px-3.5 text-xs leading-tight",
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

TimeField.displayName = "TimeField";

export default TimeField;
