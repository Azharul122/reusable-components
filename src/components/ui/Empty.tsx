"use client";

import { type ReactNode } from "react";
import { Inbox, SearchX, AlertTriangle, type LucideIcon } from "lucide-react";

type EmptyStateVariant = "default" | "search" | "error";
type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface EmptyStateProps {
  /** Custom icon/illustration. Overrides the variant's default icon. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Changes the default icon + accent color. Default "default" */
  variant?: EmptyStateVariant;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  size?: EmptyStateSize;
  className?: string;
}

const variantIcon: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  search: SearchX,
  error: AlertTriangle,
};

const variantIconStyles: Record<EmptyStateVariant, string> = {
  default: "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500",
  search: "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500",
  error: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
};

const sizeStyles: Record<EmptyStateSize, { wrap: string; icon: string; iconBox: string; title: string; desc: string }> = {
  sm: { wrap: "py-8 px-4", icon: "h-5 w-5", iconBox: "h-10 w-10", title: "text-sm", desc: "text-xs" },
  md: { wrap: "py-12 px-6", icon: "h-6 w-6", iconBox: "h-12 w-12", title: "text-base", desc: "text-sm" },
  lg: { wrap: "py-16 px-8", icon: "h-8 w-8", iconBox: "h-16 w-16", title: "text-lg", desc: "text-base" },
};

const baseBtn =
  "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100";
const primaryBtn = "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200";
const secondaryBtn =
  "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";

function ActionButton({ action, variant }: { action: EmptyStateAction; variant: "primary" | "secondary" }) {
  const classes = `${baseBtn} ${variant === "primary" ? primaryBtn : secondaryBtn}`;
  if (action.href) {
    return (
      <a href={action.href} className={classes}>
        {action.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {action.label}
    </button>
  );
}

/**
 * Reusable empty state for lists, tables, search results, or error boundaries.
 *
 * @example
 * <EmptyState
 *   title="No projects yet"
 *   description="Create your first project to get started."
 *   primaryAction={{ label: "New project", onClick: () => setModalOpen(true) }}
 * />
 *
 * @example
 * <EmptyState
 *   variant="search"
 *   title="No results found"
 *   description={`Nothing matched "${query}". Try a different search.`}
 *   secondaryAction={{ label: "Clear search", onClick: () => setQuery("") }}
 * />
 *
 * @example
 * <EmptyState
 *   variant="error"
 *   title="Couldn't load data"
 *   description="Something went wrong on our end. Please try again."
 *   primaryAction={{ label: "Retry", onClick: refetch }}
 * />
 */
export default function EmptyState({
  icon,
  title,
  description,
  variant = "default",
  primaryAction,
  secondaryAction,
  size = "md",
  className = "",
}: EmptyStateProps) {
  const s = sizeStyles[size];
  const Icon = variantIcon[variant];

  return (
    <div className={`flex w-full flex-col items-center justify-center text-center ${s.wrap} ${className}`}>
      <div className={`mb-4 flex items-center justify-center rounded-full ${s.iconBox} ${variantIconStyles[variant]}`}>
        {icon ?? <Icon className={s.icon} aria-hidden="true" />}
      </div>

      <h3 className={`font-semibold text-neutral-900 dark:text-neutral-100 ${s.title}`}>{title}</h3>

      {description && (
        <p className={`mt-1.5 max-w-sm text-neutral-500 dark:text-neutral-400 ${s.desc}`}>{description}</p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
        </div>
      )}
    </div>
  );
}