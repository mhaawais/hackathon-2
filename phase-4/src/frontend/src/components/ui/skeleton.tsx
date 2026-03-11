import React from "react";

interface SkeletonProps {
  className?: string;
}

/**
 * Animated skeleton loader block for content placeholders.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700",
        className,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

/**
 * Full todo card skeleton for loading states.
 */
export function TodoCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-20" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}
