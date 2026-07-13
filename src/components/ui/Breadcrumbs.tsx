"use client";

import { Fragment, type ReactNode } from "react";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Optional icon rendered before the label (e.g. a folder or file icon) */
  icon?: ReactNode;
}

type BreadcrumbSize = "sm" | "md" | "lg";

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /**
   * Component used to render links. Defaults to a plain <a>.
   * Pass Next.js `Link` for client-side navigation:
   *   <Breadcrumbs items={items} linkAs={Link} />
   */
  linkAs?: React.ElementType;
  /** Show a leading Home icon that links to `homeHref`. Default true */
  showHomeIcon?: boolean;
  /** href for the leading home icon. Default "/" */
  homeHref?: string;
  /** Max number of items to show before collapsing the middle into "…". Default 4 */
  maxItems?: number;
  size?: BreadcrumbSize;
  className?: string;
  "aria-label"?: string;
}

const sizeStyles: Record<BreadcrumbSize, { text: string; icon: string; gap: string; px: string }> = {
  sm: { text: "text-xs", icon: "h-3.5 w-3.5", gap: "gap-1", px: "px-1.5 py-1" },
  md: { text: "text-sm", icon: "h-4 w-4", gap: "gap-1.5", px: "px-2 py-1" },
  lg: { text: "text-base", icon: "h-4.5 w-4.5", gap: "gap-2", px: "px-2.5 py-1.5" },
};

function Separator({ iconClassName }: { iconClassName: string }) {
  return (
    <ChevronRight
      className={`flex-shrink-0 text-neutral-300 dark:text-neutral-600 ${iconClassName}`}
      aria-hidden="true"
    />
  );
}

/**
 * Fully reusable, responsive breadcrumb trail.
 *
 * - Framework agnostic: pass `linkAs={NextLink}` for Next.js, omit for plain <a>.
 * - Responsive: automatically collapses long trails into "Home / … / Parent / Current"
 *   so it never wraps or overflows on narrow screens.
 * - Accessible: <nav aria-label="Breadcrumb">, ordered list, aria-current="page" on
 *   the active crumb, visible focus rings.
 * - Truncates long labels with an ellipsis instead of breaking the layout.
 *
 * @example
 * <Breadcrumbs
 *   items={[
 *     { label: "Settings", href: "/settings" },
 *     { label: "Team", href: "/settings/team" },
 *     { label: "Members" }, // current page — no href
 *   ]}
 * />
 */
export default function Breadcrumbs({
  items,
  linkAs,
  showHomeIcon = true,
  homeHref = "/",
  maxItems = 4,
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Breadcrumb",
}: BreadcrumbsProps) {
  const LinkComponent: React.ElementType = linkAs ?? "a";
  const s = sizeStyles[size];

  const shouldCollapse = items.length > maxItems;
  const firstItem = items[0];
  const lastTwo = items.slice(-2);
  const hiddenCount = items.length - 1 - lastTwo.length;

  const linkClasses =
    "inline-flex items-center rounded-md font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 " +
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-neutral-900 " +
    "dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800";

  const renderCrumbContent = (item: BreadcrumbItem) => (
    <>
      {item.icon && <span className={`mr-1 flex-shrink-0 ${s.icon}`}>{item.icon}</span>}
      <span className="truncate">{item.label}</span>
    </>
  );

  const renderItem = (item: BreadcrumbItem, isLast: boolean) => {
    if (item.href && !isLast) {
      return (
        <LinkComponent
          href={item.href}
          className={`${linkClasses} ${s.px} ${s.text} max-w-[10rem] sm:max-w-[16rem]`}
        >
          {renderCrumbContent(item)}
        </LinkComponent>
      );
    }
    return (
      <span
        aria-current={isLast ? "page" : undefined}
        className={`inline-flex max-w-[10rem] items-center rounded-md font-semibold text-neutral-900 dark:text-neutral-100 ${s.px} ${s.text} sm:max-w-[20rem]`}
      >
        {renderCrumbContent(item)}
      </span>
    );
  };

  const visibleItems = shouldCollapse ? lastTwo : items;

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className={`flex flex-wrap items-center ${s.gap}`}>
        {showHomeIcon && (
          <>
            <li>
              <LinkComponent
                href={homeHref}
                aria-label="Home"
                className={`${linkClasses} ${s.px}`}
              >
                <Home className={s.icon} aria-hidden="true" />
              </LinkComponent>
            </li>
            {items.length > 0 && (
              <li aria-hidden="true">
                <Separator iconClassName={s.icon} />
              </li>
            )}
          </>
        )}

        {shouldCollapse && (
          <>
            <li>{renderItem(firstItem, false)}</li>
            <li aria-hidden="true">
              <Separator iconClassName={s.icon} />
            </li>
            <li>
              <span
                className={`inline-flex items-center rounded-md text-neutral-400 dark:text-neutral-500 ${s.px} ${s.text}`}
                title={`${hiddenCount} more`}
              >
                <MoreHorizontal className={s.icon} aria-hidden="true" />
              </span>
            </li>
            <li aria-hidden="true">
              <Separator iconClassName={s.icon} />
            </li>
          </>
        )}

        {visibleItems.map((item, idx) => {
          const isLast = idx === visibleItems.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li>{renderItem(item, isLast)}</li>
              {!isLast && (
                <li aria-hidden="true">
                  <Separator iconClassName={s.icon} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}