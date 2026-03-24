"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setLoading(true);

    const supabase = createBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/games");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md card-surface">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--color-text-primary)]">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
              placeholder="Your poker name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none transition focus:border-felt-500 focus:ring-1 focus:ring-felt-500"
              placeholder="Repeat your password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-chip-red/10 px-4 py-2 text-sm text-chip-red">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-felt-400 hover:text-felt-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
