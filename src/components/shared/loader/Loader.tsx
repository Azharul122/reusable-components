"use client";

import Spinner from "./Spinner";

type LoaderVariant = "fullscreen" | "inline" | "overlay";
type LoaderSize = "sm" | "md" | "lg";

export interface PageLoaderProps {
  /**
   * "fullscreen" — fixed, covers the entire viewport (e.g. Next.js `app/loading.tsx`).
   * "inline" — sits within its parent, centered inside a min-height box (e.g. a card or tab panel).
   * "overlay" — absolutely positioned over existing (stale) content, with a blurred backdrop;
   *             parent needs `className="relative"`. Good for refetch-in-place loading.
   */
  variant?: LoaderVariant;
  label?: string;
  size?: LoaderSize;
  /** Only used by "inline" — sets a minimum height so the layout doesn't jump */
  minHeight?: string;
  className?: string;
}

const spinnerSizeMap: Record<LoaderSize, "sm" | "md" | "lg" | "xl"> = {
  sm: "md",
  md: "lg",
  lg: "xl",
};

const labelSizeMap: Record<LoaderSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

/**
 * Reusable loading indicator with three variants covering the common cases:
 * a full route swap, a section/card while its data loads, and a subtle
 * overlay while existing content refetches in the background.
 *
 * @example
 * // app/dashboard/loading.tsx (Next.js route-level loading UI)
 * export default function Loading() {
 *   return <PageLoader variant="fullscreen" label="Loading dashboard…" />;
 * }
 *
 * @example
 * // inside a card while its own data loads
 * {isLoading ? <PageLoader variant="inline" minHeight="16rem" /> : <Table data={data} />}
 *
 * @example
 * // refetching in place, keep stale content visible underneath
 * <div className="relative">
 *   {isFetching && <PageLoader variant="overlay" />}
 *   <Table data={data} />
 * </div>
 */
export default function PageLoader({
  variant = "inline",
  label,
  size = "md",
  minHeight = "12rem",
  className = "",
}: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <Spinner size={spinnerSizeMap[size]} />
      {label && (
        <p
          className={`text-neutral-500 dark:text-neutral-400 ${labelSizeMap[size]}`}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-neutral-950 ${className}`}
      >
        {content}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-neutral-950/70 ${className}`}
      >
        {content}
      </div>
    );
  }

  // inline
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight }}
      className={`flex w-full items-center justify-center ${className}`}
    >
      {content}
    </div>
  );
}
