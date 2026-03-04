import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "TodoMate — Plan. Focus. Finish.",
  description:
    "TodoMate helps you plan, track, and complete your tasks — simply, beautifully, and securely.",
  openGraph: {
    title: "TodoMate — Plan. Focus. Finish.",
    description: "Plan your tasks, stay focused, and get things done.",
    type: "website",
  },
};

// ─── Feature cards data ───────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Smart Task Management",
    description: "Organize tasks with titles, descriptions, and completion tracking. Filter, sort, and search instantly.",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    accent: "text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure by Default",
    description: "JWT authentication and per-user data isolation. Your tasks are yours alone — no sharing, no leaks.",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    accent: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant Updates",
    description: "Real-time UI updates on every action. No page reloads, no waiting. Actions feel instant.",
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Works Everywhere",
    description: "Fully responsive design. Use TodoMate on phone, tablet, or desktop — it always looks great.",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    accent: "text-teal-600 dark:text-teal-400",
  },
];

// ─── How It Works steps ───────────────────────────────────────────────────────
const steps = [
  {
    num: "1",
    title: "Sign up in seconds",
    description: "Create your free account with just an email and password. No credit card required.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "Add your tasks",
    description: "Create tasks with titles and optional descriptions. Organize your entire backlog in minutes.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Get things done",
    description: "Check off tasks as you complete them. Watch your pending list shrink and your confidence grow.",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    quote: "TodoMate finally helped me stop juggling mental lists. I actually finish what I start now.",
    name: "Priya Nair",
    role: "Product Designer",
    initials: "PN",
    color: "bg-indigo-500",
  },
  {
    quote: "The security-first approach is what sold me. My tasks are private and the JWT auth is rock solid.",
    name: "Marcus Chen",
    role: "Backend Engineer",
    initials: "MC",
    color: "bg-violet-500",
  },
  {
    quote: "I tried every todo app. TodoMate is the only one that gets out of my way and lets me focus.",
    name: "Sofia Rivera",
    role: "Freelance Writer",
    initials: "SR",
    color: "bg-teal-500",
  },
];

// ─── Pricing plans ────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Everything you need to get started.",
    features: ["Unlimited tasks", "Add, edit, delete, complete", "Filter & search", "Dark mode", "Mobile friendly"],
    cta: "Start for Free",
    href: "/sign-up",
    popular: false,
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    description: "For power users who want more.",
    features: ["Everything in Free", "Priority support", "Early access to features", "Advanced analytics", "Export tasks"],
    cta: "Upgrade to Pro",
    href: "/sign-up",
    popular: true,
    variant: "primary" as const,
  },
  {
    name: "Team",
    price: "$29",
    period: "/mo",
    description: "Scale productivity across your team.",
    features: ["Everything in Pro", "Team workspaces", "Admin dashboard", "SSO / SAML", "Dedicated support"],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    variant: "secondary" as const,
  },
];

// ─── Stars component ──────────────────────────────────────────────────────────
function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text column */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-white/90">Free forever — no credit card needed</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Organize your work.{" "}
                <span className="text-cyan-300">Reclaim your focus.</span>
              </h1>
              <p className="mt-6 text-lg text-indigo-100 leading-relaxed max-w-lg">
                TodoMate helps you plan, track, and complete your tasks — simply and beautifully. Built for people who want to get things done.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20 transition-all"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/sign-in"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
                >
                  Sign In
                </Link>
              </div>
              <p className="mt-4 text-xs text-indigo-200">
                Join thousands of focused people. No credit card required.
              </p>
            </div>

            {/* App mockup */}
            <div className="relative hidden lg:block">
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-4 shadow-2xl shadow-indigo-900/40">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <div className="flex-1 mx-3 h-5 rounded bg-white/10 text-white/40 text-[10px] flex items-center px-2">
                    todomate.app/dashboard
                  </div>
                </div>
                {/* Fake task list */}
                <div className="space-y-2.5">
                  {[
                    { title: "Review Q1 project specs", done: true },
                    { title: "Team standup at 10 AM", done: true },
                    { title: "Write API documentation", done: false },
                    { title: "Code review for PR #42", done: false },
                    { title: "Update stakeholder report", done: false },
                  ].map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/10 px-3 py-2.5"
                    >
                      <div
                        className={[
                          "h-4 w-4 rounded-md border-2 flex items-center justify-center shrink-0",
                          task.done
                            ? "bg-emerald-400 border-emerald-400"
                            : "border-white/40",
                        ].join(" ")}
                      >
                        {task.done && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={[
                          "text-xs font-medium flex-1",
                          task.done ? "line-through text-white/40" : "text-white/90",
                        ].join(" ")}
                      >
                        {task.title}
                      </span>
                      {!task.done && (
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-2 py-0.5 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Stats row */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Total", value: "5", color: "text-indigo-200" },
                    { label: "Pending", value: "3", color: "text-amber-300" },
                    { label: "Done", value: "2", color: "text-emerald-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-white/10 border border-white/10 p-2 text-center">
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-white/50">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              TodoMate is fast, focused, and secure. No bloat, no distractions — just a clean todo experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} ${feature.accent} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Up and running in 60 seconds
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Three simple steps between you and a clear head.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Loved by focused people
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Here&apos;s what our users say.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4"
              >
                <Stars />
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.color} text-white text-xs font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
              Start free. Upgrade when you&apos;re ready.{" "}
              <span className="text-xs text-slate-400">(Billing not implemented — demo pricing)</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={[
                  "relative rounded-2xl border p-6 flex flex-col",
                  plan.popular
                    ? "border-indigo-500 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 shadow-xl shadow-indigo-200/60 dark:shadow-indigo-900/40"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                ].join(" ")}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={[
                    "block text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                      : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
                  ].join(" ")}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA banner ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to get organized?
          </h2>
          <p className="mt-4 text-indigo-100 text-base">
            Join thousands of focused people. Start for free today — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20 transition-all"
            >
              Start for free today
            </Link>
            <Link
              href="/features"
              className="rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              See all features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
