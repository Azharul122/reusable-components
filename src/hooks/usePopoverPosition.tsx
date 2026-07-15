"use client";

import * as React from "react";

export type PopoverPlacement = "top" | "bottom";

export interface UsePopoverPositionOptions {
  gap?: number;
  edgePadding?: number;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  onClose?: () => void;
}

export interface PopoverPosition {
  top: number;
  left: number;
}

export interface UsePopoverPositionResult<
  TTrigger extends HTMLElement = HTMLElement,
  TPopover extends HTMLElement = HTMLElement,
> {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
  close: () => void;
  triggerRef: React.RefObject<TTrigger | null>;
  popoverRef: React.RefObject<TPopover | null>;
  style: React.CSSProperties;
  placement: PopoverPlacement;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export function usePopoverPosition<
  TTrigger extends HTMLElement = HTMLElement,
  TPopover extends HTMLElement = HTMLElement,
>(
  options: UsePopoverPositionOptions = {},
): UsePopoverPositionResult<TTrigger, TPopover> {
  const {
    gap = 8,
    edgePadding = 8,
    closeOnOutsideClick = true,
    closeOnEscape = true,
    onClose,
  } = options;

  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<PopoverPosition | null>(null);
  const [placement, setPlacement] = React.useState<PopoverPlacement>("bottom");

  const triggerRef = React.useRef<TTrigger>(null);
  const popoverRef = React.useRef<TPopover>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = React.useCallback(() => {
    // Reset so the next open always re-measures instead of reusing a
    // possibly-stale position (trigger may have moved: scroll, resize, etc.)
    setPos(null);
    setOpen((o) => !o);
  }, []);

  const updatePosition = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    // Fall back to sensible estimates on the very first measurement pass,
    // before the popover has painted and has a real offsetWidth/Height.
    const popoverWidth = popoverRef.current?.offsetWidth ?? triggerRect.width;
    const popoverHeight = popoverRef.current?.offsetHeight ?? 200;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    let top: number;
    let nextPlacement: PopoverPlacement;
    if (spaceBelow >= popoverHeight + gap || spaceBelow >= spaceAbove) {
      top = triggerRect.bottom + gap;
      nextPlacement = "bottom";
    } else {
      top = triggerRect.top - popoverHeight - gap;
      nextPlacement = "top";
    }
    top = clamp(
      top,
      edgePadding,
      Math.max(edgePadding, window.innerHeight - popoverHeight - edgePadding),
    );

    let left = triggerRect.left;
    if (left + popoverWidth > window.innerWidth - edgePadding) {
      left = window.innerWidth - popoverWidth - edgePadding;
    }
    left = Math.max(edgePadding, left);

    setPlacement(nextPlacement);
    setPos({ top, left });
  }, [gap, edgePadding]);

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

  // Outside click / Escape to close.
  React.useEffect(() => {
    if (!open || (!closeOnOutsideClick && !closeOnEscape)) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!closeOnOutsideClick) return;
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") close();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, close, closeOnOutsideClick, closeOnEscape]);

  const style: React.CSSProperties = pos
    ? { position: "fixed", top: pos.top, left: pos.left }
    : { position: "fixed", top: 0, left: -9999, visibility: "hidden" };

  return {
    open,
    setOpen,
    toggle,
    close,
    triggerRef,
    popoverRef,
    style,
    placement,
  };
}

/**
 * @example
 * function Dropdown() {
 *   const { open, toggle, triggerRef, popoverRef, style } = usePopoverPosition();
 *
 *   return (
 *     <>
 *       <button ref={triggerRef} onClick={toggle}>Open</button>
 *       {open &&
 *         createPortal(
 *           <div ref={popoverRef} className="fixed z-50 w-56 rounded-lg border bg-white p-2 shadow-lg" style={style}>
 *             ...menu content...
 *           </div>,
 *           document.body,
 *         )}
 *     </>
 *   );
 * }
 */
