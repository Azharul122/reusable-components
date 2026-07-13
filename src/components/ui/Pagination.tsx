"use client";

import { DOTS, usePagination } from "@/src/hooks/Pagination";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

type PaginationSize = "sm" | "md" | "lg";

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called with the new page number whenever the user navigates */
  onPageChange: (page: number) => void;
  /** Page numbers shown on each side of the current page. Default 1 */
  siblingCount?: number;
  /** Page numbers always shown at the start/end. Default 1 */
  boundaryCount?: number;
  /** Visual size. Default "md" */
  size?: PaginationSize;
  /** Hide the Prev/Next text labels, icon-only buttons */
  compact?: boolean;
  /** Extra classes on the root <nav> */
  className?: string;
  /** aria-label for the nav landmark */
  "aria-label"?: string;
}

const sizeStyles: Record<
  PaginationSize,
  { btn: string; gap: string; text: string }
> = {
  sm: { btn: "h-8 min-w-8 px-2 text-xs", gap: "gap-1", text: "text-xs" },
  md: { btn: "h-9 min-w-9 px-2.5 text-sm", gap: "gap-1.5", text: "text-sm" },
  lg: { btn: "h-11 min-w-11 px-3 text-base", gap: "gap-2", text: "text-base" },
};

/**
 * Fully reusable, responsive pagination bar.
 *
 * - Controlled: you own `currentPage`, this component only calls `onPageChange`.
 * - Framework agnostic: no Next.js dependency, works in any React app.
 * - Responsive: collapses to a compact "Prev · Page X of Y · Next" layout on
 *   small screens, expands to full numbered pagination from `sm:` up.
 * - Accessible: proper aria-current, aria-labels, disabled states, focus rings.
 *
 * @example
 * const [page, setPage] = useState(1);
 * <Pagination currentPage={page} totalPages={20} onPageChange={setPage} />
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  size = "md",
  compact = false,
  className = "",
  "aria-label": ariaLabel = "Pagination",
}: PaginationProps) {
  const items = usePagination({
    totalPages,
    currentPage,
    siblingCount,
    boundaryCount,
  });
  const s = sizeStyles[size];

  if (totalPages <= 1) return null;

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const baseBtn =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors " +
    "border border-transparent select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 " +
    "disabled:pointer-events-none disabled:opacity-40";

  const idleBtn =
    "text-neutral-600  hover:bg-neutral-100 hover:text-neutral-900 " +
    "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

  const activeBtn =
    "!bg-primary !text-white shadow-sm " +
    "dark:bg-neutral-100 dark:text-neutral-900";

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex w-full items-center justify-between gap-2 sm:justify-center ${className}`}
    >
      {/* Prev button — always visible */}
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={isFirst}
        aria-label="Go to previous page"
        className={`${baseBtn} ${idleBtn} ${s.btn} flex-shrink-0`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {!compact && <span className="ml-1 hidden sm:inline">Prev</span>}
      </button>

      {/* Mobile: compact "Page X of Y" indicator */}
      <span
        className={`flex-shrink-0 text-neutral-600 dark:text-neutral-400 sm:hidden ${s.text}`}
      >
        Page{" "}
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {totalPages}
        </span>
      </span>

      {/* Desktop/tablet: full numbered list */}
      <ul className={`hidden items-center sm:flex ${s.gap}`}>
        {items.map((item, idx) =>
          item === DOTS ? (
            <li key={`dots-${idx}`} aria-hidden="true">
              <span
                className={`inline-flex items-center justify-center text-neutral-400 ${s.btn}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => goTo(item)}
                aria-current={item === currentPage ? "page" : undefined}
                aria-label={`Go to page ${item}`}
                className={`${baseBtn} ${s.btn} ${item === currentPage ? activeBtn : idleBtn}`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      {/* Next button — always visible */}
      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={isLast}
        aria-label="Go to next page"
        className={`${baseBtn} ${idleBtn} ${s.btn} flex-shrink-0`}
      >
        {!compact && <span className="mr-1 hidden sm:inline">Next</span>}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
