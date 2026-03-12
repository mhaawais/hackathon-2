"use client";

import React, { useState } from "react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Everything you need to get started.",
    features: [
      "Unlimited tasks",
      "Add, edit, delete, complete",
      "Filter & search",
      "Dark mode",
      "Mobile friendly",
      "Community support",
    ],
    cta: "Start with Free",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: 9,
    annualPrice: 7,
    description: "For power users who want more.",
    features: [
      "Everything in Free",
      "Priority email support",
      "Early access to new features",
      "Advanced productivity analytics",
      "Export tasks to CSV / JSON",
      "Keyboard shortcuts",
    ],
    cta: "Upgrade to Pro",
    href: "/sign-up",
    popular: true,
  },
  {
    name: "Team",
    monthlyPrice: 29,
    annualPrice: 23,
    description: "Scale productivity across your team.",
    features: [
      "Everything in Pro",
      "Team workspaces (coming soon)",
      "Admin dashboard",
      "Shared task boards",
      "SAML / SSO",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes — the Free plan is free forever. No time limit, no credit card required. Upgrade only when you need more.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no lock-in. Cancel your subscription at any time with one click.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Every request is authenticated with JWT tokens. Your data is completely isolated from other users — no one else can see your tasks.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit/debit cards and PayPal. (Billing is not implemented in this demo — pricing shown for illustration.)",
  },
  {
    q: "Can I upgrade or downgrade later?",
    a: "Yes, seamlessly. You can change plans at any time, and changes take effect immediately with pro-rated billing.",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
            Start free. No credit card required. Upgrade when you&apos;re ready.{" "}
            <span className="text-xs text-slate-400 dark:text-slate-500">(Billing not implemented — demo pricing)</span>
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                !annual
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-2",
                annual
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Annual
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.name}
                  className={[
                    "relative rounded-2xl border flex flex-col p-6",
                    plan.popular
                      ? "border-indigo-500 bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/50 dark:to-slate-900 shadow-xl shadow-indigo-200/60 dark:shadow-indigo-900/40"
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

                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        ${price}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">/mo</span>
                      {annual && price > 0 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                          billed annually
                        </span>
                      )}
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
                      "block text-center rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      plan.popular
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                        : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
                    ].join(" ")}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-2">
            <Stars />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rated 5 stars by our users &mdash; built with care during Hackathon II
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white pr-4">
                    {faq.q}
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-violet-700">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Start free today
          </h2>
          <p className="mt-3 text-indigo-100">No credit card. No commitment. Cancel anytime.</p>
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
