import React from "react";

interface TodoStatsProps {
  total: number;
  pending: number;
  completed: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  bg: string;
}

function StatCard({ label, value, icon, accent, bg }: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <span className={`${accent}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * Three-column stats row showing total, pending, and completed todo counts.
 */
export function TodoStats({ total, pending, completed }: TodoStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard
        label="Total Tasks"
        value={total}
        accent="text-indigo-600 dark:text-indigo-400"
        bg="bg-indigo-50 dark:bg-indigo-900/30"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <StatCard
        label="Pending"
        value={pending}
        accent="text-amber-600 dark:text-amber-400"
        bg="bg-amber-50 dark:bg-amber-900/30"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Completed"
        value={completed}
        accent="text-green-600 dark:text-green-400"
        bg="bg-green-50 dark:bg-green-900/30"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}
