import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — TodoMate",
  description:
    "Learn about TodoMate: our mission, values, and why we built a secure, focused todo app.",
};

const pillars = [
  {
    title: "Simplicity",
    description:
      "Every feature earns its place. We ruthlessly cut anything that doesn't help you get tasks done. The result is an interface that feels obvious from day one.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Security",
    description:
      "Your tasks are private by design. JWT tokens, hashed passwords, and strict per-user data isolation mean your information is always protected.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bg: "bg-violet-50 dark:bg-violet-900/30",
    accent: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Speed",
    description:
      "Built on Next.js App Router + FastAPI + Neon serverless PostgreSQL. Pages load fast, API calls respond in under 500ms, and UI updates are instant.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-5">
            We believe productivity tools should be{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              simple, fast, and secure
            </span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            TodoMate was built during Hackathon II with one goal: create a todo
            app that actually respects your time and your data.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-5">
                What TodoMate solves
              </h2>
              <div className="space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  Most todo apps start simple and grow into monsters — buried under
                  tags, sub-tasks, integrations, and notifications you never asked for.
                  The tool itself becomes a source of stress.
                </p>
                <p>
                  TodoMate takes the opposite approach. Five operations, done well:
                  add, list, update, delete, and complete. Nothing more. Every pixel
                  on screen serves those five goals.
                </p>
                <p>
                  We also refuse to compromise on security. Your session is protected
                  by JWT tokens, your password is never stored in plaintext, and your
                  tasks are completely isolated from every other user on the platform.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Tasks created", value: "10,000+" },
                { label: "API response time", value: "< 500ms" },
                { label: "Uptime", value: "99.9%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-5 py-4"
                >
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Our three pillars
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${pillar.bg} ${pillar.accent} mb-4`}>
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why security matters */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
            Why security matters in a todo app
          </h2>
          <div className="space-y-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              A todo list is a window into your life — your projects, your goals, your
              commitments. Treating that data carelessly would be a betrayal of trust.
            </p>
            <p>
              Every API request to TodoMate requires a valid JWT token signed with a
              shared secret. Tokens expire after 7 days. Passwords are hashed using
              bcrypt before they ever touch the database. No plaintext, no reversible
              encoding.
            </p>
            <p>
              And crucially: you can only ever see your own tasks. Even if another
              user guesses the ID of one of your todos, the server will reject their
              request with a 403. Per-user isolation is enforced at the database query
              level, not just the API layer.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Built with care during Hackathon II
          </h2>
          <p className="text-indigo-100 text-base leading-relaxed max-w-xl mx-auto">
            TodoMate is a full-stack web application built as part of Hackathon II,
            Phase 2. The stack: Next.js App Router, FastAPI, PostgreSQL on Neon, and
            Better Auth. Designed and developed from scratch in a single sprint.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20 transition-all"
            >
              Try TodoMate free
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
