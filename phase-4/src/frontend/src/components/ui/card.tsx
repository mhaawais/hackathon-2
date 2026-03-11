import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "bordered" | "elevated";
}

/**
 * Base card wrapper with variant support.
 */
export function Card({ children, className, variant = "default" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-slate-800",
        variant === "default" &&
          "border border-slate-200 dark:border-slate-700 shadow-sm",
        variant === "bordered" && "border-2 border-indigo-200 dark:border-indigo-800",
        variant === "elevated" && "shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60",
        className
      )}
    >
      {children}
    </div>
  );
}
