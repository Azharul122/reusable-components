"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/src/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Floating label text, mirrors MUI's `label` prop */
  label?: string;
  options: SelectOption[];
  value?: string;
  /** Fires with the newly selected option's value, like a native onChange */
  onChange?: (value: string) => void;
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
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
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
      labelBackgroundClassName = "bg-black text-white",
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const helperId = helperText ? `${selectId}-helper-text` : undefined;
    const listboxId = `${selectId}-listbox`;

    const [open, setOpen] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);
    const optionRefs = React.useRef<(HTMLLIElement | null)[]>([]);

    React.useImperativeHandle(
      ref,
      () => buttonRef.current as HTMLButtonElement,
    );

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selectedOption = options[selectedIndex];
    const shrink = focused || open || Boolean(value);

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

    // Keep the highlighted option scrolled into view
    React.useEffect(() => {
      if (open && highlightedIndex >= 0) {
        optionRefs.current[highlightedIndex]?.scrollIntoView({
          block: "nearest",
        });
      }
    }, [open, highlightedIndex]);

    const openMenu = () => {
      if (disabled) return;
      setOpen(true);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    };

    const closeMenu = (refocusButton = true) => {
      setOpen(false);
      if (refocusButton) buttonRef.current?.focus();
    };

    const commitSelection = (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange?.(option.value);
      closeMenu();
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

    const handleListKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          commitSelection(highlightedIndex);
          break;
        case "Escape":
          e.preventDefault();
          closeMenu();
          break;
        case "Tab":
          closeMenu(false);
          break;
      }
    };

    const heightClass = size === "small" ? "h-10" : "h-14";
    const textSize = size === "small" ? "text-sm" : "text-base";

    const borderColor = error
      ? "border-mui-error"
      : focused || open
        ? "border-mui-primary"
        : "border-mui-border";
    const borderWidth = focused || open || error ? "border-2" : "border";

    const labelColor = error
      ? "text-red-600"
      : focused || open
        ? "text-mui-primary"
        : "text-mui-text-secondary";

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
          id={selectId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
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
            "relative flex w-full items-center justify-between rounded transition-colors duration-150",
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
              selectedOption ? "text-mui-text-primary" : "text-transparent",
            )}
          >
            {selectedOption ? selectedOption.label : placeholder || "\u00A0"}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-mui-text-secondary transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>

        {label && (
          <label
            htmlFor={selectId}
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
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${selectId}-option-${highlightedIndex}`
                : undefined
            }
            onKeyDown={handleListKeyDown}
            className={cn(
              "absolute z-9999 mt-1 max-h-60 w-full overflow-auto rounded  py-1",
              "shadow-mui outline-none",
            )}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={option.value}
                  id={`${selectId}-option-${index}`}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => !option.disabled && commitSelection(index)}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm text-mui-text-primary select-none",
                    isSelected && "bg-mui-selectedBg font-medium",
                    isSelected && isHighlighted && "bg-mui-selectedBgHover",
                    !isSelected && isHighlighted && "bg-mui-hoverBg",
                    option.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}

        {helperText && (
          <p
            id={helperId}
            className={cn(
              "mt-1 px-3.5 text-xs leading-tight",
              error ? "text-red-600" : "text-mui-text-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
