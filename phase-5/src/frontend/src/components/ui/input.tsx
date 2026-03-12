"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * Styled input with optional label, error message, and icon support.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, icon, rightElement, className = "", id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-xl border bg-white dark:bg-slate-800/50",
              "text-sm text-slate-900 dark:text-slate-100",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
              error
                ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400/50"
                : "border-slate-200 dark:border-slate-700",
              icon ? "pl-10" : "pl-3.5",
              rightElement ? "pr-10" : "pr-3.5",
              "py-2.5",
              className,
            ].join(" ")}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);
