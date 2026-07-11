/* eslint-disable jsx-a11y/role-supports-aria-props */
"use client";

import * as React from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/src/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SingleSelectProps {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
}

interface MultiSelectProps {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
}

export type SelectProps = (SingleSelectProps | MultiSelectProps) & {
  /** Floating label text, mirrors MUI's `label` prop */
  label?: string;
  options: SelectOption[];
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
  /** Only used when multiple is true */
  searchPlaceholder?: string;
  noOptionsText?: string;
};

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
      multiple = false,
      searchPlaceholder = "Search...",
      noOptionsText = "No options found",
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
    const [searchQuery, setSearchQuery] = React.useState("");

    const containerRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const optionRefs = React.useRef<(HTMLLIElement | null)[]>([]);

    React.useImperativeHandle(
      ref,
      () => buttonRef.current as HTMLButtonElement,
    );

    // Normalize value across single/multiple modes
    const selectedValues = multiple
      ? Array.isArray(value)
        ? (value as string[])
        : []
      : [];
    const singleValue = !multiple ? (value as string | undefined) : undefined;

    const selectedIndex = !multiple
      ? options.findIndex((o) => o.value === singleValue)
      : -1;
    const selectedOption = !multiple ? options[selectedIndex] : undefined;

    const selectedLabels = multiple
      ? options
          .filter((o) => selectedValues.includes(o.value))
          .map((o) => o.label)
      : [];

    const filteredOptions = React.useMemo(() => {
      if (!multiple || !searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase();
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [multiple, options, searchQuery]);

    const shrink =
      focused ||
      open ||
      (multiple ? selectedValues.length > 0 : Boolean(singleValue));

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

    // Autofocus the search box when a multi-select menu opens
    React.useEffect(() => {
      if (open && multiple) {
        searchInputRef.current?.focus();
      }
    }, [open, multiple]);

    const openMenu = () => {
      if (disabled) return;
      setOpen(true);
      setSearchQuery("");
      setHighlightedIndex(multiple ? 0 : selectedIndex >= 0 ? selectedIndex : 0);
    };

    const closeMenu = (refocusButton = true) => {
      setOpen(false);
      setSearchQuery("");
      if (refocusButton) buttonRef.current?.focus();
    };

    const toggleValue = (index: number) => {
      const option = filteredOptions[index];
      if (!option || option.disabled) return;

      if (multiple) {
        const exists = selectedValues.includes(option.value);
        const next = exists
          ? selectedValues.filter((v) => v !== option.value)
          : [...selectedValues, option.value];
        (onChange as MultiSelectProps["onChange"])?.(next);
        // keep menu open for further picks, keep focus in search box
        searchInputRef.current?.focus();
      } else {
        (onChange as SingleSelectProps["onChange"])?.(option.value);
        closeMenu();
      }
    };

    const removeChip = (val: string, e: React.MouseEvent) => {
      e.stopPropagation();
      (onChange as MultiSelectProps["onChange"])?.(
        selectedValues.filter((v) => v !== val),
      );
    };

    const clearAll = (e: React.MouseEvent) => {
      e.stopPropagation();
      (onChange as MultiSelectProps["onChange"])?.([]);
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

    // Used by the <ul> in single-select mode (no search box to steal keys)
    const handleListKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) =>
            Math.min(i + 1, filteredOptions.length - 1),
          );
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
          setHighlightedIndex(filteredOptions.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          toggleValue(highlightedIndex);
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

    // Used by the search input in multi-select mode (space must type a space)
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) =>
            Math.min(i + 1, filteredOptions.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          toggleValue(highlightedIndex);
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
      ? "text-error"
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
        <input
          type="hidden"
          name={name}
          value={multiple ? selectedValues.join(",") : (singleValue ?? "")}
          readOnly
        />

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
              multiple
                ? selectedLabels.length
                  ? "text-mui-text-primary"
                  : "text-transparent"
                : selectedOption
                  ? "text-mui-text-primary"
                  : "text-transparent",
            )}
          >
            {multiple
              ? selectedLabels.length
                ? selectedLabels.join(", ")
                : placeholder || "\u00A0"
              : selectedOption
                ? selectedOption.label
                : placeholder || "\u00A0"}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            {multiple && selectedValues.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={clearAll}
                className="rounded p-0.5 text-mui-text-secondary hover:bg-mui-hoverBg"
                aria-label="Clear all selected options"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-mui-text-secondary transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </div>
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
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            tabIndex={multiple ? undefined : -1}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${selectId}-option-${highlightedIndex}`
                : undefined
            }
            onKeyDown={multiple ? undefined : handleListKeyDown}
            className={cn(
              "absolute z-9999 mt-1 w-full overflow-hidden rounded bg-inherit py-1",
              "shadow-mui outline-none",
            )}
          >
            {multiple && (
              <li className="sticky top-0 z-10 mb-1 border-b border-mui-border bg-inherit px-2 pb-1.5">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "mt-1.5 w-full rounded border border-mui-border bg-transparent px-2 py-1.5",
                    "text-sm text-mui-text-primary outline-none focus:border-mui-primary",
                  )}
                />
              </li>
            )}

            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-2 text-sm text-mui-text-secondary select-none">
                  {noOptionsText}
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = multiple
                    ? selectedValues.includes(option.value)
                    : option.value === singleValue;
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
                      onClick={() => !option.disabled && toggleValue(index)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-mui-text-primary select-none",
                        isSelected && "bg-mui-selectedBg font-medium",
                        isSelected && isHighlighted && "bg-mui-selectedBgHover",
                        !isSelected && isHighlighted && "bg-mui-hoverBg",
                        option.disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {multiple && (
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                            isSelected
                              ? "border-mui-primary bg-primary text-white"
                              : "border-mui-border",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </li>
                  );
                })
              )}
            </div>
          </ul>
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

Select.displayName = "Select";

export default Select;