"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { cn } from "@/src/utils/cn";

/**
 * Dates are represented as ISO "YYYY-MM-DD" strings everywhere in the public
 * API (props / onChange). Internally we work with local `Date` objects and
 * convert at the boundary, so there are no UTC/timezone off-by-one bugs.
 */
export type DateValue = string;

interface SingleDateProps {
  multiple?: false;
  value?: DateValue | null;
  onChange?: (value: DateValue | null) => void;
}

interface MultiDateProps {
  multiple: true;
  value?: DateValue[];
  onChange?: (value: DateValue[]) => void;
}

export type DateFieldProps = (SingleDateProps | MultiDateProps) & {
  /** Floating label text, mirrors the Select component */
  label?: string;
  onBlur?: () => void;
  name?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** Background the shrunk label notch is drawn on top of, defaults to bg-white */
  labelBackgroundClassName?: string;

  /** Dates that are already booked / taken and therefore not selectable */
  bookedDates?: DateValue[];
  /** Disable every date before today. Defaults to true. */
  disablePast?: boolean;
  /** Inclusive lower bound */
  minDate?: DateValue;
  /** Inclusive upper bound */
  maxDate?: DateValue;
  /** 0 = Sunday, 1 = Monday. Defaults to 0. */
  weekStartsOn?: 0 | 1;
  /** Custom formatter for the trigger + chip labels */
  formatDate?: (date: Date) => string;
};

const WEEKDAY_LABELS_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_LABELS_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const defaultFormatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ---- date helpers (local time, no UTC drift) -------------------------------

function toISODate(date: Date): DateValue {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromISODate(value: DateValue): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getCalendarDays(viewDate: Date, weekStartsOn: 0 | 1): (Date | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  const startOffset = (firstOfMonth.getDay() - weekStartsOn + 7) % 7;

  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ---- component --------------------------------------------------------------

const DateField = React.forwardRef<HTMLButtonElement, DateFieldProps>(
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
      labelBackgroundClassName = "bg-background text-primary",
      multiple = false,
      bookedDates,
      disablePast = true,
      minDate,
      maxDate,
      weekStartsOn = 0,
      formatDate = defaultFormatDate,
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const helperId = helperText ? `${fieldId}-helper-text` : undefined;
    const gridId = `${fieldId}-grid`;

    const [open, setOpen] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    const selectedDates: DateValue[] = multiple
      ? Array.isArray(value)
        ? (value as DateValue[])
        : []
      : value
        ? [value as DateValue]
        : [];

    const initialView = selectedDates.length
      ? fromISODate(selectedDates[selectedDates.length - 1])
      : new Date();
    const [viewDate, setViewDate] = React.useState<Date>(
      new Date(initialView.getFullYear(), initialView.getMonth(), 1),
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const today = startOfDay(new Date());
    const bookedSet = React.useMemo(
      () => new Set(bookedDates ?? []),
      [bookedDates],
    );
    const minD = minDate ? startOfDay(fromISODate(minDate)) : undefined;
    const maxD = maxDate ? startOfDay(fromISODate(maxDate)) : undefined;

    const isDisabledDate = React.useCallback(
      (date: Date) => {
        const day = startOfDay(date);
        if (disablePast && day < today) return true;
        if (minD && day < minD) return true;
        if (maxD && day > maxD) return true;
        if (bookedSet.has(toISODate(day))) return true;
        return false;
      },
      [disablePast, today, minD, maxD, bookedSet],
    );

    // Close on outside click
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

    const openMenu = () => {
      if (disabled) return;
      const base = selectedDates.length
        ? fromISODate(selectedDates[selectedDates.length - 1])
        : new Date();
      setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
      setOpen(true);
    };

    const closeMenu = (refocusButton = true) => {
      setOpen(false);
      if (refocusButton) buttonRef.current?.focus();
      onBlur?.();
    };

    const selectDate = (date: Date) => {
      if (isDisabledDate(date)) return;
      const iso = toISODate(date);

      if (multiple) {
        const exists = selectedDates.includes(iso);
        const next = exists
          ? selectedDates.filter((d) => d !== iso)
          : [...selectedDates, iso].sort();
        (onChange as MultiDateProps["onChange"])?.(next);
        // stay open so multiple dates can be picked in one go
      } else {
        (onChange as SingleDateProps["onChange"])?.(iso);
        closeMenu();
      }
    };

    const removeChip = (iso: DateValue, e: React.MouseEvent) => {
      e.stopPropagation();
      (onChange as MultiDateProps["onChange"])?.(
        selectedDates.filter((d) => d !== iso),
      );
    };

    const clearAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (multiple) (onChange as MultiDateProps["onChange"])?.([]);
      else (onChange as SingleDateProps["onChange"])?.(null);
    };

    const handleButtonKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          e.preventDefault();
          if (!open) openMenu();
          break;
        case "Escape":
          closeMenu();
          break;
      }
    };

    const shrink = focused || open || selectedDates.length > 0;

    const displayLabel = React.useMemo(() => {
      if (!selectedDates.length) return placeholder || "\u00A0";
      if (!multiple) return formatDate(fromISODate(selectedDates[0]));
      if (selectedDates.length <= 2) {
        return selectedDates.map((d) => formatDate(fromISODate(d))).join(", ");
      }
      return `${selectedDates.length} dates selected`;
    }, [selectedDates, multiple, placeholder, formatDate]);

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
        ? "text-mui-primary"
        : "text-mui-text-secondary";

    const weekdayLabels = weekStartsOn === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;
    const calendarDays = React.useMemo(
      () => getCalendarDays(viewDate, weekStartsOn),
      [viewDate, weekStartsOn],
    );
    const monthLabel = viewDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const canGoPrevMonth =
      !minD || addMonths(viewDate, 0) > new Date(minD.getFullYear(), minD.getMonth(), 1);

    return (
      <div
        ref={containerRef}
        className={cn(
          fullWidth ? "w-full" : "inline-block",
          "font-roboto relative",
        )}
      >
        <input
          type="hidden"
          name={name}
          value={multiple ? selectedDates.join(",") : (selectedDates[0] ?? "")}
          readOnly
        />

        <button
          ref={buttonRef}
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={gridId}
          aria-invalid={error || undefined}
          aria-describedby={helperId}
          onClick={() => (open ? closeMenu() : openMenu())}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!open) {
              setFocused(false);
              onBlur?.();
            }
          }}
          onKeyDown={handleButtonKeyDown}
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
              selectedDates.length ? "" : "text-transparent",
            )}
          >
            {displayLabel}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            {selectedDates.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={clearAll}
                className="rounded p-0.5 text-mui-text-secondary hover:bg-mui-hoverBg"
                aria-label="Clear selected date(s)"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <CalendarDays className={`h-5 w-5 shrink-0 text-mui-text-secondary ${shrink ? "opacity-100 text-primary" : "opacity-0"}`} />
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
            id={gridId}
            role="dialog"
            aria-label={label ? `${label} calendar` : "Choose a date"}
            className={cn(
              "absolute z-9999 mt-1 w-[300px] rounded  p-3 bg-background",
              "shadow-mui outline-none",
            )}
          >
            {multiple && selectedDates.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5  border-mui-border pb-3">
                {selectedDates.map((iso) => (
                  <span
                    key={iso}
                    className="flex items-center gap-1 rounded-full bg-mui-selectedBg px-2.5 py-1 text-xs font-medium "
                  >
                    {formatDate(fromISODate(iso))}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => removeChip(iso, e)}
                      className="cursor-pointer rounded-full hover:bg-mui-selectedBgHover"
                      aria-label={`Remove ${iso}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                ))}
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => canGoPrevMonth && setViewDate((d) => addMonths(d, -1))}
                disabled={!canGoPrevMonth}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded hover:bg-mui-hoverBg",
                  !canGoPrevMonth && "cursor-not-allowed opacity-30",
                )}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-sm font-medium ">
                {monthLabel}
              </span>

              <button
                type="button"
                onClick={() => setViewDate((d) => addMonths(d, 1))}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-mui-hoverBg"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-mui-text-secondary">
              {weekdayLabels.map((wd) => (
                <div key={wd} className="py-1 font-medium">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} />;

                const dayDisabled = isDisabledDate(date);
                const isSelected = selectedDates.includes(toISODate(date));
                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={toISODate(date)}
                    type="button"
                    disabled={dayDisabled}
                    onClick={() => selectDate(date)}
                    aria-pressed={isSelected}
                    aria-disabled={dayDisabled}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                      isSelected
                        ? "bg-primary font-medium text-white"
                        : " hover:bg-mui-hoverBg",
                      !isSelected && isToday && "border border-mui-primary",
                      dayDisabled &&
                        "cursor-not-allowed text-mui-text-secondary line-through opacity-40 hover:bg-transparent",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {multiple && (
              <div className="mt-3 flex justify-end  border-mui-border pt-3">
                <button
                  type="button"
                  onClick={() => closeMenu()}
                  className="rounded px-3 py-1.5 text-sm font-medium uppercase tracking-wide text-mui-primary hover:bg-mui-hoverBg"
                >
                  Done
                </button>
              </div>
            )}
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

DateField.displayName = "DateField";

export default DateField;