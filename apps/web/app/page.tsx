import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo / Title */}
        <div className="mb-12">
          <h1 className="mb-3 text-6xl font-bold tracking-tight">
            <span className="text-felt-400">Poker</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Texas Hold&apos;em. No limit. No mercy.
          </p>
        </div>

        {/* Suit icons */}
        <div className="mb-12 flex items-center justify-center gap-4 text-3xl">
          <span className="text-suit-hearts">&#9829;</span>
          <span className="text-suit-diamonds">&#9830;</span>
          <span className="text-suit-clubs">&#9827;</span>
          <span className="text-suit-spades">&#9824;</span>
        </div>

        {/* Action buttons */}
        <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn-primary w-full sm:w-auto">
            Log In
          </Link>
          <Link href="/signup" className="btn-secondary w-full sm:w-auto">
            Sign Up
          </Link>
        </div>

        {/* Quick links */}
        <div className="card-surface mx-auto max-w-md">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Quick Links
          </h2>
          <nav className="flex flex-col gap-2">
            <Link
              href="/games"
              className="rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="font-medium">Browse Games</span>
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Find a table and start playing
              </span>
            </Link>
            <Link
              href="/games/create"
              className="rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="font-medium">Create Game</span>
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                Host your own table
              </span>
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="font-medium">Leaderboard</span>
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                See top players
              </span>
            </Link>
          </nav>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-[var(--color-text-secondary)]">
          Play responsibly. This is a game of skill and chance.
        </p>
      </div>
    </main>
  );
}
