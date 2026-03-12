import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features — TodoMate",
  description:
    "Discover everything TodoMate offers: task management, smart filtering, secure auth, and a clean responsive UI.",
};

// ─── Comparison table rows ─────────────────────────────────────────────────────
const comparisonRows = [
  { feature: "Unlimited tasks", basic: true, todomate: true },
  { feature: "JWT authentication", basic: false, todomate: true },
  { feature: "Per-user data isolation", basic: false, todomate: true },
  { feature: "Dark mode", basic: false, todomate: true },
  { feature: "Filter & search tasks", basic: false, todomate: true },
  { feature: "Sort tasks (newest/oldest/A-Z)", basic: false, todomate: true },
];

function CheckIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg className="h-5 w-5 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Feature sections data ────────────────────────────────────────────────────
const detailedFeatures = [
  {
    title: "Task Management",
    description: "Everything you need to manage your to-do list without the clutter. Create tasks with titles and optional descriptions, mark them complete, edit them, or delete them — all with instant UI feedback.",
    bullets: ["Create tasks with title + description", "One-click complete toggle", "Edit tasks inline via modal", "Permanent delete with confirmation"],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    accent: "from-indigo-500 to-violet-600",
    visual: (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2.5 shadow-sm">
        {[
          { title: "Design system review", done: true },
          { title: "Write API docs", done: false },
          { title: "Fix auth bug", done: false },
        ].map((task, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2">
            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${task.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}>
              {task.done && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`text-sm flex-1 ${task.done ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>{task.title}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Smart Filtering",
    description: "Find exactly what you need in seconds. Filter tasks by status, search by title or description text, and sort by date or alphabetically. Your entire backlog, instantly organised.",
    bullets: ["Filter: All / Pending / Completed", "Full-text search across title & description", "Sort: Newest first, Oldest first, A to Z", "Live results count"],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    accent: "from-cyan-500 to-teal-500",
    visual: (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            Search tasks...
          </div>
        </div>
        <div className="flex gap-1.5">
          {["All", "Pending", "Completed"].map((f, i) => (
            <span key={f} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${i === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>{f}</span>
          ))}
        </div>
        <p className="text-xs text-slate-400">Showing 3 of 7 tasks</p>
      </div>
    ),
  },
  {
    title: "Secure Authentication",
    description: "Your account and your data are always protected. JWT tokens are issued on login, verified on every request, and expire after 7 days. Your tasks are completely isolated from other users.",
    bullets: ["Email + password registration", "Secure JWT token (7-day expiry)", "Per-user data isolation", "Auto-redirect on token expiry"],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: "from-violet-500 to-indigo-600",
    visual: (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Authenticated</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">JWT valid · 7d expiry</p>
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
          Authorization: Bearer eyJhbG...
        </div>
      </div>
    ),
  },
  {
    title: "Clean, Responsive UI",
    description: "Designed for humans. TodoMate works beautifully on every screen size — from a small phone to a wide desktop monitor. Dark mode is a first-class citizen, not an afterthought.",
    bullets: ["Mobile-first responsive design", "Dark mode (persisted in localStorage)", "Animated skeletons while loading", "Accessible — keyboard navigable"],
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    accent: "from-teal-500 to-cyan-500",
    visual: (
      <div className="flex gap-3 items-end">
        {[64, 100, 80].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1.5">
            {i === 1 && <div className="text-center text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Desktop</div>}
            {i === 0 && <div className="text-center text-[10px] text-slate-500 font-medium">Mobile</div>}
            {i === 2 && <div className="text-center text-[10px] text-slate-500 font-medium">Tablet</div>}
            <div className={`rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800`} style={{ height: `${h}px` }} />
          </div>
        ))}
      </div>
    ),
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Everything you need to stay on{" "}
            <span className="text-indigo-400">top of your work</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            TodoMate is designed around five core operations done exceptionally well. No bloat, no complexity — just the tools that matter.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-600 hover:border-slate-400 px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Detailed feature sections */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-24">
          {detailedFeatures.map((feature, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}
            >
              <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-md mb-5`}>
                  {feature.icon}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                  {feature.title}
                </h2>
                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                  {feature.description}
                </p>
                <ul className="space-y-2.5">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:col-start-1" : ""}>
                {feature.visual}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              TodoMate vs. a basic todo app
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              See why TodoMate is in a different league.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Feature</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Basic App</th>
                  <th className="text-center px-5 py-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">TodoMate</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className={i < comparisonRows.length - 1 ? "border-b border-slate-100 dark:border-slate-700/50" : ""}>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center"><CheckIcon checked={row.basic} /></td>
                    <td className="px-5 py-3.5 text-center"><CheckIcon checked={row.todomate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Performance stats */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Built for performance
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: "< 500ms", label: "API response time", icon: "⚡" },
              { stat: "Zero", label: "Planned downtime", icon: "99.9%" },
              { stat: "Neon", label: "Serverless PostgreSQL DB", icon: "🌊" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.stat}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to try it?</h2>
          <p className="mt-3 text-indigo-100">Free forever. No credit card. Takes 30 seconds.</p>
          <Link
            href="/sign-up"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20 transition-all"
          >
            Create free account
          </Link>
        </div>
      </section>
    </div>
  );
}
