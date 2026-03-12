"use client";

import React, { useEffect, useState } from "react";

type StatusFilter = "all" | "pending" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";
type SortByFilter = "created_at" | "due_date" | "priority" | "title";
type SortDir = "asc" | "desc";

export interface FilterState {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
  sortBy: SortByFilter;
  sortDir: SortDir;
}

interface TodoFilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

/**
 * Filter bar with status chips, priority dropdown, sort controls, and debounced search.
 */
export function TodoFilterBar({ filters, onChange }: TodoFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search: 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function update(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status chips */}
        <div className="flex items-center gap-1.5">
          {(["all", "pending", "completed"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => update({ status: s })}
              className={[
                "rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all",
                filters.status === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
              ].join(" ")}
              aria-pressed={filters.status === s}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <select
          value={filters.priority}
          onChange={(e) => update({ priority: e.target.value as PriorityFilter })}
          aria-label="Filter by priority"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as SortByFilter })}
            aria-label="Sort by"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          >
            <option value="created_at">Newest</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">A to Z</option>
          </select>
          <button
            onClick={() => update({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
            aria-label={`Sort ${filters.sortDir === "desc" ? "ascending" : "descending"}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {filters.sortDir === "desc" ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { StatusFilter, PriorityFilter, SortByFilter, SortDir };
