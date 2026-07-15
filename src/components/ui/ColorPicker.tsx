/* eslint-disable react-hooks/immutability */
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/utils/cn";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HSVA {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
  a: number; // 0-1
}

export interface ColorValue {
  hex: string; // 6-digit, no alpha
  hexa: string; // 8-digit, includes alpha (only meaningful if alpha < 1)
  rgb: { r: number; g: number; b: number };
  rgba: { r: number; g: number; b: number; a: number };
  hsv: HSVA;
}

export interface PresetGroup {
  label?: string;
  colors: string[];
}

/* ------------------------------------------------------------------ */
/*  Color conversion utils                                             */
/* ------------------------------------------------------------------ */

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

function hsvToRgb(h: number, s: number, v: number) {
  s /= 100;
  v /= 100;
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const variants: [number, number, number][] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ];
  const [r, g, b] = variants[i];
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

const toHex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`.toLowerCase();
}

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
  const clean = hex.replace("#", "").trim();
  const isHex = /^[0-9a-fA-F]+$/.test(clean);
  if (!isHex) return null;

  if (clean.length === 3 || clean.length === 4) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    const a = clean.length === 4 ? parseInt(clean[3] + clean[3], 16) / 255 : 1;
    return { r, g, b, a };
  }
  if (clean.length === 6 || clean.length === 8) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  return null;
}

function hsvaToColorValue(hsva: HSVA): ColorValue {
  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);
  const hex = rgbToHex(r, g, b);
  const hexa = `${hex}${toHex2(hsva.a * 255)}`;
  return {
    hex,
    hexa,
    rgb: { r, g, b },
    rgba: { r, g, b, a: Math.round(hsva.a * 100) / 100 },
    hsv: hsva,
  };
}

/* ------------------------------------------------------------------ */
/*  Presets                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PRESETS: PresetGroup[] = [
  {
    label: "Presets",
    colors: [
      "#f5222d",
      "#fa8c16",
      "#fadb14",
      "#52c41a",
      "#13c2c2",
      "#1677ff",
      "#2f54eb",
      "#722ed1",
      "#eb2f96",
      "#000000",
      "#595959",
      "#ffffff",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Drag helper — shared pointer-drag logic for panel + sliders         */
/* ------------------------------------------------------------------ */

function useDrag(onMove: (clientX: number, clientY: number) => void) {
  const draggingRef = React.useRef(false);

  const handlePointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      onMove(e.clientX, e.clientY);
    },
    [onMove],
  );

  const stop = React.useCallback(() => {
    draggingRef.current = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stop);
  }, [handlePointerMove]);

  const start = React.useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      onMove(e.clientX, e.clientY);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stop);
    },
    [handlePointerMove, onMove, stop],
  );

  return start;
}

/* ------------------------------------------------------------------ */
/*  Saturation / Value panel                                           */
/* ------------------------------------------------------------------ */

function SaturationPanel({
  hsva,
  onChange,
}: {
  hsva: HSVA;
  onChange: (s: number, v: number) => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  const move = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = panelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const y = clamp(clientY - rect.top, 0, rect.height);
      onChange((x / rect.width) * 100, 100 - (y / rect.height) * 100);
    },
    [onChange],
  );

  const start = useDrag(move);

  return (
    <div
      ref={panelRef}
      onPointerDown={start}
      className="relative h-36 w-full cursor-crosshair touch-none rounded-md"
      style={{
        backgroundColor: `hsl(${hsva.h}, 100%, 50%)`,
        backgroundImage:
          "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
      }}
    >
      <div
        className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{
          left: `${hsva.s}%`,
          top: `${100 - hsva.v}%`,
          backgroundColor: `hsl(${hsva.h}, ${hsva.s}%, ${hsva.v / 2}%)`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hue slider                                                         */
/* ------------------------------------------------------------------ */

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const move = React.useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      onChange((x / rect.width) * 360);
    },
    [onChange],
  );

  const start = useDrag((x) => move(x));

  return (
    <div
      ref={trackRef}
      onPointerDown={start}
      className="relative h-3 w-full cursor-pointer touch-none rounded-full"
      style={{
        background:
          "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue},100%,50%)` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alpha slider                                                       */
/* ------------------------------------------------------------------ */

function AlphaSlider({
  hsva,
  onChange,
}: {
  hsva: HSVA;
  onChange: (a: number) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);

  const move = React.useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      onChange(x / rect.width);
    },
    [onChange],
  );

  const start = useDrag((x) => move(x));

  return (
    <div
      ref={trackRef}
      onPointerDown={start}
      className="relative h-3 w-full cursor-pointer touch-none overflow-hidden rounded-full"
      style={{
        backgroundImage:
          "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%)",
        backgroundSize: "8px 8px",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))`,
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${hsva.a * 100}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Swatch (trigger + preset chips)                                    */
/* ------------------------------------------------------------------ */

function Swatch({
  color,
  alpha = 1,
  size = 20,
  className,
  onClick,
  active,
  title,
}: {
  color: string;
  alpha?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? color}
      onClick={onClick}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border border-gray-300 transition-transform hover:scale-105",
        active && "ring-2 ring-primary ring-offset-1",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundImage: "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%)",
        backgroundSize: "6px 6px",
      }}
    >
      <span
        className="absolute inset-0"
        style={{ backgroundColor: color, opacity: alpha }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ColorPicker                                                    */
/* ------------------------------------------------------------------ */

export interface ColorPickerProps {
  /** Controlled hex or 8-digit hexa value, e.g. "#1677ff" or "#1677ffcc" */
  value?: string;
  defaultValue?: string;
  onChange?: (color: ColorValue) => void;
  /** Fired on pointer-up / input blur — good place to persist the value */
  onChangeComplete?: (color: ColorValue) => void;
  presets?: PresetGroup[];
  disableAlpha?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const triggerSize: Record<NonNullable<ColorPickerProps["size"]>, number> = {
  sm: 22,
  md: 28,
  lg: 34,
};

/**
 * Ant Design–style color picker: swatch trigger + popover with a
 * saturation panel, hue/alpha sliders, hex input, and presets.
 *
 * @example
 * const [color, setColor] = useState("#1677ff");
 * <ColorPicker value={color} onChangeComplete={(c) => setColor(c.hexa)} />
 */
const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      value,
      defaultValue = "#1677ff",
      onChange,
      onChangeComplete,
      presets = DEFAULT_PRESETS,
      disableAlpha = false,
      disabled = false,
      size = "md",
      label,
      className,
    },
    ref,
  ) => {
    const initial = hexToRgba(value ?? defaultValue) ?? { r: 22, g: 119, b: 255, a: 1 };
    const [hsva, setHsva] = React.useState<HSVA>(() => ({
      ...rgbToHsv(initial.r, initial.g, initial.b),
      a: initial.a,
    }));
    const [open, setOpen] = React.useState(false);
    const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    // Sync controlled `value` in. This is the "adjusting state when a prop
    // changes" pattern from the React docs: the setState call happens in the
    // render body (guarded so it only runs once per actual value change),
    // not inside an effect, so it doesn't trigger an extra commit/paint.
    const [prevValue, setPrevValue] = React.useState(value);
    if (value !== undefined && value !== prevValue) {
      setPrevValue(value);
      const parsed = hexToRgba(value);
      if (parsed) {
        setHsva({ ...rgbToHsv(parsed.r, parsed.g, parsed.b), a: parsed.a });
      }
    }

    const colorValue = React.useMemo(() => hsvaToColorValue(hsva), [hsva]);

    // Hex input is fully derived from colorValue except while the user is
    // actively typing — `hexDraft` is the "in progress" edit buffer, null
    // when the field mirrors the current color. No effect needed.
    const [hexDraft, setHexDraft] = React.useState<string | null>(null);
    const committedHex = disableAlpha ? colorValue.hex.slice(1) : colorValue.hexa.slice(1);
    const hexInput = hexDraft ?? committedHex;

    const emitChange = React.useCallback(
      (next: HSVA) => {
        setHsva(next);
        onChange?.(hsvaToColorValue(next));
      },
      [onChange],
    );

    const emitComplete = React.useCallback(
      (next?: HSVA) => {
        onChangeComplete?.(hsvaToColorValue(next ?? hsva));
      },
      [hsva, onChangeComplete],
    );

    // Position popover relative to the trigger, clamped to the viewport.
    // Flips above the trigger when there isn't enough room below (and vice
    // versa) — the same auto-placement behavior antd's popover uses.
    const updatePosition = React.useCallback(() => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;

      const gap = 8;
      const edgePadding = 8;
      const popoverWidth = 248;
      // Real height once mounted; a sensible fallback for the very first
      // measurement pass before the popover has painted.
      const popoverHeight = popoverRef.current?.offsetHeight ?? 360;

      const triggerRect = triggerEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top: number;
      if (spaceBelow >= popoverHeight + gap || spaceBelow >= spaceAbove) {
        // Enough room below, or at least more room below than above.
        top = triggerRect.bottom + gap;
      } else {
        // Not enough room below — flip above the trigger.
        top = triggerRect.top - popoverHeight - gap;
      }
      top = clamp(top, edgePadding, Math.max(edgePadding, window.innerHeight - popoverHeight - edgePadding));

      let left = triggerRect.left;
      if (left + popoverWidth > window.innerWidth - edgePadding) {
        left = window.innerWidth - popoverWidth - edgePadding;
      }
      left = Math.max(edgePadding, left);

      setPos({ top, left });
    }, []);

    React.useLayoutEffect(() => {
      if (!open) return;
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [open, updatePosition]);

    // Click outside / Escape to close
    React.useEffect(() => {
      if (!open) return;
      const handlePointerDown = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          popoverRef.current?.contains(target) ||
          triggerRef.current?.contains(target)
        ) {
          return;
        }
        setOpen(false);
        emitComplete();
      };
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          emitComplete();
        }
      };
      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleKey);
      return () => {
        window.removeEventListener("mousedown", handlePointerDown);
        window.removeEventListener("keydown", handleKey);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleHexCommit = (raw: string) => {
      const parsed = hexToRgba(raw);
      if (!parsed) return; // invalid — ignore, keep last good value
      const next = { ...rgbToHsv(parsed.r, parsed.g, parsed.b), a: disableAlpha ? 1 : parsed.a };
      emitChange(next);
      emitComplete(next);
    };

    return (
      <div ref={ref} className={cn("inline-flex flex-col gap-1.5", className)}>
        {label && <span className="text-sm font-medium text-gray-700">{label}</span>}

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            setPos(null);
            setOpen((o) => !o);
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1.5 shadow-sm transition-colors hover:border-gray-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Swatch
            color={colorValue.hex}
            alpha={colorValue.hsv.a}
            size={triggerSize[size]}
          />
          <span className="font-mono text-xs uppercase text-gray-600">
            {disableAlpha ? colorValue.hex : colorValue.hexa}
          </span>
        </button>

        {open &&
          createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Color picker"
              className="fixed z-[9999] w-[248px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              // Rendered off-screen (but still measurable) until the layout
              // effect below computes a real, flip-aware position — this
              // runs before paint so there's no visible flash.
              style={
                pos
                  ? { top: pos.top, left: pos.left }
                  : { top: 0, left: -9999, visibility: "hidden" }
              }
            >
              <SaturationPanel
                hsva={hsva}
                onChange={(s, v) => emitChange({ ...hsva, s, v })}
              />

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 space-y-2">
                  <HueSlider hue={hsva.h} onChange={(h) => emitChange({ ...hsva, h })} />
                  {!disableAlpha && (
                    <AlphaSlider hsva={hsva} onChange={(a) => emitChange({ ...hsva, a })} />
                  )}
                </div>
                <Swatch
                  color={colorValue.hex}
                  alpha={colorValue.hsv.a}
                  size={32}
                  className="rounded-lg"
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">#</span>
                <input
                  value={hexInput}
                  onFocus={() => setHexDraft(committedHex)}
                  onChange={(e) => setHexDraft(e.target.value.replace(/[^0-9a-fA-F]/g, ""))}
                  onBlur={(e) => {
                    handleHexCommit(`#${e.target.value}`);
                    setHexDraft(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleHexCommit(`#${hexInput}`);
                      setHexDraft(null);
                    }
                  }}
                  spellCheck={false}
                  className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs uppercase focus:border-primary focus:outline-none"
                />
              </div>

              {presets.map((group, i) => (
                <div key={group.label ?? i} className="mt-3">
                  {group.label && (
                    <div className="mb-1.5 text-xs font-medium text-gray-500">
                      {group.label}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {group.colors.map((c) => {
                      const parsed = hexToRgba(c);
                      if (!parsed) return null;
                      const active = parsed && rgbToHex(parsed.r, parsed.g, parsed.b) === colorValue.hex;
                      return (
                        <Swatch
                          key={c}
                          color={rgbToHex(parsed.r, parsed.g, parsed.b)}
                          alpha={parsed.a}
                          size={18}
                          active={active}
                          onClick={() => {
                            const next = {
                              ...rgbToHsv(parsed.r, parsed.g, parsed.b),
                              a: disableAlpha ? 1 : parsed.a,
                            };
                            emitChange(next);
                            emitComplete(next);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;