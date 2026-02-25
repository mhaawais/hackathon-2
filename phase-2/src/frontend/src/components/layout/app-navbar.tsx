"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { Dropdown } from "@/components/ui/dropdown";
import { getStoredTheme, toggleTheme, type Theme } from "@/lib/theme";

interface AppNavbarProps {
  userEmail?: string | null;
  userName?: string | null;
  onSignOut: () => void;
  signingOut?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
}

/**
 * Top navigation bar for the authenticated app shell.
 * Left: Logo. Center (desktop): search input. Right: dark mode + user dropdown.
 * Mobile: hamburger → slide-down with nav links + user info + sign out.
 */
export function AppNavbar({
  userEmail,
  userName,
  onSignOut,
  signingOut = false,
  search = "",
  onSearchChange,
}: AppNavbarProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function handleThemeToggle() {
    const next = toggleTheme();
    setTheme(next);
  }

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : userEmail
    ? userEmail[0].toUpperCase()
    : "?";

  const displayName = userName ?? userEmail ?? "Account";

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          {/* Logo */}
          <Link href="/dashboard" className="shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Search — desktop center */}
          {onSearchChange && (
            <div className="hidden sm:flex flex-1 max-w-sm mx-auto relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          <div className="flex-1 sm:flex-none" />

          {/* Dark mode toggle */}
          <button
            onClick={handleThemeToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User dropdown — desktop */}
          <div className="hidden sm:block">
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              }
              items={[
                {
                  label: "Settings",
                  icon: (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  onClick: () => { window.location.href = "/dashboard/settings"; },
                },
                {
                  label: signingOut ? "Signing out..." : "Sign Out",
                  icon: (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  ),
                  onClick: onSignOut,
                  danger: true,
                },
              ]}
            />
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {/* Mobile search */}
          {onSearchChange && (
            <div className="relative mb-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              {userName && <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userName}</p>}
              {userEmail && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>}
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>

          <button
            onClick={() => { setMobileOpen(false); onSignOut(); }}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
          >
            <svg className="h-4 w-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      )}
    </nav>
  );
}
