"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { clearAuthCache } from "@/lib/api";
import { AppNavbar } from "@/components/layout/app-navbar";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { getStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

function ToggleSwitch({
  checked,
  onChange,
  id,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function SettingsInner() {
  const router = useRouter();
  const { showToast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  // Mock preference toggles (UI only, no backend)
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    authClient.getSession().then((session) => {
      setUserEmail(session?.data?.user?.email ?? null);
      setUserName(session?.data?.user?.name ?? null);
    });
    setTheme(getStoredTheme());
  }, []);

  function handleThemeToggle(dark: boolean) {
    const current = getStoredTheme();
    const next: Theme = dark ? "dark" : "light";
    if (current !== next) {
      const applied = toggleTheme();
      setTheme(applied);
      showToast(applied === "dark" ? "Dark mode enabled" : "Light mode enabled");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    clearAuthCache();
    await authClient.signOut();
    router.push("/sign-in");
  }

  const displayName = userName ?? userEmail ?? "Account";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppNavbar
        userEmail={userEmail}
        userName={userName}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your account and preferences.
            </p>
          </div>
        </div>

        {/* Profile section */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Profile
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold shrink-0">
                {(userName ?? userEmail ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                {userEmail && userName && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                type="email"
                value={userEmail ?? ""}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-3.5 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Email cannot be changed in this version.
              </p>
            </div>

            {userName && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Display name
                </label>
                <input
                  type="text"
                  value={userName}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-3.5 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </section>

        {/* Appearance section */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Appearance
            </h2>
          </div>
          <div className="px-5 py-4">
            <ToggleSwitch
              id="dark-mode"
              label="Dark mode"
              description="Switch between light and dark theme"
              checked={theme === "dark"}
              onChange={handleThemeToggle}
            />
          </div>
        </section>

        {/* Preferences section */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Preferences
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <ToggleSwitch
              id="email-notifs"
              label="Email notifications"
              description="Receive reminders and updates via email"
              checked={emailNotifs}
              onChange={(v) => {
                setEmailNotifs(v);
                showToast(v ? "Email notifications enabled" : "Email notifications disabled");
              }}
            />
            <ToggleSwitch
              id="weekly-digest"
              label="Weekly digest"
              description="Get a summary of your task activity every Monday"
              checked={weeklyDigest}
              onChange={(v) => {
                setWeeklyDigest(v);
                showToast(v ? "Weekly digest enabled" : "Weekly digest disabled");
              }}
            />
          </div>
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/10">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Note: Email notification preferences are UI-only in this version. No emails are sent.
            </p>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border-2 border-rose-200 dark:border-rose-800/50 bg-white dark:bg-slate-800 divide-y divide-rose-100 dark:divide-rose-800/30 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
              Danger Zone
            </h2>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Sign out</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sign out of your account on this device.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-xl border-2 border-rose-300 dark:border-rose-700 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
            >
              {signingOut && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsInner />
    </ToastProvider>
  );
}
