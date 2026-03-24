"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import AvatarDisplay from "@/components/AvatarDisplay";

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuthContext();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[var(--color-bg-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: Logo + Games */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-felt-400"
          >
            Poker
          </Link>
          <Link
            href="/games"
            className="text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
          >
            Games
          </Link>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-5 w-20 animate-pulse rounded bg-white/5" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              >
                <AvatarDisplay
                  avatarUrl={profile?.avatar_url}
                  displayName={profile?.display_name ?? user.email}
                  size="sm"
                />
                <span className="hidden sm:inline">
                  {profile?.display_name ?? user.email}
                </span>
              </Link>
              <button
                onClick={signOut}
                className="text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-chip-red"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
              >
                Log In
              </Link>
              <Link href="/signup" className="btn-primary py-1.5 px-4 text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
