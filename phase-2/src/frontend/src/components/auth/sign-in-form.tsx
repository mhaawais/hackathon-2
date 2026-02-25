"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Sign-in form with split-panel layout.
 * Desktop: left brand panel + right form panel.
 * Mobile: single-column form with logo at top.
 * On success redirects to /dashboard.
 */
export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:flex-col lg:justify-between lg:w-[45%] xl:w-[40%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-12 right-0 h-48 w-48 rounded-full bg-violet-400/20 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 border border-white/30">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">TodoMate</span>
        </div>

        {/* Center content */}
        <div className="relative flex-1 flex flex-col justify-center py-12">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Welcome back.
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed mb-8">
            Your tasks are waiting. Sign in to pick up right where you left off.
          </p>
          <ul className="space-y-3.5">
            {[
              "Free forever",
              "Your tasks, secured with JWT",
              "Works on any device",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 shrink-0">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-indigo-100 font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-xs text-indigo-300 font-medium tracking-widest uppercase">
          Plan. Focus. Finish.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 mb-3">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">TodoMate</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase font-medium">Plan. Focus. Finish.</span>
          </div>

          {/* Form card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-indigo-100/30 dark:shadow-slate-900/50 p-8">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Sign in to your account to continue.
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 px-3.5 py-3" role="alert">
                <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <div>
                <Input
                  label="Password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                />
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => alert("Password reset coming soon!")}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                Sign In
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
