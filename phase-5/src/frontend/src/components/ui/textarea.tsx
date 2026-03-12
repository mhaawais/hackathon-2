"use client";

import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Styled textarea with optional label and error state.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className = "", id, ...props }, ref) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            "w-full rounded-xl border bg-white dark:bg-slate-800/50",
            "px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "transition-all duration-150 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
            error
              ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/50"
              : "border-slate-200 dark:border-slate-700",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
