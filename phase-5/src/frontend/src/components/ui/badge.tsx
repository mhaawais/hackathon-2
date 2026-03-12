import React from "react";

type BadgeVariant = "pending" | "completed";

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50",
};

const labels: Record<BadgeVariant, string> = {
  pending: "Pending",
  completed: "Completed",
};

/**
 * Status badge for todo items. Displays pending or completed state.
 */
export function Badge({ variant, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          variant === "completed" ? "bg-green-500" : "bg-amber-500"
        }`}
      />
      {labels[variant]}
    </span>
  );
}
