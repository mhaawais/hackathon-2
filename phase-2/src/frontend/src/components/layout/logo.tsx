import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: { container: "h-7 w-7 rounded-lg", svg: "h-3.5 w-3.5", text: "text-sm" },
  md: { container: "h-9 w-9 rounded-xl", svg: "h-5 w-5", text: "text-base" },
  lg: { container: "h-14 w-14 rounded-2xl", svg: "h-7 w-7", text: "text-xl" },
};

/**
 * TodoMate logo mark — inline SVG checkmark/shield on indigo-violet gradient.
 */
export function Logo({ size = "md", className = "" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center ${s.container} bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40`}
      >
        <svg
          className={`${s.svg} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>
      <span className={`font-bold text-slate-900 dark:text-white tracking-tight ${s.text}`}>
        TodoMate
      </span>
    </div>
  );
}
