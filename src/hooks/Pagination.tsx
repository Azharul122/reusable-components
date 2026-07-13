"use client";

import { useMemo } from "react";

export const DOTS = "dots" as const;
export type PaginationItem = number | typeof DOTS;

interface UsePaginationProps {
  totalPages: number;
  currentPage: number;
  /** How many page numbers to show on each side of the current page */
  siblingCount?: number;
  /** How many page numbers to always show at the start/end */
  boundaryCount?: number;
}

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
}

/**
 * Computes the list of page numbers + ellipses to render for a pagination bar.
 * Framework-agnostic — no Next.js or React Router dependency.
 *
 * Example output for currentPage=5, totalPages=10, siblingCount=1:
 * [1, 'dots', 4, 5, 6, 'dots', 10]
 */
export function usePagination({
  totalPages,
  currentPage,
  siblingCount = 1,
  boundaryCount = 1,
}: UsePaginationProps): PaginationItem[] {
  return useMemo(() => {
    // Total numbers we'd show if there were no truncation:
    // boundary*2 + sibling*2 + current + 2 dots
    const totalPageNumbers = boundaryCount * 2 + siblingCount * 2 + 3;

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, boundaryCount + 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPages - boundaryCount
    );

    const showLeftDots = leftSiblingIndex > boundaryCount + 2;
    const showRightDots = rightSiblingIndex < totalPages - boundaryCount - 1;

    const startPages = range(1, boundaryCount);
    const endPages = range(totalPages - boundaryCount + 1, totalPages);

    if (!showLeftDots && showRightDots) {
      const leftItemCount = boundaryCount + siblingCount * 2 + 2;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, ...endPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = boundaryCount + siblingCount * 2 + 2;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [...startPages, DOTS, ...rightRange];
    }

    // showLeftDots && showRightDots
    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [...startPages, DOTS, ...middleRange, DOTS, ...endPages];
  }, [totalPages, currentPage, siblingCount, boundaryCount]);
}