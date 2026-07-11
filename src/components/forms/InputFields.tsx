"use client";

import { cn } from "@/src/utils/cn";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Floating label text, mirrors MUI's `label` prop */
  label?: string;
  /** Puts the field in an error state (red border/label/helper text) */
  error?: boolean;
  /** Helper or error text rendered under the field */
  helperText?: string;
  /** Stretches the field to fill its container, like MUI's fullWidth */
  fullWidth?: boolean;
  /** Matches MUI's TextField size prop */
  size?: "small" | "medium";
  /** Icon/element rendered at the start of the input (MUI InputAdornment) */
  startAdornment?: React.ReactNode;
  /**
   * Icon/element rendered at the end of the input (MUI InputAdornment).
   * Ignored for type="password" unless `showPasswordToggle` is explicitly
   * set to false, since the toggle button takes this slot instead.
   */
  endAdornment?: React.ReactNode;
  /**
   * Tailwind background class used to "cut" the notch under the shrunk
   * label. Set this to whatever surface the field sits on (defaults to
   * `bg-white`, MUI's default paper color) so the label doesn't show a
   * mismatched box behind it.
   */
  labelBackgroundClassName?: string;
  /**
   * Shows an eye/eye-off toggle button that switches the field between
   * `type="password"` and `type="text"`. Defaults to true whenever
   * `type="password"` is passed — set to false to opt out and render a
   * plain password field (or to use a custom `endAdornment` instead).
   */
  showPasswordToggle?: boolean;
}

/**
 * An outlined text field that visually and behaviorally mirrors MUI's
 * <TextField variant="outlined" />: a notched border, a label that floats
 * above the border on focus/value, hover + focus + error states, helper
 * text, and adornment slots. Built to be passed straight into
 * react-hook-form's `register()` (it forwards a ref) or wired up manually.
 *
 * For `type="password"`, a show/hide toggle is rendered automatically.
 */
const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      error = false,
      helperText,
      fullWidth = false,
      size = "medium",
      startAdornment,
      endAdornment,
      labelBackgroundClassName = "bg-black text-white",
      showPasswordToggle,
      className,
      id,
      disabled,
      value,
      defaultValue,
      type = "text",
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    forwardedRef,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper-text` : undefined;

    // --- Merge the forwarded ref (from register()/Controller) with an
    // internal ref, so we can read the input's *actual* DOM value even
    // when RHF sets it imperatively (e.g. via reset()/values prop),
    // which does not fire a React onChange event.
    const internalRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef],
    );

    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(
      Boolean(value ?? defaultValue ?? ""),
    );

    const isPasswordType = type === "password";
    // Toggle defaults to true for password fields unless explicitly disabled
    const enableToggle = isPasswordType && showPasswordToggle !== false;
    const [passwordVisible, setPasswordVisible] = React.useState(false);

    // Keep hasValue in sync for controlled usage (value prop changes)
    React.useEffect(() => {
      if (value !== undefined) setHasValue(Boolean(value));
    }, [value]);

    // Keep hasValue in sync for uncontrolled usage too. This runs after
    // every render (no dependency array — cheap DOM read), which catches
    // cases where RHF sets input.value directly through the ref (e.g.
    // form.reset() triggered by the `values` prop) without firing a
    // real onChange event.
    React.useEffect(() => {
      const domValue = internalRef.current?.value;
      if (domValue !== undefined) {
        setHasValue((prev) => {
          const next = Boolean(domValue);
          return prev === next ? prev : next;
        });
      }
    });

    const shrink = focused || hasValue;
    const showError = error;

    const heightClass = size === "small" ? "h-10" : "h-14";
    const inputPadding = size === "small" ? "py-2" : "py-4";
    const inputTextSize = size === "small" ? "text-sm" : "text-base";

    const borderColor = showError
      ? "border-mui-error"
      : focused
        ? "border-mui-primary"
        : "border-mui-border";

    const borderWidth = focused || showError ? "border-2" : "border";

    const labelColor = showError
      ? "text-error"
      : focused
        ? "text-mui-primary"
        : "text-mui-text-secondary";

    // Resolve the actual <input type>: flip between password/text when toggled
    const resolvedType = enableToggle
      ? passwordVisible
        ? "text"
        : "password"
      : type;

    // The toggle button takes over the end slot when enabled; otherwise
    // fall back to whatever endAdornment was passed in.
    const resolvedEndAdornment = enableToggle ? (
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setPasswordVisible((v) => !v)}
        aria-label={passwordVisible ? "Hide password" : "Show password"}
        aria-pressed={passwordVisible}
        className={cn(
          "flex items-center text-mui-text-secondary transition-colors",
          disabled ? "cursor-not-allowed" : "cursor-pointer hover:text-mui-text-primary",
        )}
      >
        {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    ) : (
      endAdornment
    );

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", "font-roboto")}>
        <div
          className={cn(
            "relative flex items-center rounded transition-colors duration-150",
            heightClass,
            borderWidth,
            borderColor,
            !focused &&
              !showError &&
              !disabled &&
              "hover:border-mui-borderHover",
            disabled && "opacity-40",
          )}
        >
          {startAdornment && (
            <span className="pl-3.5 flex items-center text-mui-text-secondary">
              {startAdornment}
            </span>
          )}

          <input
            ref={setRefs}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={showError || undefined}
            aria-describedby={helperId}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(Boolean(e.target.value));
              onChange?.(e);
            }}
            className={cn(
              "peer w-full min-w-0 bg-transparent outline-none",
              "px-3.5",
              inputPadding,
              inputTextSize,
              "text-mui-text-primary placeholder:text-transparent",
              "disabled:cursor-not-allowed disabled:text-mui-text-disabled",
              startAdornment && "pl-1",
              resolvedEndAdornment && "pr-1",
              className,
            )}
            {...props}
          />

          {resolvedEndAdornment && (
            <span className="pr-3.5 flex items-center text-mui-text-secondary">
              {resolvedEndAdornment}
            </span>
          )}

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "pointer-events-none select-none absolute left-3.5 origin-top-left",
                "transition-all duration-150 ease-out",
                labelColor,
                startAdornment && !shrink && "left-10",
                shrink
                  ? cn("-top-2 scale-75 px-1 -ml-1", labelBackgroundClassName)
                  : cn(
                      "top-1/2 -translate-y-1/2 scale-100",
                      size === "small" ? "text-sm" : "text-base",
                    ),
              )}
            >
              {label}
            </label>
          )}
        </div>

        {helperText && (
          <p
            id={helperId}
            className={cn(
              "mt-1 px-3.5 text-xs leading-tight",
              showError ? "text-error" : "text-mui-text-secondary",
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

TextField.displayName = "TextField";

export default TextField;